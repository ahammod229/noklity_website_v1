import React, { useEffect, useRef, useState } from 'react';
import { Product } from '../types';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  ShoppingCart,
  Star,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import ProductTabs from './ProductTabs';
import { useCurrency } from '../hooks/useCurrency';
import { useWishlist } from '../contexts/WishlistContext';
import OptimizedImage from './ui/OptimizedImage';
import { supabase } from '../lib/supabase';
import { normalizeProductFaqItems } from '../utils/productFaq';

const PRODUCT_DETAIL_SAFE_WIDTHS = [400, 800];

interface ProductDetailsProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onHomeClick?: () => void;
  onCategoryClick?: (category: string) => void;
}

const getProductSpecs = (product: Product) => ({
  ...(product.specifications || {}),
  ...(product.weight ? { Weight: `${product.weight} kg` } : {}),
  ...(product.countryOfOrigin ? { 'Country of Origin': product.countryOfOrigin } : {}),
  ...(product.sku ? { SKU: product.sku } : {}),
  ...(product.modelNumber ? { 'Model Number': product.modelNumber } : {})
});

const clampImageAspectRatio = (ratio: number | null | undefined) => {
  const safeRatio = Number(ratio || 1);
  if (!Number.isFinite(safeRatio) || safeRatio <= 0) return 1;
  return Math.min(1.35, Math.max(0.82, safeRatio));
};

