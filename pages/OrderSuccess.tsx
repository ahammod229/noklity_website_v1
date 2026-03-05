import React from 'react';
import { CheckCircle, ArrowRight, ShoppingBag, Calendar, CreditCard, DollarSign } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';
import { useTenantConfig } from '../contexts/TenantConfigContext';

interface OrderSuccessProps {
  onNavigate: (view: any) => void;
}

const OrderSuccess: React.FC<OrderSuccessProps> = ({ onNavigate }) => {
  const { formatCurrency } = useCurrency();
  const { config } = useTenantConfig();
  // Mock Data
  const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const total = 1265.00;
  const paymentMethod = "Cash on Delivery";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white max-w-lg w-full rounded-[2rem] shadow-2xl border border-white/50 p-8 md:p-12 text-center animate-in zoom-in-95 duration-500 relative overflow-hidden">
        
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-red-500 to-primary"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-50 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
            {/* Success Icon */}
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                <CheckCircle className="w-12 h-12 text-green-500" strokeWidth={3} />
            </div>
            
            {/* Headings */}
            <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Order Placed Successfully</h1>
            <p className="text-gray-500 mb-10 font-medium">Thank you for shopping with {config.brandName}</p>

            {/* Order Summary Card */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-10 border border-gray-100 text-left">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Order Summary</h3>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-200/60">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 border border-gray-200">
                                <ShoppingBag className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Order ID</span>
                        </div>
                        <span className="font-mono font-bold text-gray-900">{orderId}</span>
                    </div>

                    <div className="flex justify-between items-center pb-4 border-b border-gray-200/60">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 border border-gray-200">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Date</span>
                        </div>
                        <span className="font-bold text-gray-900 text-sm">{date}</span>
                    </div>

                    <div className="flex justify-between items-center pb-4 border-b border-gray-200/60">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 border border-gray-200">
                                <CreditCard className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Payment Method</span>
                        </div>
                        <span className="font-bold text-gray-900 text-sm">{paymentMethod}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 border border-gray-200">
                                <DollarSign className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Total Amount</span>
                        </div>
                        <span className="text-xl font-black text-primary">{formatCurrency(total)}</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
                <button 
                    onClick={() => onNavigate('orders')}
                    className="w-full bg-white text-gray-900 border border-gray-200 font-bold py-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 group"
                >
                    View Orders
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button 
                    onClick={() => onNavigate('home')}
                    className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-[0.98]"
                >
                    Continue Shopping
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
