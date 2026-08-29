import fs from 'fs';

const c = `import React, { useMemo, useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2, Upload, Image as ImageIcon, Box, Tag, FileText, Settings, ShieldAlert, Truck } from 'lucide-react';
import { Product } from '../../types';
import { supabase, uploadFile } from '../../lib/supabase';
import { ADMIN_IMAGE_GUIDES, formatImageGuideHint, validateImageAgainstGuide } from '../../utils/adminImageGuides';
import {
  buildResponsiveProductUploadBundle,
  getResponsiveUploadTargetWidths
} from '../../utils/imageOptimization';

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
  compatibility: string[];
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
  status: 'active' | 'inactive';
  isPreorder: boolean;
  preorderExpectedDate: string;
  keywords: string;
  keyFeatures: string[];
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
  'Interior', 'Wheels', 'Fluids', 'Maintenance', 'Electronics', 'Exterior'
];

const DEFAULT_CITY_CHARGES: Record<string, number> = {
  Dhaka: 80,
  Chittagong: 120,
  Khulna: 140,
  Rajshahi: 130,
  Sylhet: 150
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const uploadProductImageBundle = async (file: File, fileNamePrefix: string) => {
  const bundle = await buildResponsiveProductUploadBundle(file, {
    fileNamePrefix,
    widths: getResponsiveUploadTargetWidths(),
    fit: 'contain'
  });

  const filesToUpload = [bundle.master.file, ...bundle.assets.map((asset) => asset.file)];
  let masterPublicUrl = '';
  
  await Promise.all(
    filesToUpload.map(async (assetFile) => {
      const filePath = \`products/\${assetFile.name}\`;
      const result = await uploadFile('assets', filePath, assetFile, {
        upsert: false,
        contentType: assetFile.type || undefined
      });
      if (assetFile === bundle.master.file) {
        masterPublicUrl = result.publicUrl;
      }
    })
  );

  return {
    bundle,
    publicUrl: masterPublicUrl
  };
};

const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSaving,
  categories
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    brand: '',
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
    weight: 0,
    deliveryCharge: 0,
    warranty: '',
    isFlashSale: false,
    warrantyMonths: 0,
    warrantyPolicy: '',
    deliveryCharges: DEFAULT_CITY_CHARGES,
    shippingInfo: '',
    returnPolicy: '',
    faqText: '',
    relatedProductIds: [],
    countryOfOrigin: '',
    status: 'active',
    isPreorder: false,
    preorderExpectedDate: '',
    keywords: '',
    keyFeatures: []
  });
  
  const [specificationRows, setSpecificationRows] = useState<Array<{ key: string; value: string }>>([{ key: '', value: '' }]);
  const [compatibilityInput, setCompatibilityInput] = useState('');
  const [relatedIdsInput, setRelatedIdsInput] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [replaceGalleryOnUpload, setReplaceGalleryOnUpload] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const categoryList = useMemo(
    () => (categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES),
    [categories]
  );

  useEffect(() => {
    if (initialData) {
      const related = initialData.relatedProductIds || [];
      setFormData({
        name: initialData.name,
        slug: initialData.slug || '',
        brand: initialData.brand || '',
        modelNumber: initialData.modelNumber || '',
        sku: initialData.sku || '',
        category: initialData.category,
        regularPrice: initialData.originalPrice || initialData.price,
        salePrice: initialData.originalPrice ? initialData.price : null,
        stock: initialData.stock || 0,
        defaultDeliveryFee: Number(initialData.defaultDeliveryFee || 0),
        isActive: initialData.isActive !== false,
        image: initialData.image,
        images: initialData.images || [],
        description: initialData.description || '',
        specifications: initialData.specifications || {},
        compatibility: initialData.compatibility || [],
        weight: Number(initialData.weight || 0),
        deliveryCharge: Number(initialData.deliveryCharge || 0),
        warranty: initialData.warranty || '',
        isFlashSale: initialData.isFlashSale || false,
        warrantyMonths: initialData.warrantyMonths || 0,
        warrantyPolicy: initialData.warrantyPolicy || '',
        deliveryCharges: initialData.deliveryCharges || DEFAULT_CITY_CHARGES,
        shippingInfo: initialData.shippingInfo || '',
        returnPolicy: initialData.returnPolicy || '',
        faqText: initialData.faqText || '',
        relatedProductIds: related,
        countryOfOrigin: initialData.countryOfOrigin || '',
        status: initialData.status || (initialData.isActive === false ? 'inactive' : 'active'),
        isPreorder: initialData.isPreorder || false,
        preorderExpectedDate: initialData.preorderExpectedDate || '',
        keywords: (initialData as any).keywords || '',
        keyFeatures: (initialData as any).keyFeatures || []
      });
      setRelatedIdsInput(related.join(', '));
      const specs = Object.entries(initialData.specifications || {}).map(([key, value]) => ({
        key,
        value: String(value)
      }));
      setSpecificationRows(specs.length > 0 ? specs : [{ key: '', value: '' }]);
      setCompatibilityInput((initialData.compatibility || []).join(', '));
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    if (!formData.name) return setFormMessage({ type: 'error', text: 'Product Title is required.' });
    if (!formData.category) return setFormMessage({ type: 'error', text: 'Category is required.' });
    if (formData.regularPrice <= 0) return setFormMessage({ type: 'error', text: 'Price must be greater than 0.' });
    if (!formData.image) return setFormMessage({ type: 'error', text: 'Primary Image is required.' });

    const specs = specificationRows.reduce((acc: Record<string, string>, row) => {
      if (!row.key.trim()) return acc;
      acc[row.key.trim()] = row.value.trim();
      return acc;
    }, {});

    const compats = compatibilityInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const related = relatedIdsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const submissionData = {
      ...formData,
      slug: formData.slug || slugify(formData.name),
      specifications: specs,
      compatibility: compats,
      relatedProductIds: related
    };

    await onSubmit(submissionData);
  };

  const handleUploadPrimaryImage = async (file: File | undefined) => {
    if (!file) return;
    const validation = await validateImageAgainstGuide(file, ADMIN_IMAGE_GUIDES.productPrimary);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploadingImage(true);
    try {
      const fileNamePrefix = \`\${slugify(formData.name || 'product')}-\${Date.now()}\`;
      const { publicUrl } = await uploadProductImageBundle(file, fileNamePrefix);
      setFormData((prev) => ({ ...prev, image: publicUrl }));
    } catch (error: any) {
      alert(error.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUploadGalleryImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // Quick validation
    for (let i = 0; i < files.length; i++) {
      const validation = await validateImageAgainstGuide(files[i], ADMIN_IMAGE_GUIDES.productGallery);
      if (!validation.valid) {
        alert(\`Image "\${files[i].name}" is invalid: \${validation.error}\`);
        return;
      }
    }

    setUploadingGallery(true);
    try {
      const urls: string[] = [];
      const basePrefix = slugify(formData.name || 'product');
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileNamePrefix = \`\${basePrefix}-gallery-\${Date.now()}-\${i}\`;
        const { publicUrl } = await uploadProductImageBundle(file, fileNamePrefix);
        urls.push(publicUrl);
      }
      
      setFormData((prev) => {
        const nextImages = replaceGalleryOnUpload ? urls : [...prev.images, ...urls];
        return { ...prev, images: nextImages };
      });
    } catch (error: any) {
      alert(error.message || 'Gallery upload failed');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleChargeChange = (city: string, value: string) => {
    const num = parseFloat(value) || 0;
    setFormData((prev) => ({
      ...prev,
      deliveryCharges: { ...prev.deliveryCharges, [city]: num }
    }));
  };

  const addGalleryUrl = () => {
    if (!newImageUrl) return;
    try {
      new URL(newImageUrl);
      setFormData((prev) => {
        if (prev.images.includes(newImageUrl)) return prev;
        return { ...prev, images: [...prev.images, newImageUrl] };
      });
      setNewImageUrl('');
    } catch {
      alert('Invalid URL format');
    }
  };

  const removeGalleryUrl = (url: string) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((img) => img !== url) }));
  };

  const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
      <label className="block mb-2 text-sm font-extrabold text-gray-900 dark:text-white">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative w-full max-w-6xl h-[92vh] rounded-2xl bg-gray-50 dark:bg-gray-900 overflow-hidden flex flex-col shadow-2xl">
        <div className="px-8 py-5 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
               <Box className="w-5 h-5" />
             </div>
             <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{initialData ? 'Edit Product' : 'Add New Product'}</h3>
                <p className="text-sm font-medium text-gray-500">Ensure all details are accurate before saving.</p>
             </div>
          </div>
          <button onClick={onCancel} className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form id="productForm" onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {formMessage && (
              <div className={\`rounded-xl px-4 py-3 text-sm font-bold border \${formMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-200 dark:border-red-400/30' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-200 dark:border-green-400/30'}\`}>
                {formMessage.text}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column - Main Details */}
              <div className="lg:col-span-2 space-y-6">
                 
                 {/* Basic Information Card */}
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-5">
                    <div className="flex items-center gap-2 mb-2 border-b border-gray-100 dark:border-slate-800 pb-3">
                       <FileText className="w-5 h-5 text-gray-400" />
                       <h4 className="text-lg font-bold text-gray-900 dark:text-white">Basic Information</h4>
                    </div>

                    <Field label="Product Title">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                        className="field-input !h-14 !text-xl"
                        placeholder="e.g. Wireless Noise-Cancelling Headphones"
                      />
                    </Field>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <Field label="Category">
                          <select value={formData.category} onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))} className="field-input">
                            {categoryList.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                       </Field>
                       <Field label="Brand (Optional)">
                          <input type="text" value={formData.brand} onChange={(e) => setFormData((p) => ({ ...p, brand: e.target.value }))} className="field-input" placeholder="e.g. Sony" />
                       </Field>
                    </div>

                    <Field label="Product Description">
                      <textarea
                        rows={6}
                        value={formData.description}
                        onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                        className="w-full p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="Detailed explanation of the product..."
                      />
                    </Field>

                    <Field label="Search Keywords (Optional)">
                      <input
                        type="text"
                        value={formData.keywords}
                        onChange={(e) => setFormData((p) => ({ ...p, keywords: e.target.value }))}
                        className="field-input"
                        placeholder="e.g. bluetooth, headset, audio"
                      />
                    </Field>
                 </div>

                 {/* Media Card */}
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-5">
                    <div className="flex items-center gap-2 mb-2 border-b border-gray-100 dark:border-slate-800 pb-3">
                       <ImageIcon className="w-5 h-5 text-gray-400" />
                       <h4 className="text-lg font-bold text-gray-900 dark:text-white">Media & Images</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
                        <div>
                          <p className="block mb-2 text-sm font-extrabold text-gray-900 dark:text-white">Primary Image</p>
                          <div className="w-full aspect-square rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex flex-col items-center justify-center relative overflow-hidden group">
                            {formData.image ? (
                              <>
                                <img src={formData.image} alt="Primary" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <label className="cursor-pointer text-white text-sm font-bold bg-white/20 px-3 py-2 rounded-lg backdrop-blur-md">
                                     Change
                                     <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadPrimaryImage(e.target.files?.[0])} />
                                  </label>
                                </div>
                              </>
                            ) : (
                              <label className={\`cursor-pointer flex flex-col items-center text-center p-4 \${uploadingImage ? 'opacity-50 pointer-events-none' : ''}\`}>
                                <Upload className="w-6 h-6 text-gray-400 mb-2" />
                                <span className="text-xs font-bold text-gray-500 dark:text-slate-400">{uploadingImage ? 'Uploading...' : 'Upload Primary'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadPrimaryImage(e.target.files?.[0])} />
                              </label>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="block mb-2 text-sm font-extrabold text-gray-900 dark:text-white">Gallery Images</p>
                          <label className={\`w-full min-h-[140px] rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex flex-col items-center justify-center text-gray-500 dark:text-slate-400 text-sm font-medium p-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors \${uploadingGallery ? 'opacity-70 pointer-events-none' : ''}\`}>
                            <Upload className="w-6 h-6 mb-2 text-gray-400" />
                            {uploadingGallery ? 'Uploading images...' : 'Click to upload multiple images (JPG/PNG)'}
                            <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleUploadGalleryImages(e.target.files)} />
                          </label>
                          <label className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-slate-300 cursor-pointer">
                            <input type="checkbox" checked={replaceGalleryOnUpload} onChange={(e) => setReplaceGalleryOnUpload(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            Replace existing gallery on upload
                          </label>

                          {formData.images.length > 0 && (
                            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                               {formData.images.map((img) => (
                                 <div key={img} className="relative group w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                                    <img src={img} alt="Gallery item" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => removeGalleryUrl(img)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                                       <Trash2 className="w-4 h-4" />
                                    </button>
                                 </div>
                               ))}
                            </div>
                          )}
                        </div>
                    </div>
                 </div>

                 {/* Features & Specifications */}
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 mb-2 border-b border-gray-100 dark:border-slate-800 pb-3">
                       <Settings className="w-5 h-5 text-gray-400" />
                       <h4 className="text-lg font-bold text-gray-900 dark:text-white">Features & Specifications</h4>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-extrabold text-gray-900 dark:text-white">Key Features (Bullet Points)</p>
                        <button type="button" onClick={() => setFormData(p => ({ ...p, keyFeatures: [...p.keyFeatures, ''] }))} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600">
                          + Add Feature
                        </button>
                      </div>
                      <div className="space-y-2">
                        {formData.keyFeatures.map((feature, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="text"
                              value={feature}
                              onChange={(e) => setFormData(p => {
                                const newFeatures = [...p.keyFeatures];
                                newFeatures[idx] = e.target.value;
                                return { ...p, keyFeatures: newFeatures };
                              })}
                              className="field-input flex-1"
                              placeholder="e.g. High-Resolution Audio"
                            />
                            <button type="button" onClick={() => setFormData(p => ({ ...p, keyFeatures: p.keyFeatures.filter((_, i) => i !== idx) }))} className="px-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {formData.keyFeatures.length === 0 && <p className="text-sm text-gray-500">No key features added.</p>}
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-extrabold text-gray-900 dark:text-white">Specifications (Key-Value)</p>
                        <button type="button" onClick={() => setSpecificationRows(prev => [...prev, { key: '', value: '' }])} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600">
                          + Add Spec
                        </button>
                      </div>
                      <div className="space-y-2">
                        {specificationRows.map((row, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input type="text" value={row.key} onChange={(e) => setSpecificationRows(prev => prev.map((r, i) => i === idx ? { ...r, key: e.target.value } : r))} className="field-input w-1/3" placeholder="e.g. Battery" />
                            <input type="text" value={row.value} onChange={(e) => setSpecificationRows(prev => prev.map((r, i) => i === idx ? { ...r, value: e.target.value } : r))} className="field-input flex-1" placeholder="e.g. 20 Hours" />
                            <button type="button" onClick={() => setSpecificationRows(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)} className="px-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                 </div>

              </div>

              {/* Right Column - Pricing, Inventory, Shipping */}
              <div className="space-y-6">
                 
                 {/* Pricing & Inventory */}
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-2 border-b border-gray-100 dark:border-slate-800 pb-3">
                       <Tag className="w-5 h-5 text-gray-400" />
                       <h4 className="text-lg font-bold text-gray-900 dark:text-white">Pricing & Inventory</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Regular Price (৳)">
                        <input type="number" min="0" step="0.01" value={formData.regularPrice} onChange={(e) => setFormData((p) => ({ ...p, regularPrice: parseFloat(e.target.value) || 0 }))} className="field-input !text-lg !text-blue-600 dark:!text-blue-400" />
                      </Field>
                      <Field label="Discount Price">
                        <input type="number" min="0" step="0.01" value={formData.salePrice ?? ''} onChange={(e) => setFormData((p) => ({ ...p, salePrice: e.target.value ? parseFloat(e.target.value) : null }))} className="field-input" placeholder="Optional" />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Stock Qty">
                        <input type="number" min="0" value={formData.stock} onChange={(e) => setFormData((p) => ({ ...p, stock: parseInt(e.target.value, 10) || 0 }))} className="field-input" placeholder="e.g. 50" />
                      </Field>
                      <Field label="SKU">
                        <input type="text" value={formData.sku} onChange={(e) => setFormData((p) => ({ ...p, sku: e.target.value }))} className="field-input" placeholder="e.g. WH-1000XM4" />
                      </Field>
                    </div>

                    <Field label="Visibility Status">
                      <select value={formData.status} onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as 'active' | 'inactive', isActive: e.target.value === 'active' }))} className="field-input bg-gray-50 dark:bg-slate-800">
                        <option value="active">Active (Visible)</option>
                        <option value="inactive">Inactive (Hidden)</option>
                      </select>
                    </Field>
                 </div>

                 {/* Shipping & Delivery */}
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-2 border-b border-gray-100 dark:border-slate-800 pb-3">
                       <Truck className="w-5 h-5 text-gray-400" />
                       <h4 className="text-lg font-bold text-gray-900 dark:text-white">Shipping & Delivery</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Weight (kg)">
                        <input type="number" min="0" step="0.001" value={formData.weight} onChange={(e) => setFormData((p) => ({ ...p, weight: parseFloat(e.target.value) || 0 }))} className="field-input" />
                      </Field>
                      <Field label="Default Fee (৳)">
                        <input type="number" min="0" step="0.01" value={formData.defaultDeliveryFee} onChange={(e) => setFormData((p) => ({ ...p, defaultDeliveryFee: parseFloat(e.target.value) || 0 }))} className="field-input" />
                      </Field>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                      <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">Delivery by City</p>
                      <div className="space-y-2">
                        {Object.entries(formData.deliveryCharges).map(([city, charge]) => (
                          <div key={city} className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-600 dark:text-slate-300">{city}</span>
                            <input type="number" min="0" value={charge} onChange={(e) => handleChargeChange(city, e.target.value)} className="field-input !w-24 !h-9 !px-3" />
                          </div>
                        ))}
                      </div>
                    </div>
                 </div>

                 {/* Policies & Others */}
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-2 border-b border-gray-100 dark:border-slate-800 pb-3">
                       <ShieldAlert className="w-5 h-5 text-gray-400" />
                       <h4 className="text-lg font-bold text-gray-900 dark:text-white">Policies & Warranty</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Warranty (Months)">
                        <input type="number" min="0" value={formData.warrantyMonths} onChange={(e) => setFormData((p) => ({ ...p, warrantyMonths: parseInt(e.target.value, 10) || 0 }))} className="field-input" />
                      </Field>
                      <Field label="Warranty Tag">
                        <input type="text" value={formData.warranty} onChange={(e) => setFormData((p) => ({ ...p, warranty: e.target.value }))} className="field-input" placeholder="e.g. 1 Year Official" />
                      </Field>
                    </div>

                    <Field label="Available for Pre-order">
                      <select value={formData.isPreorder ? 'yes' : 'no'} onChange={(e) => setFormData((p) => ({ ...p, isPreorder: e.target.value === 'yes' }))} className="field-input">
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </Field>
                    
                    {formData.isPreorder && (
                      <Field label="Expected Delivery Date">
                        <input type="text" value={formData.preorderExpectedDate || ''} onChange={(e) => setFormData((p) => ({ ...p, preorderExpectedDate: e.target.value }))} className="field-input" placeholder="e.g. November 15, 2026" />
                      </Field>
                    )}
                 </div>

              </div>
            </div>
          </div>

          <div className="mt-8 px-8 py-5 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-4 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button type="button" onClick={onCancel} className="px-6 h-12 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
               Discard Changes
            </button>
            <button type="submit" disabled={isSaving || uploadingImage || uploadingGallery} className="px-8 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-extrabold flex items-center gap-2 disabled:opacity-70 transition-colors">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {initialData ? 'Save Product Updates' : 'Publish Product'}
            </button>
          </div>
        </form>
      </div>

      <style>{\`
        .field-input {
          width: 100%;
          height: 48px;
          padding: 0 16px;
          border-radius: 12px;
          border: 1px solid var(--tw-border-opacity, #e5e7eb);
          background-color: var(--tw-bg-opacity, #ffffff);
          color: var(--tw-text-opacity, #111827);
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }
        @media (prefers-color-scheme: dark) {
          .field-input {
            border-color: #334155;
            background-color: #0f172a;
            color: #f1f5f9;
          }
        }
        :global(.dark) .field-input {
            border-color: #334155;
            background-color: #0f172a;
            color: #f1f5f9;
        }
        .field-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }
        .field-input::placeholder { color: #94a3b8; font-weight: 500; }
      \`}</style>
    </div>
  );
};

export default ProductForm;
`;

fs.writeFileSync('components/admin/ProductForm.tsx', c);
