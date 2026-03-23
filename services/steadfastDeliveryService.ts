import { supabase } from '../lib/supabase';
import {
  clearSupabaseStoredSession,
  readSupabaseStoredAccessToken
} from '../utils/supabaseAuthStorage';

export type SteadfastDeliveryStatus =
  | 'not_created'
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

export interface SteadfastConfigState {
  configured: boolean;
  enabled: boolean;
  autoCreate: boolean;
  trackingEnabled: boolean;
  baseUrl: string;
  apiKeyMasked: string;
  secretKeyMasked: string;
  status: 'active' | 'inactive';
  lastCheckedAt: string | null;
}

export interface SteadfastTrackingState {
  deliveryProvider: 'steadfast';
  consignmentId: string | null;
  trackingCode: string | null;
  trackingUrl: string | null;
  deliveryStatus: SteadfastDeliveryStatus;
  rawStatus?: string | null;
  lastSyncedAt?: string | null;
  payload?: Record<string, unknown>;
}

interface SteadfastInvokeResponse {
  success: boolean;
  error?: string;
  message?: string;
  config?: SteadfastConfigState;
  tracking?: SteadfastTrackingState;
  balance?: string | null;
  payload?: Record<string, unknown>;
}

const asErrorMessage = (error: unknown) => {
  if (!error) return 'Steadfast request failed.';
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null) {
    const maybe = error as { message?: string; context?: string; name?: string };
    if (String(maybe.message || '').toLowerCase().includes('invalid jwt')) {
      return 'Admin session token is invalid. Please sign out and sign in again.';
    }
    if (maybe.message === 'Failed to send a request to the Edge Function') {
      return 'Edge Function is unreachable. Make sure the function is deployed and your Supabase project is online.';
    }
    return maybe.message || maybe.context || maybe.name || 'Steadfast request failed.';
  }
  return 'Steadfast request failed.';
};

const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) {
    return String((import.meta as any).env[key]);
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return String(process.env[key]);
  }
  return '';
};

const getSupabaseFunctionEndpoint = () => {
  const baseUrl = getEnvVar('VITE_SUPABASE_URL').trim().replace(/\/+$/, '');
  if (!baseUrl) return '';
  return `${baseUrl}/functions/v1/steadfast-delivery`;
};

const getSupabaseAnonKey = () =>
  (getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY')).trim();

const isRelayLikeError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  const maybe = error as { name?: string; message?: string };
  const name = String(maybe.name || '').toLowerCase();
  const message = String(maybe.message || '').toLowerCase();
  return (
    name.includes('functionsrelayerror') ||
    name.includes('functionsfetcherror') ||
    message.includes('failed to send a request to the edge function') ||
    message.includes('edge function is unreachable') ||
    message.includes('fetch failed')
  );
};

const isInvalidJwtMessage = (value: string) => value.toLowerCase().includes('invalid jwt');

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  if (!token || token.split('.').length < 2) return null;
  const [, payload] = token.split('.');
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const decoded =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const getSupabaseProjectRefFromUrl = () => {
  const baseUrl = getEnvVar('VITE_SUPABASE_URL').trim();
  if (!baseUrl) return '';
  try {
    const normalized = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    const hostname = new URL(normalized).hostname;
    return String(hostname.split('.')[0] || '').trim().toLowerCase();
  } catch {
    return '';
  }
};

const tokenMatchesCurrentProject = (token: string) => {
  const expectedRef = getSupabaseProjectRefFromUrl();
  if (!expectedRef) return true;
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  const issuer = String(payload.iss || '').toLowerCase();
  if (!issuer) return true;
  return issuer.includes(`${expectedRef}.supabase.co`);
};

