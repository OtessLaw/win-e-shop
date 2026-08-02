import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { formatCurrency, formatDate, getOrderStatusLabel } from '../../utils/helpers';
import type { Order } from '../../types';
import PaymentSettingsModal from '../../components/admin/PaymentSettingsModal';
import SMSSettingsModal from '../../components/admin/SMSSettingsModal';
import { FiSearch, FiEye, FiCreditCard, FiMessageSquare } from 'react-icons/fi';

const statusOptions = ['all', 'pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

const AdminOrders: React.FC = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSMSModalOpen, setIsSMSModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, status, search],
    queryFn: () => orderService.getAllOrders({ page, limit: 20, ...(status && { status }), ...(search && { search }) }),
  });

  const statusColors: Record<string, string> = {
    pending: 'status-pending', confirmed: 'status-confirmed', packed: 'status-packed',
    shipped: 'status-shipped', out_for_delivery: 'status-out_for_delivery',
    delivered: 'status-delivered', cancelled: 'status-cancelled', refunded: 'status-refunded',
  };

  return (
    <>
      <Helmet><title>Orders | JJ Vintage Admin</title></Helmet>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-bold">Orders</h1>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="bg-black hover:bg-gray-900 border border-gold-500/40 text-gold-400 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded flex items-center gap-2 transition-all shadow-sm"
            >
              <FiCreditCard size={15} /> Paystack API Keys
            </button>
            <button
              onClick={() => setIsSMSModalOpen(true)}
              className="bg-black hover:bg-gray-900 border border-gray-800 text-gray-300 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded flex items-center gap-2 transition-all shadow-sm"
            >
              <FiMessageSquare size={15} /> SMS Settings
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-100 p-4 rounded-sm flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by order number..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="input-field w-48"
          >
            <option value="">All Statuses</option>
            {statusOptions.filter(s => s !== 'all').map((s) => (
              <option key={s} value={s}>{getOrderStatusLabel(s)}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Order', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', ''].map((h) => (
                    <th key={h} className="text-left text-xs font-sans font-medium text-gray-500 tracking-wider px-6 py-3 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-6 py-4"><div className="skeleton h-4 w-20 rounded" /></td>
                      ))}
                    </tr>
                  ))
                  : data?.data?.map((order: Order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-black">#{order.orderNumber}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {typeof order.user === 'object' ? order.user?.name : (order.shippingAddress?.fullName || '—')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.items.length} item{order.items.length > 1 ? 's' : ''}</td>
                      <td className="px-6 py-4 text-sm font-semibold">{formatCurrency(order.total)}</td>
                      <td className="px-6 py-4">
                        <span className={`badge ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : order.paymentStatus === 'failed' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={statusColors[order.orderStatus] || 'badge bg-gray-100 text-gray-600'}>
                          {getOrderStatusLabel(order.orderStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4">
                        <Link to={`/admin/orders/${order._id}`} className="p-2 text-gray-400 hover:text-black transition-colors inline-flex">
                          <FiEye size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!isLoading && data?.data?.length === 0 && (
              <div className="py-16 text-center text-gray-400 text-sm">No orders found.</div>
            )}
          </div>

          {data?.pagination && data.pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
              <p className="text-sm text-gray-500">{data.pagination.total} orders total</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!data.pagination.hasPrevPage} className="px-4 py-2 text-xs border border-gray-200 disabled:opacity-40 hover:border-black transition-colors">Previous</button>
                <span className="px-4 py-2 text-xs bg-black text-white">{page}</span>
                <button onClick={() => setPage((p) => p + 1)} disabled={!data.pagination.hasNextPage} className="px-4 py-2 text-xs border border-gray-200 disabled:opacity-40 hover:border-black transition-colors">Next</button>
              </div>
            </div>
          )}
        </div>

        <PaymentSettingsModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} />
        <SMSSettingsModal isOpen={isSMSModalOpen} onClose={() => setIsSMSModalOpen(false)} />
      </div>
    </>
  );
};

export default AdminOrders;
