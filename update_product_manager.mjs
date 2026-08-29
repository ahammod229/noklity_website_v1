import fs from 'fs';

let content = fs.readFileSync('components/admin/ProductManager.tsx', 'utf8');

// Change the modal rendering to full-page rendering
const oldReturn = `return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Products</h2>
           <p className="text-gray-500 text-sm">Manage your product inventory</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary text-white font-bold px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search products..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>
        </div>

        {/* Table Component */}
        <ProductTable 
          products={filteredProducts}
          isLoading={loading}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
          onToggleFlashSale={handleToggleFlashSale}
        />
      </div>

      {/* Modal Form Component */}
      {isModalOpen && (
        <ProductForm 
          initialData={editingProduct}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isSaving={isSaving}
        />
      )}
    </div>
  );`;

const newReturn = `
  if (isModalOpen) {
    return (
      <ProductForm 
        initialData={editingProduct}
        onSubmit={handleSubmit}
        onCancel={handleCloseModal}
        isSaving={isSaving}
      />
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Products</h2>
           <p className="text-gray-500 text-sm">Manage your product inventory</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary text-white font-bold px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search products..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>
        </div>

        {/* Table Component */}
        <ProductTable 
          products={filteredProducts}
          isLoading={loading}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
          onToggleFlashSale={handleToggleFlashSale}
        />
      </div>
    </div>
  );`;

content = content.replace(oldReturn, newReturn);
fs.writeFileSync('components/admin/ProductManager.tsx', content);

