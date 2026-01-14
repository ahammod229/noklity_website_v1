import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { supabase } from '../../lib/supabase';
import { ToastType } from '../Toast';
import { Plus, Edit2, Trash2, Search, X, Image as ImageIcon, Zap, Loader2 } from 'lucide-react';

interface ProductManagerProps {
  showToast: (message: string, type?: ToastType) => void;
}

// Temporary type to handle form fields separately
interface ProductForm {
  id?: string;
  name: string;
  category: string;
  regularPrice: number;
  salePrice?: number | null;
  stock: number;
  image: string;
  isFlashSale: boolean;
}

const ProductManager: React.FC<ProductManagerProps> = ({ showToast }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<ProductForm>({
    name: '',
    category: 'Engine',
    regularPrice: 0,
    salePrice: null,
    stock: 0,
    image: '',
    isFlashSale: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

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
      const mappedProducts: Product[] = data.map((row: any) => ({
        id: row.id,
        name: row.title,
        category: row.category || 'Uncategorized',
        price: row.discount_price || row.price,
        originalPrice: row.discount_price ? row.price : undefined,
        image: row.image_url || '',
        stock: row.stock,
        rating: row.rating,
        isFlashSale: row.is_flash_sale,
        description: row.description,
      }));
      setProducts(mappedProducts);
    }
    setLoading(false);
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setCurrentProduct({
        id: product.id,
        name: product.name,
        category: product.category,
        regularPrice: product.originalPrice || product.price,
        salePrice: product.originalPrice ? product.price : null,
        stock: product.stock || 0,
        image: product.image,
        isFlashSale: product.isFlashSale || false,
      });
      setIsEditing(true);
    } else {
      setCurrentProduct({
        name: '',
        category: 'Engine',
        regularPrice: 0,
        salePrice: null,
        stock: 0,
        image: '',
        isFlashSale: false,
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title: currentProduct.name,
      category: currentProduct.category,
      price: currentProduct.regularPrice,
      discount_price: currentProduct.salePrice && currentProduct.salePrice < currentProduct.regularPrice ? currentProduct.salePrice : null,
      stock: currentProduct.stock,
      image_url: currentProduct.image,
      is_flash_sale: currentProduct.isFlashSale,
      rating: isEditing ? undefined : 0, // Keep existing rating on edit (undefined means don't update), set 0 for new
    };

    let error;

    if (isEditing && currentProduct.id) {
      const { error: updateError } = await supabase
        .from('products')
        .update(payload)
        .eq('id', currentProduct.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('products')
        .insert([{ ...payload, rating: 5.0 }]); // Default rating 5.0 for new products
      error = insertError;
    }

    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast(isEditing ? 'Product updated successfully' : 'Product created successfully');
      setIsModalOpen(false);
      fetchProducts(); // Refresh list to ensure data consistency
    }
    setSaving(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex justify-center items-center py-20">
                 <Loader2 className="w-8 h-8 text-primary animate-spin" />
             </div>
          ) : filteredProducts.length === 0 ? (
             <div className="text-center py-20 text-gray-500">
                 No products found.
             </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                  <th className="px-6 py-3 font-medium">Stock</th>
                  <th className="px-6 py-3 font-medium text-center">Flash Sale</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                              <img src={product.image} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                          </div>
                          <span className="font-medium text-gray-900 max-w-[200px] truncate block">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {product.category}
                        </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                        {product.originalPrice ? (
                            <div className="flex flex-col">
                                <span className="text-red-600">${product.price.toLocaleString()}</span>
                                <span className="text-gray-400 line-through text-xs">${product.originalPrice.toLocaleString()}</span>
                            </div>
                        ) : (
                            <span>${product.price.toLocaleString()}</span>
                        )}
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${product.stock && product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span className="text-gray-600">{product.stock || 0}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <button 
                            onClick={(e) => handleToggleFlashSale(product, e)}
                            className={`p-1.5 rounded-full transition-colors ${
                                product.isFlashSale ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400 hover:text-amber-500'
                            }`}
                        >
                            <Zap className="w-4 h-4 fill-current" />
                        </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                          <button onClick={() => handleOpenModal(product)} className="p-1.5 text-gray-400 hover:text-primary transition-colors">
                              <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto p-6">
                    <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                            <input 
                                type="text" 
                                required
                                value={currentProduct.name}
                                onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="e.g., Brembo GT Brake Kit"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Regular Price ($)</label>
                                <input 
                                    type="number" 
                                    required
                                    min="0"
                                    step="0.01"
                                    value={currentProduct.regularPrice}
                                    onChange={e => setCurrentProduct({...currentProduct, regularPrice: parseFloat(e.target.value)})}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price ($) <span className="text-xs text-gray-400 font-normal">(Optional)</span></label>
                                <input 
                                    type="number" 
                                    min="0"
                                    step="0.01"
                                    value={currentProduct.salePrice || ''}
                                    onChange={e => setCurrentProduct({...currentProduct, salePrice: e.target.value ? parseFloat(e.target.value) : null})}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Leave empty if none"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                <input 
                                    type="number" 
                                    required
                                    min="0"
                                    value={currentProduct.stock}
                                    onChange={e => setCurrentProduct({...currentProduct, stock: parseInt(e.target.value)})}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select 
                                    value={currentProduct.category}
                                    onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                                >
                                    <option>Engine</option>
                                    <option>Brakes</option>
                                    <option>Suspension</option>
                                    <option>Exhaust</option>
                                    <option>Interior</option>
                                    <option>Wheels</option>
                                    <option>Fluids</option>
                                    <option>Maintenance</option>
                                    <option>Electronics</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="text" 
                                        required
                                        value={currentProduct.image}
                                        onChange={e => setCurrentProduct({...currentProduct, image: e.target.value})}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                            {currentProduct.image && (
                                <div className="mt-2 w-full h-32 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center">
                                    <img src={currentProduct.image} alt="Preview" className="h-full object-contain" />
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2">
                            <input 
                                type="checkbox"
                                id="isFlashSale"
                                checked={currentProduct.isFlashSale}
                                onChange={e => setCurrentProduct({...currentProduct, isFlashSale: e.target.checked})}
                                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                            />
                            <label htmlFor="isFlashSale" className="text-sm font-medium text-gray-700 select-none">
                                Feature in Flash Sale
                            </label>
                        </div>
                    </form>
                </div>
                
                <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50">
                    <button 
                        type="button" 
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        form="productForm"
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isEditing ? 'Save Changes' : 'Create Product'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;