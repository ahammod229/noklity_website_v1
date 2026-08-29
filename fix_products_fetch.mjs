import fs from 'fs';
let content = fs.readFileSync('pages/admin/Products.tsx', 'utf8');

// Update fetch query
content = content.replace(
  ".select('*')",
  ".select('*, product_variants(*)')"
);

// Update mapping
const mapReplace = `return {
          id: row.id,
          name: row.title,`;
const newMap = `return {
          id: row.id,
          name: row.title,
          videoUrl: row.video_url,
          videoProvider: row.video_provider,
          variants: row.product_variants,`;
content = content.replace(mapReplace, newMap);

fs.writeFileSync('pages/admin/Products.tsx', content);

