import api from './api'
import type {
  Scenario,
  ScenarioQueryParams,
  ScenarioPaginationResponse,
  CreateScenarioRequest,
  UpdateScenarioRequest,
  WorldInfoEntry,
  CreateWorldInfoEntryRequest,
  UpdateWorldInfoEntryRequest,
  TestMatchingRequest,
  TestMatchingResult
} from '@/types/scenario'

/**
 * 剧本管理API服务
 */
export const scenarioApi = {
  // ===== 剧本 CRUD =====

  /**
   * 获取剧本列表
   */
  getScenarios: async (params?: ScenarioQueryParams): Promise<ScenarioPaginationResponse> => {
    const response = await api.get<{
      success: boolean
      data: ScenarioPaginationResponse
    }>('/scenarios', params)

    if (!response.success) {
      throw new Error('获取剧本列表失败')
    }

    return response.data
  },

  /**
   * 获取单个剧本详情
   */
  getScenario: async (id: string): Promise<Scenario> => {
    const response = await api.get<{
      success: boolean
      data: Scenario
    }>(`/scenarios/${id}`)

    if (!response.success) {
      throw new Error('获取剧本详情失败')
    }

    return response.data
  },

  /**
   * 创建新剧本
   */
  createScenario: async (data: CreateScenarioRequest): Promise<Scenario> => {
    const response = await api.post<{
      success: boolean
      data: Scenario
      message: string
    }>('/scenarios', data)

    if (!response.success) {
      throw new Error('创建剧本失败')
    }

    return response.data
  },

  /**
   * 更新剧本
   */
  updateScenario: async (id: string, data: UpdateScenarioRequest): Promise<Scenario> => {
    const response = await api.put<{
      success: boolean
      data: Scenario
      message: string
    }>(`/scenarios/${id}`, data)

    if (!response.success) {
      throw new Error('更新剧本失败')
    }

    return response.data
  },

  /**
   * 删除剧本
   */
  deleteScenario: async (id: string): Promise<void> => {
    const response = await api.delete<{
      success: boolean
      message: string
    }>(`/scenarios/${id}`)

    if (!response.success) {
      throw new Error('删除剧本失败')
    }
  },

  // ===== 世界信息条目 =====

  /**
   * 添加世界信息条目
   */
  createWorldInfoEntry: async (
    scenarioId: string,
    data: CreateWorldInfoEntryRequest
  ): Promise<WorldInfoEntry> => {
    const response = await api.post<{
      success: boolean
      data: WorldInfoEntry
      message: string
    }>(`/scenarios/${scenarioId}/entries`, data)

    if (!response.success) {
      throw new Error('添加世界信息条目失败')
    }

    return response.data
  },

  /**
   * 更新世界信息条目
   */
  updateWorldInfoEntry: async (
    scenarioId: string,
    entryId: string,
    data: UpdateWorldInfoEntryRequest
  ): Promise<WorldInfoEntry> => {
    const response = await api.put<{
      success: boolean
      data: WorldInfoEntry
      message: string
    }>(`/scenarios/${scenarioId}/entries/${entryId}`, data)

    if (!response.success) {
      throw new Error('更新世界信息条目失败')
    }

    return response.data
  },

  /**
   * 删除世界信息条目
   */
  deleteWorldInfoEntry: async (scenarioId: string, entryId: string): Promise<void> => {
    const response = await api.delete<{
      success: boolean
      message: string
    }>(`/scenarios/${scenarioId}/entries/${entryId}`)

    if (!response.success) {
      throw new Error('删除世界信息条目失败')
    }
  },

  // ===== 高级功能 =====

  /**
   * 测试关键词匹配
   */
  testMatching: async (
    scenarioId: string,
    data: TestMatchingRequest
  ): Promise<TestMatchingResult> => {
    const response = await api.post<{
      success: boolean
      data: TestMatchingResult
    }>(`/scenarios/${scenarioId}/test`, data)

    if (!response.success) {
      throw new Error('测试关键词匹配失败')
    }

    return response.data
  },

  /**
   * 批量更新条目顺序
   */
  reorderEntries: async (
    scenarioId: string,
    entryIds: string[]
  ): Promise<void> => {
    const response = await api.put<{
      success: boolean
      message: string
    }>(`/scenarios/${scenarioId}/reorder`, {
      entryIds
    })

    if (!response.success) {
      throw new Error('更新条目顺序失败')
    }
  },

  /**
   * 复制剧本
   */
  cloneScenario: async (id: string, name?: string): Promise<Scenario> => {
    const response = await api.post<{
      success: boolean
      data: Scenario
      message: string
    }>(`/scenarios/${id}/clone`, {
      name: name || `${name || '未命名剧本'} (副本)`
    })

    if (!response.success) {
      throw new Error('复制剧本失败')
    }

    return response.data
  },

  /**
   * 导出剧本数据
   */
  exportScenario: async (id: string): Promise<Blob> => {
    const response = await api.get(`/scenarios/${id}/export`, undefined, {
      responseType: 'blob'
    })
    return response
  },

  /**
   * 导入剧本数据
   */
  importScenario: async (file: File): Promise<Scenario> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.upload<{
      success: boolean
      data: Scenario
      message: string
    }>('/scenarios/import', formData)

    if (!response.success) {
      throw new Error('导入剧本失败')
    }

    return response.data
  },

  // ===== 分类和标签 =====

  /**
   * 获取所有分类
   */
  getCategories: async (): Promise<string[]> => {
    const response = await api.get<{
      success: boolean
      data: string[]
    }>('/scenarios/categories')

    if (!response.success) {
      throw new Error('获取分类失败')
    }

    return response.data
  },

  /**
   * 获取所有标签
   */
  getTags: async (): Promise<string[]> => {
    const response = await api.get<{
      success: boolean
      data: string[]
    }>('/scenarios/tags')

    if (!response.success) {
      throw new Error('获取标签失败')
    }

    return response.data
  },

  /**
   * 获取推荐剧本
   */
  getRecommendedScenarios: async (limit: number = 6): Promise<Scenario[]> => {
    const response = await api.get<{
      success: boolean
      data: Scenario[]
    }>('/scenarios/recommended', { limit })

    if (!response.success) {
      throw new Error('获取推荐剧本失败')
    }

    return response.data
  },

  /**
   * 获取我的剧本
   */
  getMyScenarios: async (params?: Omit<ScenarioQueryParams, 'isPublic'>): Promise<ScenarioPaginationResponse> => {
    const response = await api.get<{
      success: boolean
      data: ScenarioPaginationResponse
    }>('/scenarios/my', params)

    if (!response.success) {
      throw new Error('获取我的剧本失败')
    }

    return response.data
  },

  /**
   * 切换剧本公开状态
   */
  togglePublic: async (id: string): Promise<Scenario> => {
    const response = await api.post<{
      success: boolean
      data: Scenario
      message: string
    }>(`/scenarios/${id}/toggle-public`)

    if (!response.success) {
      throw new Error('切换公开状态失败')
    }

    return response.data
  }
}

export default scenarioApi