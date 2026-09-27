import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  Search,
  CheckCheck,
  Headset,
  RefreshCw,
  X,
  ArrowDown,
  ShieldCheck,
  ShoppingBag,
  Volume2,
  VolumeX,
  Copy,
  Check,
} from 'lucide-react';
import type { SupportTicket, SupportMessage, SenderRole, TicketStatus, Order } from '../../types';
import { apiClient } from '../../api/client';

// Subtle Web Audio chime for new incoming messages
function playIncomingChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    // Audio autoplay might be restricted before first interaction
  }
}

// Format message timestamp like WhatsApp (e.g. 11:42 AM)
function formatMessageTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '';
  }
}

// Format date headers (e.g. "TODAY", "YESTERDAY", "MARCH 24, 2026")
function formatDateHeader(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (isSameDay(date, today)) return 'TODAY';
    if (isSameDay(date, yesterday)) return 'YESTERDAY';

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).toUpperCase();
  } catch {
    return dateStr;
  }
}

export interface WhatsAppChatProps {
  conversation: SupportTicket | null;
  currentUserRole: 'SELLER' | 'SUPPORT' | 'ADMIN';
  partnerName: string;
  partnerSubtitle?: string;
  partnerAvatarInitial?: string;
  partnerPhone?: string | null;
  partnerEmail?: string | null;
  partnerStatus?: string | null;
  orders?: Order[];
  onSendMessage: (message: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
  onStatusChange?: (status: TicketStatus) => Promise<void>;
  isLoading?: boolean;
  heightClass?: string;
}

const COMMON_EMOJIS = ['👍', '❤️', '😊', '🙏', '🎉', '📦', '💰', '🚚', '📄', '⚠️', '🔥', '👏', '🤝', '🕒', '💡', '✅'];

export const WhatsAppChat: React.FC<WhatsAppChatProps> = ({
  conversation,
  currentUserRole,
  partnerName,
  partnerSubtitle,
  partnerAvatarInitial,
  partnerPhone,
  partnerEmail,
  partnerStatus: _partnerStatus,
  orders = [],
  onSendMessage,
  onRefresh,
  onStatusChange: _onStatusChange,
  isLoading = false,
  heightClass = 'h-[640px]',
}) => {
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [unreadWhileScrolled, setUnreadWhileScrolled] = useState(0);

  const prevMessagesCountRef = useRef<number>(conversation?.messages?.length || 0);

  const messages = conversation?.messages || [];

  // Play sound and auto-scroll on new message
  useEffect(() => {
    const currentCount = messages.length;
    const prevCount = prevMessagesCountRef.current;

    if (currentCount > prevCount) {
      const latestMsg = messages[currentCount - 1];
      const isFromCounterparty =
        currentUserRole === 'SELLER'
          ? latestMsg.senderRole === 'SUPPORT' || latestMsg.senderRole === 'ADMIN'
          : latestMsg.senderRole === 'SELLER';

      if (isFromCounterparty && soundEnabled) {
        playIncomingChime();
      }

      if (isScrolledUp) {
        setUnreadWhileScrolled((prev) => prev + (currentCount - prevCount));
      } else {
        scrollToBottom(true);
      }
    }
    prevMessagesCountRef.current = currentCount;
  }, [messages.length, currentUserRole, soundEnabled, isScrolledUp]);

  // Initial scroll to bottom
  useEffect(() => {
    scrollToBottom(false);
  }, [conversation?.id]);

  const scrollToBottom = (smooth = true) => {
    if (chatScrollContainerRef.current) {
      const container = chatScrollContainerRef.current;
      if (smooth) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      } else {
        container.scrollTop = container.scrollHeight;
      }
      setIsScrolledUp(false);
      setUnreadWhileScrolled(0);
    }
  };

