import { supabase } from '../lib/supabase';
import { canUseFeature } from './tenantConfigService';

export interface PaymentVerificationResult {
  success: boolean;
  orderId?: string;
  error?: string;
  transactionId?: string;
}

export interface BkashPaymentSessionResult {
  success: boolean;
  orderId?: string;
  paymentId?: string;
  bkashURL?: string;
  error?: string;
}

const buildTransactionId = () => `TXN_${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;

const extractInvokeErrorMessage = (error: unknown): string => {
  if (!error) return 'Unknown payment gateway error';
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const maybe = error as { message?: string; context?: string };
    if (maybe.message) return maybe.message;
    if (maybe.context) return maybe.context;
  }
  return 'Unknown payment gateway error';
};

export const startBkashPaymentSession = async (
  orderId: string,
  amount: number
): Promise<BkashPaymentSessionResult> => {
  try {
    if (!(await canUseFeature('payment_bkash'))) {
      return { success: false, error: 'bKash payment is disabled for this plan.' };
    }

    if (!orderId) {
      return { success: false, error: 'Missing order ID for bKash payment.' };
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: 'Invalid payment amount for bKash.' };
    }

    const { data, error } = await supabase.functions.invoke('bkash-create-payment', {
      body: {
        orderId,
        amount
      }
    });

    if (error) {
      return { success: false, error: extractInvokeErrorMessage(error) };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Failed to create bKash payment session.' };
    }

    return {
      success: true,
      orderId: data.orderId || orderId,
      paymentId: data.paymentId,
      bkashURL: data.bkashURL
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to create bKash payment session.' };
  }
};

export const verifyPaymentStatus = async (
  orderId: string,
  method: 'nogad'
): Promise<PaymentVerificationResult> => {
  try {
    if (method === 'nogad' && !(await canUseFeature('payment_nogad'))) {
      return { success: false, error: 'Nogad payment is disabled for this plan.' };
    }

    if (!orderId) {
      return { success: false, error: 'Missing order ID for payment verification.' };
    }

    const transactionId = buildTransactionId();
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        transaction_id: transactionId,
        paid_at: new Date().toISOString(),
        status: 'Processing',
        payment_method: method
      })
      .eq('id', orderId);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      orderId,
      transactionId
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Payment verification failed' };
  }
};

export const markPaymentFailed = async (orderId: string, message?: string): Promise<void> => {
  try {
    if (!orderId) return;
    await supabase
      .from('orders')
      .update({ payment_status: 'failed' })
      .eq('id', orderId);
  } catch (err) {
    console.error('Failed to mark payment as failed:', message || err);
  }
};

export const retryPayment = async (orderId: string): Promise<void> => {
  if (!orderId) {
    window.location.href = '/checkout';
    return;
  }
  window.location.href = `/checkout?orderId=${orderId}`;
};
