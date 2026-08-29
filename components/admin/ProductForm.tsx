import React, { useMemo, useState, useEffect } from 'react';
import { HelpCircle, X, Plus, Loader2, ChevronRight, Check, Image as ImageIcon, Trash2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Product } from '../../types';
import { supabase, uploadFile } from '../../lib/supabase';
import {
  buildResponsiveProductUploadBundle
} from '../../utils/imageOptimization';

// @ts-ignore
export interface ProductVariantData {
  id?: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
  image_url: string;
}

export interface ProductFormData {
  name: string;
  slug: string;
  brand: string;
  modelNumber: string;
  sku: string;
  category: string;
  regularPrice: number;
  salePrice: number | null;
  stock: number;
  defaultDeliveryFee: number;
  isActive: boolean;
  image: string;
  images: string[];
  description: string;
  specifications: Record<string, string>;
  compatibility: any;
  weight: number;
  deliveryCharge: number;
  warranty: string;
  isFlashSale: boolean;
  warrantyMonths: number;
  warrantyPolicy: string;
  deliveryCharges: Record<string, number>;
  shippingInfo: string;
  returnPolicy: string;
  faqText: string;
  relatedProductIds: string[];
  countryOfOrigin: string;
  status: 'active' | 'inactive' | 'archived';
  isPreorder: boolean;
  preorderExpectedDate: string;
  keywords: string;
  keyFeatures: string[];
  // Daraz specific fields mapped to DB
  length: number;
  width: number;
  height: number;
  dangerousGoods: string;
  warrantyType: string;
  highlights: string;
  whatsInBox: string;
}

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  categories?: string[];
}

const DEFAULT_CATEGORIES = [
  'Engine', 'Brakes', 'Suspension', 'Exhaust', 
  'Interior', 'Wheels', 'Fluids', 'Maintenance', 'Electronics'
];

const DarazProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSaving,
  categories
}) => {
  const [showMoreWarranty, setShowMoreWarranty] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    brand: 'No Brand',
    modelNumber: '',
    sku: '',
    category: categories?.[0] || 'Engine',
    regularPrice: 0,
    salePrice: null,
    stock: 0,
    defaultDeliveryFee: 0,
    isActive: true,
    image: '',
    images: [],
    description: '',
    specifications: {},
    compatibility: [],
    weight: 0.5,
    deliveryCharge: 0,
    
    isFlashSale: false,
    
    
    deliveryCharges: {},
    shippingInfo: '',
    
    faqText: '',
    relatedProductIds: [],
    countryOfOrigin: '',
    status: 'active',
    isPreorder: false,
    preorderExpectedDate: '',
    keywords: '',
    keyFeatures: [],
    length: 10,
    width: 10,
    height: 10,
    dangerousGoods: 'none',
    warranty: initialData?.warranty || 'No Warranty',
                highlights: '',
    variants: initialData?.variants || [],
    videoUrl: initialData?.videoUrl || '',
    videoProvider: initialData?.videoProvider || 'youtube',
    whatsInBox: ''
  });

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const categoryList = useMemo(
    () => (categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES),
    [categories]
  );

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        name: initialData.name,
        slug: initialData.slug || '',
        brand: initialData.brand || 'No Brand',
        modelNumber: initialData.modelNumber || '',
        sku: initialData.sku || '',
        category: initialData.category,
        regularPrice: initialData.originalPrice || initialData.price,
        salePrice: initialData.originalPrice ? initialData.price : null,
        stock: initialData.stock || 0,
        defaultDeliveryFee: Number(initialData.defaultDeliveryFee || 0),
        isActive: initialData.isActive !== false,
        image: initialData.image,
        images: initialData.images || [initialData.image].filter(Boolean),
        description: initialData.description || '',
        specifications: initialData.specifications || {},
        compatibility: initialData.compatibility || [],
        weight: Number(initialData.weight || 0.5),
        deliveryCharge: Number(initialData.deliveryCharge || 0),
        warranty: initialData.warranty || '',
        isFlashSale: initialData.isFlashSale || false,
        warrantyMonths: initialData.warrantyMonths || 0,
        warrantyPolicy: initialData.warrantyPolicy || '',
        deliveryCharges: initialData.deliveryCharges || {},
        shippingInfo: initialData.shippingInfo || '',
        returnPolicy: initialData.returnPolicy || '',
        faqText: initialData.faqText || '',
        countryOfOrigin: initialData.countryOfOrigin || '',
        status: initialData.status || (initialData.isActive === false ? 'inactive' : 'active'),
        isPreorder: initialData.isPreorder || false,
        preorderExpectedDate: initialData.preorderExpectedDate || '',
        keywords: (initialData as any).keywords || '',
        keyFeatures: (initialData as any).keyFeatures || [],
        highlights: (initialData.specifications?.highlights) || '',
        whatsInBox: (initialData.specifications?.whatsInBox) || ''
      }));
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    if (!formData.name) return setFormMessage({ type: 'error', text: 'Product Title is required.' });
    if (!formData.category) return setFormMessage({ type: 'error', text: 'Category is required.' });
    if (formData.regularPrice <= 0) return setFormMessage({ type: 'error', text: 'Price must be greater than 0.' });
    if (!formData.image && formData.images.length === 0) return setFormMessage({ type: 'error', text: 'At least 1 product image is required.' });

    // Map Daraz specific fields back to specifications if needed
    const finalData = { ...formData };
    finalData.specifications = {
      ...finalData.specifications,
      highlights: finalData.highlights,
      whatsInBox: finalData.whatsInBox,
      dimensions: `${finalData.length}x${finalData.width}x${finalData.height} cm`,
      warrantyType: finalData.warrantyType,
      dangerousGoods: finalData.dangerousGoods
    };

    if (finalData.images.length > 0 && !finalData.image) {
      finalData.image = finalData.images[0];
    }

    onSubmit(finalData);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setFormMessage(null);

      const path = `products/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const bundle = await buildResponsiveProductUploadBundle(file, path);
      
      const { data, error } = await supabase.storage.from('products').upload(bundle.master.path, bundle.master.file, {
        cacheControl: '31536000',
        upsert: false
      });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(data.path);

      setFormData(prev => {
        const newImages = [...prev.images, publicUrl];
        return {
          ...prev,
          images: newImages,
          image: prev.image || publicUrl
        };
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setFormMessage({ type: 'error', text: error.message || 'Failed to upload image' });
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const addImageUrl = () => {
    if (imageUrlInput.trim()) {
      setFormData(prev => {
        const newImages = [...prev.images, imageUrlInput.trim()];
        return {
          ...prev,
          images: newImages,
          image: prev.image || imageUrlInput.trim()
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
    <div className="bg-[#f5f6f8] font-sans text-gray-800 rounded-2xl overflow-hidden shadow-xl relative flex flex-col h-[calc(100vh-4rem)]">
      
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10 shadow-sm sticky top-0">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-1 font-medium">
            <span className="hover:text-primary cursor-pointer" onClick={onCancel}>Homepage</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="hover:text-primary cursor-pointer" onClick={onCancel}>Manage Products</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-bold">{initialData ? 'Edit Product' : 'Add Product'}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{initialData ? 'Edit Product' : 'Add Product'}</h1>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {formMessage && (
          <div className={`mb-6 p-4 rounded-lg ${formMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {formMessage.text}
          </div>
        )}

        <form id="darazProductForm" onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
          
          {/* Left Main Content */}
          <div className="flex-1 space-y-6">
            
            {/* Section 1: Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
                <h2 className="text-[15px] font-bold text-gray-800">Basic Information</h2>
              </div>
              <div className="p-6 space-y-8">
                
                {/* Product Name */}
                <div>
                  <label className="block text-[13px] font-bold text-gray-800 mb-1">
                    <span className="text-red-500 mr-1">*</span>Product Name
                  </label>
                  <p className="text-[11px] text-gray-500 mb-2 font-medium">
                    Multiple language title will be showed when buyers change their APPs' default language setting. Setting it up can help improve product recall in Apps targeted at different languages.
                  </p>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex. Nikon Coolpix A300 Digital Camera"
                      className="w-full px-3 py-2 border border-gray-300 rounded hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[13px] transition-colors"
                    />
                    <div className="absolute right-3 top-2.5 text-[11px] text-gray-400 font-medium">
                      {formData.name.length}/255
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[13px] font-bold text-gray-800 mb-1">
                    <span className="text-red-500 mr-1">*</span>Category
                  </label>
                  <select 
                    required
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[13px] bg-white cursor-pointer"
                  >
                    <option value="" disabled>Select a Category...</option>
                    {categoryList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Product Images */}
                <div>
                  <label className="block text-[13px] font-bold text-gray-800 mb-1 flex items-center gap-1">
                    <span className="text-red-500">* *</span> Product Images <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                  </label>
                  
                  <div className="flex flex-wrap gap-4 mt-3">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative w-28 h-28 border border-gray-200 rounded group flex items-center justify-center bg-gray-50">
                        <img src={img} alt="Product" className="max-w-full max-h-full object-contain p-1" />
                        <button 
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {formData.image === img && (
                          <div className="absolute bottom-0 left-0 right-0 bg-primary text-white text-[10px] text-center py-0.5 font-bold">
                            Main
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="w-28 h-28 border border-dashed border-gray-300 rounded flex flex-col items-center justify-center hover:border-primary hover:bg-primary/10 transition-colors relative overflow-hidden group cursor-pointer bg-gray-50/50">
                      {uploadingImage ? (
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      ) : (
                        <Plus className="w-8 h-8 text-gray-400 group-hover:text-primary" />
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={uploadingImage}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2 w-full max-w-sm relative">
                    <input 
                      type="text" 
                      placeholder="Or paste Image URL here" 
                      className="flex-1 text-[13px] px-3 py-2 border border-gray-300 rounded hover:border-primary/50 focus:border-primary outline-none"
                      value={imageUrlInput}
                      onChange={e => setImageUrlInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                    />
                    <button type="button" onClick={addImageUrl} className="text-[12px] bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded font-bold hover:bg-gray-200">Add URL</button>
                  </div>
                </div>

                {/* Video */}
                <div>
                  <label className="block text-[13px] font-bold text-gray-800 mb-3 flex items-center gap-1">
                    Video <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                  </label>
                  <div className="flex gap-6 mb-4 text-[13px] text-gray-700 font-medium">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="videoType" className="w-3.5 h-3.5 text-primary border-gray-300 focus:ring-primary" defaultChecked />
                      Upload Video
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="videoType" className="w-3.5 h-3.5 text-primary border-gray-300 focus:ring-primary" />
                      Youtube Link
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="videoType" className="w-3.5 h-3.5 text-primary border-gray-300 focus:ring-primary" />
                      Media Center
                    </label>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-28 h-28 border border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-not-allowed bg-gray-50">
                      <Plus className="w-8 h-8 text-gray-300" />
                    </div>
                    <div className="text-[11px] text-gray-500 space-y-1.5 mt-2 list-disc pl-4 font-medium">
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
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-lg flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h2 className="text-[15px] font-bold text-gray-800">Product Specification</h2>
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                    Fill Rate: <span className="text-primary bg-primary/10 px-1.5 py-0.5 rounded font-bold">0%</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-[11px] text-gray-500 mb-5 font-medium leading-relaxed">
                  Filling in attributes will increase product searchability, driving sales conversion. <br/>
                  Spot a missing attribute or attribute value? <span className="text-primary cursor-pointer hover:underline">Click me</span>
                </p>
                
                <div className="w-full max-w-md">
                  <label className="block text-[13px] font-bold text-gray-800 mb-1">
                    <span className="text-red-500 mr-1">*</span>Brand
                  </label>
                  <select 
                    value={formData.brand}
                    onChange={e => setFormData({...formData, brand: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded hover:border-primary/50 focus:border-primary outline-none text-[13px] bg-white cursor-pointer"
                  >
                    <option value="No Brand">No Brand</option>
                    <option value="Sony">Sony</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Apple">Apple</option>
                    <option value="Nikon">Nikon</option>
                  </select>
                </div>

                <div className="mt-5 text-primary text-[13px] font-medium cursor-pointer hover:underline flex items-center gap-1 w-max">
                  Show More <span className="text-[9px]">▼</span>
                </div>
              </div>
            </div>

            {/* Section 3: Price, Stock & Variants */}
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-lg flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-bold text-gray-800">Price, Stock & Variants</h2>
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, variants: [...formData.variants, { name: '', price: formData.regularPrice || 0, stock: 0, sku: '', image_url: '' }]})}
                  className="bg-primary/10 text-primary px-3 py-1 rounded text-sm font-bold flex items-center gap-1 hover:bg-primary/20"
                >
                  <Plus className="w-4 h-4" /> Add Variant
                </button>
              </div>
              
              <div className="p-6">
                
                {/* Base Price & Stock */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                   <div>
                      <label className="block text-[13px] font-bold text-gray-700 mb-1">Base Regular Price *</label>
                      <input 
                        type="number" 
                        required
                        value={formData.regularPrice || ''}
                        onChange={e => setFormData({...formData, regularPrice: Number(e.target.value)})}
                        className="w-full border border-gray-300 rounded p-2 outline-none focus:border-primary text-[13px]"
                      />
                   </div>
                   <div>
                      <label className="block text-[13px] font-bold text-gray-700 mb-1">Base Stock *</label>
                      <input 
                        type="number" 
                        required
                        value={formData.stock || ''}
                        onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                        className="w-full border border-gray-300 rounded p-2 outline-none focus:border-primary text-[13px]"
                      />
                   </div>
                </div>

                {formData.variants.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                        <tr>
                          <th className="px-4 py-3 font-semibold w-16">Image</th>
                          <th className="px-4 py-3 font-semibold">Variant Name (e.g. Red, XL)</th>
                          <th className="px-4 py-3 font-semibold w-24">Price</th>
                          <th className="px-4 py-3 font-semibold w-24">Stock</th>
                          <th className="px-4 py-3 font-semibold w-32">SKU</th>
                          <th className="px-4 py-3 font-semibold w-16 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {formData.variants.map((variant, index) => (
                          <tr key={index} className="bg-white">
                            <td className="px-4 py-2">
                               <div className="relative w-10 h-10 border rounded bg-gray-50 flex items-center justify-center overflow-hidden group cursor-pointer">
                                 {variant.image_url ? (
                                   <img src={variant.image_url} alt="var" className="w-full h-full object-cover" />
                                 ) : (
                                   <ImageIcon className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                                 )}
                                 <input 
                                   type="file" 
                                   accept="image/*"
                                   className="absolute inset-0 opacity-0 cursor-pointer"
                                   onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                         const url = await uploadFile(file, 'products', {});
                                         const newVars = [...formData.variants];
                                         newVars[index].image_url = url;
                                         setFormData({...formData, variants: newVars});
                                      }
                                   }}
                                 />
                               </div>
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                type="text" 
                                value={variant.name}
                                onChange={e => {
                                  const newVars = [...formData.variants];
                                  newVars[index].name = e.target.value;
                                  setFormData({...formData, variants: newVars});
                                }}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-primary"
                                placeholder="Red, XL"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                type="number" 
                                value={variant.price || ''}
                                onChange={e => {
                                  const newVars = [...formData.variants];
                                  newVars[index].price = Number(e.target.value);
                                  setFormData({...formData, variants: newVars});
                                }}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-primary"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                type="number" 
                                value={variant.stock || ''}
                                onChange={e => {
                                  const newVars = [...formData.variants];
                                  newVars[index].stock = Number(e.target.value);
                                  setFormData({...formData, variants: newVars});
                                }}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-primary"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                type="text" 
                                value={variant.sku}
                                onChange={e => {
                                  const newVars = [...formData.variants];
                                  newVars[index].sku = e.target.value;
                                  setFormData({...formData, variants: newVars});
                                }}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-primary"
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button 
                                type="button"
                                onClick={() => {
                                  const newVars = formData.variants.filter((_, i) => i !== index);
                                  setFormData({...formData, variants: newVars});
                                }}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Product Description */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
                <h2 className="text-[15px] font-bold text-gray-800">Product Description</h2>
              </div>
              <div className="p-6 space-y-8">
                
                <div>
                  <label className="block text-[13px] font-bold text-gray-800 mb-2">Main Description</label>
                  <div className="border border-gray-300 rounded hover:border-primary/50 transition-colors focus-within:border-primary overflow-hidden">
                    <div className="bg-gray-50/80 border-b border-gray-300 p-2 flex items-center justify-between">
                      <div className="flex gap-3 text-gray-600 items-center">
                        <span className="font-bold px-2 text-[15px] cursor-pointer hover:text-primary">v</span>
                        <span className="font-bold px-2 text-[15px] cursor-pointer hover:text-primary">B</span>
                        <span className="font-bold px-2 text-[15px] cursor-pointer hover:text-primary">I</span>
                        <span className="font-bold px-2 text-[15px] cursor-pointer hover:text-primary underline">U</span>
                        <span className="font-bold px-2 border-l border-gray-300 pl-4 text-lg cursor-pointer hover:text-primary">≡</span>
                        <span className="font-medium text-[13px] px-2 cursor-pointer hover:text-primary flex items-center gap-1">
                          <ImageIcon className="w-4 h-4" /> Image
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="text-primary border border-primary px-3 py-1 rounded text-[11px] font-bold flex items-center gap-1 hover:bg-primary/5">
                           ⛶ Advanced Mode
                        </button>
                        <button type="button" className="text-gray-700 border border-gray-300 px-4 py-1 rounded text-[11px] font-bold bg-white hover:bg-gray-50">
                           Preview
                        </button>
                      </div>
                    </div>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="Please input"
                      className="w-full h-40 p-4 outline-none resize-y text-[13px] text-gray-900"
                    ></textarea>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-gray-800 mb-2">
                    <span className="text-red-500 mr-1">*</span>Highlights
                  </label>
                  <div className="border border-gray-300 rounded hover:border-primary/50 transition-colors focus-within:border-primary overflow-hidden">
                    <div className="bg-gray-50/80 border-b border-gray-300 p-2 flex items-center">
                      <span className="font-bold px-2 text-gray-500 text-lg">≡</span>
                    </div>
                    <textarea 
                      value={formData.highlights}
                      onChange={e => setFormData({...formData, highlights: e.target.value})}
                      className="w-full h-32 p-4 outline-none resize-y text-[13px] text-gray-900"
                    ></textarea>
                  </div>
                </div>

                <div className="w-32">
                  <select className="w-full px-3 py-2 border border-gray-300 rounded text-[13px] bg-white outline-none cursor-pointer">
                    <option>English</option>
                    <option>Bengali</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-gray-800 mb-1">
                    <span className="text-red-500 mr-1">*</span>What's in the box
                  </label>
                  <input 
                    type="text" 
                    value={formData.whatsInBox}
                    onChange={e => setFormData({...formData, whatsInBox: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded hover:border-primary/50 focus:border-primary outline-none text-[13px] text-gray-900"
                  />
                </div>

                <div className="text-primary text-[13px] font-medium cursor-pointer hover:underline flex items-center gap-1 w-max">
                  Show More <span className="text-[9px]">▼</span>
                </div>
              </div>
            </div>

            {/* Section 5: Shipping & Warranty */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
                <h2 className="text-[15px] font-bold text-gray-800">Shipping & Warranty</h2>
              </div>
              <div className="p-6 space-y-6">
                
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <span className="text-[13px] font-bold text-gray-700">Switch to enter different package dimensions & weight for variations</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-gray-800 mb-1">
                    <span className="text-red-500 mr-1">*</span>Package Weight
                  </label>
                  <div className="flex items-center w-full max-w-sm">
                    <input 
                      type="number" 
                      placeholder="0.001~300" 
                      value={formData.weight || ''}
                      onChange={e => setFormData({...formData, weight: Number(e.target.value)})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l hover:border-primary/50 focus:border-primary outline-none text-[13px] z-10 text-gray-900"
                    />
                    <select className="w-20 px-2 py-2 border-y border-r border-gray-300 rounded-r bg-gray-50 text-[13px] outline-none cursor-pointer">
                      <option>kg</option>
                      <option>g</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-gray-800 mb-1">
                    <span className="text-red-500 mr-1">*</span>Package Length(cm) * Width(cm) * Height(cm)
                  </label>
                  <p className="text-[11px] text-gray-500 mb-2 font-medium">How to measure my package dimensions? <span className="text-primary cursor-pointer hover:underline">View Example</span></p>
                  
                  <div className="flex items-center gap-2 w-full max-w-2xl">
                    <input type="number" placeholder="0.01~300" className="flex-1 px-3 py-2 border border-gray-300 rounded hover:border-primary/50 focus:border-primary outline-none text-[13px] text-gray-900" value={formData.length || ''} onChange={e => setFormData({...formData, length: Number(e.target.value)})} />
                    <span className="text-gray-400">×</span>
                    <input type="number" placeholder="0.01~300" className="flex-1 px-3 py-2 border border-gray-300 rounded hover:border-primary/50 focus:border-primary outline-none text-[13px] text-gray-900" value={formData.width || ''} onChange={e => setFormData({...formData, width: Number(e.target.value)})} />
                    <span className="text-gray-400">×</span>
                    <input type="number" placeholder="0.01~300" className="flex-1 px-3 py-2 border border-gray-300 rounded hover:border-primary/50 focus:border-primary outline-none text-[13px] text-gray-900" value={formData.height || ''} onChange={e => setFormData({...formData, height: Number(e.target.value)})} />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-gray-800 mb-3">Dangerous Goods</label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-[13px] cursor-pointer font-medium text-gray-700">
                      <input 
                        type="radio" 
                        name="dg" 
                        checked={formData.dangerousGoods === 'none'}
                        onChange={() => setFormData({...formData, dangerousGoods: 'none'})}
                        className="w-4 h-4 text-primary border-gray-300 focus:ring-primary" 
                      />
                      None
                    </label>
                    <label className="flex items-center gap-2 text-[13px] cursor-pointer font-medium text-gray-700">
                      <input 
                        type="radio" 
                        name="dg" 
                        checked={formData.dangerousGoods === 'contains'}
                        onChange={() => setFormData({...formData, dangerousGoods: 'contains'})}
                        className="w-4 h-4 text-primary border-gray-300 focus:ring-primary" 
                      />
                      Contains battery / flammables / liquid
                    </label>
                  </div>
                  <div className="border-b border-gray-100 mt-6"></div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-gray-800 mb-1">
                    Warranty Type
                  </label>
                  <select 
                    className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded hover:border-primary/50 focus:border-primary outline-none text-[13px] bg-white cursor-pointer"
                    value={formData.warranty}
                    onChange={e => setFormData({...formData, warranty: e.target.value})}
                  >
                    <option value="">Select</option>
                    <option value="No Warranty">No Warranty</option>
                    <option value="Local Seller Warranty">Local Seller Warranty</option>
                    <option value="Brand Warranty">Brand Warranty</option>
                    <option value="International Manufacturer Warranty">International Manufacturer Warranty</option>
                    <option value="International Seller Warranty">International Seller Warranty</option>
                  </select>
                </div>

                {showMoreWarranty && (
                  <div className="space-y-6 mt-4">
                    <div>
                      <label className="block text-[13px] font-bold text-gray-800 mb-1">
                        Warranty Period
                      </label>
                      <select 
                        className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded hover:border-primary/50 focus:border-primary outline-none text-[13px] bg-white cursor-pointer"
                        value={formData.warrantyMonths || ''}
                        onChange={e => setFormData({...formData, warrantyMonths: Number(e.target.value)})}
                      >
                        <option value="">Select</option>
                        <option value="1">1 Month</option>
                        <option value="2">2 Months</option>
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="12">1 Year</option>
                        <option value="24">2 Years</option>
                        <option value="36">3 Years</option>
                        <option value="60">5 Years</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-gray-800 mb-1">
                        Warranty Policy
                      </label>
                      <input 
                        type="text" 
                        className="w-full max-w-2xl px-3 py-2 border border-gray-300 rounded hover:border-primary/50 focus:border-primary outline-none text-[13px]"
                        value={formData.warrantyPolicy || ''}
                        onChange={e => setFormData({...formData, warrantyPolicy: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[13px] font-bold text-gray-800 mb-1">
                        Return Policy
                      </label>
                      <input 
                        type="text" 
                        className="w-full max-w-2xl px-3 py-2 border border-gray-300 rounded hover:border-primary/50 focus:border-primary outline-none text-[13px]"
                        value={formData.returnPolicy || ''}
                        onChange={e => setFormData({...formData, returnPolicy: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                <div 
                  className="text-primary text-[13px] font-medium cursor-pointer hover:underline flex items-center gap-1 w-max mt-4"
                  onClick={() => setShowMoreWarranty(!showMoreWarranty)}
                >
                  {showMoreWarranty ? 'Show Less ^' : 'More Warranty Settings ▼'}
                </div>
              </div>
            </div>

          </div>

        </form>
      </div>

      {/* Sticky Footer */}
      <div className="bg-white border-t border-gray-200 p-4 flex justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 sticky bottom-0">
         <button 
           type="button"
           className="px-8 py-2 text-gray-600 font-bold bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-[13px]"
           onClick={onCancel}
         >
           Cancel
         </button>
         <button 
           type="submit"
           form="darazProductForm"
           disabled={isSaving}
           className="px-10 py-2 text-white font-bold bg-primary rounded hover:bg-primary/90 flex items-center justify-center gap-2 min-w-[120px] transition-colors shadow-sm active:scale-95 text-[13px]"
         >
           {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
           Submit
         </button>
      </div>

    </div>
  );
};

export default DarazProductForm;
