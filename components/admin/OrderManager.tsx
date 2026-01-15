import React, { useState } from 'react';
import { Order } from '../../types';
import { 
  Search, Eye, Filter, CheckCircle, Clock, Truck, Package, XCircle, 
  MoreHorizontal, ChevronDown, X, MapPin, Phone, Mail, CreditCard,
  Calendar, Printer, Download, User
} from 'lucide-react';

// Extended type for Admin purposes
interface OrderItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image: string;
}

interface AdminOrder extends Order {
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  phone: string;
  paymentMethod: string;
  items: OrderItem[];
}

const MOCK_ORDERS: AdminOrder[] = [
  { 
    id: 'ORD-7782', 
    customerName: 'Alex Morgan', 
    email: 'alex@example.com', 
    phone: '+1 (555) 123-4567',
    date: '2024-03-10', 
    total: 1250.00, 
    status: 'Processing', 
    itemsCount: 2,
    paymentMethod: 'Visa ending in 4242',
    shippingAddress: { street: '123 Performance Blvd', city: 'Speedway City', state: 'CA', zip: '90210', country: 'US' },
    items: [
        { id: '1', name: 'Brembo GT Braking System Kit', category: 'Brakes', price: 1250.00, quantity: 1, image: 'https://images.unsplash.com/photo-1626438061453-623e1987d603?q=80&w=2940&auto=format&fit=crop' }
    ]
  },
  { 
    id: 'ORD-7781', 
    customerName: 'Sarah Connor', 
    email: 'sarah@skynet.com', 
    phone: '+1 (555) 987-6543',
    date: '2024-03-09', 
    total: 450.50, 
    status: 'Shipped', 
    itemsCount: 1,
    paymentMethod: 'PayPal',
    shippingAddress: { street: '456 Future Lane', city: 'Tech Valley', state: 'CA', zip: '94043', country: 'US' },
    items: [
        { id: '2', name: 'Sparco Racing Gloves', category: 'Interior', price: 89.00, quantity: 1, image: 'https://images.unsplash.com/photo-1599951304911-37d044439031?q=80&w=2787&auto=format&fit=crop' }
    ]
  },
  { 
    id: 'ORD-7780', 
    customerName: 'Bruce Wayne', 
    email: 'bruce@wayne.ent', 
    phone: '+1 (555) 555-5555',
    date: '2024-03-08', 
    total: 3200.00, 
    status: 'Delivered', 
    itemsCount: 4,
    paymentMethod: 'Mastercard ending in 8888',
    shippingAddress: { street: '1007 Mountain Drive', city: 'Gotham', state: 'NJ', zip: '07001', country: 'US' },
    items: [
        { id: '3', name: 'Akrapovič Titanium Exhaust', category: 'Exhaust', price: 3200.00, quantity: 1, image: 'https://images.unsplash.com/photo-1565538361093-9c59573887c3?q=80&w=2940&auto=format&fit=crop' }
    ]
  },
  { 
    id: 'ORD-7779', 
    customerName: 'Clark Kent', 
    email: 'kalel@dailyplanet.com', 
    phone: '+1 (555) 777-7777',
    date: '2024-03-08', 
    total: 85.00, 
    status: 'Cancelled', 
    itemsCount: 1,
    paymentMethod: 'Visa ending in 1111',
    shippingAddress: { street: '344 Clinton St', city: 'Metropolis', state: 'NY', zip: '10001', country: 'US' },
    items: [
        { id: '4', name: 'K&N High-Flow Air Filter', category: 'Engine', price: 65.99, quantity: 1, image: 'https://images.unsplash.com/photo-1508209803874-51e443831844?q=80&w=2940&auto=format&fit=crop' }
    ]
  },
  { 
    id: 'ORD-7778', 
    customerName: 'Diana Prince', 
    email: 'diana@themyscira.gov', 
    phone: '+1 (555) 222-3333',
    date: '2024-03-07', 
    total: 1895.50, 
    status: 'Pending', 
    itemsCount: 3,
    paymentMethod: 'Visa ending in 3333',
    shippingAddress: { street: '1 Paradise Island', city: 'Themyscira', state: 'GR', zip: '00000', country: 'GR' },
    items: [
        { id: '5', name: 'KW V3 Coilover Suspension', category: 'Suspension', price: 1895.50, quantity: 1, image: 'https://images.unsplash.com/photo-1614251412693-4a1f6494cb68?q=80&w=2940&auto=format&fit=crop' }
    ]
  },
];

