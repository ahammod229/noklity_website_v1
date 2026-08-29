import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase, uploadFile } from '../../lib/supabase';
import { Brand } from '../../types';

const BrandManager: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    logo_url: ''
  });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    setIsSaving(true);
    try {
      if (editingBrand) {
        const { error } = await supabase
          .from('brands')
          .update(formData)
          .eq('id', editingBrand.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('brands')
          .insert([formData]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      setEditingBrand(null);
      setFormData({ name: '', logo_url: '' });
      fetchBrands();
    } catch (error) {
      console.error('Error saving brand:', error);
      alert('Failed to save brand');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;
    
    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      fetchBrands();
    } catch (error) {
      console.error('Error deleting brand:', error);
      alert('Failed to delete brand');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadFile(file, 'brands');
      setFormData({ ...formData, logo_url: url });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }
  };

  const openModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({ name: brand.name, logo_url: brand.logo_url || '' });
    } else {
      setEditingBrand(null);
      setFormData({ name: '', logo_url: '' });
    }
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Brands</h2>
        <button
          onClick={() => openModal()}
          className="bg-primary text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Brand
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-semibold text-gray-600">Logo</th>
              <th className="p-4 font-semibold text-gray-600">Name</th>
              <th className="p-4 font-semibold text-gray-600 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => (
              <tr key={brand.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="p-4">
                  {brand.logo_url ? (
                    <img src={brand.logo_url} alt={brand.name} className="w-12 h-12 object-contain bg-white rounded border" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                </td>
                <td className="p-4 font-medium text-gray-800">{brand.name}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openModal(brand)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(brand.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {brands.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500">
                  No brands found. Add your first brand to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-bold text-lg">{editingBrand ? 'Edit Brand' : 'Add Brand'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-primary outline-none"
                  placeholder="e.g. Samsung"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={e => setFormData({...formData, logo_url: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:border-primary outline-none"
                    placeholder="https://..."
                  />
                  <div className="relative overflow-hidden shrink-0">
                    <button type="button" className="px-3 py-2 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 whitespace-nowrap">
                      Upload
                    </button>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
                {formData.logo_url && (
                  <div className="mt-2 p-2 border rounded bg-gray-50 inline-block">
                    <img src={formData.logo_url} alt="Preview" className="h-10 object-contain" />
                  </div>
                )}
              </div>
              
              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingBrand ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandManager;
