
import React from 'react';
import { CheckCircle, ArrowRight, ShoppingBag, Calendar, CreditCard, DollarSign, Package } from 'lucide-react';

interface PaymentSuccessProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: any, param?: any) => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ 
  onNavigate 
}) => {
  // Mock Data
  const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const total = 1265.00;
  const paymentMethod = "Visa ending in 4242";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <main className="flex-grow flex items-center justify-center p-4 md:py-16">
        <div className="bg-white max-w-xl w-full rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 md:p-12 text-center animate-in zoom-in-95 duration-500 relative overflow-hidden">
          
          {/* Top Decorative bar */}
          <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>

          <div className="relative z-10">
            {/* Success Icon */}
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                <CheckCircle className="w-12 h-12 text-green-500" strokeWidth={3} />
            </div>
            
            <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Payment Successful</h1>
            <p className="text-gray-500 mb-10 font-medium">
              Thank you for your purchase! Your order has been placed successfully and is being processed.
            </p>

            {/* Order Summary Card */}
            <div className="bg-gray-50 rounded-3xl p-6 mb-10 border border-gray-100 text-left space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Confirmation Summary</h3>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-200/50">
                    <div className="flex items-center gap-3">
                        <ShoppingBag className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-600">Order ID</span>
                    </div>
                    <span className="font-mono font-black text-gray-900">{orderId}</span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-gray-200/50">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-600">Order Date</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">{date}</span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-gray-200/50">
                    <div className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-600">Payment Method</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">{paymentMethod}</span>
                </div>

                <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-3">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-600">Total Paid</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-black text-green-600 tracking-tighter">${total.toLocaleString()}</span>
                      <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Confirmed</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4">
                <button 
                    onClick={() => onNavigate('account-orders')}
                    className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-gray-200 active:scale-[0.98] group"
                >
                    <Package className="w-5 h-5 transition-transform group-hover:-translate-y-1" />
                    View Order Details
                </button>

                <button 
                    onClick={() => onNavigate('home')}
                    className="w-full bg-white text-gray-900 border border-gray-200 font-black py-4 rounded-2xl hover:bg-gray-50 hover:border-gray-900 transition-all flex items-center justify-center gap-2"
                >
                    Continue Shopping
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                </button>
            </div>
            
            <p className="mt-8 text-xs text-gray-400 font-medium">
              A confirmation email has been sent to your inbox.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccess;
