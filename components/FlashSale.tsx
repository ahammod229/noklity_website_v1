import React from 'react';
import ProductCard from './ProductCard';
import { Product } from '../types';
import { Timer, ArrowRight } from 'lucide-react';

// Flash sale mock data
const FLASH_PRODUCTS: Product[] = [
  {
    id: 'fs-1',
    name: 'Castrol Edge 5W-30 Full Synthetic Oil',
    category: 'Fluids',
    price: 24.99,
    originalPrice: 45.00,
    image: 'https://images.unsplash.com/photo-1563290747-0e3189196b42?q=80&w=2832&auto=format&fit=crop',
    rating: 4.9
  },
  {
    id: 'fs-2',
    name: 'Sparco Racing Gloves',
    category: 'Interior',
    price: 89.00,
    originalPrice: 120.00,
    image: 'https://images.unsplash.com/photo-1599951304911-37d044439031?q=80&w=2787&auto=format&fit=crop',
    rating: 4.7
  },
  {
    id: 'fs-3',
    name: 'NGK Iridium Spark Plugs (Set of 4)',
    category: 'Engine',
    price: 35.50,
    originalPrice: 52.00,
    image: 'https://images.unsplash.com/photo-1628522336332-9cb52501a35c?q=80&w=2960&auto=format&fit=crop',
    rating: 4.8
  },
  {
    id: 'fs-4',
    name: 'Michelin Pilot Sport 4S',
    category: 'Wheels',
    price: 285.00,
    originalPrice: 345.00,
    image: 'https://images.unsplash.com/photo-1578844251758-2f71da645217?q=80&w=2940&auto=format&fit=crop',
    rating: 5.0,
    isNew: true
  },
  {
    id: 'fs-5',
    name: 'K&N Air Filter Cleaning Kit',
    category: 'Maintenance',
    price: 15.99,
    originalPrice: 24.99,
    image: 'https://images.unsplash.com/photo-1632512396328-9d5113945415?q=80&w=2940&auto=format&fit=crop',
    rating: 4.5
  }
];

interface FlashSaleProps {
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

const FlashSale: React.FC<FlashSaleProps> = ({ onProductClick, onAddToCart }) => {
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
            {FLASH_PRODUCTS.map(product => (
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
