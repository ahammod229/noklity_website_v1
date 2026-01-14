import React, { useState } from 'react';
import { Order } from '../../types';
import { Search, Eye, Filter, CheckCircle, Clock, Truck, Package, XCircle } from 'lucide-react';

const MOCK_ORDERS: Order[] = [
  { id: 'ORD-7782', customerName: 'Alex Morgan', email: 'alex@example.com', date: '2024-03-10', total: 1250.00, status: 'Processing', itemsCount: 2 },
  { id: 'ORD-7781', customerName: 'Sarah Connor', email: 'sarah@skynet.com', date: '2024-03-09', total: 450.50, status: 'Shipped', itemsCount: 1 },
  { id: 'ORD-7780', customerName: 'Bruce Wayne', email: 'bruce@wayne.ent', date: '2024-03-08', total: 3200.00, status: 'Delivered', itemsCount: 4 },
  { id: 'ORD-7779', customerName: 'Clark Kent', email: 'kalel@dailyplanet.com', date: '2024-03-08', total: 85.00, status: 'Cancelled', itemsCount: 1 },
  { id: 'ORD-7778', customerName: 'Diana Prince', email: 'diana@themyscira.gov', date: '2024-03-07', total: 1895.50, status: 'Pending', itemsCount: 3 },
];

const OrderManager: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Shipped': return 'bg-indigo-100 text-indigo-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
        case 'Pending': return <Clock className="w-3 h-3 mr-1" />;
        case 'Processing': return <Package className="w-3 h-3 mr-1" />;
        case 'Shipped': return <Truck className="w-3 h-3 mr-1" />;
        case 'Delivered': return <CheckCircle className="w-3 h-3 mr-1" />;
        case 'Cancelled': return <XCircle className="w-3 h-3 mr-1" />;
        default: return null;
    }
  };

  const filteredOrders = filterStatus === 'All' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
           <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
           <p className="text-gray-500 text-sm">Track and manage customer orders</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                            filterStatus === status 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 font-medium">Order ID</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Total</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-gray-900">{order.id}</td>
                  <td className="px-6 py-4">
                      <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{order.customerName}</span>
                          <span className="text-xs text-gray-500">{order.email}</span>
                      </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{order.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">${order.total.toLocaleString()}</td>
                  <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary hover:text-red-700 text-xs font-bold border border-primary/20 hover:border-primary px-3 py-1.5 rounded transition-colors">
                        View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderManager;
