/**
 * 用户行为分析器
 * 分析用户使用模式，提供智能推荐和功能解锁建议
 */

import type { UserExperience, FeatureDefinition } from './featureManifest'
import { getFeatureManifest, getFeatureById } from './featureManifest'
import type { EvaluationContext } from './conditionEvaluator'
import { createEvaluationContext, evaluateCondition } from './conditionEvaluator'

export interface UserBehaviorPattern {
  type: 'explorer' | 'creator' | 'socializer' | 'optimizer' | 'casual'
  confidence: number
  description: string
  characteristics: string[]
}

export interface SkillProgression {
  currentLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  nextLevel?: 'intermediate' | 'advanced' | 'expert'
  progressToNext: number // 0-100
  recommendations: string[]
  timeToNext?: number // 预估天数
}

export interface FeatureRecommendation {
  featureId: string
  feature: FeatureDefinition
  priority: 'high' | 'medium' | 'low'
  reason: string
  confidence: number
  estimatedUnlockTime?: number // 预估解锁时间（天）
}

export interface UpgradeOpportunity {
  shouldSuggest: boolean
  confidence: number
  reasons: string[]
  readyFeatures: string[]
  missingRequirements: Array<{
    requirement: string
    current: number
    needed: number
  }>
}

export interface UsageStatistics {
  dailyAverage: {
    sessions: number
    messages: number
    timeSpent: number
  }
  weeklyTrends: {
    growth: number
    consistency: number
  }
  featureAdoption: {
    coreUsage: number
    advancedUsage: number
    expertUsage: number
  }
}

/**
 * 分析用户行为模式
 */
export function analyzeUserBehaviorPattern(userExperience: UserExperience): UserBehaviorPattern {
  const context = createEvaluationContext(userExperience)
  const patterns: Array<{type: UserBehaviorPattern['type'], score: number}> = []

  // 探索者模式 - 喜欢尝试新功能和角色
  const explorerScore = calculateExplorerScore(context)
  patterns.push({ type: 'explorer', score: explorerScore })

  // 创作者模式 - 专注于角色创建和自定义
  const creatorScore = calculateCreatorScore(context)
  patterns.push({ type: 'creator', score: creatorScore })

  // 社交者模式 - 关注分享和社区功能
  const socializerScore = calculateSocializerScore(context)
  patterns.push({ type: 'socializer', score: socializerScore })

  // 优化者模式 - 深度使用高级功能
  const optimizerScore = calculateOptimizerScore(context)
  patterns.push({ type: 'optimizer', score: optimizerScore })

  // 休闲用户模式 - 基础使用
  const casualScore = calculateCasualScore(context)
  patterns.push({ type: 'casual', score: casualScore })

  // 找到最高分的模式
  const dominantPattern = patterns.reduce((max, current) =>
    current.score > max.score ? current : max
  )

  return {
    type: dominantPattern.type,
    confidence: dominantPattern.score,
    description: getPatternDescription(dominantPattern.type),
    characteristics: getPatternCharacteristics(dominantPattern.type)
  }
}

/**
 * 计算探索者得分
 */
function calculateExplorerScore(context: EvaluationContext): number {
  let score = 0

  // 角色使用多样性
  if (context.characters >= 5) score += 30
  else if (context.characters >= 3) score += 20
  else if (context.characters >= 1) score += 10

  // 功能尝试积极性
  if (context.features >= 8) score += 25
  else if (context.features >= 5) score += 15
  else if (context.features >= 3) score += 10

  // 会话频率
  if (context.sessions >= 15) score += 20
  else if (context.sessions >= 10) score += 15
  else if (context.sessions >= 5) score += 10

  // 高级功能尝试
  if (context.expertFeatures >= 2) score += 25

  return Math.min(score, 100)
}

/**
 * 计算创作者得分
 */
function calculateCreatorScore(context: EvaluationContext): number {
  let score = 0

  // 角色创建活跃度
  if (context.characters >= 3) score += 40
  else if (context.characters >= 1) score += 20

  // 创作相关功能使用
  const creatorFeatures = [
    'character-creation-basic',
    'character-ai-generation',
    'character-advanced-editing'
  ]
  const usedCreatorFeatures = creatorFeatures.filter(f =>
    context.featuresUsed.includes(f) || context.expertFeaturesUsed.includes(f)
  )
  score += usedCreatorFeatures.length * 15

  // 深度使用指标
  if (context.messages >= 200) score += 20
  if (context.skillLevel === 'advanced' || context.skillLevel === 'expert') score += 20

  return Math.min(score, 100)
}

