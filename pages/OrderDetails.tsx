
import React, { useEffect, useState } from 'react';
import { 
  ChevronLeft, 
  Package, 
  Truck, 
  CheckCircle, 
  MapPin, 
  CreditCard, 
  Calendar, 
  Clock, 
  Printer, 
  Download, 
  Loader2, 
  AlertCircle,
  XCircle
} from 'lucide-react';
import { getOrderById, OrderDetail } from '../services/orderService';
import { downloadInvoicePDF } from '../services/invoiceService';
import { supabase } from '../lib/supabase';
import { useCurrency } from '../hooks/useCurrency';

interface OrderDetailsProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: any, param?: any) => void;
  orderId?: string;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({
  onNavigate,
  orderId
}) => {
  const { formatCurrency } = useCurrency();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingReviewFor, setSubmittingReviewFor] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError("No order ID provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getOrderById(orderId);
        if (data) {
          setOrder(data);
        } else {
          setError("Order not found");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 font-sans">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-bold">Loading Order Details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 font-sans">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl text-center max-w-md border border-gray-100">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-500 mb-8 font-medium">
            {error || "The requested order could not be found."}
          </p>
          <button 
            onClick={() => onNavigate('account-orders')}
            className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const handleWriteReview = async (productId: string, productName: string) => {
    if (!order || order.status !== 'Delivered') {
      alert('You can only review after delivery.');
      return;
    }

    const ratingInput = window.prompt(`Rate "${productName}" (1-5)`);
    if (!ratingInput) return;
    const rating = Math.max(1, Math.min(5, Number(ratingInput)));
    if (Number.isNaN(rating)) {
      alert('Please enter a valid rating number.');
      return;
    }

    const comment = window.prompt('Write your review comment') || '';
    const title = window.prompt('Review title (optional)') || null;

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      alert('Please login again.');
      return;
    }

    setSubmittingReviewFor(productId);
    const { error: reviewError } = await supabase
      .from('product_reviews')
      .upsert({
        product_id: productId,
        order_id: order.id,
        user_id: authData.user.id,
        rating,
        title,
        comment,
        status: 'pending'
      }, { onConflict: 'order_id,user_id,product_id' });
    setSubmittingReviewFor(null);

    if (reviewError) {
      console.error('Failed to submit review:', reviewError);
      alert(reviewError.message || 'Failed to submit review');
      return;
    }

    alert('Review submitted and waiting for admin approval.');
  };

  // Timeline Logic
  const steps = [
    { id: 'Pending', label: 'Order Placed', icon: Calendar },
    { id: 'Processing', label: 'Processing', icon: Package },
    { id: 'Shipped', label: 'Shipped', icon: Truck },
    { id: 'Delivered', label: 'Delivered', icon: CheckCircle },
  ];

  const statusOrder = ['Pending', 'Processing', 'Shipped', 'Delivered'];
  const currentStatusIdx = statusOrder.indexOf(order.status);
  const isCancelled = order.status === 'Cancelled';

  const progressWidth = isCancelled 
    ? '0%' 
    : `${Math.max(0, Math.min(100, (currentStatusIdx / (steps.length - 1)) * 100))}%`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* Navigation & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <button 
                onClick={() => onNavigate('account-orders')}
                className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors group"
            >
                <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Orders
            </button>
            <div className="flex gap-3">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Printer className="w-4 h-4" />
                    Print
                </button>
                <button 
                  onClick={() => downloadInvoicePDF(order.id)}
                  className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Invoice
                </button>
            </div>
        </div>

        {/* Header Section */}
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black text-gray-900">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
                {isCancelled && (
                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-red-200">
                        Cancelled
                    </span>
                )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {order.date}
                </span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className={`flex items-center gap-1.5 font-bold px-2 py-0.5 rounded-md ${
                    isCancelled 
                    ? 'text-red-600 bg-red-50' 
                    : 'text-indigo-600 bg-indigo-50'
                }`}>
                    {isCancelled ? <XCircle className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                    {order.status}
                </span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Timeline */}
                <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <h2 className="text-lg font-bold text-gray-900 mb-8">Order Status</h2>
                    
                    {isCancelled ? (
                        <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100 text-red-700">
                            <XCircle className="w-6 h-6" />
                            <div>
                                <p className="font-bold">Order Cancelled</p>
                                <p className="text-sm">This order has been cancelled and will not be processed.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative px-2">
                            {/* Desktop Connecting Line */}
                            <div className="absolute top-6 left-6 right-6 h-1 bg-gray-100 rounded-full -z-0 hidden sm:block">
                                <div 
                                    className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: progressWidth }} 
                                ></div>
                            </div>
                            
                            {/* Mobile Connecting Line (Vertical) */}
                            <div className="absolute left-6 top-6 bottom-6 w-1 bg-gray-100 rounded-full -z-0 sm:hidden">
                                <div 
                                    className="w-full bg-green-500 rounded-full transition-all duration-1000 ease-out" 
                                    style={{ height: progressWidth }} 
                                ></div>
                            </div>
                            
                            <div className="space-y-8 sm:space-y-0 sm:flex sm:justify-between relative z-10">
                                {steps.map((step, index) => {
                                    const Icon = step.icon;
                                    const isCompleted = index <= currentStatusIdx;
                                    const isCurrent = index === currentStatusIdx;
                                    
                                    return (
                                        <div key={step.id} className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-3 bg-white sm:bg-transparent py-2 sm:py-0">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                                                isCompleted 
                                                ? 'bg-green-500 border-green-50 text-white shadow-lg shadow-green-200 scale-110' 
                                                : 'bg-white border-gray-100 text-gray-300'
                                            }`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 sm:w-32">
                                                <p className={`text-sm font-bold transition-colors ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                                    {step.label}
                                                </p>
                                                {isCurrent && (
                                                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mt-0.5 animate-pulse">
                                                        Current Step
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </section>

                {/* Items List */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Items Ordered ({order.itemsCount})</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {order.items && order.items.length > 0 ? order.items.map((item) => (
                            <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-6">
                                <div className="w-24 h-24 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden flex-shrink-0">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <Package className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg line-clamp-2">{item.name}</h3>
                                            <p className="text-sm text-gray-500">{item.category}</p>
                                        </div>
                                        <p className="font-bold text-gray-900 text-lg">{formatCurrency(item.price)}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="inline-flex items-center bg-gray-50 rounded-lg px-3 py-1 text-sm font-medium text-gray-600">
                                            Qty: {item.quantity}
                                        </div>
                                        {order.status === 'Delivered' && (
                                            <button
                                                onClick={() => handleWriteReview(item.id, item.name)}
                                                disabled={submittingReviewFor === item.id}
                                                className="text-primary text-sm font-bold hover:underline disabled:opacity-60"
                                            >
                                                {submittingReviewFor === item.id ? 'Submitting...' : 'Write a Review'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="p-6 text-center text-gray-500">No items found in this order.</div>
                        )}
                    </div>
                </section>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
                
                {/* Order Summary */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>
                    <div className="space-y-3 pb-6 border-b border-gray-100">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium text-gray-900">{formatCurrency(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Shipping</span>
                            <span className="font-medium text-gray-900">{formatCurrency(order.shipping)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax</span>
                            <span className="font-medium text-gray-900">{formatCurrency(order.tax)}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 mb-6">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-black text-primary">{formatCurrency(order.total)}</span>
                    </div>
                    {/* Only allow reordering if delivered */}
                    {order.status === 'Delivered' && (
                        <button className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-[0.98]">
                            Reorder All Items
                        </button>
                    )}
                </div>

                {/* Shipping & Payment Info */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                     <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Shipping Address
                        </h3>
                        {order.shippingAddress && (
                            <address className="not-italic text-sm text-gray-600 leading-relaxed">
                                <span className="font-bold text-gray-900 block mb-1">{order.shippingAddress.name}</span>
                                {order.shippingAddress.street}<br />
                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
                                {order.shippingAddress.country}
                            </address>
                        )}
                     </div>
                     
                     <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Payment Method
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-900 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">
                             {order.paymentMethod.includes('Card') || order.paymentMethod.includes('Visa') ? (
                                <div className="w-8 h-5 bg-white border border-gray-200 rounded flex items-center justify-center">
                                    <span className="text-[8px] font-bold text-blue-800">CARD</span>
                                </div>
                             ) : (
                                <div className="w-8 h-5 bg-white border border-gray-200 rounded flex items-center justify-center">
                                    <span className="text-[8px] font-bold text-green-800">CASH</span>
                                </div>
                             )}
                             {order.paymentMethod}
                        </div>
                     </div>
                </div>

                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                    <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Need Help?
                    </h3>
                    <p className="text-sm text-blue-700 mb-4">
                        Have questions about your order? Our support team is available 24/7.
                    </p>
                    <button 
                        onClick={() => onNavigate('help')}
                        className="text-xs font-bold text-blue-600 bg-white border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                        Contact Support
                    </button>
                </div>

            </div>
        </div>
      </main>
    </div>
  );
};

export default OrderDetails;
