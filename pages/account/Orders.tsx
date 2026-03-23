
import React, { useState, useEffect } from 'react';
import AccountLayout from '../../components/account/AccountLayout';
import { 
  Package, 
  Search, 
  Eye, 
  Clock, 
  Truck, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ShoppingBag,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getOrders } from '../../services/orderService';
import { useCurrency } from '../../hooks/useCurrency';
import OptimizedImage from '../../components/ui/OptimizedImage';

interface OrdersProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: any, param?: any) => void;
}

const ITEMS_PER_PAGE = 5;

const Orders: React.FC<OrdersProps> = ({ 
  onLoginClick, 
  cartItemCount, 
  onCartClick, 
  onNavigate 
}) => {
  const { formatCurrency } = useCurrency();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Processing': return { color: 'bg-blue-50 text-blue-700 border-blue-100', icon: Package };
      case 'Shipped': return { color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: Truck };
      case 'Delivered': return { color: 'bg-green-50 text-green-700 border-green-100', icon: CheckCircle };
      case 'Cancelled': return { color: 'bg-red-50 text-red-700 border-red-100', icon: XCircle };
      default: return { color: 'bg-yellow-50 text-yellow-700 border-yellow-100', icon: Clock };
    }
  };

  // Filter
  const filteredOrders = orders.filter(o => 
    o.displayId.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.previewName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <AccountLayout activeTab="account-orders" onNavigate={onNavigate} onCartClick={onCartClick} onLoginClick={onLoginClick} cartItemCount={cartItemCount} title="My Orders">
        <div className="bg-white p-20 rounded-[3rem] border border-gray-100 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-gray-500 font-bold">Loading your order history...</p>
        </div>
      </AccountLayout>
    );
  }

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
          <p className="text-gray-900 font-bold">
            {filteredOrders.length > 0 
              ? `Showing ${paginatedOrders.length} of ${filteredOrders.length} orders`
              : 'No orders found'
            }
          </p>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by Order ID or item..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        {/* Order List */}
        {filteredOrders.length > 0 ? (
          <>
            <div className="space-y-4">
              {paginatedOrders.map((order) => {
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
                            {order.previewImage ? (
                              <OptimizedImage
                                src={order.previewImage}
                                alt={order.previewName || 'Ordered product'}
                                className="w-full h-full object-cover mix-blend-multiply"
                                width={80}
                                height={80}
                                responsiveWidths={[400, 800]}
                                sizes="80px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Package className="w-8 h-8" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{order.displayId}</p>
                            <h3 className="text-sm font-black text-gray-900 mb-1 line-clamp-1">{order.previewName}</h3>
                            <p className="text-xs text-gray-500 font-bold">{order.date} • {order.itemCount} Items</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 md:gap-8">
                          <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                            <p className="text-lg font-black text-gray-900 tracking-tight">{formatCurrency(order.total)}</p>
                          </div>
                          
                          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest ${color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {order.status}
                          </div>

                          <button 
                            onClick={() => onNavigate('order-details', order.id)}
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
                       {order.status === 'Delivered' && (
                         <button className="text-[11px] font-black text-primary hover:underline flex items-center gap-1 uppercase tracking-widest">
                            Buy Again <ArrowRight className="w-3 h-3" />
                         </button>
                       )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-sm font-bold text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-[3rem] p-16 border border-dashed border-gray-200 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-10 h-10 text-gray-200" strokeWidth={1} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">No orders found</h2>
            <p className="text-gray-500 font-medium mb-10 max-w-sm">
              We couldn't find any orders matching your criteria. Start shopping to build your history!
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
    </AccountLayout>
  );
};

export default Orders;
