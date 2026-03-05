import { supabase } from '../lib/supabase';

export interface NotificationPreferences {
  orderConfirmations: boolean;
  shippingUpdates: boolean;
  deliveryNotifications: boolean;
  orderCancellations: boolean;
  flashSales: boolean;
  discounts: boolean;
  newProducts: boolean;
  loginAlerts: boolean;
  passwordChanges: boolean;
  accountUpdates: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  orderConfirmations: true,
  shippingUpdates: true,
  deliveryNotifications: true,
  orderCancellations: true,
  flashSales: false,
  discounts: true,
  newProducts: false,
  loginAlerts: true,
  passwordChanges: true,
  accountUpdates: true,
  email: true,
  sms: false,
  whatsapp: true,
};

const PROFILE_NOTIFICATIONS_COLUMN_MISSING_CODES = new Set(['42703', 'PGRST204', 'PGRST205']);

const isNotificationColumnMissing = (error: unknown) => {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code || '') : '';
  const message =
    typeof error === 'object' && error && 'message' in error ? String((error as { message?: string }).message || '') : '';

  if (PROFILE_NOTIFICATIONS_COLUMN_MISSING_CODES.has(code)) return true;
  return (
    message.includes('notification_settings') ||
    message.includes("Could not find the column 'notification_settings'") ||
    message.includes('column "notification_settings" does not exist')
  );
};

const sanitizePreferences = (raw: unknown): NotificationPreferences => {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const result: NotificationPreferences = { ...DEFAULT_PREFERENCES };
  for (const key of Object.keys(DEFAULT_PREFERENCES) as Array<keyof NotificationPreferences>) {
    const value = source[key];
    if (typeof value === 'boolean') {
      result[key] = value;
    } else if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim();
      if (normalized === 'true' || normalized === '1') result[key] = true;
      if (normalized === 'false' || normalized === '0') result[key] = false;
    }
  }
  return result;
};

/**
 * Retrieves the current user's notification preferences.
 */
export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return { ...DEFAULT_PREFERENCES };

    const { data, error } = await supabase
      .from('profiles')
      .select('notification_settings')
      .eq('id', user.id)
      .single();

    if (error) {
      if (isNotificationColumnMissing(error)) {
        console.warn('profiles.notification_settings is missing. Run latest supabase/schema.sql to enable persistent notifications.');
        return { ...DEFAULT_PREFERENCES };
      }
      console.warn('Notification preferences fetch warning:', error.message);
      return { ...DEFAULT_PREFERENCES };
    }

    return sanitizePreferences((data as { notification_settings?: unknown })?.notification_settings);
  } catch (error) {
    console.warn('Notification preferences fallback:', error);
    return { ...DEFAULT_PREFERENCES };
  }
};

/**
 * Updates the user's notification preferences.
 */
export const updateNotificationPreferences = async (preferences: NotificationPreferences): Promise<boolean> => {
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return false;

    const payload = sanitizePreferences(preferences);
    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email || '',
          notification_settings: payload
        },
        { onConflict: 'id' }
      );

    if (error) {
      if (isNotificationColumnMissing(error)) {
        console.error('Cannot save notification preferences because profiles.notification_settings is missing.');
      } else {
        console.error('Failed to update notification preferences:', error.message);
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected notification update error:', error);
    return false;
  }
};

/**
 * Resets preferences to factory defaults.
 */
export const resetNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const defaults = { ...DEFAULT_PREFERENCES };
  await updateNotificationPreferences(defaults);
  return defaults;
};
