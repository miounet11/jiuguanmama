import { api } from './api'
import type { Character, CharacterCreateData } from '@/types/character'

export interface CharacterListParams {
  page?: number
  limit?: number
  sort?: 'created' | 'rating' | 'popular'
  search?: string
  tags?: string[]
}

export interface CharacterListResponse {
  characters: Character[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const characterService = {
  // 获取角色列表
  async getCharacters(params?: CharacterListParams): Promise<CharacterListResponse> {
    const response = await api.get('/api/characters', { params })
    return response.data
  },

  // 获取单个角色详情
  async getCharacter(id: string): Promise<Character> {
    const response = await api.get(`/api/characters/${id}`)
    return response.data.character
  },

  // 创建角色
  async createCharacter(data: CharacterCreateData): Promise<Character> {
    const response = await api.post('/api/characters', data)
    return response.data.character
  },

  // 更新角色
  async updateCharacter(id: string, data: Partial<CharacterCreateData>): Promise<Character> {
    const response = await api.put(`/api/characters/${id}`, data)
    return response.data.character
  },

  // 删除角色
  async deleteCharacter(id: string): Promise<void> {
    await api.delete(`/api/characters/${id}`)
  },

  // 收藏/取消收藏角色
  async toggleFavorite(id: string): Promise<void> {
    await api.post(`/api/characters/${id}/favorite`)
  },

  // 评分角色
  async rateCharacter(id: string, rating: number): Promise<void> {
    await api.post(`/api/characters/${id}/rate`, { rating })
  },

  // 获取用户的角色
  async getMyCharacters(): Promise<Character[]> {
    const response = await api.get('/api/characters/my')
    return response.data.characters
  },

  // 获取收藏的角色
  async getFavoriteCharacters(): Promise<Character[]> {
    const response = await api.get('/api/characters/favorites')
    return response.data.characters
  },

  // AI 生成角色
  async generateCharacter(params: { name: string; tags?: string[] }): Promise<Partial<CharacterCreateData>> {
    const response = await api.post('/api/characters/generate', params)
    return response.data.character
  },

  // 克隆角色
  async cloneCharacter(id: string): Promise<Character> {
    const response = await api.post(`/api/characters/${id}/clone`)
    return response.data.character
  },

  // 搜索角色
  async searchCharacters(query: string): Promise<Character[]> {
    const response = await api.get('/api/characters/search', {
      params: { q: query }
    })
    return response.data.characters
  },

  // 获取热门标签
  async getPopularTags(): Promise<string[]> {
    const response = await api.get('/api/characters/tags/popular')
    return response.data.tags
  },

  // AI 生成角色头像（基于角色数据，无需ID）
  async generateAvatarFromData(characterData: { name: string; description?: string; style?: string }): Promise<{ avatar: string }> {
    const response = await api.post('/api/ai/generate/avatar', {
      character: {
        name: characterData.name,
        description: characterData.description || ''
      },
      style: characterData.style || 'anime'
    })
    return response
  },

  // 为已存在的角色生成头像
  async generateAvatar(characterId: string): Promise<{ avatar: string; status: string }> {
    const response = await api.post(`/api/characters/${characterId}/generate-avatar`)
    return response.data.data
  },

  // 获取头像生成状态
  async getGenerationStatus(characterId: string): Promise<any> {
    const response = await api.get(`/api/characters/${characterId}/generation-status`)
    return response.data.data
  }
}