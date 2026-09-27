import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  User,
  Store,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { publicApi } from '../../api/public.api';
import type { Category, Product, SearchStore } from '../../types';
import { getProductImageUrl, formatPrice } from '../../utils/formatters';
import brandLogo from '../../assets/logo.jpeg';

export const Header: React.FC = () => {
  const { itemCount } = useCart();
  const { user, role, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveSearching, setLiveSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    products: Product[];
    stores: SearchStore[];
  } | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedMobileCats, setExpandedMobileCats] = useState<Record<string, boolean>>({});
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [expandedMoreCats, setExpandedMoreCats] = useState<Record<string, boolean>>({});

  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Load active categories for header navigation
  useEffect(() => {
    publicApi.getCategories()
      .then((data: Category[]) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch((err: unknown) => console.error('Error fetching categories for header:', err));
  }, [location.pathname]);

  // Root categories filtered by showInNavbar !== false
  const navCategories = useMemo(() => {
    return categories.filter((c) => !c.parentId && c.showInNavbar !== false);
  }, [categories]);

  // Max 5 primary categories directly in visible navbar, remaining in "MORE" dropdown
  const PRIMARY_CATEGORY_LIMIT = 5;

  const primaryCategories = useMemo(() => {
    return navCategories.slice(0, PRIMARY_CATEGORY_LIMIT);
  }, [navCategories]);

  const extraCategories = useMemo(() => {
    return navCategories.slice(PRIMARY_CATEGORY_LIMIT);
  }, [navCategories]);

  const getSubCategories = (parentId: string): Category[] => {
    return categories.filter((c) => c.parentId === parentId);
  };

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setSearchModalOpen(false);
    setMoreMenuOpen(false);
  }, [location.pathname, location.search]);

  // Lock body scroll when mobile slide-out drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Global shortcut (Cmd+K / Ctrl+K) to open search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setUserMenuOpen(false);
        setMoreMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 80);
    } else {
      setSearchQuery('');
      setSearchResults(null);
    }
  }, [searchModalOpen]);

  // Handle outside click for user dropdown & more dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live search debounced query
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults(null);
      setLiveSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLiveSearching(true);
      try {
        const res = await publicApi.search(q);
        setSearchResults({
          products: res.products || [],
          stores: res.stores || [],
        });
      } catch (err) {
        console.warn('Live search error:', err);
        setSearchResults(null);
      } finally {
        setLiveSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchModalOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getDashboardLink = () => {
    if (role === 'ADMIN') return '/admin';
    if (role === 'SUPPORT') return '/support';
    return '/seller/dashboard';
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {/* ========================================================================= */}
        {/* TIER 1: MAIN HEADER ROW (Logo Standalone + Actions Right)                  */}
        {/* ========================================================================= */}
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
              {/* Left: Bold Standalone Brand Logo with breathing room (NO categories here!) */}
              <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink min-w-0">
                <img
                  src={brandLogo}
                  alt="Martify Collection"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                />
                <div className="flex items-center min-w-0">
                  <span className="text-sm xs:text-base sm:text-2xl font-black tracking-tight text-[#0F172A] uppercase select-none truncate">
                    MARTIFY COLLECTION<span className="text-orange-500">.</span>
                  </span>
                </div>
              </Link>

              {/* Right: Clean minimal action icons with text labels */}
              <div className="flex items-center gap-0.5 sm:gap-2 md:gap-4 shrink-0">
                {/* Search Modal Trigger Button */}
                <button
                  type="button"
                  onClick={() => setSearchModalOpen(true)}
                  className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-lg text-slate-800 hover:text-[#FF6B00] hover:bg-slate-50 transition-colors group cursor-pointer min-h-[44px] min-w-[44px] justify-center"
                  title="Search catalog (Cmd+K)"
                  aria-label="Search catalog"
                >
                  <Search className="w-5 h-5 text-slate-700 group-hover:text-[#FF6B00] transition-colors" />
                  <span className="hidden sm:inline text-xs font-bold tracking-wider uppercase">
                    Search
                  </span>
                  <span className="hidden lg:inline-block text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                    ⌘K
                  </span>
                </button>

                {/* Account / User Menu (Desktop only - mobile accesses account via drawer) */}
                {isAuthenticated && user ? (
                  <div className="relative hidden md:block" ref={userMenuRef}>
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-lg text-slate-800 hover:text-[#FF6B00] hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px] min-w-[44px] justify-center"
                      aria-label="Account menu"
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-[11px] uppercase">
                        {user.name.charAt(0)}
                      </div>
                      <span className="hidden sm:inline text-xs font-bold tracking-wider uppercase truncate max-w-[100px]">
                        {user.name.split(' ')[0]}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 border border-slate-150 text-slate-800 z-50 animate-in fade-in duration-150">
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                            Signed in as
                          </p>
                          <p className="text-xs font-bold text-slate-900 truncate">{user.email}</p>
                        </div>
                        <Link
                          to={getDashboardLink()}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 hover:text-[#FF6B00] transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Store className="w-4 h-4 text-slate-500" />
                          <span>Dashboard Portal</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            navigate('/');
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/seller/login"
                    className="hidden md:flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-lg text-slate-800 hover:text-[#FF6B00] hover:bg-slate-50 transition-colors group min-h-[44px] min-w-[44px] justify-center"
                    title="Account / Sign In"
                    aria-label="Account / Sign In"
                  >
                    <User className="w-5 h-5 text-slate-700 group-hover:text-[#FF6B00] transition-colors" />
                    <span className="hidden sm:inline text-xs font-bold tracking-wider uppercase">
                      Account
                    </span>
                  </Link>
                )}

                {/* Shopping Cart */}
                <Link
                  to="/cart"
                  className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-lg text-slate-800 hover:text-[#FF6B00] hover:bg-slate-50 transition-colors group relative min-h-[44px] min-w-[44px] justify-center"
                  title="Shopping Bag"
                  aria-label="Shopping Bag"
                >
                  <div className="relative">
                    <ShoppingBag className="w-5 h-5 text-slate-700 group-hover:text-[#FF6B00] transition-colors" />
                    {itemCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-[#FF6B00] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm">
                        {itemCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:inline text-xs font-bold tracking-wider uppercase">
                    Cart
                  </span>
                  {itemCount > 0 && (
                    <span className="hidden md:inline text-xs font-bold text-[#FF6B00] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                      ({itemCount})
                    </span>
                  )}
                </Link>

                {/* Mobile Menu Toggle Button */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 text-slate-900 hover:text-[#FF6B00] rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Toggle navigation menu"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. TIER 2: CATEGORY NAVIGATION BAR (Dedicated secondary bar)               */}
        {/* ========================================================================= */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* Desktop Navigation Row: Centered with balanced gap */}
            <nav className="hidden lg:flex items-center justify-center gap-6 xl:gap-8">
              <Link
                to="/categories/all"
                className="text-xs font-bold uppercase tracking-wider py-3.5 transition-colors whitespace-nowrap relative group text-slate-800 hover:text-[#0F172A]"
              >
                <span>ALL PRODUCTS</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0F172A] transition-all duration-200 group-hover:w-full" />
              </Link>

              <Link
                to="/collections/new-arrivals"
                className="text-xs font-bold uppercase tracking-wider py-3.5 transition-colors whitespace-nowrap relative group text-slate-800 hover:text-[#0F172A]"
              >
                <span>NEW ARRIVALS</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0F172A] transition-all duration-200 group-hover:w-full" />
              </Link>

              {primaryCategories.map((cat) => {
                const subCats = getSubCategories(cat.id);
                const hasSubCats = subCats.length > 0;

                return (
                  <div key={cat.id} className="relative group py-3.5 flex items-center">
                    <Link
                      to={`/categories/${cat.slug}`}
                      className="text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap text-slate-800 hover:text-[#0F172A] flex items-center gap-1"
                    >
                      <span>{cat.name.toUpperCase()}</span>
                      {hasSubCats && (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0F172A] transition-transform duration-200 group-hover:rotate-180" />
                      )}
                    </Link>
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0F172A] transition-all duration-200 group-hover:w-full" />

                    {/* 7Collection-Style Hover Dropdown for Primary Category */}
                    {hasSubCats && (
                      <div className="absolute top-full left-0 hidden group-hover:block pt-1 z-50">
                        <div className="bg-white border border-slate-200 shadow-lg py-2 px-0 min-w-[170px] rounded-none animate-in fade-in-50 duration-150">
                          {subCats.map((sub) => (
                            <Link
                              key={sub.id}
                              to={`/categories/${sub.slug}`}
                              className="text-xs font-semibold uppercase tracking-wider text-slate-800 hover:text-[#0F172A] hover:bg-slate-50 px-4 py-2 block transition-colors whitespace-nowrap"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* "MORE ▾" Dropdown for Remaining Categories */}
              {extraCategories.length > 0 && (
                <div
                  ref={moreMenuRef}
                  className="relative group py-3.5 flex items-center"
                  onMouseEnter={() => setMoreMenuOpen(true)}
                  onMouseLeave={() => setMoreMenuOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                    className="text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap text-slate-800 hover:text-[#0F172A] flex items-center gap-1 cursor-pointer focus:outline-none"
                    aria-expanded={moreMenuOpen}
                    aria-haspopup="true"
                  >
                    <span>MORE</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 group-hover:text-[#0F172A] transition-transform duration-200 ${
                        moreMenuOpen ? 'rotate-180 text-[#0F172A]' : ''
                      }`}
                    />
                  </button>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0F172A] transition-all duration-200 group-hover:w-full" />

                  {/* 7Collection-Style MORE Dropdown Menu */}
                  {moreMenuOpen && (
                    <div className="absolute top-full right-0 pt-1 z-50 animate-in fade-in-50 duration-150">
                      <div className="bg-white border border-slate-200 shadow-lg py-2 px-0 min-w-[210px] max-w-[280px] rounded-none max-h-[70vh] overflow-y-auto">
                        {extraCategories.map((cat) => {
                          const subCats = getSubCategories(cat.id);
                          const hasSubCats = subCats.length > 0;
                          const isAccordionExpanded = !!expandedMoreCats[cat.id];

                          return (
                            <div key={cat.id} className="border-b border-slate-100 last:border-b-0">
                              <div className="flex items-center justify-between hover:bg-slate-50 group/item">
                                <Link
                                  to={`/categories/${cat.slug}`}
                                  onClick={() => setMoreMenuOpen(false)}
                                  className="flex-1 text-xs font-semibold uppercase tracking-wider text-slate-800 hover:text-[#0F172A] px-4 py-2.5 block transition-colors truncate"
                                >
                                  {cat.name}
                                </Link>
                                {hasSubCats && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedMoreCats((prev) => ({
                                        ...prev,
                                        [cat.id]: !prev[cat.id],
                                      }));
                                    }}
                                    className="px-3 py-2.5 text-slate-400 hover:text-[#0F172A] transition-colors cursor-pointer"
                                    title={isAccordionExpanded ? 'Collapse sub-categories' : 'Expand sub-categories'}
                                  >
                                    <ChevronDown
                                      className={`w-3.5 h-3.5 transition-transform duration-150 ${
                                        isAccordionExpanded ? 'rotate-180 text-[#0F172A]' : ''
                                      }`}
                                    />
                                  </button>
                                )}
                              </div>

                              {/* Expandable Sub-Categories inside MORE dropdown */}
                              {hasSubCats && isAccordionExpanded && (
                                <div className="bg-slate-50 border-t border-slate-100 py-1 pl-4 pr-1">
                                  {subCats.map((sub) => (
                                    <Link
                                      key={sub.id}
                                      to={`/categories/${sub.slug}`}
                                      onClick={() => setMoreMenuOpen(false)}
                                      className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 px-3 py-1.5 block transition-colors truncate rounded-none"
                                    >
                                      {sub.name}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* Mobile / Tablet Horizontal Scroll Navigation */}
            <div className="lg:hidden overflow-x-auto py-2.5 flex items-center gap-5 scrollbar-none text-xs font-bold tracking-wider">
              <Link
                to="/categories/all"
                className="whitespace-nowrap px-1 py-1 transition-colors text-slate-800 hover:text-[#0F172A]"
              >
                ALL PRODUCTS
              </Link>
              <Link
                to="/collections/new-arrivals"
                className="whitespace-nowrap px-1 py-1 transition-colors text-slate-800 hover:text-[#0F172A]"
              >
                NEW ARRIVALS
              </Link>
              {navCategories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/categories/${cat.slug}`}
                  className="whitespace-nowrap px-1 py-1 transition-colors text-slate-800 hover:text-[#0F172A]"
                >
                  {cat.name.toUpperCase()}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Full Slide-Out Drawer & Backdrop */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* Dark Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-Out Drawer Panel */}
            <div className="fixed inset-y-0 left-0 w-[85%] max-w-[320px] bg-white h-screen z-50 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 shrink-0">
                <Link
                  to="/"
                  className="flex items-center gap-2.5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <img
                    src={brandLogo}
                    alt="Martify Collection"
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                  <div className="flex items-center">
                    <span className="text-sm sm:text-base font-black tracking-tight text-[#0F172A] uppercase select-none">
                      MARTIFY COLLECTION<span className="text-orange-500">.</span>
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Drawer Body */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                {/* Quick Search Trigger Button */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSearchModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-none border border-slate-200 bg-slate-50 text-slate-500 text-xs font-medium text-left min-h-[44px]"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-slate-400" />
                    <span>Search catalog or stores...</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-none bg-white border border-slate-200 font-mono">
                    Search
                  </span>
                </button>

                {/* Category Links with Expandable Sub-Categories */}
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">
                    CATALOG SECTIONS
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    <Link
                      to="/categories/all"
                      className="block px-3 py-2.5 text-xs font-bold uppercase tracking-wider rounded-none hover:bg-slate-50 transition-colors text-slate-800 hover:text-[#0F172A] min-h-[40px] flex items-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      ALL PRODUCTS
                    </Link>
                    <Link
                      to="/collections/new-arrivals"
                      className="block px-3 py-2.5 text-xs font-bold uppercase tracking-wider rounded-none hover:bg-slate-50 transition-colors text-slate-800 hover:text-[#0F172A] min-h-[40px] flex items-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      NEW ARRIVALS
                    </Link>

                    {navCategories.map((cat) => {
                      const subCats = getSubCategories(cat.id);
                      const isExpanded = !!expandedMobileCats[cat.id];

                      return (
                        <div key={cat.id} className="border-b border-slate-100 last:border-b-0 py-0.5">
                          <div className="flex items-center justify-between">
                            <Link
                              to={`/categories/${cat.slug}`}
                              className="flex-1 px-3 py-2.5 text-xs font-bold uppercase tracking-wider rounded-none hover:bg-slate-50 transition-colors text-slate-800 hover:text-[#0F172A] min-h-[40px] flex items-center"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {cat.name.toUpperCase()}
                            </Link>
                            {subCats.length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedMobileCats((prev) => ({
                                    ...prev,
                                    [cat.id]: !prev[cat.id],
                                  }))
                                }
                                className="p-2 text-slate-400 hover:text-[#0F172A] cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                                title="Toggle sub-categories"
                                aria-label={`Toggle ${cat.name} sub-categories`}
                              >
                                <span className="font-bold text-sm text-slate-500">
                                  {isExpanded ? '−' : '+'}
                                </span>
                              </button>
                            )}
                          </div>

                          {/* Expandable Sub-Categories in Mobile Drawer */}
                          {subCats.length > 0 && isExpanded && (
                            <div className="pl-4 py-1.5 space-y-1 border-l-2 border-[#0F172A] ml-3 my-1">
                              {subCats.map((sub) => (
                                <Link
                                  key={sub.id}
                                  to={`/categories/${sub.slug}`}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="block px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:text-[#0F172A] hover:bg-slate-50 rounded-none transition-colors min-h-[36px] flex items-center"
                                >
                                  {sub.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* User Account / Auth Section */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">
                    ACCOUNT
                  </span>
                  {isAuthenticated && user ? (
                    <div className="space-y-2">
                      <div className="px-3 py-2 bg-slate-50 border border-slate-200">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        to={getDashboardLink()}
                        className="w-full text-center py-2.5 bg-[#0F172A] text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors min-h-[44px] flex items-center justify-center gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Store className="w-4 h-4" />
                        <span>Dashboard Portal</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          navigate('/');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-center py-2.5 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition-colors min-h-[44px] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <Link
                      to="/seller/login"
                      className="w-full text-center py-2.5 border border-slate-300 text-slate-800 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors min-h-[44px] flex items-center justify-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      <span>Sign In / Account</span>
                    </Link>
                  )}
                </div>

                {/* Seller Links */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">
                    MERCHANT & HELP
                  </span>
                  <Link
                    to="/seller/register"
                    className="w-full text-center py-3 rounded-none bg-[#0F172A] text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors min-h-[44px] flex items-center justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Become a Seller
                  </Link>
                  <Link
                    to="/seller/login"
                    className="w-full text-center py-3 rounded-none border border-slate-300 text-slate-800 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors min-h-[44px] flex items-center justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Seller Portal Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 4. LUXURY SEARCH MODAL OVERLAY (Triggered from Tier 1 Search Button)       */}
      {/* ========================================================================= */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center border-b border-slate-150 px-4 py-3 sm:py-4">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, collections, or brands..."
                className="w-full px-3 text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none bg-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 mr-2 cursor-pointer"
                  title="Clear query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              >
                ESC
              </button>
            </form>

            {/* Results Body (Clean borderless list when typing begins) */}
            <div className="max-h-[60vh] overflow-y-auto px-4 py-2 sm:px-5">
              {liveSearching && (
                <div className="py-10 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00]" />
                  <span className="text-xs font-medium">Searching catalog...</span>
                </div>
              )}

              {/* Active Results Display */}
              {!liveSearching && searchResults && (
                <div className="space-y-4">
                  {/* Matching Stores */}
                  {searchResults.stores.length > 0 && (
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1 flex items-center justify-between">
                        <span>Matching Stores</span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                          {searchResults.stores.length} found
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {searchResults.stores.slice(0, 4).map((store) => {
                          const storeDisplayName = store.storeName || store.name;
                          return (
                            <Link
                              key={store.id}
                              to={`/sellers/${store.id}`}
                              onClick={() => setSearchModalOpen(false)}
                              className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-150 hover:border-orange-200 hover:bg-orange-50/40 transition-colors group"
                            >
                              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                                {store.storeImageUrl ? (
                                  <img
                                    src={getProductImageUrl(store.storeImageUrl)}
                                    alt={storeDisplayName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Store className="w-4 h-4 text-[#FF6B00]" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-[#FF6B00] transition-colors">
                                  {storeDisplayName}
                                </h4>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {store.storeDescription || 'Verified Merchant Store'}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Matching Products */}
                  {searchResults.products.length > 0 && (
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1">
                        Matching Products ({searchResults.products.length})
                      </div>
                      <div className="space-y-1.5">
                        {searchResults.products.slice(0, 5).map((prod) => (
                          <Link
                            key={prod.id}
                            to={`/products/${prod.id}`}
                            onClick={() => setSearchModalOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                          >
                            <img
                              src={getProductImageUrl(prod.imageUrl, prod.category?.slug)}
                              alt={prod.title}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                            />
                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="text-xs font-semibold text-slate-900 truncate group-hover:text-[#FF6B00] transition-colors">
                                {prod.title}
                              </h4>
                              <span className="text-[11px] text-slate-400">
                                {prod.category?.name}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-900 font-mono shrink-0">
                              ${formatPrice(prod.price)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {searchResults.products.length === 0 && searchResults.stores.length === 0 && (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      No products or stores found matching "{searchQuery}".
                    </div>
                  )}

                  {/* Bottom View All CTA */}
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="w-full mt-2 py-3 bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>View all results for "{searchQuery}"</span>
                    <ArrowRight className="w-4 h-4 text-[#FF6B00]" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
