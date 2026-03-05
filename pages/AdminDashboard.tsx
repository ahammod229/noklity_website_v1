
import React, { useEffect, useRef, useState } from 'react';
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
  Languages,
  Star,
  CreditCard,
  Database,
  Search,
  Bell,
  Sun,
  Moon,
  Wallet,
  Image,
  Images,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ToastType } from '../components/Toast';
import { useTheme } from '../contexts/ThemeContext';
import { getPublicSiteConfig, getPublicSiteConfigSnapshot } from '../services/siteConfigService';
import AdminDashboardPage from './admin/Dashboard';
import ProductsPage from './admin/Products';
import AdminOrders from './admin/Orders';
import CategoryManager from '../components/admin/CategoryManager';
import SupportManager from '../components/admin/SupportManager';
import AdminSettings from './admin/Settings';
import AdminLanguage from './admin/AdminLanguage';
import AdminCustomers from './admin/AdminCustomers';
import FlashSales from './admin/FlashSales';
import ProductReviews from './admin/ProductReviews';
import PaymentMethods from './admin/PaymentMethods';
import ApiManagement from './admin/ApiManagement';
import Finance from './admin/Finance';
import HeroBanners from './admin/HeroBanners';
import MediaControl from './admin/MediaControl';
import { useTenantConfig } from '../contexts/TenantConfigContext';
import { useAuth } from '../contexts/AuthContext';
import { FeatureKey } from '../types/tenant';

interface AdminDashboardProps {
  onLogout: () => void;
  showToast: (message: string, type?: ToastType) => void;
  onNavigate?: (view: any, param?: any) => void;
}

type View =
  | 'overview'
  | 'finance'
  | 'products'
  | 'orders'
  | 'categories'
  | 'hero'
  | 'media'
  | 'flash'
  | 'reviews'
  | 'support'
  | 'settings'
  | 'language'
  | 'customers'
  | 'payments'
  | 'api';

interface AdminNotificationItem {
  id: string;
  title: string;
  description: string;
  targetView: View;
  createdAt: string;
  level: 'high' | 'medium' | 'low';
}

interface OrderAlertRow {
  id: string;
  status: string | null;
  payment_status: string | null;
  created_at: string | null;
}

interface SupportAlertRow {
  id: string;
  status: string | null;
  subject: string | null;
  priority: string | null;
  created_at: string | null;
}

interface ReviewAlertRow {
  id: string;
  status: string | null;
  created_at: string | null;
}

