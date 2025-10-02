import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { OnboardingStatus, CharacterRecommendation } from '@/types';
import { onboardingApi } from '@/services/onboardingApi';

/**
 * Onboarding Store (T037)
 * Manages new user onboarding flow and character recommendations
 */
export const useOnboardingStore = defineStore('onboarding', () => {
  // State
  const status = ref<OnboardingStatus | null>(null);
  const recommendations = ref<CharacterRecommendation[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isOnboardingComplete = computed(() => {
    return status.value?.completed || false;
  });

  const isOnboardingSkipped = computed(() => {
    return status.value?.skipped || false;
  });

  const currentStep = computed(() => {
    return status.value?.currentStep || 0;
  });

  const totalSteps = computed(() => {
    return status.value?.totalSteps || 0;
  });

  const progress = computed(() => {
    if (!status.value || status.value.totalSteps === 0) return 0;
    return (status.value.currentStep / status.value.totalSteps) * 100;
  });

  const currentStepData = computed(() => {
    if (!status.value || !status.value.steps) return null;
    return status.value.steps[status.value.currentStep];
  });

  const topRecommendations = computed(() => {
    return recommendations.value.slice(0, 5);
  });

  // Actions
  async function fetchStatus() {
    loading.value = true;
    error.value = null;
    try {
      const response = await onboardingApi.getStatus();
      if (response.success) {
        status.value = response.data;
      } else {
        error.value = 'Failed to fetch onboarding status';
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch onboarding status';
      console.error('Error fetching onboarding status:', err);
    } finally {
      loading.value = false;
    }
  }

  async function startOnboarding() {
    loading.value = true;
    error.value = null;
    try {
      const response = await onboardingApi.start();
      if (response.success) {
        status.value = response.data;
        return true;
      } else {
        error.value = 'Failed to start onboarding';
        return false;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to start onboarding';
      console.error('Error starting onboarding:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function completeStep(stepId: string, data: any) {
    loading.value = true;
    error.value = null;
    try {
      const response = await onboardingApi.completeStep(stepId, data);
      if (response.success) {
        status.value = response.data;
        return true;
      } else {
        error.value = 'Failed to complete step';
        return false;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to complete step';
      console.error('Error completing step:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function skipOnboarding() {
    loading.value = true;
    error.value = null;
    try {
      const response = await onboardingApi.skip();
      if (response.success) {
        if (status.value) {
          status.value.skipped = true;
          status.value.completed = false;
        }
        return true;
      } else {
        error.value = 'Failed to skip onboarding';
        return false;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to skip onboarding';
      console.error('Error skipping onboarding:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function fetchRecommendations(interests: string[], mbtiType?: string) {
    loading.value = true;
    error.value = null;
    try {
      const response = await onboardingApi.getRecommendations(interests, mbtiType);
      if (response.success) {
        recommendations.value = response.data;
      } else {
        error.value = 'Failed to fetch recommendations';
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch recommendations';
      console.error('Error fetching recommendations:', err);
    } finally {
      loading.value = false;
    }
  }

  function resetState() {
    status.value = null;
    recommendations.value = [];
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    status,
    recommendations,
    loading,
    error,

    // Getters
    isOnboardingComplete,
    isOnboardingSkipped,
    currentStep,
    totalSteps,
    progress,
    currentStepData,
    topRecommendations,

    // Actions
    fetchStatus,
    startOnboarding,
    completeStep,
    skipOnboarding,
    fetchRecommendations,
    resetState,
  };
});
