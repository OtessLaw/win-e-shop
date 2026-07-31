import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

const RegisterPage: React.FC = () => {
  const [showPwd, setShowPwd] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const pwd = watch('password', '');
  const strength = [pwd.length >= 8, /[A-Z]/.test(pwd), /[0-9]/.test(pwd), /[^A-Za-z0-9]/.test(pwd)].filter(Boolean).length;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400'][strength];

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data.name, data.email, data.password, data.phone);
      toast.success('Account created! Welcome to JJ Vintage ✨');
      navigate('/account');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Create Account | JJ Vintage Collection</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-10">
            <Link to="/">
              <div className="font-display font-bold text-2xl tracking-widest">JJ VINTAGE</div>
              <div className="text-xs text-gold-DEFAULT tracking-widest">COLLECTION</div>
            </Link>
          </div>

          <div className="bg-white p-8 shadow-sm">
            <h1 className="font-display font-bold text-2xl mb-1">Create Account</h1>
            <p className="text-gray-400 text-sm font-sans mb-6">Join JJ Vintage and enjoy exclusive offers.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="input-label">Full Name *</label>
                <input {...register('name')} className={`input-field ${errors.name ? 'input-error' : ''}`} placeholder="John Doe" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="input-label">Email Address *</label>
                <input {...register('email')} type="email" className={`input-field ${errors.email ? 'input-error' : ''}`} placeholder="you@example.com" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="input-label">Phone Number <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                <input {...register('phone')} className="input-field" placeholder="+233..." />
              </div>

              <div>
                <label className="input-label">Password *</label>
                <div className="relative">
                  <input {...register('password')} type={showPwd ? 'text' : 'password'} className={`input-field pr-12 ${errors.password ? 'input-error' : ''}`} placeholder="Min. 8 characters" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors">
                    {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {pwd && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">Strength: <span className="font-medium text-gray-700">{strengthLabel}</span></p>
                  </div>
                )}
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="input-label">Confirm Password *</label>
                <input {...register('confirmPassword')} type="password" className={`input-field ${errors.confirmPassword ? 'input-error' : ''}`} placeholder="Repeat password" />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <p className="text-xs text-gray-400">By creating an account, you agree to our <Link to="/terms" className="underline hover:text-black">Terms</Link> and <Link to="/privacy" className="underline hover:text-black">Privacy Policy</Link>.</p>

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-black font-medium hover:text-gold-DEFAULT transition-colors">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default RegisterPage;
