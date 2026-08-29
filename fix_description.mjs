import fs from 'fs';

const files = ['components/ProductDetails.tsx', 'components/ProductTabs.tsx'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace {product.description || ...} with dangerouslySetInnerHTML
    const regex1 = /\{product\.description \|\| 'No description available for this product\.'\}/g;
    content = content.replace(regex1, '<div dangerouslySetInnerHTML={{ __html: product.description || "No description available for this product." }} className="prose max-w-none text-gray-700 text-sm leading-relaxed" />');

    const regex2 = /<p className="text-gray-600 leading-relaxed text-\[15px\] whitespace-pre-wrap">\s*\{description\}\s*<\/p>/g;
    content = content.replace(regex2, '<div dangerouslySetInnerHTML={{ __html: description }} className="prose max-w-none text-gray-700 text-[15px] leading-relaxed" />');

    fs.writeFileSync(file, content);
  }
});

