import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { Product } from '../types';
import { Timer, ArrowRight } from 'lucide-react';
import { getFlashSaleProducts } from '../services/productService';

interface FlashSaleProps {
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onShopAll?: () => void;
}

const FlashSale: React.FC<FlashSaleProps> = ({ onProductClick, onAddToCart, onShopAll }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = () => getFlashSaleProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false));
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

  if (isLoading) {
    return (
      <section className="min-h-[520px] py-8 sm:py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
          <div className="h-8 w-36 rounded-full bg-gray-100 animate-pulse" />
          <div className="h-8 w-24 rounded-full bg-gray-100 animate-pulse" />
        </div>
        <div className="flex overflow-hidden gap-4 sm:gap-6 pb-6 sm:pb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          {[0, 1].map((item) => (
            <div key={item} className="min-w-[82vw] sm:min-w-[260px] md:min-w-[280px] rounded-[2rem] border border-gray-100 bg-white p-4 shadow-sm">
              <div className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
              <div className="mt-4 h-4 w-3/4 rounded-full bg-gray-100 animate-pulse" />
              <div className="mt-3 h-4 w-1/2 rounded-full bg-gray-100 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="min-h-[520px] py-8 sm:py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Flash Sale</h2>
            <div className="bg-[#fff1f2] border border-[#fecdd3] text-[#991b1b] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" />
                <span>On Sale Now</span>
            </div>
        </div>
        <button
            onClick={() => {
              if (onShopAll) {
                onShopAll();
                return;
              }
              window.history.pushState({}, '', '/search');
              window.dispatchEvent(new PopStateEvent('popstate'));
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
            className="group inline-flex items-center text-sm font-bold text-gray-900 hover:text-primary transition-colors self-end sm:self-auto"
        >
            SHOP ALL
            <ArrowRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="relative">
          <div className="flash-sale-scroll flex overflow-x-auto gap-4 sm:gap-6 pb-6 sm:pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x">
            {products.map(product => (
                <div key={product.id} className="min-w-[82vw] sm:min-w-[260px] md:min-w-[280px] snap-start h-full">
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
          <div className="absolute right-0 top-0 bottom-8 w-16 sm:w-24 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
      </div>
    </section>
  )
}

export default FlashSale;
