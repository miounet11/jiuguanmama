import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import marketplaceService from '@/services/marketplace'
import type {
  MarketplaceCharacter,
  MarketplaceFilter,
  MarketplaceResponse,
  CategoryStats,
  TrendingTag,
  TopCreator,
  CharacterDetail,
  MarketplaceStats
} from '@/types/marketplace'

export const useMarketplaceStore = defineStore('marketplace', () => {
  // 基础状态
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 角色数据
  const characters = ref<MarketplaceCharacter[]>([])
  const featuredCharacters = ref<MarketplaceCharacter[]>([])
  const totalCharacters = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(24)
  const hasNext = ref(false)
  const hasPrev = ref(false)

  // 筛选和排序
  const currentFilters = reactive<MarketplaceFilter>({
    search: '',
    category: '',
    minRating: undefined,
    tags: [],
    language: '',
    sortBy: 'popular',
    onlyFeatured: false,
    onlyNew: false,
    excludeNSFW: false,
    page: 1,
    limit: 24
  })

  // 元数据
  const categories = ref<CategoryStats[]>([])
  const trendingTags = ref<TrendingTag[]>([])
  const topCreators = ref<TopCreator[]>([])
  const marketplaceStats = ref<MarketplaceStats | null>(null)

  // 缓存
  const characterDetailsCache = new Map<string, CharacterDetail>()
  const lastFetchTime = ref<number>(0)
  const cacheTimeout = 5 * 60 * 1000 // 5分钟缓存

  // 用户交互状态
  const viewMode = ref<'grid' | 'list'>('grid')
  const favorites = ref<Set<string>>(new Set())
  const recentlyViewed = ref<MarketplaceCharacter[]>([])

  // 计算属性
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const isEmpty = computed(() => characters.value.length === 0 && !loading.value)
  const hasActiveFilters = computed(() => {
    return !!(
      currentFilters.search ||
      currentFilters.category ||
      currentFilters.minRating ||
      (currentFilters.tags && currentFilters.tags.length > 0) ||
      currentFilters.language ||
      currentFilters.onlyFeatured ||
      currentFilters.onlyNew ||
      currentFilters.excludeNSFW
    )
  })

  const filteredCharacterCount = computed(() => totalCharacters.value)
  const totalPages = computed(() => Math.ceil(totalCharacters.value / pageSize.value))

  // 推荐角色（基于用户收藏和浏览历史）
  const recommendedCharacters = computed(() => {
    // 简单推荐逻辑：基于收藏的角色的标签
    const favoriteCharacters = characters.value.filter(c => favorites.value.has(c.id))
    if (favoriteCharacters.length === 0) {
      return featuredCharacters.value.slice(0, 6)
    }

    const favoriteTags = new Set<string>()
    favoriteCharacters.forEach(c => {
      c.tags.forEach(tag => favoriteTags.add(tag))
    })

    return characters.value
      .filter(c => !favorites.value.has(c.id))
      .filter(c => c.tags.some(tag => favoriteTags.has(tag)))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6)
  })

  // 操作方法
  const setError = (message: string | null) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  // 加载角色列表
  const loadCharacters = async (filters?: Partial<MarketplaceFilter>, append = false) => {
    try {
      if (!append) {
        loading.value = true
        clearError()
      }

      const mergedFilters = { ...currentFilters, ...filters }
      const response = await marketplaceService.getCharacters(mergedFilters)

      if (append) {
        characters.value.push(...response.characters)
      } else {
        characters.value = response.characters
      }

      totalCharacters.value = response.total
      currentPage.value = response.page
      hasNext.value = response.hasNext
      hasPrev.value = response.hasPrev
      lastFetchTime.value = Date.now()

      return response
    } catch (err) {
      console.error('加载角色失败:', err)
      setError('加载角色失败，请稍后重试')
      throw err
    } finally {
      loading.value = false
    }
  }

  // 搜索角色
  const searchCharacters = async (query: string, options?: Partial<MarketplaceFilter>) => {
    const filters = {
      ...currentFilters,
      search: query,
      page: 1,
      ...options
    }
    return await loadCharacters(filters)
  }

  // 按分类加载
  const loadCharactersByCategory = async (category: string) => {
    const filters = {
      ...currentFilters,
      category,
      page: 1
    }
    return await loadCharacters(filters)
  }

  // 按标签加载
  const loadCharactersByTags = async (tags: string[]) => {
    const filters = {
      ...currentFilters,
      tags,
      page: 1
    }
    return await loadCharacters(filters)
  }

  // 更新筛选器
  const updateFilters = async (newFilters: Partial<MarketplaceFilter>) => {
    Object.assign(currentFilters, newFilters, { page: 1 })
    return await loadCharacters()
  }

  // 重置筛选器
  const resetFilters = async () => {
    Object.assign(currentFilters, {
      search: '',
      category: '',
      minRating: undefined,
      tags: [],
      language: '',
      sortBy: 'popular',
      onlyFeatured: false,
      onlyNew: false,
      excludeNSFW: false,
      page: 1
    })
    return await loadCharacters()
  }

  // 分页操作
  const loadPage = async (page: number) => {
    const filters = { ...currentFilters, page }
    return await loadCharacters(filters)
  }

  const loadNextPage = async () => {
    if (hasNext.value) {
      return await loadPage(currentPage.value + 1)
    }
  }

  const loadPrevPage = async () => {
    if (hasPrev.value) {
      return await loadPage(currentPage.value - 1)
    }
  }

  // 加载更多（无限滚动）
  const loadMore = async () => {
    if (hasNext.value && !loading.value) {
      const filters = { ...currentFilters, page: currentPage.value + 1 }
      return await loadCharacters(filters, true)
    }
  }

  // 加载特色角色
  const loadFeaturedCharacters = async (limit = 10) => {
    try {
      featuredCharacters.value = await marketplaceService.getFeaturedCharacters(limit)
      return featuredCharacters.value
    } catch (err) {
      console.error('加载特色角色失败:', err)
      throw err
    }
  }

  // 加载元数据
  const loadCategories = async () => {
    try {
      categories.value = await marketplaceService.getCategoryStats()
      return categories.value
    } catch (err) {
      console.error('加载分类失败:', err)
      throw err
    }
  }

  const loadTrendingTags = async (limit = 20) => {
    try {
      trendingTags.value = await marketplaceService.getTrendingTags(limit)
      return trendingTags.value
    } catch (err) {
      console.error('加载热门标签失败:', err)
      throw err
    }
  }

  const loadTopCreators = async (limit = 5) => {
    try {
      topCreators.value = await marketplaceService.getTopCreators(limit)
      return topCreators.value
    } catch (err) {
      console.error('加载热门创作者失败:', err)
      throw err
    }
  }

  // 加载角色详情（带缓存）
  const loadCharacterDetails = async (characterId: string, forceRefresh = false) => {
    if (!forceRefresh && characterDetailsCache.has(characterId)) {
      return characterDetailsCache.get(characterId)!
    }

    try {
      const details = await marketplaceService.getCharacterDetails(characterId)
      characterDetailsCache.set(characterId, details)
      return details
    } catch (err) {
      console.error('加载角色详情失败:', err)
      throw err
    }
  }

  // 收藏操作
  const toggleFavorite = async (characterId: string) => {
    try {
      const isFavorited = favorites.value.has(characterId)

      if (isFavorited) {
        await marketplaceService.unfavoriteCharacter(characterId)
        favorites.value.delete(characterId)
      } else {
        await marketplaceService.favoriteCharacter(characterId)
        favorites.value.add(characterId)
      }

      // 更新本地角色数据
      const character = characters.value.find(c => c.id === characterId)
      if (character) {
        character.isFavorited = !isFavorited
        character.favorites += isFavorited ? -1 : 1
      }

      return !isFavorited
    } catch (err) {
      console.error('收藏操作失败:', err)
      throw err
    }
  }

  // 导入角色
  const importCharacter = async (characterId: string) => {
    try {
      const result = await marketplaceService.importCharacter(characterId)

      // 更新下载数
      const character = characters.value.find(c => c.id === characterId)
      if (character) {
        character.downloads += 1
      }

      return result
    } catch (err) {
      console.error('导入角色失败:', err)
      throw err
    }
  }

  // 评分角色
  const rateCharacter = async (characterId: string, rating: number, comment?: string) => {
    try {
      await marketplaceService.rateCharacter(characterId, rating, comment)

      // 清除缓存的详情，强制重新加载
      characterDetailsCache.delete(characterId)

      return true
    } catch (err) {
      console.error('评分失败:', err)
      throw err
    }
  }

  // 举报角色
  const reportCharacter = async (characterId: string, reason: string, details?: string) => {
    try {
      await marketplaceService.reportCharacter(characterId, reason, details)
      return true
    } catch (err) {
      console.error('举报失败:', err)
      throw err
    }
  }

  // 添加到最近浏览
  const addToRecentlyViewed = (character: MarketplaceCharacter) => {
    const existing = recentlyViewed.value.findIndex(c => c.id === character.id)
    if (existing > -1) {
      recentlyViewed.value.splice(existing, 1)
    }
    recentlyViewed.value.unshift(character)

    // 保持最多10个
    if (recentlyViewed.value.length > 10) {
      recentlyViewed.value = recentlyViewed.value.slice(0, 10)
    }
  }

  // 设置视图模式
  const setViewMode = (mode: 'grid' | 'list') => {
    viewMode.value = mode
    // 保存到本地存储
    localStorage.setItem('marketplace-view-mode', mode)
  }

  // 获取热门角色（缓存版本）
  const getPopularCharacters = computed(() => {
    return characters.value
      .filter(c => c.rating >= 4.0)
      .sort((a, b) => b.favorites - a.favorites)
      .slice(0, 12)
  })

  // 获取新角色
  const getNewCharacters = computed(() => {
    return characters.value
      .filter(c => c.isNew)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12)
  })

  // 清理缓存
  const clearCache = () => {
    characterDetailsCache.clear()
    lastFetchTime.value = 0
  }

  // 检查缓存是否过期
  const isCacheExpired = () => {
    return Date.now() - lastFetchTime.value > cacheTimeout
  }

  // 初始化（从本地存储恢复状态）
  const initialize = () => {
    // 恢复视图模式
    const savedViewMode = localStorage.getItem('marketplace-view-mode') as 'grid' | 'list'
    if (savedViewMode) {
      viewMode.value = savedViewMode
    }

    // 恢复收藏列表
    const savedFavorites = localStorage.getItem('marketplace-favorites')
    if (savedFavorites) {
      try {
        const favoriteIds = JSON.parse(savedFavorites) as string[]
        favorites.value = new Set(favoriteIds)
      } catch (error) {
        console.error('恢复收藏列表失败:', error)
      }
    }

    // 恢复最近浏览
    const savedRecentlyViewed = localStorage.getItem('marketplace-recently-viewed')
    if (savedRecentlyViewed) {
      try {
        recentlyViewed.value = JSON.parse(savedRecentlyViewed)
      } catch (error) {
        console.error('恢复浏览历史失败:', error)
      }
    }
  }

  // 保存状态到本地存储
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('marketplace-favorites', JSON.stringify(Array.from(favorites.value)))
      localStorage.setItem('marketplace-recently-viewed', JSON.stringify(recentlyViewed.value))
    } catch (error) {
      console.error('保存到本地存储失败:', error)
    }
  }

  // 监听收藏变化，自动保存
  const unwatchFavorites = ref(() => {})
  const startWatchingFavorites = () => {
    // 这里应该使用 watchEffect，但为了简化我们手动处理
    // 在实际使用中可以在组件中设置 watch
  }

  return {
    // 状态
    loading: readonly(loading),
    error: readonly(error),
    characters: readonly(characters),
    featuredCharacters: readonly(featuredCharacters),
    totalCharacters: readonly(totalCharacters),
    currentPage: readonly(currentPage),
    pageSize: readonly(pageSize),
    hasNext: readonly(hasNext),
    hasPrev: readonly(hasPrev),
    currentFilters,
    categories: readonly(categories),
    trendingTags: readonly(trendingTags),
    topCreators: readonly(topCreators),
    marketplaceStats: readonly(marketplaceStats),
    viewMode: readonly(viewMode),
    favorites: readonly(favorites),
    recentlyViewed: readonly(recentlyViewed),

    // 计算属性
    isLoading,
    hasError,
    isEmpty,
    hasActiveFilters,
    filteredCharacterCount,
    totalPages,
    recommendedCharacters,
    getPopularCharacters,
    getNewCharacters,

    // 方法
    setError,
    clearError,
    loadCharacters,
    searchCharacters,
    loadCharactersByCategory,
    loadCharactersByTags,
    updateFilters,
    resetFilters,
    loadPage,
    loadNextPage,
    loadPrevPage,
    loadMore,
    loadFeaturedCharacters,
    loadCategories,
    loadTrendingTags,
    loadTopCreators,
    loadCharacterDetails,
    toggleFavorite,
    importCharacter,
    rateCharacter,
    reportCharacter,
    addToRecentlyViewed,
    setViewMode,
    clearCache,
    isCacheExpired,
    initialize,
    saveToLocalStorage
  }
})

// 辅助函数
function readonly<T>(ref: import('vue').Ref<T>) {
  return computed(() => ref.value)
}
