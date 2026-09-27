import { apiClient } from './client';
import type {
  ApiResponse,
  User,
  Product,
  Order,
  StockRequest,
  SupportTicket,
} from '../types';

export const sellerApi = {
  async getProfile(): Promise<User> {
    const res = await apiClient.get<ApiResponse<User>>('/seller/me');
    return res.data.data;
  },

  async updateStoreProfile(data: {
    storeName?: string;
    storeDescription?: string | null;
    storeImageUrl?: string | null;
  }): Promise<User> {
    const res = await apiClient.patch<ApiResponse<User>>('/seller/profile', data);
    return res.data.data;
  },

  async uploadStoreImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const res = await apiClient.post<ApiResponse<{ url: string }>>(
      '/seller/profile/image',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return res.data.data;
  },

  async uploadKycDocument(files: File | File[]): Promise<{ url: string; urls: string[] }> {
    const formData = new FormData();
    if (Array.isArray(files)) {
      files.forEach((f) => formData.append('documents', f));
    } else {
      formData.append('document', files);
    }
    const res = await apiClient.post<ApiResponse<{ url: string; urls?: string[] }>>(
      '/seller/kyc/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    const data = res.data.data;
    return {
      url: data.url,
      urls: data.urls && data.urls.length > 0 ? data.urls : [data.url],
    };
  },

  async submitKyc(kycDocumentUrl: string | string[]): Promise<User> {
    const payloadUrl = Array.isArray(kycDocumentUrl)
      ? (kycDocumentUrl.length === 1 ? kycDocumentUrl[0] : JSON.stringify(kycDocumentUrl))
      : kycDocumentUrl;
    const res = await apiClient.patch<ApiResponse<User>>('/seller/kyc', {
      kycDocumentUrl: payloadUrl,
    });
    return res.data.data;
  },

  // Stock Requests
  async getStockRequests(): Promise<StockRequest[]> {
    const res = await apiClient.get<ApiResponse<StockRequest[]>>(
      '/seller/stock-requests'
    );
    return res.data.data;
  },

  async createStockRequest(data: {
    quantity: number;
    note?: string;
  }): Promise<StockRequest> {
    const res = await apiClient.post<ApiResponse<StockRequest>>(
      '/seller/stock-requests',
      data
    );
    return res.data.data;
  },

  // Products
  async uploadProductImage(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const res = await apiClient.post<ApiResponse<{ url: string; filename: string }>>(
      '/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return res.data.data;
  },

  async uploadProductImages(files: File[]): Promise<string[]> {
    if (!files.length) return [];
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });
    const res = await apiClient.post<ApiResponse<{ url?: string; urls?: string[]; files?: Array<{ url: string }> }>>(
      '/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    if (Array.isArray(res.data.data?.urls) && res.data.data.urls.length > 0) {
      return res.data.data.urls;
    }
    if (Array.isArray(res.data.data?.files) && res.data.data.files.length > 0) {
      return res.data.data.files.map((f) => f.url);
    }
    if (res.data.data?.url) {
      return [res.data.data.url];
    }
    return [];
  },

  async getProducts(): Promise<Product[]> {
    const res = await apiClient.get<ApiResponse<Product[]>>('/seller/products');
    return res.data.data;
  },

  async createProduct(data: {
    title: string;
    description: string;
    price: number;
    imageUrl?: string;
    images?: string[];
    stock: number;
    categoryId: string;
    clonedFromProductId?: string | null;
    attributes?: Record<string, string[]>;
    manualSoldCount?: number | null;
    isActive?: boolean;
  }): Promise<Product> {
    const res = await apiClient.post<ApiResponse<Product>>(
      '/seller/products',
      data
    );
    return res.data.data;
  },

  async updateProduct(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      price: number;
      imageUrl: string;
      images: string[];
      stock: number;
      categoryId: string;
      attributes?: Record<string, string[]>;
      manualSoldCount?: number | null;
      isActive: boolean;
    }>
  ): Promise<Product> {
    const res = await apiClient.patch<ApiResponse<Product>>(
      `/seller/products/${id}`,
      data
    );
    return res.data.data;
  },

  async deleteProduct(id: string): Promise<{ id: string; message: string }> {
    const res = await apiClient.delete<
      ApiResponse<{ id: string; message: string }>
    >(`/seller/products/${id}`);
    return res.data.data;
  },

  async cloneProduct(data: {
    catalogProductId: string;
    stock: number;
    price: number;
  }): Promise<Product> {
    const res = await apiClient.post<ApiResponse<Product>>(
      '/seller/products/clone',
      data
    );
    return res.data.data;
  },

  async batchCloneProducts(catalogProductIds: string[]): Promise<{ count: number; products: Product[] }> {
    const res = await apiClient.post<ApiResponse<{ count: number; products: Product[] }>>(
      '/seller/products/batch-clone',
      { catalogProductIds }
    );
    return res.data.data;
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    const res = await apiClient.get<ApiResponse<Order[]>>('/seller/orders');
    return res.data.data;
  },

  // Support Conversation (Single Continuous Thread)
  async getConversation(): Promise<SupportTicket> {
    const res = await apiClient.get<ApiResponse<SupportTicket>>(
      '/support/conversation'
    );
    return res.data.data;
  },

  async sendSupportMessage(message: string): Promise<SupportTicket> {
    const res = await apiClient.post<ApiResponse<SupportTicket>>(
      '/support/conversation/messages',
      { message }
    );
    return res.data.data;
  },

  // Legacy / fallback helpers
  async getTickets(): Promise<SupportTicket[]> {
    const res = await apiClient.get<ApiResponse<SupportTicket[]>>(
      '/support/tickets'
    );
    return res.data.data;
  },

  async addTicketMessage(id: string, message: string): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>(
      `/support/tickets/${id}/messages`,
      { message }
    );
    return res.data.data;
  },
};
