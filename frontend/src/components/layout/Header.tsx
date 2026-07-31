import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiShoppingBag, FiHeart, FiUser, FiMenu, FiX, FiChevronDown,
  FiTruck, FiShield,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';

const navLinks = [
  { label: 'Shop', path: '/shop' },
  {
    label: 'Men', path: '/men', dropdown: [
      { label: 'All Men', path: '/men' },
      { label: 'Shirts', path: '/shop?category=men&type=shirts' },
      { label: 'Trousers', path: '/shop?category=men&type=trousers' },
      { label: 'Suits', path: '/shop?category=men&type=suits' },
    ]
  },
  {
    label: 'Women', path: '/women', dropdown: [
      { label: 'All Women', path: '/women' },
      { label: 'Dresses', path: '/shop?category=women&type=dresses' },
      { label: 'Tops', path: '/shop?category=women&type=tops' },
    ]
  },
  { label: 'Shoes', path: '/shoes' },
  { label: 'Accessories', path: '/accessories' },
  { label: 'Track Order', path: '/track-order' },
  { label: 'Sale', path: '/flash-sale', className: 'text-gold-DEFAULT font-bold' },
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

  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 transition-all duration-300">
      {/* Gold Luxury Announcement Bar */}
      <div className="bg-gradient-to-r from-black via-gray-900 to-black text-gold-DEFAULT border-b border-gold-500/20 py-2 text-center text-xs font-mono tracking-wider flex items-center justify-center gap-2 overflow-hidden px-4">
        <FiTruck size={14} className="text-gold-DEFAULT shrink-0 animate-bounce" />
        <AnimatePresence mode="wait">
          <motion.span
            key={announcementIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="truncate font-semibold tracking-widest text-gold-DEFAULT"
          >
            {announcements[announcementIndex]}
          </motion.span>
        </AnimatePresence>
        <span className="hidden md:inline-flex items-center gap-1.5 ml-4 bg-gold-DEFAULT/10 border border-gold-DEFAULT/30 text-gold-DEFAULT px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-widest">
          <FiShield size={10} /> Express Ghana Shipping
        </span>
      </div>

      {/* Main Navigation Bar */}
      <div className={`bg-black/95 backdrop-blur-md border-b border-white/10 ${isScrolled ? 'shadow-xl' : ''}`}>
        <div className="container-brand flex items-center justify-between h-16 md:h-20 px-4 md:px-8">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:text-gold-DEFAULT transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex flex-col items-center group">
            <span className="font-display font-bold text-xl md:text-2xl tracking-widest text-white group-hover:text-gold-DEFAULT transition-colors">
              JJ VINTAGE
            </span>
            <span className="text-[9px] tracking-widest font-mono text-gold-DEFAULT uppercase -mt-1">
              COLLECTION GHANA
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative group"
                onMouseEnter={() => setActiveDropdown(link.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  to={link.path}
                  className={`text-xs font-sans tracking-widest uppercase text-gray-300 hover:text-gold-DEFAULT transition-colors flex items-center gap-1 py-2 ${link.className || ''}`}
                >
                  {link.label}
                  {link.dropdown && <FiChevronDown size={12} />}
                </Link>

                {link.dropdown && activeDropdown === link.label && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 w-48 bg-black/95 border border-gold-500/20 py-2 shadow-2xl z-50 backdrop-blur-md"
                  >
                    {link.dropdown.map((sub) => (
                      <Link
                        key={sub.label}
                        to={sub.path}
                        className="block px-4 py-2 text-xs text-gray-300 hover:text-gold-DEFAULT hover:bg-gold-DEFAULT/10 transition-all font-sans"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </nav>

          {/* Actions Icons */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-gray-300 hover:text-gold-DEFAULT transition-colors"
              aria-label="Search"
            >
              <FiSearch size={20} />
            </button>

            <Link
              to="/wishlist"
              className="p-2 text-gray-300 hover:text-gold-DEFAULT transition-colors relative"
              aria-label="Wishlist"
            >
              <FiHeart size={20} />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-gold-DEFAULT text-black rounded-full text-[10px] font-bold flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              className="p-2 text-gray-300 hover:text-gold-DEFAULT transition-colors relative"
              aria-label="Shopping Cart"
            >
              <FiShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-gold-DEFAULT text-black rounded-full text-[10px] font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative group">
                <Link
                  to={String(user.role) === 'admin' ? '/admin' : '/account'}
                  className="w-8 h-8 rounded-full bg-gold-DEFAULT text-black flex items-center justify-center font-bold text-xs hover:scale-105 transition-transform"
                >
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </Link>
                <div className="absolute right-0 top-full mt-2 w-44 bg-black/95 border border-gold-500/20 py-2 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200">
                  <div className="px-4 py-2 border-b border-gray-800">
                    <p className="text-xs text-white font-bold truncate">{user.name}</p>
                    <p className="text-[10px] text-gold-DEFAULT truncate font-mono">{user.email}</p>
                  </div>
                  {isAdmin && (
                    <Link to="/admin" className="block px-4 py-2 text-xs text-gold-DEFAULT hover:bg-gold-DEFAULT/10">
                      Admin Dashboard
                    </Link>
                  )}
                  <Link to="/account" className="block px-4 py-2 text-xs text-gray-300 hover:text-gold-DEFAULT hover:bg-gold-DEFAULT/10">
                    My Account
                  </Link>
                  <Link to="/account/orders" className="block px-4 py-2 text-xs text-gray-300 hover:text-gold-DEFAULT hover:bg-gold-DEFAULT/10">
                    My Orders
                  </Link>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10">
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="p-2 text-gray-300 hover:text-gold-DEFAULT transition-colors"
                aria-label="Login"
              >
                <FiUser size={20} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Slide Search Drawer */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/95 border-b border-gold-500/20 py-4 px-6 shadow-2xl backdrop-blur-lg"
          >
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative flex items-center">
              <FiSearch className="absolute left-4 text-gold-DEFAULT" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search luxury vintage shirts, shoes, accessories..."
                autoFocus
                className="w-full bg-gray-900/90 border border-gold-500/30 text-white pl-12 pr-10 py-3 rounded-full text-sm font-sans focus:outline-none focus:border-gold-DEFAULT placeholder-gray-500"
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
    </header>
  );
};

export default Header;
