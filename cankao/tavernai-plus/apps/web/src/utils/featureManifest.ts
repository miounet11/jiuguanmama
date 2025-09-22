/**
 * 功能清单管理系统
 * 定义所有应用功能及其渐进式披露规则
 */

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
}

export interface UserExperience {
  totalSessions: number
  messagesCount: number
  charactersUsed: number
  featuresUsed: string[]
  expertFeaturesUsed: string[]
  lastActiveDate: Date
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export interface FeatureUnlockRule {
  featureId: string
  condition: string
  trigger: 'usage' | 'time' | 'manual' | 'achievement'
  dependencies: string[]
}

/**
 * 完整的功能清单定义
 */
export const FEATURE_MANIFEST: FeatureDefinition[] = [
  // === 角色浏览功能 ===
  {
    id: 'character-basic-browse',
    name: '角色浏览',
    simpleDescription: '浏览和选择AI角色',
    expertDescription: '完整的角色库浏览，包含详细筛选和排序',
    category: 'core',
    coreFeature: true,
    isExpertFeature: false,
    scope: ['character-discovery', 'global'],
    showUnlockNotification: false,
    unlockedInSimplified: true
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
    showUnlockNotification: true
  },
  {
    id: 'character-filtering',
    name: '智能筛选',
    simpleDescription: '按类型筛选角色',
    expertDescription: '多条件复合筛选：类型、评分、热度、更新时间',
    category: 'advanced',
    coreFeature: false,
    isExpertFeature: true,
    scope: ['character-discovery'],
    unlockCondition: 'characters >= 5 && sessions >= 3',
    showUnlockNotification: true
  },

  // === 对话功能 ===
  {
    id: 'chat-basic',
    name: '基础对话',
    simpleDescription: '与AI角色对话',
    expertDescription: '基础文本对话功能',
    category: 'core',
    coreFeature: true,
    isExpertFeature: false,
    scope: ['chat', 'global'],
    showUnlockNotification: false,
    unlockedInSimplified: true
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
    showUnlockNotification: true
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
    showUnlockNotification: true
  },
  {
    id: 'chat-quick-actions',
    name: '快捷操作',
    simpleDescription: '快速回复和操作',
    expertDescription: '消息删除、复制、回复、引用等快捷操作',
    category: 'advanced',
    coreFeature: false,
    isExpertFeature: false,
    scope: ['chat'],
    unlockCondition: 'messages >= 20',
    showUnlockNotification: true
  },

  // === 角色创建功能 ===
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
    unlockedInSimplified: true
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
    showUnlockNotification: true
  },
  {
    id: 'character-advanced-editing',
    name: '高级编辑',
    simpleDescription: '详细调整角色设定',
    expertDescription: '完整的角色编辑器：性格、背景、示例对话、头像生成',
    category: 'expert',
    coreFeature: false,
    isExpertFeature: true,
    scope: ['character-creation'],
    unlockCondition: 'characters >= 3 && skillLevel >= "intermediate"',
    dependencies: ['character-creation-basic'],
    showUnlockNotification: true
  },

  // === 世界观功能 ===
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
    showUnlockNotification: true
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
    showUnlockNotification: true
  },

  // === 高级功能 ===
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
    showUnlockNotification: true
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
    showUnlockNotification: true
  },
  {
    id: 'advanced-settings',
    name: '高级设置',
    simpleDescription: '调整应用设置',
    expertDescription: '完整的应用配置：主题、语言、性能、隐私设置',
    category: 'expert',
    coreFeature: false,
    isExpertFeature: true,
    scope: ['settings'],
    unlockCondition: 'sessions >= 10',
    showUnlockNotification: true
  },

  // === 社交功能 ===
  {
    id: 'character-rating',
    name: '角色评分',
    simpleDescription: '为角色打分',
    expertDescription: '详细的角色评价和评分系统',
    category: 'advanced',
    coreFeature: false,
    isExpertFeature: false,
    scope: ['character-discovery'],
    unlockCondition: 'characters >= 3 && sessions >= 5',
    showUnlockNotification: true
  },
  {
    id: 'character-favorites',
    name: '收藏功能',
    simpleDescription: '收藏喜欢的角色',
    expertDescription: '角色收藏和个人库管理',
    category: 'advanced',
    coreFeature: false,
    isExpertFeature: false,
    scope: ['character-discovery'],
    unlockCondition: 'characters >= 2',
    showUnlockNotification: true
  }
]

