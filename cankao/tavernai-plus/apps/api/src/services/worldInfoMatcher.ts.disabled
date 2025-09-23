/**
 * 世界信息匹配引擎
 * 实现高性能的关键词匹配，支持多种匹配模式和复杂逻辑操作
 */

// 临时类型定义，避免Prisma依赖问题
interface WorldInfoEntry {
  id: string
  scenarioId: string
  title: string
  content: string
  keywords: string
  priority: number
  insertDepth: number
  probability: number
  matchType: string
  caseSensitive: boolean
  isActive: boolean
  triggerOnce: boolean
  excludeRecursion: boolean
  category: string
  group: string | null
  position: string
  triggerCount: number
  createdAt: Date
  updatedAt: Date
}

// import { WorldInfoEntry, Scenario } from '@prisma/client'
import { prisma } from '../server'
import {
  MatchConfig,
  MatchResult,
  ScanContext,
  MatchStats,
  WorldInfoMatcherConfig,
  ExtendedWorldInfoEntry,
  ActivationContext,
  RecursiveScanConfig,
  PerformanceMetrics,
  WorldInfoMatcherError,
  CacheItem,
  LRUCache,
  LogicOperator,
  MatchType,
  PriorityFactors
} from '../types/worldInfo'
import {
  safeCompileRegex,
  parseSillyTavernKeywords,
  createWholeWordRegex,
  createContainsRegex,
  createStartsWithRegex,
  createEndsWithRegex,
  wildcardToRegex,
  escapeRegexChars
} from '../utils/regexHelpers'
// import { parseCharacterTags } from '../types/database'

/**
 * LRU缓存实现
 */
class MatchResultCache<K, V> implements LRUCache<K, V> {
  private cache = new Map<K, CacheItem<V>>()
  private accessOrder: K[] = []
  private maxSize: number
  private defaultTTL: number
  private statsData = { hits: 0, misses: 0 }

  constructor(maxSize = 1000, defaultTTL = 300000) { // 5分钟默认TTL
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key)
    if (!item) {
      this.statsData.misses++
      return undefined
    }

    // 检查TTL
    if (Date.now() > item.timestamp + item.ttl) {
      this.delete(key)
      this.statsData.misses++
      return undefined
    }

    this.statsData.hits++
    item.hitCount++
    this.updateAccessOrder(key)
    return item.value
  }

  set(key: K, value: V, ttl?: number): void {
    const actualTTL = ttl ?? this.defaultTTL
    const item: CacheItem<V> = {
      value,
      timestamp: Date.now(),
      ttl: actualTTL,
      hitCount: 0
    }

    if (this.cache.has(key)) {
      this.cache.set(key, item)
      this.updateAccessOrder(key)
    } else {
      if (this.cache.size >= this.maxSize) {
        this.evictLRU()
      }
      this.cache.set(key, item)
      this.accessOrder.push(key)
    }
  }

  delete(key: K): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.accessOrder = this.accessOrder.filter(k => k !== key)
    }
    return deleted
  }

  clear(): void {
    this.cache.clear()
    this.accessOrder = []
    this.statsData = { hits: 0, misses: 0 }
  }

  size(): number {
    return this.cache.size
  }

  stats(): { hits: number; misses: number; hitRate: number } {
    const total = this.statsData.hits + this.statsData.misses
    return {
      ...this.statsData,
      hitRate: total > 0 ? this.statsData.hits / total : 0
    }
  }

  private updateAccessOrder(key: K): void {
    this.accessOrder = this.accessOrder.filter(k => k !== key)
    this.accessOrder.push(key)
  }

  private evictLRU(): void {
    const oldest = this.accessOrder.shift()
    if (oldest) {
      this.cache.delete(oldest)
    }
  }
}

/**
 * 世界信息匹配引擎核心类
 */
