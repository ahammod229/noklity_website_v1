
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

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
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

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
  !supabaseUrl || !supabaseAnonKey
    ? 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.'
    : !isValidHttpUrl(supabaseUrl)
      ? `Supabase URL is invalid: ${supabaseUrl}`
      : null;

if (SUPABASE_CONFIG_ERROR) {
  console.error(SUPABASE_CONFIG_ERROR);
}

const validUrl = supabaseUrl || 'http://localhost:54321';
const validKey = supabaseAnonKey || 'invalid-anon-key';

const noOpAuthLock = async <T,>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<T>
): Promise<T> => fn();

export const supabase = createClient<Database>(validUrl, validKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Avoid Navigator Lock API edge-cases in some browsers (for example Brave)
    // that can leave auth initialization pending indefinitely.
    lock: noOpAuthLock
  },
  fetch: async (input, init) => {
    if (SUPABASE_CONFIG_ERROR) {
      throw new Error(SUPABASE_CONFIG_ERROR);
    }
    return globalThis.fetch(input, init);
  },
  global: {
    headers: { 'x-application-name': 'noklity-ecommerce' }
  }
});
