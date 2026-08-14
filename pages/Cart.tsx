import React from 'react';
import { Minus, Plus, ShoppingBag, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { CartItem } from '../types';
import { useCurrency } from '../hooks/useCurrency';
import OptimizedImage from '../components/ui/OptimizedImage';

interface CartPageProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void | Promise<void>;
  onRemoveItem: (id: string) => void | Promise<void>;
  onNavigate: (view: any, param?: string) => void;
}

const CartPage: React.FC<CartPageProps> = ({ items, onUpdateQuantity, onRemoveItem, onNavigate }) => {
  const { formatCurrency } = useCurrency();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasStockIssue = items.some((item) => typeof item.stock === 'number' && (item.stock <= 0 || item.quantity > item.stock));

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
            <ShoppingBag className="h-7 w-7 text-gray-400" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Your Cart is Empty</h1>
          <p className="mt-2 text-sm font-semibold text-gray-500">
            Add products from the store, then come back here to checkout.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-black text-white transition hover:opacity-95 active:scale-[0.99]"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
            <h1 className="text-lg font-black text-gray-900 sm:text-xl">Shopping Cart</h1>
            <p className="text-xs font-semibold text-gray-500 sm:text-sm">{items.length} item(s) in your cart</p>
          </div>

          <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 sm:gap-4 sm:p-4"
              >
                <button
                  type="button"
                  onClick={() => onNavigate('product-details', item.id)}
                  className="h-20 w-20 overflow-hidden rounded-lg border border-gray-200 bg-white sm:h-24 sm:w-24"
                >
                  <OptimizedImage
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    width={192}
                    height={192}
                    responsiveWidths={[400, 800]}
                    sizes="96px"
                  />
                </button>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigate('product-details', item.id)}
                      className="line-clamp-2 text-left text-sm font-black text-gray-900 sm:text-base"
                    >
                      {item.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{item.category}</p>
                  {typeof item.stock === 'number' && (
                    <p className={`mt-1 text-xs font-bold ${item.stock > 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                    </p>
                  )}

                  <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                    <span className="text-sm font-black text-gray-900 sm:text-base">{formatCurrency(item.price)}</span>
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Decrease quantity for ${item.name}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[20px] text-center text-sm font-black text-gray-900">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={typeof item.stock === 'number' ? item.quantity >= item.stock : false}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Increase quantity for ${item.name}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-black text-gray-900 sm:text-lg">Order Summary</h2>
          <div className="mt-4 space-y-3 border-y border-gray-100 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-500">Subtotal</span>
              <span className="font-black text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-500">Shipping</span>
              <span className="font-black text-gray-900">Calculated at checkout</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('checkout')}
            disabled={hasStockIssue}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-white transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Proceed to Checkout
            <ArrowRight className="h-4 w-4" />
          </button>
          {hasStockIssue && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              Some items are out of stock or exceed available stock. Update your cart to continue.
            </div>
          )}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-black text-gray-700 transition hover:bg-gray-50"
          >
            Continue Shopping
          </button>
        </aside>
      </div>
    </div>
  );
};

export default CartPage;
