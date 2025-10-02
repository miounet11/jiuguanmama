import { api } from './api'
import type { Scenario } from '@/types/scenario'

export interface ScenarioListParams {
  page?: number
  limit?: number
  sort?: 'created' | 'updated' | 'rating' | 'usage'
  search?: string
  category?: string
  isPublic?: boolean
  tags?: string[]
}

export interface ScenarioListResponse {
  success: boolean
  data: {
    scenarios: Scenario[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export const scenarioApiService = {
  // 获取剧本列表
  async getScenarios(params?: ScenarioListParams): Promise<ScenarioListResponse> {
    const response = await api.get('/api/scenarios', { params })
    return response
  },

  // 获取单个剧本详情
  async getScenario(id: string): Promise<{ success: boolean; data: Scenario }> {
    const response = await api.get(`/api/scenarios/${id}`)
    return response
  },

  // 获取剧本分类
  async getCategories(): Promise<{ success: boolean; data: string[] }> {
    const response = await api.get('/api/scenarios/categories')
    return response
  },

  // 获取剧本标签
  async getTags(): Promise<{ success: boolean; data: string[] }> {
    const response = await api.get('/api/scenarios/tags')
    return response
  },

  // 创建剧本
  async createScenario(data: any): Promise<{ success: boolean; data: Scenario }> {
    const response = await api.post('/api/scenarios', data)
    return response
  },

  // 更新剧本
  async updateScenario(id: string, data: any): Promise<{ success: boolean; data: Scenario }> {
    const response = await api.put(`/api/scenarios/${id}`, data)
    return response
  },

  // 删除剧本
  async deleteScenario(id: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/api/scenarios/${id}`)
    return response
  },

  // 收藏剧本
  async favoriteScenario(id: string): Promise<{ success: boolean }> {
    const response = await api.post(`/api/scenarios/${id}/favorite`)
    return response
  },

  // 取消收藏剧本
  async unfavoriteScenario(id: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/api/scenarios/${id}/favorite`)
    return response
  },

  // 评分剧本
  async rateScenario(id: string, rating: number, comment?: string): Promise<{ success: boolean }> {
    const response = await api.post(`/api/scenarios/${id}/rate`, { rating, comment })
    return response
  },

  // 获取用户的剧本
  async getMyScenarios(): Promise<{ success: boolean; data: { scenarios: Scenario[] } }> {
    const response = await api.get('/api/scenarios/my')
    return response
  },

  // 获取收藏的剧本
  async getFavoriteScenarios(): Promise<{ success: boolean; data: { scenarios: Scenario[] } }> {
    const response = await api.get('/api/scenarios/favorites')
    return response
  }
}