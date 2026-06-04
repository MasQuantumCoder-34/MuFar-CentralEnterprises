import api from './api';
import { Order, CreateOrderPayload, TrackEvent, PaginatedResponse } from '../types';

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

  async getOrderById(id: number): Promise<Order> {
    const response = await api.get<Order>(`/orders/${id}`);
    return response.data;
  },

  async getOrderTracking(id: number): Promise<TrackEvent[]> {
    const response = await api.get<{ tracking: TrackEvent[] }>(
      `/orders/${id}/tracking`
    );
    return response.data.tracking;
  },

  async getInvoice(id: number): Promise<string> {
    const response = await api.get<{ html: string }>(`/orders/${id}/invoice`);
    return response.data.html;
  },

  async cancelOrder(id: number): Promise<void> {
    await api.post(`/orders/${id}/cancel`);
  },
};

export default orderService;
