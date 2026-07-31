import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { authService } from '../../services/authService';

const schema = z.object({
  password: z.string().min(8, 'Min 8 characters').regex(/[A-Z]/, 'Need uppercase').regex(/[0-9]/, 'Need number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ password }: { password: string; confirmPassword: string }) => {
    try {
      await authService.resetPassword(token!, password);
      toast.success('Password reset! Please login.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reset link expired. Request a new one.');
    }
  };

  return (
    <>
      <Helmet><title>Reset Password | JJ Vintage Collection</title></Helmet>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white p-8 shadow-sm">
          <h1 className="font-display font-bold text-2xl mb-2">Set New Password</h1>
          <p className="text-gray-400 text-sm mb-6">Choose a strong password for your account.</p>
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            <div>
              <label className="input-label">New Password</label>
              <div className="relative">
                <input {...register('password')} type={showPwd ? 'text' : 'password'} className={`input-field pr-12 ${errors.password ? 'input-error' : ''}`} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                  {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
            </div>
            <div>
              <label className="input-label">Confirm Password</label>
              <input {...register('confirmPassword')} type="password" className={`input-field ${errors.confirmPassword ? 'input-error' : ''}`} />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message as string}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
            <p className="text-center text-sm text-gray-400">
              <Link to="/login" className="hover:text-black">Back to Login</Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
