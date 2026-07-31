import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiTrash2, FiUpload } from 'react-icons/fi';
import api from '../../services/api';
import { productService } from '../../services/productService';
import toast from 'react-hot-toast';

const AdminBanners: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  // State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [link, setLink] = useState('/shop');
  const [cta, setCta] = useState('Shop Collection');
  const [position, setPosition] = useState('hero');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { data: banners = [] } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const res = await api.get('/banners?position=hero');
      return res.data.data;
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsUploading(true);
    try {
      const files = Array.from(e.target.files);
      const uploaded = await productService.uploadImages(files);
      if (uploaded.length > 0) {
        setImageUrl(uploaded[0].url);
        toast.success('Banner image uploaded & link generated! ✨');
      }
    } catch (err: any) {
      toast.error('Image upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: title.trim() || 'New Vintage Drop 2026',
        subtitle: subtitle.trim() || 'Exclusive Ghana vintage fashion collection.',
        link: link.trim() || '/shop',
        cta: cta.trim() || 'Shop Collection',
        position,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80&fit=crop',
        isActive: true,
      };
      return api.post('/banners', payload);
    },
    onSuccess: () => {
      toast.success('Promotional Banner created live!');
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      setShowForm(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create banner');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/banners/${id}`),
    onSuccess: () => {
      toast.success('Banner removed');
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    },
  });

  const resetForm = () => {
    setTitle('');
    setSubtitle('');
    setLink('/shop');
    setCta('Shop Collection');
    setPosition('hero');
    setImageUrl('');
  };

  return (
    <>
      <Helmet><title>Banners & Promotional Sliders | JJ Vintage Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Live Banners & Promotional Slider</h1>
            <p className="text-xs text-gold-500 font-mono">Upload high-res promotional banners directly to the store homepage.</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-gold-500 hover:bg-gold-400 text-black font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-sm flex items-center gap-2 transition-colors shadow-lg"
          >
            <FiPlus size={16} /> Add Promo Banner
          </button>
        </div>

        {/* Upload Form */}
        {showForm && (
          <div className="bg-black border border-gold-500/30 rounded-sm p-6 space-y-4 shadow-2xl">
            <h2 className="font-display text-lg font-bold text-gold-500 pb-2 border-b border-gold-500/20">
              Create Promotional Banner
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label text-gold-500/90">Banner Title (e.g. Easter Drop 2026)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Redefine Your Style"
                  className="input-field bg-gray-900 border-gray-800 text-white focus:border-gold-500"
                />
              </div>

              <div>
                <label className="input-label text-gold-500/90">Subtitle / Tagline</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Premium vintage fashion curated for Ghana."
                  className="input-field bg-gray-900 border-gray-800 text-white focus:border-gold-500"
                />
              </div>

              <div>
                <label className="input-label text-gold-500/90">Target Click Link URL</label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="e.g. /shop?category=men"
                  className="input-field bg-gray-900 border-gray-800 text-white focus:border-gold-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="input-label text-gold-500/90">Button CTA Text</label>
                <input
                  type="text"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  placeholder="e.g. Shop Now"
                  className="input-field bg-gray-900 border-gray-800 text-white focus:border-gold-500"
                />
              </div>

              {/* Image Upload */}
              <div className="col-span-2 space-y-2">
                <label className="input-label text-gold-500/90">Banner Image File (or Image URL)</label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Paste Image URL or click Upload Button below"
                    className="input-field bg-gray-900 border-gray-800 text-white focus:border-gold-500 text-xs flex-1"
                  />
                  <label className="bg-gold-500 hover:bg-gold-400 text-black font-bold text-xs px-4 py-2.5 rounded-sm flex items-center gap-2 cursor-pointer transition-colors shrink-0">
                    {isUploading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <FiUpload size={16} />}
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                {imageUrl && (
                  <div className="h-32 w-full border border-gold-500/30 rounded overflow-hidden mt-2 relative">
                    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 right-2 bg-black/80 text-gold-400 text-[10px] font-mono px-2 py-1 rounded">Image Loaded</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="btn-secondary text-black border-black hover:bg-black hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || isUploading}
                className="bg-gold-500 hover:bg-gold-400 text-black font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-sm transition-colors"
              >
                {createMutation.isPending ? 'Saving...' : 'Publish Banner'}
              </button>
            </div>
          </div>
        )}

        {/* Existing Banners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((b: any) => (
            <div key={b._id} className="bg-black border border-gold-500/20 rounded-sm overflow-hidden shadow-xl space-y-3">
              <div className="h-40 bg-gray-900 overflow-hidden relative">
                <img src={b.imageUrl || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80&fit=crop'} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => deleteMutation.mutate(b._id)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-md"
                  title="Remove Banner"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
              <div className="p-4 space-y-1">
                <span className="text-[10px] font-mono text-gold-500 uppercase tracking-widest">Active Slider</span>
                <h3 className="font-display text-lg font-bold text-white">{b.title}</h3>
                <p className="text-xs text-gray-400 font-sans">{b.subtitle}</p>
                <div className="pt-2 flex justify-between items-center text-xs font-mono text-gold-400">
                  <span>Link: {b.link}</span>
                  <span className="bg-gold-500/10 border border-gold-500/30 px-2 py-0.5 rounded">CTA: {b.cta}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default AdminBanners;
