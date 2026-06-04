import api from './api';
import { Notification, PaginatedResponse } from '../types';

export const notificationService = {
  async getNotifications(
    params: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<Notification>> {
    const response = await api.get<PaginatedResponse<Notification>>(
      '/notifications',
      { params }
    );
    return response.data;
  },

  async markAsRead(id: number): Promise<void> {
    await api.put(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.put('/notifications/read-all');
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ count: number }>(
      '/notifications/unread-count'
    );
    return response.data.count;
  },
};

export default notificationService;
