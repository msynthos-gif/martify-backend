import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShoppingBag,
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  Minus,
  Plus,
  Store,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { publicApi } from '../api/public.api';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/product/ProductCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import {
  getProductImageUrl,
  formatPrice,
  getComparePrice,
  deduplicateProducts,
} from '../utils/formatters';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [addingToCart, setAddingToCart] = useState<boolean>(false);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);
  const [cartError, setCartError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'shipping'>('description');
  const [imgError, setImgError] = useState<boolean>(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    setSelectedImageIndex(0);
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const prodData = await publicApi.getProductById(id);
        setProduct(prodData);

        // Initialize default selected attributes if product has attributes
        if (prodData.attributes && typeof prodData.attributes === 'object') {
          const initialAttrs: Record<string, string> = {};
          for (const [key, opts] of Object.entries(prodData.attributes)) {
            if (Array.isArray(opts) && opts.length > 0) {
              initialAttrs[key] = opts[0];
            }
          }
          setSelectedAttributes(initialAttrs);
        } else {
          setSelectedAttributes({});
        }

        // Fetch related products for the bottom row
        const allProds = await publicApi.getProducts(prodData.category?.slug);
        setRelatedProducts(
          deduplicateProducts(allProds).filter((p) => p.id !== prodData.id).slice(0, 4)
        );
      } catch (err: any) {
        setError(err?.friendlyMessage || 'Failed to load product information.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    setQuantity(1);
    window.scrollTo(0, 0);
  }, [id]);

  const handleQuantityDecrease = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleQuantityIncrease = () => {
    if (!product) return;
    setQuantity((prev) => (product.stock > 0 ? Math.min(product.stock, prev + 1) : prev + 1));
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    setCartError(null);
    try {
      await addToCart(
        product.id,
        quantity,
        Object.keys(selectedAttributes).length > 0 ? selectedAttributes : undefined
      );
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2500);
    } catch (err: any) {
      setCartError(err?.friendlyMessage || 'Failed to add product to bag.');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 bg-white min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading product details..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-24 bg-white min-h-[60vh]">
        <div className="max-w-xl mx-auto px-4">
          <ErrorState
            message={error || 'Product could not be found.'}
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  const priceStr = formatPrice(product.price);
  const comparePriceStr = getComparePrice(product.price, 25);
  const fallbackImage = getProductImageUrl(null, product.category?.slug);
  const imageList = (product.images && product.images.length > 0)
    ? product.images.map((img) => getProductImageUrl(img.url, product.category?.slug))
    : [getProductImageUrl(product.imageUrl, product.category?.slug)];
  const currentImageUrl = imageList[selectedImageIndex] || fallbackImage;
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="bg-white min-h-screen pb-24 text-navy-900">
      {/* Breadcrumb Bar */}
      <div className="border-b border-slate-200 bg-slate-50/60 py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to="/" className="hover:text-navy-900 transition-colors">
              Home
            </Link>
            <span>/</span>
            {product.category && (
              <>
                <Link
                  to={`/categories/${product.category.slug}`}
                  className="hover:text-navy-900 transition-colors uppercase"
                >
                  {product.category.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-navy-900 font-bold truncate max-w-xs">{product.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: Interactive Multi-Image Gallery */}
          <div className="space-y-4">
            {/* Main Active Image with Prev/Next Navigation Controls */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs group">
              <img
                src={imgError ? fallbackImage : currentImageUrl}
                alt={product.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {imageList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1))
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-navy-900 shadow-md backdrop-blur-xs opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImageIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-navy-900 shadow-md backdrop-blur-xs opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/60 backdrop-blur-xs text-white text-[11px] font-semibold">
                    {selectedImageIndex + 1} / {imageList.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {imageList.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {imageList.map((imgUrl, index) => {
                  const isSelected = index === selectedImageIndex;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setImgError(false);
                        setSelectedImageIndex(index);
                      }}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 bg-slate-100 ${isSelected
                          ? 'border-navy-900 ring-2 ring-navy-900/20 scale-102 shadow-sm'
                          : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                        }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`${product.title} - thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Title, Quantity Selector, Price, ADD TO CART (Navy Blue), Description */}
          <div className="space-y-6">
            {/* Category / Seller Micro-Label */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              {product.category && (
                <span className="text-accent-orange uppercase tracking-wider font-extrabold">
                  {product.category.name}
                </span>
              )}
              {product.seller && (
                <Link
                  to={`/sellers/${product.seller.id}`}
                  className="flex items-center gap-1.5 text-slate-700 hover:text-navy-900 font-bold transition-colors group"
                >
                  <Store className="w-3.5 h-3.5 text-navy-900 group-hover:scale-110 transition-transform" />
                  <span>Sold by <span className="underline decoration-slate-300 group-hover:decoration-navy-900">{product.seller.storeName || product.seller.name}</span></span>
                </Link>
              )}
            </div>

            {/* Product Title (Bold Navy Typography) */}
            <h1 className="text-3xl sm:text-4xl font-black text-navy-900 tracking-tight leading-tight">
              {product.title}
            </h1>

            {/* Price Display (Bold current price + strike-through compare price) */}
            <div className="pt-1 border-b border-slate-200 pb-5 space-y-2.5">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-navy-900 tracking-tight">
                  ${priceStr}
                </span>
                <span className="text-lg font-bold text-slate-400 line-through">
                  ${comparePriceStr}
                </span>
                <span className="px-2 py-0.5 rounded bg-accent-orange/10 text-accent-orange text-xs font-black uppercase tracking-wider">
                  SAVE 20%
                </span>
              </div>

              {/* Animated Recently Sold Badge */}
              {Number(product.totalSold) > 0 && (
                <div className="pt-1">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 border border-amber-400/50 text-amber-900 text-xs font-black shadow-xs animate-pulse">
                    <span className="text-base animate-bounce">🔥</span>
                    <span className="tracking-wide">{product.totalSold}+ Recently Sold</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quantity Selector: (- / number / +) */}
            <div className="space-y-2">
              <span className="text-xs font-black text-navy-900 tracking-wider uppercase block">
                QUANTITY
              </span>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={handleQuantityDecrease}
                    disabled={quantity <= 1 || isOutOfStock}
                    aria-label="Decrease quantity"
                    className="p-3 text-navy-900 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-black text-navy-900 select-none">
                    {quantity}
                  </span>
                  <button
                    onClick={handleQuantityIncrease}
                    disabled={isOutOfStock || (product.stock > 0 && quantity >= product.stock)}
                    aria-label="Increase quantity"
                    className="p-3 text-navy-900 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {product.stock > 0 && product.stock <= 5 && (
                  <span className="text-xs font-extrabold text-amber-600">
                    Only {product.stock} units remaining!
                  </span>
                )}
              </div>
            </div>

            {/* Category-Based Attribute Selector (Size, Color, Volume, etc.) */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <div id="product-attributes-selector" className="space-y-4 pt-1">
                {Object.entries(product.attributes).map(([attrKey, options]) => {
                  if (!Array.isArray(options) || options.length === 0) return null;
                  const displayLabel =
                    attrKey.toLowerCase() === 'size'
                      ? 'Size'
                      : attrKey.toLowerCase() === 'color'
                        ? 'Color'
                        : attrKey.toLowerCase() === 'volume'
                          ? 'Size / Volume'
                          : attrKey.charAt(0).toUpperCase() + attrKey.slice(1);
                  const selectedVal = selectedAttributes[attrKey] || options[0];

                  return (
                    <div key={attrKey} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-navy-900 tracking-wider uppercase">
                          {displayLabel}:{' '}
                          <span className="text-slate-600 font-extrabold ml-1">{selectedVal}</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {options.map((opt) => {
                          const isSelected = selectedVal === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                setSelectedAttributes((prev) => ({ ...prev, [attrKey]: opt }))
                              }
                              className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer border ${isSelected
                                  ? 'bg-navy-900 text-white border-navy-900 shadow-md scale-102 ring-2 ring-navy-900/20'
                                  : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                                }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action: ADD TO CART Button (Full width, Navy Blue, White Text) */}
            {/* Strictly NO third-party payment buttons (e.g. Shop Pay, PayPal) */}
            <div className="pt-2">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || isOutOfStock}
                className={`w-full py-4 px-6 rounded-lg text-xs sm:text-sm font-black tracking-widest uppercase transition-all duration-300 shadow-xl flex items-center justify-center gap-2 cursor-pointer ${addedSuccess
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : isOutOfStock
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-navy-900 hover:bg-navy-800 text-white hover:scale-101 hover:shadow-2xl'
                  }`}
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>ADDED TO BAG</span>
                  </>
                ) : addingToCart ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isOutOfStock ? (
                  <span>SOLD OUT</span>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-accent-orange" />
                    <span>ADD TO CART</span>
                  </>
                )}
              </button>

              {cartError && (
                <p className="text-xs text-red-500 font-bold mt-2 text-center">
                  {cartError}
                </p>
              )}
            </div>

            {/* Value Guarantees Strip */}
            <div className="grid grid-cols-3 gap-2 pt-4 pb-2 border-y border-slate-200 text-center">
              <div className="flex flex-col items-center gap-1 text-[11px] font-bold text-slate-600">
                <Truck className="w-4 h-4 text-accent-orange" />
                <span>Fast Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-[11px] font-bold text-slate-600">
                <RotateCcw className="w-4 h-4 text-accent-orange" />
                <span>30-Day Returns</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-[11px] font-bold text-slate-600">
                <ShieldCheck className="w-4 h-4 text-accent-orange" />
                <span>Verified Seller</span>
              </div>
            </div>

            {/* Description & Specs Tabs Below */}
            <div className="pt-2">
              <div className="flex border-b border-slate-200 text-xs font-black tracking-wider uppercase">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`pb-3 mr-6 cursor-pointer border-b-2 transition-colors ${activeTab === 'description'
                      ? 'border-navy-900 text-navy-900'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`pb-3 mr-6 cursor-pointer border-b-2 transition-colors ${activeTab === 'specs'
                      ? 'border-navy-900 text-navy-900'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                >
                  Specifications
                </button>
                <button
                  onClick={() => setActiveTab('shipping')}
                  className={`pb-3 cursor-pointer border-b-2 transition-colors ${activeTab === 'shipping'
                      ? 'border-navy-900 text-navy-900'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                >
                  Shipping & Returns
                </button>
              </div>

              <div className="py-4 text-sm text-slate-600 leading-relaxed">
                {activeTab === 'description' && (
                  <p className="whitespace-pre-line">{product.description}</p>
                )}
                {activeTab === 'specs' && (
                  <ul className="space-y-2 text-xs">
                    <li className="flex justify-between py-1 border-b border-slate-100">
                      <span className="font-bold text-navy-900">Product Code</span>
                      <span className="text-slate-500">{product.id.slice(0, 8).toUpperCase()}</span>
                    </li>
                    <li className="flex justify-between py-1 border-b border-slate-100">
                      <span className="font-bold text-navy-900">Department</span>
                      <span className="text-slate-500">{product.category?.name || 'Catalog'}</span>
                    </li>
                    <li className="flex justify-between py-1 border-b border-slate-100">
                      <span className="font-bold text-navy-900">Stock Status</span>
                      <span className="text-emerald-600 font-bold">
                        {product.stock > 0 ? `In Stock (${product.stock} units)` : 'Sold Out'}
                      </span>
                    </li>
                  </ul>
                )}
                {activeTab === 'shipping' && (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Standard orders ship within 24 to 48 business hours. We offer free standard tracked shipping on all orders over $50. Unused items in original packaging can be returned within 30 days of delivery.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* You May Also Like Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 pt-10 border-t border-slate-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-navy-900 uppercase">
                YOU MAY ALSO LIKE
              </h2>
              <Link
                to="/categories/all"
                className="text-xs font-black tracking-wider text-navy-900 hover:text-accent-orange transition-colors uppercase flex items-center gap-1"
              >
                <span>EXPLORE MORE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct.id} product={relProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
