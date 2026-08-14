
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { canUseFeature, canUseFeatureSnapshot } from './tenantConfigService';

export const isCatalogVisibleProductRow = (row: any) => {
  const normalizedStatus = String(row?.status || '').trim().toLowerCase();
  return normalizedStatus !== 'inactive' && row?.is_active !== false;
};

const normalizeImageUrls = (value: unknown) =>
  Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

// Helper to map DB row to Product type
const mapProduct = (row: any): Product => {
  const images = normalizeImageUrls(row.image_urls);
  const primaryImage = String(row.image_url || '').trim() || images[0] || 'https://via.placeholder.com/400x400?text=No+Image';

  return {
    id: row.id,
    name: row.title,
    slug: row.slug || '',
    brand: row.brand || '',
    modelNumber: row.model_number || '',
    sku: row.sku || '',
    category: row.category || 'Uncategorized',
    price: row.discount_price || row.price, // Current selling price
    originalPrice: row.discount_price ? row.price : undefined, // Original price if on sale
    specifications: (row.specifications || {}) as Record<string, string>,
    compatibility: Array.isArray(row.compatibility) ? row.compatibility : [],
    weight: row.weight ? Number(row.weight) : undefined,
    deliveryCharge: row.delivery_charge ? Number(row.delivery_charge) : 0,
    warranty: row.warranty || '',
    countryOfOrigin: row.country_of_origin || '',
    status: row.status || 'active',
    taxPercent: Number(row.tax_percent || 0),
    defaultDeliveryFee: Number(row.default_delivery_fee || 0),
    image: primaryImage,
    images,
    deliveryCharges: row.delivery_charges || {},
    warrantyMonths: Number(row.warranty_months || 0),
    warrantyPolicy: row.warranty_policy || '',
    shippingInfo: row.shipping_info || '',
    returnPolicy: row.return_policy || '',
    faqText: row.faq_text || '',
    relatedProductIds: Array.isArray(row.related_product_ids) ? row.related_product_ids : [],
    isActive: row.is_active !== false,
    rating: row.rating || 0,
    stock: row.stock || 0,
    isFlashSale: row.is_flash_sale || false,
    description: row.description || '',
    isNew: (new Date().getTime() - new Date(row.created_at).getTime()) < (30 * 24 * 60 * 60 * 1000) // New if < 30 days
  };
};

interface CatalogApiResponse<T> {
  data: T;
}

const getEnvVar = (key: string) => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) {
    return String((import.meta as any).env[key]);
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return String(process.env[key]);
  }
  return '';
};

const EXPLICIT_API_BASE_URL = String(getEnvVar('VITE_API_BASE_URL') || '').trim();
const API_BASE_URL = EXPLICIT_API_BASE_URL.replace(/\/+$/, '');
const CATALOG_API_ENABLED = Boolean(API_BASE_URL);
const CATALOG_API_TIMEOUT_MS = 1200;

const fetchWithTimeout = async (input: RequestInfo | URL, init?: RequestInit, timeoutMs = 5000) => {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal
    });
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
};

const buildApiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const isFeatureEnabledFast = async (featureKey: 'catalog_public' | 'flash_sales') => {
  if (canUseFeatureSnapshot(featureKey)) {
    return true;
  }
  return canUseFeature(featureKey);
};

const fetchCatalogFromApi = async <T>(path: string): Promise<T | null> => {
  if (!CATALOG_API_ENABLED) {
    return null;
  }

  try {
    const response = await fetchWithTimeout(buildApiUrl(path), {
      headers: {
        Accept: 'application/json'
      }
    }, CATALOG_API_TIMEOUT_MS);

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }

    const payload = (await response.json()) as CatalogApiResponse<T>;
    return payload.data ?? null;
  } catch (error) {
    console.warn('Mongo API catalog request failed, falling back to Supabase.', error);
    return null;
  }
};

export const getProducts = async (category?: string | null): Promise<Product[]> => {
  try {
    if (!(await isFeatureEnabledFast('catalog_public'))) {
      return [];
    }

    const params = new URLSearchParams();
    if (category) {
      params.set('category', category);
    }

    const mernProducts = await fetchCatalogFromApi<Product[]>(
      `/products${params.toString() ? `?${params.toString()}` : ''}`
    );
    if (mernProducts) {
      return mernProducts;
    }

    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      // Check for network/fetch errors specifically
      if (error.message && error.message.includes('Failed to fetch')) {
        console.warn('Network error: Unable to fetch products. Checking connection...');
      } else {
        console.error('Supabase error fetching products:', error.message);
      }
      return [];
    }

    return (data || []).filter(isCatalogVisibleProductRow).map(mapProduct);
  } catch (err) {
    console.error('Unexpected error in getProducts:', err);
    return [];
  }
};

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    if (!(await isFeatureEnabledFast('catalog_public'))) {
      return null;
    }

    const mernProduct = await fetchCatalogFromApi<Product>(`/products/${encodeURIComponent(id)}`);
    if (mernProduct) {
      return mernProduct;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.message && error.message.includes('Failed to fetch')) {
        console.warn(`Network error fetching product ${id}`);
      } else {
        console.error(`Error fetching product ${id}:`, error.message);
      }
      return null;
    }
    return data && isCatalogVisibleProductRow(data) ? mapProduct(data) : null;
  } catch (err) {
    console.error(`Unexpected error fetching product ${id}:`, err);
    return null;
  }
};

export const getFlashSaleProducts = async (): Promise<Product[]> => {
  try {
    if (!(await isFeatureEnabledFast('flash_sales'))) {
      return [];
    }

    const mernProducts = await fetchCatalogFromApi<Product[]>('/products/flash-sale');
    if (mernProducts) {
      return mernProducts;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_flash_sale', true);

    if (error) {
      if (error.message && error.message.includes('Failed to fetch')) {
        console.warn('Network error fetching flash sales.');
      } else {
        console.error('Error fetching flash sales:', error.message);
      }
      return [];
    }
    return (data || []).filter(isCatalogVisibleProductRow).map(mapProduct);
  } catch (err) {
    console.error('Unexpected error fetching flash sales:', err);
    return [];
  }
};
