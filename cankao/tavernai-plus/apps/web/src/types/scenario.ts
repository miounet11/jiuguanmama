// 剧本与世界信息类型定义

export interface Scenario {
  id: string
  name: string
  description?: string
  content?: string
  isPublic: boolean
  tags: string[]
  category: string
  language: string
  creator: {
    id: string
    username: string
  }
  worldInfoEntries: WorldInfoEntry[]
  createdAt: string
  updatedAt: string
  // 统计信息
  entriesCount?: number
  usageCount?: number
  rating?: number
}

export interface WorldInfoEntry {
  id: string
  scenarioId: string
  title: string
  content: string
  keywords: string[]
  priority: number
  insertDepth: number
  probability: number
  matchType: MatchType
  caseSensitive: boolean
  isActive: boolean
  triggerOnce: boolean
  excludeRecursion: boolean
  category: string
  group?: string
  position: InsertPosition
  order?: number
  createdAt: string
  updatedAt: string
}

export type MatchType =
  | 'exact'       // 精确匹配
  | 'contains'    // 包含匹配
  | 'regex'       // 正则表达式
  | 'starts_with' // 开头匹配
  | 'ends_with'   // 结尾匹配
  | 'wildcard'    // 通配符匹配

export type InsertPosition =
  | 'before'  // 在指定位置之前插入
  | 'after'   // 在指定位置之后插入
  | 'replace' // 替换指定内容

export type SortBy =
  | 'created'   // 创建时间
  | 'updated'   // 更新时间
  | 'rating'    // 评分
  | 'popular'   // 受欢迎程度
  | 'name'      // 名称

// 创建剧本请求
export interface CreateScenarioRequest {
  name: string
  description?: string
  content?: string
  isPublic?: boolean
  tags?: string[]
  category?: string
  language?: string
}

// 更新剧本请求
export interface UpdateScenarioRequest {
  name?: string
  description?: string
  content?: string
  isPublic?: boolean
  tags?: string[]
  category?: string
  language?: string
}

// 创建世界信息条目请求
export interface CreateWorldInfoEntryRequest {
  title: string
  content: string
  keywords: string[]
  priority?: number
  insertDepth?: number
  probability?: number
  matchType?: MatchType
  caseSensitive?: boolean
  isActive?: boolean
  triggerOnce?: boolean
  excludeRecursion?: boolean
  category?: string
  group?: string
  position?: InsertPosition
}

// 更新世界信息条目请求
export interface UpdateWorldInfoEntryRequest {
  title?: string
  content?: string
  keywords?: string[]
  priority?: number
  insertDepth?: number
  probability?: number
  matchType?: MatchType
  caseSensitive?: boolean
  isActive?: boolean
  triggerOnce?: boolean
  excludeRecursion?: boolean
  category?: string
  group?: string
  position?: InsertPosition
}

// 查询参数
export interface ScenarioQueryParams {
  page?: number
  limit?: number
  sort?: SortBy
  search?: string
  category?: string
  isPublic?: boolean
  tags?: string[]
}

// 分页响应
export interface ScenarioPaginationResponse {
  scenarios: Scenario[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

// 关键词测试请求
export interface TestMatchingRequest {
  testText: string
  depth?: number
}

// 关键词测试结果
export interface TestMatchingResult {
  matchedEntries: Array<{
    entry: WorldInfoEntry
    matchedKeywords: string[]
    matchPosition: number
    insertText: string
  }>
  processedText: string
  totalMatches: number
  executionTime: number
}

// 拖拽重排数据
export interface DragDropData {
  id: string
  type: 'entry' | 'group'
  data: WorldInfoEntry | string
}

// 条目分组
export interface EntryGroup {
  name: string
  entries: WorldInfoEntry[]
  collapsed?: boolean
  color?: string
}

// 剧本模板
export interface ScenarioTemplate {
  id: string
  name: string
  description: string
  category: string
  structure: {
    name: string
    description: string
    content: string
    categories: string[]
    defaultEntries: Omit<CreateWorldInfoEntryRequest, 'title' | 'content' | 'keywords'>[]
  }
}

// 导出/导入格式
export interface ScenarioExportData {
  scenario: Omit<Scenario, 'id' | 'creator' | 'createdAt' | 'updatedAt'>
  entries: Omit<WorldInfoEntry, 'id' | 'scenarioId' | 'createdAt' | 'updatedAt'>[]
  exportDate: string
  version: string
}