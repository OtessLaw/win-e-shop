import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import api from '../../services/api';

const ContactPage: React.FC = () => {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      await api.post('/contact', data);
      toast.success('Message sent! We\'ll get back to you within 24 hours.');
      setSent(true);
      reset();
    } catch {
      toast.error('Failed to send message. Please try emailing us directly.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Us | JJ Vintage Collection</title>
        <meta name="description" content="Get in touch with JJ Vintage Collection. We're here to help." />
      </Helmet>

      <div className="bg-black text-white py-16 text-center">
        <p className="text-gold-DEFAULT text-xs tracking-widest uppercase mb-2">Get In Touch</p>
        <h1 className="font-display font-bold text-4xl">Contact Us</h1>
      </div>

      <div className="container-brand py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Info */}
          <div>
            <h2 className="font-display font-bold text-2xl mb-6">We'd Love to Hear From You</h2>
            <p className="text-gray-500 font-sans mb-8 leading-relaxed">
              Have a question about an order, product, or just want to say hello? Our team is here to help.
            </p>
            <div className="space-y-6">
              {[
                { Icon: FiMapPin, label: 'Location', value: 'Accra, Ghana 🇬🇭' },
                { Icon: FiPhone, label: 'Phone', value: '+233 00 000 0000' },
                { Icon: FiMail, label: 'Email', value: 'hello@jjvintage.com' },
                { Icon: FiClock, label: 'Hours', value: 'Mon–Sat, 9am – 6pm GMT' },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex gap-4">
                  <div className="w-10 h-10 bg-black text-gold-DEFAULT flex items-center justify-center flex-shrink-0">
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-sans font-medium tracking-wider uppercase text-gray-400 mb-1">{label}</p>
                    <p className="font-sans text-black">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-gray-50 p-8">
            {sent ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">💬</div>
                <h3 className="font-display font-bold text-xl mb-2">Message Sent!</h3>
                <p className="text-gray-400 text-sm">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Name *</label>
                    <input {...register('name', { required: true })} className="input-field" />
                  </div>
                  <div>
                    <label className="input-label">Email *</label>
                    <input {...register('email', { required: true })} type="email" className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="input-label">Subject *</label>
                  <input {...register('subject', { required: true })} className="input-field" placeholder="How can we help?" />
                </div>
                <div>
                  <label className="input-label">Message *</label>
                  <textarea {...register('message', { required: true })} rows={6} className="input-field resize-none" placeholder="Tell us more..." />
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
