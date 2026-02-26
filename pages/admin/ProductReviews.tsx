import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AdminReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  admin_note: string | null;
  product?: { title?: string } | null;
  user?: { full_name?: string; email?: string } | null;
}

const ProductReviews: React.FC = () => {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*, product:products(title), user:profiles(full_name,email)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load reviews:', error);
      alert('Failed to load reviews');
    } else {
      setReviews((data || []) as AdminReview[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const updateReview = async (id: string, updates: Partial<AdminReview>) => {
    const { error } = await supabase.from('product_reviews').update(updates).eq('id', id);
    if (error) {
      alert(error.message || 'Failed to update review');
      return;
    }

    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Product Reviews</h2>
          <p className="text-gray-500 font-medium">Approve, reject, and moderate delivered-order reviews.</p>
        </div>
        <button onClick={fetchReviews} className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm font-bold">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center text-gray-500 font-medium">
          No reviews found yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Rating</th>
                  <th className="px-6 py-3">Review</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-900">{review.product?.title || 'Unknown Product'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{review.user?.full_name || 'Customer'}</span>
                        <span className="text-xs text-gray-500">{review.user?.email || 'No email'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-amber-600 font-black">{'★'.repeat(Math.max(1, Math.min(5, review.rating)))}</td>
                    <td className="px-6 py-4 max-w-sm">
                      <div className="flex flex-col">
                        {review.title && <span className="font-bold text-gray-900">{review.title}</span>}
                        <span className="text-xs text-gray-600">{review.comment || 'No comment'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                        review.status === 'approved' ? 'bg-green-100 text-green-700' :
                        review.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {review.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 min-w-[260px]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateReview(review.id, { status: 'approved' })}
                          className="px-3 py-2 text-xs font-bold rounded-lg bg-green-50 text-green-700 border border-green-200 flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                        <button
                          onClick={() => updateReview(review.id, { status: 'rejected' })}
                          className="px-3 py-2 text-xs font-bold rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                        <button
                          onClick={() => {
                            const note = window.prompt('Admin note', review.admin_note || '');
                            if (note !== null) updateReview(review.id, { admin_note: note });
                          }}
                          className="px-3 py-2 text-xs font-bold rounded-lg bg-white text-gray-700 border border-gray-200 flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" /> Note
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
