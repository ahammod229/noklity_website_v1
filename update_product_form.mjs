import fs from 'fs';

let content = fs.readFileSync('components/admin/ProductForm.tsx', 'utf8');

// 1. Add imports
content = content.replace(
  "import { HelpCircle, X, Plus, Loader2, ChevronRight, Check, Image as ImageIcon } from 'lucide-react';",
  "import { HelpCircle, X, Plus, Loader2, ChevronRight, Check, Image as ImageIcon, Trash2 } from 'lucide-react';\nimport ReactQuill from 'react-quill';\nimport 'react-quill/dist/quill.snow.css';"
);

// 2. Add Brands and Variants to ProductFormData
content = content.replace(
  "export interface ProductFormData {",
  "export interface ProductVariantData {\n  id?: string;\n  name: string;\n  price: number;\n  stock: number;\n  sku: string;\n  image_url: string;\n}\n\nexport interface ProductFormData {"
);
content = content.replace(
  "videoType?: string;",
  "videoUrl?: string;\n  videoProvider?: string;\n  variants: ProductVariantData[];"
);

// 3. Update state initialization
content = content.replace(
  "    highlights: '',",
  "    highlights: '',\n    variants: initialData?.variants || [],\n    videoUrl: initialData?.videoUrl || '',\n    videoProvider: initialData?.videoProvider || 'youtube',"
);

// 4. Add brands fetch inside component
const brandsFetch = `
  const [brandsList, setBrandsList] = useState<{id: string, name: string}[]>([]);
  useEffect(() => {
    supabase.from('brands').select('id, name').order('name').then(({data}) => {
      if (data) setBrandsList(data);
    });
  }, []);
`;
content = content.replace(
  "const DarazProductForm: React.FC<DarazProductFormProps> = ({ initialData, onSubmit, onCancel, isSaving, categories }) => {",
  "const DarazProductForm: React.FC<DarazProductFormProps> = ({ initialData, onSubmit, onCancel, isSaving, categories }) => {" + brandsFetch
);

// 5. Replace Brand Input with Dropdown
const brandRegex = /<input\s+type="text"\s+placeholder="No Brand"\s+className="w-full px-3 py-2 border border-gray-300 rounded focus:border-primary outline-none text-\[13px\] bg-white cursor-pointer"\s+value=\{formData\.brand \|\| ''\}\s+onChange=\{e => setFormData\(\{\.\.\.formData, brand: e\.target\.value\}\)\}\s+\/>/;
const newBrandInput = `
<select
  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-primary outline-none text-[13px] bg-white cursor-pointer"
  value={formData.brand || 'No Brand'}
  onChange={e => setFormData({...formData, brand: e.target.value})}
>
  <option value="No Brand">No Brand</option>
  {brandsList.map(b => (
    <option key={b.id} value={b.name}>{b.name}</option>
  ))}
</select>
`;
content = content.replace(brandRegex, newBrandInput);

// 6. Fix Video Input
const videoRegex = /<input type="text" placeholder="Video URL" className="flex-1 text-\[13px\] px-3 py-2 border border-gray-300 rounded focus:border-primary outline-none" \/>/;
const newVideoInput = `<input type="text" placeholder="Video URL" className="flex-1 text-[13px] px-3 py-2 border border-gray-300 rounded focus:border-primary outline-none" value={formData.videoUrl || ''} onChange={e => setFormData({...formData, videoUrl: e.target.value})} />`;
content = content.replace(videoRegex, newVideoInput);

fs.writeFileSync('components/admin/ProductForm.tsx', content);

