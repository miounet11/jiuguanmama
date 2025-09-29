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

  // 时空酒馆扩展字段
  spacetimeHub?: {
    spacetimeAttributes: string[] // 时空属性，如 ["魔力共鸣", "时光回溯"]
    spacetimeLayout: string[] // 空间布局
    fusionMechanisms: string[] // 融合机制
    plotPhases: string[] // 剧情阶段
    eventTriggers: string[] // 事件触发器
  }

  // 增强世界剧本字段
  genre?: string // fantasy, scifi, modern, historical, horror, romance, mystery, adventure
  complexity?: string // simple, moderate, complex, epic
  contentRating?: string // general, teen, mature, adult
  worldScope?: string // local, regional, continental, global, multiverse
  timelineScope?: string // single_event, short_term, medium_term, long_term, eternal
  playerCount?: number
  estimatedDuration?: number
  templateId?: string
  isFeatured?: boolean
  ratingAverage?: number
  downloadCount?: number
  worldSetting?: string // 详细的世界设定描述
  viewCount?: number
  useCount?: number
  favoriteCount?: number
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

  // 时空酒馆扩展字段
  spacetimeAttributes?: string[] // 时空属性关联，如 ["魔力共鸣", "时光回溯"]
  relationTriggers?: RelationTrigger[] // 角色关系触发器
  culturalContext?: CulturalContext // 文化语境信息
  plotPhases?: PlotPhase[] // 剧情阶段绑定
  dynamicWeight?: DynamicWeight // 动态权重配置
}

// 角色关系触发器
export interface RelationTrigger {
  id: string
  characterId?: string // 触发角色ID，为空表示任意角色
  characterName?: string // 触发角色名称
  relationType: 'complementary' | 'mentor_student' | 'professional' | 'protector_ward' | 'cultural_exchange' | 'technology_magic'
  triggerCondition: string // 触发条件描述
  triggerProbability: number // 触发概率 0-1
  effectDescription: string // 效果描述
  cooldownMinutes?: number // 冷却时间（分钟）
}

// 文化语境信息
export interface CulturalContext {
  era: 'ancient' | 'medieval' | 'renaissance' | 'industrial' | 'modern' | 'future' | 'fantasy' | 'scifi'
  region: string // 地域，如 "中国古代"、"欧洲中世纪"、"未来都市"
  languageStyle: 'formal' | 'casual' | 'poetic' | 'technical' | 'vulgar' | 'archaic'
  valueSystem: string[] // 价值观，如 ["侠义精神", "科技至上", "魔法荣耀"]
  socialNorms: string[] // 社会规范，如 ["尊师重道", "男女平等", "阶级制度"]
  culturalSymbols: string[] // 文化符号，如 ["龙", "激光剑", "魔法杖"]
}

// 剧情阶段绑定
export interface PlotPhase {
  phase: 'introduction' | 'development' | 'climax' | 'resolution' | 'epilogue'
  weightMultiplier: number // 权重倍数，如 0.5表示降低权重，2.0表示提升权重
  isActive: boolean // 该阶段是否激活此条目
  conditions?: string[] // 激活条件
}

// 动态权重配置
export interface DynamicWeight {
  baseWeight: number // 基础权重
  characterPresenceMultiplier: number // 角色存在时的倍数
  relationStrengthMultiplier: number // 关系强度倍数
  culturalRelevanceMultiplier: number // 文化相关性倍数
  timeBasedDecay: boolean // 是否随时间衰减
  decayHalfLife: number // 半衰期（分钟）
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