import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Loader2, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getProductById } from '../services/productService';
import { Product } from '../types';
import OptimizedImage from './ui/OptimizedImage';

type HeroTargetType = 'none' | 'product' | 'category' | 'url';

interface HeroBanner {
  id: string;
  badge_text: string;
  title: string;
  highlight_text: string | null;
  description: string | null;
  image_url: string;
  primary_button_text: string;
  secondary_button_text: string;
  target_type: HeroTargetType;
  target_product_id: string | null;
  target_category: string | null;
  target_url: string | null;
  is_active: boolean;
  sort_order: number;
}

interface HeroProps {
  onProductClick: (product: Product) => void;
  onSelectCategory: (category: string) => void;
}

const parseBannerTargetUrls = (value?: string | null): { primary: string; secondary: string } => {
  const raw = String(value || '').trim();
  if (!raw) return { primary: '', secondary: '' };

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const record = parsed as Record<string, unknown>;
      const primary = String(record.primary || record.shop_now || record.shopNow || '').trim();
      const secondary = String(record.secondary || record.view_catalog || record.viewCatalog || '').trim();
      if (primary || secondary) {
        return { primary, secondary };
      }
    }
  } catch {
    // Backward compatibility with plain URL
  }

  return { primary: raw, secondary: '' };
};

const FALLBACK_BANNER: HeroBanner = {
  id: 'fallback',
  badge_text: 'Premium Selection',
  title: 'Genuine',
  highlight_text: 'Performance',
  description: "Unlock your vehicle's true potential with components engineered for speed, durability, and precision.",
  image_url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2940&auto=format&fit=crop',
  primary_button_text: 'Shop Now',
  secondary_button_text: 'View Catalog',
  target_type: 'none',
  target_product_id: null,
  target_category: null,
  target_url: null,
  is_active: true,
  sort_order: 0
};

