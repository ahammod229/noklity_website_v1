import React from 'react';
import SeoHead from './SeoHead';

interface RouteSeoProps {
  view: string;
  param?: string;
}

const DEFAULT_DESCRIPTION =
  'Shop imported electronics, tools, tyres and parts at Noklity. Quality products delivered across Bangladesh.';

const RouteSeo: React.FC<RouteSeoProps> = ({ view, param }) => {
  const currentPath =
    typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}`
      : '/';
  const query =
    typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('q') || '').trim()
      : '';

  switch (view) {
    case 'search':
      return (
        <SeoHead
          title={query ? `Search results for "${query}" | Noklity` : 'Search Products | Noklity'}
          description={
            query
              ? `Browse Noklity search results for ${query}. Find imported electronics, tools, tyres and parts in Bangladesh.`
              : 'Search Noklity products to find imported electronics, tools, tyres and parts across Bangladesh.'
          }
          path={currentPath}
          robots="noindex, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
          keywords="Noklity search, electronics Bangladesh, tools Bangladesh, tyres Bangladesh, parts Bangladesh"
        />
      );
    case 'help':
      return (
        <SeoHead
          title="Help & Support | Noklity"
          description="Get support for orders, delivery, payments, and account issues from Noklity."
          path={currentPath}
        />
      );
    case 'cart':
      return (
        <SeoHead
          title="Shopping Cart | Noklity"
          description="Review items in your Noklity cart before checkout."
          path={currentPath}
          robots="noindex, nofollow, max-image-preview:large"
        />
      );
    case 'checkout':
      return (
        <SeoHead
          title="Checkout | Noklity"
          description="Complete your Noklity order securely."
          path={currentPath}
          robots="noindex, nofollow, max-image-preview:large"
        />
      );
    case 'login':
      return (
        <SeoHead
          title="Login | Noklity"
          description="Sign in to your Noklity account."
          path={currentPath}
          robots="noindex, nofollow, max-image-preview:large"
        />
      );
    case 'signup':
      return (
        <SeoHead
          title="Create Account | Noklity"
          description="Create your Noklity account to manage orders, wishlist, and addresses."
          path={currentPath}
          robots="noindex, nofollow, max-image-preview:large"
        />
      );
    case 'forgot-password':
      return (
        <SeoHead
          title="Reset Password | Noklity"
          description="Reset your Noklity account password."
          path={currentPath}
          robots="noindex, nofollow, max-image-preview:large"
        />
      );
    case 'admin':
      return (
        <SeoHead
          title="Admin Dashboard | Noklity"
          description="Manage Noklity store operations."
          path={currentPath}
          robots="noindex, nofollow, max-image-preview:large"
        />
      );
    case 'account-orders':
    case 'orders':
    case 'order-details':
    case 'invoice':
    case 'wishlist':
    case 'profile':
    case 'addresses':
    case 'notifications':
    case 'security':
    case 'payment-success':
    case 'payment-failed':
    case 'order-success':
      return (
        <SeoHead
          title="Account | Noklity"
          description="Manage your Noklity account and orders."
          path={currentPath}
          robots="noindex, nofollow, max-image-preview:large"
        />
      );
    case 'product-details':
      return (
        <SeoHead
          title="Product Details | Noklity"
          description="View product details, price, and availability on Noklity."
          path={param ? `/product/${param}` : currentPath}
          robots="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
      );
    case 'content-page':
      return (
        <SeoHead
          title="Information | Noklity"
          description="Read company, contact, shipping, and policy information from Noklity."
          path={param ? `/page/${param}` : currentPath}
          robots="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
      );
    case 'home':
    default:
      return (
        <SeoHead
          title="Noklity | Electronics, Tools, Tyres & Parts – Bangladesh"
          description={DEFAULT_DESCRIPTION}
          path="/"
          robots="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
          keywords="Noklity, electronics Bangladesh, tools Bangladesh, tyres Bangladesh, auto parts Bangladesh, imported electronics, imported tools, imported parts"
        />
      );
  }
};

export default RouteSeo;
