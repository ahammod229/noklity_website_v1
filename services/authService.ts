
import { supabase } from '../lib/supabase';

/**
 * Authentication Service
 * Handles user authentication operations using Supabase.
 */

export interface AuthResponse {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  error?: string;
}

const PROFILE_OPTIONAL_ERROR_CODES = new Set(['PGRST205', '42P01', 'PGRST116']);

const canProceedWithoutProfile = (error: { code?: string; message?: string } | null) => {
  if (!error) return false;
  if (error.code && PROFILE_OPTIONAL_ERROR_CODES.has(error.code)) return true;
  const message = error.message || '';
  return (
    message.includes("Could not find the table 'public.profiles'") ||
    message.includes('relation "profiles" does not exist') ||
    message.includes('Failed to fetch')
  );
};

/**
 * Logs in a user with email and password.
 */
export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    const userId = data.user?.id;
    if (!userId) {
      return { error: 'Authentication failed. Please try again.' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', userId)
      .single();

    if (profileError) {
      if (!canProceedWithoutProfile(profileError)) {
        await supabase.auth.signOut();
        return { error: 'Unable to verify account status. Please try again.' };
      }
      console.warn('Profile status check skipped:', profileError.message);
    }

    if (profile?.status === 'blocked') {
      await supabase.auth.signOut();
      return { error: 'Your account is blocked. Please contact support.' };
    }

    return {
      user: {
        id: userId,
        email: data.user.email!,
        name: data.user.user_metadata?.full_name
      }
    };
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred' };
  }
};

/**
 * Registers a new user.
 */
export const registerUser = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    // Check if session is null (email confirmation required)
    if (data.user && !data.session) {
      return { 
        // We return the user but note that confirmation might be needed in the UI
        user: {
          id: data.user.id,
          email: data.user.email!,
          name: name
        } 
      };
    }

    return {
      user: {
        id: data.user!.id,
        email: data.user!.email!,
        name: name
      }
    };
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred' };
  }
};

/**
 * Logs out the current user.
 */
export const logoutUser = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Error signing out:', error.message);
};

/**
 * Sends a password reset email.
 */
export const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`, // Ensure this route exists or redirects correctly
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};
