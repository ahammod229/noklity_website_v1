import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  type: string;
  logo_url: string | null;
  instructions: string | null;
  account_details: Record<string, string> | null;
  is_active: boolean;
  sort_order: number;
}

const defaultForm = {
  code: '',
  name: '',
  type: 'mobile_banking',
  logo_url: '',
  instructions: '',
  bank_address: '',
  account_holder: '',
  account_number: '',
  routing_number: '',
  swift_code: '',
  bank_code: ''
};

const PaymentMethods: React.FC = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const toFriendlyError = (messageText: string) => {
    if (messageText.includes("Could not find the table 'public.payment_methods'")) {
      return 'Payment methods table is missing in Supabase. Run the latest supabase/schema.sql in SQL Editor.';
    }
    if (messageText.toLowerCase().includes('duplicate key')) {
      return 'Payment method code already exists. Use a unique code.';
    }
    return messageText;
  };

  const fetchMethods = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      setMessage({ type: 'error', text: toFriendlyError(error.message || 'Failed to load payment methods') });
    } else {
      setMethods((data || []) as PaymentMethod[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const addMethod = async () => {
    setMessage(null);
    if (!form.code || !form.name) {
      setMessage({ type: 'error', text: 'Code and name are required.' });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('payment_methods').insert({
      code: form.code.trim().toLowerCase(),
      name: form.name.trim(),
      type: form.type,
      logo_url: form.logo_url.trim() || null,
      instructions: form.instructions.trim() || null,
      account_details: form.type === 'bank_transfer'
        ? {
            bank_address: form.bank_address.trim(),
            account_holder: form.account_holder.trim(),
            account_number: form.account_number.trim(),
            routing_number: form.routing_number.trim(),
            swift_code: form.swift_code.trim(),
            bank_code: form.bank_code.trim() || form.code.trim().toUpperCase()
          }
        : {},
      is_active: true,
      sort_order: methods.length + 1
    });
    setSaving(false);

    if (error) {
      setMessage({ type: 'error', text: toFriendlyError(error.message || 'Failed to add payment method') });
      return;
    }

    setForm(defaultForm);
    setMessage({ type: 'success', text: 'Payment method added successfully.' });
    fetchMethods();
  };

  const updateMethod = async (id: string, updates: Partial<PaymentMethod>) => {
    setMessage(null);
    const { error } = await supabase.from('payment_methods').update(updates).eq('id', id);
    if (error) {
      setMessage({ type: 'error', text: toFriendlyError(error.message || 'Failed to update method') });
      return;
    }
    setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    setMessage({ type: 'success', text: 'Payment method updated.' });
  };

  const removeMethod = async (id: string) => {
    if (!window.confirm('Remove payment method?')) return;
    setMessage(null);
    const { error } = await supabase.from('payment_methods').delete().eq('id', id);
    if (error) {
      setMessage({ type: 'error', text: toFriendlyError(error.message || 'Failed to delete method') });
      return;
    }
    setMessage({ type: 'success', text: 'Payment method removed.' });
    fetchMethods();
  };

  const handleLogoUpload = async (file?: File | null) => {
    if (!file) return;
    setMessage(null);
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const filePath = `payments/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('assets').upload(filePath, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('assets').getPublicUrl(filePath);
      setForm((prev) => ({ ...prev, logo_url: data.publicUrl }));
      setMessage({ type: 'success', text: 'Logo uploaded successfully.' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: toFriendlyError(error?.message || 'Logo upload failed. Ensure admin storage permissions are active.')
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Payment Methods</h2>
        <p className="text-gray-500 font-medium">Add, edit, and remove mobile banking and bank transfer options.</p>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Add Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold" placeholder="Code (bkash)" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
          <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold" placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
            <option value="mobile_banking">Mobile Banking</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
          <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold" placeholder="Logo URL" value={form.logo_url} onChange={(e) => setForm((p) => ({ ...p, logo_url: e.target.value }))} />
          <button onClick={addMethod} disabled={saving || uploadingLogo} className="px-3 py-2 rounded-lg bg-primary text-white font-bold text-sm flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
          </button>
        </div>
        <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-50 w-fit">
          <Upload className="w-4 h-4" />
          {uploadingLogo ? 'Uploading logo...' : 'Upload Logo'}
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => handleLogoUpload(e.target.files?.[0])}
          />
        </label>
        <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Instructions" value={form.instructions} onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))} />
        {form.type === 'bank_transfer' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold" placeholder="Bank Address / Branch" value={form.bank_address} onChange={(e) => setForm((p) => ({ ...p, bank_address: e.target.value }))} />
            <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold" placeholder="Account Holder" value={form.account_holder} onChange={(e) => setForm((p) => ({ ...p, account_holder: e.target.value }))} />
            <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold" placeholder="Account Number" value={form.account_number} onChange={(e) => setForm((p) => ({ ...p, account_number: e.target.value }))} />
            <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold" placeholder="Routing Number" value={form.routing_number} onChange={(e) => setForm((p) => ({ ...p, routing_number: e.target.value }))} />
            <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold" placeholder="SWIFT Code" value={form.swift_code} onChange={(e) => setForm((p) => ({ ...p, swift_code: e.target.value }))} />
            <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold" placeholder="Bank Code" value={form.bank_code} onChange={(e) => setForm((p) => ({ ...p, bank_code: e.target.value }))} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Instructions</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {methods.map((method) => (
                  <tr key={method.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {method.logo_url ? <img src={method.logo_url} alt="" className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 rounded bg-gray-100" />}
                        <div>
                          <p className="font-bold text-gray-900">{method.name}</p>
                          <p className="text-xs text-gray-500">{method.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-700">{method.type}</td>
                    <td className="px-6 py-4">
                      <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                        <input type="checkbox" checked={method.is_active} onChange={(e) => updateMethod(method.id, { is_active: e.target.checked })} />
                        {method.is_active ? 'Active' : 'Inactive'}
                      </label>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 max-w-sm">{method.instructions || 'No instructions'}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => removeMethod(method.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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

export default PaymentMethods;
