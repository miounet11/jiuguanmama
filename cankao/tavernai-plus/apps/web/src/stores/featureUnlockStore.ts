import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { api } from '@/services/api'
import { useUserModeStore } from './userModeStore'
import type { UserExperience, FeatureUnlock } from './userModeStore'

// 功能定义接口
export interface FeatureDefinition {
  id: string
  name: string
  simpleDescription: string
  expertDescription: string
  category: 'core' | 'advanced' | 'expert'
  coreFeature: boolean
  isExpertFeature: boolean
  scope: string[]
  unlockCondition?: string
  dependencies?: string[]
  showUnlockNotification: boolean
  unlockedInSimplified?: boolean
  icon?: string
  estimatedUsageTime?: string // 预计使用时间，如"5分钟"
}

// 解锁规则接口
export interface UnlockRule {
  featureId: string
  condition: string
  trigger: 'usage' | 'time' | 'manual' | 'achievement'
  dependencies?: string[]
  priority: number // 解锁优先级，数字越小优先级越高
}

// 解锁分析结果
export interface UnlockAnalysis {
  featureId: string
  isUnlockable: boolean
  progress: number // 0-1之间，表示解锁进度
  missingConditions: string[]
  estimatedTimeToUnlock?: string
}

// 功能使用统计
export interface FeatureUsageStats {
  featureId: string
  usageCount: number
  firstUsedAt: Date
  lastUsedAt: Date
  totalTimeSpent?: number // 使用时长（毫秒）
}

