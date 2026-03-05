import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, withCors } from '../_shared/cors.ts';
import {
  executeBkashPayment,
  extractOrderIdFromInvoice,
  grantBkashToken,
  isBkashSuccess,
  loadBkashConfig,
  queryBkashPayment
} from '../_shared/bkash.ts';

const getEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing function environment variable: ${key}`);
  return value;
};

const getLower = (value: unknown) => String(value || '').trim().toLowerCase();

const redirect = (url: string) =>
  withCors(
    new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: url
      }
    })
  );

const asObject = (value: unknown): Record<string, unknown> => {
  if (typeof value === 'object' && value !== null) return value as Record<string, unknown>;
  return {};
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return withCors(new Response('ok', { headers: corsHeaders }));
  }

  const config = (() => {
    try {
      return loadBkashConfig();
    } catch {
      return null;
    }
  })();

  const defaultStoreUrl = config?.storefrontUrl || (Deno.env.get('STORE_FRONTEND_URL') || '').replace(/\/+$/, '') || 'http://localhost:3000';

  const failUrl = (orderId?: string) =>
    orderId ? `${defaultStoreUrl}/payment-failed/${encodeURIComponent(orderId)}` : `${defaultStoreUrl}/payment-failed`;
  const successUrl = (orderId: string) => `${defaultStoreUrl}/payment-success/${encodeURIComponent(orderId)}`;

  try {
    if (!config) {
      return redirect(failUrl());
    }

    let body: Record<string, unknown> = {};
    if (req.method === 'POST') {
      try {
        body = asObject(await req.json());
      } catch {
        body = {};
      }
    }

    const reqUrl = new URL(req.url);
    const query = reqUrl.searchParams;
    const status = getLower(query.get('status') || body.status);
    const paymentID = String(query.get('paymentID') || body.paymentID || body.paymentId || '').trim();
    let orderId = String(query.get('orderId') || body.orderId || '').trim();

    const supabaseUrl = getEnv('SUPABASE_URL');
    const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (status === 'cancel' || status === 'cancelled' || status === 'failure' || status === 'failed') {
      if (orderId) {
        await adminClient
          .from('orders')
          .update({
            payment_status: 'failed',
            status: 'Cancelled'
          })
          .eq('id', orderId);
      }
      return redirect(failUrl(orderId));
    }

    if (status !== 'success') {
      return redirect(failUrl(orderId));
    }

    if (!paymentID) {
      return redirect(failUrl(orderId));
    }

    const token = await grantBkashToken(config);
    let finalPayload = asObject(await executeBkashPayment(config, token, paymentID));
    let executionOk = isBkashSuccess(finalPayload);

    if (!executionOk) {
      const fallback = asObject(await queryBkashPayment(config, token, paymentID));
      const txStatus = getLower(fallback.transactionStatus || fallback.transaction_status);
      if (isBkashSuccess(fallback) && (txStatus === '' || txStatus === 'completed' || txStatus === 'success')) {
        finalPayload = fallback;
        executionOk = true;
      }
    }

    if (!executionOk) {
      if (orderId) {
        await adminClient
          .from('orders')
          .update({
            payment_status: 'failed',
            status: 'Cancelled'
          })
          .eq('id', orderId);
      }
      return redirect(failUrl(orderId));
    }

    const invoiceFromGateway = String(finalPayload.merchantInvoiceNumber || finalPayload.merchant_invoice_number || '').trim();
    if (!orderId && invoiceFromGateway) {
      orderId = extractOrderIdFromInvoice(invoiceFromGateway);
    }

    if (!orderId) {
      return redirect(failUrl());
    }

    const trxId = String(finalPayload.trxID || finalPayload.trxId || paymentID).trim();
    await adminClient
      .from('orders')
      .update({
        payment_method: 'bkash',
        payment_status: 'paid',
        status: 'Processing',
        transaction_id: trxId,
        paid_at: new Date().toISOString()
      })
      .eq('id', orderId);

    return redirect(successUrl(orderId));
  } catch (error) {
    console.error('[bkash-callback] failed', error instanceof Error ? error.message : error);
    return redirect(failUrl());
  }
});
