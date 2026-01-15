import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  Layers, 
  Zap, 
  LogOut, 
  ChevronLeft, 
  LifeBuoy, 
  Settings, 
  Languages 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ToastType } from '../components/Toast';
import DashboardOverview from '../components/admin/DashboardOverview';
import ProductManager from '../components/admin/ProductManager';
import AdminOrders from './admin/AdminOrders';
import CategoryManager from '../components/admin/CategoryManager';
import SupportManager from '../components/admin/SupportManager';
import AdminSettings from './admin/AdminSettings';
import AdminLanguage from './admin/AdminLanguage';
import AdminCustomers from './admin/AdminCustomers';

interface AdminDashboardProps {
  onLogout: () => void;
  showToast: (message: string, type?: ToastType) => void;
}

type View = 'overview' | 'products' | 'orders' | 'categories' | 'flash' | 'support' | 'settings' | 'language' | 'customers';

const AdminDashboard: React.FC<AdminDashboardProps & { onNavigate?: (view: any, param?: any) => void }> = ({ onLogout, showToast, onNavigate }) => {
  const [activeView, setActiveView] = useState<View>('overview');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const renderView = () => {
    switch(activeView) {
      case 'products': return <ProductManager showToast={showToast} />;
      case 'orders': return <AdminOrders onNavigate={onNavigate} />;
      case 'categories': return <CategoryManager />;
      case 'support': return <SupportManager />;
      case 'settings': return <AdminSettings />;
      case 'language': return <AdminLanguage />;
      case 'customers': return <AdminCustomers />;
      case 'flash': return (
        <div className="flex flex-col items-center justify-center h-96 text-gray-400">
            <Zap className="w-12 h-12 mb-4 text-gray-300" />
            <p className="font-medium">Flash Sale Manager Coming Soon</p>
        </div>
      );
      default: return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <div className="w-8 h-8 bg-primary flex items-center justify-center rounded-md">
                <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="font-extrabold text-xl text-gray-900">NOKLITY</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
          <NavItem 
            icon={LayoutDashboard} 
            label="Overview" 
            active={activeView === 'overview'} 
            onClick={() => setActiveView('overview')} 
          />
          <div className="pt-4 pb-1 pl-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Store Management</div>
          <NavItem 
            icon={Package} 
            label="Products" 
            active={activeView === 'products'} 
            onClick={() => setActiveView('products')} 
          />
          <NavItem 
            icon={ShoppingBag} 
            label="Orders" 
            active={activeView === 'orders'} 
            onClick={() => setActiveView('orders')} 
          />
          <NavItem 
            icon={Layers} 
            label="Categories" 
            active={activeView === 'categories'} 
            onClick={() => setActiveView('categories')} 
          />
          <NavItem 
            icon={Zap} 
            label="Flash Sales" 
            active={activeView === 'flash'} 
            onClick={() => setActiveView('flash')} 
          />
          <div className="pt-4 pb-1 pl-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Platform</div>
          <NavItem 
            icon={Users} 
            label="Customers" 
            active={activeView === 'customers'}
            onClick={() => setActiveView('customers')} 
          />
          <NavItem 
            icon={LifeBuoy} 
            label="Support" 
            active={activeView === 'support'} 
            onClick={() => setActiveView('support')} 
          />
          <NavItem 
            icon={Languages} 
            label="Translations" 
            active={activeView === 'language'} 
            onClick={() => setActiveView('language')} 
          />
          <NavItem 
            icon={Settings} 
            label="Website Settings" 
            active={activeView === 'settings'} 
            onClick={() => setActiveView('settings')} 
          />
        </nav>

        <div className="p-4 border-t border-gray-100">
            <div className="mb-4 flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
                    AD
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">Admin User</span>
                    <span className="text-[10px] text-gray-500">admin@noklity.com</span>
                </div>
            </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {/* Header Strip */}
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Admin</span>
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 font-medium capitalize">{activeView.replace('-', ' ')}</span>
            </div>
            <button 
                onClick={onLogout}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to Store
            </button>
        </div>

        {renderView()}
      </main>
    </div>
  );
};

// Helper Components
const NavItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
        active 
        ? 'bg-gray-900 text-white shadow-md' 
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-500'}`} />
    {label}
  </button>
);

export default AdminDashboard;
