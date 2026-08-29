import fs from 'fs';
let content = fs.readFileSync('components/admin/ProductForm.tsx', 'utf8');

if (!content.includes('const [showMoreWarranty, setShowMoreWarranty] = useState(false);')) {
  // Find a good place to inject it, like right before formData definition
  content = content.replace(
    'const [formData, setFormData] = useState<ProductFormData>({',
    'const [showMoreWarranty, setShowMoreWarranty] = useState(false);\n  const [formData, setFormData] = useState<ProductFormData>({'
  );
  fs.writeFileSync('components/admin/ProductForm.tsx', content);
}
