import { Product } from '../types';

interface SearchFilters {
  category?: string[];
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest';
}

interface SearchResult {
  products: Product[];
  totalCount: number;
  facets: {
    categories: { name: string; count: number }[];
    priceRange: { min: number; max: number };
  };
}

// MOCK DATA
const MOCK_SEARCH_RESULTS: Product[] = [
  {
    id: 's-1',
    name: 'Brembo Ceramic Brake Pads - Front',
    category: 'Brakes',
    price: 85.00,
    image: 'https://images.unsplash.com/photo-1626438061453-623e1987d603?q=80&w=2940&auto=format&fit=crop',
    rating: 4.8,
    stock: 15,
    description: 'High performance ceramic brake pads for superior stopping power and low dust.'
  },
  {
    id: 's-2',
    name: 'Performance Drilled & Slotted Rotors',
    category: 'Brakes',
    price: 245.00,
    originalPrice: 299.00,
    image: 'https://images.unsplash.com/photo-1626438061453-623e1987d603?q=80&w=2940&auto=format&fit=crop', // Reusing mock image for brakes
    rating: 4.9,
    stock: 8,
    isNew: true
  },
  {
    id: 's-3',
    name: 'Brake Caliper Assembly - Red',
    category: 'Brakes',
    price: 320.00,
    image: 'https://images.unsplash.com/photo-1626438061453-623e1987d603?q=80&w=2940&auto=format&fit=crop',
    rating: 4.5,
    stock: 3
  },
  {
    id: 's-4',
    name: 'Hydraulic Brake Fluid DOT 4',
    category: 'Fluids',
    price: 18.99,
    image: 'https://images.unsplash.com/photo-1563290747-0e3189196b42?q=80&w=2832&auto=format&fit=crop',
    rating: 4.7,
    stock: 50
  },
  {
    id: 's-5',
    name: 'Stainless Steel Brake Lines',
    category: 'Brakes',
    price: 110.00,
    image: 'https://images.unsplash.com/photo-1626438061453-623e1987d603?q=80&w=2940&auto=format&fit=crop',
    rating: 4.6,
    stock: 12
  }
];

/**
 * Searches for products based on query and filters.
 * 
 * @param query - Search keyword
 * @param filters - Object containing filter criteria
 * @returns Promise resolving to search results
 */
export const searchProducts = async (query: string, filters: SearchFilters = {}): Promise<SearchResult> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 600));

  console.log(`[Mock Service] Searching for "${query}" with filters:`, filters);

  /* 
    TODO: BACKEND INTEGRATION
    1. Sanitize input query.
    2. Construct Supabase Full Text Search query:
       let dbQuery = supabase
         .from('products')
         .select('*')
         .textSearch('title', query);
    3. Apply filters:
       if (filters.category) dbQuery = dbQuery.in('category', filters.category);
       if (filters.minPrice) dbQuery = dbQuery.gte('price', filters.minPrice);
    4. Execute query and return data.
  */

  // Basic mock filtering logic for demonstration
  let results = [...MOCK_SEARCH_RESULTS];

  // If query is empty, maybe return nothing or all? For this UI demo, we always return brake related stuff if query is "brake"
  if (query.toLowerCase().includes('empty')) {
      results = [];
  }

  return {
    products: results,
    totalCount: results.length,
    facets: {
      categories: [
        { name: 'Brakes', count: 15 },
        { name: 'Fluids', count: 4 },
        { name: 'Suspension', count: 2 },
      ],
      priceRange: { min: 0, max: 1000 }
    }
  };
};