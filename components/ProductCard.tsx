
import React from 'react';
import { Product } from '../types';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext';

interface ProductCardProps {
  product: Product;
  horizontal?: boolean;
  onAddToCart?: (product: Product) => void;
  onClick?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, horizontal, onAddToCart, onClick }) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  const isWishlisted = isInWishlist(product.id);

  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isWishlisted) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product);
      }
    } catch (error: any) {
      if (error.message === 'Not logged in') {
        // Ideally prompt login, for now alert or ignore if parent handles global auth events
        alert('Please login to save items to your wishlist');
      }
    }
  };

  return (
    <div 
      onClick={() => onClick?.(product)}
      className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:border-gray-200 transition-all duration-500 flex flex-col h-full relative cursor-pointer ${horizontal ? 'min-w-[280px]' : ''}`}
    >
      
      {/* Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {product.isNew && (
          <div className="bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider shadow-md backdrop-blur-md">
            New
          </div>
        )}
        {product.originalPrice && (
          <div className="bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider shadow-md backdrop-blur-md">
            -{discountPercentage}%
          </div>
        )}
      </div>

      {/* Wishlist Button */}
      <button 
        onClick={handleWishlistClick}
        className={`absolute top-4 right-4 z-20 p-2.5 rounded-full transition-all duration-300 shadow-sm ${
          isWishlisted 
            ? 'bg-red-50 text-red-500 hover:bg-red-100' 
            : 'bg-white/80 backdrop-blur text-gray-400 hover:text-red-500 hover:bg-white'
        }`}
        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
      </button>

      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 p-6 group-hover:bg-gray-100/50 transition-colors duration-500">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        
        {/* Quick Add Overlay (Desktop) */}
        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hidden md:block">
            <button 
                onClick={handleCartClick}
                className="w-full bg-white/90 backdrop-blur text-gray-900 font-bold py-3 rounded-xl shadow-lg hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2 border border-gray-100"
            >
                <ShoppingCart className="w-4 h-4" />
                Quick Add
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center space-x-1 mb-2">
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          <span className="text-xs text-gray-700 font-bold">{product.rating.toFixed(1)}</span>
          <span className="text-gray-300 px-1">•</span>
          <span className="text-xs text-gray-500 uppercase font-semibold tracking-wide">{product.category}</span>
        </div>

        <h3 className="text-[15px] font-bold text-gray-900 mb-3 leading-snug group-hover:text-primary transition-colors line-clamp-2 min-h-[42px]">
          {product.name}
        </h3>

        <div className="mt-auto pt-2 flex items-end justify-between border-t border-gray-50">
          <div className="flex flex-col pt-3">
            {product.originalPrice && (
                <span className="text-xs text-gray-400 line-through font-medium mb-0.5">
                    ${product.originalPrice.toLocaleString()}
                </span>
            )}
            <span className={`font-extrabold text-gray-900 tracking-tight ${product.originalPrice ? 'text-primary text-xl' : 'text-lg'}`}>
              ${product.price.toLocaleString()}
            </span>
          </div>
          
          {/* Mobile Cart Button */}
          <button 
            onClick={handleCartClick}
            className="md:hidden w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 active:bg-primary active:text-white transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
