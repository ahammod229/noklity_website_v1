import React, { useEffect, useState } from 'react';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import ProductDetails from './components/ProductDetails';
import Toast, { ToastType } from './components/Toast';
import { supabase } from './lib/supabase';
import { Product, CartItem } from './types';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'admin'>('home');
  const [isAdmin, setIsAdmin] = useState(false);

  // Storefront State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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

  useEffect(() => {
    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Admin Rule: Any authenticated user is an admin for this phase
      setIsAdmin(!!session);
    });

    // Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAdmin(!!session);

      // Redirect to home if logged out while in admin view
      if (!session) {
        setCurrentView('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
    if (session) {
      if (window.confirm('You are currently logged in. Do you want to sign out?')) {
        supabase.auth.signOut().then(() => {
           showToast('Signed out successfully');
        });
      }
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleSelectCategory = (category: string) => {
    setActiveCategory(category === activeCategory ? null : category || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentView === 'admin' && isAdmin) {
    return <AdminDashboard onLogout={() => setCurrentView('home')} showToast={showToast} />;
  }

  return (
    <>
      <Home 
        onLoginClick={handleAuthClick}
        cartItemCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onProductClick={setSelectedProduct}
        onAddToCart={addToCart}
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
      />
      
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
      />

      <ProductDetails 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />

      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />

      {isAdmin && (
        <div className="fixed bottom-4 right-4 z-50">
          <button 
            onClick={() => setCurrentView(currentView === 'home' ? 'admin' : 'home')}
            className="bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg hover:bg-black transition-colors ring-2 ring-white animate-in slide-in-from-bottom-2"
          >
            {currentView === 'home' ? 'Go to Admin Dashboard' : 'Back to Store'}
          </button>
        </div>
      )}
    </>
  );
};

export default App;