import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiCheck, FiCreditCard, FiSmartphone, FiDollarSign, FiLock, FiMapPin, FiNavigation } from 'react-icons/fi';
import { io, Socket } from 'socket.io-client';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { orderService } from '../../services/orderService';
import { formatCurrency } from '../../utils/helpers';

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern',
  'Northern', 'Volta', 'Bono', 'Bono East', 'Savannah',
  'Upper East', 'Upper West', 'Oti', 'North East', 'Western North',
  'Ahafo',
];

const addressSchema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  phone: z.string().min(10, 'Valid phone number required'),
  email: z.string().email('Valid email required'),
  region: z.string().min(1, 'Region required'),
  city: z.string().min(2, 'City required'),
  address: z.string().min(5, 'Address required'),
  gpsAddress: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  mapUrl: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

const PAYMENT_METHODS = [
  { id: 'paystack_card', label: 'Credit / Debit Card', Icon: FiCreditCard, desc: 'Visa, Mastercard, Verve' },
  { id: 'paystack_mobile_money', label: 'Mobile Money', Icon: FiSmartphone, desc: 'MTN, Vodafone, AirtelTigo' },
  { id: 'cash_on_delivery', label: 'Cash on Delivery', Icon: FiDollarSign, desc: 'Pay when you receive' },
];

