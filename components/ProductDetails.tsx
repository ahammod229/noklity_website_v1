
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { X, ShoppingCart, Zap, ArrowLeft } from 'lucide-react';
import ProductImageGallery from './ProductImageGallery';
import ProductPriceBlock from './ProductPriceBlock';
import QuantitySelector from './QuantitySelector';
import ProductTabs from './ProductTabs';

interface ProductDetailsProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

// Mock Specs Data generator since basic Product type doesn't have it
const getMockSpecs = (category: string) => ({
  'Material': 'High-Grade Aluminum Alloy',
  'Weight': '2.4 kg',
  'Dimensions': '12 x 8 x 6 inches',
  'Warranty': '2 Years Manufacturer',
  'Compatibility': 'Universal Fit (Check manual)',
  'Part Number': `NK-${category.substring(0,3).toUpperCase()}-001`,
  'Country of Origin': 'Japan'
});

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  
  // Reset scroll when product opens
  useEffect(() => {
    if (product) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [product]);

  if (!product) return null;

  // Enhance product with mock data for display
  const specs = getMockSpecs(product.category);
  const variants = ['Red', 'Black', 'Carbon Fiber'];
  const [selectedVariant, setSelectedVariant] = useState(variants[0]);

  const handleAddToCart = () => {
    // In a real app, pass quantity and variant
    console.log(`Adding to cart: ${product.name}, Qty: ${quantity}, Variant: ${selectedVariant}`);
    onAddToCart(product);
    onClose();
  };

  const handleBuyNow = () => {
    console.log('Buy Now Clicked');
    onAddToCart(product);
    // Navigate to checkout logic would go here
    onClose();
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
              <ProductImageGallery mainImage={product.image} productName={product.name} />
            </div>

            {/* RIGHT COLUMN: Info & Actions */}
            <div className="lg:col-span-7 p-4 md:p-6 lg:pr-12">
              <ProductPriceBlock 
                name={product.name}
                price={product.price}
                originalPrice={product.originalPrice}
                rating={product.rating}
                brand="NOKLITY Performance"
              />

              <div className="mt-6 space-y-6">
                {/* Variants */}
                <div>
                  <h3 className="text-sm font-bold text-gray-500 mb-3">Color Family</h3>
                  <div className="flex gap-3">
                    {variants.map(v => (
                      <button
                        key={v}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
                          selectedVariant === v 
                          ? 'border-primary text-primary bg-red-50' 
                          : 'border-gray-100 text-gray-600 hover:border-gray-200'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <QuantitySelector 
                  quantity={quantity} 
                  setQuantity={setQuantity} 
                  maxStock={product.stock || 20}
                />

                {/* Desktop Actions */}
                <div className="hidden lg:flex gap-4 pt-4">
                  <button 
                    onClick={handleBuyNow}
                    className="flex-1 bg-primary hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-5 h-5 fill-current" />
                    Buy Now
                  </button>
                  <button 
                    onClick={handleAddToCart}
                    className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
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
            className="flex-1 bg-primary text-white font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition-transform"
          >
            Buy Now
          </button>
          <button 
            onClick={handleAddToCart}
            className="flex-1 bg-gray-900 text-white font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition-transform"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
