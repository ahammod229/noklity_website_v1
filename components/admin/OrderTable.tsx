import React from 'react';
import { Eye, Edit, MoreVertical, Package } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';
import { AdminOrderDetail } from '../../services/adminOrderService';
import { useCurrency } from '../../hooks/useCurrency';

interface OrderTableProps {
  orders: AdminOrderDetail[];
  onView: (order: AdminOrderDetail) => void;
  isLoading: boolean;
}

const OrderTable: React.FC<OrderTableProps> = ({ orders, onView, isLoading }) => {
  const { formatCurrency } = useCurrency();
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-20 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-bold">Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-20 flex flex-col items-center justify-center text-center">
        <Package className="w-16 h-16 text-gray-200 mb-6" strokeWidth={1} />
        <h3 className="text-xl font-black text-gray-900 mb-2">No orders found</h3>
        <p className="text-gray-500 max-w-sm font-medium">We couldn't find any orders matching your current filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Order ID</th>
              <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
              <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Date</th>
              <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Items</th>
              <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Total</th>
              <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Payment</th>
              <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4 font-mono font-black text-gray-900 text-sm whitespace-nowrap">
                  <button
                    onClick={() => onView(order)}
                    className="hover:text-primary underline-offset-2 hover:underline"
                    title="View order details"
                  >
                    #{order.id}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">{order.customerName}</span>
                    <span className="text-xs text-gray-400">{order.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                  {order.date}
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-600">
                    {order.itemsCount}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-black text-gray-900">
                    {formatCurrency(order.total)}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <OrderStatusBadge status={order.paymentStatus} type="payment" />
                </td>
                <td className="px-6 py-4 text-center">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center gap-2">
                    <button 
                      onClick={() => onView(order)}
                      className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 transition-all shadow-sm group-hover:shadow"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-primary hover:bg-red-50 rounded-xl transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mock Pagination */}
      <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Showing {orders.length} of 48 orders</p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-400 cursor-not-allowed">Prev</button>
          <button className="px-4 py-2 bg-gray-900 border border-gray-900 rounded-xl text-xs font-black text-white shadow-lg shadow-gray-200">1</button>
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-700 hover:border-gray-900 transition-all">2</button>
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-700 hover:border-gray-900 transition-all">Next</button>
        </div>
      </div>
    </div>
  );
};

export default OrderTable;
