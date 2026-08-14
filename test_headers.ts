import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://itcrzohckqrfhfxgtemx.supabase.co';
const supabaseKey = 'dummy';

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: async (input, init) => {
      console.log('init.headers type:', Object.prototype.toString.call(init?.headers));
      console.log('init.headers:', init?.headers);
      return { ok: true, json: async () => ({}) } as any;
    }
  }
});

supabase.from('categories').select('*').then(() => console.log('Done'));