const isTokenExpiredOrNearExpiry = (token: string, skewSeconds = 120) => {
  const payload = decodeJwtPayload(token);
  const exp = Number(payload?.exp || 0);
  if (!exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return exp <= now + skewSeconds;
};

const ADMIN_ONLY_ACTIONS = new Set([
  'get_config',
  'save_config',
  'test_connection',
  'create_parcel'
]);

const readAccessTokenFromLocalStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) return '';
  return readSupabaseStoredAccessToken(getEnvVar('VITE_SUPABASE_URL'), window.localStorage);
};

const clearStoredSupabaseAuth = () => {
  if (typeof window === 'undefined') return;
  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  clearSupabaseStoredSession(supabaseUrl, window.localStorage);
  clearSupabaseStoredSession(supabaseUrl, window.sessionStorage);
};

const isLikelyJwt = (token: string) => {
  const normalized = String(token || '').trim();
  const parts = normalized.split('.');
  return parts.length === 3 && Boolean(parts[0]) && Boolean(parts[1]) && Boolean(parts[2]);
};

const ADMIN_TOKEN_CACHE_TTL_MS = 60_000;
let cachedValidatedToken = '';
let cachedValidatedAt = 0;

const isTokenRecentlyValidated = (token: string) =>
  token &&
  cachedValidatedToken === token &&
  Date.now() - cachedValidatedAt < ADMIN_TOKEN_CACHE_TTL_MS;

const markTokenAsValidated = (token: string) => {
  cachedValidatedToken = token;
  cachedValidatedAt = Date.now();
};

const invalidateTokenCache = () => {
  cachedValidatedToken = '';
  cachedValidatedAt = 0;
};

const isUsableAccessToken = async (token: string) => {
  const normalized = String(token || '').trim();
  if (!isLikelyJwt(normalized) || isTokenExpiredOrNearExpiry(normalized) || !tokenMatchesCurrentProject(normalized)) {
    return false;
  }

  if (isTokenRecentlyValidated(normalized)) {
    return true;
  }

  try {
    const { data, error } = await supabase.auth.getUser(normalized);
    if (!error && data?.user?.id) {
      markTokenAsValidated(normalized);
      return true;
    }

    const errorMessage = String(error?.message || '').toLowerCase();
    const isHardInvalid =
      errorMessage.includes('invalid jwt') ||
      errorMessage.includes('jwt expired') ||
      errorMessage.includes('missing sub claim');
    if (isHardInvalid) return false;

    // Soft-fallback: if Supabase auth check is temporarily unreachable but the token
    // looks like a non-expired JWT, allow the request to proceed and let the Edge
    // Function do the authoritative verification.
    markTokenAsValidated(normalized);
    return true;
  } catch {
    // Network/runtime issue while validating token. Keep flow resilient and defer
    // final verification to the Edge Function.
    markTokenAsValidated(normalized);
    return true;
  }
};

const ADMIN_EMAIL_ALLOWLIST = getEnvVar('VITE_ADMIN_EMAILS')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const maybePromoteAllowlistedAdminProfile = async () => {
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    const userId = String(user?.id || '').trim();
    const email = String(user?.email || '').trim().toLowerCase();
    if (!userId || !email || !ADMIN_EMAIL_ALLOWLIST.includes(email)) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id,role,status')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      await supabase.from('profiles').upsert({
        id: userId,
        email,
        full_name: String(user?.user_metadata?.full_name || 'Admin').trim(),
        role: 'admin',
        status: 'active'
      });
      return;
    }

    if (profile.role !== 'admin' || profile.status !== 'active') {
      await supabase
        .from('profiles')
        .update({ role: 'admin', status: 'active' })
        .eq('id', userId);
    }
  } catch {
    // Non-blocking: if this fails we still continue normal auth flow.
  }
};

