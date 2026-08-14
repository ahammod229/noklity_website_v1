
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
  RefreshCcw,
  XCircle,
  ExternalLink,
  Star,
  MessageSquare,
  X
} from 'lucide-react';
import { getOrderById, OrderDetail } from '../services/orderService';
import { downloadInvoicePDF } from '../services/invoiceService';
import { supabase } from '../lib/supabase';
import { auth } from '../services/firebaseClient';
import { useCurrency } from '../hooks/useCurrency';
import { formatShortOrderId } from '../utils/orderId';
import {
  SteadfastDeliveryStatus,
  syncSteadfastTrackingForOrder
} from '../services/steadfastDeliveryService';
import OptimizedImage from '../components/ui/OptimizedImage';

interface OrderDetailsProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: any, param?: any) => void;
  orderId?: string;
}

interface ReviewDraft {
  productId: string;
  productName: string;
  rating: number;
  title: string;
  comment: string;
}

interface ProductReviewStatus {
  id: string;
  productId: string;
  rating: number;
  title: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
}

const mapDeliveryToOrderStatus = (
  deliveryStatus: SteadfastDeliveryStatus,
  currentStatus: OrderDetail['status']
): OrderDetail['status'] => {
  switch (deliveryStatus) {
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    case 'in_transit':
      return currentStatus === 'Delivered' ? currentStatus : 'Shipped';
    case 'picked':
    case 'pending_pickup':
    case 'created':
      if (currentStatus === 'Pending' || currentStatus === 'Processing') return 'Processing';
      return currentStatus;
    default:
      return currentStatus;
  }
};

const deliveryStatusLabel = (status?: SteadfastDeliveryStatus) => {
  if (!status || status === 'not_created') return 'Not Created';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
};

