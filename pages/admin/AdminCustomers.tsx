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
  Download,
  Loader2,
  RefreshCw
} from 'lucide-react';
import CustomerTable from '../../components/admin/CustomerTable';
import CustomerDetails from '../../components/admin/CustomerDetails';
import { getCustomers, updateCustomerStatus, Customer } from '../../services/customerService';
import { useCurrency } from '../../hooks/useCurrency';

const AdminCustomers: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setMessage(null);
    const data = await getCustomers();
    setCustomers(data);
    if (data.length === 0) {
      setMessage({
        type: 'error',
        text: 'No customers found or admin permission is missing. Confirm your admin account is set correctly in profiles.'
      });
    }
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
      setMessage({ type: 'success', text: `Customer status updated to ${status}.` });
    } else {
      setMessage({ type: 'error', text: 'Failed to update customer status.' });
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalMembers = customers.length;
  const activeUsers = customers.filter((c) => c.status === 'Active').length;
  const blockedUsers = customers.filter((c) => c.status === 'Blocked').length;
  const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const growthRate = totalMembers > 0 ? (activeUsers / totalMembers) * 100 : 0;

  const stats = [
    { label: 'Total Members', value: totalMembers.toLocaleString(), icon: Users, color: 'text-primary', bg: 'bg-red-50', change: `${activeUsers} active` },
    { label: 'Active Users', value: activeUsers.toLocaleString(), icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50', change: `${growthRate.toFixed(1)}%` },
    { label: 'Blocked Accounts', value: blockedUsers.toLocaleString(), icon: UserX, color: 'text-gray-400', bg: 'bg-gray-100', change: `${blockedUsers > 0 ? 'Needs review' : 'Healthy'}` },
    { label: 'Total Revenue', value: formatCurrency(totalSpent), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', change: `${customers.reduce((sum, c) => sum + c.ordersCount, 0)} orders` },
  ];

  const handleExportCsv = async () => {
    if (filteredCustomers.length === 0) {
      setMessage({ type: 'error', text: 'No customer rows to export.' });
      return;
    }

    setExporting(true);
    try {
      const headers = [
        'id',
        'name',
        'email',
        'phone',
        'status',
        'orders_count',
        'total_spent',
        'joined_date',
        'last_order_date',
        'address'
      ];

      const escapeCsv = (value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const rows = filteredCustomers.map((customer) => ([
        customer.id,
        customer.name,
        customer.email,
        customer.phone,
        customer.status,
        customer.ordersCount,
        customer.totalSpent.toFixed(2),
        customer.joinedDate,
        customer.lastOrderDate,
        customer.address
      ].map(escapeCsv).join(',')));

      const content = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Customer CSV exported successfully.' });
    } catch (error) {
      console.error('CSV export failed', error);
      setMessage({ type: 'error', text: 'Failed to export CSV.' });
    } finally {
      setExporting(false);
    }
  };

  const handleAddCustomer = () => {
    const signupUrl = `${window.location.origin}/signup`;
    window.open(signupUrl, '_blank', 'noopener,noreferrer');
    setMessage({ type: 'success', text: 'Opened signup page in a new tab. New customers can register there.' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Customer Database</h2>
          <p className="text-gray-500 font-medium">Oversee registered accounts and analyze purchasing behavior.</p>
        </div>
        <div className="flex items-center gap-3">
           <button
             onClick={handleExportCsv}
             disabled={exporting}
             className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-gray-900 transition-all shadow-sm disabled:opacity-60"
           >
             <Download className="w-4 h-4" />
             {exporting ? 'Exporting...' : 'Export CSV'}
           </button>
           <button
             onClick={handleAddCustomer}
             className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-200"
           >
             <UserPlus className="w-4 h-4" />
             Add Customer
           </button>
           <button
             onClick={fetchCustomers}
             disabled={loading}
             className="flex items-center gap-2 px-5 py-4 bg-white border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-gray-900 transition-all shadow-sm disabled:opacity-60"
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
             Refresh
           </button>
        </div>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message.text}
        </div>
      )}

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
