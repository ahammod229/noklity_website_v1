import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { getAddresses, addAddress, Address } from '../services/addressService';
import { createOrder } from '../services/orderService';
import { markPaymentFailed, startBkashPaymentSession, verifyPaymentStatus } from '../services/paymentService';
import { supabase, uploadFile } from '../lib/supabase';
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
  AlertCircle,
  Edit2,
  ChevronRight,
  Upload,
  X
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
  const [isAddressSelectionOpen, setIsAddressSelectionOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedBankCode, setSelectedBankCode] = useState<string>('');
  const [bkashTrxId, setBkashTrxId] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [documentType, setDocumentType] = useState('Transfer Proof');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const initialSiteConfig = getPublicSiteConfigSnapshot();
  const [billingConfig, setBillingConfig] = useState(() => ({
    shippingFee: initialSiteConfig.defaultShippingFee
  }));
  // Dynamic checkout methods from DB
  const checkoutMethods = paymentMethods.map((m) => m.code);

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
    // Auto-select the first method if nothing is selected yet
    if (data.length > 0) {
      setPaymentMethod((prev) => prev || data[0].code);
    }
  };

  const handleAddAddress = async (data: Omit<Address, 'id'>) => {
    setIsSavingAddress(true);
    try {
      if (editingAddress) {
        if (user) {
          // @ts-ignore - Assuming updateAddress is imported or we can just call addAddress which handles default internally, wait, we need updateAddress. I'll import it above.
          // Wait, updateAddress is not imported in Checkout.tsx.
          // Let's import it in the next chunk, or I can just inline it if I forget.
          // Let's use the local state update for guest, and for logged-in user we need `updateAddress`.
        }
      }
      
      if (editingAddress) {
        if (user) {
          // Import is needed. I'll handle that.
          const { updateAddress } = await import('../services/addressService');
          await updateAddress(editingAddress.id, data);
          await fetchAddresses();
        } else {
          setAddresses(prev => prev.map(a => a.id === editingAddress.id ? { ...a, ...data } : a));
        }
      } else {
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
      }
      setIsAddressFormOpen(false);
      setEditingAddress(null);
    } catch (error) {
      console.error("Failed to add/update address", error);
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
        const selectedMethodObj = paymentMethods.find((m) => m.code === paymentMethod);
        
        if (selectedMethodObj?.type === 'mobile_banking') {
          const currentUserId = user?.uid || null;
          // Guest checkouts will have null user_id, which might fail RLS on payment_submissions if user_id is required
          // However, we also save to orders table directly
          try {
            await supabase.from('payment_submissions').insert({
              order_id: result.orderId,
              user_id: currentUserId,
              payment_method: selectedMethodObj.code,
              transaction_reference: bkashTrxId.trim(),
              status: 'pending'
            });
          } catch(e) {
            console.warn('Could not insert payment_submissions, relying on orders table fallback.');
          }

          await supabase
            .from('orders')
            .update({
              transaction_id: bkashTrxId.trim(),
              payment_status: 'pending',
              status: 'Pending'
            })
            .eq('id', result.orderId);

          await clearCart();
          onNavigate('order-success', result.orderId);
          return;
        }

        if (selectedMethodObj?.type === 'bank_transfer') {
          const currentUserId = user?.uid || null;
          let documentPath: string | null = null;
          if (proofFile) {
            const folderName = currentUserId || 'guest';
            const isImage = proofFile.type.startsWith('image/');
            const fileToUpload = isImage
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
            const ext = fileToUpload.name.split('.').pop() || (isImage ? 'webp' : 'bin');
            const filePath = `${folderName}/${result.orderId}-${Date.now()}.${ext}`;
            try {
              const uploadRes = await supabase.storage.from('payment-proofs').upload(filePath, fileToUpload, { upsert: false });
              if (uploadRes.error) throw uploadRes.error;
              const newPath = uploadRes.data?.path;
              documentPath = newPath;
            } catch (uploadError) {
              console.error('Failed to upload payment proof:', uploadError);
            }
          }

          try {
            await supabase.from('payment_submissions').insert({
              order_id: result.orderId,
              user_id: currentUserId,
              payment_method: selectedMethodObj.code,
              bank_code: selectedBankCode || null,
              document_type: documentType || null,
              transaction_reference: transactionReference.trim() || null,
              document_path: documentPath,
              status: 'pending'
            });
          } catch(e) {
            console.warn('Could not insert bank transfer payment_submissions.');
          }
          
          await supabase
            .from('orders')
            .update({
              transaction_id: transactionReference.trim() || null,
              payment_status: 'pending',
              status: 'Pending'
            })
            .eq('id', result.orderId);

          await clearCart();
          onNavigate('order-success', result.orderId);
          return;
        }

        // Fallback for Cash on Delivery or generic methods
        await clearCart();
        onNavigate('order-success', result.orderId);
      } else {
        setCheckoutMessage({ type: 'error', text: (result as any).error || 'Failed to process order' });
      }
    } catch (error: any) {
      console.error("Order failed", error);
      setCheckoutMessage({ type: 'error', text: error?.message || 'Failed to place order. Please try again.' });
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const bankMethods = paymentMethods.filter((m) => m.type === 'bank_transfer');



  // Empty State
  if (cart.length === 0 && !isProcessingOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 text-center max-w-md w-full">
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
      <main className="flex-grow py-6 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <button 
            onClick={() => onNavigate('home')}
            className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 mb-8 transition-colors group"
        >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Continue Shopping
        </button>

        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-8 tracking-tight">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
          
          {/* LEFT COLUMN: Shipping & Payment */}
          <div className="flex-1 space-y-8">
            
            {/* 1. Shipping Address */}
            <section className="bg-white rounded-none sm:rounded-[2rem] shadow-sm sm:border border-b border-gray-100 sm:border-gray-200 overflow-hidden">
                {loadingAddresses ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                    </div>
                ) : addresses.length > 0 && selectedAddressId ? (
                    <div 
                      onClick={() => setIsAddressSelectionOpen(true)}
                      className="flex items-start gap-3 p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <MapPin className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 text-[13px]">
                          <span className="font-bold text-gray-900">{addresses.find(a => a.id === selectedAddressId)?.fullName}</span>
                          <span className="text-gray-500 font-medium">{addresses.find(a => a.id === selectedAddressId)?.phone}</span>
                        </div>
                        <div className="flex items-start gap-2 text-[13px] text-gray-600">
                          <span className="bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                            {addresses.find(a => a.id === selectedAddressId)?.label}
                          </span>
                          <span className="leading-snug">
                            {addresses.find(a => a.id === selectedAddressId)?.street}, {addresses.find(a => a.id === selectedAddressId)?.city}
                            {addresses.find(a => a.id === selectedAddressId)?.state && `, ${addresses.find(a => a.id === selectedAddressId)?.state}`}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 mt-2" />
                    </div>
                ) : (
                    <div 
                      onClick={() => {
                        setEditingAddress(null);
                        setIsAddressFormOpen(true);
                      }}
                      className="flex items-center justify-between p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">Add Shipping Address</span>
                          {isGuestCheckout && <span className="text-[11px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-2 py-1 rounded w-fit mt-1">Guest Checkout</span>}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                )}
            </section>

            {isGuestCheckout && (
              <section className="bg-white p-4 sm:p-4 md:p-6 rounded-[2rem] shadow-sm border border-gray-200">
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
            <section className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                    </div>
                    <h2 className="text-lg font-black text-gray-900">Payment Method</h2>
                </div>

                {paymentMethods.length === 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                    No payment methods available. Please check back later.
                  </div>
                )}

                {/* Method List */}
                <div className="space-y-2">
                  {paymentMethods.map(method => {
                    const isSelected = paymentMethod === method.code;
                    return (
                      <div 
                        key={method.code}
                        onClick={() => setPaymentMethod(method.code)}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-100 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-primary' : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>

                        {method.logo_url ? (
                          <img src={method.logo_url} alt="" className="w-8 h-8 rounded-lg object-contain bg-white border border-gray-100 flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {method.type === 'mobile_banking' ? <Smartphone className="w-4 h-4 text-gray-500" /> : <CreditCard className="w-4 h-4 text-gray-500" />}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm">{method.name}</p>
                          <p className="text-xs text-gray-500">
                            {method.type === 'mobile_banking' ? 'Mobile Payment' : method.type === 'bank_transfer' ? 'Bank Transfer' : 'Cash on Delivery'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Detail Panel — shows based on selected method */}
                {(() => {
                  const sel = paymentMethods.find(m => m.code === paymentMethod);
                  if (!sel) return null;

                  // ─── Mobile Banking (bKash, Nagad, Rocket, etc.) ───
                  if (sel.type === 'mobile_banking') {
                    const num = (sel.account_details as any)?.mobile_number || 'Not Set';
                    return (
                      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
                        <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                          <Smartphone className="w-4 h-4" /> {sel.name} Payment
                        </p>
                        <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-700 space-y-1">
                          {sel.instructions ? (
                            <div className="whitespace-pre-wrap leading-relaxed">{sel.instructions}</div>
                          ) : (
                            <>
                              <p>Send money to: <strong className="text-gray-900 text-base tracking-wide">{num}</strong></p>
                              <p>Amount: <strong className="text-gray-900">৳{total}</strong></p>
                            </>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-800 mb-1.5">
                            Transaction ID (TrxID) <span className="text-red-500">*</span>
                          </label>
                          <input 
                            type="text"
                            value={bkashTrxId}
                            onChange={(e) => setBkashTrxId(e.target.value)}
                            placeholder="e.g. 9B8XJ78Z1A"
                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono uppercase text-sm"
                          />
                          <p className="text-xs text-gray-400 mt-1.5">Check your SMS or App for the TrxID.</p>
                        </div>
                      </div>
                    );
                  }

                  // ─── Bank Transfer ───
                  if (sel.type === 'bank_transfer') {
                    const d = (sel.account_details || {}) as Record<string, string>;
                    const hasDetails = d.account_number || d.account_holder || d.branch || d.bank_address;
                    return (
                      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
                        <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                          <Landmark className="w-4 h-4" /> {sel.name} — Bank Details
                        </p>

                        {hasDetails && (
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {d.account_holder && <InfoTile label="Account Holder" value={d.account_holder} />}
                              {d.account_number && <InfoTile label="Account Number" value={d.account_number} />}
                              {(d.bank_address || d.branch) && <InfoTile label="Branch" value={d.bank_address || d.branch || ''} />}
                              {d.routing_number && <InfoTile label="Routing Number" value={d.routing_number} />}
                              {d.swift_code && <InfoTile label="SWIFT Code" value={d.swift_code} />}
                            </div>
                          </div>
                        )}

                        {sel.instructions && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900 whitespace-pre-wrap">
                            {sel.instructions}
                          </div>
                        )}

                        {/* Upload proof */}
                        <div>
                          <label className="block text-sm font-bold text-gray-800 mb-1.5">
                            Payment Receipt <span className="text-red-500">*</span>
                          </label>
                          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-5 bg-white flex flex-col items-center justify-center hover:border-primary transition-colors cursor-pointer">
                            <input 
                              type="file" 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              accept="image/*,application/pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setProofFile(file);
                              }}
                            />
                            {proofFile ? (
                              <div className="text-center">
                                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                <p className="font-bold text-gray-900 text-sm truncate max-w-[200px]">{proofFile.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{(proofFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                <p className="text-xs text-primary font-bold mt-1">Click to replace</p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="font-bold text-gray-900 text-sm">Upload receipt</p>
                                <p className="text-xs text-gray-500 mt-0.5">JPEG, PNG or PDF (Max 3MB)</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Transaction reference */}
                        <div>
                          <label className="block text-sm font-bold text-gray-800 mb-1.5">
                            Transaction Reference <span className="text-gray-400 font-normal">(Optional)</span>
                          </label>
                          <input 
                            type="text"
                            value={transactionReference}
                            onChange={(e) => setTransactionReference(e.target.value)}
                            placeholder="e.g. TR-298374928"
                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono text-sm"
                          />
                        </div>
                      </div>
                    );
                  }

                  // ─── COD or other types — no extra input needed ───
                  return null;
                })()}
            </section>
          </div>

          {/* RIGHT COLUMN: Order Summary */}
          <div className="lg:w-[420px] flex-shrink-0">
            <div className="bg-white p-4 sm:p-4 md:p-6 rounded-[2rem] shadow-lg border border-gray-200 sticky top-24">
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
                <div className="space-y-3 pt-6 border-t border-dashed border-gray-200 bg-gray-50/50 -mx-6 sm:-mx-8 px-6 sm:px-8 pb-6">
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
                    <div className={`mt-3 text-xs font-bold py-2 px-3 rounded-lg border ${checkoutMessage.type === 'error' ? 'text-red-700 bg-red-50 border-red-200' : 'text-green-700 bg-green-50 border-gray-200'}`}>
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

      {/* Address Selection Modal */}
      {isAddressSelectionOpen && (
        <div className="fixed inset-0 z-[60] flex justify-center sm:items-center items-end bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in-0 duration-300">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
              <h2 className="font-bold text-gray-900 text-lg">Select Address</h2>
              <button onClick={() => setIsAddressSelectionOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 sm:p-4 overflow-y-auto space-y-3 pb-safe">
              {addresses.map(addr => (
                <div 
                  key={addr.id}
                  onClick={() => {
                    setSelectedAddressId(addr.id);
                    setIsAddressSelectionOpen(false);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                    selectedAddressId === addr.id ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' : 'border-gray-100 hover:border-gray-200 bg-white hover:shadow-sm'
                  }`}
                >
                   <div className="flex justify-between items-start mb-2">
                       <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                           selectedAddressId === addr.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                       }`}>
                           {addr.label}
                       </span>
                       <div className="flex items-center gap-2">
                           <button 
                               onClick={(e) => {
                                   e.stopPropagation();
                                   setEditingAddress(addr);
                                   setIsAddressFormOpen(true);
                                   setIsAddressSelectionOpen(false);
                               }}
                               className="p-1.5 text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-primary/10"
                           >
                               <Edit2 className="w-4 h-4" />
                           </button>
                           {selectedAddressId === addr.id && <CheckCircle className="w-5 h-5 text-primary fill-current" />}
                       </div>
                   </div>
                   <p className="font-bold text-gray-900 text-sm mb-1">{addr.fullName} <span className="text-gray-500 font-normal ml-1">{addr.phone}</span></p>
                   <p className="text-xs text-gray-500 leading-relaxed">
                       {addr.street}, {addr.city}<br />
                       {addr.state && `${addr.state}, `}{addr.zip}
                   </p>
                </div>
              ))}
              
              <button 
                  onClick={() => {
                      setEditingAddress(null);
                      setIsAddressFormOpen(true);
                      setIsAddressSelectionOpen(false);
                  }}
                  className="w-full mt-2 py-3.5 border border-dashed border-gray-300 rounded-xl text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
              >
                  <Plus className="w-5 h-5" /> Add New Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Form Modal */}
      {isAddressFormOpen && (
        <AddressForm 
            initialData={editingAddress || undefined}
            onSubmit={handleAddAddress}
            onCancel={() => {
              setIsAddressFormOpen(false);
              setEditingAddress(null);
            }}
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
