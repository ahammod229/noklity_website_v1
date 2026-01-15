
import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import Help from './pages/Help';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import AccountOrders from './pages/AccountOrders';
import OrderDetails from './pages/OrderDetails';
import Wishlist from './pages/Wishlist';
import Search from './pages/Search';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import Invoice from './pages/Invoice';
import Profile from './pages/account/Profile';
import Addresses from './pages/account/Addresses';
import Notifications from './pages/account/Notifications';
import ProductDetailsPage from './pages/ProductDetails';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import Toast, { ToastType } from './components/Toast';
import AccountLayout from './components/account/AccountLayout';
import { Product, CartItem } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RequireAuth } from './components/RequireAuth';
import { Loader2 } from 'lucide-react';

// Inner App component to use Auth Context
const AppContent: React.FC = () => {
  const { user, signOut, isAdmin: isUserAdmin, isLoading: isAuthLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Routing Logic
  type AppView = 'home' | 'admin' | 'help' | 'checkout' | 'order-success' | 'orders' | 'order-details' | 'wishlist' | 'search' | 'login' | 'signup' | 'forgot-password' | 'account-orders' | 'profile' | 'addresses' | 'notifications' | 'security' | 'payment-success' | 'payment-failed' | 'invoice' | 'product-details';

  const getInitialView = (): AppView => {
    const path = window.location.pathname;
    if (path === '/help') return 'help';
    if (path === '/admin') return 'admin';
    if (path === '/checkout') return 'checkout';
    if (path === '/order-success') return 'order-success';
    if (path === '/payment-success') return 'payment-success';
    if (path === '/payment-failed') return 'payment-failed';
    if (path === '/orders' || path === '/account-orders') return 'account-orders';
    if (path === '/wishlist') return 'wishlist';
    if (path === '/search') return 'search';
    if (path === '/login') return 'login';
    if (path === '/signup') return 'signup';
    if (path === '/forgot-password') return 'forgot-password';
    if (path === '/profile') return 'profile';
    if (path === '/addresses') return 'addresses';
    if (path === '/notifications') return 'notifications';
    if (path.startsWith('/product/')) return 'product-details';
    if (path.startsWith('/orders/')) {
        if (path.endsWith('/invoice')) return 'invoice';
        return 'order-details';
    }
    return 'home';
  };

  const getParams = () => {
    const path = window.location.pathname;
    if (path.startsWith('/product/')) return path.split('/')[2];
    if (path.startsWith('/orders/') && path.endsWith('/invoice')) return path.split('/')[2];
    if (path.startsWith('/orders/')) return path.split('/')[2];
    return undefined;
  }

  const [currentView, setCurrentView] = useState<AppView>(getInitialView);
  const [currentParam, setCurrentParam] = useState<string | undefined>(getParams());

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getInitialView());
      setCurrentParam(getParams());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (view: AppView, param?: string) => {
    let path = '/';
    if (view !== 'home') {
        path = `/${view}`;
        if (view === 'product-details' && param) {
            path = `/product/${param}`;
        }
        if ((view === 'order-details' || view === 'invoice') && param) {
            path = `/orders/${param}${view === 'invoice' ? '/invoice' : ''}`;
        }
    }
    
    window.history.pushState({}, '', path);
    setCurrentView(view);
    if (param) setCurrentParam(param);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Storefront State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
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

  // Admin protection
  useEffect(() => {
    if (!isAuthLoading && currentView === 'admin' && !isUserAdmin) {
      navigate('home');
    }
  }, [currentView, isUserAdmin, isAuthLoading]);

  // Cart Logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
    showToast(`Added ${product.name} to cart`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
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

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Render Logic
  const renderContent = () => {
    // Show global loader while auth is initializing to prevent "flashing" or premature redirects
    if (isAuthLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="w-10 h-10 text-gray-300 animate-spin" />
        </div>
      );
    }

    if (currentView === 'admin') {
      // Admin guard is handled in useEffect, but we return null here to be safe during transition
      if (!isUserAdmin) return null;
      return <AdminDashboard onLogout={handleLogout} showToast={showToast} onNavigate={navigate} />;
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
        <RequireAuth onRedirect={() => navigate('login')}>
          <Invoice orderId={currentParam} onNavigate={navigate} />
        </RequireAuth>
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

    // Protected Routes
    if (currentView === 'profile') {
        return (
          <RequireAuth onRedirect={() => navigate('login')}>
            <Profile onLoginClick={handleLogout} cartItemCount={cartItemCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} />
          </RequireAuth>
        );
    }

    if (currentView === 'addresses') {
        return (
          <RequireAuth onRedirect={() => navigate('login')}>
            <Addresses onLoginClick={handleLogout} cartItemCount={cartItemCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} />
          </RequireAuth>
        );
    }

    if (currentView === 'notifications') {
        return (
          <RequireAuth onRedirect={() => navigate('login')}>
            <Notifications onLoginClick={handleLogout} cartItemCount={cartItemCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} />
          </RequireAuth>
        );
    }

    if (currentView === 'help') {
      return <Help onLoginClick={handleAuthClick} cartItemCount={cartItemCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} />;
    }

    if (currentView === 'wishlist') {
      return (
        <RequireAuth onRedirect={() => navigate('login')}>
          <Wishlist onLoginClick={handleLogout} cartItemCount={cartItemCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} onAddToCart={addToCart} />
        </RequireAuth>
      );
    }

    if (currentView === 'search') {
      return <Search onLoginClick={handleAuthClick} cartItemCount={cartItemCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} onAddToCart={addToCart} />;
    }

    if (currentView === 'checkout') {
      return (
        // Checkout generally requires auth, or at least guest checkout flow handling. 
        // For this demo, we'll protect it.
        <RequireAuth onRedirect={() => navigate('login')}>
          <Checkout cartItems={cart} onLoginClick={handleAuthClick} cartItemCount={cartItemCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} />
        </RequireAuth>
      );
    }

    if (currentView === 'order-success' || currentView === 'payment-success') {
      return <PaymentSuccess onLoginClick={handleAuthClick} cartItemCount={cartItemCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} />;
    }

    if (currentView === 'payment-failed') {
      return <PaymentFailed onLoginClick={handleAuthClick} cartItemCount={cartItemCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} />;
    }

    if (currentView === 'account-orders' || currentView === 'orders') {
      return (
        <RequireAuth onRedirect={() => navigate('login')}>
          <AccountOrders onLoginClick={handleLogout} cartItemCount={cartItemCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} />
        </RequireAuth>
      );
    }

    if (currentView === 'order-details') {
      return (
        <RequireAuth onRedirect={() => navigate('login')}>
          <OrderDetails orderId={currentParam} onLoginClick={handleLogout} cartItemCount={cartItemCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} />
        </RequireAuth>
      );
    }

    if (['security'].includes(currentView)) {
        return (
          <RequireAuth onRedirect={() => navigate('login')}>
            <AccountLayout activeTab={currentView} onNavigate={navigate} onCartClick={() => setIsCartOpen(true)} onLoginClick={handleLogout} cartItemCount={cartItemCount} title={currentView.charAt(0).toUpperCase() + currentView.slice(1)}>
                <div className="bg-white p-12 rounded-[3rem] text-center border border-gray-100">
                    <p className="text-gray-500 font-bold">This section is coming soon.</p>
                </div>
            </AccountLayout>
          </RequireAuth>
        )
    }

    return (
      <Home 
        onLoginClick={handleAuthClick}
        cartItemCount={cartItemCount}
        onCartClick={() => setIsCartOpen(true)}
        onProductClick={handleProductClick}
        onAddToCart={addToCart}
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        onHelpClick={() => navigate('help')}
        onWishlistClick={() => navigate('wishlist')}
      />
    );
  };

  const isLayoutHidden = ['admin', 'login', 'signup', 'forgot-password', 'invoice'].includes(currentView);

  return (
    <ErrorBoundary>
      {!isLayoutHidden && (
        <Header
          onLoginClick={handleAuthClick}
          cartItemCount={cartItemCount}
          onCartClick={() => setIsCartOpen(true)}
          onHelpClick={() => navigate('help')}
          onWishlistClick={() => navigate('wishlist')}
          user={user}
        />
      )}
      
      {renderContent()}
      
      {!isLayoutHidden && <Footer />}
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={updateQuantity}
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
        <div className="fixed bottom-4 right-4 z-50">
          <button 
            onClick={() => navigate('admin')}
            className="bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg hover:bg-black transition-colors ring-2 ring-white animate-in slide-in-from-bottom-2"
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
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
