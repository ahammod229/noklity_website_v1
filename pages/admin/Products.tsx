
import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Loader2 } from 'lucide-react';
import { ProductTable } from '../../components/admin/products/ProductTable';
import ProductForm, { ProductFormData } from '../../components/admin/ProductForm';
import { ToastType } from '../../components/Toast';

interface ProductsPageProps {
  showToast?: (message: string, type?: ToastType) => void;
}

const isLiveCatalogProduct = (product: Product) => {
  const normalizedStatus = String(product.status || '').trim().toLowerCase();
  return normalizedStatus !== 'inactive' && product.isActive !== false;
};

const ProductsPage: React.FC<ProductsPageProps> = ({ showToast }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [catalogRecoveryNeeded, setCatalogRecoveryNeeded] = useState(false);
  const [restoringCatalog, setRestoringCatalog] = useState(false);

  // Helper to show toast if provided, otherwise console log or alert
  const notify = (msg: string, type: ToastType = 'success') => {
    if (showToast) showToast(msg, type);
    else if (typeof window !== 'undefined') window.alert(msg);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('name')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (!error && data && data.length > 0) {
      setCategories(data.map((c: any) => c.name));
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      notify('Failed to load products', 'error');
      setLoading(false);
      return;
    }

    if (data) {
      const mappedProducts: Product[] = data.map((row: any) => ({
        id: row.id,
        name: row.title,
        slug: row.slug || '',
        brand: row.brand || '',
        modelNumber: row.model_number || '',
        sku: row.sku || '',
        category: row.category || 'Uncategorized',
        price: row.price,
        originalPrice: row.discount_price ? row.price : undefined, // Logic adjustment: if discount_price exists, display price is discount_price? Usually price is MSRP.
        specifications: row.specifications || {},
        compatibility: Array.isArray(row.compatibility) ? row.compatibility : [],
        weight: Number(row.weight || 0),
        deliveryCharge: Number(row.delivery_charge || 0),
        warranty: row.warranty || '',
        countryOfOrigin: row.country_of_origin || '',
        status: row.status || 'active',
        defaultDeliveryFee: Number(row.default_delivery_fee || 0),
        // Let's align with schema: price is selling price. If discount_price is set in DB, that's likely the sale price.
        // However, standard e-comm schema usually has `price` (regular) and `sale_price` (discounted).
        // Let's assume row.price is REGULAR and row.discount_price is SALE.
        // So for the Product type: price = row.discount_price || row.price. originalPrice = row.discount_price ? row.price : undefined.
        // This matches the previous logic.
        image: row.image_url || '',
        images: Array.isArray(row.image_urls) ? row.image_urls : [],
        deliveryCharges: row.delivery_charges || {},
        warrantyMonths: Number(row.warranty_months || 0),
        warrantyPolicy: row.warranty_policy || '',
        shippingInfo: row.shipping_info || '',
        returnPolicy: row.return_policy || '',
        faqText: row.faq_text || '',
        relatedProductIds: Array.isArray(row.related_product_ids) ? row.related_product_ids : [],
        isActive: row.status !== 'inactive' && row.is_active !== false,
        stock: row.stock,
        rating: row.rating,
        isFlashSale: row.is_flash_sale,
        description: row.description,
      }));
      const visibleProducts = mappedProducts.filter(isLiveCatalogProduct);
      setCatalogRecoveryNeeded(mappedProducts.length > 0 && visibleProducts.length === 0);
      setProducts(visibleProducts.length > 0 ? visibleProducts : mappedProducts);
    }
    setLoading(false);
  };

  const handleRestoreCatalog = async () => {
    if (products.length === 0) return;
    setRestoringCatalog(true);

    try {
      const productIds = products.map((product) => product.id);
      const { error } = await supabase
        .from('products')
        .update({
          status: 'active',
          is_active: true
        })
        .in('id', productIds);

      if (error) {
        throw error;
      }

      notify('All products were restored to the live catalog.');
      await fetchProducts();
    } catch (error: any) {
      notify(error?.message || 'Failed to restore products', 'error');
    } finally {
      setRestoringCatalog(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(undefined);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setDeletingProductId(id);

    try {
      const { data: orderItems, error: orderReferenceError } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('product_id', id);

      if (orderReferenceError) {
        throw orderReferenceError;
      }

      const relatedOrderIds = Array.from(
        new Set((orderItems || []).map((item: { order_id: string | null }) => item.order_id).filter(Boolean))
      ) as string[];

      if (relatedOrderIds.length > 0) {
        const { count: pendingOrderCount, error: pendingOrderError } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .in('id', relatedOrderIds)
          .in('status', ['Pending', 'pending']);

        if (pendingOrderError) {
          throw pendingOrderError;
        }

        if ((pendingOrderCount || 0) > 0) {
          notify('This product is used in pending orders, so you cannot delete it yet.', 'error');
          return;
        }

        const [{ error: archiveError }, { error: cartCleanupError }, { error: wishlistCleanupError }] =
          await Promise.all([
            supabase
              .from('products')
              .update({
                status: 'inactive',
                is_active: false,
                stock: 0,
                is_flash_sale: false
              })
              .eq('id', id),
            supabase.from('cart_items').delete().eq('product_id', id),
            supabase.from('wishlist_items').delete().eq('product_id', id)
          ]);

        if (archiveError) {
          throw archiveError;
        }

        if (cartCleanupError) {
          console.warn('Cart cleanup warning while archiving product:', cartCleanupError);
        }
        if (wishlistCleanupError) {
          console.warn('Wishlist cleanup warning while archiving product:', wishlistCleanupError);
        }

        notify('This product was removed from the live catalog and admin list because its orders are already completed or cancelled.');
        setProducts((prev) => prev.filter((product) => product.id !== id));
        return;
      }

      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        throw error;
      }

      setProducts((prev) => prev.filter((product) => product.id !== id));
      notify('Product deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      notify(error?.message || 'Failed to delete product', 'error');
      await fetchProducts();
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleToggleFlashSale = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedProducts = products.map(p => 
      p.id === product.id ? { ...p, isFlashSale: !p.isFlashSale } : p
    );
    setProducts(updatedProducts);

    const { error } = await supabase
      .from('products')
      .update({ is_flash_sale: !product.isFlashSale })
      .eq('id', product.id);

    if (error) {
      // Revert
      setProducts(products);
      notify('Failed to update flash sale status', 'error');
    } else {
        const status = !product.isFlashSale ? 'added to' : 'removed from';
        notify(`Product ${status} Flash Sale`);
    }
  };

  const handleSubmit = async (formData: ProductFormData) => {
    setIsSaving(true);

    // Map form data to DB schema
    // Logic: If salePrice is valid and < regularPrice, we store regularPrice as 'price' and salePrice as 'discount_price' (or vice versa depending on schema interp).
    // Let's stick to: 'price' column is the base price. 'discount_price' is the lower price.
    // If formData.salePrice is present, use it.
    
    const payload = {
      title: formData.name,
      slug: formData.slug || null,
      brand: formData.brand || null,
      model_number: formData.modelNumber || null,
      sku: formData.sku || null,
      category: formData.category,
      price: formData.regularPrice, // Base price
      discount_price: (formData.salePrice && formData.salePrice < formData.regularPrice) ? formData.salePrice : null,
      specifications: formData.specifications || {},
      compatibility: formData.compatibility || [],
      weight: formData.weight || null,
      delivery_charge: formData.deliveryCharge || 0,
      warranty: formData.warranty || null,
      country_of_origin: formData.countryOfOrigin || null,
      status: formData.status,
      stock: formData.stock,
      image_url: formData.image,
      image_urls: formData.images,
      delivery_charges: formData.deliveryCharges,
      warranty_months: formData.warrantyMonths,
      warranty_policy: formData.warrantyPolicy || null,
      tax_percent: 0,
      default_delivery_fee: formData.defaultDeliveryFee,
      shipping_info: formData.shippingInfo || null,
      return_policy: formData.returnPolicy || null,
      faq_text: formData.faqText || null,
      related_product_ids: formData.relatedProductIds || [],
      is_active: formData.status === 'active',
      is_flash_sale: formData.isFlashSale,
      description: formData.description || null,
      // rating: handled by default or ignored on update
    };

    let error;

    if (editingProduct) {
      const { error: updateError } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingProduct.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('products')
        .insert([{ ...payload, rating: 5.0 }]); // Default rating for new items
      error = insertError;
    }

    if (error) {
      notify(error.message, 'error');
    } else {
      notify(editingProduct ? 'Product updated successfully' : 'Product created successfully');
      handleCloseModal();
      fetchProducts();
    }
    setIsSaving(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
           <h2 className="text-2xl font-black text-gray-900 tracking-tight">Products</h2>
           <p className="text-gray-500 text-sm font-medium">Manage your product inventory and pricing</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary text-white font-bold px-6 py-3 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-3 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search products by name or category..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                />
            </div>
        </div>

        {catalogRecoveryNeeded && (
          <div className="mx-6 mb-0 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-black text-amber-900">All products are currently hidden from the customer panel.</p>
              <p className="text-sm font-semibold text-amber-800 mt-1">
                This usually means they were archived. Restore them to make the live catalog visible again.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRestoreCatalog}
              disabled={restoringCatalog}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-black text-white transition hover:bg-amber-700 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {restoringCatalog ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Restore All Products
            </button>
          </div>
        )}

        {/* Table Component */}
        <ProductTable 
          products={filteredProducts}
          isLoading={loading}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
          onToggleFlashSale={handleToggleFlashSale}
          deletingProductId={deletingProductId}
        />
      </div>

      {/* Modal Form Component */}
      {isModalOpen && (
        <ProductForm 
          initialData={editingProduct}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isSaving={isSaving}
          categories={categories}
        />
      )}
    </div>
  );
};

export default ProductsPage;
