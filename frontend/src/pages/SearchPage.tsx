import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Store, ArrowRight, Package } from 'lucide-react';
import { publicApi } from '../api/public.api';
import type { SearchResponse } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { getProductImageUrl } from '../utils/formatters';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [inputVal, setInputVal] = useState(query);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputVal(query);
    if (!query.trim()) {
      setData({ query: '', products: [], stores: [] });
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await publicApi.search(query.trim());
        setData(res);
      } catch (err: any) {
        setError(err?.friendlyMessage || 'Search failed. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setSearchParams({ q: inputVal.trim() });
    }
  };

  const hasStores = (data?.stores?.length || 0) > 0;
  const hasProducts = (data?.products?.length || 0) > 0;
  const hasResults = hasStores || hasProducts;

  return (
    <div className="bg-slate-50 min-h-screen pb-24 text-navy-900">
      {/* Search Header Banner */}
      <div className="bg-white border-b border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight uppercase">
              SEARCH MARKETPLACE
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Find authentic products and verified merchant stores across Martify Collection.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="max-w-2xl">
            <div className="relative flex items-center bg-slate-50 rounded-xl p-1.5 border border-slate-300 focus-within:border-navy-900 focus-within:bg-white shadow-xs transition-all">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Search products or stores..."
                className="w-full px-3 py-2.5 text-sm text-navy-900 bg-transparent placeholder-slate-400 focus:outline-none font-medium"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-black uppercase tracking-wider rounded-lg transition-all shrink-0 cursor-pointer shadow-sm"
              >
                Search
              </button>
            </div>
          </form>

          {query && (
            <div className="text-xs font-semibold text-slate-500">
              Showing results for <span className="text-navy-900 font-black">"{query}"</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {loading && (
          <div className="py-20">
            <LoadingSpinner size="lg" message="Searching catalog and stores..." />
          </div>
        )}

        {error && (
          <div className="py-12">
            <ErrorState message={error} onRetry={() => setSearchParams({ q: query })} />
          </div>
        )}

        {!loading && !error && query && !hasResults && (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center max-w-md mx-auto space-y-4 shadow-sm my-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-black text-navy-900 uppercase">NO RESULTS FOUND</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              We couldn't find any products or stores matching <span className="font-bold text-navy-900">"{query}"</span>. Please check your spelling or try broader keywords.
            </p>
            <div className="pt-2">
              <Link
                to="/categories/all"
                className="inline-flex items-center gap-2 px-6 py-3 bg-navy-900 text-white text-xs font-bold rounded-lg uppercase tracking-wider shadow-sm hover:bg-navy-800 transition-colors"
              >
                Browse All Products
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && hasResults && (
          <div className="space-y-14">
            {/* Matching Stores Section */}
            {hasStores && (
              <section className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-accent-orange" />
                    <h2 className="text-lg font-black text-navy-900 tracking-tight uppercase">
                      MATCHING STORES ({data?.stores.length})
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data?.stores.map((store) => {
                    const displayName = store.storeName || store.name;
                    return (
                      <div
                        key={store.id}
                        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-700 text-xl shrink-0">
                            {store.storeImageUrl ? (
                              <img
                                src={getProductImageUrl(store.storeImageUrl)}
                                alt={displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{displayName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-black text-navy-900 truncate">
                              {displayName}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {store.storeDescription || 'Independent verified merchant store on Martify Collection.'}
                            </p>
                          </div>
                        </div>

                        {/* Store Product Samples */}
                        {store.products && store.products.length > 0 && (
                          <div className="pt-2 border-t border-slate-100">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                              Store Products:
                            </p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {store.products.slice(0, 4).map((p) => (
                                <Link
                                  key={p.id}
                                  to={`/products/${p.id}`}
                                  className="group block aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 relative hover:border-navy-900 transition-colors"
                                  title={p.title}
                                >
                                  <img
                                    src={getProductImageUrl(p.imageUrl, p.category?.slug)}
                                    alt={p.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-2 flex justify-end">
                          <Link
                            to={`/sellers/${store.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-900 hover:text-accent-orange hover:underline transition-colors"
                          >
                            <span>Visit Storefront</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Matching Products Section */}
            {hasProducts && (
              <section className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-accent-orange" />
                    <h2 className="text-lg font-black text-navy-900 tracking-tight uppercase">
                      MATCHING PRODUCTS ({data?.products.length})
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {data?.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default SearchPage;
