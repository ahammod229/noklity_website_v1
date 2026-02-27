
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  lastLogin: string;
  memberSince: string;
}

interface ServiceResult {
  success: boolean;
  error?: string;
}

/**
 * Retrieves the current user's profile details.
 */
export const getProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', JSON.stringify(error, null, 2));
      // Fallback to basic auth data if profile row missing
      return {
        id: user.id,
        fullName: user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: '',
        lastLogin: new Date().toLocaleDateString(),
        memberSince: new Date(user.created_at).toLocaleDateString()
      };
    }

    return {
      id: data.id,
      fullName: data.full_name || user.user_metadata?.full_name || '',
      email: data.email || user.email || '',
      phone: data.phone || '',
      lastLogin: 'Just now', // Placeholder as auth logs aren't exposed directly
      memberSince: new Date(data.created_at).toLocaleDateString()
    };
  } catch (err) {
    console.error('Unexpected error in getProfile:', err);
    return null;
  }
};

/**
 * Updates the user's profile information.
 */
export const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const dbUpdates: any = {};
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;

    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email || '',
          ...dbUpdates
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Error updating profile:', JSON.stringify(error, null, 2));
      return false;
    }

    if (updates.fullName !== undefined) {
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { full_name: updates.fullName }
      });
      if (authUpdateError) {
        console.warn('Auth metadata update warning:', authUpdateError.message);
      }
    }

    return true;
  } catch (err) {
    console.error('Unexpected error in updateProfile:', err);
    return false;
  }
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<ServiceResult> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return { success: false, error: 'You must be logged in to change password.' };
    }

    if (currentPassword.trim()) {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });
      if (reauthError) {
        return { success: false, error: 'Current password is incorrect.' };
      }
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { success: false, error: error.message || 'Failed to update password.' };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to change password.' };
  }
};

export const logoutAllSessions = async (): Promise<ServiceResult> => {
  try {
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) {
      return { success: false, error: error.message || 'Failed to log out all sessions.' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to log out all sessions.' };
  }
};
