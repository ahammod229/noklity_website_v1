import fs from 'fs';

let content = fs.readFileSync('pages/admin/Products.tsx', 'utf8');

const oldRender = `  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">`;

const newRender = `  if (isModalOpen) {
    return (
      <div className="-m-6 lg:-m-8">
        <ProductForm 
          initialData={editingProduct}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isSaving={isSaving}
          categories={categories}
        />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">`;

content = content.replace(oldRender, newRender);

const oldModalContent = `      {/* Modal Form Component */}
      {isModalOpen && (
        <ProductForm 
          initialData={editingProduct}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isSaving={isSaving}
          categories={categories}
        />
      )}`;

content = content.replace(oldModalContent, "");
fs.writeFileSync('pages/admin/Products.tsx', content);

