import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiInstagram, FiFacebook, FiTwitter, FiMail, FiPhone, FiMapPin, FiShield, FiTruck, FiRefreshCw } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubscribing(true);
    try {
      const res = await api.post('/newsletter/subscribe', { email });
      toast.success(res.data.message);
      setEmail('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="bg-black text-white border-t border-gold-500/20">
      {/* Brand Value Pillars */}
      <div className="border-b border-gray-900 bg-gray-950/80 py-8">
        <div className="container-brand grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
          <div className="flex items-center gap-4 border border-gold-500/10 p-4 rounded-sm bg-black/40">
            <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500 shrink-0">
              <FiTruck size={22} />
            </div>
            <div>
              <h5 className="font-sans font-bold text-white text-xs uppercase tracking-wider">Fast Nationwide Delivery</h5>
              <p className="text-gray-400 text-xs mt-0.5">Accra, Kumasi & all Ghana regions</p>
            </div>
          </div>

          <div className="flex items-center gap-4 border border-gold-500/10 p-4 rounded-sm bg-black/40">
            <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500 shrink-0">
              <FiShield size={22} />
            </div>
            <div>
              <h5 className="font-sans font-bold text-white text-xs uppercase tracking-wider">100% Authentic Guaranteed</h5>
              <p className="text-gray-400 text-xs mt-0.5">Curated luxury vintage pieces</p>
            </div>
          </div>

          <div className="flex items-center gap-4 border border-gold-500/10 p-4 rounded-sm bg-black/40">
            <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500 shrink-0">
              <FiRefreshCw size={22} />
            </div>
            <div>
              <h5 className="font-sans font-bold text-white text-xs uppercase tracking-wider">Easy Exchange Policy</h5>
              <p className="text-gray-400 text-xs mt-0.5">7-day hassle-free returns</p>
            </div>
          </div>

          <div className="flex items-center gap-4 border border-gold-500/10 p-4 rounded-sm bg-black/40">
            <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500 shrink-0">
              <span className="font-mono font-bold text-sm">GH</span>
            </div>
            <div>
              <h5 className="font-sans font-bold text-white text-xs uppercase tracking-wider">Pay With MoMo & Card</h5>
              <p className="text-gray-400 text-xs mt-0.5">MTN MoMo, Telecel & Paystack</p>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="border-b border-gray-900">
        <div className="container-brand py-14 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs tracking-widest font-mono uppercase text-gold-500 mb-2">Stay In The Loop</p>
            <h3 className="font-display text-3xl font-bold mb-4 text-white">Subscribe to Exclusive Vintage Drops</h3>
            <p className="text-gray-400 font-sans text-sm mb-8">
              Get secret discount codes, new drop alerts, and VIP fashion style inspiration delivered to your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-0 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="flex-1 bg-gray-900 border border-gold-500/30 text-white placeholder-gray-500 px-4 py-3.5 text-sm font-sans focus:outline-none focus:border-gold-500 transition-colors"
              />
              <button
                type="submit"
                disabled={isSubscribing}
                className="bg-gold-500 text-black px-6 py-3.5 text-xs font-sans font-bold tracking-widest uppercase hover:bg-gold-400 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {isSubscribing ? '...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-brand py-16 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="mb-6">
              <div className="font-display font-bold text-2xl tracking-widest mb-1 text-white">J&J VINTAGE</div>
              <div className="text-xs tracking-widest text-gold-500 uppercase font-mono">COLLECTION GHANA</div>
            </div>
            <p className="text-gray-400 font-sans text-sm leading-relaxed mb-6">
              Ghana's premier luxury vintage fashion store. Curating high-end clothing, footwear, and accessories.
            </p>
            <div className="flex gap-4">
              {[
                { Icon: FiInstagram, href: '#', label: 'Instagram' },
                { Icon: FiFacebook, href: '#', label: 'Facebook' },
                { Icon: FiTwitter, href: '#', label: 'Twitter' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 border border-gray-800 flex items-center justify-center text-gray-400 hover:border-gold-500 hover:text-gold-500 transition-all duration-300 rounded-sm"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-sans font-bold tracking-widest uppercase text-xs mb-6 text-gold-500">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { label: 'Shop All Products', path: '/shop' },
                { label: 'Men\'s Fashion', path: '/men' },
                { label: 'Women\'s Fashion', path: '/women' },
                { label: 'Footwear & Shoes', path: '/shoes' },
                { label: 'Track Your Order', path: '/track-order' },
                { label: 'Flash Sale Deals', path: '/flash-sale' },
              ].map(({ label, path }) => (
                <li key={label}>
                  <Link to={path} className="text-gray-400 hover:text-gold-500 text-sm font-sans transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-sans font-bold tracking-widest uppercase text-xs mb-6 text-gold-500">Customer Care</h4>
            <ul className="space-y-3">
              {[
                { label: 'About J&J Vintage', path: '/about' },
                { label: 'Contact Support', path: '/contact' },
                { label: 'FAQ & Help', path: '/faq' },
                { label: 'Privacy Policy', path: '/privacy' },
                { label: 'Terms & Conditions', path: '/terms' },
                { label: 'Returns & Refund Policy', path: '/returns' },
              ].map(({ label, path }) => (
                <li key={label}>
                  <Link to={path} className="text-gray-400 hover:text-gold-500 text-sm font-sans transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & MoMo Payment Badges */}
          <div>
            <h4 className="font-sans font-bold tracking-widest uppercase text-xs mb-6 text-gold-500">Ghana Office & Contact</h4>
            <ul className="space-y-4 mb-6">
              <li className="flex items-start gap-3 text-gray-400">
                <FiMapPin className="text-gold-500 flex-shrink-0 mt-1" size={16} />
                <span className="font-sans text-sm">Accra Luxury Fashion District, Greater Accra, Ghana</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <FiPhone className="text-gold-500 flex-shrink-0" size={16} />
                <a href="tel:+233240000000" className="font-sans text-sm hover:text-gold-500 transition-colors">+233 24 000 0000</a>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <FiMail className="text-gold-500 flex-shrink-0" size={16} />
                <a href="mailto:support@jjvintage.com" className="font-sans text-sm hover:text-gold-500 transition-colors">support@jjvintage.com</a>
              </li>
            </ul>

            {/* Ghana Payment Methods */}
            <div>
              <p className="text-[11px] tracking-wider uppercase text-gold-500/90 font-mono mb-2">Accepted Payment Methods</p>
              <div className="flex gap-2 flex-wrap text-[10px] font-mono font-bold">
                <span className="bg-yellow-500 text-black px-2.5 py-1 rounded-sm shadow-sm">MTN MoMo</span>
                <span className="bg-red-600 text-white px-2.5 py-1 rounded-sm shadow-sm">Telecel Cash</span>
                <span className="bg-blue-600 text-white px-2.5 py-1 rounded-sm shadow-sm">Paystack</span>
                <span className="bg-gray-800 text-gold-400 px-2.5 py-1 rounded-sm border border-gold-500/30">VISA / MasterCard</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-900 bg-black py-6">
        <div className="container-brand px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs font-sans">
            © {new Date().getFullYear()} J&J Vintage Collection Ghana. All Rights Reserved.
          </p>
          <p className="text-gray-400 text-xs font-sans flex items-center gap-2">
            <span>Designed for Luxury Ghana Fashion</span>
            <span>🇬🇭</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
