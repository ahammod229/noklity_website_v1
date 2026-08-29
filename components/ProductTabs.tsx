
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, HelpCircle, Loader2, MessageSquare, Star, UserRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { normalizeProductFaqItems } from '../utils/productFaq';

interface ProductTabsProps {
  productId: string;
  description: string;
  specs: Record<string, string>;
  faqText?: string;
}

interface ApprovedReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  user?: {
    display_name?: string | null;
    full_name?: string | null;
  } | null;
}

const ProductTabs: React.FC<ProductTabsProps> = ({ productId, description, specs, faqText }) => {
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'faq' | 'reviews'>('desc');
  const [reviews, setReviews] = useState<ApprovedReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);
  const normalizedDescription = String(description || '').replace(/\r\n/g, '\n').trim();
  const hasSpecs = Object.keys(specs || {}).length > 0;
  const faqItems = useMemo(() => normalizeProductFaqItems(faqText), [faqText]);

  useEffect(() => {
    const loadApprovedReviews = async () => {
      if (!productId || activeTab !== 'reviews' || reviewsLoaded) return;

      setReviewsLoading(true);
      setReviewsError(null);

      const { data, error } = await supabase
        .from('product_reviews')
        .select('id,rating,title,comment,created_at,user:users(display_name)')
        .eq('product_id', productId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        setReviewsError(error.message || 'Unable to load product reviews right now.');
        setReviewsLoading(false);
        setReviewsLoaded(true);
        return;
      }

      setReviews((data || []) as ApprovedReview[]);
      setReviewsLoading(false);
      setReviewsLoaded(true);
    };

    void loadApprovedReviews();
  }, [activeTab, productId, reviewsLoaded]);

  useEffect(() => {
    setReviews([]);
    setReviewsLoaded(false);
    setReviewsError(null);
  }, [productId]);

  useEffect(() => {
    setOpenFaqIndex(0);
  }, [faqText, productId]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
  }, [reviews]);

  const formatReviewDate = (value: string) => {
    try {
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return value;
    }
  };

  return (
    <div className="mt-8 bg-gray-50 rounded-2xl p-4 md:p-6">
      {/* Tab Header */}
      <div className="flex gap-5 border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setActiveTab('desc')}
          className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${
            activeTab === 'desc' 
            ? 'text-primary border-b-2 border-primary' 
            : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          Description
        </button>
        <button 
          onClick={() => setActiveTab('specs')}
          className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${
            activeTab === 'specs' 
            ? 'text-primary border-b-2 border-primary' 
            : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          Specifications
        </button>
        <button 
          onClick={() => setActiveTab('faq')}
          className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${
            activeTab === 'faq' 
            ? 'text-primary border-b-2 border-primary' 
            : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          FAQ
        </button>
        <button 
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${
            activeTab === 'reviews' 
            ? 'text-primary border-b-2 border-primary' 
            : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          Reviews
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'desc' && (
          <div className="text-gray-700 leading-8 text-sm animate-in fade-in slide-in-from-bottom-2">
            {!normalizedDescription ? (
              <p className="text-gray-500">No description available.</p>
            ) : (
              <div className="text-gray-800 whitespace-pre-wrap break-words">
                {normalizedDescription}
              </div>
            )}
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            {hasSpecs ? (
              <table className="w-full text-sm text-left">
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(specs).map(([key, value]) => (
                    <tr key={key} className="group hover:bg-gray-100/50">
                      <td className="py-3 px-4 font-bold text-gray-500 bg-gray-100/30 w-1/3 rounded-l-lg">{key}</td>
                      <td className="py-3 px-4 text-gray-800 rounded-r-lg">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500">No specifications available.</p>
            )}
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            {faqItems.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center">
                <HelpCircle className="mb-4 h-10 w-10 text-gray-300" />
                <p className="text-lg font-black text-gray-900">No FAQs yet</p>
                <p className="mt-2 max-w-md text-sm font-medium text-gray-500">
                  Product questions and answers will appear here once they are added from admin.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {faqItems.map((item, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div key={`${item.question}-${index}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex((prev) => (prev === index ? -1 : index))}
                        className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left sm:px-5"
                      >
                        <span className="text-sm font-black leading-6 text-gray-900 sm:text-base">
                          {item.question}
                        </span>
                        <ChevronDown
                          className={`mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400 transition-transform ${
                            isOpen ? 'rotate-180 text-primary' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="border-t border-gray-100 px-4 py-4 text-sm font-medium leading-7 text-gray-600 sm:px-5">
                          <div className="whitespace-pre-wrap break-words">{item.answer}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            {reviewsLoading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm font-semibold">Loading customer reviews...</p>
                </div>
              </div>
            ) : reviewsError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-center text-sm font-semibold text-red-700">
                {reviewsError}
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center">
                <MessageSquare className="mb-4 h-10 w-10 text-gray-300" />
                <p className="text-lg font-black text-gray-900">No reviews yet</p>
                <p className="mt-2 max-w-md text-sm font-medium text-gray-500">
                  Customer reviews for this product will appear here after they are submitted.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 md:grid-cols-[220px,1fr] md:p-6">
                  <div className="rounded-2xl bg-gray-50 px-5 py-6 text-center">
                    <p className="text-4xl font-black text-gray-900">{averageRating.toFixed(1)}</p>
                    <div className="mt-3 flex items-center justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
                      {reviews.length} Approved Review{reviews.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <article key={review.id} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm ring-1 ring-gray-100">
                              <UserRound className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900">
                                {review.user?.display_name?.trim() || review.user?.full_name?.trim() || 'Verified Customer'}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-gray-400">
                                {formatReviewDate(review.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                              />
                            ))}
                          </div>
                        </div>

                        {review.title && (
                          <h4 className="mt-4 text-base font-black text-gray-900">{review.title}</h4>
                        )}
                        {review.comment && (
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium leading-7 text-gray-600">
                            {review.comment}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductTabs;
