
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

interface InventorySnapshot {
  id: string;
  title: string | null;
  stock: number;
  status: string | null;
  is_active: boolean | null;
}

const isUnavailable = (row: InventorySnapshot | undefined | null) =>
  !row || row.is_active === false || (row.status && row.status !== 'active') || Number(row.stock || 0) <= 0;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const fetchInventorySnapshots = async (productIds: string[]): Promise<Map<string, InventorySnapshot>> => {
    const ids = Array.from(new Set(productIds.filter(Boolean)));
    if (ids.length === 0) return new Map();

    const { data, error } = await supabase
      .from('products')
      .select('id,title,stock,status,is_active')
      .in('id', ids);

    if (error) {
      throw error;
    }

    const map = new Map<string, InventorySnapshot>();
    for (const row of data || []) {
      map.set(String(row.id), {
        id: String(row.id),
        title: row.title ?? null,
        stock: Math.max(0, Number(row.stock || 0)),
        status: row.status ?? null,
        is_active: row.is_active ?? null
      });
    }
    return map;
  };

  const normalizeCartWithInventory = (rawCart: CartItem[], inventory: Map<string, InventorySnapshot>) => {
    const nextCart: CartItem[] = [];
    const removedIds: string[] = [];
    const adjustedQty: Array<{ productId: string; quantity: number }> = [];

    for (const item of rawCart) {
      const snapshot = inventory.get(item.id);
      if (isUnavailable(snapshot)) {
        removedIds.push(item.id);
        continue;
      }

      const maxStock = Math.max(0, Number(snapshot!.stock || 0));
      const safeQuantity = Math.max(1, Math.min(Number(item.quantity || 1), maxStock));
      if (safeQuantity !== item.quantity) {
        adjustedQty.push({ productId: item.id, quantity: safeQuantity });
      }

      nextCart.push({
        ...item,
        stock: maxStock,
        quantity: safeQuantity
      });
    }

    return { nextCart, removedIds, adjustedQty };
  };

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
            const rawItems: CartItem[] = data.map((item: any) => ({
              id: item.product_id,
              name: item.title,
              price: item.price,
              image: item.image,
              quantity: item.quantity,
              category: 'General', // Default as Supabase table strictly follows requested schema
              rating: 5, // Default
              isNew: false
            }));

            let items = rawItems;
            try {
              const inventoryMap = await fetchInventorySnapshots(rawItems.map((item) => item.id));
              const normalized = normalizeCartWithInventory(rawItems, inventoryMap);
              items = normalized.nextCart;

              if (normalized.removedIds.length > 0) {
                await supabase
                  .from('cart_items')
                  .delete()
                  .eq('user_id', user.id)
                  .in('product_id', normalized.removedIds);
              }

              if (normalized.adjustedQty.length > 0) {
                await Promise.all(
                  normalized.adjustedQty.map((entry) =>
                    supabase
                      .from('cart_items')
                      .update({ quantity: entry.quantity })
                      .match({ user_id: user.id, product_id: entry.productId })
                  )
                );
              }
            } catch (inventoryError) {
              console.error('Failed to validate cart inventory:', inventoryError);
            }

            if (mounted) {
              setCart(items);
            }
          }
        } else {
          // Load from LocalStorage
          const stored = localStorage.getItem('noklity_cart');
          if (mounted && stored) {
            const parsed = JSON.parse(stored) as CartItem[];
            let items = parsed;
            try {
              const inventoryMap = await fetchInventorySnapshots(parsed.map((item) => item.id));
              const normalized = normalizeCartWithInventory(parsed, inventoryMap);
              items = normalized.nextCart;
              localStorage.setItem('noklity_cart', JSON.stringify(items));
            } catch (inventoryError) {
              console.error('Failed to validate guest cart inventory:', inventoryError);
            }
            if (mounted) setCart(items);
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
    const inventoryMap = await fetchInventorySnapshots([product.id]);
    const snapshot = inventoryMap.get(product.id);
    const productName = product.name || snapshot?.title || 'This product';

    if (isUnavailable(snapshot)) {
      throw new Error(`${productName} is out of stock.`);
    }

    const availableStock = Math.max(0, Number(snapshot!.stock || 0));

    // Optimistic Update
    let newCart = [...cart];
    const existingIndex = newCart.findIndex(item => item.id === product.id);

    if (existingIndex >= 0) {
      if (newCart[existingIndex].quantity >= availableStock) {
        throw new Error(`Only ${availableStock} item(s) available for ${productName}.`);
      }
      newCart[existingIndex].quantity += 1;
      newCart[existingIndex].stock = availableStock;
    } else {
      newCart.push({ ...product, stock: availableStock, quantity: 1 });
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

    const currentItem = cart.find((item) => item.id === productId);
    const fallbackName = currentItem?.name || 'This product';
    const inventoryMap = await fetchInventorySnapshots([productId]);
    const snapshot = inventoryMap.get(productId);

    if (isUnavailable(snapshot)) {
      const newCart = cart.filter((item) => item.id !== productId);
      setCart(newCart);
      saveCartToStorage(newCart);

      if (user) {
        try {
          await supabase.from('cart_items').delete().match({ user_id: user.id, product_id: productId });
        } catch (err) {
          console.error('Error syncing cart remove for out-of-stock item:', err);
        }
      }

      throw new Error(`${fallbackName} is out of stock and was removed from your cart.`);
    }

    const availableStock = Math.max(0, Number(snapshot!.stock || 0));
    const safeQuantity = Math.min(quantity, availableStock);

    const newCart = cart.map(item => 
      item.id === productId ? { ...item, quantity: safeQuantity, stock: availableStock } : item
    );
    setCart(newCart);
    saveCartToStorage(newCart);

    if (user) {
      try {
        const item = newCart.find(i => i.id === productId);
        if (item) {
          await supabase.from('cart_items').update({ quantity: safeQuantity }).match({ user_id: user.id, product_id: productId });
        }
      } catch (err) {
        console.error('Error syncing cart update:', err);
      }
    }

    if (safeQuantity !== quantity) {
      throw new Error(`Only ${availableStock} item(s) available for ${fallbackName}. Quantity updated.`);
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
