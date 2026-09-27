import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, CheckCircle2 } from 'lucide-react';
import { publicApi } from '../api/public.api';
import type { Product } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { getProductImageUrl } from '../utils/formatters';
import brandLogo from '../assets/logo.jpeg';

export const SellerStorefrontPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [seller, setSeller] = useState<{
    id: string;
    name: string;
    storeName?: string | null;
    storeDescription?: string | null;
    storeImageUrl?: string | null;
  } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');

  const loadStorefront = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await publicApi.getSellerStorefront(id);
      setSeller(data.seller);
      setProducts(data.products || []);
    } catch (err: any) {
      setError(err?.friendlyMessage || 'Failed to load seller storefront.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorefront();
  }, [id]);

  const isOfficialStore =
    seller?.name.toLowerCase().includes('martify collection official') ||
    seller?.name.toLowerCase().includes('official store') ||
    (seller?.storeName && seller.storeName.toLowerCase().includes('official'));

  const displayName = seller?.storeName || seller?.name || '';

  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === 'newest') {
      return list.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    }
    if (sortBy === 'price-asc') {
      return list.sort((a, b) => Number(a.price) - Number(b.price));
    }
    if (sortBy === 'price-desc') {
      return list.sort((a, b) => Number(b.price) - Number(a.price));
    }
    return list;
  }, [products, sortBy]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <LoadingSpinner size="lg" message="Loading storefront..." />
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <ErrorState
          message={error || 'Storefront not found or seller is inactive.'}
          onRetry={loadStorefront}
        />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-24 text-[#0F172A]">
      {/* 1. Top Navigation Breadcrumb */}
      <div className="bg-slate-50 border-b border-slate-200 py-2.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <Link
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-[#0F172A] transition-colors"
            to="/products"
          >
            ← Back to Marketplace
          </Link>
        </div>
      </div>

      {/* 2. Clean Seller Identity Header (Editorial Pure White) */}
      <section className="bg-white border-b border-slate-200 py-8 sm:py-10 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Seller Identity */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm bg-slate-50">
              {seller.storeImageUrl ? (
                <img
                  src={getProductImageUrl(seller.storeImageUrl)}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : isOfficialStore ? (
                <img
                  src={brandLogo}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl sm:text-2xl font-black text-[#0F172A] uppercase">
                  {displayName.charAt(0)}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-[#0F172A] font-sans">
                  {displayName}
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-none sm:rounded-[2px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {isOfficialStore ? 'OFFICIAL STORE' : 'VERIFIED MERCHANT'}
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-1.5 max-w-xl leading-relaxed">
                {seller.storeDescription ||
                  (isOfficialStore
                    ? 'The primary platform-curated catalog store. Guaranteed authentic inventory, direct platform fulfillment, and 30-day buyer protection.'
                    : 'Independent merchant operating on the Martify Collection marketplace with verified escrow protection.')}
              </p>
            </div>
          </div>

          {/* Right: Store Metrics & Action */}
          <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-8 shrink-0 w-full md:w-auto">
            <div className="shrink-0 text-left sm:text-center md:text-left">
              <span className="text-xl sm:text-2xl font-black text-[#0F172A] block leading-none">
                {products.length}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1 block whitespace-nowrap">
                ACTIVE LISTINGS
              </span>
            </div>

            <Link
              to="/categories/all"
              className="border border-[#0F172A] text-[#0F172A] hover:bg-[#0F172A] hover:text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors rounded-none sm:rounded-[2px] inline-flex items-center justify-center min-h-[44px] text-center shrink-0"
            >
              SHOP CATALOG
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Catalog Header & Controls */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">
              {isOfficialStore ? 'OFFICIAL STORE CATALOG' : 'STOREFRONT PRODUCTS'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {sortedProducts.length} active {sortedProducts.length === 1 ? 'item' : 'items'}
            </p>
          </div>

          {/* Sort Controls */}
          {products.length > 0 && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="store-sort"
                className="text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Sort:
              </label>
              <select
                id="store-sort"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'newest' | 'price-asc' | 'price-desc')
                }
                className="bg-white border border-slate-200 text-xs font-semibold text-[#0F172A] px-3 py-1.5 rounded-none sm:rounded-[2px] focus:outline-none focus:border-[#0F172A] cursor-pointer"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          )}
        </div>

        {/* 4. Product Grid & Editorial Empty State */}
        {sortedProducts.length === 0 ? (
          <div className="bg-white rounded-none sm:rounded-[2px] border border-slate-200 p-12 text-center max-w-md mx-auto my-12">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">
              NO PRODUCTS CURRENTLY LISTED
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              This seller hasn't published any items yet. Check back soon for new arrivals.
            </p>
            <Link
              to="/categories/all"
              className="inline-block px-6 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-none sm:rounded-[2px]"
            >
              EXPLORE ALL PRODUCTS
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  seller: product.seller || seller,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default SellerStorefrontPage;
