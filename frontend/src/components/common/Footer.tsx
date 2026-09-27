import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../../api/public.api';
import type { Category } from '../../types';
import brandLogo from '../../assets/logo.jpeg';
export { TrustBadgesTicker } from './TrustBadgesTicker';

export const Footer: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let isMounted = true;
    publicApi
      .getCategories()
      .then((data: Category[]) => {
        if (isMounted && Array.isArray(data)) {
          // Render active root categories (no parentId)
          const rootCats = data.filter((c) => !c.parentId);
          setCategories(rootCats);
        }
      })
      .catch((err: unknown) => {
        console.error('Error fetching categories for footer:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer className="bg-[#0F172A] text-slate-400 border-t border-slate-800">
      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {/* Column 1: Brand Info (Leftmost) */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4 group shrink-0">
              <img
                src={brandLogo}
                alt="Martify Collection"
                className="w-10 h-10 rounded-full object-cover border border-slate-700 shadow-sm inline-block"
              />
              <span className="text-xl font-extrabold tracking-tight text-white uppercase font-sans">
                MARTIFY COLLECTION<span className="text-orange-500">.</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-400 max-w-sm mb-6">
              Martify Collection | Different Sellers. Endless Discoveries.
              <br />
              <br />
              Your next favourite find starts here. Martify Collection brings multiple sellers together in one online marketplace, giving you the freedom to explore beyond a single store. A place for shoppers to discover and sellers to grow, all under one name.
            </p>
          </div>

          {/* Column 2: Dynamic Categories (MARKETPLACE) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Marketplace
            </h4>
            <ul className="space-y-1 text-xs">
              <li>
                <Link
                  to="/categories/all"
                  className="text-slate-400 hover:text-white transition-colors py-2 inline-flex items-center min-h-[36px]"
                >
                  All Products
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/categories/${cat.slug}`}
                    className="text-slate-400 hover:text-white transition-colors py-2 inline-flex items-center min-h-[36px]"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: For Sellers (Clean 2 Links Only) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              For Sellers
            </h4>
            <ul className="space-y-1 text-xs">
              <li>
                <Link
                  to="/seller/register"
                  className="text-slate-400 hover:text-white transition-colors font-medium py-2 inline-flex items-center min-h-[36px]"
                >
                  Register as Seller
                </Link>
              </li>
              <li>
                <Link
                  to="/seller/login"
                  className="text-slate-400 hover:text-white transition-colors py-2 inline-flex items-center min-h-[36px]"
                >
                  Seller Dashboard Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Martify Collection Marketplace Inc. All rights reserved.</p>
          <p className="text-[11px] text-slate-400">

          </p>
        </div>
      </div>
    </footer>
  );
};
