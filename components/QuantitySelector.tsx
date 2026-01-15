
import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  setQuantity: (q: number) => void;
  maxStock?: number;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({ quantity, setQuantity, maxStock = 10 }) => {
  const handleDecrement = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrement = () => {
    if (quantity < maxStock) setQuantity(quantity + 1);
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-bold text-gray-500">Quantity</span>
      <div className="flex items-center">
        <button 
          onClick={handleDecrement}
          disabled={quantity <= 1}
          className="w-9 h-9 flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <div className="w-12 h-9 flex items-center justify-center bg-white border-y border-gray-100 text-gray-900 font-bold text-sm">
          {quantity}
        </div>
        <button 
          onClick={handleIncrement}
          disabled={quantity >= maxStock}
          className="w-9 h-9 flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <span className="text-xs text-gray-400">
        {maxStock > 0 ? `${maxStock} pieces available` : 'Out of stock'}
      </span>
    </div>
  );
};

export default QuantitySelector;
