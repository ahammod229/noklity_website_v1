/**
 * CategorySidebar.tsx
 * Two-panel mega-menu drawer:
 *   Desktop (md+): Left = main category list | Right = subcategory grid
 *   Mobile       : Left-only with accordion subcategories
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X, ChevronRight, ChevronDown, FolderOpen,
  Tag, LayoutGrid, ArrowRight, Package,
} from 'lucide-react';
import { getCategories } from '../services/categoryCache';

interface CatItem {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  icon: string | null;
  parent_id: string | null;
  is_active: boolean;
}

interface CategorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory?: (categoryName: string, subcategoryName?: string) => void;
}

/* ── Tiny logo/icon helper ────────────────────────────────────────── */
const CatLogo = ({
  cat,
  size = 'md',
  active = false,
}: {
  cat: CatItem;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
}) => {
  const dim = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const iconDim = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  return cat.logo_url ? (
    <img
      src={cat.logo_url}
      alt={cat.name}
      className={`${dim} rounded-lg object-cover flex-shrink-0 border border-gray-100`}
    />
  ) : (
    <div
      className={`${dim} rounded-lg flex items-center justify-center flex-shrink-0 ${
        active
          ? 'bg-primary/10'
          : 'bg-gradient-to-br from-gray-100 to-gray-200'
      }`}
    >
      <Package className={`${iconDim} ${active ? 'text-primary' : 'text-gray-400'}`} />
    </div>
  );
};

