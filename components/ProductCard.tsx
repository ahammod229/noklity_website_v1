
import React from 'react';
import { Product } from '../types';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext';
import { useCurrency } from '../hooks/useCurrency';
import { useTheme } from '../contexts/ThemeContext';
import OptimizedImage from './ui/OptimizedImage';

interface ProductCardProps {
  product: Product;
  horizontal?: boolean;
  onAddToCart?: (product: Product) => void;
  onClick?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, horizontal, onAddToCart, onClick }) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { formatCurrency } = useCurrency();
  const { theme } = useTheme();
  
  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;
  const stockCount = Math.max(0, Number(product.stock ?? 0));
  const isOutOfStock = stockCount <= 0;

  const isWishlisted = isInWishlist(product.id);

  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
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
      className={`group bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:border-gray-200 transition-all duration-500 flex flex-col h-full relative cursor-pointer ${horizontal ? 'min-w-[280px]' : ''}`}
    >
      
      {/* Badges */}
      <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 z-10 flex flex-col gap-1.5 sm:gap-2">
        {product.isNew && (
          <div className="bg-gray-900 text-white text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-md uppercase tracking-wider shadow-md backdrop-blur-md">
            New
          </div>
        )}
        {product.originalPrice && (
          <div className="bg-primary text-white text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-md uppercase tracking-wider shadow-md backdrop-blur-md">
            -{discountPercentage}%
          </div>
        )}
      </div>

      {/* Wishlist Button */}
      <button 
        onClick={handleWishlistClick}
        className={`absolute top-2.5 sm:top-4 right-2.5 sm:right-4 z-20 p-1.5 sm:p-2.5 rounded-full transition-all duration-300 shadow-sm ${
          isWishlisted 
            ? 'bg-red-50 text-red-500 hover:bg-red-100' 
            : 'bg-white/80 backdrop-blur text-gray-400 hover:text-red-500 hover:bg-white'
        }`}
        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      >
        <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-current' : ''}`} />
      </button>

      {/* Image Container */}
      <div className="product-card-image-surface relative aspect-square sm:aspect-[4/3] overflow-hidden p-3 sm:p-6 transition-colors duration-500">
        <OptimizedImage
          src={product.image} 
          alt={product.name} 
          width={640}
          height={640}
          responsiveWidths={[400, 800, 1200, 1600]}
          sizes={horizontal ? '(max-width: 768px) 280px, 320px' : '(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw'}
          className={`w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out ${
            theme === 'dark' ? 'mix-blend-normal' : 'mix-blend-multiply'
          }`}
        />
        
        {/* Quick Add Overlay (Desktop) */}
        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hidden md:block">
            <button 
                onClick={handleCartClick}
                disabled={isOutOfStock}
                className="w-full bg-white/90 backdrop-blur text-gray-900 font-bold py-3 rounded-xl shadow-lg hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2 border border-gray-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/90 disabled:hover:text-gray-900"
            >
                <ShoppingCart className="w-4 h-4" />
                {isOutOfStock ? 'Out of Stock' : 'Quick Add'}
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-5 flex flex-col flex-grow">
        <div className="hidden sm:flex items-center space-x-1 mb-2">
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          <span className="text-xs text-gray-700 font-bold">{product.rating.toFixed(1)}</span>
          <span className="text-gray-300 px-1">•</span>
          <span className="text-xs text-gray-500 uppercase font-semibold tracking-wide">{product.category}</span>
        </div>

        {product.brand && (
          <p className="hidden sm:block text-[11px] uppercase tracking-wider text-gray-500 font-black mb-1">{product.brand}</p>
        )}

        <h3 className="text-[13px] sm:text-[15px] font-bold text-gray-900 mb-2 sm:mb-3 leading-snug group-hover:text-primary transition-colors line-clamp-2 min-h-[36px] sm:min-h-[40px]">
          {product.name}
        </h3>

        <div className="mt-auto pt-2 border-t border-gray-50">
          <div className="flex items-end justify-between pt-2 sm:pt-3">
          <div className="flex flex-col">
            {product.originalPrice && (
                <span className="text-xs text-gray-400 line-through font-medium mb-0.5">
                    {formatCurrency(product.originalPrice)}
                </span>
            )}
            <span className={`font-extrabold text-gray-900 tracking-tight ${product.originalPrice ? 'text-primary text-base sm:text-xl' : 'text-base sm:text-lg'}`}>
              {formatCurrency(product.price)}
            </span>
          </div>
            <span className={`hidden sm:inline-flex text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-wider ${Number(product.stock || 0) > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {stockCount > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          <div className="mt-2.5 sm:mt-3 flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(product);
              }}
              className="flex-1 h-9 sm:h-10 rounded-lg border border-gray-200 text-gray-700 font-bold text-[11px] sm:text-sm hover:border-primary hover:text-primary"
            >
              View
            </button>
            <button 
              onClick={handleCartClick}
              disabled={isOutOfStock}
              className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-primary hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-100 disabled:hover:text-gray-700"
              title={isOutOfStock ? 'Out of stock' : 'Add to cart'}
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
