import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { Product } from '../types';
import { Timer, ArrowRight } from 'lucide-react';
import { getFlashSaleProducts } from '../services/productService';

interface FlashSaleProps {
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

const FlashSale: React.FC<FlashSaleProps> = ({ onProductClick, onAddToCart }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const load = () => getFlashSaleProducts().then(setProducts).catch(() => setProducts([]));
    load();
    const interval = setInterval(load, 30000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">Flash Sale</h2>
            <div className="bg-red-50 border border-red-100 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
                <Timer className="w-3.5 h-3.5" />
                <span>On Sale Now</span>
            </div>
        </div>
        <button className="group flex items-center text-sm font-bold text-gray-900 hover:text-primary transition-colors">
            SHOP ALL
            <ArrowRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="relative">
          <div className="flex overflow-x-auto gap-6 pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x">
            {products.map(product => (
                <div key={product.id} className="min-w-[260px] md:min-w-[280px] snap-start h-full">
                    <ProductCard 
                      product={product} 
                      horizontal 
                      onAddToCart={onAddToCart}
                      onClick={onProductClick}
                    />
                </div>
            ))}
          </div>
          {/* Fade effect on right edge for scroll indication */}
          <div className="absolute right-0 top-0 bottom-8 w-24 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
      </div>
    </section>
  )
}

export default FlashSale;
