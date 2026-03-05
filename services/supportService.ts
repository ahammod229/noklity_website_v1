import { supabase } from '../lib/supabase';
import { canUseFeature } from './tenantConfigService';
import { getTenantConfigSnapshot } from './tenantConfigService';

// Types for support interactions
export interface SupportTicketData {
  name: string;
  email: string;
  phone?: string;
  channel?: 'email' | 'whatsapp' | 'web';
  subject: string;
  message: string;
}

const normalizeSupportPhone = (phone: string) => {
  const compact = phone.trim();
  if (!compact) return '';

  if (compact.startsWith('+')) {
    return `+${compact.slice(1).replace(/\D/g, '')}`;
  }

  if (compact.startsWith('00')) {
    return `+${compact.slice(2).replace(/\D/g, '')}`;
  }

  return compact.replace(/\D/g, '');
};

/**
 * Service to handle Help & Support interactions.
 * Currently uses mock data and console logging.
 */

/**
 * Sends a support ticket request from storefront.
 * 
 * @param data - The support ticket details
 * @returns Promise resolving to success status
 */
export const sendSupportTicket = async (data: SupportTicketData): Promise<{ success: boolean; message: string }> => {
  try {
    const supportEnabled = await canUseFeature('support_tickets');
    if (!supportEnabled) {
      return {
        success: false,
        message: 'Support ticket feature is disabled for this plan.'
      };
    }

    const name = (data.name || '').trim();
    const email = (data.email || '').trim();
    const subject = (data.subject || '').trim();
    const message = (data.message || '').trim();
    const phone = normalizeSupportPhone(data.phone || '');
    const channel = (data.channel || 'web') as 'email' | 'whatsapp' | 'web';

    if (!name || !email || !subject || !message) {
      return {
        success: false,
        message: 'Please fill name, email, subject, and message.'
      };
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.warn('Support ticket auth check warning:', authError.message);
    }

    const payload = {
      user_id: authData.user?.id || null,
      name,
      email,
      phone: phone || null,
      channel,
      subject,
      message,
      status: 'Pending',
      priority: 'Normal'
    };

    let { error } = await supabase.from('support_tickets').insert(payload);
    if (error && authData.user?.id && error.code === '23503') {
      // If profile row is missing for this auth user, fall back to guest ticket so submission still works.
      const fallback = await supabase.from('support_tickets').insert({ ...payload, user_id: null });
      error = fallback.error || null;
    }
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
 * Backward-compatible helper used by older callers.
 */
export const sendSupportEmail = async (data: SupportTicketData): Promise<{ success: boolean; message: string }> => {
  return sendSupportTicket({ ...data, channel: 'email' });
};

/**
 * Initiates the WhatsApp chat flow.
 * 
 * @param phoneNumber - The support phone number (default: provided in requirements)
 * @param defaultMessage - The pre-filled message for the chat
 */
export const openWhatsAppChat = (
  phoneNumber?: string,
  defaultMessage?: string
): void => {
  const tenantConfig = getTenantConfigSnapshot();
  const targetNumber = phoneNumber || tenantConfig.companyPhone || '+15551234567';
  const message = defaultMessage || `Hello ${tenantConfig.brandName}, I need assistance with an order.`;

  // MOCK BEHAVIOR
  console.log('MOCK: Opening WhatsApp Chat');
  console.log(`Target: ${targetNumber}`);

  /* 
    TODO: BACKEND INTEGRATION
    1. Log "Click to Chat" event to analytics/database
    2. Optional: Fetch dynamic support number based on user region or agent availability
  */

  // Logic to open WhatsApp Web or App
  const cleanedNumber = targetNumber.replace(/[^0-9]/g, '');
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${cleanedNumber}?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
};
