
import React, { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import Help from './pages/Help';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders'; // Keep for generic route if needed, but overridden below
import AccountOrders from './pages/account/Orders'; // Updated import path
import OrderDetails from './pages/OrderDetails';
import Wishlist from './pages/Wishlist';
import Search from './pages/Search';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import Invoice from './pages/Invoice';
import CartPage from './pages/Cart';
import Profile from './pages/account/Profile';
import Addresses from './pages/account/Addresses';
import Notifications from './pages/account/Notifications';
import Security from './pages/account/Security';
import ProductDetailsPage from './pages/ProductDetails';
import ContentPage from './pages/ContentPage';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import Toast, { ToastType } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import { Product } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider, useCart } from './contexts/CartContext';
import { WishlistProvider, useWishlist } from './contexts/WishlistContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import { getPublicSiteConfig } from './services/siteConfigService';
import { TenantConfigProvider, useTenantConfig } from './contexts/TenantConfigContext';
import { isHostAllowed } from './services/tenantConfigService';
import { applyAppearanceSettings } from './services/appearanceService';

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
    if (path === '/admin') return 'admin';
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
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.innerWidth < 768);
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
      const mobile = window.innerWidth < 768;
      setIsMobileViewport(mobile);
      if (mobile && isCartOpen) {
        setIsCartOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCartOpen, setIsCartOpen]);

  useEffect(() => {
    let mounted = true;

    const applyBranding = async () => {
      try {
        const config = await getPublicSiteConfig();
        if (!mounted) return;
        if (config.siteName) {
          const urlPart = (config.siteUrlName || '').trim();
          document.title = urlPart ? `${config.siteName} | ${urlPart}` : config.siteName;
        }
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
        if (config.faviconUrl) {
          let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
          if (!favicon) {
            favicon = document.createElement('link');
            favicon.rel = 'icon';
            document.head.appendChild(favicon);
          }
          favicon.href = config.faviconUrl;
        }
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

  const navigate = (view: AppView, param?: string) => {
    let path = '/';
    if (view !== 'home') {
        path = `/${view}`;
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
  const addToCart = async (product: Product) => {
    try {
      await contextAddToCart(product);
      const shortName = (product.name || 'Product').trim();
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    // Show global loader while auth is initializing to prevent "flashing" or premature redirects
    if (isAuthLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="w-10 h-10 text-gray-300 animate-spin" />
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

  const isLayoutHidden = ['admin', 'login', 'signup', 'forgot-password', 'invoice'].includes(currentView);
  const isMobileBottomNavVisible =
    !isLayoutHidden &&
    !['checkout', 'order-success', 'payment-success', 'payment-failed'].includes(currentView);

  return (
    <ErrorBoundary>
      {!isLayoutHidden && (
        <Header
          onLoginClick={handleAuthClick}
          cartItemCount={cartCount}
          onCartClick={openCart}
          onHelpClick={() =>
            tenantConfig.featureFlags.support_tickets
              ? navigate('help')
              : showToast('Support module is disabled for this plan.', 'error')
          }
          onWishlistClick={() => navigate('wishlist')}
          wishlistCount={wishlist.length}
          user={user}
        />
      )}
      
      <div className={isMobileBottomNavVisible ? 'pb-[84px] md:pb-0' : ''}>
        {renderContent()}
      </div>
      
      {!isLayoutHidden && <Footer />}

      {isMobileBottomNavVisible && (
        <MobileBottomNav
          currentView={currentView}
          isLoggedIn={Boolean(user)}
          cartItemCount={cartCount}
          wishlistCount={wishlist.length}
          onNavigate={(view) => navigate(view as any)}
          onCartClick={openCart}
        />
      )}
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      <CartDrawer 
        isOpen={isCartOpen && !isMobileViewport} 
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantityByDelta}
        onRemoveItem={removeFromCart}
        onCheckout={() => navigate('checkout')}
      />

      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />

      {isUserAdmin && currentView !== 'admin' && (
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