const ensureSessionForAdminAction = async (action?: string): Promise<string> => {
  if (!action || !ADMIN_ONLY_ACTIONS.has(action)) return '';

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const currentToken = String(session?.access_token || '').trim();
  if (await isUsableAccessToken(currentToken)) {
    await maybePromoteAllowlistedAdminProfile();
    return currentToken;
  }

  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    console.warn('Steadfast admin session refresh warning:', refreshError.message);
  }

  const refreshedToken = String(refreshed?.session?.access_token || '').trim();
  if (await isUsableAccessToken(refreshedToken)) {
    await maybePromoteAllowlistedAdminProfile();
    return refreshedToken;
  }

  const localStorageToken = readAccessTokenFromLocalStorage();
  if (await isUsableAccessToken(localStorageToken)) {
    await maybePromoteAllowlistedAdminProfile();
    return localStorageToken;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    // Final resilient fallback:
    // If we still have a non-expired JWT-looking token, let the Edge Function
    // do authoritative verification. This avoids false negatives caused by
    // temporary client-side auth validation issues.
    const fallbackCandidates = [currentToken, refreshedToken, localStorageToken];
    const usableFallback = fallbackCandidates.find(
      (token) => isLikelyJwt(token) && !isTokenExpiredOrNearExpiry(token, 30)
    );
    if (usableFallback) {
      return usableFallback;
    }

    clearStoredSupabaseAuth();
    invalidateTokenCache();
    throw new Error('Admin session token is invalid. Please sign out and sign in again.');
  }

  invalidateTokenCache();
  throw new Error('Please login as an admin account to use Steadfast integration.');
};

const tryParseResponseError = async (error: unknown): Promise<string | null> => {
  if (!error || typeof error !== 'object') return null;

  const maybe = error as { context?: unknown };
  const context = maybe.context;
  if (!context || typeof context !== 'object') return null;

  const responseLike = context as {
    json?: () => Promise<unknown>;
    text?: () => Promise<string>;
    clone?: () => { json?: () => Promise<unknown>; text?: () => Promise<string> };
  };

  const cloned = typeof responseLike.clone === 'function' ? responseLike.clone() : responseLike;

  if (typeof cloned.json === 'function') {
    try {
      const payload = await cloned.json();
      if (payload && typeof payload === 'object') {
        const record = payload as Record<string, unknown>;
        const message = String(record.error || record.message || '').trim();
        if (message) return message;
      }
    } catch {
      // ignore and try text fallback
    }
  }

  if (typeof cloned.text === 'function') {
    try {
      const text = (await cloned.text()).trim();
      if (!text) return null;
      try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        const message = String(parsed.error || parsed.message || '').trim();
        return message || text;
      } catch {
        return text;
      }
    } catch {
      return null;
    }
  }

  return null;
};

