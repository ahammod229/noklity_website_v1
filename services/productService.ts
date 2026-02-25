
import { supabase } from '../lib/supabase';
import { Product } from '../types';

// Helper to map DB row to Product type
const mapProduct = (row: any): Product => ({
  id: row.id,
  name: row.title,
  category: row.category || 'Uncategorized',
  price: row.discount_price || row.price, // Current selling price
  originalPrice: row.discount_price ? row.price : undefined, // Original price if on sale
  image: row.image_url || 'https://via.placeholder.com/400x400?text=No+Image',
  rating: row.rating || 0,
  stock: row.stock || 0,
  isFlashSale: row.is_flash_sale || false,
  description: row.description || '',
  isNew: (new Date().getTime() - new Date(row.created_at).getTime()) < (30 * 24 * 60 * 60 * 1000) // New if < 30 days
});

export const getProducts = async (category?: string | null): Promise<Product[]> => {
  try {
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

    return (data || []).map(mapProduct);
  } catch (err) {
    console.error('Unexpected error in getProducts:', err);
    return [];
  }
};

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
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
    return data ? mapProduct(data) : null;
  } catch (err) {
    console.error(`Unexpected error fetching product ${id}:`, err);
    return null;
  }
};

export const getFlashSaleProducts = async (): Promise<Product[]> => {
  try {
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
    return (data || []).map(mapProduct);
  } catch (err) {
    console.error('Unexpected error fetching flash sales:', err);
    return [];
  }
};
