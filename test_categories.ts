import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const mockAdminUid = 'ojhct02SuUeA86kFsvAz4wCF1ER2';

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      'x-firebase-uid': mockAdminUid
    }
  }
});

async function run() {
  console.log('Testing insert into categories with x-firebase-uid header...');
  const { data, error } = await supabase.from('categories').insert({
    name: 'Test Category',
    slug: 'test-category',
    icon: 'Package',
    is_active: true
  }).select();
  
  if (error) {
    console.error('Insert failed:', error.message);
  } else {
    console.log('Insert succeeded!', data);
    await supabase.from('categories').delete().eq('id', data[0].id);
  }
}

run();
