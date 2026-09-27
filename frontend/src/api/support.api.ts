import { apiClient } from './client';
import type {
  ApiResponse,
  SupportTicket,
  Order,
  OrderStatus,
  TicketStatus,
} from '../types';

export const supportApi = {
  // Support Tickets
  async getTickets(): Promise<SupportTicket[]> {
    const res = await apiClient.get<ApiResponse<SupportTicket[]>>(
      '/support/tickets'
    );
    return res.data.data;
  },

  async getTicketById(id: string): Promise<SupportTicket> {
    const res = await apiClient.get<ApiResponse<SupportTicket>>(
      `/support/tickets/${id}`
    );
    return res.data.data;
  },

  async addMessage(id: string, message: string): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>(
      `/support/tickets/${id}/messages`,
      { message }
    );
    return res.data.data;
  },

  async updateTicketStatus(
    id: string,
    status: TicketStatus
  ): Promise<SupportTicket> {
    const res = await apiClient.patch<ApiResponse<SupportTicket>>(
      `/support/tickets/${id}`,
      { status }
    );
    return res.data.data;
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    const res = await apiClient.get<ApiResponse<Order[]>>('/orders');
    return res.data.data;
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const res = await apiClient.patch<ApiResponse<any>>(
      `/orders/${id}/status`,
      { status }
    );
    return res.data.data?.order || res.data.data;
  },
};
