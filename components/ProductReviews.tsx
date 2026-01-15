import React, { useState } from 'react';
import { Star, CheckCircle2, User, ChevronDown, Plus, MessageSquare, ThumbsUp } from 'lucide-react';

interface Review {
  id: string;
  name: string;
  rating: number;
  date: string;
  title: string;
  text: string;
  verified: boolean;
  likes: number;
}

const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    name: 'Michael R.',
    rating: 5,
    date: '2 days ago',
    title: 'Absolute Game Changer',
    text: 'Installed these on my BMW and the difference is night and day. Incredible stopping power and zero fade even under heavy use. Highly recommended for performance builds.',
    verified: true,
    likes: 12
  },
  {
    id: 'r2',
    name: 'Sarah L.',
    rating: 4,
    date: '1 week ago',
    title: 'Premium Quality',
    text: 'The build quality is exceptional. You can tell these aren\'t your average parts. Shipping was a bit delayed, but the customer support was very helpful throughout.',
    verified: true,
    likes: 5
  },
  {
    id: 'r3',
    name: 'James T.',
    rating: 5,
    date: '2 weeks ago',
    title: 'Exactly what I needed',
    text: 'Perfect fitment and the performance gain is noticeable immediately. Noklity remains my go-to for genuine performance parts.',
    verified: true,
    likes: 8
  }
];

const ProductReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const averageRating = 4.8;
  const totalReviews = 124;

  const ratingDistribution = [
    { stars: 5, count: 85, color: 'bg-green-500' },
    { stars: 4, count: 25, color: 'bg-green-400' },
    { stars: 3, count: 10, color: 'bg-yellow-400' },
    { stars: 2, count: 3, color: 'bg-orange-400' },
    { stars: 1, count: 1, color: 'bg-red-400' },
  ];

  return (
    <div className="mt-12 pt-12 border-t border-gray-100 animate-in fade-in duration-700">
      <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        Customer Reviews
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
        {/* Rating Summary */}
        <div className="lg:col-span-1 p-6 bg-gray-50 rounded-3xl border border-gray-100 shadow-sm h-fit">
          <div className="text-center mb-6">
            <span className="text-5xl font-black text-gray-900">{averageRating}</span>
            <div className="flex justify-center gap-1 my-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Based on {totalReviews} Reviews
            </p>
          </div>

          <div className="space-y-3">
            {ratingDistribution.map((dist) => (
              <div key={dist.stars} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-600 w-4">{dist.stars}★</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`${dist.color} h-full rounded-full transition-all duration-1000`} 
                    style={{ width: `${(dist.count / totalReviews) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 font-medium w-8">{dist.count}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setShowForm(!showForm)}
            className="w-full mt-8 bg-white border border-gray-200 text-gray-900 font-bold py-3 rounded-2xl hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {showForm ? 'Cancel' : (
              <>
                <Plus className="w-4 h-4" />
                Write a Review
              </>
            )}
          </button>
        </div>

        {/* Review Form (Expandable) */}
        <div className={`lg:col-span-2 space-y-8 ${showForm ? 'block' : 'hidden'}`}>
          <div className="p-8 border-2 border-dashed border-gray-200 rounded-3xl bg-white animate-in slide-in-from-top-4 duration-300">
            <h4 className="text-lg font-bold text-gray-900 mb-6">Share your experience</h4>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Overall Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setNewRating(star)}
                      className="transition-transform active:scale-90"
                    >
                      <Star 
                        className={`w-8 h-8 ${
                          star <= (hoverRating || newRating) 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-200 fill-transparent'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Review Title</label>
                  <input 
                    type="text" 
                    placeholder="Example: Outstanding performance!" 
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-sm font-medium"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Detailed Review</label>
                  <textarea 
                    rows={4} 
                    placeholder="Tell us what you liked or disliked..." 
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-sm font-medium resize-none"
                  />
                </div>
              </div>

              <button 
                onClick={() => setShowForm(false)}
                className="w-full bg-primary text-white font-black py-4 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-[0.98]"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>

        {/* Review List */}
        {!showForm && (
          <div className="lg:col-span-2 space-y-8">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="pb-8 border-b border-gray-50 last:border-0 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200 font-bold text-sm uppercase">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{review.name}</span>
                          {review.verified && (
                            <span className="flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-tight">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Verified
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{review.date}</span>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} 
                        />
                      ))}
                    </div>
                  </div>

                  <h5 className="font-bold text-gray-900 mb-2">{review.title}</h5>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {review.text}
                  </p>

                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-primary transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Helpful ({review.likes})
                    </button>
                    <button className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors">
                      Report
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium mb-4">No reviews yet. Be the first to share your thoughts!</p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="text-primary font-bold hover:underline"
                >
                  Write the first review
                </button>
              </div>
            )}

            {reviews.length > 0 && (
              <button className="w-full py-3 border border-gray-100 rounded-2xl text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                Load More Reviews
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;