import React, { useState } from 'react';
import { Star, X, Check } from 'lucide-react';

interface SearchFiltersProps {
  onFilterChange?: (filters: any) => void;
  onClearFilters?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const CATEGORIES = [
  { name: 'Brakes', count: 42 },
  { name: 'Suspension', count: 18 },
  { name: 'Engine', count: 25 },
  { name: 'Exhaust', count: 12 },
  { name: 'Interior', count: 8 },
  { name: 'Fluids', count: 15 }
];

const RATINGS = [5, 4, 3, 2];

const SearchFilters: React.FC<SearchFiltersProps> = ({ 
  onFilterChange, 
  onClearFilters,
  mobileOpen = false,
  onCloseMobile
}) => {
  const [priceRange, setPriceRange] = useState({ min: 0, max: 2000 });
  const [selectedCats, setSelectedCats] = useState<string[]>(['Brakes']);

  const toggleCategory = (cat: string) => {
    if (selectedCats.includes(cat)) {
        setSelectedCats(selectedCats.filter(c => c !== cat));
    } else {
        setSelectedCats([...selectedCats, cat]);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in"
            onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-64 lg:shadow-none lg:bg-transparent lg:block
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full overflow-y-auto p-6 lg:p-0">
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <h2 className="text-xl font-bold text-gray-900">Filters</h2>
            <button onClick={onCloseMobile} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold text-gray-900 hidden lg:block">Filter By</h3>
             <button 
                onClick={onClearFilters}
                className="text-xs font-bold text-primary hover:underline"
             >
                Clear All
             </button>
          </div>

          {/* Price Filter */}
          <div className="mb-8 border-b border-gray-200 pb-8">
            <h4 className="font-bold text-sm text-gray-900 mb-4">Price Range</h4>
            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Min</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                            <input 
                                type="number" 
                                value={priceRange.min}
                                onChange={(e) => setPriceRange({...priceRange, min: Number(e.target.value)})}
                                className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Max</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                            <input 
                                type="number" 
                                value={priceRange.max}
                                onChange={(e) => setPriceRange({...priceRange, max: Number(e.target.value)})}
                                className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            />
                        </div>
                    </div>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="5000" 
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({...priceRange, max: Number(e.target.value)})}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-8 border-b border-gray-200 pb-8">
            <h4 className="font-bold text-sm text-gray-900 mb-4">Categories</h4>
            <div className="space-y-3">
                {CATEGORIES.map(cat => (
                    <label key={cat.name} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div 
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                    selectedCats.includes(cat.name) ? 'bg-primary border-primary' : 'border-gray-300 bg-white'
                                }`}
                                onClick={(e) => { e.preventDefault(); toggleCategory(cat.name); }}
                            >
                                {selectedCats.includes(cat.name) && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className={`text-sm ${selectedCats.includes(cat.name) ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                                {cat.name}
                            </span>
                        </div>
                        <span className="text-xs text-gray-400">{cat.count}</span>
                    </label>
                ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <h4 className="font-bold text-sm text-gray-900 mb-4">Rating</h4>
            <div className="space-y-3">
                {RATINGS.map(rating => (
                    <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                    key={i} 
                                    className={`w-3.5 h-3.5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} 
                                />
                            ))}
                        </div>
                        <span className="text-xs text-gray-500 group-hover:text-gray-900">& Up</span>
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