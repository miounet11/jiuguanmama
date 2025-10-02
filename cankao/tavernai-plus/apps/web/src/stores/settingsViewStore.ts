import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { userViewApi } from '@/services/userViewApi';

/**
 * Settings View Store (T046)
 * Manages user preferences and settings view
 */
export const useSettingsViewStore = defineStore('settingsView', () => {
  // State
  const preferences = ref<any>({
    theme: 'dark',
    language: 'zh-CN',
    fontSize: 'medium',
    notifications: {
      email: true,
      push: true,
      sound: true,
    },
    privacy: {
      profileVisible: true,
      showActivity: true,
    },
  });
  const loading = ref(false);
  const error = ref<string | null>(null);
  const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Getters
  const isDarkMode = computed(() => preferences.value.theme === 'dark');
  const notificationsEnabled = computed(() => {
    const n = preferences.value.notifications;
    return n.email || n.push || n.sound;
  });

  // Actions
  async function fetchPreferences() {
    loading.value = true;
    error.value = null;
    try {
      const response = await userViewApi.getViewConfig();
      if (response.success && response.data.preferences) {
        preferences.value = { ...preferences.value, ...response.data.preferences };
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch preferences';
      console.error('Error fetching preferences:', err);
    } finally {
      loading.value = false;
    }
  }

  async function updatePreferences(updates: Partial<typeof preferences.value>) {
    saveStatus.value = 'saving';
    error.value = null;
    try {
      const newPreferences = { ...preferences.value, ...updates };
      const response = await userViewApi.updatePreferences(newPreferences);

      if (response.success) {
        preferences.value = newPreferences;
        saveStatus.value = 'saved';
        setTimeout(() => {
          saveStatus.value = 'idle';
        }, 2000);
        return true;
      } else {
        saveStatus.value = 'error';
        error.value = 'Failed to save preferences';
        return false;
      }
    } catch (err: any) {
      saveStatus.value = 'error';
      error.value = err.message || 'Failed to save preferences';
      console.error('Error updating preferences:', err);
      return false;
    }
  }

  function toggleTheme() {
    const newTheme = preferences.value.theme === 'dark' ? 'light' : 'dark';
    updatePreferences({ theme: newTheme });
  }

  function resetState() {
    preferences.value = {
      theme: 'dark',
      language: 'zh-CN',
      fontSize: 'medium',
      notifications: {
        email: true,
        push: true,
        sound: true,
      },
      privacy: {
        profileVisible: true,
        showActivity: true,
      },
    };
    loading.value = false;
    error.value = null;
    saveStatus.value = 'idle';
  }

  return {
    // State
    preferences,
    loading,
    error,
    saveStatus,

    // Getters
    isDarkMode,
    notificationsEnabled,

    // Actions
    fetchPreferences,
    updatePreferences,
    toggleTheme,
    resetState,
  };
});
