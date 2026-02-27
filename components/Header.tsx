
import React, { useEffect, useState } from 'react';
import { Search, ShoppingCart, Heart, User as UserIcon, CircleHelp, Menu, X, ChevronRight, LogOut } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import { getPublicSiteConfig } from '../services/siteConfigService';

interface HeaderProps {
  onLoginClick?: () => void;
  cartItemCount?: number;
  onCartClick?: () => void;
  onHelpClick?: () => void;
  onWishlistClick?: () => void;
  wishlistCount?: number;
  user?: User | null;
}

const Header: React.FC<HeaderProps> = ({ 
  onLoginClick, 
  cartItemCount = 0, 
  onCartClick, 
  onHelpClick,
  onWishlistClick,
  wishlistCount = 0,
  user: propUser // Rename to avoid conflict, though we prioritize context
}) => {
  const { user, signOut } = useAuth();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [logoSrc, setLogoSrc] = useState('');
  const [siteName, setSiteName] = useState('NOKLITY');
  const fallbackLogo = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 50'%3E%3Cpath fill='%23DC2626' d='M15 5 L5 45 L30 45 L40 5 Z'/%3E%3Ctext x='50' y='38' font-family='sans-serif' font-weight='900' font-size='34' fill='%23111827' letter-spacing='-1'%3ENOKLITY%3C/text%3E%3C/svg%3E";

  const isLoggedIn = !!user;

  const handleLogout = async () => {
    try {
      await signOut();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadBranding = async () => {
      try {
        const cfg = await getPublicSiteConfig();
        if (!mounted) return;
        setLogoSrc(cfg.headerLogoLight || cfg.headerLogoDark || '');
        setSiteName(cfg.siteName || 'NOKLITY');
      } catch {
        if (!mounted) return;
        setLogoSrc('');
        setSiteName('NOKLITY');
      }
    };

    loadBranding();

    const handleConfigUpdated = () => {
      loadBranding();
    };
    window.addEventListener('site-config-updated', handleConfigUpdated as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener('site-config-updated', handleConfigUpdated as EventListener);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 h-[80px] font-sans transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full gap-4 lg:gap-8">
          
          {/* LEFT: Logo (Image Based) */}
          <a href="/" className="flex-shrink-0 flex items-center group relative z-50">
            <img 
              src={logoSrc || fallbackLogo} 
              alt={siteName} 
              className="h-[32px] md:h-[36px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            {/* Fallback Text */}
            <span className="hidden font-extrabold text-2xl tracking-tighter uppercase text-gray-900">
              {siteName}
            </span>
          </a>

          {/* CENTER: Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-3xl px-4 lg:px-12">
            <div className="relative w-full group">
              <input
                type="text"
                placeholder="Search for parts, brands, or models..."
                className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-full h-[46px] pl-6 pr-12 focus:bg-white focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all duration-300 placeholder-gray-400 text-[15px] shadow-sm group-hover:bg-white group-hover:shadow-md"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
              </div>
            </div>
          </div>

          {/* RIGHT: Icons */}
          <div className="flex items-center gap-6">
            
            {/* Desktop Navigation Icons */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <NavIcon 
                icon={Heart} 
                label="Wishlist" 
                badge={wishlistCount}
                onClick={onWishlistClick} 
              />
              <NavIcon 
                icon={ShoppingCart} 
                label="Cart" 
                badge={cartItemCount} 
                onClick={onCartClick}
              />
              <NavIcon icon={CircleHelp} label="Help" onClick={onHelpClick} />
              
              <NavIcon 
                icon={UserIcon} 
                label={isLoggedIn ? "Account" : "Login"} 
                onClick={onLoginClick} 
                active={isLoggedIn}
              />

              {isLoggedIn && (
                <NavIcon 
                  icon={LogOut} 
                  label="Logout" 
                  onClick={handleLogout}
                />
              )}
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-5 z-50">
              <button 
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                className="text-gray-600 hover:text-primary transition-colors active:scale-90"
              >
                {isMobileSearchOpen ? <X size={24} /> : <Search size={24} />}
              </button>
              
              <div className="relative cursor-pointer active:scale-90 transition-transform" onClick={onCartClick}>
                <ShoppingCart className="h-6 w-6 text-gray-600" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-white">
                    {cartItemCount}
                  </span>
                )}
              </div>

              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-600 hover:text-gray-900 active:scale-90 transition-transform"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="md:hidden absolute top-[80px] left-0 right-0 bg-white border-b border-gray-100 p-4 shadow-xl animate-in slide-in-from-top-2 z-40">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for products..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-base"
              autoFocus
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[80px] bg-white z-40 md:hidden animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <MobileNavItem 
                    label="Wishlist" 
                    icon={Heart} 
                    count={wishlistCount}
                    onClick={() => { onWishlistClick?.(); setIsMobileMenuOpen(false); }} 
                />
                
                {isLoggedIn ? (
                  <>
                    <MobileNavItem 
                        label="My Account"
                        icon={UserIcon} 
                        onClick={() => { onLoginClick?.(); setIsMobileMenuOpen(false); }} 
                    />
                    <MobileNavItem 
                        label="Logout"
                        icon={LogOut} 
                        onClick={handleLogout} 
                    />
                  </>
                ) : (
                  <MobileNavItem 
                      label="Login / Signup"
                      icon={UserIcon} 
                      onClick={() => { onLoginClick?.(); setIsMobileMenuOpen(false); }} 
                  />
                )}

                <MobileNavItem label="Help Center" icon={CircleHelp} onClick={() => { onHelpClick?.(); setIsMobileMenuOpen(false); }} />
                
                <div className="h-px bg-gray-100 my-4" />
                
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Categories</h3>
                <div className="grid grid-cols-2 gap-3">
                    {['Brakes', 'Engine', 'Exhaust', 'Electronics', 'Interior', 'Wheels'].map(cat => (
                        <div key={cat} className="bg-gray-50 p-3 rounded-lg text-sm font-medium text-gray-700 active:bg-gray-100">
                            {cat}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50">
                <button className="w-full bg-primary text-white font-bold py-3.5 rounded-xl">
                    View Special Offers
                </button>
            </div>
        </div>
      )}
    </header>
  );
};

// Helper Component for Header Icons
interface NavIconProps {
  icon: React.ElementType;
  label: string;
  badge?: number;
  onClick?: () => void;
  active?: boolean;
}

const NavIcon: React.FC<NavIconProps> = ({ icon: Icon, label, badge, onClick, active }) => (
  <button 
    onClick={onClick}
    className="group flex flex-col items-center justify-center gap-1 min-w-[3rem] cursor-pointer bg-transparent border-none p-0 outline-none"
  >
    <div className="relative p-0.5">
      <Icon className={`h-6 w-6 transition-colors duration-200 stroke-[1.5px] ${active ? 'text-gray-900 fill-gray-100' : 'text-gray-600 group-hover:text-primary'}`} />
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-white group-hover:scale-110 transition-transform shadow-sm">
          {badge}
        </span>
      )}
    </div>
    <span className={`text-[11px] font-medium transition-colors duration-200 tracking-wide ${active ? 'text-gray-900 font-bold' : 'text-gray-500 group-hover:text-primary'}`}>
      {label}
    </span>
  </button>
);

const MobileNavItem = ({ label, icon: Icon, count, onClick }: any) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl active:scale-[0.98] transition-transform"
    >
        <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-gray-700" />
            <span className="font-bold text-gray-900">{label}</span>
            {count !== undefined && count > 0 && (
                <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {count}
                </span>
            )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
    </button>
)

export default Header;
