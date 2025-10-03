import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { RoleViewConfig, UserRole, NavigationItem, UserPreferences } from '@/types';
import { userViewApi } from '@/services/userViewApi';

/**
 * User View Store (T035)
 * Manages role-based UI configuration and user preferences
 */
export const useUserViewStore = defineStore('userView', () => {
  // State
  const currentRole = ref<UserRole>('player');
  const viewConfig = ref<RoleViewConfig | null>(null);
  const preferences = ref<UserPreferences | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const navigation = computed(() => viewConfig.value?.navigation || []);

  const visibleNavigation = computed(() => {
    return navigation.value.filter((item) => item.visible);
  });

  const dashboard = computed(() => viewConfig.value?.dashboard || []);

  const theme = computed(() => viewConfig.value?.theme || null);

  const primaryColor = computed(() => theme.value?.primary || '#3b82f6');

  // Actions
  async function fetchViewConfig(role?: UserRole) {
    loading.value = true;
    error.value = null;
    try {
      const response = await userViewApi.getViewConfig(role);
      if (response.success) {
        viewConfig.value = response.data;
        currentRole.value = response.data.role;
      } else {
        error.value = 'Failed to fetch view configuration';
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch view configuration';
      console.error('Error fetching view config:', err);
    } finally {
      loading.value = false;
    }
  }

  async function switchRole(newRole: UserRole) {
    loading.value = true;
    error.value = null;
    try {
      const response = await userViewApi.switchRole(newRole);
      if (response.success) {
        currentRole.value = newRole;
        // Fetch new view config for the role
        await fetchViewConfig(newRole);
        return true;
      } else {
        error.value = response.message || 'Failed to switch role';
        return false;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to switch role';
      console.error('Error switching role:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updatePreferences(prefs: Partial<UserPreferences>) {
    loading.value = true;
    error.value = null;
    try {
      const response = await userViewApi.updatePreferences(prefs);
      if (response.success) {
        preferences.value = response.data;
        return true;
      } else {
        error.value = response.message || 'Failed to update preferences';
        return false;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to update preferences';
      console.error('Error updating preferences:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  function resetState() {
    currentRole.value = 'player';
    viewConfig.value = null;
    preferences.value = null;
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    currentRole,
    viewConfig,
    preferences,
    loading,
    error,

    // Getters
    navigation,
    visibleNavigation,
    dashboard,
    theme,
    primaryColor,

    // Actions
    fetchViewConfig,
    switchRole,
    updatePreferences,
    resetState,
  };
});
