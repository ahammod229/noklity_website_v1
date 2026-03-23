
import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { getAddresses, addAddress, Address } from '../services/addressService';
import { createOrder } from '../services/orderService';
import { markPaymentFailed, startBkashPaymentSession, verifyPaymentStatus } from '../services/paymentService';
import { supabase } from '../lib/supabase';
import AddressForm from '../components/account/AddressForm';
import { useCurrency } from '../hooks/useCurrency';
import { useTenantConfig } from '../contexts/TenantConfigContext';
import { getPublicSiteConfig, getPublicSiteConfigSnapshot } from '../services/siteConfigService';
import { optimizeImageForUpload } from '../utils/imageOptimization';
import OptimizedImage from '../components/ui/OptimizedImage';
import { 
  ChevronLeft, 
  MapPin, 
  Plus, 
  CreditCard, 
  Landmark, 
  Smartphone, 
  Mail,
  CheckCircle, 
  Loader2, 
  ShieldCheck, 
  ShoppingBag,
  AlertCircle
} from 'lucide-react';

interface CheckoutProps {
  onNavigate: (view: any, param?: any) => void;
  // Props kept for compatibility with App.tsx routing
  cartItems?: any; 
  onLoginClick?: any;
  cartItemCount?: any;
  onCartClick?: any;
}

