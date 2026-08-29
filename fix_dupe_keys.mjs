import fs from 'fs';
let content = fs.readFileSync('components/admin/ProductForm.tsx', 'utf8');

// There are duplicate keys for warranty, warrantyMonths, warrantyPolicy, returnPolicy
// Let's remove the ones at the bottom of the formData object

content = content.replace(/warranty: initialData\?\.warranty \|\| '',\n/g, "");
content = content.replace(/warrantyMonths: initialData\?\.warrantyMonths \|\| 0,\n/g, "");
content = content.replace(/warrantyPolicy: initialData\?\.warrantyPolicy \|\| '',\n/g, "");
content = content.replace(/returnPolicy: initialData\?\.returnPolicy \|\| '',\n/g, "");

// Wait, the ones I added earlier were:
//      warranty: initialData?.warranty || 'No Warranty',
//      warrantyMonths: initialData?.warrantyMonths || 0,
//      warrantyPolicy: initialData?.warrantyPolicy || '',
//      returnPolicy: initialData?.returnPolicy || '',

content = content.replace(/warranty: '',/g, "");
content = content.replace(/warrantyMonths: 0,/g, "");
content = content.replace(/warrantyPolicy: '',/g, "");
content = content.replace(/returnPolicy: '',/g, "");

fs.writeFileSync('components/admin/ProductForm.tsx', content);

