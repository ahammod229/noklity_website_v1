import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

// Safely access environment variables to prevent runtime crashes
// This handles cases where import.meta.env might be undefined in certain environments
const getEnvVar = (key: string) => {
  try {
    const env = (import.meta as any).env || {};
    return env[key] || '';
  } catch {
    return '';
  }
};

// Retrieve configuration from environment variables
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Validate configuration or use safe placeholders
// This ensures createClient doesn't throw an error during initialization if env vars are missing
const validUrl = supabaseUrl && supabaseUrl.startsWith('http') 
  ? supabaseUrl 
  : 'https://placeholder.supabase.co';

const validKey = supabaseAnonKey || 'placeholder-key';

// Export the typed client
export const supabase = createClient<Database>(validUrl, validKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
