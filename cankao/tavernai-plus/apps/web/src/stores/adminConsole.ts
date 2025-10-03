import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { adminConsoleApi } from '@/services/dashboardApi';

/**
 * Admin Console Store (T041)
 * Manages admin dashboard metrics, alerts, moderation queue, and system monitoring
 */
export const useAdminConsoleStore = defineStore('adminConsole', () => {
  // State
  const dashboard = ref<any>(null);
  const realtimeMetrics = ref<any>(null);
  const alerts = ref<any[]>([]);
  const moderationQueue = ref<any[]>([]);
  const auditLogs = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const activeUserCount = computed(() => dashboard.value?.activeUsers || 0);
  const totalUsers = computed(() => dashboard.value?.totalUsers || 0);
  const totalCharacters = computed(() => dashboard.value?.totalCharacters || 0);
  const totalConversations = computed(() => dashboard.value?.totalConversations || 0);

  const criticalAlerts = computed(() => {
    return alerts.value.filter((a) => a.severity === 'critical' && !a.resolved);
  });

  const pendingModeration = computed(() => {
    return moderationQueue.value.filter((item) => item.status === 'pending');
  });

  const recentAuditLogs = computed(() => {
    return auditLogs.value.slice(0, 20);
  });

  // Actions
  async function fetchDashboard() {
    loading.value = true;
    error.value = null;
    try {
      const response = await adminConsoleApi.getDashboard();
      if (response.success) {
        dashboard.value = response.data;
      } else {
        error.value = 'Failed to fetch admin dashboard';
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch admin dashboard';
      console.error('Error fetching admin dashboard:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchRealtimeMetrics() {
    try {
      const response = await adminConsoleApi.getRealtimeMetrics();
      if (response.success) {
        realtimeMetrics.value = response.data;
      }
    } catch (err: any) {
      console.error('Error fetching realtime metrics:', err);
    }
  }

  async function fetchAlerts(params?: { severity?: string; resolved?: boolean }) {
    loading.value = true;
    error.value = null;
    try {
      const response = await adminConsoleApi.getAlerts(params);
      if (response.success) {
        alerts.value = response.data;
      } else {
        error.value = 'Failed to fetch alerts';
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch alerts';
      console.error('Error fetching alerts:', err);
    } finally {
      loading.value = false;
    }
  }

  async function resolveAlert(alertId: string, resolution: string) {
    try {
      const response = await adminConsoleApi.resolveAlert(alertId, resolution);
      if (response.success) {
        const alert = alerts.value.find((a) => a.id === alertId);
        if (alert) {
          alert.resolved = true;
          alert.resolution = resolution;
        }
        return true;
      }
      return false;
    } catch (err: any) {
      error.value = err.message || 'Failed to resolve alert';
      console.error('Error resolving alert:', err);
      return false;
    }
  }

  async function fetchModerationQueue(params?: { status?: string; type?: string }) {
    loading.value = true;
    error.value = null;
    try {
      const response = await adminConsoleApi.getModerationQueue(params);
      if (response.success) {
        moderationQueue.value = response.data;
      } else {
        error.value = 'Failed to fetch moderation queue';
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch moderation queue';
      console.error('Error fetching moderation queue:', err);
    } finally {
      loading.value = false;
    }
  }

  async function moderateContent(itemId: string, action: string, reason?: string) {
    try {
      const response = await adminConsoleApi.moderateContent(itemId, action, reason);
      if (response.success) {
        const item = moderationQueue.value.find((i) => i.id === itemId);
        if (item) {
          item.status = action;
          item.moderationReason = reason;
        }
        return true;
      }
      return false;
    } catch (err: any) {
      error.value = err.message || 'Failed to moderate content';
      console.error('Error moderating content:', err);
      return false;
    }
  }

  async function fetchAuditLogs(params?: { userId?: string; action?: string; limit?: number }) {
    loading.value = true;
    error.value = null;
    try {
      const response = await adminConsoleApi.getAuditLogs(params);
      if (response.success) {
        auditLogs.value = response.data;
      } else {
        error.value = 'Failed to fetch audit logs';
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch audit logs';
      console.error('Error fetching audit logs:', err);
    } finally {
      loading.value = false;
    }
  }

  async function banUser(userId: string, reason: string, duration?: number) {
    try {
      const response = await adminConsoleApi.banUser(userId, reason, duration);
      if (response.success) {
        return true;
      }
      return false;
    } catch (err: any) {
      error.value = err.message || 'Failed to ban user';
      console.error('Error banning user:', err);
      return false;
    }
  }

  async function unbanUser(userId: string) {
    try {
      const response = await adminConsoleApi.unbanUser(userId);
      if (response.success) {
        return true;
      }
      return false;
    } catch (err: any) {
      error.value = err.message || 'Failed to unban user';
      console.error('Error unbanning user:', err);
      return false;
    }
  }

  function resetState() {
    dashboard.value = null;
    realtimeMetrics.value = null;
    alerts.value = [];
    moderationQueue.value = [];
    auditLogs.value = [];
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    dashboard,
    realtimeMetrics,
    alerts,
    moderationQueue,
    auditLogs,
    loading,
    error,

    // Getters
    activeUserCount,
    totalUsers,
    totalCharacters,
    totalConversations,
    criticalAlerts,
    pendingModeration,
    recentAuditLogs,

    // Actions
    fetchDashboard,
    fetchRealtimeMetrics,
    fetchAlerts,
    resolveAlert,
    fetchModerationQueue,
    moderateContent,
    fetchAuditLogs,
    banUser,
    unbanUser,
    resetState,
  };
});
