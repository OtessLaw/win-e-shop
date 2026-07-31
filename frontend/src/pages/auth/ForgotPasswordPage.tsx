import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiMail } from 'react-icons/fi';
import { authService } from '../../services/authService';

const ForgotPasswordPage: React.FC = () => {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ email: string }>();

  const onSubmit = async ({ email }: { email: string }) => {
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    }
  };

  return (
    <>
      <Helmet><title>Forgot Password | JJ Vintage Collection</title></Helmet>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-black text-gold-DEFAULT flex items-center justify-center mx-auto mb-4">
              <FiMail size={24} />
            </div>
            <h1 className="font-display font-bold text-2xl">Forgot Password?</h1>
            <p className="text-gray-400 text-sm font-sans mt-2">Enter your email and we'll send a reset link</p>
          </div>

          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📧</div>
              <h2 className="font-display font-bold text-xl mb-2">Check Your Inbox</h2>
              <p className="text-gray-400 text-sm mb-6">We've sent a password reset link to your email. Check your spam folder if you don't see it.</p>
              <Link to="/login" className="btn-primary w-full text-center block">Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="input-label">Email Address</label>
                <input {...register('email', { required: true })} type="email" className="input-field" placeholder="you@example.com" />
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </button>
              <p className="text-center text-sm text-gray-400">
                Remembered? <Link to="/login" className="text-black font-medium hover:text-gold-DEFAULT">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
