export interface Character {
  id: string
  name: string
  avatar: string | null
  description: string
  fullDescription?: string // 扩展描述
  tags: string[]
  isPublic: boolean
  isNSFW: boolean

  // 人设设定 (SillyTavern 兼容)
  personality?: string
  backstory?: string
  speakingStyle?: string
  firstMessage?: string
  scenario?: string
  exampleDialogs?: string

  // AI 设置
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string

  // 统计信息
  rating: number
  ratingCount: number
  chatCount: number
  favoriteCount: number

  // 关联信息
  userId: string
  user?: {
    id: string
    username: string
    avatar?: string
  }

  // 时空酒馆扩展字段
  mbti?: {
    type: string // 如 "INTJ", "ENFJ"
    traits: string[] // 性格特质数组
    compatibility: string[] // 兼容的MBTI类型
    weaknesses: string[] // 性格弱点
  }

  // 角色关联网络
  characterRelations?: CharacterRelation[]

  // 导入信息
  importedFrom?: string
  version?: number

  // 状态
  isFavorited?: boolean
  isNew?: boolean

  // 时间戳
  createdAt: string
  updatedAt: string
}

// 角色关联类型
export interface CharacterRelation {
  characterId: string
  relationType: 'complementary' | 'mentor_student' | 'professional' | 'protector_ward' | 'cultural_exchange' | 'technology_magic'
  description: string
  interactionTriggers: string[] // 互动触发条件
  compatibilityScore?: number // 兼容性评分 0-1
}

export interface CharacterCreateData {
  name: string
  avatar?: string
  description: string
  tags: string[]
  isPublic?: boolean
  isNSFW?: boolean
  personality?: string
  backstory?: string
  speakingStyle?: string
  firstMessage?: string
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

export interface CharacterFilter {
  tags?: string[]
  isPublic?: boolean
  isNSFW?: boolean
  minRating?: number
  userId?: string
}

export interface CharacterStats {
  totalCharacters: number
  publicCharacters: number
  totalChats: number
  totalUsers: number
  popularTags: Array<{
    tag: string
    count: number
  }>
}
