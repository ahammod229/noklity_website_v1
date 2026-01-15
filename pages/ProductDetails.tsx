
import React, { useEffect, useState } from 'react';
import ProductDetailsComponent from '../components/ProductDetails';
import { MOCK_PRODUCTS } from '../data/mockData';
import { Product } from '../types';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

interface ProductDetailsPageProps {
  productId?: string;
  onAddToCart: (product: Product) => void;
  onNavigate: (view: any) => void;
}

const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({ 
  productId, 
  onAddToCart, 
  onNavigate 
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    // Simulate fetch
    const timer = setTimeout(() => {
      if (!productId) {
          setError('Invalid Product ID');
          setLoading(false);
          return;
      }
      
      // In a real app, this would be a Supabase call
      const found = MOCK_PRODUCTS.find(p => p.id === productId);
      if (found) {
        setProduct(found);
        setError(null);
      } else {
        setError('Product not found.');
        setProduct(null);
      }
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [productId]);

  const handleClose = () => {
    onNavigate('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full border border-gray-100">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-500 mb-8 font-medium">The product you are looking for might have been removed or does not exist.</p>
          <button 
            onClick={handleClose}
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Reuse the existing component which now acts as a full page overlay
  return (
    <ProductDetailsComponent 
      product={product} 
      onClose={handleClose} 
      onAddToCart={onAddToCart} 
    />
  );
};

export default ProductDetailsPage;
