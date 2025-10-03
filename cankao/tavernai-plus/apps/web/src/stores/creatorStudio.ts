import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { creatorStudioApi } from '@/services/dashboardApi';

/**
 * Creator Studio Store (T039)
 * Manages creator dashboard, statistics, and AI generation
 */
export const useCreatorStudioStore = defineStore('creatorStudio', () => {
  // State
  const overview = ref<any>(null);
  const statistics = ref<any>(null);
  const generationHistory = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const totalCharacters = computed(() => overview.value?.totalCharacters || 0);
  const totalViews = computed(() => overview.value?.totalViews || 0);
  const totalLikes = computed(() => overview.value?.totalLikes || 0);
  const avgRating = computed(() => overview.value?.avgRating || 0);

  const topWorks = computed(() => statistics.value?.topWorks || []);
  const trends = computed(() => statistics.value?.trends || null);

  const recentGenerations = computed(() => {
    return generationHistory.value.slice(0, 10);
  });

  // Actions
  async function fetchOverview() {
    loading.value = true;
    error.value = null;
    try {
      const response = await creatorStudioApi.getOverview();
      if (response.success) {
        overview.value = response.data;
      } else {
        error.value = 'Failed to fetch creator overview';
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch creator overview';
      console.error('Error fetching creator overview:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchStatistics(params?: { limit?: number; sortBy?: string }) {
    loading.value = true;
    error.value = null;
    try {
      const response = await creatorStudioApi.getStatistics(params);
      if (response.success) {
        statistics.value = response.data;
      } else {
        error.value = 'Failed to fetch statistics';
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch statistics';
      console.error('Error fetching statistics:', err);
    } finally {
      loading.value = false;
    }
  }

  async function generateCharacter(prompt: string, config?: any) {
    loading.value = true;
    error.value = null;
    try {
      const result = await creatorStudioApi.generateCharacter(prompt, config);
      if (result.success) {
        // Add to generation history
        generationHistory.value.unshift({
          type: 'character',
          prompt,
          result: result.data,
          tokensUsed: result.tokensUsed,
          cost: result.cost,
          timestamp: new Date(),
        });
        return result;
      } else {
        error.value = 'Failed to generate character';
        return null;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to generate character';
      console.error('Error generating character:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function generateScenario(prompt: string, config?: any) {
    loading.value = true;
    error.value = null;
    try {
      const result = await creatorStudioApi.generateScenario(prompt, config);
      if (result.success) {
        // Add to generation history
        generationHistory.value.unshift({
          type: 'scenario',
          prompt,
          result: result.data,
          tokensUsed: result.tokensUsed,
          cost: result.cost,
          timestamp: new Date(),
        });
        return result;
      } else {
        error.value = 'Failed to generate scenario';
        return null;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to generate scenario';
      console.error('Error generating scenario:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  function clearHistory() {
    generationHistory.value = [];
  }

  function resetState() {
    overview.value = null;
    statistics.value = null;
    generationHistory.value = [];
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    overview,
    statistics,
    generationHistory,
    loading,
    error,

    // Getters
    totalCharacters,
    totalViews,
    totalLikes,
    avgRating,
    topWorks,
    trends,
    recentGenerations,

    // Actions
    fetchOverview,
    fetchStatistics,
    generateCharacter,
    generateScenario,
    clearHistory,
    resetState,
  };
});
