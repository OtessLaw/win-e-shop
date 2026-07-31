import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';

const AboutPage: React.FC = () => (
  <>
    <Helmet>
      <title>About Us | JJ Vintage Collection</title>
      <meta name="description" content="Learn about JJ Vintage Collection — Ghana's premium fashion brand." />
    </Helmet>

    {/* Hero */}
    <section className="relative h-[60vh] bg-black text-white flex items-end">
      <img src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&q=80&fit=crop" alt="About JJ Vintage" className="absolute inset-0 w-full h-full object-cover opacity-40" />
      <div className="relative container-brand pb-16">
        <p className="text-gold-DEFAULT text-xs tracking-widest uppercase mb-3">Our Story</p>
        <h1 className="font-display font-bold text-5xl md:text-6xl">About Us</h1>
      </div>
    </section>

    {/* Story */}
    <section className="py-24 bg-white">
      <div className="container-brand max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <p className="section-tag">Who We Are</p>
            <h2 className="font-display font-bold text-3xl mb-6">Ghana's Premium Fashion Destination</h2>
            <div className="space-y-4 text-gray-600 font-sans leading-relaxed">
              <p>JJ Vintage Collection was born from a simple belief: everyone deserves access to premium, authentic fashion without compromise. Founded in the heart of Accra, Ghana, we curate the finest clothing, shoes, and accessories for the modern African.</p>
              <p>We are more than a store — we are a movement. A commitment to quality, authenticity, and style that speaks to who you are and who you aspire to be.</p>
              <p>From our carefully selected vintage pieces to our contemporary luxury collections, every item in our store is handpicked to meet the highest standards of craftsmanship and style.</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
            <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80&fit=crop" alt="JJ Vintage Story" className="w-full aspect-[4/5] object-cover" />
            <div className="absolute -bottom-6 -left-6 bg-gold-DEFAULT text-black p-6 font-display font-bold text-xl">Since 2020</div>
          </motion.div>
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="py-24 bg-black text-white">
      <div className="container-brand">
        <div className="section-header">
          <p className="section-tag">What We Stand For</p>
          <h2 className="font-display font-bold text-4xl text-white">Our Values</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: '✨', title: 'Authenticity', desc: 'Every product we carry is 100% genuine and carefully verified for quality and authenticity.' },
            { icon: '👑', title: 'Quality', desc: 'We refuse to compromise on quality. Only the best makes it into our collection.' },
            { icon: '🎨', title: 'Style', desc: 'Fashion is self-expression. We curate pieces that help you tell your unique story.' },
            { icon: '🇬🇭', title: 'Community', desc: 'We are proud to serve Ghana and support the African fashion community.' },
          ].map(({ icon, title, desc }, i) => (
            <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
              <div className="text-4xl mb-4">{icon}</div>
              <h3 className="font-display font-bold text-xl text-gold-DEFAULT mb-3">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-20 bg-gray-50 text-center">
      <div className="container-brand max-w-2xl">
        <h2 className="font-display font-bold text-3xl mb-4">Ready to Explore?</h2>
        <p className="text-gray-500 mb-8">Discover our full collection and find your next favourite piece.</p>
        <Link to="/shop" className="btn-primary gap-2">Shop Now <FiArrowRight size={16} /></Link>
      </div>
    </section>
  </>
);

export default AboutPage;
