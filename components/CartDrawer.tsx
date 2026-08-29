import React from 'react';
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { CartItem } from '../types';
import { useCurrency } from '../hooks/useCurrency';
import OptimizedImage from './ui/OptimizedImage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQuantity, 
  onRemoveItem,
  onCheckout
}) => {
  const { formatCurrency } = useCurrency();
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-gray-900" />
            <h2 className="text-lg font-bold text-gray-900">Shopping Cart ({items.length})</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-900 font-bold mb-1">Your cart is empty</p>
              <p className="text-gray-500 text-sm mb-6">Looks like you haven't added any parts yet.</p>
              <button 
                onClick={onClose}
                className="text-primary font-bold text-sm hover:underline"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 group">
                <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                  <OptimizedImage
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover mix-blend-multiply"
                    width={160}
                    height={160}
                    responsiveWidths={[400, 800]}
                    sizes="80px"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">
                        {item.isPreorder && (
                          <span className="inline-block bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm mr-1.5 align-middle">PRE-ORDER</span>
                        )}
                        {item.name}
                      </h3>
                      <button 
                        onClick={() => onRemoveItem(item.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-2 rounded-md hover:bg-red-50"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                    {typeof item.stock === 'number' && (
                      <p className={`text-[11px] mt-1 font-bold ${item.stock > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-gray-900">{formatCurrency(item.price)}</span>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-2 py-1">
                      <button 
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        disabled={typeof item.stock === 'number' ? item.quantity >= item.stock : false}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50/50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 text-sm">Subtotal</span>
              <span className="text-xl font-extrabold text-gray-900">{formatCurrency(total)}</span>
            </div>
            <p className="text-xs text-gray-400 mb-6 text-center">Shipping calculated at checkout.</p>
            <button 
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-all active:scale-[0.98] shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
            >
              Checkout <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