const ProductDetails: React.FC<ProductDetailsProps> = ({
  product,
  onClose,
  onAddToCart,
  onHomeClick,
  onCategoryClick
}) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { formatCurrency } = useCurrency();
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  const [isMobileActionBarVisible, setIsMobileActionBarVisible] = useState(true);
  const [activeImageAspectRatio, setActiveImageAspectRatio] = useState(1);
  const [mobileReviews, setMobileReviews] = useState<any[]>([]);
  const [isLoadingMobileReviews, setIsLoadingMobileReviews] = useState(false);
  const shareFeedbackTimerRef = useRef<number | null>(null);
  const mainImageTouchStartXRef = useRef<number | null>(null);
  const mainImageTouchCurrentXRef = useRef<number | null>(null);
  const mainImageSwipingRef = useRef(false);
  const viewerTouchStartXRef = useRef<number | null>(null);
  const viewerTouchStartYRef = useRef<number | null>(null);
  const lastScrollYRef = useRef(0);
  const scrollFrameRef = useRef<number | null>(null);
  const scrollIdleTimerRef = useRef<number | null>(null);

  const maxStock = typeof product?.stock === 'number' ? Math.max(0, Number(product.stock)) : 20;
  const isOutOfStock = maxStock <= 0;

  useEffect(() => {
    if (product) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      setQuantity(1);
      setActiveImageIndex(0);
      setIsImageViewerOpen(false);
      setPreviewZoom(1);
      setIsMobileActionBarVisible(true);
      setActiveImageAspectRatio(1);
      setMobileReviews([]);
    }
  }, [product]);

  useEffect(() => {
    if (!product?.id) return;
    let active = true;
    const fetchMobileReviews = async () => {
      setIsLoadingMobileReviews(true);
      try {
        const { data, error } = await supabase
          .from('product_reviews')
          .select('*')
          .eq('product_id', product.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });
        if (active && !error && data) {
          setMobileReviews(data);
        }
      } catch (err) {
        console.error('Error fetching mobile reviews:', err);
      } finally {
        if (active) setIsLoadingMobileReviews(false);
      }
    };
    fetchMobileReviews();
    return () => {
      active = false;
    };
  }, [product?.id]);

  useEffect(() => {
    return () => {
      if (shareFeedbackTimerRef.current !== null) {
        window.clearTimeout(shareFeedbackTimerRef.current);
      }
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
      if (scrollIdleTimerRef.current !== null) {
        window.clearTimeout(scrollIdleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    lastScrollYRef.current = window.scrollY;

    const handleScroll = () => {
      if (scrollFrameRef.current !== null) return;

      scrollFrameRef.current = window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollYRef.current;

        if (currentY < 80 || delta < -8) {
          setIsMobileActionBarVisible(true);
        } else if (delta > 10) {
          setIsMobileActionBarVisible(false);
        }

        lastScrollYRef.current = currentY;
        scrollFrameRef.current = null;

        if (scrollIdleTimerRef.current !== null) {
          window.clearTimeout(scrollIdleTimerRef.current);
        }
        scrollIdleTimerRef.current = window.setTimeout(() => {
          setIsMobileActionBarVisible(true);
          scrollIdleTimerRef.current = null;
        }, 180);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
      if (scrollIdleTimerRef.current !== null) {
        window.clearTimeout(scrollIdleTimerRef.current);
        scrollIdleTimerRef.current = null;
      }
    };
  }, [product?.id]);

  if (!product) return null;

  const specs = getProductSpecs(product);
  const productFaqItems = normalizeProductFaqItems(product.faqText || '');
  const compatibilityList = product.compatibility || [];
  const cleanedImages = [product.image, ...(product.images || [])].filter(Boolean);
  const uniqueImages = Array.from(new Set(cleanedImages));
  const galleryImages = uniqueImages.length > 0 ? uniqueImages : [product.image];

  const activeImage = galleryImages[Math.min(activeImageIndex, galleryImages.length - 1)] || product.image;
  const contentImageAspectRatio = clampImageAspectRatio(activeImageAspectRatio);
  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const isWishlisted = isInWishlist(product.id);
  const deliveryChargeValue = Number(
    product.deliveryCharge || product.defaultDeliveryFee || product.deliveryCharges?.Dhaka || 0
  );
  const baseDeliveryFeeValue = Number(product.defaultDeliveryFee || 0);
  const mobileActionTotal = product.price * quantity;

  const openImageViewer = () => {
    setPreviewZoom(1);
    setIsImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setIsImageViewerOpen(false);
    setPreviewZoom(1);
  };

  const handlePrevImage = () => {
    if (galleryImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (galleryImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const handleZoomIn = () => setPreviewZoom((prev) => Math.min(3, prev + 0.25));
  const handleZoomOut = () => setPreviewZoom((prev) => Math.max(1, prev - 0.25));
  const handleImageTapZoom = () => setPreviewZoom((prev) => (prev < 1.5 ? 2 : 1));

  const handleMainImageTouchStart = (event: React.TouchEvent<HTMLButtonElement>) => {
    const point = event.touches[0];
    mainImageTouchStartXRef.current = point.clientX;
    mainImageTouchCurrentXRef.current = point.clientX;
    mainImageSwipingRef.current = false;
  };

  const handleMainImageTouchMove = (event: React.TouchEvent<HTMLButtonElement>) => {
    const point = event.touches[0];
    mainImageTouchCurrentXRef.current = point.clientX;
    if (mainImageTouchStartXRef.current !== null) {
      const distance = Math.abs(point.clientX - mainImageTouchStartXRef.current);
      if (distance > 12) {
        mainImageSwipingRef.current = true;
      }
    }
  };

  const handleMainImageTouchEnd = () => {
    if (galleryImages.length <= 1) return;
    if (mainImageTouchStartXRef.current === null || mainImageTouchCurrentXRef.current === null) return;

    const deltaX = mainImageTouchCurrentXRef.current - mainImageTouchStartXRef.current;
    if (Math.abs(deltaX) > 45) {
      if (deltaX > 0) {
        handlePrevImage();
      } else {
        handleNextImage();
      }
    }
  };

  const handleViewerTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const point = event.touches[0];
    viewerTouchStartXRef.current = point.clientX;
    viewerTouchStartYRef.current = point.clientY;
  };

  const handleViewerTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (previewZoom > 1.05 || galleryImages.length <= 1) return;
    if (viewerTouchStartXRef.current === null || viewerTouchStartYRef.current === null) return;

    const point = event.changedTouches[0];
    const deltaX = point.clientX - viewerTouchStartXRef.current;
    const deltaY = point.clientY - viewerTouchStartYRef.current;
    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    if (deltaX > 0) {
      handlePrevImage();
    } else {
      handleNextImage();
    }
  };

  const handleViewerWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  useEffect(() => {
    if (!isImageViewerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeImageViewer();
      } else if (event.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (event.key === 'ArrowRight') {
        handleNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isImageViewerOpen, galleryImages.length]);

  useEffect(() => {
    if (!activeImage || typeof window === 'undefined') {
      setActiveImageAspectRatio(1);
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      const width = image.naturalWidth || 1;
      const height = image.naturalHeight || 1;
      setActiveImageAspectRatio(width / height);
    };
    image.onerror = () => {
      if (cancelled) return;
      setActiveImageAspectRatio(1);
    };
    image.src = activeImage;

    return () => {
      cancelled = true;
    };
  }, [activeImage]);

  const showShareFeedback = (text: string) => {
    setShareFeedback(text);
    if (shareFeedbackTimerRef.current !== null) {
      window.clearTimeout(shareFeedbackTimerRef.current);
    }
    shareFeedbackTimerRef.current = window.setTimeout(() => {
      setShareFeedback('');
      shareFeedbackTimerRef.current = null;
    }, 2200);
  };

  const buildProductShareUrl = () => {
    if (typeof window === 'undefined') return '';
    const safeId = String(product.id || '')
      .trim()
      .split(/\s+/)[0]
      .replace(/[?#].*$/, '');
    return `${window.location.origin}/product/${encodeURIComponent(safeId)}`;
  };

  const copyShareLink = async (shareUrl: string) => {
    if (!shareUrl) throw new Error('Share URL not available');
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      return;
    }

    const helperInput = document.createElement('textarea');
    helperInput.value = shareUrl;
    helperInput.setAttribute('readonly', 'true');
    helperInput.style.position = 'absolute';
    helperInput.style.left = '-9999px';
    document.body.appendChild(helperInput);
    helperInput.select();
    document.execCommand('copy');
    document.body.removeChild(helperInput);
  };

  const handleShareClick = async () => {
    const shareUrl = buildProductShareUrl();
    const shareData = {
      title: product.name,
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showShareFeedback('Shared successfully');
        return;
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
      }
    }

    try {
      await copyShareLink(shareUrl);
      showShareFeedback('Product link copied');
    } catch {
      showShareFeedback('Unable to share');
    }
  };

  const handleWishlistToggle = async () => {
    try {
      if (isWishlisted) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product);
      }
    } catch (e: any) {
      if (e?.message === 'Not logged in') {
        alert('Please login to add this product to your wishlist.');
      }
    }
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    setIsProcessing(true);
    await onAddToCart(product, quantity);
    setIsProcessing(false);
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    setIsProcessing(true);
    await onAddToCart(product, quantity);
    setIsProcessing(false);

    window.history.pushState({}, '', '/checkout');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans md:pb-8">
      {shareFeedback && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[120] rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-md">
          {shareFeedback}
        </div>
      )}

      <div className="md:hidden">
        {/* Style block for scoped CSS */}
        <style dangerouslySetInnerHTML={{ __html: `
          .nk-prod-header {
            max-width: 450px;
            margin-left: auto;
            margin-right: auto;
          }
          .nk-prod-container {
            background-color: #ffffff;
            padding: 12px;
            /* bottom padding = fixed bar (~68px) + MobileBottomNav (~72px) + gap (16px) = 156px */
            padding-bottom: 160px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            max-width: 450px;
            margin-left: auto;
            margin-right: auto;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.02);
          }
          .nk-prod-media-container {
            position: relative;
            width: 100%;
            aspect-ratio: 1.15;
            background-color: #f9f9f9;
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #eaeaea;
          }
          .nk-prod-media-image {
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
          }
          .nk-prod-discount-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            background-color: #ffeef0;
            color: #e61c43;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 700;
            z-index: 10;
          }
          .nk-prod-metadata {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .nk-prod-brand {
            font-size: 11px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #555555;
            font-weight: 700;
          }
          .nk-prod-heading {
            font-size: 18px;
            line-height: 1.35;
            font-weight: 700;
            color: #111111;
          }
          .nk-prod-rating-row {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
          }
          .nk-prod-stars {
            color: #ffb800;
            letter-spacing: 1px;
          }
          .nk-prod-rating-text {
            color: #555555;
            font-size: 12px;
          }
          .nk-prod-price-card {
            background-color: #fdfafb;
            border: 1px solid #fcebeb;
            border-radius: 12px;
            padding: 14px 16px;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .nk-prod-price-row {
            display: flex;
            align-items: baseline;
            gap: 8px;
            flex-wrap: wrap;
          }
          .nk-prod-current-price {
            font-size: 22px;
            font-weight: 800;
            color: #e61c43;
          }
          .nk-prod-original-price {
            font-size: 14px;
            text-decoration: line-through;
            color: #767676;
          }
          .nk-prod-stock-badge {
            display: inline-flex;
            align-items: center;
            background-color: #eaf8f0;
            color: #27a857;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 4px;
            width: fit-content;
          }
          .nk-prod-qty-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: #fdfafb;
            border: 1px solid #fcebeb;
            border-radius: 12px;
            padding: 12px 16px;
          }
          .nk-prod-qty-label-wrapper {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .nk-prod-qty-label {
            font-size: 14px;
            font-weight: 700;
            color: #111111;
          }
          .nk-prod-qty-stock-info {
            font-size: 11px;
            color: #555555;
            font-weight: 500;
          }
          .nk-prod-qty-selector {
            display: flex;
            align-items: center;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background-color: #ffffff;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          }
          .nk-prod-qty-btn {
            width: 32px;
            height: 32px;
            border: none;
            background-color: #ffffff;
            font-size: 16px;
            font-weight: 600;
            color: #333333;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            user-select: none;
            transition: background-color 0.2s;
          }
          .nk-prod-qty-btn:active {
            background-color: #f0f0f0;
          }
          .nk-prod-qty-btn:disabled {
            color: #cccccc;
            background-color: #f7f7f7;
            cursor: not-allowed;
          }
          .nk-prod-qty-value {
            min-width: 36px;
            text-align: center;
            font-size: 13px;
            font-weight: 700;
            color: #111111;
          }
          .nk-prod-section {
            padding-top: 16px;
            padding-bottom: 16px;
            border-top: 1px solid #eaeaea;
          }
          .nk-prod-section:first-of-type {
            border-top: none;
          }
          .nk-prod-section-header {
            font-size: 15px;
            font-weight: 700;
            color: #111111;
            padding-left: 8px;
            border-left: 3.5px solid #2ca5e0;
            margin-bottom: 12px;
            line-height: 1.2;
          }
          .nk-prod-features-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .nk-prod-features-list li {
            position: relative;
            padding-left: 20px;
            font-size: 13px;
            color: #444444;
            line-height: 1.4;
          }
          .nk-prod-features-list li::before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #27a857;
            font-weight: bold;
          }
          .nk-prod-desc-text {
            font-size: 13px;
            line-height: 1.6;
            text-align: justify;
            color: #444444;
          }
          .nk-prod-qa-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .nk-prod-qa-card {
            background-color: #f7f9fa;
            border: 1px solid #edf1f2;
            border-radius: 8px;
            padding: 12px;
          }
          .nk-prod-question {
            font-weight: 700;
            font-size: 13px;
            color: #1a1a1a;
            margin-bottom: 4px;
          }
          .nk-prod-answer {
            font-size: 13px;
            color: #555555;
            line-height: 1.4;
          }
          .nk-prod-review-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .nk-prod-review-card {
            background-color: #ffffff;
            border: 1px solid #eaeaea;
            border-radius: 8px;
            padding: 12px;
          }
          .nk-prod-review-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
          }
          .nk-prod-reviewer-name {
            font-weight: 700;
            font-size: 13px;
            color: #111111;
          }
          .nk-prod-review-date {
            font-size: 11px;
            color: #999999;
          }
          .nk-prod-review-stars {
            color: #ffb800;
            font-size: 12px;
            margin-top: 2px;
          }
          .nk-prod-review-text {
            font-size: 13px;
            color: #444444;
            line-height: 1.5;
            margin-top: 6px;
          }
          /* ── Fixed sticky bottom action bar ── */
          .nk-prod-action-bar {
            position: fixed;
            /* Sit above MobileBottomNav: h-16(64px) + mb-2(8px) = 72px total */
            bottom: calc(72px + env(safe-area-inset-bottom, 0px));
            left: 0;
            right: 0;
            width: 100%;
            background-color: #ffffff;
            border-top: 1px solid #e8e8e8;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.09);
            padding: 10px 12px;
            padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
            z-index: 50;
            display: flex;
            gap: 10px;
            align-items: center;
            box-sizing: border-box;
            transition: transform 0.25s ease, opacity 0.25s ease;
          }
          .nk-prod-action-bar.hidden-bar {
            transform: translateY(calc(100% + 8px));
            opacity: 0;
            pointer-events: none;
          }
          .nk-prod-action-bar-total {
            display: flex;
            flex-direction: column;
            min-width: 80px;
            flex-shrink: 0;
          }
          .nk-prod-action-bar-total-label {
            font-size: 10px;
            color: #888888;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .nk-prod-action-bar-total-price {
            font-size: 16px;
            font-weight: 800;
            color: #e61c43;
            line-height: 1.1;
          }
          .nk-prod-action-bar-btns {
            display: flex;
            flex: 1;
            gap: 8px;
          }
          .nk-prod-btn {
            flex: 1;
            height: 46px;
            border-radius: 23px;
            border: none;
            font-size: 14px;
            font-weight: 800;
            color: #ffffff;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: opacity 0.15s ease, transform 0.1s ease;
            white-space: nowrap;
          }
          .nk-prod-btn:active {
            transform: scale(0.97);
            opacity: 0.88;
          }
          .nk-prod-btn:disabled {
            background-color: #d1d5db !important;
            color: #9ca3af !important;
            cursor: not-allowed;
          }
          .nk-prod-btn-buy {
            background-color: #2ca5e0;
          }
          .nk-prod-btn-buy:hover:not(:disabled) {
            background-color: #1d95cc;
          }
          .nk-prod-btn-cart {
            background-color: #e61c43;
          }
          .nk-prod-btn-cart:hover:not(:disabled) {
            background-color: #c8102e;
          }
        ` }} />

        {/* Sticky top navigation header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 nk-prod-header">
          <div className="px-3 pt-3 pb-2 flex items-start gap-2.5">
            <button
              onClick={onClose}
              className="h-11 w-11 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center flex-shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="text-[18px] leading-[1.15] font-black text-gray-900 line-clamp-2">{product.name}</h1>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-500 font-bold line-clamp-1">
                {product.brand || 'NOKLITY'} · {product.category || 'Product'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareClick}
                className="h-11 w-11 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center"
                aria-label="Share product"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleWishlistToggle}
                className={`h-11 w-11 rounded-full flex items-center justify-center ${
                  isWishlisted ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
                aria-label="Toggle wishlist"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        {/* Updated Inner Content Area */}
        <div className="nk-prod-container">
          {/* Product Media Display */}
          <div className="relative">
            <button
              type="button"
              onClick={openImageViewer}
              className="w-full nk-prod-media-container block text-left"
              onTouchStart={handleMainImageTouchStart}
              onTouchMove={handleMainImageTouchMove}
              onTouchEnd={handleMainImageTouchEnd}
              aria-label="Open image viewer"
            >
              {discountPercentage > 0 && (
                <span className="nk-prod-discount-badge">-{discountPercentage}% off</span>
              )}
              <OptimizedImage
                src={activeImage}
                alt={product.name}
                className="nk-prod-media-image mx-auto"
                width={640}
                height={640}
                responsiveWidths={PRODUCT_DETAIL_SAFE_WIDTHS}
                sizes="100vw"
                loading="eager"
              />
            </button>
            
            {galleryImages.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                {galleryImages.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === activeImageIndex ? 'bg-primary w-4' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Metadata & Price Block */}
          <div className="nk-prod-metadata">
            <div className="nk-prod-brand">
              {product.brand || 'NOKLITY'} • {product.category || 'Product'}
            </div>
            <h2 className="nk-prod-heading">{product.name}</h2>
            <div className="nk-prod-rating-row" aria-label={`${product.rating.toFixed(1)} out of 5 stars`}>
              <span className="nk-prod-stars" role="img" aria-label={`${product.rating.toFixed(0)} stars`}>
                {'★'.repeat(Math.round(product.rating || 0)) + '☆'.repeat(5 - Math.round(product.rating || 0))}
              </span>
              <span className="nk-prod-rating-text">({product.rating.toFixed(1)}/5 ratings)</span>
            </div>
          </div>

          <div className="nk-prod-price-card">
            <div className="nk-prod-price-row">
              <span className="nk-prod-current-price">{formatCurrency(product.price)}</span>
              {product.originalPrice && (
                <span className="nk-prod-original-price">{formatCurrency(product.originalPrice)}</span>
              )}
            </div>
            <div 
              className="nk-prod-stock-badge"
              style={isOutOfStock ? { backgroundColor: '#ffeef0', color: '#e61c43' } : undefined}
            >
              {isOutOfStock ? 'Out of Stock' : 'In Stock'}
            </div>
          </div>

          {/* Quantity Selector Block */}
          <div className="nk-prod-qty-container">
            <div className="nk-prod-qty-label-wrapper">
              <span className="nk-prod-qty-label">Quantity</span>
              <span className="nk-prod-qty-stock-info">
                {isOutOfStock ? "Out of Stock" : `(${maxStock} units available)`}
              </span>
            </div>
            <div className="nk-prod-qty-selector">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                disabled={quantity <= 1 || isOutOfStock}
                className="nk-prod-qty-btn"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="nk-prod-qty-value">{quantity}</span>
              <button
                onClick={() => setQuantity((prev) => Math.min(maxStock, prev + 1))}
                disabled={quantity >= maxStock || isOutOfStock}
                className="nk-prod-qty-btn"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Dynamic Specifications Block */}
          <section className="nk-prod-section">
            <h3 className="nk-prod-section-header">Specifications</h3>
            {Object.keys(specs).length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs py-1.5 border-b border-gray-100 last:border-0">
                    <span className="font-semibold text-gray-500">{key}</span>
                    <span className="font-bold text-gray-900 text-right">{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 font-medium">No specifications specified.</p>
            )}
          </section>

          {/* Dynamic Product Description */}
          <section className="nk-prod-section">
            <h3 className="nk-prod-section-header">Product Description</h3>
            <p className="nk-prod-desc-text whitespace-pre-line">
              {product.description || 'No description available for this product.'}
            </p>
          </section>

          {/* Dynamic Q&A Section */}
          {productFaqItems.length > 0 && (
            <section className="nk-prod-section">
              <h3 className="nk-prod-section-header">Q&A Section</h3>
              <dl className="nk-prod-qa-list">
                {productFaqItems.map((item, index) => (
                  <div key={index} className="nk-prod-qa-card">
                    <dt className="nk-prod-question">Q: {item.question}</dt>
                    <dd className="nk-prod-answer">A: {item.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Dynamic Reviews & Ratings */}
          <section className="nk-prod-section">
            <h3 className="nk-prod-section-header">Reviews & Ratings</h3>
            {isLoadingMobileReviews ? (
              <p className="text-xs font-semibold text-gray-400">Loading reviews...</p>
            ) : mobileReviews.length > 0 ? (
              <div className="nk-prod-review-list">
                {mobileReviews.map((review) => (
                  <article key={review.id} className="nk-prod-review-card">
                    <div className="nk-prod-review-header">
                      <span className="nk-prod-reviewer-name">{review.reviewer_name || 'Anonymous'}</span>
                      <span className="nk-prod-review-date">
                        {new Date(review.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="nk-prod-review-stars" role="img" aria-label={`${review.rating} stars`}>
                      {'★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)}
                    </div>
                    {review.comment && (
                      <p className="nk-prod-review-text">{review.comment}</p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 font-medium">No reviews yet for this product.</p>
            )}
          </section>
        </div>
      </div>

      <div className="hidden md:block bg-gray-100 border-t border-gray-200">
        <div className="max-w-[1240px] mx-auto px-4 lg:px-6 py-5 md:py-6">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 text-sm font-black text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </button>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold">
            <button
              type="button"
              onClick={() => (onHomeClick ? onHomeClick() : onClose())}
              className="text-gray-500 hover:text-primary transition-colors"
            >
              Home
            </button>
            <span className="text-gray-300">/</span>
            <button
              type="button"
              onClick={() => onCategoryClick?.(product.category || '')}
              className="text-gray-500 hover:text-primary transition-colors"
            >
              {product.category || 'Products'}
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700 line-clamp-1">{product.name}</span>
          </div>

          <div className="mt-3 rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-4 p-4 lg:p-5 border-b lg:border-b-0 lg:border-r border-gray-200">
                <button
                  type="button"
                  onClick={openImageViewer}
                  className="group relative w-full border border-gray-200 rounded-lg bg-white overflow-hidden cursor-zoom-in transition-[aspect-ratio] duration-300"
                  style={{ aspectRatio: `${contentImageAspectRatio}` }}
                  aria-label="Open image viewer"
                >
                  <OptimizedImage
                    src={activeImage}
                    alt={product.name}
                    className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-110"
                    width={1200}
                    height={1200}
                    responsiveWidths={PRODUCT_DETAIL_SAFE_WIDTHS}
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    loading="eager"
                  />
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to zoom
                  </span>
                </button>

                <div className="mt-3 bg-[rgb(var(--color-accent-rgb))] text-white text-lg font-black px-4 py-2.5 rounded-md line-clamp-1">
                  {product.name}
                </div>

                <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                  {galleryImages.map((image, index) => (
                    <button
                      key={`${image}-desktop-${index}`}
                      onClick={() => setActiveImageIndex(index)}
                      className={`w-14 h-14 rounded border overflow-hidden flex-shrink-0 ${
                        index === activeImageIndex ? 'border-primary ring-1 ring-primary/30' : 'border-gray-200'
                      }`}
                    >
                      <OptimizedImage
                        src={image}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-contain p-1.5 bg-white"
                        width={120}
                        height={120}
                        responsiveWidths={[400, 800]}
                        sizes="56px"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-8 p-4 lg:p-5">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-[34px] leading-tight font-medium text-gray-900">{product.name}</h1>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleShareClick}
                      className="h-9 w-9 rounded-full border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 flex items-center justify-center"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleWishlistToggle}
                      className={`h-9 w-9 rounded-full border flex items-center justify-center ${
                        isWishlisted
                          ? 'border-red-200 bg-red-50 text-red-500'
                          : 'border-gray-200 text-gray-500 hover:text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1 text-yellow-500">
                    {[...Array(5)].map((_, index) => (
                      <Star key={index} className={`w-4 h-4 ${index < Math.round(product.rating || 0) ? 'fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="font-semibold text-blue-600">Ratings</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500">
                    Brand: <span className="text-blue-600 font-semibold">{product.brand || 'NOKLITY'}</span>
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-end gap-3">
                    <span className="text-5xl font-medium text-primary leading-none">{formatCurrency(product.price)}</span>
                    {product.originalPrice && (
                      <span className="text-2xl text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span>
                    )}
                    {discountPercentage > 0 && (
                      <span className="rounded-md bg-red-50 px-2 py-1 text-sm font-bold text-primary">-{discountPercentage}%</span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-gray-200">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500 font-medium min-w-28">Product Options</span>
                    <span className="font-semibold text-gray-900">{product.modelNumber || 'Not specified'}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <span className="text-gray-500 font-medium min-w-28">Quantity</span>
                  <div className="inline-flex items-center border border-gray-200 rounded overflow-hidden">
                    <button
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      disabled={quantity <= 1}
                      className="h-10 w-10 text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="h-10 min-w-[52px] px-3 flex items-center justify-center text-sm font-black text-gray-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((prev) => Math.min(maxStock, prev + 1))}
                      disabled={quantity >= maxStock}
                      className="h-10 w-10 text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <span className={`text-xs font-bold ${isOutOfStock ? 'text-red-600' : 'text-green-700'}`}>
                    {isOutOfStock ? 'Out of stock' : `${maxStock} available`}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={handleBuyNow}
                  disabled={isProcessing || isOutOfStock}
                  className="h-12 rounded-md bg-[#22a6df] text-white font-black text-lg leading-none hover:bg-[#1d95c7] transition-colors disabled:bg-gray-300 disabled:text-gray-500"
                >
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={isProcessing || isOutOfStock}
                  className="h-12 rounded-md bg-primary text-white font-black text-lg leading-none hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500"
                >
                  Add to Cart
                </button>
                </div>
              </div>

            </div>
          </div>

          <ProductTabs
            productId={product.id}
            description={product.description || 'No description available.'}
            specs={specs}
            faqText={product.faqText || ''}
          />
        </div>
      </div>

      {isImageViewerOpen && (
        <div className="fixed inset-0 z-[140] bg-black/90">
          <button
            type="button"
            onClick={closeImageViewer}
            className="absolute inset-0"
            aria-label="Close image viewer"
          />

          <div className="relative z-10 h-full w-full flex flex-col">
            <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-b border-white/15">
              <p className="text-xs sm:text-sm font-bold text-white/90">
                Image {activeImageIndex + 1} of {galleryImages.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="h-9 w-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="h-9 w-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={closeImageViewer}
                  className="h-9 w-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                  aria-label="Close viewer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              className="relative flex-1 flex items-center justify-center px-4 py-4 sm:py-6"
              onWheel={handleViewerWheel}
              onTouchStart={handleViewerTouchStart}
              onTouchEnd={handleViewerTouchEnd}
            >
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <OptimizedImage
                src={activeImage}
                alt={product.name}
                onClick={handleImageTapZoom}
                className="max-h-[calc(100vh-150px)] sm:max-h-[calc(100vh-170px)] max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-5rem)] object-contain transition-transform duration-150 cursor-zoom-in select-none"
                style={{ transform: `scale(${previewZoom})` }}
                width={1600}
                height={1600}
                responsiveWidths={PRODUCT_DETAIL_SAFE_WIDTHS}
                sizes="100vw"
                loading="eager"
              />
            </div>

            {galleryImages.length > 1 && (
              <div className="px-3 sm:px-5 pb-3 sm:pb-4">
                <div className="flex gap-2 overflow-x-auto">
                  {galleryImages.map((image, index) => (
                    <button
                      key={`${image}-fullscreen-${index}`}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className={`w-14 h-14 rounded-md border overflow-hidden flex-shrink-0 ${
                        index === activeImageIndex ? 'border-primary ring-1 ring-primary/40' : 'border-white/30'
                      }`}
                    >
                      <OptimizedImage
                        src={image}
                        alt={`Image ${index + 1}`}
                        className="w-full h-full object-cover"
                        width={120}
                        height={120}
                        responsiveWidths={[400, 800]}
                        sizes="56px"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile Fixed Bottom Action Bar ── */}
      {/* Hidden on md+. Sits above MobileBottomNav (z-65). Smooth show/hide on scroll. */}
      <div
        className={`md:hidden nk-prod-action-bar${!isMobileActionBarVisible ? ' hidden-bar' : ''}${
          isImageViewerOpen ? ' hidden-bar' : ''
        }`}
        aria-hidden={isImageViewerOpen}
      >
        {/* Total price preview */}
        <div className="nk-prod-action-bar-total">
          <span className="nk-prod-action-bar-total-label">Total</span>
          <span className="nk-prod-action-bar-total-price">{formatCurrency(mobileActionTotal)}</span>
        </div>

        {/* Action buttons */}
        <div className="nk-prod-action-bar-btns">
          <button
            onClick={handleBuyNow}
            disabled={isProcessing || isOutOfStock}
            className="nk-prod-btn nk-prod-btn-buy"
            aria-label="Buy Now"
          >
            {isProcessing ? '...' : 'Buy Now'}
          </button>
          <button
            onClick={handleAddToCart}
            disabled={isProcessing || isOutOfStock}
            className="nk-prod-btn nk-prod-btn-cart"
            aria-label="Add to Cart"
          >
            {isProcessing ? '...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
