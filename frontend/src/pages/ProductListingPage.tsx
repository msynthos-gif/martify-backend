import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { publicApi } from '../api/public.api';
import type { Category, Product } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { formatPrice, deduplicateProducts } from '../utils/formatters';

export const ProductListingPage: React.FC = () => {
  const { slug, collection } = useParams<{ slug?: string; collection?: string }>();
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');

  const isNewArrivals = collection === 'new-arrivals' || filterParam === 'new-arrivals';

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    slug && slug !== 'all' ? [slug] : []
  );
  const [maxPrice, setMaxPrice] = useState<number>(200);
  const [sortBy, setSortBy] = useState<string>(isNewArrivals ? 'newest' : 'featured');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

  // Sync category filter when URL slug changes
  useEffect(() => {
    if (slug && slug !== 'all') {
      setSelectedCategories([slug]);
    } else {
      setSelectedCategories([]);
    }
  }, [slug]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [catsData, prodsData] = await Promise.all([
          publicApi.getCategories(),
          publicApi.getProducts(
            slug && slug !== 'all' ? slug : undefined,
            isNewArrivals ? 'new-arrivals' : undefined
          ),
        ]);
        setCategories(catsData);
        setProducts(prodsData);
      } catch (err: any) {
        setError(err?.friendlyMessage || 'Failed to load catalog products.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, collection, filterParam, isNewArrivals]);

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

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    const deduped = deduplicateProducts(products);

    return deduped
      .filter((product) => {
        // Enforce 24-hour window strictly for new-arrivals
        if (isNewArrivals) {
          if (product.createdAt) {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            if (new Date(product.createdAt) < twentyFourHoursAgo) {
              return false;
            }
          }
        }

        // Category filter
        if (selectedCategories.length > 0) {
          if (!product.category || !selectedCategories.includes(product.category.slug)) {
            return false;
          }
        }

        // Price filter
        const priceNum = parseFloat(formatPrice(product.price));
        if (priceNum > maxPrice) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = parseFloat(formatPrice(a.price));
        const priceB = parseFloat(formatPrice(b.price));

        if (sortBy === 'price-low') return priceA - priceB;
        if (sortBy === 'price-high') return priceB - priceA;
        if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
        if (sortBy === 'newest') {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }
        return 0; // featured default
      });
  }, [products, selectedCategories, maxPrice, sortBy, isNewArrivals]);

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
          <span className="text-xs font-semibold text-slate-400">
            Showing {filteredProducts.length} items
          </span>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Sidebar Filters */}
          <aside className="hidden lg:block col-span-1 bg-white border border-slate-200 rounded-sm p-6 sticky top-28 space-y-6">
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
          <main className="col-span-1 lg:col-span-3">
            {/* Desktop Top Bar */}
            <div className="hidden lg:flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
                  {activeCategoryName}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isNewArrivals
                    ? 'Curated releases and verified inventory added in the past 24 hours.'
                    : `Showing ${filteredProducts.length} authentic verified marketplace items.`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">SORT BY:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 rounded-sm border border-slate-300 text-xs font-bold text-[#0F172A] bg-white focus:outline-none focus:border-[#0F172A] cursor-pointer"
                >
                  <option value="featured">Featured Collection</option>
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="title-asc">Alphabetical: A-Z</option>
                </select>
              </div>
            </div>

            {/* Loading & Error States */}
            {loading && <LoadingSpinner size="lg" message="Loading catalog items..." />}
            {error && <ErrorState message={error} onRetry={() => window.location.reload()} />}

            {/* Empty State */}
            {!loading && !error && filteredProducts.length === 0 && (
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

            {/* Responsive Product Grid */}
            {!loading && !error && filteredProducts.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
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
