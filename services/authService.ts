
/**
 * Authentication Service — Firebase Only
 *
 * Firebase handles ALL authentication:
 *   - Email / Password sign-up and sign-in
 *   - Google Sign-In (popup on desktop, redirect on mobile)
 *   - Password reset emails
 *   - Email verification
 *
 * After every successful sign-in, the user is synced to Supabase `users`
 * table so their profile data is available for database operations.
 *
 * Supabase is used ONLY as a database. No supabase.auth.* calls are made here.
 */

import { auth } from './firebaseClient';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword as firebaseUpdatePassword,
  updateEmail   as firebaseUpdateEmail,
  signInWithCredential
} from 'firebase/auth';
import { syncFirebaseUserToSupabase } from './supabaseSync';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  user?: {
    id:    string; // Firebase UID
    email: string;
    name?: string;
  };
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isMobileDevice = () =>
  typeof navigator !== 'undefined' &&
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

/**
 * Maps Firebase error codes to user-friendly messages.
 */
const mapFirebaseError = (code: string): string => {
  const map: Record<string, string> = {
    'auth/email-already-in-use':   'This email is already registered. Please log in.',
    'auth/invalid-email':          'Invalid email address.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/user-not-found':         'No account found with this email.',
    'auth/wrong-password':         'Incorrect password.',
    'auth/invalid-credential':     'Invalid email or password.',
    'auth/too-many-requests':      'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-blocked':          'Popup blocked. Allow popups for this site.',
    'auth/unauthorized-domain':    'Domain not authorized. Contact support.',
    'auth/operation-not-allowed':  'Sign-in method not enabled. Contact support.',
    'auth/requires-recent-login':  'Please log out and log in again before making this change.',
    'auth/user-disabled':          'This account has been disabled. Contact support.',
  };
  return map[code] ?? 'Something went wrong. Please try again.';
};

// ─── Email / Password Login ───────────────────────────────────────────────────

/**
 * Signs in with email and password via Firebase.
 * On success, syncs/updates the user record in Supabase.
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);

    // Sync to Supabase users table (upsert — never creates duplicates)
    const profile = await syncFirebaseUserToSupabase(user);

    // Blocked account check
    if (profile?.status === 'blocked') {
      await firebaseSignOut(auth);
      return { error: 'Your account has been blocked. Please contact support.' };
    }

    return {
      user: {
        id:    user.uid,
        email: user.email!,
        name:  user.displayName ?? undefined,
      },
    };
  } catch (err: any) {
    return { error: mapFirebaseError(err.code) };
  }
};

// ─── Email / Password Registration ───────────────────────────────────────────

/**
 * Creates a new Firebase user and syncs them to Supabase.
 * Firebase sends the verification email from the configured template.
 */
export const registerUser = async (
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    // Set display name
    await firebaseUpdateProfile(user, { displayName: name }).catch(() => {});

    // Send verification email (non-fatal)
    await sendEmailVerification(user).catch(() => {});

    // Sync to Supabase users table
    await syncFirebaseUserToSupabase(user);

    return {
      user: {
        id:    user.uid,
        email: user.email!,
        name,
      },
    };
  } catch (err: any) {
    return { error: mapFirebaseError(err.code) };
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logoutUser = async (): Promise<void> => {
  await firebaseSignOut(auth).catch(() => {});
};

// ─── Password Reset ───────────────────────────────────────────────────────────

/**
 * Sends a password reset email via Firebase.
 */
export const resetPassword = async (
  email: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/login`,
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: mapFirebaseError(err.code) };
  }
};

// ─── Change Password ──────────────────────────────────────────────────────────

/**
 * Re-authenticates and updates the password via Firebase.
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      return { success: false, error: 'You must be logged in to change your password.' };
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await firebaseUpdatePassword(user, newPassword);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: mapFirebaseError(err.code) };
  }
};

// ─── Change Email ─────────────────────────────────────────────────────────────

/**
 * Updates the user's email via Firebase (requires recent sign-in).
 */
export const changeEmail = async (
  newEmail: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'You must be logged in.' };

    await firebaseUpdateEmail(user, newEmail);

    // Sync updated email to Supabase
    await syncFirebaseUserToSupabase(user);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: mapFirebaseError(err.code) };
  }
};

// ─── Google Sign-In ───────────────────────────────────────────────────────────

/**
 * Google Sign-In:
 * - Mobile  → signInWithRedirect (full-page, avoids popup issues)
 * - Desktop → signInWithPopup    (faster UX, no page navigation)
 *
 * Result is synced to Supabase users table automatically.
 */
export const signInWithGoogle = async (): Promise<AuthResponse> => {
  try {
    let user;

    if (Capacitor.isNativePlatform() || Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
      // Native Mobile (Capacitor Android/iOS) - Use native Google Sign-in to bypass WebView restrictions
      const result = await FirebaseAuthentication.signInWithGoogle();
      const credential = GoogleAuthProvider.credential(
        result.credential?.idToken,
        result.credential?.accessToken
      );
      const userCredential = await signInWithCredential(auth, credential);
      user = userCredential.user;
    } else {
      // Web Browser
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      if (isMobileDevice()) {
        // Mobile browser: navigates away — result handled by processGoogleRedirectResult()
        await signInWithRedirect(auth, provider);
        return {}; // Never reached — page redirects
      }

      // Desktop browser: popup
      const result = await signInWithPopup(auth, provider);
      user = result.user;
    }

    const profile = await syncFirebaseUserToSupabase(user);

    if (profile?.status === 'blocked') {
      await firebaseSignOut(auth);
      return { error: 'Your account has been blocked. Please contact support.' };
    }

    return {
      user: {
        id:    user.uid,
        email: user.email!,
        name:  user.displayName ?? undefined,
      },
    };
  } catch (err: any) {
    if (
      err.code === 'auth/popup-closed-by-user' ||
      err.code === 'auth/cancelled-popup-request' ||
      err.message?.includes('12501') // Google Sign-in cancelled error code on Android
    ) {
      return { error: 'Sign-in was cancelled.' };
    }
    return { error: mapFirebaseError(err.code) };
  }
};

/**
 * Call once on app startup (AuthContext).
 * Processes the Google redirect result after the user returns from Google on mobile.
 * Returns null if this is a normal page load (no pending redirect).
 */
export const processGoogleRedirectResult = async (): Promise<AuthResponse | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null; // Normal page load

    const { user } = result;
    const profile = await syncFirebaseUserToSupabase(user);

    if (profile?.status === 'blocked') {
      await firebaseSignOut(auth);
      return { error: 'Your account has been blocked. Please contact support.' };
    }

    return {
      user: {
        id:    user.uid,
        email: user.email!,
        name:  user.displayName ?? undefined,
      },
    };
  } catch (err: any) {
    if (err.code === 'auth/popup-closed-by-user') return null;
    return { error: mapFirebaseError(err.code) };
  }
};
