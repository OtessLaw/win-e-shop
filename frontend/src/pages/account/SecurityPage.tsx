import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { FiLock, FiShield } from 'react-icons/fi';
import { authService } from '../../services/authService';

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(8, 'Min 8 characters').regex(/[A-Z]/, 'Need uppercase').regex(/[0-9]/, 'Need number'),
  confirmNewPassword: z.string(),
}).refine(d => d.newPassword === d.confirmNewPassword, { message: "Passwords don't match", path: ['confirmNewPassword'] });

type FormData = z.infer<typeof schema>;

const SecurityPage: React.FC = () => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await authService.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed successfully!');
      reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <>
      <Helmet><title>Security | JJ Vintage Collection</title></Helmet>

      <div className="bg-gray-50 min-h-screen">
        <div className="bg-black text-white py-14">
          <div className="container-brand">
            <p className="text-gold-DEFAULT text-xs tracking-widest uppercase mb-2">Account</p>
            <h1 className="font-display font-bold text-3xl">Security</h1>
          </div>
        </div>

        <div className="container-brand py-10 max-w-2xl">
          <div className="bg-white p-8">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
              <div className="w-10 h-10 bg-black text-gold-DEFAULT flex items-center justify-center">
                <FiLock size={18} />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl">Change Password</h2>
                <p className="text-sm text-gray-400">Choose a strong, unique password</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="input-label">Current Password *</label>
                <input {...register('currentPassword')} type="password" className={`input-field ${errors.currentPassword ? 'input-error' : ''}`} />
                {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>}
              </div>
              <div>
                <label className="input-label">New Password *</label>
                <input {...register('newPassword')} type="password" className={`input-field ${errors.newPassword ? 'input-error' : ''}`} />
                {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
              </div>
              <div>
                <label className="input-label">Confirm New Password *</label>
                <input {...register('confirmNewPassword')} type="password" className={`input-field ${errors.confirmNewPassword ? 'input-error' : ''}`} />
                {errors.confirmNewPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmNewPassword.message}</p>}
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 p-3">
                <FiShield size={14} className="text-gold-DEFAULT" />
                <span>Use at least 8 characters with uppercase letters and numbers</span>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default SecurityPage;
