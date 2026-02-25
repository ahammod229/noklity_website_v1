
import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { getAddresses, addAddress, Address } from '../services/addressService';
import { createOrder } from '../services/orderService';
import AddressForm from '../components/account/AddressForm';
import { 
  ChevronLeft, 
  MapPin, 
  Plus, 
  CreditCard, 
  Truck, 
  CheckCircle, 
  Loader2, 
  ShieldCheck, 
  ShoppingBag,
  AlertCircle
} from 'lucide-react';

interface CheckoutProps {
  onNavigate: (view: any, param?: any) => void;
  // Props kept for compatibility with App.tsx routing
  cartItems?: any; 
  onLoginClick?: any;
  cartItemCount?: any;
  onCartClick?: any;
}

const Checkout: React.FC<CheckoutProps> = ({ onNavigate }) => {
  const { cart, cartCount, clearCart } = useCart();
  const { user } = useAuth();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = cart.length > 0 ? 15.00 : 0;
  const tax = subtotal * 0.08; // 8% Tax Mock
  const total = subtotal + shippingCost + tax;

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const data = await getAddresses();
      setAddresses(data);
      // Auto-select default address
      const defaultAddr = data.find(a => a.isDefault);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      else if (data.length > 0) setSelectedAddressId(data[0].id);
    } catch (error) {
      console.error("Failed to load addresses", error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleAddAddress = async (data: Omit<Address, 'id'>) => {
    setIsSavingAddress(true);
    try {
      const newAddr = await addAddress(data);
      setAddresses(prev => [...prev, newAddr]);
      setSelectedAddressId(newAddr.id);
      setIsAddressFormOpen(false);
    } catch (error) {
      console.error("Failed to add address", error);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) return;
    
    setIsProcessingOrder(true);
    try {
      const selectedAddr = addresses.find(a => a.id === selectedAddressId);
      
      if (!selectedAddr) throw new Error("Invalid address selected");

      const result = await createOrder({
        items: cart,
        shipping: {
          fullName: selectedAddr.fullName,
          email: user?.email || '',
          phone: selectedAddr.phone,
          address: selectedAddr.street,
          city: selectedAddr.city,
          country: selectedAddr.country,
          zip: selectedAddr.zip
        },
        paymentMethod: paymentMethod === 'cod' ? 'cod' : 'card',
        total: total
      });

      await clearCart();
      
      if (result.success && result.orderId) {
        onNavigate('order-success', result.orderId);
      } else {
        // Fallback or error handling
        onNavigate('order-success');
      }
    } catch (error) {
      console.error("Order failed", error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Empty State
  if (cart.length === 0 && !isProcessingOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-gray-100 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8 font-medium">Add some performance parts to your ride before checking out.</p>
          <button 
            onClick={() => onNavigate('home')}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-95"
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <button 
            onClick={() => onNavigate('home')}
            className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 mb-8 transition-colors group"
        >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Continue Shopping
        </button>

        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-8 tracking-tight">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* LEFT COLUMN: Shipping & Payment */}
          <div className="flex-1 space-y-8">
            
            {/* 1. Shipping Address */}
            <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
                    </div>
                    <button 
                        onClick={() => setIsAddressFormOpen(true)}
                        className="flex items-center gap-2 text-primary font-bold text-sm hover:underline"
                    >
                        <Plus className="w-4 h-4" /> Add New
                    </button>
                </div>

                {loadingAddresses ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
                    </div>
                ) : addresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((addr) => (
                            <div 
                                key={addr.id}
                                onClick={() => setSelectedAddressId(addr.id)}
                                className={`cursor-pointer p-5 rounded-2xl border-2 transition-all duration-200 relative ${
                                    selectedAddressId === addr.id 
                                    ? 'border-primary bg-red-50/30 ring-1 ring-primary/20' 
                                    : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                                        selectedAddressId === addr.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                        {addr.label}
                                    </span>
                                    {selectedAddressId === addr.id && <CheckCircle className="w-5 h-5 text-primary fill-current" />}
                                </div>
                                <p className="font-bold text-gray-900 text-sm mb-1">{addr.fullName}</p>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {addr.street}, {addr.city}<br />
                                    {addr.state}, {addr.zip}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-500 text-sm mb-3">No addresses found.</p>
                        <button 
                            onClick={() => setIsAddressFormOpen(true)}
                            className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors"
                        >
                            Create Address
                        </button>
                    </div>
                )}
            </section>

            {/* 2. Payment Method */}
            <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                        <CreditCard className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                </div>

                <div className="space-y-3">
                    <label 
                        className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            paymentMethod === 'cod' 
                            ? 'border-primary bg-red-50/30' 
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                    >
                        <input 
                            type="radio" 
                            name="payment" 
                            value="cod"
                            checked={paymentMethod === 'cod'}
                            onChange={() => setPaymentMethod('cod')}
                            className="w-5 h-5 text-primary border-gray-300 focus:ring-primary"
                        />
                        <div className="ml-4 flex-1">
                            <span className="block font-bold text-gray-900">Cash on Delivery</span>
                            <span className="text-xs text-gray-500">Pay when you receive your order</span>
                        </div>
                        <Truck className={`w-6 h-6 ${paymentMethod === 'cod' ? 'text-primary' : 'text-gray-300'}`} />
                    </label>

                    <label 
                        className={`flex items-center p-4 rounded-2xl border-2 cursor-not-allowed opacity-60 bg-gray-50 border-gray-100`}
                    >
                        <input 
                            type="radio" 
                            name="payment" 
                            disabled
                            className="w-5 h-5 text-gray-300 border-gray-300"
                        />
                        <div className="ml-4 flex-1">
                            <span className="block font-bold text-gray-400">Credit / Debit Card</span>
                            <span className="text-xs text-gray-400">Temporarily unavailable</span>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-8 h-5 bg-gray-200 rounded"></div>
                            <div className="w-8 h-5 bg-gray-200 rounded"></div>
                        </div>
                    </label>
                </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Order Summary */}
          <div className="lg:w-[420px] flex-shrink-0">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-lg border border-gray-200 sticky top-24">
                <h2 className="text-xl font-black text-gray-900 mb-6 pb-4 border-b border-gray-100">Order Summary</h2>
                
                {/* Items List */}
                <div className="space-y-5 mb-8 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                    {cart.map((item) => (
                        <div key={item.id} className="flex gap-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">{item.name}</p>
                                <p className="text-xs text-gray-500 mt-1 font-medium">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-gray-900">${(item.price * item.quantity).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Costs */}
                <div className="space-y-3 pt-6 border-t border-dashed border-gray-200 bg-gray-50/50 -mx-8 px-8 pb-6">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Subtotal</span>
                        <span className="font-bold text-gray-900">${subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Shipping Estimate</span>
                        <span className="font-bold text-gray-900">${shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Tax (8%)</span>
                        <span className="font-bold text-gray-900">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-200">
                        <span className="text-lg font-black text-gray-900 tracking-tight">Total</span>
                        <span className="text-2xl font-black text-primary tracking-tighter">${total.toLocaleString()}</span>
                    </div>
                </div>

                <button 
                    onClick={handlePlaceOrder}
                    disabled={isProcessingOrder || !selectedAddressId}
                    className="w-full mt-6 bg-primary text-white font-black py-4 rounded-xl hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    {isProcessingOrder ? (
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
                
                {!selectedAddressId && (
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-amber-600 text-xs font-bold bg-amber-50 py-2 rounded-lg">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Please select a shipping address
                    </div>
                )}
                
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    Secure SSL Encryption
                </div>
            </div>
          </div>

        </div>
      </main>

      {/* Address Form Modal */}
      {isAddressFormOpen && (
        <AddressForm 
            onSubmit={handleAddAddress}
            onCancel={() => setIsAddressFormOpen(false)}
            isSaving={isSavingAddress}
        />
      )}
    </div>
  );
};

export default Checkout;
