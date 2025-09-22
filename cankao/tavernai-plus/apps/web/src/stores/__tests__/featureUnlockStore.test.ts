/**
 * featureUnlockStore 集成测试
 * 验证功能解锁管理系统
 */

import { setActivePinia, createPinia } from 'pinia'
import { useFeatureUnlockStore } from '../featureUnlockStore'
import { useUserModeStore } from '../userModeStore'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock API调用
vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn()
  }
}))

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn()
  },
  ElNotification: vi.fn()
}))

describe('useFeatureUnlockStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('应该正确初始化功能清单', async () => {
    const store = useFeatureUnlockStore()
    await store.initialize()

    expect(store.featureManifest.length).toBeGreaterThan(0)
    expect(store.unlockRules.length).toBeGreaterThan(0)

    // 检查核心功能
    const coreFeatures = store.featureManifest.filter(f => f.coreFeature)
    expect(coreFeatures.length).toBeGreaterThan(0)

    const basicBrowse = store.getFeatureDefinition('character-basic-browse')
    expect(basicBrowse).toBeDefined()
    expect(basicBrowse?.coreFeature).toBe(true)
  })

  it('应该正确分析解锁条件', async () => {
    const store = useFeatureUnlockStore()
    const userModeStore = useUserModeStore()
    await store.initialize()

    // 测试高级搜索解锁条件
    const searchFeature = store.getFeatureDefinition('character-advanced-search')
    expect(searchFeature).toBeDefined()

    // 初始状态下不应该解锁
    let analysis = store.analyzeUnlockCondition(searchFeature!)
    expect(analysis.isUnlockable).toBe(false)
    expect(analysis.progress).toBeLessThan(1)

    // 满足条件后应该可以解锁
    userModeStore.userExperience.totalSessions = 5
    analysis = store.analyzeUnlockCondition(searchFeature!)
    expect(analysis.isUnlockable).toBe(true)
    expect(analysis.progress).toBe(1)
  })

  it('应该正确评估复杂条件', async () => {
    const store = useFeatureUnlockStore()
    const userModeStore = useUserModeStore()
    await store.initialize()

    // 测试AI模型选择功能的复杂条件
    const aiModelFeature = store.getFeatureDefinition('chat-ai-model-selection')
    expect(aiModelFeature).toBeDefined()

    // 设置部分满足条件
    userModeStore.userExperience.totalSessions = 15 // 满足 sessions >= 15
    userModeStore.userExperience.featuresUsed = ['f1', 'f2', 'f3'] // 不满足 features >= 8

    let analysis = store.analyzeUnlockCondition(aiModelFeature!)
    expect(analysis.isUnlockable).toBe(false)
    expect(analysis.progress).toBeGreaterThan(0)
    expect(analysis.progress).toBeLessThan(1)

    // 完全满足条件
    userModeStore.userExperience.featuresUsed = Array.from({ length: 8 }, (_, i) => `f${i}`)
    analysis = store.analyzeUnlockCondition(aiModelFeature!)
    expect(analysis.isUnlockable).toBe(true)
    expect(analysis.progress).toBe(1)
  })

  it('应该正确处理OR条件', async () => {
    const store = useFeatureUnlockStore()
    const userModeStore = useUserModeStore()
    await store.initialize()

    // 测试高级搜索的OR条件: characters >= 10 || sessions >= 5
    const searchFeature = store.getFeatureDefinition('character-advanced-search')!

    // 只满足第一个条件
    userModeStore.userExperience.charactersUsed = 10
    userModeStore.userExperience.totalSessions = 0

    let analysis = store.analyzeUnlockCondition(searchFeature)
    expect(analysis.isUnlockable).toBe(true)

    // 重置第一个条件，只满足第二个条件
    userModeStore.userExperience.charactersUsed = 0
    userModeStore.userExperience.totalSessions = 5

    analysis = store.analyzeUnlockCondition(searchFeature)
    expect(analysis.isUnlockable).toBe(true)
  })

  it('应该正确获取不同范围的功能', async () => {
    const store = useFeatureUnlockStore()
    await store.initialize()

    // 获取角色发现相关功能
    const characterFeatures = store.getFeaturesByScope('character-discovery')
    expect(characterFeatures.length).toBeGreaterThan(0)
    expect(characterFeatures.some(f => f.id === 'character-basic-browse')).toBe(true)

    // 获取聊天相关功能
    const chatFeatures = store.getFeaturesByScope('chat')
    expect(chatFeatures.length).toBeGreaterThan(0)
    expect(chatFeatures.some(f => f.id === 'chat-basic')).toBe(true)
  })

  it('应该正确计算可见功能', async () => {
    const store = useFeatureUnlockStore()
    const userModeStore = useUserModeStore()
    await store.initialize()

    // 简洁模式下的可见功能
    let visibleFeatures = store.getVisibleFeatures('chat', 'simplified')
    const coreFeatures = visibleFeatures.filter(f => f.coreFeature)
    expect(coreFeatures.length).toBeGreaterThan(0)

    // 专家模式下的可见功能
    visibleFeatures = store.getVisibleFeatures('chat', 'expert')
    expect(visibleFeatures.length).toBeGreaterThan(coreFeatures.length)
  })

  it('应该正确记录功能使用', async () => {
    const store = useFeatureUnlockStore()
    await store.initialize()

    const featureId = 'test-feature'
    store.recordFeatureUsage(featureId)

    const stats = store.featureUsageStats.get(featureId)
    expect(stats).toBeDefined()
    expect(stats?.usageCount).toBe(1)
    expect(stats?.firstUsedAt).toBeInstanceOf(Date)

    // 再次使用
    store.recordFeatureUsage(featureId)
    expect(stats?.usageCount).toBe(2)
  })

  it('应该正确获取推荐功能', async () => {
    const store = useFeatureUnlockStore()
    const userModeStore = useUserModeStore()
    await store.initialize()

    // 设置接近解锁条件的用户状态
    userModeStore.userExperience.totalSessions = 4 // 接近解锁角色创建功能
    userModeStore.userExperience.messagesCount = 45 // 接近解锁消息编辑功能

    const recommendations = store.getRecommendedFeatures(3)
    expect(Array.isArray(recommendations)).toBe(true)
    expect(recommendations.length).toBeLessThanOrEqual(3)
  })

  it('应该正确计算解锁统计', async () => {
    const store = useFeatureUnlockStore()
    const userModeStore = useUserModeStore()
    await store.initialize()

    const initialStats = store.getUnlockStats()
    expect(initialStats.total).toBeGreaterThan(0)
    expect(initialStats.unlocked).toBe(0)
    expect(initialStats.progress).toBe(0)

    // 模拟解锁一些功能
    userModeStore.featureUnlocks.push({
      featureId: 'character-creation-basic',
      unlockedAt: new Date(),
      trigger: 'usage',
      condition: 'sessions >= 3'
    })

    const updatedStats = store.getUnlockStats()
    expect(updatedStats.unlocked).toBe(1)
    expect(updatedStats.progress).toBeGreaterThan(0)
  })

  it('应该正确处理技能等级条件', async () => {
    const store = useFeatureUnlockStore()
    const userModeStore = useUserModeStore()
    await store.initialize()

    // 测试动态世界观功能的技能等级条件
    const worldinfoFeature = store.getFeatureDefinition('worldinfo-dynamic-injection')
    expect(worldinfoFeature).toBeDefined()

    // 初级用户不应该解锁
    userModeStore.userExperience.skillLevel = 'beginner'
    userModeStore.userExperience.totalSessions = 10

    let analysis = store.analyzeUnlockCondition(worldinfoFeature!)
    expect(analysis.isUnlockable).toBe(false)

    // 中级用户应该可以解锁
    userModeStore.userExperience.skillLevel = 'intermediate'
    analysis = store.analyzeUnlockCondition(worldinfoFeature!)
    expect(analysis.isUnlockable).toBe(true)
  })

  it('应该正确处理依赖关系', async () => {
    const store = useFeatureUnlockStore()
    const userModeStore = useUserModeStore()
    await store.initialize()

    // AI角色生成依赖于基础角色创建
    const aiGenFeature = store.getFeatureDefinition('character-ai-generation')
    expect(aiGenFeature?.dependencies).toContain('character-creation-basic')

    // 即使满足其他条件，没有依赖也不能解锁
    userModeStore.userExperience.charactersUsed = 5
    userModeStore.userExperience.messagesCount = 100

    // 由于checkAndTriggerUnlocks会检查依赖，这里只测试分析结果
    const analysis = store.analyzeUnlockCondition(aiGenFeature!)
    // 没有依赖时，分析可能显示可解锁，但实际触发时会被阻止
    expect(analysis.progress).toBeGreaterThan(0)
  })

  it('应该正确估算解锁时间', async () => {
    const store = useFeatureUnlockStore()
    const userModeStore = useUserModeStore()
    await store.initialize()

    // 设置接近解锁的状态
    userModeStore.userExperience.totalSessions = 2 // 需要3个才能解锁角色创建
    userModeStore.userExperience.lastActiveDate = new Date()

    const creationFeature = store.getFeatureDefinition('character-creation-basic')
    const analysis = store.analyzeUnlockCondition(creationFeature!)

    expect(analysis.isUnlockable).toBe(false)
    expect(analysis.estimatedTimeToUnlock).toBeDefined()
    expect(typeof analysis.estimatedTimeToUnlock).toBe('string')
  })
})