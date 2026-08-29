
import React from 'react';
import AccountLayout from '../components/account/AccountLayout';
import ProductCard from '../components/ProductCard';
import { Heart, Package, Loader2, ArrowLeft, ChevronLeft } from 'lucide-react';
import { Product } from '../types';
import { useWishlist } from '../contexts/WishlistContext';

interface WishlistProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: any, param?: string) => void;
  onAddToCart: (product: Product) => void;
}

const Wishlist: React.FC<WishlistProps> = ({
  onNavigate,
  onAddToCart,
  onLoginClick,
  cartItemCount,
  onCartClick
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
      <AccountLayout
        activeTab="wishlist"
        onNavigate={onNavigate}
        onCartClick={onCartClick}
        onLoginClick={onLoginClick}
        cartItemCount={cartItemCount}
        title="My Wishlist"
      >
        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Loading Wishlist...</p>
        </div>
      </AccountLayout>
    );
  }

  return (
        <AccountLayout
      activeTab="wishlist"
      onNavigate={onNavigate}
      onCartClick={onCartClick}
      onLoginClick={onLoginClick}
      cartItemCount={cartItemCount}
      title="My Wishlist"
    >
      <div className="animate-in fade-in duration-300">
        {wishlist.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {wishlist.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => onNavigate('product-details', product.id)}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm text-center animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
               <Heart className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 font-medium mb-10 max-w-sm mx-auto">
              Seems like you haven't found anything you like yet. Browse our catalog to find the best parts for your ride.
            </p>
            <button 
              onClick={() => onNavigate('profile')}
              className="bg-primary text-white font-black py-4 px-10 rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95 flex items-center gap-2"
            >
              <Package className="w-5 h-5" />
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </AccountLayout>
  );
};

export default Wishlist;
