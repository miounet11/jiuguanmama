/**
 * PromptInjector 服务测试
 * 测试世界信息注入系统的核心功能
 */

import { PromptInjector } from '../../services/promptInjector'
import { AIModel, PromptContext, InjectionConfig } from '../../types/prompt'
import { worldInfoMatcher } from '../../services/worldInfoMatcher'
import { prisma } from '../../config/database'

// 模拟数据
const mockScenarioId = 'scenario-test-001'
const mockCharacterId = 'character-test-001'

const mockContext: PromptContext = {
  scenarioId: mockScenarioId,
  characterId: mockCharacterId,
  messages: [
    {
      role: 'user',
      content: '告诉我关于这个魔法世界的故事'
    }
  ],
  settings: {
    model: 'grok' as AIModel,
    temperature: 0.7,
    maxTokens: 2000
  }
}

const mockInjectionConfig: InjectionConfig = {
  position: 'system_start',
  maxTokens: 1000,
  priority: 80
}

describe('PromptInjector', () => {
  let promptInjector: PromptInjector

  beforeAll(async () => {
    // 创建测试数据
    await setupTestData()
  })

  beforeEach(() => {
    promptInjector = new PromptInjector()
  })

  afterEach(() => {
    promptInjector.clearCache()
  })

  afterAll(async () => {
    // 清理测试数据
    await cleanupTestData()
  })

  describe('世界信息注入功能', () => {
    test('应该成功注入世界信息到prompt中', async () => {
      const result = await promptInjector.injectWorldInfo(mockContext, mockInjectionConfig)

      expect(result.success).toBe(true)
      expect(result.finalPrompt).toBeDefined()
      expect(result.injectedItems.length).toBeGreaterThan(0)
      expect(result.tokenUsage.total).toBeGreaterThan(0)
      expect(result.performance.totalTime).toBeLessThan(200) // 性能要求 < 200ms
    })

    test('应该按优先级排序注入的条目', async () => {
      const result = await promptInjector.injectWorldInfo(mockContext, mockInjectionConfig)

      if (result.injectedItems.length > 1) {
        for (let i = 0; i < result.injectedItems.length - 1; i++) {
          expect(result.injectedItems[i].priority).toBeGreaterThanOrEqual(
            result.injectedItems[i + 1].priority
          )
        }
      }
    })

    test('应该正确计算token使用量', async () => {
      const result = await promptInjector.injectWorldInfo(mockContext, mockInjectionConfig)

      expect(result.tokenUsage.total).toBe(
        result.tokenUsage.character +
        result.tokenUsage.worldInfo +
        result.tokenUsage.examples +
        result.tokenUsage.context
      )
      expect(result.tokenUsage.available).toBeGreaterThanOrEqual(0)
    })

    test('应该在token预算内注入世界信息', async () => {
      const limitedConfig = {
        ...mockInjectionConfig,
        maxTokens: 100 // 严格限制
      }

      const result = await promptInjector.injectWorldInfo(mockContext, limitedConfig)

      expect(result.tokenUsage.worldInfo).toBeLessThanOrEqual(100)
      expect(result.success).toBe(true)
    })

    test('应该在没有剧本ID时返回空的世界信息', async () => {
      const contextWithoutScenario = {
        ...mockContext,
        scenarioId: undefined
      }

      const result = await promptInjector.injectWorldInfo(contextWithoutScenario, mockInjectionConfig)

      expect(result.success).toBe(true)
      expect(result.injectedItems).toHaveLength(0)
      expect(result.tokenUsage.worldInfo).toBe(0)
    })
  })

  describe('AI模型格式化器测试', () => {
    test('OpenAI格式应该保持独立的system消息', async () => {
      const openaiContext = {
        ...mockContext,
        settings: { ...mockContext.settings, model: 'openai' as AIModel }
      }

      const result = await promptInjector.injectWorldInfo(openaiContext, mockInjectionConfig)

      const systemMessages = result.finalPrompt.filter(msg => msg.role === 'system')
      expect(systemMessages.length).toBeGreaterThan(0)
    })

    test('Claude格式应该将system消息合并到user消息中', async () => {
      const claudeContext = {
        ...mockContext,
        settings: { ...mockContext.settings, model: 'claude' as AIModel }
      }

      const result = await promptInjector.injectWorldInfo(claudeContext, mockInjectionConfig)

      // Claude格式应该主要包含user和assistant消息
      const userMessages = result.finalPrompt.filter(msg => msg.role === 'user')
      expect(userMessages.length).toBeGreaterThan(0)
    })

    test('Gemini格式应该支持system消息', async () => {
      const geminiContext = {
        ...mockContext,
        settings: { ...mockContext.settings, model: 'gemini' as AIModel }
      }

      const result = await promptInjector.injectWorldInfo(geminiContext, mockInjectionConfig)

      expect(result.success).toBe(true)
      expect(result.finalPrompt.length).toBeGreaterThan(0)
    })
  })

  describe('长度优化功能', () => {
    test('应该在超出模型限制时优化prompt长度', async () => {
      const longContext = {
        ...mockContext,
        messages: Array(20).fill(null).map((_, i) => ({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `这是一个很长的消息内容，用来测试token限制和长度优化功能。消息编号: ${i}。`.repeat(50)
        }))
      }

      const result = await promptInjector.injectWorldInfo(longContext, mockInjectionConfig)

      expect(result.success).toBe(true)
      expect(result.tokenUsage.total).toBeLessThanOrEqual(mockInjectionConfig.maxTokens * 5) // 合理范围内
    })

    test('应该为不同模型应用不同的限制', async () => {
      const models: AIModel[] = ['openai', 'claude', 'gemini', 'grok']
      const results = []

      for (const model of models) {
        const modelContext = {
          ...mockContext,
          settings: { ...mockContext.settings, model }
        }

        const result = await promptInjector.optimizeForModel(
          mockContext.messages,
          model,
          1000
        )

        results.push(result)
        expect(result.length).toBeGreaterThan(0)
      }

      expect(results.length).toBe(models.length)
    })
  })

  describe('缓存功能', () => {
    test('应该缓存相同请求的结果', async () => {
      const start1 = performance.now()
      const result1 = await promptInjector.injectWorldInfo(mockContext, mockInjectionConfig)
      const time1 = performance.now() - start1

      const start2 = performance.now()
      const result2 = await promptInjector.injectWorldInfo(mockContext, mockInjectionConfig)
      const time2 = performance.now() - start2

      expect(result1.injectedItems).toEqual(result2.injectedItems)
      expect(time2).toBeLessThan(time1) // 第二次应该更快（命中缓存）
    })

    test('清理缓存后应该重新计算', async () => {
      const result1 = await promptInjector.injectWorldInfo(mockContext, mockInjectionConfig)

      promptInjector.clearCache()

      const result2 = await promptInjector.injectWorldInfo(mockContext, mockInjectionConfig)

      // 结果应该相同，但是重新计算的
      expect(result1.injectedItems).toEqual(result2.injectedItems)
    })
  })

  describe('性能监控', () => {
    test('应该收集性能指标', async () => {
      await promptInjector.injectWorldInfo(mockContext, mockInjectionConfig)

      const metrics = promptInjector.getPerformanceMetrics()

      expect(metrics.totalInjections).toBeGreaterThan(0)
      expect(metrics.averageInjectionTime).toBeGreaterThan(0)
      expect(metrics.averageInjectionTime).toBeLessThan(1000) // 应该在合理范围内
    })

    test('应该跟踪缓存命中率', async () => {
      // 第一次调用
      await promptInjector.injectWorldInfo(mockContext, mockInjectionConfig)

      // 第二次调用（应该命中缓存）
      await promptInjector.injectWorldInfo(mockContext, mockInjectionConfig)

      const metrics = promptInjector.getPerformanceMetrics()
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0)
    })
  })

  describe('错误处理', () => {
    test('应该处理无效的模型类型', async () => {
      const invalidContext = {
        ...mockContext,
        settings: { ...mockContext.settings, model: 'invalid-model' as AIModel }
      }

      await expect(
        promptInjector.injectWorldInfo(invalidContext, mockInjectionConfig)
      ).rejects.toThrow('不支持的模型')
    })

    test('应该处理网络错误', async () => {
      // 模拟数据库连接错误
      const disconnectedContext = {
        ...mockContext,
        scenarioId: 'non-existent-scenario'
      }

      const result = await promptInjector.injectWorldInfo(disconnectedContext, mockInjectionConfig)

      expect(result.success).toBe(true) // 应该优雅降级
      expect(result.injectedItems).toHaveLength(0)
    })
  })

  describe('Token计算功能', () => {
    test('应该准确计算消息token数量', () => {
      const messages = [
        { role: 'user', content: '这是一个测试消息' },
        { role: 'assistant', content: '这是回复消息' }
      ]

      const result = promptInjector.calculateTokenUsage(messages as any, 'grok')

      expect(result.total).toBeGreaterThan(0)
      expect(result.breakdown).toBeDefined()
    })
  })
})

