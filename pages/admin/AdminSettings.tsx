import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Palette, 
  Layout, 
  MousePointer2, 
  Share2, 
  ShieldAlert, 
  Save, 
  RotateCcw,
  CheckCircle2,
  Loader2,
  Search,
  ShoppingCart,
  Heart,
  User,
  GripVertical,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import SettingsSection from '../../components/admin/SettingsSection';
import ImageUploader from '../../components/admin/ImageUploader';
import { getSettings, updateSettings, uploadAsset, WebsiteSettings } from '../../services/settingsService';

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const data = await getSettings();
    setSettings(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    const success = await updateSettings(settings);
    if (success) {
      setShowSavedToast(true);
      setHasChanges(false);
      setTimeout(() => setShowSavedToast(false), 3000);
    }
    setIsSaving(false);
  };

  const updateField = (path: string, value: any) => {
    if (!settings) return;
    setHasChanges(true);
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
  };

  const handleImageUpload = async (fieldPath: string, file: File) => {
    const url = await uploadAsset(file, 'branding');
    updateField(fieldPath, url);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (!settings) return;
    const newSections = [...settings.homePage.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    updateField('homePage.sections', newSections);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-bold">Loading Website Configuration...</p>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl pb-24 relative">
      
      {/* Maintenance Mode Warning Banner */}
      {settings.maintenance.enabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-start gap-4 animate-in slide-in-from-top-4">
          <div className="p-3 bg-amber-100 rounded-xl">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1">Maintenance Mode Active</h4>
            <p className="text-sm text-amber-700 font-medium">The public storefront is currently hidden from customers. Only admins can see the site.</p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm sticky top-0 z-50">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Website Settings</h2>
          <p className="text-gray-500 font-medium">Control your branding, layout, and global storefront behavior.</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <button 
              onClick={fetchSettings}
              className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`
              px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl
              ${!hasChanges 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                : 'bg-primary text-white hover:bg-red-700 active:scale-95 shadow-red-500/20'}
            `}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="space-y-8">
        
        {/* Branding */}
        <SettingsSection id="branding" title="Branding" subtitle="Logos & Identity" icon={Palette}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ImageUploader 
              label="Header Logo" 
              currentImage={settings.branding.headerLogo}
              onUpload={(file) => handleImageUpload('branding.headerLogo', file)}
              onRemove={() => updateField('branding.headerLogo', '')}
              helperText="Logo for navigation (SVG recommended)"
            />
            <ImageUploader 
              label="Footer Logo" 
              currentImage={settings.branding.footerLogo}
              onUpload={(file) => handleImageUpload('branding.footerLogo', file)}
              onRemove={() => updateField('branding.footerLogo', '')}
            />
            <ImageUploader 
              label="Favicon" 
              currentImage={settings.branding.favicon}
              onUpload={(file) => handleImageUpload('branding.favicon', file)}
              onRemove={() => updateField('branding.favicon', '')}
              aspectRatio="aspect-square"
              helperText="Browser icon (32x32px)"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Site Name</label>
              <input 
                type="text" 
                value={settings.branding.siteName}
                onChange={(e) => updateField('branding.siteName', e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Tagline</label>
              <input 
                type="text" 
                value={settings.branding.tagline}
                onChange={(e) => updateField('branding.tagline', e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
        </SettingsSection>

        {/* Header Settings */}
        <SettingsSection id="header" title="Header Configuration" subtitle="Navigation & Actions" icon={Layout}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ToggleCard 
              label="Search Bar" 
              icon={Search} 
              active={settings.header.showSearch} 
              onClick={() => updateField('header.showSearch', !settings.header.showSearch)} 
            />
            <ToggleCard 
              label="Wishlist Icon" 
              icon={Heart} 
              active={settings.header.showWishlist} 
              onClick={() => updateField('header.showWishlist', !settings.header.showWishlist)} 
            />
            <ToggleCard 
              label="Cart Drawer" 
              icon={ShoppingCart} 
              active={settings.header.showCart} 
              onClick={() => updateField('header.showCart', !settings.header.showCart)} 
            />
            <ToggleCard 
              label="Login Button" 
              icon={User} 
              active={settings.header.showLogin} 
              onClick={() => updateField('header.showLogin', !settings.header.showLogin)} 
            />
          </div>
          <div className="space-y-2 pt-4">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Banner Message / CTA Text</label>
            <input 
              type="text" 
              value={settings.header.ctaText}
              onChange={(e) => updateField('header.ctaText', e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
              placeholder="e.g. Free shipping on all orders over $100!"
            />
          </div>
        </SettingsSection>

        {/* Home Page Sections */}
        <SettingsSection id="home" title="Home Page Layout" subtitle="Sections Management" icon={MousePointer2}>
          <div className="space-y-3">
            {settings.homePage.sections.map((section, idx) => (
              <div 
                key={section.id} 
                className={`
                  flex items-center justify-between p-5 rounded-2xl border transition-all
                  ${section.enabled ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-60'}
                `}
              >
                <div className="flex items-center gap-4">
                  <div className="text-gray-300 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900">{section.name}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Order: {idx + 1}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => moveSection(idx, 'up')} 
                      disabled={idx === 0}
                      className="p-1 hover:text-primary disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => moveSection(idx, 'down')} 
                      disabled={idx === settings.homePage.sections.length - 1}
                      className="p-1 hover:text-primary disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      const newSections = [...settings.homePage.sections];
                      newSections[idx].enabled = !newSections[idx].enabled;
                      updateField('homePage.sections', newSections);
                    }}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                      ${section.enabled ? 'bg-primary' : 'bg-gray-200'}
                    `}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${section.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SettingsSection>

        {/* Footer Settings */}
        <SettingsSection id="footer" title="Footer Configuration" subtitle="Content & Links" icon={Layout}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Footer Description</label>
                <textarea 
                  rows={4}
                  value={settings.footer.description}
                  onChange={(e) => updateField('footer.description', e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Copyright Text</label>
                <input 
                  type="text" 
                  value={settings.footer.copyrightText}
                  onChange={(e) => updateField('footer.copyrightText', e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-6">
               <div className="space-y-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Support Email</label>
                <input 
                  type="email" 
                  value={settings.footer.supportEmail}
                  onChange={(e) => updateField('footer.supportEmail', e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">WhatsApp Number</label>
                <input 
                  type="text" 
                  value={settings.footer.whatsappNumber}
                  onChange={(e) => updateField('footer.whatsappNumber', e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="flex gap-4 pt-2">
                <ToggleRow 
                  label="Show Social Icons" 
                  active={settings.footer.showSocialIcons} 
                  onClick={() => updateField('footer.showSocialIcons', !settings.footer.showSocialIcons)} 
                />
                <ToggleRow 
                  label="Show Payment Icons" 
                  active={settings.footer.showPaymentIcons} 
                  onClick={() => updateField('footer.showPaymentIcons', !settings.footer.showPaymentIcons)} 
                />
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Social Links */}
        <SettingsSection id="social" title="Social Profiles" subtitle="Connect your communities" icon={Share2}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {['facebook', 'instagram', 'youtube', 'linkedin'].map((platform) => (
                <div key={platform} className="space-y-2">
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest capitalize">{platform} URL</label>
                  <input 
                    type="url" 
                    value={(settings.socialLinks as any)[platform]}
                    onChange={(e) => updateField(`socialLinks.${platform}`, e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                    placeholder={`https://${platform}.com/yourpage`}
                  />
                </div>
             ))}
           </div>
        </SettingsSection>

        {/* Maintenance Mode */}
        <SettingsSection id="maintenance" title="Store Status" subtitle="Access Control" icon={ShieldAlert}>
           <div className={`p-8 rounded-[2rem] border transition-all ${settings.maintenance.enabled ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-lg font-black text-gray-900">Maintenance Mode</h4>
                  <p className="text-sm text-gray-500 font-medium">When enabled, only administrators can access the storefront.</p>
                </div>
                <button 
                  onClick={() => updateField('maintenance.enabled', !settings.maintenance.enabled)}
                  className={`
                    relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none
                    ${settings.maintenance.enabled ? 'bg-amber-500' : 'bg-gray-300'}
                  `}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.maintenance.enabled ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
              </div>

              {settings.maintenance.enabled && (
                <div className="space-y-2 animate-in fade-in zoom-in-95">
                  <label className="block text-[11px] font-black text-amber-700 uppercase tracking-widest">Public Maintenance Message</label>
                  <textarea 
                    rows={3}
                    value={settings.maintenance.message}
                    onChange={(e) => updateField('maintenance.message', e.target.value)}
                    className="w-full px-5 py-4 bg-white border border-amber-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all resize-none"
                    placeholder="Tell your customers when you'll be back..."
                  />
                </div>
              )}
           </div>
        </SettingsSection>

      </div>

      {/* Success Notification */}
      {showSavedToast && (
        <div className="fixed bottom-8 right-8 z-[100] bg-gray-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight">Configuration Saved</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Store updated successfully</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Internal Helper Components
const ToggleCard = ({ label, icon: Icon, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`
      p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-4 group
      ${active ? 'bg-white border-primary shadow-lg shadow-red-500/5' : 'bg-gray-50 border-gray-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'}
    `}
  >
    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${active ? 'bg-primary text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="text-center">
      <p className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">{label}</p>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
        {active ? 'Enabled' : 'Hidden'}
      </p>
    </div>
  </button>
);

const ToggleRow = ({ label, active, onClick }: any) => (
  <div className="flex-1 flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
    <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{label}</span>
    <button 
      onClick={onClick}
      className={`
        relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none
        ${active ? 'bg-primary' : 'bg-gray-300'}
      `}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${active ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  </div>
);

export default AdminSettings;
