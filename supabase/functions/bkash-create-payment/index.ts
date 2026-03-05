import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, jsonResponse, withCors } from '../_shared/cors.ts';
import {
  appendQueryParam,
  bkashErrorMessage,
  createBkashPayment,
  grantBkashToken,
  isBkashSuccess,
  loadBkashConfig,
  normalizeAmount
} from '../_shared/bkash.ts';

interface CreatePaymentPayload {
  orderId?: string;
  amount?: number;
  payerReference?: string;
}

const isBkashFeatureEnabled = async (adminClient: ReturnType<typeof createClient>) => {
  const { data, error } = await adminClient
    .from('site_settings')
    .select('key,value')
    .in('key', ['tenant_plan_name', 'tenant_feature_flags']);

  if (error || !data) return true;

  const rows = data as Array<{ key: string; value: string }>;
  const map = new Map(rows.map((row) => [row.key, row.value || '']));
  const plan = String(map.get('tenant_plan_name') || 'Enterprise').toLowerCase();
  const planAllows = plan === 'basic' || plan === 'pro' || plan === 'enterprise';

  if (!planAllows) return false;

  const rawFlags = map.get('tenant_feature_flags');
  if (!rawFlags) return true;
  try {
    const parsed = JSON.parse(rawFlags) as Record<string, unknown>;
    if (!('payment_bkash' in parsed)) return true;
    return parsed.payment_bkash === true || String(parsed.payment_bkash).toLowerCase() === 'true';
  } catch {
    return true;
  }
};

const getEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing function environment variable: ${key}`);
  return value;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return withCors(new Response('ok', { headers: corsHeaders }));
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  try {
    const payload = (await req.json()) as CreatePaymentPayload;
    const orderId = String(payload.orderId || '').trim();
    if (!orderId) {
      return jsonResponse({ success: false, error: 'orderId is required.' }, 400);
    }

    const supabaseUrl = getEnv('SUPABASE_URL');
    const anonKey = getEnv('SUPABASE_ANON_KEY');
    const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
    const authHeader = (req.headers.get('Authorization') || '').trim();
    const isAnonAuthorization = authHeader === `Bearer ${anonKey}`;
    const shouldTryUserAuth = Boolean(authHeader) && !isAnonAuthorization;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: shouldTryUserAuth
        ? {
            headers: {
              Authorization: authHeader
            }
          }
        : undefined
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const bkashEnabled = await isBkashFeatureEnabled(adminClient);
    if (!bkashEnabled) {
      return jsonResponse({ success: false, error: 'bKash payment is disabled for this plan.' }, 403);
    }

    let requesterUserId: string | null = null;
    if (shouldTryUserAuth) {
      const {
        data: { user },
        error: userError
      } = await userClient.auth.getUser();
      if (!userError && user?.id) {
        requesterUserId = user.id;
      } else {
        return jsonResponse({ success: false, error: userError?.message || 'Unauthorized' }, 401);
      }
    }

    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('id,user_id,total_amount,payment_status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return jsonResponse({ success: false, error: 'Order not found.' }, 404);
    }
    const orderUserId = (order.user_id as string | null) || null;
    if (requesterUserId && orderUserId !== requesterUserId) {
      return jsonResponse({ success: false, error: 'Order not found for this user.' }, 404);
    }
    if (!requesterUserId && orderUserId) {
      return jsonResponse({ success: false, error: 'Authentication required for this order.' }, 401);
    }
    if (String(order.payment_status || '').toLowerCase() === 'paid') {
      return jsonResponse({ success: false, error: 'This order is already paid.' }, 409);
    }

    const amount = Number.isFinite(payload.amount) && Number(payload.amount) > 0 ? Number(payload.amount) : Number(order.total_amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return jsonResponse({ success: false, error: 'Invalid payable amount.' }, 400);
    }

    const config = loadBkashConfig();
    const token = await grantBkashToken(config);
    const callbackURL = appendQueryParam(config.callbackUrl, 'orderId', orderId);
    const payerReference = String(payload.payerReference || requesterUserId || 'guest').slice(0, 255) || 'customer';
    const merchantInvoiceNumber = `order-${orderId}`;

    const created = await createBkashPayment(config, token, {
      amount: normalizeAmount(amount),
      callbackURL,
      merchantInvoiceNumber,
      payerReference,
      currency: config.currency,
      intent: config.intent
    });

    if (!isBkashSuccess(created)) {
      return jsonResponse(
        {
          success: false,
          error: `bKash create failed: ${bkashErrorMessage(created)}`,
          gateway: created
        },
        400
      );
    }

    const paymentId = String(created.paymentID || created.paymentId || '').trim();
    const bkashURL = String(created.bkashURL || created.redirectURL || '').trim();
    if (!paymentId || !bkashURL) {
      return jsonResponse(
        {
          success: false,
          error: 'bKash did not return paymentID or redirect URL.',
          gateway: created
        },
        502
      );
    }

    const updateQuery = adminClient
      .from('orders')
      .update({
        payment_method: 'bkash',
        payment_status: 'pending',
        status: 'Pending',
        transaction_id: paymentId
      })
      .eq('id', orderId);

    if (requesterUserId) {
      await updateQuery.eq('user_id', requesterUserId);
    } else {
      await updateQuery.is('user_id', null);
    }

    return jsonResponse({
      success: true,
      orderId,
      paymentId,
      bkashURL
    });
  } catch (error: unknown) {
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected bKash setup error.'
      },
      500
    );
  }
});
