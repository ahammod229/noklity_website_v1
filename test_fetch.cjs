const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
  global: { headers: { 'x-firebase-uid': 'test-uid-123' } }
});

async function run() {
  const { data, error } = await supabase.rpc('request_upload_token');
  console.log("RPC result:", { data, error });
}
run();
