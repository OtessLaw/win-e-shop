import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { FiPackage, FiChevronRight } from 'react-icons/fi';
import { orderService } from '../../services/orderService';
import { formatCurrency, formatDate, getOrderStatusLabel } from '../../utils/helpers';
import type { Order } from '../../types';

const statusColors: Record<string, string> = {
  pending: 'status-pending', confirmed: 'status-confirmed', packed: 'status-packed',
  shipped: 'status-shipped', out_for_delivery: 'status-out_for_delivery',
  delivered: 'status-delivered', cancelled: 'status-cancelled',
};

const OrdersPage: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', page],
    queryFn: () => orderService.getMyOrders(page),
  });

  return (
    <>
      <Helmet><title>My Orders | JJ Vintage Collection</title></Helmet>

      <div className="bg-gray-50 min-h-screen">
        <div className="bg-black text-white py-14">
          <div className="container-brand">
            <p className="text-gold-DEFAULT text-xs tracking-widest uppercase mb-2">Account</p>
            <h1 className="font-display font-bold text-3xl">My Orders</h1>
          </div>
        </div>

        <div className="container-brand py-10 max-w-3xl">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-24 rounded" />)}
            </div>
          ) : data?.data.length === 0 ? (
            <div className="text-center py-24">
              <FiPackage size={56} className="mx-auto text-gray-200 mb-6" />
              <h2 className="font-display text-2xl font-bold mb-2">No orders yet</h2>
              <p className="text-gray-400 text-sm mb-8">You haven't placed any orders yet.</p>
              <Link to="/shop" className="btn-primary">Start Shopping</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.data.map((order: Order) => (
                <Link key={order._id} to={`/account/orders/${order._id}`} className="bg-white p-5 flex items-center gap-4 hover:shadow-md transition-shadow group">
                  <div className="w-14 h-14 bg-gray-50 flex-shrink-0 overflow-hidden">
                    {order.items[0] && <img src={order.items[0].image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-mono font-bold text-sm">#{order.orderNumber}</span>
                      <span className={statusColors[order.orderStatus] || 'badge bg-gray-100'}>{getOrderStatusLabel(order.orderStatus)}</span>
                    </div>
                    <p className="text-xs text-gray-400">{order.items.length} item{order.items.length > 1 ? 's' : ''} · {formatDate(order.createdAt)}</p>
                    {order.items.length > 1 && (
                      <p className="text-xs text-gray-400 truncate">{order.items.map(i => i.name).join(', ')}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm mb-1">{formatCurrency(order.total)}</p>
                    <FiChevronRight className="ml-auto text-gray-300 group-hover:text-black transition-colors" size={16} />
                  </div>
                </Link>
              ))}

              {data?.pagination && data.pagination.pages > 1 && (
                <div className="flex gap-2 justify-center pt-4">
                  <button disabled={!data.pagination.hasPrevPage} onClick={() => setPage(p => p - 1)} className="px-6 py-2 border text-sm disabled:opacity-30 hover:border-black transition-colors">Previous</button>
                  <button disabled={!data.pagination.hasNextPage} onClick={() => setPage(p => p + 1)} className="px-6 py-2 border text-sm disabled:opacity-30 hover:border-black transition-colors">Next</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrdersPage;
