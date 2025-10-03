import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { creatorStudioApi } from '@/services/dashboardApi';

/**
 * Creator Dashboard Store (T042)
 * Manages creator-specific dashboard view and widgets
 */
export const useCreatorDashboardStore = defineStore('creatorDashboard', () => {
  // State
  const widgets = ref<any[]>([]);
  const recentActivity = ref<any[]>([]);
  const quickStats = ref<any>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const totalWorks = computed(() => quickStats.value?.totalWorks || 0);
  const totalViews = computed(() => quickStats.value?.totalViews || 0);
  const totalLikes = computed(() => quickStats.value?.totalLikes || 0);
  const avgRating = computed(() => quickStats.value?.avgRating || 0);

  const visibleWidgets = computed(() => {
    return widgets.value.filter((w) => w.visible);
  });

  // Actions
  async function fetchDashboardData() {
    loading.value = true;
    error.value = null;
    try {
      const [overviewRes, statsRes] = await Promise.all([
        creatorStudioApi.getOverview(),
        creatorStudioApi.getStatistics({ limit: 5 }),
      ]);

      if (overviewRes.success) {
        quickStats.value = overviewRes.data;
      }

      if (statsRes.success) {
        recentActivity.value = statsRes.data?.trends || [];
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch creator dashboard';
      console.error('Error fetching creator dashboard:', err);
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
    recentActivity.value = [];
    quickStats.value = null;
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    widgets,
    recentActivity,
    quickStats,
    loading,
    error,

    // Getters
    totalWorks,
    totalViews,
    totalLikes,
    avgRating,
    visibleWidgets,

    // Actions
    fetchDashboardData,
    updateWidgetVisibility,
    resetState,
  };
});