/**
 * 计算社交者得分
 */
function calculateSocializerScore(context: EvaluationContext): number {
  let score = 0

  // 分享和评分功能使用
  const socialFeatures = [
    'character-sharing',
    'character-rating',
    'character-favorites'
  ]
  const usedSocialFeatures = socialFeatures.filter(f =>
    context.featuresUsed.includes(f) || context.expertFeaturesUsed.includes(f)
  )
  score += usedSocialFeatures.length * 25

  // 角色探索活跃度
  if (context.characters >= 10) score += 30
  else if (context.characters >= 5) score += 20

  // 持续活跃度
  if (context.daysSinceFirstUse >= 14 && context.sessions >= 10) score += 20

  return Math.min(score, 100)
}

/**
 * 计算优化者得分
 */
function calculateOptimizerScore(context: EvaluationContext): number {
  let score = 0

  // 高级功能使用深度
  if (context.expertFeatures >= 5) score += 40
  else if (context.expertFeatures >= 3) score += 25
  else if (context.expertFeatures >= 1) score += 15

  // 技能水平
  if (context.skillLevel === 'expert') score += 30
  else if (context.skillLevel === 'advanced') score += 20

  // 深度使用指标
  if (context.messages >= 500) score += 20
  if (context.sessions >= 25) score += 10

  return Math.min(score, 100)
}

/**
 * 计算休闲用户得分
 */
function calculateCasualScore(context: EvaluationContext): number {
  let score = 100 // 默认高分，其他模式会降低这个分数

  // 如果使用了很多高级功能，降低休闲分数
  if (context.expertFeatures >= 3) score -= 40
  else if (context.expertFeatures >= 1) score -= 20

  // 如果创建了很多角色，降低休闲分数
  if (context.characters >= 5) score -= 30
  else if (context.characters >= 2) score -= 15

  // 如果技能水平高，降低休闲分数
  if (context.skillLevel === 'expert') score -= 30
  else if (context.skillLevel === 'advanced') score -= 20

  // 但保持基本的使用活跃度加分
  if (context.sessions >= 5 && context.messages >= 50) score += 10

  return Math.max(score, 0)
}

/**
 * 获取模式描述
 */
function getPatternDescription(type: UserBehaviorPattern['type']): string {
  const descriptions = {
    explorer: '您喜欢探索不同的角色和尝试新功能，对发现新的可能性充满兴趣',
    creator: '您专注于创建和定制角色，享受打造独特AI伙伴的过程',
    socializer: '您活跃于社区功能，喜欢分享、发现和评价其他用户的创作',
    optimizer: '您深度使用高级功能，追求最佳的对话体验和精细控制',
    casual: '您以轻松的方式使用应用，专注于简单愉快的对话体验'
  }
  return descriptions[type]
}

/**
 * 获取模式特征
 */
function getPatternCharacteristics(type: UserBehaviorPattern['type']): string[] {
  const characteristics = {
    explorer: [
      '经常尝试新角色',
      '积极使用新功能',
      '对功能解锁敏感',
      '喜欢多样化体验'
    ],
    creator: [
      '活跃创建角色',
      '注重个性化设置',
      '使用高级编辑功能',
      '追求创作质量'
    ],
    socializer: [
      '喜欢分享作品',
      '关注他人创作',
      '参与评分和收藏',
      '享受社区互动'
    ],
    optimizer: [
      '深度使用高级功能',
      '精细调节参数',
      '追求最佳体验',
      '关注效率提升'
    ],
    casual: [
      '使用基础功能',
      '偏好简洁界面',
      '注重易用性',
      '追求轻松体验'
    ]
  }
  return characteristics[type]
}

/**
 * 分析技能进展
 */
