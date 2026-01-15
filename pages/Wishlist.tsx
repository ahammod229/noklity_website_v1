
import React, { useState } from 'react';
import WishlistCard from '../components/WishlistCard';
import { Heart, Package } from 'lucide-react';
import { Product } from '../types';
import { MOCK_PRODUCTS } from '../data/mockData';

interface WishlistProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: any) => void;
  onAddToCart: (product: Product) => void;
}

const Wishlist: React.FC<WishlistProps> = ({
  onNavigate,
  onAddToCart
}) => {
  // Initialize with some mock data for demonstration
  // In a real app, this would be fetched inside a useEffect
  const [items, setItems] = useState<Product[]>(MOCK_PRODUCTS.slice(0, 3) || []);

  const removeItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const handleAddToCart = (product: Product) => {
    onAddToCart(product);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-primary shadow-sm">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Wishlist</h1>
          </div>
          <p className="text-gray-500 font-bold ml-1">
             {items.length > 0 ? `You have ${items.length} saved items` : 'Your saved products will appear here'}
          </p>
        </div>

        {items && items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((product) => (
              <WishlistCard
                key={product.id}
                image={product.image || ''}
                title={product.name || 'Unknown Product'}
                category={product.category || 'Uncategorized'}
                price={product.price || 0}
                isNew={product.isNew}
                stock={product.stock}
                onRemove={() => removeItem(product.id)}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
               <Heart className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 font-medium mb-10 max-w-sm mx-auto">
              Seems like you haven't found anything you like yet. Browse our catalog to find the best parts for your ride.
            </p>
            <button 
              onClick={() => onNavigate('home')}
              className="bg-primary text-white font-black py-4 px-10 rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95 flex items-center gap-2"
            >
              <Package className="w-5 h-5" />
              Continue Shopping
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Wishlist;
