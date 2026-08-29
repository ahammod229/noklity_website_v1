import React, { useState, useEffect } from 'react';
import { Save, Loader2, Upload, X, Globe, MessageCircle, Mail, Image as ImageIcon } from 'lucide-react';
import { supabase, uploadFile } from '../../lib/supabase';
import { clearPublicSiteConfigCache } from '../../services/siteConfigService';
import { ADMIN_IMAGE_GUIDES } from '../../utils/adminImageGuides';
import { optimizeImageByGuide } from '../../utils/imageOptimization';

interface SiteConfig {
  header_logo_light: string;
  header_logo_dark: string;
  footer_logo: string;
  favicon_url: string;
  site_url: string;
  site_name: string;
  site_tagline: string;
  meta_description: string;
  meta_keywords: string;
  footer_text: string;
  support_email: string;
  whatsapp_number: string;
  facebook_url: string;
  instagram_url: string;
  youtube_url: string;
  currency_code: string;
  currency_locale: string;
}

const DEFAULT_CONFIG: SiteConfig = {
  header_logo_light: '',
  header_logo_dark: '',
  footer_logo: '',
  favicon_url: '',
  site_url: 'https://noklity.com',
  site_name: 'NOKLITY',
  site_tagline: 'Premium Automotive Performance Parts',
  meta_description: 'NOKLITY provides premium automotive performance products.',
  meta_keywords: 'automotive, performance parts, brakes, exhaust, engine',
  footer_text: '© 2024 NOKLITY Automotive. All rights reserved.',
  support_email: 'support@noklity.com',
  whatsapp_number: '+15551234567',
  facebook_url: '',
  instagram_url: '',
  youtube_url: '',
  currency_code: 'BDT',
  currency_locale: 'en-BD'
};

