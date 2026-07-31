import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiAlertTriangle } from 'react-icons/fi';
import { productService } from '../../services/productService';
import { formatCurrency } from '../../utils/helpers';
import type { Product } from '../../types';
import toast from 'react-hot-toast';

const AdminProducts: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, page],
    queryFn: () => productService.getProducts({ search, page, limit: 20 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete product'),
  });

  const productsList: Product[] = Array.isArray(data?.data) ? data.data : (Array.isArray((data as any)?.data?.data) ? (data as any).data.data : []);

  return (
    <>
      <Helmet><title>Products | JJ Vintage Admin</title></Helmet>

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-black border border-gold-500/30 p-6 max-w-sm w-full rounded-sm shadow-2xl text-white"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-950/50 border border-red-500/30 flex items-center justify-center rounded-full">
                <FiAlertTriangle className="text-red-400" size={18} />
              </div>
              <h3 className="font-display font-bold text-lg text-gold-500">Delete Product?</h3>
            </div>
            <p className="text-gray-300 text-sm mb-6">This action cannot be undone. The product and all its images will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary text-white border-gray-700 hover:bg-white hover:text-black flex-1">Cancel</button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-600 text-white py-3 text-sm font-bold hover:bg-red-700 transition-colors"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-black">Products</h1>
          <Link to="/admin/products/new" className="btn-gold font-bold gap-2">
            <FiPlus size={16} />
            Add Product
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-black border border-gold-500/20 p-4 rounded-sm flex gap-4 shadow-xl">
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-500" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search products..."
              className="input-field bg-gray-900 border-gray-800 text-white placeholder-gray-500 pl-10 focus:border-gold-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-black border border-gold-500/20 rounded-sm shadow-xl overflow-hidden text-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-950 border-b border-gold-500/20">
                <tr>
                  {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-sans font-semibold text-gold-500 tracking-wider px-6 py-4 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900">
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="skeleton bg-gray-900 w-10 h-10 rounded" />
                        <div className="skeleton bg-gray-900 h-4 w-32 rounded" />
                      </td>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <td key={j} className="px-6 py-4"><div className="skeleton bg-gray-900 h-4 w-20 rounded" /></td>
                      ))}
                    </tr>
                  ))
                  : productsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-sans">
                        No products found. Click <Link to="/admin/products/new" className="text-gold-500 underline font-semibold">Add Product</Link> to create one!
                      </td>
                    </tr>
                  ) : productsList.map((product: Product) => (
                    <tr key={product._id} className="hover:bg-gray-900/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800'}
                            alt={product.name}
                            className="w-10 h-10 object-cover flex-shrink-0 border border-gold-500/30 rounded-sm"
                          />
                          <div>
                            <p className="text-sm font-medium text-white line-clamp-1">{product.name}</p>
                            <p className="text-xs text-gold-500/70 capitalize">{product.gender}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {typeof product.category === 'object' ? product.category?.name : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gold-500">{formatCurrency(product.price)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${(product.totalStock || 0) <= 5 ? 'text-red-400' : 'text-gray-200'}`}>
                          {product.totalStock || 0}
                          {(product.totalStock || 0) <= 5 && (product.totalStock || 0) > 0 && <span className="ml-1 text-xs text-red-400">(Low)</span>}
                          {(product.totalStock || 0) === 0 && <span className="ml-1 text-xs text-red-500">(Out)</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase rounded-full ${
                          product.isActive ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {product.isActive ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/products/${product._id}/edit`)}
                            className="p-1.5 text-gold-500 hover:text-gold-300 hover:bg-gold-500/10 rounded transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteId(product._id)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminProducts;
