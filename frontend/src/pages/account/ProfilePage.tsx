import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import type { User } from '../../types';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<User>) => authService.updateProfile(data),
    onSuccess: (updated) => {
      updateUser(updated);
      toast.success('Profile updated!');
    },
    onError: () => toast.error('Update failed'),
  });

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <>
      <Helmet><title>Profile | JJ Vintage Collection</title></Helmet>

      <div className="bg-gray-50 min-h-screen">
        <div className="bg-black text-white py-14">
          <div className="container-brand">
            <p className="text-gold-DEFAULT text-xs tracking-widest uppercase mb-2">Account</p>
            <h1 className="font-display font-bold text-3xl">My Profile</h1>
          </div>
        </div>

        <div className="container-brand py-10 max-w-2xl">
          <div className="bg-white p-8">
            {/* Avatar */}
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
              <div className="w-20 h-20 bg-black text-gold-DEFAULT rounded-full flex items-center justify-center text-2xl font-display font-bold">
                {user?.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" /> : initials}
              </div>
              <div>
                <h2 className="font-display font-bold text-xl">{user?.name}</h2>
                <p className="text-gray-400 text-sm">{user?.email}</p>
                <p className="text-xs text-gold-DEFAULT mt-1 capitalize">{user?.role?.label || 'Customer'}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit((data) => mutation.mutate(data as Partial<User>))} className="space-y-5">
              <div>
                <label className="input-label">Full Name</label>
                <input {...register('name', { required: true })} className="input-field" />
              </div>
              <div>
                <label className="input-label">Email Address <span className="text-gray-400 normal-case font-normal">(cannot change)</span></label>
                <input value={user?.email} disabled className="input-field bg-gray-50 text-gray-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="input-label">Phone Number</label>
                <input {...register('phone')} className="input-field" placeholder="+233..." />
              </div>
              <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary">
                {isSubmitting || mutation.isPending ? 'Saving...' : 'Update Profile'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
