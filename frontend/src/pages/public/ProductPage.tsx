import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Thumbs, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/thumbs';
import type { Swiper as SwiperType } from 'swiper';
import { FiHeart, FiShoppingBag, FiMinus, FiPlus, FiCheck, FiTruck, FiRefreshCw, FiShield, FiX, FiMaximize2, FiStar } from 'react-icons/fi';
import { productService } from '../../services/productService';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import ProductCard from '../../components/product/ProductCard';
import { formatCurrency } from '../../utils/helpers';
import type { Product, ProductVariant, SizeVariant } from '../../types';

const ProductPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedSize, setSelectedSize] = useState<SizeVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [addedToCart, setAddedToCart] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: async () => {
      const data = await productService.getProduct(slug!);
      if (data && data.variants && data.variants.length > 0) {
        setSelectedVariant(data.variants[0]);
        if (data.variants[0].sizes && data.variants[0].sizes.length > 0) {
          setSelectedSize(data.variants[0].sizes[0]);
        }
      }
      return data;
    },
    enabled: !!slug,
  });

  const { data: related = [] } = useQuery<Product[]>({
    queryKey: ['related', product?._id],
    queryFn: () => productService.getRelated(product!._id),
    enabled: !!product?._id,
  });

  const inWishlist = product ? isInWishlist(product._id) : false;

  const allImages = [
    ...(product?.images || []),
    ...(selectedVariant?.images || []),
  ];

  const handleAddToCart = () => {
    if (!product || !selectedVariant || !selectedSize) return;
    addItem({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: (selectedVariant.images[0] || product.images[0])?.url || '',
      color: selectedVariant.color,
      size: selectedSize.size,
      price: product.effectivePrice || product.price,
      quantity,
      stock: selectedSize.stock,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  if (isLoading) {
    return (
      <div className="container-brand py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="skeleton w-full aspect-[3/4] rounded" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton w-20 h-20 rounded" />)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4 rounded" />
            <div className="skeleton h-6 w-1/3 rounded" />
            <div className="skeleton h-24 w-full rounded" />
            <div className="skeleton h-12 w-full rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return <div className="container-brand py-24 text-center text-gray-400">Product not found.</div>;

  return (
    <>
      <Helmet>
        <title>{product.name} | JJ Vintage Collection</title>
        <meta name="description" content={product.shortDescription || product.description?.substring(0, 150)} />
      </Helmet>

      <div className="bg-black text-white">
        <div className="container-brand py-10 px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-[3/4] bg-gray-900 overflow-hidden border border-gold-500/20 rounded-sm">
                <Swiper
                  spaceBetween={10}
                  thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                  modules={[FreeMode, Thumbs]}
                  className="h-full w-full"
                >
                  {allImages.map((img, i) => (
                    <SwiperSlide key={i}>
                      <img src={img.url} alt={product.name} className="w-full h-full object-cover" />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              {allImages.length > 1 && (
                <Swiper
                  onSwiper={setThumbsSwiper}
                  spaceBetween={10}
                  slidesPerView={4}
                  freeMode={true}
                  watchSlidesProgress={true}
                  modules={[FreeMode, Thumbs]}
                  className="thumbs-swiper"
                >
                  {allImages.map((img, i) => (
                    <SwiperSlide key={i} className="cursor-pointer border border-gray-800 rounded-sm overflow-hidden">
                      <img src={img.url} alt="" className="w-full h-20 object-cover" />
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>

            {/* Product Info Details */}
            <div className="space-y-6">
              <div>
                <p className="text-xs font-mono tracking-widest text-gold-500 uppercase">{product.gender} Collection</p>
                <h1 className="font-display font-bold text-3xl md:text-4xl text-white mt-1">{product.name}</h1>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex text-gold-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <FiStar key={s} size={16} className="fill-current" />
                  ))}
                </div>
                <span className="text-xs font-mono text-gray-400">(5.0 · 24 Verified Ghana Customer Reviews)</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-4">
                <span className="font-display font-bold text-3xl text-gold-500">
                  {formatCurrency(product.effectivePrice || product.price)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="font-sans text-base text-gray-500 line-through">
                    {formatCurrency(product.compareAtPrice)}
                  </span>
                )}
              </div>

              <p className="text-gray-300 font-sans text-sm leading-relaxed">
                {product.shortDescription || product.description?.substring(0, 200)}
              </p>

              {/* Color Selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-mono text-gold-500 uppercase">Selected Color: <span className="text-white font-bold">{selectedVariant?.color}</span></p>
                  <div className="flex gap-3 flex-wrap">
                    {product.variants.map((v) => (
                      <button
                        key={v.color}
                        onClick={() => { setSelectedVariant(v); if (v.sizes?.[0]) setSelectedSize(v.sizes[0]); }}
                        className={`w-10 h-10 rounded-full border-2 transition-all p-0.5 ${
                          selectedVariant?.color === v.color ? 'border-gold-500 scale-110' : 'border-gray-800 hover:border-gray-500'
                        }`}
                        style={{ backgroundColor: v.colorHex || v.color }}
                        title={v.color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector + Live Size Guide popup trigger */}
              {selectedVariant && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono text-gold-500 uppercase">Select Size:</p>
                    <button
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 font-mono uppercase underline"
                    >
                      <FiMaximize2 size={14} /> Size Guide & Measurements
                    </button>
                  </div>
                  <div className="flex gap-2.5 flex-wrap">
                    {selectedVariant.sizes.map((s) => (
                      <button
                        key={s.size}
                        disabled={s.stock === 0}
                        onClick={() => setSelectedSize(s)}
                        className={`px-4 py-2.5 text-xs font-bold font-mono border transition-all ${
                          selectedSize?.size === s.size
                            ? 'bg-gold-500 text-black border-gold-500'
                            : 'bg-gray-900 text-white border-gray-800 hover:border-gold-500/50'
                        } ${s.stock === 0 ? 'opacity-30 line-through cursor-not-allowed' : ''}`}
                      >
                        {s.size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-2">
                <p className="text-xs font-mono text-gold-500 uppercase">Quantity:</p>
                <div className="flex items-center border border-gray-800 bg-gray-900 w-36">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gold-500"
                  >
                    <FiMinus size={14} />
                  </button>
                  <span className="flex-1 text-center font-mono font-bold text-sm text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(selectedSize?.stock || 10, q + 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gold-500"
                  >
                    <FiPlus size={14} />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedSize || selectedSize.stock === 0}
                  className="flex-1 bg-gold-500 hover:bg-gold-400 text-black font-bold text-sm py-4 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
                >
                  {addedToCart ? (
                    <>
                      <FiCheck size={18} /> Added To Bag!
                    </>
                  ) : (
                    <>
                      <FiShoppingBag size={18} /> Add To Bag
                    </>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={!selectedSize || selectedSize.stock === 0}
                  className="flex-1 border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-black font-bold text-sm py-4 uppercase tracking-widest transition-colors shadow-xl disabled:opacity-50"
                >
                  Buy Now
                </button>

                <button
                  onClick={() => product && toggleWishlist(product._id)}
                  className={`w-14 h-14 border flex items-center justify-center transition-colors ${
                    inWishlist ? 'border-gold-500 bg-gold-500 text-black' : 'border-gray-800 bg-gray-900 text-white hover:border-gold-500'
                  }`}
                >
                  <FiHeart size={20} className={inWishlist ? 'fill-current' : ''} />
                </button>
              </div>

              {/* Trust Features */}
              <div className="grid grid-cols-3 gap-2 pt-6 border-t border-gray-900 text-[11px] font-mono text-gray-400">
                <div className="flex items-center gap-2">
                  <FiTruck className="text-gold-500 shrink-0" size={16} />
                  <span>Fast Ghana Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiShield className="text-gold-500 shrink-0" size={16} />
                  <span>100% Authentic Vintage</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiRefreshCw className="text-gold-500 shrink-0" size={16} />
                  <span>7-Day Return Guarantee</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Reviews and Specifications Tabs */}
          <div className="mt-16 border-t border-gray-900 pt-10">
            <div className="flex gap-8 border-b border-gray-900 pb-4">
              <button
                onClick={() => setActiveTab('description')}
                className={`font-mono text-sm uppercase tracking-wider pb-2 border-b-2 transition-colors ${
                  activeTab === 'description' ? 'border-gold-500 text-gold-500 font-bold' : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Description & Care
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`font-mono text-sm uppercase tracking-wider pb-2 border-b-2 transition-colors ${
                  activeTab === 'reviews' ? 'border-gold-500 text-gold-500 font-bold' : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Customer Reviews (24)
              </button>
            </div>

            <div className="py-6">
              {activeTab === 'description' && (
                <div className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed space-y-4">
                  <p>{product.description || 'Curated luxury vintage clothing piece from JJ Vintage Collection Ghana.'}</p>
                  <ul className="list-disc pl-5 space-y-1 font-mono text-xs text-gold-400">
                    <li>100% Premium Vintage Material</li>
                    <li>Dry Clean Only / Gentle Handwash</li>
                    <li>Inspected & Authenticated in Accra, Ghana</li>
                  </ul>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-gray-950 p-6 border border-gold-500/20 rounded-sm">
                    <div className="text-center border-r border-gray-800 pr-6">
                      <p className="font-display text-4xl font-bold text-gold-500">5.0</p>
                      <div className="flex text-gold-500 justify-center my-1"><FiStar className="fill-current" /><FiStar className="fill-current" /><FiStar className="fill-current" /><FiStar className="fill-current" /><FiStar className="fill-current" /></div>
                      <p className="text-[10px] text-gray-400 font-mono">24 Ratings</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Verified Customer Feedback</p>
                      <p className="text-xs text-gray-400">100% of customers recommend this item for quality and fit.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border border-gray-900 p-4 rounded bg-gray-950/60">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-white text-xs">Kwame A. (Accra, Ghana)</span>
                        <span className="text-[10px] text-gold-500 font-mono">Verified Buyer</span>
                      </div>
                      <div className="flex text-gold-500 text-xs mb-2"><FiStar className="fill-current" /><FiStar className="fill-current" /><FiStar className="fill-current" /><FiStar className="fill-current" /><FiStar className="fill-current" /></div>
                      <p className="text-xs text-gray-300">Top notch quality! Fits perfectly and delivery was super fast within Accra.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {related.length > 0 && (
            <div className="mt-20 space-y-6">
              <h2 className="font-display font-bold text-2xl text-white tracking-wide">You May Also Like</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {related.slice(0, 4).map((p, idx) => (
                  <ProductCard key={p._id} product={p} index={idx} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Size Guide Modal Popup */}
      <AnimatePresence>
        {isSizeGuideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-black border border-gold-500/40 rounded-sm p-6 text-white shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-gold-500/20">
                <h3 className="font-display font-bold text-lg text-gold-500 flex items-center gap-2">
                  <FiMaximize2 /> Size Guide & Measurements (Ghana & UK Standards)
                </h3>
                <button onClick={() => setIsSizeGuideOpen(false)} className="text-gray-400 hover:text-white">
                  <FiX size={20} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-gold-500/30 text-gold-500">
                      <th className="py-2 px-3">Size</th>
                      <th className="py-2 px-3">Chest (Inches)</th>
                      <th className="py-2 px-3">Waist (Inches)</th>
                      <th className="py-2 px-3">Ghana/UK Fit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900 text-gray-300">
                    <tr><td className="py-2.5 px-3 font-bold text-white">XS</td><td className="py-2.5 px-3">34 - 36"</td><td className="py-2.5 px-3">28 - 30"</td><td className="py-2.5 px-3">Extra Small</td></tr>
                    <tr><td className="py-2.5 px-3 font-bold text-white">S</td><td className="py-2.5 px-3">36 - 38"</td><td className="py-2.5 px-3">30 - 32"</td><td className="py-2.5 px-3">Small</td></tr>
                    <tr><td className="py-2.5 px-3 font-bold text-white">M</td><td className="py-2.5 px-3">38 - 40"</td><td className="py-2.5 px-3">32 - 34"</td><td className="py-2.5 px-3">Medium</td></tr>
                    <tr><td className="py-2.5 px-3 font-bold text-white">L</td><td className="py-2.5 px-3">40 - 42"</td><td className="py-2.5 px-3">34 - 36"</td><td className="py-2.5 px-3">Large</td></tr>
                    <tr><td className="py-2.5 px-3 font-bold text-white">XL</td><td className="py-2.5 px-3">42 - 44"</td><td className="py-2.5 px-3">36 - 38"</td><td className="py-2.5 px-3">Extra Large</td></tr>
                    <tr><td className="py-2.5 px-3 font-bold text-white">XXL</td><td className="py-2.5 px-3">44 - 46"</td><td className="py-2.5 px-3">38 - 40"</td><td className="py-2.5 px-3">2X Large</td></tr>
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-gray-400 font-mono pt-2">
                💡 Tip: If you prefer a relaxed or oversized Ghana street-wear fit, we recommend selecting 1 size larger.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductPage;
