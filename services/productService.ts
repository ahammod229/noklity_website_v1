
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { canUseFeature } from './tenantConfigService';

// Helper to map DB row to Product type
const mapProduct = (row: any): Product => ({
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
  image: row.image_url || 'https://via.placeholder.com/400x400?text=No+Image',
  images: Array.isArray(row.image_urls) ? row.image_urls : [],
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
});

export const getProducts = async (category?: string | null): Promise<Product[]> => {
  try {
    if (!(await canUseFeature('catalog_public'))) {
      return [];
    }

    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
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

    return (data || []).map(mapProduct);
  } catch (err) {
    console.error('Unexpected error in getProducts:', err);
    return [];
  }
};

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    if (!(await canUseFeature('catalog_public'))) {
      return null;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.message && error.message.includes('Failed to fetch')) {
        console.warn(`Network error fetching product ${id}`);
      } else {
        console.error(`Error fetching product ${id}:`, error.message);
      }
      return null;
    }
    return data ? mapProduct(data) : null;
  } catch (err) {
    console.error(`Unexpected error fetching product ${id}:`, err);
    return null;
  }
};

export const getFlashSaleProducts = async (): Promise<Product[]> => {
  try {
    if (!(await canUseFeature('flash_sales'))) {
      return [];
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_flash_sale', true)
      .eq('status', 'active');

    if (error) {
      if (error.message && error.message.includes('Failed to fetch')) {
        console.warn('Network error fetching flash sales.');
      } else {
        console.error('Error fetching flash sales:', error.message);
      }
      return [];
    }
    return (data || []).map(mapProduct);
  } catch (err) {
    console.error('Unexpected error fetching flash sales:', err);
    return [];
  }
};