export class WorldInfoMatcher {
  private config: WorldInfoMatcherConfig
  private cache: MatchResultCache<string, MatchResult[]>
  private keywordCache: MatchResultCache<string, boolean>
  private performanceMetrics: PerformanceMetrics
  private keywordIndex: Map<string, Set<string>> = new Map() // keyword -> entryIds

  constructor(config?: Partial<WorldInfoMatcherConfig>) {
    this.config = {
      maxRecursiveDepth: 3,
      maxActiveEntries: 20,
      performanceThreshold: 100, // 100ms阈值
      cacheConfig: {
        enabled: true,
        maxSize: 5000,
        ttl: 300000 // 5分钟
      },
      enableSemanticMatching: false,
      ...config
    }

    this.cache = new MatchResultCache(
      this.config.cacheConfig.maxSize,
      this.config.cacheConfig.ttl
    )

    this.keywordCache = new MatchResultCache(
      this.config.cacheConfig.maxSize * 2,
      this.config.cacheConfig.ttl
    )

    this.performanceMetrics = {
      totalMatchTime: 0,
      averageMatchTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      activeEntryCount: 0,
      recursiveCallCount: 0
    }
  }

  /**
   * 查找激活的世界信息条目
   */
  async findActiveEntries(
    scenarioId: string,
    context: string,
    depth: number = 1
  ): Promise<MatchResult[]> {
    const startTime = performance.now()

    try {
      // 生成缓存键
      const cacheKey = this.generateCacheKey(scenarioId, context, depth)

      // 检查缓存
      if (this.config.cacheConfig.enabled) {
        const cached = this.cache.get(cacheKey)
        if (cached) {
          this.updatePerformanceMetrics(startTime, true)
          return cached
        }
      }

      // 获取场景的世界信息条目
      const entries = await this.getWorldInfoEntries(scenarioId)
      if (entries.length === 0) {
        return []
      }

      // 扩展条目信息
      const extendedEntries = this.extendEntries(entries)

      // 构建关键词索引
      this.buildKeywordIndex(extendedEntries)

      // 执行匹配
      const matches = await this.performMatching(extendedEntries, context, depth)

      // 递归扫描
      const recursiveMatches = await this.performRecursiveScanning(
        matches,
        extendedEntries,
        context,
        depth
      )

      // 合并结果并排序
      const allMatches = [...matches, ...recursiveMatches]
      const sortedMatches = this.prioritizeMatches(allMatches)

      // 限制数量
      const finalMatches = sortedMatches.slice(0, this.config.maxActiveEntries)

      // 缓存结果
      if (this.config.cacheConfig.enabled) {
        this.cache.set(cacheKey, finalMatches)
      }

      this.updatePerformanceMetrics(startTime, false)
      return finalMatches

    } catch (error) {
      console.error('世界信息匹配错误:', error)
      throw new WorldInfoMatcherError(
        '匹配过程中发生错误',
        'MATCHING_ERROR',
        { scenarioId, context: context.substring(0, 100), error }
      )
    }
  }

  /**
   * 匹配关键词
   */
  matchKeywords(
    content: string,
    keywords: string[],
    config: MatchConfig
  ): boolean {
    if (!content || !keywords || keywords.length === 0) {
      return false
    }

    // 生成缓存键
    const cacheKey = `${content.substring(0, 100)}:${keywords.join(',')}:${JSON.stringify(config)}`

    // 检查缓存
    if (this.config.cacheConfig.enabled) {
      const cached = this.keywordCache.get(cacheKey)
      if (cached !== undefined) {
        return cached
      }
    }

    const matchResults: boolean[] = []

    for (const keyword of keywords) {
      const matched = this.matchSingleKeyword(content, keyword, config)
      matchResults.push(matched)
    }

    // 应用逻辑操作符
    const result = this.applyLogicOperator(matchResults, config.logicOperator)

    // 缓存结果
    if (this.config.cacheConfig.enabled) {
      this.keywordCache.set(cacheKey, result)
    }

    return result
  }

