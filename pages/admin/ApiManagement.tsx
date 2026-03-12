import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  ShieldCheck,
  TestTube2,
  Trash2,
  Truck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  getSteadfastConfig,
  saveSteadfastConfig,
  testSteadfastConnection
} from '../../services/steadfastDeliveryService';
import { useAuth } from '../../contexts/AuthContext';

interface ApiIntegration {
  id: string;
  key: string;
  name: string;
  base_url: string | null;
  auth_type: 'none' | 'api_key' | 'bearer' | 'basic';
  secret_ref: string | null;
  status: 'active' | 'inactive';
  last_checked_at: string | null;
  notes: string | null;
}

const defaultForm = {
  key: '',
  name: '',
  base_url: '',
  auth_type: 'api_key',
  secret_ref: '',
  notes: ''
};

const ApiManagement: React.FC = () => {
  const { user, session, isLoading: authLoading, isAdmin } = useAuth();
  const hasAdminSession = Boolean(user && isAdmin && session?.access_token);
  const [sessionRecoveryTried, setSessionRecoveryTried] = useState(false);
  const [items, setItems] = useState<ApiIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const [steadfastLoading, setSteadfastLoading] = useState(true);
  const [steadfastSaving, setSteadfastSaving] = useState(false);
  const [steadfastTesting, setSteadfastTesting] = useState(false);
  const [steadfastError, setSteadfastError] = useState('');
  const [steadfastSuccess, setSteadfastSuccess] = useState('');
  const [steadfastBalance, setSteadfastBalance] = useState<string | null>(null);
  const [steadfastForm, setSteadfastForm] = useState({
    enabled: false,
    autoCreate: false,
    trackingEnabled: true,
    baseUrl: 'https://portal.packzy.com/api/v1',
    apiKey: '',
    secretKey: '',
    configured: false,
    status: 'inactive' as 'active' | 'inactive',
    lastCheckedAt: null as string | null,
    apiKeyMasked: '',
    secretKeyMasked: ''
  });

  const fetchItems = async () => {
    if (!hasAdminSession) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('api_integrations')
      .select('*')
      .neq('key', 'steadfast')
      .order('created_at', { ascending: false });

    if (error) {
      alert(error.message || 'Failed to load API integrations');
    } else {
      setItems((data || []) as ApiIntegration[]);
    }
    setLoading(false);
  };

  const fetchSteadfastConfig = async (allowRetry = true) => {
    if (!hasAdminSession) {
      setSteadfastLoading(false);
      return;
    }

    setSteadfastLoading(true);
    setSteadfastError('');
    try {
      const config = await getSteadfastConfig();
      setSteadfastForm((prev) => ({
        ...prev,
        enabled: config.enabled,
        autoCreate: config.autoCreate,
        trackingEnabled: config.trackingEnabled,
        baseUrl: config.baseUrl || 'https://portal.packzy.com/api/v1',
        configured: config.configured,
        status: config.status,
        lastCheckedAt: config.lastCheckedAt,
        apiKeyMasked: config.apiKeyMasked,
        secretKeyMasked: config.secretKeyMasked
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load Steadfast configuration.';
      const isTokenError = /session token|invalid jwt/i.test(message);

      if (allowRetry && isTokenError) {
        try {
          await supabase.auth.refreshSession();
        } catch {
          // Keep original error below if refresh fails
        }
        await fetchSteadfastConfig(false);
        return;
      }

      setSteadfastError(message);
    } finally {
      setSteadfastLoading(false);
    }
  };

  const isSessionTokenError = /session token|invalid jwt/i.test(steadfastError);

  const clearStoredSupabaseAuth = () => {
    const clearKeys = (storage: Storage | undefined) => {
      if (!storage) return;
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (!key) continue;
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => storage.removeItem(key));
    };

    if (typeof window !== 'undefined') {
      clearKeys(window.localStorage);
      clearKeys(window.sessionStorage);
    }
  };

  const handleReloginAdminSession = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // ignore and continue with redirect
    } finally {
      clearStoredSupabaseAuth();
    }
    window.location.replace('/login');
  };

  useEffect(() => {
    if (authLoading) return;

    if (user && isAdmin && !session?.access_token && !sessionRecoveryTried) {
      setSessionRecoveryTried(true);
      void supabase.auth.refreshSession();
      return;
    }

    if (!hasAdminSession) {
      setLoading(false);
      setSteadfastLoading(false);
      setItems([]);
      setSteadfastError(
        user && isAdmin
          ? 'Admin session token is missing or expired. Click Re-login Admin Session to continue.'
          : ''
      );
      return;
    }

    setSessionRecoveryTried(false);
    void Promise.all([fetchItems(), fetchSteadfastConfig()]);
  }, [authLoading, hasAdminSession, isAdmin, session?.access_token, sessionRecoveryTried, user]);

  const addIntegration = async () => {
    if (!form.key.trim() || !form.name.trim()) {
      alert('Key and Name are required');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('api_integrations').insert({
      key: form.key.trim(),
      name: form.name.trim(),
      base_url: form.base_url.trim() || null,
      auth_type: form.auth_type,
      secret_ref: form.secret_ref.trim() || null,
      status: 'inactive',
      notes: form.notes.trim() || null
    });
    setSaving(false);

    if (error) {
      alert(error.message || 'Failed to add integration');
      return;
    }

    setForm(defaultForm);
    fetchItems();
  };

  const updateItem = async (id: string, updates: Partial<ApiIntegration>) => {
    const payload = { ...updates } as Record<string, unknown>;
    if (updates.status === 'active') {
      payload.last_checked_at = new Date().toISOString();
    }

    const { error } = await supabase.from('api_integrations').update(payload).eq('id', id);
    if (error) {
      alert(error.message || 'Failed to update integration');
      return;
    }

    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...payload } as ApiIntegration : item)));
  };

  const removeItem = async (id: string) => {
    if (!window.confirm('Delete this API integration?')) return;
    const { error } = await supabase.from('api_integrations').delete().eq('id', id);
    if (error) {
      alert(error.message || 'Failed to delete integration');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveSteadfast = async () => {
    setSteadfastError('');
    setSteadfastSuccess('');
    setSteadfastSaving(true);
    try {
      const saved = await saveSteadfastConfig({
        enabled: steadfastForm.enabled,
        autoCreate: steadfastForm.autoCreate,
        trackingEnabled: steadfastForm.trackingEnabled,
        baseUrl: steadfastForm.baseUrl.trim() || 'https://portal.packzy.com/api/v1',
        apiKey: steadfastForm.apiKey.trim(),
        secretKey: steadfastForm.secretKey.trim()
      });

      setSteadfastForm((prev) => ({
        ...prev,
        configured: saved.configured,
        enabled: saved.enabled,
        autoCreate: saved.autoCreate,
        trackingEnabled: saved.trackingEnabled,
        baseUrl: saved.baseUrl,
        status: saved.status,
        lastCheckedAt: saved.lastCheckedAt || new Date().toISOString(),
        apiKeyMasked: saved.apiKeyMasked,
        secretKeyMasked: saved.secretKeyMasked,
        apiKey: '',
        secretKey: ''
      }));
      setSteadfastSuccess('Steadfast settings saved successfully.');
    } catch (error) {
      setSteadfastError(error instanceof Error ? error.message : 'Failed to save Steadfast settings.');
    } finally {
      setSteadfastSaving(false);
    }
  };

  const handleTestSteadfast = async () => {
    setSteadfastError('');
    setSteadfastSuccess('');
    setSteadfastTesting(true);
    try {
      const result = await testSteadfastConnection();
      setSteadfastSuccess(result.message);
      setSteadfastBalance(result.balance);
      await fetchSteadfastConfig();
    } catch (error) {
      setSteadfastError(error instanceof Error ? error.message : 'Steadfast connection failed.');
    } finally {
      setSteadfastTesting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">API Management</h2>
          <p className="text-gray-500 font-medium">Configure delivery and other third-party integrations.</p>
        </div>
        <button
          onClick={() => {
            void fetchItems();
            void fetchSteadfastConfig();
          }}
          className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900">Steadfast Courier Integration</h3>
            <p className="text-sm text-gray-500 font-medium">
              Add your Steadfast API keys, enable delivery sync, and allow customer tracking.
            </p>
          </div>
        </div>

        {steadfastError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>{steadfastError}</span>
            {isSessionTokenError && (
              <button
                type="button"
                onClick={handleReloginAdminSession}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors whitespace-nowrap"
              >
                Re-login Admin Session
              </button>
            )}
          </div>
        )}
        {steadfastSuccess && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {steadfastSuccess}
          </div>
        )}

        {steadfastLoading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={steadfastForm.enabled}
                  onChange={(e) => setSteadfastForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                />
                Enable Steadfast delivery
              </label>
              <label className="inline-flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={steadfastForm.autoCreate}
                  onChange={(e) => setSteadfastForm((prev) => ({ ...prev, autoCreate: e.target.checked }))}
                />
                Auto-create parcel from admin
              </label>
              <label className="inline-flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={steadfastForm.trackingEnabled}
                  onChange={(e) => setSteadfastForm((prev) => ({ ...prev, trackingEnabled: e.target.checked }))}
                />
                Allow customer tracking
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold"
                placeholder="Base URL"
                value={steadfastForm.baseUrl}
                onChange={(e) => setSteadfastForm((prev) => ({ ...prev, baseUrl: e.target.value }))}
              />
              <input
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold"
                placeholder={steadfastForm.apiKeyMasked ? `API Key (${steadfastForm.apiKeyMasked})` : 'API Key'}
                value={steadfastForm.apiKey}
                onChange={(e) => setSteadfastForm((prev) => ({ ...prev, apiKey: e.target.value }))}
              />
              <input
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold"
                type="password"
                placeholder={steadfastForm.secretKeyMasked ? `Secret Key (${steadfastForm.secretKeyMasked})` : 'Secret Key'}
                value={steadfastForm.secretKey}
                onChange={(e) => setSteadfastForm((prev) => ({ ...prev, secretKey: e.target.value }))}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-500">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                Status: {steadfastForm.status}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700">
                <KeyRound className="w-3.5 h-3.5" />
                Configured: {steadfastForm.configured ? 'Yes' : 'No'}
              </span>
              {steadfastForm.lastCheckedAt && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700">
                  Last checked: {new Date(steadfastForm.lastCheckedAt).toLocaleString()}
                </span>
              )}
              {steadfastBalance && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Balance: {steadfastBalance}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={handleSaveSteadfast}
                disabled={steadfastSaving}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold flex items-center gap-2 disabled:opacity-60"
              >
                {steadfastSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Steadfast Settings
              </button>
              <button
                onClick={handleTestSteadfast}
                disabled={steadfastTesting}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-bold flex items-center gap-2 disabled:opacity-60"
              >
                {steadfastTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube2 className="w-4 h-4" />}
                Test Connection
              </button>
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Other Integrations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold"
            placeholder="Key (shiprocket)"
            value={form.key}
            onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
          />
          <input
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold"
            placeholder="Base URL"
            value={form.base_url}
            onChange={(e) => setForm((p) => ({ ...p, base_url: e.target.value }))}
          />
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold"
            value={form.auth_type}
            onChange={(e) => setForm((p) => ({ ...p, auth_type: e.target.value as ApiIntegration['auth_type'] }))}
          >
            <option value="none">No Auth</option>
            <option value="api_key">API Key</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
          </select>
          <input
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold"
            placeholder="Secret Ref"
            value={form.secret_ref}
            onChange={(e) => setForm((p) => ({ ...p, secret_ref: e.target.value }))}
          />
          <button
            onClick={addIntegration}
            disabled={saving}
            className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-bold flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
          </button>
        </div>
        <textarea
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Integration</th>
                  <th className="px-6 py-3">Base URL</th>
                  <th className="px-6 py-3">Auth</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Last Checked</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.key}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-700">{item.base_url || '-'}</td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-700">{item.auth_type}</td>
                    <td className="px-6 py-4">
                      <label className="inline-flex items-center gap-2 text-xs font-bold">
                        <input
                          type="checkbox"
                          checked={item.status === 'active'}
                          onChange={(e) => updateItem(item.id, { status: e.target.checked ? 'active' : 'inactive' })}
                        />
                        {item.status}
                      </label>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {item.last_checked_at ? new Date(item.last_checked_at).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => removeItem(item.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td className="px-6 py-8 text-center text-sm text-gray-500 font-semibold" colSpan={6}>
                      No extra integrations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiManagement;
