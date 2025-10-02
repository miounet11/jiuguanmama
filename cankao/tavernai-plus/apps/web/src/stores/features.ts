import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { FeatureConfig } from '@/types';
import { featureApi } from '@/services/featureApi';

/**
 * Feature Store (T034)
 * Manages feature gating and progressive disclosure state
 */
export const useFeatureStore = defineStore('features', () => {
  // State
  const features = ref<FeatureConfig[]>([]);
  const userUnlocks = ref<string[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isFeatureUnlocked = computed(() => {
    return (featureId: string): boolean => {
      return userUnlocks.value.includes(featureId);
    };
  });

  const getFeaturesByCategory = computed(() => {
    return (category: string): FeatureConfig[] => {
      return features.value.filter((f) => f.category === category);
    };
  });

  const availableFeatures = computed(() => {
    return features.value.filter((f) => f.enabled);
  });

  const betaFeatures = computed(() => {
    return features.value.filter((f) => f.beta);
  });

  const getFeatureById = computed(() => {
    return (featureId: string): FeatureConfig | undefined => {
      return features.value.find((f) => f.featureId === featureId);
    };
  });

  const isLoaded = computed(() => {
    return features.value.length > 0;
  });

  // Actions
  async function fetchFeatures() {
    loading.value = true;
    error.value = null;
    try {
      const response = await featureApi.getFeatures();
      if (response.success) {
        features.value = response.data;
      } else {
        error.value = 'Failed to fetch features';
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch features';
      console.error('Error fetching features:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchUserUnlocks() {
    loading.value = true;
    error.value = null;
    try {
      const response = await featureApi.getUserUnlocks();
      if (response.success) {
        userUnlocks.value = response.data;
      } else {
        error.value = 'Failed to fetch user unlocks';
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch user unlocks';
      console.error('Error fetching user unlocks:', err);
    } finally {
      loading.value = false;
    }
  }

  async function unlockFeature(featureId: string, method: 'level_up' | 'achievement' | 'payment' | 'manual') {
    loading.value = true;
    error.value = null;
    try {
      const response = await featureApi.unlockFeature({ featureId, unlockMethod: method });
      if (response.success) {
        // Add to user unlocks
        if (!userUnlocks.value.includes(featureId)) {
          userUnlocks.value.push(featureId);
        }
        return true;
      } else {
        error.value = response.message || 'Failed to unlock feature';
        return false;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to unlock feature';
      console.error('Error unlocking feature:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function checkFeatureAccess(featureId: string) {
    try {
      const response = await featureApi.canAccessFeature(featureId);
      return response.data;
    } catch (err: any) {
      console.error('Error checking feature access:', err);
      return {
        canAccess: false,
        reason: 'Failed to check access',
      };
    }
  }

  function resetState() {
    features.value = [];
    userUnlocks.value = [];
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    features,
    userUnlocks,
    loading,
    error,

    // Getters
    isFeatureUnlocked,
    getFeaturesByCategory,
    availableFeatures,
    betaFeatures,
    getFeatureById,
    isLoaded,

    // Actions
    fetchFeatures,
    fetchUserUnlocks,
    unlockFeature,
    checkFeatureAccess,
    resetState,
  };
});
