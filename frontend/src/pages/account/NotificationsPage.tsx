import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiBell, FiPackage, FiTag, FiUser, FiSettings, FiAlertCircle } from 'react-icons/fi';
import api from '../../services/api';
import { formatRelativeTime } from '../../utils/helpers';
import toast from 'react-hot-toast';
import type { Notification } from '../../types';

const typeIcon: Record<string, React.ReactNode> = {
  order: <FiPackage size={16} />,
  promotion: <FiTag size={16} />,
  account: <FiUser size={16} />,
  system: <FiSettings size={16} />,
  stock: <FiAlertCircle size={16} />,
};

const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => { const res = await api.get('/notifications'); return res.data.data; },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
  });

  const deleteNotif = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <Helmet><title>Notifications | JJ Vintage Collection</title></Helmet>

      <div className="bg-gray-50 min-h-screen">
        <div className="bg-black text-white py-14">
          <div className="container-brand">
            <p className="text-gold-DEFAULT text-xs tracking-widest uppercase mb-2">Account</p>
            <h1 className="font-display font-bold text-3xl">Notifications</h1>
          </div>
        </div>

        <div className="container-brand py-10 max-w-2xl">
          {notifications.length > 0 && (
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">{unreadCount} unread</p>
              {unreadCount > 0 && (
                <button onClick={() => markAllRead.mutate()} className="text-xs text-gold-DEFAULT hover:underline">
                  Mark all as read
                </button>
              )}
            </div>
          )}

          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 rounded" />)
            ) : notifications.length === 0 ? (
              <div className="bg-white py-16 text-center">
                <FiBell size={40} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && markRead.mutate(n._id)}
                  className={`bg-white p-4 flex gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'border-l-4 border-gold-DEFAULT' : ''}`}
                >
                  <div className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${!n.isRead ? 'bg-black text-gold-DEFAULT' : 'bg-gray-100 text-gray-500'}`}>
                    {typeIcon[n.type] || <FiBell size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.isRead ? 'font-semibold text-black' : 'text-gray-700'}`}>{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-300 mt-1">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotif.mutate(n._id); }}
                    className="text-gray-200 hover:text-red-400 transition-colors self-start mt-1"
                  >×</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;
