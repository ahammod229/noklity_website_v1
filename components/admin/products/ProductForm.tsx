import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Product } from '../../../types';

export interface ProductFormData {
  name: string;
  category: string;
  regularPrice: number;
  salePrice: number | null;
  stock: number;
  image: string;
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
  'Interior', 'Wheels', 'Fluids', 'Maintenance', 'Electronics'
];

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSubmit, onCancel, isSaving }) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: 'Engine',
    regularPrice: 0,
    salePrice: null,
    stock: 0,
    image: '',
    isFlashSale: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        category: initialData.category,
        regularPrice: initialData.originalPrice || initialData.price,
        salePrice: initialData.originalPrice ? initialData.price : null,
        stock: initialData.stock || 0,
        image: initialData.image,
        isFlashSale: initialData.isFlashSale || false,
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            {initialData ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
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
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
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
                  value={formData.regularPrice}
                  onChange={e => setFormData({...formData, regularPrice: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sale Price ($) <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                </label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={formData.salePrice || ''}
                  onChange={e => setFormData({...formData, salePrice: e.target.value ? parseFloat(e.target.value) : null})}
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
                  value={formData.stock}
                  onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  required
                  value={formData.image}
                  onChange={e => setFormData({...formData, image: e.target.value})}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="https://..."
                />
              </div>
              {formData.image && (
                <div className="mt-2 w-full h-32 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center">
                  <img src={formData.image} alt="Preview" className="h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 pt-2 bg-amber-50 p-3 rounded-lg border border-amber-100">
              <input 
                type="checkbox"
                id="isFlashSale"
                checked={formData.isFlashSale}
                onChange={e => setFormData({...formData, isFlashSale: e.target.checked})}
                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
              />
              <label htmlFor="isFlashSale" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                Feature in Flash Sale
              </label>
            </div>
          </form>
        </div>
        
        <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50">
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="productForm"
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {initialData ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </div>
    </div>
  );
};