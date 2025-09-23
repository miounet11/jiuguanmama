/**
 * Prompt系统类型定义
 * 支持世界信息注入到AI对话prompt的完整功能
 */

// 支持的AI模型类型
export type AIModel = 'openai' | 'claude' | 'gemini' | 'grok' | 'deepseek'

// 消息角色类型
export type MessageRole = 'system' | 'user' | 'assistant'

// 基础消息接口
export interface BaseMessage {
  role: MessageRole
  content: string
  metadata?: Record<string, any>
}

// 世界信息注入位置
export type InjectionPosition =
  | 'before_character'    // 角色定义前
  | 'after_character'     // 角色定义后
  | 'before_examples'     // 示例消息前
  | 'after_examples'      // 示例消息后
  | 'at_depth'           // 指定深度
  | 'system_start'       // 系统提示开始
  | 'system_end'         // 系统提示结尾

// 注入配置
export interface InjectionConfig {
  position: InjectionPosition
  depth?: number           // 当position为'at_depth'时使用
  maxTokens: number       // 最大token限制
  priority: number        // 优先级(1-100)
  preserveOrder?: boolean // 是否保持原始顺序
}

// Token预算管理配置
export interface TokenBudget {
  maxTotal: number        // 总token限制
  reserved: number        // 预留token(用于回复生成)
  worldInfoLimit: number  // 世界信息token限制
  characterLimit: number  // 角色信息token限制
  examplesLimit: number   // 示例消息token限制
  contextLimit: number    // 对话上下文token限制
}

// 模型格式化器接口
export interface ModelFormatter {
  formatSystemMessage(content: string): BaseMessage
  formatUserMessage(content: string): BaseMessage
  formatAssistantMessage(content: string): BaseMessage
  combineMessages(messages: BaseMessage[]): BaseMessage[]
  estimateTokens(text: string): number
  getModelLimits(): {
    maxTokens: number
    maxMessages: number
    contextWindow: number
  }
}

// 世界信息条目（简化版）
export interface WorldInfoItem {
  id: string
  title: string
  content: string
  priority: number
  insertPosition: number
  tokens?: number
}

// Prompt构建上下文
export interface PromptContext {
  userId?: string
  sessionId: string
  characterId?: string
  scenarioId?: string
  messages: BaseMessage[]
  worldInfo?: WorldInfoItem[]
  settings: {
    model: AIModel
    temperature?: number
    maxTokens?: number
  }
  metadata?: Record<string, any>
}

// Prompt注入结果
export interface InjectionResult {
  success: boolean
  finalPrompt: BaseMessage[]
  injectedItems: WorldInfoItem[]
  tokenUsage: {
    total: number
    character: number
    worldInfo: number
    examples: number
    context: number
    available: number
  }
  performance: {
    injectionTime: number
    tokenCalculationTime: number
    totalTime: number
  }
  warnings?: string[]
  errors?: string[]
}

// 动态长度调整配置
export interface LengthAdjustmentConfig {
  enabled: boolean
  strategy: 'truncate' | 'summarize' | 'prioritize'
  minContextMessages: number    // 最少保留的对话消息数
  maxWorldInfoEntries: number   // 最多注入的世界信息条目数
  truncateThreshold: number     // 截断阈值(token百分比)
  summaryPrompt?: string        // 摘要提示词
}

// 缓存策略配置
export interface CacheConfig {
  enabled: boolean
  ttl: number                   // 缓存时间(毫秒)
  maxSize: number               // 最大缓存条目数
  keyStrategy: 'full' | 'hash'  // 缓存键策略
}

// Prompt注入器配置
export interface PromptInjectorConfig {
  tokenBudget: TokenBudget
  lengthAdjustment: LengthAdjustmentConfig
  cache: CacheConfig
  defaultInjection: InjectionConfig
  modelFormatters: Partial<Record<AIModel, ModelFormatter>>
  performanceThreshold: number  // 性能阈值(毫秒)
  enableMetrics: boolean        // 是否启用性能指标
}

// 性能指标
export interface PerformanceMetrics {
  totalInjections: number
  averageInjectionTime: number
  cacheHitRate: number
  tokenCalculationTime: number
  worldInfoMatchTime: number
  formatTime: number
  memoryUsage: number
}

// 注入器错误类型
export class PromptInjectionError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message)
    this.name = 'PromptInjectionError'
  }
}

// Token计算结果
export interface TokenCalculationResult {
  total: number
  breakdown: {
    system: number
    character: number
    worldInfo: number
    examples: number
    context: number
  }
  model: AIModel
  estimationMethod: 'exact' | 'approximate'
  calculationTime: number
}

// 模型特定配置
export interface ModelSpecificConfig {
  openai: {
    systemMessageSupport: true
    maxTokens: 4096 | 8192 | 16384 | 32768
    tokenCalculationMethod: 'tiktoken'
    promptFormat: 'messages'
  }
  claude: {
    systemMessageSupport: false
    maxTokens: 100000
    tokenCalculationMethod: 'anthropic'
    promptFormat: 'human-assistant'
  }
  gemini: {
    systemMessageSupport: true
    maxTokens: 32768
    tokenCalculationMethod: 'google'
    promptFormat: 'parts'
  }
  grok: {
    systemMessageSupport: true
    maxTokens: 4096
    tokenCalculationMethod: 'openai-compatible'
    promptFormat: 'messages'
  }
  deepseek: {
    systemMessageSupport: true
    maxTokens: 4096
    tokenCalculationMethod: 'openai-compatible'
    promptFormat: 'messages'
  }
}

// 导出常量
export const DEFAULT_TOKEN_BUDGET: TokenBudget = {
  maxTotal: 4000,
  reserved: 1000,
  worldInfoLimit: 1000,
  characterLimit: 800,
  examplesLimit: 600,
  contextLimit: 1200
}

export const DEFAULT_INJECTION_CONFIG: InjectionConfig = {
  position: 'after_character',
  maxTokens: 1000,
  priority: 50,
  preserveOrder: true
}

export const DEFAULT_LENGTH_ADJUSTMENT: LengthAdjustmentConfig = {
  enabled: true,
  strategy: 'prioritize',
  minContextMessages: 3,
  maxWorldInfoEntries: 10,
  truncateThreshold: 0.8,
  summaryPrompt: '请总结以下内容，保持关键信息：'
}

export const MODEL_LIMITS: Record<AIModel, { maxTokens: number; contextWindow: number }> = {
  openai: { maxTokens: 4096, contextWindow: 4096 },
  claude: { maxTokens: 100000, contextWindow: 100000 },
  gemini: { maxTokens: 32768, contextWindow: 32768 },
  grok: { maxTokens: 4000, contextWindow: 4000 },
  deepseek: { maxTokens: 4096, contextWindow: 4096 }
}