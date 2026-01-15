
import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import CategoryGrid from '../components/CategoryGrid';
import ProductCard from '../components/ProductCard';
import FlashSale from '../components/FlashSale';
import { SkeletonList } from '../components/SkeletonLoader';
import { Product } from '../types';
import { MOCK_PRODUCTS } from '../data/mockData';

interface HomeProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  activeCategory: string | null;
  onSelectCategory: (category: string) => void;
  onHelpClick?: () => void;
  onWishlistClick: () => void;
}

const Home: React.FC<HomeProps> = ({ 
  onProductClick, 
  onAddToCart,
  activeCategory,
  onSelectCategory,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);

  useEffect(() => {
    setIsLoading(true);
    // Simulate loading/filtering delay
    const timer = setTimeout(() => {
      // Filter out Flash Sale items from main grid to avoid duplication if needed, 
      // or just show main catalog items. Here we filter by category if present.
      let filtered = MOCK_PRODUCTS.filter(p => !p.isFlashSale);
      
      if (activeCategory) {
        filtered = MOCK_PRODUCTS.filter(p => p.category === activeCategory);
      }
      
      setDisplayedProducts(filtered);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [activeCategory]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-grow space-y-4">
        {!activeCategory && <Hero />}
        
        <CategoryGrid 
          selectedCategory={activeCategory} 
          onSelectCategory={onSelectCategory} 
        />
        
        {!activeCategory && (
          <FlashSale 
            onProductClick={onProductClick} 
            onAddToCart={onAddToCart}
          />
        )}
        
        {/* Featured Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[600px]">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10">
            <div>
              <span className="text-primary font-bold uppercase tracking-widest text-xs mb-2 block">
                {activeCategory ? 'Browsing Category' : 'Premium Selection'}
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900">
                {activeCategory ? activeCategory : 'Featured Products'}
              </h2>
            </div>
            {!activeCategory && (
              <div className="flex gap-2 mt-4 md:mt-0">
                 <button className="bg-gray-100 text-gray-900 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors">New Arrivals</button>
                 <button className="bg-white text-gray-500 border border-gray-200 px-5 py-2.5 rounded-full text-sm font-bold hover:border-gray-300 hover:text-gray-900 transition-colors">Best Sellers</button>
              </div>
            )}
          </div>

          {isLoading ? (
            <SkeletonList count={8} />
          ) : (
            <>
              {displayedProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {displayedProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onClick={() => onProductClick(product)}
                      onAddToCart={onAddToCart}
                    />
                  ))}
                </div>
              ) : (
                 <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-500 font-medium">No products found in this category.</p>
                    <button 
                      onClick={() => onSelectCategory('')}
                      className="mt-4 text-primary font-bold hover:underline"
                    >
                      Clear Filters
                    </button>
                 </div>
              )}
            </>
          )}

          {!activeCategory && (
            <div className="mt-16 text-center">
              <button className="inline-block border-2 border-gray-900 text-gray-900 font-bold py-3.5 px-10 rounded-full hover:bg-gray-900 hover:text-white transition-all duration-300">
                View All Parts
              </button>
            </div>
          )}
        </section>

        {/* Promo Banner */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-gray-900 rounded-[2rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between overflow-hidden relative shadow-2xl">
            <div className="relative z-10 max-w-lg text-white">
                <h3 className="text-3xl font-bold mb-4">Join the Noklity Club</h3>
                <p className="text-gray-400 mb-8 leading-relaxed">Get exclusive access to limited edition drops, installation guides, and <span className="text-white font-bold">10% off</span> your first order.</p>
                <div className="flex w-full max-w-sm">
                    <input type="email" placeholder="Enter your email" className="flex-1 px-5 py-4 rounded-l-xl border-none focus:ring-2 focus:ring-primary outline-none text-gray-900 placeholder-gray-500" />
                    <button className="bg-primary text-white font-bold px-8 py-4 rounded-r-xl hover:bg-red-700 transition-colors">
                        Join
                    </button>
                </div>
            </div>
            
            {/* Abstract Background Decoration */}
            <div className="hidden md:block absolute right-0 bottom-0 top-0 w-2/3 pointer-events-none">
                 <div className="absolute inset-0 bg-gradient-to-l from-gray-800 to-gray-900"></div>
                 <div className="absolute right-[-100px] top-[-100px] w-[500px] h-[500px] rounded-full border-[60px] border-gray-800 opacity-30"></div>
                 <div className="absolute right-[50px] bottom-[-50px] w-[300px] h-[300px] rounded-full border-[30px] border-primary opacity-10"></div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default Home;
