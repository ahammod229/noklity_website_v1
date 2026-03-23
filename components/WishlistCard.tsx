import React from 'react';
import { Trash2, ShoppingCart } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';
import OptimizedImage from './ui/OptimizedImage';

interface WishlistCardProps {
  image: string;
  title: string;
  category: string;
  price: number;
  isNew?: boolean;
  stock?: number;
  onAddToCart?: () => void;
  onRemove?: () => void;
}

const WishlistCard: React.FC<WishlistCardProps> = ({
  image,
  title,
  category,
  price,
  isNew,
  stock,
  onAddToCart,
  onRemove
}) => {
  const { formatCurrency } = useCurrency();
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-gray-200 transition-all duration-300 group flex flex-col h-full">
      {/* Image Section */}
      <div className="relative aspect-[4/3] bg-gray-50 p-6 overflow-hidden">
        <OptimizedImage
          src={image}
          alt={title}
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
          width={640}
          height={480}
          responsiveWidths={[400, 800, 1200, 1600]}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {isNew && (
          <div className="absolute top-3 left-3 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
            NEW
          </div>
        )}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
          title="Remove from Wishlist"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{category}</p>
        <h3 className="font-bold text-gray-900 text-sm mb-3 line-clamp-2 leading-snug h-10">
          {title}
        </h3>
        
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-extrabold text-gray-900">
              {formatCurrency(price)}
            </span>
            {stock !== undefined && stock < 5 && (
               <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                 Low Stock
               </span>
            )}
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.();
            }}
            className="w-full bg-white border border-gray-200 text-gray-900 font-bold py-2.5 rounded-xl hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all flex items-center justify-center gap-2 group/btn active:scale-95"
          >
            <ShoppingCart className="w-4 h-4 group-hover/btn:fill-white" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default WishlistCard;
