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
  CheckCircle2,
  Inbox,
  Settings,
  Trash2,
  CheckCircle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { 
  getNotificationPreferences, 
  updateNotificationPreferences, 
  resetNotificationPreferences, 
  NotificationPreferences,
  AppNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications
} from '../../services/notificationService';
import { auth } from '../../services/firebaseClient';

interface NotificationsProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: any, param?: any) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ 
  onLoginClick, 
  cartItemCount, 
  onCartClick, 
  onNavigate 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inbox' | 'preferences'>('inbox');
  
  // Preferences State
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Inbox State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(true);

  useEffect(() => {
    fetchPreferences();
    fetchInbox();

    const currentUser = auth.currentUser;
    if (currentUser) {
      const unsubscribe = subscribeToNotifications(currentUser.uid, (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);
      });
      return () => unsubscribe();
    }
  }, []);

  const fetchPreferences = async () => {
    setLoadingPrefs(true);
    const data = await getNotificationPreferences();
    setPreferences(data);
    setLoadingPrefs(false);
  };

  const fetchInbox = async () => {
    setLoadingInbox(true);
    const currentUser = auth.currentUser;
    if (currentUser) {
      const data = await getNotifications(currentUser.uid);
      setNotifications(data);
    }
    setLoadingInbox(false);
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [key]: !preferences[key]
    });
  };

  const handleSave = async () => {
    if (!preferences) return;
    setIsSaving(true);
    setSaveError(null);
    const success = await updateNotificationPreferences(preferences);
    setIsSaving(false);
    
    if (success) {
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    } else {
      setSaveError('Failed to save preferences. Please try again.');
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all notification preferences to their defaults?')) return;
    setIsSaving(true);
    setSaveError(null);
    const defaults = await resetNotificationPreferences();
    setPreferences(defaults);
    setIsSaving(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const success = await markAsRead(id);
    if (success) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  const handleMarkAllAsRead = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const success = await markAllAsRead(currentUser.uid);
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await deleteNotification(id);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      const parts = notification.link.split('/');
      if (parts[1] === 'orders' && parts[2]) {
        // Special case for order links: we navigate to 'orders' with the param
        onNavigate('orders', parts[2]);
      } else {
        // Generic fallback
        onNavigate(notification.link.replace('/', ''));
      }
    }
  };

  const getIconForType = (type: string) => {
    switch(type) {
      case 'order_placed': return <Package className="w-5 h-5 text-blue-500" />;
      case 'order_status': return <Package className="w-5 h-5 text-indigo-500" />;
      case 'payment_status': return <ShieldCheck className="w-5 h-5 text-green-500" />;
      case 'promo': return <Tag className="w-5 h-5 text-primary" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  if (loadingPrefs && loadingInbox) {
    return (
      <AccountLayout activeTab="notifications" onNavigate={onNavigate} onCartClick={onCartClick} onLoginClick={onLoginClick} cartItemCount={cartItemCount} title="Notifications">
        <div className="bg-white p-6 sm:p-5 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-gray-500 font-bold">Loading...</p>
        </div>
      </AccountLayout>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AccountLayout
      activeTab="notifications"
      onNavigate={onNavigate}
      onCartClick={onCartClick}
      onLoginClick={onLoginClick}
      cartItemCount={cartItemCount}
      title="Notifications"
    >
      <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
        
        {/* Sub-navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl w-full sm:w-fit">
          <button
            onClick={() => setActiveSubTab('inbox')}
            className={`flex items-center gap-2 flex-1 sm:flex-none justify-center px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeSubTab === 'inbox' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            <Inbox className="w-4 h-4" /> Inbox
            {unreadCount > 0 && (
              <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('preferences')}
            className={`flex items-center gap-2 flex-1 sm:flex-none justify-center px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeSubTab === 'preferences' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            <Settings className="w-4 h-4" /> Preferences
          </button>
        </div>

        {/* ======================================================== */}
        {/* INBOX TAB                                                */}
        {/* ======================================================== */}
        {activeSubTab === 'inbox' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-gray-900">Activity Log</h3>
                <p className="text-xs font-bold text-gray-500">Your recent updates and alerts</p>
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-4 py-2 rounded-xl w-fit"
                >
                  <CheckCircle className="w-4 h-4" /> Mark all as read
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-50">
              {loadingInbox ? (
                <div className="p-6 flex justify-center"><Loader2 className="w-6 h-6 text-gray-300 animate-spin" /></div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-gray-300" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">No notifications yet</h4>
                  <p className="text-sm text-gray-500">When you place an order or receive an update, it will appear here.</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div 
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 sm:p-6 flex items-start gap-4 transition-colors cursor-pointer group ${
                      notification.is_read ? 'bg-white hover:bg-gray-50' : 'bg-primary/5 hover:bg-primary/10'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-1 ${
                      notification.is_read ? 'bg-gray-100' : 'bg-white shadow-sm'
                    }`}>
                      {getIconForType(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`text-sm truncate pr-4 ${notification.is_read ? 'font-bold text-gray-700' : 'font-black text-gray-900'}`}>
                          {notification.title}
                        </h4>
                        <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" /> {getTimeAgo(notification.created_at)}
                        </span>
                      </div>
                      <p className={`text-sm leading-snug mb-2 ${notification.is_read ? 'text-gray-500 font-medium' : 'text-gray-700 font-semibold'}`}>
                        {notification.message}
                      </p>
                      
                      {notification.link && (
                        <span className="text-xs font-bold text-primary flex items-center group-hover:underline">
                          View details <ChevronRight className="w-3 h-3 ml-0.5" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.is_read && (
                        <button 
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          title="Mark as read"
                          className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={(e) => handleDelete(notification.id, e)}
                        title="Delete"
                        className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PREFERENCES TAB                                          */}
        {/* ======================================================== */}
        {activeSubTab === 'preferences' && preferences && (
          <div className="space-y-8">
            <p className="text-gray-500 font-medium">
              Choose exactly how and when we contact you.
            </p>

            {saveError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 px-5 py-3 text-sm font-semibold">
                {saveError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5">
              
              {/* Section 1: Order Updates */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 bg-gray-50/50 border-b border-gray-50 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">Order Notifications</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tracking & Fulfillment</p>
                  </div>
                </div>
                <div className="p-4 md:p-6 divide-y divide-gray-50">
                  <NotificationToggle 
                    label="Order Confirmations" 
                    description="Get an instant alert when your order is placed successfully."
                    enabled={preferences.orderConfirmations}
                    onChange={() => handleToggle('orderConfirmations')}
                  />
                  <NotificationToggle 
                    label="Shipping Updates" 
                    description="Receive notifications when your parts leave our warehouse."
                    enabled={preferences.shippingUpdates}
                    onChange={() => handleToggle('shippingUpdates')}
                  />
                  <NotificationToggle 
                    label="Delivery Notifications" 
                    description="Final alert when your package has arrived at its destination."
                    enabled={preferences.deliveryNotifications}
                    onChange={() => handleToggle('deliveryNotifications')}
                  />
                  <NotificationToggle 
                    label="Order Cancellations" 
                    description="Updates regarding canceled or refunded orders."
                    enabled={preferences.orderCancellations}
                    onChange={() => handleToggle('orderCancellations')}
                    isLast
                  />
                </div>
              </div>

              {/* Section 2: Promotions */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 bg-gray-50/50 border-b border-gray-50 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-500">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">Promotions & Offers</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Marketing & Sales</p>
                  </div>
                </div>
                <div className="p-4 md:p-6 divide-y divide-gray-50">
                  <NotificationToggle 
                    label="Flash Sales" 
                    description="Early access to limited-time performance part sales."
                    enabled={preferences.flashSales}
                    onChange={() => handleToggle('flashSales')}
                  />
                  <NotificationToggle 
                    label="Discounts & Coupons" 
                    description="Personalized discount codes and seasonal offers."
                    enabled={preferences.discounts}
                    onChange={() => handleToggle('discounts')}
                  />
                  <NotificationToggle 
                    label="New Products" 
                    description="Be the first to know when new brands or parts are stocked."
                    enabled={preferences.newProducts}
                    onChange={() => handleToggle('newProducts')}
                    isLast
                  />
                </div>
              </div>

              {/* Section 3: Account */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 bg-gray-50/50 border-b border-gray-50 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-amber-500">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">Account & Security</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Important Alerts</p>
                  </div>
                </div>
                <div className="p-4 md:p-6 divide-y divide-gray-50">
                  <NotificationToggle 
                    label="Login Alerts" 
                    description="Get notified of logins from new devices or locations."
                    enabled={preferences.loginAlerts}
                    onChange={() => handleToggle('loginAlerts')}
                  />
                  <NotificationToggle 
                    label="Password Changes" 
                    description="Alerts whenever your password or security settings are changed."
                    enabled={preferences.passwordChanges}
                    onChange={() => handleToggle('passwordChanges')}
                    isLast
                  />
                </div>
              </div>

              {/* Section 4: Channels */}
              <div className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden text-white mt-4 relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />
                
                <div className="relative p-4 md:p-6 bg-white/5 border-b border-white/10 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">Communication Channels</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Where to reach you</p>
                  </div>
                </div>
                
                <div className="relative p-4 md:p-6 space-y-6">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Mail className={`w-5 h-5 ${preferences.email ? 'text-primary' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Email Delivery</h4>
                        <p className="text-xs text-gray-400 font-medium">Standard updates to your inbox</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={preferences.email} onChange={() => handleToggle('email')} />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                        <MessageSquare className={`w-5 h-5 ${preferences.whatsapp ? 'text-green-500' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">WhatsApp</h4>
                        <p className="text-xs text-gray-400 font-medium">Instant alerts on your phone</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={preferences.whatsapp} onChange={() => handleToggle('whatsapp')} />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="sticky bottom-4 sm:bottom-8 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-4 rounded-xl border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Reset to Defaults
              </button>
              
              <div className="flex items-center gap-4 w-full sm:w-auto">
                {showSavedToast && (
                  <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-green-600 bg-green-50 px-4 py-2 rounded-xl animate-in fade-in slide-in-from-right-4">
                    <CheckCircle2 className="w-4 h-4" /> Saved
                  </div>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-8 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl text-sm font-bold transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AccountLayout>
  );
};

export default Notifications;
