import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Tutorial, TutorialProgress } from '@/types';
import { tutorialApi } from '@/services/tutorialApi';

/**
 * Tutorial Store (T038)
 * Manages interactive tutorials and help system
 */
export const useTutorialStore = defineStore('tutorials', () => {
  // State
  const tutorials = ref<Tutorial[]>([]);
  const currentTutorial = ref<Tutorial | null>(null);
  const progress = ref<TutorialProgress | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const availableTutorials = computed(() => {
    return tutorials.value;
  });

  const tutorialsByCategory = computed(() => {
    return (category: string) => {
      return tutorials.value.filter((t) => t.category === category);
    };
  });

  const currentStepIndex = computed(() => {
    return progress.value?.currentStep || 0;
  });

  const totalSteps = computed(() => {
    return currentTutorial.value?.steps.length || 0;
  });

  const currentStep = computed(() => {
    if (!currentTutorial.value || currentStepIndex.value >= totalSteps.value) {
      return null;
    }
    return currentTutorial.value.steps[currentStepIndex.value];
  });

  const completionPercentage = computed(() => {
    if (totalSteps.value === 0) return 0;
    return (currentStepIndex.value / totalSteps.value) * 100;
  });

  const isComplete = computed(() => {
    return progress.value?.completed || false;
  });

  const isSkipped = computed(() => {
    return progress.value?.skipped || false;
  });

  // Actions
  async function fetchTutorials() {
    loading.value = true;
    error.value = null;
    try {
      const response = await tutorialApi.getTutorials();
      if (response.success) {
        tutorials.value = response.data;
      } else {
        error.value = 'Failed to fetch tutorials';
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch tutorials';
      console.error('Error fetching tutorials:', err);
    } finally {
      loading.value = false;
    }
  }

  async function loadTutorial(tutorialId: string) {
    loading.value = true;
    error.value = null;
    try {
      const response = await tutorialApi.getTutorialById(tutorialId);
      if (response.success) {
        currentTutorial.value = response.data;
        return true;
      } else {
        error.value = 'Failed to load tutorial';
        return false;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to load tutorial';
      console.error('Error loading tutorial:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function startTutorial(tutorialId: string) {
    loading.value = true;
    error.value = null;
    try {
      // Load tutorial first
      await loadTutorial(tutorialId);

      // Start tracking progress
      const response = await tutorialApi.startTutorial(tutorialId);
      if (response.success) {
        progress.value = response.data;
        return true;
      } else {
        error.value = 'Failed to start tutorial';
        return false;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to start tutorial';
      console.error('Error starting tutorial:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function nextStep() {
    if (!currentTutorial.value || !progress.value) return false;

    const nextStepIndex = currentStepIndex.value + 1;
    if (nextStepIndex >= totalSteps.value) {
      // Tutorial complete
      return await completeTutorial();
    }

    return await updateProgress(nextStepIndex);
  }

  async function previousStep() {
    if (!currentTutorial.value || !progress.value) return false;

    const prevStepIndex = Math.max(0, currentStepIndex.value - 1);
    return await updateProgress(prevStepIndex);
  }

  async function updateProgress(step: number) {
    if (!currentTutorial.value || !progress.value) return false;

    loading.value = true;
    error.value = null;
    try {
      const response = await tutorialApi.updateProgress(currentTutorial.value.id, step);
      if (response.success) {
        progress.value = response.data;
        return true;
      } else {
        error.value = 'Failed to update progress';
        return false;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to update progress';
      console.error('Error updating progress:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function completeTutorial() {
    if (!currentTutorial.value) return false;

    loading.value = true;
    error.value = null;
    try {
      const response = await tutorialApi.completeTutorial(currentTutorial.value.id);
      if (response.success) {
        if (progress.value) {
          progress.value.completed = true;
        }
        return true;
      } else {
        error.value = 'Failed to complete tutorial';
        return false;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to complete tutorial';
      console.error('Error completing tutorial:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function skipTutorial() {
    if (!currentTutorial.value) return false;

    loading.value = true;
    error.value = null;
    try {
      const response = await tutorialApi.skipTutorial(currentTutorial.value.id);
      if (response.success) {
        if (progress.value) {
          progress.value.skipped = true;
        }
        return true;
      } else {
        error.value = 'Failed to skip tutorial';
        return false;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to skip tutorial';
      console.error('Error skipping tutorial:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  function resetState() {
    tutorials.value = [];
    currentTutorial.value = null;
    progress.value = null;
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    tutorials,
    currentTutorial,
    progress,
    loading,
    error,

    // Getters
    availableTutorials,
    tutorialsByCategory,
    currentStepIndex,
    totalSteps,
    currentStep,
    completionPercentage,
    isComplete,
    isSkipped,

    // Actions
    fetchTutorials,
    loadTutorial,
    startTutorial,
    nextStep,
    previousStep,
    updateProgress,
    completeTutorial,
    skipTutorial,
    resetState,
  };
});
