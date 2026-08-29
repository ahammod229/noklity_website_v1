import fs from 'fs';

let content = fs.readFileSync('pages/Wishlist.tsx', 'utf8');

const loadingOld = `  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Loading Wishlist...</p>
      </div>
    );
  }`;

const loadingNew = `  if (isLoading) {
    return (
      <AccountLayout
        activeTab="wishlist"
        onNavigate={onNavigate}
        onCartClick={onCartClick}
        onLoginClick={onLoginClick}
        cartItemCount={cartItemCount}
        title="My Wishlist"
      >
        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Loading Wishlist...</p>
        </div>
      </AccountLayout>
    );
  }`;

content = content.replace(loadingOld, loadingNew);

fs.writeFileSync('pages/Wishlist.tsx', content);

