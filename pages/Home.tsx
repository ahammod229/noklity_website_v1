import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import CategoryGrid from '../components/CategoryGrid';
import ProductCard from '../components/ProductCard';
import FlashSale from '../components/FlashSale';
import Footer from '../components/Footer';
import { SkeletonList } from '../components/SkeletonLoader';
import { Product } from '../types';

// MOCK DATA
const FEATURED_PRODUCTS: Product[] = [
  {
    id: '101',
    name: 'Brembo GT Braking System Kit',
    category: 'Brakes',
    price: 1250.00,
    image: 'https://images.unsplash.com/photo-1626438061453-623e1987d603?q=80&w=2940&auto=format&fit=crop',
    isNew: true,
    rating: 5.0
  },
  {
    id: '102',
    name: 'Garrett G-Series Turbocharger',
    category: 'Engine',
    price: 2499.99,
    image: 'https://images.unsplash.com/photo-1606775089350-f1c5039535eb?q=80&w=2940&auto=format&fit=crop',
    rating: 4.8
  },
  {
    id: '103',
    name: 'KW V3 Coilover Suspension',
    category: 'Suspension',
    price: 1895.50,
    image: 'https://images.unsplash.com/photo-1614251412693-4a1f6494cb68?q=80&w=2940&auto=format&fit=crop',
    rating: 4.9
  },
  {
    id: '104',
    name: 'Akrapovič Titanium Exhaust',
    category: 'Exhaust',
    price: 3200.00,
    image: 'https://images.unsplash.com/photo-1565538361093-9c59573887c3?q=80&w=2940&auto=format&fit=crop',
    isNew: true,
    rating: 5.0
  },
  {
    id: '105',
    name: 'Recaro Sportster CS Seat',
    category: 'Interior',
    price: 1450.00,
    image: 'https://images.unsplash.com/photo-1582239433989-13833215904d?q=80&w=2848&auto=format&fit=crop',
    rating: 4.7
  },
  {
    id: '106',
    name: 'BBS FI-R Forged Wheels',
    category: 'Wheels',
    price: 2150.00,
    image: 'https://images.unsplash.com/photo-1605658632617-640954992524?q=80&w=2940&auto=format&fit=crop',
    rating: 5.0
  },
  {
    id: '107',
    name: 'MOMO Montecarlo Steering Wheel',
    category: 'Interior',
    price: 249.99,
    image: 'https://images.unsplash.com/photo-1595188800996-3c0f46c6422d?q=80&w=2940&auto=format&fit=crop',
    rating: 4.5
  },
  {
    id: '108',
    name: 'K&N High-Flow Air Filter',
    category: 'Engine',
    price: 65.99,
    image: 'https://images.unsplash.com/photo-1508209803874-51e443831844?q=80&w=2940&auto=format&fit=crop',
    rating: 4.6
  }
];

interface HomeProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  activeCategory: string | null;
  onSelectCategory: (category: string) => void;
}

const Home: React.FC<HomeProps> = ({ 
  onLoginClick, 
  cartItemCount, 
  onCartClick, 
  onProductClick, 
  onAddToCart,
  activeCategory,
  onSelectCategory
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [displayedProducts, setDisplayedProducts] = useState(FEATURED_PRODUCTS);

  useEffect(() => {
    setIsLoading(true);
    // Simulate loading/filtering delay
    const timer = setTimeout(() => {
      if (activeCategory) {
        setDisplayedProducts(FEATURED_PRODUCTS.filter(p => p.category === activeCategory));
      } else {
        setDisplayedProducts(FEATURED_PRODUCTS);
      }
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [activeCategory]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header 
        onLoginClick={onLoginClick} 
        cartItemCount={cartItemCount}
        onCartClick={onCartClick}
      />
      
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
                      onClick={onProductClick}
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
      
      <Footer />
    </div>
  );
};

export default Home;
