
import React from 'react';
import { XCircle, RefreshCw, LifeBuoy, ArrowLeft, AlertCircle, ShoppingCart } from 'lucide-react';

interface PaymentFailedProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: any, param?: any) => void;
  orderId?: string;
}

const PaymentFailed: React.FC<PaymentFailedProps> = ({ 
  onNavigate,
  orderId
}) => {
  const displayReference = orderId || 'Unavailable';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <main className="flex-grow flex items-center justify-center p-4 md:py-16">
        <div className="bg-white max-w-xl w-full rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 md:p-12 text-center animate-in zoom-in-95 duration-500 relative overflow-hidden">
          
          {/* Top Decorative bar */}
          <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>

          <div className="relative z-10">
            {/* Error Icon */}
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                <XCircle className="w-12 h-12 text-primary" strokeWidth={3} />
            </div>
            
            <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Payment Failed</h1>
            <p className="text-gray-500 mb-10 font-medium">
              We couldn't process your payment. This might be due to a technical error or insufficient funds.
            </p>

            {/* Error Details Card */}
            <div className="bg-red-50/50 rounded-3xl p-6 mb-10 border border-red-100 text-left">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <AlertCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 mb-1 uppercase tracking-wider">Troubleshooting</h3>
                    <ul className="text-xs text-gray-600 space-y-1 list-disc ml-4">
                      <li>Verify your payment account number/details</li>
                      <li>Check your account balance or transfer limit</li>
                      <li>Ensure stable internet connection</li>
                    </ul>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-red-100 mt-4 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span>Reference ID</span>
                  <span className="text-gray-900">{displayReference}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4">
                <button 
                    onClick={() => onNavigate('checkout')}
                    className="w-full bg-primary text-white font-black py-4 rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-500/20 active:scale-[0.98] group"
                >
                    <RefreshCw className="w-5 h-5 transition-transform group-hover:rotate-180 duration-500" />
                    Retry Payment
                </button>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                      onClick={() => onNavigate('help')}
                      className="bg-white text-gray-900 border border-gray-200 font-black py-3.5 rounded-2xl hover:bg-gray-50 hover:border-gray-900 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                      <LifeBuoy className="w-4 h-4 text-gray-400" />
                      Support
                  </button>
                  <button 
                      onClick={() => onNavigate('checkout')}
                      className="bg-white text-gray-900 border border-gray-200 font-black py-3.5 rounded-2xl hover:bg-gray-50 hover:border-gray-900 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                      <ShoppingCart className="w-4 h-4 text-gray-400" />
                      Checkout
                  </button>
                </div>
            </div>
            
            <button 
              onClick={() => onNavigate('home')}
              className="mt-8 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-3 h-3" />
              Return to Homepage
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentFailed;
