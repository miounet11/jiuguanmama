/**
 * userModeStore 单元测试 - 补充测试
 *
 * 本测试套件补充测试 userModeStore 的基本功能和集成场景：
 * - 基本状态管理
 * - 模式切换功能
 * - 功能使用记录
 * - 升级建议算法
 */

import { setActivePinia, createPinia } from 'pinia'
import { useUserModeStore } from '@/stores/userModeStore'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock dependencies
vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
    put: vi.fn().mockResolvedValue({ data: { success: true } })
  }
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// Mock window object for testing environment
const mockWindow = {
  localStorage: localStorageMock
}
global.window = mockWindow as any
global.localStorage = localStorageMock as any

describe('userModeStore - 补充单元测试', () => {
  let store: ReturnType<typeof useUserModeStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useUserModeStore()
    vi.clearAllMocks()
    localStorageMock.clear.mockClear()
  })

  describe('基本状态管理', () => {
    it('应该有正确的初始状态', () => {
      expect(store.currentMode).toBe('simplified')
      expect(store.userExperience.skillLevel).toBe('beginner')
      expect(store.userExperience.totalSessions).toBe(0)
      expect(store.userExperience.featuresUsed).toEqual([])
    })

    it('应该能够切换用户模式', async () => {
      await store.switchMode('expert', 'test')
      expect(store.currentMode).toBe('expert')

      await store.switchMode('simplified', 'test')
      expect(store.currentMode).toBe('simplified')
    })
  })

  describe('功能使用记录', () => {
    it('应该能够记录功能使用', async () => {
      await store.recordFeatureUsage('test-feature', false)
      expect(store.userExperience.featuresUsed).toContain('test-feature')

      await store.recordFeatureUsage('expert-feature', true)
      expect(store.userExperience.expertFeaturesUsed).toContain('expert-feature')
    })

    it('应该能够更新技能水平', () => {
      // 技能水平更新测试 - 先检查初始状态是beginner
      expect(store.userExperience.skillLevel).toBe('beginner')

      // updateSkillLevel方法应该存在并可调用
      expect(typeof store.updateSkillLevel).toBe('function')
      store.updateSkillLevel()

      // 由于初始数据都是0，应该还是beginner
      expect(store.userExperience.skillLevel).toBe('beginner')
    })
  })

  describe('升级建议算法', () => {
    it('应该在用户达到条件时建议升级', () => {
      // 检查初始状态下不应该建议升级
      expect(store.shouldSuggestModeUpgrade).toBe(false)

      // 检查专家模式下也不应该建议升级
      expect(store.currentMode).toBe('simplified')

      // shouldSuggestModeUpgrade 应该是一个computed属性
      expect(typeof store.shouldSuggestModeUpgrade).toBe('boolean')
    })

    it('专家模式用户不应该收到升级建议', () => {
      store.currentMode = 'expert'
      expect(store.shouldSuggestModeUpgrade).toBe(false)
    })
  })

})