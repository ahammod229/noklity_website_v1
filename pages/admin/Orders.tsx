
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle,
  X,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Truck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SteadfastDeliveryStatus } from '../../services/steadfastDeliveryService';
import { createNotification } from '../../services/notificationService';
import OrderTable from '../../components/admin/OrderTable';
import { Order } from '../../types';
import { useCurrency } from '../../hooks/useCurrency';
import { getShortOrderId, formatShortOrderId } from '../../utils/orderId';
import {
  createSteadfastParcelForOrder,
  getSteadfastConfig,
  
  SteadfastTrackingState,
  syncSteadfastTrackingForOrder
} from '../../services/steadfastDeliveryService';

// Extended type for Admin purposes matching the UI needs
export interface AdminOrderDetail extends Order {
  userId?: string;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  paymentMethod: string;
  phone: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  paymentSubmission?: {
    transactionReference: string | null;
    documentType: string | null;
    documentPath: string | null;
    status: string;
    createdAt: string;
  } | null;
  deliveryProvider?: 'steadfast' | 'manual' | null;
  deliveryConsignmentId?: string | null;
  deliveryTrackingCode?: string | null;
  deliveryTrackingUrl?: string | null;
  deliveryStatus?: SteadfastDeliveryStatus;
  deliveryLastSyncedAt?: string | null;
}

interface AdminOrdersProps {
  onNavigate?: (view: any, param?: any) => void;
}

const ORDER_STATUS_OPTIONS: Order['status'][] = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled'
];

const normalizeOrderStatus = (status?: string): Order['status'] => {
  const normalized = String(status || '').trim().toLowerCase();

  switch (normalized) {
    case 'processing':
      return 'Processing';
    case 'shipped':
      return 'Shipped';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
    case 'canceled':
      return 'Cancelled';
    case 'pending':
    default:
      return 'Pending';
  }
};

const mapDeliveryToOrderStatus = (
  deliveryStatus: SteadfastDeliveryStatus | undefined,
  currentStatus: Order['status']
): Order['status'] => {
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
  return status.replace(/_/g, ' ').replace(/\b\w/g, (s) => s.toUpperCase());
};

