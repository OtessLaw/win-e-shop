import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiCheck, FiShoppingBag, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { orderService } from '../../services/orderService';
import { formatCurrency } from '../../utils/helpers';

const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const [isVerifying, setIsVerifying] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (reference && orderId && !isVerifying) {
      setIsVerifying(true);
      toast.loading('Verifying Paystack live payment...', { id: 'verify-redirect' });
      orderService.verifyPayment(reference, orderId)
        .then(() => {
          toast.success('Payment verified successfully!', { id: 'verify-redirect' });
          queryClient.invalidateQueries({ queryKey: ['order-confirmation', orderId] });
        })
        .catch(() => {
          toast.dismiss('verify-redirect');
        });
    }
  }, [reference, orderId, isVerifying, queryClient]);

  const { data: order } = useQuery({
    queryKey: ['order-confirmation', orderId],
    queryFn: () => orderService.getOrder(orderId!),
    enabled: !!orderId,
  });

  return (
    <>
      <Helmet><title>Order Confirmed! | JJ Vintage Collection</title></Helmet>

      <div className="container-brand py-20 max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 bg-black text-gold-DEFAULT rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <FiCheck size={40} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="font-display font-bold text-4xl mb-3">Order Confirmed!</h1>
          <p className="text-gray-500 font-sans text-lg mb-2">Thank you for your purchase</p>
          {order && (
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="text-sm text-gray-400">Order Number:</span>
              <span className="font-mono font-bold text-black text-lg">#{order.orderNumber}</span>
            </div>
          )}

          {order && (
            <div className="bg-gray-50 p-6 text-left mb-8 space-y-4">
              <h3 className="font-sans font-semibold text-sm tracking-wider uppercase">Order Items</h3>
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <img src={item.image} alt={item.name} className="w-14 h-14 object-cover flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.color} · {item.size} · ×{item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-3 flex justify-between font-bold">
                <span>Total Paid</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500 mb-8">
            A confirmation email has been sent. We'll notify you when your order ships.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/account/orders" className="btn-secondary gap-2">
              <FiMapPin size={16} />Track Order
            </Link>
            <Link to="/shop" className="btn-primary gap-2">
              <FiShoppingBag size={16} />Continue Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default OrderConfirmationPage;
