import api from './api';
import { Order, CreateOrderPayload, PaginatedResponse } from '../types';

export const orderService = {
  async createOrder(data: CreateOrderPayload): Promise<Order> {
    const response = await api.post<Order>('/orders', data);
    return response.data;
  },

  async getMyOrders(
    params: { status?: string; page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<Order>> {
    const response = await api.get<PaginatedResponse<Order>>('/orders/my', {
      params,
    });
    return response.data;
  },

  async getOrderById(id: string): Promise<Order> {
    const response = await api.get<Order>(`/orders/${id}`);
    return response.data;
  },

  async getInvoice(id: string): Promise<string> {
    const response = await api.get<{ html: string }>(`/orders/${id}/invoice`);
    return response.data.html;
  },

  async cancelOrder(id: string): Promise<void> {
    await api.post(`/orders/${id}/cancel`);
  },
};

export default orderService;
