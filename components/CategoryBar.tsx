/**
 * CategoryBar.tsx
 * A beautiful horizontal category bar shown below the header on desktop.
 * Admin can control which categories appear and their order.
 * Hover reveals subcategory dropdown.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Menu, ChevronDown, ChevronLeft, ChevronRight, CircleDashed } from 'lucide-react';
import {
  getCategories,
  getHeaderNavCategories,
  getSubcategories,
  invalidateCategoryCache,
  CachedCategory,
} from '../services/categoryCache';

interface CategoryBarProps {
  activeCategory?: string | null;
  onSelectCategory?: (cat: string) => void;
  onOpenSidebar?: () => void;
}

const CategoryBar: React.FC<CategoryBarProps> = ({
  activeCategory,
  onSelectCategory,
  onOpenSidebar,
}) => {
  const [headerCats, setHeaderCats] = useState<CachedCategory[]>([]);
  const [allCats, setAllCats] = useState<CachedCategory[]>([]);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const [hoveredRect, setHoveredRect] = useState<{ left: number; top: number; width: number } | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const load = useCallback(async () => {
    const all = await getCategories();
    setAllCats(all);
    setHeaderCats(getHeaderNavCategories(all));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = () => { invalidateCategoryCache(); load(); };
    window.addEventListener('header-cats-updated', handler);
    window.addEventListener('categories-updated', handler);
    return () => {
      window.removeEventListener('header-cats-updated', handler);
      window.removeEventListener('categories-updated', handler);
    };
  }, [load]);

  // Scroll indicator check
  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    setHoveredCat(null); // hide on scroll
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, [headerCats, checkScroll]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
  };

  const getSubcats = (parentId: string) => getSubcategories(allCats, parentId);

  const handleCatClick = (cat: CachedCategory) => {
    onSelectCategory?.(cat.name);
    setHoveredCat(null);
  };

  const handleSubcatClick = (sub: CachedCategory) => {
    onSelectCategory?.(sub.name);
    setHoveredCat(null);
  };

  const onHoverEnter = (id: string, e?: React.MouseEvent) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredRect({ left: rect.left, top: rect.bottom, width: rect.width });
    }
    setHoveredCat(id);
  };
  const onHoverLeave = () => {
    // 300ms gives the mouse enough time to travel to the dropdown
    hoverTimeout.current = setTimeout(() => setHoveredCat(null), 300);
  };

  if (headerCats.length === 0) return null;

  return (
    /* ── Desktop only ── */
    <div className="hidden md:block bg-white border-b border-gray-200 shadow-sm sticky top-[72px] sm:top-[80px] z-40">
      <div className="max-w-7xl mx-auto px-0 flex items-stretch relative">

        {/* ── All Categories red button ── */}
        <button
          onClick={onOpenSidebar}
          className="
            flex-shrink-0 flex items-center gap-2.5 px-5 py-3
            bg-primary text-white text-sm font-black
            hover:bg-red-700 active:bg-red-800
            transition-colors duration-150
            border-r border-red-700
            z-10 whitespace-nowrap
          "
        >
          <Menu className="w-4 h-4" />
          <span>All Categories</span>
        </button>

        {/* ── Left scroll shadow ── */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-[148px] top-0 bottom-0 z-10 flex items-center justify-center w-8 bg-gradient-to-r from-white to-transparent"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
        )}

        {/* ── Category list ── */}
        <div
          ref={scrollRef}
          className="flex items-stretch overflow-x-auto scrollbar-hide flex-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {headerCats.map(cat => {
            const subs = getSubcats(cat.id);
            const isHovered = hoveredCat === cat.id;
            const isActive = activeCategory === cat.name;

            return (
              <div
                key={cat.id}
                className="relative flex-shrink-0"
                onMouseEnter={(e) => onHoverEnter(cat.id, e)}
                onMouseLeave={onHoverLeave}
              >
                {/* Category button */}
                <button
                  onClick={() => handleCatClick(cat)}
                  className={`
                    flex items-center gap-2 px-4 py-3 h-full
                    text-sm font-semibold whitespace-nowrap
                    border-b-2 transition-all duration-150
                    ${isActive
                      ? 'text-primary border-primary bg-red-50'
                      : isHovered
                        ? 'text-primary border-primary bg-gray-50'
                        : 'text-gray-700 border-transparent hover:text-primary hover:border-primary/40 hover:bg-gray-50'
                    }
                  `}
                >
                  {/* Category logo/icon */}
                  {cat.logo_url ? (
                    <img
                      src={cat.logo_url}
                      alt={cat.name}
                      className="w-5 h-5 rounded object-cover flex-shrink-0"
                      onError={e => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <CircleDashed className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                  {cat.name}
                  {subs.length > 0 && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${isHovered ? 'rotate-180 text-primary' : 'text-gray-400'}`}
                    />
                  )}
                </button>

                {/* Dropdown removed from here, it's rendered outside the scroll container */}
              </div>
            );
          })}
        </div>

        {/* Subcategory dropdown — rendered outside scroll container */}
        {hoveredCat && hoveredRect && (() => {
          const cat = headerCats.find(c => c.id === hoveredCat);
          if (!cat) return null;
          const subs = getSubcats(cat.id);
          if (subs.length === 0) return null;
          
          return (
            <div
              onMouseEnter={() => {
                if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
              }}
              onMouseLeave={onHoverLeave}
              className="fixed z-50 min-w-[220px] max-w-[300px]"
              style={{
                top: `${hoveredRect.top - 2}px`,
                left: `${hoveredRect.left}px`,
                paddingTop: '4px', /* invisible bridge */
              }}
            >
              <div className="bg-white border border-gray-200 rounded-xl shadow-2xl py-2 overflow-hidden">
                <div className="px-4 py-2 mb-1 border-b border-gray-100 flex items-center gap-2">
                  {cat.logo_url ? (
                    <img src={cat.logo_url} alt={cat.name} className="w-5 h-5 rounded object-cover flex-shrink-0" />
                  ) : (
                    <CircleDashed className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  )}
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                    {cat.name}
                  </span>
                </div>
                {subs.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => handleSubcatClick(sub)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 text-left
                      text-sm font-semibold transition-colors
                      ${activeCategory === sub.name
                        ? 'bg-red-50 text-primary'
                        : 'text-gray-700 hover:bg-red-50 hover:text-primary'
                      }
                    `}
                  >
                    {sub.logo_url ? (
                      <img
                        src={sub.logo_url}
                        alt={sub.name}
                        className="w-6 h-6 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <CircleDashed className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    )}
                    <span>{sub.name}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── Right scroll shadow ── */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-10 flex items-center justify-center w-8 bg-gradient-to-l from-white to-transparent"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Fade animation keyframe */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default CategoryBar;
