export interface MarketplaceCharacter {
  id: string
  name: string
  avatar?: string
  description: string

  // 市场专属字段
  marketDescription?: string
  category: string
  tags: string[]
  language: string

  // 状态标识
  isPublic: boolean
  isNSFW: boolean
  isFeatured: boolean
  isNew: boolean
  isFavorited?: boolean

  // 统计信息
  rating: number
  ratingCount: number
  favorites: number
  downloads: number
  views: number

  // 创建者信息
  creator: {
    id: string
    username: string
    avatar?: string
    isVerified?: boolean
  }

  // 时间戳
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export interface MarketplaceFilter {
  // 搜索和分类
  search?: string
  category?: string

  // 评分和标签
  minRating?: number
  tags?: string[]

  // 语言和地区
  language?: string

  // 排序方式
  sortBy?: 'popular' | 'newest' | 'rating' | 'favorites' | 'downloads' | 'trending'

  // 特殊筛选
  onlyFeatured?: boolean
  onlyNew?: boolean
  excludeNSFW?: boolean

  // 分页
  page?: number
  limit?: number
}

export interface MarketplaceResponse {
  characters: MarketplaceCharacter[]
  total: number
  page: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface CategoryStats {
  name: string
  displayName: string
  count: number
  icon: string
  description?: string
  trending?: boolean
}

export interface TrendingTag {
  tag: string
  count: number
  trend: 'up' | 'down' | 'stable'
  growth?: number // 增长率
}

export interface TopCreator {
  id: string
  username: string
  avatar?: string
  isVerified?: boolean

  // 统计信息
  characterCount: number
  totalFavorites: number
  totalDownloads: number
  averageRating: number

  // 徽章和等级
  badges?: string[]
  level?: number

  // 最近发布的角色
  recentCharacters?: MarketplaceCharacter[]
}

export interface CharacterDetail extends MarketplaceCharacter {
  // 完整角色信息
  fullDescription: string
  personality?: string
  backstory?: string
  scenario?: string
  exampleDialogs?: string[]

  // 高级设置
  speakingStyle?: string
  firstMessage?: string
  systemPrompt?: string

  // AI配置
  model?: string
  temperature?: number
  maxTokens?: number

  // 市场专属统计
  stats: {
    totalChats: number
    avgSessionLength: number
    lastUsed: string
    popularityTrend: 'up' | 'down' | 'stable'
  }

  // 版本信息
  version: string
  changelog?: string

  // 发布配置
  publishSettings: {
    allowComments: boolean
    allowModification: boolean
    allowDerivatives: boolean
    license?: string
  }
}

export interface CharacterRating {
  id: string
  characterId: string
  user: {
    id: string
    username: string
    avatar?: string
    isVerified?: boolean
  }
  rating: number // 1-5
  comment?: string
  helpful?: number // 有用投票数
  createdAt: string
  updatedAt?: string
}

export interface CharacterRatingsResponse {
  ratings: CharacterRating[]
  total: number
  averageRating: number
  ratingDistribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  page: number
  hasNext: boolean
}

export interface MarketplaceStats {
  totalCharacters: number
  totalCreators: number
  totalDownloads: number
  totalCategories: number
  featuredCount: number
  newToday: number
  popularTags: TrendingTag[]
  topCategories: CategoryStats[]
}

export interface PublishRequest {
  characterId: string
  category: string
  marketDescription: string
  tags: string[]
  language?: string

  // 发布选项
  allowComments?: boolean
  allowModification?: boolean
  allowDerivatives?: boolean

  // 申请状态
  requestFeatured?: boolean

  // 协议确认
  agreeToTerms: boolean
  agreeToPrivacy: boolean
}

export interface PublishResponse {
  success: boolean
  marketplaceId: string
  status: 'pending_review' | 'published' | 'rejected'
  message?: string
  reviewNotes?: string
  estimatedReviewTime?: string
}

export interface SearchSuggestion {
  type: 'character' | 'tag' | 'creator' | 'category'
  value: string
  count?: number
  highlight?: string
}

export interface RecommendationOptions {
  basedOn?: 'character' | 'user_favorites' | 'user_history'
  referenceId?: string
  excludeIds?: string[]
  limit?: number
  category?: string
}

// 报告相关类型
export interface ReportReason {
  id: string
  name: string
  description: string
  severity: 'low' | 'medium' | 'high'
}

export interface ReportRequest {
  characterId: string
  reason: string
  details?: string
  evidence?: string[]
}

// 收藏和导入相关
export interface FavoriteAction {
  characterId: string
  action: 'add' | 'remove'
}

export interface ImportRequest {
  characterId: string
  targetName?: string
  makePrivate?: boolean
}

export interface ImportResponse {
  success: boolean
  characterId: string
  message?: string
}

// 市场事件类型
export interface MarketplaceEvent {
  type: 'character_published' | 'character_updated' | 'character_featured' | 'character_trending'
  characterId: string
  character: MarketplaceCharacter
  timestamp: string
  metadata?: Record<string, any>
}

// 排行榜相关
export interface LeaderboardEntry {
  rank: number
  character: MarketplaceCharacter
  score: number
  change?: number // 排名变化
}

export interface Leaderboard {
  type: 'popular' | 'trending' | 'new' | 'top_rated'
  title: string
  description: string
  entries: LeaderboardEntry[]
  updatedAt: string
  timeframe?: string // 'daily' | 'weekly' | 'monthly' | 'all_time'
}

// 分析和洞察
export interface MarketplaceInsights {
  popularCategories: CategoryStats[]
  trendingTags: TrendingTag[]
  userGrowth: {
    period: string
    creators: number
    characters: number
    downloads: number
  }[]
  demographicData?: {
    ageGroups: Record<string, number>
    regions: Record<string, number>
    devices: Record<string, number>
  }
}

// 通知相关
export interface MarketplaceNotification {
  id: string
  type: 'character_approved' | 'character_rejected' | 'character_featured' | 'new_rating' | 'milestone'
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  createdAt: string
}
