import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

import { FiArrowRight, FiShield, FiTruck, FiRefreshCw, FiStar } from 'react-icons/fi';
import { productService } from '../../services/productService';
import ProductCard from '../../components/product/ProductCard';
import api from '../../services/api';

// Hero slides data
const heroSlides = [
  {
    id: 1,
    tag: 'New Collection 2024',
    title: 'Redefine\nYour Style',
    subtitle: 'Premium vintage fashion curated for the modern individual.',
    cta: { label: 'Shop Men', path: '/men' },
    cta2: { label: 'Shop Women', path: '/women' },
    gradient: 'from-black/70 via-black/40 to-transparent',
    bgColor: '#1a1a1a',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80&fit=crop',
  },
  {
    id: 2,
    tag: 'Premium Footwear',
    title: 'Walk In\nLuxury',
    subtitle: 'Curated collection of premium shoes for every occasion.',
    cta: { label: 'Shop Shoes', path: '/shoes' },
    cta2: { label: 'New Arrivals', path: '/new-arrivals' },
    gradient: 'from-black/70 via-black/40 to-transparent',
    bgColor: '#111',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=80&fit=crop',
  },
  {
    id: 3,
    tag: 'Flash Sale',
    title: 'Up To 50%\nOff Today',
    subtitle: 'Limited time deals on premium fashion. Shop before they\'re gone.',
    cta: { label: 'Shop Sale', path: '/flash-sale' },
    cta2: { label: 'Best Sellers', path: '/best-sellers' },
    gradient: 'from-black/70 via-black/40 to-transparent',
    bgColor: '#0a0a0a',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&q=80&fit=crop',
  },
];

// Categories
const categories = [
  { name: 'Men', slug: 'men', path: '/men', image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=600&q=80&fit=crop' },
  { name: 'Women', slug: 'women', path: '/women', image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80&fit=crop' },
  { name: 'Shoes', slug: 'shoes', path: '/shoes', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&fit=crop' },
  { name: 'Accessories', slug: 'accessories', path: '/accessories', image: 'https://images.unsplash.com/photo-1591348122449-02525d70379b?w=600&q=80&fit=crop' },
];

const whyChooseUs = [
  { Icon: FiShield, title: '100% Authentic', desc: 'All products are genuine and quality-verified.' },
  { Icon: FiTruck, title: 'Fast Delivery', desc: 'Swift nationwide delivery across Ghana.' },
  { Icon: FiRefreshCw, title: 'Easy Returns', desc: '30-day hassle-free return policy.' },
  { Icon: FiStar, title: 'Premium Quality', desc: 'Curated selection of luxury fashion.' },
];

// Countdown Timer Component
const CountdownTimer: React.FC<{ endTime: Date }> = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => {
      const diff = endTime.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ hours: 0, minutes: 0, seconds: 0 }); return; }
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-black text-gold-DEFAULT font-display font-bold text-2xl md:text-3xl w-16 h-16 flex items-center justify-center">
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-xs text-gray-400 font-sans tracking-widest uppercase mt-1">{label}</span>
    </div>
  );

  return (
    <div className="flex gap-3">
      <TimeBlock value={timeLeft.hours} label="Hours" />
      <div className="font-display text-2xl font-bold text-gold-DEFAULT self-start mt-3">:</div>
      <TimeBlock value={timeLeft.minutes} label="Mins" />
      <div className="font-display text-2xl font-bold text-gold-DEFAULT self-start mt-3">:</div>
      <TimeBlock value={timeLeft.seconds} label="Secs" />
    </div>
  );
};