/**
 * 获取指定范围的功能清单
 */
export function getFeatureManifest(scope = 'global'): FeatureDefinition[] {
  if (scope === 'global') {
    return FEATURE_MANIFEST
  }

  return FEATURE_MANIFEST.filter(feature =>
    feature.scope.includes(scope)
  )
}

/**
 * 根据功能ID获取功能定义
 */
export function getFeatureById(featureId: string): FeatureDefinition | undefined {
  return FEATURE_MANIFEST.find(feature => feature.id === featureId)
}

/**
 * 获取核心功能列表
 */
export function getCoreFeatures(): FeatureDefinition[] {
  return FEATURE_MANIFEST.filter(feature => feature.coreFeature)
}

/**
 * 获取专家功能列表
 */
export function getExpertFeatures(): FeatureDefinition[] {
  return FEATURE_MANIFEST.filter(feature => feature.isExpertFeature)
}

/**
 * 获取简洁模式下可用的功能
 */
export function getSimplifiedModeFeatures(): FeatureDefinition[] {
  return FEATURE_MANIFEST.filter(feature =>
    feature.coreFeature || feature.unlockedInSimplified
  )
}

/**
 * 获取功能解锁规则
 */
export function getFeatureUnlockRules(): FeatureUnlockRule[] {
  return FEATURE_MANIFEST
    .filter(feature => feature.unlockCondition)
    .map(feature => ({
      featureId: feature.id,
      condition: feature.unlockCondition!,
      trigger: 'usage' as const,
      dependencies: feature.dependencies || []
    }))
}

/**
 * 检查功能依赖关系
 */
export function checkFeatureDependencies(
  featureId: string,
  unlockedFeatures: string[]
): boolean {
  const feature = getFeatureById(featureId)
  if (!feature?.dependencies) return true

  return feature.dependencies.every(dep => unlockedFeatures.includes(dep))
}

/**
 * 获取按类别分组的功能
 */
export function getFeaturesByCategory(): Record<string, FeatureDefinition[]> {
  const categories: Record<string, FeatureDefinition[]> = {}

  FEATURE_MANIFEST.forEach(feature => {
    if (!categories[feature.category]) {
      categories[feature.category] = []
    }
    categories[feature.category].push(feature)
  })

  return categories
}

/**
 * 获取可以解锁的功能列表
 */
export function getUnlockableFeatures(
  userExperience: UserExperience,
  currentUnlockedFeatures: string[]
): FeatureDefinition[] {
  return FEATURE_MANIFEST.filter(feature => {
    // 跳过已解锁的功能
    if (currentUnlockedFeatures.includes(feature.id)) return false

    // 跳过核心功能（默认解锁）
    if (feature.coreFeature) return false

    // 检查依赖关系
    if (!checkFeatureDependencies(feature.id, currentUnlockedFeatures)) return false

    // 检查解锁条件
    if (feature.unlockCondition) {
      // 这里需要调用条件评估器
      return true // 临时返回true，在conditionEvaluator中实现具体逻辑
    }

    return false
  })
}

/**
 * 验证功能清单的完整性
 */
export function validateFeatureManifest(): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const featureIds = new Set<string>()

  FEATURE_MANIFEST.forEach(feature => {
    // 检查重复ID
    if (featureIds.has(feature.id)) {
      errors.push(`重复的功能ID: ${feature.id}`)
    }
    featureIds.add(feature.id)

    // 检查依赖关系是否存在
    feature.dependencies?.forEach(dep => {
      if (!FEATURE_MANIFEST.some(f => f.id === dep)) {
        errors.push(`功能 ${feature.id} 依赖的功能 ${dep} 不存在`)
      }
    })

    // 检查范围定义
    if (!feature.scope || feature.scope.length === 0) {
      errors.push(`功能 ${feature.id} 缺少范围定义`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}