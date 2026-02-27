import React, { useEffect, useState } from 'react';
import { Package, Users, TrendingUp, ArrowUpRight, Zap, Loader2, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types';
import { useCurrency } from '../../hooks/useCurrency';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  flashSaleCount: number;
  activeCustomers: number;
  revenue: number;
}

// Mock Data for Wishlist Insights
const TOP_WISHLISTED = [
  { 
    id: 'w1', 
    name: 'Akrapovič Titanium Exhaust', 
    count: 142, 
    image: 'https://images.unsplash.com/photo-1565538361093-9c59573887c3?q=80&w=2940&auto=format&fit=crop' 
  },
  { 
    id: 'w2', 
    name: 'Brembo GT Braking System', 
    count: 98, 
    image: 'https://images.unsplash.com/photo-1626438061453-623e1987d603?q=80&w=2940&auto=format&fit=crop' 
  },
  { 
    id: 'w3', 
    name: 'Recaro Sportster CS', 
    count: 85, 
    image: 'https://images.unsplash.com/photo-1582239433989-13833215904d?q=80&w=2848&auto=format&fit=crop' 
  },
  { 
    id: 'w4', 
    name: 'KW V3 Coilover', 
    count: 74, 
    image: 'https://images.unsplash.com/photo-1614251412693-4a1f6494cb68?q=80&w=2940&auto=format&fit=crop' 
  },
  { 
    id: 'w5', 
    name: 'Garrett G-Series Turbo', 
    count: 61, 
    image: 'https://images.unsplash.com/photo-1606775089350-f1c5039535eb?q=80&w=2940&auto=format&fit=crop' 
  },
];

const StatCard = ({ title, value, change, icon: Icon, color, loading, badgeText }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            {badgeText ? (
              <span className={`font-black text-white leading-none ${String(badgeText).length > 2 ? 'text-[10px]' : 'text-lg'}`}>
                {badgeText}
              </span>
            ) : (
              <Icon className="w-6 h-6 text-white" />
            )}
        </div>
        <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
            {change}
            <ArrowUpRight className="w-3 h-3 ml-1" />
        </span>
    </div>
    <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
    <span className="text-2xl font-extrabold text-gray-900">
      {loading ? <div className="h-8 w-16 bg-gray-100 animate-pulse rounded" /> : value}
    </span>
  </div>
);

const DashboardOverview: React.FC = () => {
  const { formatCurrency, currencySymbol } = useCurrency();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    flashSaleCount: 0,
    activeCustomers: 0,
    revenue: 0
  });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Get Product Counts
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // 2. Get Flash Sale Counts
      const { count: flashCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_flash_sale', true);

      // 3. Get Revenue
      const { data: orderRows } = await supabase
        .from('orders')
        .select('total_amount');

      // 4. Get Recent Products
      const { data: recentData } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const totalRevenue = (orderRows || []).reduce(
        (sum: number, row: any) => sum + Number(row?.total_amount || 0),
        0
      );

      // Mock other stats for now as we don't have orders/users tables fully populated
      setStats({
        totalProducts: productCount || 0,
        totalOrders: 356, // Mock
        flashSaleCount: flashCount || 0,
        activeCustomers: 2892, // Mock
        revenue: totalRevenue
      });

      if (recentData) {
        setRecentProducts(recentData.map((row: any) => ({
            id: row.id,
            name: row.title,
            category: row.category || 'Uncategorized',
            price: row.discount_price || row.price,
            originalPrice: row.discount_price ? row.price : undefined,
            image: row.image_url || '',
            rating: row.rating,
            isFlashSale: row.is_flash_sale
        })));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
        <p className="text-gray-500">Here's what's happening with your store today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
            title="Total Products" 
            value={stats.totalProducts} 
            change="+4%" 
            icon={Package} 
            color="bg-primary"
            loading={loading}
        />
        <StatCard 
            title="Flash Sales Active" 
            value={stats.flashSaleCount} 
            change="Active" 
            icon={Zap} 
            color="bg-amber-500"
            loading={loading}
        />
        <StatCard 
            title="Total Revenue" 
            value={formatCurrency(stats.revenue)} 
            change="+12.5%" 
            badgeText={currencySymbol}
            color="bg-green-500"
            loading={false} 
        />
        <StatCard 
            title="Active Customers" 
            value={stats.activeCustomers} 
            change="+18%" 
            icon={Users} 
            color="bg-purple-500"
            loading={false}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2/3 width) - Recent Activity */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900">Recently Added Products</h3>
                    <button className="text-sm text-primary font-bold hover:underline">View All</button>
                </div>
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                        </div>
                    ) : recentProducts.length > 0 ? (
                        recentProducts.map((product) => (
                            <div key={product.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                                        <img src={product.image} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm line-clamp-1">{product.name}</p>
                                        <p className="text-xs text-gray-500">{product.category}</p>
                                    </div>
                                </div>
                                <span className="font-bold text-gray-900 text-sm">{formatCurrency(Number(product.price || 0))}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-4">No recent products.</p>
                    )}
                </div>
            </div>
        </div>

        {/* Right Column (1/3 width) - Insights Stack */}
        <div className="space-y-6">
            
            {/* Top Categories */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900">Top Categories</h3>
                    <TrendingUp className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-6">
                    {[
                        { name: 'Brakes & Suspension', val: 75, color: 'bg-primary' },
                        { name: 'Engine Components', val: 60, color: 'bg-blue-500' },
                        { name: 'Exhaust Systems', val: 45, color: 'bg-green-500' },
                        { name: 'Interior Accessories', val: 30, color: 'bg-yellow-500' }
                    ].map((cat, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-gray-700">{cat.name}</span>
                                <span className="font-bold text-gray-900">{cat.val}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className={`${cat.color} h-2 rounded-full`} style={{ width: `${cat.val}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Wishlist Insights - NEW */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900">Wishlisted Products</h3>
                    <div className="p-2 bg-red-50 rounded-full">
                        <Heart className="w-4 h-4 text-primary fill-current" />
                    </div>
                </div>
                <div className="space-y-4">
                    {TOP_WISHLISTED.map((item, index) => (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${index < 3 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {index + 1}
                                </span>
                                <div className="w-8 h-8 bg-gray-50 rounded-md overflow-hidden flex-shrink-0 border border-gray-100">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                                </div>
                                <p className="text-sm font-medium text-gray-700 truncate max-w-[140px]" title={item.name}>
                                    {item.name}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-gray-900">{item.count}</span>
                                <Heart className="w-3 h-3 text-gray-300" />
                            </div>
                        </div>
                    ))}
                </div>
                <button className="w-full mt-4 text-xs font-bold text-gray-500 hover:text-primary transition-colors py-2 border border-dashed border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300">
                    View Full Report
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
