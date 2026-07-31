import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';
import api from '../../services/api';

const FALLBACK_FAQS = [
  { _id: '1', category: 'Shipping', question: 'How long does delivery take?', answer: 'Standard delivery takes 3–5 business days within Accra and 5–7 days for other regions. Express delivery (1–2 days) is available at checkout.' },
  { _id: '2', category: 'Shipping', question: 'Do you offer free shipping?', answer: 'Yes! We offer free standard delivery on all orders above GHS 200.' },
  { _id: '3', category: 'Returns', question: 'What is your return policy?', answer: 'We accept returns within 30 days of delivery for unused items in their original condition with tags attached. Items must be unworn and in original packaging.' },
  { _id: '4', category: 'Returns', question: 'How do I return an item?', answer: 'Contact us at hello@jjvintage.com with your order number and reason for return. We\'ll arrange a pickup or provide instructions.' },
  { _id: '5', category: 'Payment', question: 'What payment methods do you accept?', answer: 'We accept Credit/Debit Cards (Visa, Mastercard), Mobile Money (MTN, Vodafone, AirtelTigo), Bank Transfer, and Cash on Delivery.' },
  { _id: '6', category: 'Payment', question: 'Is it safe to pay online?', answer: 'Absolutely. We use Paystack, Ghana\'s most trusted payment gateway, with 256-bit SSL encryption.' },
  { _id: '7', category: 'Products', question: 'Are all your products authentic?', answer: 'Yes. Every product is sourced from verified suppliers and undergoes quality checks before listing.' },
  { _id: '8', category: 'General', question: 'How do I track my order?', answer: 'Log into your account and visit "My Orders". You\'ll see real-time updates on your order status.' },
];

const CATEGORIES = ['All', 'General', 'Shipping', 'Returns', 'Payment', 'Products'];

const FAQPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: apiFaqs } = useQuery({
    queryKey: ['faqs'],
    queryFn: async () => { const res = await api.get('/faqs'); return res.data.data; },
  });

  const faqs = (apiFaqs?.length ? apiFaqs : FALLBACK_FAQS).filter(
    (f: { category: string }) => activeCategory === 'All' || f.category === activeCategory
  );

  return (
    <>
      <Helmet>
        <title>FAQ | JJ Vintage Collection</title>
        <meta name="description" content="Frequently asked questions about JJ Vintage Collection." />
      </Helmet>

      <div className="bg-black text-white py-16 text-center">
        <p className="text-gold-DEFAULT text-xs tracking-widest uppercase mb-2">Help Center</p>
        <h1 className="font-display font-bold text-4xl">Frequently Asked Questions</h1>
      </div>

      <div className="container-brand py-16 max-w-3xl">
        {/* Category Tabs */}
        <div className="flex gap-2 flex-wrap justify-center mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-xs font-medium tracking-wider uppercase transition-all ${activeCategory === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div className="space-y-2">
          {faqs.map((faq: { _id: string; question: string; answer: string }) => (
            <div key={faq._id} className="bg-white border border-gray-100">
              <button
                className="w-full flex items-center justify-between p-5 text-left"
                onClick={() => setOpenId(openId === faq._id ? null : faq._id)}
              >
                <span className="font-sans font-medium text-sm pr-4">{faq.question}</span>
                <motion.div animate={{ rotate: openId === faq._id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <FiChevronDown size={18} className="flex-shrink-0 text-gray-400" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openId === faq._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-sm text-gray-600 font-sans leading-relaxed border-t border-gray-50">
                      <div className="pt-4">{faq.answer}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 bg-gray-50 p-8">
          <p className="font-display font-bold text-xl mb-2">Still have questions?</p>
          <p className="text-gray-400 text-sm mb-4">Our team is happy to help</p>
          <a href="mailto:hello@jjvintage.com" className="btn-primary">Email Us</a>
        </div>
      </div>
    </>
  );
};

export default FAQPage;
