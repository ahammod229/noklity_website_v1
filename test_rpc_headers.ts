import { createClient } from '@supabase/supabase-js';
const supabase = createClient('http://localhost:54321', 'test-key');

async function run() {
  await supabase.rpc('request_upload_token', {}, { headers: { 'x-firebase-uid': '123' }});
}