  /**
   * 计算优先级
   */
  calculatePriority(entry: WorldInfoEntry, matches: string[]): number {
    const factors: PriorityFactors = {
      basePriority: entry.priority,
      matchConfidence: this.calculateMatchConfidence(entry, matches),
      recentActivation: this.calculateRecentActivationBonus(entry),
      keywordStrength: this.calculateKeywordStrength(entry, matches),
      contextRelevance: this.calculateContextRelevance(entry)
    }

    // 加权计算最终优先级
    const weightedPriority = (
      factors.basePriority * 0.4 +
      factors.matchConfidence * 0.3 +
      factors.keywordStrength * 0.2 +
      factors.contextRelevance * 0.1 +
      factors.recentActivation * 0.1
    )

    return Math.max(0, Math.min(100, weightedPriority))
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const cacheStats = this.cache.stats()
    return {
      ...this.performanceMetrics,
      cacheHitRate: cacheStats.hitRate
    }
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear()
    this.keywordCache.clear()
    this.keywordIndex.clear()
  }

  /**
   * 获取世界信息条目
   */
  private async getWorldInfoEntries(scenarioId: string): Promise<WorldInfoEntry[]> {
    try {
      const entries = await prisma.worldInfoEntry.findMany({
        where: {
          scenarioId,
          isActive: true
        },
        orderBy: {
          priority: 'desc'
        }
      })

      return entries
    } catch (error) {
      console.error('获取世界信息条目失败:', error)
      return []
    }
  }

  /**
   * 扩展条目信息
   */
  private extendEntries(entries: WorldInfoEntry[]): ExtendedWorldInfoEntry[] {
    return entries.map(entry => {
      const parsedKeywords = this.parseKeywords(entry.keywords)
      const weightScore = this.calculateWeightScore(entry)

      return {
        ...entry,
        parsedKeywords,
        weightScore,
        activationCount: 0,
        compiledRegex: this.compileRegexForEntry(entry)
      } as ExtendedWorldInfoEntry
    })
  }

