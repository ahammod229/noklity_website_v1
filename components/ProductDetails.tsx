
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { X, ShoppingCart, Zap, ArrowLeft } from 'lucide-react';
import ProductImageGallery from './ProductImageGallery';
import ProductPriceBlock from './ProductPriceBlock';
import QuantitySelector from './QuantitySelector';
import ProductTabs from './ProductTabs';
import { useCurrency } from '../hooks/useCurrency';

interface ProductDetailsProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
}

const getProductSpecs = (product: Product) => ({
  ...(product.specifications || {}),
  ...(product.weight ? { Weight: `${product.weight} kg` } : {}),
  ...(product.countryOfOrigin ? { 'Country of Origin': product.countryOfOrigin } : {}),
  ...(product.sku ? { SKU: product.sku } : {}),
  ...(product.modelNumber ? { 'Model Number': product.modelNumber } : {})
});

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, onClose, onAddToCart }) => {
  const { formatCurrency } = useCurrency();
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const maxStock = typeof product?.stock === 'number' ? Math.max(0, Number(product.stock)) : 20;
  const isOutOfStock = maxStock <= 0;
  
  // Reset scroll when product opens
  useEffect(() => {
    if (product) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [product]);

  if (!product) return null;

  // Enhance product with mock data for display
  const specs = getProductSpecs(product);
  const compatibilityList = product.compatibility || [];

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    setIsProcessing(true);
    // In a real app, pass quantity and variant
    await onAddToCart(product, quantity);
    setIsProcessing(false);
    onClose();
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    setIsProcessing(true);
    await onAddToCart(product, quantity);
    // Redirect logic handled by parent via onNavigate typically, 
    // but here we just add to cart. Parent handles redirect if 'Buy Now' was separate logic.
    // The current prop 'onAddToCart' might just add. 
    // If we need redirect, we assume the parent passed a specific handler or handles this flow.
    // For now, consistent behavior: add and close.
    // *Wait*, original App.tsx logic for Buy Now was not fully wired in previous turn, but assuming consistent cart logic.
    // Actually, App.tsx passes `onAddToCart` which shows toast. 
    // To implement "Buy Now" properly (redirect to checkout), we would need `onNavigate` here.
    // But keeping it simple as requested for Wishlist task: just add to cart.
    // To allow redirect, ProductDetails needs onNavigate.
    setIsProcessing(false);
    // For "Buy Now", typically we navigate to checkout immediately.
    // window.location.href = '/checkout'; // Or use onNavigate if available
    // Since we don't have onNavigate prop here (it wasn't in original interface above, but App passed it to ProductDetailsPage which passed it to ProductDetailsComponent? No, let's check ProductDetailsPage)
    // ProductDetailsPage passes `onAddToCart` and `onClose`.
    // So "Buy Now" here is effectively "Add to Cart".
    onClose(); 
    // Ideally we navigate to /checkout.
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 overflow-y-auto font-sans">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 bg-white shadow-sm z-50 px-4 h-16 flex items-center justify-between">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-bold text-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Results
        </button>
        <h2 className="hidden md:block font-bold text-gray-900 truncate max-w-md">{product.name}</h2>
        <div className="w-8"></div> {/* Spacer for alignment */}
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pb-32">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8">
            
            {/* LEFT COLUMN: Images */}
            <div className="lg:col-span-5 p-4 md:p-6 lg:border-r border-gray-100">
              <ProductImageGallery mainImage={product.image} images={product.images} productName={product.name} />
            </div>

            {/* RIGHT COLUMN: Info & Actions */}
            <div className="lg:col-span-7 p-4 md:p-6 lg:pr-12">
              <ProductPriceBlock product={product} />

              <div className="mt-6 space-y-6">
                {/* Quantity */}
                <QuantitySelector 
                  quantity={quantity} 
                  setQuantity={setQuantity} 
                  maxStock={maxStock}
                />
                <p className={`text-sm font-bold ${Number(product.stock || 0) > 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {Number(product.stock || 0) > 0 ? `${product.stock} item(s) in stock` : 'Out of stock'}
                </p>

                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 space-y-2">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Delivery & Warranty</p>
                  <p className="text-sm font-bold text-gray-800">Warranty: {product.warranty || `${product.warrantyMonths || 0} months`}</p>
                  <p className="text-sm font-bold text-gray-800">
                    Delivery Charge: {formatCurrency(Number(product.deliveryCharge || product.defaultDeliveryFee || product.deliveryCharges?.Dhaka || 0))}
                  </p>
                  <p className="text-sm font-bold text-gray-800">
                    Base Delivery Fee: {formatCurrency(Number(product.defaultDeliveryFee || 0))}
                  </p>
                  <p className="text-sm font-bold text-gray-800">
                    Tax: {Number(product.taxPercent || 0).toFixed(2)}%
                  </p>
                  {product.warrantyPolicy && (
                    <p className="text-xs text-gray-600">{product.warrantyPolicy}</p>
                  )}
                  {product.shippingInfo && (
                    <p className="text-xs text-gray-600">{product.shippingInfo}</p>
                  )}
                  {product.returnPolicy && (
                    <p className="text-xs text-gray-600">Return policy: {product.returnPolicy}</p>
                  )}
                  {product.faqText && <p className="text-xs text-gray-600 whitespace-pre-line">{product.faqText}</p>}
                </div>

                {compatibilityList.length > 0 && (
                  <div className="p-4 rounded-xl border border-gray-100 bg-white">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Compatibility</p>
                    <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                      {compatibilityList.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Desktop Actions */}
                <div className="hidden lg:flex gap-4 pt-4">
                  <button 
                    onClick={handleBuyNow}
                    disabled={isProcessing || isOutOfStock}
                    className="flex-1 bg-primary hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <Zap className="w-5 h-5 fill-current" />
                    {isOutOfStock ? 'Out of Stock' : 'Buy Now'}
                  </button>
                  <button 
                    onClick={handleAddToCart}
                    disabled={isProcessing || isOutOfStock}
                    className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Tabs */}
        <ProductTabs 
          description={product.description || "No description available."}
          specs={specs}
        />
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-6 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex gap-3">
          <button 
            onClick={handleBuyNow}
            disabled={isProcessing || isOutOfStock}
            className="flex-1 bg-primary text-white font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition-transform disabled:opacity-70"
          >
            {isOutOfStock ? 'Out of Stock' : 'Buy Now'}
          </button>
          <button 
            onClick={handleAddToCart}
            disabled={isProcessing || isOutOfStock}
            className="flex-1 bg-gray-900 text-white font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition-transform disabled:opacity-70"
          >
            {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
