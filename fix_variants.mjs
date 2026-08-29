import fs from 'fs';

let content = fs.readFileSync('components/admin/ProductForm.tsx', 'utf8');

const strStart = '<h2 className="text-[15px] font-bold text-gray-800">Price, Stock & Variants</h2>';
const strEnd = '{/* Section 4: Product Description */}';

const startIndex = content.indexOf(strStart);
const endIndex = content.indexOf(strEnd, startIndex);

if (startIndex > -1 && endIndex > -1) {
  // Find the opening div of Section 3
  const section3Start = content.lastIndexOf('<div className="bg-white rounded-lg shadow-sm border border-gray-200">', startIndex);
  
  const before = content.substring(0, section3Start);
  const after = content.substring(endIndex);

  const newVariantsSection = `
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-lg flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-bold text-gray-800">Price, Stock & Variants</h2>
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, variants: [...formData.variants, { name: '', price: formData.regularPrice || 0, stock: 0, sku: '', image_url: '' }]})}
                  className="bg-primary/10 text-primary px-3 py-1 rounded text-sm font-bold flex items-center gap-1 hover:bg-primary/20"
                >
                  <Plus className="w-4 h-4" /> Add Variant
                </button>
              </div>
              
              <div className="p-6">
                
                {/* Base Price & Stock */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                   <div>
                      <label className="block text-[13px] font-bold text-gray-700 mb-1">Base Regular Price *</label>
                      <input 
                        type="number" 
                        required
                        value={formData.regularPrice || ''}
                        onChange={e => setFormData({...formData, regularPrice: Number(e.target.value)})}
                        className="w-full border border-gray-300 rounded p-2 outline-none focus:border-primary text-[13px]"
                      />
                   </div>
                   <div>
                      <label className="block text-[13px] font-bold text-gray-700 mb-1">Base Stock *</label>
                      <input 
                        type="number" 
                        required
                        value={formData.stock || ''}
                        onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                        className="w-full border border-gray-300 rounded p-2 outline-none focus:border-primary text-[13px]"
                      />
                   </div>
                </div>

                {formData.variants.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                        <tr>
                          <th className="px-4 py-3 font-semibold w-16">Image</th>
                          <th className="px-4 py-3 font-semibold">Variant Name (e.g. Red, XL)</th>
                          <th className="px-4 py-3 font-semibold w-24">Price</th>
                          <th className="px-4 py-3 font-semibold w-24">Stock</th>
                          <th className="px-4 py-3 font-semibold w-32">SKU</th>
                          <th className="px-4 py-3 font-semibold w-16 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {formData.variants.map((variant, index) => (
                          <tr key={index} className="bg-white">
                            <td className="px-4 py-2">
                               <div className="relative w-10 h-10 border rounded bg-gray-50 flex items-center justify-center overflow-hidden group cursor-pointer">
                                 {variant.image_url ? (
                                   <img src={variant.image_url} alt="var" className="w-full h-full object-cover" />
                                 ) : (
                                   <ImageIcon className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                                 )}
                                 <input 
                                   type="file" 
                                   accept="image/*"
                                   className="absolute inset-0 opacity-0 cursor-pointer"
                                   onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                         const url = await uploadFile(file, 'products');
                                         const newVars = [...formData.variants];
                                         newVars[index].image_url = url;
                                         setFormData({...formData, variants: newVars});
                                      }
                                   }}
                                 />
                               </div>
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                type="text" 
                                value={variant.name}
                                onChange={e => {
                                  const newVars = [...formData.variants];
                                  newVars[index].name = e.target.value;
                                  setFormData({...formData, variants: newVars});
                                }}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-primary"
                                placeholder="Red, XL"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                type="number" 
                                value={variant.price || ''}
                                onChange={e => {
                                  const newVars = [...formData.variants];
                                  newVars[index].price = Number(e.target.value);
                                  setFormData({...formData, variants: newVars});
                                }}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-primary"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                type="number" 
                                value={variant.stock || ''}
                                onChange={e => {
                                  const newVars = [...formData.variants];
                                  newVars[index].stock = Number(e.target.value);
                                  setFormData({...formData, variants: newVars});
                                }}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-primary"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                type="text" 
                                value={variant.sku}
                                onChange={e => {
                                  const newVars = [...formData.variants];
                                  newVars[index].sku = e.target.value;
                                  setFormData({...formData, variants: newVars});
                                }}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-primary"
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button 
                                type="button"
                                onClick={() => {
                                  const newVars = formData.variants.filter((_, i) => i !== index);
                                  setFormData({...formData, variants: newVars});
                                }}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            `;

  content = before + newVariantsSection + after;
  fs.writeFileSync('components/admin/ProductForm.tsx', content);
}

