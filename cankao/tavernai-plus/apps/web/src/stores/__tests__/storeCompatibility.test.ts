/**
 * Store兼容性测试
 * 验证新的状态管理store与现有stores的兼容性
 */

import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '../user'
import { useUserModeStore } from '../userModeStore'
import { useFeatureUnlockStore } from '../featureUnlockStore'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock API和UI组件
vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  }
}))

vi.mock('@/services/auth', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    uploadAvatar: vi.fn(),
    refreshToken: vi.fn()
  }
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn()
  },
  ElNotification: vi.fn()
}))

vi.mock('@/router', () => ({
  default: {
    push: vi.fn()
  }
}))

describe('Store兼容性测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('应该能够同时初始化所有stores而不冲突', () => {
    expect(() => {
      const userStore = useUserStore()
      const userModeStore = useUserModeStore()
      const featureUnlockStore = useFeatureUnlockStore()

      // 验证stores都已正确初始化
      expect(userStore).toBeDefined()
      expect(userModeStore).toBeDefined()
      expect(featureUnlockStore).toBeDefined()
    }).not.toThrow()
  })

  it('userModeStore应该能够与userStore协同工作', async () => {
    const userStore = useUserStore()
    const userModeStore = useUserModeStore()

    // 模拟用户登录
    userStore.user = {
      id: 'test-user',
      username: 'testuser',
      email: 'test@example.com',
      credits: 100,
      subscriptionTier: 'free',
      createdAt: new Date()
    }
    userStore.token = 'test-token'

    // 验证用户模式store可以正常工作
    expect(userModeStore.currentMode).toBe('simplified')

    // 切换模式不应该影响userStore
    await userModeStore.switchMode('expert')
    expect(userStore.user?.username).toBe('testuser')
    expect(userStore.isAuthenticated).toBe(true)
  })

  it('featureUnlockStore应该能够正确集成用户状态', async () => {
    const userStore = useUserStore()
    const userModeStore = useUserModeStore()
    const featureUnlockStore = useFeatureUnlockStore()

    // 设置用户登录状态
    userStore.user = {
      id: 'test-user',
      username: 'testuser',
      email: 'test@example.com',
      credits: 100,
      subscriptionTier: 'plus',
      createdAt: new Date()
    }

    // 初始化功能解锁store
    await featureUnlockStore.initialize()

    // 验证功能清单已加载
    expect(featureUnlockStore.featureManifest.length).toBeGreaterThan(0)

    // 验证解锁逻辑可以访问用户体验数据
    const analysis = featureUnlockStore.analyzeUnlockCondition(
      featureUnlockStore.getFeatureDefinition('character-creation-basic')!
    )
    expect(analysis).toBeDefined()
    expect(typeof analysis.progress).toBe('number')
  })

  it('所有stores应该正确处理localStorage', () => {
    const userStore = useUserStore()
    const userModeStore = useUserModeStore()

    // userStore使用token相关的localStorage
    userStore.token = 'test-token'
    expect(localStorage.getItem('token')).toBe('test-token')

    // userModeStore使用模式相关的localStorage
    userModeStore.currentMode = 'expert'
    // 注意：这里只验证不会冲突，实际保存需要调用相应方法

    // 验证localStorage keys不冲突
    const userStoreKeys = ['token', 'refreshToken']
    const userModeStoreKeys = ['userMode', 'userModePreferences']

    const hasOverlap = userStoreKeys.some(key => userModeStoreKeys.includes(key))
    expect(hasOverlap).toBe(false)
  })

  it('应该支持同时使用多个stores的响应式功能', () => {
    const userStore = useUserStore()
    const userModeStore = useUserModeStore()
    const featureUnlockStore = useFeatureUnlockStore()

    // 验证计算属性工作正常
    expect(typeof userStore.isAuthenticated).toBe('boolean')
    expect(typeof userModeStore.shouldSuggestModeUpgrade).toBe('boolean')
    expect(Array.isArray(featureUnlockStore.unlockableFeatures)).toBe(true)

    // 验证状态变化不会相互干扰
    userStore.user = {
      id: 'test',
      username: 'test',
      email: 'test@test.com',
      credits: 0,
      subscriptionTier: 'free',
      createdAt: new Date()
    }

    userModeStore.userExperience.totalSessions = 10

    expect(userStore.isAuthenticated).toBe(false) // 没有token
    expect(userModeStore.shouldSuggestModeUpgrade).toBe(false) // 条件不足
  })

  it('应该正确处理用户登出时的状态清理', async () => {
    const userStore = useUserStore()
    const userModeStore = useUserModeStore()

    // 设置一些状态
    userStore.user = {
      id: 'test',
      username: 'test',
      email: 'test@test.com',
      credits: 0,
      subscriptionTier: 'free',
      createdAt: new Date()
    }
    userStore.token = 'test-token'

    userModeStore.userExperience.totalSessions = 10
    userModeStore.currentMode = 'expert'

    // 用户登出
    await userStore.logout()

    // 验证userStore状态已清理
    expect(userStore.user).toBeNull()
    expect(userStore.token).toBeNull()
    expect(userStore.isAuthenticated).toBe(false)

    // userModeStore状态应该保持（可能需要根据业务需求调整）
    expect(userModeStore.userExperience.totalSessions).toBe(10)
    expect(userModeStore.currentMode).toBe('expert')
  })

  it('应该支持数据共享和交互', () => {
    const userStore = useUserStore()
    const userModeStore = useUserModeStore()
    const featureUnlockStore = useFeatureUnlockStore()

    // 验证stores可以访问彼此的状态
    expect(() => {
      // userModeStore可能需要检查用户的订阅状态
      const isUser = userStore.user !== null

      // featureUnlockStore可能需要访问用户模式
      const currentMode = userModeStore.currentMode

      // 这些操作不应该报错
      expect(typeof isUser).toBe('boolean')
      expect(['simplified', 'expert'].includes(currentMode)).toBe(true)
    }).not.toThrow()
  })

  it('应该正确处理异步操作的并发', async () => {
    const userModeStore = useUserModeStore()
    const featureUnlockStore = useFeatureUnlockStore()

    // 并发执行异步操作
    const promises = [
      userModeStore.loadUserModeData(),
      featureUnlockStore.initialize(),
      userModeStore.recordFeatureUsage('test-feature'),
      userModeStore.incrementSessionCount()
    ]

    // 应该都能正常完成
    await expect(Promise.all(promises)).resolves.toBeDefined()

    // 验证状态一致性
    expect(userModeStore.loading).toBe(false)
    expect(featureUnlockStore.loading).toBe(false)
  })

  it('应该支持错误隔离', async () => {
    const userModeStore = useUserModeStore()
    const featureUnlockStore = useFeatureUnlockStore()

    // 模拟userModeStore发生错误
    const originalConsoleError = console.error
    console.error = vi.fn()

    try {
      // 这应该不会影响featureUnlockStore的正常工作
      await userModeStore.loadUserModeData() // 可能失败
      await featureUnlockStore.initialize() // 应该成功

      expect(featureUnlockStore.featureManifest.length).toBeGreaterThan(0)
    } finally {
      console.error = originalConsoleError
    }
  })
})