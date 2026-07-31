import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiX, FiUpload, FiCheckCircle, FiLink, FiExternalLink } from 'react-icons/fi';
import { productService } from '../../services/productService';
import api from '../../services/api';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '38', '39', '40', '41', '42', '43', '44', '45'];

const AdminProductForm: React.FC = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form State
  const [name, setName] = useState('');
  const [gender, setGender] = useState('men');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [uploadedImages, setUploadedImages] = useState<{ url: string; publicId: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Variants State
  const [variants, setVariants] = useState<Array<{
    color: string;
    colorHex: string;
    sizes: Array<{ size: string; stock: string; sku: string }>;
  }>>([
    {
      color: 'Default',
      colorHex: '#000000',
      sizes: [
        { size: 'M', stock: '10', sku: '' },
        { size: 'L', stock: '5', sku: '' },
      ],
    },
  ]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const res = await api.get('/categories'); return res.data.data; },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => { const res = await api.get('/brands'); return res.data.data; },
  });

  useQuery({
    queryKey: ['product-edit', id],
    queryFn: async () => {
      if (!id) return null;
      const prod = await productService.getProduct(id);
      if (prod) {
        setName(prod.name || '');
        setGender(prod.gender || 'men');
        setCategory(typeof prod.category === 'object' ? prod.category._id : (prod.category || ''));
        setBrand(typeof prod.brand === 'object' ? prod.brand._id : (prod.brand || ''));
        setShortDescription(prod.shortDescription || '');
        setDescription(prod.description || '');
        setPrice(prod.price ? String(prod.price) : '');
        setCompareAtPrice(prod.compareAtPrice ? String(prod.compareAtPrice) : '');
        setUploadedImages(prod.images || []);
        if (prod.variants && prod.variants.length > 0) {
          setVariants(prod.variants.map((v) => ({
            color: v.color || 'Default',
            colorHex: v.colorHex || '#000000',
            sizes: (v.sizes || []).map((s) => ({
              size: s.size || 'M',
              stock: String(s.stock ?? 0),
              sku: s.sku || '',
            })),
          })));
        }
      }
      return prod;
    },
    enabled: isEdit,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsUploading(true);
    try {
      const files = Array.from(e.target.files);
      const uploaded = await productService.uploadImages(files);
      setUploadedImages((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} image(s) uploaded & URL generated automatically! ✨`);
    } catch (err: any) {
      console.error('IMAGE UPLOAD ERROR:', err);
      const msg = err.response?.data?.message || err.message || 'Image upload failed';
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const parsePostimagesUrl = (rawUrl: string): string => {
    let url = rawUrl.trim();
    if (url.includes('postimg.cc') && !url.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
      const match = url.match(/postimg\.cc\/([A-Za-z0-9]+)/);
      if (match && match[1]) {
        url = `https://i.postimg.cc/${match[1]}/image.jpg`;
      }
    }
    return url;
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    const directUrl = parsePostimagesUrl(imageUrlInput);
    const newImg = { url: directUrl, publicId: `url-${Date.now()}` };
    setUploadedImages((prev) => [...prev, newImg]);
    setImageUrlInput('');
    toast.success('Postimages / External image link added! ✨');
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const defaultCategory = categories.length > 0 ? categories[0]._id : undefined;
      const selectedCategory = category || defaultCategory;

      const formattedVariants = variants.map((v) => ({
        color: v.color || 'Default',
        colorHex: v.colorHex || '#000000',
        sizes: v.sizes.map((s, si) => ({
          size: s.size || 'M',
          stock: Number(s.stock) || 0,
          sku: s.sku || `SKU-${Date.now()}-${si}`,
        })),
        images: [],
      }));

      const payload = {
        name: name.trim() || 'JJ Vintage Luxury Product',
        gender: gender || 'men',
        category: selectedCategory,
        brand: brand || undefined,
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim() || name.trim() || 'JJ Vintage luxury collection item.',
        price: Number(price) > 0 ? Number(price) : 100,
        compareAtPrice: Number(compareAtPrice) > 0 ? Number(compareAtPrice) : undefined,
        images: uploadedImages.length > 0 ? uploadedImages : [{ url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800', publicId: 'default-placeholder' }],
        variants: formattedVariants,
        isActive: true,
        isNewArrival: true,
      };

      return isEdit ? productService.updateProduct(id!, payload as never) : productService.createProduct(payload as never);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated successfully!' : 'Product created successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/admin/products');
    },
    onError: (err: any) => {
      console.error('PRODUCT SAVE ERROR:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save product';
      toast.error(msg);
    },
  });

  const handleCreateButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    mutation.mutate();
  };

  const addSizeRow = (variantIndex: number) => {
    setVariants((prev) => prev.map((v, i) => i === variantIndex ? {
      ...v,
      sizes: [...v.sizes, { size: 'L', stock: '10', sku: '' }],
    } : v));
  };

  const removeSizeRow = (variantIndex: number, sizeIndex: number) => {
    setVariants((prev) => prev.map((v, i) => i === variantIndex ? {
      ...v,
      sizes: v.sizes.filter((_, j) => j !== sizeIndex),
    } : v));
  };

  return (
    <>
      <Helmet><title>{isEdit ? 'Edit' : 'Add'} Product | JJ Vintage Admin</title></Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-black">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-ghost text-gray-500 hover:text-black">← Back</button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-black text-white border border-gold-500/20 rounded-sm p-6 space-y-5 shadow-xl">
            <h2 className="font-sans font-semibold text-gold-500 pb-3 border-b border-gold-500/20 text-lg tracking-wide uppercase">Basic Information</h2>
            <div>
              <label className="input-label text-gold-500/90">Product Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field bg-gray-900 border-gray-800 text-white placeholder-gray-500 focus:border-gold-500"
                placeholder="e.g. Premium Vintage Shirt"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label text-gold-500/90">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="input-field bg-gray-900 border-gray-800 text-white focus:border-gold-500">
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="unisex">Unisex</option>
                  <option value="kids">Kids</option>
                </select>
              </div>
              <div>
                <label className="input-label text-gold-500/90">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field bg-gray-900 border-gray-800 text-white focus:border-gold-500">
                  <option value="">Select category (optional)</option>
                  {categories.map((c: { _id: string; name: string }) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="input-label text-gold-500/90">Brand</label>
              <select value={brand} onChange={(e) => setBrand(e.target.value)} className="input-field bg-gray-900 border-gray-800 text-white focus:border-gold-500">
                <option value="">No brand</option>
                {brands.map((b: { _id: string; name: string }) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label text-gold-500/90">Short Description</label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="input-field bg-gray-900 border-gray-800 text-white placeholder-gray-500 focus:border-gold-500"
                placeholder="Brief 1-sentence summary"
              />
            </div>
            <div>
              <label className="input-label text-gold-500/90">Full Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="input-field bg-gray-900 border-gray-800 text-white placeholder-gray-500 focus:border-gold-500"
                placeholder="Detailed product specifications..."
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-black text-white border border-gold-500/20 rounded-sm p-6 space-y-5 shadow-xl">
            <h2 className="font-sans font-semibold text-gold-500 pb-3 border-b border-gold-500/20 text-lg tracking-wide uppercase">Pricing</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label text-gold-500/90">Price (GHS)</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input-field bg-gray-900 border-gray-800 text-white placeholder-gray-500 focus:border-gold-500"
                  placeholder="e.g. 250"
                />
              </div>
              <div>
                <label className="input-label text-gold-500/90">Compare at Price (GHS)</label>
                <input
                  type="number"
                  step="0.01"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  className="input-field bg-gray-900 border-gray-800 text-white placeholder-gray-500 focus:border-gold-500"
                  placeholder="e.g. 300"
                />
              </div>
            </div>
          </div>

          {/* Product Images Section */}
          <div className="bg-black text-white border border-gold-500/20 rounded-sm p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gold-500/20">
              <div>
                <h2 className="font-sans font-semibold text-gold-500 text-lg tracking-wide uppercase">Product Images</h2>
                <p className="text-xs text-gray-400 mt-0.5">Upload picture files directly or paste Postimages URL links below.</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-black bg-gold-500 px-3 py-1 rounded-sm font-sans">{uploadedImages.length} Picture(s)</span>
            </div>

            {/* Postimages Link Generator Button & Input Box */}
            <div className="bg-gray-900 border border-gold-500/30 p-4 rounded-sm space-y-3">
              <div className="flex items-center justify-between">
                <label className="input-label text-gold-500 font-semibold flex items-center gap-1.5 mb-0">
                  <FiLink className="text-gold-500" size={16} /> Option A: Postimages.org Link Box
                </label>
                <a
                  href="https://postimages.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-gold-400 hover:text-gold-300 font-medium flex items-center gap-1 bg-black border border-gold-500/30 px-3 py-1 rounded-sm transition-colors"
                >
                  🌐 Open Postimages Website <FiExternalLink size={12} />
                </a>
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddImageUrl(); } }}
                  placeholder="Paste Postimages Direct Link (e.g. https://i.postimg.cc/xxx/image.jpg)"
                  className="input-field bg-black border-gray-800 text-white placeholder-gray-500 focus:border-gold-500 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="bg-gold-500 hover:bg-gold-600 text-black font-bold text-sm px-5 py-2.5 rounded-sm whitespace-nowrap transition-colors shadow-sm"
                >
                  Add Link
                </button>
              </div>
              <p className="text-[11px] text-gray-400">Click <b>"Open Postimages Website"</b> to upload your picture on Postimages, then copy the <b>Direct Link</b> (starts with <code className="bg-black text-gold-400 px-1 py-0.5 border border-gray-800 rounded">https://i.postimg.cc/...</code>) and paste it above!</p>
            </div>

            {/* Direct Device Upload Box */}
            <div className="space-y-2 pt-2">
              <label className="input-label text-gold-500 font-semibold flex items-center gap-1.5 mb-0">
                <FiUpload className="text-gold-500" size={16} /> Option B: 1-Click Direct File Upload
              </label>

              <div className="grid grid-cols-4 gap-4">
                {uploadedImages.map((img, i) => (
                  <div key={i} className="relative aspect-square border-2 border-gold-500/40 rounded-sm overflow-hidden bg-gray-900 group shadow-md">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-black/85 text-[10px] text-gold-400 p-1.5 truncate flex items-center justify-between font-mono">
                      <span className="truncate flex items-center gap-1"><FiCheckCircle className="text-gold-500 shrink-0" size={10} /> URL Ready</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedImages((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:bg-red-700 transition-colors"
                      title="Remove image"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ))}

                <label className="aspect-square border-2 border-dashed border-gold-500/40 hover:border-gold-500 bg-gray-900/60 hover:bg-gold-500/10 flex flex-col items-center justify-center cursor-pointer transition-all rounded-sm p-4 text-center group">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-gold-500 font-semibold">Generating URL...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-black border border-gold-500/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <FiUpload className="text-gold-500" size={20} />
                      </div>
                      <span className="text-xs font-semibold text-white group-hover:text-gold-500 transition-colors">Upload Picture</span>
                      <span className="text-[10px] text-gold-500/70 mt-1 font-mono font-bold">Auto URL Generation</span>
                    </>
                  )}
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Variants & Stock Quantities Section */}
          <div className="bg-black text-white border border-gold-500/20 rounded-sm p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gold-500/20">
              <div>
                <h2 className="font-sans font-semibold text-gold-500 text-lg tracking-wide uppercase">Color Variants & Stock Quantities</h2>
                <p className="text-xs text-gray-400 mt-0.5">Set size and stock quantity for each color variant.</p>
              </div>
              <button
                type="button"
                onClick={() => setVariants((prev) => [...prev, { color: 'Default', colorHex: '#000000', sizes: [{ size: 'M', stock: '10', sku: '' }] }])}
                className="text-xs bg-gold-500 hover:bg-gold-600 text-black font-bold px-3 py-1.5 rounded-sm flex items-center gap-1 transition-colors"
              >
                <FiPlus size={14} /> Add Color Variant
              </button>
            </div>

            {variants.map((variant, vi) => (
              <div key={vi} className="border border-gray-800 p-5 rounded-sm space-y-4 bg-gray-900/60">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-gold-500/90 font-mono uppercase">Color Swatch:</label>
                    <input
                      type="color"
                      value={variant.colorHex}
                      onChange={(e) => {
                        const val = e.target.value;
                        setVariants((prev) => prev.map((v, i) => i === vi ? { ...v, colorHex: val } : v));
                      }}
                      className="w-9 h-9 rounded border border-gray-700 p-0.5 cursor-pointer bg-black"
                    />
                    <input
                      type="text"
                      value={variant.color}
                      onChange={(e) => {
                        const val = e.target.value;
                        setVariants((prev) => prev.map((v, i) => i === vi ? { ...v, color: val } : v));
                      }}
                      className="input-field bg-black border-gray-800 text-white w-48 focus:border-gold-500 text-sm"
                      placeholder="Color Name (e.g. Black)"
                    />
                  </div>

                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setVariants((prev) => prev.filter((_, i) => i !== vi))}
                      className="text-red-400 hover:text-red-500 text-xs flex items-center gap-1"
                    >
                      <FiTrash2 size={14} /> Remove Color
                    </button>
                  )}
                </div>

                {/* Size & Stock Inputs Table Header */}
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-3 text-xs font-mono text-gold-500 uppercase tracking-wider px-1">
                    <span className="col-span-4">Size</span>
                    <span className="col-span-4">Stock Quantity</span>
                    <span className="col-span-3">SKU (Optional)</span>
                    <span className="col-span-1 text-center">Action</span>
                  </div>

                  {variant.sizes.map((s, si) => (
                    <div key={si} className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-4">
                        <select
                          value={s.size}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariants((prev) => prev.map((v, i) => i === vi ? {
                              ...v,
                              sizes: v.sizes.map((sz, j) => j === si ? { ...sz, size: val } : sz),
                            } : v));
                          }}
                          className="input-field bg-black border-gray-800 text-white text-sm focus:border-gold-500"
                        >
                          {SIZES.map((sz) => <option key={sz} value={sz}>{sz}</option>)}
                        </select>
                      </div>

                      <div className="col-span-4">
                        <input
                          type="number"
                          min="0"
                          value={s.stock}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariants((prev) => prev.map((v, i) => i === vi ? {
                              ...v,
                              sizes: v.sizes.map((sz, j) => j === si ? { ...sz, stock: val } : sz),
                            } : v));
                          }}
                          className="input-field bg-black border-gray-800 text-white text-sm font-bold focus:border-gold-500"
                          placeholder="Stock Quantity (e.g. 10)"
                        />
                      </div>

                      <div className="col-span-3">
                        <input
                          type="text"
                          value={s.sku}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariants((prev) => prev.map((v, i) => i === vi ? {
                              ...v,
                              sizes: v.sizes.map((sz, j) => j === si ? { ...sz, sku: val } : sz),
                            } : v));
                          }}
                          className="input-field bg-black border-gray-800 text-white text-sm focus:border-gold-500"
                          placeholder="SKU Code"
                        />
                      </div>

                      <div className="col-span-1 flex justify-center">
                        {variant.sizes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSizeRow(vi, si)}
                            className="text-red-400 hover:text-red-600 p-1"
                            title="Remove Size"
                          >
                            <FiX size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addSizeRow(vi)}
                    className="text-xs text-gold-400 hover:text-gold-300 font-medium flex items-center gap-1 mt-2"
                  >
                    <FiPlus size={14} /> Add Another Size / Stock Row
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => navigate('/admin/products')} className="btn-secondary text-black border-black hover:bg-black hover:text-white">Cancel</button>
            <button
              type="button"
              onClick={handleCreateButtonClick}
              disabled={mutation.isPending || isUploading}
              className="btn-gold font-bold cursor-pointer text-base px-8 py-3"
            >
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminProductForm;
