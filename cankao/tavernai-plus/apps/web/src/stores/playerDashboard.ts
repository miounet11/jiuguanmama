import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { gamificationApi } from '@/services/dashboardApi';

/**
 * Player Dashboard Store (T043)
 * Manages player-specific dashboard view and widgets
 */
export const usePlayerDashboardStore = defineStore('playerDashboard', () => {
  // State
  const widgets = ref<any[]>([]);
  const recentConversations = ref<any[]>([]);
  const quickStats = ref<any>(null);
  const favoriteCharacters = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const totalConversations = computed(() => quickStats.value?.totalConversations || 0);
  const totalMessages = computed(() => quickStats.value?.totalMessages || 0);
  const currentLevel = computed(() => quickStats.value?.level || 1);
  const totalExp = computed(() => quickStats.value?.totalExp || 0);

  const visibleWidgets = computed(() => {
    return widgets.value.filter((w) => w.visible);
  });

  // Actions
  async function fetchDashboardData() {
    loading.value = true;
    error.value = null;
    try {
      const overviewRes = await gamificationApi.getOverview();

      if (overviewRes.success) {
        quickStats.value = overviewRes.data;
      }

      // TODO: Fetch recent conversations and favorite characters
      // from appropriate API endpoints
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch player dashboard';
      console.error('Error fetching player dashboard:', err);
    } finally {
      loading.value = false;
    }
  }

  function updateWidgetVisibility(widgetId: string, visible: boolean) {
    const widget = widgets.value.find((w) => w.id === widgetId);
    if (widget) {
      widget.visible = visible;
    }
  }

  function resetState() {
    widgets.value = [];
    recentConversations.value = [];
    quickStats.value = null;
    favoriteCharacters.value = [];
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    widgets,
    recentConversations,
    quickStats,
    favoriteCharacters,
    loading,
    error,

    // Getters
    totalConversations,
    totalMessages,
    currentLevel,
    totalExp,
    visibleWidgets,

    // Actions
    fetchDashboardData,
    updateWidgetVisibility,
    resetState,
  };
});
