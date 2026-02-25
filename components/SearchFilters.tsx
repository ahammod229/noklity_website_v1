
import React, { useState, useEffect } from 'react';
import { Star, X, Check, Filter } from 'lucide-react';
import { SearchFilters as FilterType } from '../services/searchService';

interface SearchFiltersProps {
  onFilterChange: (filters: FilterType) => void;
  onClearFilters?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  initialFilters?: FilterType;
  facets?: {
    categories: { name: string; count: number }[];
    priceRange: { min: number; max: number };
  };
}

const DEFAULT_CATEGORIES = [
  { name: 'Brakes', count: 0 },
  { name: 'Suspension', count: 0 },
  { name: 'Engine', count: 0 },
  { name: 'Exhaust', count: 0 },
  { name: 'Interior', count: 0 },
  { name: 'Fluids', count: 0 },
  { name: 'Exterior', count: 0 }
];

const RATINGS = [5, 4, 3, 2];

const SearchFilters: React.FC<SearchFiltersProps> = ({ 
  onFilterChange, 
  onClearFilters,
  mobileOpen = false,
  onCloseMobile,
  initialFilters,
  facets
}) => {
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  // Sync with facets or initial filters if provided
  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.category) setSelectedCats(initialFilters.category);
      if (initialFilters.minPrice !== undefined) setPriceRange(prev => ({ ...prev, min: initialFilters.minPrice! }));
      if (initialFilters.maxPrice !== undefined) setPriceRange(prev => ({ ...prev, max: initialFilters.maxPrice! }));
      if (initialFilters.rating !== undefined) setMinRating(initialFilters.rating);
    }
  }, [initialFilters]);

  // Effect to trigger update when local state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({
        category: selectedCats.length > 0 ? selectedCats : undefined,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        rating: minRating
      });
    }, 500); // Debounce updates

    return () => clearTimeout(timer);
  }, [priceRange, selectedCats, minRating]);

  const toggleCategory = (cat: string) => {
    if (selectedCats.includes(cat)) {
        setSelectedCats(selectedCats.filter(c => c !== cat));
    } else {
        setSelectedCats([...selectedCats, cat]);
    }
  };

  const handleClear = () => {
    setPriceRange({ min: 0, max: 5000 });
    setSelectedCats([]);
    setMinRating(undefined);
    onClearFilters?.();
  };

  // Merge default categories with faceted counts
  const categoriesToDisplay = facets?.categories || DEFAULT_CATEGORIES;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-[60] lg:hidden animate-in fade-in"
            onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-72 lg:shadow-none lg:bg-transparent lg:block
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full overflow-y-auto p-6 lg:p-0">
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Filter className="w-5 h-5" /> Filters
            </h2>
            <button onClick={onCloseMobile} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center justify-between mb-6">
             <h3 className="font-black text-gray-900 hidden lg:block uppercase tracking-widest text-xs">Filter Products</h3>
             <button 
                onClick={handleClear}
                className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline transition-colors"
             >
                Clear All
             </button>
          </div>

          {/* Price Filter */}
          <div className="mb-8 border-b border-gray-100 pb-8">
            <h4 className="font-bold text-sm text-gray-900 mb-4">Price Range</h4>
            <div className="space-y-6">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">Min Price</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-bold">$</span>
                            <input 
                                type="number" 
                                value={priceRange.min}
                                onChange={(e) => setPriceRange({...priceRange, min: Number(e.target.value)})}
                                className="w-full pl-7 pr-3 py-2 text-sm font-bold border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">Max Price</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-bold">$</span>
                            <input 
                                type="number" 
                                value={priceRange.max}
                                onChange={(e) => setPriceRange({...priceRange, max: Number(e.target.value)})}
                                className="w-full pl-7 pr-3 py-2 text-sm font-bold border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
                <div>
                  <input 
                      type="range" 
                      min="0" 
                      max="5000" 
                      step="10"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({...priceRange, max: Number(e.target.value)})}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400">
                    <span>$0</span>
                    <span>$5000+</span>
                  </div>
                </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-8 border-b border-gray-100 pb-8">
            <h4 className="font-bold text-sm text-gray-900 mb-4">Categories</h4>
            <div className="space-y-3">
                {categoriesToDisplay.map(cat => (
                    <label key={cat.name} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                            <div 
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                    selectedCats.includes(cat.name) ? 'bg-primary border-primary shadow-sm' : 'border-gray-300 bg-white group-hover:border-gray-400'
                                }`}
                                onClick={(e) => { e.preventDefault(); toggleCategory(cat.name); }}
                            >
                                {selectedCats.includes(cat.name) && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                            </div>
                            <span className={`text-sm ${selectedCats.includes(cat.name) ? 'font-bold text-gray-900' : 'text-gray-600 font-medium'}`}>
                                {cat.name}
                            </span>
                        </div>
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{cat.count}</span>
                    </label>
                ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <h4 className="font-bold text-sm text-gray-900 mb-4">Rating</h4>
            <div className="space-y-3">
                {RATINGS.map(rating => (
                    <label key={rating} className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors">
                        <div 
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            minRating === rating ? 'border-primary' : 'border-gray-300'
                          }`}
                          onClick={(e) => { e.preventDefault(); setMinRating(minRating === rating ? undefined : rating); }}
                        >
                          {minRating === rating && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                        </div>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                    key={i} 
                                    className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} 
                                />
                            ))}
                        </div>
                        <span className="text-xs font-bold text-gray-400 group-hover:text-gray-900">& Up</span>
                    </label>
                ))}
            </div>
          </div>

        </div>
      </aside>
    </>
  );
};

export default SearchFilters;