/* ── Main Component ──────────────────────────────────────────────── */
const CategorySidebar: React.FC<CategorySidebarProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
}) => {
  const [cats, setCats] = useState<CatItem[]>([]);
  const [loading, setLoading] = useState(false);

  /** Desktop: hovered/active main cat id (right panel content) */
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  /** Mobile: expanded accordion ids */
  const [mobileExpanded, setMobileExpanded] = useState<Set<string>>(new Set());

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Data ── */
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getCategories().then(data => {
      setCats(data);
      setLoading(false);
    });
  }, [isOpen]);

  /* Auto-select first category that has subcategories */
  useEffect(() => {
    if (!isOpen || cats.length === 0 || activeCatId) return;
    const mainCats = cats.filter(c => !c.parent_id);
    const firstWithSubs = mainCats.find(c => cats.some(s => s.parent_id === c.id));
    setActiveCatId(firstWithSubs?.id || mainCats[0]?.id || null);
  }, [isOpen, cats, activeCatId]);

  /* Reset on close */
  useEffect(() => {
    if (!isOpen) {
      setActiveCatId(null);
      setMobileExpanded(new Set());
    }
  }, [isOpen]);

  /* Escape key */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  /* Body scroll lock */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* ── Derived ── */
  const mainCats = cats.filter(c => !c.parent_id);
  const getChildren = useCallback(
    (id: string) => cats.filter(c => c.parent_id === id),
    [cats],
  );
  const activeCat = mainCats.find(c => c.id === activeCatId) ?? null;
  const activeSubs = activeCat ? getChildren(activeCat.id) : [];

  /* ── Handlers ── */
  const handleHoverMain = (id: string) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setActiveCatId(id);
  };

  const handleSelectMain = (cat: CatItem) => {
    onSelectCategory?.(cat.name);
    onClose();
  };

  const handleSelectSub = (sub: CatItem, parentName: string) => {
    onSelectCategory?.(parentName, sub.name);
    onClose();
  };

  const toggleMobileAccordion = (id: string) => {
    setMobileExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* ── Render ── */
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[90] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer panel */}
      <div
        className={`
          fixed top-0 left-0 h-full z-[95] shadow-2xl
          flex flex-col
          bg-white
          w-[300px] md:w-[520px]
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <LayoutGrid className="w-5 h-5 text-primary" />
            <h2 className="font-black text-gray-900 text-base tracking-tight">All Categories</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-hidden flex min-h-0">

          {/* ════════ LEFT PANEL — main categories ════════ */}
          <div
            className={`
              overflow-y-auto flex-shrink-0 bg-gray-50 border-r border-gray-200
              w-full md:w-[200px]
            `}
          >
            {loading ? (
              <div className="p-4 space-y-2">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="h-11 bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : mainCats.length === 0 ? (
              <div className="p-6 text-center">
                <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-medium">No categories</p>
              </div>
            ) : (
              <nav className="py-2">
                {mainCats.map(cat => {
                  const children = getChildren(cat.id);
                  const hasChildren = children.length > 0;
                  const isActive = activeCatId === cat.id;
                  const isMobileOpen = mobileExpanded.has(cat.id);

                  return (
                    <div key={cat.id}>
                      {/* Category row */}
                      <button
                        onMouseEnter={() => handleHoverMain(cat.id)}
                        onClick={() => {
                          if (hasChildren) {
                            // Desktop: activate right panel; Mobile: toggle accordion
                            setActiveCatId(cat.id);
                            toggleMobileAccordion(cat.id);
                          } else {
                            handleSelectMain(cat);
                          }
                        }}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 text-left
                          transition-all duration-100 relative group
                          ${isActive
                            ? 'bg-white text-primary font-bold border-r-[3px] border-primary'
                            : 'text-gray-700 hover:bg-white hover:text-gray-900 font-semibold'
                          }
                        `}
                      >
                        <CatLogo cat={cat} size="sm" active={isActive} />
                        <span className="text-sm flex-1 text-left leading-tight truncate pr-1">
                          {cat.name}
                        </span>
                        {hasChildren && (
                          <>
                            {/* Desktop: right arrow */}
                            <ChevronRight
                              className={`w-3.5 h-3.5 flex-shrink-0 hidden md:block transition-transform ${
                                isActive ? 'text-primary' : 'text-gray-300 group-hover:text-gray-400'
                              }`}
                            />
                            {/* Mobile: down arrow for accordion */}
                            <ChevronDown
                              className={`w-3.5 h-3.5 flex-shrink-0 md:hidden transition-transform text-gray-400 ${
                                isMobileOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </>
                        )}
                      </button>

                      {/* ── Mobile accordion ── */}
                      <div
                        className="md:hidden overflow-hidden transition-all duration-200"
                        style={{
                          maxHeight: isMobileOpen
                            ? `${(children.length + 1) * 46}px`
                            : '0px',
                        }}
                      >
                        {/* "All in [cat]" */}
                        <button
                          onClick={() => handleSelectMain(cat)}
                          className="w-full flex items-center gap-3 pl-10 pr-4 py-2.5 text-left hover:bg-red-50 transition-colors border-l-2 border-primary/30 ml-4 group"
                        >
                          <ArrowRight className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
                          <span className="text-xs font-bold text-gray-500 group-hover:text-primary transition-colors">
                            All in {cat.name}
                          </span>
                        </button>
                        {children.map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => handleSelectSub(sub, cat.name)}
                            className="w-full flex items-center gap-3 pl-10 pr-4 py-2.5 text-left hover:bg-red-50 transition-colors border-l-2 border-primary/30 ml-4 group"
                          >
                            {sub.logo_url ? (
                              <img src={sub.logo_url} alt={sub.name} className="w-4 h-4 rounded object-cover flex-shrink-0" />
                            ) : (
                              <Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            )}
                            <span className="text-sm text-gray-700 font-medium group-hover:text-primary transition-colors">
                              {sub.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </nav>
            )}
          </div>

          {/* ════════ RIGHT PANEL — subcategories (desktop only) ════════ */}
          <div className="hidden md:flex flex-col flex-1 overflow-hidden bg-white">
            {activeCat ? (
              <>
                {/* Right panel header */}
                <div className="px-5 py-4 border-b border-gray-100 bg-white flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <CatLogo cat={activeCat} size="md" active />
                    <div>
                      <h3 className="font-black text-gray-900 text-sm leading-tight">
                        {activeCat.name}
                      </h3>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                        {activeSubs.length > 0
                          ? `${activeSubs.length} subcategories`
                          : 'Browse all products'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subcategory grid */}
                <div className="flex-1 overflow-y-auto p-4">
                  {activeSubs.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* "All in [cat]" card */}
                      <button
                        onClick={() => handleSelectMain(activeCat)}
                        className="
                          col-span-2 flex items-center gap-3 px-4 py-3
                          rounded-xl border-2 border-dashed border-primary/30
                          hover:border-primary hover:bg-red-50
                          transition-all duration-150 group text-left mb-1
                        "
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <LayoutGrid className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-black text-primary">
                          View all in {activeCat.name}
                        </span>
                        <ArrowRight className="w-4 h-4 text-primary ml-auto group-hover:translate-x-1 transition-transform" />
                      </button>

                      {/* Individual subcategories */}
                      {activeSubs.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => handleSelectSub(sub, activeCat.name)}
                          className="
                            flex items-center gap-3 px-3 py-3
                            rounded-xl border border-gray-100
                            hover:border-primary/30 hover:bg-red-50
                            transition-all duration-150 group text-left
                            bg-gray-50/50
                          "
                        >
                          {sub.logo_url ? (
                            <img
                              src={sub.logo_url}
                              alt={sub.name}
                              className="w-8 h-8 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                              <Tag className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                            </div>
                          )}
                          <span className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors leading-tight">
                            {sub.name}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary ml-auto flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* No subcategories state */
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <FolderOpen className="w-7 h-7 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-500 mb-1">No subcategories</p>
                        <p className="text-xs text-gray-400">Browse all products in this category</p>
                      </div>
                      <button
                        onClick={() => handleSelectMain(activeCat)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                        Browse {activeCat.name}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-300">
                <p className="text-sm">Hover a category →</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-gray-100 px-5 py-3 bg-gray-50 flex-shrink-0">
          <button
            onClick={() => { onSelectCategory?.(''); onClose(); }}
            className="w-full text-center text-sm font-bold text-primary hover:underline flex items-center justify-center gap-1.5"
          >
            <LayoutGrid className="w-4 h-4" />
            View all products
          </button>
        </div>
      </div>
    </>
  );
};

export default CategorySidebar;
