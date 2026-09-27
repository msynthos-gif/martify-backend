import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  ArrowRight,
} from 'lucide-react';
import { publicApi } from '../api/public.api';
import type { Product } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { deduplicateProducts } from '../utils/formatters';

const TRUST_BADGES = [
  {
    icon: Truck,
    title: 'Fast Shipping',
    subtitle: 'Dispatched in 24–48 hours',
  },
  {
    icon: ShieldCheck,
    title: 'Official Store & Sellers',
    subtitle: 'Authentic catalog & verified sellers',
  },
  {
    icon: RotateCcw,
    title: 'Hassle-Free Returns',
    subtitle: '30-day buyer protection policy',
  },
  {
    icon: Headphones,
    title: 'Direct Customer Support',
    subtitle: 'Message Support',
  },
];

const MARQUEE_BADGES = [...TRUST_BADGES, ...TRUST_BADGES];

interface PlaceholderDrop {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  categoryName: string;
}

const PLACEHOLDER_CARDS: PlaceholderDrop[] = [
  {
    id: 'placeholder-1',
    title: 'HEAVYWEIGHT BOX HOODIE',
    price: 85,
    imageUrl: '/images/banners/visual-outerwear.jpg',
    categoryName: 'OUTERWEAR',
  },
  {
    id: 'placeholder-2',
    title: 'OVERSIZED RELAXED TEE',
    price: 45,
    imageUrl: '/images/banners/visual-shirts.jpg',
    categoryName: 'SHIRTS',
  },
  {
    id: 'placeholder-3',
    title: 'CARGO UTILITY PANT',
    price: 95,
    imageUrl: '/images/banners/split-best-sellers.jpg',
    categoryName: 'BOTTOMS',
  },
  {
    id: 'placeholder-4',
    title: 'TECHNICAL NYLON CAP',
    price: 38,
    imageUrl: '/images/banners/split-new-arrivals.jpg',
    categoryName: 'ACCESSORIES',
  },
];

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const prodsData = await publicApi.getProducts();
      setProducts(prodsData);
    } catch (err: any) {
      setError(err?.friendlyMessage || 'Failed to load marketplace content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Deduplicate products to prevent clone products from duplicating
  const featuredProducts = deduplicateProducts(products);

  // Split into Section 1 (first 4) and Section 3 (next 4)
  const firstRowProducts = featuredProducts.slice(0, 4);
  const secondRowProducts =
    featuredProducts.length > 4 ? featuredProducts.slice(4, 8) : [];

  const renderProductGrid = (items: Product[], fallbackOffset: number = 0) => {
    const needed = Math.max(0, 4 - items.length);
    const placeholders = PLACEHOLDER_CARDS.slice(
      fallbackOffset,
      fallbackOffset + needed
    );

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        {placeholders.map((p) => (
          <div
            key={p.id}
            className="group flex flex-col bg-white rounded-none border border-slate-200 overflow-hidden transition-all duration-200 hover:border-slate-400"
          >
            <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
              <img
                src={p.imageUrl}
                alt={p.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
              />
              <div className="absolute top-2 left-2 z-10">
                <span className="inline-flex items-center px-2 py-0.5 rounded-none bg-[#0F172A] text-white text-[10px] font-bold tracking-wider uppercase">
                  UPCOMING DROP
                </span>
              </div>
            </div>
            <div className="p-3.5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  {p.categoryName}
                </span>
                <h3 className="text-sm font-bold text-slate-900 line-clamp-1 uppercase">
                  {p.title}
                </h3>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-black text-[#0F172A]">
                  ${p.price}.00
                </span>
                <span className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wider">
                  DROPPING SOON
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white min-h-screen text-[#0F172A] space-y-12 sm:space-y-18 pb-20 w-full max-w-[100vw] overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 1. FULL-WIDTH EDITORIAL LOOKBOOK HERO BANNER                              */}
      {/* ========================================================================= */}
      <section className="relative w-full h-[60vh] sm:h-[70vh] md:h-[85vh] min-h-[420px] max-h-[850px] overflow-hidden">
        {/* Full-Bleed High-Resolution Lifestyle Streetwear Photo with Top Framing */}
        <img
          src="/hero-streetwear.webp"
          alt="Martify Collection Lookbook"
          className="w-full h-full object-cover object-top"
          loading="eager"
          fetchPriority="high"
          width={1376}
          height={768}
        />

        {/* Minimal Bottom-Anchored Branding Overlay (Heads Clear at Top, Branding at Bottom) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/20 flex flex-col items-center justify-end pb-10 sm:pb-16 px-4">
          <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase text-center drop-shadow-md select-none font-sans leading-none px-2">
            MARTIFY COLLECTION.
          </h1>
          <Link
            to="/categories/all"
            className="mt-4 px-8 py-3.5 min-h-[44px] inline-flex items-center justify-center bg-white text-[#0F172A] font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-sm rounded-none sm:rounded-[2px]"
          >
            SHOP NOW
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. INFINITE CONTINUOUS RUNNING MARQUEE TICKER (4 Trust Badges)            */}
      {/* ========================================================================= */}
      <section className="border-y border-slate-200 bg-white py-4 sm:py-5 overflow-hidden w-full max-w-[100vw] select-none">
        <div className="w-full max-w-[100vw] overflow-hidden">
          <div className="flex w-max animate-marquee">
            {/* Track Half 1 */}
            <div className="flex items-center gap-12 sm:gap-16 pr-12 sm:pr-16 shrink-0">
              {MARQUEE_BADGES.map((badge, idx) => {
                const Icon = badge.icon;
                return (
                  <div key={`m1-${idx}`} className="flex items-center gap-3.5 shrink-0">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 text-[#0F172A] shadow-xs">
                      <Icon className="w-5 h-5 text-accent-orange" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#0F172A] tracking-wider uppercase whitespace-nowrap">
                        {badge.title}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-600 mt-0.5 whitespace-nowrap">
                        {badge.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Track Half 2 (Exact duplicate for seamless continuous infinite loop) */}
            <div className="flex items-center gap-12 sm:gap-16 pr-12 sm:pr-16 shrink-0" aria-hidden="true">
              {MARQUEE_BADGES.map((badge, idx) => {
                const Icon = badge.icon;
                return (
                  <div key={`m2-${idx}`} className="flex items-center gap-3.5 shrink-0">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 text-[#0F172A] shadow-xs">
                      <Icon className="w-5 h-5 text-accent-orange" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#0F172A] tracking-wider uppercase whitespace-nowrap">
                        {badge.title}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-600 mt-0.5 whitespace-nowrap">
                        {badge.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Loading & Error States */}
      {loading && <LoadingSpinner size="lg" message="Loading catalog..." />}
      {error && <ErrorState message={error} onRetry={loadData} />}

      {!loading && !error && (
        <>
          {/* ========================================================================= */}
          {/* SECTION 1: FIRST PRODUCT GRID ROW (FEATURED DROPS)                         */}
          {/* ========================================================================= */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6 pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0F172A] uppercase font-sans">
                  FEATURED DROPS
                </h2>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-medium">
                  Latest releases & seasonal technical essentials
                </p>
              </div>

              <Link
                to="/categories/all"
                className="text-xs font-black tracking-wider text-[#0F172A] hover:text-[#FF6B00] transition-colors uppercase inline-flex items-center gap-1"
              >
                <span>VIEW ALL</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {renderProductGrid(firstRowProducts, 0)}
          </section>

          {/* ========================================================================= */}
          {/* SECTION 2: 2-COLUMN SPLIT DROP BANNERS (Editorial Interstitial)           */}
          {/* ========================================================================= */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Card A: NEW ARRIVALS */}
              <div className="group relative h-[420px] sm:h-[480px] lg:h-[520px] rounded-none overflow-hidden bg-slate-900 border border-slate-200">
                <img
                  src="/images/banners/split-new-arrivals.jpg"
                  alt="New Arrivals Drop"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8 right-6 sm:right-8 text-white space-y-3">
                  <span className="text-[11px] font-bold text-[#FF6B00] uppercase tracking-widest block">
                    DROP 01 // 2026
                  </span>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white font-sans leading-none">
                    NEW ARRIVALS
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-300 font-normal tracking-wide max-w-sm">
                    Limited edition silhouettes, premium cottons, and technical outerwear.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/collections/new-arrivals"
                      className="inline-flex items-center justify-center min-h-[44px] px-7 py-3.5 bg-white hover:bg-slate-100 text-[#0F172A] text-xs font-black tracking-widest uppercase transition-colors rounded-[2px]"
                    >
                      SHOP NOW
                    </Link>
                  </div>
                </div>
              </div>

              {/* Card B: BEST SELLERS */}
              <div className="group relative h-[420px] sm:h-[480px] lg:h-[520px] rounded-none overflow-hidden bg-slate-900 border border-slate-200">
                <img
                  src="/images/banners/split-best-sellers.jpg"
                  alt="Best Sellers"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8 right-6 sm:right-8 text-white space-y-3">
                  <span className="text-[11px] font-bold text-[#FF6B00] uppercase tracking-widest block">
                    HIGH DEMAND
                  </span>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white font-sans leading-none">
                    BEST SELLERS
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-300 font-normal tracking-wide max-w-sm">
                    Verified customer favorites engineered for maximum everyday versatility.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/collections/best-sellers"
                      className="inline-flex items-center justify-center min-h-[44px] px-7 py-3.5 bg-[#FF6B00] hover:bg-[#e05d00] text-white text-xs font-black tracking-widest uppercase transition-colors rounded-[2px]"
                    >
                      SHOP NOW
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION 3: SECOND PRODUCT GRID ROW (CURATED ESSENTIALS)                   */}
          {/* ========================================================================= */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6 pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0F172A] uppercase font-sans">
                  CURATED ESSENTIALS
                </h2>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-medium">
                  Staple layers & utility catalog pieces
                </p>
              </div>

              <Link
                to="/categories/all"
                className="text-xs font-black tracking-wider text-[#0F172A] hover:text-[#FF6B00] transition-colors uppercase inline-flex items-center gap-1"
              >
                <span>VIEW ALL ({products.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {renderProductGrid(secondRowProducts, 2)}
          </section>

          {/* ========================================================================= */}
          {/* SECTION 4: WIDE LIFESTYLE INTERSTITIAL BANNER                             */}
          {/* ========================================================================= */}
          <section className="w-full relative overflow-hidden bg-black border-y border-slate-200">
            <div className="relative w-full h-[380px] sm:h-[460px] lg:h-[540px]">
              <img
                src="/images/banners/lifestyle-interstitial.jpg"
                alt="Martify Global Convenience"
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />

              <div className="absolute inset-0 flex flex-col justify-end">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14">
                  <div className="max-w-xl space-y-3 sm:space-y-4">
                    <span className="text-xs font-black uppercase tracking-widest text-[#FF6B00] block">
                      LOOKBOOK EDITION // VOL. 04
                    </span>
                    <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter uppercase text-white font-sans leading-[0.95]">
                      MARTIFY® GLOBAL CONVENIENCE<span className="text-[#FF6B00]">.</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-neutral-300 font-normal tracking-wide max-w-md">
                      Refined minimalist aesthetics paired with rugged durability. Built for urban exploration and everyday utility.
                    </p>
                    <div className="pt-2">
                      <Link
                        to="/categories/all"
                        className="inline-flex items-center justify-center min-h-[44px] px-9 py-3.5 bg-[#FF6B00] hover:bg-[#e05d00] text-white text-xs sm:text-sm font-black tracking-widest uppercase transition-colors rounded-[2px]"
                      >
                        SHOP NOW
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION 5: SUB-CATEGORY VISUAL GRID (Shirts & Outerwear)                  */}
          {/* ========================================================================= */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6 pb-2 border-b border-slate-200">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0F172A] uppercase font-sans">
                CATEGORY SPOTLIGHT
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: SHIRTS */}
              <div className="group relative h-[380px] sm:h-[460px] rounded-none overflow-hidden bg-slate-900 border border-slate-200">
                <img
                  src="/images/banners/visual-shirts.jpg"
                  alt="Streetwear Shirts"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8 right-6 sm:right-8 text-white space-y-2">
                  <span className="text-[11px] font-bold text-[#FF6B00] uppercase tracking-widest block">
                    CORE ESSENTIALS
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-sans">
                    SHIRTS
                  </h3>
                  <p className="text-xs text-neutral-300 font-normal tracking-wide max-w-sm">
                    Heavy-gauge boxy cuts, dropped shoulders, and ultra-soft combed cotton.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/collections/shirts"
                      className="inline-flex items-center justify-center min-h-[44px] px-7 py-3 bg-white hover:bg-slate-100 text-[#0F172A] text-xs font-black tracking-widest uppercase transition-colors rounded-[2px]"
                    >
                      SHOP NOW
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right: OUTERWEAR */}
              <div className="group relative h-[380px] sm:h-[460px] rounded-none overflow-hidden bg-slate-900 border border-slate-200">
                <img
                  src="/images/banners/visual-outerwear.jpg"
                  alt="Streetwear Outerwear"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8 right-6 sm:right-8 text-white space-y-2">
                  <span className="text-[11px] font-bold text-[#FF6B00] uppercase tracking-widest block">
                    TECHNICAL LAYERS
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-sans">
                    OUTERWEAR
                  </h3>
                  <p className="text-xs text-neutral-300 font-normal tracking-wide max-w-sm">
                    Weather-resistant windbreakers, structured fleece, and technical zip-ups.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/collections/outerwear"
                      className="inline-flex items-center justify-center min-h-[44px] px-7 py-3 bg-white hover:bg-slate-100 text-[#0F172A] text-xs font-black tracking-widest uppercase transition-colors rounded-[2px]"
                    >
                      SHOP NOW
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION 6: MINIMAL EDITORIAL PHOTO BANNER (MERCHANT CALLOUT)              */}
          {/* ========================================================================= */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative w-full h-[320px] md:h-[400px] rounded-none overflow-hidden border border-slate-200">
              {/* High-Resolution Editorial Streetwear / Lifestyle Background Photo */}
              <img
                src="/images/banners/merchant-callout-banner.jpg"
                alt="Merchant Callout Lookbook"
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />

              {/* Minimal Semi-Transparent Dark Overlay for High Button Contrast */}
              <div className="absolute inset-0 bg-black/35" />

              {/* Perfectly Centered Action Buttons (NO Typography) */}
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                  <Link
                    to="/seller/register"
                    className="w-full sm:w-auto min-w-[200px] min-h-[44px] px-8 py-3.5 bg-[#FF6B00] hover:bg-[#e05d00] text-white text-xs md:text-sm font-bold tracking-wider uppercase transition-colors rounded-[2px] flex items-center justify-center text-center shadow-lg"
                  >
                    APPLY AS SELLER
                  </Link>
                  <Link
                    to="/seller/login"
                    className="w-full sm:w-auto min-w-[200px] min-h-[44px] px-8 py-3.5 border border-white text-white hover:bg-white hover:text-[#0F172A] text-xs md:text-sm font-bold tracking-wider uppercase transition-colors rounded-[2px] flex items-center justify-center text-center shadow-lg"
                  >
                    MERCHANT PORTAL
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
