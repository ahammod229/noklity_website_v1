import type { Session } from '@supabase/supabase-js';

type MaybeStorage = Storage | undefined;

const parseStoredSessionValue = (raw: string | null): Session | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as any;
    if (parsed?.currentSession?.access_token && parsed?.currentSession?.refresh_token) {
      return parsed.currentSession as Session;
    }
    if (parsed?.access_token && parsed?.refresh_token) {
      return parsed as Session;
    }
    if (Array.isArray(parsed) && parsed[0]?.access_token && parsed[0]?.refresh_token) {
      return parsed[0] as Session;
    }
  } catch {
    return null;
  }

  return null;
};

const getSupabaseProjectRefFromUrl = (supabaseUrl: string): string => {
  try {
    const parsed = new URL(supabaseUrl);
    const firstLabel = parsed.hostname.split('.')[0] || '';
    return firstLabel.trim();
  } catch {
    return '';
  }
};

export const getSupabaseAuthStorageKey = (supabaseUrl: string): string => {
  const projectRef = getSupabaseProjectRefFromUrl(supabaseUrl);
  return projectRef ? `sb-${projectRef}-auth-token` : '';
};

export const readSupabaseStoredSession = (
  supabaseUrl: string,
  storage: MaybeStorage
): Session | null => {
  if (!storage) return null;

  const targetKey = getSupabaseAuthStorageKey(supabaseUrl);
  if (!targetKey) return null;
  const exact = parseStoredSessionValue(storage.getItem(targetKey));
  if (exact?.access_token) return exact;
  return null;
};

export const readSupabaseStoredAccessToken = (
  supabaseUrl: string,
  storage: MaybeStorage
): string => {
  const session = readSupabaseStoredSession(supabaseUrl, storage);
  return String(session?.access_token || '').trim();
};

export const clearSupabaseStoredSession = (
  supabaseUrl: string,
  storage: MaybeStorage
): void => {
  if (!storage) return;
  const targetKey = getSupabaseAuthStorageKey(supabaseUrl);
  if (!targetKey) return;
  storage.removeItem(targetKey);
};
