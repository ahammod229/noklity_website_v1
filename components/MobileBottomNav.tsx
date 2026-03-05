import React from 'react';
import { Heart, Home, ShoppingCart, User } from 'lucide-react';

interface MobileBottomNavProps {
  currentView: string;
  isLoggedIn: boolean;
  cartItemCount: number;
  wishlistCount: number;
  onNavigate: (view: 'home' | 'wishlist' | 'profile' | 'login') => void;
  onCartClick: () => void;
}

const getIsActive = (currentView: string, keys: string[]) => keys.includes(currentView);

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  isLoggedIn,
  cartItemCount,
  wishlistCount,
  onNavigate,
  onCartClick
}) => {
  const navItems = [
    { key: 'home', label: 'Home', icon: Home, activeViews: ['home', 'search'] },
    { key: 'wishlist', label: 'Wishlist', icon: Heart, activeViews: ['wishlist'] },
    { key: 'cart', label: 'Cart', icon: ShoppingCart, activeViews: ['cart', 'checkout'] },
    {
      key: 'account',
      label: isLoggedIn ? 'Account' : 'Login',
      icon: User,
      activeViews: ['profile', 'addresses', 'notifications', 'security', 'account-orders', 'orders']
    }
  ] as const;

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-[65] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-2 mb-2 rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-md shadow-[0_18px_45px_rgba(2,6,23,0.22)]">
        <div className="h-16 grid grid-cols-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = getIsActive(currentView, item.activeViews);
            const onClick = () => {
              if (active && item.key !== 'cart') {
                return;
              }
              if (item.key === 'cart') {
                onCartClick();
                return;
              }
              if (item.key === 'account') {
                onNavigate(isLoggedIn ? 'profile' : 'login');
                return;
              }
              onNavigate(item.key as 'home' | 'wishlist' | 'profile' | 'login');
            };

            const count =
              item.key === 'cart' ? cartItemCount : item.key === 'wishlist' ? wishlistCount : 0;

            return (
              <button
                key={item.key}
                type="button"
                onClick={onClick}
                className="relative flex flex-col items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider"
              >
                <span className={`relative ${active ? 'text-primary' : 'text-gray-500'}`}>
                  <Icon className="w-5 h-5" />
                  {count > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-primary text-white text-[10px] leading-4 font-black">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </span>
                <span className={active ? 'text-primary' : 'text-gray-500'}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;