const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const OrderManager: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>(MOCK_ORDERS);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState<string | null>(null);

  const handleStatusChange = (orderId: string, newStatus: any) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    setIsStatusDropdownOpen(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = filterStatus === 'All' || o.status === filterStatus;
    const matchesSearch = 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
           <div>
             <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
             <p className="text-gray-500 text-sm">Manage and fulfill customer orders</p>
           </div>
           <div className="flex gap-2">
             <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm">
                <Download className="w-4 h-4" />
                Export
             </button>
           </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col lg:flex-row gap-4 justify-between items-center">
            {/* Search */}
            <div className="relative w-full lg:w-96">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search orders, customers..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
            </div>
            
            {/* Status Tabs */}
            <div className="flex gap-1 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 no-scrollbar">
                <button
                    onClick={() => setFilterStatus('All')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                        filterStatus === 'All' 
                        ? 'bg-gray-900 text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-200/50'
                    }`}
                >
                    All Orders
                </button>
                {ORDER_STATUSES.map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                            filterStatus === status 
                            ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' 
                            : 'text-gray-500 hover:bg-gray-200/50'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Total</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-gray-900 whitespace-nowrap">{order.id}</td>
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs uppercase">
                              {order.customerName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                              <span className="font-bold text-gray-900 text-sm">{order.customerName}</span>
                              <span className="text-xs text-gray-500">{order.email}</span>
                          </div>
                      </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{order.date}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">${order.total.toLocaleString()}</td>
                  <td className="px-6 py-4">
                      <div className="relative">
                          <button 
                            onClick={() => setIsStatusDropdownOpen(isStatusDropdownOpen === order.id ? null : order.id)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border cursor-pointer hover:opacity-80 transition-opacity gap-1.5 ${getStatusColor(order.status)}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></span>
                            {order.status}
                            <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                          </button>

                          {/* Status Dropdown */}
                          {isStatusDropdownOpen === order.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(null)} />
                                <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    {ORDER_STATUSES.map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusChange(order.id, status)}
                                            className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-gray-50 flex items-center gap-2 ${order.status === status ? 'text-primary bg-red-50' : 'text-gray-700'}`}
                                        >
                                            {order.status === status && <CheckCircle className="w-3 h-3" />}
                                            <span className={order.status === status ? 'ml-0' : 'ml-5'}>{status}</span>
                                        </button>
                                    ))}
                                </div>
                              </>
                          )}
                      </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                        onClick={() => setSelectedOrder(order)}
                        className="text-gray-500 hover:text-primary transition-colors p-2 hover:bg-gray-100 rounded-lg group tooltip-trigger"
                        title="View Details"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                  <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                          <p className="font-medium">No orders found matching your criteria.</p>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-xs text-gray-500">
            <span>Showing {filteredOrders.length} orders</span>
            <div className="flex gap-2">
                <button className="px-3 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50" disabled>Previous</button>
                <button className="px-3 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50">Next</button>
            </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                  onClick={() => setSelectedOrder(null)}
              />
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
                  
                  {/* Modal Header */}
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-black text-gray-900">Order #{selectedOrder.id}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(selectedOrder.status)}`}>
                                {selectedOrder.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5" /> {selectedOrder.date}
                          </p>
                      </div>
                      <div className="flex items-center gap-2">
                          <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all">
                              <Printer className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setSelectedOrder(null)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                              <X className="w-5 h-5" />
                          </button>
                      </div>
                  </div>

                  {/* Modal Body */}
                  <div className="overflow-y-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8">
                      {/* Left: Items */}
                      <div className="flex-1 space-y-6">
                          <div>
                              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Order Items</h4>
                              <div className="space-y-4">
                                  {selectedOrder.items.map((item) => (
                                      <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/30">
                                          <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 flex-shrink-0 overflow-hidden">
                                              <img src={item.image} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                                          </div>
                                          <div className="flex-1">
                                              <h5 className="font-bold text-gray-900 text-sm mb-1">{item.name}</h5>
                                              <p className="text-xs text-gray-500 mb-2">{item.category}</p>
                                              <div className="flex justify-between items-center">
                                                  <span className="text-xs font-medium bg-white px-2 py-1 rounded border border-gray-200 text-gray-600">Qty: {item.quantity}</span>
                                                  <span className="font-bold text-gray-900">${item.price.toLocaleString()}</span>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                              <div className="flex justify-between text-sm mb-2">
                                  <span className="text-gray-500">Subtotal</span>
                                  <span className="font-medium text-gray-900">${(selectedOrder.total - 15).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm mb-2">
                                  <span className="text-gray-500">Shipping</span>
                                  <span className="font-medium text-gray-900">$15.00</span>
                              </div>
                              <div className="border-t border-gray-200 my-2 pt-2 flex justify-between items-center">
                                  <span className="font-bold text-gray-900">Total</span>
                                  <span className="font-black text-xl text-primary">${selectedOrder.total.toLocaleString()}</span>
                              </div>
                          </div>
                      </div>

                      {/* Right: Customer & Shipping */}
                      <div className="lg:w-80 space-y-6">
                          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <User className="w-3.5 h-3.5" /> Customer Details
                              </h4>
                              <div className="space-y-3">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                          {selectedOrder.customerName.charAt(0)}
                                      </div>
                                      <div>
                                          <p className="text-sm font-bold text-gray-900">{selectedOrder.customerName}</p>
                                          <p className="text-xs text-gray-500">Customer since 2024</p>
                                      </div>
                                  </div>
                                  <div className="pt-3 border-t border-gray-100 space-y-2">
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                                          <a href={`mailto:${selectedOrder.email}`} className="hover:text-primary transition-colors">{selectedOrder.email}</a>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                                          <span>{selectedOrder.phone}</span>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5" /> Shipping Address
                              </h4>
                              <address className="not-italic text-sm text-gray-600 leading-relaxed">
                                  {selectedOrder.shippingAddress.street}<br />
                                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zip}<br />
                                  {selectedOrder.shippingAddress.country}
                              </address>
                          </div>

                          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <CreditCard className="w-3.5 h-3.5" /> Payment Info
                              </h4>
                              <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  Paid via {selectedOrder.paymentMethod}
                              </p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default OrderManager;