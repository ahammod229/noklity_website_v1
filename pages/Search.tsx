
import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import SearchFilters from '../components/SearchFilters';
import { searchProducts } from '../services/searchService';
import { Product } from '../types';
import { Search as SearchIcon, SlidersHorizontal, ArrowLeft, ArrowDownUp } from 'lucide-react';

interface SearchPageProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: any) => void;
  onAddToCart: (product: Product) => void;
  initialQuery?: string;
}

const Search: React.FC<SearchPageProps> = ({
  onNavigate,
  onAddToCart,
  initialQuery = "Brake Pads"
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [sortOption, setSortOption] = useState('relevance');

  useEffect(() => {
    // Perform initial mock search
    const performSearch = async () => {
        setLoading(true);
        const data = await searchProducts(query);
        setResults(data.products);
        setLoading(false);
    };
    performSearch();
  }, [query]);

  const handleClearFilters = () => {
    // Mock logic to reset filters (visual only)
    console.log("Filters cleared");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <main className="flex-grow">
        {/* Search Header */}
        <div className="bg-gray-50 border-b border-gray-200 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <button 
                    onClick={() => onNavigate('home')}
                    className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 group"
                >
                    <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </button>
                
                <h1 className="text-3xl font-black text-gray-900 mb-2">Search Results</h1>
                <p className="text-gray-500">
                    Results for <span className="font-bold text-gray-900">"{query}"</span>
                </p>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Left Sidebar - Filters */}
                <div className="flex-shrink-0">
                    <SearchFilters 
                        mobileOpen={isMobileFiltersOpen}
                        onCloseMobile={() => setIsMobileFiltersOpen(false)}
                        onClearFilters={handleClearFilters}
                    />
                </div>

                {/* Right Content - Results */}
                <div className="flex-1">
                    
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
                        <span className="font-bold text-gray-700 text-sm">
                            Showing {results.length} results
                        </span>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setIsMobileFiltersOpen(true)}
                                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700"
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                Filters
                            </button>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <ArrowDownUp className="h-4 w-4 text-gray-400" />
                                </div>
                                <select 
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value)}
                                    className="pl-10 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-gray-300 appearance-none cursor-pointer"
                                >
                                    <option value="relevance">Relevance</option>
                                    <option value="price_asc">Price: Low to High</option>
                                    <option value="price_desc">Price: High to Low</option>
                                    <option value="newest">Newest Arrivals</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Results Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-gray-100 rounded-2xl h-[350px]"></div>
                            ))}
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {results.map(product => (
                                <ProductCard 
                                    key={product.id}
                                    product={product}
                                    onAddToCart={onAddToCart}
                                    // onClick={() => onNavigate('product', product)} // Optional if we had product detail page route ready in main app
                                />
                            ))}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                                <SearchIcon className="w-8 h-8 text-gray-300" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">No products found</h2>
                            <p className="text-gray-500 mb-8 max-w-sm">
                                We couldn't find any matches for "{query}". Try checking for typos or using different keywords.
                            </p>
                            <button 
                                onClick={() => onNavigate('home')}
                                className="bg-primary text-white font-bold py-3 px-8 rounded-full hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-95"
                            >
                                Back to Home
                            </button>
                        </div>
                    )}

                    {/* Pagination Mock */}
                    {results.length > 0 && (
                        <div className="mt-12 flex justify-center">
                            <nav className="flex gap-2">
                                <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-400 cursor-not-allowed">Previous</button>
                                <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold">1</button>
                                <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50">2</button>
                                <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50">3</button>
                                <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50">Next</button>
                            </nav>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default Search;
