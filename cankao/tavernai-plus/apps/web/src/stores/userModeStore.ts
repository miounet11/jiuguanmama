import { defineStore } from 'pinia'
import { ref, computed, readonly, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/services/api'

// 类型定义
export interface UserExperience {
  totalSessions: number
  messagesCount: number
  charactersUsed: number
  featuresUsed: string[]
  expertFeaturesUsed: string[]
  lastActiveDate: Date
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export interface FeatureUnlock {
  featureId: string
  unlockedAt: Date
  trigger: 'usage' | 'time' | 'manual' | 'achievement'
  condition: string
}

export interface ModeTransition {
  from: 'simplified' | 'expert'
  to: 'simplified' | 'expert'
  timestamp: Date
  reason: string
  userInitiated: boolean
}

export interface UserMode {
  current: 'simplified' | 'expert'
  experience: UserExperience
  featureUnlocks: FeatureUnlock[]
  transitionHistory: ModeTransition[]
}

export interface UserModePreferences {
  autoUpgradeEnabled: boolean
  showUpgradeSuggestions: boolean
  dismissedSuggestionsUntil?: Date
}

// Store定义
export const useUserModeStore = defineStore('userMode', () => {
  // 状态
  const currentMode = ref<'simplified' | 'expert'>('simplified')
  const loading = ref(false)

  const userExperience = ref<UserExperience>({
    totalSessions: 0,
    messagesCount: 0,
    charactersUsed: 0,
    featuresUsed: [],
    expertFeaturesUsed: [],
    lastActiveDate: new Date(),
    skillLevel: 'beginner'
  })

  const featureUnlocks = ref<FeatureUnlock[]>([])
  const transitionHistory = ref<ModeTransition[]>([])

  const preferences = ref<UserModePreferences>({
    autoUpgradeEnabled: true,
    showUpgradeSuggestions: true
  })

  const pendingUnlockNotifications = ref<FeatureUnlock[]>([])

  // 计算属性
  const availableFeatures = computed(() => {
    return getAvailableFeaturesForMode(currentMode.value, userExperience.value)
  })

  const shouldSuggestModeUpgrade = computed(() => {
    if (currentMode.value === 'expert') return false
    if (!preferences.value.showUpgradeSuggestions) return false

    // 检查是否在静默期
    if (preferences.value.dismissedSuggestionsUntil) {
      const now = new Date()
      if (now < preferences.value.dismissedSuggestionsUntil) return false
    }

    return analyzeUpgradeOpportunity(userExperience.value, currentMode.value)
  })

  const upgradeSuggestionReason = computed(() => {
    const exp = userExperience.value
    const reasons = []

    if (exp.totalSessions >= 10) {
      reasons.push(`已进行${exp.totalSessions}次会话`)
    }
    if (exp.messagesCount >= 100) {
      reasons.push(`发送了${exp.messagesCount}条消息`)
    }
    if (exp.charactersUsed >= 5) {
      reasons.push(`使用了${exp.charactersUsed}个角色`)
    }
    if (exp.expertFeaturesUsed.length >= 2) {
      reasons.push(`使用了${exp.expertFeaturesUsed.length}个高级功能`)
    }

    return reasons.join('，')
  })

  // 方法

  /**
   * 智能模式推荐算法
   * 基于用户行为分析是否应该推荐升级到专家模式
   */
  const analyzeUpgradeOpportunity = (
    experience: UserExperience,
    mode: string
  ): boolean => {
    if (mode === 'expert') return false

    const upgradeSignals = [
      experience.totalSessions >= 10,
      experience.messagesCount >= 100,
      experience.charactersUsed >= 5,
      experience.featuresUsed.length >= 8,
      experience.expertFeaturesUsed.length >= 2
    ]

    const signalCount = upgradeSignals.filter(Boolean).length
    return signalCount >= 3 // 至少满足3个条件
  }

  /**
   * 获取指定模式下可用的功能
   */
  const getAvailableFeaturesForMode = (
    mode: 'simplified' | 'expert',
    experience: UserExperience
  ): string[] => {
    // 这里需要依赖featureManifest，先返回基础功能
    const coreFeatures = [
      'character-basic-browse',
      'chat-basic'
    ]

    if (mode === 'expert') {
      return [
        ...coreFeatures,
        'character-advanced-search',
        'chat-message-editing',
        'chat-ai-model-selection',
        'character-creation-basic',
        'character-ai-generation',
        'worldinfo-basic',
        'worldinfo-dynamic-injection',
        'chat-export',
        'character-sharing'
      ]
    }

    // 简洁模式下根据解锁情况显示功能
    const unlockedFeatures = featureUnlocks.value.map(unlock => unlock.featureId)
    return [
      ...coreFeatures,
      ...unlockedFeatures.filter(id =>
        ['character-creation-basic', 'worldinfo-basic'].includes(id)
      )
    ]
  }

  /**
   * 切换用户模式
   */
  const switchMode = async (
    newMode: 'simplified' | 'expert',
    reason?: string
  ): Promise<boolean> => {
    if (currentMode.value === newMode) return true

    loading.value = true
    try {
      const oldMode = currentMode.value
      currentMode.value = newMode

      // 记录切换历史
      const transition: ModeTransition = {
        from: oldMode,
        to: newMode,
        timestamp: new Date(),
        reason: reason || 'manual',
        userInitiated: !reason
      }

      transitionHistory.value.push(transition)
      await recordModeTransition(transition)

      // 保存到本地存储和服务器
      await saveModePreference(newMode)

      // 触发界面重新渲染
      await nextTick()

      // 显示模式切换引导
      if (newMode === 'expert' && oldMode === 'simplified') {
        showExpertModeGuide()
      }

      ElMessage.success(
        newMode === 'expert'
          ? '已切换到专家模式，现在可以使用所有高级功能'
          : '已切换到简洁模式，界面更加简洁清爽'
      )

      return true
    } catch (error) {
      console.error('模式切换失败:', error)
      ElMessage.error('模式切换失败，请稍后重试')
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 记录功能使用情况
   */
  const recordFeatureUsage = async (
    featureId: string,
    isExpertFeature = false
  ): Promise<void> => {
    try {
      // 更新本地状态
      if (!userExperience.value.featuresUsed.includes(featureId)) {
        userExperience.value.featuresUsed.push(featureId)
      }

      if (isExpertFeature && !userExperience.value.expertFeaturesUsed.includes(featureId)) {
        userExperience.value.expertFeaturesUsed.push(featureId)
      }

      // 更新最后活跃时间
      userExperience.value.lastActiveDate = new Date()

      // 更新技能水平
      updateSkillLevel()

      // 检查是否有新功能解锁
      await checkFeatureUnlocks(featureId)

      // 持久化到服务器
      await saveUserExperience()
    } catch (error) {
      console.error('记录功能使用失败:', error)
    }
  }

  /**
   * 动态更新用户技能水平
   */
  const updateSkillLevel = (): void => {
    const exp = userExperience.value
    const totalUsage = exp.totalSessions + exp.messagesCount / 10 + exp.charactersUsed * 2

    if (totalUsage >= 200 && exp.expertFeaturesUsed.length >= 5) {
      exp.skillLevel = 'expert'
    } else if (totalUsage >= 100 && exp.featuresUsed.length >= 10) {
      exp.skillLevel = 'advanced'
    } else if (totalUsage >= 50 && exp.featuresUsed.length >= 5) {
      exp.skillLevel = 'intermediate'
    } else {
      exp.skillLevel = 'beginner'
    }
  }

  /**
   * 检查功能解锁条件
   */
  const checkFeatureUnlocks = async (triggerFeatureId: string): Promise<void> => {
    try {
      // 这里需要依赖featureManifest的解锁规则
      // 暂时实现基础的解锁逻辑
      const exp = userExperience.value

      // 角色创建解锁条件：会话数 >= 3
      if (exp.totalSessions >= 3 && !isFeatureUnlocked('character-creation-basic')) {
        await unlockFeature('character-creation-basic', 'usage', 'sessions >= 3')
      }

      // 高级搜索解锁条件：角色数 >= 10 或 会话数 >= 5
      if ((exp.charactersUsed >= 10 || exp.totalSessions >= 5) &&
          !isFeatureUnlocked('character-advanced-search')) {
        await unlockFeature('character-advanced-search', 'usage', 'characters >= 10 || sessions >= 5')
      }

      // 消息编辑解锁条件：消息数 >= 50
      if (exp.messagesCount >= 50 && !isFeatureUnlocked('chat-message-editing')) {
        await unlockFeature('chat-message-editing', 'usage', 'messages >= 50')
      }

      // AI模型选择解锁条件：会话数 >= 15 且 功能数 >= 8
      if (exp.totalSessions >= 15 && exp.featuresUsed.length >= 8 &&
          !isFeatureUnlocked('chat-ai-model-selection')) {
        await unlockFeature('chat-ai-model-selection', 'usage', 'sessions >= 15 && features >= 8')
      }

    } catch (error) {
      console.error('检查功能解锁失败:', error)
    }
  }

  /**
   * 解锁功能
   */
  const unlockFeature = async (
    featureId: string,
    trigger: FeatureUnlock['trigger'],
    condition: string
  ): Promise<void> => {
    const unlock: FeatureUnlock = {
      featureId,
      unlockedAt: new Date(),
      trigger,
      condition
    }

    featureUnlocks.value.push(unlock)
    pendingUnlockNotifications.value.push(unlock)

    // 保存到服务器
    await saveFeatureUnlock(unlock)
  }

  /**
   * 检查功能是否已解锁
   */
  const isFeatureUnlocked = (featureId: string): boolean => {
    return featureUnlocks.value.some(unlock => unlock.featureId === featureId)
  }

  /**
   * 更新会话统计
   */
  const incrementSessionCount = async (): Promise<void> => {
    userExperience.value.totalSessions++
    await saveUserExperience()
  }

  /**
   * 更新消息统计
   */
  const incrementMessageCount = async (count = 1): Promise<void> => {
    userExperience.value.messagesCount += count
    await saveUserExperience()
  }

  /**
   * 更新使用角色统计
   */
  const recordCharacterUsage = async (characterId: string): Promise<void> => {
    // 简单计数，实际可能需要更复杂的逻辑
    userExperience.value.charactersUsed++
    await saveUserExperience()
  }

  /**
   * 暂时关闭升级建议
   */
  const dismissUpgradeSuggestion = async (hoursToWait = 24): Promise<void> => {
    const dismissUntil = new Date()
    dismissUntil.setHours(dismissUntil.getHours() + hoursToWait)

    preferences.value.dismissedSuggestionsUntil = dismissUntil
    await savePreferences()
  }

  /**
   * 更新偏好设置
   */
  const updatePreferences = async (
    newPreferences: Partial<UserModePreferences>
  ): Promise<void> => {
    Object.assign(preferences.value, newPreferences)
    await savePreferences()
  }

  /**
   * 获取待显示的解锁通知
   */
  const getUnlockNotifications = (): FeatureUnlock[] => {
    return pendingUnlockNotifications.value
  }

  /**
   * 清除解锁通知
   */
  const clearUnlockNotification = (featureId: string): void => {
    const index = pendingUnlockNotifications.value.findIndex(
      unlock => unlock.featureId === featureId
    )
    if (index >= 0) {
      pendingUnlockNotifications.value.splice(index, 1)
    }
  }

  // 专家模式引导
  const showExpertModeGuide = (): void => {
    ElMessage({
      type: 'info',
      message: '欢迎使用专家模式！现在您可以访问所有高级功能和详细设置选项。',
      duration: 5000,
      showClose: true
    })
  }

  // API 服务方法

  /**
   * 记录模式切换历史
   */
  const recordModeTransition = async (transition: ModeTransition): Promise<void> => {
    try {
      await api.post('/api/user-mode/transitions', transition)
    } catch (error) {
      console.error('记录模式切换失败:', error)
    }
  }

  /**
   * 保存模式偏好
   */
  const saveModePreference = async (mode: 'simplified' | 'expert'): Promise<void> => {
    try {
      await api.put('/api/user-mode/preference', { currentMode: mode })
      // 同时保存到本地存储
      localStorage.setItem('userMode', mode)
    } catch (error) {
      console.error('保存模式偏好失败:', error)
      // fallback到本地存储
      localStorage.setItem('userMode', mode)
    }
  }

  /**
   * 保存用户体验数据
   */
  const saveUserExperience = async (): Promise<void> => {
    try {
      await api.put('/api/user-mode/experience', userExperience.value)
    } catch (error) {
      console.error('保存用户体验数据失败:', error)
    }
  }

  /**
   * 保存功能解锁记录
   */
  const saveFeatureUnlock = async (unlock: FeatureUnlock): Promise<void> => {
    try {
      await api.post('/api/user-mode/feature-unlocks', unlock)
    } catch (error) {
      console.error('保存功能解锁记录失败:', error)
    }
  }

  /**
   * 保存偏好设置
   */
  const savePreferences = async (): Promise<void> => {
    try {
      await api.put('/api/user-mode/preferences', preferences.value)
      // 同时保存到本地存储
      localStorage.setItem('userModePreferences', JSON.stringify(preferences.value))
    } catch (error) {
      console.error('保存偏好设置失败:', error)
      // fallback到本地存储
      localStorage.setItem('userModePreferences', JSON.stringify(preferences.value))
    }
  }

  /**
   * 从服务器加载用户模式数据
   */
  const loadUserModeData = async (): Promise<void> => {
    loading.value = true
    try {
      const response = await api.get('/api/user-mode')

      if (response.success) {
        const data = response.data
        currentMode.value = data.currentMode || 'simplified'
        userExperience.value = { ...userExperience.value, ...data.experience }
        featureUnlocks.value = data.featureUnlocks || []
        transitionHistory.value = data.transitionHistory || []
        preferences.value = { ...preferences.value, ...data.preferences }
      }
    } catch (error) {
      console.error('加载用户模式数据失败:', error)
      // 尝试从本地存储恢复
      const savedMode = localStorage.getItem('userMode')
      const savedPreferences = localStorage.getItem('userModePreferences')

      if (savedMode) {
        currentMode.value = savedMode as 'simplified' | 'expert'
      }
      if (savedPreferences) {
        try {
          preferences.value = { ...preferences.value, ...JSON.parse(savedPreferences) }
        } catch (e) {
          console.error('解析本地偏好设置失败:', e)
        }
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 重置用户模式数据
   */
  const resetUserModeData = async (): Promise<void> => {
    currentMode.value = 'simplified'
    userExperience.value = {
      totalSessions: 0,
      messagesCount: 0,
      charactersUsed: 0,
      featuresUsed: [],
      expertFeaturesUsed: [],
      lastActiveDate: new Date(),
      skillLevel: 'beginner'
    }
    featureUnlocks.value = []
    transitionHistory.value = []
    preferences.value = {
      autoUpgradeEnabled: true,
      showUpgradeSuggestions: true
    }
    pendingUnlockNotifications.value = []

    // 清除本地存储
    localStorage.removeItem('userMode')
    localStorage.removeItem('userModePreferences')
  }

  return {
    // 状态
    currentMode: readonly(currentMode),
    loading: readonly(loading),
    userExperience: readonly(userExperience),
    featureUnlocks: readonly(featureUnlocks),
    transitionHistory: readonly(transitionHistory),
    preferences: readonly(preferences),

    // 计算属性
    availableFeatures,
    shouldSuggestModeUpgrade,
    upgradeSuggestionReason,

    // 方法
    switchMode,
    recordFeatureUsage,
    updateSkillLevel,
    incrementSessionCount,
    incrementMessageCount,
    recordCharacterUsage,
    dismissUpgradeSuggestion,
    updatePreferences,
    isFeatureUnlocked,
    getUnlockNotifications,
    clearUnlockNotification,
    loadUserModeData,
    resetUserModeData
  }
})