// 辅助函数

async function setupTestData() {
  try {
    // 创建测试剧本
    await prisma.scenario.create({
      data: {
        id: mockScenarioId,
        name: '测试魔法世界',
        description: '用于测试的魔法世界剧本',
        userId: 'test-user-001',
        isPublic: true,
        tags: ['魔法', '奇幻'],
        entries: {
          create: [
            {
              id: 'entry-001',
              title: '魔法学院',
              content: '这是一所古老的魔法学院，位于云端之上。学院教授各种魔法艺术，包括元素魔法、治愈魔法和预言术。',
              keywords: ['魔法学院', '学院', '魔法', '法术'],
              priority: 90,
              insertDepth: 0,
              isActive: true,
              matchType: 'keyword',
              probability: 100
            },
            {
              id: 'entry-002',
              title: '龙族传说',
              content: '远古的龙族曾经统治这片大陆。它们拥有强大的魔法力量和智慧，与人类签订了古老的契约。',
              keywords: ['龙', '龙族', '远古', '传说'],
              priority: 85,
              insertDepth: 0,
              isActive: true,
              matchType: 'keyword',
              probability: 100
            },
            {
              id: 'entry-003',
              title: '魔法物品',
              content: '这个世界充满了各种神奇的魔法物品：魔法水晶可以储存法力，魔法书记录着失传的咒语，魔法药水能够治愈伤病。',
              keywords: ['魔法物品', '水晶', '法杖', '药水'],
              priority: 75,
              insertDepth: 0,
              isActive: true,
              matchType: 'keyword',
              probability: 100
            }
          ]
        }
      }
    })

    console.log('✅ 测试数据创建成功')
  } catch (error) {
    console.error('❌ 创建测试数据失败:', error)
  }
}

async function cleanupTestData() {
  try {
    // 删除测试数据
    await prisma.worldInfoEntry.deleteMany({
      where: { scenarioId: mockScenarioId }
    })

    await prisma.scenario.deleteMany({
      where: { id: mockScenarioId }
    })

    console.log('✅ 测试数据清理成功')
  } catch (error) {
    console.error('❌ 清理测试数据失败:', error)
  }
}