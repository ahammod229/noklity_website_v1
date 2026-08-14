
import React, { useState } from 'react';
import AccountLayout from '../components/account/AccountLayout';
import { 
  Package, 
  Search, 
  Eye, 
  Clock, 
  Truck, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ExternalLink,
  CreditCard,
  MapPin,
  X,
  // Import ShoppingBag for empty state icon
  ShoppingBag
} from 'lucide-react';
import { Order } from '../types';
import OptimizedImage from '../components/ui/OptimizedImage';

interface AccountOrdersProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: any) => void;
}

const MOCK_ORDERS: any[] = [
  { 
    id: 'ORD-9921', 
    date: 'Oct 12, 2024', 
    total: 1265.00, 
    status: 'Processing', 
    itemCount: 2,
    paymentStatus: 'Paid',
    previewName: 'Brembo GT Braking System Kit',
    previewImage: 'https://images.unsplash.com/photo-1626438061453-623e1987d603?q=80&w=2940&auto=format&fit=crop',
    items: [
        { id: '1', name: 'Brembo GT Braking System Kit', price: 1250, qty: 1, image: 'https://images.unsplash.com/photo-1626438061453-623e1987d603?q=80&w=2940&auto=format&fit=crop' },
        { id: '2', name: 'Brake Fluid DOT 4', price: 15, qty: 1, image: 'https://images.unsplash.com/photo-1563290747-0e3189196b42?q=80&w=2832&auto=format&fit=crop' }
    ],
    address: '123 Performance Blvd, Speedway City, CA 90210'
  },
  { 
    id: 'ORD-8842', 
    date: 'Sep 28, 2024', 
    total: 89.00, 
    status: 'Delivered', 
    itemCount: 1,
    paymentStatus: 'Paid',
    previewName: 'Sparco Racing Gloves',
    previewImage: 'https://images.unsplash.com/photo-1599951304911-37d044439031?q=80&w=2787&auto=format&fit=crop',
    items: [{ id: '3', name: 'Sparco Racing Gloves', price: 89, qty: 1, image: 'https://images.unsplash.com/photo-1599951304911-37d044439031?q=80&w=2787&auto=format&fit=crop' }],
    address: '123 Performance Blvd, Speedway City, CA 90210'
  },
  { 
    id: 'ORD-7735', 
    date: 'Sep 15, 2024', 
    total: 2450.50, 
    status: 'Shipped', 
    itemCount: 4,
    paymentStatus: 'Paid',
    previewName: 'Garrett G-Series Turbocharger',
    previewImage: 'https://images.unsplash.com/photo-1606775089350-f1c5039535eb?q=80&w=2940&auto=format&fit=crop',
    items: [{ id: '4', name: 'Garrett G-Series Turbocharger', price: 2450.5, qty: 1, image: 'https://images.unsplash.com/photo-1606775089350-f1c5039535eb?q=80&w=2940&auto=format&fit=crop' }],
    address: '123 Performance Blvd, Speedway City, CA 90210'
  }
];

const AccountOrders: React.FC<AccountOrdersProps> = ({ 
  onLoginClick, 
  cartItemCount, 
  onCartClick, 
  onNavigate 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Processing': return { color: 'bg-blue-50 text-blue-700 border-blue-100', icon: Clock };
      case 'Shipped': return { color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: Truck };
      case 'Delivered': return { color: 'bg-green-50 text-green-700 border-green-100', icon: CheckCircle };
      case 'Cancelled': return { color: 'bg-red-50 text-red-700 border-red-100', icon: XCircle };
      default: return { color: 'bg-yellow-50 text-yellow-700 border-yellow-100', icon: Package };
    }
  };

  const filteredOrders = MOCK_ORDERS.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.previewName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AccountLayout
      activeTab="account-orders"
      onNavigate={onNavigate}
      onCartClick={onCartClick}
      onLoginClick={onLoginClick}
      cartItemCount={cartItemCount}
      title="My Orders"
    >
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* Orders Header/Search */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-900 font-bold">Showing {filteredOrders.length} orders</p>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by Order ID or item..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        {/* Order List */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const { color, icon: StatusIcon } = getStatusBadge(order.status);
              return (
                <div 
                  key={order.id} 
                  className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-gray-50 rounded-2xl border border-gray-100 flex-shrink-0 overflow-hidden">
                          <OptimizedImage
                            src={order.previewImage}
                            alt={order.previewName || 'Ordered product'}
                            className="w-full h-full object-cover mix-blend-multiply"
                            width={80}
                            height={80}
                            responsiveWidths={[400, 800]}
                            sizes="80px"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order #{order.id}</p>
                          <h3 className="text-sm font-black text-gray-900 mb-1 line-clamp-1">{order.previewName}</h3>
                          <p className="text-xs text-gray-500 font-bold">{order.date} • {order.itemCount} Items</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 md:gap-8">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                          <p className="text-lg font-black text-gray-900 tracking-tight">${order.total.toLocaleString()}</p>
                        </div>
                        
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest ${color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {order.status}
                        </div>

                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Footer for Desktop */}
                  <div className="hidden md:flex items-center justify-between px-6 py-4 bg-gray-50/50 border-t border-gray-50">
                     <p className="text-[11px] font-bold text-gray-400">Payment Status: <span className="text-green-600 uppercase">{order.paymentStatus}</span></p>
                     <button className="text-[11px] font-black text-primary hover:underline flex items-center gap-1 uppercase tracking-widest">
                        Reorder All Items <ArrowRight className="w-3 h-3" />
                     </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-6 sm:p-16 border border-dashed border-gray-200 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-10 h-10 text-gray-200" strokeWidth={1} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">No orders yet</h2>
            <p className="text-gray-500 font-medium mb-10 max-w-sm">
              Your order history is empty. Start shopping for performance parts to build your dream ride!
            </p>
            <button 
              onClick={() => onNavigate('home')}
              className="bg-primary text-white font-black px-10 py-4 rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95"
            >
              Start Shopping
            </button>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 z-10 p-2 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-full transition-all">
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-2xl font-black text-gray-900 mb-1">Order Details</h2>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Order ID: {selectedOrder.id} • {selectedOrder.date}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="space-y-8">
                {/* Items */}
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Items Ordered</h3>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item: any) => (
                      <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                          <OptimizedImage
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-contain mix-blend-multiply"
                            width={64}
                            height={64}
                            responsiveWidths={[400, 800]}
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                          <div className="flex justify-between items-center mt-2">
                             <p className="text-xs text-gray-500 font-bold">Qty: {item.qty}</p>
                             <p className="font-black text-gray-900">${item.price.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Shipping */}
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> Shipping Address
                    </h3>
                    <p className="text-xs font-bold text-gray-700 leading-relaxed">{selectedOrder.address}</p>
                  </div>
                  {/* Payment */}
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5" /> Payment Summary
                    </h3>
                    <div className="space-y-1">
                       <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-gray-500">Subtotal</span>
                          <span className="text-gray-900">${(selectedOrder.total - 15).toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-gray-500">Shipping</span>
                          <span className="text-gray-900">$15.00</span>
                       </div>
                       <div className="flex justify-between text-sm font-black pt-2 border-t border-gray-200 mt-2">
                          <span className="text-gray-900">Total</span>
                          <span className="text-primary">${selectedOrder.total.toLocaleString()}</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-gray-100 bg-white">
               <button className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-gray-200 uppercase tracking-widest text-xs">
                  <ExternalLink className="w-4 h-4" />
                  Track Order
               </button>
            </div>
          </div>
        </div>
      )}
    </AccountLayout>
  );
};

export default AccountOrders;
