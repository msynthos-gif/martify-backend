import { apiClient } from './client';
import type { ApiResponse, AuthResponse, User, Role } from '../types';

export const authApi = {
  async login(email: string, password: string, expectedRole?: Role): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
      expectedRole,
    });
    return res.data.data;
  },

  async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', {
      ...data,
      role: 'SELLER',
    });
    return res.data.data;
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },
};
