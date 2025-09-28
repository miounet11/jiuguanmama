/**
 * 增强的世界剧本系统类型定义
 * Enhanced Scenario System Type Definitions
 */

// 基础枚举类型
export type LocationType = 'area' | 'building' | 'room' | 'landmark' | 'natural' | 'magical' | 'hidden'
export type EventType = 'historical' | 'current' | 'future' | 'cyclical' | 'mythical' | 'prophecy'
export type OrganizationType = 'guild' | 'government' | 'military' | 'religious' | 'commercial' | 'criminal' | 'academic' | 'secret'
export type CultureType = 'ethnic' | 'religious' | 'professional' | 'regional' | 'class' | 'species'
export type ItemType = 'weapon' | 'armor' | 'tool' | 'artifact' | 'consumable' | 'misc' | 'currency' | 'document' | 'magical'
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'unique' | 'cursed'
export type RuleCategory = 'magic' | 'physics' | 'social' | 'economic' | 'political' | 'combat' | 'divine' | 'natural'
export type RuleType = 'law' | 'guideline' | 'restriction' | 'enhancement' | 'tradition' | 'taboo'
export type Alignment = 'good' | 'neutral' | 'evil' | 'lawful' | 'chaotic' | 'lawful_good' | 'lawful_neutral' | 'lawful_evil' | 'neutral_good' | 'true_neutral' | 'neutral_evil' | 'chaotic_good' | 'chaotic_neutral' | 'chaotic_evil'
export type TechnologyLevel = 'stone_age' | 'bronze_age' | 'iron_age' | 'classical' | 'medieval' | 'renaissance' | 'industrial' | 'modern' | 'near_future' | 'far_future' | 'post_apocalyptic' | 'magitech'
export type MagicLevel = 'forbidden' | 'extinct' | 'rare' | 'uncommon' | 'common' | 'integral' | 'overwhelming' | 'unknown'
export type WorldScope = 'room' | 'building' | 'district' | 'city' | 'region' | 'country' | 'continent' | 'planet' | 'system' | 'galaxy' | 'multiverse'
export type ContentRating = 'general' | 'teen' | 'mature' | 'adult'
export type CompletionStatus = 'draft' | 'beta' | 'complete' | 'archived' | 'deprecated'
export type CreationMethod = 'manual' | 'ai_assisted' | 'template' | 'imported' | 'collaborative'
export type LicenseType = 'private' | 'cc_by' | 'cc_by_sa' | 'cc_by_nc' | 'cc_by_nc_sa' | 'commercial' | 'open_source'
export type EntryType = 'knowledge' | 'description' | 'rule' | 'secret' | 'relationship' | 'history' | 'prophecy'
export type Visibility = 'public' | 'private' | 'conditional' | 'secret' | 'gm_only'
export type SourceType = 'manual' | 'ai_generated' | 'imported' | 'collaborative' | 'template'

// 坐标系统
export interface WorldCoordinates {
  x?: number
  y?: number
  z?: number
  dimension?: string
  reference_system?: string
  description?: string
}

// 世界地理位置
export interface WorldLocation {
  id: string
  scenarioId: string
  name: string
  description?: string
  locationType: LocationType
  parentId?: string
  parent?: WorldLocation
  children?: WorldLocation[]
  coordinates?: WorldCoordinates
  isPublic: boolean
  isAccessible: boolean
  displayOrder: number

  // 扩展属性
  climate?: string
  population?: string
  government?: string
  notableFeatures?: string[]
  dangers?: string[]
  resources?: string[]
  secrets?: string[]

  // 关联关系
  events?: WorldEvent[]
  organizations?: WorldOrganization[]
  items?: WorldItem[]
  residents?: string[] // Character IDs

  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

// 世界历史事件
export interface WorldEvent {
  id: string
  scenarioId: string
  title: string
  description?: string
  eventType: EventType
  dateDescription?: string
  timelineOrder: number
  importanceLevel: number // 1-5
  relatedLocations: string[] // Location IDs
  relatedCharacters: string[] // Character IDs
  relatedOrganizations?: string[] // Organization IDs
  consequences?: string
  isActive: boolean