export const useFeatureUnlockStore = defineStore('featureUnlock', () => {
  // 状态
  const loading = ref(false)
  const featureManifest = ref<FeatureDefinition[]>([])
  const unlockRules = ref<UnlockRule[]>([])
  const featureUsageStats = ref<Map<string, FeatureUsageStats>>(new Map())
  const pendingUnlocks = ref<string[]>([]) // 待处理的解锁
  const unlockedToday = ref<Set<string>>(new Set()) // 今日解锁的功能

  // 依赖其他store
  const userModeStore = useUserModeStore()

  // 计算属性

  /**
   * 获取所有已解锁的功能ID
   */
  const unlockedFeatureIds = computed(() => {
    return new Set(userModeStore.featureUnlocks.map(unlock => unlock.featureId))
  })

  /**
   * 获取所有可解锁的功能分析
   */
  const unlockableFeatures = computed(() => {
    return featureManifest.value
      .filter(feature => !unlockedFeatureIds.value.has(feature.id))
      .map(feature => analyzeUnlockCondition(feature))
      .filter(analysis => analysis.isUnlockable || analysis.progress > 0)
      .sort((a, b) => b.progress - a.progress)
  })

  /**
   * 获取推荐解锁的功能
   */
  const recommendedUnlocks = computed(() => {
    return unlockableFeatures.value
      .filter(analysis => analysis.progress >= 0.8) // 80%以上进度的功能
      .slice(0, 3) // 最多推荐3个
  })

  /**
   * 获取今日解锁统计
   */
  const todayUnlockCount = computed(() => {
    return unlockedToday.value.size
  })

  /**
   * 获取用户技能等级对应的功能
   */
  const skillLevelFeatures = computed(() => {
    const skillLevel = userModeStore.userExperience.skillLevel
    const features = new Map<string, FeatureDefinition[]>()

    featureManifest.value.forEach(feature => {
      const level = getFeatureSkillLevel(feature)
      if (!features.has(level)) {
        features.set(level, [])
      }
      features.get(level)!.push(feature)
    })

    return features
  })

  // 方法

  /**
   * 初始化功能清单
   */
  const initializeFeatureManifest = (): void => {
    featureManifest.value = [
      // 角色浏览功能
      {
        id: 'character-basic-browse',
        name: '角色浏览',
        simpleDescription: '浏览和选择AI角色',
        expertDescription: '完整的角色库浏览，包含详细筛选和排序',
        category: 'core',
        coreFeature: true,
        isExpertFeature: false,
        scope: ['character-discovery'],
        showUnlockNotification: false,
        unlockedInSimplified: true,
        icon: 'User',
        estimatedUsageTime: '随时使用'
      },
      {
        id: 'character-advanced-search',
        name: '高级搜索',
        simpleDescription: '搜索特定角色',
        expertDescription: '多维度搜索：标签、描述、评分、创建时间等',
        category: 'advanced',
        coreFeature: false,
        isExpertFeature: true,
        scope: ['character-discovery'],
        unlockCondition: 'characters >= 10 || sessions >= 5',
        showUnlockNotification: true,
        icon: 'Search',
        estimatedUsageTime: '2分钟'
      },

      // 对话功能
      {
        id: 'chat-basic',
        name: '基础对话',
        simpleDescription: '与AI角色对话',
        expertDescription: '基础文本对话功能',
        category: 'core',
        coreFeature: true,
        isExpertFeature: false,
        scope: ['chat'],
        showUnlockNotification: false,
        unlockedInSimplified: true,
        icon: 'ChatDotRound',
        estimatedUsageTime: '随时使用'
      },
      {
        id: 'chat-message-editing',
        name: '消息编辑',
        simpleDescription: '编辑和重发消息',
        expertDescription: '编辑历史消息，重新生成响应，分支对话',
        category: 'advanced',
        coreFeature: false,
        isExpertFeature: true,
        scope: ['chat'],
        unlockCondition: 'messages >= 50',
        showUnlockNotification: true,
        icon: 'Edit',
        estimatedUsageTime: '30秒'
      },
      {
        id: 'chat-ai-model-selection',
        name: 'AI模型选择',
        simpleDescription: '选择不同的AI模型',
        expertDescription: '切换Grok-3、Claude、GPT等不同模型，调节参数',
        category: 'expert',
        coreFeature: false,
        isExpertFeature: true,
        scope: ['chat'],
        unlockCondition: 'sessions >= 15 && features >= 8',
        showUnlockNotification: true,
        icon: 'Setting',
        estimatedUsageTime: '1分钟'
      },

      // 角色创建功能
      {
        id: 'character-creation-basic',
        name: '角色创建',
        simpleDescription: '创建自定义角色',
        expertDescription: '使用模板创建角色',
        category: 'advanced',
        coreFeature: false,
        isExpertFeature: false,
        scope: ['character-creation'],
        unlockCondition: 'sessions >= 3',
        showUnlockNotification: true,
        unlockedInSimplified: true,
        icon: 'Plus',
        estimatedUsageTime: '10分钟'
      },
      {
        id: 'character-ai-generation',
        name: 'AI角色生成',
        simpleDescription: '让AI帮你创建角色',
        expertDescription: 'AI驱动的角色生成，包含头像、背景、性格设定',
        category: 'advanced',
        coreFeature: false,
        isExpertFeature: true,
        scope: ['character-creation'],
        unlockCondition: 'characters >= 2 && messages >= 100',
        dependencies: ['character-creation-basic'],
        showUnlockNotification: true,
        icon: 'MagicStick',
        estimatedUsageTime: '5分钟'
      },

      // 世界观功能
      {
        id: 'worldinfo-basic',
        name: '世界观信息',
        simpleDescription: '查看角色背景信息',
        expertDescription: '基础世界观信息查看',
        category: 'advanced',
        coreFeature: false,
        isExpertFeature: false,
        scope: ['chat', 'worldinfo'],
        unlockCondition: 'messages >= 30',
        showUnlockNotification: true,
        icon: 'Document',
        estimatedUsageTime: '随时查看'
      },
      {
        id: 'worldinfo-dynamic-injection',
        name: '动态世界观',
        simpleDescription: '智能背景信息提示',
        expertDescription: 'AI自动分析对话并提供相关世界观信息',
        category: 'expert',
        coreFeature: false,
        isExpertFeature: true,
        scope: ['chat', 'worldinfo'],
        unlockCondition: 'sessions >= 10 && skillLevel >= "intermediate"',
        dependencies: ['worldinfo-basic'],
        showUnlockNotification: true,
        icon: 'Lightning',
        estimatedUsageTime: '自动运行'
      },

      // 高级功能
      {
        id: 'chat-export',
        name: '对话导出',
        simpleDescription: '保存对话记录',
        expertDescription: '导出对话为多种格式：TXT、JSON、PDF等',
        category: 'expert',
        coreFeature: false,
        isExpertFeature: true,
        scope: ['chat'],
        unlockCondition: 'messages >= 200',
        showUnlockNotification: true,
        icon: 'Download',
        estimatedUsageTime: '1分钟'
      },
      {
        id: 'character-sharing',
        name: '角色分享',
        simpleDescription: '分享你的角色',
        expertDescription: '发布角色到社区，设置分享权限和标签',
        category: 'expert',
        coreFeature: false,
        isExpertFeature: true,
        scope: ['character-creation'],
        unlockCondition: 'characters >= 5 && sessions >= 20',
        showUnlockNotification: true,
        icon: 'Share',
        estimatedUsageTime: '3分钟'
      }
    ]

    // 初始化解锁规则
    initializeUnlockRules()
  }

  /**
   * 初始化解锁规则
   */
  const initializeUnlockRules = (): void => {
    unlockRules.value = featureManifest.value
      .filter(feature => feature.unlockCondition)
      .map((feature, index) => ({
        featureId: feature.id,
        condition: feature.unlockCondition!,
        trigger: 'usage' as const,
        dependencies: feature.dependencies || [],
        priority: feature.category === 'core' ? 1 :
                  feature.category === 'advanced' ? 2 : 3
      }))
      .sort((a, b) => a.priority - b.priority)
  }

  /**
   * 分析功能解锁条件
   */
  const analyzeUnlockCondition = (feature: FeatureDefinition): UnlockAnalysis => {
    if (!feature.unlockCondition) {
      return {
        featureId: feature.id,
        isUnlockable: true,
        progress: 1,
        missingConditions: []
      }
    }

    const experience = userModeStore.userExperience
    const condition = feature.unlockCondition
    const analysis = evaluateCondition(condition, experience)

    return {
      featureId: feature.id,
      isUnlockable: analysis.isUnlockable,
      progress: analysis.progress,
      missingConditions: analysis.missingConditions,
      estimatedTimeToUnlock: estimateTimeToUnlock(analysis, experience)
    }
  }

  /**
   * 评估解锁条件
   */
  const evaluateCondition = (
    condition: string,
    experience: UserExperience
  ): { isUnlockable: boolean; progress: number; missingConditions: string[] } => {
    const context = {
      sessions: experience.totalSessions,
      messages: experience.messagesCount,
      characters: experience.charactersUsed,
      features: experience.featuresUsed.length,
      skillLevel: experience.skillLevel
    }

    try {
      const result = parseAndEvaluateCondition(condition, context)
      return result
    } catch (error) {
      console.error('条件评估失败:', error)
      return {
        isUnlockable: false,
        progress: 0,
        missingConditions: ['条件解析失败']
      }
    }
  }

  /**
   * 解析并评估条件
   */
  const parseAndEvaluateCondition = (
    condition: string,
    context: Record<string, any>
  ): { isUnlockable: boolean; progress: number; missingConditions: string[] } => {
    const missingConditions: string[] = []
    let totalChecks = 0
    let passedChecks = 0

    // 处理逻辑运算符
    if (condition.includes('&&')) {
      const subConditions = condition.split('&&').map(c => c.trim())
      totalChecks = subConditions.length

      for (const subCondition of subConditions) {
        const result = parseAndEvaluateCondition(subCondition, context)
        if (result.isUnlockable) {
          passedChecks++
        } else {
          missingConditions.push(...result.missingConditions)
        }
      }

      return {
        isUnlockable: passedChecks === totalChecks,
        progress: passedChecks / totalChecks,
        missingConditions
      }
    }

    if (condition.includes('||')) {
      const subConditions = condition.split('||').map(c => c.trim())
      const results = subConditions.map(c => parseAndEvaluateCondition(c, context))
      const bestResult = results.reduce((best, current) =>
        current.progress > best.progress ? current : best
      )

      return {
        isUnlockable: results.some(r => r.isUnlockable),
        progress: bestResult.progress,
        missingConditions: bestResult.missingConditions
      }
    }

    // 处理比较运算符
    const operators = ['>=', '<=', '>', '<', '==', '!=']
    for (const op of operators) {
      if (condition.includes(op)) {
        const [left, right] = condition.split(op).map(s => s.trim())
        const leftValue = context[left] || 0
        const rightValue = parseFloat(right) || 0

        let isValid = false
        let progress = 0

        switch (op) {
          case '>=':
            isValid = leftValue >= rightValue
            progress = Math.min(leftValue / rightValue, 1)
            break
          case '<=':
            isValid = leftValue <= rightValue
            progress = leftValue <= rightValue ? 1 : 0
            break
          case '>':
            isValid = leftValue > rightValue
            progress = Math.min(leftValue / (rightValue + 1), 1)
            break
          case '<':
            isValid = leftValue < rightValue
            progress = leftValue < rightValue ? 1 : 0
            break
          case '==':
            isValid = leftValue == rightValue
            progress = isValid ? 1 : 0
            break
          case '!=':
            isValid = leftValue != rightValue
            progress = isValid ? 1 : 0
            break
        }

        if (!isValid) {
          const missingAmount = Math.max(0, rightValue - leftValue)
          missingConditions.push(`需要${getConditionDescription(left, op, rightValue, missingAmount)}`)
        }

        return {
          isUnlockable: isValid,
          progress,
          missingConditions
        }
      }
    }

    // 处理技能等级条件
    if (condition.includes('skillLevel')) {
      const levels = ['beginner', 'intermediate', 'advanced', 'expert']
      const match = condition.match(/skillLevel\s*>=\s*"(\w+)"/)
      if (match) {
        const requiredLevel = match[1]
        const currentLevelIndex = levels.indexOf(context.skillLevel)
        const requiredLevelIndex = levels.indexOf(requiredLevel)

        const isValid = currentLevelIndex >= requiredLevelIndex
        const progress = Math.min((currentLevelIndex + 1) / (requiredLevelIndex + 1), 1)

        if (!isValid) {
          missingConditions.push(`需要达到${requiredLevel}技能等级`)
        }

        return {
          isUnlockable: isValid,
          progress,
          missingConditions
        }
      }
    }

    return {
      isUnlockable: false,
      progress: 0,
      missingConditions: ['未知条件']
    }
  }

  /**
   * 获取条件描述
   */
  const getConditionDescription = (
    field: string,
    operator: string,
    target: number,
    missing: number
  ): string => {
    const fieldNames: Record<string, string> = {
      sessions: '会话',
      messages: '消息',
      characters: '角色',
      features: '功能'
    }

    const fieldName = fieldNames[field] || field

    switch (operator) {
      case '>=':
        return `${fieldName}达到${target}个（还需${missing}个）`
      case '>':
        return `${fieldName}超过${target}个（还需${missing + 1}个）`
      default:
        return `${fieldName}满足条件`
    }
  }

  /**
   * 估算解锁时间
   */
  const estimateTimeToUnlock = (
    analysis: UnlockAnalysis,
    experience: UserExperience
  ): string | undefined => {
    if (analysis.isUnlockable) return undefined

    // 基于用户当前活跃度估算时间
    const recentActivity = calculateRecentActivity(experience)

    if (recentActivity.sessionsPerDay === 0) {
      return '继续使用以解锁'
    }

    // 简单的时间估算逻辑
    const progressNeeded = 1 - analysis.progress
    const estimatedDays = Math.ceil(progressNeeded * 7) // 假设一周内可以完成

    if (estimatedDays <= 1) {
      return '今天可解锁'
    } else if (estimatedDays <= 7) {
      return `约${estimatedDays}天后解锁`
    } else {
      return '持续使用后解锁'
    }
  }

  /**
   * 计算最近活跃度
   */
  const calculateRecentActivity = (experience: UserExperience) => {
    const now = new Date()
    const lastActive = new Date(experience.lastActiveDate)
    const daysSinceActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))

    return {
      sessionsPerDay: daysSinceActive > 0 ? experience.totalSessions / daysSinceActive : 1,
      messagesPerDay: daysSinceActive > 0 ? experience.messagesCount / daysSinceActive : 10
    }
  }

  /**
   * 获取功能对应的技能等级
   */
  const getFeatureSkillLevel = (feature: FeatureDefinition): string => {
    if (feature.coreFeature) return 'beginner'

    switch (feature.category) {
      case 'core': return 'beginner'
      case 'advanced': return 'intermediate'
      case 'expert': return 'advanced'
      default: return 'beginner'
    }
  }

  /**
   * 获取功能定义
   */
  const getFeatureDefinition = (featureId: string): FeatureDefinition | undefined => {
    return featureManifest.value.find(feature => feature.id === featureId)
  }

  /**
   * 获取指定范围的功能
   */
  const getFeaturesByScope = (scope: string): FeatureDefinition[] => {
    return featureManifest.value.filter(feature =>
      feature.scope.includes(scope)
    )
  }

  /**
   * 获取用户可见的功能
   */
  const getVisibleFeatures = (
    scope: string,
    mode: 'simplified' | 'expert'
  ): FeatureDefinition[] => {
    const scopeFeatures = getFeaturesByScope(scope)

    return scopeFeatures.filter(feature => {
      // 简洁模式下只显示核心功能或已解锁的功能
      if (mode === 'simplified') {
        return feature.coreFeature ||
               feature.unlockedInSimplified ||
               unlockedFeatureIds.value.has(feature.id)
      }

      // 专家模式显示所有功能
      return true
    })
  }

  /**
   * 记录功能使用
   */
  const recordFeatureUsage = (featureId: string): void => {
    const now = new Date()
    const existing = featureUsageStats.value.get(featureId)

    if (existing) {
      existing.usageCount++
      existing.lastUsedAt = now
    } else {
      featureUsageStats.value.set(featureId, {
        featureId,
        usageCount: 1,
        firstUsedAt: now,
        lastUsedAt: now
      })
    }
  }

  /**
   * 检查并触发功能解锁
   */
  const checkAndTriggerUnlocks = async (): Promise<void> => {
    const experience = userModeStore.userExperience

    for (const rule of unlockRules.value) {
      // 检查是否已解锁
      if (unlockedFeatureIds.value.has(rule.featureId)) continue

      // 检查依赖
      if (rule.dependencies) {
        const dependenciesMet = rule.dependencies.every(dep =>
          unlockedFeatureIds.value.has(dep)
        )
        if (!dependenciesMet) continue
      }

      // 检查解锁条件
      const analysis = analyzeUnlockCondition(
        featureManifest.value.find(f => f.id === rule.featureId)!
      )

      if (analysis.isUnlockable) {
        await triggerFeatureUnlock(rule.featureId, rule.trigger, rule.condition)
      }
    }
  }

  /**
   * 触发功能解锁
   */
  const triggerFeatureUnlock = async (
    featureId: string,
    trigger: FeatureUnlock['trigger'],
    condition: string
  ): Promise<void> => {
    try {
      // 调用userModeStore的解锁方法
      await userModeStore.recordFeatureUsage(featureId, true)

      const feature = getFeatureDefinition(featureId)
      if (feature?.showUnlockNotification) {
        showUnlockNotification(feature)
      }

      // 记录今日解锁
      unlockedToday.value.add(featureId)

      ElMessage.success(`🎉 解锁新功能：${feature?.name}`)
    } catch (error) {
      console.error('触发功能解锁失败:', error)
    }
  }

  /**
   * 显示解锁通知
   */
  const showUnlockNotification = (feature: FeatureDefinition): void => {
    ElNotification({
      title: '🎉 功能解锁',
      message: `恭喜！您解锁了新功能"${feature.name}"。${feature.simpleDescription}`,
      type: 'success',
      duration: 8000,
      position: 'top-right',
      showClose: true
    })
  }

  /**
   * 获取解锁统计
   */
  const getUnlockStats = () => {
    const total = featureManifest.value.length
    const unlocked = unlockedFeatureIds.value.size
    const today = todayUnlockCount.value

    return {
      total,
      unlocked,
      today,
      progress: total > 0 ? unlocked / total : 0
    }
  }

  /**
   * 获取推荐功能
   */
  const getRecommendedFeatures = (limit = 3): FeatureDefinition[] => {
    return recommendedUnlocks.value
      .slice(0, limit)
      .map(analysis => getFeatureDefinition(analysis.featureId)!)
      .filter(Boolean)
  }

  /**
   * 初始化存储
   */
  const initialize = async (): Promise<void> => {
    loading.value = true
    try {
      // 初始化功能清单
      initializeFeatureManifest()

      // 加载使用统计
      await loadFeatureUsageStats()

      // 检查可能的解锁
      await checkAndTriggerUnlocks()
    } catch (error) {
      console.error('初始化功能解锁存储失败:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载功能使用统计
   */
  const loadFeatureUsageStats = async (): Promise<void> => {
    try {
      const response = await api.get('/api/user-mode/feature-usage-stats')
      if (response.success) {
        const stats = response.data as FeatureUsageStats[]
        stats.forEach(stat => {
          featureUsageStats.value.set(stat.featureId, stat)
        })
      }
    } catch (error) {
      console.error('加载功能使用统计失败:', error)
    }
  }

  /**
   * 保存功能使用统计
   */
  const saveFeatureUsageStats = async (): Promise<void> => {
    try {
      const stats = Array.from(featureUsageStats.value.values())
      await api.put('/api/user-mode/feature-usage-stats', { stats })
    } catch (error) {
      console.error('保存功能使用统计失败:', error)
    }
  }

  /**
   * 重置今日解锁统计
   */
  const resetTodayUnlocks = (): void => {
    unlockedToday.value.clear()
  }

  return {
    // 状态
    loading: readonly(loading),
    featureManifest: readonly(featureManifest),
    unlockRules: readonly(unlockRules),

    // 计算属性
    unlockedFeatureIds,
    unlockableFeatures,
    recommendedUnlocks,
    todayUnlockCount,
    skillLevelFeatures,

    // 方法
    getFeatureDefinition,
    getFeaturesByScope,
    getVisibleFeatures,
    analyzeUnlockCondition,
    recordFeatureUsage,
    checkAndTriggerUnlocks,
    getUnlockStats,
    getRecommendedFeatures,
    initialize,
    resetTodayUnlocks
  }
})