
import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Loader2, Save } from 'lucide-react';
import { Product } from '../../types';

export interface ProductFormData {
  name: string;
  category: string;
  regularPrice: number;
  salePrice: number | null;
  stock: number;
  image: string;
  description: string;
  isFlashSale: boolean;
}

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const CATEGORIES = [
  'Engine', 'Brakes', 'Suspension', 'Exhaust', 
  'Interior', 'Wheels', 'Fluids', 'Maintenance', 'Electronics', 'Exterior'
];

const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSubmit, onCancel, isSaving }) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: 'Engine',
    regularPrice: 0,
    salePrice: null,
    stock: 0,
    image: '',
    description: '',
    isFlashSale: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        category: initialData.category,
        // If originalPrice exists, that's the regular price. If not, price is regular.
        regularPrice: initialData.originalPrice || initialData.price,
        // If originalPrice exists, price is the sale price.
        salePrice: initialData.originalPrice ? initialData.price : null,
        stock: initialData.stock || 0,
        image: initialData.image,
        description: initialData.description || '',
        isFlashSale: initialData.isFlashSale || false,
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in" onClick={onCancel} />
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">
              {initialData ? 'Edit Product' : 'Add New Product'}
            </h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
              {initialData ? `ID: ${initialData.id}` : 'Enter product details'}
            </p>
          </div>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Form Content */}
        <div className="overflow-y-auto p-8 custom-scrollbar">
          <form id="productForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Product Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="e.g. Brembo GT Brake Kit"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Category</label>
                  <div className="relative">
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {/* Custom Arrow could go here */}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Stock Quantity</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={formData.stock}
                    onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Pricing Strategy</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Regular Price ($)</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      step="0.01"
                      value={formData.regularPrice}
                      onChange={e => setFormData({...formData, regularPrice: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                      Sale Price ($) <span className="text-gray-400 font-normal normal-case">(Optional)</span>
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={formData.salePrice || ''}
                      onChange={e => setFormData({...formData, salePrice: e.target.value ? parseFloat(e.target.value) : null})}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Leave empty if none"
                    />
                  </div>
                </div>
            </div>

            {/* Image */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Image URL</label>
              <div className="relative">
                <ImageIcon className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                <input 
                  type="url" 
                  required
                  value={formData.image}
                  onChange={e => setFormData({...formData, image: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-blue-600 underline"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              {formData.image && (
                <div className="mt-4 w-full h-48 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden flex items-center justify-center p-4">
                  <img 
                    src={formData.image} 
                    alt="Preview" 
                    className="h-full object-contain mix-blend-multiply" 
                    onError={(e) => (e.currentTarget.style.display = 'none')} 
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
              <textarea 
                rows={3}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                placeholder="Product features and specs..."
              />
            </div>
            
            {/* Toggles */}
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer" onClick={() => setFormData({...formData, isFlashSale: !formData.isFlashSale})}>
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.isFlashSale ? 'bg-primary border-primary' : 'bg-white border-amber-200'}`}>
                {formData.isFlashSale && <Save className="w-3 h-3 text-white" />}
              </div>
              <label className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                Feature in Flash Sale
              </label>
            </div>

          </form>
        </div>
        
        {/* Footer */}
        <div className="p-8 border-t border-gray-100 flex gap-4 bg-gray-50/50">
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-1 px-6 py-4 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-white hover:text-gray-900 transition-all uppercase tracking-widest text-xs"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="productForm"
            disabled={isSaving}
            className="flex-1 px-6 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs active:scale-95"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {initialData ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
