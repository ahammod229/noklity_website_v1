/**
 * Payment Service (Placeholder)
 * 
 * This service will eventually handle real payment gateway integrations 
 * like Stripe, PayPal, or Razorpay.
 */

export interface PaymentVerificationResult {
  success: boolean;
  orderId?: string;
  error?: string;
  transactionId?: string;
}

/**
 * Verifies the payment status with the backend/gateway after a redirect.
 * 
 * @param sessionId - The session or transaction ID from the gateway
 * @returns Promise resolving to verification status
 */
export const verifyPaymentStatus = async (sessionId: string): Promise<PaymentVerificationResult> => {
  // MOCK BEHAVIOR: Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 1500));

  /* 
    TODO: BACKEND INTEGRATION
    1. Call backend API (e.g., /api/payments/verify)
    2. Backend should verify the session with the Payment Provider (e.g., Stripe API)
    3. Update the order status in Supabase/Database to 'Paid' or 'Processing'
    4. Send confirmation emails/notifications
  */

  // For UI demo, we assume success unless the ID contains 'fail'
  if (sessionId.includes('fail')) {
    return {
      success: false,
      error: 'Your card was declined. Please check your balance or try a different method.',
      transactionId: 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase()
    };
  }

  return {
    success: true,
    orderId: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
    transactionId: 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase()
  };
};

/**
 * Re-initiates the payment process for a failed order.
 * 
 * @param orderId - The ID of the order to retry
 */
export const retryPayment = async (orderId: string): Promise<void> => {
  /*
    TODO: REDIRECT TO GATEWAY
    1. Fetch order details from DB
    2. Create a new Payment Session with the provider
    3. Redirect user back to the hosted checkout page
  */
  console.log(`[Mock Payment] Retrying payment for order ${orderId}`);
  window.location.href = '/checkout';
};