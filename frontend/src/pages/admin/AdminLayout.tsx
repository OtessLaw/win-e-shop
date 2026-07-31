import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiPackage, FiShoppingBag, FiUsers, FiTag, FiImage,
  FiBarChart2, FiFileText, FiShield, FiChevronLeft, FiLogOut,
  FiExternalLink,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import ScrollToTop from '../../components/layout/ScrollToTop';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/admin', label: 'Dashboard', Icon: FiGrid, exact: true },
  { path: '/admin/products', label: 'Products', Icon: FiPackage },
  { path: '/admin/orders', label: 'Orders', Icon: FiShoppingBag },
  { path: '/admin/customers', label: 'Customers', Icon: FiUsers },
  { path: '/admin/coupons', label: 'Coupons', Icon: FiTag },
  { path: '/admin/banners', label: 'Banners', Icon: FiImage },
  { path: '/admin/analytics', label: 'Analytics', Icon: FiBarChart2 },
  { path: '/admin/content', label: 'Content', Icon: FiFileText },
  { path: '/admin/roles', label: 'Roles & Permissions', Icon: FiShield },
];

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.success('Logged out from admin panel');
  };

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-gray-950 text-white font-sans">
      <ScrollToTop />
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-full z-50 flex flex-col shadow-2xl bg-black border-r border-gold-500/20 text-white overflow-hidden"
      >
        {/* Logo */}
        <div className={`flex items-center border-b border-gold-500/20 ${collapsed ? 'justify-center p-4' : 'justify-between p-5'}`}>
          {!collapsed && (
            <div>
              <div className="font-display font-bold text-lg tracking-widest text-white">JJ VINTAGE</div>
              <div className="text-[9px] text-gold-500 tracking-widest font-mono uppercase">Luxury Admin Panel</div>
            </div>
          )}
          {collapsed && <div className="font-display font-bold text-gold-500 text-xl">JJ</div>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gold-500 transition-colors"
          >
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
              <FiChevronLeft size={18} />
            </motion.div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 space-y-1 overflow-y-auto scrollbar-hide px-2">
          {navItems.map(({ path, label, Icon, exact }) => {
            const active = isActive(path, exact);
            return (
              <Link
                key={path}
                to={path}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-sm transition-all duration-200 relative
                  ${active
                    ? 'text-black bg-gold-500 font-bold shadow-gold'
                    : 'text-gray-400 hover:text-gold-400 hover:bg-gold-500/10'
                  }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-sm font-sans tracking-wide whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Area */}
        <div className="border-t border-gold-500/20 p-3 space-y-2 bg-gray-950/80">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 text-xs text-gold-400 hover:text-gold-300 hover:bg-gold-500/10 rounded-sm transition-all"
          >
            <FiExternalLink size={16} />
            {!collapsed && <span>View Main Storefront</span>}
          </Link>

          <div className="flex items-center justify-between pt-2 border-t border-gray-900">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gold-500 text-black flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              {!collapsed && (
                <div className="truncate">
                  <div className="text-xs font-semibold truncate text-white">{user?.name || 'Super Admin'}</div>
                  <div className="text-[10px] text-gold-500/80 uppercase tracking-wider">{String(user?.role || 'Admin')}</div>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 p-1.5 transition-colors"
                title="Logout"
              >
                <FiLogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-200 ${collapsed ? 'ml-[72px]' : 'ml-[260px]'}`}>
        {/* Top Breadcrumb Bar */}
        <header className="h-16 bg-black border-b border-gold-500/20 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
            <span>Admin</span>
            <span>/</span>
            <span className="text-gold-500 capitalize">{location.pathname.replace('/admin', '').replace('/', '') || 'Dashboard'}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-mono rounded-full">
              <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
              Store Live & Online
            </span>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
