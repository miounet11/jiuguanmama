/**
 * 增强的世界信息服务
 * Enhanced World Info Service
 */

const { PrismaClient } = require('../../node_modules/.prisma/client')
import { logger } from './logger'
import CacheManager from './cacheManager'

interface MatchResult {
  entry: EnhancedWorldInfoEntry
  matchedKeywords: string[]
  confidence: number
  insertPosition: number
  context: string
}

interface EnhancedWorldInfoEntry {
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
  entryType: 'knowledge' | 'description' | 'rule' | 'secret' | 'relationship' | 'history' | 'prophecy'
  relatedEntities: string[]
  visibility: 'public' | 'private' | 'conditional' | 'secret' | 'gm_only'
  conditions: Array<{
    type: string
    requirement: string
    description?: string
  }>
  sourceType: 'manual' | 'ai_generated' | 'imported' | 'collaborative' | 'template'
  lastTriggeredAt?: Date
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

interface MatchContext {
  currentLocation?: string
  presentCharacters?: string[]
  currentEvents?: string[]
  ownedItems?: string[]
  relationships?: Array<{
    entityId: string
    entityType: string
    relationship: string
  }>
  secretsKnown?: string[]
  reputation?: Record<string, number>
}

export class EnhancedWorldInfoService {
  private prisma: PrismaClient
  private cache: CacheManager
  private semanticCache: Map<string, number[]> = new Map()

  constructor(prisma: PrismaClient, cache: CacheManager) {
    this.prisma = prisma
    this.cache = cache
  }

