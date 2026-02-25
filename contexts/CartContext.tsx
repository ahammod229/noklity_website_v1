
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { CartItem, Product } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
  isLoading: boolean;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart on mount or when user changes
  useEffect(() => {
    let mounted = true;

    const loadCart = async () => {
      setIsLoading(true);
      try {
        if (user) {
          // Load from Supabase
          const { data, error } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', user.id);

          if (error) throw error;

          if (mounted && data) {
            const items: CartItem[] = data.map((item: any) => ({
              id: item.product_id,
              name: item.title,
              price: item.price,
              image: item.image,
              quantity: item.quantity,
              category: 'General', // Default as Supabase table strictly follows requested schema
              rating: 5, // Default
              isNew: false
            }));
            setCart(items);
          }
        } else {
          // Load from LocalStorage
          const stored = localStorage.getItem('noklity_cart');
          if (mounted && stored) {
            setCart(JSON.parse(stored));
          } else if (mounted) {
            setCart([]);
          }
        }
      } catch (err) {
        console.error('Failed to load cart:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadCart();

    return () => {
      mounted = false;
    };
  }, [user]);

  // Persist helper
  const saveCartToStorage = (newCart: CartItem[]) => {
    if (!user) {
      localStorage.setItem('noklity_cart', JSON.stringify(newCart));
    }
  };

  const addToCart = async (product: Product) => {
    // Optimistic Update
    let newCart = [...cart];
    const existingIndex = newCart.findIndex(item => item.id === product.id);

    if (existingIndex >= 0) {
      newCart[existingIndex].quantity += 1;
    } else {
      newCart.push({ ...product, quantity: 1 });
    }

    setCart(newCart);
    setIsCartOpen(true);
    saveCartToStorage(newCart);

    if (user) {
      try {
        const item = newCart.find(i => i.id === product.id);
        if (item) {
          await supabase.from('cart_items').upsert({
            user_id: user.id,
            product_id: product.id,
            title: product.name,
            price: product.price,
            image: product.image,
            quantity: item.quantity
          }, { onConflict: 'user_id, product_id' });
        }
      } catch (err) {
        console.error('Error syncing cart add:', err);
      }
    }
  };

  const removeFromCart = async (productId: string) => {
    const newCart = cart.filter(item => item.id !== productId);
    setCart(newCart);
    saveCartToStorage(newCart);

    if (user) {
      try {
        await supabase.from('cart_items').delete().match({ user_id: user.id, product_id: productId });
      } catch (err) {
        console.error('Error syncing cart remove:', err);
      }
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return;

    const newCart = cart.map(item => 
      item.id === productId ? { ...item, quantity } : item
    );
    setCart(newCart);
    saveCartToStorage(newCart);

    if (user) {
      try {
        const item = newCart.find(i => i.id === productId);
        if (item) {
          await supabase.from('cart_items').update({ quantity }).match({ user_id: user.id, product_id: productId });
        }
      } catch (err) {
        console.error('Error syncing cart update:', err);
      }
    }
  };

  const clearCart = async () => {
    setCart([]);
    saveCartToStorage([]);

    if (user) {
      try {
        await supabase.from('cart_items').delete().eq('user_id', user.id);
      } catch (err) {
        console.error('Error clearing cart:', err);
      }
    }
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      isLoading,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
