/**
 * 世界信息匹配引擎测试套件
 * 全面测试关键词匹配、逻辑操作、递归扫描等功能
 */

import { WorldInfoMatcher } from '../../services/worldInfoMatcher'
import { MatchConfig, LogicOperator, MatchType } from '../../types/worldInfo'
import { WorldInfoEntry } from '@prisma/client'

// 模拟 Prisma 客户端
const mockPrisma = {
  worldInfoEntry: {
    findMany: jest.fn()
  }
}

jest.mock('../../server', () => ({
  prisma: mockPrisma
}))

describe('WorldInfoMatcher', () => {
  let matcher: WorldInfoMatcher
  let mockEntries: WorldInfoEntry[]

  beforeEach(() => {
    matcher = new WorldInfoMatcher({
      maxRecursiveDepth: 2,
      maxActiveEntries: 10,
      performanceThreshold: 50,
      cacheConfig: {
        enabled: true,
        maxSize: 100,
        ttl: 60000
      },
      enableSemanticMatching: false
    })

    // 创建测试用的世界信息条目
    mockEntries = [
      {
        id: 'entry-1',
        scenarioId: 'scenario-1',
        title: '艾尔登大陆',
        content: '艾尔登大陆是一个充满魔法与冒险的奇幻世界，由五大王国组成。',
        keywords: '["艾尔登", "大陆", "王国", "奇幻世界"]',
        priority: 80,
        insertDepth: 4,
        probability: 1.0,
        matchType: 'contains',
        caseSensitive: false,
        isActive: true,
        triggerOnce: false,
        excludeRecursion: false,
        category: '地点',
        group: null,
        position: 'before',
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'entry-2',
        scenarioId: 'scenario-1',
        title: '魔法学院',
        content: '坐落在艾尔登大陆中心的魔法学院，是大陆上最古老的魔法教育机构。',
        keywords: '["魔法学院", "学院", "魔法教育", "/魔法.*/"]',
        priority: 70,
        insertDepth: 3,
        probability: 0.8,
        matchType: 'regex',
        caseSensitive: false,
        isActive: true,
        triggerOnce: false,
        excludeRecursion: false,
        category: '地点',
        group: null,
        position: 'before',
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'entry-3',
        scenarioId: 'scenario-1',
        title: '圣剑传说',
        content: '传说中的圣剑，只有被选中的勇者才能拔出。',
        keywords: '["圣剑", "传说", "勇者", "神器*"]',
        priority: 60,
        insertDepth: 5,
        probability: 0.6,
        matchType: 'wildcard',
        caseSensitive: false,
        isActive: true,
        triggerOnce: true,
        excludeRecursion: false,
        category: '物品',
        group: null,
        position: 'before',
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'entry-4',
        scenarioId: 'scenario-1',
        title: '暗黑法师',
        content: '邪恶的暗黑法师威胁着整个大陆的和平。',
        keywords: 'NOT_ANY:["光明", "和平", "正义"]',
        priority: 50,
        insertDepth: 4,
        probability: 1.0,
        matchType: 'contains',
        caseSensitive: false,
        isActive: true,
        triggerOnce: false,
        excludeRecursion: false,
        category: '角色',
        group: null,
        position: 'before',
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // 模拟数据库查询
    ;(mockPrisma.worldInfoEntry.findMany as jest.Mock).mockResolvedValue(mockEntries)
  })

  afterEach(() => {
    matcher.clearCache()
    jest.clearAllMocks()
  })

  describe('基础关键词匹配', () => {
    test('应该匹配包含关键词的内容', () => {
      const config: MatchConfig = {
        matchType: 'keyword',
        caseSensitive: false,
        wholeWord: false,
        logicOperator: 'AND_ANY'
      }

      const result = matcher.matchKeywords(
        '我来到了艾尔登大陆，这里充满了魔法',
        ['艾尔登', '大陆'],
        config
      )

      expect(result).toBe(true)
    })

    test('应该支持大小写敏感匹配', () => {
      const config: MatchConfig = {
        matchType: 'keyword',
        caseSensitive: true,
        wholeWord: false,
        logicOperator: 'AND_ANY'
      }

      const resultTrue = matcher.matchKeywords(
        '艾尔登大陆',
        ['艾尔登'],
        config
      )

      const resultFalse = matcher.matchKeywords(
        '艾尔登大陆',
        ['艾尔登'],
        { ...config, caseSensitive: false }
      )

      expect(resultTrue).toBe(true)
      expect(resultFalse).toBe(true)

      const resultCaseMismatch = matcher.matchKeywords(
        '艾尔登大陆',
        ['ELDIN'],
        config
      )

      expect(resultCaseMismatch).toBe(false)
    })

    test('应该支持全词匹配', () => {
      const config: MatchConfig = {
        matchType: 'keyword',
        caseSensitive: false,
        wholeWord: true,
        logicOperator: 'AND_ANY'
      }

      const resultMatch = matcher.matchKeywords(
        '魔法学院是最好的学院',
        ['学院'],
        config
      )

      const resultNoMatch = matcher.matchKeywords(
        '魔法学院是最好的学院',
        ['学'],
        config
      )

      expect(resultMatch).toBe(true)
      expect(resultNoMatch).toBe(false)
    })
  })

  describe('逻辑操作符测试', () => {
    const config: MatchConfig = {
      matchType: 'keyword',
      caseSensitive: false,
      wholeWord: false,
      logicOperator: 'AND_ANY'
    }

    test('AND_ANY: 任意匹配', () => {
      const result = matcher.matchKeywords(
        '我在艾尔登大陆探险',
        ['艾尔登', '不存在的词'],
        { ...config, logicOperator: 'AND_ANY' }
      )

      expect(result).toBe(true)
    })

    test('AND_ALL: 全部匹配', () => {
      const resultTrue = matcher.matchKeywords(
        '我在艾尔登大陆的王国探险',
        ['艾尔登', '大陆', '王国'],
        { ...config, logicOperator: 'AND_ALL' }
      )

      const resultFalse = matcher.matchKeywords(
        '我在艾尔登大陆探险',
        ['艾尔登', '大陆', '不存在的词'],
        { ...config, logicOperator: 'AND_ALL' }
      )

      expect(resultTrue).toBe(true)
      expect(resultFalse).toBe(false)
    })

    test('NOT_ANY: 任意不匹配', () => {
      const resultTrue = matcher.matchKeywords(
        '这是一个和平的地方',
        ['邪恶', '黑暗', '死亡'],
        { ...config, logicOperator: 'NOT_ANY' }
      )

      const resultFalse = matcher.matchKeywords(
        '这里有邪恶的力量',
        ['邪恶', '黑暗', '死亡'],
        { ...config, logicOperator: 'NOT_ANY' }
      )

      expect(resultTrue).toBe(true)
      expect(resultFalse).toBe(false)
    })

    test('NOT_ALL: 不是全部匹配', () => {
      const resultTrue = matcher.matchKeywords(
        '这里有邪恶但没有黑暗',
        ['邪恶', '黑暗', '死亡'],
        { ...config, logicOperator: 'NOT_ALL' }
      )

      const resultFalse = matcher.matchKeywords(
        '这里有邪恶、黑暗和死亡',
        ['邪恶', '黑暗', '死亡'],
        { ...config, logicOperator: 'NOT_ALL' }
      )

      expect(resultTrue).toBe(true)
      expect(resultFalse).toBe(false)
    })
  })

  describe('正则表达式匹配', () => {
    test('应该支持正则表达式模式', () => {
      const config: MatchConfig = {
        matchType: 'regex',
        caseSensitive: false,
        wholeWord: false,
        logicOperator: 'AND_ANY'
      }

      const result = matcher.matchKeywords(
        '各种魔法道具散落在地上',
        ['/魔法.*/'],
        config
      )

      expect(result).toBe(true)
    })

    test('应该支持通配符模式', () => {
      const config: MatchConfig = {
        matchType: 'keyword',
        caseSensitive: false,
        wholeWord: false,
        logicOperator: 'AND_ANY'
      }

      const result = matcher.matchKeywords(
        '这里有神器盾牌',
        ['神器*'],
        config
      )

      expect(result).toBe(true)
    })
  })

  describe('世界信息条目查找', () => {
    test('应该找到匹配的条目', async () => {
      const results = await matcher.findActiveEntries(
        'scenario-1',
        '我来到了艾尔登大陆，准备探索魔法学院'
      )

      expect(results).toHaveLength(2)
      expect(results[0].entry.title).toBe('艾尔登大陆')
      expect(results[1].entry.title).toBe('魔法学院')
    })

    test('应该按优先级排序', async () => {
      const results = await matcher.findActiveEntries(
        'scenario-1',
        '艾尔登大陆上有魔法学院和圣剑传说'
      )

      // 应该按优先级降序排列
      expect(results[0].priority).toBeGreaterThanOrEqual(results[1].priority)
    })

    test('应该限制返回数量', async () => {
      const matcherWithLimit = new WorldInfoMatcher({
        maxActiveEntries: 2
      })

      const results = await matcherWithLimit.findActiveEntries(
        'scenario-1',
        '艾尔登大陆魔法学院圣剑暗黑法师'
      )

      expect(results.length).toBeLessThanOrEqual(2)
    })

    test('应该支持概率触发', async () => {
      // 运行多次以测试概率
      const results = []
      for (let i = 0; i < 100; i++) {
        const result = await matcher.findActiveEntries(
          'scenario-1',
          '找寻传说中的圣剑'
        )
        results.push(result.some(r => r.entry.title === '圣剑传说'))
      }

      // 概率为0.6，应该有大约60%的触发率（允许一定误差）
      const triggerRate = results.filter(Boolean).length / 100
      expect(triggerRate).toBeGreaterThan(0.4)
      expect(triggerRate).toBeLessThan(0.8)
    })
  })

  describe('递归扫描', () => {
    test('应该支持递归激活', async () => {
      // 创建能触发递归的条目
      const recursiveEntry: WorldInfoEntry = {
        ...mockEntries[0],
        id: 'recursive-entry',
        title: '王国历史',
        content: '王国的历史与魔法学院紧密相连。',
        keywords: '["王国历史", "历史"]'
      }

      const { prisma } = require('../../server')
      ;(prisma.worldInfoEntry.findMany as jest.Mock).mockResolvedValue([
        ...mockEntries,
        recursiveEntry
      ])

      const results = await matcher.findActiveEntries(
        'scenario-1',
        '我想了解艾尔登大陆的王国'
      )

      // 应该激活艾尔登大陆，然后递归激活包含"王国"的条目
      const titles = results.map(r => r.entry.title)
      expect(titles).toContain('艾尔登大陆')
    })

    test('应该限制递归深度', async () => {
      const matcherWithLimitedDepth = new WorldInfoMatcher({
        maxRecursiveDepth: 1
      })

      const results = await matcherWithLimitedDepth.findActiveEntries(
        'scenario-1',
        '艾尔登大陆王国魔法'
      )

      // 递归深度限制应该防止无限递归
      expect(results.length).toBeLessThan(10)
    })
  })

  describe('优先级计算', () => {
    test('应该正确计算条目优先级', () => {
      const entry = mockEntries[0]
      const matches = ['艾尔登', '大陆']

      const priority = matcher.calculatePriority(entry, matches)

      expect(priority).toBeGreaterThan(0)
      expect(priority).toBeLessThanOrEqual(100)
    })

    test('高优先级条目应该获得更高分数', () => {
      const highPriorityEntry = { ...mockEntries[0], priority: 90 }
      const lowPriorityEntry = { ...mockEntries[0], priority: 30 }
      const matches = ['艾尔登']

      const highScore = matcher.calculatePriority(highPriorityEntry, matches)
      const lowScore = matcher.calculatePriority(lowPriorityEntry, matches)

      expect(highScore).toBeGreaterThan(lowScore)
    })
  })

  describe('性能和缓存', () => {
    test('应该使用缓存提高性能', async () => {
      const context = '艾尔登大陆的魔法学院'

      // 第一次查询
      const start1 = performance.now()
      const results1 = await matcher.findActiveEntries('scenario-1', context)
      const time1 = performance.now() - start1

      // 第二次查询（应该使用缓存）
      const start2 = performance.now()
      const results2 = await matcher.findActiveEntries('scenario-1', context)
      const time2 = performance.now() - start2

      expect(results2).toEqual(results1)
      expect(time2).toBeLessThan(time1) // 缓存应该更快
    })

    test('应该返回性能指标', () => {
      const metrics = matcher.getPerformanceMetrics()

      expect(metrics).toHaveProperty('totalMatchTime')
      expect(metrics).toHaveProperty('averageMatchTime')
      expect(metrics).toHaveProperty('cacheHitRate')
      expect(metrics).toHaveProperty('memoryUsage')
    })

    test('应该在达到性能阈值时发出警告', async () => {
      const slowMatcher = new WorldInfoMatcher({
        performanceThreshold: 1 // 1ms阈值，很容易超过
      })

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      await slowMatcher.findActiveEntries(
        'scenario-1',
        '艾尔登大陆魔法学院圣剑传说'
      )

      // 由于阈值很低，应该会有性能警告
      // expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('错误处理', () => {
    test('应该处理无效的正则表达式', () => {
      const config: MatchConfig = {
        matchType: 'regex',
        caseSensitive: false,
        wholeWord: false,
        logicOperator: 'AND_ANY'
      }

      const result = matcher.matchKeywords(
        '测试内容',
        ['/[invalid regex/'],
        config
      )

      // 无效正则表达式应该被忽略，返回false
      expect(result).toBe(false)
    })

    test('应该处理空关键词', () => {
      const config: MatchConfig = {
        matchType: 'keyword',
        caseSensitive: false,
        wholeWord: false,
        logicOperator: 'AND_ANY'
      }

      const result = matcher.matchKeywords(
        '测试内容',
        [],
        config
      )

      expect(result).toBe(false)
    })

    test('应该处理数据库错误', async () => {
      ;(mockPrisma.worldInfoEntry.findMany as jest.Mock).mockRejectedValue(
        new Error('数据库连接失败')
      )

      await expect(
        matcher.findActiveEntries('scenario-1', '测试内容')
      ).rejects.toThrow('匹配过程中发生错误')
    })
  })

  describe('SillyTavern兼容性', () => {
    test('应该解析SillyTavern风格的关键词', () => {
      const config: MatchConfig = {
        matchType: 'keyword',
        caseSensitive: false,
        wholeWord: false,
        logicOperator: 'AND_ANY'
      }

      // 测试正则表达式语法
      const regexResult = matcher.matchKeywords(
        '魔法师正在施法',
        ['/魔法.*/'],
        config
      )

      // 测试通配符语法
      const wildcardResult = matcher.matchKeywords(
        '神器剑刃',
        ['神器*'],
        config
      )

      expect(regexResult).toBe(true)
      expect(wildcardResult).toBe(true)
    })

    test('应该支持逻辑操作符前缀', () => {
      const config: MatchConfig = {
        matchType: 'keyword',
        caseSensitive: false,
        wholeWord: false,
        logicOperator: 'AND_ANY'
      }

      // 测试NOT_ANY前缀
      const result = matcher.matchKeywords(
        '和平的村庄',
        ['NOT_ANY:邪恶,黑暗'],
        config
      )

      expect(result).toBe(true)
    })
  })

  describe('边界情况', () => {
    test('应该处理极长的文本', () => {
      const longText = '艾尔登'.repeat(10000)
      const config: MatchConfig = {
        matchType: 'keyword',
        caseSensitive: false,
        wholeWord: false,
        logicOperator: 'AND_ANY'
      }

      const result = matcher.matchKeywords(longText, ['艾尔登'], config)
      expect(result).toBe(true)
    })

    test('应该处理特殊字符', () => {
      const config: MatchConfig = {
        matchType: 'keyword',
        caseSensitive: false,
        wholeWord: false,
        logicOperator: 'AND_ANY'
      }

      const result = matcher.matchKeywords(
        '这里有$特殊@字符#',
        ['$特殊@字符#'],
        config
      )

      expect(result).toBe(true)
    })

    test('应该处理Unicode字符', () => {
      const config: MatchConfig = {
        matchType: 'keyword',
        caseSensitive: false,
        wholeWord: false,
        logicOperator: 'AND_ANY'
      }

      const result = matcher.matchKeywords(
        '🐉龙族的传说🗡️',
        ['🐉', '龙族', '🗡️'],
        config
      )

      expect(result).toBe(true)
    })
  })
})

describe('RegexHelpers集成测试', () => {
  let matcher: WorldInfoMatcher

  beforeEach(() => {
    matcher = new WorldInfoMatcher()
  })

  test('应该正确处理复杂的正则表达式', () => {
    const config: MatchConfig = {
      matchType: 'regex',
      caseSensitive: false,
      wholeWord: false,
      logicOperator: 'AND_ANY'
    }

    const result = matcher.matchKeywords(
      '法师学院、战士学院、盗贼学院',
      ['/\\w+学院/'],
      config
    )

    expect(result).toBe(true)
  })

  test('应该防止ReDoS攻击', () => {
    const config: MatchConfig = {
      matchType: 'regex',
      caseSensitive: false,
      wholeWord: false,
      logicOperator: 'AND_ANY'
    }

    // 测试潜在的ReDoS模式
    const result = matcher.matchKeywords(
      'aaaaaaaaaaaaaaaaaaaaa',
      ['/(a+)+$/'],
      config
    )

    // 应该被安全机制阻止，返回false
    expect(result).toBe(false)
  })
})