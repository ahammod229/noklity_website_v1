import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Trash2, Plus, X, Image as ImageIcon, Check, GripVertical, Upload, Loader2, Pencil } from 'lucide-react';
import { supabase, uploadFile } from '../../lib/supabase';
import { ADMIN_IMAGE_GUIDES, formatImageGuideHint, validateImageAgainstGuide } from '../../utils/adminImageGuides';
import { optimizeImageByGuide } from '../../utils/imageOptimization';

type TargetType = 'none' | 'product' | 'category' | 'url';

interface HeroBanner {
  id: string;
  badge_text: string;
  title: string;
  highlight_text: string | null;
  description: string | null;
  image_url: string;
  primary_button_text: string;
  secondary_button_text: string;
  target_type: TargetType;
  target_product_id: string | null;
  target_category: string | null;
  target_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  mobile_image_url: string | null;
  settings: any;
}

interface ProductOption {
  id: string;
  title: string;
  status: 'active' | 'inactive' | null;
}

interface HeroForm {
  badge_text: string;
  title: string;
  highlight_text: string;
  description: string;
  image_url: string;
  mobile_image_url: string;
  primary_button_text: string;
  secondary_button_text: string;
  target_type: TargetType;
  target_product_id: string;
  target_category: string;
  primary_target_url: string;
  secondary_target_url: string;
  is_active: boolean;
  sort_order: number;
  settings: {
    layout: "left" | "center" | "right";
    overlay: "dark-gradient" | "light-gradient" | "solid-dark" | "solid-light" | "none";
    text_theme: "light" | "dark";
    banner_height: "standard" | "tall";
  };
}

const EMPTY_FORM: HeroForm = {
  badge_text: 'Premium Selection',
  title: '',
  highlight_text: '',
  description: '',
  image_url: '',
  mobile_image_url: '',
  primary_button_text: 'Shop Now',
  secondary_button_text: 'View Catalog',
  target_type: 'none',
  target_product_id: '',
  target_category: '',
  primary_target_url: '',
  secondary_target_url: '',
  is_active: true,
  sort_order: 0,
  settings: {
    layout: "left",
    overlay: "dark-gradient",
    text_theme: "light",
    banner_height: "standard"
  }
};

const parseBannerTargetUrls = (value?: string | null): { primary: string; secondary: string } => {
  const raw = String(value || '').trim();
  if (!raw) return { primary: '', secondary: '' };

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const record = parsed as Record<string, unknown>;
      const primary = String(record.primary || record.shop_now || record.shopNow || '').trim();
      const secondary = String(record.secondary || record.view_catalog || record.viewCatalog || '').trim();
      if (primary || secondary) {
        return { primary, secondary };
      }
    }
  } catch {
    // backward compatibility: plain URL stored before JSON support
  }

  return { primary: raw, secondary: '' };
};

const toFriendlyError = (message?: string) => {
  const normalized = String(message || '').trim();
  if (!normalized) return 'An unexpected error occurred.';
  return `RAW ERROR: ${normalized}`;
};

