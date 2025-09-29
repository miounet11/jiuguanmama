/**
 * 聊天相关的 TypeScript 类型定义
 */

export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface User extends BaseEntity {
  username: string
  email: string
  displayName: string
  avatar?: string
  isOnline: boolean
  lastSeen: Date
}

export interface Character extends BaseEntity {
  name: string
  description: string
  avatar?: string
  creator: string
  isPublic: boolean
  chatCount: number
  rating: number
  tags: string[]
  category: string
  personality: {
    traits: string[]
    background: string
    motivations: string[]
    relationships: string[]
  }
  settings: {
    systemPrompt: string
    temperature: number
    maxTokens: number
    topP: number
    frequencyPenalty: number
    presencePenalty: number
  }
}

export interface Message extends BaseEntity {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  chatId: string

  // 时空酒馆扩展字段
  spacetimeEvents?: SpacetimeEvent[]
  relationTriggers?: RelationTrigger[]
  userId?: string
  characterId?: string

  // 扩展属性
  imageUrl?: string
  imagePrompt?: string
  audioUrl?: string

  // 状态标记
  isStreaming?: boolean
  isError?: boolean
  isEdited?: boolean

  // 元数据
  metadata?: {
    model?: string
    temperature?: number
    tokens?: number
    cost?: number
    processingTime?: number
  }

  // 评分和反馈
  rating?: 1 | 2 | 3 | 4 | 5
  feedback?: string
}

export interface Chat extends BaseEntity {
  title: string
  userId: string
  characterId: string
  isActive: boolean
  messageCount: number
  lastMessageAt: Date
  settings: ChatSettings

  // 关联数据
  character?: Character
  messages?: Message[]
  participants?: User[]
}

export interface ChatSettings {
  // AI 模型配置
  model: string
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number

  // 功能开关
  enableStream: boolean
  enableTyping: boolean
  enableVoice: boolean
  enableImageGeneration: boolean
  autoSave: boolean

  // UI 配置
  theme: 'light' | 'dark' | 'auto'
  compactMode: boolean
  showTimestamps: boolean
  messageGrouping: boolean

  // 隐私设置
  saveHistory: boolean
  shareData: boolean
}

export interface AIModel {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek'
  type: 'text' | 'image' | 'audio' | 'multimodal'
  maxTokens: number
  costPerToken: number
  isAvailable: boolean
  description: string
  capabilities: string[]
}

export interface VoiceSettings {
  enabled: boolean
  voice: string
  speed: number
  pitch: number
  autoPlay: boolean
  language: string
}

export interface ImageGenerationSettings {
  enabled: boolean
  model: string
  size: '256x256' | '512x512' | '1024x1024'
  quality: 'standard' | 'hd'
  style: 'vivid' | 'natural'
  autoGenerate: boolean
}

// API 响应类型
export interface APIResponse<T = any> {
  success: boolean
  data: T
  message?: string
  error?: string
  timestamp: Date
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface StreamingResponse {
  type: 'chunk' | 'complete' | 'error' | 'connected'
  content?: string
  fullContent?: string
  id?: string
  timestamp?: Date
  message?: string
  userMessage?: Partial<Message>
}

// 事件类型
export interface ChatEvent {
  type: 'message' | 'typing' | 'presence' | 'error'
  data: any
  timestamp: Date
  userId?: string
  characterId?: string
}

export interface TypingEvent extends ChatEvent {
  type: 'typing'
  data: {
    isTyping: boolean
    userId: string
  }
}

export interface MessageEvent extends ChatEvent {
  type: 'message'
  data: Message
}

export interface PresenceEvent extends ChatEvent {
  type: 'presence'
  data: {
    userId: string
    isOnline: boolean
    lastSeen: Date
  }
}

// 组件 Props 类型
export interface MessageBubbleProps {
  message: Message
  character?: Character
  isLoading?: boolean
  enableVoice?: boolean
  isPlaying?: boolean
  compact?: boolean
}

export interface ChatInputProps {
  modelValue: string
  isLoading?: boolean
  options?: ChatInputOptions
  suggestions?: string[]
  compact?: boolean
  disabled?: boolean
}

export interface ChatInputOptions {
  enableEmoji?: boolean
  enableVoice?: boolean
  enableFileUpload?: boolean
  enableSuggestions?: boolean
  maxLength?: number
  placeholder?: string
}

export interface VirtualScrollOptions {
  containerHeight?: number
  itemHeight?: number
  overscan?: number
  threshold?: number
  enableDynamicHeight?: boolean
  direction?: 'vertical' | 'horizontal'
}

// 表单验证类型
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  validator?: (value: any) => boolean | string
  message?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// 错误类型
export interface ChatError {
  code: string
  message: string
  type: 'network' | 'validation' | 'auth' | 'api' | 'unknown'
  details?: any
  retry?: () => void
}

// 主题和样式类型
export interface ThemeConfig {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  surfaceColor: string
  textColor: string
  borderColor: string
  borderRadius: string
  fontSize: string
  fontFamily: string
}

// 导出联合类型
export type MessageRole = Message['role']
export type ChatEventType = ChatEvent['type']
export type AIProvider = AIModel['provider']
export type ThemeName = ChatSettings['theme']

// 工具类型
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>

// 创建类型守卫
export function isMessage(obj: any): obj is Message {
  return obj && typeof obj.id === 'string' && typeof obj.content === 'string' && obj.role
}

export function isCharacter(obj: any): obj is Character {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string'
}

export function isChatError(obj: any): obj is ChatError {
  return obj && typeof obj.code === 'string' && typeof obj.message === 'string'
}

// 常量
export const MESSAGE_ROLES = ['user', 'assistant', 'system'] as const
export const AI_PROVIDERS = ['openai', 'anthropic', 'google', 'xai', 'deepseek'] as const
export const THEME_NAMES = ['light', 'dark', 'auto'] as const

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 1000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  enableStream: true,
  enableTyping: true,
  enableVoice: false,
  enableImageGeneration: false,
  autoSave: true,
  theme: 'auto',
  compactMode: false,
  showTimestamps: true,
  messageGrouping: true,
  saveHistory: true,
  shareData: false
}

export const DEFAULT_VIRTUAL_SCROLL_OPTIONS: Required<VirtualScrollOptions> = {
  containerHeight: 600,
  itemHeight: 120,
  overscan: 5,
  threshold: 50,
  enableDynamicHeight: false,
  direction: 'vertical'
}

// 时空事件类型
export interface SpacetimeEvent {
  id: string
  type: 'spacetime_tide' | 'echo' | 'resonance' | 'fusion' | 'conflict'
  title: string
  description: string
  effects?: string[]
  triggeredBy?: string // 触发者角色ID
  timestamp: Date
}

// 关系触发类型
export interface RelationTrigger {
  id: string
  characterId: string
  characterName: string
  relationType: 'complementary' | 'mentor_student' | 'professional' | 'protector_ward' | 'cultural_exchange' | 'technology_magic'
  description: string
  compatibilityScore?: number
  timestamp: Date
}
