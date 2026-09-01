
import React, { useEffect, useMemo, useState } from 'react';
import Hero from '../components/Hero';
import CategoryGrid from '../components/CategoryGrid';
import ProductCard from '../components/ProductCard';
import FlashSale from '../components/FlashSale';
import { SkeletonList } from '../components/SkeletonLoader';
import { Product } from '../types';
import { getProducts } from '../services/productService';
import { getPublicSiteConfig, getPublicSiteConfigSnapshot } from '../services/siteConfigService';
import { useTenantConfig } from '../contexts/TenantConfigContext';
import SeoHead from '../components/SeoHead';

interface HomeProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  activeCategory: string | null;
  onSelectCategory: (category: string) => void;
  onHelpClick?: (target?: string) => void;
  onWishlistClick: () => void;
}

const Home: React.FC<HomeProps> = ({ 
  onProductClick, 
  onAddToCart,
  activeCategory,
  onSelectCategory,
  onHelpClick,
}) => {
  const { canUseFeature, config: tenantConfig } = useTenantConfig();
  const initialConfig = getPublicSiteConfigSnapshot();
  const [isLoading, setIsLoading] = useState(true);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [productTab, setProductTab] = useState<'new' | 'best'>('new');
  const [supportEmail, setSupportEmail] = useState(initialConfig.supportEmail || tenantConfig.supportEmail || 'support@example.com');
  const [newsletterEnabled, setNewsletterEnabled] = useState(initialConfig.newsletterEnabled);
  const [newsletterBadgeText, setNewsletterBadgeText] = useState(initialConfig.newsletterBadgeText || 'Exclusive Club');
  const [newsletterTitle, setNewsletterTitle] = useState(
    initialConfig.newsletterTitle || `Join the ${tenantConfig.brandName || 'Store'} Club`
  );
  const [newsletterDescription, setNewsletterDescription] = useState(
    initialConfig.newsletterDescription || 'Get exclusive access to limited edition drops, installation guides, and 10% off your first order.'
  );
  const [newsletterInputPlaceholder, setNewsletterInputPlaceholder] = useState(
    initialConfig.newsletterInputPlaceholder || 'Enter your email'
  );
  const [newsletterButtonText, setNewsletterButtonText] = useState(initialConfig.newsletterButtonText || 'Join');
  const [newsletterBackgroundImageUrl, setNewsletterBackgroundImageUrl] = useState(initialConfig.newsletterBackgroundImageUrl || '');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterNotice, setNewsletterNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeCategory]);

  // Re-apply config when admin updates settings in real-time
  useEffect(() => {
    let mounted = true;

    const applyConfig = (cfg: ReturnType<typeof getPublicSiteConfigSnapshot>) => {
      if (!mounted) return;
      setSupportEmail(cfg.supportEmail || tenantConfig.supportEmail || 'support@example.com');
      setNewsletterEnabled(cfg.newsletterEnabled);
      setNewsletterBadgeText(cfg.newsletterBadgeText || 'Exclusive Club');
      setNewsletterTitle(cfg.newsletterTitle || `Join the ${tenantConfig.brandName || 'Store'} Club`);
      setNewsletterDescription(
        cfg.newsletterDescription || 'Get exclusive access to limited edition drops, installation guides, and 10% off your first order.'
      );
      setNewsletterInputPlaceholder(cfg.newsletterInputPlaceholder || 'Enter your email');
      setNewsletterButtonText(cfg.newsletterButtonText || 'Join');
      setNewsletterBackgroundImageUrl(cfg.newsletterBackgroundImageUrl || '');
    };

    const onUpdated = async () => {
      try {
        const cfg = await getPublicSiteConfig();
        applyConfig(cfg);
      } catch {
        // Keep current values on config update failure
      }
    };

    window.addEventListener('site-config-updated', onUpdated as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener('site-config-updated', onUpdated as EventListener);
    };
  }, []);


  const fetchData = async () => {
    setIsLoading(true);
    try {
      // P2: Fetch products and site config in parallel to avoid sequential round-trips
      const [productsResult, configResult] = await Promise.allSettled([
        getProducts(activeCategory),
        getPublicSiteConfig()
      ]);

      if (productsResult.status === 'fulfilled') {
        setDisplayedProducts(productsResult.value);
      } else {
        console.error('Failed to load products', productsResult.reason);
      }

      if (configResult.status === 'fulfilled') {
        const cfg = configResult.value;
        setSupportEmail(cfg.supportEmail || tenantConfig.supportEmail || 'support@example.com');
        setNewsletterEnabled(cfg.newsletterEnabled);
        setNewsletterBadgeText(cfg.newsletterBadgeText || 'Exclusive Club');
        setNewsletterTitle(cfg.newsletterTitle || `Join the ${tenantConfig.brandName || 'Store'} Club`);
        setNewsletterDescription(
          cfg.newsletterDescription || 'Get exclusive access to limited edition drops, installation guides, and 10% off your first order.'
        );
        setNewsletterInputPlaceholder(cfg.newsletterInputPlaceholder || 'Enter your email');
        setNewsletterButtonText(cfg.newsletterButtonText || 'Join');
        setNewsletterBackgroundImageUrl(cfg.newsletterBackgroundImageUrl || '');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewsletterSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const email = newsletterEmail.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail) {
      setNewsletterNotice('Please enter a valid email address.');
      return;
    }

    const subject = encodeURIComponent('Newsletter Subscription Request');
    const body = encodeURIComponent(`Please subscribe this email to the newsletter:\\n${email}`);
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
    setNewsletterNotice('Subscription request prepared in your email app.');
    setNewsletterEmail('');
  };

  const handleNavigateToSearch = () => {
    window.history.pushState({}, '', '/search');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const featuredProducts = useMemo(() => {
    const items = [...displayedProducts];
    if (productTab === 'best') {
      return items.sort((a, b) => {
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (a.name || '').localeCompare(b.name || '');
      });
    }

    return items.sort((a, b) => {
      const newDiff = Number(Boolean(b.isNew)) - Number(Boolean(a.isNew));
      if (newDiff !== 0) return newDiff;
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [displayedProducts, productTab]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SeoHead
        title="Noklity | Electronics, Tools, Tyres & Parts – Bangladesh"
        description="Shop imported electronics, tools, tyres and parts at Noklity. Browse categories, flash deals, and featured products across Bangladesh."
        path="/"
        keywords="Noklity, electronics Bangladesh, tyres Bangladesh, tools Bangladesh, imported parts, Bangladesh ecommerce"
      />
      <main className="flex-grow space-y-3 sm:space-y-4">
        {!activeCategory && (
          <Hero
            onProductClick={onProductClick}
            onSelectCategory={onSelectCategory}
          />
        )}
        
        <CategoryGrid 
          selectedCategory={activeCategory} 
          onSelectCategory={onSelectCategory} 
        />
        
        {/* Only show Flash Sale block on main home view */}
        {!activeCategory && canUseFeature('flash_sales') && (
          <FlashSale 
            onProductClick={onProductClick} 
            onAddToCart={onAddToCart}
            onShopAll={handleNavigateToSearch}
          />
        )}
        
        {/* Featured / Catalog Section */}
        <section id="products-section" className="py-8 sm:py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[620px] sm:min-h-[600px]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 mb-6 sm:mb-10">
            <div>
              <span className="text-primary font-bold uppercase tracking-widest text-xs mb-2 block">
                {activeCategory ? 'Browsing Category' : 'Premium Selection'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                {activeCategory ? activeCategory : 'Featured Products'}
              </h2>
            </div>
            {!activeCategory && (
              <div className="touch-pan-x w-full md:w-auto flex gap-2 overflow-x-auto pb-1 md:pb-0 mt-1 md:mt-0">
                 <button
                   onClick={() => setProductTab('new')}
                   className={`px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${
                     productTab === 'new'
                       ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                       : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-900'
                   }`}
                 >
                   New Arrivals
                 </button>
                 <button
                   onClick={() => setProductTab('best')}
                   className={`px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${
                     productTab === 'best'
                       ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                       : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-900'
                   }`}
                 >
                   Best Sellers
                 </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <SkeletonList count={8} />
          ) : (
            <>
              {featuredProducts.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-5">
                  {featuredProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onClick={() => onProductClick(product)}
                      onAddToCart={onAddToCart}
                    />
                  ))}
                </div>
              ) : (
                 <div className="text-center py-14 sm:py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-500 font-medium">No products found in this category.</p>
                    <button 
                      onClick={() => onSelectCategory('')}
                      className="mt-4 text-primary font-bold hover:underline"
                    >
                      Clear Filters
                    </button>
                 </div>
              )}
            </>
          )}

          {!activeCategory && featuredProducts.length > 0 && (
            <div className="mt-10 sm:mt-16 text-center">
              <button
                onClick={handleNavigateToSearch}
                className="inline-block w-full sm:w-auto border-2 border-gray-900 text-gray-900 font-bold py-3.5 px-10 rounded-full hover:bg-gray-900 hover:text-white transition-all duration-300"
              >
                View All Parts
              </button>
            </div>
          )}
        </section>

        {/* Promo Banner */}
        {canUseFeature('support_tickets') && (
        <section className="py-4 sm:py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="rounded-2xl sm:rounded-[2rem] border border-gray-200 bg-gradient-to-r from-gray-900 to-gray-800 text-white p-5 sm:p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] font-black text-red-300">Customer Support</p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight mt-2">Need help with order, payment, or delivery?</h3>
              <p className="text-gray-300 mt-2 text-sm font-medium">Open support page and submit a ticket. Admin team will see it instantly in Support Center.</p>
            </div>
            <button
              onClick={() => onHelpClick?.('support-ticket')}
              className="h-12 w-full md:w-auto px-6 rounded-xl bg-primary text-white text-sm font-black uppercase tracking-wider hover:bg-red-700 transition-colors"
            >
              Open Support Ticket
            </button>
          </div>
        </section>
        )}

        {newsletterEnabled && (
          <section className="py-8 sm:py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div
              className="bg-gray-900 rounded-2xl sm:rounded-[2rem] p-5 sm:p-5 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between overflow-hidden relative shadow-2xl"
              style={
                newsletterBackgroundImageUrl
                  ? {
                      backgroundImage: `linear-gradient(to right, rgba(3,12,35,0.92), rgba(15,23,42,0.82)), url(${newsletterBackgroundImageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }
                  : undefined
              }
            >
              <div className="relative z-10 max-w-lg text-white">
                <p className="text-[11px] uppercase tracking-[0.25em] font-black text-red-300 mb-2">{newsletterBadgeText}</p>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">{newsletterTitle}</h3>
                <p className="text-gray-300 mb-8 leading-relaxed">{newsletterDescription}</p>
                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row w-full max-w-sm gap-2 sm:gap-0">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder={newsletterInputPlaceholder}
                    className="flex-1 px-5 py-4 rounded-xl sm:rounded-r-none border-none focus:ring-2 focus:ring-primary outline-none text-gray-900 placeholder-gray-500"
                  />
                  <button type="submit" className="bg-primary text-white font-bold px-6 py-3 rounded-xl sm:rounded-l-none hover:bg-red-700 transition-colors">
                    {newsletterButtonText}
                  </button>
                </form>
                {newsletterNotice && (
                  <p className="mt-3 text-xs font-bold text-gray-200">{newsletterNotice}</p>
                )}
              </div>

              {!newsletterBackgroundImageUrl && (
                <div className="hidden md:block absolute right-0 bottom-0 top-0 w-2/3 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-l from-gray-800 to-gray-900"></div>
                  <div className="absolute right-[-100px] top-[-100px] w-[500px] h-[500px] rounded-full border-[60px] border-gray-800 opacity-30"></div>
                  <div className="absolute right-[50px] bottom-[-50px] w-[300px] h-[300px] rounded-full border-[30px] border-primary opacity-10"></div>
                </div>
              )}
            </div>
          </section>
        )}

      </main>
    </div>
  );
};

export default Home;
