// User & Auth Types
export type Role = 'SELLER' | 'ADMIN' | 'SUPPORT';
export type SellerStatus = 'PENDING' | 'APPROVED' | 'BLOCKED';
export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  sellerStatus: SellerStatus;
  kycStatus: KycStatus;
  kycDocumentUrl?: string | null;
  availableStock: number;
  balanceOnHold: string | number;
  balanceAvailable: string | number;
  isDemoAccount: boolean;
  storeName?: string | null;
  storeDescription?: string | null;
  storeImageUrl?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  subCategories?: Category[];
  showInNavbar?: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    products: number;
    subCategories?: number;
  };
}

export interface ProductImage {
  id: string;
  url: string;
  sortOrder: number;
}

// Product Types
export interface Product {
  id: string;
  title: string;
  description: string;
  price: string | number;
  imageUrl: string;
  images?: ProductImage[];
  stock: number;
  isActive: boolean;
  sellerId: string;
  categoryId: string;
  attributes?: Record<string, string[]>;
  manualSoldCount?: number | null;
  totalSold?: number;
  recentSalesCount?: number;
  clonedFromProductId?: string | null;
  createdAt: string;
  updatedAt?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  seller?: {
    id: string;
    name: string;
    storeName?: string | null;
    storeDescription?: string | null;
    storeImageUrl?: string | null;
    isDemoAccount?: boolean;
    availableStock?: number;
    balanceOnHold?: string | number;
    balanceAvailable?: string | number;
  };
  clonedFromProduct?: {
    id: string;
    title: string;
    seller?: {
      name: string;
    };
  };
}

// Cart Types
export interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: string | number;
  imageUrl: string;
  quantity: number;
  stockAvailable: number;
  isActive: boolean;
  sellerId: string;
  sellerName?: string;
  category?: {
    id: string;
    name: string;
  };
  selectedAttributes?: Record<string, string> | null;
}

export interface Cart {
  sessionId: string;
  items: CartItem[];
  itemCount: number;
  subtotal: string;
}

// Order Types
export type OrderStatus = 'BOOKED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED';

export interface Order {
  id: string;
  productId: string;
  sellerId: string;
  buyerName: string;
  buyerEmail?: string | null;
  buyerPhone: string;
  buyerAddress: string;
  country?: string | null;
  company?: string | null;
  address?: string | null;
  apartment?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  quantity: number;
  totalPrice: string | number;
  selectedAttributes?: Record<string, string> | null;
  status: OrderStatus;
  statusUpdatedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  product?: {
    id: string;
    title: string;
    price: string | number;
    imageUrl: string;
  };
  seller?: {
    id: string;
    name: string;
  };
}

// Checkout Input & Response
export interface CheckoutInput {
  sessionId: string;
  email: string;
  firstName: string;
  lastName: string;
  buyerName?: string;
  country?: string;
  company?: string | null;
  address: string;
  apartment?: string | null;
  city: string;
  state: string;
  zipCode: string;
  phone?: string | null;
  buyerPhone?: string;
  buyerAddress?: string;
  emailNewsOffers?: boolean;
}

export interface CheckoutResult {
  sessionId: string;
  buyerName: string;
  buyerEmail?: string;
  buyerPhone: string;
  buyerAddress: string;
  ordersCount: number;
  grandTotal: string | number;
  orders: Order[];
}

export interface SearchStore {
  id: string;
  name: string;
  storeName?: string | null;
  storeDescription?: string | null;
  storeImageUrl?: string | null;
  products: Product[];
}

export interface SearchResponse {
  query: string;
  products: Product[];
  stores: SearchStore[];
}

// Stock Request Types
export type StockRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface StockRequest {
  id: string;
  sellerId: string;
  quantity: number;
  note?: string | null;
  status: StockRequestStatus;
  createdAt: string;
  updatedAt?: string;
  seller?: {
    id: string;
    name: string;
    email: string;
    availableStock?: number;
  };
}

// Support Ticket & Message Types
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type SenderRole = 'SELLER' | 'SUPPORT' | 'ADMIN';

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderRole: SenderRole;
  message: string;
  isRead?: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  sellerId: string;
  orderId?: string | null;
  subject: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  seller?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    sellerStatus?: SellerStatus | null;
    kycStatus?: KycStatus | null;
  };
  order?: {
    id: string;
    totalPrice: string | number;
    status: OrderStatus;
  } | null;
  messages?: SupportMessage[];
  unreadCount?: number;
  _count?: {
    messages: number;
    unreadMessages?: number;
  };
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}
