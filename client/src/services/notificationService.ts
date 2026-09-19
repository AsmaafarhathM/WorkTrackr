import { api } from './api';
import { NotificationItem } from '../types';

export const notificationService = {
  async getNotifications(): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    const response = await api.get('/notifications');
    return response.data.data;
  },

  async markAsRead(id: string): Promise<{ notification: NotificationItem; unreadCount: number }> {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data.data;
  },

  async markAllAsRead(): Promise<{ unreadCount: number }> {
    const response = await api.patch('/notifications/read-all');
    return response.data.data;
  },
};