const Checkout: React.FC<CheckoutProps> = ({ onNavigate }) => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const { canUseFeature } = useTenantConfig();
  const { formatCurrency } = useCurrency();
  const isGuestCheckout = !user;
  const guestCheckoutEnabled = canUseFeature('checkout_guest');
  const [guestEmail, setGuestEmail] = useState(() => localStorage.getItem('noklity_guest_email') || '');
  const isGuestEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim());
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nogad' | 'bank_transfer'>('nogad');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedBankCode, setSelectedBankCode] = useState<string>('');
  const [transactionReference, setTransactionReference] = useState('');
  const [documentType, setDocumentType] = useState('Transfer Proof');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const initialSiteConfig = getPublicSiteConfigSnapshot();
  const [billingConfig, setBillingConfig] = useState(() => ({
    shippingFee: initialSiteConfig.defaultShippingFee
  }));
  const configuredCodeSet = new Set(paymentMethods.map((m) => m.code));
  const featurePaymentEnabled: Record<'bkash' | 'nogad' | 'bank_transfer', boolean> = {
    bkash: canUseFeature('payment_bkash'),
    nogad: canUseFeature('payment_nogad'),
    bank_transfer: canUseFeature('payment_bank_transfer')
  };
  const checkoutMethods = (['nogad', 'bkash', 'bank_transfer'] as const).filter((code) =>
    featurePaymentEnabled[code] && (configuredCodeSet.size === 0 ? true : configuredCodeSet.has(code))
  );

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = cart.length > 0 ? Math.max(0, Number(billingConfig.shippingFee) || 0) : 0;
  const total = subtotal + shippingCost;
  const stockIssues = useMemo(
    () =>
      cart.filter((item) => {
        if (typeof item.stock !== 'number') return false;
        return item.stock <= 0 || item.quantity > item.stock;
      }),
    [cart]
  );
  const hasStockIssues = stockIssues.length > 0;

  useEffect(() => {
    fetchAddresses();
    fetchPaymentMethods();
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;
    const applyConfig = (nextConfig: ReturnType<typeof getPublicSiteConfigSnapshot>) => {
      if (!mounted) return;
      setBillingConfig({
        shippingFee: nextConfig.defaultShippingFee
      });
    };

    const refreshConfig = async () => {
      try {
        const liveConfig = await getPublicSiteConfig();
        applyConfig(liveConfig);
      } catch (error) {
        console.warn('Failed to refresh checkout billing config:', error);
      }
    };

    applyConfig(getPublicSiteConfigSnapshot());
    void refreshConfig();

    const handleConfigUpdated = () => {
      applyConfig(getPublicSiteConfigSnapshot());
      void refreshConfig();
    };

    window.addEventListener('site-config-updated', handleConfigUpdated as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener('site-config-updated', handleConfigUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    if (user?.email) {
      setGuestEmail(user.email);
      return;
    }
    const stored = localStorage.getItem('noklity_guest_email');
    if (stored) setGuestEmail(stored);
  }, [user?.email]);

  useEffect(() => {
    if (!checkoutMethods.includes(paymentMethod)) {
      setPaymentMethod(checkoutMethods[0] || 'nogad');
    }
  }, [checkoutMethods, paymentMethod]);

  useEffect(() => {
    if (isGuestCheckout && !guestCheckoutEnabled) {
      setCheckoutMessage({ type: 'error', text: 'Guest checkout is disabled. Please sign in to continue.' });
    }
  }, [isGuestCheckout, guestCheckoutEnabled]);

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      if (!user) {
        setAddresses([]);
        setSelectedAddressId(null);
        return;
      }
      const data = await getAddresses();
      setAddresses(data);
      // Auto-select default address
      const defaultAddr = data.find(a => a.isDefault);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      else if (data.length > 0) setSelectedAddressId(data[0].id);
    } catch (error) {
      console.error("Failed to load addresses", error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const fetchPaymentMethods = async () => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error || !data) return;
    setPaymentMethods(data);
  };

  const handleAddAddress = async (data: Omit<Address, 'id'>) => {
    setIsSavingAddress(true);
    try {
      let newAddr: Address;
      if (user) {
        newAddr = await addAddress(data);
      } else {
        newAddr = {
          id: `guest-${Date.now()}`,
          ...data
        };
      }
      setAddresses(prev => [...prev, newAddr]);
      setSelectedAddressId(newAddr.id);
      setIsAddressFormOpen(false);
    } catch (error) {
      console.error("Failed to add address", error);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    setCheckoutMessage(null);
    if (isGuestCheckout && !guestCheckoutEnabled) {
      setCheckoutMessage({ type: 'error', text: 'Guest checkout is disabled. Please sign in to place an order.' });
      return;
    }
    if (hasStockIssues) {
      const preview = stockIssues
        .slice(0, 2)
        .map((item) => item.name)
        .join(', ');
      setCheckoutMessage({
        type: 'error',
        text: preview
          ? `Stock issue detected for: ${preview}. Please update cart before placing order.`
          : 'Some items are out of stock. Please update cart before placing order.'
      });
      return;
    }
    if (!checkoutMethods.includes(paymentMethod)) {
      setCheckoutMessage({ type: 'error', text: 'Selected payment method is not available for this plan.' });
      return;
    }
    if (!selectedAddressId) return;
    if (isGuestCheckout && !isGuestEmailValid) {
      setCheckoutMessage({ type: 'error', text: 'Please enter a valid email address to continue as guest.' });
      return;
    }
    if (paymentMethod === 'bank_transfer' && !selectedBankCode) {
      setCheckoutMessage({ type: 'error', text: 'Please select a bank for bank transfer.' });
      return;
    }
    if (paymentMethod === 'bank_transfer' && !transactionReference.trim()) {
      setCheckoutMessage({ type: 'error', text: 'Please enter transaction reference for bank transfer.' });
      return;
    }
    
    setIsProcessingOrder(true);
    try {
      const selectedAddr = addresses.find(a => a.id === selectedAddressId);
      
      if (!selectedAddr) throw new Error("Invalid address selected");
      const checkoutEmail = (user?.email || guestEmail).trim();
      if (!checkoutEmail) {
        throw new Error('A valid email is required to place the order.');
      }
      localStorage.setItem('noklity_guest_email', checkoutEmail);

      const result = await createOrder({
        items: cart,
        shipping: {
          fullName: selectedAddr.fullName,
          email: checkoutEmail,
          phone: selectedAddr.phone,
          address: selectedAddr.street,
          city: selectedAddr.city,
          country: selectedAddr.country,
          zip: selectedAddr.zip
        },
        paymentMethod,
        total: total
      });
      
      if (result.success && result.orderId) {
        if (paymentMethod === 'bkash') {
          const bkashResult = await startBkashPaymentSession(result.orderId, total);
          if (!bkashResult.success || !bkashResult.bkashURL) {
            setCheckoutMessage({
              type: 'error',
              text: bkashResult.error || 'Unable to initiate bKash payment. Please try again.'
            });
            return;
          }

          window.location.assign(bkashResult.bkashURL);
          return;
        }

        if (paymentMethod === 'nogad') {
          const paymentResult = await verifyPaymentStatus(result.orderId, 'nogad');
          if (!paymentResult.success) {
            await markPaymentFailed(result.orderId, paymentResult.error);
            onNavigate('payment-failed', result.orderId);
            return;
          }
          await clearCart();
          onNavigate('payment-success', result.orderId);
          return;
        }

        if (paymentMethod === 'bank_transfer') {
          const { data: currentSession } = await supabase.auth.getSession();
          const currentUserId = currentSession.session?.user?.id;
          let documentPath: string | null = null;
          if (proofFile && currentUserId) {
            const isImage = proofFile.type.startsWith('image/');
            const uploadFile = isImage
              ? (
                  await optimizeImageForUpload(proofFile, {
                    targetWidth: 1600,
                    targetHeight: 1600,
                    fit: 'contain',
                    maxBytes: 3 * 1024 * 1024,
                    fileNamePrefix: `payment-proof-${result.orderId}`
                  })
                ).file
              : proofFile;
            const ext = uploadFile.name.split('.').pop() || (isImage ? 'webp' : 'bin');
            const filePath = `${currentUserId}/${result.orderId}-${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
              .from('payment-proofs')
              .upload(filePath, uploadFile, { upsert: false });
            if (!uploadError) {
              documentPath = filePath;
            }
          }

          if (currentUserId) {
            await supabase.from('payment_submissions').insert({
              order_id: result.orderId,
              user_id: currentUserId,
              payment_method: 'bank_transfer',
              bank_code: selectedBankCode || null,
              document_type: documentType || null,
              transaction_reference: transactionReference.trim() || null,
              document_path: documentPath,
              status: 'pending'
            });
          }

          await supabase
            .from('orders')
            .update({
              transaction_id: transactionReference.trim(),
              payment_status: 'pending',
              status: 'Pending'
            })
            .eq('id', result.orderId);
        }

        // Bank transfer remains pending until admin confirms.
        await clearCart();
        onNavigate('order-success', result.orderId);
      } else {
        onNavigate('payment-failed');
      }
    } catch (error: any) {
      console.error("Order failed", error);
      setCheckoutMessage({ type: 'error', text: error?.message || 'Failed to place order. Please try again.' });
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const bankMethods = paymentMethods.filter((m) => m.type === 'bank_transfer');

  useEffect(() => {
    const available = (['bkash', 'nogad', 'bank_transfer'] as const).filter((code) =>
      paymentMethods.length === 0 ? true : paymentMethods.some((m) => m.code === code)
    );
    if (available.length > 0 && !available.includes(paymentMethod)) {
      setPaymentMethod(available[0]);
    }
  }, [paymentMethods, paymentMethod]);

  // Empty State
  if (cart.length === 0 && !isProcessingOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-gray-100 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8 font-medium">Add some performance parts to your ride before checking out.</p>
          <button 
            onClick={() => onNavigate('home')}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-95"
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <button 
            onClick={() => onNavigate('home')}
            className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 mb-8 transition-colors group"
        >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Continue Shopping
        </button>

        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-8 tracking-tight">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* LEFT COLUMN: Shipping & Payment */}
          <div className="flex-1 space-y-8">
            
            {/* 1. Shipping Address */}
            <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <MapPin className="w-5 h-5" />
                        </div>
                    <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
                    {isGuestCheckout && (
                      <span className="ml-2 text-[11px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-2 py-1 rounded">
                        Guest Checkout
                      </span>
                    )}
                    </div>
                    <button 
                        onClick={() => setIsAddressFormOpen(true)}
                        className="flex items-center gap-2 text-primary font-bold text-sm hover:underline"
                    >
                        <Plus className="w-4 h-4" /> Add New
                    </button>
                </div>

                {loadingAddresses ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
                    </div>
                ) : addresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((addr) => (
                            <div 
                                key={addr.id}
                                onClick={() => setSelectedAddressId(addr.id)}
                                className={`cursor-pointer p-5 rounded-2xl border-2 transition-all duration-200 relative ${
                                    selectedAddressId === addr.id 
                                    ? 'border-primary bg-red-50/30 ring-1 ring-primary/20' 
                                    : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                                        selectedAddressId === addr.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                        {addr.label}
                                    </span>
                                    {selectedAddressId === addr.id && <CheckCircle className="w-5 h-5 text-primary fill-current" />}
                                </div>
                                <p className="font-bold text-gray-900 text-sm mb-1">{addr.fullName}</p>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {addr.street}, {addr.city}<br />
                                    {addr.state}, {addr.zip}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-500 text-sm mb-3">
                          {isGuestCheckout ? 'Add a shipping address to continue as guest.' : 'No addresses found.'}
                        </p>
                        <button 
                            onClick={() => setIsAddressFormOpen(true)}
                            className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors"
                        >
                            Create Address
                        </button>
                    </div>
                )}
            </section>

            {isGuestCheckout && (
              <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Contact Email</h2>
                    <p className="text-xs text-gray-500 font-semibold">Order updates and invoice will be sent here.</p>
                  </div>
                </div>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full h-12 px-4 rounded-xl border bg-white font-semibold ${
                    guestEmail.trim().length > 0 && !isGuestEmailValid
                      ? 'border-red-300 text-red-700'
                      : 'border-gray-200'
                  }`}
                />
                {guestEmail.trim().length > 0 && !isGuestEmailValid && (
                  <p className="mt-2 text-xs font-bold text-red-600">Please enter a valid email address.</p>
                )}
              </section>
            )}

            {/* 2. Payment Method */}
            <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                        <CreditCard className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                </div>

                <div className="space-y-3">
                    {checkoutMethods.length === 0 && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                        No payment methods are enabled for this plan. Please update plan/feature settings.
                      </div>
                    )}
                    {checkoutMethods.includes('bkash') && (
                    <label 
                        className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            paymentMethod === 'bkash' 
                            ? 'border-primary bg-red-50/30' 
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                    >
                        <input 
                            type="radio" 
                            name="payment" 
                            value="bkash"
                            checked={paymentMethod === 'bkash'}
                            onChange={() => setPaymentMethod('bkash')}
                            className="w-5 h-5 text-primary border-gray-300 focus:ring-primary"
                        />
                        <div className="ml-4 flex-1">
                            <span className="block font-bold text-gray-900">{paymentMethods.find((m) => m.code === 'bkash')?.name || 'bKash'}</span>
                            <span className="text-xs text-gray-500">Instant mobile payment</span>
                        </div>
                        <Smartphone className={`w-6 h-6 ${paymentMethod === 'bkash' ? 'text-primary' : 'text-gray-300'}`} />
                    </label>
                    )}

                    {checkoutMethods.includes('nogad') && (
                    <label 
                        className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            paymentMethod === 'nogad'
                            ? 'border-primary bg-red-50/30'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                    >
                        <input 
                            type="radio" 
                            name="payment" 
                            value="nogad"
                            checked={paymentMethod === 'nogad'}
                            onChange={() => setPaymentMethod('nogad')}
                            className="w-5 h-5 text-primary border-gray-300 focus:ring-primary"
                        />
                        <div className="ml-4 flex-1">
                            <span className="block font-bold text-gray-900">{paymentMethods.find((m) => m.code === 'nogad')?.name || 'Nogad'}</span>
                            <span className="text-xs text-gray-500">Instant mobile payment</span>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-8 h-5 bg-blue-500/80 rounded"></div>
                            <div className="w-8 h-5 bg-amber-400/90 rounded"></div>
                        </div>
                    </label>
                    )}

                    {checkoutMethods.includes('bank_transfer') && (
                    <label 
                        className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            paymentMethod === 'bank_transfer'
                            ? 'border-primary bg-red-50/30'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                    >
                        <input 
                            type="radio" 
                            name="payment" 
                            value="bank_transfer"
                            checked={paymentMethod === 'bank_transfer'}
                            onChange={() => setPaymentMethod('bank_transfer')}
                            className="w-5 h-5 text-primary border-gray-300 focus:ring-primary"
                        />
                        <div className="ml-4 flex-1">
                            <span className="block font-bold text-gray-900">{paymentMethods.find((m) => m.code === 'bank_transfer')?.name || 'Bank Transfer'}</span>
                            <span className="text-xs text-gray-500">Manual confirmation required</span>
                        </div>
                        <Landmark className={`w-6 h-6 ${paymentMethod === 'bank_transfer' ? 'text-primary' : 'text-gray-300'}`} />
                    </label>
                    )}
                </div>

                {paymentMethod === 'bank_transfer' && (
                  <div className="mt-6 border border-green-200 bg-green-50/40 rounded-2xl p-5 space-y-4">
                    <h3 className="text-lg font-black text-gray-900">Bank Payment</h3>
                    <p className="text-sm text-gray-600">Select your bank to view transfer details.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {bankMethods.map((bank) => (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => setSelectedBankCode(bank.code)}
                          className={`text-left rounded-xl border-2 p-4 transition-all ${
                            selectedBankCode === bank.code ? 'border-primary bg-red-50' : 'border-gray-200 bg-white'
                          }`}
                        >
                          <p className="text-sm font-black text-gray-900">{bank.name}</p>
                          <p className="text-xs text-gray-500">{bank.code}</p>
                        </button>
                      ))}
                    </div>

                    {selectedBankCode && (
                      <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
                        {(() => {
                          const selectedBank = bankMethods.find((b) => b.code === selectedBankCode);
                          const details = (selectedBank?.account_details || {}) as Record<string, string>;
                          return (
                            <>
                              <p className="font-black text-gray-900">{selectedBank?.name}</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <InfoTile label="Bank Address" value={details.bank_address || details.branch || 'N/A'} />
                                <InfoTile label="Account Holder" value={details.account_holder || 'N/A'} />
                                <InfoTile label="Account Number" value={details.account_number || 'N/A'} />
                                <InfoTile label="Routing Number" value={details.routing_number || 'N/A'} />
                                <InfoTile label="SWIFT Code" value={details.swift_code || 'N/A'} />
                                <InfoTile label="Bank Code" value={details.bank_code || selectedBank?.code || 'N/A'} />
                              </div>
                              {selectedBank?.instructions && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                  {selectedBank.instructions}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}

                    <div className="space-y-3">
                      <h4 className="font-black text-gray-900">Upload Payment Document</h4>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Document Type</label>
                        <select
                          value={documentType}
                          onChange={(e) => setDocumentType(e.target.value)}
                          className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white font-semibold"
                        >
                          <option>Transfer Proof</option>
                          <option>Bank Challan</option>
                          <option>Deposit Slip</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Transaction Reference</label>
                        <input
                          type="text"
                          value={transactionReference}
                          onChange={(e) => setTransactionReference(e.target.value)}
                          className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white font-semibold"
                          placeholder="Enter bank transaction reference"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Upload Challan (Optional)</label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                          className="w-full h-12 px-3 py-2 rounded-xl border border-gray-200 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
            </section>
          </div>

          {/* RIGHT COLUMN: Order Summary */}
          <div className="lg:w-[420px] flex-shrink-0">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-lg border border-gray-200 sticky top-24">
                <h2 className="text-xl font-black text-gray-900 mb-6 pb-4 border-b border-gray-100">Order Summary</h2>
                
                {/* Items List */}
                <div className="space-y-5 mb-8 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                    {cart.map((item) => (
                        <div key={item.id} className="flex gap-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                                <OptimizedImage
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover mix-blend-multiply"
                                  width={64}
                                  height={64}
                                  responsiveWidths={[400, 800]}
                                  sizes="64px"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">{item.name}</p>
                                <p className="text-xs text-gray-500 mt-1 font-medium">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Costs */}
                <div className="space-y-3 pt-6 border-t border-dashed border-gray-200 bg-gray-50/50 -mx-8 px-8 pb-6">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Subtotal</span>
                        <span className="font-bold text-gray-900">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Shipping Estimate</span>
                        <span className="font-bold text-gray-900">{formatCurrency(shippingCost)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-200">
                        <span className="text-lg font-black text-gray-900 tracking-tight">Total</span>
                        <span className="text-2xl font-black text-primary tracking-tighter">{formatCurrency(total)}</span>
                    </div>
                </div>

                <button 
                    onClick={handlePlaceOrder}
                    disabled={isProcessingOrder || !selectedAddressId || (isGuestCheckout && !isGuestEmailValid) || hasStockIssues}
                    className="w-full mt-6 bg-primary text-white font-black py-4 rounded-xl hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    {isProcessingOrder ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            Place Order
                            <CheckCircle className="w-5 h-5" />
                        </>
                    )}
                </button>
                
                {!selectedAddressId && (
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-amber-600 text-xs font-bold bg-amber-50 py-2 rounded-lg">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Please select a shipping address
                    </div>
                )}
                {isGuestCheckout && !isGuestEmailValid && (
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-amber-700 text-xs font-bold bg-amber-50 py-2 rounded-lg">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Please enter a valid email for guest checkout
                    </div>
                )}
                {hasStockIssues && (
                    <div className="mt-3 flex items-start gap-1.5 text-red-700 text-xs font-bold bg-red-50 border border-red-200 py-2 px-3 rounded-lg">
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>
                            Some cart items are out of stock or quantity exceeds available stock. Please adjust cart items before ordering.
                        </span>
                    </div>
                )}
                {checkoutMessage && (
                    <div className={`mt-3 text-xs font-bold py-2 px-3 rounded-lg border ${checkoutMessage.type === 'error' ? 'text-red-700 bg-red-50 border-red-200' : 'text-green-700 bg-green-50 border-green-200'}`}>
                        {checkoutMessage.text}
                    </div>
                )}
                
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    Secure SSL Encryption
                </div>
            </div>
          </div>

        </div>
      </main>

      {/* Address Form Modal */}
      {isAddressFormOpen && (
        <AddressForm 
            onSubmit={handleAddAddress}
            onCancel={() => setIsAddressFormOpen(false)}
            isSaving={isSavingAddress}
        />
      )}
    </div>
  );
};

const InfoTile: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-3">
    <p className="text-[11px] uppercase tracking-wider text-gray-500 font-black">{label}</p>
    <p className="text-base font-black text-gray-900 mt-1 break-all">{value}</p>
  </div>
);

export default Checkout;
