import React from 'react';
import { Clock, Truck, CheckCircle, XCircle, Package, AlertCircle } from 'lucide-react';

interface OrderStatusBadgeProps {
  status: string;
  type?: 'order' | 'payment';
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, type = 'order' }) => {
  const getColors = () => {
    if (type === 'payment') {
      switch (status) {
        case 'Paid': return 'bg-green-50 text-green-700 border-green-100';
        case 'Pending': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
        case 'Failed': return 'bg-red-50 text-red-700 border-red-100';
        default: return 'bg-gray-50 text-gray-700 border-gray-100';
      }
    }

    switch (status) {
      case 'Delivered': return 'bg-green-50 text-green-700 border-green-100';
      case 'Shipped': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Processing': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Pending': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getIcon = () => {
    if (type === 'payment') {
      switch (status) {
        case 'Paid': return <CheckCircle className="w-3.5 h-3.5" />;
        case 'Pending': return <Clock className="w-3.5 h-3.5" />;
        case 'Failed': return <XCircle className="w-3.5 h-3.5" />;
        default: return <AlertCircle className="w-3.5 h-3.5" />;
      }
    }

    switch (status) {
      case 'Delivered': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'Shipped': return <Truck className="w-3.5 h-3.5" />;
      case 'Processing': return <Package className="w-3.5 h-3.5" />;
      case 'Pending': return <Clock className="w-3.5 h-3.5" />;
      case 'Cancelled': return <XCircle className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider ${getColors()}`}>
      {getIcon()}
      {status}
    </span>
  );
};

export default OrderStatusBadge;