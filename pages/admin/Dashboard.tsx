import React, { useEffect, useState } from 'react';
import { DollarSign, Package, ShoppingBag, Clock, TrendingUp, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  revenue: number;
}

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Counts
      const productsPromise = supabase.from('products').select('*', { count: 'exact', head: true });
      const ordersPromise = supabase.from('orders').select('*', { count: 'exact', head: true });
      const pendingOrdersPromise = supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
      
      // 2. Fetch Revenue (Sum total_amount)
      // Note: For large datasets, use an RPC or Edge Function. Client-side sum is okay for MVP.
      const revenuePromise = supabase.from('orders').select('total_amount');

      // 3. Fetch Recent Orders
      const recentOrdersPromise = supabase
        .from('orders')
        .select('id, created_at, total_amount, status, user:profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      const [productsRes, ordersRes, pendingRes, revenueRes, recentRes] = await Promise.all([
        productsPromise,
        ordersPromise,
        pendingOrdersPromise,
        revenuePromise,
        recentOrdersPromise
      ]);

      const totalRevenue = revenueRes.data?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;

      setStats({
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        pendingOrders: pendingRes.count || 0,
        revenue: totalRevenue
      });

      if (recentRes.data) {
        setRecentOrders(recentRes.data);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black text-gray-900 tracking-tight">
          {loading ? <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-lg"/> : value}
        </h3>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
            <span className="text-[10px] font-medium text-gray-400">vs last month</span>
          </div>
        )}
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-7 h-7 text-white" strokeWidth={2} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Dashboard</h2>
          <p className="text-gray-500 font-medium">Real-time overview of your store's performance.</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Last Updated</p>
          <p className="text-sm font-bold text-gray-900">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`$${stats.revenue.toLocaleString()}`} 
          icon={DollarSign} 
          color="bg-green-500" 
          trend={12.5}
        />
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders} 
          icon={ShoppingBag} 
          color="bg-primary" 
          trend={8.2}
        />
        <StatCard 
          title="Pending Orders" 
          value={stats.pendingOrders} 
          icon={Clock} 
          color="bg-amber-500" 
          trend={-2.4}
        />
        <StatCard 
          title="Total Products" 
          value={stats.totalProducts} 
          icon={Package} 
          color="bg-blue-500" 
          trend={4.1}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Recent Orders</h3>
            <button className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">View All</button>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse" />)}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-black text-xs">
                        {(order.user?.full_name || 'G').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{order.user?.full_name || 'Guest User'}</p>
                        <p className="text-xs text-gray-400 font-mono">#{order.id.slice(0,8)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-900">${order.total_amount.toLocaleString()}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-wide ${
                        order.status === 'Pending' ? 'text-amber-500' : 
                        order.status === 'Delivered' ? 'text-green-500' : 'text-blue-500'
                      }`}>{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No orders found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Insights */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Activity className="w-5 h-5 text-green-400" />
                </div>
                <h4 className="font-bold text-lg">System Health</h4>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Database Status</span>
                  <span className="flex items-center gap-2 font-bold text-green-400">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    Operational
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Storage Usage</span>
                  <span className="font-bold">45%</span>
                </div>
                <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full w-[45%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
             <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h4 className="font-black text-gray-900">Trending Product</h4>
             </div>
             <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex-shrink-0"></div>
                <div>
                   <p className="text-xs font-bold text-gray-900 line-clamp-1">Brembo GT Braking Kit</p>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">12 Sales today</p>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboardPage;