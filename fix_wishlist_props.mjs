import fs from 'fs';

let content = fs.readFileSync('pages/Wishlist.tsx', 'utf8');

content = content.replace(
  /const Wishlist: React\.FC<WishlistProps> = \(\{\n  onNavigate,\n  onAddToCart\n\}\) => \{/,
  `const Wishlist: React.FC<WishlistProps> = ({\n  onNavigate,\n  onAddToCart,\n  onLoginClick,\n  cartItemCount,\n  onCartClick\n}) => {`
);

fs.writeFileSync('pages/Wishlist.tsx', content);