  /**
   * 解析关键词
   */
  private parseKeywords(keywordString: string): string[] {
    try {
      const parsed = JSON.parse(keywordString)
      if (Array.isArray(parsed)) {
        return parsed.filter(k => typeof k === 'string' && k.trim().length > 0)
      }
      return []
    } catch {
      // 如果不是JSON格式，按逗号分割
      return keywordString
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0)
    }
  }

  /**
   * 编译条目的正则表达式
   */
  private compileRegexForEntry(entry: WorldInfoEntry): RegExp[] {
    if (entry.matchType !== 'regex') {
      return []
    }

    const keywords = this.parseKeywords(entry.keywords)
    const regexes: RegExp[] = []

    for (const keyword of keywords) {
      // 如果关键词以/开头和结尾，视为正则表达式
      if (keyword.startsWith('/') && keyword.endsWith('/')) {
        const pattern = keyword.slice(1, -1)
        const regex = safeCompileRegex(
          pattern,
          entry.caseSensitive ? 'g' : 'gi'
        )
        if (regex) {
          regexes.push(regex)
        }
      } else {
        // 其他情况根据匹配类型创建正则表达式
        const regex = this.createRegexByMatchType(
          keyword,
          entry.matchType as MatchType,
          entry.caseSensitive
        )
        if (regex) {
          regexes.push(regex)
        }
      }
    }

    return regexes
  }

  /**
   * 根据匹配类型创建正则表达式
   */
  private createRegexByMatchType(
    keyword: string,
    matchType: MatchType,
    caseSensitive: boolean
  ): RegExp | null {
    const flags = caseSensitive ? 'g' : 'gi'

    switch (matchType) {
      case 'exact':
        return createWholeWordRegex(keyword, flags)
      case 'contains':
        return createContainsRegex(keyword, flags)
      case 'starts_with':
        return createStartsWithRegex(keyword, flags)
      case 'ends_with':
        return createEndsWithRegex(keyword, flags)
      case 'wildcard':
        const wildcardPattern = wildcardToRegex(keyword)
        return safeCompileRegex(wildcardPattern, flags)
      default:
        return createContainsRegex(keyword, flags)
    }
  }

  /**
   * 建立关键词索引
   */
  private buildKeywordIndex(entries: ExtendedWorldInfoEntry[]): void {
    this.keywordIndex.clear()

    for (const entry of entries) {
      for (const keyword of entry.parsedKeywords) {
        const normalizedKeyword = keyword.toLowerCase()
        if (!this.keywordIndex.has(normalizedKeyword)) {
          this.keywordIndex.set(normalizedKeyword, new Set())
        }
        this.keywordIndex.get(normalizedKeyword)!.add(entry.id)
      }
    }
  }

  /**
   * 执行匹配
   */
  private async performMatching(
    entries: ExtendedWorldInfoEntry[],
    context: string,
    depth: number
  ): Promise<MatchResult[]> {
    const matches: MatchResult[] = []

    for (const entry of entries) {
      const matchResult = this.matchEntry(entry, context)
      if (matchResult) {
        const priority = this.calculatePriority(entry, matchResult.matches)
        const insertPosition = this.calculateInsertPosition(entry, depth)

        matches.push({
          entry,
          matches: matchResult.matches,
          confidence: matchResult.confidence,
          priority,
          insertPosition
        })
      }
    }

    return matches
  }

  /**
   * 匹配单个条目
   */
  private matchEntry(
    entry: ExtendedWorldInfoEntry,
    content: string
  ): { matches: string[]; confidence: number } | null {
    const matchedKeywords: string[] = []
    let totalConfidence = 0

    // 使用SillyTavern关键词语法解析
    const parsedKeywords = parseSillyTavernKeywords(entry.keywords)

    // 精确匹配
    for (const keyword of parsedKeywords.exact) {
      if (this.testKeywordMatch(content, keyword, entry)) {
        matchedKeywords.push(keyword)
        totalConfidence += 1.0
      }
    }

    // 正则表达式匹配
    for (const regex of parsedKeywords.regex) {
      const matches = content.match(regex)
      if (matches) {
        matchedKeywords.push(...matches)
        totalConfidence += 0.9 * matches.length
      }
    }

    // 通配符匹配
    for (const regex of parsedKeywords.wildcard) {
      const matches = content.match(regex)
      if (matches) {
        matchedKeywords.push(...matches)
        totalConfidence += 0.8 * matches.length
      }
    }

    // 应用逻辑操作符
    const hasValidMatches = this.evaluateLogicOperator(
      matchedKeywords.length,
      entry.parsedKeywords.length,
      parsedKeywords.operator
    )

    if (!hasValidMatches) {
      return null
    }

    // 检查触发概率
    if (entry.probability < 1.0 && Math.random() > entry.probability) {
      return null
    }

    const confidence = Math.min(1.0, totalConfidence / entry.parsedKeywords.length)

    return {
      matches: matchedKeywords,
      confidence
    }
  }

  /**
   * 测试关键词匹配
   */
  private testKeywordMatch(
    content: string,
    keyword: string,
    entry: ExtendedWorldInfoEntry
  ): boolean {
    const flags = entry.caseSensitive ? 'g' : 'gi'
    const matchType = entry.matchType as MatchType

    const regex = this.createRegexByMatchType(keyword, matchType, entry.caseSensitive)
    if (!regex) {
      return false
    }

    return regex.test(content)
  }

  /**
   * 评估逻辑操作符
   */
  private evaluateLogicOperator(
    matchedCount: number,
    totalKeywords: number,
    operator: LogicOperator
  ): boolean {
    switch (operator) {
      case 'AND_ANY':
        return matchedCount > 0
      case 'AND_ALL':
        return matchedCount === totalKeywords
      case 'NOT_ANY':
        return matchedCount === 0
      case 'NOT_ALL':
        return matchedCount < totalKeywords
      default:
        return matchedCount > 0
    }
  }

  /**
   * 执行递归扫描
   */
  private async performRecursiveScanning(
    initialMatches: MatchResult[],
    allEntries: ExtendedWorldInfoEntry[],
    context: string,
    currentDepth: number
  ): Promise<MatchResult[]> {
    if (currentDepth >= this.config.maxRecursiveDepth) {
      return []
    }

    this.performanceMetrics.recursiveCallCount++

    const recursiveMatches: MatchResult[] = []
    const processedIds = new Set(initialMatches.map(m => m.entry.id))

    // 构建激活内容
    const activatedContent = initialMatches
      .map(m => m.entry.content)
      .join(' ')

    const combinedContent = `${context} ${activatedContent}`

    // 对剩余条目进行匹配
    const remainingEntries = allEntries.filter(e => !processedIds.has(e.id))

    for (const entry of remainingEntries) {
      const matchResult = this.matchEntry(entry, combinedContent)
      if (matchResult) {
        const priority = this.calculatePriority(entry, matchResult.matches)
        const insertPosition = this.calculateInsertPosition(entry, currentDepth + 1)

        recursiveMatches.push({
          entry,
          matches: matchResult.matches,
          confidence: matchResult.confidence,
          priority,
          insertPosition
        })

        processedIds.add(entry.id)
      }
    }

    // 继续递归（如果有新的匹配）
    if (recursiveMatches.length > 0) {
      const furtherMatches = await this.performRecursiveScanning(
        recursiveMatches,
        allEntries,
        combinedContent,
        currentDepth + 1
      )
      recursiveMatches.push(...furtherMatches)
    }

    return recursiveMatches
  }

  /**
   * 单个关键词匹配
   */
  private matchSingleKeyword(
    content: string,
    keyword: string,
    config: MatchConfig
  ): boolean {
    // SillyTavern语法支持
    if (keyword.startsWith('/') && keyword.endsWith('/')) {
      // 正则表达式模式
      const pattern = keyword.slice(1, -1)
      const regex = safeCompileRegex(
        pattern,
        config.caseSensitive ? 'g' : 'gi'
      )
      return regex ? regex.test(content) : false
    }

    // 通配符支持
    if (keyword.includes('*') || keyword.includes('?')) {
      const regexPattern = wildcardToRegex(keyword)
      const regex = safeCompileRegex(
        regexPattern,
        config.caseSensitive ? 'g' : 'gi'
      )
      return regex ? regex.test(content) : false
    }

    // 标准匹配
    const testContent = config.caseSensitive ? content : content.toLowerCase()
    const testKeyword = config.caseSensitive ? keyword : keyword.toLowerCase()

    if (config.wholeWord) {
      const regex = createWholeWordRegex(testKeyword, config.caseSensitive ? 'g' : 'gi')
      return regex ? regex.test(testContent) : false
    }

    return testContent.includes(testKeyword)
  }

  /**
   * 应用逻辑操作符
   */
  private applyLogicOperator(
    results: boolean[],
    operator: LogicOperator
  ): boolean {
    switch (operator) {
      case 'AND_ANY':
        return results.some(r => r)
      case 'AND_ALL':
        return results.every(r => r)
      case 'NOT_ANY':
        return !results.some(r => r)
      case 'NOT_ALL':
        return !results.every(r => r)
      default:
        return results.some(r => r)
    }
  }

  /**
   * 优先级排序
   */
  private prioritizeMatches(matches: MatchResult[]): MatchResult[] {
    return matches.sort((a, b) => {
      // 首先按优先级排序
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }

      // 然后按置信度排序
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence
      }

      // 最后按插入位置排序
      return a.insertPosition - b.insertPosition
    })
  }

  /**
   * 计算匹配置信度
   */
  private calculateMatchConfidence(entry: WorldInfoEntry, matches: string[]): number {
    const keywordCount = this.parseKeywords(entry.keywords).length
    if (keywordCount === 0) return 0

    const matchRatio = matches.length / keywordCount
    const baseConfidence = Math.min(1.0, matchRatio)

    // 根据匹配类型调整置信度
    const matchTypeBonus = this.getMatchTypeBonus(entry.matchType as MatchType)

    return Math.min(1.0, baseConfidence * matchTypeBonus)
  }

  /**
   * 获取匹配类型加成
   */
  private getMatchTypeBonus(matchType: MatchType): number {
    switch (matchType) {
      case 'exact': return 1.0
      case 'contains': return 0.9
      case 'regex': return 0.8
      case 'wildcard': return 0.7
      case 'starts_with': return 0.8
      case 'ends_with': return 0.8
      default: return 0.9
    }
  }

  /**
   * 计算最近激活加成
   */
  private calculateRecentActivationBonus(entry: WorldInfoEntry): number {
    // 简化实现，实际应该基于触发历史
    const now = Date.now()
    const timeSinceUpdate = now - new Date(entry.updatedAt).getTime()
    const hoursSinceUpdate = timeSinceUpdate / (1000 * 60 * 60)

    // 24小时内创建或更新的条目有小幅加成
    if (hoursSinceUpdate < 24) {
      return 5
    }

    return 0
  }

  /**
   * 计算关键词强度
   */
  private calculateKeywordStrength(entry: WorldInfoEntry, matches: string[]): number {
    const keywords = this.parseKeywords(entry.keywords)
    if (keywords.length === 0) return 0

    // 基于匹配的关键词数量和总关键词数量
    const matchRatio = matches.length / keywords.length
    return matchRatio * 100
  }

  /**
   * 计算上下文相关性
   */
  private calculateContextRelevance(entry: WorldInfoEntry): number {
    // 简化实现，可以基于分类、标签等因素
    const categoryBonus = entry.category === '重要' ? 10 : 0
    return categoryBonus
  }

  /**
   * 计算权重分数
   */
  private calculateWeightScore(entry: WorldInfoEntry): number {
    return entry.priority + (entry.probability * 10)
  }

  /**
   * 计算插入位置
   */
  private calculateInsertPosition(entry: WorldInfoEntry, depth: number): number {
    // 基于插入深度设置
    const basePosition = entry.insertDepth
    const depthAdjustment = depth * 2

    return basePosition + depthAdjustment
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(scenarioId: string, context: string, depth: number): string {
    // 使用内容的前200字符创建缓存键
    const contextHash = this.simpleHash(context.substring(0, 200))
    return `${scenarioId}:${contextHash}:${depth}`
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转为32位整数
    }
    return hash.toString(36)
  }

  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(startTime: number, fromCache: boolean): void {
    const duration = performance.now() - startTime

    if (!fromCache) {
      this.performanceMetrics.totalMatchTime += duration
      const count = this.performanceMetrics.activeEntryCount + 1
      this.performanceMetrics.averageMatchTime =
        this.performanceMetrics.totalMatchTime / count
      this.performanceMetrics.activeEntryCount = count
    }

    // 更新内存使用估算
    this.performanceMetrics.memoryUsage = this.estimateMemoryUsage()
  }

  /**
   * 估算内存使用
   */
  private estimateMemoryUsage(): number {
    const cacheSize = this.cache.size() + this.keywordCache.size()
    const indexSize = this.keywordIndex.size

    // 粗略估算，每个缓存项约1KB，索引项约100字节
    return (cacheSize * 1024) + (indexSize * 100)
  }
}

// 导出默认实例
export const worldInfoMatcher = new WorldInfoMatcher()

// 导出工具函数
export {
  MatchResultCache,
  WorldInfoMatcherError
}