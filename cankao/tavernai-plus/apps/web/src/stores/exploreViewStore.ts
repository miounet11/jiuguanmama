import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * Explore View Store (T045)
 * Manages character/scenario exploration and discovery view
 */
export const useExploreViewStore = defineStore('exploreView', () => {
  // State
  const characters = ref<any[]>([]);
  const scenarios = ref<any[]>([]);
  const filters = ref<any>({
    category: 'all',
    sortBy: 'popular',
    tags: [],
  });
  const searchQuery = ref('');
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const filteredCharacters = computed(() => {
    let result = characters.value;

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(query) || c.description?.toLowerCase().includes(query),
      );
    }

    if (filters.value.category !== 'all') {
      result = result.filter((c) => c.category === filters.value.category);
    }

    if (filters.value.tags.length > 0) {
      result = result.filter((c) =>
        filters.value.tags.some((tag: string) => c.tags?.includes(tag)),
      );
    }

    return result;
  });

  const popularCharacters = computed(() => {
    return [...characters.value].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);
  });

  const recentCharacters = computed(() => {
    return [...characters.value].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    }).slice(0, 10);
  });

  // Actions
  async function fetchCharacters() {
    loading.value = true;
    error.value = null;
    try {
      // TODO: Implement actual API call
      // const response = await characterApi.getAll(filters.value);
      // characters.value = response.data;
      console.log('Fetching characters with filters:', filters.value);
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch characters';
      console.error('Error fetching characters:', err);
    } finally {
      loading.value = false;
    }
  }

  function updateFilters(newFilters: Partial<typeof filters.value>) {
    filters.value = { ...filters.value, ...newFilters };
    fetchCharacters();
  }

  function updateSearchQuery(query: string) {
    searchQuery.value = query;
  }

  function resetState() {
    characters.value = [];
    scenarios.value = [];
    filters.value = {
      category: 'all',
      sortBy: 'popular',
      tags: [],
    };
    searchQuery.value = '';
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    characters,
    scenarios,
    filters,
    searchQuery,
    loading,
    error,

    // Getters
    filteredCharacters,
    popularCharacters,
    recentCharacters,

    // Actions
    fetchCharacters,
    updateFilters,
    updateSearchQuery,
    resetState,
  };
});
