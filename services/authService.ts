
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

    return {
      user: {
        id: data.user.id,
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
