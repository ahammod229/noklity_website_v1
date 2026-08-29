import fs from 'fs';
let content = fs.readFileSync('pages/admin/Products.tsx', 'utf8');

content = content.replace(
  ".update(payload)",
  ".update(payload as any)"
);

content = content.replace(
  ".insert([payload])",
  ".insert([payload as any])"
);

fs.writeFileSync('pages/admin/Products.tsx', content);

