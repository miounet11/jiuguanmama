/**
 * userModeStore 集成测试
 * 验证核心状态管理功能
 */

import { setActivePinia, createPinia } from 'pinia'
import { useUserModeStore } from '../userModeStore'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock API调用
vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  }
}))

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('useUserModeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // 清除localStorage
    localStorage.clear()
  })

  it('应该正确初始化默认状态', () => {
    const store = useUserModeStore()

    expect(store.currentMode).toBe('simplified')
    expect(store.userExperience.skillLevel).toBe('beginner')
    expect(store.userExperience.totalSessions).toBe(0)
    expect(store.userExperience.messagesCount).toBe(0)
    expect(store.userExperience.charactersUsed).toBe(0)
    expect(store.userExperience.featuresUsed).toEqual([])
    expect(store.userExperience.expertFeaturesUsed).toEqual([])
  })

  it('应该正确计算升级建议', () => {
    const store = useUserModeStore()

    // 初始状态不应该建议升级
    expect(store.shouldSuggestModeUpgrade).toBe(false)

    // 模拟用户达到升级条件
    store.userExperience.totalSessions = 10
    store.userExperience.messagesCount = 100
    store.userExperience.charactersUsed = 5
    store.userExperience.featuresUsed = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8']
    store.userExperience.expertFeaturesUsed = ['ef1', 'ef2']

    expect(store.shouldSuggestModeUpgrade).toBe(true)
  })

  it('应该正确切换模式', async () => {
    const store = useUserModeStore()

    // 切换到专家模式
    const result = await store.switchMode('expert', 'test')
    expect(result).toBe(true)
    expect(store.currentMode).toBe('expert')

    // 检查历史记录
    expect(store.transitionHistory.length).toBe(1)
    expect(store.transitionHistory[0].from).toBe('simplified')
    expect(store.transitionHistory[0].to).toBe('expert')
    expect(store.transitionHistory[0].reason).toBe('test')
  })

  it('应该正确记录功能使用', async () => {
    const store = useUserModeStore()

    await store.recordFeatureUsage('test-feature', false)
    expect(store.userExperience.featuresUsed).toContain('test-feature')

    await store.recordFeatureUsage('expert-feature', true)
    expect(store.userExperience.featuresUsed).toContain('expert-feature')
    expect(store.userExperience.expertFeaturesUsed).toContain('expert-feature')
  })

  it('应该正确更新技能水平', () => {
    const store = useUserModeStore()

    // 模拟中级用户
    store.userExperience.totalSessions = 20
    store.userExperience.messagesCount = 200
    store.userExperience.charactersUsed = 3
    store.userExperience.featuresUsed = ['f1', 'f2', 'f3', 'f4', 'f5']

    store.updateSkillLevel()
    expect(store.userExperience.skillLevel).toBe('intermediate')

    // 模拟高级用户
    store.userExperience.totalSessions = 50
    store.userExperience.messagesCount = 500
    store.userExperience.charactersUsed = 10
    store.userExperience.featuresUsed = Array.from({ length: 10 }, (_, i) => `f${i}`)

    store.updateSkillLevel()
    expect(store.userExperience.skillLevel).toBe('advanced')

    // 模拟专家用户
    store.userExperience.totalSessions = 100
    store.userExperience.messagesCount = 1000
    store.userExperience.charactersUsed = 20
    store.userExperience.featuresUsed = Array.from({ length: 15 }, (_, i) => `f${i}`)
    store.userExperience.expertFeaturesUsed = Array.from({ length: 5 }, (_, i) => `ef${i}`)

    store.updateSkillLevel()
    expect(store.userExperience.skillLevel).toBe('expert')
  })

  it('应该正确计算可用功能', () => {
    const store = useUserModeStore()

    // 简洁模式下的可用功能
    const simplifiedFeatures = store.availableFeatures
    expect(simplifiedFeatures).toContain('character-basic-browse')
    expect(simplifiedFeatures).toContain('chat-basic')

    // 切换到专家模式
    store.currentMode = 'expert'
    const expertFeatures = store.availableFeatures
    expect(expertFeatures.length).toBeGreaterThan(simplifiedFeatures.length)
    expect(expertFeatures).toContain('character-advanced-search')
    expect(expertFeatures).toContain('chat-ai-model-selection')
  })

  it('应该正确增加会话统计', async () => {
    const store = useUserModeStore()

    const initialSessions = store.userExperience.totalSessions
    await store.incrementSessionCount()
    expect(store.userExperience.totalSessions).toBe(initialSessions + 1)
  })

  it('应该正确增加消息统计', async () => {
    const store = useUserModeStore()

    const initialMessages = store.userExperience.messagesCount
    await store.incrementMessageCount(5)
    expect(store.userExperience.messagesCount).toBe(initialMessages + 5)
  })

  it('应该正确处理升级建议消除', async () => {
    const store = useUserModeStore()

    await store.dismissUpgradeSuggestion(1) // 1小时
    expect(store.preferences.dismissedSuggestionsUntil).toBeInstanceOf(Date)

    // 在消除期间内不应该显示建议
    expect(store.shouldSuggestModeUpgrade).toBe(false)
  })

  it('应该正确重置用户模式数据', async () => {
    const store = useUserModeStore()

    // 设置一些数据
    store.currentMode = 'expert'
    store.userExperience.totalSessions = 50
    store.userExperience.messagesCount = 200

    // 重置
    await store.resetUserModeData()

    expect(store.currentMode).toBe('simplified')
    expect(store.userExperience.totalSessions).toBe(0)
    expect(store.userExperience.messagesCount).toBe(0)
    expect(store.userExperience.skillLevel).toBe('beginner')
  })

  it('应该正确从本地存储恢复状态', async () => {
    const store = useUserModeStore()

    // 设置本地存储
    localStorage.setItem('userMode', 'expert')
    localStorage.setItem('userModePreferences', JSON.stringify({
      autoUpgradeEnabled: false,
      showUpgradeSuggestions: false
    }))

    // 模拟加载失败，应该从本地存储恢复
    await store.loadUserModeData()

    // 验证恢复的数据
    expect(store.currentMode).toBe('expert')
    expect(store.preferences.autoUpgradeEnabled).toBe(false)
    expect(store.preferences.showUpgradeSuggestions).toBe(false)
  })
})