const HomePage: React.FC = () => {
  const flashSaleEnd = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours from now

  const { data: apiBanners = [] } = useQuery({
    queryKey: ['hero-banners'],
    queryFn: async () => {
      const res = await api.get('/banners?position=hero');
      return res.data.data;
    },
  });

  const activeSlides = apiBanners.length > 0
    ? apiBanners.map((b: any, i: number) => ({
        id: b._id || i,
        tag: 'Featured Drop',
        title: b.title || 'Redefine Your Style',
        subtitle: b.subtitle || 'Premium vintage fashion curated for Ghana.',
        cta: { label: b.cta || 'Shop Collection', path: b.link || '/shop' },
        cta2: { label: 'Explore More', path: '/shop' },
        gradient: 'from-black/80 via-black/50 to-transparent',
        bgColor: '#0a0a0a',
        image: b.imageUrl || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80&fit=crop',
      }))
    : heroSlides;

  const { data: featuredProducts = [] } = useQuery({
    queryKey: ['featured-products'],
    queryFn: productService.getFeatured,
  });

  const { data: bestSellers = [] } = useQuery({
    queryKey: ['best-sellers'],
    queryFn: productService.getBestSellers,
  });

  const { data: newArrivals = [] } = useQuery({
    queryKey: ['new-arrivals'],
    queryFn: productService.getNewArrivals,
  });

  const { data: flashSaleProducts = [] } = useQuery({
    queryKey: ['flash-sale'],
    queryFn: productService.getFlashSale,
  });

  return (
    <>
      <Helmet>
        <title>JJ Vintage Collection | Premium Fashion in Ghana</title>
        <meta name="description" content="Shop premium vintage and luxury clothing, shoes, and accessories at JJ Vintage Collection. Fast delivery across Ghana." />
        <meta property="og:title" content="JJ Vintage Collection | Premium Fashion in Ghana" />
        <meta property="og:description" content="Premium fashion for men and women. Authentic products, fast delivery across Ghana." />
      </Helmet>

      {/* ─── Hero Slider ─────────────────────────────────────────── */}
      <section className="relative h-[85vh] min-h-[500px] max-h-[900px]">
        <Swiper
          modules={[Autoplay, Pagination, Navigation, EffectFade]}
          effect="fade"
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation
          loop
          className="h-full"
        >
          {activeSlides.map((slide: any) => (
            <SwiperSlide key={slide.id}>
              <div className="relative h-full" style={{ backgroundColor: slide.bgColor }}>
                {/* Background Image */}
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />

                {/* Content */}
                <div className="relative h-full container-brand flex items-center">
                  <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="max-w-xl"
                  >
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="text-gold-DEFAULT text-xs font-sans tracking-widest uppercase mb-4 flex items-center gap-2"
                    >
                      <span className="w-8 h-px bg-gold-DEFAULT" />
                      {slide.tag}
                    </motion.p>

                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="font-display font-bold text-white text-5xl md:text-6xl lg:text-7xl leading-none tracking-tight whitespace-pre-line mb-6"
                    >
                      {slide.title}
                    </motion.h1>

                    <motion.p
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      className="text-white/80 font-sans text-lg mb-8 leading-relaxed"
                    >
                      {slide.subtitle}
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      className="flex flex-wrap gap-4"
                    >
                      <Link to={slide.cta.path} className="btn-gold">
                        {slide.cta.label}
                        <FiArrowRight size={16} />
                      </Link>
                      <Link to={slide.cta2.path} className="inline-flex items-center gap-2 text-white text-sm font-sans font-medium tracking-widest uppercase border-b border-white/40 pb-0.5 hover:border-gold-DEFAULT hover:text-gold-DEFAULT transition-all">
                        {slide.cta2.label}
                      </Link>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* ─── Why Choose Us Strip ─────────────────────────────────── */}
      <section className="bg-black text-white py-6 overflow-hidden">
        <div className="container-brand">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {whyChooseUs.map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 py-2">
                <Icon className="text-gold-DEFAULT flex-shrink-0" size={22} />
                <div>
                  <p className="font-sans font-medium text-sm">{title}</p>
                  <p className="text-gray-400 text-xs hidden md:block">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Categories ──────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container-brand">
          <div className="section-header">
            <p className="section-tag">Shop By Category</p>
            <h2 className="section-title font-display">Explore Our Collections</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Link to={cat.path} className="group relative block overflow-hidden">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-500" />
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
                      <h3 className="font-display font-bold text-white text-2xl tracking-wider">{cat.name}</h3>
                      <div className="mt-3 flex items-center gap-2 text-gold-DEFAULT text-xs font-sans tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                        Shop Now <FiArrowRight size={12} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Products ────────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container-brand">
            <div className="section-header">
              <p className="section-tag">Handpicked</p>
              <h2 className="section-title font-display">Featured Products</h2>
              <p className="section-subtitle">Our curated selection of premium pieces for the discerning shopper.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.slice(0, 8).map((product, i) => (
                <ProductCard key={product._id} product={product} index={i} />
              ))}
            </div>
            <div className="text-center mt-12">
              <Link to="/shop?featured=true" className="btn-primary">
                View All Featured <FiArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── Flash Sale ───────────────────────────────────────────── */}
      {flashSaleProducts.length > 0 && (
        <section className="py-20 bg-black text-white">
          <div className="container-brand">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
              <div>
                <p className="text-gold-DEFAULT text-xs font-sans tracking-widest uppercase mb-2">Limited Time</p>
                <h2 className="font-display font-bold text-4xl">Flash Sale 🔥</h2>
              </div>
              <CountdownTimer endTime={flashSaleEnd} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {flashSaleProducts.slice(0, 8).map((product, i) => (
                <div key={product._id} className="bg-white">
                  <ProductCard product={product} index={i} />
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link to="/flash-sale" className="btn-gold">
                Shop All Deals <FiArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── New Arrivals ─────────────────────────────────────────── */}
      {newArrivals.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container-brand">
            <div className="section-header">
              <p className="section-tag">Just In</p>
              <h2 className="section-title font-display">New Arrivals</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {newArrivals.slice(0, 8).map((product, i) => (
                <ProductCard key={product._id} product={product} index={i} />
              ))}
            </div>
            <div className="text-center mt-12">
              <Link to="/new-arrivals" className="btn-secondary">
                See All New Arrivals <FiArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── Best Sellers ─────────────────────────────────────────── */}
      {bestSellers.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container-brand">
            <div className="section-header">
              <p className="section-tag">Customer Favorites</p>
              <h2 className="section-title font-display">Best Sellers</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {bestSellers.slice(0, 8).map((product, i) => (
                <ProductCard key={product._id} product={product} index={i} />
              ))}
            </div>
            <div className="text-center mt-12">
              <Link to="/best-sellers" className="btn-primary">
                View All Best Sellers <FiArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── Brand Feature Banner ─────────────────────────────────── */}
      <section className="py-0">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative aspect-video md:aspect-auto overflow-hidden group">
            <img
              src="https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=800&q=80&fit=crop"
              alt="Men's Collection"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 flex items-end p-10">
              <div>
                <h3 className="font-display text-white text-3xl font-bold mb-3">Men's Collection</h3>
                <Link to="/men" className="text-gold-DEFAULT text-xs font-sans tracking-widest uppercase flex items-center gap-2 hover:gap-4 transition-all">
                  Explore <FiArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
          <div className="relative aspect-video md:aspect-auto overflow-hidden group">
            <img
              src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80&fit=crop"
              alt="Women's Collection"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 flex items-end p-10">
              <div>
                <h3 className="font-display text-white text-3xl font-bold mb-3">Women's Collection</h3>
                <Link to="/women" className="text-gold-DEFAULT text-xs font-sans tracking-widest uppercase flex items-center gap-2 hover:gap-4 transition-all">
                  Explore <FiArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why Choose Us ────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container-brand">
          <div className="section-header">
            <p className="section-tag">Our Promise</p>
            <h2 className="section-title font-display">Why Choose JJ Vintage?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUs.map(({ Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center group"
              >
                <div className="w-16 h-16 bg-black text-gold-DEFAULT flex items-center justify-center mx-auto mb-6 group-hover:bg-gold-DEFAULT group-hover:text-black transition-colors duration-300">
                  <Icon size={26} />
                </div>
                <h3 className="font-display font-bold text-xl mb-3">{title}</h3>
                <p className="text-gray-500 font-sans text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
