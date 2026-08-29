import fs from 'fs';
let content = fs.readFileSync('pages/AdminDashboard.tsx', 'utf8');

if (!content.includes('BrandManager')) {
    content = content.replace(
        "import CategoryManager from '../components/admin/CategoryManager';",
        "import CategoryManager from '../components/admin/CategoryManager';\nimport BrandManager from '../components/admin/BrandManager';"
    );
    content = content.replace(
        "case 'categories': return <CategoryManager />;",
        "case 'categories': return <CategoryManager />;\n      case 'brands': return <BrandManager />;"
    );
    fs.writeFileSync('pages/AdminDashboard.tsx', content);
}
