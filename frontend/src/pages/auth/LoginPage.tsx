import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

const LoginPage: React.FC = () => {
  const [showPwd, setShowPwd] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const loggedInUser = await login(data.email.trim(), data.password);
      toast.success('Welcome back!');
      
      const adminRoles = ['super_admin', 'admin', 'product_manager', 'order_manager', 'customer_support', 'marketing_manager', 'accountant'];
      const userRole = loggedInUser?.role?.name || '';
      
      const from = (location.state as any)?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (adminRoles.includes(userRole)) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/account', { replace: true });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    }
  };

  return (
    <>
      <Helmet>
        <title>Login | JJ Vintage Collection</title>
        <meta name="description" content="Login to your JJ Vintage Collection account" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex">
        {/* Left – decorative */}
        <div className="hidden lg:flex lg:w-1/2 bg-black text-white flex-col justify-end p-16 relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80&fit=crop"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          <div className="relative z-10">
            <div className="mb-6">
              <div className="font-display font-bold text-3xl tracking-widest">JJ VINTAGE</div>
              <div className="text-xs text-gold-500 tracking-widest">COLLECTION</div>
            </div>
            <p className="font-display text-4xl font-bold leading-tight mb-4">
              Premium Fashion<br />for the Bold
            </p>
            <p className="text-gray-400 font-sans">Log in to access your account, track orders, and manage your wishlist.</p>
          </div>
        </div>

        {/* Right – form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="lg:hidden text-center mb-10">
              <div className="font-display font-bold text-2xl tracking-widest">JJ VINTAGE</div>
              <div className="text-xs text-gold-500 tracking-widest">COLLECTION</div>
            </div>

            <h1 className="font-display font-bold text-3xl mb-2">Welcome Back</h1>
            <p className="text-gray-400 font-sans text-sm mb-8">Sign in to your account to continue.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="input-label">Email Address</label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className={`input-field ${errors.email ? 'input-error' : ''}`}
                  placeholder="you@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="input-label">Password</label>
                  <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-black transition-colors">Forgot password?</Link>
                </div>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`input-field pr-12 ${errors.password ? 'input-error' : ''}`}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors">
                    {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input {...register('remember')} type="checkbox" className="w-4 h-4 accent-black" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <p className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-black font-medium hover:text-gold-500 transition-colors">
                Create one
              </Link>
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-400 justify-center mt-6">
              <FiLock size={12} />
              <span>Secured with 256-bit encryption</span>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
