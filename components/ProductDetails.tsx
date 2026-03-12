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
  const shareFeedbackTimerRef = useRef<number | null>(null);
  const mainImageTouchStartXRef = useRef<number | null>(null);
  const mainImageTouchCurrentXRef = useRef<number | null>(null);
  const mainImageSwipingRef = useRef(false);
  const viewerTouchStartXRef = useRef<number | null>(null);
  const viewerTouchStartYRef = useRef<number | null>(null);

  const maxStock = typeof product?.stock === 'number' ? Math.max(0, Number(product.stock)) : 20;
  const isOutOfStock = maxStock <= 0;

  useEffect(() => {
    if (product) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      setQuantity(1);
      setActiveImageIndex(0);
      setIsImageViewerOpen(false);
      setPreviewZoom(1);
    }
  }, [product]);

  useEffect(() => {
    return () => {
      if (shareFeedbackTimerRef.current !== null) {
        window.clearTimeout(shareFeedbackTimerRef.current);
      }
    };
  }, []);

  if (!product) return null;

  const specs = getProductSpecs(product);
  const compatibilityList = product.compatibility || [];
  const cleanedImages = [product.image, ...(product.images || [])].filter(Boolean);
  const uniqueImages = Array.from(new Set(cleanedImages));
  const galleryImages = uniqueImages.length > 0 ? uniqueImages : [product.image];

  const activeImage = galleryImages[Math.min(activeImageIndex, galleryImages.length - 1)] || product.image;
  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const isWishlisted = isInWishlist(product.id);
  const deliveryChargeValue = Number(
    product.deliveryCharge || product.defaultDeliveryFee || product.deliveryCharges?.Dhaka || 0
  );
  const baseDeliveryFeeValue = Number(product.defaultDeliveryFee || 0);
  const taxPercent = Number(product.taxPercent || 0);

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
    <div className="min-h-screen bg-gray-100 font-sans pb-24 md:pb-8">
      {shareFeedback && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[120] rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-md">
          {shareFeedback}
        </div>
      )}

      <div className="md:hidden">
        <div className="bg-white border-b border-gray-200">
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

          <div className="px-3 pb-3">
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
              <div className="aspect-[1/1] bg-white">
                <button
                  type="button"
                  onClick={() => {
                    if (mainImageSwipingRef.current) {
                      mainImageSwipingRef.current = false;
                      return;
                    }
                    openImageViewer();
                  }}
                  onTouchStart={handleMainImageTouchStart}
                  onTouchMove={handleMainImageTouchMove}
                  onTouchEnd={handleMainImageTouchEnd}
                  className="relative group w-full h-full"
                  aria-label="View full image"
                >
                  <OptimizedImage
                    src={activeImage}
                    alt={product.name}
                    className="w-full h-full object-contain p-4"
                    width={900}
                    responsiveWidths={[360, 540, 720, 900]}
                    quality={88}
                    loading="eager"
                  />
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white opacity-90">
                    Tap to zoom
                  </span>
                </button>
              </div>
            </div>

            {galleryImages.length > 1 && (
              <div className="mt-2.5 overflow-x-auto">
                <div className="flex gap-2">
                  {galleryImages.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      onClick={() => setActiveImageIndex(index)}
                      className={`w-14 h-14 rounded-lg border overflow-hidden flex-shrink-0 ${
                        index === activeImageIndex ? 'border-primary ring-1 ring-primary/30' : 'border-gray-200'
                      }`}
                    >
                      <OptimizedImage
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full h-full object-contain p-1.5 bg-white"
                        width={120}
                        responsiveWidths={[80, 120]}
                        quality={82}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-3 py-3 space-y-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-primary leading-none">{formatCurrency(product.price)}</span>
              {product.originalPrice && (
                <span className="text-sm text-gray-400 line-through font-bold">{formatCurrency(product.originalPrice)}</span>
              )}
              {discountPercentage > 0 && (
                <span className="ml-auto rounded-md bg-red-50 px-2 py-1 text-[11px] font-black text-primary">-{discountPercentage}%</span>
              )}
            </div>

            <p className="mt-2 text-xl font-black text-gray-900 leading-tight">{product.name}</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, index) => (
                  <Star key={index} className={`w-3.5 h-3.5 ${index < Math.round(product.rating || 0) ? 'fill-current' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="font-bold">{(product.rating || 0).toFixed(1)}</span>
              <span className="text-gray-300">|</span>
              <span className="font-semibold text-blue-600">{product.brand || 'NOKLITY'}</span>
            </div>

            <div className="mt-4">
              <p className="text-xs uppercase tracking-widest text-gray-500 font-black">Quantity</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="inline-flex items-center rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                    className="h-10 w-10 bg-gray-50 text-gray-700 disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="h-10 min-w-[52px] px-3 flex items-center justify-center text-sm font-black text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity((prev) => Math.min(maxStock, prev + 1))}
                    disabled={quantity >= maxStock}
                    className="h-10 w-10 bg-gray-50 text-gray-700 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <span className={`text-xs font-bold ${isOutOfStock ? 'text-red-600' : 'text-green-700'}`}>
                  {isOutOfStock ? 'Out of stock' : `${maxStock} available`}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2.5">
            <h3 className="text-xs uppercase tracking-widest text-gray-500 font-black">Delivery & Warranty</h3>
            <p className="text-sm font-bold text-gray-800">Delivery Charge: {formatCurrency(deliveryChargeValue)}</p>
            <p className="text-sm font-bold text-gray-800">Base Delivery Fee: {formatCurrency(baseDeliveryFeeValue)}</p>
            <p className="text-sm font-bold text-gray-800">Tax: {taxPercent.toFixed(2)}%</p>
            <p className="text-sm font-bold text-gray-800">Warranty: {product.warranty || `${product.warrantyMonths || 0} months`}</p>
            {product.shippingInfo && <p className="text-xs text-gray-600">{product.shippingInfo}</p>}
            {product.returnPolicy && <p className="text-xs text-gray-600">Return policy: {product.returnPolicy}</p>}
          </div>

          {compatibilityList.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <h3 className="text-xs uppercase tracking-widest text-gray-500 font-black mb-2.5">Compatibility</h3>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {compatibilityList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <ProductTabs description={product.description || 'No description available.'} specs={specs} />
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
                  className="group relative aspect-square w-full border border-gray-200 rounded-lg bg-white overflow-hidden cursor-zoom-in"
                  aria-label="Open image viewer"
                >
                  <OptimizedImage
                    src={activeImage}
                    alt={product.name}
                    className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-110"
                    width={1200}
                    responsiveWidths={[480, 720, 960, 1200]}
                    quality={90}
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
                        responsiveWidths={[80, 120]}
                        quality={82}
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
                  Checkout
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

          <ProductTabs description={product.description || 'No description available.'} specs={specs} />
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
                responsiveWidths={[640, 960, 1280, 1600]}
                quality={92}
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
                        responsiveWidths={[80, 120]}
                        quality={80}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-50 shadow-[0_-6px_20px_rgba(15,23,42,0.08)]">
        {isOutOfStock && (
          <p className="mb-2 text-[11px] font-bold text-red-600 text-center">This item is currently out of stock</p>
        )}
        <div className="mb-2 flex items-center justify-between text-[11px] text-gray-500 font-bold">
          <span>Selected: {quantity}</span>
          <span className={isOutOfStock ? 'text-red-600' : 'text-green-700'}>
            {isOutOfStock ? 'Out of stock' : `${maxStock} available`}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleBuyNow}
            disabled={isProcessing || isOutOfStock}
            className="h-12 rounded-xl bg-[#22a6df] text-white text-sm font-black active:scale-[0.98] transition-transform disabled:bg-gray-300 disabled:text-gray-500 inline-flex items-center justify-center"
          >
            Checkout
          </button>
          <button
            onClick={handleAddToCart}
            disabled={isProcessing || isOutOfStock}
            className="h-12 rounded-xl bg-primary text-white text-sm font-black active:scale-[0.98] transition-transform disabled:bg-gray-300 disabled:text-gray-500 inline-flex items-center justify-center"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
