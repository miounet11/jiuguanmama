const { PrismaClient } = require('../../node_modules/.prisma/client')
import { performance } from 'perf_hooks'

const prisma = new PrismaClient()

// 推荐算法类型
export type RecommendationType = 'character' | 'post' | 'user' | 'creator'

// 推荐配置
interface RecommendationConfig {
  algorithm: 'collaborative' | 'content' | 'hybrid'
  maxResults: number
  diversityWeight: number
  freshnessWeight: number
  popularityWeight: number
  personalWeight: number
}

// 用户行为权重
const BEHAVIOR_WEIGHTS = {
  view: 1,
  like: 3,
  comment: 5,
  share: 4,
  favorite: 6,
  download: 7,
  chat: 8,
  follow: 10
}

// 时间衰减因子
const TIME_DECAY_FACTOR = 0.1 // 每天衰减10%

/**
 * 智能推荐引擎
 * 支持多种推荐算法和实时个性化推荐
 */
export class RecommendationEngine {
  private userProfiles: Map<string, any> = new Map()
  private itemVectors: Map<string, number[]> = new Map()
  private userSimilarities: Map<string, Map<string, number>> = new Map()
  private config: RecommendationConfig = {
    algorithm: 'hybrid',
    maxResults: 20,
    diversityWeight: 0.3,
    freshnessWeight: 0.2,
    popularityWeight: 0.2,
    personalWeight: 0.3
  }

  constructor() {
    this.initializeEngine()
  }

  /**
   * 初始化推荐引擎
   */
  private async initializeEngine(): Promise<void> {
    console.log('🚀 初始化推荐引擎...')

    try {
      // 加载用户画像
      await this.loadUserProfiles()

      // 构建物品特征向量
      await this.buildItemVectors()

      // 计算用户相似度
      await this.computeUserSimilarities()

      console.log('✅ 推荐引擎初始化完成')
    } catch (error) {
      console.error('❌ 推荐引擎初始化失败:', error)
    }
  }

  /**
   * 获取角色推荐
   */
  async getCharacterRecommendations(
    userId: string,
    options: Partial<RecommendationConfig> = {}
  ): Promise<{
    characters: any[]
    algorithm: string
    confidence: number
    explanation: string[]
  }> {
    const startTime = performance.now()
    const config = { ...this.config, ...options }

    try {
      let recommendations: any[] = []
      let explanation: string[] = []

      // 获取用户历史行为
      const userBehavior = await this.getUserBehaviorData(userId, 'character')

      if (userBehavior.length === 0) {
        // 冷启动：推荐热门角色
        recommendations = await this.getColdStartCharacterRecommendations()
        explanation.push('基于热门角色推荐（新用户）')
      } else {
        switch (config.algorithm) {
          case 'collaborative':
            recommendations = await this.getCollaborativeCharacterRecommendations(userId)
            explanation.push('基于相似用户的协同过滤推荐')
            break

          case 'content':
            recommendations = await this.getContentBasedCharacterRecommendations(userId)
            explanation.push('基于角色特征的内容推荐')
            break

          case 'hybrid':
            const collaborative = await this.getCollaborativeCharacterRecommendations(userId)
            const contentBased = await this.getContentBasedCharacterRecommendations(userId)
            recommendations = this.hybridMerge(collaborative, contentBased, config)
            explanation.push('混合推荐算法（协同过滤 + 内容推荐）')
            break
        }
      }

      // 应用多样性和新鲜度过滤
      recommendations = this.applyDiversityFilter(recommendations, config.diversityWeight)
      recommendations = this.applyFreshnessFilter(recommendations, config.freshnessWeight)

      // 限制结果数量
      recommendations = recommendations.slice(0, config.maxResults)

      // 记录推荐日志
      await this.logRecommendation(userId, 'character', recommendations.map((r: any) => r.id), config.algorithm)

      const confidence = this.calculateConfidence(recommendations, userBehavior.length)
      const duration = performance.now() - startTime

      console.log(`角色推荐完成: ${duration.toFixed(2)}ms, ${recommendations.length}个结果`)

      return {
        characters: recommendations,
        algorithm: config.algorithm,
        confidence,
        explanation
      }

    } catch (error) {
      console.error('角色推荐失败:', error)
      throw new Error('推荐系统暂时不可用')
    }
  }