const invokeSteadfast = async (body: Record<string, unknown>) => {
  const action = String(body.action || '').trim();
  const requiresAdminSession = ADMIN_ONLY_ACTIONS.has(action);

  const invokeViaDirectFetch = async (accessToken?: string) => {
    const endpoint = getSupabaseFunctionEndpoint();
    const anonKey = getSupabaseAnonKey();
    if (!endpoint || !anonKey) {
      throw new Error('Supabase environment values are missing for function fallback.');
    }

    const token = String(accessToken || '').trim();
    if (requiresAdminSession && !token) {
      throw new Error('Admin session token is invalid. Please sign out and sign in again.');
    }

    const headers: Record<string, string> = {
      apikey: anonKey,
      'Content-Type': 'application/json'
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const rawText = await response.text();
    let parsedPayload: Record<string, unknown> = {};
    try {
      parsedPayload = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
    } catch {
      parsedPayload = rawText ? { raw: rawText } : {};
    }

    if (!response.ok) {
      const message = String(parsedPayload.error || parsedPayload.message || '').trim();
      throw new Error(message || `Edge Function HTTP ${response.status}`);
    }

    return parsedPayload;
  };

  const invokeOnce = async () => {
    // For admin-only actions, always use the validated token directly.
    // This avoids `functions.invoke` using a stale internal token and returning
    // `Invalid JWT` even when a valid token exists in storage.
    if (requiresAdminSession) {
      const ensuredToken = await ensureSessionForAdminAction(action);
      return await invokeViaDirectFetch(ensuredToken);
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();
    const sessionToken = String(session?.access_token || '').trim();

    const { data, error } = await supabase.functions.invoke('steadfast-delivery', { body });
    if (!error) {
      return data;
    }

    const parsed = await tryParseResponseError(error);
    if (isInvalidJwtMessage(String(parsed || ''))) {
      invalidateTokenCache();
      throw new Error('Session token is invalid. Please sign in again.');
    }

    // Only use manual fetch fallback for relay/network issues.
    if (!isRelayLikeError(error)) {
      throw new Error(parsed || asErrorMessage(error));
    }

    try {
      return await invokeViaDirectFetch(sessionToken);
    } catch (fallbackError) {
      throw new Error(asErrorMessage(fallbackError) || parsed || asErrorMessage(error));
    }
  };

  let data: unknown;
  try {
    data = await invokeOnce();
  } catch (firstError) {
    const message = firstError instanceof Error ? firstError.message : String(firstError || '');
    const isRelayOrReachability =
      message.toLowerCase().includes('edge function is unreachable') ||
      message.toLowerCase().includes('failed to send a request') ||
      message.toLowerCase().includes('session expired') ||
      message.toLowerCase().includes('jwt');

    if (!isRelayOrReachability) throw firstError;

    // Retry once after force-refreshing auth session.
    await supabase.auth.refreshSession();
    try {
      data = await invokeOnce();
    } catch (retryError) {
      const retryMessage = retryError instanceof Error ? retryError.message : String(retryError || '');
      if (isInvalidJwtMessage(retryMessage)) {
        throw new Error('Admin session token is invalid. Please sign out and sign in again.');
      }
      throw retryError;
    }
  }

  const payload = (data || {}) as SteadfastInvokeResponse;
  if (!payload.success) {
    throw new Error(payload.error || 'Steadfast request failed.');
  }

  return payload;
};

export const getSteadfastConfig = async (): Promise<SteadfastConfigState> => {
  const payload = await invokeSteadfast({ action: 'get_config' });
  if (!payload.config) {
    throw new Error('Invalid Steadfast config response.');
  }
  return payload.config;
};

export const saveSteadfastConfig = async (input: {
  enabled: boolean;
  autoCreate: boolean;
  trackingEnabled: boolean;
  baseUrl: string;
  apiKey?: string;
  secretKey?: string;
}): Promise<SteadfastConfigState> => {
  const payload = await invokeSteadfast({
    action: 'save_config',
    config: {
      enabled: input.enabled,
      autoCreate: input.autoCreate,
      trackingEnabled: input.trackingEnabled,
      baseUrl: input.baseUrl,
      apiKey: input.apiKey || '',
      secretKey: input.secretKey || ''
    }
  });

  if (!payload.config) {
    throw new Error('Invalid Steadfast config response.');
  }
  return payload.config;
};

export const testSteadfastConnection = async (): Promise<{ message: string; balance: string | null }> => {
  const payload = await invokeSteadfast({ action: 'test_connection' });
  return {
    message: payload.message || 'Steadfast connection successful.',
    balance: payload.balance || null
  };
};

export const createSteadfastParcelForOrder = async (orderId: string): Promise<SteadfastTrackingState> => {
  const payload = await invokeSteadfast({ action: 'create_parcel', orderId });
  if (!payload.tracking) {
    throw new Error('Invalid Steadfast create parcel response.');
  }
  return payload.tracking;
};

export const syncSteadfastTrackingForOrder = async (
  orderId: string,
  guestEmail?: string
): Promise<SteadfastTrackingState> => {
  const payload = await invokeSteadfast({
    action: 'sync_tracking',
    orderId,
    guestEmail: guestEmail || ''
  });
  if (!payload.tracking) {
    throw new Error('Invalid Steadfast tracking response.');
  }
  return payload.tracking;
};
