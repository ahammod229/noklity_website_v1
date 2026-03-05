import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Save, X, Loader2, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ADMIN_IMAGE_GUIDES, formatImageGuideHint, validateImageAgainstGuide } from '../../utils/adminImageGuides';

interface DbCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', icon: 'Package', logo_url: '', description: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const toFriendlyError = (messageText: string) => {
    if (messageText.includes("Could not find the table 'public.categories'")) {
      return 'Categories table is missing in Supabase. Run the latest supabase/schema.sql in SQL Editor.';
    }
    if (messageText.toLowerCase().includes('duplicate key')) {
      return 'Category already exists. Use a different name.';
    }
    return messageText;
  };

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
    if (error) {
      console.error('Failed to load categories', error);
      setMessage({ type: 'error', text: toFriendlyError(error.message || 'Failed to load categories') });
    } else {
      setCategories((data || []) as DbCategory[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setForm({ name: '', icon: 'Package', logo_url: '', description: '' });
    setEditingId(null);
  };

  const handleSave = async () => {
    setMessage(null);
    if (!form.name.trim()) {
      setMessage({ type: 'error', text: 'Category name is required.' });
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.name),
      icon: form.icon.trim() || 'Package',
      logo_url: form.logo_url.trim() || null,
      description: form.description.trim() || null,
      is_active: true
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('categories').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('categories').insert(payload));
    }

    setSaving(false);
    if (error) {
      console.error('Save category failed', error);
      setMessage({ type: 'error', text: toFriendlyError(error.message || 'Failed to save category') });
      return;
    }

    setMessage({ type: 'success', text: editingId ? 'Category updated successfully.' : 'Category added successfully.' });
    resetForm();
    fetchCategories();
  };

  const handleEdit = (category: DbCategory) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      icon: category.icon || 'Package',
      logo_url: category.logo_url || '',
      description: category.description || ''
    });
  };

  const handleLogoUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const validation = await validateImageAgainstGuide(file, ADMIN_IMAGE_GUIDES.categoryLogo);
      if (validation.shouldBlock) {
        setMessage({ type: 'error', text: validation.message });
        return;
      }
      const ext = file.name.split('.').pop() || 'png';
      const filePath = `categories/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('assets').upload(filePath, file, { upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('assets').getPublicUrl(filePath);
      setForm((prev) => ({ ...prev, logo_url: data.publicUrl }));
      setMessage({ type: 'success', text: validation.message });
    } catch (error: any) {
      setMessage({ type: 'error', text: toFriendlyError(error?.message || 'Logo upload failed') });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    setMessage(null);

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      setMessage({ type: 'error', text: toFriendlyError(error.message || 'Failed to delete category') });
      return;
    }
    setMessage({ type: 'success', text: 'Category removed successfully.' });
    fetchCategories();
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
          <p className="text-gray-500 text-sm">Add, edit, and remove product categories</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
          {editingId ? 'Edit Category' : 'Add Category'}
        </h3>
        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold"
            placeholder="Category name"
          />
          <input
            type="text"
            value={form.icon}
            onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold"
            placeholder="Icon name"
          />
          <input
            type="text"
            value={form.logo_url}
            onChange={(e) => setForm((p) => ({ ...p, logo_url: e.target.value }))}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold"
            placeholder="Logo URL"
          />
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold"
            placeholder="Description"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Logo'}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleLogoUpload(e.target.files?.[0])}
            />
          </label>
          {form.logo_url && <img src={form.logo_url} alt="Category logo" className="w-10 h-10 rounded-lg border border-gray-200 object-cover bg-white" />}
        </div>
        <p className="text-xs text-gray-500">{formatImageGuideHint(ADMIN_IMAGE_GUIDES.categoryLogo)}</p>

        <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingId ? 'Update' : 'Add Category'}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="bg-white border border-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-4">
                {cat.logo_url ? (
                  <img src={cat.logo_url} alt={cat.name} className="w-12 h-12 rounded-lg border border-gray-200 object-cover bg-white" />
                ) : (
                  <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-gray-600 font-bold group-hover:bg-primary group-hover:text-white transition-colors">
                    {cat.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-gray-900">{cat.name}</h3>
                  <p className="text-sm text-gray-500">/{cat.slug}</p>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(cat)} className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-red-50 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
