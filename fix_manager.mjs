import fs from 'fs';

let content = fs.readFileSync('components/admin/ProductManager.tsx', 'utf8');

const oldSubmit = `  const handleSubmit = async (formData: ProductFormData) => {
    setIsSaving(true);

    const payload = {
      title: formData.name,
      category: formData.category,
      price: formData.regularPrice,
      discount_price: formData.salePrice && formData.salePrice < formData.regularPrice ? formData.salePrice : null,
      stock: formData.stock,
      image_url: formData.image,
      is_flash_sale: formData.isFlashSale,
      is_preorder: formData.isPreorder,
      preorder_expected_date: formData.preorderExpectedDate || null,
      rating: editingProduct ? undefined : 0, 
    };`;

const newSubmit = `  const handleSubmit = async (formData: ProductFormData) => {
    setIsSaving(true);

    const payload = {
      title: formData.name,
      category: formData.category,
      brand: formData.brand,
      price: formData.regularPrice,
      discount_price: formData.salePrice && formData.salePrice < formData.regularPrice ? formData.salePrice : null,
      stock: formData.stock,
      sku: formData.sku,
      image_url: formData.image || formData.images[0] || '',
      image_urls: formData.images,
      description: formData.description,
      is_flash_sale: formData.isFlashSale,
      rating: editingProduct ? undefined : 0, 
    };`;

content = content.replace(oldSubmit, newSubmit);
fs.writeFileSync('components/admin/ProductManager.tsx', content);