const OrderDetails: React.FC<OrderDetailsProps> = ({
  onNavigate,
  orderId
}) => {
  const { formatCurrency } = useCurrency();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingReviewFor, setSubmittingReviewFor] = useState<string | null>(null);
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft | null>(null);
  const [reviewFormError, setReviewFormError] = useState<string | null>(null);
  const [productReviews, setProductReviews] = useState<Record<string, ProductReviewStatus>>({});
  const [trackingSyncing, setTrackingSyncing] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

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

  useEffect(() => {
    const loadExistingReviews = async () => {
      if (!orderId) return;

      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const { data, error: reviewLoadError } = await supabase
        .from('product_reviews')
        .select('id, product_id, rating, title, comment, status')
        .eq('order_id', orderId)
        .eq('user_id', currentUser.uid);

      if (reviewLoadError) {
        console.error('Failed to load existing reviews:', reviewLoadError);
        return;
      }

      const nextReviewMap = (data || []).reduce<Record<string, ProductReviewStatus>>((accumulator, review: any) => {
        accumulator[String(review.product_id)] = {
          id: review.id,
          productId: String(review.product_id),
          rating: Number(review.rating) || 0,
          title: review.title || '',
          comment: review.comment || '',
          status: review.status || 'pending'
        };
        return accumulator;
      }, {});

      setProductReviews(nextReviewMap);
    };

    void loadExistingReviews();
  }, [orderId]);

  const canTrackParcel = Boolean(order?.deliveryProvider === 'steadfast' || order?.deliveryConsignmentId);

  const handleSyncTracking = async () => {
    if (!order) return;
    setTrackingSyncing(true);
    setTrackingError(null);
    try {
      const tracking = await syncSteadfastTrackingForOrder(order.id, order.email);
      setOrder((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          deliveryProvider: 'steadfast',
          deliveryConsignmentId: tracking.consignmentId || prev.deliveryConsignmentId || null,
          deliveryTrackingCode: tracking.trackingCode || prev.deliveryTrackingCode || null,
          deliveryTrackingUrl: tracking.trackingUrl || prev.deliveryTrackingUrl || null,
          deliveryStatus: tracking.deliveryStatus || prev.deliveryStatus || 'not_created',
          deliveryLastSyncedAt: tracking.lastSyncedAt || new Date().toISOString(),
          status: mapDeliveryToOrderStatus(tracking.deliveryStatus || 'unknown', prev.status)
        };
      });
    } catch (error) {
      setTrackingError(error instanceof Error ? error.message : 'Failed to sync delivery tracking.');
    } finally {
      setTrackingSyncing(false);
    }
  };

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

  const openReviewModal = (productId: string, productName: string) => {
    if (!order || order.status !== 'Delivered') {
      alert('You can only review after delivery.');
      return;
    }

    const existingReview = productReviews[productId];
    setReviewFormError(null);
    setReviewDraft({
      productId,
      productName,
      rating: existingReview?.rating || 0,
      title: existingReview?.title || '',
      comment: existingReview?.comment || ''
    });
  };

  const closeReviewModal = () => {
    if (submittingReviewFor) return;
    setReviewDraft(null);
    setReviewFormError(null);
  };

  const handleSubmitReview = async () => {
    if (!reviewDraft || !order) return;

    if (!reviewDraft.rating || reviewDraft.rating < 1 || reviewDraft.rating > 5) {
      setReviewFormError('Please select a rating between 1 and 5 stars.');
      return;
    }

    if (!reviewDraft.comment.trim()) {
      setReviewFormError('Please write a short review before submitting.');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setReviewFormError('Please login again and then submit your review.');
      return;
    }

    setSubmittingReviewFor(reviewDraft.productId);
    setReviewFormError(null);
    const { error: reviewError } = await supabase
      .from('product_reviews')
      .upsert({
        product_id: reviewDraft.productId,
        order_id: order.id,
        user_id: currentUser.uid,
        rating: reviewDraft.rating,
        title: reviewDraft.title.trim() || null,
        comment: reviewDraft.comment.trim(),
        status: 'approved'
      }, { onConflict: 'order_id,user_id,product_id' });
    setSubmittingReviewFor(null);

    if (reviewError) {
      console.error('Failed to submit review:', reviewError);
      setReviewFormError(reviewError.message || 'Failed to submit review');
      return;
    }

    setProductReviews((prev) => ({
      ...prev,
      [reviewDraft.productId]: {
        id: prev[reviewDraft.productId]?.id || `${reviewDraft.productId}-${order.id}`,
        productId: reviewDraft.productId,
        rating: reviewDraft.rating,
        title: reviewDraft.title.trim(),
        comment: reviewDraft.comment.trim(),
        status: 'approved'
      }
    }));
    setReviewDraft(null);
    setReviewFormError(null);
    alert('Review submitted successfully. It is now visible on the product page.');
  };

  const reviewStatusMeta = (status?: ProductReviewStatus['status']) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Review Approved',
          badgeClass: 'bg-green-50 text-green-700 border-green-100',
          buttonLabel: 'Update Review'
        };
      case 'rejected':
        return {
          label: 'Needs Update',
          badgeClass: 'bg-red-50 text-red-700 border-red-100',
          buttonLabel: 'Update Review'
        };
      case 'pending':
      default:
        return {
          label: 'Pending Approval',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-100',
          buttonLabel: 'Edit Review'
        };
    }
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
            <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => {
                    try {
                      window.sessionStorage.setItem('noklity_auto_print_invoice', '1');
                    } catch {
                      // Ignore storage access errors.
                    }
                    onNavigate('invoice', order.id);
                  }}
                  className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Printer className="w-4 h-4" />
                    Print Invoice
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
                <h1 className="text-3xl font-black text-gray-900">Order {formatShortOrderId(order.id)}</h1>
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
                                        <OptimizedImage
                                          src={item.image}
                                          alt={item.name}
                                          className="w-full h-full object-cover mix-blend-multiply"
                                          width={88}
                                          height={88}
                                          responsiveWidths={[400, 800]}
                                          sizes="88px"
                                        />
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
                                            <div className="flex flex-col items-end gap-2">
                                                {productReviews[item.id] && (
                                                  <span
                                                    className={`px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-[0.16em] ${
                                                      reviewStatusMeta(productReviews[item.id].status).badgeClass
                                                    }`}
                                                  >
                                                    {reviewStatusMeta(productReviews[item.id].status).label}
                                                  </span>
                                                )}
                                                <button
                                                    onClick={() => openReviewModal(item.id, item.name)}
                                                    disabled={submittingReviewFor === item.id}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-2 text-sm font-black text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-60"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                    {submittingReviewFor === item.id
                                                      ? 'Submitting...'
                                                      : productReviews[item.id]
                                                        ? reviewStatusMeta(productReviews[item.id].status).buttonLabel
                                                        : 'Write a Review'}
                                                </button>
                                            </div>
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

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Delivery Tracking
                    </h3>
                    <div className="space-y-2 text-sm text-gray-700">
                        <p>
                            <span className="text-gray-500">Provider: </span>
                            <span className="font-semibold text-gray-900">
                                {order.deliveryProvider ? order.deliveryProvider.toUpperCase() : 'Not assigned'}
                            </span>
                        </p>
                        <p>
                            <span className="text-gray-500">Status: </span>
                            <span className="font-semibold text-gray-900">{deliveryStatusLabel(order.deliveryStatus)}</span>
                        </p>
                        {order.deliveryConsignmentId && (
                          <p>
                            <span className="text-gray-500">Consignment ID: </span>
                            <span className="font-semibold text-gray-900">{order.deliveryConsignmentId}</span>
                          </p>
                        )}
                        {order.deliveryTrackingCode && (
                          <p>
                            <span className="text-gray-500">Tracking Code: </span>
                            <span className="font-semibold text-gray-900">{order.deliveryTrackingCode}</span>
                          </p>
                        )}
                        {order.deliveryTrackingUrl && (
                          <a
                            href={order.deliveryTrackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline"
                          >
                            Open courier tracking page <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {order.deliveryLastSyncedAt && (
                          <p className="text-xs text-gray-500">
                            Last synced: {new Date(order.deliveryLastSyncedAt).toLocaleString()}
                          </p>
                        )}
                    </div>

                    {trackingError && (
                      <p className="mt-3 text-xs text-red-600 font-semibold">{trackingError}</p>
                    )}

                    <button
                      type="button"
                      onClick={handleSyncTracking}
                      disabled={trackingSyncing || !canTrackParcel}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {trackingSyncing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="w-3.5 h-3.5" />
                          Refresh Tracking
                        </>
                      )}
                    </button>
                    {!canTrackParcel && (
                      <p className="mt-2 text-xs text-gray-500">
                        Parcel not created yet. Tracking will appear after dispatch.
                      </p>
                    )}
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

      {reviewDraft && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/65 backdrop-blur-sm" onClick={closeReviewModal} />
          <div className="relative w-full max-w-2xl rounded-[2rem] border border-gray-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 sm:px-8">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Share Your Feedback</p>
                <h2 className="mt-1 text-2xl font-black text-gray-900">Review {reviewDraft.productName}</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">
                  Your review will appear on this product page after submission. Admin can still moderate it later if needed.
                </p>
              </div>
              <button
                type="button"
                onClick={closeReviewModal}
                disabled={Boolean(submittingReviewFor)}
                className="rounded-full border border-gray-200 p-2 text-gray-400 hover:text-gray-900 hover:border-gray-300 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 px-6 py-6 sm:px-8">
              <div>
                <label className="mb-3 block text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
                  Rating
                </label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setReviewDraft((prev) => (prev ? { ...prev, rating: star } : prev))
                      }
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
                        star <= reviewDraft.rating
                          ? 'border-amber-200 bg-amber-50 text-amber-500'
                          : 'border-gray-200 bg-white text-gray-300 hover:border-gray-300 hover:text-gray-500'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${star <= reviewDraft.rating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
                  Review Title
                </label>
                <input
                  type="text"
                  value={reviewDraft.title}
                  onChange={(event) =>
                    setReviewDraft((prev) => (prev ? { ...prev, title: event.target.value } : prev))
                  }
                  placeholder="Example: Excellent quality and backup performance"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-base font-medium text-gray-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
                  Detailed Review
                </label>
                <textarea
                  rows={5}
                  value={reviewDraft.comment}
                  onChange={(event) =>
                    setReviewDraft((prev) => (prev ? { ...prev, comment: event.target.value } : prev))
                  }
                  placeholder="Write about product quality, packaging, delivery experience, and whether it matched your expectations."
                  className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-base font-medium text-gray-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              {reviewFormError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {reviewFormError}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
              <button
                type="button"
                onClick={closeReviewModal}
                disabled={Boolean(submittingReviewFor)}
                className="h-11 rounded-2xl border border-gray-200 px-5 text-sm font-black text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={Boolean(submittingReviewFor)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {submittingReviewFor ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
