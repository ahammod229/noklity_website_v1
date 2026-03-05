import React, { useState, useEffect } from 'react';
import AccountLayout from '../../components/account/AccountLayout';
import NotificationToggle from '../../components/account/NotificationToggle';
import { 
  Bell, 
  Package, 
  Tag, 
  ShieldCheck, 
  Smartphone, 
  Mail, 
  MessageSquare, 
  Save, 
  RotateCcw,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { 
  getNotificationPreferences, 
  updateNotificationPreferences, 
  resetNotificationPreferences, 
  NotificationPreferences 
} from '../../services/notificationService';

interface NotificationsProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: any) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ 
  onLoginClick, 
  cartItemCount, 
  onCartClick, 
  onNavigate 
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    const data = await getNotificationPreferences();
    setPreferences(data);
    setLoading(false);
  };

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  const handleSave = async () => {
    if (!preferences) return;
    setIsSaving(true);
    setSaveError(null);
    const success = await updateNotificationPreferences(preferences);
    if (success) {
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    } else {
      setSaveError('Failed to save notification settings. Please try again.');
    }
    setIsSaving(false);
  };

  const handleReset = async () => {
    if (window.confirm('Reset all notification settings to default?')) {
      const defaults = await resetNotificationPreferences();
      setPreferences(defaults);
    }
  };

  if (loading) {
    return (
      <AccountLayout 
        activeTab="notifications" 
        onNavigate={onNavigate} 
        onCartClick={onCartClick} 
        onLoginClick={onLoginClick} 
        cartItemCount={cartItemCount} 
        title="Notification Preferences"
      >
        <div className="bg-white p-20 rounded-[3rem] border border-gray-100 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-gray-500 font-bold">Loading your preferences...</p>
        </div>
      </AccountLayout>
    );
  }

  if (!preferences) return null;

  return (
    <AccountLayout
      activeTab="notifications"
      onNavigate={onNavigate}
      onCartClick={onCartClick}
      onLoginClick={onLoginClick}
      cartItemCount={cartItemCount}
      title="Notifications"
    >
      <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
        
        {/* Intro */}
        <div>
          <p className="text-gray-500 font-medium">
            Stay updated on your orders and get the latest news on performance parts.
            Choose exactly how and when we contact you.
          </p>
        </div>

        {saveError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 px-5 py-3 text-sm font-semibold">
            {saveError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          
          {/* Section 1: Order Updates */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 bg-gray-50/50 border-b border-gray-50 flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Order Notifications</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tracking & Fulfillment</p>
              </div>
            </div>
            <div className="p-6 md:p-8 divide-y divide-gray-50">
              <NotificationToggle 
                label="Order Confirmations" 
                description="Get an instant alert when your order is placed successfully."
                enabled={preferences.orderConfirmations}
                onChange={(v) => handleToggle('orderConfirmations', v)}
              />
              <NotificationToggle 
                label="Shipping Updates" 
                description="Receive notifications when your parts leave our warehouse."
                enabled={preferences.shippingUpdates}
                onChange={(v) => handleToggle('shippingUpdates', v)}
              />
              <NotificationToggle 
                label="Delivery Notifications" 
                description="Final alert when your package has arrived at its destination."
                enabled={preferences.deliveryNotifications}
                onChange={(v) => handleToggle('deliveryNotifications', v)}
              />
              <NotificationToggle 
                label="Cancellations & Refunds" 
                description="Important alerts regarding payment issues or cancelled items."
                enabled={preferences.orderCancellations}
                onChange={(v) => handleToggle('orderCancellations', v)}
              />
            </div>
          </div>

          {/* Section 2: Marketing */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 bg-gray-50/50 border-b border-gray-50 flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-amber-500">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Promotions & Offers</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Deals & New Arrivals</p>
              </div>
            </div>
            <div className="p-6 md:p-8 divide-y divide-gray-50">
              <NotificationToggle 
                label="Flash Sales" 
                description="Be the first to know about limited-time price drops on top brands."
                enabled={preferences.flashSales}
                onChange={(v) => handleToggle('flashSales', v)}
              />
              <NotificationToggle 
                label="Personalized Discounts" 
                description="Exclusive coupons based on your garage and browsing history."
                enabled={preferences.discounts}
                onChange={(v) => handleToggle('discounts', v)}
              />
              <NotificationToggle 
                label="New Product Launches" 
                description="Alerts when we add new genuine performance parts to our catalog."
                enabled={preferences.newProducts}
                onChange={(v) => handleToggle('newProducts', v)}
              />
            </div>
          </div>

          {/* Section 3: Security */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 bg-gray-50/50 border-b border-gray-50 flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Account & Security</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Privacy & Protection</p>
              </div>
            </div>
            <div className="p-6 md:p-8 divide-y divide-gray-50">
              <NotificationToggle 
                label="New Login Alerts" 
                description="Immediate notification when your account is accessed from a new device."
                enabled={preferences.loginAlerts}
                onChange={(v) => handleToggle('loginAlerts', v)}
              />
              <NotificationToggle 
                label="Password Changes" 
                description="Confirmation alerts for security-sensitive account modifications."
                enabled={preferences.passwordChanges}
                onChange={(v) => handleToggle('passwordChanges', v)}
              />
            </div>
          </div>

          {/* Section 4: Channels */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 md:p-10">
            <h3 className="text-lg font-black text-gray-900 mb-2 flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400" />
              Communication Channels
            </h3>
            <p className="text-sm text-gray-500 font-medium mb-8">Choose the platforms where you want to receive the alerts enabled above.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => handleToggle('email', !preferences.email)}
                className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-4 ${
                  preferences.email ? 'border-primary bg-red-50/30' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${preferences.email ? 'bg-primary text-white' : 'bg-white text-gray-400 shadow-sm'}`}>
                  <Mail className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-black text-gray-900 text-sm">Email</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {preferences.email ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </button>

              <button 
                onClick={() => handleToggle('sms', !preferences.sms)}
                className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-4 ${
                  preferences.sms ? 'border-primary bg-red-50/30' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${preferences.sms ? 'bg-primary text-white' : 'bg-white text-gray-400 shadow-sm'}`}>
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-black text-gray-900 text-sm">SMS</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {preferences.sms ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </button>

              <button 
                onClick={() => handleToggle('whatsapp', !preferences.whatsapp)}
                className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-4 ${
                  preferences.whatsapp ? 'border-primary bg-red-50/30' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${preferences.whatsapp ? 'bg-green-500 text-white' : 'bg-white text-gray-400 shadow-sm'}`}>
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-black text-gray-900 text-sm">WhatsApp</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {preferences.whatsapp ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Sticky Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-gray-900 uppercase tracking-[0.2em] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Default
            </button>

            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto bg-primary text-white font-black px-10 py-4 rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Local Success Notification */}
      {showSavedToast && (
        <div className="fixed bottom-8 right-8 z-[100] bg-gray-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight">Preferences Updated</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Settings saved successfully</p>
          </div>
        </div>
      )}
    </AccountLayout>
  );
};

export default Notifications;
