
import React from 'react';
import { ChevronLeft, Package, Truck, CheckCircle, MapPin, CreditCard, Calendar, Clock, Printer, Download } from 'lucide-react';

interface OrderDetailsProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: any, param?: any) => void;
  orderId?: string;
}

const MOCK_ORDER_DETAIL = {
  id: 'ORD-7782',
  date: 'October 12, 2024',
  status: 'Shipped',
  paymentMethod: 'Visa ending in 4242',
  shippingAddress: {
    name: 'Alex Morgan',
    street: '123 Performance Blvd',
    city: 'Speedway City',
    state: 'CA',
    zip: '90210',
    country: 'United States'
  },
  items: [
    {
      id: '101',
      name: 'Brembo GT Braking System Kit',
      category: 'Brakes',
      price: 1250.00,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1626438061453-623e1987d603?q=80&w=2940&auto=format&fit=crop'
    },
    {
      id: '108',
      name: 'K&N High-Flow Air Filter',
      category: 'Engine',
      price: 65.99,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1508209803874-51e443831844?q=80&w=2940&auto=format&fit=crop'
    }
  ],
  subtotal: 1381.98,
  shipping: 25.00,
  tax: 110.56,
  total: 1517.54
};

const TIMELINE_STEPS = [
  { label: 'Order Placed', date: 'Oct 12, 10:23 AM', icon: Calendar, completed: true },
  { label: 'Processing', date: 'Oct 12, 02:45 PM', icon: Package, completed: true },
  { label: 'Shipped', date: 'Oct 13, 09:15 AM', icon: Truck, completed: true },
  { label: 'Delivered', date: 'Estimated Oct 15', icon: CheckCircle, completed: false },
];

const OrderDetails: React.FC<OrderDetailsProps> = ({
  onNavigate,
  orderId
}) => {
  // Use passed ID or fallback to mock
  // In a real app, you would fetch based on orderId
  const displayId = orderId || MOCK_ORDER_DETAIL.id;
  
  // Guard clause if data is missing (in real fetch scenarios)
  const orderData = MOCK_ORDER_DETAIL; 
  if (!orderData) {
      return <div className="p-8 text-center text-gray-500">Order not found</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* Navigation & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <button 
                onClick={() => onNavigate('orders')}
                className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors group"
            >
                <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Orders
            </button>
            <div className="flex gap-3">
                <button 
                  onClick={() => onNavigate('invoice', displayId)}
                  className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Printer className="w-4 h-4" />
                    Print Invoice
                </button>
                <button 
                  onClick={() => onNavigate('invoice', displayId)}
                  className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Download Invoice
                </button>
            </div>
        </div>

        {/* Header Section */}
        <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Order #{displayId}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {orderData.date}
                </span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="flex items-center gap-1.5 text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                    <Truck className="w-3.5 h-3.5" />
                    {orderData.status}
                </span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Timeline */}
                <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-8">Order Status</h2>
                    <div className="relative">
                        {/* Connecting Line */}
                        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-100 hidden sm:block"></div>
                        
                        <div className="space-y-8 sm:space-y-0 sm:flex sm:justify-between relative">
                             {TIMELINE_STEPS.map((step, index) => {
                                 const Icon = step.icon;
                                 return (
                                     <div key={index} className="flex sm:flex-col items-center sm:text-center relative z-10 gap-4 sm:gap-2 w-full sm:w-1/4">
                                         <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-colors duration-500 ${
                                             step.completed 
                                             ? 'bg-green-500 border-green-100 text-white shadow-lg shadow-green-200' 
                                             : 'bg-white border-gray-100 text-gray-300'
                                         }`}>
                                             <Icon className="w-5 h-5" />
                                         </div>
                                         <div className="flex-1 sm:w-full">
                                             <p className={`text-sm font-bold ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                                                 {step.label}
                                             </p>
                                             <p className="text-xs text-gray-500 mt-0.5">{step.date}</p>
                                         </div>
                                     </div>
                                 );
                             })}
                        </div>
                         {/* Desktop Horizontal Line */}
                         <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-100 -z-0 hidden sm:block mx-12">
                             <div 
                                className="h-full bg-green-500 transition-all duration-1000" 
                                style={{ width: '66%' }} // Mock progress
                             ></div>
                         </div>
                    </div>
                </section>

                {/* Items List */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Items Ordered</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {orderData.items && orderData.items.length > 0 ? orderData.items.map((item) => (
                            <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-6">
                                <div className="w-24 h-24 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden flex-shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                                            <p className="text-sm text-gray-500">{item.category}</p>
                                        </div>
                                        <p className="font-bold text-gray-900 text-lg">${item.price.toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="inline-flex items-center bg-gray-50 rounded-lg px-3 py-1 text-sm font-medium text-gray-600">
                                            Qty: {item.quantity}
                                        </div>
                                        <button className="text-primary text-sm font-bold hover:underline">
                                            Write a Review
                                        </button>
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
                            <span className="font-medium text-gray-900">${orderData.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Shipping</span>
                            <span className="font-medium text-gray-900">${orderData.shipping.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax</span>
                            <span className="font-medium text-gray-900">${orderData.tax.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 mb-6">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-black text-primary">${orderData.total.toLocaleString()}</span>
                    </div>
                    <button className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-[0.98]">
                        Reorder All Items
                    </button>
                </div>

                {/* Shipping & Payment Info */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                     <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Shipping Address
                        </h3>
                        {orderData.shippingAddress && (
                            <address className="not-italic text-sm text-gray-600 leading-relaxed">
                                <span className="font-bold text-gray-900 block mb-1">{orderData.shippingAddress.name}</span>
                                {orderData.shippingAddress.street}<br />
                                {orderData.shippingAddress.city}, {orderData.shippingAddress.state} {orderData.shippingAddress.zip}<br />
                                {orderData.shippingAddress.country}
                            </address>
                        )}
                     </div>
                     
                     <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Payment Method
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-900 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">
                             <div className="w-8 h-5 bg-white border border-gray-200 rounded flex items-center justify-center">
                                 <span className="text-[8px] font-bold text-blue-800">VISA</span>
                             </div>
                             {orderData.paymentMethod}
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
