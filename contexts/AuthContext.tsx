
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  clearSupabaseStoredSession,
  readSupabaseStoredSession
} from '../utils/supabaseAuthStorage';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  phone?: string;
  role: 'user' | 'admin';
  status?: 'active' | 'blocked';
  created_at?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL_ALLOWLIST = (
  ((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ADMIN_EMAILS) || '') as string
)
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const isAllowlistedAdminEmail = (email?: string | null) => {
  if (!email) return false;
  return ADMIN_EMAIL_ALLOWLIST.includes(email.toLowerCase());
};

const getSupabaseUrl = () =>
  (
    ((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
      (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : '') ||
      '') as string
  ).trim();

const PROFILE_TABLE_MISSING_ERROR_CODES = new Set(['PGRST205', '42P01']);

const isProfilesTableMissing = (error: unknown) => {
  const code = typeof error === 'object' && error && 'code' in error ? (error as { code?: string }).code : undefined;
  const message =
    typeof error === 'object' && error && 'message' in error ? String((error as { message?: string }).message || '') : '';

  if (code && PROFILE_TABLE_MISSING_ERROR_CODES.has(code)) return true;
  return (
    message.includes("Could not find the table 'public.profiles'") ||
    message.includes('relation "profiles" does not exist')
  );
};

const buildFallbackProfile = (authUser: User): UserProfile => {
  const email = authUser.email || '';
  return {
    id: authUser.id,
    email,
    full_name: authUser.user_metadata?.full_name || 'Member',
    avatar_url: authUser.user_metadata?.avatar_url || null,
    role: isAllowlistedAdminEmail(email) ? 'admin' : 'user',
    status: 'active'
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
    let timeoutRef: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutRef = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutRef) clearTimeout(timeoutRef);
    }
  };

  const getAuthUserSafely = async (): Promise<User | null> => {
    try {
      const { data, error } = await withTimeout(supabase.auth.getUser(), 5000, 'Auth user lookup');
      if (error) return null;
      return data.user ?? null;
    } catch {
      return null;
    }
  };

  const readSessionFromStorage = (): Session | null => {
    if (typeof window === 'undefined') return null;
    return readSupabaseStoredSession(getSupabaseUrl(), window.localStorage);
  };

  const clearStoredSession = () => {
    if (typeof window === 'undefined') return;
    const supabaseUrl = getSupabaseUrl();
    clearSupabaseStoredSession(supabaseUrl, window.localStorage);
    clearSupabaseStoredSession(supabaseUrl, window.sessionStorage);
  };

  const isInvalidJwtError = (error: unknown) => {
    const message =
      typeof error === 'object' && error && 'message' in error
        ? String((error as { message?: string }).message || '').toLowerCase()
        : '';
    return message.includes('invalid jwt') || message.includes('jwt expired');
  };

  const validateSessionToken = async (candidate: Session | null): Promise<Session | null> => {
    if (!candidate?.access_token) return null;

    try {
      const { data, error } = await withTimeout(
        supabase.auth.getUser(candidate.access_token),
        7000,
        'Auth token validation'
      );
      if (!error && data?.user?.id) {
        return candidate;
      }
      if (!isInvalidJwtError(error)) {
        return candidate;
      }
    } catch {
      // Continue to refresh path below.
    }

    try {
      const { data: refreshed, error: refreshError } = await withTimeout(
        supabase.auth.refreshSession(),
        7000,
        'Auth session refresh'
      );

      if (refreshError || !refreshed.session?.access_token) {
        clearStoredSession();
        return null;
      }

      const { data: refreshedUser, error: refreshedUserError } = await withTimeout(
        supabase.auth.getUser(refreshed.session.access_token),
        7000,
        'Refreshed token validation'
      );

      if (refreshedUserError || !refreshedUser?.user?.id) {
        clearStoredSession();
        return null;
      }

      return refreshed.session;
    } catch {
      clearStoredSession();
      return null;
    }
  };

  const getAuthSessionSafely = async (): Promise<Session | null> => {
    try {
      const {
        data: { session },
        error
      } = await withTimeout(supabase.auth.getSession(), 7000, 'Auth session recovery');
      if (error) return readSessionFromStorage();
      return session ?? readSessionFromStorage();
    } catch {
      return readSessionFromStorage();
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await withTimeout(
          supabase.auth.getSession(),
          8000,
          'Auth session initialization'
        );

        if (error) throw error;

        const safeSession = await validateSessionToken(session);

        if (mounted) {
          setSession(safeSession);
          setUser(safeSession?.user ?? null);

          if (safeSession?.user) {
            await fetchProfile(safeSession.user.id, mounted, safeSession.user);
          } else {
            setProfile(null);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);

        const fallbackSession = await validateSessionToken(await getAuthSessionSafely());
        const fallbackSessionUser = fallbackSession?.user ?? null;
        const fallbackUser = await getAuthUserSafely();
        const recoveredUser = fallbackSessionUser || fallbackUser;

        if (mounted && recoveredUser && fallbackSession?.access_token) {
          setSession(fallbackSession);
          setUser(recoveredUser);
          await fetchProfile(recoveredUser.id, mounted, recoveredUser);
          return;
        }

        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (mounted) {
        const resolvedSession =
          nextSession ?? (_event !== 'SIGNED_OUT' ? await getAuthSessionSafely() : null);
        const safeSession = await validateSessionToken(resolvedSession);
        const hadToken = Boolean(resolvedSession?.access_token);
        const effectiveSession = safeSession;
        if (hadToken && !safeSession) {
          clearStoredSession();
        }
        setSession(effectiveSession);
        setUser(effectiveSession?.user ?? null);

        if (effectiveSession?.user) {
          await fetchProfile(effectiveSession.user.id, mounted, effectiveSession.user);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string, mounted: boolean = true, authUser?: User | null) => {
    const resolvedAuthUser = authUser ?? await getAuthUserSafely();
    const fallbackProfile = resolvedAuthUser ? buildFallbackProfile(resolvedAuthUser) : null;

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        8000,
        'Profile fetch'
      );

      if (mounted) {
        if (error) {
          if (isProfilesTableMissing(error)) {
            console.warn('Profiles table is missing in Supabase. Falling back to auth metadata profile.');
            setProfile(fallbackProfile);
            return;
          }

          const email = resolvedAuthUser?.email;
          if (isAllowlistedAdminEmail(email)) {
            const { error: insertError } = await supabase
              .from('profiles')
              .upsert({
                id: userId,
                email: email || '',
                full_name: resolvedAuthUser?.user_metadata?.full_name || 'Admin',
                role: 'admin',
                status: 'active'
              });

            if (!insertError) {
              setProfile({
                id: userId,
                email: email || '',
                full_name: resolvedAuthUser?.user_metadata?.full_name || 'Admin',
                role: 'admin',
                status: 'active'
              });
            } else {
              console.warn('Profile bootstrap warning:', insertError.message);
              // Fallback: keep allowlisted admin functional in UI even if profile table/policies are not ready.
              setProfile(fallbackProfile);
            }
          } else {
            console.warn('Profile fetch warning:', error.message);
            setProfile(fallbackProfile);
          }
        } else {
          const shouldForceAdmin = isAllowlistedAdminEmail(data.email);
          if (shouldForceAdmin && data.role !== 'admin') {
            const { error: promoteError } = await supabase
              .from('profiles')
              .update({ role: 'admin', status: 'active' })
              .eq('id', userId);

              if (!promoteError) {
                data.role = 'admin';
                data.status = 'active';
              } else {
                console.warn('Admin promotion warning:', promoteError.message);
                data.role = 'admin';
                data.status = 'active';
              }
          }

          if (data.status === 'blocked') {
            console.warn('Blocked user attempted to access authenticated session');
            await supabase.auth.signOut();
            setProfile(null);
            setUser(null);
            setSession(null);
            return;
          }
          setProfile(data as UserProfile);
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      if (mounted) {
        setProfile(fallbackProfile);
      }
    } finally {
      if (mounted) setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      // Helper to force-refresh profile data (e.g. after role update)
      await fetchProfile(user.id, true, user);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setProfile(null);
      setUser(null);
      setSession(null);
    }
  };

  const isAdmin =
    profile?.role === 'admin' ||
    isAllowlistedAdminEmail(profile?.email || user?.email || null);

  const value = {
    session,
    user,
    profile,
    isLoading,
    signOut,
    isAdmin,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