  // 扩展属性
  participants?: string[]
  casualties?: string
  culturalImpact?: string
  economicImpact?: string
  politicalImpact?: string
  artifacts?: string[] // Item IDs created/lost
  witnesses?: string[]

  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

// 世界组织机构
export interface WorldOrganization {
  id: string
  scenarioId: string
  name: string
  description?: string
  organizationType: OrganizationType
  powerLevel: number // 1-5
  alignment?: Alignment
  headquartersLocationId?: string
  leaderCharacterId?: string
  memberCount?: string
  foundingDate?: string
  currentStatus: 'active' | 'disbanded' | 'hidden' | 'declining' | 'growing' | 'reforming'

  // 关系网络
  relationships: Record<string, {
    organizationId: string
    relationship: 'ally' | 'enemy' | 'neutral' | 'rival' | 'subsidiary' | 'parent' | 'client' | 'supplier'
    strength: number // 1-5
    history?: string
  }>

  // 组织资源
  resources: {
    type: 'military' | 'economic' | 'political' | 'magical' | 'information' | 'religious' | 'technological'
    description: string
    level: number // 1-5
  }[]

  // 组织目标
  goals: {
    description: string
    priority: number // 1-5
    deadline?: string
    progress: number // 0-100
  }[]

  // 组织结构
  hierarchy?: {
    rank: string
    description: string
    requirements?: string[]
    privileges?: string[]
  }[]

  isPublic: boolean
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

// 世界文化系统
export interface WorldCulture {
  id: string
  scenarioId: string
  name: string
  description?: string
  cultureType: CultureType
  population?: string
  languages: string[]
  traditions: string[]
  beliefs: string[]
  socialStructure?: string
  technologyLevel: TechnologyLevel
  magicAcceptance: MagicLevel
  relatedLocations: string[] // Location IDs
  relatedOrganizations: string[] // Organization IDs

  // 文化特征
  values?: string[]
  taboos?: string[]
  holidays?: {
    name: string
    description: string
    date: string
    significance: string
  }[]

  // 社会结构
  socialClasses?: {
    name: string
    description: string
    privileges: string[]
    restrictions: string[]
    population_percentage?: number
  }[]

  // 经济系统
  economy?: {
    primary_industries: string[]
    currency: string
    trade_relations: string[]
    wealth_distribution: string
  }

  isActive: boolean
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

// 世界物品系统
export interface WorldItem {
  id: string
  scenarioId: string
  name: string
  description?: string
  itemType: ItemType
  rarity: ItemRarity
  valueDescription?: string

  // 物品属性
  properties: {
    name: string
    value: string | number | boolean
    description?: string
  }[]

  // 使用要求
  requirements: {
    type: 'level' | 'skill' | 'attribute' | 'class' | 'race' | 'alignment' | 'organization' | 'quest'
    requirement: string
    description?: string
  }[]

  // 物品效果
  effects: {
    type: 'passive' | 'active' | 'triggered' | 'consumable'
    description: string
    magnitude?: string
    duration?: string
    conditions?: string[]
  }[]

  lore?: string
  currentLocationId?: string
  ownerCharacterId?: string
  isUnique: boolean
  isAvailable: boolean

  // 物品历史
  history?: {
    event: string
    date: string
    participants: string[]
    significance: string
  }[]

  // 制作信息
  crafting?: {
    materials: string[]
    skills_required: string[]
    difficulty: number // 1-5
    time_required: string
  }

  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

// 世界规则系统
export interface WorldRule {
  id: string
  scenarioId: string
  category: RuleCategory
  title: string
  description: string
  ruleType: RuleType
  scope: 'global' | 'regional' | 'organizational' | 'personal' | 'conditional'
  relatedEntities: string[] // IDs of related entities
  exceptions: string[]
  enforcementLevel: 'strict' | 'moderate' | 'loose' | 'optional'
  consequences?: string
  examples: string[]
  isActive: boolean
  priority: number

  // 规则条件
  conditions?: {
    type: 'location' | 'time' | 'character' | 'organization' | 'event' | 'item'
    requirement: string
    description?: string
  }[]

