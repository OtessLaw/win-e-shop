import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';

const NotFoundPage: React.FC = () => (
  <>
    <Helmet><title>404 — Page Not Found | JJ Vintage Collection</title></Helmet>
    <div className="min-h-[80vh] flex items-center justify-center bg-white">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center px-6"
      >
        <p className="font-display font-bold text-[160px] leading-none text-gray-100 select-none">404</p>
        <div className="-mt-10 relative z-10">
          <div className="w-12 h-0.5 bg-gold-DEFAULT mx-auto mb-6" />
          <h1 className="font-display font-bold text-3xl mb-3">Page Not Found</h1>
          <p className="text-gray-400 font-sans max-w-sm mx-auto mb-10">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="btn-primary gap-2">
              <FiArrowLeft size={16} /> Go Home
            </Link>
            <Link to="/shop" className="btn-secondary">Browse Shop</Link>
          </div>
        </div>
      </motion.div>
    </div>
  </>
);

export default NotFoundPage;
