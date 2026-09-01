
import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import CategoryBar from './components/CategoryBar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import CategorySidebar from './components/CategorySidebar';
import Toast, { ToastType } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import { Product } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider, useCart } from './contexts/CartContext';
import { WishlistProvider, useWishlist } from './contexts/WishlistContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import {
  clearPublicSiteConfigCache,
  getPublicSiteConfig,
  subscribeToPublicSiteConfigSignals
} from './services/siteConfigService';
import { TenantConfigProvider, useTenantConfig } from './contexts/TenantConfigContext';
import { clearTenantConfigCache, isHostAllowed } from './services/tenantConfigService';
import { applyAppearanceSettings } from './services/appearanceService';
import RouteSeo from './components/RouteSeo';
import { supabase } from './lib/supabase';
import { BREAKPOINTS, getViewportBand } from './constants/breakpoints';

const Home = lazy(() => import('./pages/Home'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Help = lazy(() => import('./pages/Help'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const Orders = lazy(() => import('./pages/Orders'));
const AccountOrders = lazy(() => import('./pages/account/Orders'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Search = lazy(() => import('./pages/Search'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentFailed = lazy(() => import('./pages/PaymentFailed'));
const Invoice = lazy(() => import('./pages/Invoice'));
const CartPage = lazy(() => import('./pages/Cart'));
const Profile = lazy(() => import('./pages/account/Profile'));
const Addresses = lazy(() => import('./pages/account/Addresses'));
const Notifications = lazy(() => import('./pages/account/Notifications'));
const Security = lazy(() => import('./pages/account/Security'));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetails'));
const ContentPage = lazy(() => import('./pages/ContentPage'));
const AuthModal = lazy(() => import('./components/AuthModal'));
const CartDrawer = lazy(() => import('./components/CartDrawer'));

const DEFAULT_FAVICON_PATH = '/favicon.svg';

const inferFaviconType = (href: string) => {
  const normalized = String(href || '').toLowerCase().split('?')[0].split('#')[0];
  if (normalized.endsWith('.svg')) return 'image/svg+xml';
  if (normalized.endsWith('.png')) return 'image/png';
  if (normalized.endsWith('.ico')) return 'image/x-icon';
  if (normalized.endsWith('.webp')) return 'image/webp';
  if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg')) return 'image/jpeg';
  return '';
};

const upsertHeadLink = (rel: string, href: string, type?: string) => {
  if (typeof document === 'undefined') return;

  let link = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }

  link.href = href;
  if (type) {
    link.type = type;
  } else {
    link.removeAttribute('type');
  }
};

const applyDocumentFavicon = (faviconUrl?: string) => {
  const nextHref = (faviconUrl || '').trim() || DEFAULT_FAVICON_PATH;
  const nextType = inferFaviconType(nextHref);

  upsertHeadLink('icon', nextHref, nextType);
  upsertHeadLink('shortcut icon', nextHref, nextType);
  upsertHeadLink('apple-touch-icon', nextHref);
};

const RouteLoadingFallback: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div className={`${compact ? 'min-h-[160px]' : 'min-h-[60vh]'} flex items-center justify-center bg-transparent`}>
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-9 h-9 text-gray-300 animate-spin" />
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">Loading</p>
    </div>
  </div>
);

// Inner App component to use Auth, Cart, and Wishlist Context
const AppContent: React.FC = () => {
  const { config: tenantConfig } = useTenantConfig();
  const { user, signOut, isAdmin: isUserAdmin, isLoading: isAuthLoading } = useAuth();
  const { 
    cart, 
    addToCart: contextAddToCart, 
    updateQuantity, 
    removeFromCart, 
    cartCount,
    isCartOpen,
    setIsCartOpen 
  } = useCart();
  const { wishlist, addToWishlist: contextAddToWishlist } = useWishlist();
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Routing Logic
  type AppView = 'home' | 'admin' | 'help' | 'cart' | 'checkout' | 'order-success' | 'orders' | 'order-details' | 'wishlist' | 'search' | 'login' | 'signup' | 'forgot-password' | 'account-orders' | 'profile' | 'addresses' | 'notifications' | 'security' | 'payment-success' | 'payment-failed' | 'invoice' | 'product-details' | 'content-page';

  const getInitialView = (): AppView => {
    const path = window.location.pathname;
    if (path === '/help') return 'help';
    if (path === '/noklity-panel-secure-8x9') return 'admin';
    if (path === '/cart') return 'cart';
    if (path === '/checkout') return 'checkout';
    if (path.startsWith('/order-success')) return 'order-success';
    if (path === '/payment-success' || path.startsWith('/payment-success/')) return 'payment-success';
    if (path === '/payment-failed' || path.startsWith('/payment-failed/')) return 'payment-failed';
    if (path === '/orders' || path === '/account-orders') return 'account-orders';
    if (path === '/wishlist') return 'wishlist';
    if (path === '/search') return 'search';
    if (path === '/login') return 'login';
    if (path === '/signup') return 'signup';
    if (path === '/forgot-password') return 'forgot-password';
    if (path === '/profile') return 'profile';
    if (path === '/addresses') return 'addresses';
    if (path === '/notifications') return 'notifications';
    if (path === '/security') return 'security';
    if (path.startsWith('/page/')) return 'content-page';
    if (path.startsWith('/product/')) return 'product-details';
    if (path.startsWith('/orders/')) {
        if (path.endsWith('/invoice')) return 'invoice';
        return 'order-details';
    }
    return 'home';
  };

  const getParams = () => {
    const path = window.location.pathname;
    const sanitizeProductId = (raw: string | undefined) => {
      if (!raw) return undefined;
      let decoded = raw;
      try {
        decoded = decodeURIComponent(raw);
      } catch {
        decoded = raw;
      }
      const cleaned = decoded
        .trim()
        .replace(/[?#].*$/, '')
        .split(/\s+/)[0];
      return cleaned || undefined;
    };

    if (path.startsWith('/product/')) return sanitizeProductId(path.split('/')[2]);
    if (path.startsWith('/orders/') && path.endsWith('/invoice')) return path.split('/')[2];
    if (path.startsWith('/orders/')) return path.split('/')[2];
    if (path.startsWith('/order-success/')) return path.split('/')[2];
    if (path.startsWith('/payment-success/')) return path.split('/')[2];
    if (path.startsWith('/payment-failed/')) return path.split('/')[2];
    if (path.startsWith('/page/')) return path.split('/')[2];
    return undefined;
  }

  const [currentView, setCurrentView] = useState<AppView>(getInitialView);
  const [currentParam, setCurrentParam] = useState<string | undefined>(getParams());
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.innerWidth < BREAKPOINTS.md);
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const isAllowedHost = useMemo(() => isHostAllowed(currentHost, tenantConfig), [currentHost, tenantConfig]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getInitialView());
      setCurrentParam(getParams());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < BREAKPOINTS.md;
      document.documentElement.dataset.viewport = getViewportBand(width);
      setIsMobileViewport(mobile);
      if (mobile && isCartOpen) {
        setIsCartOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCartOpen, setIsCartOpen]);

  useEffect(() => {
    let mounted = true;

    const applyBranding = async () => {
      try {
        const config = await getPublicSiteConfig();
        if (!mounted) return;
        applyAppearanceSettings({
          primaryColor: config.primaryColor,
          primaryHoverColor: config.primaryHoverColor,
          accentColor: config.accentColor,
          successColor: config.successColor,
          warningColor: config.warningColor,
          dangerColor: config.dangerColor,
          backgroundColorLight: config.backgroundColorLight,
          backgroundColorDark: config.backgroundColorDark,
          surfaceColorLight: config.surfaceColorLight,
          surfaceColorDark: config.surfaceColorDark,
          textColorLight: config.textColorLight,
          textColorDark: config.textColorDark,
          mutedTextColorLight: config.mutedTextColorLight,
          mutedTextColorDark: config.mutedTextColorDark,
          borderColorLight: config.borderColorLight,
          borderColorDark: config.borderColorDark,
          borderRadiusPx: config.borderRadiusPx
        });
        applyDocumentFavicon(config.faviconUrl);
      } catch {
        // Keep default browser title/icon on config failure.
      }
    };

    applyBranding();
    const handleUpdated = () => {
      applyBranding();
    };
    window.addEventListener('site-config-updated', handleUpdated as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener('site-config-updated', handleUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isActive = true;
    let lastKnownRevision = '';
    let isCheckingRevision = false;
    let pollInterval: number | null = null;
    let startTimer: number | null = null;
    let unsubscribeSignals = () => {};

    const refreshSharedConfig = () => {
      if (!isActive) return;
      clearPublicSiteConfigCache({ broadcast: false });
      clearTenantConfigCache();
    };

    const syncLatestConfigRevision = async (forceRefresh = false) => {
      if (!isActive || isCheckingRevision) return;
      isCheckingRevision = true;

      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('updated_at')
          .order('updated_at', { ascending: false })
          .limit(1);

        if (!isActive || error) return;

        const latestSettingsRow = (Array.isArray(data) ? data[0] : null) as { updated_at?: unknown } | null;
        const nextRevision = String(latestSettingsRow?.updated_at || '');
        if (forceRefresh) {
          if (nextRevision) {
            lastKnownRevision = nextRevision;
          }
          refreshSharedConfig();
          return;
        }

        if (!lastKnownRevision) {
          lastKnownRevision = nextRevision;
          return;
        }

        if (nextRevision && nextRevision !== lastKnownRevision) {
          lastKnownRevision = nextRevision;
          refreshSharedConfig();
        }
      } finally {
        isCheckingRevision = false;
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void syncLatestConfigRevision();
      }
    };

    startTimer = window.setTimeout(() => {
      if (!isActive) return;

      unsubscribeSignals = subscribeToPublicSiteConfigSignals(() => {
        void syncLatestConfigRevision(true);
      });

      document.addEventListener('visibilitychange', handleVisibilityChange);
      pollInterval = window.setInterval(() => {
        if (!document.hidden) {
          void syncLatestConfigRevision();
        }
      }, 60_000); // P4: Reduced poll frequency — realtime signals handle admin changes


      void syncLatestConfigRevision();
    }, 1200);

    return () => {
      isActive = false;
      unsubscribeSignals();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (startTimer !== null) {
        window.clearTimeout(startTimer);
      }
      if (pollInterval !== null) {
        window.clearInterval(pollInterval);
      }
    };
  }, []);

  const navigate = (view: AppView, param?: string) => {
    let path = '/';
    if (view !== 'home') {
        path = `/${view}`;
        if (view === 'admin') {
            path = '/noklity-panel-secure-8x9';
        }
        if (view === 'help' && param) {
            path = `/help#${param}`;
        }
        if (view === 'product-details' && param) {
            path = `/product/${param}`;
        }
        if ((view === 'order-details' || view === 'invoice') && param) {
            path = `/orders/${param}${view === 'invoice' ? '/invoice' : ''}`;
        }
        if (view === 'order-success' && param) {
            path = `/order-success/${param}`;
        }
        if (view === 'payment-success' && param) {
            path = `/payment-success/${param}`;
        }
        if (view === 'payment-failed' && param) {
            path = `/payment-failed/${param}`;
        }
        if (view === 'content-page') {
            path = `/page/${param || 'about'}`;
        }
    }

    const currentPath = window.location.pathname;
    if (currentPath === path && currentView === view && currentParam === param) {
      return;
    }
    
    window.history.pushState({}, '', path);
    setCurrentView(view);
    setCurrentParam(param);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Storefront State
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Notification State
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false,
  });

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  // Wrapper for adding to cart with toast
  const addToCart = async (product: Product, quantity?: number) => {
    try {
      await contextAddToCart(product, quantity);
      const shortName = (product.name || (product as any).title || 'Product').trim();
      const compact = shortName.length > 26 ? `${shortName.slice(0, 25)}...` : shortName;
      showToast(`${compact} added to cart`);
    } catch (error: any) {
      showToast(error?.message || 'Unable to add this product to cart.', 'error');
    }
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    try {
      await updateQuantity(productId, quantity);
    } catch (error: any) {
      showToast(error?.message || 'Unable to update quantity.', 'error');
    }
  };

  const handleUpdateQuantityByDelta = async (productId: string, delta: number) => {
    const currentItem = cart.find((item) => item.id === productId);
    if (!currentItem) return;
    const nextQuantity = Math.max(1, currentItem.quantity + delta);
    await handleUpdateQuantity(productId, nextQuantity);
  };

  const handleAuthClick = () => {
    if (user) {
      navigate('profile');
    } else {
      navigate('login');
    }
  };

  // B5: Listen for wishlist-requires-login event from ProductCard
  useEffect(() => {
    const handleRequireLogin = (e: Event) => {
      e.preventDefault();
      showToast('Please sign in to save items to your wishlist.', 'error');
      navigate('login');
    };
    window.addEventListener('noklity:require-login', handleRequireLogin);
    return () => window.removeEventListener('noklity:require-login', handleRequireLogin);
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
      showToast('Signed out successfully');
      navigate('home');
    }
  };

  const handleProductClick = (product: Product) => {
    navigate('product-details', product.id);
  };

  const handleSelectCategory = (category: string) => {
    setActiveCategory(category === activeCategory ? null : category || null);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHomeFromProductDetails = () => {
    setActiveCategory(null);
    navigate('home');
  };

  const handleCategoryFromProductDetails = (category: string) => {
    setActiveCategory(category || null);
    navigate('home');
  };

  const openCart = () => {
    if (isMobileViewport) {
      setIsCartOpen(false);
      navigate('cart');
      return;
    }
    setIsCartOpen(true);
  };

  // Render Logic
  const renderContent = () => {
    if (!isAllowedHost) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-xl w-full bg-white border border-red-200 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Host Not Allowed</h2>
            <p className="text-gray-600 font-medium">
              This deployment is not licensed for <span className="font-black">{currentHost || 'this host'}</span>.
            </p>
            <p className="text-sm text-gray-500 mt-3">
              Allowed hosts: {tenantConfig.allowedHosts.join(', ')}
            </p>
          </div>
        </div>
      );
    }

    if (currentView === 'admin') {
      return (
        <ProtectedRoute onNavigate={navigate} adminOnly>
          <AdminDashboard onLogout={handleLogout} showToast={showToast} onNavigate={navigate} />
        </ProtectedRoute>
      );
    }



    if (currentView === 'login') {
      return <Login onNavigate={navigate} onLoginSuccess={() => showToast('Successfully logged in!')} />;
    }

    if (currentView === 'signup') {
      return <Signup onNavigate={navigate} onSignupSuccess={() => showToast('Account created successfully!')} />;
    }

    if (currentView === 'forgot-password') {
      return <ForgotPassword onNavigate={navigate} />;
    }

    if (currentView === 'invoice') {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <Invoice orderId={currentParam} onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (currentView === 'product-details') {
        return (
            <ProductDetailsPage 
                productId={currentParam}
                onAddToCart={addToCart}
                onNavigate={navigate}
                onHomeClick={handleHomeFromProductDetails}
                onCategoryClick={handleCategoryFromProductDetails}
            />
        );
    }

    if (currentView === 'content-page') {
      return <ContentPage slug={currentParam} onNavigate={navigate} />;
    }

    // Protected Routes
    if (currentView === 'profile') {
        return (
          <ProtectedRoute onNavigate={navigate}>
            <Profile onLoginClick={handleLogout} cartItemCount={cartCount} onCartClick={openCart} onNavigate={navigate} />
          </ProtectedRoute>
        );
    }

    if (currentView === 'addresses') {
        return (
          <ProtectedRoute onNavigate={navigate}>
            <Addresses onLoginClick={handleLogout} cartItemCount={cartCount} onCartClick={openCart} onNavigate={navigate} />
          </ProtectedRoute>
        );
    }

    if (currentView === 'notifications') {
        return (
          <ProtectedRoute onNavigate={navigate}>
            <Notifications onLoginClick={handleLogout} cartItemCount={cartCount} onCartClick={openCart} onNavigate={navigate} />
          </ProtectedRoute>
        );
    }

    if (currentView === 'help') {
      if (!tenantConfig.featureFlags.support_tickets) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-lg w-full rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
              <h2 className="text-2xl font-black text-gray-900">Support Ticket Disabled</h2>
              <p className="text-sm font-semibold text-gray-600 mt-2">
                Support ticket module is not enabled for this plan.
              </p>
            </div>
          </div>
        );
      }
      return <Help onLoginClick={handleAuthClick} cartItemCount={cartCount} onCartClick={openCart} onNavigate={navigate} />;
    }

    if (currentView === 'wishlist') {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <Wishlist onLoginClick={handleLogout} cartItemCount={cartCount} onCartClick={openCart} onNavigate={navigate} onAddToCart={addToCart} />
        </ProtectedRoute>
      );
    }

    if (currentView === 'search') {
      return <Search onLoginClick={handleAuthClick} cartItemCount={cartCount} onCartClick={openCart} onNavigate={navigate} onAddToCart={addToCart} />;
    }

    if (currentView === 'cart') {
      return (
        <CartPage
          items={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={removeFromCart}
          onNavigate={navigate}
        />
      );
    }

    if (currentView === 'checkout') {
      return (
        <Checkout cartItems={cart} onLoginClick={handleAuthClick} cartItemCount={cartCount} onCartClick={openCart} onNavigate={navigate} />
      );
    }

    if (currentView === 'order-success' || currentView === 'payment-success') {
      return (
        <PaymentSuccess 
          onLoginClick={handleAuthClick} 
          cartItemCount={cartCount} 
          onCartClick={openCart} 
          onNavigate={navigate}
          orderId={currentParam}
        />
      );
    }

    if (currentView === 'payment-failed') {
      return <PaymentFailed onLoginClick={handleAuthClick} cartItemCount={cartCount} onCartClick={openCart} onNavigate={navigate} orderId={currentParam} />;
    }

    if (currentView === 'account-orders' || currentView === 'orders') {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <AccountOrders onLoginClick={handleLogout} cartItemCount={cartCount} onCartClick={openCart} onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (currentView === 'order-details') {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <OrderDetails orderId={currentParam} onLoginClick={handleLogout} cartItemCount={cartCount} onCartClick={openCart} onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (currentView === 'security') {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <Security
            onLoginClick={handleLogout}
            cartItemCount={cartCount}
            onCartClick={openCart}
            onNavigate={navigate}
          />
        </ProtectedRoute>
      );
    }

    return (
      <Home 
        onLoginClick={handleAuthClick}
        cartItemCount={cartCount}
        onCartClick={openCart}
        onProductClick={handleProductClick}
        onAddToCart={addToCart}
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        onHelpClick={(target) => navigate('help', target)}
        onWishlistClick={() => navigate('wishlist')}
      />
    );
  };

  const isImmersiveProductMobile = currentView === 'product-details' && isMobileViewport;
  const isHeaderHidden =
    ['admin', 'login', 'signup', 'forgot-password', 'invoice'].includes(currentView) ||
    isImmersiveProductMobile;
  const isFooterHidden =
    ['admin', 'login', 'signup', 'forgot-password'].includes(currentView) ||
    isImmersiveProductMobile;
  const isMobileBottomNavVisible =
    !isHeaderHidden &&
    !['checkout', 'order-success', 'payment-success', 'payment-failed', 'product-details'].includes(currentView);

  return (
    <ErrorBoundary>
      <RouteSeo view={currentView} param={currentParam} />
      {!isHeaderHidden && (
        <div className="print:hidden">
          <Header
            onLoginClick={handleAuthClick}
            cartItemCount={cartCount}
            onCartClick={openCart}
            onHelpClick={() =>
              tenantConfig.featureFlags.support_tickets
                ? navigate('help')
                : showToast('Support module is disabled for this plan.', 'error')
            }
            onNotificationsClick={() => navigate('notifications')}
            onWishlistClick={() => navigate('wishlist')}
            wishlistCount={wishlist.length}
            user={user}
            onSelectCategory={(cat) => {
              handleSelectCategory(cat || '');
              navigate('home');
            }}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
          {/* ── Category Bar — desktop only, below header ── */}
          <CategoryBar
            activeCategory={activeCategory}
            onSelectCategory={(cat) => {
              handleSelectCategory(cat || '');
              if (currentView !== 'home') navigate('home');
            }}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        </div>
      )}

      {/* ── Shared Category Sidebar (mobile + desktop All Categories) ── */}
      <CategorySidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectCategory={(cat, sub) => {
          const target = sub || cat || '';
          handleSelectCategory(target);
          if (currentView !== 'home') navigate('home');
        }}
      />
      
      <div className={isMobileBottomNavVisible ? 'pb-[84px] md:pb-0' : ''}>
        <Suspense fallback={<RouteLoadingFallback />}>
          {renderContent()}
        </Suspense>
      </div>
      
      {!isFooterHidden && <Footer />}

      {isMobileBottomNavVisible && (
        <div className="print:hidden">
          <MobileBottomNav
            currentView={currentView}
            isLoggedIn={Boolean(user)}
            cartItemCount={cartCount}
            wishlistCount={wishlist.length}
            onNavigate={(view) => navigate(view as any)}
            onCartClick={openCart}
          />
        </div>
      )}
      
      <Suspense fallback={null}>
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      </Suspense>

      <Suspense fallback={<RouteLoadingFallback compact />}>
        <CartDrawer 
          isOpen={isCartOpen && !isMobileViewport} 
          onClose={() => setIsCartOpen(false)}
          items={cart}
          onUpdateQuantity={handleUpdateQuantityByDelta}
          onRemoveItem={removeFromCart}
          onCheckout={() => navigate('checkout')}
        />
      </Suspense>

      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />

      {isUserAdmin && !['admin', 'product-details'].includes(currentView) && (
        <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50 max-w-[calc(100vw-1.5rem)]">
          <button 
            onClick={() => navigate('admin')}
            className="print:hidden bg-gray-900 text-white text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-2 rounded-full shadow-lg hover:bg-black transition-colors ring-2 ring-white animate-in slide-in-from-bottom-2 whitespace-nowrap"
          >
            Go to Admin Dashboard
          </button>
        </div>
      )}
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TenantConfigProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <AppContent />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </TenantConfigProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