  /**
   * 获取场景的所有世界信息条目
   */
  async getWorldInfoEntries(scenarioId: string, includeInactive = false): Promise<EnhancedWorldInfoEntry[]> {
    const cacheKey = `worldinfo:${scenarioId}:${includeInactive}`

    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    const entries = await this.prisma.worldInfoEntry.findMany({
      where: {
        scenarioId,
        ...(includeInactive ? {} : { isActive: true })
      },
      orderBy: [
        { priority: 'desc' },
        { displayOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    const enhancedEntries = entries.map(this.transformToEnhanced)
    await this.cache.set(cacheKey, JSON.stringify(enhancedEntries), 300) // 5分钟缓存

    return enhancedEntries
  }

  /**
   * 智能匹配世界信息条目
   */
  async findMatchingEntries(
    scenarioId: string,
    text: string,
    context: MatchContext = {},
    maxResults = 10
  ): Promise<MatchResult[]> {
    logger.info(`Finding matching entries for scenario ${scenarioId}`, {
      textLength: text.length,
      context: Object.keys(context)
    })

    const entries = await this.getWorldInfoEntries(scenarioId)
    const matches: MatchResult[] = []

    for (const entry of entries) {
      // 检查可见性条件
      if (!this.checkVisibility(entry, context)) {
        continue
      }

      // 检查触发条件
      if (!this.checkConditions(entry, context)) {
        continue
      }

      // 检查是否已经触发过（如果设置为只触发一次）
      if (entry.triggerOnce && entry.triggerCount > 0) {
        continue
      }

      // 执行关键词匹配
      const matchResult = await this.matchKeywords(entry, text)
      if (matchResult && Math.random() <= entry.probability) {
        matches.push(matchResult)
      }
    }

    // 按优先级和置信度排序
    matches.sort((a, b) => {
      if (a.entry.priority !== b.entry.priority) {
        return b.entry.priority - a.entry.priority
      }
      return b.confidence - a.confidence
    })

    return matches.slice(0, maxResults)
  }

  /**
   * 创建世界信息条目
   */
  async createWorldInfoEntry(
    scenarioId: string,
    userId: string,
    data: Partial<EnhancedWorldInfoEntry>
  ): Promise<EnhancedWorldInfoEntry> {
    logger.info(`Creating world info entry for scenario ${scenarioId}`, { userId })

    // 验证场景所有权
    const scenario = await this.prisma.scenario.findFirst({
      where: { id: scenarioId, userId }
    })

    if (!scenario) {
      throw new Error('Scenario not found or access denied')
    }

    const entry = await this.prisma.worldInfoEntry.create({
      data: {
        scenarioId,
        title: data.title || '',
        content: data.content || '',
        keywords: JSON.stringify(data.keywords || []),
        priority: data.priority || 0,
        insertDepth: data.insertDepth || 4,
        probability: data.probability || 1.0,
        matchType: data.matchType || 'exact',
        caseSensitive: data.caseSensitive || false,
        isActive: data.isActive !== false,
        triggerOnce: data.triggerOnce || false,
        category: data.category || '通用',
        displayOrder: data.displayOrder || 0,
        triggerCount: 0,
        entry_type: data.entryType || 'knowledge',
        related_entities: JSON.stringify(data.relatedEntities || []),
        visibility: data.visibility || 'public',
        conditions: JSON.stringify(data.conditions || []),
        source_type: data.sourceType || 'manual',
        metadata: JSON.stringify(data.metadata || {})
      }
    })

    // 清除缓存
    await this.invalidateCache(scenarioId)

    return this.transformToEnhanced(entry)
  }

  /**
   * 更新世界信息条目
   */
  async updateWorldInfoEntry(
    entryId: string,
    userId: string,
    data: Partial<EnhancedWorldInfoEntry>
  ): Promise<EnhancedWorldInfoEntry> {
    logger.info(`Updating world info entry ${entryId}`, { userId })

    // 验证权限
    const entry = await this.prisma.worldInfoEntry.findFirst({
      where: {
        id: entryId,
        scenario: { userId }
      },
      include: { scenario: true }
    })

    if (!entry) {
      throw new Error('World info entry not found or access denied')
    }

    const updated = await this.prisma.worldInfoEntry.update({
      where: { id: entryId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.keywords && { keywords: JSON.stringify(data.keywords) }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.insertDepth !== undefined && { insertDepth: data.insertDepth }),
        ...(data.probability !== undefined && { probability: data.probability }),
        ...(data.matchType && { matchType: data.matchType }),
        ...(data.caseSensitive !== undefined && { caseSensitive: data.caseSensitive }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.triggerOnce !== undefined && { triggerOnce: data.triggerOnce }),
        ...(data.category && { category: data.category }),
        ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        ...(data.entryType && { entry_type: data.entryType }),
        ...(data.relatedEntities && { related_entities: JSON.stringify(data.relatedEntities) }),
        ...(data.visibility && { visibility: data.visibility }),
        ...(data.conditions && { conditions: JSON.stringify(data.conditions) }),
        ...(data.sourceType && { source_type: data.sourceType }),
        ...(data.metadata && { metadata: JSON.stringify(data.metadata) }),
        updated_at: new Date()
      }
    })

    // 清除缓存
    await this.invalidateCache(entry.scenario_id)

    return this.transformToEnhanced(updated)
  }

  /**
   * 删除世界信息条目
   */
  async deleteWorldInfoEntry(entryId: string, userId: string): Promise<void> {
    logger.info(`Deleting world info entry ${entryId}`, { userId })

    const entry = await this.prisma.worldInfoEntry.findFirst({
      where: {
        id: entryId,
        scenario: { userId }
      },
      include: { scenario: true }
    })

    if (!entry) {
      throw new Error('World info entry not found or access denied')
    }

    await this.prisma.worldInfoEntry.delete({
      where: { id: entryId }
    })

    // 清除缓存
    await this.invalidateCache(entry.scenario_id)
  }

  /**
   * 批量重新排序条目
   */
  async reorderEntries(
    scenarioId: string,
    userId: string,
    entryOrders: Array<{ id: string; displayOrder: number }>
  ): Promise<void> {
    logger.info(`Reordering entries for scenario ${scenarioId}`, { userId, count: entryOrders.length })

    // 验证场景所有权
    const scenario = await this.prisma.scenario.findFirst({
      where: { id: scenarioId, userId }
    })

    if (!scenario) {
      throw new Error('Scenario not found or access denied')
    }

    // 批量更新
    await Promise.all(
      entryOrders.map(({ id, displayOrder }) =>
        this.prisma.worldInfoEntry.update({
          where: { id },
          data: { displayOrder, updated_at: new Date() }
        })
      )
    )

    // 清除缓存
    await this.invalidateCache(scenarioId)
  }

  /**
   * 记录条目触发
   */
  async recordTrigger(entryId: string): Promise<void> {
    await this.prisma.worldInfoEntry.update({
      where: { id: entryId },
      data: {
        triggerCount: { increment: 1 },
        last_triggered_at: new Date()
      }
    })
  }

  /**
   * 智能生成相关条目
   */
  async generateRelatedEntries(
    scenarioId: string,
    userId: string,
    sourceEntryId: string,
    count = 3
  ): Promise<EnhancedWorldInfoEntry[]> {
    logger.info(`Generating related entries for ${sourceEntryId}`, { count })

    const sourceEntry = await this.prisma.worldInfoEntry.findFirst({
      where: {
        id: sourceEntryId,
        scenario: { userId }
      }
    })

    if (!sourceEntry) {
      throw new Error('Source entry not found or access denied')
    }

    // 这里可以集成AI生成服务
    // 暂时返回空数组，等待AI服务集成
    return []
  }

  /**
   * 测试关键词匹配
   */
  async testKeywordMatching(
    scenarioId: string,
    testText: string,
    userId: string
  ): Promise<{
    matches: MatchResult[]
    coverage: number
    suggestions: string[]
  }> {
    logger.info(`Testing keyword matching for scenario ${scenarioId}`, { userId })

    const matches = await this.findMatchingEntries(scenarioId, testText)

    // 计算覆盖率
    const totalEntries = await this.prisma.worldInfoEntry.count({
      where: { scenarioId, isActive: true }
    })
    const coverage = totalEntries > 0 ? (matches.length / totalEntries) * 100 : 0

    // 生成改进建议
    const suggestions = this.generateMatchingSuggestions(matches, testText)

    return { matches, coverage, suggestions }
  }

  /**
   * 私有方法：检查可见性条件
   */
  private checkVisibility(entry: EnhancedWorldInfoEntry, context: MatchContext): boolean {
    switch (entry.visibility) {
      case 'public':
        return true
      case 'private':
      case 'gm_only':
        return false // 需要GM权限检查，这里暂时返回false
      case 'conditional':
        return this.checkConditions(entry, context)
      case 'secret':
        return context.secretsKnown?.includes(entry.id) || false
      default:
        return true
    }
  }

  /**
   * 私有方法：检查触发条件
   */
  private checkConditions(entry: EnhancedWorldInfoEntry, context: MatchContext): boolean {
    if (!entry.conditions || entry.conditions.length === 0) {
      return true
    }

    return entry.conditions.every(condition => {
      switch (condition.type) {
        case 'character_present':
          return context.presentCharacters?.includes(condition.requirement) || false
        case 'location_current':
          return context.currentLocation === condition.requirement
        case 'event_occurred':
          return context.currentEvents?.includes(condition.requirement) || false
        case 'item_owned':
          return context.ownedItems?.includes(condition.requirement) || false
        case 'relationship_exists':
          return context.relationships?.some(rel =>
            rel.entityId === condition.requirement
          ) || false
        default:
          return true
      }
    })
  }

  /**
   * 私有方法：关键词匹配
   */
  private async matchKeywords(entry: EnhancedWorldInfoEntry, text: string): Promise<MatchResult | null> {
    const keywords = entry.keywords
    if (!keywords || keywords.length === 0) {
      return null
    }

    let matchedKeywords: string[] = []
    let totalConfidence = 0

    const searchText = entry.caseSensitive ? text : text.toLowerCase()

    for (const keyword of keywords) {
      const searchKeyword = entry.caseSensitive ? keyword : keyword.toLowerCase()
      let confidence = 0

      switch (entry.matchType) {
        case 'exact':
          if (searchText.includes(searchKeyword)) {
            confidence = 1.0
            matchedKeywords.push(keyword)
          }
          break

        case 'partial':
          const similarity = this.calculateStringSimilarity(searchKeyword, searchText)
          if (similarity > 0.7) {
            confidence = similarity
            matchedKeywords.push(keyword)
          }
          break

        case 'regex':
          try {
            const regex = new RegExp(searchKeyword, entry.caseSensitive ? 'g' : 'gi')
            if (regex.test(searchText)) {
              confidence = 0.9
              matchedKeywords.push(keyword)
            }
          } catch (error) {
            logger.warn(`Invalid regex pattern: ${searchKeyword}`, { error })
          }
          break

        case 'semantic':
          // 语义匹配需要AI服务支持，暂时使用简单的词汇相似度
          confidence = this.calculateSemanticSimilarity(searchKeyword, searchText)
          if (confidence > 0.6) {
            matchedKeywords.push(keyword)
          }
          break
      }

      totalConfidence += confidence
    }

    if (matchedKeywords.length === 0) {
      return null
    }

    const avgConfidence = totalConfidence / keywords.length
    const insertPosition = Math.max(0, text.length - entry.insertDepth * 100)

    return {
      entry,
      matchedKeywords,
      confidence: avgConfidence,
      insertPosition,
      context: text.substring(Math.max(0, insertPosition - 50), insertPosition + 50)
    }
  }

  /**
   * 私有方法：计算字符串相似度
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) {
      return 1.0
    }

    const editDistance = this.calculateLevenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  /**
   * 私有方法：计算编辑距离
   */
  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[j][i] = matrix[j - 1][i - 1]
        } else {
          matrix[j][i] = Math.min(
            matrix[j - 1][i - 1] + 1, // substitution
            matrix[j][i - 1] + 1,     // insertion
            matrix[j - 1][i] + 1      // deletion
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * 私有方法：计算语义相似度（简化版）
   */
  private calculateSemanticSimilarity(keyword: string, text: string): number {
    // 这是一个简化的语义相似度计算
    // 在实际应用中应该使用词向量模型或其他NLP技术
    const keywordWords = keyword.toLowerCase().split(/\s+/)
    const textWords = text.toLowerCase().split(/\s+/)

    let matches = 0
    for (const word of keywordWords) {
      if (textWords.some(textWord => textWord.includes(word) || word.includes(textWord))) {
        matches++
      }
    }

    return matches / keywordWords.length
  }

  /**
   * 私有方法：生成匹配建议
   */
  private generateMatchingSuggestions(matches: MatchResult[], testText: string): string[] {
    const suggestions: string[] = []

    if (matches.length === 0) {
      suggestions.push('尝试添加更多通用关键词以提高匹配率')
      suggestions.push('考虑使用部分匹配或正则表达式匹配')
    } else if (matches.length < 3) {
      suggestions.push('可以添加更多相关的世界信息条目')
      suggestions.push('考虑降低某些条目的触发概率以减少冗余')
    }

    const lowConfidenceMatches = matches.filter(m => m.confidence < 0.5)
    if (lowConfidenceMatches.length > 0) {
      suggestions.push('一些条目的关键词匹配度较低，建议优化关键词设置')
    }

    return suggestions
  }

  /**
   * 私有方法：转换数据库记录为增强接口
   */
  private transformToEnhanced(entry: any): EnhancedWorldInfoEntry {
    return {
      id: entry.id,
      scenarioId: entry.scenario_id,
      title: entry.title,
      content: entry.content,
      keywords: JSON.parse(entry.keywords || '[]'),
      priority: entry.priority,
      insertDepth: entry.insertDepth,
      probability: entry.probability,
      matchType: entry.matchType as any,
      caseSensitive: entry.caseSensitive,
      isActive: entry.isActive,
      triggerOnce: entry.triggerOnce,
      category: entry.category,
      displayOrder: entry.displayOrder,
      triggerCount: entry.triggerCount,
      entryType: entry.entry_type as any || 'knowledge',
      relatedEntities: JSON.parse(entry.related_entities || '[]'),
      visibility: entry.visibility as any || 'public',
      conditions: JSON.parse(entry.conditions || '[]'),
      sourceType: entry.source_type as any || 'manual',
      lastTriggeredAt: entry.last_triggered_at,
      metadata: JSON.parse(entry.metadata || '{}'),
      createdAt: entry.created_at,
      updatedAt: entry.updated_at
    }
  }

  /**
   * 私有方法：清除缓存
   */
  private async invalidateCache(scenarioId: string): Promise<void> {
    const keys = [
      `worldinfo:${scenarioId}:true`,
      `worldinfo:${scenarioId}:false`
    ]

    await Promise.all(keys.map(key => this.cache.delete(key)))
  }
}

export default EnhancedWorldInfoService
