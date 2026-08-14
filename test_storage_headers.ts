import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: { 'x-firebase-uid': 'test-uid-123', 'x-custom-test': 'hello-world' }
  }
});

async function run() {
  console.log('Uploading test image...');
  // Create a 1x1 png in base64 buffer
  const buf = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  const { data, error } = await supabase.storage.from('assets').upload('test.png', buf, { upsert: true, contentType: 'image/png' });
  console.log('Result:', { data, error });
}
run();
