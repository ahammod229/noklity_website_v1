import { supabase } from '../lib/supabase';

export interface PaymentVerificationResult {
  success: boolean;
  orderId?: string;
  error?: string;
  transactionId?: string;
}

const buildTransactionId = () => `TXN_${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;

export const verifyPaymentStatus = async (
  orderId: string,
  method: 'bkash' | 'nogad'
): Promise<PaymentVerificationResult> => {
  try {
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
