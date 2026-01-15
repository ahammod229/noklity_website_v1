import React, { useState } from 'react';
import { X, MapPin, Phone, User, Globe, Building2, Loader2 } from 'lucide-react';
import { Address } from '../../services/addressService';

interface AddressFormProps {
  initialData?: Address;
  onSubmit: (data: Omit<Address, 'id'>) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const AddressForm: React.FC<AddressFormProps> = ({ initialData, onSubmit, onCancel, isSaving }) => {
  const [formData, setFormData] = useState<Omit<Address, 'id'>>({
    label: initialData?.label || 'Home',
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    street: initialData?.street || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zip: initialData?.zip || '',
    country: initialData?.country || 'United States',
    isDefault: initialData?.isDefault || false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in" onClick={onCancel} />
      <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-1">
              {initialData ? 'Edit Address' : 'Add New Address'}
            </h2>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Provide your shipping details</p>
          </div>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Address Label</label>
              <div className="flex gap-2">
                {['Home', 'Office', 'Other'].map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, label: l }))}
                    className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                      formData.label === l 
                      ? 'bg-gray-900 text-white border-gray-900' 
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-900'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="e.g. Alex Morgan"
                />
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Street Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="street"
                  required
                  value={formData.street}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="e.g. 123 Performance Blvd"
                />
              </div>
            </div>

            <div className="col-span-1">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">City</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Speedway"
                />
              </div>
            </div>

            <div className="col-span-1">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">State / Province</label>
              <input
                type="text"
                name="state"
                required
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="e.g. California"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Zip / Postal Code</label>
              <input
                type="text"
                name="zip"
                required
                value={formData.zip}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="90210"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Country</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
            </div>

            <div className="col-span-2 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleInputChange}
                    className="w-6 h-6 border-2 border-gray-200 rounded-lg text-primary focus:ring-primary/20 cursor-pointer transition-all checked:bg-primary checked:border-primary"
                  />
                </div>
                <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors">Set as default shipping address</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-8 py-4 border border-gray-200 text-gray-700 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-8 py-4 bg-primary text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialData ? 'Save Address' : 'Add Address')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressForm;
