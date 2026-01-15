
import React, { useState } from 'react';
import { CartItem } from '../types';
import { createOrder } from '../services/orderService';
import { CreditCard, Truck, Wallet, CheckCircle, Lock, ChevronLeft, Loader2 } from 'lucide-react';

interface CheckoutProps {
  cartItems: CartItem[];
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: any) => void; // Using 'any' to avoid circular dependency types for now, essentially 'home' | 'success' etc
}

// MOCK DATA for display if cart is empty (per requirements to "List of cart items (mock data)")
const MOCK_CHECKOUT_ITEMS: CartItem[] = [
  {
    id: 'mock-1',
    name: 'Brembo GT Braking System Kit',
    category: 'Brakes',
    price: 1250.00,
    image: 'https://images.unsplash.com/photo-1626438061453-623e1987d603?q=80&w=2940&auto=format&fit=crop',
    rating: 5,
    quantity: 1
  },
  {
    id: 'mock-2',
    name: 'Castrol Edge 5W-30 Full Synthetic',
    category: 'Fluids',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1563290747-0e3189196b42?q=80&w=2832&auto=format&fit=crop',
    rating: 4.9,
    quantity: 2
  }
];

const Checkout: React.FC<CheckoutProps> = ({ 
  cartItems, 
  onNavigate
}) => {
  // Use passed cart items, or fallback to mock data if empty for UI demonstration
  const displayItems = cartItems.length > 0 ? cartItems : MOCK_CHECKOUT_ITEMS;
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'United States', // Default
    zip: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card' | 'wallet'>('cod');

  const subtotal = displayItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = 15.00;
  const total = subtotal + shippingCost;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createOrder({
        items: displayItems,
        shipping: formData,
        paymentMethod,
        total
      });
      onNavigate('order-success');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <button 
            onClick={() => onNavigate('home')}
            className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Continue Shopping
        </button>

        <h1 className="text-3xl font-black text-gray-900 mb-8">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT COLUMN: Forms */}
          <div className="flex-1 space-y-8">
            
            {/* Shipping Information */}
            <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <Truck className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Shipping Information</h2>
                </div>

                <form id="checkout-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                        <input 
                            type="text" 
                            name="fullName"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="e.g. John Doe"
                            value={formData.fullName}
                            onChange={handleInputChange}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                        <input 
                            type="email" 
                            name="email"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                        <input 
                            type="tel" 
                            name="phone"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="+1 (555) 000-0000"
                            value={formData.phone}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Street Address</label>
                        <input 
                            type="text" 
                            name="address"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="123 Performance Blvd"
                            value={formData.address}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                        <input 
                            type="text" 
                            name="city"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="Speedway City"
                            value={formData.city}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Zip / Postal Code</label>
                        <input 
                            type="text" 
                            name="zip"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="90210"
                            value={formData.zip}
                            onChange={handleInputChange}
                        />
                    </div>
                    
                    <div className="md:col-span-2">
                         <label className="block text-sm font-bold text-gray-700 mb-2">Country</label>
                         <select 
                            name="country"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
                            value={formData.country}
                            onChange={handleInputChange}
                         >
                            <option value="United States">United States</option>
                            <option value="Canada">Canada</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Australia">Australia</option>
                            <option value="Germany">Germany</option>
                         </select>
                    </div>
                </form>
            </section>

            {/* Payment Method */}
            <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                        <Lock className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                </div>

                <div className="space-y-4">
                    {/* Cash On Delivery */}
                    <div 
                        className={`border rounded-xl p-4 flex items-center cursor-pointer transition-all ${
                            paymentMethod === 'cod' 
                            ? 'border-primary bg-red-50 ring-1 ring-primary' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setPaymentMethod('cod')}
                    >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 ${
                            paymentMethod === 'cod' ? 'border-primary' : 'border-gray-300'
                        }`}>
                            {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                        </div>
                        <div className="flex-1">
                            <span className="block font-bold text-gray-900">Cash on Delivery</span>
                            <span className="text-sm text-gray-500">Pay when you receive your order</span>
                        </div>
                        <Truck className="w-6 h-6 text-gray-400" />
                    </div>

                    {/* Credit Card (Disabled) */}
                    <div className="border border-gray-200 rounded-xl p-4 flex items-center opacity-60 cursor-not-allowed bg-gray-50">
                        <div className="w-5 h-5 rounded-full border border-gray-300 mr-4"></div>
                        <div className="flex-1">
                            <span className="block font-bold text-gray-400">Credit / Debit Card</span>
                            <span className="text-sm text-gray-400">Unavailable for this region</span>
                        </div>
                        <CreditCard className="w-6 h-6 text-gray-300" />
                    </div>

                    {/* Mobile Wallet (Disabled) */}
                    <div className="border border-gray-200 rounded-xl p-4 flex items-center opacity-60 cursor-not-allowed bg-gray-50">
                        <div className="w-5 h-5 rounded-full border border-gray-300 mr-4"></div>
                        <div className="flex-1">
                            <span className="block font-bold text-gray-400">Mobile Wallet</span>
                            <span className="text-sm text-gray-400">Coming soon</span>
                        </div>
                        <Wallet className="w-6 h-6 text-gray-300" />
                    </div>
                </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Order Summary */}
          <div className="lg:w-[400px] flex-shrink-0">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">Order Summary</h2>
                
                {/* Items List */}
                <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {displayItems.map((item) => (
                        <div key={item.id} className="flex gap-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">{item.name}</p>
                                <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">${(item.price * item.quantity).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium text-gray-900">${subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium text-gray-900">${shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-100">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-black text-primary">${total.toLocaleString()}</span>
                    </div>
                </div>

                <button 
                    type="submit"
                    form="checkout-form"
                    disabled={loading}
                    className="w-full mt-8 bg-primary text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-all shadow-lg hover:shadow-red-500/30 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            Place Order
                            <CheckCircle className="w-5 h-5" />
                        </>
                    )}
                </button>
                
                <p className="text-xs text-gray-400 text-center mt-4 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" />
                    Secure Checkout
                </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Checkout;
