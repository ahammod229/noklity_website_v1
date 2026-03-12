export interface SteadfastConfig {
  baseUrl: string;
  apiKey: string;
  secretKey: string;
}

export interface SteadfastTrackingSnapshot {
  deliveryStatus:
    | 'pending'
    | 'delivered_approval_pending'
    | 'partial_delivered_approval_pending'
    | 'cancelled_approval_pending'
    | 'unknown_approval_pending'
    | 'partial_delivered'
    | 'hold'
    | 'in_review'
    | 'created'
    | 'pending_pickup'
    | 'picked'
    | 'in_transit'
    | 'delivered'
    | 'cancelled'
    | 'failed'
    | 'unknown';
  rawStatus: string;
  trackingCode: string | null;
  consignmentId: string | null;
  trackingUrl: string | null;
  payload: Record<string, unknown>;
}

const DEFAULT_BASE_URL = 'https://portal.packzy.com/api/v1';

const trimSlash = (value: string) => value.replace(/\/+$/, '');

const asObject = (value: unknown): Record<string, unknown> => {
  if (typeof value === 'object' && value !== null) return value as Record<string, unknown>;
  return {};
};

const toText = (value: unknown) => String(value ?? '').trim();

const findValueDeep = (payload: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = payload[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }

  for (const value of Object.values(payload)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const deep = findValueDeep(asObject(item), keys);
        if (deep) return deep;
      }
    } else if (typeof value === 'object' && value !== null) {
      const deep = findValueDeep(asObject(value), keys);
      if (deep) return deep;
    }
  }

  return '';
};

const parseJson = async (response: Response): Promise<Record<string, unknown>> => {
  const text = await response.text();
  if (!text) return {};
  try {
    return asObject(JSON.parse(text));
  } catch {
    return { raw: text };
  }
};

const requestSteadfast = async (
  config: SteadfastConfig,
  endpoint: string,
  init: RequestInit = {}
): Promise<Record<string, unknown>> => {
  const url = `${trimSlash(config.baseUrl)}${endpoint}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Api-Key': config.apiKey,
      'Secret-Key': config.secretKey,
      ...(init.headers || {})
    }
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    const message =
      toText(payload.message) ||
      toText(payload.error) ||
      toText(payload.status) ||
      `Steadfast HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
};

export const loadSteadfastConfig = (input: {
  baseUrl?: string | null;
  apiKey?: string | null;
  secretKey?: string | null;
}): SteadfastConfig => {
  const baseUrl = trimSlash(toText(input.baseUrl) || DEFAULT_BASE_URL);
  const apiKey = toText(input.apiKey);
  const secretKey = toText(input.secretKey);

  if (!apiKey || !secretKey) {
    throw new Error('Steadfast API key and secret key are required.');
  }

  return {
    baseUrl,
    apiKey,
    secretKey
  };
};

export const maskSecret = (value: string) => {
  if (!value) return '';
  if (value.length <= 6) return `${value.slice(0, 1)}***`;
  return `${value.slice(0, 3)}${'*'.repeat(Math.max(3, value.length - 6))}${value.slice(-3)}`;
};

export const normalizeSteadfastPhone = (phone: string) => {
  const digits = phone.replace(/\D+/g, '');
  if (!digits) return phone.trim();

  // Steadfast API documentation expects 11-digit BD mobile format: 01XXXXXXXXX
  if (digits.length === 11 && digits.startsWith('01')) {
    return digits;
  }

  // Convert +8801XXXXXXXXX or 8801XXXXXXXXX to 01XXXXXXXXX
  if (digits.length === 13 && digits.startsWith('8801')) {
    return digits.slice(2);
  }

  // Convert 1XXXXXXXXX to 01XXXXXXXXX
  if (digits.length === 10 && digits.startsWith('1')) {
    return `0${digits}`;
  }

  // If extra prefixes exist, keep the last valid BD mobile segment.
  const bdMatch = digits.match(/(01\d{9})$/);
  if (bdMatch?.[1]) {
    return bdMatch[1];
  }

  return digits;
};

export const createSteadfastParcel = async (
  config: SteadfastConfig,
  payload: Record<string, unknown>
) => requestSteadfast(config, '/create_order', {
  method: 'POST',
  body: JSON.stringify(payload)
});

export const getSteadfastBalance = async (config: SteadfastConfig) =>
  requestSteadfast(config, '/get_balance', {
    method: 'GET'
  });

