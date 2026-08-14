
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebaseClient';
import { logoutUser, processGoogleRedirectResult } from '../services/authService';
import { setSupabaseFirebaseUid } from '../lib/supabase';
import {
  syncFirebaseUserToSupabase,
  getSupabaseUserByUid,
  SupabaseUserProfile,
} from '../services/supabaseSync';

// ─── Types ────────────────────────────────────────────────────────────────────

export type { SupabaseUserProfile };

export interface AuthContextType {
  /** Firebase authenticated user — null when signed out */
  user:           FirebaseUser | null;
  /** Firebase UID shortcut (same as user?.uid) */
  uid:            string | null;
  /** Full profile row from Supabase users table */
  profile:        SupabaseUserProfile | null;
  isLoading:      boolean;
  /** isAdmin is true only when profile.role === 'admin' from Supabase DB */
  isAdmin:        boolean;
  signOut:        () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user,      setUser]      = useState<FirebaseUser | null>(null);
  const [profile,   setProfile]   = useState<SupabaseUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    /**
     * Step 1: Handle Google redirect result (mobile sign-in).
     * Runs once on page load. If the user just returned from Google,
     * this syncs them to Supabase. The onAuthStateChanged below will
     * then fire with the authenticated Firebase user.
     */
    processGoogleRedirectResult().catch(console.error);

    /**
     * Step 2: Firebase auth state listener — single source of truth.
     * Fires immediately with the current user (or null) on mount,
     * and again whenever the user signs in or out.
     */
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!mounted) return;

      setUser(fbUser);
      setSupabaseFirebaseUid(fbUser?.uid || null);

      if (fbUser) {
        // Upsert Firebase user → Supabase users table
        const synced = await syncFirebaseUserToSupabase(fbUser);

        if (!mounted) return;

        if (synced) {
          // Blocked users are signed out immediately
          if (synced.status === 'blocked') {
            await logoutUser();
            setUser(null);
            setProfile(null);
            setIsLoading(false);
            return;
          }
          setProfile(synced);
        } else {
          // Fallback: try fetching the existing row
          const existing = await getSupabaseUserByUid(fbUser.uid);
          if (mounted) setProfile(existing);
        }
      } else {
        setProfile(null);
      }

      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const refreshProfile = async () => {
    if (!user) return;
    const updated = await getSupabaseUserByUid(user.uid);
    setProfile(updated);
  };

  const signOut = async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
  };

  // isAdmin is ONLY from the Supabase DB. ProtectedRoute re-verifies this
  // server-side on every admin page load for maximum security.
  const isAdmin = profile?.role === 'admin';

  // ── Value ─────────────────────────────────────────────────────────────────

  const value: AuthContextType = {
    user,
    uid:     user?.uid ?? null,
    profile,
    isLoading,
    isAdmin,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
