import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Package,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { publicApi } from '../api/public.api';
import type { CheckoutResult } from '../types';
import { formatPrice, getProductImageUrl } from '../utils/formatters';

export const CheckoutPage: React.FC = () => {
  const { sessionId, items, subtotal, clearCartState } = useCart();

  // Contact Section State
  const [email, setEmail] = useState('');
  const [emailNewsOffers, setEmailNewsOffers] = useState(false);

  // Shipping Address Section State
  const [country, setCountry] = useState('United States');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<CheckoutResult | null>(null);

  const subtotalNum = parseFloat(subtotal || '0');
  const isFreeShipping = subtotalNum >= 50;
  const shippingCost = isFreeShipping ? 0 : 4.99;
  const grandTotal = (subtotalNum + shippingCost).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please provide both your first name and last name.');
      return;
    }
    if (!address.trim() || !city.trim() || !state.trim() || !zipCode.trim()) {
      setError('Please complete the shipping address (address, city, state, ZIP code).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await publicApi.checkout({
        sessionId,
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        country,
        company: company.trim() || undefined,
        address: address.trim(),
        apartment: apartment.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        phone: phone.trim() || undefined,
        emailNewsOffers,
      });
      setOrderResult(result);
      clearCartState();
    } catch (err: any) {
      setError(err?.friendlyMessage || 'Failed to complete order booking. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  // Order Confirmation Success View
  if (orderResult) {
    return (
      <div className="bg-white min-h-[80vh] py-16 px-4 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
          <div className="w-18 h-18 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-700">
              ORDER SUCCESSFULLY BOOKED
            </span>
            <h1 className="text-3xl font-black text-navy-900 tracking-tight">
              THANK YOU FOR YOUR ORDER!
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your order has been routed directly to the verified seller(s) for immediate dispatch.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/90 text-left space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="font-bold text-slate-500">Orders Generated:</span>
              <span className="font-black text-navy-900">{orderResult.ordersCount} split order(s)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="font-bold text-slate-500">Recipient Name:</span>
              <span className="font-black text-navy-900">{orderResult.buyerName}</span>
            </div>
            {orderResult.buyerEmail && (
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-500">Email:</span>
                <span className="font-black text-navy-900">{orderResult.buyerEmail}</span>
              </div>
            )}
            {orderResult.buyerPhone && (
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-500">Contact Phone:</span>
                <span className="font-black text-navy-900">{orderResult.buyerPhone}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="font-bold text-slate-500">Shipping Address:</span>
              <span className="font-black text-navy-900 text-right max-w-xs truncate">
                {orderResult.buyerAddress}
              </span>
            </div>
            <div className="flex justify-between pt-2 text-sm font-black text-navy-900">
              <span>Order Total:</span>
              <span className="text-base text-navy-900">${formatPrice(orderResult.grandTotal)}</span>
            </div>
          </div>

          {/* Orders list snippet */}
          <div className="space-y-2 text-left">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              BOOKED SHIPMENTS:
            </span>
            {orderResult.orders.map((ord: any) => (
              <div
                key={ord.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white text-xs font-medium"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-accent-orange" />
                  <span className="font-bold text-navy-900">Order #{ord.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-extrabold uppercase">
                  {ord.status}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/categories/all"
              className="px-6 py-3.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-black uppercase tracking-widest transition-all shadow-xl"
            >
              CONTINUE SHOPPING
            </Link>
            <Link
              to="/"
              className="px-6 py-3.5 rounded-lg border border-slate-200 text-navy-900 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If cart is empty and not completed
  if (items.length === 0) {
    return (
      <div className="bg-white min-h-[60vh] flex items-center justify-center py-20 px-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-black text-navy-900 uppercase">NO ITEMS TO CHECK OUT</h2>
          <p className="text-xs text-slate-500">Your shopping bag is currently empty.</p>
          <Link
            to="/categories/all"
            className="inline-flex items-center gap-2 px-6 py-3 bg-navy-900 text-white text-xs font-bold rounded-lg"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-24 text-navy-900">
      {/* Breadcrumb Bar */}
      <div className="border-b border-slate-200 bg-slate-50/60 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/" className="hover:text-navy-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/cart" className="hover:text-navy-900 transition-colors">
            Shopping Bag
          </Link>
          <span>/</span>
          <span className="text-navy-900 font-bold uppercase tracking-wider">
            Guest Checkout
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-slate-200">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-navy-900">
            CHECKOUT
          </h1>
          <Link
            to="/cart"
            className="text-xs font-bold text-slate-500 hover:text-navy-900 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Bag</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Left Form: Two Structured Sections */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-600">
                  {error}
                </div>
              )}

              {/* SECTION 1: CONTACT */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h2 className="text-base font-black text-navy-900 uppercase tracking-wider">
                    Contact
                  </h2>
                  <div className="text-xs font-semibold text-slate-500">
                    Have an account?{' '}
                    <span className="text-navy-900 font-bold underline cursor-pointer hover:text-slate-700">
                      Sign in
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-navy-900 uppercase tracking-wider block mb-1.5">
                    Email address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-navy-900 font-medium"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    id="emailNewsOffers"
                    type="checkbox"
                    checked={emailNewsOffers}
                    onChange={(e) => setEmailNewsOffers(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-navy-900 focus:ring-navy-900 cursor-pointer"
                  />
                  <label htmlFor="emailNewsOffers" className="text-xs font-medium text-slate-600 cursor-pointer select-none">
                    Email me with news and offers
                  </label>
                </div>
              </div>

              {/* SECTION 2: SHIPPING ADDRESS */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                  <Truck className="w-5 h-5 text-accent-orange" />
                  <h2 className="text-base font-black text-navy-900 uppercase tracking-wider">
                    Delivery & Shipping Address
                  </h2>
                </div>

                {/* Country / Region */}
                <div>
                  <label className="text-xs font-bold text-navy-900 uppercase tracking-wider block mb-1.5">
                    Country / Region
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-navy-900 font-medium bg-white"
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Pakistan">Pakistan</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                  </select>
                </div>

                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-navy-900 uppercase tracking-wider block mb-1.5">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-navy-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-navy-900 uppercase tracking-wider block mb-1.5">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-navy-900 font-medium"
                    />
                  </div>
                </div>

                {/* Company (optional) */}
                <div>
                  <label className="text-xs font-bold text-navy-900 uppercase tracking-wider block mb-1.5">
                    Company <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Company name"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-navy-900 font-medium"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="text-xs font-bold text-navy-900 uppercase tracking-wider block mb-1.5">
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-navy-900 font-medium"
                  />
                </div>

                {/* Apartment, suite, etc. (optional) */}
                <div>
                  <label className="text-xs font-bold text-navy-900 uppercase tracking-wider block mb-1.5">
                    Apartment, suite, etc. <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    placeholder="Apartment, suite, unit, building, floor, etc."
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-navy-900 font-medium"
                  />
                </div>

                {/* City, State, ZIP code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-navy-900 uppercase tracking-wider block mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-navy-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-navy-900 uppercase tracking-wider block mb-1.5">
                      State / Province *
                    </label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-navy-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-navy-900 uppercase tracking-wider block mb-1.5">
                      ZIP / Postal Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="ZIP code"
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-navy-900 font-medium"
                    />
                  </div>
                </div>

                {/* Phone (optional) */}
                <div>
                  <label className="text-xs font-bold text-navy-900 uppercase tracking-wider block mb-1.5">
                    Phone <span className="text-slate-400 font-normal">(optional, for delivery updates)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-navy-900 font-medium"
                  />
                </div>

                <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Direct settlement escrow enabled. Sellers are paid only after order fulfillment confirmation.
                  </span>
                </div>
              </div>

              {/* Submit Button (Navy Blue) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs sm:text-sm font-black tracking-widest uppercase transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>CONFIRM & PLACE ORDER</span>
                    <ArrowRight className="w-4 h-4 text-accent-orange" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Summary Sidebar */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-6 space-y-6 sticky top-28">
            <h3 className="text-sm font-black text-navy-900 tracking-wider uppercase pb-3 border-b border-slate-200">
              ITEMS IN ORDER ({items.length})
            </h3>

            {/* Product items snippet */}
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <img
                    src={getProductImageUrl(item.imageUrl)}
                    alt={item.title}
                    className="w-12 h-12 rounded-md object-cover bg-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-navy-900 truncate">{item.title}</h4>
                    <p className="text-[11px] text-slate-400">Qty: {item.quantity}</p>
                    {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                      <p className="text-[10px] font-semibold text-slate-500">
                        {Object.entries(item.selectedAttributes)
                          .map(([k, v]) => `${k.toLowerCase() === 'size' ? 'Size' : k.toLowerCase() === 'volume' ? 'Vol' : k}: ${v}`)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-black text-navy-900">
                    ${(parseFloat(formatPrice(item.price)) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 text-xs pt-4 border-t border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-navy-900">${formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="font-bold text-navy-900">
                  {isFreeShipping ? <span className="text-emerald-700 uppercase font-black">FREE</span> : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200 text-sm font-black text-navy-900">
                <span>TOTAL DUE</span>
                <span className="text-lg">${grandTotal}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
