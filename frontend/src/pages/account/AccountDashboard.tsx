import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiPackage, FiHeart, FiMapPin, FiUser, FiBell, FiLock, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { orderService } from '../../services/orderService';
import { formatCurrency, formatDate, getOrderStatusLabel } from '../../utils/helpers';
import type { Order } from '../../types';

const AccountDashboard: React.FC = () => {
  const { user } = useAuth();
  const { wishlist } = useWishlist();

  const { data: orders } = useQuery({
    queryKey: ['my-orders', 1],
    queryFn: () => orderService.getMyOrders(1),
  });

  const quickLinks = [
    { label: 'My Orders', path: '/account/orders', Icon: FiPackage, desc: 'Track and manage orders' },
    { label: 'Wishlist', path: '/wishlist', Icon: FiHeart, desc: `${wishlist.length} saved items` },
    { label: 'Addresses', path: '/account/addresses', Icon: FiMapPin, desc: 'Manage delivery addresses' },
    { label: 'Profile', path: '/account/profile', Icon: FiUser, desc: 'Edit your profile' },
    { label: 'Notifications', path: '/account/notifications', Icon: FiBell, desc: 'Your notifications' },
    { label: 'Security', path: '/account/security', Icon: FiLock, desc: 'Password & security' },
  ];

  const statusColors: Record<string, string> = {
    pending: 'status-pending', confirmed: 'status-confirmed', packed: 'status-packed',
    shipped: 'status-shipped', out_for_delivery: 'status-out_for_delivery',
    delivered: 'status-delivered', cancelled: 'status-cancelled',
  };

  return (
    <>
      <Helmet><title>My Account | JJ Vintage Collection</title></Helmet>

      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-black text-white py-16">
          <div className="container-brand">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-gold-DEFAULT text-xs tracking-widest uppercase font-sans mb-2">Welcome back</p>
              <h1 className="font-display font-bold text-3xl">{user?.name}</h1>
              <p className="text-gray-400 font-sans text-sm mt-1">{user?.email}</p>
            </motion.div>
          </div>
        </div>

        <div className="container-brand py-10">
          {/* Quick Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {quickLinks.map(({ label, path, Icon, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={path} className="bg-white p-5 block hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-gray-100 group-hover:bg-black group-hover:text-gold-DEFAULT transition-all flex items-center justify-center">
                      <Icon size={18} />
                    </div>
                    <FiChevronRight size={16} className="text-gray-300 group-hover:text-black transition-colors" />
                  </div>
                  <h3 className="font-sans font-semibold text-sm mb-1 group-hover:text-gold-DEFAULT transition-colors">{label}</h3>
                  <p className="text-xs text-gray-400">{desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Recent Orders */}
          <div className="bg-white">
            <div className="flex items-center justify-between p-6 border-b border-gray-50">
              <h2 className="font-display font-bold text-xl">Recent Orders</h2>
              <Link to="/account/orders" className="text-xs text-gold-DEFAULT font-sans tracking-wider uppercase hover:underline">View All</Link>
            </div>
            {orders?.data.length === 0 ? (
              <div className="py-16 text-center">
                <FiPackage size={40} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 text-sm">No orders yet</p>
                <Link to="/shop" className="btn-primary mt-6 inline-flex">Start Shopping</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {orders?.data.slice(0, 5).map((order: Order) => (
                  <Link key={order._id} to={`/account/orders/${order._id}`} className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono font-bold text-sm">#{order.orderNumber}</span>
                        <span className={statusColors[order.orderStatus] || 'badge bg-gray-100'}>{getOrderStatusLabel(order.orderStatus)}</span>
                      </div>
                      <p className="text-xs text-gray-400">{order.items.length} item{order.items.length > 1 ? 's' : ''} · {formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatCurrency(order.total)}</p>
                      <FiChevronRight size={14} className="ml-auto text-gray-300" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountDashboard;
