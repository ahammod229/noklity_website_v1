
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
      .update(dbUpdates)
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', JSON.stringify(error, null, 2));
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unexpected error in updateProfile:', err);
    return false;
  }
};
