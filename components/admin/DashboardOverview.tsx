import React from 'react';
import { DollarSign, ShoppingBag, Package, Users, TrendingUp, ArrowUpRight } from 'lucide-react';

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
            {change}
            <ArrowUpRight className="w-3 h-3 ml-1" />
        </span>
    </div>
    <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
    <span className="text-2xl font-extrabold text-gray-900">{value}</span>
  </div>
);

const DashboardOverview: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
        <p className="text-gray-500">Here's what's happening with your store today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
            title="Total Revenue" 
            value="$48,250" 
            change="+12.5%" 
            icon={DollarSign} 
            color="bg-green-500"
        />
        <StatCard 
            title="Total Orders" 
            value="356" 
            change="+8.2%" 
            icon={ShoppingBag} 
            color="bg-blue-500"
        />
        <StatCard 
            title="Products Sold" 
            value="1,240" 
            change="+3.1%" 
            icon={Package} 
            color="bg-primary"
        />
        <StatCard 
            title="Active Customers" 
            value="2,892" 
            change="+18%" 
            icon={Users} 
            color="bg-purple-500"
        />
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900">Recent Sales</h3>
                <button className="text-sm text-primary font-bold hover:underline">View All</button>
            </div>
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">
                                #{1000 + i}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-sm">Brembo GT Kit</p>
                                <p className="text-xs text-gray-500">John Doe • 2 mins ago</p>
                            </div>
                        </div>
                        <span className="font-bold text-gray-900">$1,250.00</span>
                    </div>
                ))}
            </div>
        </div>

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
      </div>
    </div>
  );
};

export default DashboardOverview;
