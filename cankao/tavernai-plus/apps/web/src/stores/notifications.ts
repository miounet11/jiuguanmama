import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Notification, NotificationStats } from '@/types';
import { notificationApi } from '@/services/notificationApi';
import websocketService from '@/services/websocket';

/**
 * Notification Store (T036)
 * Manages notifications and notification preferences
 */
export const useNotificationStore = defineStore('notifications', () => {
  // State
  const notifications = ref<Notification[]>([]);
  const unreadCount = ref(0);
  const stats = ref<NotificationStats | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Pagination
  const currentPage = ref(1);
  const pageSize = ref(20);
  const totalPages = ref(1);

  // Getters
  const unreadNotifications = computed(() => {
    return notifications.value.filter((n) => !n.read);
  });

  const readNotifications = computed(() => {
    return notifications.value.filter((n) => n.read);
  });

  const urgentNotifications = computed(() => {
    return notifications.value.filter((n) => n.priority === 'urgent' && !n.read);
  });

  const getNotificationsByType = computed(() => {
    return (type: string) => notifications.value.filter((n) => n.type === type);
  });

  // Actions
  async function fetchNotifications(filters: any = {}) {
    loading.value = true;
    error.value = null;
    try {
      const params = {
        page: currentPage.value,
        limit: pageSize.value,
        ...filters,
      };
      const response = await notificationApi.getNotifications(params);
      if (response.success) {
        notifications.value = response.data;
        if (response.pagination) {
          totalPages.value = response.pagination.totalPages;
          currentPage.value = response.pagination.page;
        }
      } else {
        error.value = 'Failed to fetch notifications';
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch notifications';
      console.error('Error fetching notifications:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchUnreadCount() {
    try {
      const response = await notificationApi.getUnreadCount();
      if (response.success && response.data) {
        unreadCount.value = response.data.count;
      }
    } catch (err: any) {
      console.error('Error fetching unread count:', err);
    }
  }

  async function fetchStats() {
    try {
      const response = await notificationApi.getStats();
      if (response.success) {
        stats.value = response.data;
      }
    } catch (err: any) {
      console.error('Error fetching notification stats:', err);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const response = await notificationApi.markAsRead(notificationId);
      if (response.success) {
        // Update local state
        const notification = notifications.value.find((n) => n.id === notificationId);
        if (notification) {
          notification.read = true;
          notification.readAt = new Date();
          unreadCount.value = Math.max(0, unreadCount.value - 1);
        }
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }

  async function markAllAsRead() {
    loading.value = true;
    try {
      const response = await notificationApi.markAllAsRead();
      if (response.success) {
        // Update local state
        notifications.value.forEach((n) => {
          n.read = true;
          n.readAt = new Date();
        });
        unreadCount.value = 0;
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error marking all as read:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function archiveNotification(notificationId: string) {
    try {
      const response = await notificationApi.archiveNotification(notificationId);
      if (response.success) {
        // Remove from local state
        const index = notifications.value.findIndex((n) => n.id === notificationId);
        if (index !== -1) {
          notifications.value.splice(index, 1);
        }
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error archiving notification:', err);
      return false;
    }
  }

  function setPage(page: number) {
    currentPage.value = page;
    fetchNotifications();
  }

  function resetState() {
    notifications.value = [];
    unreadCount.value = 0;
    stats.value = null;
    loading.value = false;
    error.value = null;
    currentPage.value = 1;
  }

  return {
    // State
    notifications,
    unreadCount,
    stats,
    loading,
    error,
    currentPage,
    pageSize,
    totalPages,

    // Getters
    unreadNotifications,
    readNotifications,
    urgentNotifications,
    getNotificationsByType,

    // Actions
    fetchNotifications,
    fetchUnreadCount,
    fetchStats,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    setPage,
    resetState,
  };
});
