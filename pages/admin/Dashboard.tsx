import React, { useEffect, useState } from 'react';
import { Package, ShoppingBag, Clock, TrendingUp, LineChart, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrency } from '../../hooks/useCurrency';
import { formatShortOrderId } from '../../utils/orderId';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  revenue: number;
}

interface RevenueRow {
  total_amount: number | string | null;
  created_at: string | null;
  status: string | null;
}

interface StatusGraphItem {
  label: string;
  count: number;
  colorClass: string;
}

const buildSparklinePath = (points: number[], width: number, height: number) => {
  if (!points.length) return '';
  if (points.length === 1) return `M 0 ${height / 2}`;

  const maxValue = Math.max(...points, 1);
  const minValue = Math.min(...points, 0);
  const range = Math.max(1, maxValue - minValue);
  const stepX = width / (points.length - 1);

  return points
    .map((value, index) => {
      const x = index * stepX;
      const normalized = (value - minValue) / range;
      const y = height - normalized * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
};

const SPARKLINE_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const AdminDashboardPage: React.FC = () => {
  const { formatCurrency, currencyCode, currencySymbol } = useCurrency();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [weeklyOrderTrend, setWeeklyOrderTrend] = useState<number[]>(new Array(7).fill(0));
  const [weeklyRevenueTrend, setWeeklyRevenueTrend] = useState<number[]>(new Array(7).fill(0));
  const [statusGraph, setStatusGraph] = useState<StatusGraphItem[]>([
    { label: 'Pending', count: 0, colorClass: 'bg-amber-500' },
    { label: 'Processing', count: 0, colorClass: 'bg-sky-500' },
    { label: 'Shipped', count: 0, colorClass: 'bg-violet-500' },
    { label: 'Delivered', count: 0, colorClass: 'bg-emerald-500' },
    { label: 'Cancelled', count: 0, colorClass: 'bg-rose-500' }
  ]);

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
      const revenuePromise = supabase.from('orders').select('total_amount,created_at,status');

      // 3. Fetch Recent Orders
      const recentOrdersPromise = supabase
        .from('orders')
        .select('id, created_at, total_amount, status, user:users(display_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      const [productsRes, ordersRes, pendingRes, revenueRes, recentRes] = await Promise.all([
        productsPromise,
        ordersPromise,
        pendingOrdersPromise,
        revenuePromise,
        recentOrdersPromise
      ]);

      const revenueRows = (revenueRes.data || []) as RevenueRow[];
      const totalRevenue = revenueRows.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);

      const now = new Date();
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);

      const sevenDayTrend = Array.from({ length: 7 }, () => 0);
      const sevenDayRevenueTrend = Array.from({ length: 7 }, () => 0);
      const statusCounts: Record<string, number> = {
        Pending: 0,
        Processing: 0,
        Shipped: 0,
        Delivered: 0,
        Cancelled: 0
      };
      revenueRows.forEach((order) => {
        const statusLabel = String(order.status || 'Pending');
        if (statusLabel in statusCounts) {
          statusCounts[statusLabel] += 1;
        }

        if (!order.created_at) return;
        const created = new Date(order.created_at);
        if (!Number.isFinite(created.getTime())) return;

        const createdDayStart = new Date(created);
        createdDayStart.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((dayStart.getTime() - createdDayStart.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays < 7) {
          const bucketIndex = 6 - diffDays;
          sevenDayTrend[bucketIndex] += 1;
          sevenDayRevenueTrend[bucketIndex] += Number(order.total_amount) || 0;
        }
      });
      setWeeklyOrderTrend(sevenDayTrend);
      setWeeklyRevenueTrend(sevenDayRevenueTrend);
      setStatusGraph([
        { label: 'Pending', count: statusCounts.Pending, colorClass: 'bg-amber-500' },
        { label: 'Processing', count: statusCounts.Processing, colorClass: 'bg-sky-500' },
        { label: 'Shipped', count: statusCounts.Shipped, colorClass: 'bg-violet-500' },
        { label: 'Delivered', count: statusCounts.Delivered, colorClass: 'bg-emerald-500' },
        { label: 'Cancelled', count: statusCounts.Cancelled, colorClass: 'bg-rose-500' }
      ]);

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

  const chartWidth = 320;
  const chartHeight = 72;
  const sparklinePath = buildSparklinePath(weeklyOrderTrend, chartWidth, chartHeight);
  const revenueSparklinePath = buildSparklinePath(weeklyRevenueTrend, chartWidth, chartHeight);
  const maxTrend = Math.max(...weeklyOrderTrend, 0);
  const totalWeeklyOrders = weeklyOrderTrend.reduce((sum, value) => sum + value, 0);
  const totalWeeklyRevenue = weeklyRevenueTrend.reduce((sum, value) => sum + value, 0);
  const maxStatusCount = Math.max(...statusGraph.map((item) => item.count), 1);
  const lastDayOrders = weeklyOrderTrend[weeklyOrderTrend.length - 1] || 0;
  const previousDayOrders = weeklyOrderTrend[weeklyOrderTrend.length - 2] || 0;
  const trendDelta = lastDayOrders - previousDayOrders;
  const trendDeltaLabel = trendDelta > 0 ? `+${trendDelta}` : `${trendDelta}`;

  const StatCard = ({ title, value, icon: Icon, color, trend, badgeText }: any) => (
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
        {badgeText ? (
          <span
            className={`font-black text-white uppercase tracking-wider leading-none ${String(badgeText).length > 2 ? 'text-[10px]' : 'text-xl'}`}
            title={`Currency: ${currencyCode}`}
          >
            {badgeText}
          </span>
        ) : (
          <Icon className="w-7 h-7 text-white" strokeWidth={2} />
        )}
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
          value={formatCurrency(stats.revenue)} 
          badgeText={currencySymbol || currencyCode}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
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
                        <p className="text-xs text-gray-400 font-mono">{formatShortOrderId(order.id)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-900">{formatCurrency(order.total_amount)}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-wide ${
                        order.status === 'Pending' ? 'text-amber-500' : 
                        order.status === 'Delivered' ? 'text-green-500' : 'text-blue-500'
                      }`}>{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No orders found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Graph Insights */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <LineChart className="w-5 h-5 text-primary" />
                <h4 className="font-black text-gray-900">7-Day Order Activity</h4>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                {totalWeeklyOrders} orders
              </span>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-2">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-20" role="img" aria-label="Weekly order trend graph">
                <defs>
                  <linearGradient id="ordersTrendStrokeLight" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                  <linearGradient id="ordersTrendFillLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(239,68,68,0.2)" />
                    <stop offset="100%" stopColor="rgba(239,68,68,0)" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map((line) => (
                  <line
                    key={`order-line-${line}`}
                    x1={0}
                    y1={chartHeight * line}
                    x2={chartWidth}
                    y2={chartHeight * line}
                    stroke="rgba(148,163,184,0.3)"
                    strokeDasharray="4 6"
                    strokeWidth="1"
                  />
                ))}
                {sparklinePath && (
                  <>
                    <path d={`${sparklinePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`} fill="url(#ordersTrendFillLight)" />
                    <path d={sparklinePath} fill="none" stroke="url(#ordersTrendStrokeLight)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                )}
              </svg>
              <div className="mt-2 grid grid-cols-7 gap-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                {SPARKLINE_LABELS.map((label, index) => (
                  <span key={`${label}-${index}`} className="text-center">{label}</span>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] font-bold">
              <span className="text-gray-500">Peak: {maxTrend} orders/day</span>
              <span className={trendDelta >= 0 ? 'text-green-600' : 'text-red-600'}>
                Today vs yesterday: {trendDeltaLabel}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h4 className="font-black text-gray-900">7-Day Revenue Graph</h4>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                {formatCurrency(totalWeeklyRevenue)}
              </span>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-2">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-20" role="img" aria-label="Weekly revenue trend graph">
                <defs>
                  <linearGradient id="revenueTrendStrokeLight" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient id="revenueTrendFillLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(14,165,233,0.22)" />
                    <stop offset="100%" stopColor="rgba(14,165,233,0)" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map((line) => (
                  <line
                    key={`revenue-line-${line}`}
                    x1={0}
                    y1={chartHeight * line}
                    x2={chartWidth}
                    y2={chartHeight * line}
                    stroke="rgba(148,163,184,0.3)"
                    strokeDasharray="4 6"
                    strokeWidth="1"
                  />
                ))}
                {revenueSparklinePath && (
                  <>
                    <path d={`${revenueSparklinePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`} fill="url(#revenueTrendFillLight)" />
                    <path d={revenueSparklinePath} fill="none" stroke="url(#revenueTrendStrokeLight)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                )}
              </svg>
              <div className="mt-2 grid grid-cols-7 gap-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                {SPARKLINE_LABELS.map((label, index) => (
                  <span key={`revenue-${label}-${index}`} className="text-center">{label}</span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Order Status Graph</span>
              </div>
              <div className="space-y-3">
                {statusGraph.map((statusItem) => {
                  const widthPercent = statusItem.count === 0 ? 0 : Math.max(8, (statusItem.count / maxStatusCount) * 100);
                  return (
                    <div key={statusItem.label}>
                      <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-gray-600">
                        <span>{statusItem.label}</span>
                        <span>{statusItem.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${statusItem.colorClass}`}
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboardPage;
