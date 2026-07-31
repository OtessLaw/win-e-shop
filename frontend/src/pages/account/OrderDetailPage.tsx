import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import { orderService } from '../../services/orderService';
import { formatCurrency, formatDate, getOrderStatusLabel, getPaymentMethodLabel } from '../../utils/helpers';
import type { OrderStatus } from '../../types';

const STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: order, isLoading } = useQuery({
    queryKey: ['my-order', id],
    queryFn: () => orderService.getOrder(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="container-brand py-20"><div className="skeleton h-96 rounded" /></div>;
  if (!order) return <div className="container-brand py-20 text-center text-gray-400">Order not found</div>;

  const currentStep = STATUS_STEPS.indexOf(order.orderStatus as OrderStatus);

  return (
    <>
      <Helmet><title>{`Order #${order.orderNumber} | JJ Vintage Collection`}</title></Helmet>

      <div className="bg-gray-50 min-h-screen py-10">
        <div className="container-brand max-w-3xl">
          <Link to="/account/orders" className="flex items-center gap-2 text-sm text-gray-400 hover:text-black transition-colors mb-8">
            <FiArrowLeft size={16} /> Back to Orders
          </Link>

          <div className="bg-white p-6 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <h1 className="font-display font-bold text-2xl">Order #{order.orderNumber}</h1>
              <span className={`badge ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {order.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
              </span>
            </div>
            <p className="text-sm text-gray-400">Placed on {formatDate(order.createdAt)}</p>
          </div>

          {/* Tracking Timeline */}
          {order.orderStatus !== 'cancelled' && (
            <div className="bg-white p-6 mb-6">
              <h2 className="font-sans font-semibold mb-6">Order Tracking</h2>
              <div className="relative flex items-center justify-between">
                <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200" />
                <div className="absolute left-0 top-4 h-0.5 bg-gold-DEFAULT transition-all" style={{ width: `${Math.max(0, currentStep / (STATUS_STEPS.length - 1)) * 100}%` }} />
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
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Shipping */}
            <div className="bg-white p-5">
              <h3 className="font-sans font-semibold text-sm tracking-wider uppercase mb-3 text-gray-400">Delivery Address</h3>
              <p className="font-medium">{order.shippingAddress.fullName}</p>
              <p className="text-sm text-gray-600">{order.shippingAddress.address}</p>
              <p className="text-sm text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.region}</p>
              <p className="text-sm text-gray-600">{order.shippingAddress.phone}</p>
            </div>
            {/* Payment */}
            <div className="bg-white p-5">
              <h3 className="font-sans font-semibold text-sm tracking-wider uppercase mb-3 text-gray-400">Payment</h3>
              <p className="text-sm font-medium">{getPaymentMethodLabel(order.paymentMethod)}</p>
              {order.paystackReference && (
                <p className="text-xs text-gray-400 mt-1 font-mono">Ref: {order.paystackReference}</p>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white p-6 mb-6">
            <h3 className="font-sans font-semibold mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <img src={item.image || '/placeholder.jpg'} alt={item.name} className="w-16 h-16 object-cover flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.color} · Size {item.size} · ×{item.quantity}</p>
                  </div>
                  <p className="font-semibold text-sm">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Delivery</span><span>{formatCurrency(order.deliveryFee)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(order.discount)}</span></div>}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetailPage;