export function analyzeSkillProgression(userExperience: UserExperience): SkillProgression {
  const context = createEvaluationContext(userExperience)
  const currentLevel = context.skillLevel as SkillProgression['currentLevel']

  // 定义升级阈值
  const thresholds = {
    intermediate: { sessions: 5, messages: 50, features: 3 },
    advanced: { sessions: 15, messages: 200, features: 8, expertFeatures: 2 },
    expert: { sessions: 30, messages: 500, features: 12, expertFeatures: 5 }
  }

  let nextLevel: SkillProgression['nextLevel']
  let progressToNext = 0
  let recommendations: string[] = []
  let timeToNext: number | undefined

  if (currentLevel === 'beginner') {
    nextLevel = 'intermediate'
    const threshold = thresholds.intermediate
    progressToNext = calculateProgress(context, threshold)
    recommendations = getProgressRecommendations('intermediate', context, threshold)
    timeToNext = estimateTimeToNext(context, threshold)
  } else if (currentLevel === 'intermediate') {
    nextLevel = 'advanced'
    const threshold = thresholds.advanced
    progressToNext = calculateProgress(context, threshold)
    recommendations = getProgressRecommendations('advanced', context, threshold)
    timeToNext = estimateTimeToNext(context, threshold)
  } else if (currentLevel === 'advanced') {
    nextLevel = 'expert'
    const threshold = thresholds.expert
    progressToNext = calculateProgress(context, threshold)
    recommendations = getProgressRecommendations('expert', context, threshold)
    timeToNext = estimateTimeToNext(context, threshold)
  } else {
    // Already expert
    progressToNext = 100
    recommendations = ['您已经是专家级用户！继续探索高级功能。']
  }

  return {
    currentLevel,
    nextLevel,
    progressToNext,
    recommendations,
    timeToNext
  }
}

/**
 * 计算升级进度
 */
function calculateProgress(context: EvaluationContext, threshold: any): number {
  const factors = []

  if ('sessions' in threshold) {
    factors.push(Math.min(context.sessions / threshold.sessions, 1))
  }
  if ('messages' in threshold) {
    factors.push(Math.min(context.messages / threshold.messages, 1))
  }
  if ('features' in threshold) {
    factors.push(Math.min(context.features / threshold.features, 1))
  }
  if ('expertFeatures' in threshold) {
    factors.push(Math.min(context.expertFeatures / threshold.expertFeatures, 1))
  }

  const avgProgress = factors.reduce((sum, factor) => sum + factor, 0) / factors.length
  return Math.round(avgProgress * 100)
}

/**
 * 获取进度建议
 */
function getProgressRecommendations(
  targetLevel: string,
  context: EvaluationContext,
  threshold: any
): string[] {
  const recommendations: string[] = []

  if (context.sessions < threshold.sessions) {
    const needed = threshold.sessions - context.sessions
    recommendations.push(`再进行 ${needed} 次会话`)
  }

  if (context.messages < threshold.messages) {
    const needed = threshold.messages - context.messages
    recommendations.push(`再发送 ${needed} 条消息`)
  }

  if (context.features < threshold.features) {
    const needed = threshold.features - context.features
    recommendations.push(`尝试使用 ${needed} 个新功能`)
  }

  if (threshold.expertFeatures && context.expertFeatures < threshold.expertFeatures) {
    const needed = threshold.expertFeatures - context.expertFeatures
    recommendations.push(`探索 ${needed} 个高级功能`)
  }

  return recommendations
}

/**
 * 估算到达下一级别的时间
 */
function estimateTimeToNext(context: EvaluationContext, threshold: any): number {
  const currentRate = {
    sessions: context.sessions / Math.max(context.daysSinceFirstUse, 1),
    messages: context.messages / Math.max(context.daysSinceFirstUse, 1)
  }

  const daysNeeded = []

  if (context.sessions < threshold.sessions) {
    const sessionsNeeded = threshold.sessions - context.sessions
    daysNeeded.push(sessionsNeeded / Math.max(currentRate.sessions, 0.1))
  }

  if (context.messages < threshold.messages) {
    const messagesNeeded = threshold.messages - context.messages
    daysNeeded.push(messagesNeeded / Math.max(currentRate.messages, 1))
  }

  return Math.max(...daysNeeded, 1)
}

/**
 * 生成功能推荐
 */
