import fs from 'fs';
let content = fs.readFileSync('components/admin/ProductForm.tsx', 'utf8');

// Update formData initialization
content = content.replace(
  "warrantyType: 'No Warranty',",
  "warranty: initialData?.warranty || 'No Warranty',\n    warrantyMonths: initialData?.warrantyMonths || 0,\n    warrantyPolicy: initialData?.warrantyPolicy || '',\n    returnPolicy: initialData?.returnPolicy || '',"
);

// If warranty is not in the ProductFormData interface, add it
if (!content.includes('warranty: string;')) {
    // it's already there
}

fs.writeFileSync('components/admin/ProductForm.tsx', content);

