import React from 'react';
import { Product } from '../types';
import { X, Star, Truck, Shield, Check, ShoppingCart } from 'lucide-react';

interface ProductDetailsProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, onClose, onAddToCart }) => {
  if (!product) return null;

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-300 max-h-[90vh]">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-white transition-all shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 bg-gray-50 p-8 flex items-center justify-center relative">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-auto max-h-[400px] object-contain mix-blend-multiply"
          />
          {product.isNew && (
            <div className="absolute top-6 left-6 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
              New Arrival
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col overflow-y-auto bg-white">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-primary font-bold text-xs uppercase tracking-widest">{product.category}</span>
            <span className="text-gray-300">•</span>
            <div className="flex items-center text-yellow-400">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="ml-1 text-gray-600 text-xs font-bold">{product.rating} (124 reviews)</span>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4 leading-tight">{product.name}</h2>

          <div className="flex items-end gap-3 mb-6">
            <span className="text-3xl font-extrabold text-gray-900">${product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <>
                <span className="text-lg text-gray-400 line-through mb-1">${product.originalPrice.toLocaleString()}</span>
                <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-md mb-2">-{discountPercentage}%</span>
              </>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed mb-8">
            Engineered for peak performance, this {product.category.toLowerCase()} component meets the highest standards of automotive excellence. Designed to withstand extreme conditions while delivering optimal results.
          </p>

          {/* Features / Specs */}
          <div className="grid grid-cols-2 gap-4 mb-8">
             <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-gray-900">Fast Shipping</h4>
                    <p className="text-xs text-gray-500">Delivery in 2-4 business days</p>
                </div>
             </div>
             <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-gray-900">Warranty</h4>
                    <p className="text-xs text-gray-500">2 Years Manufacturer Warranty</p>
                </div>
             </div>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-100 flex gap-4">
             <button 
                onClick={() => {
                    onAddToCart(product);
                    onClose();
                }}
                className="flex-1 bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98]"
             >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
             </button>
             <button className="px-6 py-4 border border-gray-200 rounded-xl font-bold text-gray-900 hover:bg-gray-50 transition-colors">
                Wishlist
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
