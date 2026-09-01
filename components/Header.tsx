
import React, { useEffect, useRef, useState } from 'react';
import { Search, ShoppingCart, Heart, User as UserIcon, CircleHelp, X, LogOut, Bell, Menu } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTenantConfig } from '../contexts/TenantConfigContext';
import { getPublicSiteConfig, getPublicSiteConfigSnapshot } from '../services/siteConfigService';
import { getSearchSuggestions, SearchSuggestion } from '../services/searchService';
import { getUnreadCount, subscribeToNotifications } from '../services/notificationService';
import OptimizedImage from './ui/OptimizedImage';
import { BREAKPOINTS } from '../constants/breakpoints';
import CategorySidebar from './CategorySidebar';

interface HeaderProps {
  onLoginClick?: () => void;
  cartItemCount?: number;
  onCartClick?: () => void;
  onHelpClick?: () => void;
  onWishlistClick?: () => void;
  onNotificationsClick?: () => void;
  wishlistCount?: number;
  user?: User | null;
  onSelectCategory?: (category: string) => void;
  /** Called when mobile hamburger is tapped — lets parent open the shared sidebar */
  onOpenSidebar?: () => void;
}

const getQueryFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return (params.get('q') || '').trim();
};

const Header: React.FC<HeaderProps> = ({ 
  onLoginClick, 
  cartItemCount = 0, 
  onCartClick, 
  onHelpClick,
  onWishlistClick,
  onNotificationsClick,
  wishlistCount = 0,
  user: _propUser,
  onSelectCategory,
  onOpenSidebar,
}) => {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const { config: tenantConfig } = useTenantConfig();
  const [desktopSearchQuery, setDesktopSearchQuery] = useState(() => getQueryFromUrl());
  const [mobileSearchQuery, setMobileSearchQuery] = useState(() => getQueryFromUrl());
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isDesktopSearchFocused, setIsDesktopSearchFocused] = useState(false);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);
  const desktopSearchWrapperRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchWrapperRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);

  // ── Sidebar state (for mobile) ──
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initialConfig = getPublicSiteConfigSnapshot();
  const initialLogo = theme === 'dark'
    ? (initialConfig.headerLogoDark || initialConfig.headerLogoLight || '')
    : (initialConfig.headerLogoLight || initialConfig.headerLogoDark || '');
  const [logoSrc, setLogoSrc] = useState(initialLogo);
  const [siteName, setSiteName] = useState(initialConfig.siteName || tenantConfig.brandName || 'Storefront');
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const hasUploadedLogo = Boolean(logoSrc && !logoLoadFailed);

  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      getUnreadCount(user.uid).then(setUnreadNotificationCount);
      const unsubscribe = subscribeToNotifications(user.uid, (newNotif) => {
        if (!newNotif.is_read) {
          setUnreadNotificationCount(prev => prev + 1);
        }
      });
      return () => unsubscribe();
    } else {
      setUnreadNotificationCount(0);
    }
  }, [user?.uid]);

  const isLoggedIn = !!user;
  const handleLogout = async () => {
    try {
      await signOut();
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const closeMobileOverlays = () => {
    setIsMobileSearchFocused(false);
  };

  const submitSearch = (query: string, fromMobile = false) => {
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
    if (fromMobile) {
      setIsMobileSearchFocused(false);
    } else {
      setIsDesktopSearchFocused(false);
    }
  };

  const openSuggestion = (id: string) => {
    window.location.href = `/product/${id}`;
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
        setLogoSrc(nextLogo);
        setSiteName(cfg.siteName || tenantConfig.brandName || 'Storefront');
      } catch {
        if (!mounted) return;
        setLogoSrc('');
        setSiteName(tenantConfig.brandName || 'Storefront');
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
  }, [theme, tenantConfig.brandName]);

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [logoSrc]);

  useEffect(() => {
    const syncQueryFromUrl = () => {
      const next = getQueryFromUrl();
      setDesktopSearchQuery(next);
      setMobileSearchQuery(next);
    };
    window.addEventListener('popstate', syncQueryFromUrl);
    return () => window.removeEventListener('popstate', syncQueryFromUrl);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= BREAKPOINTS.md) {
        closeMobileOverlays();
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        desktopSearchWrapperRef.current?.contains(target) ||
        mobileSearchWrapperRef.current?.contains(target)
      ) {
        return;
      }
      setIsDesktopSearchFocused(false);
      setIsMobileSearchFocused(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeQuery = isMobileSearchFocused
    ? mobileSearchQuery.trim()
    : isDesktopSearchFocused
      ? desktopSearchQuery.trim()
      : '';
  useEffect(() => {
    if (!activeQuery) {
      setSearchSuggestions([]);
      setIsSuggestionsLoading(false);
      return;
    }

    let cancelled = false;
    setIsSuggestionsLoading(true);
    const timer = window.setTimeout(async () => {
      const next = await getSearchSuggestions(activeQuery, 6);
      if (cancelled) return;
      setSearchSuggestions(next);
      setIsSuggestionsLoading(false);
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeQuery]);

  return (
    <>
      {/* ── Category Sidebar ── */}
      <CategorySidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectCategory={(cat, sub) => {
          const target = sub || cat;
          if (target) {
            onSelectCategory?.(target);
          } else {
            onSelectCategory?.('');
          }
          setSidebarOpen(false);
        }}
      />

      {/* ── Main Header ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 font-sans transition-all duration-300">
        {/* Top bar: Logo + Search + Icons */}
        <div className="h-[68px] sm:h-[72px] md:h-[80px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
            <div className="flex justify-between items-center h-full gap-4 lg:gap-5">

              {/* ── Hamburger + Logo ── */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Hamburger button — mobile only — opens sidebar/category browser */}
                <button
                  onClick={() => { onOpenSidebar?.(); setSidebarOpen(true); }}
                  className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 hover:text-primary flex-shrink-0"
                  aria-label="Browse categories"
                  title="Browse all categories"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* Hamburger button — desktop only (in header bar) — HIDDEN, only shown in nav strip */}
                {/* Logo */}
                <a href="/" onClick={closeMobileOverlays} className="flex-shrink-0 min-w-0 flex items-center gap-3 group relative z-50">
                  {hasUploadedLogo ? (
                    <img
                      src={logoSrc}
                      alt={siteName}
                      width={244}
                      height={70}
                      className="w-auto object-contain transition-transform duration-300 group-hover:scale-105 h-[34px] sm:h-[34px] md:h-[48px] max-w-[150px] sm:max-w-[180px] md:max-w-[340px]"
                      onError={() => { setLogoLoadFailed(true); }}
                    />
                  ) : (
                    <span className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-gray-900 truncate">
                      {siteName}
                    </span>
                  )}
                </a>
              </div>

              {/* Mobile Inline Search */}
              <div ref={mobileSearchWrapperRef} className="md:hidden flex-1 min-w-0">
            <div className="relative">
              <input
                ref={mobileSearchInputRef}
                type="text"
                placeholder="Search products"
                value={mobileSearchQuery}
                onFocus={() => setIsMobileSearchFocused(true)}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    submitSearch(mobileSearchQuery, true);
                  }
                }}
                className="w-full h-12 bg-white border border-gray-300 rounded-full pl-4 pr-12 text-[14px] font-semibold text-gray-900 placeholder:text-[13px] placeholder:text-gray-400 shadow-sm focus:border-gray-400 focus:outline-none focus:ring-0"
              />
              <button
                type="button"
                onClick={() => submitSearch(mobileSearchQuery, true)}
                className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-gray-500 hover:text-primary transition-colors"
                aria-label="Submit search"
              >
                <Search className="h-6 w-6" />
              </button>

              {isMobileSearchFocused && activeQuery.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden z-50">
                  {isSuggestionsLoading ? (
                    <div className="px-4 py-3 text-xs font-bold text-gray-500">Searching products...</div>
                  ) : searchSuggestions.length > 0 ? (
                    searchSuggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          openSuggestion(item.id);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="w-9 h-9 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <OptimizedImage
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              width={40}
                              height={40}
                              responsiveWidths={[400, 800]}
                              sizes="36px"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide truncate">{item.category}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs font-bold text-gray-500">No matching products.</div>
                  )}
                </div>
              )}
            </div>
          </div>

              {/* Desktop Search Bar */}
              <div ref={desktopSearchWrapperRef} className="hidden md:flex flex-1 max-w-2xl mx-8 relative z-50">
            <div className="relative w-full group">
              <input
                type="text"
                placeholder="Search by keywords, part number, or brand..."
                value={desktopSearchQuery}
                onFocus={() => setIsDesktopSearchFocused(true)}
                onChange={(e) => setDesktopSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    submitSearch(desktopSearchQuery);
                  }
                }}
                className="w-full h-12 bg-gray-50 border-2 border-transparent group-hover:border-gray-200 focus:bg-white rounded-full pl-5 pr-12 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-0 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => submitSearch(desktopSearchQuery)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors"
                aria-label="Search products"
              >
                <Search className="h-5 w-5 group-hover:text-primary transition-colors" />
              </button>

              {isDesktopSearchFocused && activeQuery.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden z-50">
                  {isSuggestionsLoading ? (
                    <div className="px-4 py-3 text-xs font-bold text-gray-500">Searching products...</div>
                  ) : searchSuggestions.length > 0 ? (
                    searchSuggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          openSuggestion(item.id);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <OptimizedImage
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              width={40}
                              height={40}
                              responsiveWidths={[400, 800]}
                              sizes="40px"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">{item.category}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs font-bold text-gray-500">No matching products.</div>
                  )}
                </div>
              )}
            </div>
          </div>

              {/* RIGHT: Icons */}
              <div className="flex items-center gap-3 sm:gap-6">
                <div className="hidden md:flex items-center gap-6 lg:gap-5">
                  <NavIcon icon={Heart} label="Wishlist" badge={wishlistCount} onClick={onWishlistClick} />
                  <NavIcon icon={ShoppingCart} label="Cart" badge={cartItemCount} onClick={onCartClick} />
                  <NavIcon icon={CircleHelp} label="Help" onClick={onHelpClick} />
                  <NavIcon icon={UserIcon} label={isLoggedIn ? "Account" : "Login"} onClick={onLoginClick} active={isLoggedIn} />
                </div>
                <div className="hidden md:flex items-center z-50" />
              </div>

            </div>{/* end flex row */}
          </div>{/* end max-w */}
        </div>{/* end top bar height */}

      </header>
    </>
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

export default Header;
