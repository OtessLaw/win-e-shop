import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { FiPlus, FiTrash2, FiCheck } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern',
  'Northern', 'Volta', 'Bono', 'Upper East', 'Upper West',
];

const AddressesPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: async () => { const res = await api.get('/addresses'); return res.data.data; },
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/addresses', data),
    onSuccess: () => {
      toast.success('Address saved!');
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
      setShowForm(false);
      reset();
    },
    onError: () => toast.error('Failed to save address'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/addresses/${id}`),
    onSuccess: () => {
      toast.success('Address removed');
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/addresses/${id}/default`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
    },
  });

  return (
    <>
      <Helmet><title>Addresses | JJ Vintage Collection</title></Helmet>

      <div className="bg-gray-50 min-h-screen">
        <div className="bg-black text-white py-14">
          <div className="container-brand">
            <p className="text-gold-DEFAULT text-xs tracking-widest uppercase mb-2">Account</p>
            <h1 className="font-display font-bold text-3xl">My Addresses</h1>
          </div>
        </div>

        <div className="container-brand py-10 max-w-3xl">
          <div className="flex justify-end mb-6">
            <button onClick={() => setShowForm(!showForm)} className="btn-primary gap-2">
              <FiPlus size={16} />Add Address
            </button>
          </div>

          {showForm && (
            <div className="bg-white p-6 mb-6">
              <h2 className="font-sans font-semibold mb-4">New Address</h2>
              <form onSubmit={handleSubmit((data) => createMutation.mutate(data as Record<string, unknown>))} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Full Name *</label>
                  <input {...register('fullName', { required: true })} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Phone *</label>
                  <input {...register('phone', { required: true })} className="input-field" placeholder="+233..." />
                </div>
                <div>
                  <label className="input-label">Region *</label>
                  <select {...register('region', { required: true })} className="input-field">
                    <option value="">Select region</option>
                    {GHANA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">City *</label>
                  <input {...register('city', { required: true })} className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="input-label">Street Address *</label>
                  <input {...register('address', { required: true })} className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="input-label">GPS Address</label>
                  <input {...register('gpsAddress')} className="input-field" placeholder="e.g. GE-123-4567" />
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <input type="checkbox" {...register('isDefault')} id="isDefault" className="accent-black" />
                  <label htmlFor="isDefault" className="text-sm">Set as default address</label>
                </div>
                <div className="col-span-2 flex gap-3">
                  <button type="button" onClick={() => { setShowForm(false); reset(); }} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={isSubmitting || createMutation.isPending} className="btn-primary">
                    {createMutation.isPending ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-32 rounded" />)
            ) : addresses.length === 0 ? (
              <div className="bg-white p-12 text-center text-gray-400">
                <p className="text-sm">No saved addresses. Add one above.</p>
              </div>
            ) : (
              addresses.map((addr: { _id: string; fullName: string; address: string; city: string; region: string; phone: string; isDefault: boolean }) => (
                <div key={addr._id} className={`bg-white p-5 flex items-start justify-between ${addr.isDefault ? 'border-l-4 border-gold-DEFAULT' : ''}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{addr.fullName}</p>
                      {addr.isDefault && <span className="badge-gold text-[10px]">DEFAULT</span>}
                    </div>
                    <p className="text-sm text-gray-600">{addr.address}</p>
                    <p className="text-sm text-gray-600">{addr.city}, {addr.region}</p>
                    <p className="text-sm text-gray-400">{addr.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    {!addr.isDefault && (
                      <button onClick={() => setDefaultMutation.mutate(addr._id)} className="text-xs text-gray-400 hover:text-black flex items-center gap-1 transition-colors">
                        <FiCheck size={12} />Set Default
                      </button>
                    )}
                    <button onClick={() => deleteMutation.mutate(addr._id)} className="p-2 text-gray-300 hover:text-red-400 transition-colors">
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AddressesPage;
