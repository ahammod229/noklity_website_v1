
import { supabase } from '../lib/supabase';
import { User as FirebaseUser } from 'firebase/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SupabaseUserProfile {
  uid:          string;
  email:        string;
  display_name: string | null;
  photo_url:    string | null;
  phone:        string | null;
  provider:     'email' | 'google';
  role:         'user' | 'admin';
  status:       'active' | 'blocked';
  created_at?:  string;
  updated_at?:  string;
}

// ─── Sync Firebase User → Supabase users table ───────────────────────────────

/**
 * Upserts a Firebase user into the Supabase `users` table.
 * Firebase UID is the primary key — completely safe to call on every login.
 * ON CONFLICT (uid) → UPDATE: guarantees no duplicate entries ever.
 */
export const syncFirebaseUserToSupabase = async (
  firebaseUser: FirebaseUser
): Promise<SupabaseUserProfile | null> => {
  const provider: 'email' | 'google' =
    firebaseUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email';

  // Determine if this is the admin email
  const ADMIN_EMAIL = import.meta?.env?.VITE_ADMIN_EMAIL || 'noklitybd@gmail.com';
  const isAdminEmail = (firebaseUser.email ?? '').toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const payload = {
    uid:          firebaseUser.uid,
    email:        firebaseUser.email ?? '',
    display_name: firebaseUser.displayName ?? null,
    photo_url:    firebaseUser.photoURL ?? null,
    provider,
    // role / status / phone are intentionally omitted here —
    // they are preserved from any existing row on conflict.
  };

  const { data, error } = await supabase
    .from('users')
    .upsert(payload, {
      onConflict: 'uid',
      ignoreDuplicates: false, // always update display_name / photo_url
    })
    .select()
    .single();

  if (error) {
    // Non-fatal: if the users table doesn't exist yet, return a fallback profile
    console.warn('[supabaseSync] Sync error (non-fatal):', error.message);
    return buildFallbackProfile(firebaseUser, provider, isAdminEmail);
  }

  // If this is the admin email but role is still 'user', fix it immediately
  if (isAdminEmail && data.role !== 'admin') {
    const { data: updated } = await supabase
      .from('users')
      .update({ role: 'admin', status: 'active' })
      .eq('uid', firebaseUser.uid)
      .select()
      .single();
    return (updated ?? data) as SupabaseUserProfile;
  }

  return data as SupabaseUserProfile;
};

// ─── Fetch User by Firebase UID ───────────────────────────────────────────────

export const getSupabaseUserByUid = async (
  uid: string
): Promise<SupabaseUserProfile | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('uid', uid)
    .single();

  if (error) return null;
  return data as SupabaseUserProfile;
};

// ─── Update Profile Fields ────────────────────────────────────────────────────

export const updateSupabaseUserProfile = async (
  uid: string,
  updates: Partial<Pick<SupabaseUserProfile, 'display_name' | 'photo_url' | 'phone'>>
): Promise<boolean> => {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('uid', uid);

  if (error) {
    console.error('[supabaseSync] Profile update error:', error.message);
    return false;
  }
  return true;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildFallbackProfile = (
  fbUser: FirebaseUser,
  provider: 'email' | 'google',
  isAdmin: boolean = false
): SupabaseUserProfile => ({
  uid:          fbUser.uid,
  email:        fbUser.email ?? '',
  display_name: fbUser.displayName ?? null,
  photo_url:    fbUser.photoURL ?? null,
  phone:        null,
  provider,
  // If users table not yet created, grant admin by email match so the site still works
  role:         isAdmin ? 'admin' : 'user',
  status:       'active',
});
