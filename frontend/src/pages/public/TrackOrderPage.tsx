import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { FiSearch, FiCheck } from 'react-icons/fi';
import { orderService } from '../../services/orderService';
import { formatCurrency, formatDate, getOrderStatusLabel } from '../../utils/helpers';
import type { OrderStatus } from '../../types';

const STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

const TrackOrderPage: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [searchId, setSearchId] = useState('');

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['track-order', searchId],
    queryFn: () => orderService.getOrder(searchId),
    enabled: !!searchId,
    retry: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumber.trim()) {
      setSearchId(orderNumber.trim().replace(/^#/, ''));
    }
  };

  const currentStep = order ? STATUS_STEPS.indexOf(order.orderStatus as OrderStatus) : -1;

  return (
    <>
      <Helmet>
        <title>Track Order | JJ Vintage Collection</title>
        <meta name="description" content="Track your order status live with JJ Vintage Collection." />
      </Helmet>

      <div className="bg-black text-white py-16 text-center">
        <p className="text-gold-DEFAULT text-xs tracking-widest uppercase font-sans mb-2">Live Tracking</p>
        <h1 className="font-display font-bold text-4xl">Track Your Order</h1>
      </div>

      <div className="container-brand py-16 max-w-3xl">
        <form onSubmit={handleSearch} className="bg-white p-6 shadow-sm border border-gray-100 mb-10">
          <label className="input-label mb-2">Order Number</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. JJV-1001 or 64f..."
                className="input-field uppercase font-mono"
                required
              />
            </div>
            <button type="submit" className="btn-primary gap-2">
              <FiSearch size={16} /> Track
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">You can find your order number in your order confirmation email or account orders page.</p>
        </form>

        {isLoading && (
          <div className="space-y-4">
            <div className="skeleton h-32 w-full rounded" />
            <div className="skeleton h-64 w-full rounded" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 text-center">
            <p className="font-semibold text-lg mb-1">Order Not Found</p>
            <p className="text-sm">We couldn't find an order matching "{searchId}". Please check the number and try again.</p>
          </div>
        )}

        {order && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-100 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <h2 className="font-display font-bold text-2xl">Order #{order.orderNumber}</h2>
                <span className="badge bg-gold-DEFAULT text-black uppercase tracking-wider">{getOrderStatusLabel(order.orderStatus)}</span>
              </div>
              <p className="text-sm text-gray-400">Placed on {formatDate(order.createdAt)}</p>
            </div>

            {/* Timeline */}
            {order.orderStatus !== 'cancelled' ? (
              <div className="bg-white border border-gray-100 p-6">
                <h3 className="font-sans font-semibold mb-6">Delivery Progress</h3>
                <div className="relative flex items-center justify-between">
                  <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200" />
                  <div className="absolute left-0 top-4 h-0.5 bg-gold-DEFAULT transition-all duration-500" style={{ width: `${Math.max(0, currentStep / (STATUS_STEPS.length - 1)) * 100}%` }} />
                  {STATUS_STEPS.map((step, i) => {
                    const done = i <= currentStep;
                    return (
                      <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${done ? 'bg-gold-DEFAULT text-black' : 'bg-white border-2 border-gray-200 text-gray-400'}`}>
                          {done ? <FiCheck size={14} /> : <span className="text-xs">{i + 1}</span>}
                        </div>
                        <span className="text-[9px] text-center uppercase tracking-wider text-gray-500 max-w-14 leading-tight">
                          {getOrderStatusLabel(step)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 p-6 text-red-700">
                This order was cancelled.
              </div>
            )}

            {/* Items */}
            <div className="bg-white border border-gray-100 p-6 space-y-4">
              <h3 className="font-sans font-semibold">Items in Order</h3>
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-4 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                  <img src={item.image || '/placeholder.jpg'} alt={item.name} className="w-14 h-14 object-cover flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.color} · Size {item.size} · Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-sm">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TrackOrderPage;