  const handleScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 100;
    setIsScrolledUp(isUp);
    if (!isUp) {
      setUnreadWhileScrolled(0);
    }
  };

  // Group messages by date for WhatsApp-like date pills
  const groupedMessages = useMemo(() => {
    const groups: { dateHeader: string; messages: SupportMessage[] }[] = [];
    let currentHeader = '';
    let currentList: SupportMessage[] = [];

    messages.forEach((msg) => {
      const header = formatDateHeader(msg.createdAt);
      if (header !== currentHeader) {
        if (currentList.length > 0) {
          groups.push({ dateHeader: currentHeader, messages: currentList });
        }
        currentHeader = header;
        currentList = [msg];
      } else {
        currentList.push(msg);
      }
    });

    if (currentList.length > 0) {
      groups.push({ dateHeader: currentHeader, messages: currentList });
    }

    return groups;
  }, [messages]);

  // Filter messages if search query is active
  const filteredCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => m.message.toLowerCase().includes(q)).length;
  }, [messages, searchQuery]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;
    const textToSend = inputText.trim();
    setInputText('');
    setShowEmojis(false);
    setSending(true);

    try {
      await onSendMessage(textToSend);
      scrollToBottom(true);
    } catch (err: any) {
      alert(err?.friendlyMessage || 'Failed to send message');
      setInputText(textToSend); // restore on error
    } finally {
      setSending(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Handle textarea enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleCopyPhone = () => {
    if (partnerPhone) {
      navigator.clipboard.writeText(partnerPhone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  // Image Upload handler
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size < 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    setUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = res.data?.data?.url || res.data?.url;
      if (uploadedUrl) {
        const fullMediaMsg = `📷 [Shared Image]: ${uploadedUrl}\n${inputText.trim()}`.trim();
        await onSendMessage(fullMediaMsg);
        setInputText('');
        scrollToBottom(true);
      }
    } catch (err: any) {
      alert(err?.friendlyMessage || 'Failed to upload image');
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleInsertOrderReference = (orderId: string) => {
    const prefix = `Regarding Order #${orderId.slice(0, 8).toUpperCase()}: `;
    setInputText((prev) => (prev ? `${prefix}${prev}` : prefix));
    setShowOrderModal(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  // Helper to parse image URL in message
  const extractImageUrl = (text: string): { imageUrl: string | null; cleanText: string } => {
    // Pattern 1: 📷 [Shared Image]: /uploads/...
    const sharedImgMatch = text.match(/📷\s*\[Shared Image\]:\s*(\S+)/i);
    if (sharedImgMatch) {
      const clean = text.replace(/📷\s*\[Shared Image\]:\s*(\S+)/i, '').trim();
      return { imageUrl: sharedImgMatch[1], cleanText: clean };
    }

    // Pattern 2: Markdown image ![alt](url)
    const mdMatch = text.match(/!\[.*?\]\((.*?)\)/);
    if (mdMatch) {
      const clean = text.replace(/!\[.*?\]\((.*?)\)/, '').trim();
      return { imageUrl: mdMatch[1], cleanText: clean };
    }

    // Pattern 3: Direct /uploads/ URL
    const uploadMatch = text.match(/(https?:\/\/[^\s]+|\/uploads\/[^\s]+)\.(jpg|jpeg|png|webp|svg|gif)/i);
    if (uploadMatch) {
      return { imageUrl: uploadMatch[0], cleanText: text };
    }

    return { imageUrl: null, cleanText: text };
  };

  const isUserSender = (senderRole: SenderRole) => {
    if (currentUserRole === 'SELLER') {
      return senderRole === 'SELLER';
    }
    return senderRole === 'SUPPORT' || senderRole === 'ADMIN';
  };

  return (
    <div className={`flex flex-col bg-[#efeae2] border border-[#d1d7db] rounded-xl shadow-lg overflow-hidden ${heightClass} relative select-text`}>
      {/* 1. WHATSAPP HEADER */}
      <div className="bg-[#f0f2f5] border-b border-[#d1d7db] px-4 py-2.5 flex items-center justify-between shrink-0 z-10 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar with WhatsApp Online indicator */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-[#0A1F44] text-white flex items-center justify-center font-bold text-sm shadow-xs border border-white/40">
              {currentUserRole === 'SELLER' ? (
                <Headset className="w-5 h-5 text-white" />
              ) : (
                partnerAvatarInitial || partnerName.charAt(0).toUpperCase()
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25d366] border-2 border-white rounded-full"></span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#111b21] truncate">{partnerName}</h3>
            </div>

            <p className="text-[11px] text-[#667781] truncate flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#25d366] animate-pulse shrink-0"></span>
              <span>{partnerSubtitle || (currentUserRole === 'SELLER' ? 'online • typically responds instantly' : partnerEmail || 'Active Merchant')}</span>
              {partnerPhone && (
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="inline-flex items-center gap-1 text-[#0A1F44] hover:underline cursor-pointer ml-1"
                  title="Copy Phone Number"
                >
                  <span>{partnerPhone}</span>
                  {copiedPhone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 text-slate-400" />}
                </button>
              )}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Search in chat */}
          <button
            type="button"
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch) setSearchQuery('');
            }}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              showSearch ? 'bg-[#d1d7db] text-[#111b21]' : 'text-[#54656f] hover:bg-[#e9edef]'
            }`}
            title="Search in conversation"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              soundEnabled ? 'text-[#0A1F44] hover:bg-[#e9edef]' : 'text-[#8696a0] hover:bg-[#e9edef]'
            }`}
            title={soundEnabled ? 'Sound alerts enabled' : 'Sound alerts muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Refresh Conversation */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 rounded-full text-[#54656f] hover:bg-[#e9edef] transition-colors cursor-pointer"
              title="Sync latest messages"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0A1F44]' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* SEARCH BAR (if toggled) */}
      {showSearch && (
        <div className="bg-[#f0f2f5] border-b border-[#d1d7db] px-4 py-2 flex items-center gap-2 animate-in fade-in duration-150">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#54656f] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in this conversation..."
              autoFocus
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-md border border-[#d1d7db] text-[#111b21] focus:outline-none focus:border-[#0A1F44]"
            />
          </div>
          {searchQuery && (
            <span className="text-[11px] text-[#54656f] whitespace-nowrap">
              {filteredCount} {filteredCount === 1 ? 'match' : 'matches'}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
            className="p-1 rounded-md text-[#54656f] hover:bg-[#e9edef] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. CHAT MESSAGES CANVAS WITH WHATSAPP DOODLE PATTERN */}
      <div
        ref={chatScrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 relative"
        style={{
          backgroundColor: '#efeae2',
          backgroundImage: `radial-gradient(#cfd5d8 0.75px, transparent 0.75px), radial-gradient(#cfd5d8 0.75px, #efeae2 0.75px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px',
        }}
      >
        {/* Encryption & Privacy Notice Banner like WhatsApp */}
        <div className="flex justify-center my-1">
          <div className="bg-[#fff9c4]/90 border border-[#fff59d] text-[#5d4037] text-[10px] font-medium px-4 py-1.5 rounded-lg shadow-[0_1px_0.5px_rgba(11,20,26,0.08)] max-w-md text-center flex items-center gap-1.5 backdrop-blur-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#f57f17] shrink-0" />
            <span>Messages in this thread are securely stored and verified by Martify Collection Partner Operations.</span>
          </div>
        </div>

        {/* Empty Conversation State */}
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-sm mx-auto space-y-3">
            <div className="w-14 h-14 rounded-full bg-white border border-[#d1d7db] flex items-center justify-center text-[#0A1F44] shadow-sm">
              <Headset className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#111b21]">Start Customer Support Conversation</h4>
              <p className="text-xs text-[#54656f] mt-1 leading-relaxed">
                {currentUserRole === 'SELLER'
                  ? 'Have a question about orders, wholesale inventory quota, payments, or document verification? Send a message below to connect with dedicated customer support.'
                  : 'No message history with this seller yet. Send an opening message or greeting to assist the merchant.'}
              </p>
            </div>
          </div>
        ) : (
          groupedMessages.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-3">
              {/* WhatsApp Date Separator Badge */}
              <div className="flex justify-center my-3">
                <span className="bg-[#ffffffcc] backdrop-blur-xs text-[#54656f] text-[10px] font-bold px-3 py-1 rounded-md shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] uppercase tracking-wider">
                  {group.dateHeader}
                </span>
              </div>

              {/* Message Bubbles in this date group */}
              {group.messages.map((m) => {
                const isMe = isUserSender(m.senderRole);
                const { imageUrl, cleanText } = extractImageUrl(m.message);

                // Highlight if searching
                const isMatch =
                  searchQuery.trim() &&
                  m.message.toLowerCase().includes(searchQuery.toLowerCase().trim());

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group transition-all`}
                  >
                    <div
                      className={`relative max-w-[85%] sm:max-w-md px-3.5 pt-2 pb-2 rounded-2xl text-xs shadow-[0_1px_1px_rgba(11,20,26,0.12)] transition-shadow ${
                        isMe
                          ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-xs ml-auto border border-[#c8ecc2]'
                          : 'bg-white text-[#111b21] rounded-tl-xs mr-auto border border-[#e9edef]'
                      } ${isMatch ? 'ring-2 ring-amber-400 bg-amber-50' : ''}`}
                    >
                      {/* Incoming Sender Label (for incoming messages) */}
                      {!isMe && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-bold text-[11px] text-[#0A1F44]">
                            {m.senderRole === 'SUPPORT' || m.senderRole === 'ADMIN'
                              ? 'Martify Collection'
                              : partnerName || 'Merchant'}
                          </span>
                        </div>
                      )}

                      {/* Image Attachment Preview (if message contains image) */}
                      {imageUrl && (
                        <div className="mb-2 rounded-lg overflow-hidden border border-black/10 bg-slate-100 max-w-sm">
                          <img
                            src={imageUrl.startsWith('http') ? imageUrl : imageUrl}
                            alt="Attachment"
                            className="w-full max-h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => setLightboxImage(imageUrl)}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {/* Message Text with Order Reference Pills */}
                      <p className="whitespace-pre-wrap break-words leading-relaxed text-[12.5px]">
                        {cleanText}
                      </p>

                      {/* WhatsApp Time & Double Ticks in bottom right (Blue if read, Grey if delivered) */}
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#667781] select-none">
                        <span>{formatMessageTime(m.createdAt)}</span>
                        {isMe && (
                          <span
                            title={m.isRead ? 'Read' : 'Delivered'}
                            className="inline-flex items-center"
                          >
                            {m.isRead ? (
                              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                            ) : (
                              <CheckCheck className="w-3.5 h-3.5 text-[#8696a0]" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* FLOATING SCROLL-TO-BOTTOM BUTTON (when scrolled up) */}
      {isScrolledUp && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-20 right-6 z-20 flex items-center gap-1.5 px-3 py-2 bg-white text-[#111b21] rounded-full shadow-lg border border-[#d1d7db] text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2"
        >
          <ArrowDown className="w-4 h-4 text-[#0A1F44]" />
          {unreadWhileScrolled > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#25d366] text-white text-[10px] flex items-center justify-center font-bold">
              {unreadWhileScrolled}
            </span>
          )}
          <span>New messages</span>
        </button>
      )}

      {/* EMOJI TRAY POPUP (if open) */}
      {showEmojis && (
        <div className="bg-white border-t border-[#d1d7db] p-2 flex items-center gap-2 overflow-x-auto shrink-0 shadow-inner">
          <span className="text-[11px] text-[#54656f] font-semibold pl-1 shrink-0">Emojis:</span>
          {COMMON_EMOJIS.map((emoji, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className="text-lg p-1 hover:bg-[#f0f2f5] rounded-md transition-transform active:scale-125 cursor-pointer shrink-0"
            >
              {emoji}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowEmojis(false)}
            className="p-1 text-[#54656f] hover:text-[#111b21] ml-auto cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. WHATSAPP BOTTOM INPUT BAR */}
      <div className="bg-[#f0f2f5] border-t border-[#d1d7db] px-3 py-2.5 sm:px-4 shrink-0">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            className={`p-2 rounded-full transition-colors cursor-pointer shrink-0 ${
              showEmojis ? 'text-[#0A1F44] bg-[#e9edef]' : 'text-[#54656f] hover:bg-[#e9edef]'
            }`}
            title="Choose Emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Paperclip Attachment */}
          <button
            type="button"
            disabled={uploadingAttachment}
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full text-[#54656f] hover:bg-[#e9edef] transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Attach screenshot or document"
          >
            <Paperclip className={`w-5 h-5 ${uploadingAttachment ? 'animate-spin text-[#0A1F44]' : ''}`} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileSelected}
            className="hidden"
          />

          {/* Reference Order button (Seller only, subtle clean icon next to attachment) */}
          {currentUserRole === 'SELLER' && orders.length > 0 && (
            <button
              type="button"
              onClick={() => setShowOrderModal(true)}
              className="p-2 rounded-full text-[#54656f] hover:bg-[#e9edef] hover:text-[#0A1F44] transition-colors cursor-pointer shrink-0"
              title={`Reference an Order (${orders.length} available)`}
            >
              <ShoppingBag className="w-5 h-5" />
            </button>
          )}

          {/* WhatsApp Textarea Input */}
          <div className="flex-1 relative bg-white rounded-2xl border border-[#d1d7db] focus-within:border-[#0A1F44] shadow-xs flex items-center min-h-[40px] px-3.5 py-1.5">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={
                uploadingAttachment
                  ? 'Uploading image attachment...'
                  : currentUserRole === 'SELLER'
                  ? 'Type message to support (Press Enter to send, Shift+Enter for new line)...'
                  : `Reply to ${partnerName || 'merchant'}...`
              }
              className="w-full text-xs text-[#111b21] placeholder-[#8696a0] focus:outline-none bg-transparent resize-none leading-relaxed"
            />
          </div>

          {/* WhatsApp Send Button */}
          <button
            type="submit"
            disabled={sending || (!inputText.trim() && !uploadingAttachment)}
            className="w-10 h-10 rounded-full bg-[#0A1F44] hover:bg-[#102A5C] disabled:opacity-40 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer shrink-0"
            title="Send message"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>

      {/* MODAL: TAG ORDER REFERENCE */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#0A1F44]" />
                <h3 className="text-sm font-bold text-slate-900">Select Order to Reference</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No orders found to reference.
                </div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => handleInsertOrderReference(ord.id)}
                    className="p-3 rounded-lg border border-slate-200 hover:border-[#0A1F44] hover:bg-[#F4F7FB] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        #{ord.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {ord.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 flex justify-between items-center">
                      <span className="truncate max-w-[200px]">{ord.product?.title || 'Product'}</span>
                      <span className="font-bold text-slate-900">${ord.totalPrice}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Buyer: {ord.buyerName} • {ord.buyerPhone}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="px-4 py-1.5 text-xs border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FOR IMAGES */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-pointer"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-2" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage}
              alt="Zoomed Attachment"
              className="max-h-[85vh] max-w-full rounded-lg shadow-2xl object-contain"
            />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
