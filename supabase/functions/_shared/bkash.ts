export type BkashProvider = 'tokenized' | 'checkout';

export interface BkashConfig {
  baseUrl: string;
  provider: BkashProvider;
  username: string;
  password: string;
  appKey: string;
  appSecret: string;
  callbackUrl: string;
  storefrontUrl: string;
  currency: string;
  intent: string;
}

const getRequiredEnv = (key: string) => {
  const value = Deno.env.get(key)?.trim();
  if (!value) {
    throw new Error(`Missing required secret: ${key}`);
  }
  return value;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const buildUrl = (baseUrl: string, path: string) => `${trimTrailingSlash(baseUrl)}${path}`;

const endpointMap: Record<BkashProvider, { grant: string; create: string; execute: string; query: string }> = {
  tokenized: {
    grant: '/tokenized/checkout/token/grant',
    create: '/tokenized/checkout/create',
    execute: '/tokenized/checkout/execute',
    query: '/tokenized/checkout/payment/status'
  },
  checkout: {
    grant: '/checkout/token/grant',
    create: '/checkout/payment/create',
    execute: '/checkout/payment/execute',
    query: '/checkout/payment/query'
  }
};

const asObject = (value: unknown): Record<string, unknown> => {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
};

const tryParseJson = async (res: Response) => {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

const requestJson = async (url: string, init: RequestInit): Promise<Record<string, unknown>> => {
  const res = await fetch(url, init);
  const data = asObject(await tryParseJson(res));
  if (!res.ok) {
    const message =
      String(data.statusMessage || data.message || data.errorMessage || data.error || `HTTP ${res.status}`) ||
      `HTTP ${res.status}`;
    throw new Error(`bKash API error: ${message}`);
  }
  return data;
};

export const loadBkashConfig = (): BkashConfig => {
  const providerRaw = (Deno.env.get('BKASH_PROVIDER') || 'tokenized').toLowerCase();
  const provider: BkashProvider = providerRaw === 'checkout' ? 'checkout' : 'tokenized';

  const defaultBase =
    provider === 'checkout'
      ? 'https://checkout.sandbox.bka.sh/v1.2.0-beta'
      : 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';

  const baseUrl = trimTrailingSlash(Deno.env.get('BKASH_BASE_URL')?.trim() || defaultBase);

  return {
    baseUrl,
    provider,
    username: getRequiredEnv('BKASH_USERNAME'),
    password: getRequiredEnv('BKASH_PASSWORD'),
    appKey: getRequiredEnv('BKASH_APP_KEY'),
    appSecret: getRequiredEnv('BKASH_APP_SECRET'),
    callbackUrl: trimTrailingSlash(getRequiredEnv('BKASH_CALLBACK_URL')),
    storefrontUrl: trimTrailingSlash(getRequiredEnv('STORE_FRONTEND_URL')),
    currency: (Deno.env.get('BKASH_CURRENCY') || 'BDT').toUpperCase(),
    intent: (Deno.env.get('BKASH_INTENT') || 'sale').toLowerCase()
  };
};

export const isBkashSuccess = (payload: Record<string, unknown>) => {
  const statusCode = String(payload.statusCode || payload.status_code || '').toLowerCase();
  if (!statusCode) return false;
  return statusCode === '0000' || statusCode === 'success' || statusCode === 'successful';
};

export const bkashErrorMessage = (payload: Record<string, unknown>) =>
  String(payload.statusMessage || payload.status_message || payload.message || payload.errorMessage || 'Payment gateway error');

export const normalizeAmount = (amount: number) => Number(amount).toFixed(2);

export const appendQueryParam = (baseUrl: string, key: string, value: string) => {
  const url = new URL(baseUrl);
  url.searchParams.set(key, value);
  return url.toString();
};

export const extractOrderIdFromInvoice = (invoice: unknown) => {
  const raw = String(invoice || '');
  const value = raw.startsWith('order-') ? raw.slice('order-'.length) : raw;
  const normalized = value.trim();
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(normalized) ? normalized : '';
};

export const grantBkashToken = async (config: BkashConfig) => {
  const endpoint = buildUrl(config.baseUrl, endpointMap[config.provider].grant);
  const payload = {
    app_key: config.appKey,
    app_secret: config.appSecret
  };
  const data = await requestJson(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      username: config.username,
      password: config.password
    },
    body: JSON.stringify(payload)
  });

  const token = String(data.id_token || data.idToken || '');
  if (!token) {
    throw new Error(`bKash token missing: ${bkashErrorMessage(data)}`);
  }
  return token;
};

export interface BkashCreateInput {
  amount: string;
  callbackURL: string;
  merchantInvoiceNumber: string;
  payerReference: string;
  currency: string;
  intent: string;
}

export const createBkashPayment = async (config: BkashConfig, token: string, input: BkashCreateInput) => {
  const endpoint = buildUrl(config.baseUrl, endpointMap[config.provider].create);
  return await requestJson(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      authorization: token,
      'x-app-key': config.appKey
    },
    body: JSON.stringify({
      mode: '0011',
      payerReference: input.payerReference,
      callbackURL: input.callbackURL,
      amount: input.amount,
      currency: input.currency,
      intent: input.intent,
      merchantInvoiceNumber: input.merchantInvoiceNumber
    })
  });
};

export const executeBkashPayment = async (config: BkashConfig, token: string, paymentID: string) => {
  const endpoint = buildUrl(config.baseUrl, endpointMap[config.provider].execute);
  return await requestJson(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      authorization: token,
      'x-app-key': config.appKey
    },
    body: JSON.stringify({ paymentID })
  });
};

export const queryBkashPayment = async (config: BkashConfig, token: string, paymentID: string) => {
  const endpoint = endpointMap[config.provider].query;
  if (config.provider === 'checkout') {
    const queryUrl = `${buildUrl(config.baseUrl, endpoint)}?paymentID=${encodeURIComponent(paymentID)}`;
    return await requestJson(queryUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        authorization: token,
        'x-app-key': config.appKey
      }
    });
  }

  return await requestJson(buildUrl(config.baseUrl, endpoint), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      authorization: token,
      'x-app-key': config.appKey
    },
    body: JSON.stringify({ paymentID })
  });
};
