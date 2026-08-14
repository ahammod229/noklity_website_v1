import { supabase } from './lib/supabase.js';

async function run() {
  console.log('Requesting upload token...');
  const { data, error } = await supabase.rpc('request_upload_token');
  console.log('Data:', data);
  console.log('Error:', error);
}

run();
