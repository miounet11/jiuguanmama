import { ref, computed, watch, debounce } from 'vue'
import type { Ref, ComputedRef } from 'vue'

export interface Character {
  id: string
  name: string
  description?: string
  creator?: {
    id: string
    username: string
  }
  tags?: string[]
  category?: string
  rating: number
  chatCount: number
  favoriteCount: number
  isNew?: boolean
  isPremium?: boolean
  isNSFW?: boolean
  isFavorited?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface FilterOptions {
  category?: string
  tags?: string[]
  rating?: {
    min?: number
    max?: number
  }
  chatCount?: {
    min?: number
    max?: number
  }
  isNew?: boolean
  isPremium?: boolean
  isNSFW?: boolean
  isFavorited?: boolean
  createdAfter?: Date
  createdBefore?: Date
}

export type SortOption =
  | 'popular' // 按聊天数排序
  | 'newest' // 按创建时间排序
  | 'rating' // 按评分排序
  | 'favorites' // 按收藏数排序
  | 'name' // 按名称排序
  | 'updated' // 按更新时间排序

export interface UseCharacterFilterOptions {
  characters: ComputedRef<Character[]>
  initialSearch?: string
  initialFilters?: FilterOptions
  initialSort?: SortOption
  searchDebounceMs?: number
  minSearchLength?: number
}

/**
 * 角色筛选和搜索组合式函数
 * 提供高性能的客户端搜索、筛选和排序功能
 */
export function useCharacterFilter(options: UseCharacterFilterOptions) {
  const {
    characters,
    initialSearch = '',
    initialFilters = {},
    initialSort = 'popular',
    searchDebounceMs = 300,
    minSearchLength = 1
  } = options

  // 状态管理
  const searchQuery = ref(initialSearch)
  const filters = ref<FilterOptions>({ ...initialFilters })
  const sortBy = ref<SortOption>(initialSort)
  const isSearching = ref(false)

  // 搜索统计
  const searchStats = ref({
    totalResults: 0,
    filteredResults: 0,
    searchTime: 0
  })

  // 可用的筛选选项
  const availableCategories = computed(() => {
    const categories = new Set<string>()
    characters.value.forEach(char => {
      if (char.category) {
        categories.add(char.category)
      }
    })
    return Array.from(categories).sort()
  })

  const availableTags = computed(() => {
    const tags = new Set<string>()
    characters.value.forEach(char => {
      char.tags?.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  })

  const availableCreators = computed(() => {
    const creators = new Set<string>()
    characters.value.forEach(char => {
      if (char.creator?.username) {
        creators.add(char.creator.username)
      }
    })
    return Array.from(creators).sort()
  })

  // 搜索函数
  const searchCharacters = (chars: Character[], query: string): Character[] => {
    if (!query || query.length < minSearchLength) {
      return chars
    }

    const lowerQuery = query.toLowerCase()
    const searchTerms = lowerQuery.split(/\s+/).filter(term => term.length > 0)

    return chars.filter(char => {
      const searchableText = [
        char.name,
        char.description || '',
        char.creator?.username || '',
        ...(char.tags || [])
      ].join(' ').toLowerCase()

      // 必须包含所有搜索词
      return searchTerms.every(term => searchableText.includes(term))
    })
  }

  // 筛选函数
  const filterCharacters = (chars: Character[], filterOptions: FilterOptions): Character[] => {
    return chars.filter(char => {
      // 分类筛选
      if (filterOptions.category && char.category !== filterOptions.category) {
        return false
      }

      // 标签筛选
      if (filterOptions.tags && filterOptions.tags.length > 0) {
        const charTags = char.tags || []
        const hasRequiredTags = filterOptions.tags.every(tag =>
          charTags.some(charTag => charTag.toLowerCase().includes(tag.toLowerCase()))
        )
        if (!hasRequiredTags) {
          return false
        }
      }

      // 评分筛选
      if (filterOptions.rating) {
        if (filterOptions.rating.min !== undefined && char.rating < filterOptions.rating.min) {
          return false
        }
        if (filterOptions.rating.max !== undefined && char.rating > filterOptions.rating.max) {
          return false
        }
      }

      // 对话数筛选
      if (filterOptions.chatCount) {
        if (filterOptions.chatCount.min !== undefined && char.chatCount < filterOptions.chatCount.min) {
          return false
        }
        if (filterOptions.chatCount.max !== undefined && char.chatCount > filterOptions.chatCount.max) {
          return false
        }
      }

      // 布尔值筛选
      if (filterOptions.isNew !== undefined && char.isNew !== filterOptions.isNew) {
        return false
      }
      if (filterOptions.isPremium !== undefined && char.isPremium !== filterOptions.isPremium) {
        return false
      }
      if (filterOptions.isNSFW !== undefined && char.isNSFW !== filterOptions.isNSFW) {
        return false
      }
      if (filterOptions.isFavorited !== undefined && char.isFavorited !== filterOptions.isFavorited) {
        return false
      }

      // 日期筛选
      if (filterOptions.createdAfter && char.createdAt) {
        const createdDate = new Date(char.createdAt)
        if (createdDate < filterOptions.createdAfter) {
          return false
        }
      }
      if (filterOptions.createdBefore && char.createdAt) {
        const createdDate = new Date(char.createdAt)
        if (createdDate > filterOptions.createdBefore) {
          return false
        }
      }

      return true
    })
  }

  // 排序函数
  const sortCharacters = (chars: Character[], sort: SortOption): Character[] => {
    const sortedChars = [...chars]

    switch (sort) {
      case 'popular':
        return sortedChars.sort((a, b) => b.chatCount - a.chatCount)

      case 'newest':
        return sortedChars.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA
        })

      case 'rating':
        return sortedChars.sort((a, b) => b.rating - a.rating)

      case 'favorites':
        return sortedChars.sort((a, b) => b.favoriteCount - a.favoriteCount)

      case 'name':
        return sortedChars.sort((a, b) => a.name.localeCompare(b.name))

      case 'updated':
        return sortedChars.sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
          return dateB - dateA
        })

      default:
        return sortedChars
    }
  }

  // 防抖搜索
  const debouncedSearch = debounce((query: string) => {
    const startTime = performance.now()
    isSearching.value = false

    // 更新搜索统计
    const endTime = performance.now()
    searchStats.value.searchTime = endTime - startTime
  }, searchDebounceMs)

  // 主要的筛选计算属性
  const filteredCharacters = computed(() => {
    const startTime = performance.now()

    let result = characters.value

    // 1. 搜索
    if (searchQuery.value.trim()) {
      result = searchCharacters(result, searchQuery.value.trim())
    }

    // 2. 筛选
    result = filterCharacters(result, filters.value)

    // 3. 排序
    result = sortCharacters(result, sortBy.value)

    // 更新统计信息
    const endTime = performance.now()
    searchStats.value = {
      totalResults: characters.value.length,
      filteredResults: result.length,
      searchTime: endTime - startTime
    }

    return result
  })

  // 筛选状态
  const hasActiveFilters = computed(() => {
    return (
      searchQuery.value.trim() !== '' ||
      filters.value.category ||
      (filters.value.tags && filters.value.tags.length > 0) ||
      filters.value.rating ||
      filters.value.chatCount ||
      filters.value.isNew !== undefined ||
      filters.value.isPremium !== undefined ||
      filters.value.isNSFW !== undefined ||
      filters.value.isFavorited !== undefined ||
      filters.value.createdAfter ||
      filters.value.createdBefore
    )
  })

  const isEmpty = computed(() => {
    return filteredCharacters.value.length === 0
  })

  const isFiltered = computed(() => {
    return filteredCharacters.value.length !== characters.value.length
  })

  // 方法
  const updateSearch = (query: string) => {
    if (query !== searchQuery.value) {
      isSearching.value = query.length >= minSearchLength
      searchQuery.value = query
      debouncedSearch(query)
    }
  }

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    filters.value = {
      ...filters.value,
      [key]: value
    }
  }

  const updateSort = (sort: SortOption) => {
    sortBy.value = sort
  }

  const clearSearch = () => {
    searchQuery.value = ''
    isSearching.value = false
  }

  const clearFilters = () => {
    filters.value = {}
  }

  const clearAll = () => {
    clearSearch()
    clearFilters()
    sortBy.value = 'popular'
  }

  const setFilter = (newFilters: FilterOptions) => {
    filters.value = { ...newFilters }
  }

  const toggleBooleanFilter = (key: 'isNew' | 'isPremium' | 'isNSFW' | 'isFavorited') => {
    const currentValue = filters.value[key]
    filters.value = {
      ...filters.value,
      [key]: currentValue === undefined ? true : !currentValue
    }
  }

  const addTag = (tag: string) => {
    const currentTags = filters.value.tags || []
    if (!currentTags.includes(tag)) {
      filters.value = {
        ...filters.value,
        tags: [...currentTags, tag]
      }
    }
  }

  const removeTag = (tag: string) => {
    const currentTags = filters.value.tags || []
    filters.value = {
      ...filters.value,
      tags: currentTags.filter(t => t !== tag)
    }
  }

  // 监听搜索查询变化
  watch(searchQuery, (newQuery) => {
    if (newQuery.length >= minSearchLength) {
      isSearching.value = true
      debouncedSearch(newQuery)
    } else {
      isSearching.value = false
    }
  })

  return {
    // 状态
    searchQuery,
    filters: computed(() => filters.value),
    sortBy,
    isSearching: computed(() => isSearching.value),
    searchStats: computed(() => searchStats.value),

    // 结果
    filteredCharacters,
    hasActiveFilters,
    isEmpty,
    isFiltered,

    // 可用选项
    availableCategories,
    availableTags,
    availableCreators,

    // 方法
    updateSearch,
    updateFilter,
    updateSort,
    clearSearch,
    clearFilters,
    clearAll,
    setFilter,
    toggleBooleanFilter,
    addTag,
    removeTag
  }
}