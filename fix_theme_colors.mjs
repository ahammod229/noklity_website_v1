import fs from 'fs';

let content = fs.readFileSync('components/admin/ProductForm.tsx', 'utf8');

const replacements = {
  'text-orange-500': 'text-primary',
  'bg-orange-500': 'bg-primary',
  'border-orange-500': 'border-primary',
  'hover:bg-orange-50': 'hover:bg-primary/5',
  'hover:bg-orange-600': 'hover:bg-primary/90',
  'ring-orange-500': 'ring-primary',
  'peer-checked:bg-orange-500': 'peer-checked:bg-primary',

  'text-blue-500': 'text-primary',
  'text-blue-600': 'text-primary',
  'border-blue-500': 'border-primary',
  'border-blue-400': 'border-primary/50',
  'bg-blue-500': 'bg-primary',
  'bg-blue-50': 'bg-primary/10',
  'hover:text-blue-500': 'hover:text-primary',
  'hover:text-blue-600': 'hover:text-primary',
  'hover:border-blue-500': 'hover:border-primary',
  'hover:border-blue-400': 'hover:border-primary/50',
  'focus:border-blue-500': 'focus:border-primary',
  'focus-within:border-blue-500': 'focus-within:border-primary',
  'focus-within:ring-blue-500': 'focus-within:ring-primary',
  'focus:ring-blue-500': 'focus:ring-primary',
  'hover:bg-blue-50': 'hover:bg-primary/5'
};

for (const [key, value] of Object.entries(replacements)) {
  const regex = new RegExp(key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
  content = content.replace(regex, value);
}

fs.writeFileSync('components/admin/ProductForm.tsx', content);

