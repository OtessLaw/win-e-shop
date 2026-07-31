import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCheck, FiMessageSquare, FiSend, FiPhoneCall } from 'react-icons/fi';
import { orderService } from '../../services/orderService';
import { formatCurrency, formatDate, getOrderStatusLabel } from '../../utils/helpers';
import LiveMapTracker from '../../components/admin/LiveMapTracker';
import type { Order, OrderStatus } from '../../types';

const STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

const AdminOrderDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['admin-order', id],
    queryFn: () => orderService.getOrder(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: () => orderService.updateStatus(id!, newStatus, statusNote),
    onSuccess: () => {
      toast.success('Order status updated!');
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      setStatusNote('');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => orderService.cancelOrder(id!, 'Admin cancelled'),
    onSuccess: () => {
      toast.success('Order cancelled');
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
    },
    onError: () => toast.error('Failed to cancel order'),
  });

  const sendSMSMutation = useMutation({
    mutationFn: () => orderService.sendDirectSMS(id!),
    onSuccess: (data: any) => {
      toast.success(data?.message || '📱 SMS dispatched to customer!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to dispatch SMS');
    },
  });

  if (isLoading) return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 rounded bg-gray-800" />)}
    </div>
  );

  if (!order) return <div className="text-center py-20 text-gray-400">Order not found</div>;

  const currentStepIndex = STATUS_STEPS.indexOf(order.orderStatus as OrderStatus);

  const cleanPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('0') ? `233${digits.slice(1)}` : digits;
  };

  const generateWhatsAppMessage = () => {
    const text = `Hello ${order.shippingAddress.fullName}! 👋 Thank you for your order #${order.orderNumber} with J&J Vintage Collection Ghana. Your order total is ${formatCurrency(order.total)}. Status: ${order.orderStatus.toUpperCase()}. Track live: https://win-e-shop.onrender.com/track-order`;
    return `https://wa.me/${cleanPhone(order.shippingAddress.phone)}?text=${encodeURIComponent(text)}`;
  };

  const handleSendDirectSMS = () => {
    sendSMSMutation.mutate();
  };

  return (
    <>
      <Helmet><title>{`Order #${order.orderNumber} | JJ Vintage Admin`}</title></Helmet>
      <div className="space-y-6 text-white font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin/orders')} className="p-2 text-gray-400 hover:text-gold-500 transition-colors">
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Order #{order.orderNumber}</h1>
              <p className="text-xs text-gold-500 font-mono">Placed on {formatDate(order.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* 1-Click Customer SMS & WhatsApp Notification Panel */}
        <div className="bg-black border border-gold-500/30 p-5 rounded-sm shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-gold-500 text-sm flex items-center gap-2">
              <FiMessageSquare size={16} /> Instant Customer SMS & WhatsApp Notification Trigger
            </h3>
            <span className="text-[10px] font-mono bg-gold-500/10 text-gold-400 border border-gold-500/30 px-2.5 py-0.5 rounded">
              Customer: {order.shippingAddress.phone}
            </span>
          </div>

          <div className="flex gap-3 flex-wrap">
            <a
              href={generateWhatsAppMessage()}
              target="_blank"
              rel="noreferrer"
              className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs px-4 py-2.5 rounded-sm flex items-center gap-2 transition-colors shadow-md"
            >
              <FiSend size={14} /> Send 1-Click WhatsApp Receipt
            </a>

            <button
              onClick={handleSendDirectSMS}
              disabled={sendSMSMutation.isPending}
              className="bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-bold text-xs px-4 py-2.5 rounded-sm flex items-center gap-2 transition-colors shadow-md"
            >
              <FiPhoneCall size={14} /> {sendSMSMutation.isPending ? 'Sending SMS...' : 'Resend Direct Phone SMS Receipt'}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {(order.orderStatus as string) !== 'cancelled' && (
          <div className="bg-black border border-gold-500/20 rounded-sm p-6">
            <h2 className="font-sans font-bold text-gold-500 text-xs uppercase tracking-wider mb-6">Order Delivery Status Progress</h2>
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-900 z-0" />
              <div
                className="absolute left-0 top-4 h-0.5 bg-gold-500 z-0 transition-all duration-500"
                style={{ width: `${Math.max(0, currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
              />
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStepIndex;
                return (
                  <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${done ? 'bg-gold-500 text-black font-bold' : 'bg-gray-900 border-2 border-gray-800 text-gray-500'}`}>
                      {done ? <FiCheck size={14} /> : <span className="text-xs font-mono">{i + 1}</span>}
                    </div>
                    <span className="text-[10px] text-center font-mono tracking-wider uppercase text-gray-400 max-w-16 leading-tight">
                      {getOrderStatusLabel(step)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Items */}
            <div className="bg-black border border-gold-500/20 rounded-sm p-6">
              <h2 className="font-sans font-bold text-gold-500 text-xs uppercase tracking-wider mb-4">Ordered Products</h2>
              <div className="space-y-4">
                {order.items.map((item, i) => (
                  <div key={i} className="flex gap-4 pb-4 border-b border-gray-900 last:border-0 last:pb-0">
                    <img src={item.image || 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800'} alt={item.name} className="w-16 h-16 object-cover flex-shrink-0 rounded" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-white">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.color} / Size: {item.size}</p>
                      <p className="text-xs text-gold-500 mt-1 font-mono">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-white">{formatCurrency(item.subtotal)}</p>
                      <p className="text-xs text-gray-400 font-mono">{formatCurrency(item.price)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address & Live Google Map Pin */}
            <div className="bg-black border border-gold-500/20 rounded-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-sans font-bold text-gold-500 text-xs uppercase tracking-wider">Customer Shipping & Live Map Location</h2>
                {order.shippingAddress.latitude && order.shippingAddress.longitude && (
                  <span className="bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-mono px-2 py-0.5 rounded">
                    GPS Coordinates Captured ✓
                  </span>
                )}
              </div>

              <div className="text-xs font-mono text-gray-300 space-y-1.5">
                <p className="font-bold text-white text-sm">{order.shippingAddress.fullName}</p>
                <p>Street: {order.shippingAddress.address}</p>
                <p>Location: {order.shippingAddress.city}, {order.shippingAddress.region} Region</p>
                <p className="text-gold-400 font-bold">Phone: {order.shippingAddress.phone}</p>
                <p>Email: {order.shippingAddress.email}</p>
                {order.shippingAddress.gpsAddress && <p className="text-gray-400">Ghana Digital Address: {order.shippingAddress.gpsAddress}</p>}
              </div>

              {/* Uber-Style Live Map Tracker Component */}
              <LiveMapTracker
                orderId={order._id}
                initialCustomerLat={order.shippingAddress.latitude || 5.6037}
                initialCustomerLng={order.shippingAddress.longitude || -0.1870}
                customerName={order.shippingAddress.fullName}
              />
            </div>
          </div>

          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-black border border-gold-500/20 rounded-sm p-6">
              <h2 className="font-sans font-bold text-gold-500 text-xs uppercase tracking-wider mb-4">Price Breakdown</h2>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
                <div className="flex justify-between text-gray-400"><span>Delivery Fee</span><span>{formatCurrency(order.deliveryFee)}</span></div>
                {order.discount > 0 && <div className="flex justify-between text-gold-400"><span>Discount Applied</span><span>-{formatCurrency(order.discount)}</span></div>}
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-gray-900 text-white">
                  <span>Total Paid / Due</span><span className="text-gold-500">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Update Status Form */}
            {(order.orderStatus as string) !== 'delivered' && (order.orderStatus as string) !== 'cancelled' && (
              <div className="bg-black border border-gold-500/20 rounded-sm p-6 space-y-3">
                <h2 className="font-sans font-bold text-gold-500 text-xs uppercase tracking-wider">Update Delivery Status</h2>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input-field bg-gray-900 border-gray-800 text-white text-xs font-mono">
                  <option value="">Select new status</option>
                  {['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'].map((s) => (
                    <option key={s} value={s}>{getOrderStatusLabel(s)}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="input-field bg-gray-900 border-gray-800 text-white text-xs"
                  placeholder="Status Note (Optional)"
                />
                <button
                  onClick={() => updateStatusMutation.mutate()}
                  disabled={!newStatus || updateStatusMutation.isPending}
                  className="bg-gold-500 hover:bg-gold-400 text-black font-bold text-xs uppercase tracking-wider py-3 w-full rounded-sm transition-colors"
                >
                  {updateStatusMutation.isPending ? 'Updating...' : 'Update & Send Auto-SMS'}
                </button>

                <button
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="w-full py-2.5 text-xs font-mono text-red-400 border border-red-900 bg-red-950/40 hover:bg-red-950 transition-colors rounded-sm"
                >
                  Cancel Order
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminOrderDetail;
