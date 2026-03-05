
import React, { useEffect, useRef, useState } from 'react';
import { Star, Share2, Heart, ShieldCheck } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext';
import { useTenantConfig } from '../contexts/TenantConfigContext';
import { Product } from '../types';
import { useCurrency } from '../hooks/useCurrency';

interface ProductPriceBlockProps {
  product: Product;
}

const ProductPriceBlock: React.FC<ProductPriceBlockProps> = ({ product }) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { config: tenantConfig } = useTenantConfig();
  const { formatCurrency } = useCurrency();
  const [shareFeedback, setShareFeedback] = useState('');
  const shareFeedbackTimerRef = useRef<number | null>(null);
  
  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  const isWishlisted = isInWishlist(product.id);
  const brandLabel = product.brand || tenantConfig.brandName || 'Storefront';

  useEffect(() => {
    return () => {
      if (shareFeedbackTimerRef.current !== null) {
        window.clearTimeout(shareFeedbackTimerRef.current);
      }
    };
  }, []);

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
        if (error?.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      await copyShareLink(shareUrl);
      showShareFeedback('Product link copied');
    } catch {
      showShareFeedback('Unable to share');
    }
  };

  const handleWishlistClick = async () => {
    try {
      if (isWishlisted) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product);
      }
    } catch (e: any) {
      if (e.message === 'Not logged in') {
        alert('Please login to add to wishlist');
        // Ideally trigger login modal or navigation here
      }
    }
  };

  return (
    <div className="space-y-4 pb-6 border-b border-gray-100">
      {/* Title & Actions */}
      <div className="flex justify-between items-start gap-4">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
          {product.name}
        </h1>
        <div className="relative flex gap-2 flex-shrink-0">
          <button
            onClick={handleShareClick}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
            aria-label="Share product"
            title="Share product"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button 
            onClick={handleWishlistClick}
            className={`p-2 rounded-full transition-all ${
              isWishlisted 
              ? 'text-red-500 bg-red-50 hover:bg-red-100' 
              : 'text-gray-400 hover:text-primary hover:bg-red-50'
            }`}
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
          {shareFeedback && (
            <div className="absolute top-full right-0 mt-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-bold text-gray-700 shadow-sm whitespace-nowrap">
              {shareFeedback}
            </div>
          )}
        </div>
      </div>

      {/* Meta: Ratings & Brand */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.rating) ? 'fill-current' : 'text-gray-200'}`} />
            ))}
          </div>
          <span className="text-blue-600 hover:underline cursor-pointer ml-1 font-medium">124 Ratings</span>
        </div>
        <span className="text-gray-300">|</span>
        <div className="text-gray-500">
          Brand: <span className="text-blue-600 hover:underline cursor-pointer font-medium">{brandLabel}</span>
        </div>
      </div>

      {/* Price Section */}
      <div className="pt-2">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-black text-primary tracking-tight">
            {formatCurrency(product.price)}
          </span>
          {discountPercentage > 0 && (
            <span className="bg-red-100 text-primary text-xs font-bold px-2 py-1 rounded">
              -{discountPercentage}%
            </span>
          )}
        </div>
        {product.originalPrice && (
          <p className="text-sm text-gray-400 line-through mt-1">
            {formatCurrency(product.originalPrice)}
          </p>
        )}
      </div>
      
      {/* Protection/Trust */}
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg inline-block">
        <ShieldCheck className="w-4 h-4 text-green-600" />
        <span>100% Authentic Guarantee</span>
      </div>
    </div>
  );
};

export default ProductPriceBlock;
