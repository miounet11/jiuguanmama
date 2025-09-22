import apiClient from './api'

export interface MarketplaceFilter {
  category?: string
  minRating?: number
  language?: string
  search?: string
  sortBy?: 'popular' | 'newest' | 'rating' | 'favorites'
  page?: number
  limit?: number
}

export interface CharacterPreview {
  id: string
  name: string
  avatar?: string
  description: string
  category: string
  rating: number
  ratingCount: number
  favorites: number
  creator: {
    id: string
    username: string
    avatar?: string
  }
  tags: string[]
  language: string
  isPublic: boolean
  isFeatured: boolean
  createdAt: string
}

export interface MarketplaceResponse {
  characters: CharacterPreview[]
  total: number
  page: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface CategoryStats {
  name: string
  count: number
  icon: string
}

export interface TopCreator {
  id: string
  username: string
  avatar?: string
  characterCount: number
  totalFavorites: number
  averageRating: number
}

class MarketplaceService {
  /**
   * 获取市场角色列表
   */
  async getCharacters(filter: MarketplaceFilter = {}): Promise<MarketplaceResponse> {
    const params = new URLSearchParams()

    if (filter.category) params.append('category', filter.category)
    if (filter.minRating) params.append('minRating', filter.minRating.toString())
    if (filter.language) params.append('language', filter.language)
    if (filter.search) params.append('search', filter.search)
    if (filter.sortBy) params.append('sortBy', filter.sortBy)
    if (filter.page) params.append('page', filter.page.toString())
    if (filter.limit) params.append('limit', filter.limit.toString())

    const response = await apiClient.get(`/api/marketplace/characters?${params}`)
    return response as MarketplaceResponse
  }

  /**
   * 获取特色角色
   */
  async getFeaturedCharacters(limit = 10): Promise<CharacterPreview[]> {
    const response = await apiClient.get('/api/marketplace/featured', {
      params: { limit }
    })
    return response as CharacterPreview[]
  }

  /**
   * 获取推荐角色
   */
  async getRecommendedCharacters(limit = 12): Promise<CharacterPreview[]> {
    const response = await apiClient.get('/api/marketplace/recommended', {
      params: { limit }
    })
    return response as CharacterPreview[]
  }

  /**
   * 获取分类统计
   */
  async getCategoryStats(): Promise<CategoryStats[]> {
    const response = await apiClient.get('/api/marketplace/categories/stats')
    return response as CategoryStats[]
  }

  /**
   * 获取热门创作者
   */
  async getTopCreators(limit = 5): Promise<TopCreator[]> {
    const response = await apiClient.get('/api/marketplace/creators/top', {
      params: { limit }
    })
    return response as TopCreator[]
  }

  /**
   * 搜索角色
   */
  async searchCharacters(query: string, options?: {
    category?: string
    language?: string
    limit?: number
  }): Promise<CharacterPreview[]> {
    const response = await apiClient.get('/api/marketplace/search', {
      params: { query, ...options }
    })
    return response as CharacterPreview[]
  }

  /**
   * 获取单个角色详情
   */
  async getCharacterDetails(id: string): Promise<CharacterPreview & {
    fullDescription: string
    backstory: string
    personality: string
    scenario: string
    exampleDialogs: string[]
    stats: {
      totalChats: number
      avgSessionLength: number
      lastUsed: string
    }
  }> {
    const response = await apiClient.get(`/api/marketplace/characters/${id}`)
    return response
  }

  /**
   * 收藏角色
   */
  async favoriteCharacter(id: string): Promise<void> {
    try {
      await apiClient.post(`/api/marketplace/characters/${id}/favorite`)
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('请先登录后再收藏角色')
      } else if (error.response?.status === 400) {
        throw new Error('该角色已经在收藏列表中')
      } else {
        throw new Error('收藏失败，请稍后重试')
      }
    }
  }

  /**
   * 取消收藏
   */
  async unfavoriteCharacter(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/marketplace/characters/${id}/favorite`)
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('请先登录后再取消收藏')
      } else if (error.response?.status === 404) {
        throw new Error('该角色未在收藏列表中')
      } else {
        throw new Error('取消收藏失败，请稍后重试')
      }
    }
  }

  /**
   * 评价角色
   */
  async rateCharacter(id: string, rating: number, comment?: string): Promise<void> {
    await apiClient.post(`/api/marketplace/characters/${id}/rate`, { rating, comment })
  }

  /**
   * 导入角色到我的角色库
   */
  async importCharacter(id: string): Promise<{ characterId: string }> {
    const response = await apiClient.post(`/api/marketplace/characters/${id}/import`)
    return response
  }

  /**
   * 获取角色评价列表
   */
  async getCharacterRatings(id: string, page = 1, limit = 20): Promise<{
    ratings: Array<{
      id: string
      user: { id: string; username: string; avatar?: string }
      rating: number
      comment?: string
      createdAt: string
    }>
    total: number
    averageRating: number
  }> {
    const response = await apiClient.get(`/api/marketplace/characters/${id}/ratings`, {
      params: { page, limit }
    })
    return response
  }

  /**
   * 举报不适当内容
   */
  async reportCharacter(id: string, reason: string, details?: string): Promise<void> {
    await apiClient.post(`/api/marketplace/characters/${id}/report`, { reason, details })
  }

  /**
   * 获取趋势标签 (暂不支持，返回空数组)
   */
  async getTrendingTags(limit = 20): Promise<Array<{
    tag: string
    count: number
    trend: 'up' | 'down' | 'stable'
  }>> {
    // 后端暂未实现此功能，返回空数组
    return []
  }

  /**
   * 获取用户的公开角色 (暂不支持，返回空结果)
   */
  async getUserPublicCharacters(userId: string, page = 1, limit = 12): Promise<MarketplaceResponse> {
    // 后端暂未实现此功能，返回空结果
    return {
      characters: [],
      total: 0,
      page: page,
      pages: 0,
      hasNext: false,
      hasPrev: false
    }
  }
}

export default new MarketplaceService()