const AdminOrders: React.FC<AdminOrdersProps> = ({ onNavigate }) => {
  const { formatCurrency } = useCurrency();
  const [orders, setOrders] = useState<AdminOrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetail | null>(null);
  const [steadfastState, setSteadfastState] = useState({
    configured: false,
    enabled: false,
    autoCreate: false,
    trackingEnabled: true
  });
  const [parcelActionLoading, setParcelActionLoading] = useState<'create' | 'sync' | null>(null);

  useEffect(() => {
    void fetchOrders();
    void fetchSteadfastState();
  }, []);

  const fetchSteadfastState = async () => {
    try {
      const config = await getSteadfastConfig();
      setSteadfastState({
        configured: config.configured,
        enabled: config.enabled,
        autoCreate: config.autoCreate,
        trackingEnabled: config.trackingEnabled
      });
    } catch (error) {
      console.warn('Unable to load Steadfast state for orders page:', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setMessage(null);
    try {
      // Fetch orders with related data
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          user:users(email, display_name),
          payment_submissions(
            transaction_reference,
            document_type,
            document_path,
            status,
            created_at
          ),
          order_items(
            quantity,
            price,
            product:products(id, title, image_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedOrders: AdminOrderDetail[] = data.map((order: any) => {
          const shipping = order.shipping_address || {};
          const paymentStatus = order.payment_status === 'paid'
            ? 'Paid'
            : order.payment_status === 'failed'
              ? 'Failed'
              : 'Pending';
          
          return {
            id: order.id,
            userId: order.user_id,
            customerName: shipping.fullName || 'Guest',
            email: shipping.email || order.user?.email || 'N/A',
            phone: shipping.phone || 'N/A',
            date: new Date(order.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }),
            total: order.total_amount,
            status: normalizeOrderStatus(order.status),
            itemsCount: (order.order_items || []).length,
            paymentStatus,
            paymentMethod: order.payment_method || 'N/A',
            deliveryProvider: order.delivery_provider,
            deliveryConsignmentId: order.delivery_consignment_id,
            deliveryTrackingCode: order.delivery_tracking_code,
            deliveryTrackingUrl: order.delivery_tracking_url,
            deliveryStatus: order.delivery_status || 'not_created',
            deliveryLastSyncedAt: order.delivery_last_synced_at,
            shippingAddress: {
              street: shipping.address || '',
              city: shipping.city || '',
              state: shipping.state || '',
              zip: shipping.zip || '',
              country: shipping.country || ''
            },
            items: (order.order_items || []).map((item: any) => ({
              id: item.product?.id || 'unknown',
              name: item.product?.title || 'Unknown Product',
              price: item.price,
              quantity: item.quantity,
              image: item.product?.image_url || ''
            })),
            paymentSubmission: order.payment_submissions?.[0]
              ? {
                  transactionReference: order.payment_submissions[0].transaction_reference || order.transaction_id,
                  documentType: order.payment_submissions[0].document_type,
                  documentPath: order.payment_submissions[0].document_path,
                  status: order.payment_submissions[0].status,
                  createdAt: order.payment_submissions[0].created_at
                }
              : order.transaction_id 
                ? {
                    transactionReference: order.transaction_id,
                    status: order.payment_status || 'pending',
                    createdAt: order.created_at
                  }
                : null
          };
        });
        setOrders(mappedOrders);
      }
    } catch (error) {
      console.error('Error fetching admin orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const normalizedStatus = normalizeOrderStatus(newStatus);

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: normalizedStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: normalizedStatus } : o));
      
      // Send Notification
      const currentOrder = orders.find(o => o.id === orderId);
      if (currentOrder && currentOrder.userId) {
        const shortId = formatShortOrderId(orderId);
        createNotification({
          user_id: currentOrder.userId,
          title: 'Order Status Updated',
          message: `Your order #${shortId} is now ${normalizedStatus}.`,
          type: 'order_status',
          link: `/orders/${orderId}`,
        }).catch(() => {});
      }
      
      // Update modal state if open
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: normalizedStatus } : null);
      }

      if (
        normalizedStatus === 'Processing' &&
        steadfastState.enabled &&
        steadfastState.autoCreate
      ) {
        try {
          const tracking = await createSteadfastParcelForOrder(orderId);
          applyTrackingToOrder(orderId, tracking);
          setMessage({ type: 'success', text: 'Order moved to Processing and Steadfast parcel created.' });
        } catch (deliveryError) {
          console.error('Auto parcel creation failed:', deliveryError);
          setMessage({
            type: 'error',
            text:
              deliveryError instanceof Error
                ? `Status updated, but parcel creation failed: ${deliveryError.message}`
                : 'Status updated, but parcel creation failed.'
          });
        }
      } else {
        setMessage({ type: 'success', text: `Order status updated to ${normalizedStatus}` });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage({ type: 'error', text: 'Failed to update order status' });
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    try {
      // payment_status should be lowercase in DB ('pending', 'paid', 'failed')
      const dbStatus = newPaymentStatus.toLowerCase();
      
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: dbStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Update payment_submissions if it exists
      await supabase
        .from('payment_submissions')
        .update({ status: dbStatus === 'paid' ? 'approved' : dbStatus === 'failed' ? 'rejected' : 'pending' })
        .eq('order_id', orderId);

      // Update local state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: newPaymentStatus as 'Paid'|'Pending'|'Failed' } : o));
      
      // Send Notification
      const currentOrder = orders.find(o => o.id === orderId);
      if (currentOrder && currentOrder.userId) {
        const shortId = formatShortOrderId(orderId);
        createNotification({
          user_id: currentOrder.userId,
          title: 'Payment Status Updated',
          message: `The payment for your order #${shortId} has been marked as ${newPaymentStatus}.`,
          type: 'payment_status',
          link: `/orders/${orderId}`,
        }).catch(() => {});
      }
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, paymentStatus: newPaymentStatus as 'Paid'|'Pending'|'Failed' } : null);
      }

      setMessage({ type: 'success', text: `Payment status updated to ${newPaymentStatus}` });
    } catch (error) {
      console.error('Error updating payment status:', error);
      setMessage({ type: 'error', text: 'Failed to update payment status' });
    }
  };

  const applyTrackingToOrder = (orderId: string, tracking: SteadfastTrackingState) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          deliveryProvider: 'steadfast',
          deliveryConsignmentId: tracking.consignmentId || order.deliveryConsignmentId || null,
          deliveryTrackingCode: tracking.trackingCode || order.deliveryTrackingCode || null,
          deliveryTrackingUrl: tracking.trackingUrl || order.deliveryTrackingUrl || null,
          deliveryStatus: tracking.deliveryStatus || order.deliveryStatus || 'not_created',
          deliveryLastSyncedAt: tracking.lastSyncedAt || new Date().toISOString(),
          status: mapDeliveryToOrderStatus(tracking.deliveryStatus, order.status)
        };
      })
    );

    setSelectedOrder((prev) => {
      if (!prev || prev.id !== orderId) return prev;
      return {
        ...prev,
        deliveryProvider: 'steadfast',
        deliveryConsignmentId: tracking.consignmentId || prev.deliveryConsignmentId || null,
        deliveryTrackingCode: tracking.trackingCode || prev.deliveryTrackingCode || null,
        deliveryTrackingUrl: tracking.trackingUrl || prev.deliveryTrackingUrl || null,
        deliveryStatus: tracking.deliveryStatus || prev.deliveryStatus || 'not_created',
        deliveryLastSyncedAt: tracking.lastSyncedAt || new Date().toISOString(),
        status: mapDeliveryToOrderStatus(tracking.deliveryStatus, prev.status)
      };
    });
  };

  const handleCreateParcel = async (orderId: string) => {
    setParcelActionLoading('create');
    try {
      const tracking = await createSteadfastParcelForOrder(orderId);
      applyTrackingToOrder(orderId, tracking);
      setMessage({ type: 'success', text: 'Steadfast parcel created successfully.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to create Steadfast parcel.'
      });
    } finally {
      setParcelActionLoading(null);
    }
  };

  const handleSyncTracking = async (orderId: string, guestEmail?: string) => {
    setParcelActionLoading('sync');
    try {
      const tracking = await syncSteadfastTrackingForOrder(orderId, guestEmail);
      applyTrackingToOrder(orderId, tracking);
      setMessage({ type: 'success', text: 'Tracking updated from Steadfast.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to sync tracking from Steadfast.'
      });
    } finally {
      setParcelActionLoading(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    const shortId = getShortOrderId(o.id);
    const matchesSearch = 
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shortId.includes(searchTerm.trim()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePrintOrder = (order: AdminOrderDetail) => {
    const itemsRows = order.items
      .map((item) => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${formatCurrency(item.price)}</td></tr>`)
      .join('');

    const html = `
      <html>
        <head>
          <title>Order ${getShortOrderId(order.id)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
            h1, h2 { margin: 0 0 8px 0; }
            p { margin: 4px 0; font-size: 13px; }
            .box { border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin-top: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 6px; font-size: 12px; text-align: left; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>Order Details</h1>
          <p><strong>Order ID:</strong> ${getShortOrderId(order.id)}</p>
          <p><strong>Date:</strong> ${order.date}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Payment:</strong> ${order.paymentMethod} (${order.paymentStatus})</p>

          <div class="box">
            <h2>Customer</h2>
            <p>${order.customerName}</p>
            <p>${order.email}</p>
            <p>${order.phone}</p>
          </div>

          <div class="box">
            <h2>Shipping Address</h2>
            <p>${order.shippingAddress.street}</p>
            <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}</p>
            <p>${order.shippingAddress.country}</p>
          </div>

          <div class="box">
            <h2>Items</h2>
            <table>
              <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
              <tbody>${itemsRows}</tbody>
            </table>
          </div>

          <h2 style="margin-top: 16px;">Total: ${formatCurrency(order.total)}</h2>
        </body>
      </html>`;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleExportOrdersCsv = async () => {
    if (filteredOrders.length === 0) {
      setMessage({ type: 'error', text: 'No order rows to export.' });
      return;
    }

    setExporting(true);
    try {
      const headers = [
        'order_short_id',
        'order_id',
        'date',
        'status',
        'payment_status',
        'payment_method',
        'customer_name',
        'email',
        'phone',
        'items_count',
        'total',
        'shipping_street',
        'shipping_city',
        'shipping_state',
        'shipping_zip',
        'shipping_country',
        'payment_reference',
        'payment_document_type',
        'payment_document_status',
        'payment_document_created_at',
        'items'
      ];

      const escapeCsv = (value: string | number | null | undefined) =>
        `"${String(value ?? '').replace(/"/g, '""')}"`;

      const rows = filteredOrders.map((order) => {
        const itemsText = order.items
          .map((item) => `${item.name} (x${item.quantity})`)
          .join(' | ');

        return [
          getShortOrderId(order.id),
          order.id,
          order.date,
          order.status,
          order.paymentStatus,
          order.paymentMethod,
          order.customerName,
          order.email,
          order.phone,
          order.itemsCount,
          Number(order.total).toFixed(2),
          order.shippingAddress.street,
          order.shippingAddress.city,
          order.shippingAddress.state,
          order.shippingAddress.zip,
          order.shippingAddress.country,
          order.paymentSubmission?.transactionReference || '',
          order.paymentSubmission?.documentType || '',
          order.paymentSubmission?.status || '',
          order.paymentSubmission?.createdAt || '',
          itemsText
        ]
          .map(escapeCsv)
          .join(',');
      });

      const content = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Orders CSV exported successfully.' });
    } catch (error) {
      console.error('Orders CSV export failed', error);
      setMessage({ type: 'error', text: 'Failed to export orders CSV.' });
    } finally {
      setExporting(false);
    }
  };

  const stats = [
    { label: 'Total Orders', value: orders.length.toString(), icon: ShoppingBag, color: 'text-gray-900', bg: 'bg-gray-100' },
    { label: 'Pending', value: orders.filter(o => o.status === 'Pending').length.toString(), icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Delivered', value: orders.filter(o => o.status === 'Delivered').length.toString(), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Cancelled', value: orders.filter(o => o.status === 'Cancelled').length.toString(), icon: XCircle, color: 'text-primary', bg: 'bg-red-50' },
  ];

  const openPaymentProof = async (path: string) => {
    const { data, error } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 60 * 30);
    if (error || !data?.signedUrl) {
      alert('Unable to open payment proof file.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Orders</h2>
          <p className="text-gray-500 font-medium">Manage and track customer orders across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={fetchOrders}
             className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-gray-900 transition-all shadow-sm"
           >
             <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
             Refresh
           </button>
           <button
             onClick={handleExportOrdersCsv}
             disabled={exporting}
             className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-gray-900 transition-all shadow-sm disabled:opacity-60"
           >
             <Download className="w-4 h-4" />
             {exporting ? 'Exporting...' : 'Export'}
           </button>
        </div>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message.text}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
              <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                <Icon className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by ID or customer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full lg:w-48 pl-11 pr-8 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-black uppercase tracking-widest appearance-none focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all shadow-sm cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <button className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all shadow-sm">
            <Calendar className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <OrderTable 
        orders={filteredOrders} 
        isLoading={loading} 
        onView={setSelectedOrder} 
      />

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            
            <div className="p-5 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-1">Order {formatShortOrderId(selectedOrder.id)}</h2>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Placed on {selectedOrder.date}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {onNavigate && (
                  <button 
                    onClick={() => onNavigate('invoice', selectedOrder.id)}
                    className="p-3 bg-white text-primary hover:bg-red-50 rounded-full shadow-sm border border-gray-100 transition-all flex items-center gap-2 px-6"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Invoice</span>
                  </button>
                )}
                <button 
                  onClick={() => handlePrintOrder(selectedOrder)}
                  className="p-3 bg-white text-gray-700 hover:bg-gray-100 rounded-full shadow-sm border border-gray-100 transition-all flex items-center gap-2 px-6"
                >
                  <Download className="w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-widest">Print</span>
                </button>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-3 bg-white text-gray-400 hover:text-gray-900 rounded-full shadow-sm border border-gray-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* Left: Product Details */}
                <div className="lg:col-span-2 space-y-8">
                  <section>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Items Summary</h3>
                    <div className="space-y-4">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex gap-4 p-4 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm">
                          <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-50 flex-shrink-0">
                            {item.image ? (
                              <img src={item.image} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                <ShoppingBag className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col justify-center">
                            <p className="font-bold text-gray-900 text-sm mb-1">{item.name}</p>
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-gray-500 font-bold">Qty: {item.quantity}</p>
                              <p className="font-black text-gray-900">{formatCurrency(item.price)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="bg-gray-50 p-6 rounded-[1.5rem] border border-gray-100 space-y-4">
                     <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Order Calculations</h3>
                     <div className="flex justify-between text-sm font-bold">
                       <span className="text-gray-500">Subtotal</span>
                       <span className="text-gray-900">{formatCurrency(selectedOrder.total - 15)}</span>
                     </div>
                     <div className="flex justify-between text-sm font-bold">
                       <span className="text-gray-500">Shipping</span>
                       <span className="text-gray-900">{formatCurrency(15)}</span>
                     </div>
                     <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                       <span className="text-lg font-black text-gray-900">Total Charged</span>
                       <span className="text-2xl font-black text-primary">{formatCurrency(selectedOrder.total)}</span>
                     </div>
                  </section>
                </div>

                {/* Right: Customer & Logistics */}
                <div className="space-y-6">
                  <section className="p-6 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5" /> Customer Profile
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm">
                          {selectedOrder.customerName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 leading-tight">{selectedOrder.customerName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Customer</p>
                        </div>
                      </div>
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                          <Mail className="w-3.5 h-3.5 text-gray-400" /> 
                          <span className="truncate max-w-[180px]" title={selectedOrder.email}>{selectedOrder.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400" /> {selectedOrder.phone}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="p-6 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> Shipping Address
                    </h3>
                    <p className="text-xs font-bold text-gray-700 leading-relaxed">
                      {selectedOrder.shippingAddress.street}<br />
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zip}<br />
                      {selectedOrder.shippingAddress.country}
                    </p>
                  </section>

                  <section className="p-6 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5" /> Payment
                    </h3>
                    <div className="flex flex-col gap-3">
                       <select 
                         value={selectedOrder.paymentStatus}
                         onChange={(e) => handleUpdatePaymentStatus(selectedOrder.id, e.target.value)}
                         className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase text-center focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer transition-colors ${
                           selectedOrder.paymentStatus === 'Paid' ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100' : 
                           selectedOrder.paymentStatus === 'Failed' ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' :
                           'bg-yellow-50 text-yellow-600 border-yellow-100 hover:bg-yellow-100'
                         }`}
                       >
                         <option value="Pending">PENDING</option>
                         <option value="Paid">PAID</option>
                         <option value="Failed">FAILED</option>
                       </select>
                       <p className="text-xs font-bold text-gray-700 text-center">{selectedOrder.paymentMethod}</p>
                       {selectedOrder.paymentSubmission?.transactionReference && (
                        <p className="text-[11px] text-gray-500 text-center">
                          Ref: <span className="font-bold text-gray-700">{selectedOrder.paymentSubmission.transactionReference}</span>
                        </p>
                       )}
                       {selectedOrder.paymentSubmission?.documentPath && (
                        <button
                          type="button"
                          onClick={() => openPaymentProof(selectedOrder.paymentSubmission!.documentPath!)}
                          className="text-xs font-black uppercase tracking-widest text-primary hover:underline"
                        >
                          View Payment Proof
                        </button>
                       )}
                    </div>
                  </section>

                  <section className="p-6 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5" /> Delivery Tracking
                    </h3>
                    <div className="space-y-2 text-xs text-gray-600 font-semibold">
                      <p>
                        Provider:{' '}
                        <span className="font-black text-gray-900">
                          {selectedOrder.deliveryProvider ? selectedOrder.deliveryProvider.toUpperCase() : 'Not assigned'}
                        </span>
                      </p>
                      <p>
                        Status:{' '}
                        <span className="font-black text-gray-900">{deliveryStatusLabel(selectedOrder.deliveryStatus)}</span>
                      </p>
                      {selectedOrder.deliveryConsignmentId && (
                        <p>
                          Consignment ID:{' '}
                          <span className="font-black text-gray-900">{selectedOrder.deliveryConsignmentId}</span>
                        </p>
                      )}
                      {selectedOrder.deliveryTrackingCode && (
                        <p>
                          Tracking Code:{' '}
                          <span className="font-black text-gray-900">{selectedOrder.deliveryTrackingCode}</span>
                        </p>
                      )}
                      {selectedOrder.deliveryTrackingUrl && (
                        <a
                          href={selectedOrder.deliveryTrackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary font-black hover:underline"
                        >
                          Open tracking link <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {selectedOrder.deliveryLastSyncedAt && (
                        <p className="text-[11px] text-gray-500">
                          Last synced: {new Date(selectedOrder.deliveryLastSyncedAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        disabled={
                          !steadfastState.enabled ||
                          !steadfastState.configured ||
                          parcelActionLoading !== null ||
                          Boolean(selectedOrder.deliveryConsignmentId)
                        }
                        onClick={() => handleCreateParcel(selectedOrder.id)}
                        className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-black uppercase tracking-widest hover:border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {parcelActionLoading === 'create' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating Parcel
                          </>
                        ) : (
                          'Create Steadfast Parcel'
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={
                          !steadfastState.trackingEnabled ||
                          !steadfastState.configured ||
                          parcelActionLoading !== null ||
                          !selectedOrder.deliveryProvider
                        }
                        onClick={() => handleSyncTracking(selectedOrder.id, selectedOrder.email)}
                        className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {parcelActionLoading === 'sync' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing
                          </>
                        ) : (
                          'Sync Tracking'
                        )}
                      </button>
                    </div>
                  </section>
                </div>

              </div>
            </div>

            <div className="p-5 bg-white border-t border-gray-100 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex gap-3">
                 <select 
                   value={normalizeOrderStatus(selectedOrder.status)}
                   onChange={(e) => handleUpdateStatus(selectedOrder.id, normalizeOrderStatus(e.target.value))}
                   className="select-accent flex-1 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest outline-none appearance-none cursor-pointer border border-accent bg-accent text-white hover:bg-accent focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-colors"
                 >
                   {ORDER_STATUS_OPTIONS.map((status) => (
                     <option key={status} value={status}>
                       {status}
                     </option>
                   ))}
                 </select>
              </div>
              <button className="flex-1 px-6 py-3 bg-primary text-white font-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-500/20">
                Update Status
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrders;
