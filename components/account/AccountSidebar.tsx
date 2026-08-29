import React from 'react';
import {
  ShoppingBag, 
  Heart, 
  User, 
  MapPin, 
  ShieldCheck, 
  LogOut, 
  LayoutDashboard,
  ChevronRight,
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface AccountSidebarProps {
  activeTab: string;
  onNavigate: (view: any) => void;
  onLogout: () => void;
}

const AccountSidebar: React.FC<AccountSidebarProps> = ({ activeTab, onNavigate, onLogout }) => {
  const { profile, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'account-orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ];
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Member';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || '';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
        <div className="p-6 bg-gray-50/50 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-black text-xl shadow-lg shadow-red-500/20 relative overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{initial || 'U'}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 leading-tight">{displayName}</p>
              <p className="text-xs text-gray-500">Premium Member</p>
            </div>
          </div>
        </div>

        <nav className="p-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 group ${
                      isActive 
                      ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary transition-colors'}`} />
                      <span className="text-sm font-bold">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-white/50" />}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Theme</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`inline-flex items-center justify-center gap-2 h-10 rounded-xl border text-xs font-black uppercase tracking-wider transition-colors ${
                  theme === 'light'
                    ? 'border-primary bg-red-50 text-primary'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`inline-flex items-center justify-center gap-2 h-10 rounded-xl border text-xs font-black uppercase tracking-wider transition-colors ${
                  theme === 'dark'
                    ? 'border-primary bg-red-50 text-primary'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-red-500 font-bold text-sm hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </nav>
      </aside>

      {/* Mobile Tab Navigation */}
      <div className="lg:hidden w-full overflow-x-auto no-scrollbar bg-white border-b border-gray-100 sticky top-[68px] z-30 flex gap-1.5 px-2 py-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap text-[10px] font-black uppercase tracking-wide transition-all ${
                isActive 
                  ? 'bg-primary text-white shadow-lg shadow-red-500/20' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-3 h-3" />
              {item.label}
            </button>
          );
        })}
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap text-[10px] font-black uppercase tracking-wide transition-all bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
          type="button"
        >
          <LogOut className="w-3 h-3" />
          Logout
        </button>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap text-[10px] font-black uppercase tracking-wide transition-all bg-gray-100 text-gray-500 hover:bg-gray-200"
          type="button"
        >
          {theme === 'dark' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>
    </div>
  );
};

export default AccountSidebar;
