
import { supabase } from '../lib/supabase';
import { Product } from '../types';

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
    let dbQuery = supabase.from('products').select('*', { count: 'exact' });

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
      console.error('Search error:', JSON.stringify(error, null, 2));
      return { 
        products: [], 
        totalCount: 0, 
        facets: { categories: [], priceRange: { min: 0, max: 0 } } 
      };
    }

    const products = (data || []).map(mapProduct);

    // Simplified Facets (In a real app, these would be separate aggregation queries)
    return {
      products,
      totalCount: count || 0,
      facets: {
        categories: [], 
        priceRange: { min: 0, max: 5000 }
      }
    };
  } catch (err) {
    console.error('Unexpected error in searchProducts:', err);
    return { 
      products: [], 
      totalCount: 0, 
      facets: { categories: [], priceRange: { min: 0, max: 0 } } 
    };
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
      .eq('is_active', true)
      .eq('status', 'active')
      .gt('stock', 0)
      .limit(limit);

    if (error) {
      console.error('Suggestion search error:', JSON.stringify(error, null, 2));
      return [];
    }

    return (data || []).map(mapSuggestion);
  } catch (error) {
    console.error('Unexpected suggestion search error:', error);
    return [];
  }
};
