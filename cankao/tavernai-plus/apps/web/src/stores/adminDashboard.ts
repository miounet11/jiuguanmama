import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { adminConsoleApi } from '@/services/dashboardApi';

/**
 * Admin Dashboard Store (T044)
 * Manages admin-specific dashboard view and widgets
 */
export const useAdminDashboardStore = defineStore('adminDashboard', () => {
  // State
  const widgets = ref<any[]>([]);
  const systemHealth = ref<any>(null);
  const quickStats = ref<any>(null);
  const recentAlerts = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const activeUsers = computed(() => quickStats.value?.activeUsers || 0);
  const totalUsers = computed(() => quickStats.value?.totalUsers || 0);
  const systemStatus = computed(() => systemHealth.value?.status || 'unknown');
  const criticalAlerts = computed(() => {
    return recentAlerts.value.filter((a) => a.severity === 'critical' && !a.resolved).length;
  });

  const visibleWidgets = computed(() => {
    return widgets.value.filter((w) => w.visible);
  });

  // Actions
  async function fetchDashboardData() {
    loading.value = true;
    error.value = null;
    try {
      const [dashboardRes, metricsRes, alertsRes] = await Promise.all([
        adminConsoleApi.getDashboard(),
        adminConsoleApi.getRealtimeMetrics(),
        adminConsoleApi.getAlerts({ limit: 10 }),
      ]);

      if (dashboardRes.success) {
        quickStats.value = dashboardRes.data;
      }

      if (metricsRes.success) {
        systemHealth.value = metricsRes.data;
      }

      if (alertsRes.success) {
        recentAlerts.value = alertsRes.data;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch admin dashboard';
      console.error('Error fetching admin dashboard:', err);
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
    systemHealth.value = null;
    quickStats.value = null;
    recentAlerts.value = [];
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    widgets,
    systemHealth,
    quickStats,
    recentAlerts,
    loading,
    error,

    // Getters
    activeUsers,
    totalUsers,
    systemStatus,
    criticalAlerts,
    visibleWidgets,

    // Actions
    fetchDashboardData,
    updateWidgetVisibility,
    resetState,
  };
});
