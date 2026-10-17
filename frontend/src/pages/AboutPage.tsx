import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShoppingBag, Store, Truck, Sparkles, Users, Award, Headphones } from 'lucide-react';

export const AboutPage: React.FC = () => {
  useEffect(() => {
    document.title = 'About Us | Martify Collection Online Marketplace';
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-20">
      {/* Hero Banner */}
      <div className="bg-[#0F172A] text-white py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Our Story &amp; Vision
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase max-w-3xl mx-auto">
            Different Sellers. <span className="text-orange-500">Endless Discoveries.</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Martify Collection brings multiple verified merchants together into a unified online marketplace, giving you the freedom to explore unique collections and quality styles beyond a single storefront.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/products"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Explore Marketplace
            </Link>
            <Link
              to="/seller/register"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors border border-slate-700 inline-flex items-center gap-2"
            >
              <Store className="w-4 h-4" />
              Join as a Seller
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content & Mission */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                Empowering Shoppers &amp; Supporting Independent Sellers
              </h2>
              <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
                At Martify Collection, our philosophy is simple: elevate online shopping by removing the barrier between discerning buyers and passionate independent merchants.
              </p>
              <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                Whether you are looking for trending streetwear, timeless shirts, outerwear, or daily lifestyle essentials, our platform curates collections from verified sellers while upholding reliable quality and customer service standards.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-center">
                <Users className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-black text-slate-900">Multi-Vendor</p>
                <p className="text-xs text-slate-500 mt-1">Independent merchants under one roof</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-center">
                <Award className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-black text-slate-900">Verified</p>
                <p className="text-xs text-slate-500 mt-1">Identity &amp; stock quality checks</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-center">
                <Truck className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-black text-slate-900">Swift Delivery</p>
                <p className="text-xs text-slate-500 mt-1">Coordinated fulfillment &amp; COD</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-center">
                <Headphones className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-black text-slate-900">Dedicated</p>
                <p className="text-xs text-slate-500 mt-1">Live customer support &amp; tracking</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Values */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-orange-500">Why Martify Collection</h2>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            A Better Way to Shop and Sell
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 mb-4">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Curated Catalog</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every item featured on Martify undergoes verification so that you receive authentic products that match their descriptions and photos.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Buyer Protection</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Shop with confidence. Transparent order tracking, dedicated fulfillment coordinators, and direct customer care give you peace of mind.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Merchant Growth</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              We provide tools for sellers to manage wholesale stock quota, build custom storefronts, and reach thousands of shoppers nationwide.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
