
import React, { useState, useEffect, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import SearchFilters from '../components/SearchFilters';
import { searchProducts, SearchFilters as FilterType } from '../services/searchService';
import { Product } from '../types';
import { SlidersHorizontal, ArrowLeft, ArrowDownUp, PackageX } from 'lucide-react';
import SeoHead from '../components/SeoHead';

interface SearchPageProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: any, param?: any) => void;
  onAddToCart: (product: Product) => void;
  initialQuery?: string;
}

const Search: React.FC<SearchPageProps> = ({
  onNavigate,
  onAddToCart,
  initialQuery = ""
}) => {
  const getQueryFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('q') || '').trim();
  }, []);

  const getCategoryFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('category') || '').trim();
  }, []);

  const [query, setQuery] = useState(() => (initialQuery || getQueryFromUrl()).trim());
  const [results, setResults] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterType>(() => {
    const category = (typeof window !== 'undefined' ? getCategoryFromUrl() : '').trim();
    return {
      sortBy: 'relevance',
      category: category ? [category] : undefined
    };
  });
  const [facets, setFacets] = useState<{ categories: {name: string, count: number}[], priceRange: {min: number, max: number} } | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async () => {
    if (initialLoading) {
      setInitialLoading(true);
    } else {
      setIsSearching(true);
    }
    setError(null);

    try {
      const data = await searchProducts(query, filters);
      setResults(data.products);
      setTotalCount(data.totalCount);
      setFacets(data.facets);
    } catch (err) {
      setResults([]);
      setTotalCount(0);
      setFacets(undefined);
      setError('Something went wrong while loading products. Please try again.');
    } finally {
      setInitialLoading(false);
      setIsSearching(false);
    }
  }, [filters, initialLoading, query]);

  // Initial and reactive search
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  useEffect(() => {
    const syncQueryFromUrl = () => {
      const nextQuery = getQueryFromUrl();
      const nextCategory = getCategoryFromUrl();
      setQuery((prev) => (prev === nextQuery ? prev : nextQuery));
      setFilters((prev) => {
        const nextCategoryArray = nextCategory ? [nextCategory] : undefined;
        const prevCategoryKey = JSON.stringify(prev.category || []);
        const nextCategoryKey = JSON.stringify(nextCategoryArray || []);
        if (prevCategoryKey === nextCategoryKey) return prev;
        return { ...prev, category: nextCategoryArray };
      });
    };
    window.addEventListener('popstate', syncQueryFromUrl);
    return () => window.removeEventListener('popstate', syncQueryFromUrl);
  }, [getCategoryFromUrl, getQueryFromUrl]);

  const handleFilterChange = useCallback((newFilters: FilterType) => {
    setFilters((prev) => {
      const next = { ...prev, ...newFilters };
      const prevKey = JSON.stringify(prev);
      const nextKey = JSON.stringify(next);
      return prevKey === nextKey ? prev : next;
    });
  }, []);

  const handleClearFilters = () => {
    setFilters({ sortBy: 'relevance' });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, sortBy: e.target.value as any }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <SeoHead
        title={
          query
            ? `Search results for "${query}" | Noklity`
            : filters.category?.[0]
              ? `${filters.category[0]} Products | Noklity`
              : 'Search Products | Noklity'
        }
        description={
          query
            ? `Browse Noklity search results for ${query}. Find imported electronics, tools, tyres and parts in Bangladesh.`
            : filters.category?.[0]
              ? `Browse ${filters.category[0]} products on Noklity, including imported electronics, tools, tyres and parts in Bangladesh.`
              : 'Search and browse imported electronics, tools, tyres and parts on Noklity.'
        }
        path={typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/search'}
      />
      <main className="flex-grow">
        {/* Search Header */}
        <div className="bg-gray-50 border-b border-gray-200 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <button 
                    onClick={() => onNavigate('home')}
                    className="flex items-center text-xs font-black text-gray-400 hover:text-gray-900 mb-6 group uppercase tracking-widest transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </button>
                
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight">Search Results</h1>
                <p className="text-gray-500 font-medium">
                    {query ? (
                      <>Found <span className="font-bold text-gray-900">{totalCount}</span> results for <span className="font-bold text-primary">"{query}"</span></>
                    ) : (
                      <>Browsing all products</>
                    )}
                </p>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                
                {/* Left Sidebar - Filters */}
                <div className="flex-shrink-0">
                    <SearchFilters 
                        mobileOpen={isMobileFiltersOpen}
                        onCloseMobile={() => setIsMobileFiltersOpen(false)}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                        facets={facets}
                    />
                </div>

                {/* Right Content - Results */}
                <div className="flex-1 min-w-0">
                    
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
                        <span className="font-bold text-gray-700 text-sm">
                            Showing {results.length} of {totalCount} products
                        </span>

                        <div className="flex flex-wrap items-center gap-3">
                            <button 
                                onClick={() => setIsMobileFiltersOpen(true)}
                                className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                Filters
                            </button>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <ArrowDownUp className="h-4 w-4 text-gray-400" />
                                </div>
                                <select 
                                    value={filters.sortBy}
                                    onChange={handleSortChange}
                                    className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-gray-300 appearance-none cursor-pointer transition-all min-w-[180px]"
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
                    {initialLoading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-gray-100 rounded-[2rem] h-[420px] animate-pulse"></div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                                <PackageX className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Search unavailable</h2>
                            <p className="text-gray-500 mb-8 max-w-sm font-medium leading-relaxed">{error}</p>
                            <button
                                onClick={performSearch}
                                className="bg-primary text-white font-bold py-3 px-8 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-95 text-sm"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="relative">
                          {isSearching && (
                            <div className="absolute inset-0 z-10 rounded-2xl bg-white/55 backdrop-blur-[1px] flex items-start justify-center pt-8 pointer-events-none">
                              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-black text-gray-600 uppercase tracking-widest">
                                Updating
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
                            {results.map(product => (
                                <ProductCard 
                                    key={product.id}
                                    product={product}
                                    onAddToCart={onAddToCart}
                                    // Navigate to detail would be handled by parent or ProductCard internal link
                                    onClick={() => onNavigate('product-details', product.id)}
                                />
                            ))}
                          </div>
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                                <PackageX className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">No products found</h2>
                            <p className="text-gray-500 mb-8 max-w-sm font-medium leading-relaxed">
                                We couldn't find any matches for your current filters. Try checking for typos or using different keywords.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <button 
                                    onClick={handleClearFilters}
                                    className="bg-white text-gray-900 border border-gray-200 font-bold py-3 px-8 rounded-2xl hover:bg-gray-50 transition-all text-sm"
                                >
                                    Clear Filters
                                </button>
                                <button 
                                    onClick={() => onNavigate('home')}
                                    className="bg-primary text-white font-bold py-3 px-8 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-95 text-sm"
                                >
                                    Back to Home
                                </button>
                            </div>
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
