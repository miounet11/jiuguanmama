export interface Character {
  id: string
  name: string
  avatar: string | null
  description: string
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
