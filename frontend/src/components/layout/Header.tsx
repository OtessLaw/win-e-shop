import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiShoppingBag, FiHeart, FiUser, FiMenu, FiX, FiChevronDown,
  FiTruck, FiShield, FiLogOut, FiSettings, FiPackage, FiHome,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import toast from 'react-hot-toast';

const navLinks = [
  { label: 'Shop', path: '/shop' },
  {
    label: 'Men', path: '/shop?category=men', dropdown: [
      { label: 'All Men', path: '/shop?category=men' },
      { label: 'Shirts', path: '/shop?category=men&type=shirts' },
      { label: 'Trousers', path: '/shop?category=men&type=trousers' },
      { label: 'Suits', path: '/shop?category=men&type=suits' },
    ]
  },
  {
    label: 'Women', path: '/shop?category=women', dropdown: [
      { label: 'All Women', path: '/shop?category=women' },
      { label: 'Dresses', path: '/shop?category=women&type=dresses' },
      { label: 'Tops', path: '/shop?category=women&type=tops' },
    ]
  },
  { label: 'Shoes', path: '/shop?category=shoes' },
  { label: 'Accessories', path: '/shop?category=accessories' },
  { label: 'Track Order', path: '/track-order' },
  { label: '🔥 Sale', path: '/shop?sale=true', className: 'text-yellow-400 font-bold' },
];

