import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  TrendingUp, 
  ArrowUpRight, 
  UserPlus, 
  ShieldCheck, 
  UserX, 
  FileText,
  Download,
  Loader2
} from 'lucide-react';
import CustomerTable from '../../components/admin/CustomerTable';
import CustomerDetails from '../../components/admin/CustomerDetails';
import { getCustomers, updateCustomerStatus, Customer } from '../../services/customerService';

const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const data = await getCustomers();
    setCustomers(data);
    setLoading(false);
  };

  const handleToggleStatus = async (id: string, status: 'Active' | 'Blocked') => {
    const confirmed = window.confirm(`Are you sure you want to change this customer status to ${status}?`);
    if (!confirmed) return;

    const success = await updateCustomerStatus(id, status);
    if (success) {
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(prev => prev ? { ...prev, status } : null);
      }
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: 'Total Members', value: '1,248', icon: Users, color: 'text-primary', bg: 'bg-red-50', change: '+12%' },
    { label: 'Active Users', value: '1,192', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50', change: '+8%' },
    { label: 'Blocked Accounts', value: '56', icon: UserX, color: 'text-gray-400', bg: 'bg-gray-100', change: '0%' },
    { label: 'Growth rate', value: '14.2%', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', change: '+2.1%' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Customer Database</h2>
          <p className="text-gray-500 font-medium">Oversee registered accounts and analyze purchasing behavior.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-gray-900 transition-all shadow-sm">
             <Download className="w-4 h-4" />
             Export CSV
           </button>
           <button className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-200">
             <UserPlus className="w-4 h-4" />
             Add Customer
           </button>
        </div>
      </div>

      {/* Stats Cluster */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-5 group hover:border-primary/20 transition-all">
              <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
                  <span className="text-[10px] font-bold text-green-600 flex items-center">
                    {stat.change} <ArrowUpRight className="w-2 h-2" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Toolbar */}
      <div className="flex flex-col lg:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name, email, or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-5 bg-white border border-gray-100 rounded-[1.5rem] text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full lg:w-56 pl-12 pr-10 py-5 bg-white border border-gray-100 rounded-[1.5rem] text-xs font-black uppercase tracking-widest appearance-none focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all shadow-sm cursor-pointer"
            >
              <option value="All">All Member Status</option>
              <option value="Active">Active Only</option>
              <option value="Blocked">Blocked Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Database Table */}
      <CustomerTable 
        customers={filteredCustomers}
        isLoading={loading}
        onView={setSelectedCustomer}
        onToggleStatus={handleToggleStatus}
      />

      {/* Side Profile View */}
      {selectedCustomer && (
        <CustomerDetails 
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onToggleStatus={handleToggleStatus}
        />
      )}

    </div>
  );
};

export default AdminCustomers;