  /**
   * 获取社区动态推荐
   */
  async getPostRecommendations(
    userId: string,
    options: Partial<RecommendationConfig> = {}
  ): Promise<{
    posts: any[]
    algorithm: string
    confidence: number
    explanation: string[]
  }> {
    const startTime = performance.now()
    const config = { ...this.config, ...options }

    try {
      let recommendations: any[] = []
      let explanation: string[] = []

      // 获取用户兴趣标签
      const userInterests = await this.getUserInterests(userId)

      // 获取关注用户的动态
      const followingPosts = await this.getFollowingPosts(userId)

      // 获取基于兴趣的推荐
      const interestBasedPosts = await this.getInterestBasedPosts(userId, userInterests)

      // 获取热门动态
      const trendingPosts = await this.getTrendingPosts()

      // 混合推荐
      recommendations = this.mergePostRecommendations([
        { posts: followingPosts, weight: 0.4 },
        { posts: interestBasedPosts, weight: 0.4 },
        { posts: trendingPosts, weight: 0.2 }
      ])

      explanation.push('基于关注用户、兴趣标签和热门内容的混合推荐')

      // 去重和过滤
      recommendations = this.deduplicatePosts(recommendations)
      recommendations = this.filterSeenPosts(userId, recommendations)

      // 应用时间衰减
      recommendations = this.applyTimeDecay(recommendations)

      // 限制结果数量
      recommendations = recommendations.slice(0, config.maxResults)

      // 记录推荐日志
      await this.logRecommendation(userId, 'post', recommendations.map(r => r.id), 'hybrid')

      const confidence = this.calculateConfidence(recommendations, userInterests.length)
      const duration = performance.now() - startTime

      console.log(`动态推荐完成: ${duration.toFixed(2)}ms, ${recommendations.length}个结果`)

      return {
        posts: recommendations,
        algorithm: 'hybrid',
        confidence,
        explanation
      }

    } catch (error) {
      console.error('动态推荐失败:', error)
      throw new Error('推荐系统暂时不可用')
    }
  }

  /**
   * 获取用户推荐
   */
  async getUserRecommendations(
    userId: string,
    options: Partial<RecommendationConfig> = {}
  ): Promise<{
    users: any[]
    algorithm: string
    confidence: number
    explanation: string[]
  }> {
    const startTime = performance.now()
    const config = { ...this.config, ...options }

    try {
      let recommendations: any[] = []
      let explanation: string[] = []

      // 获取相似用户
      const similarUsers = await this.getSimilarUsers(userId)

      // 获取共同兴趣用户
      const commonInterestUsers = await this.getCommonInterestUsers(userId)

      // 获取热门创作者
      const popularCreators = await this.getPopularCreators()

      // 混合推荐
      recommendations = this.mergeUserRecommendations([
        { users: similarUsers, weight: 0.5 },
        { users: commonInterestUsers, weight: 0.3 },
        { users: popularCreators, weight: 0.2 }
      ])

      explanation.push('基于相似行为、共同兴趣和热门创作者的用户推荐')

      // 过滤已关注用户
      recommendations = await this.filterFollowedUsers(userId, recommendations)

      // 限制结果数量
      recommendations = recommendations.slice(0, config.maxResults)

      // 记录推荐日志
      await this.logRecommendation(userId, 'user', recommendations.map(r => r.id), 'hybrid')

      const confidence = this.calculateConfidence(recommendations, similarUsers.length)
      const duration = performance.now() - startTime

      console.log(`用户推荐完成: ${duration.toFixed(2)}ms, ${recommendations.length}个结果`)

      return {
        users: recommendations,
        algorithm: 'hybrid',
        confidence,
        explanation
      }

    } catch (error) {
      console.error('用户推荐失败:', error)
      throw new Error('推荐系统暂时不可用')
    }
  }

  /**
   * 记录用户行为
   */
  async recordUserBehavior(
    userId: string,
    action: string,
    targetType: string,
    targetId: string,
    metadata?: any
  ): Promise<void> {
    try {
      // 记录到数据库
      await prisma.userBehavior.create({
        data: {
          userId,
          action,
          targetType,
          targetId,
          weight: BEHAVIOR_WEIGHTS[action as keyof typeof BEHAVIOR_WEIGHTS] || 1,
          metadata: metadata ? JSON.stringify(metadata) : null,
          createdAt: new Date()
        }
      })

      // 实时更新用户画像
      await this.updateUserProfile(userId, action, targetType, targetId)

    } catch (error) {
      console.error('记录用户行为失败:', error)
    }
  }

