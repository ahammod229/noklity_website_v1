
import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { supabase } from '../../lib/supabase';
import { ToastType } from '../Toast';
import { Plus, Search } from 'lucide-react';
import { ProductTable } from './products/ProductTable';
import { ProductForm, ProductFormData } from './products/ProductForm';

interface ProductManagerProps {
  showToast: (message: string, type?: ToastType) => void;
}

const normalizeImageUrls = (value: unknown) =>
  Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

const ProductManager: React.FC<ProductManagerProps> = ({ showToast }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showToast('Failed to load products', 'error');
      setLoading(false);
      return;
    }

    if (data) {
      const mappedProducts: Product[] = data.map((row: any) => {
        const images = normalizeImageUrls(row.image_urls);
        return {
          id: row.id,
          name: row.title,
          category: row.category || 'Uncategorized',
          price: row.discount_price || row.price,
          originalPrice: row.discount_price ? row.price : undefined,
          image: String(row.image_url || '').trim() || images[0] || 'https://via.placeholder.com/400x400?text=No+Image',
          images,
          stock: row.stock,
          rating: row.rating,
          isFlashSale: row.is_flash_sale,
          description: row.description,
          isPreorder: row.is_preorder,
          preorderExpectedDate: row.preorder_expected_date,
        };
      });
      setProducts(mappedProducts);
    }
    setLoading(false);
  };

  const handleOpenModal = (product?: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(undefined);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    // Optimistic UI
    const prevProducts = [...products];
    setProducts(products.filter(p => p.id !== id));

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      setProducts(prevProducts);
      showToast('Failed to delete product', 'error');
    } else {
      showToast('Product deleted successfully');
    }
  };

  const handleToggleFlashSale = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic UI
    const updatedProducts = products.map(p => 
      p.id === product.id ? { ...p, isFlashSale: !p.isFlashSale } : p
    );
    setProducts(updatedProducts);

    const { error } = await supabase
      .from('products')
      .update({ is_flash_sale: !product.isFlashSale })
      .eq('id', product.id);

    if (error) {
      // Revert
      setProducts(products);
      showToast('Failed to update flash sale status', 'error');
    } else {
        const status = !product.isFlashSale ? 'added to' : 'removed from';
        showToast(`Product ${status} Flash Sale`);
    }
  };

  const handleSubmit = async (formData: ProductFormData) => {
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
    };

    let error;

    if (editingProduct) {
      const { error: updateError } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingProduct.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('products')
        .insert([{ ...payload, rating: 5.0 }]); 
      error = insertError;
    }

    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast(editingProduct ? 'Product updated successfully' : 'Product created successfully');
      handleCloseModal();
      fetchProducts(); // Refresh list to ensure data consistency
    }
    setIsSaving(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  
  if (isModalOpen) {
    return (
      <ProductForm 
        initialData={editingProduct}
        onSubmit={handleSubmit}
        onCancel={handleCloseModal}
        isSaving={isSaving}
      />
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Products</h2>
           <p className="text-gray-500 text-sm">Manage your product inventory</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary text-white font-bold px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search products..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>
        </div>

        {/* Table Component */}
        <ProductTable 
          products={filteredProducts}
          isLoading={loading}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
          onToggleFlashSale={handleToggleFlashSale}
        />
      </div>
    </div>
  );
};

export default ProductManager;