const announcements = [
  '⚡ Free Express Delivery in Accra & Kumasi on Orders over GH₵ 500!',
  '✨ Luxury Ghana Vintage Fashion · 100% Authentic Guaranteed',
  '💳 Pay securely via MTN MoMo, Telecel Cash & Paystack',
];

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  // Close user menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 transition-all duration-300">
      {/* Gold Luxury Announcement Bar */}
      <div
        className="py-2.5 text-center text-xs tracking-wider flex items-center justify-center gap-2 overflow-hidden px-4"
        style={{ background: 'linear-gradient(90deg, #b8952a 0%, #f5d06e 40%, #d4a832 70%, #b8952a 100%)', color: '#000' }}
      >
        <FiTruck size={14} className="shrink-0 animate-bounce" style={{ color: '#000' }} />
        <AnimatePresence mode="wait">
          <motion.span
            key={announcementIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="truncate font-semibold tracking-widest"
            style={{ color: '#000' }}
          >
            {announcements[announcementIndex]}
          </motion.span>
        </AnimatePresence>
        <span
          className="hidden md:inline-flex items-center gap-1.5 ml-4 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-bold"
          style={{ background: 'rgba(0,0,0,0.18)', color: '#000', border: '1px solid rgba(0,0,0,0.25)' }}
        >
          <FiShield size={10} /> Express Ghana Shipping
        </span>
      </div>

      {/* Main Navigation Bar */}
      <div className={`bg-black/95 backdrop-blur-md border-b border-white/10 ${isScrolled ? 'shadow-xl' : ''}`}>
        <div className="container-brand flex items-center justify-between h-16 md:h-20 px-4 md:px-8">

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:text-yellow-400 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex flex-col items-center group">
            <span className="font-display font-bold text-xl md:text-2xl tracking-widest text-white group-hover:text-yellow-400 transition-colors">
              JJ VINTAGE
            </span>
            <span className="text-[9px] tracking-widest font-mono text-yellow-500 uppercase -mt-1">
              COLLECTION GHANA
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative group"
                onMouseEnter={() => setActiveDropdown(link.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  to={link.path}
                  className={`text-xs font-sans tracking-widest uppercase text-gray-300 hover:text-yellow-400 transition-colors flex items-center gap-1 py-2 ${link.className || ''}`}
                >
                  {link.label}
                  {link.dropdown && <FiChevronDown size={12} />}
                </Link>

                {link.dropdown && activeDropdown === link.label && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 w-48 bg-black border border-yellow-500/20 py-2 shadow-2xl z-50"
                  >
                    {link.dropdown.map((sub) => (
                      <Link
                        key={sub.label}
                        to={sub.path}
                        className="block px-4 py-2 text-xs text-gray-300 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all font-sans"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </nav>

          {/* Action Icons */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-gray-300 hover:text-yellow-400 transition-colors"
              aria-label="Search"
            >
              <FiSearch size={20} />
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="p-2 text-gray-300 hover:text-yellow-400 transition-colors relative"
              aria-label="Wishlist"
            >
              <FiHeart size={20} />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-400 text-black rounded-full text-[10px] font-bold flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="p-2 text-gray-300 hover:text-yellow-400 transition-colors relative"
              aria-label="Shopping Cart"
            >
              <FiShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-400 text-black rounded-full text-[10px] font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold text-xs hover:scale-105 transition-transform"
                  aria-label="User menu"
                >
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-black border border-yellow-500/30 shadow-2xl z-50 rounded-sm overflow-hidden"
                    >
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/60">
                        <p className="text-xs text-white font-bold truncate">{user.name}</p>
                        <p className="text-[10px] text-yellow-400 truncate font-mono mt-0.5">{user.email}</p>
                      </div>

                      {/* Menu Items */}
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                        >
                          <FiSettings size={13} /> Admin Dashboard
                        </Link>
                      )}
                      <Link
                        to="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs text-gray-300 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                      >
                        <FiUser size={13} /> My Account
                      </Link>
                      <Link
                        to="/account/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs text-gray-300 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                      >
                        <FiPackage size={13} /> My Orders
                      </Link>

                      <div className="border-t border-gray-800 mt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <FiLogOut size={13} /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="p-2 text-gray-300 hover:text-yellow-400 transition-colors"
                aria-label="Login"
              >
                <FiUser size={20} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Search Drawer */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/95 border-b border-yellow-500/20 py-4 px-6 shadow-2xl backdrop-blur-lg"
          >
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative flex items-center">
              <FiSearch className="absolute left-4 text-yellow-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search luxury vintage shirts, shoes, accessories..."
                autoFocus
                className="w-full bg-gray-900 border border-yellow-500/30 text-white pl-12 pr-10 py-3 rounded-full text-sm font-sans focus:outline-none focus:border-yellow-400 placeholder-gray-500"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-4 text-gray-400 hover:text-white"
              >
                <FiX size={20} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/70 z-40 lg:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 left-0 h-full w-4/5 max-w-sm bg-black z-50 lg:hidden flex flex-col overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                <div>
                  <p className="font-display font-bold text-lg tracking-widest text-white">JJ VINTAGE</p>
                  <p className="text-[9px] tracking-widest text-yellow-400 uppercase font-mono">COLLECTION GHANA</p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <FiX size={22} />
                </button>
              </div>

              {/* User section in mobile */}
              {user ? (
                <div className="px-5 py-4 border-b border-gray-800 bg-gray-900/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold text-sm">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm text-white font-semibold">{user.name}</p>
                      <p className="text-[10px] text-yellow-400 font-mono truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-4 border-b border-gray-800">
                  <div className="flex gap-3">
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex-1 py-2.5 text-center text-sm font-semibold bg-yellow-400 text-black rounded">
                      Sign In
                    </Link>
                    <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="flex-1 py-2.5 text-center text-sm font-semibold border border-gray-700 text-white rounded">
                      Register
                    </Link>
                  </div>
                </div>
              )}

              {/* Nav Links */}
              <nav className="flex-1 px-2 py-3">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-yellow-400 hover:bg-yellow-400/5 rounded transition-colors"
                >
                  <FiHome size={16} /> Home
                </Link>
                {navLinks.map((link) => (
                  <div key={link.label}>
                    <Link
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-yellow-400 hover:bg-yellow-400/5 rounded transition-colors ${link.className || ''}`}
                    >
                      {link.label}
                    </Link>
                    {link.dropdown && (
                      <div className="ml-6 border-l border-gray-800 pl-3 mb-1">
                        {link.dropdown.map((sub) => (
                          <Link
                            key={sub.label}
                            to={sub.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block py-2 px-2 text-xs text-gray-500 hover:text-yellow-400 transition-colors"
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              {/* Bottom actions */}
              {user && (
                <div className="px-5 py-4 border-t border-gray-800 space-y-1">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-yellow-400 hover:bg-yellow-400/10 rounded transition-colors"
                    >
                      <FiSettings size={15} /> Admin Dashboard
                    </Link>
                  )}
                  <Link
                    to="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-yellow-400 hover:bg-yellow-400/10 rounded transition-colors"
                  >
                    <FiUser size={15} /> My Account
                  </Link>
                  <Link
                    to="/account/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-yellow-400 hover:bg-yellow-400/10 rounded transition-colors"
                  >
                    <FiPackage size={15} /> My Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  >
                    <FiLogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
