import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export interface Character {
  id: string
  name: string
  avatar?: string
  description?: string
  personality?: string
  scenario?: string
  firstMessage?: string
  tags?: string[]
  creator?: {
    id: string
    username: string
    avatar?: string
  }
  isPublic: boolean
  isNSFW: boolean
  rating: number
  ratingCount: number
  chatCount: number
  favoriteCount: number
  isFavorited?: boolean
  isNew?: boolean
  isPremium?: boolean
  createdAt: string
  updatedAt: string
}

export const useCharacterStore = defineStore('character', () => {
  // 状态
  const characters = ref<Character[]>([])
  const currentCharacter = ref<Character | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 分页状态
  const currentPage = ref(1)
  const itemsPerPage = ref(12)
  const totalItems = ref(0)

  // 筛选状态
  const searchQuery = ref('')
  const selectedCategory = ref('')
  const sortBy = ref<'popular' | 'newest' | 'rating' | 'chats'>('popular')

  // 计算属性
  const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

  const hasMore = computed(() => currentPage.value < totalPages.value)

  // 获取角色列表
  const fetchCharacters = async (options: {
    page?: number
    limit?: number
    search?: string
    category?: string
    sort?: string
  } = {}) => {
    isLoading.value = true
    error.value = null

    try {
      const params = {
        page: options.page || currentPage.value,
        limit: options.limit || itemsPerPage.value,
        search: options.search || searchQuery.value,
        category: options.category || selectedCategory.value,
        sort: options.sort || sortBy.value
      }

      const response = await api.get('/characters', params)

      // 处理响应数据
      if (response.success) {
        characters.value = response.characters
        totalItems.value = response.pagination?.total || response.characters.length

        // 更新分页信息
        if (response.pagination) {
          currentPage.value = response.pagination.page
          itemsPerPage.value = response.pagination.limit
        }
      } else {
        throw new Error(response.message || 'Failed to fetch characters')
      }
    } catch (err: any) {
      error.value = err.message || '获取角色列表失败'
      console.error('Error fetching characters:', err)

      // 返回空数组而不是抛出错误，保持UI稳定
      characters.value = []
      totalItems.value = 0
    } finally {
      isLoading.value = false
    }
  }

  // 获取单个角色详情
  const fetchCharacter = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get(`/characters/${id}`)

      if (response.success) {
        currentCharacter.value = response.character
        return response.character
      } else {
        throw new Error(response.message || 'Failed to fetch character')
      }
    } catch (err: any) {
      error.value = err.message || '获取角色详情失败'
      console.error('Error fetching character:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 创建角色
  const createCharacter = async (characterData: Partial<Character>) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('/characters', characterData)

      if (response.success) {
        // 添加到列表前面
        characters.value.unshift(response.character)
        totalItems.value++

        return response.character
      } else {
        throw new Error(response.message || 'Failed to create character')
      }
    } catch (err: any) {
      error.value = err.message || '创建角色失败'
      console.error('Error creating character:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 更新角色
  const updateCharacter = async (id: string, updates: Partial<Character>) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.put(`/characters/${id}`, updates)

      if (response.success) {
        // 更新列表中的角色
        const index = characters.value.findIndex(c => c.id === id)
        if (index !== -1) {
          characters.value[index] = response.character
        }

        // 更新当前角色
        if (currentCharacter.value?.id === id) {
          currentCharacter.value = response.character
        }

        return response.character
      } else {
        throw new Error(response.message || 'Failed to update character')
      }
    } catch (err: any) {
      error.value = err.message || '更新角色失败'
      console.error('Error updating character:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 删除角色
  const deleteCharacter = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.delete(`/characters/${id}`)

      if (response.success) {
        // 从列表中移除
        characters.value = characters.value.filter(c => c.id !== id)
        totalItems.value--

        // 清除当前角色
        if (currentCharacter.value?.id === id) {
          currentCharacter.value = null
        }

        return true
      } else {
        throw new Error(response.message || 'Failed to delete character')
      }
    } catch (err: any) {
      error.value = err.message || '删除角色失败'
      console.error('Error deleting character:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 切换收藏状态
  const toggleFavorite = async (id: string) => {
    try {
      const character = characters.value.find(c => c.id === id)
      if (!character) return

      const endpoint = character.isFavorited
        ? `/characters/${id}/unfavorite`
        : `/characters/${id}/favorite`

      const response = await api.post(endpoint)

      if (response.success) {
        // 更新本地状态
        character.isFavorited = !character.isFavorited
        character.favoriteCount += character.isFavorited ? 1 : -1

        // 更新当前角色
        if (currentCharacter.value?.id === id) {
          currentCharacter.value.isFavorited = character.isFavorited
          currentCharacter.value.favoriteCount = character.favoriteCount
        }
      }
    } catch (err: any) {
      console.error('Error toggling favorite:', err)
    }
  }

  // 搜索角色
  const searchCharacters = async (query: string) => {
    searchQuery.value = query
    currentPage.value = 1
    await fetchCharacters()
  }

  // 按分类筛选
  const filterByCategory = async (category: string) => {
    selectedCategory.value = category
    currentPage.value = 1
    await fetchCharacters()
  }

  // 排序
  const sortCharacters = async (sort: typeof sortBy.value) => {
    sortBy.value = sort
    currentPage.value = 1
    await fetchCharacters()
  }

  // 翻页
  const goToPage = async (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      await fetchCharacters()
    }
  }

  // 重置筛选
  const resetFilters = () => {
    searchQuery.value = ''
    selectedCategory.value = ''
    sortBy.value = 'popular'
    currentPage.value = 1
  }

  return {
    // 状态
    characters,
    currentCharacter,
    isLoading,
    error,

    // 分页
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    hasMore,

    // 筛选
    searchQuery,
    selectedCategory,
    sortBy,

    // 方法
    fetchCharacters,
    fetchCharacter,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    toggleFavorite,
    searchCharacters,
    filterByCategory,
    sortCharacters,
    goToPage,
    resetFilters
  }
})
