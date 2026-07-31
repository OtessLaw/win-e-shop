import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiSearch, FiSlash, FiCheckCircle } from 'react-icons/fi';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'customer', label: 'Customer', desc: 'Can browse & buy products' },
  { value: 'product_manager', label: 'Product Manager', desc: 'Can add & manage products' },
  { value: 'order_manager', label: 'Order Manager', desc: 'Can fulfill & update orders' },
  { value: 'admin', label: 'Admin', desc: 'Full admin access' },
  { value: 'super_admin', label: 'Super Admin', desc: 'Owner / Full system access' },
];

const AdminCustomers: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', search, page],
    queryFn: async () => {
      const res = await api.get('/admin/customers', { params: { search, page, limit: 20 } });
      return res.data;
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, suspend }: { id: string; suspend: boolean }) =>
      api.patch(`/admin/customers/${id}/suspend`, { suspend }),
    onSuccess: () => {
      toast.success('Customer status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/admin/customers/${id}/role`, { role }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'User role updated successfully! ✨');
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update role');
    },
  });

  return (
    <>
      <Helmet><title>Customers & Roles | JJ Vintage Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Users & Role Permissions</h1>
            <p className="text-xs text-gold-500 font-mono">Assign roles (Customer, Product Manager, Admin, Super Admin) to your staff and users.</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-black border border-gold-500/20 p-4 rounded-sm flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search user by name or email..."
              className="input-field pl-10 bg-gray-900 border-gray-800 text-white placeholder-gray-500 focus:border-gold-500"
            />
          </div>
        </div>

        {/* User Table */}
        <div className="bg-black border border-gold-500/20 rounded-sm shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-900 border-b border-gray-800">
                <tr>
                  {['User', 'Email', 'Assigned Role', 'Account Status', 'Joined Date', 'Actions'].map((h) => (
                    <th key={h} className="text-xs font-mono font-bold text-gold-500 tracking-wider px-6 py-4 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-4"><div className="skeleton h-4 w-24 rounded bg-gray-800" /></td>
                      ))}
                    </tr>
                  ))
                ) : (
                  data?.data?.map((customer: { _id: string; name: string; email: string; role: string; isSuspended: boolean; createdAt: string }) => (
                    <tr key={customer._id} className="hover:bg-gray-900/50 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gold-500 text-black rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                            {customer.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-white block">{customer.name}</span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-xs font-mono text-gray-300">
                        {customer.email}
                      </td>

                      {/* Role Dropdown */}
                      <td className="px-6 py-4">
                        <select
                          value={customer.role || 'customer'}
                          onChange={(e) => roleMutation.mutate({ id: customer._id, role: e.target.value })}
                          disabled={roleMutation.isPending}
                          className="bg-gray-900 border border-gold-500/40 text-gold-400 text-xs font-mono font-bold px-3 py-1.5 rounded focus:outline-none focus:border-gold-500 cursor-pointer"
                        >
                          {ROLES.map((r) => (
                            <option key={r.value} value={r.value} className="bg-black text-white">
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {customer.isSuspended ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-red-950 border border-red-800 text-red-400 px-2.5 py-1 rounded-full uppercase">
                            <FiSlash size={12} /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-gold-500/10 border border-gold-500/30 text-gold-400 px-2.5 py-1 rounded-full uppercase">
                            <FiCheckCircle size={12} /> Active User
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 text-xs font-mono text-gray-400">
                        {formatDate(customer.createdAt)}
                      </td>

                      {/* Suspend Action */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => suspendMutation.mutate({ id: customer._id, suspend: !customer.isSuspended })}
                          className={`text-xs font-mono px-3 py-1.5 rounded transition-colors ${
                            customer.isSuspended
                              ? 'bg-gold-500 hover:bg-gold-400 text-black font-bold'
                              : 'bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-400'
                          }`}
                        >
                          {customer.isSuspended ? 'Unsuspend' : 'Suspend Account'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminCustomers;
