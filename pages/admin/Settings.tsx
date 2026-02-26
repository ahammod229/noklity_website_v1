import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { clearPublicSiteConfigCache } from '../../services/siteConfigService';

type SettingsTab =
  | 'general'
  | 'users'
  | 'security'
  | 'notifications'
  | 'billing'
  | 'api'
  | 'backup'
  | 'system'
  | 'logs'
  | 'advanced'
  | 'appearance';

type FieldType = 'text' | 'email' | 'number' | 'textarea' | 'select' | 'switch' | 'color';

interface SettingField {
  key: string;
  label: string;
  type: FieldType;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  helper?: string;
}

interface TabConfig {
  id: SettingsTab;
  label: string;
  fields: SettingField[];
}

const TABS: TabConfig[] = [
  {
    id: 'general',
    label: 'General',
    fields: [
      { key: 'site_name', label: 'Site Name', type: 'text' },
      { key: 'support_email', label: 'Contact Email', type: 'email' },
      {
        key: 'currency_code',
        label: 'Currency',
        type: 'select',
        options: [
          { label: 'BDT (Taka)', value: 'BDT' },
          { label: 'USD (Dollar)', value: 'USD' },
          { label: 'INR (Rupee)', value: 'INR' }
        ]
      },
      {
        key: 'base_currency_code',
        label: 'Base Currency (Product prices are stored in this)',
        type: 'select',
        options: [
          { label: 'BDT (Taka)', value: 'BDT' },
          { label: 'USD (Dollar)', value: 'USD' },
          { label: 'INR (Rupee)', value: 'INR' }
        ]
      },
      {
        key: 'exchange_rate_usd',
        label: 'Exchange Rate USD',
        type: 'number',
        helper: 'How many base-currency units equal 1 USD'
      },
      {
        key: 'exchange_rate_inr',
        label: 'Exchange Rate INR',
        type: 'number',
        helper: 'How many base-currency units equal 1 INR'
      }
    ]
  },
  {
    id: 'users',
    label: 'Users & Roles',
    fields: [
      { key: 'allow_self_signup', label: 'Allow self sign-up', type: 'switch' },
      { key: 'require_email_verification', label: 'Require email verification', type: 'switch' },
      { key: 'allow_guest_checkout', label: 'Allow guest checkout', type: 'switch' },
      {
        key: 'default_user_role',
        label: 'Default role for new users',
        type: 'select',
        options: [
          { label: 'User', value: 'user' },
          { label: 'Customer', value: 'customer' }
        ]
      }
    ]
  },
  {
    id: 'security',
    label: 'Security',
    fields: [
      { key: 'admin_2fa_required', label: 'Require 2FA for admin accounts', type: 'switch' },
      { key: 'enforce_strong_password', label: 'Enforce strong passwords', type: 'switch' },
      { key: 'password_min_length', label: 'Minimum password length', type: 'number' },
      { key: 'session_timeout_minutes', label: 'Session timeout (minutes)', type: 'number' },
      { key: 'max_login_attempts', label: 'Max failed login attempts', type: 'number' }
    ]
  },
  {
    id: 'notifications',
    label: 'Notifications',
    fields: [
      { key: 'notification_email', label: 'Admin notification email', type: 'email' },
      { key: 'notify_new_order', label: 'Notify on new order', type: 'switch' },
      { key: 'notify_payment_update', label: 'Notify on payment update', type: 'switch' },
      { key: 'notify_new_customer', label: 'Notify on new customer', type: 'switch' },
      { key: 'notify_support_ticket', label: 'Notify on support ticket', type: 'switch' }
    ]
  },
  {
    id: 'billing',
    label: 'Payment & Billing',
    fields: [
      { key: 'default_tax_rate', label: 'Default tax rate (%)', type: 'number' },
      { key: 'default_shipping_fee', label: 'Default shipping fee (base currency)', type: 'number' },
      { key: 'invoice_prefix', label: 'Invoice prefix', type: 'text' },
      { key: 'payment_auto_confirm', label: 'Auto-confirm digital payments', type: 'switch' }
    ]
  },
  {
    id: 'api',
    label: 'API & Integration',
    fields: [
      { key: 'public_api_enabled', label: 'Enable public API', type: 'switch' },
      { key: 'enable_cors', label: 'Enable CORS', type: 'switch' },
      { key: 'api_rate_limit_per_minute', label: 'API rate limit / minute', type: 'number' },
      { key: 'webhook_url', label: 'Webhook URL', type: 'text', placeholder: 'https://example.com/webhook' }
    ]
  },
  {
    id: 'backup',
    label: 'Backup & Restore',
    fields: [
      { key: 'auto_backup_enabled', label: 'Enable automatic backups', type: 'switch' },
      {
        key: 'backup_frequency',
        label: 'Backup frequency',
        type: 'select',
        options: [
          { label: 'Daily', value: 'daily' },
          { label: 'Weekly', value: 'weekly' },
          { label: 'Monthly', value: 'monthly' }
        ]
      },
      { key: 'backup_retention_days', label: 'Backup retention (days)', type: 'number' }
    ]
  },
  {
    id: 'system',
    label: 'System Preferences',
    fields: [
      {
        key: 'timezone',
        label: 'Timezone',
        type: 'select',
        options: [
          { label: 'Asia/Dhaka', value: 'Asia/Dhaka' },
          { label: 'UTC', value: 'UTC' },
          { label: 'America/New_York', value: 'America/New_York' }
        ]
      },
      {
        key: 'date_format',
        label: 'Date format',
        type: 'select',
        options: [
          { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
          { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
          { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
        ]
      },
      { key: 'maintenance_mode', label: 'Maintenance mode', type: 'switch' },
      { key: 'maintenance_message', label: 'Maintenance message', type: 'textarea' }
    ]
  },
  {
    id: 'logs',
    label: 'Audit Logs',
    fields: []
  },
  {
    id: 'advanced',
    label: 'Advanced',
    fields: [
      { key: 'custom_head_script', label: 'Custom <head> script', type: 'textarea' },
      { key: 'custom_footer_script', label: 'Custom footer script', type: 'textarea' }
    ]
  },
  {
    id: 'appearance',
    label: 'Appearance',
    fields: [
      { key: 'primary_color', label: 'Primary color', type: 'color' },
      { key: 'accent_color', label: 'Accent color', type: 'color' },
      { key: 'border_radius_px', label: 'Border radius (px)', type: 'number' },
      { key: 'compact_sidebar', label: 'Use compact sidebar', type: 'switch' }
    ]
  }
];

const DEFAULT_VALUES: Record<string, string> = {
  site_name: 'NOKLITY',
  support_email: 'support@noklity.com',
  header_logo_light: '',
  currency_code: 'BDT',
  currency_locale: 'en-BD',
  base_currency_code: 'BDT',
  exchange_rate_usd: '121.5',
  exchange_rate_inr: '1.45',

  allow_self_signup: 'true',
  require_email_verification: 'true',
  allow_guest_checkout: 'true',
  default_user_role: 'user',

  admin_2fa_required: 'false',
  enforce_strong_password: 'true',
  password_min_length: '8',
  session_timeout_minutes: '120',
  max_login_attempts: '5',

  notification_email: 'support@noklity.com',
  notify_new_order: 'true',
  notify_payment_update: 'true',
  notify_new_customer: 'false',
  notify_support_ticket: 'true',

  default_tax_rate: '8',
  default_shipping_fee: '15',
  invoice_prefix: 'INV',
  payment_auto_confirm: 'false',

  public_api_enabled: 'false',
  enable_cors: 'true',
  api_rate_limit_per_minute: '60',
  webhook_url: '',

  auto_backup_enabled: 'true',
  backup_frequency: 'daily',
  backup_retention_days: '30',

  timezone: 'Asia/Dhaka',
  date_format: 'DD/MM/YYYY',
  maintenance_mode: 'false',
  maintenance_message: 'We are currently performing maintenance. Please check back soon.',

  custom_head_script: '',
  custom_footer_script: '',

  primary_color: '#e11d48',
  accent_color: '#0f172a',
  border_radius_px: '12',
  compact_sidebar: 'false'
};

const localeByCurrency: Record<string, string> = {
  BDT: 'en-BD',
  USD: 'en-US',
  INR: 'en-IN'
};

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [values, setValues] = useState<Record<string, string>>(DEFAULT_VALUES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [settingsRows, setSettingsRows] = useState<Array<{ key: string; value: string; updated_at?: string }>>([]);

  const activeTabConfig = useMemo(() => TABS.find((tab) => tab.id === activeTab) || TABS[0], [activeTab]);

  const fetchSettings = async () => {
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.from('site_settings').select('key,value,updated_at');
    if (error) {
      setLoading(false);
      setMessage({ type: 'error', text: error.message || 'Failed to load settings.' });
      return;
    }

    const nextValues = { ...DEFAULT_VALUES };
    for (const row of data || []) {
      nextValues[row.key] = row.value || '';
    }
    setValues(nextValues);
    setSettingsRows((data || []) as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const setFieldValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleUploadLogo = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setMessage(null);

    try {
      const ext = file.name.split('.').pop() || 'png';
      const filePath = `branding/site-logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('assets').upload(filePath, file, { upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('assets').getPublicUrl(filePath);
      setFieldValue('header_logo_light', data.publicUrl);
      if (!values.header_logo_dark) setFieldValue('header_logo_dark', data.publicUrl);
      if (!values.footer_logo) setFieldValue('footer_logo', data.publicUrl);
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Logo upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const saveCurrentTab = async () => {
    setSaving(true);
    setMessage(null);

    const keysToSave = new Set<string>(activeTabConfig.fields.map((field) => field.key));
    if (activeTab === 'general') {
      keysToSave.add('header_logo_light');
      keysToSave.add('header_logo_dark');
      keysToSave.add('footer_logo');
      keysToSave.add('currency_locale');
      if (!values.currency_locale) {
        setFieldValue('currency_locale', localeByCurrency[values.currency_code] || 'en-BD');
      }
    }

    const upserts = Array.from(keysToSave).map((key) => {
      let value = values[key] ?? '';
      if (key === 'currency_locale') {
        value = values.currency_locale || localeByCurrency[values.currency_code] || 'en-BD';
      }
      return { key, value };
    });

    const { error } = await supabase.from('site_settings').upsert(upserts, { onConflict: 'key' });
    setSaving(false);

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to save settings.' });
      return;
    }

    clearPublicSiteConfigCache();
    setMessage({ type: 'success', text: `${activeTabConfig.label} settings saved successfully.` });
    fetchSettings();
  };

  const renderField = (field: SettingField) => {
    const value = values[field.key] ?? '';

    if (field.type === 'switch') {
      const checked = value === 'true';
      return (
        <label className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-3">
          <span className="text-sm font-bold text-gray-800">{field.label}</span>
          <button
            type="button"
            onClick={() => setFieldValue(field.key, checked ? 'false' : 'true')}
            className={`w-12 h-7 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${checked ? 'left-6' : 'left-1'}`}
            />
          </button>
        </label>
      );
    }

    if (field.type === 'select') {
      return (
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">{field.label}</label>
          <select
            value={value}
            onChange={(e) => {
              const next = e.target.value;
              setFieldValue(field.key, next);
              if (field.key === 'currency_code') {
                setFieldValue('currency_locale', localeByCurrency[next] || 'en-BD');
              }
            }}
            className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold"
          >
            {(field.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {field.helper && <p className="text-xs text-gray-500 mt-1">{field.helper}</p>}
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">{field.label}</label>
          <textarea
            rows={4}
            value={value}
            onChange={(e) => setFieldValue(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold"
          />
        </div>
      );
    }

    if (field.type === 'color') {
      return (
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">{field.label}</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => setFieldValue(field.key, e.target.value)}
              className="w-14 h-12 rounded-xl border border-gray-200 bg-white"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => setFieldValue(field.key, e.target.value)}
              className="flex-1 h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold"
            />
          </div>
        </div>
      );
    }

    return (
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">{field.label}</label>
        <input
          type={field.type}
          value={value}
          onChange={(e) => setFieldValue(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold"
        />
        {field.helper && <p className="text-xs text-gray-500 mt-1">{field.helper}</p>}
      </div>
    );
  };

  const recentSettings = useMemo(
    () => [...settingsRows].sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || '')).slice(0, 20),
    [settingsRows]
  );

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
        <p className="text-sm font-bold text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Settings</h2>
        <p className="text-gray-500 font-medium">Manage store-wide settings from one place.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-lg font-black text-gray-900 mb-3">Settings</h3>
          <div className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  activeTab === tab.id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-6">{activeTabConfig.label}</h3>

          {message && (
            <div
              className={`mb-4 rounded-xl px-4 py-3 text-sm font-bold ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {activeTab === 'general' && (
            <div className="mb-5">
              <label className="block text-sm font-bold text-gray-700 mb-2">Site Logo</label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 h-11 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Choose Logo'}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleUploadLogo(e.target.files?.[0])}
                  />
                </label>
                <input
                  type="text"
                  value={values.header_logo_light}
                  onChange={(e) => setFieldValue('header_logo_light', e.target.value)}
                  placeholder="Logo URL"
                  className="min-w-[260px] flex-1 h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold"
                />
              </div>
              {values.header_logo_light && (
                <img
                  src={values.header_logo_light}
                  alt="Site logo preview"
                  className="mt-3 w-20 h-20 rounded-xl border border-gray-200 object-cover bg-white"
                />
              )}
            </div>
          )}

          {activeTab === 'logs' ? (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest font-black text-gray-500">Key</th>
                      <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest font-black text-gray-500">Value</th>
                      <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest font-black text-gray-500">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSettings.map((row) => (
                      <tr key={row.key} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-xs font-mono font-bold text-gray-700">{row.key}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-600 max-w-[420px] truncate" title={row.value}>
                          {row.value || '-'}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-500">
                          {row.updated_at ? new Date(row.updated_at).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {activeTabConfig.fields.map((field) => (
                <div key={field.key}>{renderField(field)}</div>
              ))}

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={saveCurrentTab}
                  disabled={saving || uploading}
                  className="h-11 px-6 rounded-xl bg-primary text-white font-black text-sm hover:bg-red-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminSettings;
