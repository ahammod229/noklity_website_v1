import { supabase } from './lib/supabase.js';

// We just want to see what fetch gets.
// We can temporarily mock globalThis.fetch
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  console.log("Fetch called with headers:", init?.headers);
  return new Response(JSON.stringify({}), { status: 200 });
};

async function test() {
  await supabase.rpc('request_upload_token');
}

test();
