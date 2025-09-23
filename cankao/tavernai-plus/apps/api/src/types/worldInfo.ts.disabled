/**
 * 世界信息系统类型定义
 * 支持情景剧本与世界信息系统的完整功能
 */

import { Scenario, WorldInfoEntry } from '@prisma/client'

// 匹配配置接口
export interface MatchConfig {
  matchType: 'keyword' | 'regex' | 'semantic'
  caseSensitive: boolean
  wholeWord: boolean
  logicOperator: 'AND_ANY' | 'AND_ALL' | 'NOT_ANY' | 'NOT_ALL'
}

// 关键词匹配策略类型
export type MatchType = 'exact' | 'contains' | 'regex' | 'starts_with' | 'ends_with' | 'wildcard'

// 逻辑操作符类型
export type LogicOperator = 'AND_ANY' | 'AND_ALL' | 'NOT_ANY' | 'NOT_ALL'

// 匹配结果接口
export interface MatchResult {
  entry: WorldInfoEntry
  matches: string[]
  confidence: number
  priority: number
  insertPosition: number
}

// 扫描上下文接口
export interface ScanContext {
  messages: Array<{ role: string; content: string }>
  currentDepth: number
  activatedEntries: Set<string>
  recursiveDepth: number
}

// 匹配统计接口
export interface MatchStats {
  totalScanned: number
  totalMatched: number
  averageConfidence: number
  performance: {
    scanTime: number
    matchTime: number
    totalTime: number
  }
}

// 缓存配置接口
export interface CacheConfig {
  enabled: boolean
  maxSize: number
  ttl: number // 时间到生存期，毫秒
}

// 世界信息匹配器配置接口
export interface WorldInfoMatcherConfig {
  maxRecursiveDepth: number
  maxActiveEntries: number
  performanceThreshold: number // 匹配延迟阈值（毫秒）
  cacheConfig: CacheConfig
  enableSemanticMatching: boolean
}

// 扩展的世界信息条目类型
export interface ExtendedWorldInfoEntry extends WorldInfoEntry {
  // 解析后的关键词数组
  parsedKeywords: string[]
  // 编译后的正则表达式（如果使用正则匹配）
  compiledRegex?: RegExp[]
  // 权重分数（基于优先级和其他因素计算）
  weightScore: number
  // 最后激活时间
  lastActivated?: Date
  // 激活次数统计
  activationCount: number
}

// SillyTavern兼容的关键词语法
export interface SillyTavernKeywordSyntax {
  // 基础关键词
  keywords: string[]
  // 正则表达式模式
  regexPatterns: string[]
  // 通配符模式
  wildcardPatterns: string[]
  // 逻辑操作符
  logicOperator: LogicOperator
  // 是否区分大小写
  caseSensitive: boolean
  // 是否匹配整词
  wholeWordOnly: boolean
}

// 关键词解析结果
export interface ParsedKeywords {
  exact: string[]
  regex: RegExp[]
  wildcard: string[]
  operator: LogicOperator
  options: {
    caseSensitive: boolean
    wholeWord: boolean
  }
}

// 世界信息激活上下文
export interface ActivationContext {
  scenarioId: string
  userId?: string
  sessionId?: string
  messageHistory: Array<{ role: string; content: string; timestamp: Date }>
  currentMessage: string
  depth: number
  metadata?: Record<string, any>
}

// 递归扫描配置
export interface RecursiveScanConfig {
  maxDepth: number
  allowCycles: boolean
  priorityThreshold: number
  confidenceThreshold: number
}

// 插入位置策略
export type InsertionPosition = 'before' | 'after' | 'replace' | 'priority_based'

// 优先级计算因子
export interface PriorityFactors {
  basePriority: number
  matchConfidence: number
  recentActivation: number
  keywordStrength: number
  contextRelevance: number
}

// 性能监控指标
export interface PerformanceMetrics {
  totalMatchTime: number
  averageMatchTime: number
  cacheHitRate: number
  memoryUsage: number
  activeEntryCount: number
  recursiveCallCount: number
}

// 匹配器错误类型
export class WorldInfoMatcherError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message)
    this.name = 'WorldInfoMatcherError'
  }
}

// 缓存项接口
export interface CacheItem<T> {
  value: T
  timestamp: number
  ttl: number
  hitCount: number
}

// LRU缓存接口
export interface LRUCache<K, V> {
  get(key: K): V | undefined
  set(key: K, value: V, ttl?: number): void
  delete(key: K): boolean
  clear(): void
  size(): number
  stats(): {
    hits: number
    misses: number
    hitRate: number
  }
}

// 关键词索引接口
export interface KeywordIndex {
  keyword: string
  entryIds: string[]
  frequency: number
  lastUpdated: Date
}

// 正则表达式缓存项
export interface RegexCacheItem {
  pattern: string
  regex: RegExp
  flags: string
  compiled: Date
}

// 验证函数类型
export type ValidationFunction<T> = (value: T) => boolean | string

// 世界信息条目验证规则
export interface WorldInfoEntryValidation {
  title: ValidationFunction<string>
  content: ValidationFunction<string>
  keywords: ValidationFunction<string>
  priority: ValidationFunction<number>
  matchType: ValidationFunction<string>
}

// 统计报告接口
export interface MatchingStatsReport {
  timeRange: {
    start: Date
    end: Date
  }
  totalMatches: number
  topMatchedEntries: Array<{
    entryId: string
    title: string
    matchCount: number
    averageConfidence: number
  }>
  performanceMetrics: PerformanceMetrics
  errorCount: number
  cacheEfficiency: number
}

// 导出所有类型
export {
  Scenario,
  WorldInfoEntry
}