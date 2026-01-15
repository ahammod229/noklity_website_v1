
import React, { useState } from 'react';

interface ProductTabsProps {
  description: string;
  specs: Record<string, string>;
}

const ProductTabs: React.FC<ProductTabsProps> = ({ description, specs }) => {
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');

  return (
    <div className="mt-8 bg-gray-50 rounded-2xl p-6 md:p-8">
      {/* Tab Header */}
      <div className="flex gap-8 border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setActiveTab('desc')}
          className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${
            activeTab === 'desc' 
            ? 'text-primary border-b-2 border-primary' 
            : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          Description
        </button>
        <button 
          onClick={() => setActiveTab('specs')}
          className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${
            activeTab === 'specs' 
            ? 'text-primary border-b-2 border-primary' 
            : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          Specifications
        </button>
        <button 
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${
            activeTab === 'reviews' 
            ? 'text-primary border-b-2 border-primary' 
            : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          Reviews (124)
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'desc' && (
          <div className="text-gray-700 leading-relaxed text-sm animate-in fade-in slide-in-from-bottom-2">
            <p className="mb-4">{description}</p>
            <p>
              Engineered for extreme conditions, this product ensures longevity and peak performance. 
              Whether you are on the track or the street, reliability is key. Tested rigorously to meet 
              OEM standards and beyond.
            </p>
            <ul className="list-disc ml-5 mt-4 space-y-2 text-gray-600">
              <li>High durability materials</li>
              <li>Precision engineering for perfect fit</li>
              <li>Resistance to high temperatures</li>
              <li>Corrosion resistant coating</li>
            </ul>
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <table className="w-full text-sm text-left">
              <tbody className="divide-y divide-gray-200">
                {Object.entries(specs).map(([key, value]) => (
                  <tr key={key} className="group hover:bg-gray-100/50">
                    <td className="py-3 px-4 font-bold text-gray-500 bg-gray-100/30 w-1/3 rounded-l-lg">{key}</td>
                    <td className="py-3 px-4 text-gray-800 rounded-r-lg">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="text-center py-12 text-gray-400 animate-in fade-in slide-in-from-bottom-2">
            <p className="mb-2">Review section placeholder</p>
            <button className="text-primary font-bold hover:underline text-sm">Write a review</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductTabs;
