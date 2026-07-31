import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiTrash2, FiEdit2, FiCheckCircle } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminCoupons: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => { const res = await api.get('/admin/coupons'); return res.data.data; },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: code.trim().toUpperCase(),
        type,
        value: Number(value) || 10,
        minPurchase: Number(minPurchase) || 0,
        usageLimit: Number(usageLimit) || undefined,
        expiresAt: expiresAt || undefined,
        isActive: true,
      };
      return editId ? api.patch(`/admin/coupons/${editId}`, payload) : api.post('/admin/coupons', payload);
    },
    onSuccess: () => {
      toast.success(editId ? 'Coupon updated!' : 'Coupon created!');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setShowForm(false);
      setEditId(null);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/coupons/${id}`),
    onSuccess: () => {
      toast.success('Coupon deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
  });

  const resetForm = () => {
    setCode('');
    setType('percentage');
    setValue('');
    setMinPurchase('');
    setUsageLimit('');
    setExpiresAt('');
  };

  const handleEdit = (c: any) => {
    setEditId(c._id);
    setCode(c.code);
    setType(c.type);
    setValue(String(c.value));
    setMinPurchase(c.minPurchase ? String(c.minPurchase) : '');
    setUsageLimit(c.usageLimit ? String(c.usageLimit) : '');
    setExpiresAt(c.expiresAt ? c.expiresAt.substring(0, 16) : '');
    setShowForm(true);
  };

  return (
    <>
      <Helmet><title>Coupons & Promo Codes | JJ Vintage Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Coupons & Promo Codes</h1>
            <p className="text-xs text-gold-500 font-mono">Create percentage or GHS discount codes for your customers.</p>
          </div>
          <button
            onClick={() => { resetForm(); setEditId(null); setShowForm(true); }}
            className="bg-gold-500 hover:bg-gold-400 text-black font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-sm flex items-center gap-2 transition-colors shadow-lg"
          >
            <FiPlus size={16} /> Create New Coupon
          </button>
        </div>

        {/* Form Container */}
        {showForm && (
          <div className="bg-black border border-gold-500/30 rounded-sm p-6 space-y-4 shadow-2xl">
            <h2 className="font-display text-lg font-bold text-gold-500 pb-2 border-b border-gold-500/20">
              {editId ? 'Edit Promo Code' : 'Create Promo Code'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label text-gold-500/90">Coupon Code (e.g. WELCOME10)</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. JJVINTAGE20"
                  className="input-field bg-gray-900 border-gray-800 text-white uppercase focus:border-gold-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="input-label text-gold-500/90">Discount Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="input-field bg-gray-900 border-gray-800 text-white focus:border-gold-500 font-mono"
                >
                  <option value="percentage">Percentage (%) Discount</option>
                  <option value="fixed">Fixed Amount (GHS) Discount</option>
                </select>
              </div>

              <div>
                <label className="input-label text-gold-500/90">Discount Value ({type === 'percentage' ? '%' : 'GHS'})</label>
                <input
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === 'percentage' ? 'e.g. 15 for 15% OFF' : 'e.g. 50 for GH₵ 50 OFF'}
                  className="input-field bg-gray-900 border-gray-800 text-white focus:border-gold-500"
                />
              </div>

              <div>
                <label className="input-label text-gold-500/90">Minimum Order Amount (GHS)</label>
                <input
                  type="number"
                  value={minPurchase}
                  onChange={(e) => setMinPurchase(e.target.value)}
                  placeholder="e.g. 200 (Optional)"
                  className="input-field bg-gray-900 border-gray-800 text-white focus:border-gold-500"
                />
              </div>

              <div>
                <label className="input-label text-gold-500/90">Total Usage Limit</label>
                <input
                  type="number"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="e.g. 100 uses (Optional)"
                  className="input-field bg-gray-900 border-gray-800 text-white focus:border-gold-500"
                />
              </div>

              <div>
                <label className="input-label text-gold-500/90">Expiration Date & Time</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="input-field bg-gray-900 border-gray-800 text-white focus:border-gold-500 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="btn-secondary text-black border-black hover:bg-black hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="bg-gold-500 hover:bg-gold-400 text-black font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-sm transition-colors"
              >
                {createMutation.isPending ? 'Saving...' : editId ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </div>
          </div>
        )}

        {/* Coupons Table */}
        <div className="bg-black border border-gold-500/20 rounded-sm shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-900 border-b border-gray-800">
              <tr>
                {['Coupon Code', 'Discount Type', 'Value', 'Used Count', 'Expires At', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-xs font-mono font-bold text-gold-500 tracking-wider px-6 py-4 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="skeleton h-4 w-24 rounded bg-gray-800" /></td>
                    ))}
                  </tr>
                ))
              ) : (
                coupons.map((c: any) => (
                  <tr key={c._id} className="hover:bg-gray-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-bold text-gold-400 bg-gold-500/10 border border-gold-500/30 px-2.5 py-1 rounded">
                        {c.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-300 capitalize">{c.type}</td>
                    <td className="px-6 py-4 text-sm font-bold text-white">
                      {c.type === 'percentage' ? `${c.value}% OFF` : `GH₵ ${c.value} OFF`}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">
                      {c.usedCount} {c.usageLimit ? `/ ${c.usageLimit}` : 'uses'}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase ${
                        c.isActive ? 'bg-gold-500/10 text-gold-400 border border-gold-500/30' : 'bg-gray-800 text-gray-400'
                      }`}>
                        <FiCheckCircle size={10} /> {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(c)}
                          className="p-1.5 text-gold-400 hover:text-gold-300 transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(c._id)}
                          className="p-1.5 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {coupons.length === 0 && !isLoading && (
            <div className="py-12 text-center text-gray-400 text-sm font-mono">No active coupons created yet. Click "Create New Coupon" above.</div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminCoupons;
