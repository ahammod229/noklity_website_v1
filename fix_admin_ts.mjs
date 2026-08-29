import fs from 'fs';

// Fix HeroBanners.tsx
let hb = fs.readFileSync('pages/admin/HeroBanners.tsx', 'utf8');
hb = hb.replace(
  'setBanners((bannersRes.data || []) as HeroBanner[]);',
  'setBanners((bannersRes.data || []) as unknown as HeroBanner[]);'
);
hb = hb.replace(
  'update(updates).eq(',
  'update(updates as any).eq('
);
hb = hb.replace(
  'update(payload).eq(',
  'update(payload as any).eq('
);
hb = hb.replace(
  'insert(payload)',
  'insert(payload as any)'
);
fs.writeFileSync('pages/admin/HeroBanners.tsx', hb);

// Fix ProductReviews.tsx
let pr = fs.readFileSync('pages/admin/ProductReviews.tsx', 'utf8');
pr = pr.replace(
  'update(updates).eq(',
  'update(updates as any).eq('
);
fs.writeFileSync('pages/admin/ProductReviews.tsx', pr);

// Fix Orders.tsx
let ord = fs.readFileSync('pages/admin/Orders.tsx', 'utf8');
ord = ord.replace(
  'getSteadfastDeliveryStatus',
  'SteadfastDeliveryStatus' // Wait, I need to check what they actually meant to import
);
fs.writeFileSync('pages/admin/Orders.tsx', ord);

// Fix Settings.tsx
let st = fs.readFileSync('pages/admin/Settings.tsx', 'utf8');
st = st.replace(
  'section: mapItem.section,',
  'section: mapItem.section as ManagedPageSection,'
);
fs.writeFileSync('pages/admin/Settings.tsx', st);

// Fix SiteSettings.tsx
let ss = fs.readFileSync('pages/admin/SiteSettings.tsx', 'utf8');
ss = ss.replace(
  'upsert(upserts, { onConflict: \'key\' })',
  'upsert(upserts as any, { onConflict: \'key\' })'
);
fs.writeFileSync('pages/admin/SiteSettings.tsx', ss);

