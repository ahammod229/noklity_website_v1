import React, { useEffect, useState } from 'react';
import { Plus, Loader2, Trash2, RefreshCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
  const [items, setItems] = useState<ApiIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('api_integrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      alert(error.message || 'Failed to load API integrations');
    } else {
      setItems((data || []) as ApiIntegration[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

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
    const payload = { ...updates } as any;
    if (updates.status === 'active') {
      payload.last_checked_at = new Date().toISOString();
    }

    const { error } = await supabase.from('api_integrations').update(payload).eq('id', id);
    if (error) {
      alert(error.message || 'Failed to update integration');
      return;
    }

    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...payload } : item)));
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">API Management</h2>
          <p className="text-gray-500 font-medium">Store and manage third-party API connections.</p>
        </div>
        <button onClick={fetchItems} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold flex items-center gap-2">
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Add Integration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold" placeholder="Key (shiprocket)" value={form.key} onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))} />
          <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold" placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold" placeholder="Base URL" value={form.base_url} onChange={(e) => setForm((p) => ({ ...p, base_url: e.target.value }))} />
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold" value={form.auth_type} onChange={(e) => setForm((p) => ({ ...p, auth_type: e.target.value as ApiIntegration['auth_type'] }))}>
            <option value="none">No Auth</option>
            <option value="api_key">API Key</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
          </select>
          <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold" placeholder="Secret Ref" value={form.secret_ref} onChange={(e) => setForm((p) => ({ ...p, secret_ref: e.target.value }))} />
          <button onClick={addIntegration} disabled={saving} className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-bold flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
          </button>
        </div>
        <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
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
                    <td className="px-6 py-4 text-xs text-gray-600">{item.last_checked_at ? new Date(item.last_checked_at).toLocaleString() : 'Never'}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => removeItem(item.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiManagement;
