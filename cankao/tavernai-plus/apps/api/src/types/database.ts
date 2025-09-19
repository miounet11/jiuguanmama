/**
 * 数据库实体类型定义
 * 基于Prisma生成的类型，提供类型安全的数据库操作
 */

const {
  User: PrismaUser,
  Character: PrismaCharacter,
  ChatSession: PrismaChatSession,
  Message: PrismaMessage,
  CharacterFavorite: PrismaCharacterFavorite,
  CharacterRating: PrismaCharacterRating,
  ChatRoom: PrismaChatRoom,
  ChatParticipant: PrismaChatParticipant,
  ChatMessage: PrismaChatMessage,
  Transaction: PrismaTransaction,
  OAuthAccount: PrismaOAuthAccount,
  RefreshToken: PrismaRefreshToken,
  Prisma
} = require('../../node_modules/.prisma/client')

// 基础数据库实体类型
export type DbUser = PrismaUser
export type DbCharacter = PrismaCharacter
export type DbChatSession = PrismaChatSession
export type DbMessage = PrismaMessage
export type DbCharacterFavorite = PrismaCharacterFavorite
export type DbCharacterRating = PrismaCharacterRating
export type DbChatRoom = PrismaChatRoom
export type DbChatParticipant = PrismaChatParticipant
export type DbChatMessage = PrismaChatMessage
export type DbTransaction = PrismaTransaction
export type DbOAuthAccount = PrismaOAuthAccount
export type DbRefreshToken = PrismaRefreshToken

// 用户相关类型
export type UserWithStats = DbUser & {
  _count: {
    characters: number
    chatSessions: number
    favorites: number
    ratings: number
  }
}

export type SafeUser = Omit<DbUser, 'passwordHash' | 'verificationToken' | 'resetPasswordToken'>

export type UserRole = 'user' | 'creator' | 'admin' | 'moderator'
export type SubscriptionTier = 'free' | 'plus' | 'pro' | 'premium'

// 角色相关类型
export type CharacterWithCreator = DbCharacter & {
  creator: SafeUser
}

export type CharacterWithStats = DbCharacter & {
  creator: SafeUser
  _count: {
    chatSessions: number
    messages: number
    favorites: number
    ratings: number
  }
  isFavorited?: boolean
  isNew?: boolean
}

export type CharacterCreateInput = Omit<DbCharacter, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'ratingCount' | 'chatCount' | 'favoriteCount' | 'version'>

export type CharacterUpdateInput = Partial<Pick<DbCharacter,
  | 'name'
  | 'description'
  | 'fullDescription'
  | 'personality'
  | 'backstory'
  | 'speakingStyle'
  | 'scenario'
  | 'firstMessage'
  | 'systemPrompt'
  | 'exampleDialogs'
  | 'avatar'
  | 'coverImage'
  | 'category'
  | 'tags'
  | 'language'
  | 'model'
  | 'temperature'
  | 'maxTokens'
  | 'isPublic'
  | 'isNSFW'
  | 'metadata'
>>

// 聊天相关类型
export type ChatSessionWithCharacter = DbChatSession & {
  character: Pick<DbCharacter, 'id' | 'name' | 'avatar' | 'description'>
  user: SafeUser
  _count: {
    messages: number
  }
}

export type MessageWithRelations = DbMessage & {
  user?: SafeUser
  character?: Pick<DbCharacter, 'id' | 'name' | 'avatar'>
}

export type ChatRoomWithParticipants = DbChatRoom & {
  owner: SafeUser
  participants: (DbChatParticipant & {
    user?: SafeUser
    character?: Pick<DbCharacter, 'id' | 'name' | 'avatar'>
  })[]
  _count: {
    participants: number
    messages: number
  }
}

// JSON字段类型定义
export interface CharacterTags extends Array<string> {}

export interface CharacterExampleDialogs extends Array<{
  user: string
  character: string
}> {}

export interface CharacterMetadata {
  importSource?: string
  importDate?: string
  originalId?: string
  customSettings?: Record<string, any>
  [key: string]: any
}

export interface ChatSessionMetadata {
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  model?: string
  worldInfo?: any
  preset?: any
  [key: string]: any
}

