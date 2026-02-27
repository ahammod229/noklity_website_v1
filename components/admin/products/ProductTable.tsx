import React from 'react';
import { Edit2, Trash2, Zap, Loader2 } from 'lucide-react';
import { Product } from '../../../types';
import { useCurrency } from '../../../hooks/useCurrency';

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onToggleFlashSale: (product: Product, e: React.MouseEvent) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({ 
  products, 
  isLoading, 
  onEdit, 
  onDelete, 
  onToggleFlashSale 
}) => {
  const { formatCurrency } = useCurrency();
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        No products found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-3 font-medium">Product</th>
            <th className="px-6 py-3 font-medium">Category</th>
            <th className="px-6 py-3 font-medium">Price</th>
            <th className="px-6 py-3 font-medium">Warranty</th>
            <th className="px-6 py-3 font-medium">Dhaka Delivery</th>
            <th className="px-6 py-3 font-medium">Stock</th>
            <th className="px-6 py-3 font-medium text-center">Flash Sale</th>
            <th className="px-6 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                    <img src={product.image} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                  </div>
                  <span className="font-medium text-gray-900 max-w-[200px] truncate block" title={product.name}>
                    {product.name}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {product.category}
                </span>
              </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                {product.originalPrice ? (
                  <div className="flex flex-col">
                    <span className="text-red-600">{formatCurrency(product.price)}</span>
                    <span className="text-gray-400 line-through text-xs">{formatCurrency(product.originalPrice)}</span>
                  </div>
                ) : (
                  <span>{formatCurrency(product.price)}</span>
                )}
                </td>
                <td className="px-6 py-4 text-xs font-bold text-gray-700">
                  {(product.warrantyMonths || 0) > 0 ? `${product.warrantyMonths} months` : 'No warranty'}
                </td>
                <td className="px-6 py-4 text-xs font-bold text-gray-700">
                  {formatCurrency(Number(product.deliveryCharges?.Dhaka || 0))}
                </td>
                <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${product.stock && product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-gray-600">{product.stock || 0}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <button 
                  onClick={(e) => onToggleFlashSale(product, e)}
                  className={`p-1.5 rounded-full transition-colors ${
                    product.isFlashSale ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400 hover:text-amber-500'
                  }`}
                  title={product.isFlashSale ? "Remove from Flash Sale" : "Add to Flash Sale"}
                >
                  <Zap className="w-4 h-4 fill-current" />
                </button>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => onEdit(product)} className="p-1.5 text-gray-400 hover:text-primary transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(product.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
