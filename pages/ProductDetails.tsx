
import React, { useEffect, useState } from 'react';
import ProductDetailsComponent from '../components/ProductDetails';
import { Product } from '../types';
import { getProductById } from '../services/productService';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import SeoHead from '../components/SeoHead';
import { getPublicSiteConfigSnapshot } from '../services/siteConfigService';

interface ProductDetailsPageProps {
  productId?: string;
  onAddToCart: (product: Product) => void;
  onNavigate: (view: any) => void;
  onHomeClick?: () => void;
  onCategoryClick?: (category: string) => void;
}

const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({ 
  productId, 
  onAddToCart, 
  onNavigate,
  onHomeClick,
  onCategoryClick
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildDescription = (item: Product | null) => {
    if (!item) return 'View product details, price, and availability on Noklity.';
    const raw = [item.description, item.brand, item.category].filter(Boolean).join(' ');
    const normalized = raw.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return `Shop ${item.name} on Noklity with delivery across Bangladesh.`;
    }
    return normalized.length > 160 ? `${normalized.slice(0, 157).trim()}...` : normalized;
  };

  const productCanonicalPath = productId ? `/product/${productId}` : '/product';
  const siteConfig = getPublicSiteConfigSnapshot();

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      if (!productId) {
        setError('Invalid Product ID');
        setLoading(false);
        return;
      }

      try {
        const found = await getProductById(productId);
        if (found) {
          setProduct(found);
          setError(null);
        } else {
          setError('Product not found.');
          setProduct(null);
        }
      } catch (err) {
        setError('Error loading product');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const handleClose = () => {
    onNavigate('home');
  };

  if (loading) {
    return (
      <>
        <SeoHead
          title="Loading Product | Noklity"
          description="Loading product details from Noklity."
          path={productCanonicalPath}
        />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <SeoHead
          title="Product Not Found | Noklity"
          description="The product you requested could not be found on Noklity."
          path={productCanonicalPath}
          robots="noindex, nofollow"
        />
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
      </>
    );
  }

  const productStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: [product.image, ...(product.images || [])].filter(Boolean),
    description: buildDescription(product),
    sku: product.sku || undefined,
    category: product.category || undefined,
    brand: product.brand
      ? {
          '@type': 'Brand',
          name: product.brand
        }
      : undefined,
    offers: {
      '@type': 'Offer',
      url: `${(siteConfig.siteUrl || 'https://noklity.com').replace(/\/+$/, '')}${productCanonicalPath}`,
      priceCurrency: siteConfig.currencyCode || 'BDT',
      price: Number(product.price || 0).toFixed(2),
      availability:
        Number(product.stock || 0) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition'
    }
  };

  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${(siteConfig.siteUrl || 'https://noklity.com').replace(/\/+$/, '')}/`
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.category || 'Products',
        item: `${(siteConfig.siteUrl || 'https://noklity.com').replace(/\/+$/, '')}/search?category=${encodeURIComponent(product.category || '')}`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `${(siteConfig.siteUrl || 'https://noklity.com').replace(/\/+$/, '')}${productCanonicalPath}`
      }
    ]
  };

  return (
    <>
      <SeoHead
        title={`${product.name} | Noklity`}
        description={buildDescription(product)}
        path={productCanonicalPath}
        image={product.image}
        imageAlt={product.name}
        type="product"
        structuredData={[breadcrumbStructuredData, productStructuredData]}
      />
      <ProductDetailsComponent 
        product={product} 
        onClose={handleClose} 
        onAddToCart={onAddToCart} 
        onHomeClick={onHomeClick}
        onCategoryClick={onCategoryClick}
      />
    </>
  );
};

export default ProductDetailsPage;
