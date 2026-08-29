
import React from 'react';
import { Package, Truck, CheckCircle, Clock, ChevronRight, Search, ArrowRight, XCircle } from 'lucide-react';
import OptimizedImage from '../components/ui/OptimizedImage';

interface OrdersProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: any, param?: any) => void;
}

interface OrderItem {
  id: string;
  date: string;
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  itemCount: number;
  previewImage: string;
  previewName: string;
}

const MOCK_USER_ORDERS: OrderItem[] = [
  { 
    id: 'ORD-9921', 
    date: 'Oct 12, 2024', 
    total: 1265.00, 
    status: 'Processing', 
    itemCount: 2,
    previewName: 'Brembo GT Braking System Kit',
    previewImage: 'https://images.unsplash.com/photo-1626438061453-623e1987d603?q=80&w=2940&auto=format&fit=crop'
  },
  { 
    id: 'ORD-8842', 
    date: 'Sep 28, 2024', 
    total: 89.00, 
    status: 'Delivered', 
    itemCount: 1,
    previewName: 'Sparco Racing Gloves',
    previewImage: 'https://images.unsplash.com/photo-1599951304911-37d044439031?q=80&w=2787&auto=format&fit=crop'
  },
  { 
    id: 'ORD-7735', 
    date: 'Sep 15, 2024', 
    total: 2450.50, 
    status: 'Shipped', 
    itemCount: 4,
    previewName: 'Garrett G-Series Turbocharger',
    previewImage: 'https://images.unsplash.com/photo-1606775089350-f1c5039535eb?q=80&w=2940&auto=format&fit=crop'
  },
  { 
    id: 'ORD-6621', 
    date: 'Aug 30, 2024', 
    total: 45.00, 
    status: 'Cancelled', 
    itemCount: 1,
    previewName: 'Castrol Edge 5W-30',
    previewImage: 'https://images.unsplash.com/photo-1563290747-0e3189196b42?q=80&w=2832&auto=format&fit=crop'
  }
];

const Orders: React.FC<OrdersProps> = ({ 
  onNavigate
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Processing': return { color: 'bg-blue-50 text-blue-700 border-blue-100', icon: Package };
      case 'Shipped': return { color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: Truck };
      case 'Delivered': return { color: 'bg-green-50 text-green-700 border-green-100', icon: CheckCircle };
      case 'Cancelled': return { color: 'bg-red-50 text-red-700 border-red-100', icon: XCircle };
      default: return { color: 'bg-yellow-50 text-yellow-700 border-yellow-100', icon: Clock };
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl font-black text-gray-900">My Orders</h1>
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search by Order ID..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-shadow hover:shadow-md"
                />
            </div>
        </div>

        <div className="space-y-6">
            {MOCK_USER_ORDERS && MOCK_USER_ORDERS.length > 0 ? MOCK_USER_ORDERS.map((order) => {
                const { color, icon: StatusIcon } = getStatusConfig(order.status);
                
                return (
                    <div key={order.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group">
                        {/* Order Header */}
                        <div className="bg-gray-50/50 p-5 border-b border-gray-100 flex flex-wrap gap-y-4 gap-x-8 justify-between items-center">
                            <div className="flex flex-wrap gap-x-8 gap-y-2">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Order Placed</p>
                                    <p className="text-sm font-bold text-gray-900">{order.date}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total</p>
                                    <p className="text-sm font-bold text-gray-900">${(order.total || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Order ID</p>
                                    <p className="text-sm font-bold text-gray-900 font-mono">{order.id}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${color}`}>
                                    <StatusIcon className="w-3.5 h-3.5" />
                                    {order.status}
                                </span>
                            </div>
                        </div>

                        {/* Order Content */}
                        <div className="p-6">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                {/* Product Image */}
                                <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden relative group-hover:border-gray-200 transition-colors">
                                    {order.previewImage && (
                                        <OptimizedImage
                                          src={order.previewImage}
                                          alt={order.previewName || 'Product'}
                                          className="w-full h-full object-cover mix-blend-multiply"
                                          width={96}
                                          height={96}
                                          responsiveWidths={[400, 800]}
                                          sizes="96px"
                                        />
                                    )}
                                    {order.itemCount > 1 && (
                                        <div className="absolute bottom-0 right-0 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-tl-lg">
                                            +{order.itemCount - 1}
                                        </div>
                                    )}
                                </div>

                                {/* Order Info & Actions */}
                                <div className="flex-1 w-full flex flex-col sm:flex-row justify-between items-center gap-6">
                                    <div className="text-center sm:text-left">
                                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{order.previewName || 'Unknown Item'}</h3>
                                        <p className="text-sm text-gray-500">
                                            {order.itemCount === 1 
                                                ? '1 item in this order' 
                                                : `${order.itemCount} items in this order`}
                                        </p>
                                    </div>

                                    <div className="flex w-full sm:w-auto gap-3">
                                        <button 
                                            onClick={() => onNavigate('order-details', order.id)}
                                            className="flex-1 sm:flex-none bg-white border border-gray-200 text-gray-700 text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                                        >
                                            View Details
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                        
                                        {order.status === 'Delivered' && (
                                            <button 
                                                className="flex-1 sm:flex-none bg-primary text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-[0.98]"
                                            >
                                                Buy Again
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }) : (
                <div className="text-center py-6">
                    <p className="text-gray-500">No orders found.</p>
                </div>
            )}
        </div>

        <div className="mt-12 text-center">
            <button 
                onClick={() => onNavigate('home')}
                className="inline-flex items-center text-gray-500 font-bold hover:text-primary transition-colors text-sm"
            >
                <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
                Return to Store
            </button>
        </div>
      </main>
    </div>
  );
};

export default Orders;
