
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Product } from '../types';

interface WishlistContextType {
  wishlist: Product[];
  addToWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchWishlist = async () => {
      if (!user) {
        setWishlist([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('wishlist_items')
          .select('product_id, products(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (mounted && data) {
          const products = data
            .map((item: any) => {
              const p = item.products;
              if (!p) return null; // Handle case where product might be deleted
              return {
                id: p.id,
                name: p.title,
                price: p.discount_price || p.price,
                originalPrice: p.discount_price ? p.price : undefined,
                image: p.image_url || '',
                category: p.category || 'General',
                rating: p.rating || 0,
                stock: p.stock || 0,
                isFlashSale: p.is_flash_sale,
                description: p.description
              } as Product;
            })
            .filter((p): p is Product => p !== null);
            
          setWishlist(products);
        }
      } catch (err) {
        console.error('Error fetching wishlist:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchWishlist();

    return () => {
      mounted = false;
    };
  }, [user]);

  const addToWishlist = async (product: Product) => {
    if (!user) {
      throw new Error('Not logged in');
    }

    if (isInWishlist(product.id)) return;

    // Optimistic Update
    setWishlist(prev => [product, ...prev]);

    try {
      const { error } = await supabase
        .from('wishlist_items')
        .insert({ user_id: user.id, product_id: product.id });

      if (error) throw error;
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      // Revert
      setWishlist(prev => prev.filter(p => p.id !== product.id));
      throw err;
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;

    const previousWishlist = [...wishlist];
    setWishlist(prev => prev.filter(p => p.id !== productId));

    try {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      setWishlist(previousWishlist);
      throw err;
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(p => p.id === productId);
  };

  return (
    <WishlistContext.Provider value={{ 
      wishlist, 
      addToWishlist, 
      removeFromWishlist, 
      isInWishlist, 
      isLoading 
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
