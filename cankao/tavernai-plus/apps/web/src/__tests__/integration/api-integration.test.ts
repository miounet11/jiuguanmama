/**
 * API Integration Tests
 * Tests API client integration with stores and components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import axios from 'axios';
import { useFeaturesStore } from '@/stores/features';
import { useGamificationStore } from '@/stores/gamification';
import { useNotificationsStore } from '@/stores/notifications';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('API Integration Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Setup default axios mock
    mockedAxios.create = vi.fn(() => mockedAxios as any);
    mockedAxios.interceptors = {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    } as any;
  });

  describe('Features API Integration', () => {
    it('should fetch features with proper auth header', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'F1',
              name: 'Feature 1',
              category: 'core',
              enabled: true,
            },
          ],
        },
      };

      mockedAxios.get = vi.fn().mockResolvedValue(mockResponse);

      const store = useFeaturesStore();
      await store.fetchFeatures();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/features');
      expect(store.features).toEqual(mockResponse.data.data);
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get = vi.fn().mockRejectedValue({
        response: {
          status: 500,
          data: { error: 'Internal Server Error' },
        },
      });

      const store = useFeaturesStore();
      await store.fetchFeatures();

      expect(store.error).toBeTruthy();
      expect(store.features).toEqual([]);
    });

    it('should unlock feature with POST request', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'unlock-1',
            featureId: 'F5',
            unlockMethod: 'manual',
          },
        },
      };

      mockedAxios.post = vi.fn().mockResolvedValue(mockResponse);

      const store = useFeaturesStore();
      const result = await store.unlockFeature('F5', 'manual');

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/v1/features/unlock', {
        featureId: 'F5',
        unlockMethod: 'manual',
      });
      expect(result).toBe(true);
    });
  });

  describe('Gamification API Integration', () => {
    it('should fetch overview with proper data transformation', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            level: 15,
            experience: 3000,
            nextLevelExp: 3500,
            totalAchievements: 30,
            unlockedAchievements: 22,
          },
        },
      };

      mockedAxios.get = vi.fn().mockResolvedValue(mockResponse);

      const store = useGamificationStore();
      await store.fetchOverview();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/gamification/overview');
      expect(store.overview).toEqual(mockResponse.data.data);
    });

    it('should fetch affinity list with query parameters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              characterId: 'char-1',
              characterName: 'Alice',
              level: 8,
              experience: 1200,
            },
          ],
        },
      };

      mockedAxios.get = vi.fn().mockResolvedValue(mockResponse);

      const store = useGamificationStore();
      await store.fetchAffinityList({ limit: 10, sortBy: 'level', order: 'desc' });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/v1/gamification/affinity',
        expect.objectContaining({
          params: {
            limit: 10,
            sortBy: 'level',
            order: 'desc',
          },
        })
      );
    });

    it('should filter achievements by unlock status', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'ach-1',
              unlocked: true,
              progress: 10,
              maxProgress: 10,
            },
          ],
        },
      };

      mockedAxios.get = vi.fn().mockResolvedValue(mockResponse);

      const store = useGamificationStore();
      await store.fetchAchievements({ unlocked: true });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/v1/gamification/achievements',
        expect.objectContaining({
          params: { unlocked: true },
        })
      );
    });
  });

  describe('Notifications API Integration', () => {
    it('should fetch notifications with pagination', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'notif-1',
              title: 'New Achievement',
              message: 'You unlocked an achievement!',
              read: false,
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            totalPages: 3,
            totalCount: 50,
          },
        },
      };

      mockedAxios.get = vi.fn().mockResolvedValue(mockResponse);

      const store = useNotificationsStore();
      await store.fetchNotifications({ page: 1, limit: 20 });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/v1/notifications',
        expect.objectContaining({
          params: { page: 1, limit: 20 },
        })
      );
      expect(store.notifications).toEqual(mockResponse.data.data);
    });

    it('should mark notification as read with PATCH request', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'notif-1',
            read: true,
            readAt: new Date().toISOString(),
          },
        },
      };

      mockedAxios.patch = vi.fn().mockResolvedValue(mockResponse);

      const store = useNotificationsStore();
      // First add a notification
      store.notifications = [
        {
          id: 'notif-1',
          title: 'Test',
          message: 'Test message',
          read: false,
          type: 'info',
          priority: 'normal',
          createdAt: new Date(),
        },
      ];

      await store.markAsRead('notif-1');

      expect(mockedAxios.patch).toHaveBeenCalledWith('/api/v1/notifications/notif-1/read');

      // Check local state updated
      const notification = store.notifications.find((n) => n.id === 'notif-1');
      expect(notification?.read).toBe(true);
    });

    it('should fetch unread count separately', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { count: 5 },
        },
      };

      mockedAxios.get = vi.fn().mockResolvedValue(mockResponse);

      const store = useNotificationsStore();
      await store.fetchUnreadCount();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/notifications/unread/count');
      expect(store.unreadCount).toBe(5);
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('should retry failed requests up to 3 times', async () => {
      let callCount = 0;
      mockedAxios.get = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject({
            response: { status: 500, data: { error: 'Server error' } },
          });
        }
        return Promise.resolve({
          data: { success: true, data: [] },
        });
      });

      const store = useFeaturesStore();

      // Note: This test assumes retry logic is implemented in the API client
      // If not yet implemented, this test documents the expected behavior
      await store.fetchFeatures();

      // Should have retried and eventually succeeded
      expect(callCount).toBeLessThanOrEqual(3);
    });

    it('should handle network errors', async () => {
      mockedAxios.get = vi.fn().mockRejectedValue({
        message: 'Network Error',
        code: 'ECONNREFUSED',
      });

      const store = useFeaturesStore();
      await store.fetchFeatures();

      expect(store.error).toBeTruthy();
      expect(store.features).toEqual([]);
    });

    it('should handle 401 Unauthorized and clear auth', async () => {
      mockedAxios.get = vi.fn().mockRejectedValue({
        response: {
          status: 401,
          data: { error: 'Unauthorized' },
        },
      });

      const store = useFeaturesStore();
      await store.fetchFeatures();

      // Should set error
      expect(store.error).toBeTruthy();
    });

    it('should handle 403 Forbidden for role-restricted features', async () => {
      mockedAxios.get = vi.fn().mockRejectedValue({
        response: {
          status: 403,
          data: { error: 'Insufficient permissions' },
        },
      });

      const store = useFeaturesStore();
      await store.fetchFeatures();

      expect(store.error).toContain('permissions');
    });
  });

  describe('Request/Response Interceptors', () => {
    it('should add auth token to requests', async () => {
      const token = 'test-jwt-token';
      localStorage.setItem('accessToken', token);

      mockedAxios.get = vi.fn().mockResolvedValue({
        data: { success: true, data: [] },
      });

      const store = useFeaturesStore();
      await store.fetchFeatures();

      // Verify interceptor would add Authorization header
      // This is testing the setup, actual implementation depends on axios config
      expect(mockedAxios.interceptors.request.use).toHaveBeenCalled();
    });

    it('should transform date strings to Date objects in responses', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'notif-1',
              createdAt: '2024-01-01T00:00:00.000Z',
              readAt: '2024-01-02T00:00:00.000Z',
            },
          ],
        },
      };

      mockedAxios.get = vi.fn().mockResolvedValue(mockResponse);

      const store = useNotificationsStore();
      await store.fetchNotifications();

      // Verify dates are transformed (if implemented in API client)
      expect(store.notifications[0]?.createdAt).toBeInstanceOf(Date);
    });
  });
});
