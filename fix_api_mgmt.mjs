import fs from 'fs';
let am = fs.readFileSync('pages/admin/ApiManagement.tsx', 'utf8');
am = am.replace(
  'update(payload).eq(',
  'update(payload as any).eq('
);
fs.writeFileSync('pages/admin/ApiManagement.tsx', am);
