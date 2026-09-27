import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Headset,
  ShoppingBag,
  Truck,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  Search,
  X,
  MessageSquare,
  CheckCheck,
} from 'lucide-react';
import { supportApi } from '../api/support.api';
import { useAuth } from '../context/AuthContext';
import type { SupportTicket, Order, OrderStatus, TicketStatus } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/Badge';
import { formatPrice } from '../utils/formatters';
import { WhatsAppChat } from '../components/chat/WhatsAppChat';

export const SupportDashboardPage: React.FC = () => {
  const { user, isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'tickets' | 'orders'>('tickets');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Active Seller Conversation Details
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Search state for left chat list
  const [sellerSearch, setSellerSearch] = useState('');

  const loadSupportData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [ticketsData, ordersData] = await Promise.all([
        supportApi.getTickets(),
        supportApi.getOrders(),
      ]);
      setTickets(ticketsData);
      setOrders(ordersData);

      if (ticketsData.length > 0 && !selectedTicket) {
        const first = await supportApi.getTicketById(ticketsData[0].id);
        setSelectedTicket(first);
      } else if (selectedTicket) {
        // Keep active ticket in sync
        const refreshedCurrent = await supportApi.getTicketById(selectedTicket.id);
        setSelectedTicket(refreshedCurrent);
      }
    } catch (err: any) {
      console.error('Error loading support data:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await loadSupportData(true);
    } catch (err: any) {
      console.error('Error refreshing support data:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 350);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || (role !== 'SUPPORT' && role !== 'ADMIN')) {
      navigate('/support/login');
      return;
    }
    loadSupportData();
  }, [isAuthenticated, role]);

  // Live real-time polling: silently sync tickets & active conversation every 3.5s
  useEffect(() => {
    if (!isAuthenticated || (role !== 'SUPPORT' && role !== 'ADMIN') || activeTab !== 'tickets') return;

    const interval = setInterval(async () => {
      try {
        const updatedList = await supportApi.getTickets();
        setTickets(updatedList);

        if (selectedTicket?.id) {
          const updatedCurrent = await supportApi.getTicketById(selectedTicket.id);
          setSelectedTicket(updatedCurrent);
        }
      } catch (e) {
        // silent sync
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isAuthenticated, role, activeTab, selectedTicket?.id]);

  // Filtered sellers for left sidebar
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const q = sellerSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        t.seller?.name?.toLowerCase().includes(q) ||
        t.seller?.email?.toLowerCase().includes(q) ||
        t.seller?.phone?.toLowerCase().includes(q) ||
        t.messages?.[0]?.message?.toLowerCase().includes(q)
      );
    });
  }, [tickets, sellerSearch]);

  // Handle select seller conversation
  const handleSelectTicket = async (id: string) => {
    try {
      const detailed = await supportApi.getTicketById(id);
      setSelectedTicket(detailed);
    } catch (err: any) {
      alert(err?.friendlyMessage || 'Failed to load conversation');
    }
  };

  // Handle Conversation Status change
  const handleTicketStatusChange = async (ticketId: string, status: TicketStatus) => {
    try {
      const updated = await supportApi.updateTicketStatus(ticketId, status);
      setSelectedTicket(updated);
      setTickets(tickets.map((t) => (t.id === ticketId ? { ...t, status } : t)));
    } catch (err: any) {
      alert(err?.friendlyMessage || 'Failed to update status');
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  useEffect(() => {
    if (!loading) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [loading]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  // Handle Order Status advancement (Triggers Escrow release on DELIVERED)
  const handleAdvanceOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      const updated = await supportApi.updateOrderStatus(orderId, nextStatus);
      const updatedOrder = (updated as any)?.order || updated;
      setOrders((prevOrders) => prevOrders.map((o) => (o.id === orderId ? updatedOrder : o)));
      alert(`Order #${orderId.slice(0, 8).toUpperCase()} updated to ${nextStatus}. ${nextStatus === 'DELIVERED' ? 'Escrow funds successfully released to seller!' : ''}`);
    } catch (err: any) {
      alert(err?.friendlyMessage || 'Failed to advance order status');
    }
  };

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    if (current === 'BOOKED') return 'PROCESSING';
    if (current === 'PROCESSING') return 'SHIPPING';
    if (current === 'SHIPPING') return 'DELIVERED';
    return null;
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading Customer Support Dashboard..." />;
  }

  const openTicketsCount = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const bookedOrdersCount = orders.filter((o) => o.status === 'BOOKED').length;

  const filteredOrders = orders.filter((ord) => {
    if (!orderSearchQuery.trim()) return true;
    const q = orderSearchQuery.trim().toLowerCase().replace(/^#/, '');
    const fullId = ord.id.toLowerCase();
    const shortId = ord.id.slice(0, 8).toLowerCase();
    const buyerName = ord.buyerName?.toLowerCase() || '';
    const buyerPhone = ord.buyerPhone?.toLowerCase() || '';
    const productTitle = ord.product?.title?.toLowerCase() || '';
    return (
      fullId.includes(q) ||
      shortId.includes(q) ||
      buyerName.includes(q) ||
      buyerPhone.includes(q) ||
      productTitle.includes(q)
    );
  });

  return (
    <div className="bg-slate-50 min-h-screen pb-24 text-slate-800">
      {/* Top Header - Clean, calm white banner */}
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-navy-900">
                <Headset className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-normal">
                  Customer Support Dashboard
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Signed in as <span className="font-semibold text-slate-700">{user?.name}</span> (Customer Support Team)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs cursor-pointer disabled:opacity-60"
                title="Refresh support data"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-navy-900' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/support/login');
                }}
                className="px-3.5 py-1.5 rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-xs font-medium transition-colors shadow-xs"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Quick Metrics - Clean light stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Active Chats</span>
                <HelpCircle className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-900">{openTicketsCount}</span>
                {openTicketsCount > 0 && (
                  <span className="text-[11px] font-medium text-amber-600">Open</span>
                )}
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Seller Chats</span>
                <Headset className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-2xl font-bold text-slate-900 mt-2 block">{tickets.length}</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Awaiting Shipment</span>
                <Truck className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-900">{bookedOrdersCount}</span>
                {bookedOrdersCount > 0 && (
                  <span className="text-[11px] font-medium text-amber-600">Action needed</span>
                )}
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Orders</span>
                <ShoppingBag className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-2xl font-bold text-slate-900 mt-2 block">{orders.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'tickets'
                ? 'border-navy-900 text-navy-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Headset className={`w-4 h-4 ${activeTab === 'tickets' ? 'text-navy-900' : 'text-slate-400'}`} />
            <span>Seller Chats ({tickets.length})</span>
            {openTicketsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                {openTicketsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-navy-900 text-navy-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className={`w-4 h-4 ${activeTab === 'orders' ? 'text-navy-900' : 'text-slate-400'}`} />
            <span>Order Lifecycle ({orders.length})</span>
          </button>
        </div>

        {/* Tab 1: SELLER CHATS & MESSAGING (WHATSAPP WEB LAYOUT) */}
        {activeTab === 'tickets' && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT SIDEBAR: WHATSAPP CHAT CONTACT LIST */}
            <div className="lg:col-span-4 bg-white border border-[#d1d7db] rounded-xl overflow-hidden shadow-md flex flex-col h-[700px]">
              {/* WhatsApp Web Left Header */}
              <div className="bg-[#f0f2f5] border-b border-[#d1d7db] px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#0A1F44] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#111b21]">Customer Support Inbox</h3>
                    <p className="text-[10px] text-[#667781]">{tickets.length} Sellers</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-full text-[#54656f] hover:bg-[#e9edef] transition-colors cursor-pointer disabled:opacity-60"
                  title="Refresh chat list"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#0A1F44]' : ''}`} />
                </button>
              </div>

              {/* WhatsApp Search Bar */}
              <div className="p-2.5 bg-white border-b border-[#d1d7db] shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#54656f] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={sellerSearch}
                    onChange={(e) => setSellerSearch(e.target.value)}
                    placeholder="Search seller, email, or message..."
                    className="w-full pl-9 pr-7 py-1.5 text-xs bg-[#f0f2f5] rounded-lg border border-transparent focus:border-[#0A1F44] focus:bg-white text-[#111b21] focus:outline-none transition-all placeholder-[#8696a0]"
                  />
                  {sellerSearch && (
                    <button
                      type="button"
                      onClick={() => setSellerSearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Merchant Chats List */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#f0f2f5]">
                {filteredTickets.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">No merchants found</p>
                    <p className="text-[11px] text-slate-400">Try adjusting your search or filter</p>
                  </div>
                ) : (
                  filteredTickets.map((t) => {
                    const isSelected = selectedTicket?.id === t.id;
                    const latestMsg = t.messages?.[0]?.message || 'No messages yet in this thread';
                    const msgCount = t._count?.messages || t.messages?.length || 0;
                    const hasMessages = msgCount > 0;

                    return (
                      <div
                        key={t.id}
                        onClick={() => handleSelectTicket(t.id)}
                        className={`px-3.5 py-3 flex items-start gap-3 cursor-pointer transition-colors relative ${
                          isSelected
                            ? 'bg-[#f0f2f5] border-l-4 border-l-[#0A1F44]'
                            : 'hover:bg-[#f5f6f6]'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0 mt-0.5">
                          <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-sm shadow-2xs">
                            {t.seller?.name?.charAt(0).toUpperCase() || 'S'}
                          </div>
                        </div>

                        {/* Text info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-[#111b21] truncate">
                              {t.seller?.name || 'Seller'}
                            </h4>
                            <span className="text-[10px] text-[#667781] shrink-0 font-medium">
                              {new Date(t.updatedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-[#667781] truncate">
                              {t.seller?.email}
                            </span>
                          </div>

                          {/* Latest message snippet */}
                          <div className="flex items-center justify-between gap-2 mt-1.5">
                            <p
                              className={`text-[11.5px] truncate flex items-center gap-1 ${
                                hasMessages ? 'text-[#3b4a54]' : 'text-[#8696a0] italic'
                              }`}
                            >
                              {hasMessages && (
                                <CheckCheck
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    t.messages?.[0]?.isRead
                                      ? 'text-[#53bdeb]'
                                      : 'text-[#8696a0]'
                                  }`}
                                />
                              )}
                              <span className="truncate">{latestMsg}</span>
                            </p>
                            {(t.unreadCount || 0) > 0 ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#0A1F44] text-white shrink-0 shadow-2xs">
                                {t.unreadCount}
                              </span>
                            ) : msgCount > 0 ? (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">
                                {msgCount}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT MAIN VIEW: WHATSAPP CHAT AREA */}
            <div className="lg:col-span-8">
              {selectedTicket ? (
                <WhatsAppChat
                  conversation={selectedTicket}
                  currentUserRole="SUPPORT"
                  partnerName={selectedTicket.seller?.name || 'Seller'}
                  partnerSubtitle={selectedTicket.seller?.email || 'Merchant Account'}
                  partnerAvatarInitial={selectedTicket.seller?.name?.charAt(0).toUpperCase() || 'S'}
                  partnerPhone={selectedTicket.seller?.phone}
                  partnerEmail={selectedTicket.seller?.email}
                  partnerStatus={selectedTicket.seller?.sellerStatus}
                  orders={orders.filter((o) => o.sellerId === selectedTicket.sellerId)}
                  onSendMessage={async (msg) => {
                    await supportApi.addMessage(selectedTicket.id, msg);
                    const updated = await supportApi.getTicketById(selectedTicket.id);
                    setSelectedTicket(updated);
                    const updatedList = await supportApi.getTickets();
                    setTickets(updatedList);
                  }}
                  onRefresh={async () => {
                    const [updatedDetail, updatedList] = await Promise.all([
                      supportApi.getTicketById(selectedTicket.id),
                      supportApi.getTickets(),
                    ]);
                    setSelectedTicket(updatedDetail);
                    setTickets(updatedList);
                  }}
                  onStatusChange={(status) => handleTicketStatusChange(selectedTicket.id, status)}
                  heightClass="h-[700px]"
                />
              ) : (
                <div className="bg-[#f0f2f5] border border-[#d1d7db] rounded-xl h-[700px] flex flex-col items-center justify-center p-8 text-center shadow-md">
                  <div className="w-16 h-16 rounded-full bg-[#0A1F44] text-white flex items-center justify-center shadow-lg mb-4">
                    <Headset className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-[#111b21]">Customer Support Desk</h3>
                  <p className="text-xs text-[#667781] max-w-sm mt-1 leading-relaxed">
                    Select a merchant conversation from the left to view complete history, reply with instant delivery, and handle verification or order inquiries.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: ORDER LIFECYCLE MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="mt-6 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Orders Lifecycle</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Advance fulfillment progression: Booked → Processing → Shipping → Delivered (releases merchant escrow).
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Search order #..."
                    className="pl-8.5 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-navy-900 focus:bg-white w-48 sm:w-60 transition-colors"
                  />
                  {orderSearchQuery && (
                    <button
                      onClick={() => setOrderSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-xs font-medium text-slate-500 shrink-0">
                  {orderSearchQuery ? `${filteredOrders.length} of ${orders.length} orders` : `${orders.length} orders`}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-medium">
                    <th className="py-3 px-2.5">Order</th>
                    <th className="py-3 px-2.5">Buyer</th>
                    <th className="py-3 px-2.5">Product</th>
                    <th className="py-3 px-2.5">Qty</th>
                    <th className="py-3 px-2.5">Total</th>
                    <th className="py-3 px-2.5">Status</th>
                    <th className="py-3 px-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                        <p>No orders found matching "{orderSearchQuery}"</p>
                        <button
                          onClick={() => setOrderSearchQuery('')}
                          className="mt-2 text-xs font-medium text-navy-900 hover:underline cursor-pointer"
                        >
                          Clear search filter
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => {
                      const nextStatus = getNextStatus(ord.status);
                      return (
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
                                className="truncate line-clamp-1 font-medium text-slate-900"
                                title={ord.product?.title || 'Marketplace Item'}
                              >
                                {ord.product?.title || 'Marketplace Item'}
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
                          <td className="py-3 px-2.5 text-right whitespace-nowrap">
                            {nextStatus ? (
                              <button
                                onClick={() => handleAdvanceOrderStatus(ord.id, nextStatus)}
                                className={`px-2.5 py-1 text-xs whitespace-nowrap rounded-md font-medium text-white shadow-xs cursor-pointer transition-colors ${
                                  nextStatus === 'DELIVERED'
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : 'bg-navy-900 hover:bg-navy-800'
                                }`}
                              >
                                Mark as {nextStatus.charAt(0) + nextStatus.slice(1).toLowerCase()}
                              </button>
                            ) : (
                              <span className="text-xs text-emerald-700 font-medium inline-flex items-center justify-end gap-1 whitespace-nowrap">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Delivered</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
