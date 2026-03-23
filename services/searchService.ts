
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { isCatalogVisibleProductRow } from './productService';

export interface SearchFilters {
  category?: string[];
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest';
}

export interface SearchResult {
  products: Product[];
  totalCount: number;
  facets: {
    categories: { name: string; count: number }[];
    priceRange: { min: number; max: number };
  };
}

export interface SearchSuggestion {
  id: string;
  name: string;
  category: string;
  image: string;
  price: number;
}

const mapProduct = (row: any): Product => ({
  id: row.id,
  name: row.title,
  category: row.category || 'Uncategorized',
  price: row.discount_price || row.price,
  originalPrice: row.discount_price ? row.price : undefined,
  image: row.image_url || '',
  rating: row.rating || 0,
  stock: row.stock || 0,
  isFlashSale: row.is_flash_sale || false,
  description: row.description || '',
  isNew: (new Date().getTime() - new Date(row.created_at).getTime()) < (30 * 24 * 60 * 60 * 1000)
});

const mapSuggestion = (row: any): SearchSuggestion => ({
  id: row.id,
  name: row.title || 'Untitled Product',
  category: row.category || 'Uncategorized',
  image: row.image_url || '',
  price: row.discount_price ?? row.price ?? 0
});

const sanitizeLike = (value: string) =>
  value.replace(/[%_]/g, '').trim();

/**
 * Searches for products based on query and filters.
 */
export const searchProducts = async (query: string, filters: SearchFilters = {}): Promise<SearchResult> => {
  try {
    let dbQuery = supabase
      .from('products')
      .select('id,title,category,price,discount_price,image_url,rating,stock,is_flash_sale,description,created_at,status,is_active', { count: 'exact' });

    // 1. Text Search (ILIKE)
    if (query && query.trim() !== '') {
      // Searching primarily in title. 
      // Note: For advanced search, full text search (fts) vector setup in DB is better.
      // Using simple ilike for now.
      dbQuery = dbQuery.ilike('title', `%${query}%`);
    }

    // 2. Apply Filters
    if (filters.category && filters.category.length > 0) {
      dbQuery = dbQuery.in('category', filters.category);
    }

    if (filters.minPrice !== undefined) {
      dbQuery = dbQuery.gte('price', filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      dbQuery = dbQuery.lte('price', filters.maxPrice);
    }

    if (filters.rating !== undefined) {
      dbQuery = dbQuery.gte('rating', filters.rating);
    }

    // 3. Sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          dbQuery = dbQuery.order('price', { ascending: true });
          break;
        case 'price_desc':
          dbQuery = dbQuery.order('price', { ascending: false });
          break;
        case 'newest':
          dbQuery = dbQuery.order('created_at', { ascending: false });
          break;
        default:
          // Default sorting
          break;
      }
    }

    const { data, count, error } = await dbQuery;

    if (error) {
      throw new Error(error.message || 'Unable to search products.');
    }

    const products = (data || []).filter(isCatalogVisibleProductRow).map(mapProduct);
    const categoryCounts = new Map<string, number>();
    let maxPrice = 0;

    products.forEach((product) => {
      categoryCounts.set(product.category, (categoryCounts.get(product.category) || 0) + 1);
      maxPrice = Math.max(maxPrice, Number(product.price || 0));
    });

    return {
      products,
      totalCount: products.length || count || 0,
      facets: {
        categories: Array.from(categoryCounts.entries()).map(([name, itemCount]) => ({ name, count: itemCount })),
        priceRange: { min: 0, max: maxPrice || 5000 }
      }
    };
  } catch (err) {
    console.error('Unexpected error in searchProducts:', err);
    throw err instanceof Error ? err : new Error('Unexpected search error.');
  }
};

export const getSearchSuggestions = async (query: string, limit = 6): Promise<SearchSuggestion[]> => {
  const normalized = sanitizeLike(query);
  if (!normalized) return [];

  try {
    const likeValue = `%${normalized}%`;
    const { data, error } = await supabase
      .from('products')
      .select('id,title,category,image_url,price,discount_price,is_active,status,stock')
      .or(`title.ilike.${likeValue},category.ilike.${likeValue},brand.ilike.${likeValue}`)
      .gt('stock', 0)
      .limit(limit);

    if (error) {
      console.error('Suggestion search error:', JSON.stringify(error, null, 2));
      return [];
    }

    return (data || []).filter(isCatalogVisibleProductRow).map(mapSuggestion);
  } catch (error) {
    console.error('Unexpected suggestion search error:', error);
    return [];
  }
};
