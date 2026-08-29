import { supabase } from '../lib/supabase';
import { auth } from './firebaseClient';

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
    const user = auth.currentUser;
    if (!user) return { ...DEFAULT_PREFERENCES };

    const { data, error } = await supabase
      .from('users')
      .select('notification_settings')
      .eq('uid', user.uid)
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
    const user = auth.currentUser;
    if (!user) return false;

    const payload = sanitizePreferences(preferences);
    const { error } = await supabase
      .from('users')
      .update({ notification_settings: payload })
      .eq('uid', user.uid);

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

// ════════════════════════════════════════════════════════════════
// IN-APP NOTIFICATIONS — CRUD & REALTIME
// ════════════════════════════════════════════════════════════════

export type NotificationType = 'order_placed' | 'order_status' | 'payment_status' | 'promo' | 'system';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface CreateNotificationPayload {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

/**
 * Fetch the latest notifications for a user (max 50).
 */
export const getNotifications = async (userId: string): Promise<AppNotification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to fetch notifications:', error.message);
      return [];
    }
    return (data || []) as AppNotification[];
  } catch (err) {
    console.error('Unexpected error fetching notifications:', err);
    return [];
  }
};

/**
 * Create a new notification for a user.
 */
export const createNotification = async (payload: CreateNotificationPayload): Promise<boolean> => {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: payload.user_id,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      link: payload.link || null,
    });

    if (error) {
      console.error('Failed to create notification:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unexpected error creating notification:', err);
    return false;
  }
};

/**
 * Mark a single notification as read.
 */
export const markAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to mark notification as read:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unexpected error marking notification:', err);
    return false;
  }
};

/**
 * Mark ALL notifications as read for a user.
 */
export const markAllAsRead = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Failed to mark all as read:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unexpected error marking all as read:', err);
    return false;
  }
};

/**
 * Delete a single notification.
 */
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to delete notification:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unexpected error deleting notification:', err);
    return false;
  }
};

/**
 * Get count of unread notifications for a user.
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Failed to get unread count:', error.message);
      return 0;
    }
    return count || 0;
  } catch (err) {
    console.error('Unexpected error getting unread count:', err);
    return 0;
  }
};

/**
 * Subscribe to realtime notification inserts for a user.
 * Returns an unsubscribe function.
 */
export const subscribeToNotifications = (
  userId: string,
  onNewNotification: (notification: AppNotification) => void
): (() => void) => {
  // Make channel name unique so multiple components (Header, Notifications) can subscribe simultaneously without colliding
  const uniqueId = Math.random().toString(36).substring(7);
  const channel = supabase
    .channel(`notifications:${userId}:${uniqueId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNewNotification(payload.new as AppNotification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
