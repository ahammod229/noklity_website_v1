
import React from 'react';
import WishlistCard from '../components/WishlistCard';
import { Heart, Package, Loader2, ArrowLeft } from 'lucide-react';
import { Product } from '../types';
import { useWishlist } from '../contexts/WishlistContext';

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
  const { wishlist, removeFromWishlist, isLoading } = useWishlist();

  const handleAddToCart = (product: Product) => {
    onAddToCart(product);
  };

  const handleRemove = async (id: string) => {
    try {
      await removeFromWishlist(id);
    } catch (error) {
      console.error("Failed to remove wishlist item:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Loading Wishlist...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-primary shadow-sm border border-red-100">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Wishlist</h1>
            </div>
            <p className="text-gray-500 font-bold ml-1">
               {wishlist.length > 0 
                 ? `You have ${wishlist.length} saved ${wishlist.length === 1 ? 'item' : 'items'}` 
                 : 'Your saved products will appear here'
               }
            </p>
          </div>
          
          {wishlist.length > 0 && (
            <button 
                onClick={() => onNavigate('home')}
                className="text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-2 mb-1"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Store
            </button>
          )}
        </div>

        {wishlist.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {wishlist.map((product) => (
              <WishlistCard
                key={product.id}
                image={product.image || ''}
                title={product.name || (product as any).title || 'Unknown Product'}
                category={product.category || 'Uncategorized'}
                price={product.price || 0}
                isNew={product.isNew}
                stock={product.stock}
                onRemove={() => handleRemove(product.id)}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm text-center animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
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