const SiteSettings: React.FC = () => {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) {
        console.error('Error fetching settings:', error);
        // Fallback to defaults if table doesn't exist or empty
        return;
      }

      if (data) {
        const newConfig = { ...DEFAULT_CONFIG };
        data.forEach((item: any) => {
          if (item.key in newConfig) {
            (newConfig as any)[item.key] = item.value;
          }
        });
        setConfig(newConfig);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const upsertData = Object.entries(config).map(([key, value]) => ({
        key,
        value
      }));

      const { error } = await supabase
        .from('site_settings')
        .upsert(upsertData, { onConflict: 'key' });

      if (error) throw error;
      clearPublicSiteConfigCache();
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: keyof SiteConfig) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(key);
    try {
      const guideByKey: Partial<Record<keyof SiteConfig, keyof typeof ADMIN_IMAGE_GUIDES>> = {
        header_logo_light: 'headerLogo',
        header_logo_dark: 'headerLogo',
        footer_logo: 'footerLogo',
        favicon_url: 'favicon'
      };
      const guideKey = guideByKey[key];

      const optimized = guideKey
        ? await optimizeImageByGuide(file, ADMIN_IMAGE_GUIDES[guideKey], { fileNamePrefix: String(key) })
        : file;
      const fileToUpload = optimized instanceof File ? optimized : optimized.file;
      const fileName = fileToUpload.name || `${key}-${Date.now()}.webp`;
      const filePath = `branding/${fileName}`;

      const { publicUrl } = await uploadFile('assets', filePath, fileToUpload, { upsert: false });
      
      setConfig(prev => ({ ...prev, [key]: publicUrl }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload image. Ensure you are logged in as admin and have storage permissions.');
    } finally {
      setUploading(null);
    }
  };

  const InputField = ({ label, value, onChange, icon: Icon }: any) => (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input 
          type="text" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-gray-50 border border-gray-200 rounded-xl py-3 ${Icon ? 'pl-12' : 'pl-4'} pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all`}
        />
      </div>
    </div>
  );

  const ImageUploadField = ({ label, value, uploadKey }: { label: string, value: string, uploadKey: keyof SiteConfig }) => (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</label>
      <div className="flex items-start gap-4">
        <div className="w-24 h-24 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden relative group">
          {value ? (
            <img src={value} alt={label} className="w-full h-full object-contain p-2" />
          ) : (
            <ImageIcon className="w-8 h-8 text-gray-300" />
          )}
          {uploading === uploadKey && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer transition-all shadow-sm">
            <Upload className="w-4 h-4" />
            Upload New
            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, uploadKey)} />
          </label>
          <p className="text-[10px] text-gray-400 mt-2">Recommended: SVG or PNG, max 2MB.</p>
          {value && (
            <button 
              onClick={() => setConfig(prev => ({ ...prev, [uploadKey]: '' }))}
              className="mt-2 text-xs text-red-500 font-bold hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-bold">Loading Settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Site Content</h2>
          <p className="text-gray-500 font-medium">Manage global website information and assets.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Branding */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-black text-gray-900">Branding</h3>
          </div>
          <ImageUploadField 
            label="Header Logo (Light Mode)" 
            value={config.header_logo_light} 
            uploadKey="header_logo_light" 
          />
          <ImageUploadField 
            label="Header Logo (Dark Mode)" 
            value={config.header_logo_dark} 
            uploadKey="header_logo_dark" 
          />
          <ImageUploadField
            label="Footer Logo"
            value={config.footer_logo}
            uploadKey="footer_logo"
          />
          <ImageUploadField
            label="Favicon"
            value={config.favicon_url}
            uploadKey="favicon_url"
          />
          <InputField
            label="Site URL"
            value={config.site_url}
            onChange={(v: string) => setConfig(p => ({ ...p, site_url: v }))}
            icon={Globe}
          />
          <InputField
            label="Site Name"
            value={config.site_name}
            onChange={(v: string) => setConfig(p => ({ ...p, site_name: v }))}
            icon={Globe}
          />
          <InputField
            label="Tagline"
            value={config.site_tagline}
            onChange={(v: string) => setConfig(p => ({ ...p, site_tagline: v }))}
            icon={Globe}
          />
        </div>

        {/* Contact Info */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-black text-gray-900">Contact & Footer</h3>
          </div>
          
          <InputField 
            label="Support Email" 
            value={config.support_email} 
            onChange={(v: string) => setConfig(p => ({ ...p, support_email: v }))} 
            icon={Mail}
          />
          
          <InputField 
            label="WhatsApp Number" 
            value={config.whatsapp_number} 
            onChange={(v: string) => setConfig(p => ({ ...p, whatsapp_number: v }))} 
            icon={MessageCircle}
          />

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Currency</label>
            <select
              value={config.currency_code}
              onChange={(e) => {
                const code = e.target.value;
                const localeMap: Record<string, string> = {
                  BDT: 'en-BD',
                  USD: 'en-US',
                  INR: 'en-IN'
                };
                setConfig((p) => ({ ...p, currency_code: code, currency_locale: localeMap[code] || 'en-BD' }));
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            >
              <option value="BDT">Bangladesh Taka (BDT)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="INR">Indian Rupee (INR)</option>
            </select>
            <p className="text-[10px] text-gray-400 font-semibold">Default recommended: Bangladesh Taka (BDT)</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Footer Copyright Text</label>
            <textarea 
              rows={3}
              value={config.footer_text}
              onChange={(e) => setConfig(p => ({ ...p, footer_text: e.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Meta Description</label>
            <textarea
              rows={3}
              value={config.meta_description}
              onChange={(e) => setConfig(p => ({ ...p, meta_description: e.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
            />
          </div>

          <InputField
            label="Meta Keywords"
            value={config.meta_keywords}
            onChange={(v: string) => setConfig(p => ({ ...p, meta_keywords: v }))}
            icon={Globe}
          />

          <InputField
            label="Facebook URL"
            value={config.facebook_url}
            onChange={(v: string) => setConfig(p => ({ ...p, facebook_url: v }))}
            icon={Globe}
          />
          <InputField
            label="Instagram URL"
            value={config.instagram_url}
            onChange={(v: string) => setConfig(p => ({ ...p, instagram_url: v }))}
            icon={Globe}
          />
          <InputField
            label="YouTube URL"
            value={config.youtube_url}
            onChange={(v: string) => setConfig(p => ({ ...p, youtube_url: v }))}
            icon={Globe}
          />
        </div>
      </div>
    </div>
  );
};

export default SiteSettings;
