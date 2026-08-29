import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight, Plus, HelpCircle, Loader2, X, Trash2,
  Image as ImageIcon, Zap, RefreshCw, ChevronDown, ChevronUp,
  Upload, Star, Link
} from 'lucide-react';
import { Product } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { RichTextEditor } from './RichTextEditor';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductVariantFormData {
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
  highlights: string;
  whatsInBox: string;
  specifications: Record<string, string>;
  compatibility: string[];
  weight: number;
  length: number;
  width: number;
  height: number;
  deliveryCharge: number;
  warranty: string;
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
  dangerousGoods: string;
  warrantyType: string;
  isFlashSale: boolean;
  videoUrl: string;
  videoProvider: 'youtube' | 'upload' | 'media_center';
  variants: ProductVariantFormData[];
}

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  categories?: string[];
}

// ─── Default values ────────────────────────────────────────────────────────────

const DEFAULT_FORM_DATA: ProductFormData = {
  name: '',
  slug: '',
  brand: '',
  modelNumber: '',
  sku: '',
  category: '',
  regularPrice: 0,
  salePrice: null,
  stock: 0,
  defaultDeliveryFee: 0,
  isActive: true,
  image: '',
  images: [],
  description: '',
  highlights: '',
  whatsInBox: '',
  specifications: {},
  compatibility: [],
  weight: 0.5,
  length: 10,
  width: 10,
  height: 10,
  deliveryCharge: 0,
  warranty: 'No Warranty',
  warrantyMonths: 0,
  warrantyPolicy: '',
  deliveryCharges: {},
  shippingInfo: '',
  returnPolicy: '',
  faqText: '',
  relatedProductIds: [],
  countryOfOrigin: '',
  status: 'active',
  isPreorder: false,
  preorderExpectedDate: '',
  keywords: '',
  keyFeatures: [],
  dangerousGoods: 'none',
  warrantyType: 'No Warranty',
  isFlashSale: false,
  videoUrl: '',
  videoProvider: 'youtube',
  variants: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

const generateSku = () =>
  'SKU-' + Math.random().toString(36).substring(2, 8).toUpperCase();

const uploadProductImage = async (file: File): Promise<string> => {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from('products')
    .upload(path, file, { cacheControl: '31536000', upsert: false });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from('products').getPublicUrl(data.path);
  return urlData.publicUrl;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSaving,
  categories = [],
}) => {
  const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM_DATA);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVariantImageIdx, setUploadingVariantImageIdx] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showSalePriceInput, setShowSalePriceInput] = useState(false);
  const [showWarrantyExtra, setShowWarrantyExtra] = useState(false);
  const [showDescExtra, setShowDescExtra] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (!initialData) {
      setFormData(DEFAULT_FORM_DATA);
      return;
    }
    const hasSalePrice = !!initialData.originalPrice;
    setShowSalePriceInput(hasSalePrice);
    setFormData({
      name: initialData.name || '',
      slug: initialData.slug || '',
      brand: initialData.brand || 'No Brand',
      modelNumber: initialData.modelNumber || '',
      sku: initialData.sku || '',
      category: initialData.category || '',
      regularPrice: initialData.originalPrice || initialData.price || 0,
      salePrice: hasSalePrice ? initialData.price : null,
      stock: initialData.stock || 0,
      defaultDeliveryFee: Number(initialData.defaultDeliveryFee || 0),
      isActive: initialData.isActive !== false,
      image: initialData.image || '',
      images: initialData.images || (initialData.image ? [initialData.image] : []),
      description: initialData.description || '',
      highlights: (initialData.specifications as any)?.highlights || '',
      whatsInBox: (initialData.specifications as any)?.whatsInBox || '',
      specifications: initialData.specifications || {},
      compatibility: initialData.compatibility || [],
      weight: Number(initialData.weight || 0.5),
      length: 10,
      width: 10,
      height: 10,
      deliveryCharge: Number(initialData.deliveryCharge || 0),
      warranty: initialData.warranty || 'No Warranty',
      warrantyMonths: Number(initialData.warrantyMonths || 0),
      warrantyPolicy: initialData.warrantyPolicy || '',
      deliveryCharges: initialData.deliveryCharges || {},
      shippingInfo: initialData.shippingInfo || '',
      returnPolicy: initialData.returnPolicy || '',
      faqText: initialData.faqText || '',
      relatedProductIds: initialData.relatedProductIds || [],
      countryOfOrigin: initialData.countryOfOrigin || '',
      status: initialData.status || 'active',
      isPreorder: initialData.isPreorder || false,
      preorderExpectedDate: initialData.preorderExpectedDate || '',
      keywords: (initialData as any).keywords || '',
      keyFeatures: (initialData as any).keyFeatures || [],
      dangerousGoods: 'none',
      warrantyType: initialData.warranty || 'No Warranty',
      isFlashSale: initialData.isFlashSale || false,
      videoUrl: (initialData as any).videoUrl || '',
      videoProvider: (initialData as any).videoProvider || 'youtube',
      variants: (initialData as any).variants || [],
    });
  }, [initialData]);

  // ── Field helpers ──

  const set = useCallback(<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      // Auto-generate slug only if slug is empty or matches old auto-slug
      slug: !prev.slug || prev.slug === slugify(prev.name) ? slugify(name) : prev.slug,
    }));
  };

  // ── Image upload (files — supports multiple) ──

  const handleFilesUpload = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    if (!fileArr.length) return;
    setUploadingImages(true);
    setFormError(null);
    try {
      const urls = await Promise.all(fileArr.map(uploadProductImage));
      setFormData(prev => {
        const newImages = [...prev.images, ...urls];
        return { ...prev, images: newImages, image: prev.image || newImages[0] };
      });
    } catch (err: any) {
      const msg = err?.message || 'Unknown error';
      if (msg.includes('Bucket not found') || msg.includes('not found')) {
        setFormError('Storage bucket "products" not found in Supabase. Please create it from your Supabase Dashboard → Storage.');
      } else if (msg.includes('row-level security') || msg.includes('RLS') || msg.includes('policy')) {
        setFormError('Storage permission denied. Please check your Supabase Storage RLS policies.');
      } else {
        setFormError('Image upload failed: ' + msg);
      }
    } finally {
      setUploadingImages(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFilesUpload(e.target.files);
    e.target.value = '';
  };

  // Drag-and-drop handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingOver(true); };
  const handleDragLeave = () => setIsDraggingOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (files.length) handleFilesUpload(files);
  };

  const addImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    setFormData(prev => {
      const newImages = [...prev.images, url];
      return { ...prev, images: newImages, image: prev.image || url };
    });
    setImageUrlInput('');
  };

  const removeImage = (idx: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== idx);
      return { ...prev, images: newImages, image: newImages[0] || '' };
    });
  };

  const setMainImage = (url: string) => set('image', url);

  // ── Variant helpers ──

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        { name: '', price: prev.regularPrice || 0, stock: 0, sku: '', image_url: '' },
      ],
    }));
  };

  const updateVariant = (idx: number, field: keyof ProductVariantFormData, value: string | number) => {
    setFormData(prev => {
      const updated = prev.variants.map((v, i) => (i === idx ? { ...v, [field]: value } : v));
      return { ...prev, variants: updated };
    });
  };

  const removeVariant = (idx: number) => {
    setFormData(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }));
  };

  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVariantImageIdx(idx);
    try {
      const url = await uploadProductImage(file);
      updateVariant(idx, 'image_url', url);
    } catch (err: any) {
      setFormError(err.message || 'Failed to upload variant image');
    } finally {
      setUploadingVariantImageIdx(null);
      e.target.value = '';
    }
  };

  // ── Submit ──

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) return setFormError('Product Name is required.');
    if (!formData.category) return setFormError('Category is required.');
    if (formData.regularPrice <= 0) return setFormError('Price must be greater than 0.');
    if (formData.images.length === 0) return setFormError('At least 1 product image is required.');

    // Merge highlights/whatsInBox into specifications before submit
    const finalData: ProductFormData = {
      ...formData,
      specifications: {
        ...formData.specifications,
        highlights: formData.highlights,
        whatsInBox: formData.whatsInBox,
        dimensions: `${formData.length}×${formData.width}×${formData.height} cm`,
        warrantyType: formData.warrantyType,
        dangerousGoods: formData.dangerousGoods,
      },
      image: formData.image || formData.images[0] || '',
      warrantyType: formData.warrantyType,
    };

    await onSubmit(finalData);
  };

  const categoryList = categories.length > 0 ? categories : [];

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#f5f6f8] font-sans text-gray-800 min-h-screen">

      {/* ── Sticky Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-30 shadow-sm sticky top-0">
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

      {/* ── Page Body ── */}
      <div className="p-6">

        {/* Global error */}
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-[13px] font-medium">
            {formError}
          </div>
        )}

        <form id="productForm" onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">

          {/* ────────────────── LEFT COLUMN ────────────────── */}
          <div className="flex-1 space-y-6 pb-10">

            {/* ═══ Section 1: Basic Information ═══ */}
            <Section title="Basic Information">
              {/* Product Name */}
              <div>
                <Label required>Product Name</Label>
                <p className="text-[11px] text-gray-500 mb-2">
                  Setting up a clear product name improves product recall in search and apps.
                </p>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={255}
                    value={formData.name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="Ex. Nikon Coolpix A300 Digital Camera"
                    className={inputCls}
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] text-gray-400">
                    {formData.name.length}/255
                  </span>
                </div>
              </div>

              {/* Slug */}
              <div>
                <Label>URL Slug</Label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => set('slug', e.target.value)}
                    placeholder="auto-generated-from-name"
                    className={`${inputCls} font-mono text-[12px]`}
                  />
                  <button
                    type="button"
                    onClick={() => set('slug', slugify(formData.name))}
                    className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-[12px] text-gray-600 hover:bg-gray-200 whitespace-nowrap flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Auto
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <Label required>Category</Label>
                <select
                  required
                  value={formData.category}
                  onChange={e => set('category', e.target.value)}
                  className={selectCls}
                >
                  <option value="" disabled>Select a Category...</option>
                  {categoryList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Product Images */}
              <div>
                <Label required>
                  Product Images <HelpCircle className="w-3.5 h-3.5 text-gray-400 inline ml-1" />
                </Label>
                <p className="text-[11px] text-gray-500 mb-3">
                  Upload multiple images. Click any image to set it as main. Drag images to reorder.
                </p>

                {/* Drag & Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`rounded-xl border-2 border-dashed transition-all p-4 mb-3 ${
                    isDraggingOver
                      ? 'border-primary bg-primary/5 scale-[1.01]'
                      : 'border-gray-300 bg-gray-50/50 hover:border-primary/40 hover:bg-gray-50'
                  }`}
                >
                  {/* Existing Images Grid */}
                  <div className="flex flex-wrap gap-3 mb-3">
                    {formData.images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`relative w-[100px] h-[100px] border-2 rounded-lg group flex items-center justify-center bg-white cursor-pointer transition-all shadow-sm ${
                          formData.image === img
                            ? 'border-primary ring-2 ring-primary/20 shadow-primary/10 shadow-md'
                            : 'border-gray-200 hover:border-primary/40 hover:shadow'
                        }`}
                        onClick={() => setMainImage(img)}
                      >
                        <img src={img} alt={`Product ${idx + 1}`} className="max-w-full max-h-full object-contain p-1 rounded" />

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); removeImage(idx); }}
                          className="absolute -top-2.5 -right-2.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>

                        {/* Main badge */}
                        {formData.image === img ? (
                          <div className="absolute top-1.5 left-1.5 bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow">
                            <Star className="w-2.5 h-2.5 fill-white" /> MAIN
                          </div>
                        ) : (
                          <div className="absolute top-1.5 left-1.5 bg-gray-900/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                            Set Main
                          </div>
                        )}

                        {/* Index badge */}
                        <div className="absolute bottom-1 right-1.5 text-[9px] text-gray-400 font-bold">
                          {idx + 1}
                        </div>
                      </div>
                    ))}

                    {/* Upload more slots — always visible */}
                    <label className={`relative overflow-hidden w-[100px] h-[100px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                      uploadingImages
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-gray-300 bg-white hover:border-primary hover:bg-primary/5'
                    }`}>
                      {uploadingImages ? (
                        <>
                          <Loader2 className="w-7 h-7 text-primary animate-spin" />
                          <span className="text-[10px] text-primary mt-1.5 font-medium">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-8 h-8 text-gray-400" />
                          <span className="text-[10px] text-gray-500 mt-1 font-medium">Add Image</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileInputChange}
                        disabled={uploadingImages}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>
                  </div>

                  {/* Drop hint */}
                  <div className="flex items-center gap-2 justify-center text-gray-400">
                    <Upload className="w-4 h-4" />
                    <span className="text-[12px] font-medium">
                      {isDraggingOver ? 'Release to add images' : 'Drag & drop images here, or click "Add Image" to upload'}
                    </span>
                  </div>
                </div>

                {/* URL input row */}
                <div className="flex gap-2">
                  <div className="flex flex-1 items-center border border-gray-300 rounded hover:border-primary/50 focus-within:border-primary transition-colors overflow-hidden">
                    <Link className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
                    <input
                      type="url"
                      placeholder="Paste image URL and press Enter or click Add"
                      value={imageUrlInput}
                      onChange={e => setImageUrlInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                      className="flex-1 px-2.5 py-2 outline-none text-[13px] bg-transparent"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="text-[12px] bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded font-bold hover:bg-gray-200 whitespace-nowrap"
                  >
                    Add URL
                  </button>
                </div>

                {formData.images.length > 0 && (
                  <p className="text-[11px] text-gray-400 mt-2">
                    📷 {formData.images.length} image{formData.images.length > 1 ? 's' : ''} added
                    {formData.images.length > 1 ? ' — click any image to set it as the main photo' : ''}
                  </p>
                )}
              </div>

              {/* Video */}
              <div>
                <Label>
                  Video <HelpCircle className="w-3.5 h-3.5 text-gray-400 inline ml-1" />
                </Label>
                <div className="flex gap-5 mb-3 text-[13px] font-medium text-gray-700">
                  {(['youtube', 'upload', 'media_center'] as const).map(v => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="videoProvider"
                        checked={formData.videoProvider === v}
                        onChange={() => set('videoProvider', v)}
                        className="w-3.5 h-3.5 text-primary border-gray-300 focus:ring-primary"
                      />
                      {v === 'youtube' ? 'Youtube Link' : v === 'upload' ? 'Upload Video' : 'Media Center'}
                    </label>
                  ))}
                </div>

                {formData.videoProvider === 'youtube' && (
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={formData.videoUrl}
                    onChange={e => set('videoUrl', e.target.value)}
                    className={inputCls}
                  />
                )}
                {formData.videoProvider !== 'youtube' && (
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 border border-dashed border-gray-300 rounded flex flex-col items-center justify-center bg-gray-50 text-gray-300">
                      <Plus className="w-7 h-7" />
                      <span className="text-[10px] mt-1">Video</span>
                    </div>
                    <ul className="text-[11px] text-gray-500 space-y-1.5 mt-2 list-disc pl-4">
                      <li>Min size: 480×480 px. Max video length: 60 seconds. Max file size: 100MB.</li>
                      <li>Supported Format: mp4</li>
                      <li>New video might take up to 36 hrs to be approved</li>
                    </ul>
                  </div>
                )}
              </div>
            </Section>

            {/* ═══ Section 2: Product Specification ═══ */}
            <Section title="Product Specification">
              <p className="text-[11px] text-gray-500 mb-4">
                Filling in attributes will increase product searchability and drive sales conversion.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Brand */}
                <div>
                  <Label required>Brand</Label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={e => set('brand', e.target.value)}
                    placeholder="No Brand"
                    className={inputCls}
                  />
                </div>

                {/* Model Number */}
                <div>
                  <Label>Model Number</Label>
                  <input
                    type="text"
                    value={formData.modelNumber}
                    onChange={e => set('modelNumber', e.target.value)}
                    placeholder="e.g. ABC-1234"
                    className={inputCls}
                  />
                </div>

                {/* SKU */}
                <div>
                  <Label>Seller SKU</Label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={e => set('sku', e.target.value)}
                      placeholder="Seller SKU"
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => set('sku', generateSku())}
                      className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-[12px] text-gray-600 hover:bg-gray-200 whitespace-nowrap flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Auto
                    </button>
                  </div>
                </div>

                {/* Country of Origin */}
                <div>
                  <Label>Country of Origin</Label>
                  <input
                    type="text"
                    value={formData.countryOfOrigin}
                    onChange={e => set('countryOfOrigin', e.target.value)}
                    placeholder="e.g. China, Japan"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Keywords */}
              <div>
                <Label>
                  Keywords <HelpCircle className="w-3.5 h-3.5 text-gray-400 inline ml-1" />
                </Label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={e => set('keywords', e.target.value)}
                  placeholder="Comma-separated keywords for search (e.g. brake, disc, performance)"
                  className={inputCls}
                />
              </div>
            </Section>

            {/* ═══ Section 3: Price, Stock & Variants ═══ */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-lg flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-bold text-gray-800">Price, Stock & Variants</h2>
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                </div>
                <button
                  type="button"
                  onClick={addVariant}
                  className="bg-primary/10 text-primary px-3 py-1.5 rounded text-[13px] font-bold flex items-center gap-1 hover:bg-primary/20 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Variant
                </button>
              </div>
              <div className="p-6 space-y-5">

                {/* Base Price & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Regular Price */}
                  <div>
                    <Label required>Regular Price (৳)</Label>
                    <div className="flex items-center border border-gray-300 rounded focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-white">
                      <span className="px-2.5 text-gray-500 bg-gray-50 border-r border-gray-300 py-2 text-sm font-bold">৳</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="any"
                        value={formData.regularPrice || ''}
                        onChange={e => set('regularPrice', Number(e.target.value))}
                        className="w-full p-2 outline-none text-[13px]"
                      />
                    </div>
                  </div>

                  {/* Sale Price */}
                  <div>
                    <Label>Sale / Discount Price (৳)</Label>
                    {showSalePriceInput ? (
                      <div className="flex gap-2">
                        <div className="flex flex-1 items-center border border-gray-300 rounded focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-white">
                          <span className="px-2.5 text-gray-500 bg-gray-50 border-r border-gray-300 py-2 text-sm font-bold">৳</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={formData.salePrice ?? ''}
                            onChange={e => set('salePrice', e.target.value ? Number(e.target.value) : null)}
                            className="w-full p-2 outline-none text-[13px]"
                            placeholder="0"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => { setShowSalePriceInput(false); set('salePrice', null); }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowSalePriceInput(true)}
                        className="w-full px-3 py-2 border border-dashed border-gray-300 rounded text-[13px] text-primary font-medium hover:bg-primary/5 hover:border-primary transition-colors flex items-center gap-1 justify-center"
                      >
                        <Plus className="w-4 h-4" /> Add Sale Price
                      </button>
                    )}
                  </div>

                  {/* Stock */}
                  <div>
                    <Label required>Stock Quantity</Label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.stock || ''}
                      onChange={e => set('stock', Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Flash Sale & Status toggles */}
                <div className="flex flex-wrap gap-6 pt-2 border-t border-gray-100">
                  {/* Flash Sale */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => set('isFlashSale', !formData.isFlashSale)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${formData.isFlashSale ? 'bg-amber-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.isFlashSale ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                    <span className="text-[13px] font-medium text-gray-700 flex items-center gap-1">
                      <Zap className={`w-4 h-4 ${formData.isFlashSale ? 'text-amber-500' : 'text-gray-400'}`} />
                      Flash Sale
                    </span>
                  </label>

                  {/* Active Status */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => setFormData(prev => ({ ...prev, status: prev.status === 'active' ? 'inactive' : 'active', isActive: prev.status !== 'active' }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${formData.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.status === 'active' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                    <span className="text-[13px] font-medium text-gray-700">
                      {formData.status === 'active' ? 'Active (Visible)' : 'Inactive (Hidden)'}
                    </span>
                  </label>

                  {/* Preorder */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => set('isPreorder', !formData.isPreorder)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${formData.isPreorder ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.isPreorder ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                    <span className="text-[13px] font-medium text-gray-700">Pre-order</span>
                  </label>
                </div>

                {formData.isPreorder && (
                  <div>
                    <Label>Expected Delivery Date</Label>
                    <input
                      type="date"
                      value={formData.preorderExpectedDate}
                      onChange={e => set('preorderExpectedDate', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                )}

                {/* Variants Table */}
                {formData.variants.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-x-auto mt-2">
                    <table className="w-full text-left text-[13px]">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                        <tr>
                          <th className="px-3 py-3 font-semibold w-16">Image</th>
                          <th className="px-3 py-3 font-semibold">Variant Name</th>
                          <th className="px-3 py-3 font-semibold w-28">Price (৳)</th>
                          <th className="px-3 py-3 font-semibold w-24">Stock</th>
                          <th className="px-3 py-3 font-semibold w-32">SKU</th>
                          <th className="px-3 py-3 font-semibold w-16 text-center">Del</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {formData.variants.map((variant, idx) => (
                          <tr key={idx} className="bg-white hover:bg-gray-50/50">
                            {/* Variant Image */}
                            <td className="px-3 py-2">
                              <label className="relative w-10 h-10 border rounded bg-gray-50 flex items-center justify-center overflow-hidden group cursor-pointer">
                                {uploadingVariantImageIdx === idx ? (
                                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                ) : variant.image_url ? (
                                  <img src={variant.image_url} alt="variant" className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={e => handleVariantImageUpload(e, idx)}
                                />
                              </label>
                            </td>
                            {/* Name */}
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={variant.name}
                                onChange={e => updateVariant(idx, 'name', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-primary text-[13px]"
                                placeholder="e.g. Red, XL, 128GB"
                              />
                            </td>
                            {/* Price */}
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="0"
                                value={variant.price || ''}
                                onChange={e => updateVariant(idx, 'price', Number(e.target.value))}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-primary text-[13px]"
                              />
                            </td>
                            {/* Stock */}
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="0"
                                value={variant.stock || ''}
                                onChange={e => updateVariant(idx, 'stock', Number(e.target.value))}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-primary text-[13px]"
                              />
                            </td>
                            {/* SKU */}
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={variant.sku}
                                onChange={e => updateVariant(idx, 'sku', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-primary text-[13px]"
                                placeholder="SKU"
                              />
                            </td>
                            {/* Delete */}
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeVariant(idx)}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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

            {/* ═══ Section 4: Product Description ═══ */}
            <Section title="Product Description">
              {/* Main Description — Custom Rich Text Editor */}
              <div>
                <Label>Main Description</Label>
                <p className="text-[11px] text-gray-500 mb-2">
                  Format text with the toolbar. Click 🖼 to insert images directly into the description.
                </p>
                <RichTextEditor
                  value={formData.description}
                  onChange={(val: string) => set('description', val)}
                  placeholder="Describe your product in detail. Use Bold, Italic, headings, lists, and insert images..."
                  minHeight={200}
                />
              </div>

              {/* Highlights */}
              <div>
                <Label required>Highlights</Label>
                <textarea
                  value={formData.highlights}
                  onChange={e => set('highlights', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 h-28 resize-y text-[13px] outline-none hover:border-primary/50 focus:border-primary"
                  placeholder="Key features, bullet points..."
                />
              </div>

              {/* What's in the Box */}
              <div>
                <Label required>What's in the Box</Label>
                <input
                  type="text"
                  value={formData.whatsInBox}
                  onChange={e => set('whatsInBox', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 1x Device, 1x Charger, 1x User Manual"
                />
              </div>

              {/* Show More toggle */}
              <button
                type="button"
                onClick={() => setShowDescExtra(prev => !prev)}
                className="text-primary text-[13px] font-medium flex items-center gap-1 hover:underline"
              >
                {showDescExtra ? <><ChevronUp className="w-4 h-4" /> Show Less</> : <><ChevronDown className="w-4 h-4" /> Show More Fields</>}
              </button>

              {showDescExtra && (
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <div>
                    <Label>Shipping Info</Label>
                    <textarea
                      value={formData.shippingInfo}
                      onChange={e => set('shippingInfo', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 h-24 resize-y text-[13px] outline-none hover:border-primary/50 focus:border-primary"
                      placeholder="Shipping details, estimated delivery..."
                    />
                  </div>
                  <div>
                    <Label>Return Policy</Label>
                    <textarea
                      value={formData.returnPolicy}
                      onChange={e => set('returnPolicy', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 h-24 resize-y text-[13px] outline-none hover:border-primary/50 focus:border-primary"
                      placeholder="Return and refund policy..."
                    />
                  </div>
                  <div>
                    <Label>FAQ</Label>
                    <textarea
                      value={formData.faqText}
                      onChange={e => set('faqText', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 h-24 resize-y text-[13px] outline-none hover:border-primary/50 focus:border-primary"
                      placeholder="Frequently asked questions and answers..."
                    />
                  </div>
                </div>
              )}
            </Section>

            {/* ═══ Section 5: Shipping & Warranty ═══ */}
            <Section title="Shipping & Warranty">

              {/* Package Weight */}
              <div>
                <Label required>Package Weight</Label>
                <div className="flex items-center max-w-xs">
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    placeholder="0.001 ~ 300"
                    value={formData.weight || ''}
                    onChange={e => set('weight', Number(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l hover:border-primary/50 focus:border-primary outline-none text-[13px]"
                  />
                  <span className="px-3 py-2 border-y border-r border-gray-300 rounded-r bg-gray-50 text-[13px] text-gray-600 font-medium">kg</span>
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <Label required>
                  Package Dimensions (cm) — Length × Width × Height
                </Label>
                <div className="flex items-center gap-2 max-w-lg">
                  {(['length', 'width', 'height'] as const).map((dim, i) => (
                    <React.Fragment key={dim}>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder={['Length', 'Width', 'Height'][i]}
                        value={formData[dim] || ''}
                        onChange={e => set(dim, Number(e.target.value))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded hover:border-primary/50 focus:border-primary outline-none text-[13px]"
                      />
                      {i < 2 && <span className="text-gray-400 font-bold">×</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Delivery Charge */}
              <div>
                <Label>Default Delivery Fee (৳)</Label>
                <div className="flex items-center max-w-xs border border-gray-300 rounded focus-within:border-primary bg-white">
                  <span className="px-2.5 text-gray-500 bg-gray-50 border-r border-gray-300 py-2 text-sm font-bold">৳</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.defaultDeliveryFee || ''}
                    onChange={e => set('defaultDeliveryFee', Number(e.target.value))}
                    className="flex-1 p-2 outline-none text-[13px]"
                  />
                </div>
              </div>

              {/* Dangerous Goods */}
              <div>
                <Label>Dangerous Goods</Label>
                <div className="flex gap-5">
                  {[
                    { value: 'none', label: 'None' },
                    { value: 'contains', label: 'Contains battery / flammables / liquid' },
                  ].map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 text-[13px] cursor-pointer font-medium text-gray-700">
                      <input
                        type="radio"
                        name="dangerousGoods"
                        checked={formData.dangerousGoods === opt.value}
                        onChange={() => set('dangerousGoods', opt.value)}
                        className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Warranty Type */}
              <div>
                <Label>Warranty Type</Label>
                <select
                  value={formData.warranty}
                  onChange={e => set('warranty', e.target.value)}
                  className={`${selectCls} max-w-sm`}
                >
                  <option value="">Select</option>
                  <option value="No Warranty">No Warranty</option>
                  <option value="Local Seller Warranty">Local Seller Warranty</option>
                  <option value="Brand Warranty">Brand Warranty</option>
                  <option value="International Manufacturer Warranty">International Manufacturer Warranty</option>
                  <option value="International Seller Warranty">International Seller Warranty</option>
                </select>
              </div>

              {/* Show More Warranty toggle */}
              <button
                type="button"
                onClick={() => setShowWarrantyExtra(prev => !prev)}
                className="text-primary text-[13px] font-medium flex items-center gap-1 hover:underline"
              >
                {showWarrantyExtra
                  ? <><ChevronUp className="w-4 h-4" /> Hide Warranty Details</>
                  : <><ChevronDown className="w-4 h-4" /> More Warranty Settings</>}
              </button>

              {showWarrantyExtra && (
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  {/* Warranty Period */}
                  <div>
                    <Label>Warranty Period</Label>
                    <select
                      value={formData.warrantyMonths || ''}
                      onChange={e => set('warrantyMonths', Number(e.target.value))}
                      className={`${selectCls} max-w-xs`}
                    >
                      <option value="">Select</option>
                      <option value="1">1 Month</option>
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">1 Year</option>
                      <option value="24">2 Years</option>
                      <option value="36">3 Years</option>
                      <option value="60">5 Years</option>
                    </select>
                  </div>

                  {/* Warranty Policy */}
                  <div>
                    <Label>Warranty Policy</Label>
                    <textarea
                      value={formData.warrantyPolicy}
                      onChange={e => set('warrantyPolicy', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 h-24 resize-y text-[13px] outline-none hover:border-primary/50 focus:border-primary"
                      placeholder="Describe the warranty terms and conditions..."
                    />
                  </div>

                  {/* Return Policy (also here) */}
                  {!showDescExtra && (
                    <div>
                      <Label>Return Policy</Label>
                      <textarea
                        value={formData.returnPolicy}
                        onChange={e => set('returnPolicy', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 h-24 resize-y text-[13px] outline-none hover:border-primary/50 focus:border-primary"
                        placeholder="Return and refund policy..."
                      />
                    </div>
                  )}
                </div>
              )}
            </Section>

          </div>
          {/* ────────────────── END LEFT COLUMN ────────────────── */}

          {/* ────────────────── RIGHT SIDEBAR ────────────────── */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-20 space-y-4">

              {/* Content Score */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 className="font-bold text-gray-800 mb-3 text-[14px]">Content Score</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Product Name', done: formData.name.trim().length > 2 },
                    { label: 'Category', done: !!formData.category },
                    { label: 'Images (min 1)', done: formData.images.length > 0 },
                    { label: 'Price', done: formData.regularPrice > 0 },
                    { label: 'Stock', done: formData.stock > 0 },
                    { label: 'Description', done: formData.description.replace(/<[^>]*>/g, '').trim().length > 10 },
                    { label: 'Brand', done: !!formData.brand.trim() && formData.brand.trim() !== 'No Brand' },
                  ].map(item => {
                    const score = [formData.name.trim().length > 2, !!formData.category, formData.images.length > 0, formData.regularPrice > 0, formData.stock > 0, formData.description.replace(/<[^>]*>/g, '').trim().length > 10, !!formData.brand.trim()].filter(Boolean).length;
                    return (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-green-500' : 'border-2 border-gray-300'}`}>
                          {item.done && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12"><path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <span className={`text-[12px] font-medium ${item.done ? 'text-gray-700' : 'text-gray-400'}`}>
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  const score = [formData.name.trim().length > 2, !!formData.category, formData.images.length > 0, formData.regularPrice > 0, formData.stock > 0, formData.description.replace(/<[^>]*>/g, '').trim().length > 10, !!formData.brand.trim()].filter(Boolean).length;
                  const pct = Math.round(score / 7 * 100);
                  return (
                    <>
                      <div className="mt-4 bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className={`text-[11px] mt-1 text-right font-bold ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                        {pct}% complete {pct === 100 ? '🎉' : pct >= 80 ? '✅' : ''}
                      </p>
                    </>
                  );
                })()}
              </div>

              {/* Tips */}
              <div className="bg-amber-50 rounded-lg border border-amber-200 p-5">
                <h3 className="font-bold text-amber-700 mb-2 text-[13px]">💡 Tips</h3>
                <ul className="text-[12px] text-amber-800 space-y-2 leading-relaxed">
                  <li>• Upload at least 3 clear images for better sales</li>
                  <li>• Set a sale price to attract more buyers</li>
                  <li>• Add keywords to improve search visibility</li>
                  <li>• Fill in warranty info to build buyer trust</li>
                </ul>
              </div>

            </div>
          </div>
          {/* ────────────────── END RIGHT SIDEBAR ────────────────── */}

        </form>
      </div>
      {/* ── END Page Body ── */}

      {/* ── Sticky Footer ── */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30 sticky bottom-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-2.5 text-gray-600 font-bold bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-[13px]"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="productForm"
          disabled={isSaving}
          className="px-10 py-2.5 text-white font-bold bg-primary rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2 min-w-[130px] transition-colors shadow-sm active:scale-95 text-[13px] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSaving ? 'Saving...' : initialData ? 'Update Product' : 'Publish Product'}
        </button>
      </div>

    </div>
  );
};

// ─── Shared sub-components ────────────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
      <h2 className="text-[15px] font-bold text-gray-800">{title}</h2>
    </div>
    <div className="p-6 space-y-5">{children}</div>
  </div>
);

const Label: React.FC<{ required?: boolean; children: React.ReactNode }> = ({ required, children }) => (
  <label className="block text-[13px] font-bold text-gray-800 mb-1">
    {required && <span className="text-red-500 mr-1">*</span>}
    {children}
  </label>
);

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[13px] transition-colors';

const selectCls =
  'w-full px-3 py-2 border border-gray-300 rounded hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[13px] bg-white cursor-pointer transition-colors';
