import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Footer, TrustBadgesTicker } from './components/common/Footer';

// Global Scroll-to-Top on every route navigation
const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]);

  return null;
};

// Pages
import { HomePage } from './pages/HomePage';
import { ProductListingPage } from './pages/ProductListingPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { SellerRegisterPage } from './pages/SellerRegisterPage';
import { SellerLoginPage } from './pages/SellerLoginPage';
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { SupportLoginPage } from './pages/SupportLoginPage';
import { SupportDashboardPage } from './pages/SupportDashboardPage';
import { SellerStorefrontPage } from './pages/SellerStorefrontPage';
import { SearchPage } from './pages/SearchPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 w-full max-w-[100vw] overflow-x-hidden">
            <Header />
            <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden">
              <Routes>
                {/* 1. HomePage */}
                <Route path="/" element={<HomePage />} />

                {/* Search Results */}
                <Route path="/search" element={<SearchPage />} />

                {/* 2. Product Catalog, Collections & Category Listing */}
                <Route path="/categories/:slug" element={<ProductListingPage />} />
                <Route path="/collections/:collection" element={<ProductListingPage />} />
                <Route path="/products" element={<ProductListingPage />} />

                {/* 3. Product Detail Page */}
                <Route path="/products/:id" element={<ProductDetailPage />} />

                {/* 4. Seller Storefront Page */}
                <Route path="/sellers/:id" element={<SellerStorefrontPage />} />

                {/* 5. Cart Page */}
                <Route path="/cart" element={<CartPage />} />

                {/* 6. Checkout Page */}
                <Route path="/checkout" element={<CheckoutPage />} />

                {/* 7. Seller Registration */}
                <Route path="/seller/register" element={<SellerRegisterPage />} />

                {/* 8. Seller Login */}
                <Route path="/seller/login" element={<SellerLoginPage />} />

                {/* 9. Seller Dashboard */}
                <Route path="/seller/dashboard" element={<SellerDashboardPage />} />

                {/* 10. Admin Login & Dashboard */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />

                {/* 11. Support Login & Dashboard */}
                <Route path="/support/login" element={<SupportLoginPage />} />
                <Route path="/support" element={<SupportDashboardPage />} />

                {/* 404 Fallback */}
                <Route
                  path="*"
                  element={
                    <div className="py-20 text-center bg-white min-h-[60vh] flex flex-col items-center justify-center">
                      <h2 className="text-3xl font-black text-navy-900">Page Not Found</h2>
                      <p className="text-slate-500 text-sm mt-2">The page you are looking for does not exist.</p>
                      <Link
                        to="/"
                        className="mt-6 inline-block px-6 py-3 bg-navy-900 text-white rounded-lg text-xs font-black uppercase tracking-wider"
                      >
                        Back to Home
                      </Link>
                    </div>
                  }
                />
              </Routes>
            </main>
            <TrustBadgesTicker />
            <Footer />
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
