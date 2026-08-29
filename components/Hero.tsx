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
    <section className="pt-2 pb-3 sm:pt-4 sm:pb-8 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">

      {/* ─── Scoped styles for mobile hero only ─── */}
      <style dangerouslySetInnerHTML={{ __html: `
        .nk-hero-mobile {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3.2;
          overflow: hidden;
          border-radius: 20px;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        }
        .nk-hero-mobile img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }
        .nk-hero-mobile-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            transparent 20%,
            rgba(0,0,0,0.25) 50%,
            rgba(0,0,0,0.72) 100%
          );
          z-index: 1;
        }
        .nk-hero-mobile-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px 14px;
          z-index: 2;
          color: #ffffff;
          min-width: 0;
        }
        .nk-hero-mobile-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background-color: #e61c43;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 100px;
          margin-bottom: 6px;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .nk-hero-mobile-title {
          font-size: 17px;
          font-weight: 800;
          line-height: 1.25;
          color: #ffffff;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 4px;
          text-shadow: 0 1px 4px rgba(0,0,0,0.5);
          word-break: break-word;
        }
        .nk-hero-mobile-desc {
          font-size: 11px;
          color: rgba(255,255,255,0.80);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 10px;
          font-weight: 500;
        }
        .nk-hero-mobile-btns {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .nk-hero-mobile-btn {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          padding: 9px 16px;
          border-radius: 100px;
          border: none;
          cursor: pointer;
          transition: opacity 0.15s ease, transform 0.1s ease;
          white-space: nowrap;
          -webkit-tap-highlight-color: transparent;
          flex-shrink: 0;
        }
        .nk-hero-mobile-btn:active {
          transform: scale(0.96);
          opacity: 0.85;
        }
        .nk-hero-mobile-btn-primary {
          background-color: #e61c43;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(230,28,67,0.40);
        }
        .nk-hero-mobile-btn-secondary {
          background-color: rgba(255,255,255,0.18);
          color: #ffffff;
          border: 1px solid rgba(255,255,255,0.30);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        @media (orientation: landscape) and (max-height: 500px) {
          .nk-hero-mobile { aspect-ratio: 16 / 7; }
        }
      ` }} />

      {isLoading ? (
        <div className="w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '4/3.2' }}>
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════
              MOBILE HERO  (visible below md only)
          ══════════════════════════════════════════ */}
          <div
            className="md:hidden"
            style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, touchAction: 'pan-y' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            {/* Slide track — MUST be width 100% and no overflow */}
            <div
              style={{
                display: 'flex',
                width: '100%',
                transform: `translateX(calc(${-activeIndex * 100}% + ${dragOffset}px))`,
                transition: isDragging ? 'none' : 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)',
                willChange: 'transform',
              }}
            >
              {displayedBanners.map((banner) => {
                const mobileImg = (banner as any).mobile_image_url || banner.image_url;
                const descText = banner.description || '';
                return (
                  <div
                    key={`mob-${banner.id}`}
                    className="nk-hero-mobile"
                    style={{ flexShrink: 0, width: '100%', minWidth: '100%' }}
                  >
                    {/* Background image */}
                    {mobileImg ? (
                      <img src={mobileImg} alt={banner.title} loading="eager" decoding="async" draggable={false} />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#1a1a2e,#e61c43)' }} />
                    )}

                    {/* Gradient overlay */}
                    <div className="nk-hero-mobile-overlay" />

                    {/* Content */}
                    <div className="nk-hero-mobile-content">
                      {banner.badge_text && (
                        <div className="nk-hero-mobile-badge">
                          <Zap style={{ width: 9, height: 9, fill: '#fff', flexShrink: 0 }} />
                          <span>{banner.badge_text}</span>
                        </div>
                      )}

                      <div className="nk-hero-mobile-title">
                        {banner.title}{banner.highlight_text ? ` ${banner.highlight_text}` : ''}
                      </div>

                      {descText && (
                        <div className="nk-hero-mobile-desc">{descText}</div>
                      )}

                      <div className="nk-hero-mobile-btns">
                        <button
                          className="nk-hero-mobile-btn nk-hero-mobile-btn-primary"
                          disabled={isNavigating}
                          onClick={(e) => { e.stopPropagation(); handleBannerAction('primary'); }}
                        >
                          {isNavigating
                            ? <Loader2 style={{ width: 13, height: 13 }} />
                            : <>{banner.primary_button_text}<ArrowRight style={{ width: 12, height: 12, marginLeft: 4 }} /></>
                          }
                        </button>
                        {banner.secondary_button_text && (
                          <button
                            className="nk-hero-mobile-btn nk-hero-mobile-btn-secondary"
                            onClick={(e) => { e.stopPropagation(); handleBannerAction('secondary'); }}
                          >
                            {banner.secondary_button_text}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Slide indicator dots — compact, inside the banner */}
            {displayedBanners.length > 1 && (
              <div style={{
                position: 'absolute',
                bottom: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                zIndex: 10,
                pointerEvents: 'none',
              }}>
                {displayedBanners.map((_, index) => (
                  <span
                    key={`dot-${index}`}
                    style={{
                      display: 'block',
                      height: 5,
                      width: index === activeIndex ? 18 : 5,
                      borderRadius: 100,
                      backgroundColor: index === activeIndex ? '#ffffff' : 'rgba(255,255,255,0.45)',
                      transition: 'width 0.3s ease',
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            )}

            {errorText && (
              <p style={{ marginTop: 8, fontSize: 12, color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>
                {errorText.includes('hero_banners') ? 'Banners not available.' : errorText}
              </p>
            )}
          </div>

          {/* ══════════════════════════════════════════
              DESKTOP HERO  (hidden below md)
          ══════════════════════════════════════════ */}
          <div
            onClick={handleContainerClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className={`hidden md:block relative rounded-2xl overflow-hidden ${(() => { const h = (activeBanner as any).settings?.banner_height; return h === "tall" ? "md:h-[600px] lg:h-[650px]" : "md:h-[500px] lg:h-[520px]"; })()} w-full shadow-2xl shadow-gray-200 group transform transition-all hover:shadow-gray-300 cursor-pointer`}
          >
            {/* Desktop slide track */}
            <div
              className="absolute inset-0 flex"
              style={{
                transform: `translateX(calc(${-activeIndex * 100}% + ${dragOffset}px))`,
                transition: isDragging ? 'none' : 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {displayedBanners.map((banner) => (
                <div key={`desk-${banner.id}`} className="relative h-full min-w-full bg-gray-50">
                  <OptimizedImage
                    src={banner.image_url}
                    alt={banner.title}
                    width={1920}
                    height={760}
                    responsiveWidths={[800, 1200, 1600]}
                    sizes="100vw"
                    loading="eager"
                    fetchPriority="high"
                    className="w-full h-full object-cover object-center transform transition-transform duration-[20s] group-hover:scale-105"
                  />
                  {/* Dynamic Overlay per banner */}
                  {(() => {
                    const overlay = (banner as any).settings?.overlay || 'dark-gradient';
                    switch (overlay) {
                      case 'dark-gradient': return <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-900/50 to-transparent" />;
                      case 'light-gradient': return <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/50 to-transparent" />;
                      case 'solid-dark': return <div className="absolute inset-0 bg-gray-950/60" />;
                      case 'solid-light': return <div className="absolute inset-0 bg-white/60" />;
                      default: return null;
                    }
                  })()}
                </div>
              ))}
            </div>

            {/* Desktop content overlay */}
            {(() => {
              const activeSettings = (activeBanner as any).settings || {};
              const layout = activeSettings.layout || 'left';
              const textTheme = activeSettings.text_theme || 'light';
              
              const justifyClass = layout === 'center' ? 'justify-center' : layout === 'right' ? 'justify-end' : 'justify-start';
              const textJustify = layout === 'center' ? 'text-center' : layout === 'right' ? 'text-right' : 'text-left';
              const boxAlign = layout === 'center' ? 'items-center mx-auto' : layout === 'right' ? 'items-end ml-auto' : 'items-start';
              const textColorClass = textTheme === 'dark' ? 'text-gray-900' : 'text-white';
              const subTextColorClass = textTheme === 'dark' ? 'text-gray-700' : 'text-gray-200';
              const glassmorphismClass = textTheme === 'dark' ? 'bg-white/40 border-white/40' : 'bg-black/30 border-white/10';

              return (
            <div className={`relative h-full flex items-center px-12 lg:px-16 ${justifyClass}`}>
              <div className={`${glassmorphismClass} backdrop-blur-md border p-6 md:p-8 rounded-2xl max-w-lg w-full ${textColorClass} ${textJustify} shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col ${boxAlign}`}>
              
                {textTheme === 'light' && <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/40 rounded-full blur-[60px] pointer-events-none" />}
                <div className="relative z-10">
                  <div className={`inline-flex items-center gap-2 bg-primary px-3 py-1.5 rounded-full mb-6 shadow-lg border border-white/10 ${textTheme === "dark" ? "shadow-red-900/10" : "shadow-red-900/20"}`}>
                    <Zap className="w-3.5 h-3.5 text-white fill-white animate-pulse" />
                    <span className="text-white text-[11px] font-extrabold tracking-widest uppercase">{activeBanner.badge_text}</span>
                  </div>
                  <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6 drop-shadow-sm">
                    {activeBanner.title}
                    {activeBanner.highlight_text ? (
                      <><br /><span className="text-primary drop-shadow-md">{activeBanner.highlight_text}</span></>
                    ) : null}
                  </h1>
                  <p className={`${subTextColorClass} text-sm md:text-base mb-8 leading-relaxed font-medium opacity-90 max-w-sm`}>
                    {activeBanner.description || 'Explore premium parts handpicked for your vehicle.'}
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleBannerAction('primary'); }}
                      disabled={isNavigating}
                      className="bg-primary hover:bg-red-600 text-white text-sm font-bold py-4 px-8 rounded-full transition-all duration-300 flex items-center justify-center shadow-xl shadow-red-900/30 hover:-translate-y-1 disabled:opacity-70"
                    >
                      {isNavigating ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
                      {activeBanner.primary_button_text} <ArrowRight className="ml-2 w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleBannerAction('secondary'); }}
                      className={`backdrop-blur-sm text-sm font-bold py-4 px-8 rounded-full transition-all duration-300 hover:-translate-y-1 border ${textTheme === "dark" ? "bg-gray-900/10 hover:bg-gray-900/20 border-gray-900/20 text-gray-900" : "bg-white/10 hover:bg-white/20 border-white/20 text-white"}`}
                    >
                      {activeBanner.secondary_button_text}
                    </button>
                  </div>
                  {errorText && (
                    <p className={`mt-4 text-xs font-semibold ${textTheme === "dark" ? "text-red-600" : "text-amber-200"}`}>
                      {errorText.includes('hero_banners') ? 'Hero banners are not ready in database yet.' : errorText}
                    </p>
                  )}
                </div>
              </div>
            </div>
            );
            })()}

            {/* Desktop slide dots */}
            {displayedBanners.length > 1 && (
              <div className="absolute bottom-6 right-6 flex items-center gap-2 rounded-full bg-black/20 px-3 py-2 backdrop-blur-md">
                {displayedBanners.map((banner, index) => (
                  <button
                    key={`desk-dot-${banner.id}`}
                    onClick={(e) => { e.stopPropagation(); goToBanner(index); }}
                    className={`h-2.5 rounded-full transition-all ${index === activeIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/70'}`}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default Hero;