const CheckoutPage: React.FC = () => {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { discount = 0, couponCode = '' } = (location.state as { discount: number; couponCode: string }) || {};

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState('paystack_card');
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express' | 'pickup'>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressData, setAddressData] = useState<AddressFormData | null>(null);

  const deliveryFee = deliveryMethod === 'express' ? 40 : deliveryMethod === 'pickup' ? 0 : subtotal >= 200 ? 0 : 20;
  const total = subtotal - discount + deliveryFee;

  const { register, handleSubmit, formState: { errors } } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number; mapUrl: string } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setUserCoords({ latitude, longitude, mapUrl });
        setIsLocating(false);
        toast.success('Live GPS coordinates captured!');
      },
      () => {
        setIsLocating(false);
        toast.error('Unable to fetch live location. Check browser location permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleStep1 = (data: AddressFormData) => {
    const fullData = {
      ...data,
      ...(userCoords ? { latitude: userCoords.latitude, longitude: userCoords.longitude, mapUrl: userCoords.mapUrl } : {}),
    };
    setAddressData(fullData);
    setStep(2);
  };

  const handleStep2 = () => setStep(3);

  const handlePlaceOrder = async () => {
    if (!addressData || !items.length) return;
    setIsSubmitting(true);

    try {
      const orderItems = items.map((i) => ({
        productId: i.productId,
        color: i.color,
        size: i.size,
        quantity: i.quantity,
      }));

      const result = await orderService.createOrder({
        items: orderItems,
        shippingAddress: addressData,
        deliveryMethod,
        paymentMethod,
        couponCode: couponCode || undefined,
      });

      const { order } = result;

      // Start continuous background GPS watching for live Uber tracking
      if (navigator.geolocation) {
        const socket: Socket = io('http://localhost:5000', { withCredentials: true });
        navigator.geolocation.watchPosition(
          (pos) => {
            socket.emit('customer:location_update', {
              orderId: order._id,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              speed: pos.coords.speed || 0,
            });
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
      }

      // Initiate Paystack payment for online methods
      if (paymentMethod !== 'cash_on_delivery' && (window as any).PaystackPop) {
        const handler = (window as any).PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          email: addressData.email,
          amount: Math.round(total * 100), // in pesewas
          currency: 'GHS',
          ref: order._id,
          callback: async (response: { reference: string }) => {
            try {
              await orderService.verifyPayment(response.reference, order._id);
              clearCart();
              navigate(`/order-confirmation/${order._id}`, { replace: true });
            } catch {
              toast.error('Payment verification failed. Contact support.');
            }
          },
          onClose: () => {
            toast('Payment cancelled. Order saved — you can pay later.', { icon: 'ℹ️' });
            clearCart();
            navigate(`/account/orders/${order._id}`);
          },
        });
        handler.openIframe();
      } else {
        // Cash on delivery or Paystack unavailable
        clearCart();
        navigate(`/order-confirmation/${order._id}`, { replace: true });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Order failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const steps = [
    { num: 1, label: 'Address' },
    { num: 2, label: 'Payment' },
    { num: 3, label: 'Review' },
  ];

  return (
    <>
      <Helmet><title>Checkout | JJ Vintage Collection</title></Helmet>

      <div className="bg-gray-50 min-h-screen py-10">
        <div className="container-brand max-w-5xl">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-10">
            {steps.map((s, i) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${step >= s.num ? 'bg-black text-white' : 'bg-white border-2 border-gray-200 text-gray-400'}`}>
                    {step > s.num ? <FiCheck size={15} /> : s.num}
                  </div>
                  <span className={`text-xs tracking-widest uppercase font-sans ${step >= s.num ? 'text-black' : 'text-gray-400'}`}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-px w-16 md:w-24 mx-2 mb-4 transition-colors ${step > s.num ? 'bg-black' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form Area */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="bg-white p-6 space-y-5">
                      <h2 className="font-display font-bold text-xl">Delivery Address</h2>
                      <form onSubmit={handleSubmit(handleStep1)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 sm:col-span-1">
                            <label className="input-label">Full Name *</label>
                            <input {...register('fullName')} className={`input-field ${errors.fullName ? 'input-error' : ''}`} />
                            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <label className="input-label">Phone Number *</label>
                            <input {...register('phone')} className={`input-field ${errors.phone ? 'input-error' : ''}`} placeholder="+233..." />
                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                          </div>
                        </div>
                        <div>
                          <label className="input-label">Email Address *</label>
                          <input {...register('email')} className={`input-field ${errors.email ? 'input-error' : ''}`} />
                          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="input-label">Region *</label>
                            <select {...register('region')} className={`input-field ${errors.region ? 'input-error' : ''}`}>
                              <option value="">Select region</option>
                              {GHANA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region.message}</p>}
                          </div>
                          <div>
                            <label className="input-label">City *</label>
                            <input {...register('city')} className={`input-field ${errors.city ? 'input-error' : ''}`} />
                            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                          </div>
                        </div>
                        <div>
                          <label className="input-label">Street Address *</label>
                          <input {...register('address')} className={`input-field ${errors.address ? 'input-error' : ''}`} placeholder="House/Apt number, Street name" />
                          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                        </div>
                        <div>
                          <label className="input-label">GPS Address <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                          <input {...register('gpsAddress')} className="input-field" placeholder="e.g. GE-123-4567" />
                        </div>

                        {/* Live Location Auto-Detect Button */}
                        <div className="bg-black text-white p-4 border border-gold-DEFAULT/40 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FiMapPin className="text-gold-DEFAULT" size={18} />
                              <span className="font-semibold text-xs tracking-wider uppercase text-gold-DEFAULT">Pin Live Delivery Location</span>
                            </div>
                            {userCoords && (
                              <span className="text-[10px] bg-gold-DEFAULT text-black font-bold px-2 py-0.5 rounded">
                                GPS Captured ✓
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-300">
                            Allow location access so our dispatch team can pinpoint your exact house live on Google Maps.
                          </p>
                          <button
                            type="button"
                            onClick={handleDetectLocation}
                            disabled={isLocating}
                            className="bg-gold-DEFAULT hover:bg-gold-hover text-black font-bold text-xs py-2 px-4 w-full flex items-center justify-center gap-2 transition-colors"
                          >
                            <FiNavigation size={14} />
                            {isLocating ? 'Detecting Live Coordinates...' : userCoords ? 'Location Pinned! (Click to Re-detect)' : 'Pin My Live Location on Map'}
                          </button>
                        </div>

                        <div>
                          <label className="input-label">Delivery Method</label>
                          <div className="grid grid-cols-3 gap-3 mt-2">
                            {[
                              { id: 'standard', label: 'Standard', price: subtotal >= 200 ? 'Free' : 'GHS 20', days: '3-5 days' },
                              { id: 'express', label: 'Express', price: 'GHS 40', days: '1-2 days' },
                              { id: 'pickup', label: 'Pickup', price: 'Free', days: 'Same day' },
                            ].map(({ id, label, price, days }) => (
                              <label key={id} className={`border p-3 cursor-pointer transition-all ${deliveryMethod === id ? 'border-black bg-black/5' : 'border-gray-200 hover:border-gray-400'}`}>
                                <input type="radio" name="delivery" value={id} checked={deliveryMethod === id as any} onChange={() => setDeliveryMethod(id as any)} className="hidden" />
                                <p className="font-medium text-sm">{label}</p>
                                <p className="text-xs text-gold-DEFAULT font-medium">{price}</p>
                                <p className="text-xs text-gray-400">{days}</p>
                              </label>
                            ))}
                          </div>
                        </div>

                        <button type="submit" className="btn-primary w-full mt-2">Continue to Payment</button>
                      </form>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="bg-white p-6 space-y-5">
                      <h2 className="font-display font-bold text-xl">Payment Method</h2>
                      <div className="space-y-3">
                        {PAYMENT_METHODS.map(({ id, label, Icon, desc }) => (
                          <label
                            key={id}
                            className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${paymentMethod === id ? 'border-black bg-black/5' : 'border-gray-200 hover:border-gray-400'}`}
                          >
                            <input type="radio" name="payment" value={id} checked={paymentMethod === id} onChange={() => setPaymentMethod(id)} className="accent-black" />
                            <div className="w-9 h-9 bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Icon size={18} className="text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{label}</p>
                              <p className="text-xs text-gray-400">{desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                        <button onClick={handleStep2} className="btn-primary flex-1">Review Order</button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="bg-white p-6 space-y-5">
                      <h2 className="font-display font-bold text-xl">Review Your Order</h2>

                      {/* Address */}
                      <div className="border border-gray-100 p-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-semibold tracking-wider uppercase text-gray-400">Delivery Address</p>
                          <button onClick={() => setStep(1)} className="text-xs text-gold-DEFAULT hover:underline">Edit</button>
                        </div>
                        {addressData && (
                          <div className="text-sm text-gray-700 space-y-0.5">
                            <p className="font-medium">{addressData.fullName}</p>
                            <p>{addressData.address}, {addressData.city}</p>
                            <p>{addressData.region} · {addressData.phone}</p>
                          </div>
                        )}
                      </div>

                      {/* Payment */}
                      <div className="border border-gray-100 p-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-semibold tracking-wider uppercase text-gray-400">Payment</p>
                          <button onClick={() => setStep(2)} className="text-xs text-gold-DEFAULT hover:underline">Edit</button>
                        </div>
                        <p className="text-sm text-gray-700">{PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}</p>
                      </div>

                      {/* Items */}
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div key={`${item.productId}-${item.color}-${item.size}`} className="flex gap-3">
                            <img src={item.image} alt={item.name} className="w-14 h-14 object-cover flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                              <p className="text-xs text-gray-400">{item.color} · {item.size} · Qty {item.quantity}</p>
                            </div>
                            <p className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <FiLock size={12} />
                        <span>Your payment is secured and encrypted</span>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
                        <button
                          onClick={handlePlaceOrder}
                          disabled={isSubmitting}
                          className="btn-gold flex-1"
                        >
                          {isSubmitting ? 'Processing...' : `Place Order · ${formatCurrency(total)}`}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Order Summary Sidebar */}
            <div className="space-y-4">
              <div className="bg-white p-5 sticky top-24">
                <h3 className="font-sans font-semibold mb-4">Order Summary</h3>
                <div className="space-y-3 max-h-56 overflow-y-auto scrollbar-hide mb-4">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.color}-${item.size}`} className="flex gap-3">
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium line-clamp-1">{item.name}</p>
                        <p className="text-xs text-gray-400">×{item.quantity}</p>
                      </div>
                      <p className="text-xs font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span>{deliveryFee === 0 ? 'Free' : formatCurrency(deliveryFee)}</span></div>
                  {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(discount)}</span></div>}
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                    <span>Total</span><span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
