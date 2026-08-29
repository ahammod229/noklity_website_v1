import fs from 'fs';

let content = fs.readFileSync('pages/Wishlist.tsx', 'utf8');

// Replace import
content = content.replace(
  "import WishlistCard from '../components/WishlistCard';",
  "import ProductCard from '../components/ProductCard';"
);

// Replace mapping
const oldMapping = `{wishlist.map((product) => (
              <WishlistCard
                key={product.id}
                image={product.image || ''}
                title={product.name || (product as any).title || 'Unknown Product'}
                category={product.category || 'Uncategorized'}
                price={product.price || 0}
                isNew={product.isNew}
                stock={product.stock}
                onRemove={() => handleRemove(product.id)}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}`;

const newMapping = `{wishlist.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => onNavigate('product-details', product.id)}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}`;

content = content.replace(oldMapping, newMapping);

fs.writeFileSync('pages/Wishlist.tsx', content);

