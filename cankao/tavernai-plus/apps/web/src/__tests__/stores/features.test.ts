/**
 * Features Store Integration Tests
 * Tests feature management and unlocking logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useFeaturesStore } from '@/stores/features';
import { featureApi } from '@/services/featureApi';

// Mock the API
vi.mock('@/services/featureApi', () => ({
  featureApi: {
    getFeatures: vi.fn(),
    getUserUnlocks: vi.fn(),
    unlockFeature: vi.fn(),
    checkFeatureAccess: vi.fn(),
  },
}));

describe('Features Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('fetchFeatures', () => {
    it('should fetch and store features', async () => {
      const mockFeatures = [
        {
          id: 'F1',
          name: 'Progressive Feature Disclosure',
          description: 'Gradual UI revelation',
          category: 'core',
          enabled: true,
        },
        {
          id: 'F2',
          name: 'Role-Oriented Views',
          description: 'Customized dashboards',
          category: 'core',
          enabled: true,
        },
      ];

      vi.mocked(featureApi.getFeatures).mockResolvedValue({
        success: true,
        data: mockFeatures,
      });

      const store = useFeaturesStore();
      await store.fetchFeatures();

      expect(store.features).toEqual(mockFeatures);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should handle fetch errors', async () => {
      vi.mocked(featureApi.getFeatures).mockRejectedValue(
        new Error('Network error')
      );

      const store = useFeaturesStore();
      await store.fetchFeatures();

      expect(store.features).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.error).toBe('Network error');
    });
  });

  describe('fetchUserUnlocks', () => {
    it('should fetch and store user unlocks', async () => {
      const mockUnlocks = [
        {
          id: 'unlock-1',
          featureId: 'F1',
          userId: 'user-1',
          unlockMethod: 'default',
          unlockedAt: new Date(),
        },
        {
          id: 'unlock-2',
          featureId: 'F2',
          userId: 'user-1',
          unlockMethod: 'achievement',
          unlockedAt: new Date(),
        },
      ];

      vi.mocked(featureApi.getUserUnlocks).mockResolvedValue({
        success: true,
        data: mockUnlocks,
      });

      const store = useFeaturesStore();
      await store.fetchUserUnlocks();

      expect(store.userUnlocks).toEqual(mockUnlocks);
      expect(store.loading).toBe(false);
    });
  });

  describe('unlockFeature', () => {
    it('should unlock a feature successfully', async () => {
      const mockUnlock = {
        id: 'unlock-3',
        featureId: 'F3',
        userId: 'user-1',
        unlockMethod: 'manual',
        unlockedAt: new Date(),
      };

      vi.mocked(featureApi.unlockFeature).mockResolvedValue({
        success: true,
        data: mockUnlock,
      });

      const store = useFeaturesStore();
      const result = await store.unlockFeature('F3', 'manual');

      expect(result).toBe(true);
      expect(store.userUnlocks).toContainEqual(mockUnlock);
    });

    it('should handle unlock errors', async () => {
      vi.mocked(featureApi.unlockFeature).mockResolvedValue({
        success: false,
        error: 'Feature already unlocked',
      });

      const store = useFeaturesStore();
      const result = await store.unlockFeature('F3', 'manual');

      expect(result).toBe(false);
      expect(store.error).toBe('Feature already unlocked');
    });
  });

  describe('isFeatureUnlocked', () => {
    it('should return true for unlocked features', async () => {
      vi.mocked(featureApi.getUserUnlocks).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'unlock-1',
            featureId: 'F1',
            userId: 'user-1',
            unlockMethod: 'default',
            unlockedAt: new Date(),
          },
        ],
      });

      const store = useFeaturesStore();
      await store.fetchUserUnlocks();

      expect(store.isFeatureUnlocked('F1')).toBe(true);
      expect(store.isFeatureUnlocked('F2')).toBe(false);
    });
  });

  describe('getFeatureById', () => {
    it('should return feature by ID', async () => {
      const mockFeatures = [
        {
          id: 'F1',
          name: 'Feature 1',
          description: 'Description',
          category: 'core',
          enabled: true,
        },
      ];

      vi.mocked(featureApi.getFeatures).mockResolvedValue({
        success: true,
        data: mockFeatures,
      });

      const store = useFeaturesStore();
      await store.fetchFeatures();

      const feature = store.getFeatureById('F1');
      expect(feature).toEqual(mockFeatures[0]);
    });

    it('should return undefined for non-existent feature', async () => {
      vi.mocked(featureApi.getFeatures).mockResolvedValue({
        success: true,
        data: [],
      });

      const store = useFeaturesStore();
      await store.fetchFeatures();

      const feature = store.getFeatureById('F99');
      expect(feature).toBeUndefined();
    });
  });

  describe('getFeaturesByCategory', () => {
    it('should filter features by category', async () => {
      const mockFeatures = [
        {
          id: 'F1',
          name: 'Feature 1',
          description: 'Description',
          category: 'core',
          enabled: true,
        },
        {
          id: 'F2',
          name: 'Feature 2',
          description: 'Description',
          category: 'premium',
          enabled: true,
        },
        {
          id: 'F3',
          name: 'Feature 3',
          description: 'Description',
          category: 'core',
          enabled: true,
        },
      ];

      vi.mocked(featureApi.getFeatures).mockResolvedValue({
        success: true,
        data: mockFeatures,
      });

      const store = useFeaturesStore();
      await store.fetchFeatures();

      const coreFeatures = store.getFeaturesByCategory('core');
      expect(coreFeatures).toHaveLength(2);
      expect(coreFeatures.every((f) => f.category === 'core')).toBe(true);
    });
  });

  describe('isLoaded', () => {
    it('should return true when features and unlocks are loaded', async () => {
      vi.mocked(featureApi.getFeatures).mockResolvedValue({
        success: true,
        data: [{ id: 'F1', name: 'Feature 1', category: 'core', enabled: true }],
      });

      vi.mocked(featureApi.getUserUnlocks).mockResolvedValue({
        success: true,
        data: [],
      });

      const store = useFeaturesStore();
      expect(store.isLoaded).toBe(false);

      await store.fetchFeatures();
      await store.fetchUserUnlocks();

      expect(store.isLoaded).toBe(true);
    });
  });
});
