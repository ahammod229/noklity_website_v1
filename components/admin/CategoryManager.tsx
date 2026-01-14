import React from 'react';
import { Category } from '../../types';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'Brakes', icon: 'Disc', count: 120 },
  { id: '2', name: 'Engine', icon: 'Settings', count: 350 },
  { id: '3', name: 'Exhaust', icon: 'Wind', count: 85 },
  { id: '4', name: 'Electronics', icon: 'Gauge', count: 210 },
  { id: '5', name: 'Interior', icon: 'Armchair', count: 145 },
  { id: '6', name: 'Wheels', icon: 'CircleDashed', count: 90 },
];

const CategoryManager: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
           <p className="text-gray-500 text-sm">Organize products into categories</p>
        </div>
        <button className="bg-primary text-white font-bold px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_CATEGORIES.map((cat) => (
            <div key={cat.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-gray-600 font-bold group-hover:bg-primary group-hover:text-white transition-colors">
                        {cat.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{cat.name}</h3>
                        <p className="text-sm text-gray-500">{cat.count} products</p>
                    </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-red-50 transition-colors">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryManager;