interface ProductLowStockRow {
  id: string;
  title: string | null;
  stock: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface NewCustomerRow {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, showToast, onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, profile } = useAuth();
  const { canUseFeature, config: tenantConfig } = useTenantConfig();
  const [activeView, setActiveView] = useState<View>('overview');
  const initialConfig = getPublicSiteConfigSnapshot();
  const initialLogo = theme === 'dark'
    ? (initialConfig.headerLogoDark || initialConfig.headerLogoLight || '')
    : (initialConfig.headerLogoLight || initialConfig.headerLogoDark || '');
  const [brandLogoSrc, setBrandLogoSrc] = useState(initialLogo);
  const [brandSiteName, setBrandSiteName] = useState(initialConfig.siteName || tenantConfig.brandName || 'Storefront');
  const [brandLogoLoadFailed, setBrandLogoLoadFailed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotificationItem[]>([]);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const fallbackLogo = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 52'%3E%3Cpath fill='%23DC2626' d='M15 5 L5 47 L30 47 L40 5 Z'/%3E%3Ctext x='52' y='39' font-family='sans-serif' font-weight='900' font-size='32' fill='${theme === 'dark' ? '%23F8FAFC' : '%23111827'}' letter-spacing='-1'%3E${encodeURIComponent(tenantConfig.brandName || 'Storefront')}%3C/text%3E%3C/svg%3E`;
  const activeBrandLogoSrc = !brandLogoLoadFailed && brandLogoSrc ? brandLogoSrc : fallbackLogo;
  const adminDisplayName = profile?.full_name || user?.user_metadata?.full_name || 'Admin User';
  const adminEmail = user?.email || profile?.email || tenantConfig.supportEmail || 'admin@example.com';
  const adminInitial = (adminDisplayName || 'A').charAt(0).toUpperCase();
  const VIEW_FEATURE_REQUIREMENTS: Partial<Record<View, FeatureKey>> = {
    finance: 'advanced_analytics',
    hero: 'hero_banners',
    media: 'media_control',
    flash: 'flash_sales',
    reviews: 'product_reviews',
    customers: 'customer_management',
    support: 'support_tickets',
    api: 'api_management'
  };
  const canAccessView = (view: View) => {
    if (view === 'payments') {
      return canUseFeature('payment_bkash') || canUseFeature('payment_nogad') || canUseFeature('payment_bank_transfer');
    }
    const required = VIEW_FEATURE_REQUIREMENTS[view];
    return required ? canUseFeature(required) : true;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const formatRelativeTime = (isoValue: string) => {
    if (!isoValue) return 'just now';
    const created = new Date(isoValue).getTime();
    if (!Number.isFinite(created)) return 'just now';
    const diffMs = Date.now() - created;
    const diffMin = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const normalizeValue = (value: string | null | undefined) => (value || '').toLowerCase().trim();

  const fetchAdminNotifications = async () => {
    setLoadingNotifications(true);

    try {
      const safeSelect = async <T,>(
        label: string,
        query: PromiseLike<{ data: T[] | null; error: { message?: string } | null }>
      ): Promise<T[]> => {
        const { data, error } = await query;
        if (error) {
          console.warn(`Admin notification query failed (${label}):`, error.message || 'unknown error');
          return [];
        }
        return (data || []) as T[];
      };

      const oneDayAgoIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [orders, supports, reviews, lowStock, newCustomers] = await Promise.all([
        safeSelect<OrderAlertRow>(
          'orders',
          supabase
            .from('orders')
            .select('id,status,payment_status,created_at')
            .order('created_at', { ascending: false })
            .limit(50)
        ),
        safeSelect<SupportAlertRow>(
          'support_tickets',
          supabase
            .from('support_tickets')
            .select('id,status,subject,priority,created_at')
            .order('created_at', { ascending: false })
            .limit(30)
        ),
        safeSelect<ReviewAlertRow>(
          'product_reviews',
          supabase
            .from('product_reviews')
            .select('id,status,created_at')
            .order('created_at', { ascending: false })
            .limit(30)
        ),
        safeSelect<ProductLowStockRow>(
          'products',
          supabase
            .from('products')
            .select('id,title,stock,is_active,created_at,updated_at')
            .lte('stock', 5)
            .eq('is_active', true)
            .order('stock', { ascending: true })
            .limit(20)
        ),
        safeSelect<NewCustomerRow>(
          'profiles',
          supabase
            .from('profiles')
            .select('id,full_name,email,created_at')
            .gte('created_at', oneDayAgoIso)
            .order('created_at', { ascending: false })
            .limit(20)
        )
      ]);

      const alerts: AdminNotificationItem[] = [];
      const pendingOrders = orders.filter((item) => ['pending', 'processing'].includes(normalizeValue(item.status)));
      if (pendingOrders.length > 0) {
        alerts.push({
          id: 'pending-orders',
          title: `${pendingOrders.length} pending order(s)`,
          description: 'Orders need processing update.',
          targetView: 'orders',
          createdAt: pendingOrders[0].created_at || new Date().toISOString(),
          level: 'high'
        });
      }

      const pendingPayments = orders.filter((item) => normalizeValue(item.payment_status) === 'pending');
      if (pendingPayments.length > 0) {
        alerts.push({
          id: 'pending-payments',
          title: `${pendingPayments.length} payment verification pending`,
          description: 'Check transaction proofs and confirm payments.',
          targetView: 'payments',
          createdAt: pendingPayments[0].created_at || new Date().toISOString(),
          level: 'high'
        });
      }

      const openSupports = supports.filter((item) => ['pending', 'in progress'].includes(normalizeValue(item.status)));
      if (openSupports.length > 0) {
        alerts.push({
          id: 'support-open',
          title: `${openSupports.length} open support ticket(s)`,
          description: openSupports[0].subject ? `Latest: ${openSupports[0].subject}` : 'Support requests require response.',
          targetView: 'support',
          createdAt: openSupports[0].created_at || new Date().toISOString(),
          level: 'medium'
        });
      }

      const pendingReviews = reviews.filter((item) => normalizeValue(item.status) === 'pending');
      if (pendingReviews.length > 0) {
        alerts.push({
          id: 'pending-reviews',
          title: `${pendingReviews.length} review(s) awaiting moderation`,
          description: 'Approve or reject latest customer reviews.',
          targetView: 'reviews',
          createdAt: pendingReviews[0].created_at || new Date().toISOString(),
          level: 'medium'
        });
      }

      if (lowStock.length > 0) {
        alerts.push({
          id: 'low-stock',
          title: `${lowStock.length} low-stock product(s)`,
          description: `${lowStock[0].title || 'Product'} is running low. Refill inventory soon.`,
          targetView: 'products',
          createdAt: lowStock[0].updated_at || lowStock[0].created_at || new Date().toISOString(),
          level: 'low'
        });
      }

      if (newCustomers.length > 0) {
        alerts.push({
          id: 'new-customers',
          title: `${newCustomers.length} new customer(s) today`,
          description: `Latest: ${newCustomers[0].full_name || newCustomers[0].email || 'New customer signup'}`,
          targetView: 'customers',
          createdAt: newCustomers[0].created_at || new Date().toISOString(),
          level: 'low'
        });
      }

      alerts.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setAdminNotifications(alerts);
    } catch (error) {
      console.error('Failed to load admin notifications:', error);
      setAdminNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadBranding = async () => {
      try {
        const cfg = await getPublicSiteConfig();
        if (!mounted) return;
        const nextLogo = theme === 'dark'
          ? (cfg.headerLogoDark || cfg.headerLogoLight || '')
          : (cfg.headerLogoLight || cfg.headerLogoDark || '');
        setBrandLogoSrc(nextLogo);
        setBrandSiteName(cfg.siteName || tenantConfig.brandName || 'Storefront');
      } catch {
        if (!mounted) return;
        setBrandLogoSrc('');
        setBrandSiteName(tenantConfig.brandName || 'Storefront');
      }
    };

    loadBranding();
    fetchAdminNotifications();
    const intervalId = window.setInterval(fetchAdminNotifications, 45000);

    const handleConfigUpdated = () => {
      loadBranding();
    };
    window.addEventListener('site-config-updated', handleConfigUpdated as EventListener);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('site-config-updated', handleConfigUpdated as EventListener);
    };
  }, [theme]);

  useEffect(() => {
    setBrandLogoLoadFailed(false);
  }, [brandLogoSrc]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (!canAccessView(activeView)) {
      setActiveView('overview');
    }
  }, [activeView, tenantConfig.featureFlags]);

  const renderView = () => {
    if (!canAccessView(activeView)) {
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="text-lg font-black text-amber-900">Feature Not Available</h3>
          <p className="text-sm font-semibold text-amber-800 mt-1">
            This section is disabled in the current <span className="font-black">{tenantConfig.resolvedPlanName}</span> plan.
          </p>
        </div>
      );
    }

    switch(activeView) {
      case 'overview': return <AdminDashboardPage />;
      case 'products': return <ProductsPage showToast={showToast} />;
      case 'finance': return <Finance />;
      case 'orders': return <AdminOrders onNavigate={onNavigate} />;
      case 'categories': return <CategoryManager />;
      case 'hero': return <HeroBanners />;
      case 'media': return <MediaControl />;
      case 'support': return <SupportManager />;
      case 'settings': return <AdminSettings />;
      case 'language': return <AdminLanguage />;
      case 'customers': return <AdminCustomers />;
      case 'flash': return <FlashSales showToast={showToast} />;
      case 'reviews': return <ProductReviews />;
      case 'payments': return <PaymentMethods />;
      case 'api': return <ApiManagement />;
      default: return <AdminDashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-20">
        <a href="/" className="p-6 border-b border-gray-100 flex items-center gap-3 group">
          <img
            src={activeBrandLogoSrc}
            alt={brandSiteName}
            className="h-[34px] md:h-[38px] w-auto max-w-[210px] object-contain transition-transform duration-300 group-hover:scale-105"
            onError={() => {
              setBrandLogoLoadFailed(true);
            }}
          />
        </a>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
          <div className="pt-1 pb-1 pl-4 text-xs font-black text-gray-500 uppercase tracking-wider">Analytics</div>
          <NavItem 
            icon={LayoutDashboard} 
            label="Overview" 
            active={activeView === 'overview'} 
            onClick={() => setActiveView('overview')} 
          />
          <NavItem
            icon={Wallet}
            label="Finance"
            active={activeView === 'finance'}
            onClick={() => setActiveView('finance')}
            hidden={!canAccessView('finance')}
          />
          <div className="pt-4 pb-1 pl-4 text-xs font-black text-gray-500 uppercase tracking-wider">Store Management</div>
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
            icon={Image}
            label="Hero Banners"
            active={activeView === 'hero'}
            onClick={() => setActiveView('hero')}
            hidden={!canAccessView('hero')}
          />
          <NavItem
            icon={Images}
            label="Media Control"
            active={activeView === 'media'}
            onClick={() => setActiveView('media')}
            hidden={!canAccessView('media')}
          />
          <NavItem 
            icon={Zap} 
            label="Flash Sales" 
            active={activeView === 'flash'} 
            onClick={() => setActiveView('flash')} 
            hidden={!canAccessView('flash')}
          />
          <NavItem 
            icon={Star} 
            label="Reviews" 
            active={activeView === 'reviews'} 
            onClick={() => setActiveView('reviews')} 
            hidden={!canAccessView('reviews')}
          />
          <div className="pt-4 pb-1 pl-4 text-xs font-black text-gray-500 uppercase tracking-wider">Platform</div>
          <NavItem 
            icon={Users} 
            label="Customers" 
            active={activeView === 'customers'}
            onClick={() => setActiveView('customers')} 
            hidden={!canAccessView('customers')}
          />
          <NavItem 
            icon={LifeBuoy} 
            label="Support" 
            active={activeView === 'support'} 
            onClick={() => setActiveView('support')} 
            hidden={!canAccessView('support')}
          />
          <NavItem 
            icon={Languages} 
            label="Translations" 
            active={activeView === 'language'} 
            onClick={() => setActiveView('language')} 
          />
          <NavItem 
            icon={Settings} 
            label="Settings" 
            active={activeView === 'settings'} 
            onClick={() => setActiveView('settings')} 
          />
          <NavItem 
            icon={CreditCard} 
            label="Payment Methods" 
            active={activeView === 'payments'} 
            onClick={() => setActiveView('payments')} 
            hidden={!canAccessView('payments')}
          />
          <NavItem 
            icon={Database} 
            label="API Management" 
            active={activeView === 'api'} 
            onClick={() => setActiveView('api')} 
            hidden={!canAccessView('api')}
          />
        </nav>

        <div className="p-4 border-t border-gray-100">
            <div className="mb-4 flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
                    {adminInitial}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">{adminDisplayName}</span>
                    <span className="text-[10px] text-gray-500">{adminEmail}</span>
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
      <main className="min-h-screen ml-64 w-[calc(100%-16rem)] p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        {/* Top Bar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-8 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between shadow-sm">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Admin</p>
            <h1 className="text-2xl font-black text-gray-900 capitalize">{activeView.replace('-', ' ')}</h1>
            {!tenantConfig.licenseValid && (
              <p className="mt-1 text-xs font-black text-amber-700">
                License invalid or inactive. Running in Basic fallback mode.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-full lg:w-72 min-w-0">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold min-w-0"
              />
            </div>
            <button
              onClick={toggleTheme}
              className="w-11 h-11 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 flex items-center justify-center"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  const next = !notificationsOpen;
                  setNotificationsOpen(next);
                  if (next) fetchAdminNotifications();
                }}
                className="relative w-11 h-11 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 flex items-center justify-center"
              >
                <Bell className="w-4 h-4" />
                {adminNotifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-black leading-[18px] text-center">
                    {adminNotifications.length > 9 ? '9+' : adminNotifications.length}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-[360px] rounded-2xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-400 font-black">Notifications</p>
                      <p className="text-sm font-black text-gray-900">Admin Alerts</p>
                    </div>
                    <button
                      onClick={fetchAdminNotifications}
                      className="h-8 px-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 inline-flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingNotifications ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>
                  <div className="max-h-[340px] overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="px-4 py-10 flex justify-center">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      </div>
                    ) : adminNotifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm font-bold text-gray-700">All caught up</p>
                        <p className="text-xs text-gray-500 mt-1">No pending admin alerts right now.</p>
                      </div>
                    ) : (
                      adminNotifications.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveView(item.targetView);
                            setNotificationsOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-1 w-2.5 h-2.5 rounded-full ${item.level === 'high' ? 'bg-red-500' : item.level === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900">{item.title}</p>
                              <p className="text-xs text-gray-600 mt-0.5">{item.description}</p>
                              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mt-1.5">
                                {formatRelativeTime(item.createdAt)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onLogout}
              className="text-sm font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 px-3 h-11 rounded-xl border border-gray-200 bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Store
            </button>
          </div>
        </div>

        {renderView()}
      </main>
    </div>
  );
};

// Helper Components
const NavItem = ({ icon: Icon, label, active, onClick, hidden }: { icon: any, label: string, active?: boolean, onClick: () => void, hidden?: boolean }) => (
  hidden ? null : (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg border transition-all duration-200 ${
        active 
        ? 'bg-primary/10 border-primary/25 text-primary font-black shadow-sm' 
        : 'border-transparent text-gray-700 font-semibold hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-gray-500'}`} />
    {label}
  </button>
));

export default AdminDashboard;
