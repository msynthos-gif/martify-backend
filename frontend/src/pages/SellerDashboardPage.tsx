import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  DollarSign,
  Plus,
  Trash2,
  Pencil,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Headset,
  Image as ImageIcon,
  Loader2,
  Check,
  Search,
  Store,
  Camera,
} from 'lucide-react';
import { sellerApi } from '../api/seller.api';
import { publicApi } from '../api/public.api';
import { useAuth } from '../context/AuthContext';
import type {
  Product,
  Order,
  SupportTicket,
  Category,
  User,
} from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/Badge';
import { formatPrice, getProductImageUrl, getMediaUrl, parseDocumentUrls } from '../utils/formatters';
import { WhatsAppChat } from '../components/chat/WhatsAppChat';

export const SellerDashboardPage: React.FC = () => {
  const { user: authUser, isAuthenticated, role, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [seller, setSeller] = useState<User | null>(authUser);
  const isOfficialStore = Boolean(seller?.isDemoAccount || authUser?.isDemoAccount);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'tickets'>('products');

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Browse Official Store Catalog Modal State
  const [showOfficialCatalogModal, setShowOfficialCatalogModal] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>([]);
  const [batchImporting, setBatchImporting] = useState(false);
  const [batchImportSuccess, setBatchImportSuccess] = useState<string | null>(null);
  const [batchImportError, setBatchImportError] = useState<string | null>(null);

  // Store Profile Edit Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    storeName: '',
    storeDescription: '',
    storeImageUrl: '',
  });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);

  // Single Continuous Support Chat State
  const [conversation, setConversation] = useState<SupportTicket | null>(null);

  // Action Modals / Forms
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: '',
    stock: '10',
    categoryId: '',
    clonedFromProductId: null as string | null,
    images: [] as string[],
    attributes: {} as Record<string, string[]>,
    manualSoldCount: '0',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formGeneralError, setFormGeneralError] = useState<string | null>(null);
  const [uploadingProductImages, setUploadingProductImages] = useState(false);
  const productImagesInputRef = useRef<HTMLInputElement | null>(null);

  // Document verification re-upload state
  const [kycFiles, setKycFiles] = useState<File[]>([]);
  const [uploadingKyc, setUploadingKyc] = useState(false);

  // KYC Approved Banner visibility (shows only first time, saved to localStorage)
  const [showKycApprovedBanner, setShowKycApprovedBanner] = useState<boolean>(false);
  const checkedBannerRef = useRef<boolean>(false);

  useEffect(() => {
    if (seller?.id && !checkedBannerRef.current) {
      if (seller.sellerStatus !== 'APPROVED' && seller.kycStatus === 'APPROVED') {
        checkedBannerRef.current = true;
        const key = `kyc_approved_banner_seen_${seller.id}`;
        const seen = localStorage.getItem(key) === 'true';
        if (!seen) {
          setShowKycApprovedBanner(true);
          localStorage.setItem(key, 'true');
        } else {
          setShowKycApprovedBanner(false);
        }
      }
    }
  }, [seller?.id, seller?.sellerStatus, seller?.kycStatus]);



  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  // Load Dashboard Data
  const loadDashboardData = async () => {
    if (!isAuthenticated || role !== 'SELLER') return;
    setLoading(true);
    setError(null);
    try {
      const [profileData, prodsData, catsData, conversationData] = await Promise.all([
        sellerApi.getProfile(),
        sellerApi.getProducts().catch(() => []),
        publicApi.getCategories().catch(() => []),
        sellerApi.getConversation().catch(() => null), // Load conversation for all sellers!
      ]);
      setSeller(profileData);
      updateUser(profileData);
      setProducts(prodsData);
      setCategories(catsData);
      setConversation(conversationData);

      // Approved merchant specific data
      if (profileData.sellerStatus === 'APPROVED') {
        const [catalogData, ordersData] = await Promise.all([
          publicApi.getCatalogProducts().catch(() => []),
          sellerApi.getOrders().catch(() => []),
        ]);
        setCatalogProducts(catalogData);
        setOrders(ordersData);
      }
    } catch (err: any) {
      setError(err?.friendlyMessage || 'Failed to load seller profile.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch all active dashboard state without full-page loading flash
  const handleRefresh = async () => {
    if (!isAuthenticated || role !== 'SELLER' || isRefreshing) return;
    setIsRefreshing(true);
    setError(null);
    try {
      const [profileData, prodsData, catsData, conversationData] = await Promise.all([
        sellerApi.getProfile(),
        sellerApi.getProducts().catch(() => []),
        publicApi.getCategories().catch(() => []),
        sellerApi.getConversation().catch(() => null),
      ]);
      setSeller(profileData);
      updateUser(profileData);
      setProducts(prodsData);
      setCategories(catsData);
      setConversation(conversationData);

      if (profileData.sellerStatus === 'APPROVED') {
        const [catalogData, ordersData] = await Promise.all([
          publicApi.getCatalogProducts().catch(() => []),
          sellerApi.getOrders().catch(() => []),
        ]);
        setCatalogProducts(catalogData);
        setOrders(ordersData);
      }
    } catch (err: any) {
      setError(err?.friendlyMessage || 'Failed to refresh dashboard data.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 350);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || role !== 'SELLER') {
      navigate('/seller/login');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, role]);

  // Immediate conversation refetch when switching to tickets tab
  useEffect(() => {
    if (activeTab === 'tickets' && isAuthenticated && role === 'SELLER') {
      sellerApi.getConversation().then((conv) => {
        if (conv) setConversation(conv);
      }).catch(console.error);
    }
  }, [activeTab, isAuthenticated, role]);

  // Real-time live polling for incoming messages while in tickets tab
  useEffect(() => {
    if (activeTab !== 'tickets' || !isAuthenticated || role !== 'SELLER') return;

    const interval = setInterval(async () => {
      try {
        const latest = await sellerApi.getConversation();
        if (latest) {
          setConversation(latest);
        }
      } catch (e) {
        // silent polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeTab, isAuthenticated, role]);

  // Handle Verification Document upload
  const handleKycUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (kycFiles.length === 0) return;
    setUploadingKyc(true);
    try {
      const uploadRes = await sellerApi.uploadKycDocument(kycFiles);
      const urls = uploadRes.urls && uploadRes.urls.length > 0 ? uploadRes.urls : [uploadRes.url];
      const updated = await sellerApi.submitKyc(urls);
      setSeller(updated);
      updateUser(updated);
      setKycFiles([]);
    } catch (err: any) {
      alert(err?.friendlyMessage || 'Failed to upload verification documents');
    } finally {
      setUploadingKyc(false);
    }
  };

  // Store Profile Handlers
  const handleOpenEditProfile = () => {
    setProfileForm({
      storeName: seller?.storeName || seller?.name || '',
      storeDescription: seller?.storeDescription || '',
      storeImageUrl: seller?.storeImageUrl || '',
    });
    setProfileImageFile(null);
    setProfileImagePreview(seller?.storeImageUrl ? getProductImageUrl(seller.storeImageUrl) : null);
    setProfileError(null);
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.storeName.trim()) {
      setProfileError('Store name cannot be empty.');
      return;
    }
    setSavingProfile(true);
    setProfileError(null);
    try {
      let finalImageUrl = profileForm.storeImageUrl;
      if (profileImageFile) {
        const uploadRes = await sellerApi.uploadStoreImage(profileImageFile);
        finalImageUrl = uploadRes.url;
      }
      const updated = await sellerApi.updateStoreProfile({
        storeName: profileForm.storeName.trim(),
        storeDescription: profileForm.storeDescription.trim() || null,
        storeImageUrl: finalImageUrl || null,
      });
      setSeller((prev) => (prev ? { ...prev, ...updated } : prev));
      updateUser({ ...authUser, ...updated } as any);
      setShowProfileModal(false);
    } catch (err: any) {
      setProfileError(err?.friendlyMessage || 'Failed to update store profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Open Add Product Modal (Exclusive to Official Store)
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setFormGeneralError(null);
    setFormErrors({});
    setProductForm({
      title: '',
      description: '',
      price: '',
      stock: '50',
      categoryId: categories[0]?.id || '',
      clonedFromProductId: null,
      images: [],
      attributes: {},
      manualSoldCount: '0',
      isActive: true,
    });
    setShowAddProduct(true);
  };

  // Multi-image selection & upload handler for product listing
  const handleProductImageFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    const remainingSlots = 5 - productForm.images.length;
    if (remainingSlots <= 0) {
      alert('Maximum 5 product images allowed.');
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    setUploadingProductImages(true);
    try {
      const uploadedUrls = await sellerApi.uploadProductImages(filesToUpload);
      if (uploadedUrls.length > 0) {
        setProductForm((prev) => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
        }));
        if (formErrors.images) {
          setFormErrors((prev) => ({ ...prev, images: '' }));
        }
      }
    } catch (err: any) {
      alert(err?.friendlyMessage || 'Failed to upload product images');
    } finally {
      setUploadingProductImages(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveProductImage = (indexToRemove: number) => {
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Quick toggle product active / inactive state
  const handleToggleProductActive = async (p: Product) => {
    try {
      const nextActive = !p.isActive;
      const updated = await sellerApi.updateProduct(p.id, { isActive: nextActive });
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, isActive: updated.isActive } : item))
      );
    } catch (err: any) {
      alert(err?.friendlyMessage || 'Failed to update product status');
    }
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setFormGeneralError(null);
    setFormErrors({});
    const existingImages = (p.images && p.images.length > 0)
      ? p.images.map((img) => img.url)
      : (p.imageUrl ? [p.imageUrl] : []);
    setProductForm({
      title: p.title,
      description: p.description,
      price: String(p.price),
      stock: String(p.stock),
      categoryId: p.categoryId,
      clonedFromProductId: p.clonedFromProductId || null,
      images: existingImages,
      attributes: (p.attributes as Record<string, string[]>) || {},
      manualSoldCount: String(p.manualSoldCount ?? 0),
      isActive: p.isActive,
    });
    setShowAddProduct(true);
  };

  // Toggle selection of catalog product
  const handleToggleCatalogSelection = (id: string) => {
    setSelectedCatalogIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all or deselect all visible catalog products
  const handleToggleSelectAllVisible = (visibleIds: string[]) => {
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedCatalogIds.includes(id));
    if (allSelected) {
      setSelectedCatalogIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedCatalogIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Batch import selected products directly to seller store
  const handleBatchImportSelected = async () => {
    if (selectedCatalogIds.length === 0 || batchImporting) return;
    setBatchImporting(true);
    setBatchImportError(null);
    setBatchImportSuccess(null);

    try {
      const res = await sellerApi.batchCloneProducts(selectedCatalogIds);
      const count = res.count || selectedCatalogIds.length;
      setBatchImportSuccess(`Successfully listed ${count} product${count > 1 ? 's' : ''} to your store!`);
      setSelectedCatalogIds([]);
      await loadDashboardData();
      setTimeout(() => {
        setBatchImportSuccess(null);
        setShowOfficialCatalogModal(false);
      }, 1200);
    } catch (err: any) {
      setBatchImportError(err?.friendlyMessage || 'Failed to list selected products. Please try again.');
    } finally {
      setBatchImporting(false);
    }
  };

  // Instant single import of a catalog product directly to seller store
  const handleSingleDirectImport = async (catProd: Product) => {
    setBatchImporting(true);
    setBatchImportError(null);
    setBatchImportSuccess(null);

    try {
      await sellerApi.cloneProduct({
        catalogProductId: catProd.id,
        price: Number(catProd.price),
        stock: 20,
      });
      setBatchImportSuccess(`Listed "${catProd.title}" directly to your store!`);
      await loadDashboardData();
      setTimeout(() => {
        setBatchImportSuccess(null);
        setShowOfficialCatalogModal(false);
      }, 1000);
    } catch (err: any) {
      setBatchImportError(err?.friendlyMessage || 'Failed to list product. Please try again.');
    } finally {
      setBatchImporting(false);
    }
  };

  // Handle Product Save (Update only, official catalog items)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormGeneralError(null);
    setFormErrors({});

    try {
      const finalTitle = productForm.title.trim();
      const finalDescription = productForm.description.trim();
      const selectedCat = categories.find((c) => c.id === (productForm.categoryId || categories[0]?.id));
      const catSlug = selectedCat?.slug || '';
      const catName = selectedCat?.name || '';
      const isFashion = catSlug === 'fashion-apparel' || catName.includes('Fashion');
      const isSports = catSlug === 'sports-outdoors' || catName.includes('Sports');
      const isBeauty = catSlug === 'beauty-personal-care' || catName.includes('Beauty');

      const finalAttributes: Record<string, string[]> = {};
      if (isFashion) {
        if (productForm.attributes['size']?.length) {
          finalAttributes['size'] = productForm.attributes['size'];
        }
        if (productForm.attributes['color']?.length) {
          finalAttributes['color'] = productForm.attributes['color'];
        }
      } else if (isSports) {
        if (productForm.attributes['size']?.length) {
          finalAttributes['size'] = productForm.attributes['size'];
        }
      } else if (isBeauty) {
        if (productForm.attributes['volume']?.length) {
          finalAttributes['volume'] = productForm.attributes['volume'];
        }
      }
      const attributesPayload = Object.keys(finalAttributes).length > 0 ? finalAttributes : undefined;

      if (isOfficialStore && productForm.images.length === 0) {
        setFormErrors({ images: 'Please upload at least 1 product image.' });
        setFormGeneralError('Please upload at least 1 product photo from your device.');
        return;
      }

      const manualSoldCountVal = isOfficialStore && productForm.manualSoldCount !== ''
        ? Math.max(0, parseInt(productForm.manualSoldCount, 10) || 0)
        : undefined;

      if (editingProduct) {
        const updated = await sellerApi.updateProduct(editingProduct.id, {
          title: finalTitle,
          description: finalDescription,
          price: parseFloat(productForm.price),
          stock: parseInt(productForm.stock, 10),
          categoryId: productForm.categoryId || categories[0]?.id,
          imageUrl: productForm.images[0],
          images: productForm.images,
          attributes: attributesPayload,
          isActive: productForm.isActive,
          ...(isOfficialStore ? { manualSoldCount: manualSoldCountVal } : {}),
        });
        setProducts(products.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await sellerApi.createProduct({
          title: finalTitle,
          description: finalDescription,
          price: parseFloat(productForm.price),
          stock: parseInt(productForm.stock, 10),
          categoryId: productForm.categoryId || categories[0]?.id,
          clonedFromProductId: productForm.clonedFromProductId || undefined,
          imageUrl: productForm.images[0],
          images: productForm.images,
          attributes: attributesPayload,
          manualSoldCount: manualSoldCountVal,
          isActive: productForm.isActive,
        });
        setProducts([created, ...products]);
      }
      setShowAddProduct(false);
      setEditingProduct(null);
      await loadDashboardData();
    } catch (err: any) {
      const msg = err?.friendlyMessage || 'Failed to save product';
      setFormGeneralError(msg);
      if (err?.fieldErrors) {
        setFormErrors(err.fieldErrors);
      }
      alert(msg);
    }
  };

  // Handle Product Deletion (Disabled for Official Store)
  const handleDeleteProduct = async (id: string) => {
    if (isOfficialStore) {
      alert('Official Store products cannot be deleted to preserve catalog integrity and order history. Please use the Active/Inactive toggle instead.');
      return;
    }
    if (!confirm('Are you sure you want to remove this product?')) return;
    try {
      await sellerApi.deleteProduct(id);
      setProducts(products.filter((p) => p.id !== id));
      loadDashboardData();
    } catch (err: any) {
      alert(err?.friendlyMessage || 'Failed to delete product');
    }
  };



  if (loading) {
    return <LoadingSpinner size="lg" message="Loading Seller Dashboard..." />;
  }

  const isApproved = seller?.sellerStatus === 'APPROVED';

  return (
    <div className="bg-slate-50 min-h-screen pb-24 text-slate-800">
      {/* Top Header - Clean, calm white banner */}
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-700 text-lg shrink-0">
                {seller?.storeImageUrl ? (
                  <img
                    src={getProductImageUrl(seller.storeImageUrl)}
                    alt={seller?.storeName || seller?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{(seller?.storeName || seller?.name || 'S').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-normal">
                    {seller?.storeName || seller?.name}
                  </h1>
                  {isApproved && (
                    <span title="Verified Store" className="inline-flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </span>
                  )}
                  {isApproved && (
                    <button
                      type="button"
                      onClick={handleOpenEditProfile}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-600 hover:text-navy-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer ml-1"
                      title="Edit Store Profile"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit Profile</span>
                    </button>
                  )}
                </div>

                {/* Clear Store Identity Badge */}
                <div className="mt-1 flex items-center gap-2">
                  {isOfficialStore ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-gradient-to-r from-purple-100 via-indigo-50 to-blue-100 text-indigo-950 border border-indigo-200 shadow-xs">
                      <span className="text-sm">🏛️</span>
                      <span className="tracking-wide">OFFICIAL STORE CATALOG ADMIN</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      <span className="text-xs">🏪</span>
                      <span>SELLER STOREFRONT</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  {seller?.storeDescription ? (
                    <span className="line-clamp-1 max-w-md">{seller.storeDescription}</span>
                  ) : (
                    <span>{seller?.email} {seller?.phone ? `• ${seller.phone}` : ''}</span>
                  )}
                </p>
                {isApproved && (
                  <a
                    href={`/sellers/${seller?.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy-900 hover:underline mt-0.5"
                  >
                    <span>View Public Storefront</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Store:</span>
                <StatusBadge status={seller?.sellerStatus} size="sm" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Verification:</span>
                <StatusBadge status={seller?.kycStatus} size="sm" />
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs ml-2 cursor-pointer disabled:opacity-60"
                title="Refresh dashboard data"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-navy-900' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/seller/login');
                }}
                className="px-3.5 py-1.5 rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-xs font-medium transition-colors shadow-xs"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Error notification banner */}
          {error && (
            <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Metrics - Clean light stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Active Products</span>
                <Package className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-2xl font-bold text-slate-900 mt-2 block">
                {products.length} <span className="text-sm font-normal text-slate-500">listed</span>
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Customer Orders</span>
                <ShoppingBag className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-2xl font-bold text-slate-900 mt-2 block">
                {orders.length} <span className="text-sm font-normal text-slate-500">{orders.length === 1 ? 'order' : 'orders'}</span>
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Available Balance</span>
                <DollarSign className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900 block">
                  ${formatPrice(seller?.balanceAvailable)}
                </span>
                <span className="text-xs font-medium text-slate-500 block mt-0.5">
                  (On Hold: ${formatPrice(seller?.balanceOnHold)})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending / Verification Status Banner */}
      {seller?.sellerStatus !== 'APPROVED' && (
        (seller?.kycStatus === 'APPROVED' && !showKycApprovedBanner) ? null : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            {seller?.kycStatus === 'APPROVED' ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-emerald-900">
                        Documents Verified — Awaiting Store Activation
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                        Step 1 of 2 Complete
                      </span>
                    </div>
                    <p className="text-xs text-emerald-700 leading-relaxed max-w-2xl">
                      Your verification documents have been approved. Your store is now awaiting final review by our administrative team before you can publish products and request stock.
                    </p>
                    {seller?.kycDocumentUrl && (
                      <div className="flex flex-wrap gap-3 pt-1">
                        {parseDocumentUrls(seller.kycDocumentUrl).map((url, idx, arr) => (
                          <a
                            key={url}
                            href={getMediaUrl(url)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 underline"
                          >
                            <span>View verified document {arr.length > 1 ? `#${idx + 1}` : ''}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowKycApprovedBanner(false)}
                  className="text-emerald-700 hover:text-emerald-900 p-1 rounded transition-colors self-start md:self-center cursor-pointer"
                  title="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : seller?.kycStatus === 'REJECTED' ? (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold text-rose-900">Document Verification Rejected</h4>
                  <p className="text-xs text-rose-700 leading-relaxed max-w-2xl">
                    Your verification documents could not be validated. Please re-upload clear government-issued ID or official business license documents.
                  </p>
                </div>
              </div>

              <form onSubmit={handleKycUpload} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setKycFiles(Array.from(e.target.files));
                    }
                  }}
                  className="text-xs"
                />
                <button
                  type="submit"
                  disabled={kycFiles.length === 0 || uploadingKyc}
                  className="px-3.5 py-1.5 rounded-md bg-navy-900 hover:bg-navy-800 text-white text-xs font-medium disabled:opacity-50 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                >
                  {uploadingKyc ? 'Uploading...' : kycFiles.length > 1 ? `Upload ${kycFiles.length} Documents` : 'Re-upload Documents'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold text-amber-900">Document Verification Pending</h4>
                  <p className="text-xs text-amber-700 leading-relaxed max-w-2xl">
                    {seller?.kycStatus === 'NOT_SUBMITTED'
                      ? 'Please upload your verification documents below to start the merchant onboarding process.'
                      : 'Your documents are currently under review by our compliance team. Once verified, your store will proceed to final activation.'}
                  </p>
                  {seller?.kycDocumentUrl && (
                    <div className="flex flex-wrap gap-3 pt-1">
                      {parseDocumentUrls(seller.kycDocumentUrl).map((url, idx, arr) => (
                        <a
                          key={url}
                          href={getMediaUrl(url)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 underline"
                        >
                          <span>View submitted document {arr.length > 1 ? `#${idx + 1}` : ''}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {seller?.kycStatus === 'NOT_SUBMITTED' && (
                <form onSubmit={handleKycUpload} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setKycFiles(Array.from(e.target.files));
                      }
                    }}
                    className="text-xs"
                  />
                  <button
                    type="submit"
                    disabled={kycFiles.length === 0 || uploadingKyc}
                    className="px-3.5 py-1.5 rounded-md bg-navy-900 hover:bg-navy-800 text-white text-xs font-medium disabled:opacity-50 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    {uploadingKyc ? 'Uploading...' : kycFiles.length > 1 ? `Submit ${kycFiles.length} Documents` : 'Submit Documents'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
          {[
            { id: 'products', label: 'Products', icon: Package },
            { id: 'orders', label: 'Orders', icon: ShoppingBag },
            { id: 'tickets', label: 'Customer Support', icon: Headset },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-navy-900 text-navy-900 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-navy-900' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* TAB 1: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Products</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage active products listed in your marketplace storefront.
                  </p>
                </div>

                {isApproved && (
                  isOfficialStore ? (
                    <button
                      type="button"
                      onClick={handleOpenAddProduct}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-white" />
                      <span>Add Product</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowOfficialCatalogModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <span>Add from Official Store</span>
                    </button>
                  )
                )}
              </div>

              {products.length === 0 ? (
                <div className="border border-dashed border-slate-300 rounded-lg p-10 text-center bg-white shadow-xs">
                  <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-slate-900">No products yet</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {isOfficialStore
                      ? 'Add your first catalog product listing using the Add Product button above.'
                      : 'Select and list products from the Official Store catalog to start selling.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => {
                    const imgCount = p.images?.length || 1;
                    const primaryImg = p.images?.[0]?.url || p.imageUrl;
                    return (
                      <div
                        key={p.id}
                        className="bg-white border border-slate-200 rounded-lg p-4 flex gap-3.5 items-center shadow-xs hover:border-slate-300 transition-colors"
                      >
                        <div className="relative w-16 h-16 shrink-0">
                          <img
                            src={getProductImageUrl(primaryImg, p.category?.slug)}
                            alt={p.title}
                            className="w-16 h-16 rounded-md object-cover bg-slate-100"
                          />
                          {imgCount > 1 && (
                            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-navy-900 text-white text-[9px] font-bold shadow-xs">
                              {imgCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-medium text-slate-500 block">
                            {p.category?.name}
                          </span>
                          <h4 className="text-xs font-semibold text-slate-900 truncate">{p.title}</h4>
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="font-semibold text-slate-900">${formatPrice(p.price)}</span>
                            <span className="text-slate-500 text-[11px]">Stock: {p.stock}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Active / Inactive Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleProductActive(p)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                              p.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                            }`}
                            title={p.isActive ? 'Product is Active (Click to set Inactive)' : 'Product is Inactive (Click to set Active)'}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <span>{p.isActive ? 'Active' : 'Inactive'}</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-navy-900 transition-colors cursor-pointer"
                            title="Edit product and manage images"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Delete Button (Completely removed for Official Store) */}
                          {!isOfficialStore && (
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ORDERS */}
          {activeTab === 'orders' && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Orders</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Purchases made by marketplace buyers.</p>
                </div>
                <span className="text-xs font-medium text-slate-500">{orders.length} orders</span>
              </div>

              {orders.length === 0 ? (
                <p className="text-xs text-slate-400 py-10 text-center">No orders received yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-medium">
                        <th className="py-3 px-2.5">Order</th>
                        <th className="py-3 px-2.5">Buyer</th>
                        <th className="py-3 px-2.5">Item</th>
                        <th className="py-3 px-2.5">Qty</th>
                        <th className="py-3 px-2.5">Total</th>
                        <th className="py-3 px-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-2.5 font-mono font-medium text-slate-900 whitespace-nowrap">
                            #{ord.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="py-3 px-2.5">
                            <div className="max-w-[180px]">
                              <div className="font-semibold text-slate-800 truncate" title={ord.buyerName}>
                                {ord.buyerName}
                              </div>
                              <div
                                className="text-[11px] text-slate-500 line-clamp-1 truncate"
                                title={ord.buyerAddress ? `${ord.buyerAddress}${ord.city ? `, ${ord.city}` : ''}` : ''}
                              >
                                {ord.buyerAddress}{ord.city ? `, ${ord.city}` : ''}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">{ord.buyerPhone}</div>
                            </div>
                          </td>
                          <td className="py-3 px-2.5 text-slate-700">
                            <div className="max-w-[150px]">
                              <div
                                className="font-medium text-slate-900 truncate line-clamp-1"
                                title={ord.product?.title || 'Catalog Item'}
                              >
                                {ord.product?.title || 'Catalog Item'}
                              </div>
                              {ord.selectedAttributes && Object.keys(ord.selectedAttributes).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Object.entries(ord.selectedAttributes).map(([k, v]) => (
                                    <span
                                      key={k}
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                                    >
                                      {k.toLowerCase() === 'size' ? 'Size' : k.toLowerCase() === 'volume' ? 'Vol' : k}: {String(v)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2.5 text-slate-700 whitespace-nowrap">{ord.quantity}</td>
                          <td className="py-3 px-2.5 font-semibold text-slate-900 whitespace-nowrap">
                            ${formatPrice(ord.totalPrice)}
                          </td>
                          <td className="py-3 px-2.5 whitespace-nowrap">
                            <StatusBadge status={ord.status} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: SINGLE CONTINUOUS SUPPORT CHAT (WHATSAPP INTERFACE) */}
          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <WhatsAppChat
                conversation={conversation}
                currentUserRole="SELLER"
                partnerName="Martify Collection"
                partnerSubtitle="Official Customer Support • Online"
                orders={orders}
                onSendMessage={async (msg) => {
                  const updated = await sellerApi.sendSupportMessage(msg);
                  setConversation(updated);
                }}
                onRefresh={async () => {
                  const updated = await sellerApi.getConversation();
                  if (updated) setConversation(updated);
                }}
                heightClass="h-[680px]"
              />
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD / EDIT PRODUCT */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {editingProduct
                    ? 'Edit Product Listing'
                    : isOfficialStore
                    ? 'Add New Catalog Product'
                    : 'List Product from Official Store'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingProduct
                    ? 'Update product details, pricing, stock, and variant specifications.'
                    : isOfficialStore
                    ? 'Create an original platform-curated catalog item with photos and details.'
                    : 'Customize pricing and stock for your storefront.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddProduct(false);
                  setEditingProduct(null);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              {formGeneralError && (
                <div id="product-form-error-banner" className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2 shadow-xs">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1 whitespace-pre-line font-medium leading-relaxed">
                    {formGeneralError}
                  </div>
                </div>
              )}
              <div>
                <label className="font-medium text-slate-700 block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={productForm.title}
                  onChange={(e) => {
                    setProductForm({ ...productForm, title: e.target.value });
                    if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: '' }));
                  }}
                  placeholder="e.g. Mechanical Keyboard"
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none ${
                    formErrors.title ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-navy-900'
                  }`}
                />
                {formErrors.title && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{formErrors.title}</p>
                )}
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => {
                    setProductForm({ ...productForm, description: e.target.value });
                    if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: '' }));
                  }}
                  placeholder="Product specifications and features"
                  className={`w-full px-3 py-2 border rounded-md text-xs focus:outline-none ${
                    formErrors.description ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-navy-900'
                  }`}
                />
                {formErrors.description && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{formErrors.description}</p>
                )}
              </div>
              <div className={`grid ${isOfficialStore ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'} gap-3`}>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => {
                      setProductForm({ ...productForm, price: e.target.value });
                      if (formErrors.price) setFormErrors((prev) => ({ ...prev, price: '' }));
                    }}
                    placeholder="49.99"
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none ${
                      formErrors.price ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-navy-900'
                    }`}
                  />
                  {formErrors.price && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1">{formErrors.price}</p>
                  )}
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => {
                      setProductForm({ ...productForm, stock: e.target.value });
                      if (formErrors.stock) setFormErrors((prev) => ({ ...prev, stock: '' }));
                    }}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none ${
                      formErrors.stock ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-navy-900'
                    }`}
                  />
                  {formErrors.stock && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1">{formErrors.stock}</p>
                  )}
                </div>
                {isOfficialStore && (
                  <div>
                    <label className="font-medium text-slate-700 block mb-1 flex items-center justify-between">
                      <span>Recently Sold Count</span>
                      <span className="text-[10px] text-amber-600 font-bold">🔥 Badge</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={productForm.manualSoldCount}
                      onChange={(e) => {
                        setProductForm({ ...productForm, manualSoldCount: e.target.value });
                        if (formErrors.manualSoldCount) setFormErrors((prev) => ({ ...prev, manualSoldCount: '' }));
                      }}
                      placeholder="e.g. 50"
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none ${
                        formErrors.manualSoldCount ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-navy-900'
                      }`}
                    />
                    {formErrors.manualSoldCount && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1">{formErrors.manualSoldCount}</p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">Category *</label>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => {
                    setProductForm({ ...productForm, categoryId: e.target.value });
                    if (formErrors.categoryId) setFormErrors((prev) => ({ ...prev, categoryId: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md text-xs bg-white focus:outline-none ${
                    formErrors.categoryId ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-navy-900'
                  }`}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {formErrors.categoryId && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{formErrors.categoryId}</p>
                )}
              </div>

              {/* Category-Based Attribute Checkboxes (Size / Color / Volume) */}
              {(() => {
                const selectedCat = categories.find((c) => c.id === (productForm.categoryId || categories[0]?.id));
                const catSlug = selectedCat?.slug || '';
                const catName = selectedCat?.name || '';
                const isFashion = catSlug === 'fashion-apparel' || catName.includes('Fashion');
                const isSports = catSlug === 'sports-outdoors' || catName.includes('Sports');
                const isBeauty = catSlug === 'beauty-personal-care' || catName.includes('Beauty');

                if (!isFashion && !isSports && !isBeauty) return null;

                const attributeSections: Array<{ key: string; label: string; options: string[] }> = [];

                if (isFashion) {
                  attributeSections.push({
                    key: 'size',
                    label: 'Available Sizes',
                    options: ['S', 'M', 'L', 'XL', 'XXL'],
                  });
                  attributeSections.push({
                    key: 'color',
                    label: 'Available Colors',
                    options: ['Black', 'White', 'Navy', 'Red', 'Green', 'Blue'],
                  });
                } else if (isSports) {
                  attributeSections.push({
                    key: 'size',
                    label: 'Available Sizes',
                    options: ['S', 'M', 'L', 'XL'],
                  });
                } else if (isBeauty) {
                  attributeSections.push({
                    key: 'volume',
                    label: 'Available Volumes',
                    options: ['50ml', '100ml', '200ml', '500ml'],
                  });
                }

                return (
                  <div className="space-y-3">
                    {attributeSections.map(({ key: attrKey, label: attrLabel, options }) => {
                      const currentSelected = productForm.attributes[attrKey] || [];
                      const toggleOption = (opt: string) => {
                        const updated = currentSelected.includes(opt)
                          ? currentSelected.filter((o) => o !== opt)
                          : [...currentSelected, opt];
                        setProductForm({
                          ...productForm,
                          attributes: {
                            ...productForm.attributes,
                            [attrKey]: updated,
                          },
                        });
                      };

                      return (
                        <div key={attrKey} className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/70 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-navy-900 text-xs flex items-center gap-1.5">
                              <span>{attrLabel}</span>
                              <span className="text-[10px] font-normal text-slate-500">(Informational)</span>
                            </label>
                            <span className="text-[10px] text-slate-400">
                              {currentSelected.length} selected
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Check which options apply to this product. Purely cosmetic labels for the buyer—no separate stock or pricing.
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {options.map((opt) => {
                              const isChecked = currentSelected.includes(opt);
                              return (
                                <label
                                  key={opt}
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all select-none ${
                                    isChecked
                                      ? 'bg-navy-900 text-white border-navy-900 shadow-xs'
                                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleOption(opt)}
                                    className="rounded border-slate-300 text-navy-900 focus:ring-0 focus:ring-offset-0 sr-only"
                                  />
                                  <span>{opt}</span>
                                  {isChecked && <Check className="w-3.5 h-3.5 text-accent-orange" />}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Product Images: Multi-Image Upload for Official Store / Read-Only for Cloned Items */}
              {isOfficialStore ? (
                <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-navy-900 text-xs flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-navy-900" />
                      <span>Product Images ({productForm.images.length}/5) *</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">
                      JPEG, PNG, WebP (max 5MB)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Upload 1 to 5 product photos directly from your device. The first photo will be used as the catalog cover.
                  </p>

                  <input
                    ref={productImagesInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleProductImageFiles}
                  />

                  {/* Thumbnail Row & Add Image Button */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    {productForm.images.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-white group shadow-xs shrink-0">
                        <img
                          src={getProductImageUrl(url)}
                          alt={`Product photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-navy-900 text-white text-[8px] font-bold">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveProductImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full transition-opacity cursor-pointer shadow-xs"
                          title="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {productForm.images.length < 5 && (
                      <button
                        type="button"
                        onClick={() => productImagesInputRef.current?.click()}
                        disabled={uploadingProductImages}
                        className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 hover:border-navy-900 hover:bg-white bg-slate-100 flex flex-col items-center justify-center text-slate-500 hover:text-navy-900 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {uploadingProductImages ? (
                          <Loader2 className="w-4 h-4 animate-spin text-navy-900" />
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mb-0.5" />
                            <span className="text-[9px] font-bold">Add</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {formErrors.images && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1">{formErrors.images}</p>
                  )}
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-navy-900 text-xs flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-navy-900" />
                      <span>Official Product Images ({productForm.images.length})</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Official Platform Imagery
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Product imagery is provided directly by the Martify Collection Official Store catalog to ensure authentic customer presentation. External file uploads are disabled.
                  </p>
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {productForm.images.length === 0 ? (
                      <p className="text-[11px] text-slate-400 py-1">Official catalog imagery is attached to this product.</p>
                    ) : (
                      productForm.images.map((url, idx) => (
                        <div key={idx} className="relative shrink-0">
                          <img
                            src={getProductImageUrl(url)}
                            alt={`Official Image ${idx + 1}`}
                            className="w-14 h-14 rounded-lg object-cover border border-slate-200 bg-white"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                          {idx === 0 && (
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-navy-900 text-white text-[8px] font-bold">
                              Cover
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Listing Status Visibility Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                <div>
                  <span className="font-bold text-navy-900 text-xs block">Listing Visibility</span>
                  <p className="text-[11px] text-slate-500">
                    {productForm.isActive ? 'Active — Visible to buyers in the storefront' : 'Inactive — Hidden from storefront'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setProductForm({ ...productForm, isActive: !productForm.isActive })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                    productForm.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${productForm.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span>{productForm.isActive ? 'Active' : 'Inactive'}</span>
                </button>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProduct(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 py-2 border border-slate-300 rounded-md font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingProductImages}
                  className="flex-1 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-md font-medium shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {editingProduct
                    ? 'Update Product Listing'
                    : isOfficialStore
                    ? 'Create Product'
                    : 'List Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STORE PROFILE */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-navy-900" />
                <h3 className="text-base font-bold text-slate-900">Edit Store Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {profileError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Profile Image Upload */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Store Avatar / Profile Image</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-700 text-xl shrink-0">
                    {profileImagePreview ? (
                      <img src={profileImagePreview} alt="Store Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span>{(profileForm.storeName || 'S').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <input
                      ref={profileImageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setProfileImageFile(file);
                          setProfileImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => profileImageInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-500" />
                      <span>Upload Store Image</span>
                    </button>
                    <p className="text-[10px] text-slate-400 mt-1">JPEG, PNG, or WebP up to 5MB</p>
                  </div>
                </div>
              </div>

              {/* Store Name */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Store Name *</label>
                <input
                  type="text"
                  required
                  value={profileForm.storeName}
                  onChange={(e) => setProfileForm({ ...profileForm, storeName: e.target.value })}
                  placeholder="e.g. Apex Tech Essentials"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-navy-900 font-medium"
                />
              </div>

              {/* Store Description */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Store Description</label>
                <textarea
                  rows={3}
                  value={profileForm.storeDescription}
                  onChange={(e) => setProfileForm({ ...profileForm, storeDescription: e.target.value })}
                  placeholder="Tell buyers about your store, products, and specialties..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-navy-900 font-normal leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 border border-slate-300 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BROWSE OFFICIAL STORE CATALOG (MULTI-SELECT & INSTANT LIST) */}
      {showOfficialCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl max-w-5xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8 max-h-[92vh] flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-navy-900 text-white">
                    <Store className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-slate-900">Add from Official Store</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Select one or multiple products from the Martify Collection Official Store to list them directly in your inventory in one click.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowOfficialCatalogModal(false);
                  setSelectedCatalogIds([]);
                  setBatchImportSuccess(null);
                  setBatchImportError(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Banners */}
            {batchImportSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{batchImportSuccess}</span>
              </div>
            )}
            {batchImportError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{batchImportError}</span>
              </div>
            )}

            {/* Toolbar: Search, Category, Multi-Select Controls */}
            {(() => {
              const alreadyListedSet = new Set(
                products.map((p) => p.clonedFromProductId).filter(Boolean) as string[]
              );
              const filteredList = catalogProducts.filter((p) => {
                const matchesSearch =
                  !catalogSearch.trim() ||
                  p.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                  p.description.toLowerCase().includes(catalogSearch.toLowerCase());
                const matchesCat = catalogCategory === 'all' || p.category?.slug === catalogCategory;
                return matchesSearch && matchesCat;
              });

              const visibleIds = filteredList.map((p) => p.id);
              const allVisibleSelected =
                visibleIds.length > 0 && visibleIds.every((id) => selectedCatalogIds.includes(id));

              return (
                <>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex flex-1 gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Search official catalog products..."
                          value={catalogSearch}
                          onChange={(e) => setCatalogSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-navy-900"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      </div>
                      <select
                        value={catalogCategory}
                        onChange={(e) => setCatalogCategory(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-md text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-navy-900"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.slug}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectAllVisible(visibleIds)}
                        className="px-3 py-2 border border-slate-300 hover:border-slate-400 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        {allVisibleSelected ? 'Deselect All' : 'Select All Visible'}
                      </button>
                      {selectedCatalogIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedCatalogIds([])}
                          className="text-xs text-rose-600 hover:underline px-1 cursor-pointer"
                        >
                          Clear ({selectedCatalogIds.length})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Catalog Grid */}
                  <div className="flex-1 overflow-y-auto pr-1">
                    {filteredList.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-slate-200 rounded-lg">
                        <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-500">No official store products match your filter.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {filteredList.map((catProd) => {
                          const isSelected = selectedCatalogIds.includes(catProd.id);
                          const isAlreadyListed = alreadyListedSet.has(catProd.id);

                          return (
                            <div
                              key={catProd.id}
                              onClick={() => handleToggleCatalogSelection(catProd.id)}
                              className={`group border rounded-xl overflow-hidden bg-white shadow-xs flex flex-col justify-between transition-all cursor-pointer select-none ${
                                isSelected
                                  ? 'border-navy-900 ring-2 ring-navy-900 bg-navy-50/20'
                                  : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                              }`}
                            >
                              <div className="aspect-video w-full bg-slate-100 overflow-hidden relative">
                                <img
                                  src={getProductImageUrl(catProd.imageUrl, catProd.category?.slug)}
                                  alt={catProd.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />

                                {/* Selection Checkbox Top-Left */}
                                <div className="absolute top-2.5 left-2.5 z-10">
                                  <div
                                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                      isSelected
                                        ? 'bg-navy-900 text-white shadow-sm ring-2 ring-white'
                                        : 'bg-white/90 backdrop-blur-xs border border-slate-300 text-transparent hover:border-navy-900'
                                    }`}
                                  >
                                    <Check className={`w-4 h-4 stroke-[3] ${isSelected ? 'block' : 'hidden'}`} />
                                  </div>
                                </div>

                                {/* Status Badges Top-Right */}
                                <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
                                  {isAlreadyListed ? (
                                    <span className="px-2 py-0.5 rounded bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                                      <CheckCircle2 className="w-3 h-3" />
                                      In Your Store
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded bg-navy-900/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider">
                                      {catProd.category?.name || 'Official'}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-navy-900">
                                    {catProd.title}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                                    {catProd.description}
                                  </p>
                                </div>
                                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                                  <span className="text-xs font-black text-slate-900">
                                    ${formatPrice(catProd.price)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSingleDirectImport(catProd);
                                    }}
                                    disabled={batchImporting}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-navy-900 hover:text-white text-slate-700 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                                    title="Quick list single product"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>List Single</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Modal Footer / Action Bar */}
                  <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs font-medium text-slate-600">
                      {selectedCatalogIds.length > 0 ? (
                        <span className="text-navy-900 font-bold">
                          {selectedCatalogIds.length} product{selectedCatalogIds.length > 1 ? 's' : ''} selected
                        </span>
                      ) : (
                        <span>Select products with checkboxes to list multiple at once</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setShowOfficialCatalogModal(false);
                          setSelectedCatalogIds([]);
                        }}
                        className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={handleBatchImportSelected}
                        disabled={selectedCatalogIds.length === 0 || batchImporting}
                        className="flex-1 sm:flex-none px-5 py-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {batchImporting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Listing Products...</span>
                          </>
                        ) : selectedCatalogIds.length > 0 ? (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>List Selected Products ({selectedCatalogIds.length})</span>
                          </>
                        ) : (
                          <span>Select Products to List</span>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
