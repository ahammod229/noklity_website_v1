import React from 'react';
import { Category } from '../types';
import { Disc, Settings, Wind, Gauge, Armchair, CircleDashed } from 'lucide-react';

const categories: Category[] = [
  { id: '1', name: 'Brakes', icon: 'Disc', count: 120 },
  { id: '2', name: 'Engine', icon: 'Settings', count: 350 },
  { id: '3', name: 'Exhaust', icon: 'Wind', count: 85 },
  { id: '4', name: 'Electronics', icon: 'Gauge', count: 210 },
  { id: '5', name: 'Interior', icon: 'Armchair', count: 145 },
  { id: '6', name: 'Wheels', icon: 'CircleDashed', count: 90 },
];

const IconMap: Record<string, React.ElementType> = {
  Disc, Settings, Wind, Gauge, Armchair, CircleDashed
};

interface CategoryGridProps {
  selectedCategory?: string | null;
  onSelectCategory?: (category: string) => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ selectedCategory, onSelectCategory }) => {
  return (
    <section className="py-16 bg-gray-50 border-y border-gray-100">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
             <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
          </div>
          <button 
            onClick={() => onSelectCategory?.('')}
            className={`text-sm font-bold transition-colors ${!selectedCategory ? 'text-primary' : 'text-gray-900 hover:text-primary'}`}
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((cat) => {
            const IconComponent = IconMap[cat.icon];
            const isSelected = selectedCategory === cat.name;
            
            return (
              <div 
                key={cat.id} 
                onClick={() => onSelectCategory?.(cat.name)}
                className={`group cursor-pointer bg-white rounded-xl border p-6 flex flex-col items-center justify-center transition-all duration-300
                  ${isSelected 
                    ? 'border-primary shadow-lg ring-1 ring-primary transform -translate-y-1' 
                    : 'border-gray-200/60 hover:shadow-lg hover:border-primary/20 hover:-translate-y-1'
                  }`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-all duration-300
                  ${isSelected
                    ? 'bg-primary text-white'
                    : 'bg-gray-50 text-gray-600 group-hover:bg-primary group-hover:text-white'
                  }`}>
                  <IconComponent className="w-7 h-7" strokeWidth={1.5} />
                </div>
                <h3 className={`font-bold text-sm transition-colors ${isSelected ? 'text-primary' : 'text-gray-900 group-hover:text-primary'}`}>
                  {cat.name}
                </h3>
                <span className="text-[10px] uppercase font-bold text-gray-400 mt-1">{cat.count} items</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