// 查询选项类型
export interface CharacterListOptions {
  page?: number
  limit?: number
  sort?: 'created' | 'rating' | 'popular' | 'favorites'
  search?: string
  tags?: string[]
  category?: string
  creatorId?: string
  isPublic?: boolean
  isNSFW?: boolean
  isFeatured?: boolean
}

export interface ChatSessionListOptions {
  page?: number
  limit?: number
  userId?: string
  characterId?: string
  isArchived?: boolean
  sort?: 'updated' | 'created' | 'messages'
}

// Prisma查询类型
export type CharacterFindManyArgs = Prisma.CharacterFindManyArgs
export type CharacterFindUniqueArgs = Prisma.CharacterFindUniqueArgs
export type CharacterCreateArgs = Prisma.CharacterCreateArgs
export type CharacterUpdateArgs = Prisma.CharacterUpdateArgs
export type CharacterDeleteArgs = Prisma.CharacterDeleteArgs

export type UserFindManyArgs = Prisma.UserFindManyArgs
export type UserFindUniqueArgs = Prisma.UserFindUniqueArgs
export type UserCreateArgs = Prisma.UserCreateArgs
export type UserUpdateArgs = Prisma.UserUpdateArgs

export type ChatSessionFindManyArgs = Prisma.ChatSessionFindManyArgs
export type ChatSessionCreateArgs = Prisma.ChatSessionCreateArgs
export type ChatSessionUpdateArgs = Prisma.ChatSessionUpdateArgs

// 类型验证工具函数
export const isValidUserRole = (role: string): role is UserRole => {
  return ['user', 'creator', 'admin', 'moderator'].includes(role)
}

export const isValidSubscriptionTier = (tier: string): tier is SubscriptionTier => {
  return ['free', 'plus', 'pro', 'premium'].includes(tier)
}

export const isValidCharacterCategory = (category: string): boolean => {
  const validCategories = [
    '原创', '奇幻', '科幻', '现代', '历史', '动漫', '游戏', '影视', '小说', '其他'
  ]
  return validCategories.includes(category)
}

// JSON字段解析工具
export const parseCharacterTags = (tags: string): CharacterTags => {
  try {
    const parsed = JSON.parse(tags)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const parseCharacterExampleDialogs = (dialogs: string | null): CharacterExampleDialogs => {
  if (!dialogs) return []
  try {
    const parsed = JSON.parse(dialogs)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const parseCharacterMetadata = (metadata: string | null): CharacterMetadata => {
  if (!metadata) return {}
  try {
    return JSON.parse(metadata) || {}
  } catch {
    return {}
  }
}

export const parseChatSessionMetadata = (metadata: string | null): ChatSessionMetadata => {
  if (!metadata) return {}
  try {
    return JSON.parse(metadata) || {}
  } catch {
    return {}
  }
}

// 字符串化工具
export const stringifyCharacterTags = (tags: CharacterTags): string => {
  return JSON.stringify(tags || [])
}

export const stringifyCharacterExampleDialogs = (dialogs: CharacterExampleDialogs): string => {
  return JSON.stringify(dialogs || [])
}

export const stringifyCharacterMetadata = (metadata: CharacterMetadata): string => {
  return JSON.stringify(metadata || {})
}

export const stringifyChatSessionMetadata = (metadata: ChatSessionMetadata): string => {
  return JSON.stringify(metadata || {})
}

// 默认值常量
export const DEFAULT_CHARACTER_METADATA: CharacterMetadata = {}
export const DEFAULT_CHAT_SESSION_METADATA: ChatSessionMetadata = {
  temperature: 0.7,
  maxTokens: 1000,
  model: 'gpt-3.5-turbo'
}

// 类型守卫函数
export const isDbUser = (obj: any): obj is DbUser => {
  return obj && typeof obj.id === 'string' && typeof obj.username === 'string'
}

export const isDbCharacter = (obj: any): obj is DbCharacter => {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string' && typeof obj.creatorId === 'string'
}

export const isDbChatSession = (obj: any): obj is DbChatSession => {
  return obj && typeof obj.id === 'string' && typeof obj.userId === 'string' && typeof obj.characterId === 'string'
}
