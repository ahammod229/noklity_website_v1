
import React, { useState, useEffect } from 'react';
import AccountLayout from '../../components/account/AccountLayout';
import AddressForm from '../../components/account/AddressForm';
import { MapPin, Plus, Trash2, Edit2, CheckCircle2, Home, Building2, Package, Loader2, AlertCircle } from 'lucide-react';
import { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, Address } from '../../services/addressService';

interface AddressesProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: any) => void;
}

const Addresses: React.FC<AddressesProps> = ({ onLoginClick, cartItemCount, onCartClick, onNavigate }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAddresses();
      setAddresses(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load addresses.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdate = async (data: Omit<Address, 'id'>) => {
    setIsSaving(true);
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, data);
      } else {
        await addAddress(data);
      }
      await fetchAddresses();
      setIsFormOpen(false);
      setEditingAddress(undefined);
    } catch (err) {
      console.error(err);
      alert('Failed to save address. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await deleteAddress(id);
        await fetchAddresses();
      } catch (err) {
        console.error(err);
        alert('Failed to delete address.');
      }
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      await fetchAddresses();
    } catch (err) {
      console.error(err);
      alert('Failed to set default address.');
    }
  };

  if (loading) {
    return (
      <AccountLayout activeTab="addresses" onNavigate={onNavigate} onCartClick={onCartClick} onLoginClick={onLoginClick} cartItemCount={cartItemCount} title="Shipping Addresses">
        <div className="bg-white p-6 sm:p-20 rounded-[3rem] border border-gray-100 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-gray-500 font-bold">Fetching your addresses...</p>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      activeTab="addresses"
      onNavigate={onNavigate}
      onCartClick={onCartClick}
      onLoginClick={onLoginClick}
      cartItemCount={cartItemCount}
      title="Saved Addresses"
    >
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* Header Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <p className="text-gray-500 font-bold">Manage your shipping destinations for faster checkout.</p>
          <button 
            onClick={() => { setEditingAddress(undefined); setIsFormOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Address
          </button>
        </div>

        {error ? (
          <div className="bg-red-50 p-8 rounded-3xl border border-red-100 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 font-bold">{error}</p>
            <button onClick={fetchAddresses} className="mt-4 text-sm font-bold text-red-700 underline">Try Again</button>
          </div>
        ) : addresses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div 
                key={address.id} 
                className={`bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden group ${
                  address.isDefault ? 'border-primary ring-1 ring-primary/20 shadow-xl shadow-red-500/5' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="p-6 md:p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl ${address.isDefault ? 'bg-red-50' : 'bg-gray-50'}`}>
                      {address.label === 'Home' ? (
                        <Home className={`w-6 h-6 ${address.isDefault ? 'text-primary' : 'text-gray-400'}`} />
                      ) : (
                        <Building2 className={`w-6 h-6 ${address.isDefault ? 'text-primary' : 'text-gray-400'}`} />
                      )}
                    </div>
                    {address.isDefault && (
                      <span className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Default</span>
                    )}
                  </div>

                  <div className="space-y-1 mb-8">
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">{address.fullName}</h3>
                    <p className="text-sm font-bold text-gray-500 leading-relaxed">
                      {address.street}<br />
                      {address.city}, {address.state} {address.zip}<br />
                      {address.country}
                    </p>
                    <p className="text-xs font-bold text-gray-400 flex items-center gap-1.5 pt-2">
                      <Package className="w-3.5 h-3.5" /> {address.phone}
                    </p>
                  </div>

                  <div className="flex gap-3 border-t border-gray-50 pt-6">
                    <button 
                      onClick={() => { setEditingAddress(address); setIsFormOpen(true); }}
                      className="flex-1 py-3 bg-gray-50 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    {!address.isDefault && (
                      <button 
                        onClick={() => handleSetDefault(address.id)}
                        className="flex-1 py-3 border border-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                      >
                        Set Default
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(address.id)}
                      className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                      title="Delete Address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-6 sm:p-16 border border-dashed border-gray-200 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <MapPin className="w-10 h-10 text-gray-200" strokeWidth={1} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">No addresses yet</h2>
            <p className="text-gray-500 font-medium mb-10 max-w-sm">
              Add your shipping address to make checkout faster and easier.
            </p>
            <button 
              onClick={() => setIsFormOpen(true)}
              className="bg-primary text-white font-black px-10 py-4 rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95"
            >
              Add Your First Address
            </button>
          </div>
        )}
      </div>

      {isFormOpen && (
        <AddressForm 
          initialData={editingAddress}
          onSubmit={handleAddOrUpdate}
          onCancel={() => { setIsFormOpen(false); setEditingAddress(undefined); }}
          isSaving={isSaving}
        />
      )}
    </AccountLayout>
  );
};

export default Addresses;