  /**
   * 获取推荐解释
   */
  async getRecommendationExplanation(
    userId: string,
    itemId: string,
    itemType: string
  ): Promise<{
    reasons: string[]
    confidence: number
    factors: { [key: string]: number }
  }> {
    try {
      const reasons: string[] = []
      const factors: { [key: string]: number } = {}

      // 分析推荐原因
      if (itemType === 'character') {
        // 检查相似用户偏好
        const similarUsers = this.userSimilarities.get(userId)
        if (similarUsers && similarUsers.size > 0) {
          reasons.push('与您相似的用户也喜欢这个角色')
          factors.collaborative = 0.6
        }

        // 检查内容相似性
        const userProfile = this.userProfiles.get(userId)
        if (userProfile) {
          const character = await prisma.character.findUnique({
            where: { id: itemId }
          })

          if (character) {
            const similarity = this.calculateContentSimilarity(userProfile.preferences, character)
            if (similarity > 0.7) {
              reasons.push('这个角色符合您的兴趣偏好')
              factors.content = similarity
            }
          }
        }

        // 检查热门程度
        const character = await prisma.character.findUnique({
          where: { id: itemId },
          select: { rating: true, favoriteCount: true, chatCount: true }
        })

        if (character && character.rating > 4.0) {
          reasons.push('这是一个高评分的热门角色')
          factors.popularity = character.rating / 5
        }
      }

      const confidence = Object.values(factors).reduce((sum, value) => sum + value, 0) / Object.keys(factors).length

      return {
        reasons,
        confidence,
        factors
      }

    } catch (error) {
      console.error('获取推荐解释失败:', error)
      return {
        reasons: ['基于您的使用习惯推荐'],
        confidence: 0.5,
        factors: { default: 0.5 }
      }
    }
  }

  /**
   * 获取推荐统计
   */
  async getRecommendationStats(timeRange?: { start: Date; end: Date }): Promise<{
    totalRecommendations: number
    clickThroughRate: number
    conversionRate: number
    userEngagement: number
    algorithmPerformance: { [key: string]: number }
    topRecommendedItems: any[]
  }> {
    try {
      const where: any = {}
      if (timeRange) {
        where.createdAt = {
          gte: timeRange.start,
          lte: timeRange.end
        }
      }

      // 总推荐数
      const totalRecommendations = await prisma.recommendationLog.count({ where })

      // 点击率
      const clickedRecommendations = await prisma.recommendationLog.count({
        where: {
          ...where,
          clicked: true
        }
      })
      const clickThroughRate = totalRecommendations > 0 ? clickedRecommendations / totalRecommendations : 0

      // 转化率（行动率）
      const convertedRecommendations = await prisma.recommendationLog.count({
        where: {
          ...where,
          converted: true
        }
      })
      const conversionRate = totalRecommendations > 0 ? convertedRecommendations / totalRecommendations : 0

      // 用户参与度
      const uniqueUsers = await prisma.recommendationLog.groupBy({
        by: ['userId'],
        where,
        _count: true
      })
      const userEngagement = uniqueUsers.length

      // 算法性能
      const algorithmStats = await prisma.recommendationLog.groupBy({
        by: ['algorithm'],
        where,
        _count: true,
        _avg: {
          confidence: true
        }
      })

      const algorithmPerformance: { [key: string]: number } = {}
      algorithmStats.forEach(stat => {
        algorithmPerformance[stat.algorithm] = stat._avg.confidence || 0
      })

      // 热门推荐物品
      const topItems = await prisma.recommendationLog.groupBy({
        by: ['targetId'],
        where,
        _count: true,
        orderBy: {
          _count: {
            targetId: 'desc'
          }
        },
        take: 10
      })

      const topRecommendedItems = await Promise.all(
        topItems.map(async (item) => {
          const character = await prisma.character.findUnique({
            where: { id: item.targetId },
            select: { id: true, name: true, avatar: true, rating: true }
          })
          return {
            ...character,
            recommendationCount: item._count
          }
        })
      )

      return {
        totalRecommendations,
        clickThroughRate,
        conversionRate,
        userEngagement,
        algorithmPerformance,
        topRecommendedItems: topRecommendedItems.filter(Boolean)
      }

    } catch (error) {
      console.error('获取推荐统计失败:', error)
      throw new Error('统计数据获取失败')
    }
  }

  // ========== 私有方法 ==========

  /**
   * 加载用户画像
   */
  private async loadUserProfiles(): Promise<void> {
    try {
      const profiles = await prisma.userProfile.findMany({
        include: {
          user: {
            select: { id: true, username: true }
          }
        }
      })

      profiles.forEach(profile => {
        this.userProfiles.set(profile.userId, {
          interests: JSON.parse(profile.interests || '[]'),
          preferences: JSON.parse(profile.preferences || '{}'),
          demographics: JSON.parse(profile.demographics || '{}'),
          behavior: JSON.parse(profile.behaviorPattern || '{}')
        })
      })

      console.log(`加载了 ${profiles.length} 个用户画像`)
    } catch (error) {
      console.error('加载用户画像失败:', error)
    }
  }

