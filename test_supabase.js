import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/ahammodali/Library/CloudStorage/OneDrive-2g2pxb/Projects/Noklity_website/noklity_ecomerce_final-version/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const payload = {
    badge_text: 'Test',
    title: 'Test',
    image_url: 'http://example.com/img.jpg',
    target_type: 'none',
    primary_button_text: 'Shop',
    secondary_button_text: 'View',
    is_active: true,
    sort_order: 0,
    mobile_image_url: 'http://example.com/mobile.jpg'
  };
  const { data, error } = await supabase.from('hero_banners').insert(payload);
  console.log("Error details:", JSON.stringify(error, null, 2));
}

test();
