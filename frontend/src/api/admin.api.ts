import { apiClient } from './client';
import type {
  ApiResponse,
  User,
  Category,
  StockRequest,
  KycStatus,
  SellerStatus,
  StockRequestStatus,
} from '../types';

export const adminApi = {
  // Sellers
  async getSellers(): Promise<User[]> {
    const res = await apiClient.get<ApiResponse<User[]>>('/admin/sellers');
    return res.data.data;
  },

  async getSellerById(id: string): Promise<User> {
    const res = await apiClient.get<ApiResponse<User>>(`/admin/sellers/${id}`);
    return res.data.data;
  },

  async updateSellerKyc(id: string, kycStatus: KycStatus): Promise<User> {
    const res = await apiClient.patch<ApiResponse<User>>(
      `/admin/sellers/${id}/kyc`,
      { kycStatus }
    );
    return res.data.data;
  },

  async updateSellerStatus(
    id: string,
    sellerStatus: SellerStatus
  ): Promise<User> {
    const res = await apiClient.patch<ApiResponse<User>>(
      `/admin/sellers/${id}`,
      { sellerStatus }
    );
    return res.data.data;
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await apiClient.get<ApiResponse<Category[]>>(
      '/admin/categories'
    );
    return res.data.data;
  },

  async createCategory(data: {
    name: string;
    slug?: string;
    parentId?: string | null;
    showInNavbar?: boolean;
  }): Promise<Category> {
    const res = await apiClient.post<ApiResponse<Category>>(
      '/admin/categories',
      data
    );
    return res.data.data;
  },

  async updateCategory(
    id: string,
    data: { name?: string; slug?: string; parentId?: string | null; showInNavbar?: boolean }
  ): Promise<Category> {
    const res = await apiClient.put<ApiResponse<Category>>(
      `/admin/categories/${id}`,
      data
    );
    return res.data.data;
  },

  async deleteCategory(id: string): Promise<{ id: string; message: string }> {
    const res = await apiClient.delete<
      ApiResponse<{ id: string; message: string }>
    >(`/admin/categories/${id}`);
    return res.data.data;
  },

  // Stock Requests
  async getStockRequests(): Promise<StockRequest[]> {
    const res = await apiClient.get<ApiResponse<StockRequest[]>>(
      '/admin/stock-requests'
    );
    return res.data.data;
  },

  async updateStockRequestStatus(
    id: string,
    status: StockRequestStatus
  ): Promise<StockRequest> {
    const res = await apiClient.patch<ApiResponse<StockRequest>>(
      `/admin/stock-requests/${id}`,
      { status }
    );
    return res.data.data;
  },
};
