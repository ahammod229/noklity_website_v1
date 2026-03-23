import React, { useEffect, useState } from 'react';
import { Category } from '../types';
import { Disc, Settings, Wind, Gauge, Armchair, CircleDashed } from 'lucide-react';
import { supabase } from '../lib/supabase';

const defaultCategories: Category[] = [
  { id: '1', name: 'Brakes', icon: 'Disc', count: 0 },
  { id: '2', name: 'Engine', icon: 'Settings', count: 0 },
  { id: '3', name: 'Exhaust', icon: 'Wind', count: 0 },
  { id: '4', name: 'Electronics', icon: 'Gauge', count: 0 },
  { id: '5', name: 'Interior', icon: 'Armchair', count: 0 },
  { id: '6', name: 'Wheels', icon: 'CircleDashed', count: 0 },
];

const IconMap: Record<string, React.ElementType> = {
  Disc, Settings, Wind, Gauge, Armchair, CircleDashed
};

interface CategoryGridProps {
  selectedCategory?: string | null;
  onSelectCategory?: (category: string) => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ selectedCategory, onSelectCategory }) => {
  const [categories, setCategories] = useState<Category[]>(defaultCategories);

  useEffect(() => {
    const fetchCategories = async () => {
      const [{ data: categoryRows, error: categoryError }, { data: productRows }] = await Promise.all([
        supabase
          .from('categories')
          .select('id,name,icon,logo_url')
          .eq('is_active', true)
          .order('name', { ascending: true }),
        supabase
          .from('products')
          .select('category')
          .eq('status', 'active')
      ]);

      if (categoryError || !categoryRows) {
        return;
      }

      const counts: Record<string, number> = {};
      (productRows || []).forEach((p: any) => {
        if (!p.category) return;
        counts[p.category] = (counts[p.category] || 0) + 1;
      });

      const mapped: Category[] = categoryRows.map((c: any) => ({
        id: c.id,
        name: c.name,
        icon: c.icon || 'CircleDashed',
        logoUrl: c.logo_url || undefined,
        count: counts[c.name] || 0
      }));
      if (mapped.length > 0) {
        setCategories(mapped);
      }
    };

    fetchCategories();
    const onFocus = () => fetchCategories();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  return (
    <section className="py-6 sm:py-16 bg-gray-50 border-y border-gray-100">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-10">
          <div>
             <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Categories</h2>
          </div>
          <button 
            onClick={() => onSelectCategory?.('')}
            className={`text-sm font-bold transition-colors ${!selectedCategory ? 'text-primary' : 'text-gray-900 hover:text-primary'}`}
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-6">
          {categories.map((cat) => {
            const IconComponent = IconMap[cat.icon] || CircleDashed;
            const isSelected = selectedCategory === cat.name;
            
            return (
              <div 
                key={cat.id} 
                onClick={() => onSelectCategory?.(cat.name)}
                className={`group cursor-pointer bg-white rounded-2xl border px-3 py-3 sm:p-6 flex flex-col items-center justify-center transition-all duration-300 min-h-[112px] sm:min-h-0
                  ${isSelected 
                    ? 'border-primary shadow-lg ring-1 ring-primary transform -translate-y-1' 
                    : 'border-gray-200/60 hover:shadow-lg hover:border-primary/20 hover:-translate-y-1'
                  }`}
              >
                <div className={`w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-2 sm:mb-4 transition-all duration-300 overflow-hidden
                  ${isSelected
                    ? 'bg-primary text-white'
                    : 'bg-gray-50 text-gray-600 group-hover:bg-primary group-hover:text-white'
                  }`}>
                  {cat.logoUrl ? (
                    <img src={cat.logoUrl} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <IconComponent className="w-4 h-4 sm:w-7 sm:h-7" strokeWidth={1.5} />
                  )}
                </div>
                <h3 className={`font-bold text-[13px] sm:text-sm leading-tight transition-colors text-center ${isSelected ? 'text-primary' : 'text-gray-900 group-hover:text-primary'}`}>
                  {cat.name}
                </h3>
                <span className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wide">{cat.count} items</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
