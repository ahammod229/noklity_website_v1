import { Product } from '../types';

// Mock Data (Acting as temporary database)
let MOCK_WISHLIST_DB: Product[] = [
  {
    id: '101',
    name: 'Brembo GT Braking System Kit',
    category: 'Brakes',
    price: 1250.00,
    image: 'https://images.unsplash.com/photo-1626438061453-623e1987d603?q=80&w=2940&auto=format&fit=crop',
    rating: 5.0,
    isNew: true
  },
  {
    id: '103',
    name: 'KW V3 Coilover Suspension',
    category: 'Suspension',
    price: 1895.50,
    image: 'https://images.unsplash.com/photo-1614251412693-4a1f6494cb68?q=80&w=2940&auto=format&fit=crop',
    rating: 4.9
  },
  {
    id: '105',
    name: 'Recaro Sportster CS Seat',
    category: 'Interior',
    price: 1450.00,
    image: 'https://images.unsplash.com/photo-1582239433989-13833215904d?q=80&w=2848&auto=format&fit=crop',
    rating: 4.7
  }
];

/**
 * Retrieves the current user's wishlist.
 * 
 * @returns Promise resolving to an array of Product objects.
 */
export const getWishlist = async (): Promise<Product[]> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 800));

  /* 
    TODO: SUPABASE INTEGRATION
    1. Get current authenticated user ID.
    2. Perform a join query on 'wishlists' and 'products':
       const { data, error } = await supabase
         .from('wishlists')
         .select('product_id, products(*)')
         .eq('user_id', userId);
    3. Return formatted product list.
  */

  return [...MOCK_WISHLIST_DB];
};

/**
 * Adds a product to the wishlist.
 * 
 * @param productId - The ID of the product to add.
 * @returns Promise resolving to success status (boolean).
 */
export const addToWishlist = async (productId: string): Promise<boolean> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log(`[Mock Service] Adding product ${productId} to wishlist.`);

  /* 
    TODO: SUPABASE INTEGRATION
    1. Check if user is authenticated.
    2. Check if item already exists to prevent duplicates (or rely on DB unique constraint).
    3. Insert record:
       const { error } = await supabase
         .from('wishlists')
         .insert({ user_id: userId, product_id: productId });
  */

  // Mock Logic: Since we don't have the full product object here in this signature, 
  // we are just simulating the API call success. 
  // In a real app, the UI would likely optimistically update or refetch.
  return true; 
};

/**
 * Removes a product from the wishlist.
 * 
 * @param productId - The ID of the product to remove.
 * @returns Promise resolving to success status (boolean).
 */
export const removeFromWishlist = async (productId: string): Promise<boolean> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log(`[Mock Service] Removing product ${productId} from wishlist.`);

  /* 
    TODO: SUPABASE INTEGRATION
    1. Get current authenticated user ID.
    2. Delete record:
       const { error } = await supabase
         .from('wishlists')
         .delete()
         .match({ user_id: userId, product_id: productId });
  */

  // Update Mock DB
  MOCK_WISHLIST_DB = MOCK_WISHLIST_DB.filter(p => p.id !== productId);

  return true;
};