export function generateFeatureRecommendations(
  userExperience: UserExperience,
  currentUnlockedFeatures: string[]
): FeatureRecommendation[] {
  const context = createEvaluationContext(userExperience)
  const pattern = analyzeUserBehaviorPattern(userExperience)
  const allFeatures = getFeatureManifest()

  const recommendations: FeatureRecommendation[] = []

  allFeatures.forEach(feature => {
    // 跳过已解锁的功能
    if (currentUnlockedFeatures.includes(feature.id)) return

    // 跳过核心功能（默认解锁）
    if (feature.coreFeature) return

    // 检查解锁条件
    if (feature.unlockCondition) {
      const evaluation = evaluateCondition(feature.unlockCondition, context)
      if (!evaluation.result) return
    }

    const recommendation = createFeatureRecommendation(feature, pattern, context)
    if (recommendation) {
      recommendations.push(recommendation)
    }
  })

  // 按优先级和置信度排序
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const aPriority = priorityOrder[a.priority]
    const bPriority = priorityOrder[b.priority]

    if (aPriority !== bPriority) return bPriority - aPriority
    return b.confidence - a.confidence
  })
}

/**
 * 创建功能推荐
 */
function createFeatureRecommendation(
  feature: FeatureDefinition,
  pattern: UserBehaviorPattern,
  context: EvaluationContext
): FeatureRecommendation | null {
  let priority: FeatureRecommendation['priority'] = 'medium'
  let confidence = 50
  let reason = ''

  // 基于用户模式调整推荐
  if (pattern.type === 'explorer') {
    if (feature.category === 'advanced') {
      priority = 'high'
      confidence = 80
      reason = '探索者通常喜欢尝试新的高级功能'
    }
  } else if (pattern.type === 'creator') {
    if (feature.scope.includes('character-creation')) {
      priority = 'high'
      confidence = 90
      reason = '创作者会对角色创建功能感兴趣'
    }
  } else if (pattern.type === 'socializer') {
    if (feature.id.includes('sharing') || feature.id.includes('rating')) {
      priority = 'high'
      confidence = 85
      reason = '社交者喜欢分享和互动功能'
    }
  } else if (pattern.type === 'optimizer') {
    if (feature.isExpertFeature) {
      priority = 'high'
      confidence = 95
      reason = '优化者需要更精细的控制功能'
    }
  } else if (pattern.type === 'casual') {
    if (feature.category === 'expert') {
      priority = 'low'
      confidence = 30
      reason = '可能过于复杂，但可以尝试'
    } else if (feature.category === 'advanced') {
      priority = 'medium'
      confidence = 60
      reason = '适度的功能增强'
    }
  }

  // 基于使用情况调整
  if (feature.scope.includes('chat') && context.messages >= 100) {
    confidence += 15
    reason += '，您的对话活跃度表明对此功能有需求'
  }

  if (feature.scope.includes('character-creation') && context.characters >= 2) {
    confidence += 20
    reason += '，您已经有角色创建经验'
  }

  return {
    featureId: feature.id,
    feature,
    priority,
    reason,
    confidence: Math.min(confidence, 100)
  }
}

/**
 * 分析升级机会
 */
