import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { FiSliders, FiSearch, FiX } from 'react-icons/fi';
import { productService } from '../../services/productService';
import ProductCard from '../../components/product/ProductCard';
import api from '../../services/api';
import type { Category, ProductFilters } from '../../types';

interface ShopPageProps {
  gender?: string;
  categorySlug?: string;
  newArrival?: boolean;
  bestSeller?: boolean;
  flashSale?: boolean;
}

const ShopPage: React.FC<ShopPageProps> = ({ gender, categorySlug, newArrival, bestSeller, flashSale }) => {
  const [searchParams] = useSearchParams();
  const [, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState<ProductFilters>({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    gender: gender || searchParams.get('gender') || '',
    minPrice: undefined,
    maxPrice: undefined,
    sort: 'newest',
    newArrival,
    bestSeller,
    flashSale,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const res = await api.get('/categories'); return res.data.data; },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', filters, page],
    queryFn: () => productService.getProducts({ ...filters, page, limit: 20 }),
  });

  const updateFilter = (key: keyof ProductFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', gender: gender || '', sort: 'newest', newArrival, bestSeller, flashSale });
    setPage(1);
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
  ];

  const getPageTitle = () => {
    if (flashSale) return 'Flash Sale';
    if (bestSeller) return 'Best Sellers';
    if (newArrival) return 'New Arrivals';
    if (gender === 'men') return "Men's Collection";
    if (gender === 'women') return "Women's Collection";
    if (categorySlug === 'shoes') return 'Shoes';
    if (categorySlug === 'accessories') return 'Accessories';
    return 'Shop All';
  };

  return (
    <>
      <Helmet>
        <title>{getPageTitle()} | JJ Vintage Collection</title>
        <meta name="description" content={`Browse our ${getPageTitle().toLowerCase()} collection at JJ Vintage Collection.`} />
      </Helmet>

      {/* Page Banner */}
      <div className="bg-black text-white py-16 text-center">
        <p className="text-gold-DEFAULT text-xs tracking-widest uppercase font-sans mb-2">Browse</p>
        <h1 className="font-display font-bold text-4xl">{getPageTitle()}</h1>
        {data?.pagination && (
          <p className="text-gray-400 text-sm font-sans mt-2">{data.pagination.total} products</p>
        )}
      </div>

      <div className="container-brand py-10">
        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-8">
              <div>
                <h3 className="font-sans font-semibold text-sm tracking-wider uppercase mb-4">Search</h3>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    placeholder="Search products..."
                    className="input-field pl-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-sans font-semibold text-sm tracking-wider uppercase mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map((cat: Category) => (
                    <label key={cat._id} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="radio"
                        name="category"
                        value={cat._id}
                        checked={filters.category === cat._id}
                        onChange={() => updateFilter('category', filters.category === cat._id ? '' : cat._id)}
                        className="accent-black"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-black transition-colors">{cat.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">({cat.productCount})</span>
                    </label>
                  ))}
                </div>
              </div>

              {!gender && (
                <div>
                  <h3 className="font-sans font-semibold text-sm tracking-wider uppercase mb-4">Gender</h3>
                  <div className="space-y-2">
                    {['men', 'women', 'unisex'].map((g) => (
                      <label key={g} className="flex items-center gap-2.5 cursor-pointer group">
                        <input type="radio" name="gender" value={g} checked={filters.gender === g} onChange={() => updateFilter('gender', filters.gender === g ? '' : g)} className="accent-black" />
                        <span className="text-sm text-gray-600 capitalize group-hover:text-black transition-colors">{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-sans font-semibold text-sm tracking-wider uppercase mb-4">Price Range</h3>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={filters.minPrice || ''} onChange={(e) => updateFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)} className="input-field w-full text-sm" />
                  <input type="number" placeholder="Max" value={filters.maxPrice || ''} onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)} className="input-field w-full text-sm" />
                </div>
              </div>

              <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-black flex items-center gap-1.5 transition-colors">
                <FiX size={12} />Clear all filters
              </button>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {/* Sort Bar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden flex items-center gap-2 text-sm font-medium"
              >
                <FiSliders size={16} />Filters
              </button>
              <div className="flex items-center gap-3 ml-auto">
                <span className="text-xs text-gray-400 font-sans">Sort by:</span>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="text-sm font-medium border-0 bg-transparent focus:outline-none cursor-pointer"
                >
                  {sortOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="skeleton w-full aspect-[3/4] rounded" />
                    <div className="skeleton h-4 w-3/4 rounded" />
                    <div className="skeleton h-4 w-1/2 rounded" />
                  </div>
                ))}
              </div>
            ) : data?.data.length === 0 ? (
              <div className="text-center py-24">
                <p className="font-display text-2xl text-gray-300 mb-2">No products found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters</p>
                <button onClick={clearFilters} className="btn-primary mt-6">Clear Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {data?.data.map((product, i) => (
                  <ProductCard key={product._id} product={product} index={i} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {data?.pagination && data.pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <button disabled={!data.pagination.hasPrevPage} onClick={() => setPage(p => p - 1)} className="px-6 py-3 border border-gray-200 text-sm hover:border-black transition-colors disabled:opacity-30">Previous</button>
                <span className="px-6 py-3 bg-black text-white text-sm">{page} / {data.pagination.pages}</span>
                <button disabled={!data.pagination.hasNextPage} onClick={() => setPage(p => p + 1)} className="px-6 py-3 border border-gray-200 text-sm hover:border-black transition-colors disabled:opacity-30">Next</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ShopPage;
