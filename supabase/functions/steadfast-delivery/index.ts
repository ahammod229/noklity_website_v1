import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, jsonResponse, withCors } from '../_shared/cors.ts';
import {
  createSteadfastParcel,
  extractSteadfastTrackingSnapshot,
  getSteadfastBalance,
  loadSteadfastConfig,
  mapDeliveryStatusToOrderStatus,
  maskSecret,
  normalizeSteadfastPhone,
  trackSteadfastByCid,
  trackSteadfastByInvoice,
  trackSteadfastByTrackingCode
} from '../_shared/steadfast.ts';

interface ActionPayload {
  action?:
    | 'get_config'
    | 'save_config'
    | 'test_connection'
    | 'create_parcel'
    | 'track_order'
    | 'sync_tracking';
  orderId?: string;
  guestEmail?: string;
  config?: {
    enabled?: boolean;
    autoCreate?: boolean;
    trackingEnabled?: boolean;
    baseUrl?: string;
    apiKey?: string;
    secretKey?: string;
  };
}

interface OrderRow {
  id: string;
  user_id: string | null;
  status: string;
  payment_method: string;
  total_amount: number;
  shipping_address: Record<string, unknown>;
  delivery_provider: string | null;
  delivery_consignment_id: string | null;
  delivery_tracking_code: string | null;
  delivery_tracking_url: string | null;
  delivery_status: string;
}

const DEFAULT_BASE_URL = 'https://portal.packzy.com/api/v1';

class HttpError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

const getEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing function environment variable: ${key}`);
  return value;
};

const asObject = (value: unknown): Record<string, unknown> => {
  if (typeof value === 'object' && value !== null) return value as Record<string, unknown>;
  return {};
};

const toText = (value: unknown) => String(value ?? '').trim();

const parseBoolean = (value: string | undefined, fallback = false) => {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
};

const extractBearerToken = (authHeader: string) => {
  if (!authHeader) return '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return (match?.[1] || '').trim();
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  if (!token || token.split('.').length < 2) return null;
  const [, payload] = token.split('.');
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
};

const isAnonJwt = (token: string) => {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  const role = String(payload.role || '').toLowerCase();
  const sub = String(payload.sub || '');
  return role === 'anon' && !sub;
};

const toShortInvoice = (orderId: string) =>
  orderId
    .replace(/[^0-9a-z]/gi, '')
    .toUpperCase()
    .slice(0, 13) || orderId.slice(0, 13);

const getSettingsMap = async (adminClient: ReturnType<typeof createClient>) => {
  const { data, error } = await adminClient
    .from('site_settings')
    .select('key,value')
    .in('key', [
      'delivery_provider_steadfast_enabled',
      'delivery_provider_steadfast_auto_create',
      'delivery_provider_steadfast_tracking_enabled'
    ]);

  if (error) {
    throw new Error(error.message || 'Failed to load Steadfast settings.');
  }

  const map = new Map<string, string>();
  for (const row of (data || []) as Array<{ key: string; value: string }>) {
    map.set(row.key, row.value || '');
  }

  return map;
};

const upsertSetting = async (
  adminClient: ReturnType<typeof createClient>,
  key: string,
  value: string
) => {
  const { error } = await adminClient.from('site_settings').upsert({ key, value }, { onConflict: 'key' });
  if (error) throw new Error(error.message || `Failed to update setting: ${key}`);
};

const getSteadfastIntegration = async (adminClient: ReturnType<typeof createClient>) => {
  const { data, error } = await adminClient
    .from('api_integrations')
    .select('*')
    .eq('key', 'steadfast')
    .maybeSingle();

  if (error) throw new Error(error.message || 'Failed to load Steadfast integration.');

  return data as
    | {
        id: string;
        key: string;
        name: string;
        base_url: string | null;
        auth_type: string;
        secret_ref: string | null;
        config: Record<string, unknown> | null;
        status: 'active' | 'inactive';
        last_checked_at: string | null;
      }
    | null;
};

const getSteadfastState = async (adminClient: ReturnType<typeof createClient>) => {
  const [settingsMap, integration] = await Promise.all([
    getSettingsMap(adminClient),
    getSteadfastIntegration(adminClient)
  ]);

  const rawConfig = asObject(integration?.config);
  const apiKey = toText(rawConfig.apiKey || rawConfig.api_key || integration?.secret_ref || '');
  const secretKey = toText(rawConfig.secretKey || rawConfig.secret_key || '');
  const baseUrl = toText(integration?.base_url || rawConfig.baseUrl || DEFAULT_BASE_URL) || DEFAULT_BASE_URL;

  const enabledSetting = parseBoolean(settingsMap.get('delivery_provider_steadfast_enabled'), false);
  const autoCreate = parseBoolean(settingsMap.get('delivery_provider_steadfast_auto_create'), false);
  const trackingEnabled = parseBoolean(settingsMap.get('delivery_provider_steadfast_tracking_enabled'), true);

  return {
    integration,
    baseUrl,
    apiKey,
    secretKey,
    configured: Boolean(apiKey && secretKey),
    enabled: enabledSetting && integration?.status === 'active',
    autoCreate,
    trackingEnabled
  };
};

const ensureAdmin = async (
  adminClient: ReturnType<typeof createClient>,
  userId: string | null
) => {
  if (!userId) {
    throw new HttpError('Admin authorization required. Please login as admin and try again.', 403);
  }

  const { data: profile, error } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Unable to verify admin role.');
  }

  if (profile?.role !== 'admin') {
    throw new HttpError('Admin authorization required. Your account is not marked as admin.', 403);
  }
};

const resolveRequester = async (req: Request) => {
  const supabaseUrl = getEnv('SUPABASE_URL');
  const anonKey = getEnv('SUPABASE_ANON_KEY');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  const authHeader = (req.headers.get('Authorization') || '').trim();
  const bearerToken = extractBearerToken(authHeader);
  const isAnonAuthorization =
    Boolean(bearerToken) &&
    (bearerToken === anonKey || authHeader === `Bearer ${anonKey}` || isAnonJwt(bearerToken));
  const hasUserAuth = Boolean(bearerToken) && !isAnonAuthorization;

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const userClient = createClient(supabaseUrl, anonKey, {
    global: hasUserAuth
      ? {
          headers: {
            Authorization: `Bearer ${bearerToken}`
          }
        }
      : undefined
  });

  let userId: string | null = null;
  if (hasUserAuth) {
    const {
      data: { user },
      error: userError
    } = await userClient.auth.getUser();

    if (userError || !user?.id) {
      const message = userError?.message || '';
      // Some anon JWTs can be passed as bearer token and throw missing `sub`.
      // Treat those as unauthenticated user requests instead of hard-failing the function.
      if (message.toLowerCase().includes('missing sub claim')) {
        userId = null;
      } else {
        throw new HttpError(userError?.message || 'Unauthorized request.', 401);
      }
    } else {
      userId = user.id;
    }
  }

  return { adminClient, userId };
};

const buildParcelPayload = (
  order: OrderRow,
  orderItems: Array<{ quantity: number; product: { title: string | null } | null }>
) => {
  const shipping = asObject(order.shipping_address);
  const recipientName = toText(shipping.fullName || shipping.name || 'Customer');
  const recipientPhone = normalizeSteadfastPhone(toText(shipping.phone || ''));
  const recipientAddress = [
    toText(shipping.address),
    toText(shipping.city),
    toText(shipping.state),
    toText(shipping.country),
    toText(shipping.zip)
  ]
    .filter(Boolean)
    .join(', ');

  const itemDescription = orderItems
    .map((item) => toText(item.product?.title || 'Product'))
    .filter(Boolean)
    .join(', ')
    .slice(0, 240);

  const totalLot = orderItems.reduce((sum, item) => sum + Math.max(0, Number(item.quantity || 0)), 0);

  return {
    invoice: toShortInvoice(order.id),
    recipient_name: recipientName,
    recipient_phone: recipientPhone,
    recipient_address: recipientAddress,
    cod_amount: order.payment_method === 'cod' ? Number(order.total_amount || 0).toFixed(2) : '0',
    note: `Order ${toShortInvoice(order.id)}`,
    item_description: itemDescription || `Order ${toShortInvoice(order.id)}`,
    total_lot: totalLot > 0 ? totalLot : 1
  };
};

const getOrderForTracking = async (adminClient: ReturnType<typeof createClient>, orderId: string) => {
  const { data, error } = await adminClient
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to load order.');
  }

  if (!data) {
    throw new Error('Order not found.');
  }

  return data as OrderRow;
};

const canTrackOrder = async (
  adminClient: ReturnType<typeof createClient>,
  order: OrderRow,
  requesterUserId: string | null,
  guestEmail: string | undefined
) => {
  if (requesterUserId) {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', requesterUserId)
      .maybeSingle();

    if (profile?.role === 'admin') return true;
    return order.user_id === requesterUserId;
  }

  const shipping = asObject(order.shipping_address);
  const orderEmail = toText(shipping.email).toLowerCase();
  return Boolean(orderEmail && orderEmail === toText(guestEmail).toLowerCase());
};

const updateOrderTracking = async (
  adminClient: ReturnType<typeof createClient>,
  orderId: string,
  currentStatus: string,
  tracking: ReturnType<typeof extractSteadfastTrackingSnapshot>
) => {
  const persistedDeliveryStatus = (() => {
    // Backward compatibility for projects where the DB check constraint
    // still uses the older fixed status list.
    switch (tracking.deliveryStatus) {
      case 'pending':
      case 'hold':
      case 'in_review':
      case 'cancelled_approval_pending':
      case 'unknown_approval_pending':
        return 'created';
      case 'delivered_approval_pending':
      case 'partial_delivered_approval_pending':
        return 'in_transit';
      case 'partial_delivered':
        return 'delivered';
      default:
        return tracking.deliveryStatus;
    }
  })();

  const nextOrderStatus = mapDeliveryStatusToOrderStatus(tracking.deliveryStatus, currentStatus);

  const { error } = await adminClient
    .from('orders')
    .update({
      delivery_provider: 'steadfast',
      delivery_consignment_id: tracking.consignmentId,
      delivery_tracking_code: tracking.trackingCode,
      delivery_tracking_url: tracking.trackingUrl,
      delivery_status: persistedDeliveryStatus,
      delivery_last_synced_at: new Date().toISOString(),
      delivery_payload: tracking.payload,
      status: nextOrderStatus
    })
    .eq('id', orderId);

  if (error) {
    throw new Error(error.message || 'Failed to update order tracking.');
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return withCors(new Response('ok', { headers: corsHeaders }));
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  try {
    const body = (await req.json()) as ActionPayload;
    const action = body.action;

    if (!action) {
      return jsonResponse({ success: false, error: 'Missing action.' }, 400);
    }

    const { adminClient, userId } = await resolveRequester(req);

    if (action === 'get_config') {
      await ensureAdmin(adminClient, userId);
      const state = await getSteadfastState(adminClient);

      return jsonResponse({
        success: true,
        config: {
          configured: state.configured,
          enabled: state.enabled,
          autoCreate: state.autoCreate,
          trackingEnabled: state.trackingEnabled,
          baseUrl: state.baseUrl,
          apiKeyMasked: maskSecret(state.apiKey),
          secretKeyMasked: maskSecret(state.secretKey),
          status: state.integration?.status || 'inactive',
          lastCheckedAt: state.integration?.last_checked_at || null
        }
      });
    }

    if (action === 'save_config') {
      await ensureAdmin(adminClient, userId);

      const currentState = await getSteadfastState(adminClient);
      const input = body.config || {};
      const baseUrl = toText(input.baseUrl || DEFAULT_BASE_URL) || DEFAULT_BASE_URL;
      const apiKey = toText(input.apiKey) || currentState.apiKey;
      const secretKey = toText(input.secretKey) || currentState.secretKey;
      const enabled = Boolean(input.enabled);
      const autoCreate = Boolean(input.autoCreate);
      const trackingEnabled = input.trackingEnabled === undefined ? true : Boolean(input.trackingEnabled);

      if (!apiKey || !secretKey) {
        return jsonResponse({ success: false, error: 'API Key and Secret Key are required.' }, 400);
      }

      const integrationPayload = {
        key: 'steadfast',
        name: 'Steadfast Courier',
        base_url: baseUrl,
        auth_type: 'api_key',
        secret_ref: apiKey,
        config: {
          apiKey,
          secretKey,
          baseUrl,
          updatedAt: new Date().toISOString()
        },
        status: enabled ? 'active' : 'inactive',
        notes: 'Managed from API Management > Steadfast'
      };

      const { error } = await adminClient
        .from('api_integrations')
        .upsert(integrationPayload, { onConflict: 'key' });

      if (error) {
        throw new Error(error.message || 'Failed to save Steadfast configuration.');
      }

      await upsertSetting(
        adminClient,
        'delivery_provider_steadfast_enabled',
        enabled ? 'true' : 'false'
      );
      await upsertSetting(
        adminClient,
        'delivery_provider_steadfast_auto_create',
        autoCreate ? 'true' : 'false'
      );
      await upsertSetting(
        adminClient,
        'delivery_provider_steadfast_tracking_enabled',
        trackingEnabled ? 'true' : 'false'
      );

      return jsonResponse({
        success: true,
        config: {
          configured: true,
          enabled,
          autoCreate,
          trackingEnabled,
          baseUrl,
          apiKeyMasked: maskSecret(apiKey),
          secretKeyMasked: maskSecret(secretKey),
          status: enabled ? 'active' : 'inactive'
        }
      });
    }

    if (action === 'test_connection') {
      await ensureAdmin(adminClient, userId);
      const state = await getSteadfastState(adminClient);

      const config = loadSteadfastConfig({
        baseUrl: state.baseUrl,
        apiKey: state.apiKey,
        secretKey: state.secretKey
      });

      const balanceResponse = await getSteadfastBalance(config);
      const detectedBalance =
        toText(balanceResponse.current_balance) ||
        toText(balanceResponse.balance) ||
        toText(asObject(balanceResponse.data).current_balance) ||
        toText(asObject(balanceResponse.data).balance) ||
        null;

      await adminClient
        .from('api_integrations')
        .update({
          last_checked_at: new Date().toISOString()
        })
        .eq('key', 'steadfast');

      return jsonResponse({
        success: true,
        message: 'Steadfast connection successful.',
        balance: detectedBalance,
        payload: balanceResponse
      });
    }

    if (action === 'create_parcel') {
      await ensureAdmin(adminClient, userId);

      const orderId = toText(body.orderId);
      if (!orderId) {
        return jsonResponse({ success: false, error: 'orderId is required.' }, 400);
      }

      const state = await getSteadfastState(adminClient);
      if (!state.enabled) {
        return jsonResponse({ success: false, error: 'Steadfast delivery is disabled in settings.' }, 403);
      }
      if (!state.configured) {
        return jsonResponse(
          { success: false, error: 'Steadfast API is not configured. Add API Key and Secret Key first.' },
          400
        );
      }

      const config = loadSteadfastConfig({
        baseUrl: state.baseUrl,
        apiKey: state.apiKey,
        secretKey: state.secretKey
      });

      const { data: orderWithItems, error: orderError } = await adminClient
        .from('orders')
        .select(`
          *,
          order_items(quantity, product:products(title))
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !orderWithItems) {
        throw new Error(orderError?.message || 'Order not found.');
      }

      const order = orderWithItems as OrderRow & {
        order_items: Array<{ quantity: number; product: { title: string | null } | null }>;
      };

      if (order.delivery_provider === 'steadfast' && order.delivery_consignment_id) {
        return jsonResponse({
          success: true,
          message: 'Parcel already exists for this order.',
          tracking: {
            deliveryProvider: order.delivery_provider,
            consignmentId: order.delivery_consignment_id,
            trackingCode: order.delivery_tracking_code,
            trackingUrl: order.delivery_tracking_url,
            deliveryStatus: order.delivery_status
          }
        });
      }

      const parcelPayload = buildParcelPayload(order, order.order_items || []);
      if (!toText(parcelPayload.recipient_phone)) {
        return jsonResponse(
          { success: false, error: 'Recipient phone is missing. Please update shipping address phone.' },
          400
        );
      }
      if (!/^01\d{9}$/.test(toText(parcelPayload.recipient_phone))) {
        return jsonResponse(
          {
            success: false,
            error:
              'Recipient phone must be a valid Bangladesh 11-digit number (example: 01712345678).'
          },
          400
        );
      }
      if (!toText(parcelPayload.recipient_address)) {
        return jsonResponse(
          { success: false, error: 'Recipient address is missing. Please update shipping address.' },
          400
        );
      }

      const createdPayload = await createSteadfastParcel(config, parcelPayload);
      const tracking = extractSteadfastTrackingSnapshot(createdPayload);

      await updateOrderTracking(adminClient, orderId, order.status, tracking);

      return jsonResponse({
        success: true,
        message: 'Parcel created in Steadfast.',
        tracking: {
          deliveryProvider: 'steadfast',
          consignmentId: tracking.consignmentId,
          trackingCode: tracking.trackingCode,
          trackingUrl: tracking.trackingUrl,
          deliveryStatus: tracking.deliveryStatus,
          rawStatus: tracking.rawStatus,
          payload: createdPayload
        }
      });
    }

    if (action === 'track_order' || action === 'sync_tracking') {
      const orderId = toText(body.orderId);
      if (!orderId) {
        return jsonResponse({ success: false, error: 'orderId is required.' }, 400);
      }

      const order = await getOrderForTracking(adminClient, orderId);
      const allowed = await canTrackOrder(adminClient, order, userId, body.guestEmail);

      if (!allowed) {
        return jsonResponse({ success: false, error: 'Order not found.' }, 404);
      }

      const state = await getSteadfastState(adminClient);
      if (!state.trackingEnabled) {
        return jsonResponse({ success: false, error: 'Parcel tracking is disabled by admin.' }, 403);
      }

      const config = loadSteadfastConfig({
        baseUrl: state.baseUrl,
        apiKey: state.apiKey,
        secretKey: state.secretKey
      });

      let trackPayload;
      if (order.delivery_consignment_id) {
        trackPayload = await trackSteadfastByCid(config, order.delivery_consignment_id);
      } else if (order.delivery_tracking_code) {
        trackPayload = await trackSteadfastByTrackingCode(config, order.delivery_tracking_code);
      } else {
        trackPayload = await trackSteadfastByInvoice(config, toShortInvoice(order.id));
      }

      const tracking = extractSteadfastTrackingSnapshot(trackPayload);
      await updateOrderTracking(adminClient, orderId, order.status, tracking);

      return jsonResponse({
        success: true,
        tracking: {
          deliveryProvider: 'steadfast',
          consignmentId: tracking.consignmentId,
          trackingCode: tracking.trackingCode,
          trackingUrl: tracking.trackingUrl,
          deliveryStatus: tracking.deliveryStatus,
          rawStatus: tracking.rawStatus,
          lastSyncedAt: new Date().toISOString(),
          payload: trackPayload
        }
      });
    }

    return jsonResponse({ success: false, error: `Unsupported action: ${action}` }, 400);
  } catch (error: unknown) {
    const status = error instanceof HttpError ? error.status : 500;
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Steadfast integration error.'
      },
      status
    );
  }
});