export function analyzeUpgradeOpportunity(
  userExperience: UserExperience,
  currentMode: 'simplified' | 'expert'
): UpgradeOpportunity {
  if (currentMode === 'expert') {
    return {
      shouldSuggest: false,
      confidence: 0,
      reasons: ['已经是专家模式'],
      readyFeatures: [],
      missingRequirements: []
    }
  }

  const context = createEvaluationContext(userExperience)
  const reasons: string[] = []
  const readyFeatures: string[] = []
  const missingRequirements: Array<{requirement: string, current: number, needed: number}> = []

  let confidence = 0

  // 检查升级信号
  if (context.sessions >= 10) {
    reasons.push('您已经进行了多次会话')
    confidence += 20
  } else {
    missingRequirements.push({
      requirement: '会话次数',
      current: context.sessions,
      needed: 10
    })
  }

  if (context.messages >= 100) {
    reasons.push('您的对话量表明有深度使用需求')
    confidence += 25
  } else {
    missingRequirements.push({
      requirement: '消息数量',
      current: context.messages,
      needed: 100
    })
  }

  if (context.characters >= 5) {
    reasons.push('您使用了多个角色')
    confidence += 20
  } else {
    missingRequirements.push({
      requirement: '使用角色数',
      current: context.characters,
      needed: 5
    })
  }

  if (context.features >= 8) {
    reasons.push('您已经使用了多种功能')
    confidence += 20
  } else {
    missingRequirements.push({
      requirement: '使用功能数',
      current: context.features,
      needed: 8
    })
  }

  if (context.expertFeatures >= 2) {
    reasons.push('您已经尝试使用高级功能')
    confidence += 15
  } else {
    missingRequirements.push({
      requirement: '高级功能使用数',
      current: context.expertFeatures,
      needed: 2
    })
  }

  // 检查准备好的功能
  const expertFeatures = getFeatureManifest().filter(f => f.isExpertFeature)
  expertFeatures.forEach(feature => {
    if (feature.unlockCondition) {
      const evaluation = evaluateCondition(feature.unlockCondition, context)
      if (evaluation.result) {
        readyFeatures.push(feature.id)
      }
    }
  })

  if (readyFeatures.length >= 3) {
    reasons.push(`您已经可以使用 ${readyFeatures.length} 个专家功能`)
    confidence += 20
  }

  const shouldSuggest = confidence >= 60 && missingRequirements.length <= 2

  return {
    shouldSuggest,
    confidence,
    reasons,
    readyFeatures,
    missingRequirements
  }
}

/**
 * 生成使用统计
 */
export function generateUsageStatistics(userExperience: UserExperience): UsageStatistics {
  const context = createEvaluationContext(userExperience)
  const daysSinceStart = Math.max(context.daysSinceFirstUse, 1)

  return {
    dailyAverage: {
      sessions: context.sessions / daysSinceStart,
      messages: context.messages / daysSinceStart,
      timeSpent: (context.messages * 2) / daysSinceStart // 估算每条消息2分钟
    },
    weeklyTrends: {
      growth: calculateGrowthTrend(context),
      consistency: calculateConsistencyScore(context)
    },
    featureAdoption: {
      coreUsage: calculateCoreUsage(context),
      advancedUsage: calculateAdvancedUsage(context),
      expertUsage: calculateExpertUsage(context)
    }
  }
}

/**
 * 计算增长趋势
 */
function calculateGrowthTrend(context: EvaluationContext): number {
  // 简化的增长计算，基于使用频率
  const dailyActivity = context.sessions / Math.max(context.daysSinceFirstUse, 1)
  return Math.min(dailyActivity * 10, 100)
}

/**
 * 计算一致性得分
 */
function calculateConsistencyScore(context: EvaluationContext): number {
  // 基于会话分布的一致性
  const expectedSessions = context.daysSinceFirstUse * 0.5 // 期望每两天一次会话
  const consistency = Math.max(0, 100 - Math.abs(context.sessions - expectedSessions) * 10)
  return Math.min(consistency, 100)
}

/**
 * 计算核心功能使用率
 */
function calculateCoreUsage(context: EvaluationContext): number {
  const coreFeatures = getFeatureManifest().filter(f => f.coreFeature)
  const usedCoreFeatures = coreFeatures.filter(f =>
    context.featuresUsed.includes(f.id)
  )
  return (usedCoreFeatures.length / coreFeatures.length) * 100
}

/**
 * 计算高级功能使用率
 */
function calculateAdvancedUsage(context: EvaluationContext): number {
  const advancedFeatures = getFeatureManifest().filter(f =>
    f.category === 'advanced' && !f.isExpertFeature
  )
  const usedAdvancedFeatures = advancedFeatures.filter(f =>
    context.featuresUsed.includes(f.id)
  )
  return advancedFeatures.length > 0
    ? (usedAdvancedFeatures.length / advancedFeatures.length) * 100
    : 0
}

/**
 * 计算专家功能使用率
 */
function calculateExpertUsage(context: EvaluationContext): number {
  const expertFeatures = getFeatureManifest().filter(f => f.isExpertFeature)
  const usedExpertFeatures = expertFeatures.filter(f =>
    context.expertFeaturesUsed.includes(f.id)
  )
  return expertFeatures.length > 0
    ? (usedExpertFeatures.length / expertFeatures.length) * 100
    : 0
}