import axios from 'axios';
import type {
  NotificationListResponse,
  NotificationCountResponse,
  NotificationStatsResponse,
  NotificationPreferences,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3007';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface NotificationFilters {
  page?: number;
  limit?: number;
  type?: string;
  priority?: string;
  unreadOnly?: boolean;
}

/**
 * Notification API Client
 * Handles all notification-related requests
 */
export const notificationApi = {
  /**
   * Get notifications with pagination and filters
   */
  async getNotifications(filters: NotificationFilters = {}): Promise<NotificationListResponse> {
    const response = await api.get('/api/v1/notifications', { params: filters });
    return response.data;
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<NotificationCountResponse> {
    const response = await api.get('/api/v1/notifications/unread-count');
    return response.data;
  },

  /**
   * Get notification statistics
   */
  async getStats(): Promise<NotificationStatsResponse> {
    const response = await api.get('/api/v1/notifications/stats');
    return response.data;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<void>> {
    const response = await api.put(`/api/v1/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<ApiResponse<{ count: number }>> {
    const response = await api.put('/api/v1/notifications/mark-all-read');
    return response.data;
  },

  /**
   * Archive a notification
   */
  async archiveNotification(notificationId: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/api/v1/notifications/${notificationId}`);
    return response.data;
  },

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<ApiResponse<void>> {
    const response = await api.post('/api/v1/notifications/preferences', preferences);
    return response.data;
  },
};

export default notificationApi;
