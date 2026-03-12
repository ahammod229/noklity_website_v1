import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { jsonResponse, withCors } from '../_shared/cors.ts';
import {
  extractSteadfastTrackingSnapshot,
  mapDeliveryStatusToOrderStatus
} from '../_shared/steadfast.ts';

interface OrderRow {
  id: string;
  status: string;
  delivery_consignment_id: string | null;
  delivery_tracking_code: string | null;
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

const extractBearerToken = (value: string) => {
  const match = value.match(/^Bearer\s+(.+)$/i);
  return (match?.[1] || '').trim();
};

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

const toShortInvoice = (orderId: string) =>
  orderId
    .replace(/[^0-9a-z]/gi, '')
    .toUpperCase()
    .slice(0, 13) || orderId.slice(0, 13);

const toPersistedDeliveryStatus = (deliveryStatus: string) => {
  switch (deliveryStatus) {
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
      return deliveryStatus;
  }
};

const findOrderByShortInvoice = async (
  adminClient: ReturnType<typeof createClient>,
  invoice: string
): Promise<OrderRow | null> => {
  const { data, error } = await adminClient
    .from('orders')
    .select('id,status,delivery_consignment_id,delivery_tracking_code,created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error || !data) return null;

  const target = invoice.replace(/[^0-9a-z]/gi, '').toUpperCase();
  return (
    (data as Array<OrderRow>).find((row) => {
      return toShortInvoice(row.id) === target;
    }) || null
  );
};

const resolveOrder = async (
  adminClient: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
  consignmentId: string | null,
  trackingCode: string | null
): Promise<OrderRow | null> => {
  if (consignmentId) {
    const { data } = await adminClient
      .from('orders')
      .select('id,status,delivery_consignment_id,delivery_tracking_code')
      .eq('delivery_consignment_id', consignmentId)
      .maybeSingle();
    if (data) return data as OrderRow;
  }

  if (trackingCode) {
    const { data } = await adminClient
      .from('orders')
      .select('id,status,delivery_consignment_id,delivery_tracking_code')
      .eq('delivery_tracking_code', trackingCode)
      .maybeSingle();
    if (data) return data as OrderRow;
  }

  const invoice =
    findValueDeep(payload, ['invoice', 'merchant_invoice_id', 'invoice_no']) ||
    findValueDeep(asObject(payload.data), ['invoice', 'merchant_invoice_id', 'invoice_no']);
  if (!invoice) return null;

  return await findOrderByShortInvoice(adminClient, invoice);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return withCors(new Response('ok'));
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  try {
    const expectedToken = getEnv('STEADFAST_WEBHOOK_TOKEN');
    const authHeader = req.headers.get('Authorization') || '';
    const bearerToken = extractBearerToken(authHeader);
    const fallbackToken = req.headers.get('x-webhook-token') || '';
    const providedToken = bearerToken || fallbackToken;

    if (!providedToken || providedToken !== expectedToken) {
      return jsonResponse({ success: false, error: 'Invalid webhook token.' }, 401);
    }

    const rawPayload = asObject(await req.json());
    const payload = asObject(rawPayload.data || rawPayload);
    const tracking = extractSteadfastTrackingSnapshot(payload);

    const supabaseUrl = getEnv('SUPABASE_URL');
    const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const order = await resolveOrder(
      adminClient,
      payload,
      tracking.consignmentId,
      tracking.trackingCode
    );

    if (!order) {
      return jsonResponse({
        success: true,
        message: 'Webhook received, but no matching order found.',
        receivedStatus: tracking.deliveryStatus
      });
    }

    const persistedDeliveryStatus = toPersistedDeliveryStatus(tracking.deliveryStatus);
    const mappedOrderStatus = mapDeliveryStatusToOrderStatus(tracking.deliveryStatus, order.status);

    const { error } = await adminClient
      .from('orders')
      .update({
        delivery_provider: 'steadfast',
        delivery_consignment_id: tracking.consignmentId || order.delivery_consignment_id,
        delivery_tracking_code: tracking.trackingCode || order.delivery_tracking_code,
        delivery_tracking_url: tracking.trackingUrl,
        delivery_status: persistedDeliveryStatus,
        delivery_last_synced_at: new Date().toISOString(),
        delivery_payload: payload,
        status: mappedOrderStatus
      })
      .eq('id', order.id);

    if (error) {
      throw new Error(error.message || 'Failed to update order from webhook.');
    }

    return jsonResponse({
      success: true,
      message: 'Webhook processed successfully.',
      orderId: order.id,
      deliveryStatus: tracking.deliveryStatus
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed.'
      },
      500
    );
  }
});

