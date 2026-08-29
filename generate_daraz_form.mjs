import fs from 'fs';

const component = `import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, HelpCircle, Check, Loader2, Video, X } from 'lucide-react';
import { Product } from '../../../types';
import { supabase } from '../../../lib/supabase';

export interface ProductFormData {
  name: string;
  category: string;
  brand: string;
  regularPrice: number;
  salePrice: number | null;
  stock: number;
  sku: string;
  image: string;
  images: string[];
  description: string;
  highlights: string;
  whatsInBox: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  dangerousGoods: string;
  warrantyType: string;
  isFlashSale: boolean;
}

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const CATEGORIES = [
  'Test Product', 'Engine', 'Brakes', 'Suspension', 'Exhaust', 
  'Interior', 'Wheels', 'Fluids', 'Maintenance', 'Electronics', 'Fashion'
];

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSubmit, onCancel, isSaving }) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: '',
    brand: 'No Brand',
    regularPrice: 0,
    salePrice: null,
    stock: 0,
    sku: '',
    image: '',
    images: [],
    description: '',
    highlights: '',
    whatsInBox: '',
    weight: 0.5,
    length: 10,
    width: 10,
    height: 10,
    dangerousGoods: 'none',
    warrantyType: 'No Warranty',
    isFlashSale: false,
  });

  const [imageUrlInput, setImageUrlInput] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        name: initialData.name,
        category: initialData.category || '',
        brand: initialData.brand || 'No Brand',
        regularPrice: initialData.originalPrice || initialData.price,
        salePrice: initialData.originalPrice ? initialData.price : null,
        stock: initialData.stock || 0,
        sku: initialData.sku || '',
        image: initialData.image,
        images: initialData.images || [initialData.image].filter(Boolean),
        description: initialData.description || '',
      }));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      alert("Please fill in required fields (Name, Category)");
      return;
    }
    onSubmit(formData);
  };

  const addImage = () => {
    if (imageUrlInput.trim()) {
      setFormData(prev => {
        const newImages = [...prev.images, imageUrlInput.trim()];
        return {
          ...prev,
          images: newImages,
          image: prev.image || imageUrlInput.trim() // set first image as main
        };
      });
      setImageUrlInput('');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return {
        ...prev,
        images: newImages,
        image: newImages.length > 0 ? newImages[0] : ''
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] -m-6 p-6 font-sans text-gray-800">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-4 font-medium">
        <span className="hover:text-blue-600 cursor-pointer" onClick={onCancel}>Homepage</span>
        <ChevronRight className="w-4 h-4" />
        <span className="hover:text-blue-600 cursor-pointer" onClick={onCancel}>Manage Products</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-bold">{initialData ? 'Edit Product' : 'Add Product'}</span>
      </div>

      <div className="flex justify-between items-end mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{initialData ? 'Edit Product' : 'Add Product'}</h1>
      </div>

      <form id="darazProductForm" onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6 relative">
        
        {/* Left Main Content */}
        <div className="flex-1 space-y-6 pb-24">
          
          {/* Section 1: Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-lg">
              <h2 className="text-lg font-bold text-gray-800">Basic Information</h2>
            </div>
            <div className="p-6 space-y-8">
              
              {/* Product Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  <span className="text-red-500 mr-1">*</span>Product Name
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Multiple language title will be showed when buyers change their APPs' default language setting. Setting it up can help improve product recall in Apps targeted at different languages.
                </p>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex. Nikon Coolpix A300 Digital Camera"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm transition-colors"
                  />
                  <div className="absolute right-3 top-2.5 text-xs text-gray-400">
                    {formData.name.length}/255
                  </div>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  <span className="text-red-500 mr-1">*</span>Category
                </label>
                <select 
                  required
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                >
                  <option value="" disabled>Select a Category...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Product Images */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1 flex items-center gap-1">
                  <span className="text-red-500">* *</span> Product Images <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                </label>
                
                <div className="flex flex-wrap gap-4 mt-3">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative w-28 h-28 border border-gray-200 rounded group flex items-center justify-center bg-gray-50">
                      <img src={img} alt="Product" className="max-w-full max-h-full object-contain p-1" />
                      <button 
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="w-28 h-28 border border-dashed border-gray-300 rounded flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors relative overflow-hidden group">
                    <Plus className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
                    <div className="absolute inset-0 bg-white p-2 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity text-center">
                      <input 
                        type="text" 
                        placeholder="Image URL" 
                        className="w-full text-xs p-1 border rounded mb-1"
                        value={imageUrlInput}
                        onChange={e => setImageUrlInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())}
                      />
                      <button type="button" onClick={addImage} className="text-[10px] bg-blue-500 text-white px-2 py-1 rounded w-full font-bold">Add</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1">
                  Video <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                </label>
                <div className="flex gap-6 mb-4 text-sm text-gray-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="videoType" className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500" defaultChecked />
                    Upload Video
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="videoType" className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500" />
                    Youtube Link
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="videoType" className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500" />
                    Media Center
                  </label>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-28 h-28 border border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-not-allowed bg-gray-50">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="text-xs text-gray-500 space-y-1 mt-2 list-disc pl-4">
                    <li>Min size: 480x480 px. max video length: 60 seconds. max file size: 100MB.</li>
                    <li>Supported Format: mp4</li>
                    <li>New Video might take up to 36 hrs to be approved</li>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Product Specification */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-lg flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-800">Product Specification</h2>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  Fill Rate: <span className="text-blue-500 bg-blue-50 px-1 rounded">0%</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-xs text-gray-500 mb-4">
                Filling in attributes will increase product searchability, driving sales conversion. <br/>
                Spot a missing attribute or attribute value? <span className="text-blue-600 cursor-pointer hover:underline">Click me</span>
              </p>
              
              <div className="w-full max-w-md">
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  <span className="text-red-500 mr-1">*</span>Brand
                </label>
                <select 
                  value={formData.brand}
                  onChange={e => setFormData({...formData, brand: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm bg-white"
                >
                  <option value="No Brand">No Brand</option>
                  <option value="Sony">Sony</option>
                  <option value="Samsung">Samsung</option>
                  <option value="Apple">Apple</option>
                  <option value="Nikon">Nikon</option>
                </select>
              </div>

              <div className="mt-4 text-blue-600 text-sm font-medium cursor-pointer hover:underline flex items-center gap-1">
                Show More <span className="text-[10px]">▼</span>
              </div>
            </div>
          </div>

          {/* Section 3: Price, Stock & Variants */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-lg">
              <h2 className="text-lg font-bold text-gray-800">Price, Stock & Variants</h2>
            </div>
            <div className="p-6">
              <p className="text-xs text-gray-500 mb-4">
                You can add variants to a product that has more than one option, such as size or color.
              </p>
              
              <button type="button" className="flex items-center gap-2 border border-gray-300 text-gray-700 font-medium px-4 py-2 rounded mb-6 hover:bg-gray-50 text-sm">
                <Plus className="w-4 h-4" /> Add Variation(0/3)
              </button>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  <span className="text-red-500 mr-1">*</span>Price & Stock
                </label>
                
                <div className="border border-gray-200 rounded overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
                      <tr>
                        <th className="px-4 py-3"><span className="text-red-500">*</span> Price</th>
                        <th className="px-4 py-3">Special Price</th>
                        <th className="px-4 py-3 flex items-center gap-1">Stock <HelpCircle className="w-3 h-3 text-gray-400" /></th>
                        <th className="px-4 py-3">SellerSKU</th>
                        <th className="px-4 py-3">Free Items</th>
                        <th className="px-4 py-3">Availability</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center border border-gray-300 rounded focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 bg-white">
                            <span className="px-2 text-gray-500 bg-gray-50 border-r border-gray-300">৳</span>
                            <input 
                              type="number" 
                              required
                              min="0"
                              value={formData.regularPrice || ''}
                              onChange={e => setFormData({...formData, regularPrice: Number(e.target.value)})}
                              className="w-full p-2 outline-none"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-blue-600 font-medium cursor-pointer hover:underline text-center">
                          {formData.salePrice ? (
                             <input 
                              type="number" 
                              value={formData.salePrice}
                              onChange={e => setFormData({...formData, salePrice: Number(e.target.value)})}
                              className="w-20 border border-gray-300 rounded p-1 outline-none text-gray-900 font-normal"
                            />
                          ) : 'Add'}
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="number" 
                            required
                            min="0"
                            value={formData.stock || ''}
                            onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                            className="w-full border border-gray-300 rounded p-2 outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 relative">
                          <input 
                            type="text" 
                            value={formData.sku}
                            onChange={e => setFormData({...formData, sku: e.target.value})}
                            placeholder="Seller SKU"
                            className="w-full border border-gray-300 rounded p-2 outline-none focus:border-blue-500 pr-10"
                          />
                          <span className="absolute right-6 top-5 text-[10px] text-gray-400">{formData.sku.length}/200</span>
                        </td>
                        <td className="px-4 py-3">
                          <input type="text" className="w-full border border-gray-300 rounded p-2 outline-none focus:border-blue-500" />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="w-8 h-4 bg-orange-500 rounded-full relative cursor-pointer ml-2">
                            <div className="absolute right-1 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Product Description */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-lg">
              <h2 className="text-lg font-bold text-gray-800">Product Description</h2>
            </div>
            <div className="p-6 space-y-8">
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Main Description</label>
                <div className="border border-gray-300 rounded overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-300 p-2 flex items-center justify-between">
                    <div className="flex gap-2 text-gray-500">
                      <span className="font-bold px-2">v</span>
                      <span className="font-bold px-2">B</span>
                      <span className="font-bold px-2">I</span>
                      <span className="font-bold px-2">U</span>
                      <span className="font-bold px-2 border-l pl-2">≡</span>
                      <span className="font-bold px-2">Image</span>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="text-orange-500 border border-orange-500 px-3 py-1 rounded text-xs font-medium flex items-center gap-1">
                         ⛶ Advanced Mode
                      </button>
                      <button type="button" className="text-gray-600 border border-gray-300 px-3 py-1 rounded text-xs font-medium bg-white">
                         Preview
                      </button>
                    </div>
                  </div>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Please input"
                    className="w-full h-40 p-4 outline-none resize-y text-sm"
                  ></textarea>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  <span className="text-red-500 mr-1">*</span>Highlights
                </label>
                <div className="border border-gray-300 rounded overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-300 p-2 flex items-center">
                    <span className="font-bold px-2 text-gray-500">≡</span>
                  </div>
                  <textarea 
                    value={formData.highlights}
                    onChange={e => setFormData({...formData, highlights: e.target.value})}
                    className="w-full h-32 p-4 outline-none resize-y text-sm"
                  ></textarea>
                </div>
              </div>

              <div className="w-32">
                <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none">
                  <option>English</option>
                  <option>Bengali</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  <span className="text-red-500 mr-1">*</span>What's in the box
                </label>
                <input 
                  type="text" 
                  value={formData.whatsInBox}
                  onChange={e => setFormData({...formData, whatsInBox: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm"
                />
              </div>

              <div className="text-blue-600 text-sm font-medium cursor-pointer hover:underline flex items-center gap-1">
                Show More <span className="text-[10px]">▼</span>
              </div>
            </div>
          </div>

          {/* Section 5: Shipping & Warranty */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-lg">
              <h2 className="text-lg font-bold text-gray-800">Shipping & Warranty</h2>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Switch to enter different package dimensions & weight for variations</span>
                <div className="w-10 h-5 bg-gray-200 rounded-full relative">
                  <div className="absolute left-1 top-0.5 w-4 h-4 bg-white rounded-full shadow"></div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  <span className="text-red-500 mr-1">*</span>Package Weight
                </label>
                <div className="flex items-center w-full max-w-sm">
                  <input 
                    type="number" 
                    placeholder="0.001~300" 
                    value={formData.weight || ''}
                    onChange={e => setFormData({...formData, weight: Number(e.target.value)})}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l focus:border-blue-500 outline-none text-sm z-10"
                  />
                  <select className="w-20 px-2 py-2 border-y border-r border-gray-300 rounded-r bg-gray-50 text-sm outline-none">
                    <option>kg</option>
                    <option>g</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  <span className="text-red-500 mr-1">*</span>Package Length(cm) * Width(cm) * Height(cm)
                </label>
                <p className="text-xs text-gray-500 mb-2">How to measure my package dimensions? <span className="text-blue-600 cursor-pointer hover:underline">View Example</span></p>
                
                <div className="flex items-center gap-2 w-full max-w-2xl">
                  <input type="number" placeholder="0.01~300" className="flex-1 px-4 py-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm" value={formData.length} onChange={e => setFormData({...formData, length: Number(e.target.value)})} />
                  <span className="text-gray-400">×</span>
                  <input type="number" placeholder="0.01~300" className="flex-1 px-4 py-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm" value={formData.width} onChange={e => setFormData({...formData, width: Number(e.target.value)})} />
                  <span className="text-gray-400">×</span>
                  <input type="number" placeholder="0.01~300" className="flex-1 px-4 py-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm" value={formData.height} onChange={e => setFormData({...formData, height: Number(e.target.value)})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">Dangerous Goods</label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="dg" className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500" defaultChecked />
                    None
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="dg" className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500" />
                    Contains battery / flammables / liquid
                  </label>
                </div>
                <div className="border-b border-gray-100 mt-6"></div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  <span className="text-red-500 mr-1">*</span>Warranty Type
                </label>
                <select 
                  className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm bg-white"
                  value={formData.warrantyType}
                  onChange={e => setFormData({...formData, warrantyType: e.target.value})}
                >
                  <option>Select</option>
                  <option>No Warranty</option>
                  <option>Local Seller Warranty</option>
                  <option>Brand Warranty</option>
                </select>
              </div>

              <div className="text-blue-600 text-sm font-medium cursor-pointer hover:underline flex items-center gap-1">
                More Warranty Settings <span className="text-[10px]">▼</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sticky Sidebar (Tips & Score) */}
        <div className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-6 space-y-4">
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Content Score</h3>
                <span className="text-gray-400">↻</span>
              </div>
              <div className="flex justify-between items-end mb-6">
                <span className="text-red-500 font-bold">Poor</span>
                <span className="text-xl font-bold">0</span>
              </div>
              
              <ul className="space-y-4 text-sm font-medium">
                <li className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full border border-orange-500 mt-0.5"></div>
                  <div>
                    <span className="text-gray-900 block">Basic Information</span>
                    <span className="text-gray-500 text-xs font-normal">Add min 3 main images</span>
                  </div>
                </li>
                <li className="flex items-center gap-3 text-gray-500">
                  <div className="w-4 h-4 rounded-full border border-gray-300"></div>
                  Product Specification <span className="ml-auto text-[10px]">▼</span>
                </li>
                <li className="flex items-center gap-3 text-gray-500">
                  <div className="w-4 h-4 rounded-full border border-gray-300"></div>
                  Price, Stock & Variants
                </li>
                <li className="flex items-center gap-3 text-gray-500">
                  <div className="w-4 h-4 rounded-full border border-gray-300"></div>
                  Product Description <span className="ml-auto text-[10px]">▼</span>
                </li>
                <li className="flex items-center gap-3 text-gray-500">
                  <div className="w-4 h-4 rounded-full border border-gray-300"></div>
                  Shipping & Warranty
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h3 className="font-bold text-orange-500 mb-2">Tips</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Please make sure to upload product images(s), fill product name, and select the correct category to publish a product.
              </p>
            </div>
            
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 pr-8">
           <button 
             type="button"
             className="px-8 py-2 text-gray-600 font-bold bg-white border border-gray-300 rounded hover:bg-gray-50"
             onClick={onCancel}
           >
             Cancel
           </button>
           <button 
             type="submit"
             disabled={isSaving}
             className="px-10 py-2 text-white font-bold bg-orange-500 rounded hover:bg-orange-600 flex items-center justify-center gap-2 min-w-[120px]"
           >
             {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
             Submit
           </button>
        </div>

      </form>
    </div>
  );
};
`;

fs.writeFileSync('components/admin/products/ProductForm.tsx', component);

