import fs from 'fs';

let content = fs.readFileSync('components/admin/ProductForm.tsx', 'utf8');

// Remove score calculation
const scoreBlockRegex = /  \/\/ Calculate content score based on Daraz rules[\s\S]*?if \(score === 100\) \{ scoreLabel = 'Excellent'; scoreColor = 'text-green-500'; \}/;
content = content.replace(scoreBlockRegex, '');

// Change form layout
content = content.replace(
  'className="flex flex-col lg:flex-row gap-6"',
  'className="flex flex-col gap-6 max-w-5xl mx-auto w-full"'
);

// Remove the sidebar HTML
const sidebarRegex = /          \{\/\* Right Sticky Sidebar \(Tips & Score\) \*\/\}([\s\S]*?)<\/form>/;
content = content.replace(sidebarRegex, '        </form>');

fs.writeFileSync('components/admin/ProductForm.tsx', content);

