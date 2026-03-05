
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

interface EmailUpdateResult extends ServiceResult {
  requiresConfirmation?: boolean;
}

const AVATAR_BUCKET_CANDIDATES = [
  (import.meta.env.VITE_PROFILE_AVATAR_BUCKET || '').trim(),
  'avatars',
  'profile-avatars',
  'profile-images'
].filter((value, index, self) => value && self.indexOf(value) === index);

const isBucketNotFoundError = (message: string) => message.toLowerCase().includes('bucket not found');

const toFriendlyAvatarUploadError = (message?: string) => {
  const normalized = String(message || '').trim();
  if (!normalized) return 'Failed to upload avatar.';
  if (isBucketNotFoundError(normalized)) {
    return "Avatar storage is not configured yet. Please run `supabase/avatar_bucket_fix.sql` in Supabase SQL Editor.";
  }
  if (normalized.toLowerCase().includes('row-level security') || normalized.toLowerCase().includes('permission')) {
    return 'You do not have permission to upload this avatar. Please sign in again and try.';
  }
  return normalized;
};

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
        avatarUrl: user.user_metadata?.avatar_url || '',
        lastLogin: new Date().toLocaleDateString(),
        memberSince: new Date(user.created_at).toLocaleDateString()
      };
    }

    return {
      id: data.id,
      fullName: data.full_name || user.user_metadata?.full_name || '',
      email: user.email || data.email || '',
      phone: data.phone || '',
      avatarUrl: data.avatar_url || user.user_metadata?.avatar_url || '',
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
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

    const basePayload = {
      id: user.id,
      email: user.email || updates.email || ''
    };

    let { error } = await supabase
      .from('profiles')
      .upsert(
        {
          ...basePayload,
          ...dbUpdates
        },
        { onConflict: 'id' }
      );

    if (error) {
      const missingAvatarColumn =
        String(error.message || '').includes('avatar_url') ||
        String(error.details || '').includes('avatar_url') ||
        error.code === '42703';

      if (missingAvatarColumn && dbUpdates.avatar_url !== undefined) {
        delete dbUpdates.avatar_url;
        const retry = await supabase
          .from('profiles')
          .upsert(
            {
              ...basePayload,
              ...dbUpdates
            },
            { onConflict: 'id' }
          );
        error = retry.error;
      }

      if (error) {
        console.error('Error updating profile:', JSON.stringify(error, null, 2));
        return false;
      }
    }

    if (updates.fullName !== undefined) {
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          full_name: updates.fullName,
          ...(updates.avatarUrl !== undefined ? { avatar_url: updates.avatarUrl } : {})
        }
      });
      if (authUpdateError) {
        console.warn('Auth metadata update warning:', authUpdateError.message);
      }
    } else if (updates.avatarUrl !== undefined) {
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { avatar_url: updates.avatarUrl }
      });
      if (authUpdateError) {
        console.warn('Avatar metadata update warning:', authUpdateError.message);
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

export const updateEmail = async (nextEmail: string): Promise<EmailUpdateResult> => {
  try {
    const targetEmail = nextEmail.trim().toLowerCase();
    if (!targetEmail) {
      return { success: false, error: 'Email is required.' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return { success: false, error: 'You must be logged in to update email.' };
    }

    if (user.email.toLowerCase() === targetEmail) {
      return { success: true, requiresConfirmation: false };
    }

    const { data, error } = await supabase.auth.updateUser({ email: targetEmail });
    if (error) {
      return { success: false, error: error.message || 'Failed to update email.' };
    }

    const currentEmail = (data.user?.email || user.email || '').toLowerCase();
    const requiresConfirmation = currentEmail !== targetEmail;

    if (!requiresConfirmation) {
      await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: targetEmail
          },
          { onConflict: 'id' }
        );
    }

    return { success: true, requiresConfirmation };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update email.' };
  }
};

export const uploadProfileAvatar = async (file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'You must be logged in to upload avatar.' };
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    let lastErrorMessage = '';
    for (const bucketName of AVATAR_BUCKET_CANDIDATES) {
      const { error: uploadError } = await supabase.storage.from(bucketName).upload(path, file, { upsert: false });
      if (uploadError) {
        const message = String(uploadError.message || '');
        lastErrorMessage = message || lastErrorMessage;
        if (isBucketNotFoundError(message)) {
          continue;
        }
        return { success: false, error: toFriendlyAvatarUploadError(message) };
      }

      const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
      if (!data?.publicUrl) {
        return { success: false, error: 'Avatar uploaded, but failed to build public URL.' };
      }

      return { success: true, url: data.publicUrl };
    }

    return {
      success: false,
      error: toFriendlyAvatarUploadError(lastErrorMessage || 'Bucket not found')
    };
  } catch (err: any) {
    return { success: false, error: toFriendlyAvatarUploadError(err?.message) };
  }
};