export const trackSteadfastByCid = async (config: SteadfastConfig, consignmentId: string) =>
  requestSteadfast(config, `/status_by_cid/${encodeURIComponent(consignmentId)}`, {
    method: 'GET'
  });

export const trackSteadfastByInvoice = async (config: SteadfastConfig, invoice: string) =>
  requestSteadfast(config, `/status_by_invoice/${encodeURIComponent(invoice)}`, {
    method: 'GET'
  });

export const trackSteadfastByTrackingCode = async (config: SteadfastConfig, trackingCode: string) =>
  requestSteadfast(config, `/status_by_trackingcode/${encodeURIComponent(trackingCode)}`, {
    method: 'GET'
  });

const normalizeTrackingStatus = (rawStatus: string): SteadfastTrackingSnapshot['deliveryStatus'] => {
  const normalized = rawStatus.toLowerCase();

  if (!normalized) return 'unknown';

  // Steadfast official delivery statuses.
  if (normalized === 'pending') return 'pending';
  if (normalized === 'delivered_approval_pending') return 'delivered_approval_pending';
  if (normalized === 'partial_delivered_approval_pending') return 'partial_delivered_approval_pending';
  if (normalized === 'cancelled_approval_pending') return 'cancelled_approval_pending';
  if (normalized === 'unknown_approval_pending') return 'unknown_approval_pending';
  if (normalized === 'delivered') return 'delivered';
  if (normalized === 'partial_delivered') return 'partial_delivered';
  if (normalized === 'cancelled') return 'cancelled';
  if (normalized === 'hold') return 'hold';
  if (normalized === 'in_review') return 'in_review';
  if (normalized === 'unknown') return 'unknown';

  // Backward-compatible fallbacks for non-standard payloads.
  if (normalized.includes('partial') && normalized.includes('deliver')) return 'partial_delivered';
  if (normalized.includes('deliver')) return 'delivered';
  if (normalized.includes('cancel') || normalized.includes('return')) return 'cancelled';
  if (normalized.includes('hold')) return 'hold';
  if (normalized.includes('review')) return 'in_review';
  if (normalized.includes('transit') || normalized.includes('inhub') || normalized.includes('hub')) return 'in_transit';
  if (normalized.includes('pickup request') || normalized.includes('pending pickup')) return 'pending_pickup';
  if (normalized.includes('pickup') || normalized.includes('picked')) return 'picked';
  if (normalized.includes('pending')) return 'pending';
  if (normalized.includes('consignment') || normalized.includes('created')) return 'created';
  if (normalized.includes('fail')) return 'failed';

  return 'unknown';
};

export const extractSteadfastTrackingSnapshot = (payload: Record<string, unknown>): SteadfastTrackingSnapshot => {
  const rawStatus =
    findValueDeep(payload, ['delivery_status', 'status', 'current_status', 'status_name']) || 'unknown';

  const trackingCode =
    findValueDeep(payload, ['tracking_code', 'trackingCode', 'tracking_id', 'trackingId']) || null;
  const consignmentId =
    findValueDeep(payload, ['consignment_id', 'consignmentId', 'cid']) || null;
  const trackingUrl =
    findValueDeep(payload, ['tracking_url', 'trackingUrl']) ||
    (trackingCode ? `https://steadfast.com.bd/t/${trackingCode}` : null);

  return {
    deliveryStatus: normalizeTrackingStatus(rawStatus),
    rawStatus,
    trackingCode,
    consignmentId,
    trackingUrl,
    payload
  };
};

export const mapDeliveryStatusToOrderStatus = (
  deliveryStatus: SteadfastTrackingSnapshot['deliveryStatus'],
  currentOrderStatus: string
): string => {
  switch (deliveryStatus) {
    case 'delivered':
    case 'partial_delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    case 'in_transit':
    case 'delivered_approval_pending':
    case 'partial_delivered_approval_pending':
      return currentOrderStatus === 'Delivered' ? currentOrderStatus : 'Shipped';
    case 'pending':
    case 'hold':
    case 'in_review':
    case 'cancelled_approval_pending':
    case 'unknown_approval_pending':
    case 'picked':
    case 'pending_pickup':
    case 'created':
      if (currentOrderStatus === 'Pending' || currentOrderStatus === 'Processing') return 'Processing';
      return currentOrderStatus;
    default:
      return currentOrderStatus;
  }
};
