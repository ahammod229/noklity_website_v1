import fs from 'fs';

// Update AccountSidebar
let sidebar = fs.readFileSync('components/account/AccountSidebar.tsx', 'utf8');
const brandMenu = `      { icon: Tags, label: 'Categories', path: '/admin/categories', active: currentPath === '/admin/categories' },
      { icon: Tag, label: 'Brands', path: '/admin/brands', active: currentPath === '/admin/brands' },`;
sidebar = sidebar.replace(/\{\s*icon:\s*Tags,\s*label:\s*'Categories'[^}]+\},/, brandMenu);
// Ensure Tag icon is imported
if (!sidebar.includes('Tag,')) {
  sidebar = sidebar.replace('Tags,', 'Tags, Tag,');
}
fs.writeFileSync('components/account/AccountSidebar.tsx', sidebar);

// Update App.tsx routes
let app = fs.readFileSync('App.tsx', 'utf8');
const brandRoute = `            <Route path="categories" element={<CategoryManager />} />
            <Route path="brands" element={<BrandManager />} />`;
if (!app.includes('<Route path="brands"')) {
    app = app.replace(/<Route path="categories" element=\{<CategoryManager \/>\} \/>/, brandRoute);
    app = app.replace(/import CategoryManager from '\.\/components\/admin\/CategoryManager';/, `import CategoryManager from './components/admin/CategoryManager';\nimport BrandManager from './components/admin/BrandManager';`);
    fs.writeFileSync('App.tsx', app);
}

