import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getProductImageUrl, formatPrice } from '../utils/formatters';

export const CartPage: React.FC = () => {
  const { items, itemCount, subtotal, removeFromCart, updateQuantity, loading } = useCart();
  const navigate = useNavigate();

  const subtotalNum = parseFloat(subtotal || '0');
  const freeShippingThreshold = 50;
  const isFreeShipping = subtotalNum >= freeShippingThreshold;
  const shippingCost = isFreeShipping ? 0 : 4.99;
  const grandTotal = (subtotalNum + shippingCost).toFixed(2);

  if (items.length === 0) {
    return (
      <div className="bg-white min-h-[70vh] flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-navy-900">
            <ShoppingBag className="w-10 h-10 text-accent-orange" />
          </div>
          <h2 className="text-2xl font-black text-navy-900 uppercase tracking-tight">
            YOUR BAG IS EMPTY
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Discover precision lifestyle goods, performance apparel, and modern crafted home essentials from our verified sellers.
          </p>
          <div className="pt-2">
            <Link
              to="/categories/all"
              className="inline-flex items-center gap-2 px-8 py-4 bg-navy-900 hover:bg-navy-800 text-white text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-xl"
            >
              <span>EXPLORE PRODUCTS</span>
              <ArrowRight className="w-4 h-4 text-accent-orange" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-24 text-navy-900">
      {/* Breadcrumb Header */}
      <div className="border-b border-slate-200 bg-slate-50/60 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to="/" className="hover:text-navy-900 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-navy-900 font-bold uppercase tracking-wider">
              Shopping Bag
            </span>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {itemCount} item{itemCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-slate-200">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-navy-900">
            SHOPPING BAG ({itemCount})
          </h1>
          <Link
            to="/categories/all"
            className="text-xs font-bold text-navy-900 hover:text-accent-orange transition-colors uppercase flex items-center gap-1"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="mb-8 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="flex items-center gap-1.5 text-navy-900">
              <Truck className="w-4 h-4 text-accent-orange" />
              {isFreeShipping ? (
                <span className="text-emerald-700 font-black">
                  QUALIFIED FOR FREE STANDARD SHIPPING!
                </span>
              ) : (
                <span>
                  Add{' '}
                  <span className="text-accent-orange font-black">
                    ${(freeShippingThreshold - subtotalNum).toFixed(2)}
                  </span>{' '}
                  more for FREE SHIPPING
                </span>
              )}
            </span>
            <span className="text-slate-400">
              {Math.min(100, Math.round((subtotalNum / freeShippingThreshold) * 100))}%
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-navy-900 h-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(100, (subtotalNum / freeShippingThreshold) * 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => {
              const itemImageUrl = getProductImageUrl(item.imageUrl);
              const priceFormatted = formatPrice(item.price);
              const lineTotal = (parseFloat(priceFormatted) * item.quantity).toFixed(2);

              return (
                <div
                  key={item.id}
                  className="flex gap-4 sm:gap-6 p-4 sm:p-5 rounded-xl border border-slate-200/90 bg-white transition-all hover:border-slate-300"
                >
                  {/* Product Image */}
                  <Link
                    to={`/products/${item.productId}`}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-slate-100 shrink-0"
                  >
                    <img
                      src={itemImageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      {item.sellerName && (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          Sold by {item.sellerName}
                        </span>
                      )}
                      <Link
                        to={`/products/${item.productId}`}
                        className="text-sm sm:text-base font-black text-navy-900 hover:text-accent-orange transition-colors line-clamp-1"
                      >
                        {item.title}
                      </Link>
                      <span className="text-xs font-bold text-slate-500 block">
                        ${priceFormatted} each
                      </span>
                      {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {Object.entries(item.selectedAttributes).map(([k, v]) => (
                            <span
                              key={k}
                              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {k.toLowerCase() === 'size' ? 'Size' : k.toLowerCase() === 'volume' ? 'Vol' : k}: {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
                      {/* Quantity Selector */}
                      <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={loading}
                          aria-label="Decrease"
                          className="p-1.5 sm:p-2 text-navy-900 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-black text-navy-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={loading || (item.stockAvailable > 0 && item.quantity >= item.stockAvailable)}
                          aria-label="Increase"
                          className="p-1.5 sm:p-2 text-navy-900 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Total & Remove */}
                      <div className="flex items-center gap-4">
                        <span className="text-sm sm:text-base font-black text-navy-900">
                          ${lineTotal}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          disabled={loading}
                          aria-label="Remove item"
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-6 space-y-6 sticky top-28">
            <h3 className="text-sm font-black text-navy-900 tracking-wider uppercase pb-3 border-b border-slate-200">
              ORDER SUMMARY
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-navy-900">${formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Shipping</span>
                <span className="font-bold text-navy-900">
                  {isFreeShipping ? (
                    <span className="text-emerald-700 font-extrabold uppercase">FREE</span>
                  ) : (
                    `$${shippingCost.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Taxes</span>
                <span className="font-bold text-slate-400">Calculated at Checkout</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-black text-navy-900">
                <span>TOTAL</span>
                <span className="text-xl">${grandTotal}</span>
              </div>
            </div>

            {/* Checkout Button (Navy Blue) */}
            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-4 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-black tracking-widest uppercase transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4 text-accent-orange" />
            </button>

            {/* Safe & Secure Guarantees */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Direct Vetted Escrow & Buyer Protection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
