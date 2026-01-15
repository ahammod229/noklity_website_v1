import React from 'react';
import { Mail, MessageCircle, Clock, CheckCircle, AlertCircle, MoreHorizontal, User } from 'lucide-react';

interface Inquiry {
  id: number;
  name: string;
  contact: string;
  method: 'Email' | 'WhatsApp';
  subject: string;
  date: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
}

const MOCK_INQUIRIES: Inquiry[] = [
  { 
    id: 1, 
    name: 'John Doe', 
    contact: 'john@example.com', 
    method: 'Email', 
    subject: 'Damaged item received - Order #ORD-7782', 
    date: '2 hrs ago', 
    status: 'Pending' 
  },
  { 
    id: 2, 
    name: 'Alice Smith', 
    contact: '+1 555-0123', 
    method: 'WhatsApp', 
    subject: 'Stock availability for Brembo GT Kit', 
    date: '5 hrs ago', 
    status: 'Resolved' 
  },
  { 
    id: 3, 
    name: 'Robert Johnson', 
    contact: 'rob.j@gmail.com', 
    method: 'Email', 
    subject: 'Return request inquiry', 
    date: '1 day ago', 
    status: 'In Progress' 
  },
  { 
    id: 4, 
    name: 'Emily Davis', 
    contact: '+1 555-0987', 
    method: 'WhatsApp', 
    subject: 'Payment issues at checkout', 
    date: '1 day ago', 
    status: 'Resolved' 
  },
  { 
    id: 5, 
    name: 'Michael Wilson', 
    contact: 'mike@cars.com', 
    method: 'Email', 
    subject: 'Bulk order pricing for garage', 
    date: '2 days ago', 
    status: 'Pending' 
  },
];

const SupportManager: React.FC = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <AlertCircle className="w-3 h-3 mr-1" />;
      case 'In Progress': return <Clock className="w-3 h-3 mr-1" />;
      case 'Resolved': return <CheckCircle className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Support Center</h2>
           <p className="text-gray-500 text-sm">Manage customer inquiries and support channels</p>
        </div>
      </div>

      {/* Contact Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-7 h-7 text-primary" />
            </div>
            <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Support Email</p>
                <p className="text-xl font-bold text-gray-900">support@noklity.com</p>
                <p className="text-xs text-gray-400 mt-1">Primary channel for formal inquiries</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-7 h-7 text-green-600" />
            </div>
            <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">WhatsApp Support</p>
                <p className="text-xl font-bold text-gray-900">+880 1713-812668</p>
                <p className="text-xs text-gray-400 mt-1">Direct line for instant messaging</p>
            </div>
        </div>
      </div>

      {/* Recent Inquiries Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-900">Recent Inquiries</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Method</th>
                <th className="px-6 py-3 font-medium">Message Preview</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_INQUIRIES.map((inquiry) => (
                <tr key={inquiry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <User className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{inquiry.name}</span>
                            <span className="text-xs text-gray-500">{inquiry.contact}</span>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        {inquiry.method === 'Email' ? (
                            <Mail className="w-4 h-4 text-gray-400" />
                        ) : (
                            <MessageCircle className="w-4 h-4 text-green-500" />
                        )}
                        <span className="text-gray-700 font-medium">{inquiry.method}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900 truncate">{inquiry.subject}</span>
                        <span className="text-xs text-gray-400">{inquiry.date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(inquiry.status)}`}>
                        {getStatusIcon(inquiry.status)}
                        {inquiry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
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

export default SupportManager;