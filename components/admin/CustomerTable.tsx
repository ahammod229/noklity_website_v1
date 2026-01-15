import React from 'react';
import { Eye, ShieldX, CheckCircle, Mail, Phone, ExternalLink } from 'lucide-react';
import { Customer } from '../../services/customerService';

interface CustomerTableProps {
  customers: Customer[];
  onView: (customer: Customer) => void;
  onToggleStatus: (id: string, status: 'Active' | 'Blocked') => void;
  isLoading: boolean;
}

const CustomerTable: React.FC<CustomerTableProps> = ({ customers, onView, onToggleStatus, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-[2rem] border border-gray-100 p-24 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Customer Database</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
              <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Orders</th>
              <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Total Spent</th>
              <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Joined</th>
              <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shadow-lg shadow-red-500/10">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 leading-tight">{customer.name}</p>
                      <p className="text-xs text-gray-400 font-medium">{customer.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 font-mono font-bold text-gray-900 text-sm">
                  {customer.ordersCount}
                </td>
                <td className="px-8 py-5">
                  <span className="text-sm font-black text-gray-900">
                    ${customer.totalSpent.toLocaleString()}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    customer.status === 'Active' 
                    ? 'bg-green-50 text-green-700 border-green-100' 
                    : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${customer.status === 'Active' ? 'bg-green-600' : 'bg-red-600'}`} />
                    {customer.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-xs font-bold text-gray-500 whitespace-nowrap">
                  {customer.joinedDate}
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end items-center gap-2">
                    <button 
                      onClick={() => onView(customer)}
                      className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 transition-all shadow-sm group-hover:shadow"
                      title="View Profile"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {customer.status === 'Active' ? (
                      <button 
                        onClick={() => onToggleStatus(customer.id, 'Blocked')}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Block Access"
                      >
                        <ShieldX className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => onToggleStatus(customer.id, 'Active')}
                        className="p-2.5 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                        title="Unblock Access"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerTable;