  // 规则影响
  effects?: {
    target: string
    modification: string
    magnitude?: string
  }[]

  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

// 剧本模板
export interface ScenarioTemplate {
  id: string
  creatorId: string
  name: string
  description?: string
  category: string
  templateData: {
    scenario: Partial<EnhancedScenario>
    locations?: Partial<WorldLocation>[]
    events?: Partial<WorldEvent>[]
    organizations?: Partial<WorldOrganization>[]
    cultures?: Partial<WorldCulture>[]
    items?: Partial<WorldItem>[]
    rules?: Partial<WorldRule>[]
    worldInfoEntries?: Partial<EnhancedWorldInfoEntry>[]
  }
  usageCount: number
  isPublic: boolean
  isOfficial: boolean
  tags: string[]
  previewImage?: string

  // 模板配置
  customization_options?: {
    field: string
    type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean'
    label: string
    description?: string
    required: boolean
    options?: string[]
    default_value?: any
  }[]

  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

// 角色在世界中的特殊设定
export interface CharacterWorldSetting {
  id: string
  characterId: string
  scenarioId: string
  backgroundOverride?: string

  // 关系网络
  relationships: Record<string, {
    entityId: string
    entityType: 'character' | 'organization' | 'location' | 'item'
    relationship: string
    strength: number // 1-5
    isPublic: boolean
    description?: string
  }>

  // 特殊能力
  specialAbilities: {
    name: string
    description: string
    type: 'innate' | 'learned' | 'granted' | 'cursed' | 'temporary'
    scope: 'combat' | 'social' | 'magical' | 'mental' | 'physical' | 'supernatural'
    limitations?: string[]
  }[]

  // 限制条件
  restrictions: {
    type: 'physical' | 'magical' | 'social' | 'mental' | 'legal' | 'moral'
    description: string
    severity: 'minor' | 'moderate' | 'major' | 'severe'
    conditions?: string[]
  }[]

  startingLocationId?: string
  startingItems: string[] // Item IDs

  // 声望系统
  reputation: Record<string, {
    organizationId: string
    reputation: number // -100 to 100
    known_as?: string
    notable_deeds?: string[]
  }>

  // 秘密知识
  secretsKnown: {
    secret: string
    importance: number // 1-5
    source: string
    consequences_if_revealed?: string
  }[]

  // 个人目标
  personal_goals?: {
    description: string
    motivation: string
    obstacles: string[]
    progress: number // 0-100
  }[]

  isActive: boolean
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

// 增强的世界信息条目
export interface EnhancedWorldInfoEntry {
  id: string
  scenarioId: string
  title: string
  content: string
  keywords: string[]
  priority: number
  insertDepth: number
  probability: number
  matchType: 'exact' | 'partial' | 'regex' | 'semantic'
  caseSensitive: boolean
  isActive: boolean
  triggerOnce: boolean
  category: string
  displayOrder: number
  triggerCount: number

  // 增强字段
  entryType: EntryType
  relatedEntities: string[] // IDs of related entities
  visibility: Visibility
  conditions: {
    type: 'character_present' | 'location_current' | 'event_occurred' | 'item_owned' | 'relationship_exists'
    requirement: string
    description?: string
  }[]
  sourceType: SourceType
  lastTriggeredAt?: string

  // 动态内容
  dynamic_content?: {
    variables: Record<string, string>
    templates: string[]
  }

  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

// 增强的剧本接口
export interface EnhancedScenario {
  id: string
  userId: string
  name: string
  description?: string
  content?: string
  isPublic: boolean
  isActive: boolean
  tags: string[]
  category: string
  language: string

  // 统计信息
  rating: number
  viewCount: number
  useCount: number
  favoriteCount: number

  // 版本控制
  parentId?: string
  versionNumber: string
  parent?: EnhancedScenario
  versions?: EnhancedScenario[]

