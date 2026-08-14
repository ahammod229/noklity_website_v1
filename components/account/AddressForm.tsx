import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, User, Check } from 'lucide-react';
import { Address } from '../../services/addressService';

interface AddressFormProps {
  initialData?: Address;
  onSubmit: (data: Omit<Address, 'id'>) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

// Mock hierarchical data for Region -> District -> Area based on the screenshots
const LOCATION_DATA: Record<string, Record<string, string[]>> = {
  'Barishal': {
    'Barguna': ['Barguna Sadar', 'Amtali', 'Betagi'],
    'Barishal - Agailjhara': ['Agailjhara Sadar', 'Gaila', 'Rajihar'],
    'Barishal - Babuganj': [
      'Babuganj Sadar',
      'Barishal Cadet College',
      'Chandpasha',
      'Dehergoti',
      'Guthia',
      'Madhabpasha',
      'Nizamuddin College',
      'Rahamatpur'
    ],
    'Barishal - Bakerganj': ['Bakerganj Sadar', 'Dudhal', 'Faridpur'],
    'Barishal - Gouranadi': ['Gouranadi Sadar', 'Barthi', 'Chandshi'],
    'Barishal - Hizla': ['Hizla Sadar', 'Dhulkhola', 'Guabaria'],
    'Barishal - Mehendiganj': ['Mehendiganj Sadar', 'Alimabad', 'Bhasanchar']
  },
  'Chattogram': {
    'Chattogram City': ['Agrabad', 'Halishahar', 'Pahartali'],
    'Cox\'s Bazar': ['Cox\'s Bazar Sadar', 'Ramu', 'Teknaf']
  },
  'Dhaka': {
    'Dhaka City': ['Gulshan', 'Banani', 'Dhanmondi', 'Mirpur', 'Uttara'],
    'Gazipur': ['Tongi', 'Gazipur Sadar', 'Kaliakair'],
    'Narayanganj': ['Narayanganj Sadar', 'Fatullah', 'Siddhirganj']
  },
  'Khulna': {
    'Khulna City': ['Sonadanga', 'Khalishpur', 'Daulatpur'],
    'Bagerhat': ['Bagerhat Sadar', 'Mongla', 'Fakirhat']
  },
  'Mymensingh': {
    'Mymensingh Sadar': ['Mymensingh City', 'Muktagacha', 'Trishal'],
    'Jamalpur': ['Jamalpur Sadar', 'Melandaha', 'Islampur']
  },
  'Rajshahi': {
    'Rajshahi City': ['Boalia', 'Rajpara', 'Motihar'],
    'Bogra': ['Bogra Sadar', 'Sherpur', 'Shibganj']
  },
  'Rangpur': {
    'Rangpur City': ['Kotwali', 'Tajhat', 'Mahiganj'],
    'Dinajpur': ['Dinajpur Sadar', 'Birganj', 'Kaharole']
  },
  'Sylhet': {
    'Sylhet City': ['Bandar Bazar', 'Zindabazar', 'Ambarkhana'],
    'Habiganj': ['Habiganj Sadar', 'Nabiganj', 'Chunarughat']
  }
};

const REGIONS = Object.keys(LOCATION_DATA);

const AddressForm: React.FC<AddressFormProps> = ({ initialData, onSubmit, onCancel, isSaving }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  
  const [formData, setFormData] = useState<Omit<Address, 'id'>>({
    label: initialData?.label || 'Home',
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    street: initialData?.street || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zip: initialData?.zip || '0000',
    country: initialData?.country || 'Bangladesh',
    isDefault: initialData?.isDefault || false
  });

  const [landmark, setLandmark] = useState('');
  
  // Location Picker State
  const [isRegionPickerOpen, setIsRegionPickerOpen] = useState(false);
  const [pickerStep, setPickerStep] = useState<0 | 1 | 2>(0);
  const [tempRegion, setTempRegion] = useState('');
  const [tempDistrict, setTempDistrict] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const handleClose = () => {
    dialogRef.current?.close();
    onCancel();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.city) {
      alert("Please select a Region/City/District");
      return;
    }
    const finalStreet = landmark ? `${formData.street}, Landmark: ${landmark}` : formData.street;
    onSubmit({
      ...formData,
      street: finalStreet
    });
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      handleClose();
    }
  };

  // Location Picker logic
  const openLocationPicker = () => {
    setIsRegionPickerOpen(true);
    setPickerStep(0);
    setTempRegion('');
    setTempDistrict('');
  };

  const selectRegion = (region: string) => {
    setTempRegion(region);
    setPickerStep(1);
    setTempDistrict('');
  };

  const selectDistrict = (district: string) => {
    setTempDistrict(district);
    setPickerStep(2);
  };

  const selectArea = (area: string) => {
    const fullLocationString = `${tempRegion}, ${tempDistrict}, ${area}`;
    setFormData(prev => ({ 
      ...prev, 
      city: fullLocationString, // Store full string in city/state
      state: fullLocationString 
    }));
    setIsRegionPickerOpen(false);
  };

  const renderPickerTabs = () => {
    return (
      <div className="flex px-4 border-b border-gray-100 overflow-x-auto custom-scrollbar gap-6 items-center shrink-0">
        {/* Step 0: Region */}
        <button 
          type="button"
          onClick={() => setPickerStep(0)}
          className={`py-3 text-[13px] whitespace-nowrap transition-colors ${pickerStep === 0 ? 'text-primary font-bold border-b-2 border-primary' : 'text-gray-600'}`}
        >
          {pickerStep > 0 ? tempRegion : 'Select Region'}
        </button>
        
        {/* Step 1: District */}
        {pickerStep >= 1 && (
          <button 
            type="button"
            onClick={() => setPickerStep(1)}
            className={`py-3 text-[13px] whitespace-nowrap transition-colors ${pickerStep === 1 ? 'text-primary font-bold border-b-2 border-primary' : 'text-gray-600'}`}
          >
            {pickerStep > 1 ? tempDistrict : 'Select district'}
          </button>
        )}

        {/* Step 2: Area */}
        {pickerStep >= 2 && (
          <button 
            type="button"
            className="py-3 text-[13px] whitespace-nowrap transition-colors text-primary font-bold border-b-2 border-primary"
          >
            Select area
          </button>
        )}
      </div>
    );
  };

  const renderPickerList = () => {
    let items: string[] = [];
    let selectedItem = '';
    
    if (pickerStep === 0) {
      items = REGIONS;
      selectedItem = tempRegion;
    } else if (pickerStep === 1) {
      items = Object.keys(LOCATION_DATA[tempRegion] || {});
      selectedItem = tempDistrict;
    } else if (pickerStep === 2) {
      items = LOCATION_DATA[tempRegion]?.[tempDistrict] || [];
    }

    return (
      <div className="overflow-y-auto flex-1 custom-scrollbar pb-6 bg-white">
        {items.map(item => {
          const isSelected = item === selectedItem;
          return (
            <button
              key={item}
              type="button"
              className="w-full text-left px-5 py-4 border-b border-gray-100 flex justify-between items-center hover:bg-gray-50 transition-colors group"
              onClick={() => {
                if (pickerStep === 0) selectRegion(item);
                else if (pickerStep === 1) selectDistrict(item);
                else selectArea(item);
              }}
            >
              <span className={`text-[14px] ${isSelected ? 'text-primary font-bold' : 'text-gray-800 font-medium'}`}>
                {item}
              </span>
              {isSelected && <Check className="w-5 h-5 text-primary" />}
              {!isSelected && pickerStep < 2 && <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />}
            </button>
          )
        })}
      </div>
    );
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleClose}
      onClick={handleBackdropClick}
      className="bg-gray-50 md:bg-white w-full h-[100dvh] md:h-auto max-w-xl md:rounded-2xl shadow-2xl flex flex-col md:max-h-[90vh] p-0 m-0 md:m-auto backdrop:bg-gray-900/60 backdrop:backdrop-blur-sm open:animate-in open:slide-in-from-bottom md:open:zoom-in-95 open:duration-300"
    >
      <div className="flex flex-col h-full w-full max-h-[inherit] relative bg-white overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center bg-white shrink-0">
          <button type="button" onClick={handleClose} className="p-2 -ml-2 text-gray-700 hover:text-black transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-bold text-gray-900 flex-1 text-center pr-8">
            {initialData ? 'Edit Shipping Address' : 'Add Shipping Address'}
          </h2>
        </div>

        {/* Form Content */}
        <form id="addressForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar bg-white p-4 pb-28 space-y-5">
          
          {/* Recipient's Name */}
          <div>
            <label className="block text-[13px] font-bold text-gray-800 mb-1.5">
              Recipient's Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-3 py-3 border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm placeholder-gray-400 pr-10"
                placeholder="Input the real name"
              />
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-[13px] font-bold text-gray-800 mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              pattern="^(?:\+88|88)?01[3-9]\d{8}$"
              title="Please enter a valid Bangladeshi phone number (e.g., 01712345678)"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-3 border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm placeholder-gray-400"
              placeholder="Please input Phone Number"
            />
          </div>

          {/* Region/City/District */}
          <div>
            <label className="block text-[13px] font-bold text-gray-800 mb-1.5">
              Region/City/District <span className="text-red-500">*</span>
            </label>
            <div 
              className={`w-full px-3 py-3 border rounded text-sm cursor-pointer flex justify-between items-center transition-colors ${isRegionPickerOpen ? 'border-primary ring-1 ring-primary' : 'border-gray-300 hover:border-gray-400'}`}
              onClick={openLocationPicker}
            >
              <span className={formData.city ? 'text-gray-900' : 'text-gray-400'}>
                {formData.city || 'Please input Region/City/District'}
              </span>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-[13px] font-bold text-gray-800 mb-1.5">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.street}
              onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
              className="w-full px-3 py-3 border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm placeholder-gray-400"
              placeholder="House no./building/street/area"
            />
          </div>

          {/* Landmark */}
          <div>
            <label className="block text-[13px] font-bold text-gray-800 mb-1.5">
              Landmark(Optional)
            </label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm placeholder-gray-400"
              placeholder="Add Additional Info"
            />
          </div>

          {/* Address Category */}
          <div className="flex items-center justify-between py-2 border-b border-gray-50 mt-2">
            <span className="text-[13px] text-gray-700">Address Category</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="radio" 
                  name="label" 
                  value="Home"
                  checked={formData.label === 'Home'}
                  onChange={() => setFormData(prev => ({ ...prev, label: 'Home' }))}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                />
                <span className="text-[13px] text-gray-700">Home</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="radio" 
                  name="label" 
                  value="Office"
                  checked={formData.label === 'Office'}
                  onChange={() => setFormData(prev => ({ ...prev, label: 'Office' }))}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                />
                <span className="text-[13px] text-gray-700">Office</span>
              </label>
            </div>
          </div>

          {/* Default Shipping Address */}
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-[13px] text-gray-700">Default Shipping Address</span>
            <div className="flex items-center gap-2">
              <span className={`text-[12px] font-medium transition-colors ${!formData.isDefault ? 'text-gray-400' : 'text-gray-800'}`}>Off</span>
              <label className="relative inline-flex items-center cursor-pointer mx-1">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
              <span className={`text-[12px] font-medium transition-colors ${formData.isDefault ? 'text-primary' : 'text-gray-400'}`}>On</span>
            </div>
          </div>

          {/* Default Billing Address */}
          <div className="flex items-center justify-between py-2">
            <span className="text-[13px] text-gray-700">Default Billing Address</span>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-gray-800 font-medium">Off</span>
              <label className="relative inline-flex items-center cursor-pointer mx-1">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  defaultChecked={true}
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
              <span className="text-[12px] text-primary font-medium">On</span>
            </div>
          </div>
          
        </form>

        {/* Sticky Save Button */}
        <div className="absolute bottom-0 left-0 w-full p-4 bg-white pb-6 md:pb-4 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] border-t border-gray-50">
          <button
            form="addressForm"
            type="submit"
            disabled={isSaving}
            className="w-full py-3.5 bg-primary text-white font-medium rounded text-[15px] hover:opacity-90 transition-opacity flex items-center justify-center"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
        
        {/* Region Picker Bottom Sheet */}
        {isRegionPickerOpen && (
          <div className="absolute inset-0 z-[60] flex flex-col justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" onClick={() => setIsRegionPickerOpen(false)} />
            
            {/* Sheet */}
            <div className="relative bg-white rounded-t-[1.5rem] flex flex-col max-h-[85vh] h-[80vh] animate-in slide-in-from-bottom duration-300 shadow-xl overflow-hidden">
              {/* Sheet Header */}
              <div className="flex justify-between items-center p-4 shrink-0">
                <div className="w-8" /> {/* Spacer */}
                <h3 className="text-[16px] font-bold text-gray-900">Select address</h3>
                <button type="button" onClick={() => setIsRegionPickerOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              {/* Dynamic Tabs */}
              {renderPickerTabs()}
              
              {/* List */}
              {renderPickerList()}
            </div>
          </div>
        )}

      </div>
    </dialog>
  );
};

export default AddressForm;
