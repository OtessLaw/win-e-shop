import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiMinus, FiPlus, FiTag, FiShoppingBag } from 'react-icons/fi';
import { useCart } from '../../contexts/CartContext';
import { orderService } from '../../services/orderService';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const DELIVERY_FEE = 20;

const CartPage: React.FC = () => {
  const { items, removeItem, updateQuantity, subtotal, itemCount } = useCart();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const data = await orderService.validateCoupon(couponCode, subtotal);
      setDiscount(data.discount);
      setAppliedCoupon(couponCode);
      toast.success(`Coupon applied! You saved ${formatCurrency(data.discount)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setDiscount(0);
    setAppliedCoupon('');
    setCouponCode('');
  };

  const deliveryFee = subtotal >= 200 ? 0 : DELIVERY_FEE;
  const total = subtotal - discount + deliveryFee;

  if (items.length === 0) {
    return (
      <>
        <Helmet><title>Cart | JJ Vintage Collection</title></Helmet>
        <div className="container-brand py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <FiShoppingBag size={64} className="mx-auto text-gray-200 mb-6" />
            <h2 className="font-display text-3xl font-bold mb-3">Your cart is empty</h2>
            <p className="text-gray-400 font-sans mb-8">Looks like you haven't added anything yet. Start shopping!</p>
            <Link to="/shop" className="btn-primary">Start Shopping</Link>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>{`Cart (${itemCount}) | JJ Vintage Collection`}</title></Helmet>

      <div className="bg-gray-50 py-10 min-h-screen">
        <div className="container-brand">
          <h1 className="font-display text-3xl font-bold mb-8">Shopping Cart <span className="text-gray-400 font-sans text-xl font-normal">({itemCount} items)</span></h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={`${item.productId}-${item.color}-${item.size}`}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="bg-white p-5 flex gap-4"
                  >
                    <Link to={`/product/${item.slug}`} className="flex-shrink-0">
                      <img src={item.image || '/placeholder.jpg'} alt={item.name} className="w-24 h-32 object-cover" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link to={`/product/${item.slug}`} className="font-medium text-black hover:text-gold-DEFAULT transition-colors text-sm leading-tight line-clamp-2">{item.name}</Link>
                          <p className="text-xs text-gray-400 mt-1">{item.color} · Size {item.size}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId, item.color, item.size)}
                          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border border-gray-200">
                          <button onClick={() => updateQuantity(item.productId, item.color, item.size, item.quantity - 1)} className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors">
                            <FiMinus size={13} />
                          </button>
                          <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, item.color, item.size, Math.min(item.stock, item.quantity + 1))} className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors">
                            <FiPlus size={13} />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-black">{formatCurrency(item.price * item.quantity)}</p>
                          {item.quantity > 1 && <p className="text-xs text-gray-400">{formatCurrency(item.price)} each</p>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors mt-4">
                ← Continue Shopping
              </Link>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              {/* Coupon */}
              <div className="bg-white p-5">
                <h3 className="font-sans font-semibold text-sm mb-4 flex items-center gap-2"><FiTag size={15} className="text-gold-DEFAULT" />Coupon Code</h3>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2.5">
                    <span className="text-sm font-mono font-bold text-green-700">{appliedCoupon}</span>
                    <button onClick={removeCoupon} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-0">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon"
                      className="input-field flex-1 text-sm uppercase font-mono"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode}
                      className="bg-black text-white px-4 text-xs font-medium hover:bg-gold-DEFAULT hover:text-black transition-colors disabled:opacity-40"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-white p-5">
                <h3 className="font-sans font-semibold mb-5">Order Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery</span>
                    <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                      {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  {subtotal < 200 && (
                    <p className="text-xs text-gray-400">Add {formatCurrency(200 - subtotal)} more for free delivery!</p>
                  )}
                  <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/checkout', { state: { discount, couponCode: appliedCoupon } })}
                  className="btn-primary w-full mt-6"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartPage;
