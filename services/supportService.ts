import { supabase } from '../lib/supabase';

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
  try {
    const { data: authData } = await supabase.auth.getUser();

    const { error } = await supabase.from('support_tickets').insert({
      user_id: authData.user?.id || null,
      name: data.name,
      email: data.email,
      channel: 'email',
      subject: data.subject,
      message: data.message,
      status: 'Pending',
      priority: 'Normal'
    });

    if (error) throw error;

    return {
      success: true,
      message: 'Your support request has been submitted successfully.'
    };
  } catch (error: any) {
    console.error('Support ticket submission failed:', error);
    return {
      success: false,
      message: error?.message || 'Failed to submit support request.'
    };
  }
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
