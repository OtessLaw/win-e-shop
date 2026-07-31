import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const AdminAnalytics: React.FC = () => {
  const { data: salesChart = [] } = useQuery({
    queryKey: ['admin-sales-chart'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/sales-chart?days=30');
      return res.data.data;
    },
  });

  return (
    <>
      <Helmet><title>Analytics | JJ Vintage Admin</title></Helmet>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-white">Sales & Revenue Analytics</h1>
        <div className="bg-black border border-gold-500/20 rounded-sm p-6 space-y-4">
          <h2 className="font-sans font-bold text-gold-500 text-sm tracking-wider uppercase">Revenue Last 30 Days (GHS)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="date" stroke="#666" fontSize={11} />
                <YAxis stroke="#666" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#C9A227', color: '#fff' }} />
                <Line type="monotone" dataKey="revenue" stroke="#C9A227" strokeWidth={3} dot={{ fill: '#C9A227' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminAnalytics;
