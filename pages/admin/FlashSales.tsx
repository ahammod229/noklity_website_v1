
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types';
import { Zap, Plus, Trash2, Save, Search, X, Loader2, AlertCircle } from 'lucide-react';
import { ToastType } from '../../components/Toast';
import { useCurrency } from '../../hooks/useCurrency';

interface FlashSalesProps {
  showToast?: (message: string, type?: ToastType) => void;
}

const FlashSales: React.FC<FlashSalesProps> = ({ showToast }) => {
  const { formatCurrency, currencyCode } = useCurrency();
  const [activeItems, setActiveItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // States for inline editing
  const [editingPrices, setEditingPrices] = useState<Record<string, number>>({});
  const [editingImages, setEditingImages] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // States for Add Modal
  const [candidates, setCandidates] = useState<Product[]>([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [newSalePrice, setNewSalePrice] = useState<number | ''>('');
  const [adding, setAdding] = useState(false);

  const notify = (msg: string, type: ToastType = 'success') => {
    if (showToast) showToast(msg, type);
    else alert(msg);
  };

  useEffect(() => {
    fetchActiveFlashSales();
  }, []);

  const fetchActiveFlashSales = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_flash_sale', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching flash sales:', error);
      notify('Failed to load flash sales', 'error');
    } else if (data) {
      // SAFE MAPPING to prevent crashes if fields are missing
      const mapped: Product[] = data.map((row: any) => ({
        id: row.id,
        name: row.title || 'Untitled Product',
        category: row.category || 'Uncategorized',
        price: row.discount_price || row.price,
        originalPrice: row.discount_price ? row.price : undefined,
        image: row.image_url || '',
        stock: row.stock || 0,
        rating: row.rating || 0,
        isFlashSale: row.is_flash_sale
      }));
      setActiveItems(mapped);
      
      const prices: Record<string, number> = {};
      const images: Record<string, string> = {};
      data.forEach((row: any) => {
        prices[row.id] = row.discount_price || row.price;
        images[row.id] = row.image_url || '';
      });
      setEditingPrices(prices);
      setEditingImages(images);
    }
    setLoading(false);
  };

  const fetchCandidates = async () => {
    setLoadingCandidates(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_flash_sale', false)
      .order('title', { ascending: true });

    if (error) {
      notify('Failed to load products', 'error');
    } else if (data) {
      const mapped: Product[] = data.map((row: any) => ({
        id: row.id,
        name: row.title || 'Untitled',
        category: row.category || 'Uncategorized',
        price: row.price,
        image: row.image_url || '',
        stock: row.stock || 0,
        rating: row.rating || 0,
        isFlashSale: row.is_flash_sale
      }));
      setCandidates(mapped);
    }
    setLoadingCandidates(false);
  };

  const handleOpenAddModal = () => {
    fetchCandidates();
    setIsAddModalOpen(true);
    setNewSalePrice('');
    setSelectedCandidateId(null);
    setCandidateSearch('');
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this product from Flash Sale?')) return;

    setActiveItems(prev => prev.filter(p => p.id !== id));

    const { error } = await supabase
      .from('products')
      .update({ is_flash_sale: false, discount_price: null })
      .eq('id', id);

    if (error) {
      notify('Failed to remove product', 'error');
      fetchActiveFlashSales();
    } else {
      notify('Product removed from Flash Sale');
    }
  };

  const handleUpdatePrice = async (id: string, regularPrice: number) => {
    const newPrice = editingPrices[id];
    
    if (!newPrice || newPrice <= 0) {
      notify('Please enter a valid price', 'error');
      return;
    }

    setSavingId(id);
    const { error } = await supabase
      .from('products')
      .update({ discount_price: newPrice })
      .eq('id', id);

    if (error) {
      notify('Failed to update price', 'error');
    } else {
      notify('Price updated successfully');
      setActiveItems(prev => prev.map(p => 
        p.id === id ? { ...p, price: newPrice, originalPrice: regularPrice } : p
      ));
    }
    setSavingId(null);
  };

  const handleAddToFlashSale = async () => {
    if (!selectedCandidateId || !newSalePrice) return;

    setAdding(true);
    const { error } = await supabase
      .from('products')
      .update({ 
        is_flash_sale: true,
        discount_price: newSalePrice 
      })
      .eq('id', selectedCandidateId);

    if (error) {
      notify(error.message, 'error');
    } else {
      notify('Product added to Flash Sale');
      setIsAddModalOpen(false);
      fetchActiveFlashSales();
    }
    setAdding(false);
  };

  const handleUpdateImage = async (id: string) => {
    const image = editingImages[id];
    if (!image) return;
    const { error } = await supabase
      .from('products')
      .update({ image_url: image })
      .eq('id', id);

    if (error) {
      notify('Failed to update image', 'error');
      return;
    }

    notify('Image updated');
    setActiveItems((prev) => prev.map((p) => (p.id === id ? { ...p, image } : p)));
  };

  // Safe filtering logic
  const filteredCandidates = candidates.filter(c => 
    (c.name && c.name.toLowerCase().includes(candidateSearch.toLowerCase())) ||
    (c.category && c.category.toLowerCase().includes(candidateSearch.toLowerCase()))
  );

  const selectedProduct = candidates.find(c => c.id === selectedCandidateId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500 fill-current" />
            Flash Sales
          </h2>
          <p className="text-gray-500 font-medium">Manage active flash sale items and discounts.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-200 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Active Items Grid */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : activeItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {activeItems.map((product) => {
            const regularPrice = product.originalPrice || product.price;
            
            return (
              <div key={product.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:border-amber-200 transition-colors">
                
                {/* Image & Info */}
                <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
                  <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover mix-blend-multiply" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{product.name}</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{product.category} • {product.stock} in stock</p>
                  </div>
                </div>

                {/* Price + Image Editor */}
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-6 w-full md:w-auto justify-between md:justify-end bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="max-w-[220px]">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Image URL</p>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={editingImages[product.id] || ''}
                        onChange={(e) => setEditingImages((prev) => ({ ...prev, [product.id]: e.target.value }))}
                        className="w-40 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium text-gray-700"
                      />
                      <button
                        onClick={() => handleUpdateImage(product.id)}
                        className="p-2 bg-white border border-gray-200 text-gray-700 rounded-lg"
                        title="Update Image"
                      >
                        <Save className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right pr-4 border-r border-gray-200">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Regular</p>
                    <p className="text-sm font-black text-gray-900 line-through">{formatCurrency(regularPrice)}</p>
                  </div>
                  
                  <div>
                    <p className="text-[10px] font-bold text-amber-600 uppercase mb-1 flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-current" /> Sale Price
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-400">{currencyCode}</span>
                      <input 
                        type="number" 
                        value={editingPrices[product.id] || ''}
                        onChange={(e) => setEditingPrices(prev => ({ ...prev, [product.id]: parseFloat(e.target.value) }))}
                        className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm font-black text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => handleUpdatePrice(product.id, regularPrice)}
                    disabled={savingId === product.id}
                    className="p-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors disabled:opacity-50"
                    title="Update Price"
                  >
                    {savingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </button>
                </div>

                {/* Remove Action */}
                <button 
                  onClick={() => handleRemove(product.id)}
                  className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Remove from Flash Sale"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-black text-gray-900">No Active Flash Sales</h3>
          <p className="text-gray-500 max-w-sm mx-auto mt-1">
            Add products to the flash sale to boost revenue and clear inventory.
          </p>
          <button 
            onClick={handleOpenAddModal}
            className="mt-6 text-primary font-bold hover:underline"
          >
            Start a Flash Sale
          </button>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-gray-900">Add to Flash Sale</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select a product and set discount</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              
              {/* Step 1: Select Product */}
              <div className="mb-8">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">1. Select Product</label>
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search products..." 
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
                
                <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-xl bg-white shadow-inner custom-scrollbar">
                  {loadingCandidates ? (
                    <div className="p-5 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
                  ) : filteredCandidates.length > 0 ? (
                    filteredCandidates.map(product => (
                      <div 
                        key={product.id}
                        onClick={() => setSelectedCandidateId(product.id)}
                        className={`flex items-center gap-4 p-3 border-b border-gray-50 cursor-pointer transition-colors last:border-0 ${
                          selectedCandidateId === product.id ? 'bg-primary/5' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedCandidateId === product.id ? 'border-primary' : 'border-gray-300'}`}>
                          {selectedCandidateId === product.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={product.image} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${selectedCandidateId === product.id ? 'text-primary' : 'text-gray-900'}`}>{product.name}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(product.price)} • {product.stock} in stock</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-5 text-center text-gray-400 text-sm">No eligible products found.</div>
                  )}
                </div>
              </div>

              {/* Step 2: Set Price */}
              {selectedProduct && (
                <div className="animate-in slide-in-from-bottom-2 fade-in">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">2. Set Flash Sale Price</label>
                  <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-center gap-6">
                    <div>
                      <p className="text-xs font-bold text-amber-800 uppercase mb-1">Regular Price</p>
                      <p className="text-xl font-black text-gray-900">{formatCurrency(selectedProduct.price)}</p>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-bold text-amber-800 uppercase mb-1 block">New Sale Price</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">{currencyCode}</span>
                        <input 
                          type="number" 
                          value={newSalePrice}
                          onChange={(e) => setNewSalePrice(e.target.value ? parseFloat(e.target.value) : '')}
                          placeholder="0.00"
                          className="w-full pl-8 pr-4 py-3 bg-white border border-amber-200 rounded-xl font-black text-lg focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                  {(newSalePrice && typeof newSalePrice === 'number' && newSalePrice >= selectedProduct.price) && (
                    <div className="mt-2 flex items-center gap-2 text-red-500 text-xs font-bold">
                      <AlertCircle className="w-3 h-3" />
                      Sale price must be lower than regular price ({formatCurrency(selectedProduct.price)})
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-4">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-4 bg-white border border-gray-200 text-gray-900 font-bold rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-xs"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddToFlashSale}
                disabled={!selectedCandidateId || !newSalePrice || adding || (typeof newSalePrice === 'number' && selectedProduct && newSalePrice >= selectedProduct.price)}
                className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Confirm Add
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default FlashSales;
