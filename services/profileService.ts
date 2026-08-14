import { supabase, uploadFile } from '../lib/supabase';
import { auth } from './firebaseClient';
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';

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
 * Retrieves the current user's profile from the `users` table (Firebase UID based).
 */
export const getProfile = async (): Promise<UserProfile | null> => {
  try {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('uid', firebaseUser.uid)
      .single();

    if (error || !data) {
      // Fallback to Firebase user data
      return {
        id: firebaseUser.uid,
        fullName: firebaseUser.displayName || '',
        email: firebaseUser.email || '',
        phone: '',
        avatarUrl: firebaseUser.photoURL || '',
        lastLogin: 'Just now',
        memberSince: new Date().toLocaleDateString()
      };
    }

    return {
      id: data.uid,
      fullName: data.display_name || firebaseUser.displayName || '',
      email: firebaseUser.email || data.email || '',
      phone: data.phone || '',
      avatarUrl: data.photo_url || firebaseUser.photoURL || '',
      lastLogin: 'Just now',
      memberSince: new Date(data.created_at).toLocaleDateString()
    };
  } catch (err) {
    console.error('Unexpected error in getProfile:', err);
    return null;
  }
};

/**
 * Updates the user's profile information in the `users` table.
 */
export const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
  try {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return false;

    const dbUpdates: any = {};
    if (updates.fullName !== undefined) dbUpdates.display_name = updates.fullName;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.avatarUrl !== undefined) dbUpdates.photo_url = updates.avatarUrl;

    const { error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('uid', firebaseUser.uid);

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

/**
 * Changes the Firebase user's password.
 */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<ServiceResult> => {
  try {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) {
      return { success: false, error: 'You must be logged in to change password.' };
    }

    // Re-authenticate with current password first
    if (currentPassword.trim()) {
      try {
        const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
        await reauthenticateWithCredential(firebaseUser, credential);
      } catch {
        return { success: false, error: 'Current password is incorrect.' };
      }
    }

    await updatePassword(firebaseUser, newPassword);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to change password.' };
  }
};

export const logoutAllSessions = async (): Promise<ServiceResult> => {
  try {
    await auth.signOut();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to log out.' };
  }
};

export const updateEmail = async (nextEmail: string): Promise<EmailUpdateResult> => {
  try {
    const targetEmail = nextEmail.trim().toLowerCase();
    if (!targetEmail) {
      return { success: false, error: 'Email is required.' };
    }

    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) {
      return { success: false, error: 'You must be logged in to update email.' };
    }

    if (firebaseUser.email.toLowerCase() === targetEmail) {
      return { success: true, requiresConfirmation: false };
    }

    // Update email in the users table
    const { error } = await supabase
      .from('users')
      .update({ email: targetEmail })
      .eq('uid', firebaseUser.uid);

    if (error) {
      return { success: false, error: error.message || 'Failed to update email.' };
    }

    // Note: changing email in Firebase requires verification — inform user
    return { success: true, requiresConfirmation: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update email.' };
  }
};

export const uploadProfileAvatar = async (file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return { success: false, error: 'You must be logged in to upload avatar.' };
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const path = `${firebaseUser.uid}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    let lastErrorMessage = '';
    let successBucket = '';
    let successPublicUrl = '';
    
    for (const bucketName of AVATAR_BUCKET_CANDIDATES) {
      try {
        const { publicUrl } = await uploadFile(bucketName, path, file, { upsert: false });
        successBucket = bucketName;
        successPublicUrl = publicUrl;
        break;
      } catch (err: any) {
        const message = String(err.message || '');
        lastErrorMessage = message || lastErrorMessage;
        if (isBucketNotFoundError(message)) {
          continue;
        }
        return { success: false, error: toFriendlyAvatarUploadError(message) };
      }
    }

    if (!successBucket) {
      return { success: false, error: `Failed to upload avatar: ${lastErrorMessage || 'Bucket not found'}` };
    }

    // Save the new avatar URL in the users table
    await supabase
      .from('users')
      .update({ photo_url: successPublicUrl })
      .eq('uid', firebaseUser.uid);

    return { success: true, url: successPublicUrl };

  } catch (err: any) {
    return { success: false, error: toFriendlyAvatarUploadError(err?.message) };
  }
};
