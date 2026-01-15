
import React from 'react';
import { Star, Share2, Heart, ShieldCheck } from 'lucide-react';

interface ProductPriceBlockProps {
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  brand: string;
}

const ProductPriceBlock: React.FC<ProductPriceBlockProps> = ({ 
  name, 
  price, 
  originalPrice, 
  rating, 
  brand 
}) => {
  const discountPercentage = originalPrice 
    ? Math.round(((originalPrice - price) / originalPrice) * 100) 
    : 0;

  return (
    <div className="space-y-4 pb-6 border-b border-gray-100">
      {/* Title & Actions */}
      <div className="flex justify-between items-start gap-4">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
          {name}
        </h1>
        <div className="flex gap-2 flex-shrink-0">
          <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-primary hover:bg-red-50 rounded-full transition-all">
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Meta: Ratings & Brand */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(rating) ? 'fill-current' : 'text-gray-200'}`} />
            ))}
          </div>
          <span className="text-blue-600 hover:underline cursor-pointer ml-1 font-medium">124 Ratings</span>
        </div>
        <span className="text-gray-300">|</span>
        <div className="text-gray-500">
          Brand: <span className="text-blue-600 hover:underline cursor-pointer font-medium">{brand}</span>
        </div>
      </div>

      {/* Price Section */}
      <div className="pt-2">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-black text-primary tracking-tight">
            ${price.toLocaleString()}
          </span>
          {discountPercentage > 0 && (
            <span className="bg-red-100 text-primary text-xs font-bold px-2 py-1 rounded">
              -{discountPercentage}%
            </span>
          )}
        </div>
        {originalPrice && (
          <p className="text-sm text-gray-400 line-through mt-1">
            ${originalPrice.toLocaleString()}
          </p>
        )}
      </div>
      
      {/* Protection/Trust */}
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg inline-block">
        <ShieldCheck className="w-4 h-4 text-green-600" />
        <span>100% Authentic Guarantee</span>
      </div>
    </div>
  );
};

export default ProductPriceBlock;