const HeroBanners: React.FC = () => {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HeroForm>(EMPTY_FORM);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedPrimaryProductId, setSelectedPrimaryProductId] = useState('');
  const [selectedSecondaryCategory, setSelectedSecondaryCategory] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSelectedPrimaryProductId('');
    setSelectedSecondaryCategory('');
  };

  const fetchAll = async () => {
    setLoading(true);
    setMessage(null);

    const [bannersRes, productsRes, categoriesRes] = await Promise.all([
      supabase
        .from('hero_banners')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase
        .from('products')
        .select('id,title,status')
        .order('title', { ascending: true }),
      supabase
        .from('categories')
        .select('name')
        .eq('is_active', true)
        .order('name', { ascending: true })
    ]);

    if (bannersRes.error) {
      setMessage({ type: 'error', text: toFriendlyError(bannersRes.error.message) });
    } else {
      setBanners((bannersRes.data || []) as unknown as HeroBanner[]);
    }

    if (!productsRes.error && productsRes.data) {
      setProducts((productsRes.data || []) as ProductOption[]);
    }

    if (!categoriesRes.error && categoriesRes.data) {
      setCategories((categoriesRes.data || []).map((item: { name: string }) => item.name));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleUploadImage = async (file?: File | null) => {
    if (!file) return;
    setMessage(null);
    setUploadingImage(true);
    try {
      const validation = await validateImageAgainstGuide(file, ADMIN_IMAGE_GUIDES.heroBanner);
      if (validation.shouldBlock) {
        setMessage({ type: 'error', text: validation.message });
        return;
      }
      const optimized = await optimizeImageByGuide(file, ADMIN_IMAGE_GUIDES.heroBanner, {
        fileNamePrefix: 'hero-banner',
        fit: 'cover'
      });
      const path = `hero-banners/${optimized.file.name}`;
      const { publicUrl } = await uploadFile('assets', path, optimized.file, { upsert: false });
      setForm((prev) => ({ ...prev, image_url: publicUrl }));
      setMessage({ type: 'success', text: `${validation.message} Optimized ${optimized.reducedPercent}% smaller.` });
    } catch (err: any) {
      setMessage({ type: 'error', text: toFriendlyError(err.message) });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUploadMobileImage = async (file?: File | null) => {
    if (!file) return;
    setMessage(null);
    setUploadingImage(true);
    try {
      const validation = await validateImageAgainstGuide(file, ADMIN_IMAGE_GUIDES.heroBanner);
      if (validation.shouldBlock) {
        setMessage({ type: 'error', text: validation.message });
        return;
      }
      const optimized = await optimizeImageByGuide(file, ADMIN_IMAGE_GUIDES.heroBanner, {
        fileNamePrefix: 'hero-banner-mobile',
        fit: 'cover'
      });
      const path = `hero-banners-mobile/${optimized.file.name}`;
      const { publicUrl } = await uploadFile('assets', path, optimized.file, { upsert: false });
      setForm((prev) => ({ ...prev, mobile_image_url: publicUrl }));
      setMessage({ type: 'success', text: `${validation.message} Optimized mobile image ${optimized.reducedPercent}% smaller.` });

    } catch (error: any) {
      setMessage({ type: 'error', text: toFriendlyError(error?.message || 'Hero image upload failed') });
    } finally {
      setUploadingImage(false);
    }
  };

  const payloadFromForm = () => ({
    badge_text: form.badge_text.trim() || 'Premium Selection',
    title: form.title.trim(),
    highlight_text: form.highlight_text.trim() || null,
    description: form.description.trim() || null,
    image_url: form.image_url.trim(),
    mobile_image_url: form.mobile_image_url.trim() || null,
    primary_button_text: form.primary_button_text.trim() || 'Shop Now',
    secondary_button_text: form.secondary_button_text.trim() || 'View Catalog',
    target_type: form.target_type,
    target_product_id: form.target_type === 'product' ? (form.target_product_id || null) : null,
    target_category: form.target_type === 'category' ? (form.target_category.trim() || null) : null,
    target_url: form.target_type === 'url'
      ? (() => {
          const primary = form.primary_target_url.trim();
          const secondary = form.secondary_target_url.trim();
          if (!primary && !secondary) return null;
          if (!secondary) return primary;
          return JSON.stringify({ primary, secondary });
        })()
      : null,
    is_active: form.is_active,
    sort_order: Number(form.sort_order || 0)
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!form.title.trim()) {
      setMessage({ type: 'error', text: 'Title is required.' });
      return;
    }
    if (!form.image_url.trim()) {
      setMessage({ type: 'error', text: 'Image URL is required.' });
      return;
    }
    if (form.target_type === 'product' && !form.target_product_id) {
      setMessage({ type: 'error', text: 'Select a target product.' });
      return;
    }
    if (form.target_type === 'category' && !form.target_category.trim()) {
      setMessage({ type: 'error', text: 'Select a target category.' });
      return;
    }
    if (form.target_type === 'url' && !form.primary_target_url.trim() && !form.secondary_target_url.trim()) {
      setMessage({ type: 'error', text: 'Provide at least one button URL for Shop Now or View Catalog.' });
      return;
    }

    setSaving(true);
    const payload = payloadFromForm();
    const response = editingId
      ? await supabase.from('hero_banners').update(payload as any).eq('id', editingId)
      : await supabase.from('hero_banners').insert(payload as any);

    setSaving(false);

    if (response.error) {
      setMessage({ type: 'error', text: toFriendlyError(response.error.message) });
      return;
    }

    setMessage({ type: 'success', text: editingId ? 'Banner updated.' : 'Banner created.' });
    resetForm();
    fetchAll();
  };

  const handleEdit = (banner: HeroBanner) => {
    const parsedUrls = parseBannerTargetUrls(banner.target_url);
    setEditingId(banner.id);
    setForm({
      badge_text: banner.badge_text || 'Premium Selection',
      title: banner.title,
      highlight_text: banner.highlight_text || '',
      description: banner.description || '',
      image_url: banner.image_url,
      mobile_image_url: banner.mobile_image_url || '',
      primary_button_text: banner.primary_button_text || 'Shop Now',
      secondary_button_text: banner.secondary_button_text || 'View Catalog',
      target_type: banner.target_type,
      target_product_id: banner.target_product_id || '',
      target_category: banner.target_category || '',
      settings: {
        layout: banner.settings?.layout || "left",
        overlay: banner.settings?.overlay || "dark-gradient",
        text_theme: banner.settings?.text_theme || "light",
        banner_height: banner.settings?.banner_height || "standard"
      },
      primary_target_url: parsedUrls.primary,
      secondary_target_url: parsedUrls.secondary,
      is_active: banner.is_active,
      sort_order: banner.sort_order ?? 0
    });
    const matchedPrimaryProduct = products.find((product) => `/product/${product.id}` === parsedUrls.primary);
    setSelectedPrimaryProductId(matchedPrimaryProduct?.id || '');
    const matchedSecondaryCategory = categories.find((name) => `/search?q=${encodeURIComponent(name)}` === parsedUrls.secondary);
    setSelectedSecondaryCategory(matchedSecondaryCategory || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this hero banner?')) return;
    setMessage(null);
    const { error } = await supabase.from('hero_banners').delete().eq('id', id);
    if (error) {
      setMessage({ type: 'error', text: toFriendlyError(error.message) });
      return;
    }
    setMessage({ type: 'success', text: 'Banner deleted.' });
    fetchAll();
  };

  const updateBanner = async (id: string, updates: Partial<HeroBanner>) => {
    setMessage(null);
    const { error } = await supabase.from('hero_banners').update(updates as any).eq('id', id);
    if (error) {
      setMessage({ type: 'error', text: toFriendlyError(error.message) });
      return false;
    }
    return true;
  };

  const productTitleById = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((product) => map.set(product.id, product.title));
    return map;
  }, [products]);

  const handlePrimaryProductSelect = (value: string) => {
    setSelectedPrimaryProductId(value);
    if (!value) return;
    setForm((prev) => ({ ...prev, primary_target_url: `/product/${value}` }));
  };

  const handleSecondaryCategorySelect = (value: string) => {
    setSelectedSecondaryCategory(value);
    if (!value) return;
    setForm((prev) => ({ ...prev, secondary_target_url: `/search?q=${encodeURIComponent(value)}` }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Hero Banners</h2>
        <p className="text-gray-500 font-medium">Manage homepage hero slides and link each slide to product, category, or URL.</p>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{editingId ? 'Edit Banner' : 'Add Banner'}</h3>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-xs font-bold text-gray-600 hover:text-gray-900">
              Cancel Editing
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold" placeholder="Badge text" value={form.badge_text} onChange={(e) => setForm((prev) => ({ ...prev, badge_text: e.target.value }))} />
          <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold" placeholder="Title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
          <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold" placeholder="Highlight text" value={form.highlight_text} onChange={(e) => setForm((prev) => ({ ...prev, highlight_text: e.target.value }))} />
          <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold" placeholder="Image URL" value={form.image_url} onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))} />
          <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold" placeholder="Mobile Image URL (Optional)" value={form.mobile_image_url} onChange={(e) => setForm((prev) => ({ ...prev, mobile_image_url: e.target.value }))} />
          <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold" placeholder="Primary button text" value={form.primary_button_text} onChange={(e) => setForm((prev) => ({ ...prev, primary_button_text: e.target.value }))} />
          <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold" placeholder="Secondary button text" value={form.secondary_button_text} onChange={(e) => setForm((prev) => ({ ...prev, secondary_button_text: e.target.value }))} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={`inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-50 w-fit ${uploadingImage ? 'opacity-70 pointer-events-none' : ''}`}>
              <Upload className="w-4 h-4" />
              {uploadingImage ? 'Uploading...' : 'Upload Desktop Image'}
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadImage(e.target.files?.[0])} />
            </label>
            <p className="text-xs text-gray-500 mt-1">{formatImageGuideHint(ADMIN_IMAGE_GUIDES.heroBanner)}</p>
          </div>
          <div>
            <label className={`inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-50 w-fit ${uploadingImage ? 'opacity-70 pointer-events-none' : ''}`}>
              <Upload className="w-4 h-4" />
              {uploadingImage ? 'Uploading...' : 'Upload Mobile Image (Optional)'}
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadMobileImage(e.target.files?.[0])} />
            </label>
            <p className="text-xs text-gray-500 mt-1">Recommended: 800x1200 or 1:1.5 ratio</p>
          </div>
        </div>

        <textarea
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        />

        
        {/* Advanced Settings */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-4">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Advanced Appearance</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Text Layout</label>
              <select 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                value={form.settings.layout}
                onChange={(e) => setForm(prev => ({...prev, settings: {...prev.settings, layout: e.target.value as any}}))}
              >
                <option value="left">Left Align</option>
                <option value="center">Center Align</option>
                <option value="right">Right Align</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Image Overlay</label>
              <select 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                value={form.settings.overlay}
                onChange={(e) => setForm(prev => ({...prev, settings: {...prev.settings, overlay: e.target.value as any}}))}
              >
                <option value="dark-gradient">Dark Gradient (Left)</option>
                <option value="light-gradient">Light Gradient (Left)</option>
                <option value="solid-dark">Solid Dark Overlay</option>
                <option value="solid-light">Solid Light Overlay</option>
                <option value="none">No Overlay</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Text Theme</label>
              <select 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                value={form.settings.text_theme}
                onChange={(e) => setForm(prev => ({...prev, settings: {...prev.settings, text_theme: e.target.value as any}}))}
              >
                <option value="light">Light (White Text)</option>
                <option value="dark">Dark (Black Text)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Banner Height</label>
              <select 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                value={form.settings.banner_height}
                onChange={(e) => setForm(prev => ({...prev, settings: {...prev.settings, banner_height: e.target.value as any}}))}
              >
                <option value="standard">Standard (500px)</option>
                <option value="tall">Tall (600px)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold"
            value={form.target_type}
            onChange={(e) => setForm((prev) => ({ ...prev, target_type: e.target.value as TargetType }))}
          >
            <option value="none">No Link</option>
            <option value="product">Product</option>
            <option value="category">Category</option>
            <option value="url">Custom URL</option>
          </select>

          {form.target_type === 'product' && (
            <select
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold md:col-span-2"
              value={form.target_product_id}
              onChange={(e) => setForm((prev) => ({ ...prev, target_product_id: e.target.value }))}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title} ({product.status || 'active'})
                </option>
              ))}
            </select>
          )}

          {form.target_type === 'category' && (
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold"
                value={categories.includes(form.target_category) ? form.target_category : ''}
                onChange={(e) => setForm((prev) => ({ ...prev, target_category: e.target.value }))}
              >
                <option value="">Select category</option>
                {categories.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <input
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold"
                placeholder="Or type category"
                value={form.target_category}
                onChange={(e) => setForm((prev) => ({ ...prev, target_category: e.target.value }))}
              />
            </div>
          )}

          {form.target_type === 'url' && (
            <div className="md:col-span-2 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold"
                  placeholder="Shop Now URL (e.g. /product/abc)"
                  value={form.primary_target_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, primary_target_url: e.target.value }))}
                />
                <input
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold"
                  placeholder="View Catalog URL (optional)"
                  value={form.secondary_target_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, secondary_target_url: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold"
                  value={selectedPrimaryProductId}
                  onChange={(e) => handlePrimaryProductSelect(e.target.value)}
                >
                  <option value="">Quick pick Shop Now product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title}
                    </option>
                  ))}
                </select>

                <select
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold"
                  value={selectedSecondaryCategory}
                  onChange={(e) => handleSecondaryCategorySelect(e.target.value)}
                >
                  <option value="">Quick pick View Catalog category</option>
                  {categories.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, secondary_target_url: '/search' }))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                >
                  Set View Catalog = /search
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPrimaryProductId('');
                    setSelectedSecondaryCategory('');
                    setForm((prev) => ({ ...prev, primary_target_url: '', secondary_target_url: '' }));
                  }}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                >
                  Clear URLs
                </button>
              </div>

              <p className="text-xs text-gray-500">
                Tip: Shop Now usually uses `/product/PRODUCT_ID` and View Catalog uses `/search` or `/search?q=category`.
              </p>
            </div>
          )}

          {form.target_type === 'none' && (
            <div className="md:col-span-2 px-3 py-2 border border-dashed border-gray-200 rounded-lg text-sm text-gray-500">
              Banner will open catalog section.
            </div>
          )}

          <input
            type="number"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold"
            value={form.sort_order}
            onChange={(e) => setForm((prev) => ({ ...prev, sort_order: Number(e.target.value || 0) }))}
            placeholder="Sort order"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
            />
            Active
          </label>
          <button type="submit" disabled={saving || uploadingImage} className="px-5 py-2.5 rounded-lg bg-primary text-white font-bold text-sm flex items-center gap-2 disabled:opacity-70">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
            {editingId ? 'Save Banner' : 'Add Banner'}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Banner</th>
                  <th className="px-6 py-3">Target</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Sort</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {banners.length === 0 ? (
                  <tr>
                    <td className="px-6 py-6 text-gray-500 text-sm" colSpan={5}>
                      No hero banners yet. Create one above.
                    </td>
                  </tr>
                ) : (
                  banners.map((banner) => (
                    <tr key={banner.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {banner.image_url ? (
                            <img src={banner.image_url} alt={banner.title} className="w-14 h-10 object-cover rounded-lg border border-gray-200" />
                          ) : (
                            <div className="w-14 h-10 rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-gray-400">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-900">{banner.title}{banner.highlight_text ? ` ${banner.highlight_text}` : ''}</p>
                            <p className="text-xs text-gray-500">{banner.badge_text}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-700">
                        {banner.target_type === 'product' && banner.target_product_id ? (
                          <span>Product: {productTitleById.get(banner.target_product_id) || banner.target_product_id}</span>
                        ) : null}
                        {banner.target_type === 'category' ? <span>Category: {banner.target_category || '-'}</span> : null}
                        {banner.target_type === 'url' ? (
                          <span>
                            {(() => {
                              const urls = parseBannerTargetUrls(banner.target_url);
                              if (!urls.primary && !urls.secondary) return 'URL: -';
                              return `Shop: ${urls.primary || '-'}${urls.secondary ? ` | Catalog: ${urls.secondary}` : ''}`;
                            })()}
                          </span>
                        ) : null}
                        {banner.target_type === 'none' ? <span>Catalog section</span> : null}
                      </td>
                      <td className="px-6 py-4">
                        <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={banner.is_active}
                            onChange={async (e) => {
                              const checked = e.target.checked;
                              const ok = await updateBanner(banner.id, { is_active: checked });
                              if (ok) {
                                setBanners((prev) => prev.map((item) => item.id === banner.id ? { ...item, is_active: checked } : item));
                              }
                            }}
                          />
                          {banner.is_active ? 'Active' : 'Inactive'}
                        </label>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={banner.sort_order}
                          onChange={(e) => {
                            const next = Number(e.target.value || 0);
                            setBanners((prev) => prev.map((item) => item.id === banner.id ? { ...item, sort_order: next } : item));
                          }}
                          onBlur={(e) => updateBanner(banner.id, { sort_order: Number(e.target.value || 0) })}
                          className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold"
                        />
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleEdit(banner)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(banner.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroBanners;
