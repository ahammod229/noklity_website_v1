import React, { useMemo, useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { Product } from '../../types';
import { supabase } from '../../lib/supabase';
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
}

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  categories?: string[];
}

type ProductTab = 'general' | 'details' | 'shipping';

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

const tabButtonClass = (active: boolean) =>
  `px-5 py-3 text-sm font-extrabold border-b-2 transition-colors ${active ? 'text-[#ff6b6b] border-[#ff6b6b]' : 'text-slate-400 border-transparent hover:text-slate-200'}`;

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
  await Promise.all(
    filesToUpload.map(async (assetFile) => {
      const filePath = `products/${assetFile.name}`;
      const { error } = await supabase.storage.from('assets').upload(filePath, assetFile, {
        upsert: false,
        contentType: assetFile.type || undefined
      });
      if (error) throw error;
    })
  );

  const filePath = `products/${bundle.master.file.name}`;
  const { data } = supabase.storage.from('assets').getPublicUrl(filePath);

  return {
    bundle,
    publicUrl: data.publicUrl
  };
};

const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSaving,
  categories
}) => {
  const [activeTab, setActiveTab] = useState<ProductTab>('general');
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
    status: 'active'
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
        status: initialData.status || (initialData.isActive === false ? 'inactive' : 'active')
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

    if (!formData.name.trim()) {
      setFormMessage({ type: 'error', text: 'Product title is required.' });
      setActiveTab('general');
      return;
    }
    if (!formData.image.trim()) {
      setFormMessage({ type: 'error', text: 'Primary image is required.' });
      setActiveTab('details');
      return;
    }
    if (formData.salePrice !== null && formData.salePrice >= formData.regularPrice) {
      setFormMessage({ type: 'error', text: 'Discount price must be lower than regular price.' });
      setActiveTab('general');
      return;
    }

    const relatedProductIds = relatedIdsInput
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    const compatibility = compatibilityInput
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    const specifications = specificationRows.reduce<Record<string, string>>((acc, row) => {
      if (!row.key.trim()) return acc;
      acc[row.key.trim()] = row.value.trim();
      return acc;
    }, {});

    await onSubmit({
      ...formData,
      slug: formData.slug.trim() || slugify(formData.name),
      relatedProductIds,
      compatibility,
      specifications
    });
  };

  const handleChargeChange = (city: string, value: string) => {
    const amount = Number(value || 0);
    setFormData((prev) => ({
      ...prev,
      deliveryCharges: {
        ...prev.deliveryCharges,
        [city]: amount
      }
    }));
  };

  const handleUploadPrimaryImage = async (file?: File | null) => {
    if (!file) return;
    setUploadingImage(true);
    setFormMessage(null);

    try {
      const validation = await validateImageAgainstGuide(file, ADMIN_IMAGE_GUIDES.productPrimary);
      if (validation.shouldBlock) {
        setFormMessage({ type: 'error', text: validation.message });
        return;
      }
      const { bundle, publicUrl } = await uploadProductImageBundle(file, 'product-primary');
      setFormData((prev) => ({ ...prev, image: publicUrl }));
      setFormMessage({
        type: 'success',
        text: `${validation.message} Optimized ${bundle.master.reducedPercent}% smaller (${Math.round(
          bundle.master.optimizedBytes / 1024
        )}KB) with ${bundle.supportsAvif ? 'AVIF/WebP' : 'WebP'} responsive variants.`
      });
    } catch (error) {
      console.error('Primary image upload failed:', error);
      setFormMessage({ type: 'error', text: 'Primary image upload failed. Check admin storage permissions.' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUploadGalleryImages = async (files?: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingGallery(true);
    setFormMessage(null);

    try {
      const filesArray = Array.from(files);
      let nonPerfectCount = 0;
      for (const file of filesArray) {
        const validation = await validateImageAgainstGuide(file, ADMIN_IMAGE_GUIDES.productGallery);
        if (validation.shouldBlock) {
          setFormMessage({ type: 'error', text: `${file.name}: ${validation.message}` });
          return;
        }
        if (!validation.isPerfect) nonPerfectCount += 1;
      }

      const uploadedUrls: string[] = [];
      for (const file of filesArray) {
        const { publicUrl } = await uploadProductImageBundle(file, 'product-gallery');
        uploadedUrls.push(publicUrl);
      }

      setFormData((prev) => {
        const nextImages = replaceGalleryOnUpload
          ? uploadedUrls
          : Array.from(new Set([...prev.images, ...uploadedUrls]));
        return { ...prev, images: nextImages };
      });

      setFormMessage({
        type: 'success',
        text:
          nonPerfectCount > 0
            ? `${uploadedUrls.length} gallery image(s) uploaded. ${nonPerfectCount} image(s) are usable but not exact recommended size.`
            : `${uploadedUrls.length} gallery image(s) uploaded with perfect size.`
      });
    } catch (error) {
      console.error('Gallery image upload failed:', error);
      setFormMessage({ type: 'error', text: 'Gallery upload failed. Check admin storage permissions.' });
    } finally {
      setUploadingGallery(false);
    }
  };

  const addGalleryUrl = () => {
    const url = newImageUrl.trim();
    if (!url) return;

    setFormData((prev) => {
      if (prev.images.includes(url)) {
        setFormMessage({ type: 'error', text: 'This image URL already exists in gallery.' });
        return prev;
      }
      return { ...prev, images: [...prev.images, url] };
    });

    setNewImageUrl('');
  };

  const removeGalleryUrl = (url: string) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((img) => img !== url) }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative w-full max-w-6xl h-[92vh] rounded-3xl bg-[#0b172e] text-slate-100 border border-slate-700/70 overflow-hidden flex flex-col shadow-2xl">
        <div className="px-8 py-6 border-b border-slate-700/70 bg-[#1a253c] flex items-center justify-between">
          <h3 className="text-4xl font-black tracking-tight">{initialData ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onCancel} className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-700/50">
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="px-8 bg-[#1a253c] border-b border-slate-700/70 flex items-center gap-2">
          <button type="button" className={tabButtonClass(activeTab === 'general')} onClick={() => setActiveTab('general')}>General</button>
          <button type="button" className={tabButtonClass(activeTab === 'details')} onClick={() => setActiveTab('details')}>Details & Media</button>
          <button type="button" className={tabButtonClass(activeTab === 'shipping')} onClick={() => setActiveTab('shipping')}>Shipping & Policy</button>
        </div>

        <form id="productForm" onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto px-8 py-7 space-y-5">
            {formMessage && (
              <div className={`rounded-xl px-4 py-3 text-sm font-bold border ${formMessage.type === 'error' ? 'bg-red-500/10 text-red-200 border-red-400/30' : 'bg-green-500/10 text-green-200 border-green-400/30'}`}>
                {formMessage.text}
              </div>
            )}

            {activeTab === 'general' && (
              <div className="space-y-5">
                <div>
                  <label className="block mb-2 text-sm font-extrabold">Product Title</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="w-full h-14 px-5 rounded-2xl bg-slate-800 border border-slate-600 text-2xl font-semibold"
                    placeholder="e.g. Wireless Headphones"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Slug">
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
                      className="field-input"
                      placeholder="auto-from-name-if-empty"
                    />
                  </Field>
                  <Field label="Brand">
                    <input type="text" value={formData.brand} onChange={(e) => setFormData((p) => ({ ...p, brand: e.target.value }))} className="field-input" />
                  </Field>
                  <Field label="Model Number">
                    <input type="text" value={formData.modelNumber} onChange={(e) => setFormData((p) => ({ ...p, modelNumber: e.target.value }))} className="field-input" />
                  </Field>
                  <Field label="SKU">
                    <input type="text" value={formData.sku} onChange={(e) => setFormData((p) => ({ ...p, sku: e.target.value }))} className="field-input" />
                  </Field>
                  <Field label="Price (৳)">
                    <input type="number" min="0" step="0.01" value={formData.regularPrice} onChange={(e) => setFormData((p) => ({ ...p, regularPrice: parseFloat(e.target.value) || 0 }))} className="field-input" />
                  </Field>
                  <Field label="Discount Price (Optional)">
                    <input type="number" min="0" step="0.01" value={formData.salePrice ?? ''} onChange={(e) => setFormData((p) => ({ ...p, salePrice: e.target.value ? parseFloat(e.target.value) : null }))} className="field-input" />
                  </Field>
                  <Field label="Category">
                    <select value={formData.category} onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))} className="field-input">
                      {categoryList.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Stock Quantity">
                    <input type="number" min="0" value={formData.stock} onChange={(e) => setFormData((p) => ({ ...p, stock: parseInt(e.target.value, 10) || 0 }))} className="field-input" placeholder="e.g. 50" />
                  </Field>
                  <Field label="Delivery Fee (৳)">
                    <input type="number" min="0" step="0.01" value={formData.defaultDeliveryFee} onChange={(e) => setFormData((p) => ({ ...p, defaultDeliveryFee: parseFloat(e.target.value) || 0 }))} className="field-input" />
                  </Field>
                  <Field label="Status">
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as 'active' | 'inactive', isActive: e.target.value === 'active' }))}
                      className="field-input"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <label className="block mb-2 text-sm font-extrabold">Primary Image</label>
                  <p className="text-xs text-slate-300 mb-2">{formatImageGuideHint(ADMIN_IMAGE_GUIDES.productPrimary)}</p>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                    <div className="relative">
                      <ImageIcon className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                      <input
                        type="url"
                        value={formData.image}
                        onChange={(e) => setFormData((p) => ({ ...p, image: e.target.value }))}
                        className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-800 border border-slate-600 text-lg"
                        placeholder="https://example.com/primary-image.jpg"
                      />
                    </div>
                    <label className={`h-14 px-5 rounded-2xl border border-slate-500 bg-slate-800 flex items-center gap-2 text-sm font-bold cursor-pointer ${uploadingImage ? 'opacity-70 pointer-events-none' : ''}`}>
                      <Upload className="w-4 h-4" />
                      {uploadingImage ? 'Uploading...' : 'Upload Primary'}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadPrimaryImage(e.target.files?.[0])} />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-extrabold">Product Gallery</label>
                  <p className="text-xs text-slate-300 mb-2">{formatImageGuideHint(ADMIN_IMAGE_GUIDES.productGallery)}</p>
                  <label className={`w-full min-h-[140px] rounded-2xl border-2 border-dashed border-slate-500/80 bg-slate-800/50 flex flex-col items-center justify-center text-slate-300 text-lg p-6 cursor-pointer ${uploadingGallery ? 'opacity-70 pointer-events-none' : ''}`}>
                    <Upload className="w-7 h-7 mb-3" />
                    {uploadingGallery ? 'Uploading images...' : 'Click to upload multiple images (JPG/PNG)'}
                    <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleUploadGalleryImages(e.target.files)} />
                  </label>
                  <label className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-slate-300">
                    <input type="checkbox" checked={replaceGalleryOnUpload} onChange={(e) => setReplaceGalleryOnUpload(e.target.checked)} />
                    Replace existing images on upload
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="h-12 px-4 rounded-xl bg-slate-800 border border-slate-600"
                    placeholder="Or paste image URL and add"
                  />
                  <button type="button" onClick={addGalleryUrl} className="h-12 px-5 rounded-xl bg-[#ef3340] text-white font-extrabold">
                    <Plus className="w-4 h-4 inline mr-1" /> Add Image URL
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.images.length === 0 ? (
                    <p className="text-slate-400">No gallery images yet.</p>
                  ) : (
                    formData.images.map((img) => (
                      <div key={img} className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl p-3">
                        <img src={img} alt="" className="w-12 h-12 rounded-lg object-cover bg-slate-700" />
                        <span className="text-sm text-slate-200 truncate flex-1">{img}</span>
                        <button type="button" onClick={() => removeGalleryUrl(img)} className="p-2 text-red-300 hover:text-red-100"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))
                  )}
                </div>

                <div className="rounded-2xl border border-slate-700 p-4 bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black">Specifications (Key-Value)</p>
                    <button
                      type="button"
                      onClick={() => setSpecificationRows((prev) => [...prev, { key: '', value: '' }])}
                      className="text-xs font-bold px-3 py-1 rounded bg-slate-700 text-slate-100"
                    >
                      + Add Row
                    </button>
                  </div>
                  {specificationRows.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <input
                        type="text"
                        value={row.key}
                        onChange={(e) => setSpecificationRows((prev) => prev.map((r, i) => i === idx ? { ...r, key: e.target.value } : r))}
                        className="field-input"
                        placeholder="Key (e.g. Voltage)"
                      />
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) => setSpecificationRows((prev) => prev.map((r, i) => i === idx ? { ...r, value: e.target.value } : r))}
                        className="field-input"
                        placeholder="Value (e.g. 12V)"
                      />
                      <button
                        type="button"
                        onClick={() => setSpecificationRows((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)}
                        className="px-3 rounded bg-red-600/20 text-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <Field label="Compatibility (comma separated)">
                  <input
                    type="text"
                    value={compatibilityInput}
                    onChange={(e) => setCompatibilityInput(e.target.value)}
                    className="field-input"
                    placeholder="Toyota Corolla 2018, Honda Civic 2020"
                  />
                </Field>

                <div>
                  <label className="block mb-2 text-sm font-extrabold">Description</label>
                  <textarea
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    className="w-full p-4 rounded-2xl bg-slate-800 border border-slate-600"
                    placeholder="Enter product description"
                  />
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Weight (kg)">
                    <input type="number" min="0" step="0.001" value={formData.weight} onChange={(e) => setFormData((p) => ({ ...p, weight: parseFloat(e.target.value) || 0 }))} className="field-input" />
                  </Field>
                  <Field label="Delivery Charge (৳)">
                    <input type="number" min="0" step="0.01" value={formData.deliveryCharge} onChange={(e) => setFormData((p) => ({ ...p, deliveryCharge: parseFloat(e.target.value) || 0 }))} className="field-input" />
                  </Field>
                  <Field label="Warranty">
                    <input type="text" value={formData.warranty} onChange={(e) => setFormData((p) => ({ ...p, warranty: e.target.value }))} className="field-input" placeholder="e.g. 12 Months Official Warranty" />
                  </Field>
                  <Field label="Country of Origin">
                    <input type="text" value={formData.countryOfOrigin} onChange={(e) => setFormData((p) => ({ ...p, countryOfOrigin: e.target.value }))} className="field-input" />
                  </Field>
                  <Field label="Warranty (Months)">
                    <input type="number" min="0" value={formData.warrantyMonths} onChange={(e) => setFormData((p) => ({ ...p, warrantyMonths: parseInt(e.target.value, 10) || 0 }))} className="field-input" />
                  </Field>
                  <Field label="Warranty Policy">
                    <input type="text" value={formData.warrantyPolicy} onChange={(e) => setFormData((p) => ({ ...p, warrantyPolicy: e.target.value }))} className="field-input" placeholder="Replacement/Service policy" />
                  </Field>
                </div>

                <div className="rounded-2xl border border-slate-700 p-4 bg-slate-800/40">
                  <p className="text-sm font-black mb-3">Delivery Charges by City</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(formData.deliveryCharges).map(([city, charge]) => (
                      <div key={city} className="flex items-center gap-3">
                        <span className="w-28 text-sm font-bold text-slate-300">{city}</span>
                        <input type="number" min="0" value={charge} onChange={(e) => handleChargeChange(city, e.target.value)} className="field-input" />
                      </div>
                    ))}
                  </div>
                </div>

                <Field label="Shipping & Delivery Info">
                  <textarea rows={4} value={formData.shippingInfo} onChange={(e) => setFormData((p) => ({ ...p, shippingInfo: e.target.value }))} className="field-input !h-auto p-4" />
                </Field>
                <Field label="Return & Refund Policy">
                  <textarea rows={4} value={formData.returnPolicy} onChange={(e) => setFormData((p) => ({ ...p, returnPolicy: e.target.value }))} className="field-input !h-auto p-4" />
                </Field>
                <Field label="FAQs (Optional)">
                  <textarea rows={4} value={formData.faqText} onChange={(e) => setFormData((p) => ({ ...p, faqText: e.target.value }))} className="field-input !h-auto p-4" placeholder="One question/answer per line" />
                </Field>
                <Field label="Related Product IDs (comma separated)">
                  <input type="text" value={relatedIdsInput} onChange={(e) => setRelatedIdsInput(e.target.value)} className="field-input" placeholder="uuid1, uuid2" />
                </Field>
              </div>
            )}
          </div>

          <div className="px-8 py-5 bg-[#1a253c] border-t border-slate-700/70 flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="px-8 h-12 rounded-xl bg-slate-700 text-slate-100 font-bold">Cancel</button>
            <button type="submit" disabled={isSaving || uploadingImage || uploadingGallery} className="px-8 h-12 rounded-xl bg-[#ef3340] text-white font-extrabold flex items-center gap-2 disabled:opacity-70">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {initialData ? 'Save Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .field-input {
          width: 100%;
          height: 48px;
          border-radius: 12px;
          background: #1e2a40;
          border: 1px solid #41506c;
          padding: 0 14px;
          color: #e2e8f0;
          font-weight: 700;
        }
        .field-input::placeholder { color: #94a3b8; }
      `}</style>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block mb-2 text-sm font-extrabold">{label}</label>
    {children}
  </div>
);

export default ProductForm;
