import { ref, computed } from 'vue'

export type ChatMode = 'basic' | 'advanced' | 'professional'

export interface ModeConfig {
  id: ChatMode
  name: string
  description: string
  icon: string
  color: string
  features: string[]
  settings: {
    enableStream: boolean
    enableTyping: boolean
    enableMemory: boolean
    enableContext: boolean
    enableAnalysis: boolean
    enableAutoComplete: boolean
    enableTranslation: boolean
    enableSummarization: boolean
  }
}

export function useChatModes() {
  // 当前模式
  const currentMode = ref<ChatMode>('basic')

  // 模式配置
  const modeConfigs: Record<ChatMode, ModeConfig> = {
    basic: {
      id: 'basic',
      name: '基础模式',
      description: '简单直接的对话体验，适合日常使用',
      icon: 'chat-bubble-left-right',
      color: '#8b5cf6',
      features: ['流式响应', '输入指示器', '基础设置'],
      settings: {
        enableStream: true,
        enableTyping: true,
        enableMemory: false,
        enableContext: false,
        enableAnalysis: false,
        enableAutoComplete: false,
        enableTranslation: false,
        enableSummarization: false
      }
    },
    advanced: {
      id: 'advanced',
      name: '进阶模式',
      description: '更多自定义选项和控制功能',
      icon: 'adjustments-horizontal',
      color: '#3b82f6',
      features: ['基础功能', '智能补全', '上下文保持', '长期记忆'],
      settings: {
        enableStream: true,
        enableTyping: true,
        enableMemory: true,
        enableContext: true,
        enableAnalysis: false,
        enableAutoComplete: true,
        enableTranslation: false,
        enableSummarization: false
      }
    },
    professional: {
      id: 'professional',
      name: '专业模式',
      description: '完整的专业级功能和高级设置',
      icon: 'academic-cap',
      color: '#059669',
      features: ['全部基础功能', '智能分析', '实时翻译', '对话总结', '系统提示词'],
      settings: {
        enableStream: true,
        enableTyping: true,
        enableMemory: true,
        enableContext: true,
        enableAnalysis: true,
        enableAutoComplete: true,
        enableTranslation: true,
        enableSummarization: true
      }
    }
  }

  // 当前模式配置
  const currentModeConfig = computed(() => modeConfigs[currentMode.value])

  // 切换模式
  const setMode = (mode: ChatMode): void => {
    if (mode !== currentMode.value) {
      currentMode.value = mode
      // 可以在这里添加模式切换的额外逻辑
      console.log(`切换到${currentModeConfig.value.name}`)
    }
  }

  // 检查功能是否可用
  const isFeatureEnabled = (feature: string): boolean => {
    return currentModeConfig.value.settings[`enable${feature}` as keyof typeof currentModeConfig.value.settings] || false
  }

  // 获取所有可用模式
  const getAvailableModes = (): ModeConfig[] => {
    return Object.values(modeConfigs)
  }

  // 获取模式建议
  const getModeRecommendation = (usageType: string): ChatMode => {
    const recommendations: Record<string, ChatMode> = {
      casual: 'basic',
      creative: 'advanced',
      professional: 'professional',
      research: 'professional',
      learning: 'advanced',
      social: 'basic'
    }

    return recommendations[usageType] || 'basic'
  }

  // 检查模式权限
  const canAccessMode = (mode: ChatMode): boolean => {
    // 这里可以添加用户权限检查逻辑
    // 例如：professional模式可能需要订阅
    return true // 暂时返回true
  }

  // 模式升级提示
  const getUpgradePrompt = (mode: ChatMode): string | null => {
    if (mode === 'professional' && !canAccessMode(mode)) {
      return '专业模式需要升级到高级版订阅'
    }
    return null
  }

  // 模式切换统计
  const getModeStats = () => {
    // 这里可以从localStorage或其他地方获取统计数据
    return {
      basicUsage: 0,
      advancedUsage: 0,
      professionalUsage: 0,
      totalSwitches: 0,
      lastSwitchTime: new Date()
    }
  }

  // 记录模式使用
  const recordModeUsage = (mode: ChatMode): void => {
    // 这里可以实现使用统计逻辑
    console.log(`记录${mode}模式使用`)
  }

  // 获取模式对比信息
  const getModeComparison = (fromMode: ChatMode, toMode: ChatMode) => {
    const from = modeConfigs[fromMode]
    const to = modeConfigs[toMode]

    const newFeatures = to.features.filter(f => !from.features.includes(f))
    const lostFeatures = from.features.filter(f => !to.features.includes(f))

    return {
      newFeatures,
      lostFeatures,
      upgradeLevel: getModeLevel(toMode) - getModeLevel(fromMode)
    }
  }

  // 获取模式等级
  const getModeLevel = (mode: ChatMode): number => {
    const levels: Record<ChatMode, number> = {
      basic: 1,
      advanced: 2,
      professional: 3
    }
    return levels[mode]
  }

  // 检查是否可以从当前模式切换到目标模式
  const canSwitchTo = (targetMode: ChatMode): { can: boolean; reason?: string } => {
    if (targetMode === currentMode.value) {
      return { can: false, reason: '已经是当前模式' }
    }

    if (!canAccessMode(targetMode)) {
      return { can: false, reason: getUpgradePrompt(targetMode) || '权限不足' }
    }

    return { can: true }
  }

  // 自动模式推荐
  const getAutoModeRecommendation = (context: {
    messageLength: number
    conversationLength: number
    hasComplexQueries: boolean
    needsTranslation: boolean
    needsAnalysis: boolean
  }): ChatMode => {
    let score = {
      basic: 0,
      advanced: 0,
      professional: 0
    }

    // 基于消息长度评分
    if (context.messageLength > 500) {
      score.advanced += 1
    }
    if (context.messageLength > 1000) {
      score.professional += 1
    }

    // 基于对话长度评分
    if (context.conversationLength > 20) {
      score.advanced += 1
    }
    if (context.conversationLength > 50) {
      score.professional += 1
    }

    // 基于功能需求评分
    if (context.hasComplexQueries) {
      score.advanced += 2
      score.professional += 1
    }

    if (context.needsTranslation) {
      score.professional += 2
    }

    if (context.needsAnalysis) {
      score.professional += 2
    }

    // 返回得分最高的模式
    const modes = ['basic', 'advanced', 'professional'] as const
    return modes.reduce((best, mode) =>
      score[mode] > score[best] ? mode : best
    )
  }

  return {
    // 状态
    currentMode,
    currentModeConfig,

    // 方法
    setMode,
    isFeatureEnabled,
    getAvailableModes,
    getModeRecommendation,
    canAccessMode,
    getUpgradePrompt,
    getModeStats,
    recordModeUsage,
    getModeComparison,
    canSwitchTo,
    getAutoModeRecommendation,

    // 工具方法
    getModeLevel
  }
}