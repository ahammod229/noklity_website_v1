
import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
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
import Profile from './pages/account/Profile';
import Addresses from './pages/account/Addresses';
import Notifications from './pages/account/Notifications';
import ProductDetailsPage from './pages/ProductDetails';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import Toast, { ToastType } from './components/Toast';
import AccountLayout from './components/account/AccountLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { Product } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider, useCart } from './contexts/CartContext';
import { WishlistProvider, useWishlist } from './contexts/WishlistContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// Inner App component to use Auth, Cart, and Wishlist Context
const AppContent: React.FC = () => {
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
  type AppView = 'home' | 'admin' | 'help' | 'checkout' | 'order-success' | 'orders' | 'order-details' | 'wishlist' | 'search' | 'login' | 'signup' | 'forgot-password' | 'account-orders' | 'profile' | 'addresses' | 'notifications' | 'security' | 'payment-success' | 'payment-failed' | 'invoice' | 'product-details';

  const getInitialView = (): AppView => {
    const path = window.location.pathname;
    if (path === '/help') return 'help';
    if (path === '/admin') return 'admin';
    if (path === '/checkout') return 'checkout';
    if (path.startsWith('/order-success')) return 'order-success';
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
    if (path.startsWith('/order-success/')) return path.split('/')[2];
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
        if (view === 'order-success' && param) {
            path = `/order-success/${param}`;
        }
    }
    
    window.history.pushState({}, '', path);
    setCurrentView(view);
    if (param) setCurrentParam(param);
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
    await contextAddToCart(product);
    showToast(`Added ${product.name} to cart`);
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

    // Protected Routes
    if (currentView === 'profile') {
        return (
          <ProtectedRoute onNavigate={navigate}>
            <Profile onLoginClick={handleLogout} cartItemCount={cartCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} />
          </ProtectedRoute>
        );
    }

    if (currentView === 'addresses') {
        return (
          <ProtectedRoute onNavigate={navigate}>
            <Addresses onLoginClick={handleLogout} cartItemCount={cartCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} />
          </ProtectedRoute>
        );
    }

    if (currentView === 'notifications') {
        return (
          <ProtectedRoute onNavigate={navigate}>
            <Notifications onLoginClick={handleLogout} cartItemCount={cartCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} />
          </ProtectedRoute>
        );
    }

    if (currentView === 'help') {
      return <Help onLoginClick={handleAuthClick} cartItemCount={cartCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} />;
    }

    if (currentView === 'wishlist') {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <Wishlist onLoginClick={handleLogout} cartItemCount={cartCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} onAddToCart={addToCart} />
        </ProtectedRoute>
      );
    }

    if (currentView === 'search') {
      return <Search onLoginClick={handleAuthClick} cartItemCount={cartCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} onAddToCart={addToCart} />;
    }

    if (currentView === 'checkout') {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <Checkout cartItems={cart} onLoginClick={handleAuthClick} cartItemCount={cartCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (currentView === 'order-success' || currentView === 'payment-success') {
      return (
        <PaymentSuccess 
          onLoginClick={handleAuthClick} 
          cartItemCount={cartCount} 
          onCartClick={() => setIsCartOpen(true)} 
          onNavigate={navigate}
          orderId={currentParam}
        />
      );
    }

    if (currentView === 'payment-failed') {
      return <PaymentFailed onLoginClick={handleAuthClick} cartItemCount={cartCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} />;
    }

    if (currentView === 'account-orders' || currentView === 'orders') {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <AccountOrders onLoginClick={handleLogout} cartItemCount={cartCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (currentView === 'order-details') {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <OrderDetails orderId={currentParam} onLoginClick={handleLogout} cartItemCount={cartCount} onCartClick={() => setIsCartOpen(true)} onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (['security'].includes(currentView)) {
        return (
          <ProtectedRoute onNavigate={navigate}>
            <AccountLayout activeTab={currentView} onNavigate={navigate} onCartClick={() => setIsCartOpen(true)} onLoginClick={handleLogout} cartItemCount={cartCount} title={currentView.charAt(0).toUpperCase() + currentView.slice(1)}>
                <div className="bg-white p-12 rounded-[3rem] text-center border border-gray-100">
                    <p className="text-gray-500 font-bold">This section is coming soon.</p>
                </div>
            </AccountLayout>
          </ProtectedRoute>
        )
    }

    return (
      <Home 
        onLoginClick={handleAuthClick}
        cartItemCount={cartCount}
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
          cartItemCount={cartCount}
          onCartClick={() => setIsCartOpen(true)}
          onHelpClick={() => navigate('help')}
          onWishlistClick={() => navigate('wishlist')}
          wishlistCount={wishlist.length}
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
        <CartProvider>
          <WishlistProvider>
            <AppContent />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