const Hero: React.FC<HeroProps> = ({ onProductClick, onSelectCategory }) => {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const fetchBanners = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        setErrorText(error.message);
        setBanners([FALLBACK_BANNER]);
      } else if (!data || data.length === 0) {
        setBanners([FALLBACK_BANNER]);
      } else {
        setBanners(data as HeroBanner[]);
      }

      setIsLoading(false);
    };

    fetchBanners();
  }, []);

  const displayedBanners = useMemo(() => {
    return banners.length > 0 ? banners : [FALLBACK_BANNER];
  }, [banners]);

  useEffect(() => {
    if (displayedBanners.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % displayedBanners.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [displayedBanners.length]);

  useEffect(() => {
    setActiveIndex((prev) => {
      if (displayedBanners.length === 0) return 0;
      return Math.min(prev, displayedBanners.length - 1);
    });
  }, [displayedBanners.length]);

  const activeBanner = useMemo(() => {
    return displayedBanners[activeIndex] || displayedBanners[0] || FALLBACK_BANNER;
  }, [displayedBanners, activeIndex]);

  const goToBanner = (nextIndex: number) => {
    if (displayedBanners.length <= 1) return;
    const wrappedIndex = (nextIndex + displayedBanners.length) % displayedBanners.length;
    setActiveIndex(wrappedIndex);
    setDragOffset(0);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (displayedBanners.length <= 1) return;
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    suppressClickRef.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || displayedBanners.length <= 1) return;
    const currentX = event.touches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = currentX - touchStartXRef.current;
    if (Math.abs(deltaX) > 8) {
      suppressClickRef.current = true;
    }
    setDragOffset(deltaX);
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null) return;

    const swipeThreshold = 60;
    if (dragOffset <= -swipeThreshold) {
      goToBanner(activeIndex + 1);
    } else if (dragOffset >= swipeThreshold) {
      goToBanner(activeIndex - 1);
    } else {
      setDragOffset(0);
    }

    touchStartXRef.current = null;
    setIsDragging(false);

    if (suppressClickRef.current) {
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
  };

  const handleContainerClick = () => {
    if (suppressClickRef.current) return;
    handleBannerAction('primary');
  };

  const scrollToCatalog = () => {
    onSelectCategory('');
    const section = document.getElementById('products-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navigateToUrl = (url: string) => {
    const normalized = url.trim();
    if (!normalized) return;
    window.location.href = normalized;
  };

  const handleBannerAction = async (button: 'primary' | 'secondary') => {
    setErrorText(null);
    if (!activeBanner) return;

    if (activeBanner.target_type === 'product') {
      if (button === 'secondary') {
        scrollToCatalog();
        return;
      }
      if (!activeBanner.target_product_id) {
        scrollToCatalog();
        return;
      }

      setIsNavigating(true);
      try {
        const product = await getProductById(activeBanner.target_product_id);
        if (product) {
          onProductClick(product);
        } else {
          setErrorText('Linked product is not available right now.');
        }
      } catch (error) {
        console.error('Failed to open hero product:', error);
        setErrorText('Could not open this product.');
      } finally {
        setIsNavigating(false);
      }
      return;
    }

    if (activeBanner.target_type === 'category') {
      onSelectCategory(activeBanner.target_category || '');
      const section = document.getElementById('products-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    if (activeBanner.target_type === 'url') {
      const parsedUrls = parseBannerTargetUrls(activeBanner.target_url);
      const targetUrl = button === 'secondary'
        ? (parsedUrls.secondary || parsedUrls.primary)
        : (parsedUrls.primary || parsedUrls.secondary);

      if (targetUrl) {
        navigateToUrl(targetUrl);
        return;
      }
    }

    if (button === 'secondary' && activeBanner.target_type === 'product') {
      scrollToCatalog();
      return;
    }

    scrollToCatalog();
  };

  return (
    <section className="pt-2 pb-5 sm:pt-4 sm:pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div
        onClick={handleContainerClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="relative rounded-2xl sm:rounded-[2.5rem] overflow-hidden h-[240px] xs:h-[280px] sm:h-[500px] lg:h-[520px] w-full shadow-2xl shadow-gray-200 group transform transition-all hover:shadow-gray-300 cursor-pointer"
      >
        {isLoading ? (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <>
            <div
              className="absolute inset-0 flex"
              style={{
                transform: `translateX(calc(${-activeIndex * 100}% + ${dragOffset}px))`,
                transition: isDragging ? 'none' : 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)'
              }}
            >
              {displayedBanners.map((banner) => (
                <div key={banner.id} className="relative h-full min-w-full bg-gray-50 sm:bg-transparent">
                  <OptimizedImage
                    src={banner.image_url}
                    alt={banner.title}
                    width={1920}
                    height={760}
                    responsiveWidths={[400, 800, 1200, 1600]}
                    sizes="100vw"
                    loading="eager"
                    className="w-full h-full object-contain sm:object-cover object-center transform transition-transform duration-[20s] sm:group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-transparent sm:bg-gradient-to-r sm:from-gray-950/90 sm:via-gray-900/50 sm:to-transparent" />
                </div>
              ))}
            </div>

            <div className="relative hidden h-full items-center px-6 md:px-12 lg:px-16 sm:flex">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl max-w-[98%] sm:max-w-lg w-full text-white shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/40 rounded-full blur-[60px] pointer-events-none" />

                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-primary px-2.5 sm:px-3 py-1.5 rounded-full mb-3 sm:mb-6 shadow-lg shadow-red-900/20 border border-white/10">
                    <Zap className="w-3.5 h-3.5 text-white fill-white animate-pulse" />
                    <span className="text-white text-[11px] font-extrabold tracking-widest uppercase">{activeBanner.badge_text}</span>
                  </div>

                  <h1 className="text-[2.2rem] sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05] mb-3 sm:mb-6 drop-shadow-sm">
                    {activeBanner.title}
                    {activeBanner.highlight_text ? (
                      <>
                        <br />
                        <span className="text-primary drop-shadow-md">{activeBanner.highlight_text}</span>
                      </>
                    ) : null}
                  </h1>

                  <p className="text-gray-200 text-xs sm:text-sm md:text-base mb-4 sm:mb-8 leading-relaxed font-medium opacity-90 max-w-sm">
                    {activeBanner.description || 'Explore premium parts handpicked for your vehicle.'}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBannerAction('primary');
                      }}
                      disabled={isNavigating}
                      className="w-full sm:w-auto bg-primary hover:bg-red-600 text-white text-sm font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-full transition-all duration-300 flex items-center justify-center shadow-xl shadow-red-900/30 hover:shadow-red-600/40 hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isNavigating ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
                      {activeBanner.primary_button_text} <ArrowRight className="ml-2 w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBannerAction('secondary');
                      }}
                      className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-full transition-all duration-300 backdrop-blur-sm hover:-translate-y-1"
                    >
                      {activeBanner.secondary_button_text}
                    </button>
                  </div>

                  {errorText && (
                    <p className="mt-4 text-xs text-amber-200 font-semibold">
                      {errorText.includes('hero_banners') ? 'Hero banners are not ready in database yet.' : errorText}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {displayedBanners.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 sm:bottom-6 sm:right-6 sm:left-auto sm:translate-x-0 flex items-center gap-2 rounded-full bg-black/20 px-3 py-2 backdrop-blur-md">
                {displayedBanners.map((banner, index) => (
                  <button
                    key={banner.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToBanner(index);
                    }}
                    className={`h-2.5 rounded-full transition-all ${index === activeIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/70'}`}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Hero;
