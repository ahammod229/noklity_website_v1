import fs from 'fs';
let content = fs.readFileSync('components/admin/ProductForm.tsx', 'utf8');

// Add showMoreWarranty state
if (!content.includes('const [showMoreWarranty, setShowMoreWarranty] = useState(false);')) {
  content = content.replace(
    'const [brandsList, setBrandsList]',
    'const [showMoreWarranty, setShowMoreWarranty] = useState(false);\n  const [brandsList, setBrandsList]'
  );
}

const oldWarrantyBlock = `                <div>
                  <label className="block text-[13px] font-bold text-gray-800 mb-1">
                    <span className="text-red-500 mr-1">*</span>Warranty Type
                  </label>
                  <select 
                    className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded hover:border-primary/50 focus:border-primary outline-none text-[13px] bg-white cursor-pointer"
                    value={formData.warrantyType}
                    onChange={e => setFormData({...formData, warrantyType: e.target.value})}
                  >
                    <option>Select</option>
                    <option>No Warranty</option>
                    <option>Local Seller Warranty</option>
                    <option>Brand Warranty</option>
                  </select>
                </div>

                <div className="text-primary text-[13px] font-medium cursor-pointer hover:underline flex items-center gap-1 w-max">
                  More Warranty Settings <span className="text-[9px]">▼</span>
                </div>`;

const newWarrantyBlock = `                <div>
                  <label className="block text-[13px] font-bold text-gray-800 mb-1">
                    Warranty Type
                  </label>
                  <select 
                    className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded hover:border-primary/50 focus:border-primary outline-none text-[13px] bg-white cursor-pointer"
                    value={formData.warranty}
                    onChange={e => setFormData({...formData, warranty: e.target.value})}
                  >
                    <option value="">Select</option>
                    <option value="No Warranty">No Warranty</option>
                    <option value="Local Seller Warranty">Local Seller Warranty</option>
                    <option value="Brand Warranty">Brand Warranty</option>
                    <option value="International Manufacturer Warranty">International Manufacturer Warranty</option>
                    <option value="International Seller Warranty">International Seller Warranty</option>
                  </select>
                </div>

                {showMoreWarranty && (
                  <div className="space-y-6 mt-4">
                    <div>
                      <label className="block text-[13px] font-bold text-gray-800 mb-1">
                        Warranty Period
                      </label>
                      <select 
                        className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded hover:border-primary/50 focus:border-primary outline-none text-[13px] bg-white cursor-pointer"
                        value={formData.warrantyMonths || ''}
                        onChange={e => setFormData({...formData, warrantyMonths: Number(e.target.value)})}
                      >
                        <option value="">Select</option>
                        <option value="1">1 Month</option>
                        <option value="2">2 Months</option>
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="12">1 Year</option>
                        <option value="24">2 Years</option>
                        <option value="36">3 Years</option>
                        <option value="60">5 Years</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-gray-800 mb-1">
                        Warranty Policy
                      </label>
                      <input 
                        type="text" 
                        className="w-full max-w-2xl px-3 py-2 border border-gray-300 rounded hover:border-primary/50 focus:border-primary outline-none text-[13px]"
                        value={formData.warrantyPolicy || ''}
                        onChange={e => setFormData({...formData, warrantyPolicy: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[13px] font-bold text-gray-800 mb-1">
                        Return Policy
                      </label>
                      <input 
                        type="text" 
                        className="w-full max-w-2xl px-3 py-2 border border-gray-300 rounded hover:border-primary/50 focus:border-primary outline-none text-[13px]"
                        value={formData.returnPolicy || ''}
                        onChange={e => setFormData({...formData, returnPolicy: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                <div 
                  className="text-primary text-[13px] font-medium cursor-pointer hover:underline flex items-center gap-1 w-max mt-4"
                  onClick={() => setShowMoreWarranty(!showMoreWarranty)}
                >
                  {showMoreWarranty ? 'Show Less ^' : 'More Warranty Settings ▼'}
                </div>`;

content = content.replace(oldWarrantyBlock, newWarrantyBlock);

fs.writeFileSync('components/admin/ProductForm.tsx', content);

