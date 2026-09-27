import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileCheck2,
  FolderTree,
  CheckCircle2,
  Trash2,
  Pencil,
  X,
  CornerDownRight,
  ExternalLink,
  RefreshCw,
  LayoutDashboard,
  Layers,
} from 'lucide-react';
import { adminApi } from '../api/admin.api';
import { useAuth } from '../context/AuthContext';
import type { User, Category, KycStatus, SellerStatus } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/Badge';
import { formatPrice, getMediaUrl, parseDocumentUrls } from '../utils/formatters';

export const AdminDashboardPage: React.FC = () => {
  const { user, isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'sellers' | 'kyc' | 'categories'>('sellers');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [sellers, setSellers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Category creation state
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatParentId, setNewCatParentId] = useState('');
  const [newCatShowInNavbar, setNewCatShowInNavbar] = useState(true);
  const [creatingCat, setCreatingCat] = useState(false);

  // Category inline/modal edit state
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatSlug, setEditCatSlug] = useState('');
  const [editCatParentId, setEditCatParentId] = useState('');
  const [editCatShowInNavbar, setEditCatShowInNavbar] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  // Category cascade delete confirmation state
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [sellersData, catsData] = await Promise.all([
        adminApi.getSellers(),
        adminApi.getCategories(),
      ]);
      setSellers(sellersData);
      setCategories(catsData);
    } catch (err: any) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch active admin queries without full-page loading flash
  const handleRefresh = async () => {
    if (!isAuthenticated || role !== 'ADMIN' || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const [sellersData, catsData] = await Promise.all([
        adminApi.getSellers(),
        adminApi.getCategories(),
      ]);
      setSellers(sellersData);
      setCategories(catsData);
    } catch (err: any) {
      console.error('Error refreshing admin data:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 350);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || role !== 'ADMIN') {
      navigate('/admin/login');
      return;
    }
    loadAdminData();
  }, [isAuthenticated, role]);

  // Seller Status Update
  const handleUpdateSellerStatus = async (sellerId: string, status: SellerStatus) => {
    try {
      const updated = await adminApi.updateSellerStatus(sellerId, status);
      setSellers(sellers.map((s) => (s.id === sellerId ? updated : s)));
    } catch (err: any) {
      alert(err?.friendlyMessage || 'Failed to update seller status');
    }
  };

  // Document Verification Approval / Rejection
  const handleUpdateKyc = async (sellerId: string, kycStatus: KycStatus) => {
    try {
      const updated = await adminApi.updateSellerKyc(sellerId, kycStatus);
      setSellers(sellers.map((s) => (s.id === sellerId ? updated : s)));
      alert(`Document verification status marked as ${kycStatus} for ${updated.name}`);
    } catch (err: any) {
      alert(err?.friendlyMessage || 'Failed to update verification status');
    }
  };

  // Category Creation
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      const slug = (newCatSlug.trim() || newCatName.trim())
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      await adminApi.createCategory({
        name: newCatName.trim(),
        slug,
        parentId: newCatParentId ? newCatParentId : null,
        showInNavbar: newCatShowInNavbar,
      });

      const updatedCats = await adminApi.getCategories();
      setCategories(updatedCats);
      setNewCatName('');
      setNewCatSlug('');
      setNewCatParentId('');
      setNewCatShowInNavbar(true);
    } catch (err: any) {
      alert(err?.friendlyMessage || 'Failed to create category');
    } finally {
      setCreatingCat(false);
    }
  };

  // Open Edit Category Modal
  const handleStartEditCategory = (cat: Category) => {
    setEditingCat(cat);
    setEditCatName(cat.name);
    setEditCatSlug(cat.slug);
    setEditCatParentId(cat.parentId || '');
    setEditCatShowInNavbar(cat.showInNavbar !== false);
  };

  // Save Edited Category
  const handleSaveEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editCatName.trim()) return;
    setSavingEdit(true);
    try {
      const slug = (editCatSlug.trim() || editCatName.trim())
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      await adminApi.updateCategory(editingCat.id, {
        name: editCatName.trim(),
        slug,
        parentId: editCatParentId ? editCatParentId : null,
        showInNavbar: editCatShowInNavbar,
      });

      const updatedCats = await adminApi.getCategories();
      setCategories(updatedCats);
      setEditingCat(null);
    } catch (err: any) {
      alert(err?.friendlyMessage || 'Failed to update category');
    } finally {
      setSavingEdit(false);
    }
  };

  // Open Cascade Delete Confirmation Dialog
  const handleStartDeleteCategory = (cat: Category) => {
    setDeletingCat(cat);
  };

  // Confirm Cascade Deletion
  const handleConfirmDeleteCategory = async () => {
    if (!deletingCat) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteCategory(deletingCat.id);
      const updatedCats = await adminApi.getCategories();
      setCategories(updatedCats);
      setDeletingCat(null);
    } catch (err: any) {
      alert(err?.friendlyMessage || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading Admin Dashboard..." />;
  }

  const pendingKycCount = sellers.filter((s) => s.kycStatus === 'PENDING').length;
  const approvedSellersCount = sellers.filter((s) => s.sellerStatus === 'APPROVED').length;

  // Filter top-level categories and subcategories
  const topLevelCategories = categories.filter((c) => !c.parentId);
  const orphanSubCategories = categories.filter(
    (c) => c.parentId && !categories.some((p) => p.id === c.parentId)
  );

  return (
    <div className="bg-white min-h-screen pb-24 text-slate-800">
      {/* Top Header - Solid Navy & White branding */}
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-sm bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0F172A]">
                <LayoutDashboard className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Signed in as <span className="font-semibold text-slate-700">{user?.name}</span> (Administrator)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-slate-300 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs cursor-pointer disabled:opacity-60"
                title="Refresh admin data"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-[#0F172A]' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/admin/login');
                }}
                className="px-3.5 py-1.5 rounded-sm border border-slate-300 text-slate-700 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-xs font-medium transition-colors shadow-xs"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-4 sm:p-5 rounded-sm border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Sellers</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-2xl font-bold text-slate-900 mt-2 block">{sellers.length}</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-sm border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Pending Verification</span>
                <FileCheck2 className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-900">{pendingKycCount}</span>
                {pendingKycCount > 0 && (
                  <span className="text-[11px] font-medium text-amber-700">Action needed</span>
                )}
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-sm border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Active Stores</span>
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-2xl font-bold text-slate-900 mt-2 block">{approvedSellersCount}</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-sm border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Categories</span>
                <FolderTree className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-2xl font-bold text-slate-900 mt-2 block">{categories.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
          {[
            { id: 'sellers', label: 'Sellers', icon: Users, badge: null },
            { id: 'kyc', label: 'Document Verification', icon: FileCheck2, badge: pendingKycCount },
            { id: 'categories', label: 'Categories', icon: FolderTree, badge: null },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-[#0F172A] text-[#0F172A] font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#0F172A]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== null && tab.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-900 text-xs font-medium">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: SELLERS */}
        {activeTab === 'sellers' && (
          <div className="mt-6 bg-white border border-slate-200 rounded-sm shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Sellers</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage registered sellers and their marketplace permissions.
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500">{sellers.length} total</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-medium">
                    <th className="py-3 px-6">Seller</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Stock Limit</th>
                    <th className="py-3 px-4">Available Balance</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4">Store Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sellers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-6 font-medium text-slate-900">{s.name}</td>
                      <td className="py-3 px-4 text-slate-500">
                        <span>{s.email}</span>
                        {s.phone && <span className="text-slate-400 block text-[11px]">{s.phone}</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{s.availableStock} units</td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        ${formatPrice(s.balanceAvailable)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={s.kycStatus} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={s.sellerStatus || 'PENDING'} size="sm" />
                      </td>
                      <td className="py-3 px-6 text-right">
                        {s.sellerStatus !== 'APPROVED' ? (
                          <button
                            onClick={() => handleUpdateSellerStatus(s.id, 'APPROVED')}
                            className="px-2.5 py-1 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors cursor-pointer shadow-xs"
                          >
                            Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateSellerStatus(s.id, 'BLOCKED')}
                            className="px-2.5 py-1 rounded-sm border border-rose-300 text-rose-700 hover:bg-rose-50 font-medium text-xs transition-colors cursor-pointer"
                          >
                            Block
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: DOCUMENT VERIFICATION */}
        {activeTab === 'kyc' && (
          <div className="mt-6 bg-white border border-slate-200 rounded-sm shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Document Verification</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review submitted identity and registration documents for merchant verification.
              </p>
            </div>

            <div className="p-6 space-y-3">
              {sellers.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-sm border border-slate-200 bg-white hover:border-slate-300 transition-colors gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-slate-900 text-sm">{s.name}</span>
                      <StatusBadge status={s.kycStatus} size="sm" />
                    </div>
                    <span className="text-xs text-slate-500 block">
                      {s.email} {s.phone ? `• ${s.phone}` : ''}
                    </span>
                    {s.kycDocumentUrl ? (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {parseDocumentUrls(s.kycDocumentUrl).map((url, idx, arr) => (
                          <a
                            key={idx}
                            href={getMediaUrl(url)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-slate-50 border border-slate-200 text-xs font-medium text-[#0F172A] hover:bg-slate-100 hover:border-slate-300 transition-colors"
                          >
                            <span>
                              {arr.length > 1 ? `View Document ${idx + 1}` : 'View submitted document'}
                            </span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No document uploaded yet</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleUpdateKyc(s.id, 'APPROVED')}
                      disabled={s.kycStatus === 'APPROVED'}
                      className="px-3.5 py-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-medium text-xs transition-colors shadow-xs cursor-pointer"
                    >
                      Approve Documents
                    </button>
                    <button
                      onClick={() => handleUpdateKyc(s.id, 'REJECTED')}
                      disabled={s.kycStatus === 'REJECTED'}
                      className="px-3.5 py-1.5 rounded-sm border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-40 font-medium text-xs transition-colors cursor-pointer"
                    >
                      Reject Documents
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Category / Sub-Category Column */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-sm p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-base font-semibold text-slate-900">Create Category</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add a new top-level category or nested sub-category.
                </p>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => {
                      setNewCatName(e.target.value);
                      setNewCatSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)+/g, '')
                      );
                    }}
                    placeholder="e.g. Graphic Tees"
                    className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:border-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCatSlug}
                    onChange={(e) => setNewCatSlug(e.target.value)}
                    placeholder="graphic-tees"
                    className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs font-mono focus:outline-none focus:border-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Parent Category (Optional)
                  </label>
                  <select
                    value={newCatParentId}
                    onChange={(e) => setNewCatParentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs bg-white text-slate-800 focus:outline-none focus:border-[#0F172A]"
                  >
                    <option value="">None (Top-Level Category)</option>
                    {topLevelCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Select a parent to nest as a sub-category, or leave as None for top-level.
                  </p>
                </div>

                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCatShowInNavbar}
                      onChange={(e) => setNewCatShowInNavbar(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded-sm border-slate-300 text-[#0F172A] focus:ring-[#0F172A] accent-[#0F172A] cursor-pointer"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 text-xs block">
                        Show in Main Navigation (Header)
                      </span>
                      <span className="text-[11px] text-slate-500 block leading-tight">
                        When checked, this top-level category appears in the main storefront header.
                      </span>
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={creatingCat}
                  className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold rounded-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {creatingCat ? 'Creating...' : 'Create Category'}
                </button>
              </form>
            </div>

            {/* Categories & Sub-Categories Hierarchy List */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-sm p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Categories & Sub-Categories</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hierarchical taxonomies visible across the marketplace.
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {categories.length} Total ({topLevelCategories.length} Main)
                </span>
              </div>

              {categories.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-sm">
                  <FolderTree className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No categories found. Create your first category on the left.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topLevelCategories.map((top) => {
                    const subCats = categories.filter((c) => c.parentId === top.id);

                    return (
                      <div
                        key={top.id}
                        className="border border-slate-200 rounded-sm bg-white p-3.5 hover:border-slate-300 transition-colors"
                      >
                        {/* Top-Level Category Row */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{top.name}</span>
                            <span className="text-slate-400 font-mono text-[11px]">/{top.slug}</span>
                            <span className="text-[11px] px-2 py-0.5 border border-slate-200 bg-slate-50 text-slate-600 font-medium rounded-sm">
                              {top._count?.products ?? 0} {top._count?.products === 1 ? 'product' : 'products'}
                            </span>
                            {subCats.length > 0 && (
                              <span className="text-[11px] px-2 py-0.5 border border-slate-200 bg-slate-50 text-[#0F172A] font-medium rounded-sm">
                                {subCats.length} {subCats.length === 1 ? 'sub-category' : 'sub-categories'}
                              </span>
                            )}
                            {top.showInNavbar !== false ? (
                              <span className="text-[10px] px-1.5 py-0.5 border border-slate-300 bg-slate-50 text-slate-700 font-mono rounded-sm">
                                In Header
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 border border-slate-200 bg-slate-100 text-slate-400 font-mono rounded-sm">
                                Hidden from Header
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleStartEditCategory(top)}
                              className="p-1.5 rounded-sm border border-slate-200 text-slate-600 hover:text-[#0F172A] hover:border-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer"
                              title="Edit Category"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleStartDeleteCategory(top)}
                              className="p-1.5 rounded-sm border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Nested Sub-Categories */}
                        {subCats.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100 pl-3 border-l-2 border-l-slate-300 space-y-1.5">
                            {subCats.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between py-1.5 px-2.5 rounded-sm bg-slate-50/70 hover:bg-slate-100/70 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-slate-900 text-xs">{sub.name}</span>
                                    <span className="text-[10px] px-1.5 py-0.2 border border-slate-300 rounded-sm text-slate-500 uppercase tracking-wider font-mono">
                                      Sub
                                    </span>
                                    <span className="text-slate-400 font-mono text-[11px]">/{sub.slug}</span>
                                    <span className="text-[11px] text-slate-500">
                                      ({sub._count?.products ?? 0} products)
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => handleStartEditCategory(sub)}
                                    className="p-1 rounded-sm border border-slate-200 text-slate-500 hover:text-[#0F172A] hover:border-[#0F172A] hover:bg-white transition-colors cursor-pointer"
                                    title="Edit Sub-Category"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleStartDeleteCategory(sub)}
                                    className="p-1 rounded-sm border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-white transition-colors cursor-pointer"
                                    title="Delete Sub-Category"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Orphan Sub-Categories (if parent was changed or missing) */}
                  {orphanSubCategories.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Other Sub-Categories
                      </h3>
                      <div className="space-y-1.5">
                        {orphanSubCategories.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between p-2 rounded-sm border border-slate-200 bg-white text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{sub.name}</span>
                              <span className="text-slate-400 font-mono text-[11px]">/{sub.slug}</span>
                              <span className="text-[11px] text-slate-500">
                                ({sub._count?.products ?? 0} products)
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleStartEditCategory(sub)}
                                className="p-1 rounded-sm border border-slate-200 text-slate-600 hover:text-[#0F172A]"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleStartDeleteCategory(sub)}
                                className="p-1 rounded-sm border border-slate-200 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: EDIT CATEGORY */}
      {editingCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-300 rounded-sm shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0F172A]" />
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Edit Category</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCat(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCategory} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => {
                    setEditCatName(e.target.value);
                    setEditCatSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)+/g, '')
                    );
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:border-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  required
                  value={editCatSlug}
                  onChange={(e) => setEditCatSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs font-mono focus:outline-none focus:border-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Parent Category (Optional)
                </label>
                <select
                  value={editCatParentId}
                  onChange={(e) => setEditCatParentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs bg-white text-slate-800 focus:outline-none focus:border-[#0F172A]"
                >
                  <option value="">None (Top-Level Category)</option>
                  {categories
                    .filter((c) => !c.parentId && c.id !== editingCat.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Nest under another category or set to None to convert to top-level.
                </p>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editCatShowInNavbar}
                    onChange={(e) => setEditCatShowInNavbar(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded-sm border-slate-300 text-[#0F172A] focus:ring-[#0F172A] accent-[#0F172A] cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 text-xs block">
                      Show in Main Navigation (Header)
                    </span>
                    <span className="text-[11px] text-slate-500 block leading-tight">
                      When checked, this top-level category appears in the main storefront header.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-sm hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CASCADE DELETE CONFIRMATION */}
      {deletingCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-300 rounded-sm shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-sm bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Delete Category</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Category: <span className="font-semibold text-slate-900">{deletingCat.name}</span> (/{deletingCat.slug})
                </p>
              </div>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded-sm p-3.5 text-xs text-rose-800 space-y-1.5">
              <p className="font-semibold text-rose-900">
                Deleting this category will permanently remove all associated sub-categories and products. Are you sure?
              </p>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                All linked products, orders, cart items, and child sub-categories will be cleanly deleted from the marketplace. This action is irreversible.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingCat(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeleteCategory}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
