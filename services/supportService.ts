// Types for support interactions
export interface SupportTicketData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Service to handle Help & Support interactions.
 * Currently uses mock data and console logging.
 */

/**
 * Sends a support email request.
 * 
 * @param data - The support ticket details
 * @returns Promise resolving to success status
 */
export const sendSupportEmail = async (data: SupportTicketData): Promise<{ success: boolean; message: string }> => {
  // MOCK BEHAVIOR
  console.log('-----------------------------------');
  console.log('MOCK: Sending Support Email');
  console.log('To: support@noklity.com');
  console.log('From:', data.email);
  console.log('Subject:', data.subject);
  console.log('Message:', data.message);
  console.log('-----------------------------------');

  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 1500));

  /* 
    TODO: BACKEND INTEGRATION
    1. Validate input data (Zod or similar)
    2. Call Supabase Edge Function or backend API endpoint (e.g., /api/support/email)
    3. Integration with email provider (Resend, SendGrid, AWS SES)
    4. Save ticket record to 'support_tickets' table in Supabase for history
    5. Handle error states (rate limiting, invalid email, server errors)
  */

  return {
    success: true,
    message: 'Your support request has been sent successfully.',
  };
};

/**
 * Initiates the WhatsApp chat flow.
 * 
 * @param phoneNumber - The support phone number (default: provided in requirements)
 * @param defaultMessage - The pre-filled message for the chat
 */
export const openWhatsAppChat = (
  phoneNumber: string = '+8801713812668', 
  defaultMessage: string = 'Hello NOKLITY, I need assistance with an order.'
): void => {
  // MOCK BEHAVIOR
  console.log('MOCK: Opening WhatsApp Chat');
  console.log(`Target: ${phoneNumber}`);

  /* 
    TODO: BACKEND INTEGRATION
    1. Log "Click to Chat" event to analytics/database
    2. Optional: Fetch dynamic support number based on user region or agent availability
  */

  // Logic to open WhatsApp Web or App
  const cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
  const encodedMessage = encodeURIComponent(defaultMessage);
  const whatsappUrl = `https://wa.me/${cleanedNumber}?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
};
