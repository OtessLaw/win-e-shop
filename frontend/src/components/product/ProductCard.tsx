import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiShoppingBag, FiEye, FiX, FiCheck } from 'react-icons/fi';
import type { Product, ProductVariant, SizeVariant } from '../../types';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency } from '../../utils/helpers';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedVariant] = useState<ProductVariant>(product.variants?.[0] || { color: 'Default', sizes: [{ size: 'M', stock: 10, sku: '' }], images: [] });
  const [selectedSize, setSelectedSize] = useState<SizeVariant>(selectedVariant?.sizes?.[0] || { size: 'M', stock: 10, sku: '' });
  const [added, setAdded] = useState(false);

  const inWishlist = isInWishlist(product._id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const firstVariant = product.variants[0];
    const firstSize = firstVariant?.sizes.find((s) => s.stock > 0) || firstVariant?.sizes[0];
    if (!firstVariant || !firstSize) return;

    addItem({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: (firstVariant.images[0] || product.images[0])?.url || '',
      color: firstVariant.color,
      size: firstSize.size,
      price: product.effectivePrice || product.price,
      quantity: 1,
      stock: firstSize.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product._id);
  };

  const openQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
  };

  const discountPercent = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : product.discount;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
        className="product-card group relative bg-black border border-gold-500/20 rounded-sm overflow-hidden hover:border-gold-500/60 transition-all duration-300 shadow-xl"
      >
        <Link to={`/product/${product.slug}`} className="block">
          {/* Image Container */}
          <div className="product-card-image relative aspect-[3/4] bg-gray-900 overflow-hidden">
            <img
              src={product.images[0]?.url || 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800'}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
              {discountPercent && discountPercent > 0 ? (
                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider font-mono shadow-md">
                  -{discountPercent}% OFF
                </span>
              ) : null}
              {product.isNewArrival && (
                <span className="bg-gold-500 text-black text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider font-mono shadow-md">
                  NEW DROP
                </span>
              )}
            </div>

            {/* Hover Action Buttons */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={handleWishlist}
                className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-colors shadow-md ${
                  inWishlist ? 'bg-gold-500 text-black' : 'bg-black/70 text-white hover:bg-gold-500 hover:text-black'
                }`}
                title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <FiHeart size={16} className={inWishlist ? 'fill-current' : ''} />
              </button>

              <button
                onClick={openQuickView}
                className="w-9 h-9 rounded-full bg-black/70 text-white hover:bg-gold-500 hover:text-black flex items-center justify-center backdrop-blur-md transition-colors shadow-md"
                title="Quick View"
              >
                <FiEye size={16} />
              </button>
            </div>

            {/* Quick Add Button Bar at bottom of card */}
            <button
              onClick={handleQuickAdd}
              className="absolute inset-x-0 bottom-0 bg-gold-500 hover:bg-gold-400 text-black font-bold text-xs py-3 uppercase tracking-wider flex items-center justify-center gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 shadow-2xl font-mono"
            >
              {added ? (
                <>
                  <FiCheck size={16} /> Added To Cart!
                </>
              ) : (
                <>
                  <FiShoppingBag size={16} /> Quick Add To Bag
                </>
              )}
            </button>
          </div>

          {/* Product Details */}
          <div className="p-4 space-y-2 bg-black">
            <p className="text-[10px] font-mono text-gold-500 uppercase tracking-widest">
              {product.gender} · {typeof product.category === 'object' ? product.category?.name : 'Vintage'}
            </p>
            <h3 className="font-sans font-bold text-sm text-white group-hover:text-gold-500 transition-colors truncate">
              {product.name}
            </h3>

            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-base text-gold-500">
                {formatCurrency(product.effectivePrice || product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="font-sans text-xs text-gray-500 line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {isQuickViewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-black border border-gold-500/30 rounded-sm overflow-hidden shadow-2xl p-6 text-white"
            >
              <button
                onClick={() => setIsQuickViewOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gold-500 p-1"
              >
                <FiX size={20} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="aspect-[3/4] bg-gray-900 rounded overflow-hidden">
                  <img
                    src={selectedVariant.images[0]?.url || product.images[0]?.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-gold-500 uppercase tracking-widest">
                      {product.gender} Collection
                    </span>
                    <h2 className="font-display text-xl font-bold text-white">{product.name}</h2>
                    <p className="text-xl font-display font-bold text-gold-500">
                      {formatCurrency(product.effectivePrice || product.price)}
                    </p>
                    <p className="text-xs text-gray-400 line-clamp-3 font-sans">
                      {product.description || 'Premium luxury vintage fashion item.'}
                    </p>
                  </div>

                  {/* Size Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-gold-500 uppercase">Select Size:</label>
                    <div className="flex gap-2 flex-wrap">
                      {selectedVariant.sizes?.map((s) => (
                        <button
                          key={s.size}
                          onClick={() => setSelectedSize(s)}
                          className={`px-3 py-1.5 border text-xs font-bold font-mono transition-all ${
                            selectedSize.size === s.size
                              ? 'border-gold-500 bg-gold-500 text-black'
                              : 'border-gray-800 bg-gray-900 text-white hover:border-gold-500/50'
                          }`}
                        >
                          {s.size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      onClick={() => {
                        addItem({
                          productId: product._id,
                          name: product.name,
                          slug: product.slug,
                          image: (selectedVariant.images[0] || product.images[0])?.url || '',
                          color: selectedVariant.color,
                          size: selectedSize.size,
                          price: product.effectivePrice || product.price,
                          quantity: 1,
                          stock: selectedSize.stock,
                        });
                        setIsQuickViewOpen(false);
                        navigate('/cart');
                      }}
                      className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold text-sm py-3 uppercase tracking-wider transition-colors shadow-lg"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductCard;
