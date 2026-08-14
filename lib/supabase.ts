
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';
import { auth } from '../services/firebaseClient';

const getEnvVar = (key: string) => {
  // Check import.meta.env (Vite standard)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  // Fallback to process.env if available (some environments)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

let supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabasePublishableKey =
  getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY');

// Ensure URL has protocol
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  supabaseUrl = `https://${supabaseUrl}`;
}

const isValidHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

export const SUPABASE_CONFIG_ERROR =
  !supabaseUrl || !supabasePublishableKey
    ? 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) to your environment.'
    : !isValidHttpUrl(supabaseUrl)
      ? `Supabase URL is invalid: ${supabaseUrl}`
      : null;

if (SUPABASE_CONFIG_ERROR) {
  console.error(SUPABASE_CONFIG_ERROR);
}

const validUrl = supabaseUrl || 'http://localhost:54321';
const validKey = supabasePublishableKey || 'invalid-publishable-key';

const noOpAuthLock = async <T,>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<T>
): Promise<T> => fn();

let currentFirebaseUid: string | null = null;
export const setSupabaseFirebaseUid = (uid: string | null) => {
  currentFirebaseUid = uid;
};

export const supabase = createClient<Database>(validUrl, validKey, {
  auth: {
    // Firebase handles ALL authentication.
    // Supabase is used as a pure database client only.
    persistSession:    false,
    autoRefreshToken:  false,
    detectSessionInUrl: false,
    lock: noOpAuthLock
  },
  global: {
    headers: { 'x-application-name': 'noklity-ecommerce' },
    fetch: async (input, init) => {
      if (SUPABASE_CONFIG_ERROR) {
        throw new Error(SUPABASE_CONFIG_ERROR);
      }
      
      // Inject Firebase UID into headers for pseudo-RLS evaluation
      const activeUid = currentFirebaseUid || auth.currentUser?.uid || null;
      if (activeUid) {
        init = init || {};
        if (init.headers instanceof Headers) {
          init.headers.set('x-firebase-uid', activeUid);
        } else if (Array.isArray(init.headers)) {
          init.headers.push(['x-firebase-uid', activeUid]);
        } else {
          init.headers = {
            ...init.headers,
            'x-firebase-uid': activeUid
          };
        }
      }
      
      return globalThis.fetch(input, init);
    }
  }
});

/**
 * Custom upload wrapper that acquires an upload token to bypass Storage RLS limitations.
 * Supabase Storage does not have access to custom headers (like x-firebase-uid),
 * so we use an RPC to generate a token, and prepend it to the file path.
 */
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File | Blob,
  options?: any
) => {
  // 1. Acquire upload token
  const { data: token, error: tokenError } = await supabase.rpc('request_upload_token');
  if (tokenError || !token) {
    throw new Error('Unauthorized to upload: ' + (tokenError?.message || 'No token generated'));
  }

  // 2. Format the path
  let tokenizedPath = `${token}/${path}`;
  if (bucket === 'avatars') {
    // avatars bucket requires the UID as the second folder: token/uid/filename.png
    const uid = currentFirebaseUid || auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
    // Ensure path doesn't already have uid at the beginning if we're adding it
    const cleanPath = path.startsWith(`${uid}/`) ? path.slice(uid.length + 1) : path;
    tokenizedPath = `${token}/${uid}/${cleanPath}`;
  }

  // 3. Upload file
  const { data, error } = await supabase.storage.from(bucket).upload(tokenizedPath, file, options);
  if (error) throw error;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return { path: data.path, publicUrl: urlData.publicUrl };
};
