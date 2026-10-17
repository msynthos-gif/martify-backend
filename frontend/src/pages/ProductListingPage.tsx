import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { publicApi } from '../api/public.api';
import type { Category, Product } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';

const PAGE_SIZE = 40;

export const ProductListingPage: React.FC = () => {
  const { slug, collection } = useParams<{ slug?: string; collection?: string }>();
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');

  const isNewArrivals = collection === 'new-arrivals' || filterParam === 'new-arrivals';

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    slug && slug !== 'all' ? [slug] : []
  );
  const [maxPrice, setMaxPrice] = useState<number>(200);
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState<number>(200);
  const [sortBy, setSortBy] = useState<string>(isNewArrivals ? 'newest' : 'featured');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Sync category filter when URL slug changes
  useEffect(() => {
    if (slug && slug !== 'all') {
      setSelectedCategories([slug]);
    } else {
      setSelectedCategories([]);
    }
  }, [slug]);

  // Debounce price slider changes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMaxPrice(maxPrice);
    }, 250);
    return () => clearTimeout(handler);
  }, [maxPrice]);

  // Load categories once
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const catsData = await publicApi.getCategories();
        setCategories(catsData);
      } catch (err: any) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Fetch initial page when filters change
  const fetchInitialProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPage(1);
    try {
      const categoryParam =
        selectedCategories.length > 0
          ? selectedCategories.join(',')
          : slug && slug !== 'all'
          ? slug
          : undefined;

      const result = await publicApi.getProductsWithPagination({
        categorySlug: categoryParam,
        filter: isNewArrivals ? 'new-arrivals' : undefined,
        limit: PAGE_SIZE,
        page: 1,
        sort: sortBy,
        maxPrice: debouncedMaxPrice < 200 ? debouncedMaxPrice : undefined,
      });

      setProducts(result.products);
      setHasMore(result.meta.hasMore);
      setTotalCount(result.meta.total);
    } catch (err: any) {
      setError(err?.friendlyMessage || 'Failed to load catalog products.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategories, slug, isNewArrivals, sortBy, debouncedMaxPrice]);

  useEffect(() => {
    fetchInitialProducts();
  }, [fetchInitialProducts]);

  // Load more products for infinite scroll
  const loadMoreProducts = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const categoryParam =
        selectedCategories.length > 0
          ? selectedCategories.join(',')
          : slug && slug !== 'all'
          ? slug
          : undefined;

      const result = await publicApi.getProductsWithPagination({
        categorySlug: categoryParam,
        filter: isNewArrivals ? 'new-arrivals' : undefined,
        limit: PAGE_SIZE,
        page: nextPage,
        sort: sortBy,
        maxPrice: debouncedMaxPrice < 200 ? debouncedMaxPrice : undefined,
      });

      setProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newItems = result.products.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newItems];
      });

      setPage(nextPage);
      setHasMore(result.meta.hasMore);
      setTotalCount(result.meta.total);
    } catch (err: any) {
      console.error('Failed to load more products:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, page, selectedCategories, slug, isNewArrivals, sortBy, debouncedMaxPrice]);

  // Infinite scroll IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreProducts();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMoreProducts, hasMore, loading, loadingMore]);

  const handleCategoryToggle = (categorySlug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categorySlug)
        ? prev.filter((s) => s !== categorySlug)
        : [...prev, categorySlug]
    );
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setMaxPrice(200);
    setSortBy(isNewArrivals ? 'newest' : 'featured');
  };

  // Deduplicate exclusively by product ID (preserves all distinct seller inventory items)
  const displayProducts = useMemo(() => {
    const seenIds = new Set<string>();
    return products.filter((p) => {
      if (seenIds.has(p.id)) return false;
      seenIds.add(p.id);
      return true;
    });
  }, [products]);

  const activeCategoryName = useMemo(() => {
    if (isNewArrivals) {
      return 'NEW ARRIVALS';
    }
    if (selectedCategories.length === 1) {
      const match = categories.find((c) => c.slug === selectedCategories[0]);
      return match ? match.name : 'Catalog Products';
    }
    if (selectedCategories.length > 1) {
      return `Multiple Categories (${selectedCategories.length})`;
    }
    return 'All Products';
  }, [isNewArrivals, selectedCategories, categories]);

  return (
    <div className="bg-white min-h-screen pb-24 text-slate-800">
      {/* Breadcrumb Header */}
      <div className="border-b border-slate-200 bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link to="/" className="hover:text-[#0F172A] transition-colors">
              Home
            </Link>
            <span>/</span>
            {isNewArrivals ? (
              <>
                <span className="text-slate-400">Collections</span>
                <span>/</span>
                <span className="text-[#0F172A] font-bold uppercase tracking-wider">
                  New Arrivals
                </span>
              </>
            ) : (
              <span className="text-[#0F172A] font-bold uppercase tracking-wider">
                {activeCategoryName}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6 flex items-center justify-between">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-sm border border-slate-300 text-xs font-bold text-[#0F172A] bg-white hover:bg-slate-50 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#0F172A]" />
            <span>Filter Catalog</span>
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-sm border border-slate-300 text-xs font-bold text-[#0F172A] bg-white"
          >
            <option value="featured">Sort: Featured</option>
            <option value="newest">Sort: Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="title-asc">Alphabetical: A-Z</option>
          </select>
        </div>

        {/* Desktop Layout: Fixed Sidebar + Full Product Area */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Sidebar Filters */}
          <aside className="hidden lg:block w-60 xl:w-64 shrink-0 bg-white border border-slate-200 rounded-sm p-6 sticky top-28 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 tracking-wider uppercase">
                FILTERS
              </h3>
              {(selectedCategories.length > 0 || maxPrice < 200) && (
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold text-[#0F172A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>

            {/* Category Checkboxes */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-900 tracking-wider uppercase block">
                CATEGORIES
              </span>
              <div className="space-y-2.5">
                {categories.map((category) => {
                  const isChecked = selectedCategories.includes(category.slug);
                  return (
                    <label
                      key={category.id}
                      className="flex items-center justify-between group cursor-pointer text-xs font-medium text-slate-700 hover:text-[#0F172A]"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleCategoryToggle(category.slug)}
                          className="w-4 h-4 rounded-sm border-slate-300 text-[#0F172A] focus:ring-[#0F172A] cursor-pointer accent-[#0F172A]"
                        />
                        <span className={isChecked ? 'font-bold text-[#0F172A]' : ''}>
                          {category.name}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 tracking-wider uppercase">
                  MAX PRICE
                </span>
                <span className="text-xs font-bold text-[#0F172A]">
                  ${maxPrice}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-sm appearance-none cursor-pointer accent-[#0F172A]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono">
                <span>$10</span>
                <span>$100</span>
                <span>$200+</span>
              </div>
            </div>
          </aside>

          {/* Right Product Area */}
          <main className="flex-1 min-w-0">
            {/* Desktop Top Bar */}
            <div className="hidden lg:flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
                  {activeCategoryName}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isNewArrivals
                    ? 'Curated releases and verified inventory added in the past 24 hours.'
                    : totalCount > 0
                    ? `Showcasing inventory across verified marketplace sellers (${totalCount} products)`
                    : 'Showcasing authentic catalog & multi-seller collections.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">SORT BY:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 rounded-sm border border-slate-300 text-xs font-bold text-[#0F172A] bg-white focus:outline-none focus:border-[#0F172A] cursor-pointer"
                >
                  <option value="featured">Featured Collection (Balanced)</option>
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="title-asc">Alphabetical: A-Z</option>
                </select>
              </div>
            </div>

            {/* Loading & Error States */}
            {loading && <LoadingSpinner size="lg" message="Loading catalog items..." />}
            {error && <ErrorState message={error} onRetry={fetchInitialProducts} />}

            {/* Empty State */}
            {!loading && !error && displayProducts.length === 0 && (
              <div className="border border-slate-200 rounded-sm p-16 text-center bg-white">
                <h4 className="text-base font-bold text-slate-900 tracking-tight">
                  {isNewArrivals
                    ? 'No new drops in the last 24 hours. Check back soon.'
                    : 'No matching products found'}
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  {isNewArrivals
                    ? 'All products in this collection are strictly limited to verified releases from the past 24 hours.'
                    : 'Try adjusting your price range slider or clearing active category filters.'}
                </p>
                <div className="mt-5">
                  {isNewArrivals ? (
                    <Link
                      to="/categories/all"
                      className="inline-block px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors"
                    >
                      Browse All Products
                    </Link>
                  ) : (
                    <button
                      onClick={handleResetFilters}
                      className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Responsive Product Grid: Standard 4 columns on desktop, 3 on tablet, 2 on mobile */}
            {!loading && !error && displayProducts.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {displayProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Infinite Scroll Sentinel */}
                <div ref={sentinelRef} className="h-10 w-full pointer-events-none" />

                {/* Subsequent Batch Loading Micro-Indicator */}
                {loadingMore && (
                  <div className="py-8 flex justify-center items-center gap-3">
                    <div className="w-5 h-5 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Loading more products...
                    </span>
                  </div>
                )}

                {/* Explicit Interactive Load More Option */}
                {hasMore && !loadingMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={loadMoreProducts}
                      className="px-8 py-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-sm text-xs font-bold text-[#0F172A] uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                    >
                      Load More Products ({displayProducts.length} of {totalCount})
                    </button>
                  </div>
                )}

                {/* Catalog Fully Loaded Footer Indicator */}
                {!hasMore && displayProducts.length > 0 && (
                  <div className="mt-12 py-6 text-center border-t border-slate-200">
                    <p className="text-xs font-medium text-slate-500">
                      Showing all {displayProducts.length} products from verified active sellers across the marketplace.
                    </p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-xs lg:hidden">
          <div className="w-full max-w-xs bg-white h-full ml-auto p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 tracking-wider uppercase">
                  FILTERS
                </h3>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 text-slate-400 hover:text-[#0F172A]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-900 tracking-wider uppercase block">
                  CATEGORIES
                </span>
                <div className="space-y-2.5">
                  {categories.map((category) => {
                    const isChecked = selectedCategories.includes(category.slug);
                    return (
                      <label
                        key={category.id}
                        className="flex items-center gap-2.5 text-xs font-medium text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleCategoryToggle(category.slug)}
                          className="w-4 h-4 rounded-sm border-slate-300 text-[#0F172A] accent-[#0F172A]"
                        />
                        <span className={isChecked ? 'font-bold text-[#0F172A]' : ''}>
                          {category.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Price Slider */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 tracking-wider uppercase">
                    MAX PRICE
                  </span>
                  <span className="text-xs font-bold text-[#0F172A]">
                    ${maxPrice}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-sm appearance-none cursor-pointer accent-[#0F172A]"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-3 rounded-sm border border-slate-300 text-xs font-semibold text-[#0F172A]"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 py-3 rounded-sm bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
