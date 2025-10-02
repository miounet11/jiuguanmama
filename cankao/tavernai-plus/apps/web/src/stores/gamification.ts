import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { gamificationApi } from '@/services/dashboardApi';

/**
 * Gamification Store (T040)
 * Manages affinity levels, proficiency tracking, achievements, and daily quests
 */
export const useGamificationStore = defineStore('gamification', () => {
  // State
  const overview = ref<any>(null);
  const affinityList = ref<any[]>([]);
  const proficiencyList = ref<any[]>([]);
  const dailyQuests = ref<any[]>([]);
  const achievements = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const totalExp = computed(() => overview.value?.totalExp || 0);
  const currentLevel = computed(() => overview.value?.level || 1);
  const expToNextLevel = computed(() => overview.value?.expToNextLevel || 0);
  const expProgress = computed(() => {
    const current = overview.value?.currentLevelExp || 0;
    const needed = expToNextLevel.value;
    return needed > 0 ? Math.round((current / needed) * 100) : 0;
  });

  const topAffinities = computed(() => {
    return [...affinityList.value]
      .sort((a, b) => b.level - a.level)
      .slice(0, 5);
  });

  const topProficiencies = computed(() => {
    return [...proficiencyList.value]
      .sort((a, b) => b.level - a.level)
      .slice(0, 5);
  });

  const activeQuests = computed(() => {
    return dailyQuests.value.filter((q) => !q.completed);
  });

  const completedQuests = computed(() => {
    return dailyQuests.value.filter((q) => q.completed);
  });

  const unlockedAchievements = computed(() => {
    return achievements.value.filter((a) => a.unlocked);
  });

  const lockedAchievements = computed(() => {
    return achievements.value.filter((a) => !a.unlocked);
  });

  const achievementProgress = computed(() => {
    const unlocked = unlockedAchievements.value.length;
    const total = achievements.value.length;
    return total > 0 ? Math.round((unlocked / total) * 100) : 0;
  });

  // Actions
  async function fetchOverview() {
    loading.value = true;
    error.value = null;
    try {
      const response = await gamificationApi.getOverview();
      if (response.success) {
        overview.value = response.data;
      } else {
        error.value = 'Failed to fetch gamification overview';
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch gamification overview';
      console.error('Error fetching gamification overview:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchAffinityList(params?: { limit?: number; sortBy?: string }) {
    loading.value = true;
    error.value = null;
    try {
      const response = await gamificationApi.getAffinityList(params);
      if (response.success) {
        affinityList.value = response.data;
      } else {
        error.value = 'Failed to fetch affinity list';
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch affinity list';
      console.error('Error fetching affinity list:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchProficiencyList(params?: { limit?: number; sortBy?: string }) {
    loading.value = true;
    error.value = null;
    try {
      const response = await gamificationApi.getProficiencyList(params);
      if (response.success) {
        proficiencyList.value = response.data;
      } else {
        error.value = 'Failed to fetch proficiency list';
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch proficiency list';
      console.error('Error fetching proficiency list:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchDailyQuests() {
    loading.value = true;
    error.value = null;
    try {
      const response = await gamificationApi.getDailyQuests();
      if (response.success) {
        dailyQuests.value = response.data;
      } else {
        error.value = 'Failed to fetch daily quests';
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch daily quests';
      console.error('Error fetching daily quests:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchAchievements(params?: { category?: string; unlocked?: boolean }) {
    loading.value = true;
    error.value = null;
    try {
      const response = await gamificationApi.getAchievements(params);
      if (response.success) {
        achievements.value = response.data;
      } else {
        error.value = 'Failed to fetch achievements';
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch achievements';
      console.error('Error fetching achievements:', err);
    } finally {
      loading.value = false;
    }
  }

  function resetState() {
    overview.value = null;
    affinityList.value = [];
    proficiencyList.value = [];
    dailyQuests.value = [];
    achievements.value = [];
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    overview,
    affinityList,
    proficiencyList,
    dailyQuests,
    achievements,
    loading,
    error,

    // Getters
    totalExp,
    currentLevel,
    expToNextLevel,
    expProgress,
    topAffinities,
    topProficiencies,
    activeQuests,
    completedQuests,
    unlockedAchievements,
    lockedAchievements,
    achievementProgress,

    // Actions
    fetchOverview,
    fetchAffinityList,
    fetchProficiencyList,
    fetchDailyQuests,
    fetchAchievements,
    resetState,
  };
});