  /**
   * 构建物品特征向量
   */
  private async buildItemVectors(): Promise<void> {
    try {
      // 构建角色特征向量
      const characters = await prisma.character.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          personality: true,
          category: true,
          tags: true,
          rating: true,
          favoriteCount: true,
          chatCount: true
        }
      })

      characters.forEach(character => {
        const vector = this.extractCharacterFeatures(character)
        this.itemVectors.set(character.id, vector)
      })

      console.log(`构建了 ${characters.length} 个角色特征向量`)
    } catch (error) {
      console.error('构建物品特征向量失败:', error)
    }
  }

  /**
   * 计算用户相似度
   */
  private async computeUserSimilarities(): Promise<void> {
    try {
      // 获取用户行为数据
      const users = await prisma.user.findMany({
        select: { id: true },
        take: 1000 // 限制计算量
      })

      // 计算用户-物品评分矩阵
      const userItemMatrix = new Map<string, Map<string, number>>()

      for (const user of users) {
        const behaviors = await prisma.userBehavior.findMany({
          where: { userId: user.id },
          select: { targetId: true, action: true, weight: true }
        })

        const userRatings = new Map<string, number>()
        behaviors.forEach(behavior => {
          const currentRating = userRatings.get(behavior.targetId) || 0
          userRatings.set(behavior.targetId, currentRating + behavior.weight)
        })

        userItemMatrix.set(user.id, userRatings)
      }

      // 计算用户间相似度（余弦相似度）
      for (const userId1 of users.map(u => u.id)) {
        const similarities = new Map<string, number>()

        for (const userId2 of users.map(u => u.id)) {
          if (userId1 !== userId2) {
            const similarity = this.calculateCosineSimilarity(
              userItemMatrix.get(userId1) || new Map(),
              userItemMatrix.get(userId2) || new Map()
            )

            if (similarity > 0.1) { // 只保存有意义的相似度
              similarities.set(userId2, similarity)
            }
          }
        }

        this.userSimilarities.set(userId1, similarities)
      }

      console.log(`计算了 ${users.length} 个用户的相似度`)
    } catch (error) {
      console.error('计算用户相似度失败:', error)
    }
  }

  /**
   * 提取角色特征
   */
  private extractCharacterFeatures(character: any): number[] {
    const features: number[] = []

    // 文本特征（简化的TF-IDF）
    const text = `${character.name} ${character.description} ${character.personality}`.toLowerCase()
    const words = text.split(/\s+/)
    const wordCounts = new Map<string, number>()

    words.forEach(word => {
      if (word.length > 2) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
      }
    })

    // 取最常见的50个词作为特征
    const topWords = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word, count]) => count)

    features.push(...topWords)

    // 数值特征
    features.push(
      character.rating || 0,
      Math.log(character.favoriteCount + 1),
      Math.log(character.chatCount + 1)
    )

    // 分类特征（one-hot编码）
    const categories = ['原创', '动漫', '游戏', '小说', '影视', '历史', '其他']
    categories.forEach(cat => {
      features.push(character.category === cat ? 1 : 0)
    })

    return features
  }

  /**
   * 计算余弦相似度
   */
  private calculateCosineSimilarity(
    ratings1: Map<string, number>,
    ratings2: Map<string, number>
  ): number {
    const items1 = new Set(ratings1.keys())
    const items2 = new Set(ratings2.keys())
    const commonItems = new Set([...items1].filter(x => items2.has(x)))

    if (commonItems.size === 0) return 0

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (const item of commonItems) {
      const rating1 = ratings1.get(item) || 0
      const rating2 = ratings2.get(item) || 0

      dotProduct += rating1 * rating2
      norm1 += rating1 * rating1
      norm2 += rating2 * rating2
    }

    if (norm1 === 0 || norm2 === 0) return 0

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  /**
   * 协同过滤角色推荐
   */
  private async getCollaborativeCharacterRecommendations(userId: string): Promise<any[]> {
    const similarities = this.userSimilarities.get(userId)
    if (!similarities || similarities.size === 0) {
      return this.getColdStartCharacterRecommendations()
    }

    // 获取相似用户喜欢的角色
    const recommendations = new Map<string, number>()

    for (const [similarUserId, similarity] of similarities.entries()) {
      const behaviors = await prisma.userBehavior.findMany({
        where: {
          userId: similarUserId,
          targetType: 'character',
          action: { in: ['like', 'favorite', 'chat'] }
        },
        select: { targetId: true, weight: true }
      })

      behaviors.forEach(behavior => {
        const score = (recommendations.get(behavior.targetId) || 0) +
                     (behavior.weight * similarity)
        recommendations.set(behavior.targetId, score)
      })
    }

    // 排序并获取角色详情
    const sortedIds = Array.from(recommendations.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
      .slice(0, 50)

    const characters = await prisma.character.findMany({
      where: {
        id: { in: sortedIds },
        isPublic: true
      },
      include: {
        creator: {
          select: { id: true, username: true, avatar: true }
        },
        _count: {
          select: { favorites: true, chatSessions: true }
        }
      }
    })

    // 按推荐分数排序
    return characters.sort((a, b) => {
      const scoreA = recommendations.get(a.id) || 0
      const scoreB = recommendations.get(b.id) || 0
      return scoreB - scoreA
    })
  }

  /**
   * 基于内容的角色推荐
   */
  private async getContentBasedCharacterRecommendations(userId: string): Promise<any[]> {
    const userProfile = this.userProfiles.get(userId)
    if (!userProfile) {
      return this.getColdStartCharacterRecommendations()
    }

    // 获取用户互动过的角色
    const userBehaviors = await prisma.userBehavior.findMany({
      where: {
        userId,
        targetType: 'character',
        action: { in: ['like', 'favorite', 'chat'] }
      },
      select: { targetId: true, weight: true }
    })

    if (userBehaviors.length === 0) {
      return this.getColdStartCharacterRecommendations()
    }

    // 计算用户偏好向量
    const userVector = this.calculateUserPreferenceVector(userBehaviors)

    // 计算与所有角色的相似度
    const similarities: Array<{ id: string; score: number }> = []

    for (const [characterId, characterVector] of this.itemVectors.entries()) {
      if (!userBehaviors.find(b => b.targetId === characterId)) {
        const similarity = this.calculateVectorSimilarity(userVector, characterVector)
        similarities.push({ id: characterId, score: similarity })
      }
    }

    // 排序并获取角色详情
    const topIds = similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
      .map(s => s.id)

    const characters = await prisma.character.findMany({
      where: {
        id: { in: topIds },
        isPublic: true
      },
      include: {
        creator: {
          select: { id: true, username: true, avatar: true }
        },
        _count: {
          select: { favorites: true, chatSessions: true }
        }
      }
    })

    // 按相似度分数排序
    return characters.sort((a, b) => {
      const scoreA = similarities.find(s => s.id === a.id)?.score || 0
      const scoreB = similarities.find(s => s.id === b.id)?.score || 0
      return scoreB - scoreA
    })
  }

  /**
   * 冷启动角色推荐
   */
  private async getColdStartCharacterRecommendations(): Promise<any[]> {
    return prisma.character.findMany({
      where: {
        isPublic: true,
        isFeatured: true
      },
      include: {
        creator: {
          select: { id: true, username: true, avatar: true }
        },
        _count: {
          select: { favorites: true, chatSessions: true }
        }
      },
      orderBy: [
        { rating: 'desc' },
        { favoriteCount: 'desc' },
        { chatCount: 'desc' }
      ],
      take: 20
    })
  }

  /**
   * 混合推荐合并
   */
  private hybridMerge(
    collaborative: any[],
    contentBased: any[],
    config: RecommendationConfig
  ): any[] {
    const combined = new Map<string, { item: any; score: number }>()

    // 协同过滤结果
    collaborative.forEach((item, index) => {
      const score = (collaborative.length - index) / collaborative.length * 0.6
      combined.set(item.id, { item, score })
    })

    // 内容推荐结果
    contentBased.forEach((item, index) => {
      const score = (contentBased.length - index) / contentBased.length * 0.4
      const existing = combined.get(item.id)

      if (existing) {
        existing.score += score
      } else {
        combined.set(item.id, { item, score })
      }
    })

    // 按分数排序
    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.item)
  }

  /**
   * 应用多样性过滤
   */
  private applyDiversityFilter(items: any[], diversityWeight: number): any[] {
    if (diversityWeight === 0) return items

    const categories = new Set<string>()
    const diverseItems: any[] = []

    for (const item of items) {
      if (!categories.has(item.category) || Math.random() < (1 - diversityWeight)) {
        diverseItems.push(item)
        categories.add(item.category)
      }
    }

    return diverseItems
  }

  /**
   * 应用新鲜度过滤
   */
  private applyFreshnessFilter(items: any[], freshnessWeight: number): any[] {
    if (freshnessWeight === 0) return items

    const now = new Date()

    return items.sort((a, b) => {
      const ageA = (now.getTime() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      const ageB = (now.getTime() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24)

      const freshnessA = Math.exp(-ageA * TIME_DECAY_FACTOR)
      const freshnessB = Math.exp(-ageB * TIME_DECAY_FACTOR)

      return (freshnessB - freshnessA) * freshnessWeight
    })
  }

  /**
   * 记录推荐日志
   */
  private async logRecommendation(
    userId: string,
    type: string,
    targetIds: string[],
    algorithm: string
  ): Promise<void> {
    try {
      await prisma.recommendationLog.createMany({
        data: targetIds.map(targetId => ({
          userId,
          type,
          targetId,
          algorithm,
          confidence: Math.random() * 0.3 + 0.7, // 模拟置信度
          createdAt: new Date()
        }))
      })
    } catch (error) {
      console.error('记录推荐日志失败:', error)
    }
  }

  /**
   * 计算推荐置信度
   */
  private calculateConfidence(recommendations: any[], userDataPoints: number): number {
    if (recommendations.length === 0) return 0

    const baseConfidence = Math.min(userDataPoints / 100, 1) // 基于用户数据量
    const diversityBonus = new Set(recommendations.map(r => r.category)).size / recommendations.length * 0.2

    return Math.min(baseConfidence + diversityBonus, 1)
  }

  /**
   * 获取用户行为数据
   */
  private async getUserBehaviorData(userId: string, targetType: string): Promise<any[]> {
    return prisma.userBehavior.findMany({
      where: {
        userId,
        targetType,
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 近90天
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * 更新用户画像
   */
  private async updateUserProfile(
    userId: string,
    action: string,
    targetType: string,
    targetId: string
  ): Promise<void> {
    // 这里实现用户画像的实时更新逻辑
    // 简化实现，实际项目中需要更复杂的机器学习算法
  }

  /**
   * 计算用户偏好向量
   */
  private calculateUserPreferenceVector(behaviors: any[]): number[] {
    // 简化实现：基于用户行为计算偏好向量
    const vector = new Array(100).fill(0) // 假设100维特征向量

    behaviors.forEach(behavior => {
      const characterVector = this.itemVectors.get(behavior.targetId)
      if (characterVector) {
        characterVector.forEach((value, index) => {
          vector[index] += value * behavior.weight
        })
      }
    })

    // 归一化
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    return norm > 0 ? vector.map(val => val / norm) : vector
  }

  /**
   * 计算向量相似度
   */
  private calculateVectorSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) return 0

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i]
      norm1 += vector1[i] * vector1[i]
      norm2 += vector2[i] * vector2[i]
    }

    if (norm1 === 0 || norm2 === 0) return 0

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  /**
   * 计算内容相似度
   */
  private calculateContentSimilarity(preferences: any, character: any): number {
    // 简化实现：基于标签和分类的相似度计算
    let similarity = 0

    if (preferences.categories && preferences.categories.includes(character.category)) {
      similarity += 0.3
    }

    if (preferences.tags && character.tags) {
      const userTags = new Set(preferences.tags)
      const characterTags = new Set(JSON.parse(character.tags || '[]'))
      const intersection = new Set([...userTags].filter(x => characterTags.has(x)))
      similarity += (intersection.size / Math.max(userTags.size, characterTags.size)) * 0.4
    }

    if (character.rating >= (preferences.minRating || 0)) {
      similarity += 0.3
    }

    return Math.min(similarity, 1)
  }

  // 以下方法为社区推荐和用户推荐的辅助方法
  private async getUserInterests(userId: string): Promise<string[]> {
    const profile = this.userProfiles.get(userId)
    return profile?.interests || []
  }

  private async getFollowingPosts(userId: string): Promise<any[]> {
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    })

    const followingIds = following.map(f => f.followingId)

    return prisma.post.findMany({
      where: {
        authorId: { in: followingIds },
        isDeleted: false,
        visibility: 'public'
      },
      include: {
        author: {
          select: { id: true, username: true, avatar: true }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
  }

  private async getInterestBasedPosts(userId: string, interests: string[]): Promise<any[]> {
    if (interests.length === 0) return []

    return prisma.post.findMany({
      where: {
        isDeleted: false,
        visibility: 'public',
        OR: interests.map(interest => ({
          content: { contains: interest }
        }))
      },
      include: {
        author: {
          select: { id: true, username: true, avatar: true }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
  }

  private async getTrendingPosts(): Promise<any[]> {
    return prisma.post.findMany({
      where: {
        isDeleted: false,
        visibility: 'public',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 近7天
        }
      },
      include: {
        author: {
          select: { id: true, username: true, avatar: true }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      },
      orderBy: [
        { likes: { _count: 'desc' } },
        { comments: { _count: 'desc' } }
      ],
      take: 10
    })
  }

  private mergePostRecommendations(sources: Array<{ posts: any[]; weight: number }>): any[] {
    const combined = new Map<string, { post: any; score: number }>()

    sources.forEach(({ posts, weight }) => {
      posts.forEach((post, index) => {
        const score = (posts.length - index) / posts.length * weight
        const existing = combined.get(post.id)

        if (existing) {
          existing.score += score
        } else {
          combined.set(post.id, { post, score })
        }
      })
    })

    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.post)
  }

  private deduplicatePosts(posts: any[]): any[] {
    const seen = new Set<string>()
    return posts.filter(post => {
      if (seen.has(post.id)) {
        return false
      }
      seen.add(post.id)
      return true
    })
  }

  private async filterSeenPosts(userId: string, posts: any[]): Promise<any[]> {
    const seenPosts = await prisma.userBehavior.findMany({
      where: {
        userId,
        targetType: 'post',
        action: 'view'
      },
      select: { targetId: true }
    })

    const seenIds = new Set(seenPosts.map(sp => sp.targetId))
    return posts.filter(post => !seenIds.has(post.id))
  }

  private applyTimeDecay(posts: any[]): any[] {
    const now = new Date()

    return posts.sort((a, b) => {
      const ageA = (now.getTime() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60)
      const ageB = (now.getTime() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60)

      const decayA = Math.exp(-ageA * 0.01)
      const decayB = Math.exp(-ageB * 0.01)

      return decayB - decayA
    })
  }

  private async getSimilarUsers(userId: string): Promise<any[]> {
    const similarities = this.userSimilarities.get(userId)
    if (!similarities) return []

    const topSimilar = Array.from(similarities.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id)

    return prisma.user.findMany({
      where: {
        id: { in: topSimilar },
        isActive: true
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        isVerified: true,
        _count: {
          select: {
            followers: true,
            characters: true,
            posts: true
          }
        }
      }
    })
  }

  private async getCommonInterestUsers(userId: string): Promise<any[]> {
    const userInterests = await this.getUserInterests(userId)
    if (userInterests.length === 0) return []

    return prisma.user.findMany({
      where: {
        userProfile: {
          interests: {
            contains: userInterests[0] // 简化实现
          }
        },
        isActive: true,
        NOT: { id: userId }
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        isVerified: true,
        _count: {
          select: {
            followers: true,
            characters: true,
            posts: true
          }
        }
      },
      take: 10
    })
  }

  private async getPopularCreators(): Promise<any[]> {
    return prisma.user.findMany({
      where: {
        isActive: true,
        characters: {
          some: {
            isPublic: true
          }
        }
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        isVerified: true,
        _count: {
          select: {
            followers: true,
            characters: true,
            posts: true
          }
        }
      },
      orderBy: {
        followers: {
          _count: 'desc'
        }
      },
      take: 10
    })
  }

  private mergeUserRecommendations(sources: Array<{ users: any[]; weight: number }>): any[] {
    const combined = new Map<string, { user: any; score: number }>()

    sources.forEach(({ users, weight }) => {
      users.forEach((user, index) => {
        const score = (users.length - index) / users.length * weight
        const existing = combined.get(user.id)

        if (existing) {
          existing.score += score
        } else {
          combined.set(user.id, { user, score })
        }
      })
    })

    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.user)
  }

  private async filterFollowedUsers(userId: string, users: any[]): Promise<any[]> {
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    })

    const followingIds = new Set(following.map(f => f.followingId))
    return users.filter(user => !followingIds.has(user.id))
  }

  /**
   * 跟踪模型性能指标
   */
  async trackModelPerformance(userId: string, targetId: string, score: number): Promise<void> {
    try {
      // 检查是否已有记录
      const existing = await prisma.modelPerformance.findFirst({
        where: {
          userId,
          modelType: 'recommendation',
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时内
          }
        }
      })

      if (existing) {
        // 更新现有记录
        await prisma.modelPerformance.update({
          where: { id: existing.id },
          data: {
            accuracy: (existing.accuracy + score) / 2,
            precision: (existing.precision + score) / 2,
            recall: (existing.recall + score) / 2,
            f1Score: (existing.f1Score + score) / 2,
            updatedAt: new Date()
          }
        })
      } else {
        // 创建新记录
        await prisma.modelPerformance.create({
          data: {
            userId,
            modelType: 'recommendation',
            accuracy: score,
            precision: score,
            recall: score,
            f1Score: score,
            timestamp: new Date()
          }
        })
      }
    } catch (error) {
      console.error('跟踪模型性能失败:', error)
    }
  }

  /**
   * 重新训练推荐模型
   */
  async retrainModels(): Promise<void> {
    try {
      console.log('开始重新训练推荐模型...')

      // 1. 重新计算用户相似度矩阵
      await this.computeUserSimilarities()

      // 2. 重新计算物品特征向量
      await this.computeItemVectors()

      // 3. 更新用户画像
      await this.updateAllUserProfiles()

      // 4. 清理过期的推荐日志
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      await prisma.recommendationLog.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo }
        }
      })

      // 5. 重新计算模型性能指标
      await this.evaluateModelPerformance()

      console.log('推荐模型重新训练完成')
    } catch (error) {
      console.error('重新训练推荐模型失败:', error)
      throw error
    }
  }

  /**
   * 重新计算用户相似度矩阵
   */
  private async computeUserSimilarities(): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true }
      })

      this.userSimilarities.clear()

      for (const user of users) {
        const userBehaviors = await this.getUserBehaviorData(user.id, 'character')
        const userRatings = new Map<string, number>()

        userBehaviors.forEach(behavior => {
          userRatings.set(behavior.targetId, behavior.weight)
        })

        const similarities = new Map<string, number>()

        for (const otherUser of users) {
          if (user.id === otherUser.id) continue

          const otherBehaviors = await this.getUserBehaviorData(otherUser.id, 'character')
          const otherRatings = new Map<string, number>()

          otherBehaviors.forEach(behavior => {
            otherRatings.set(behavior.targetId, behavior.weight)
          })

          const similarity = this.calculateCosineSimilarity(userRatings, otherRatings)
          if (similarity > 0.1) {
            similarities.set(otherUser.id, similarity)
          }
        }

        this.userSimilarities.set(user.id, similarities)
      }
    } catch (error) {
      console.error('计算用户相似度失败:', error)
    }
  }

  /**
   * 重新计算物品特征向量
   */
  private async computeItemVectors(): Promise<void> {
    try {
      const characters = await prisma.character.findMany({
        where: { isPublic: true },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          tags: true,
          isNsfw: true
        }
      })

      this.itemVectors.clear()

      characters.forEach(character => {
        // 简化的特征向量生成
        const vector = new Array(100).fill(0)

        // 基于分类设置特征
        if (character.category) {
          const categoryHash = this.stringToHash(character.category) % 50
          vector[categoryHash] = 1
        }

        // 基于标签设置特征
        if (character.tags) {
          const tags = JSON.parse(character.tags)
          tags.forEach((tag: string, index: number) => {
            const tagHash = this.stringToHash(tag) % 50
            vector[50 + tagHash] = 1
          })
        }

        // NSFW标记
        vector[99] = character.isNsfw ? 1 : 0

        this.itemVectors.set(character.id, vector)
      })
    } catch (error) {
      console.error('计算物品特征向量失败:', error)
    }
  }

  /**
   * 更新所有用户画像
   */
  private async updateAllUserProfiles(): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true }
      })

      this.userProfiles.clear()

      for (const user of users) {
        const behaviors = await this.getUserBehaviorData(user.id, 'character')
        const preferences = await prisma.userPreference.findMany({
          where: { userId: user.id }
        })

        const profile = {
          interests: preferences.map(p => p.value),
          preferenceVector: this.calculateUserPreferenceVector(behaviors),
          activityLevel: behaviors.length,
          lastActive: new Date()
        }

        this.userProfiles.set(user.id, profile)
      }
    } catch (error) {
      console.error('更新用户画像失败:', error)
    }
  }

  /**
   * 评估模型性能
   */
  private async evaluateModelPerformance(): Promise<void> {
    try {
      // 获取最近的推荐反馈
      const feedbacks = await prisma.recommendationFeedback.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 近7天
          }
        }
      })

      if (feedbacks.length === 0) return

      // 计算整体性能指标
      const totalFeedbacks = feedbacks.length
      const clickedCount = feedbacks.filter(f => f.clicked).length
      const usefulCount = feedbacks.filter(f => f.useful).length

      const accuracy = clickedCount / totalFeedbacks
      const precision = usefulCount / totalFeedbacks
      const recall = usefulCount / clickedCount || 0
      const f1Score = 2 * (precision * recall) / (precision + recall) || 0

      // 记录全局性能指标
      await prisma.modelPerformance.create({
        data: {
          userId: 'system',
          modelType: 'recommendation_global',
          accuracy,
          precision,
          recall,
          f1Score,
          timestamp: new Date()
        }
      })

      console.log(`模型性能评估完成: 准确率=${accuracy.toFixed(3)}, 精确率=${precision.toFixed(3)}, 召回率=${recall.toFixed(3)}, F1=${f1Score.toFixed(3)}`)
    } catch (error) {
      console.error('评估模型性能失败:', error)
    }
  }

  /**
   * 字符串哈希函数
   */
  private stringToHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash)
  }
}

// 导出单例实例
export default new RecommendationEngine()
