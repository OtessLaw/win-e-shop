import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import { useWishlist } from '../../contexts/WishlistContext';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../../services/productService';
import ProductCard from '../../components/product/ProductCard';

const WishlistPage: React.FC = () => {
  const { wishlist } = useWishlist();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['wishlist-products', wishlist],
    queryFn: async () => {
      if (wishlist.length === 0) return [];
      const results = await Promise.allSettled(
        wishlist.map((id) => productService.getProduct(id))
      );
      return results
        .filter((r): r is PromiseFulfilledResult<typeof r extends PromiseFulfilledResult<infer T> ? T : never> => r.status === 'fulfilled')
        .map((r) => r.value);
    },
    enabled: wishlist.length > 0,
  });

  return (
    <>
      <Helmet>
        <title>Wishlist ({wishlist.length}) | JJ Vintage Collection</title>
      </Helmet>

      <div className="bg-black text-white py-16 text-center">
        <p className="text-gold-DEFAULT text-xs tracking-widest uppercase font-sans mb-2">Your Favourites</p>
        <h1 className="font-display font-bold text-4xl">Wishlist</h1>
      </div>

      <div className="container-brand py-12">
        {wishlist.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24">
            <FiHeart size={64} className="mx-auto text-gray-200 mb-6" />
            <h2 className="font-display text-3xl font-bold mb-3">Your wishlist is empty</h2>
            <p className="text-gray-400 font-sans mb-8">Save items you love and come back when you're ready to shop.</p>
            <Link to="/shop" className="btn-primary gap-2">
              <FiShoppingBag size={16} />Browse Products
            </Link>
          </motion.div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-8">{wishlist.length} saved item{wishlist.length !== 1 ? 's' : ''}</p>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {wishlist.map((id) => (
                  <div key={id} className="space-y-3">
                    <div className="skeleton w-full aspect-[3/4] rounded" />
                    <div className="skeleton h-4 w-3/4 rounded" />
                    <div className="skeleton h-4 w-1/2 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product: any, i) => (
                  <ProductCard key={product._id} product={product} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default WishlistPage;
