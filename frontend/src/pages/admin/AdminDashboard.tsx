import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  FiDollarSign, FiShoppingBag, FiUsers, FiAlertTriangle,
  FiArrowRight, FiTrendingUp, FiPackage,
} from 'react-icons/fi';
import PaymentSettingsModal from '../../components/admin/PaymentSettingsModal';
import SMSSettingsModal from '../../components/admin/SMSSettingsModal';
import { FiCreditCard, FiMessageSquare } from 'react-icons/fi';
import { formatCurrency, formatDate, getOrderStatusLabel } from '../../utils/helpers';
import type { AnalyticsOverview, SalesDataPoint, Order } from '../../types';

const StatCard: React.FC<{
  title: string;
  value: string;
  change?: string;
  Icon: React.ElementType;
  color: string;
  index: number;
}> = ({ title, value, change, Icon, color, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="stat-card"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-sans text-gray-500 tracking-wider uppercase mb-1">{title}</p>
        <p className="text-2xl font-display font-bold text-black">{value}</p>
        {change && <p className="text-xs text-green-500 font-sans mt-1">{change}</p>}
      </div>
      <div className={`w-12 h-12 ${color} flex items-center justify-center`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
  </motion.div>
);

const SkeletonCard = () => (
  <div className="stat-card space-y-3">
    <div className="skeleton h-4 w-24 rounded" />
    <div className="skeleton h-8 w-32 rounded" />
  </div>
);

const AdminDashboard: React.FC = () => {
  const { data: overview, isLoading: overviewLoading } = useQuery<AnalyticsOverview>({
    queryKey: ['admin-analytics-overview'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/overview');
      return res.data.data;
    },
    refetchInterval: 60000,
  });

  const { data: salesChart = [] } = useQuery<SalesDataPoint[]>({
    queryKey: ['admin-sales-chart'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/sales-chart?days=30');
      return res.data.data;
    },
  });

  const { data: topProducts = [] } = useQuery({
    queryKey: ['admin-top-products'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/top-products');
      return res.data.data;
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async () => {
      const res = await api.get('/orders?limit=5');
      return res.data.data;
    },
  });

  const stats = [
    {
      title: 'Total Revenue',
      value: overview ? formatCurrency(overview.revenue.total) : '—',
      change: overview ? `+${formatCurrency(overview.revenue.today)} today` : undefined,
      Icon: FiDollarSign,
      color: 'bg-black',
    },
    {
      title: 'Total Orders',
      value: overview ? String(overview.orders.total) : '—',
      change: overview ? `${overview.orders.pending} pending` : undefined,
      Icon: FiShoppingBag,
      color: 'bg-gold-DEFAULT',
    },
    {
      title: 'Customers',
      value: overview ? String(overview.customers.total) : '—',
      change: overview ? `+${overview.customers.newThisMonth} this month` : undefined,
      Icon: FiUsers,
      color: 'bg-blue-600',
    },
    {
      title: 'Low Stock Alerts',
      value: overview ? String(overview.products.lowStock) : '—',
      Icon: FiAlertTriangle,
      color: 'bg-red-500',
    },
  ];

  const statusColors: Record<string, string> = {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    packed: 'status-packed',
    shipped: 'status-shipped',
    out_for_delivery: 'status-out_for_delivery',
    delivered: 'status-delivered',
    cancelled: 'status-cancelled',
  };

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSMSModalOpen, setIsSMSModalOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>Dashboard | JJ Vintage Admin</title>
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 font-sans mt-1">Welcome back! Here's what's happening today.</p>
          </div>
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

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : stats.map((stat, i) => <StatCard key={stat.title} {...stat} index={i} />)}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <div className="lg:col-span-2 bg-white border border-gray-100 p-6 rounded-sm shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-sans font-semibold text-gray-900 flex items-center gap-2">
                <FiTrendingUp className="text-gold-DEFAULT" />
                Revenue — Last 30 Days
              </h2>
            </div>
            {salesChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={salesChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} tickFormatter={(v) => `GHS ${(v / 1000).toFixed(1)}k`} />
                  <Tooltip formatter={(v: any) => [formatCurrency(Number(v || 0)), 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#C9A227" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
                <div className="skeleton w-full h-full rounded" />
              </div>
            )}
          </div>

          {/* Top Products */}
          <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm">
            <h2 className="font-sans font-semibold text-gray-900 flex items-center gap-2 mb-6">
              <FiPackage className="text-gold-DEFAULT" />
              Top Products
            </h2>
            <div className="space-y-4">
              {topProducts.slice(0, 5).map((product: { _id: string; name: string; soldCount: number; price: number; images: { url: string }[] }, i: number) => (
                <div key={product._id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4 font-mono">{i + 1}</span>
                  <img
                    src={product.images[0]?.url || '/placeholder.jpg'}
                    alt={product.name}
                    className="w-10 h-10 object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.soldCount} sold</p>
                  </div>
                  <span className="text-xs font-semibold text-black">{formatCurrency(product.price)}</span>
                </div>
              ))}
              {topProducts.length === 0 && (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="skeleton w-10 h-10 rounded" />
                      <div className="flex-1 space-y-1.5">
                        <div className="skeleton h-3 w-3/4 rounded" />
                        <div className="skeleton h-2 w-1/2 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white border border-gray-100 rounded-sm shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-50">
            <h2 className="font-sans font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-gold-DEFAULT font-sans tracking-wider uppercase hover:underline flex items-center gap-1">
              View All <FiArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left text-xs font-sans font-medium text-gray-500 tracking-wider px-6 py-3 uppercase">Order</th>
                  <th className="text-left text-xs font-sans font-medium text-gray-500 tracking-wider px-6 py-3 uppercase">Customer</th>
                  <th className="text-left text-xs font-sans font-medium text-gray-500 tracking-wider px-6 py-3 uppercase">Total</th>
                  <th className="text-left text-xs font-sans font-medium text-gray-500 tracking-wider px-6 py-3 uppercase">Status</th>
                  <th className="text-left text-xs font-sans font-medium text-gray-500 tracking-wider px-6 py-3 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders?.map((order: Order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/admin/orders/${order._id}`} className="text-sm font-medium text-black hover:text-gold-DEFAULT transition-colors">
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {typeof order.user === 'object' ? order.user?.name : order.shippingAddress?.fullName || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-black">{formatCurrency(order.total)}</td>
                    <td className="px-6 py-4">
                      <span className={statusColors[order.orderStatus] || 'badge bg-gray-100 text-gray-600'}>
                        {getOrderStatusLabel(order.orderStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!recentOrders && (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton h-12 w-full rounded" />
                ))}
              </div>
            )}
          </div>
        </div>

        <PaymentSettingsModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} />
        <SMSSettingsModal isOpen={isSMSModalOpen} onClose={() => setIsSMSModalOpen(false)} />
      </div>
    </>
  );
};

export default AdminDashboard;