  // 增强元数据
  complexityLevel: number // 1-5
  playerCount: string
  estimatedDuration?: string
  genreTags: string[]
  contentRating: ContentRating
  worldScope: WorldScope
  technologyLevel: TechnologyLevel
  magicLevel: MagicLevel
  creationMethod: CreationMethod
  sourceMaterial?: string
  licenseType: LicenseType
  completionStatus: CompletionStatus
  templateId?: string
  worldSeed?: string

  // 世界构建元素
  locations?: WorldLocation[]
  events?: WorldEvent[]
  organizations?: WorldOrganization[]
  cultures?: WorldCulture[]
  items?: WorldItem[]
  rules?: WorldRule[]
  worldInfoEntries?: EnhancedWorldInfoEntry[]
  characterSettings?: CharacterWorldSetting[]

  // 关系数据
  user?: {
    id: string
    username: string
    avatar?: string
  }
  template?: ScenarioTemplate
  characters?: any[] // Character interface
  favorites?: any[] // ScenarioFavorite interface
  ratings?: any[] // ScenarioRating interface

  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

// API 请求/响应类型
export interface CreateEnhancedScenarioRequest {
  name: string
  description?: string
  content?: string
  isPublic?: boolean
  tags?: string[]
  category?: string
  language?: string
  complexityLevel?: number
  playerCount?: string
  estimatedDuration?: string
  genreTags?: string[]
  contentRating?: ContentRating
  worldScope?: WorldScope
  technologyLevel?: TechnologyLevel
  magicLevel?: MagicLevel
  sourceMaterial?: string
  licenseType?: LicenseType
  templateId?: string
  worldSeed?: string
  metadata?: Record<string, any>
}

export interface UpdateEnhancedScenarioRequest extends Partial<CreateEnhancedScenarioRequest> {
  completionStatus?: CompletionStatus
}

export interface ScenarioSearchFilters {
  category?: string
  complexityLevel?: number[]
  contentRating?: ContentRating[]
  worldScope?: WorldScope[]
  technologyLevel?: TechnologyLevel[]
  magicLevel?: MagicLevel[]
  completionStatus?: CompletionStatus[]
  creationMethod?: CreationMethod[]
  tags?: string[]
  genreTags?: string[]
  minRating?: number
  hasLocations?: boolean
  hasEvents?: boolean
  hasOrganizations?: boolean
  hasCultures?: boolean
  hasItems?: boolean
  hasRules?: boolean
}

export interface EnhancedScenarioListResponse {
  scenarios: EnhancedScenario[]
  total: number
  page: number
  pageSize: number
  filters: ScenarioSearchFilters
  facets?: {
    categories: { name: string; count: number }[]
    complexityLevels: { level: number; count: number }[]
    contentRatings: { rating: ContentRating; count: number }[]
    worldScopes: { scope: WorldScope; count: number }[]
    technologyLevels: { level: TechnologyLevel; count: number }[]
    magicLevels: { level: MagicLevel; count: number }[]
    tags: { tag: string; count: number }[]
    genreTags: { tag: string; count: number }[]
  }
}

// 世界构建助手类型
export interface WorldBuildingWizard {
  step: 'basic' | 'worldbuilding' | 'characters' | 'events' | 'locations' | 'organizations' | 'cultures' | 'items' | 'rules' | 'review'
  data: Partial<EnhancedScenario>
  template?: ScenarioTemplate
  aiAssistance: boolean
  customizations: Record<string, any>
}

export interface WorldGenerationRequest {
  seed?: string
  template?: string
  parameters: {
    worldScope: WorldScope
    technologyLevel: TechnologyLevel
    magicLevel: MagicLevel
    complexityLevel: number
    themes: string[]
    inspirations?: string[]
  }
  elements: {
    generateLocations: boolean
    generateEvents: boolean
    generateOrganizations: boolean
    generateCultures: boolean
    generateItems: boolean
    generateRules: boolean
    generateWorldInfo: boolean
  }
  customizations?: Record<string, any>
}

// 导出主要类型
export type {
  WorldLocation,
  WorldEvent,
  WorldOrganization,
  WorldCulture,
  WorldItem,
  WorldRule,
  ScenarioTemplate,
  CharacterWorldSetting,
  EnhancedWorldInfoEntry,
  EnhancedScenario
}
