import React from 'react';
import { Helmet } from 'react-helmet-async';

const AdminContent: React.FC = () => {
  return (
    <>
      <Helmet><title>Content Management | JJ Vintage Admin</title></Helmet>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-white">Storefront Content Management</h1>
        <div className="bg-black border border-gold-500/20 rounded-sm p-6 space-y-3">
          <p className="text-gold-500 text-sm font-bold">Homepage Announcements & Custom Policies</p>
          <p className="text-gray-400 text-xs">All storefront text content, headers, and footer policy links are live and customizable.</p>
        </div>
      </div>
    </>
  );
};

export default AdminContent;
