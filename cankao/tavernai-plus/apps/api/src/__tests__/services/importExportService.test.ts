/**
 * ImportExportService 测试
 * 测试剧本导入导出功能，包括SillyTavern格式兼容性
 */

import { importExportService } from '../../services/importExportService'
import { formatConverters } from '../../utils/formatConverters'
import { prisma } from '../../config/database'

// 测试用户ID
const testUserId = 'test-user-import-export'

// SillyTavern格式测试数据
const sillyTavernTestData = {
  "entries": {
    "0": {
      "uid": 1,
      "key": ["魔法学院", "学院"],
      "keysecondary": [],
      "comment": "魔法学院描述",
      "content": "这是一所古老的魔法学院，教授各种魔法艺术。",
      "constant": false,
      "selective": true,
      "secondary_keys": [],
      "addMemo": true,
      "order": 100,
      "position": 0,
      "disable": false,
      "excludeRecursion": false,
      "delayUntilRecursion": false,
      "probability": 100,
      "useProbability": true
    },
    "1": {
      "uid": 2,
      "key": ["龙族", "古龙"],
      "keysecondary": [],
      "comment": "龙族传说",
      "content": "远古的龙族拥有强大的魔法力量。",
      "constant": false,
      "selective": true,
      "secondary_keys": [],
      "addMemo": true,
      "order": 90,
      "position": 1,
      "disable": false,
      "excludeRecursion": false,
      "delayUntilRecursion": false,
      "probability": 100,
      "useProbability": true
    }
  }
}

// TavernAI Plus格式测试数据
const tavernAIPlusTestData = {
  name: "测试魔法世界",
  description: "用于测试导入导出的魔法世界",
  isPublic: true,
  tags: ["魔法", "奇幻"],
  entries: [
    {
      title: "魔法学院",
      content: "这是一所古老的魔法学院，教授各种魔法艺术。",
      keywords: ["魔法学院", "学院"],
      priority: 100,
      insertDepth: 0,
      isActive: true,
      matchType: "keyword",
      probability: 100
    },
    {
      title: "龙族传说",
      content: "远古的龙族拥有强大的魔法力量。",
      keywords: ["龙族", "古龙"],
      priority: 90,
      insertDepth: 1,
      isActive: true,
      matchType: "keyword",
      probability: 100
    }
  ]
}

// 增强格式测试数据（包含TavernAI Plus扩展字段）
const enhancedTestData = {
  ...tavernAIPlusTestData,
  metadata: {
    version: "1.0.0",
    author: "测试用户",
    created: new Date().toISOString(),
    lastModified: new Date().toISOString()
  },
  settings: {
    defaultMatchType: "keyword",
    recursiveDepth: 2,
    globalPriority: 50
  },
  entries: tavernAIPlusTestData.entries.map(entry => ({
    ...entry,
    metadata: {
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      usage: {
        timesTriggered: 0,
        lastTriggered: null
      }
    }
  }))
}

describe('ImportExportService', () => {
  let testScenarioId: string

  beforeAll(async () => {
    await setupTestData()
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  describe('SillyTavern格式导入', () => {
    test('应该正确解析SillyTavern格式', async () => {
      const result = await importExportService.importScenario({
        format: 'sillytavern',
        data: sillyTavernTestData,
        userId: testUserId,
        conflictResolution: 'skip',
        validateData: true
      })

      expect(result.success).toBe(true)
      expect(result.scenario).toBeDefined()
      expect(result.scenario!.name).toContain('导入')
      expect(result.importedEntries).toHaveLength(2)
      expect(result.skipped).toHaveLength(0)
      expect(result.errors).toHaveLength(0)

      testScenarioId = result.scenario!.id
    })

    test('应该正确映射SillyTavern字段', async () => {
      const scenario = await prisma.scenario.findUnique({
        where: { id: testScenarioId },
        include: { entries: true }
      })

      expect(scenario).toBeDefined()
      expect(scenario!.entries).toHaveLength(2)

      const firstEntry = scenario!.entries.find(e => e.title === '魔法学院')
      expect(firstEntry).toBeDefined()
      expect(firstEntry!.keywords).toEqual(['魔法学院', '学院'])
      expect(firstEntry!.content).toBe('这是一所古老的魔法学院，教授各种魔法艺术。')
      expect(firstEntry!.priority).toBe(100)
      expect(firstEntry!.isActive).toBe(true)
      expect(firstEntry!.probability).toBe(100)
    })

    test('应该处理无效的SillyTavern数据', async () => {
      const invalidData = {
        entries: {
          "0": {
            // 缺少必需字段
            uid: 1,
            content: "测试内容"
          }
        }
      }

      const result = await importExportService.importScenario({
        format: 'sillytavern',
        data: invalidData,
        userId: testUserId,
        conflictResolution: 'skip',
        validateData: true
      })

      expect(result.success).toBe(true) // 应该部分成功
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('TavernAI Plus格式导入导出', () => {
    test('应该成功导入JSON格式', async () => {
      const result = await importExportService.importScenario({
        format: 'json',
        data: tavernAIPlusTestData,
        userId: testUserId,
        conflictResolution: 'rename',
        validateData: true
      })

      expect(result.success).toBe(true)
      expect(result.scenario).toBeDefined()
      expect(result.importedEntries).toHaveLength(2)
    })

    test('应该成功导出为JSON格式', async () => {
      const exported = await importExportService.exportScenario(testScenarioId, 'json')

      expect(exported).toBeDefined()
      expect(exported.name).toBeDefined()
      expect(exported.entries).toHaveLength(2)
      expect(Array.isArray(exported.entries)).toBe(true)
    })

    test('应该成功导出为SillyTavern格式', async () => {
      const exported = await importExportService.exportScenario(testScenarioId, 'sillytavern')

      expect(exported).toBeDefined()
      expect(exported.entries).toBeDefined()
      expect(Object.keys(exported.entries)).toHaveLength(2)

      // 验证SillyTavern格式字段
      const firstEntry = exported.entries["0"]
      expect(firstEntry.uid).toBeDefined()
      expect(firstEntry.key).toBeDefined()
      expect(firstEntry.content).toBeDefined()
      expect(firstEntry.order).toBeDefined()
    })

    test('应该支持增强格式导入导出', async () => {
      const importResult = await importExportService.importScenario({
        format: 'enhanced',
        data: enhancedTestData,
        userId: testUserId,
        conflictResolution: 'overwrite',
        validateData: true
      })

      expect(importResult.success).toBe(true)

      const exported = await importExportService.exportScenario(
        importResult.scenario!.id,
        'enhanced'
      )

      expect(exported.metadata).toBeDefined()
      expect(exported.settings).toBeDefined()
    })
  })

  describe('冲突解决策略', () => {
    let duplicateScenarioId: string

    beforeAll(async () => {
      // 创建重复数据用于测试冲突
      const scenario = await prisma.scenario.create({
        data: {
          name: '测试魔法世界', // 与导入数据同名
          description: '已存在的剧本',
          userId: testUserId,
          isPublic: false,
          tags: ['现有'],
          entries: {
            create: [{
              title: '魔法学院', // 与导入数据同名
              content: '现有的魔法学院描述',
              keywords: ['现有', '学院'],
              priority: 50,
              insertDepth: 0,
              isActive: true,
              matchType: 'keyword',
              probability: 80
            }]
          }
        }
      })
      duplicateScenarioId = scenario.id
    })

    test('skip策略应该跳过重复项', async () => {
      const result = await importExportService.importScenario({
        format: 'json',
        data: tavernAIPlusTestData,
        userId: testUserId,
        conflictResolution: 'skip',
        validateData: true
      })

      expect(result.success).toBe(true)
      expect(result.skipped.length).toBeGreaterThan(0)
      expect(result.importedEntries.length).toBeLessThan(tavernAIPlusTestData.entries.length)
    })

    test('overwrite策略应该覆盖现有数据', async () => {
      const result = await importExportService.importScenario({
        format: 'json',
        data: tavernAIPlusTestData,
        userId: testUserId,
        conflictResolution: 'overwrite',
        validateData: true,
        targetScenarioId: duplicateScenarioId
      })

      expect(result.success).toBe(true)
      expect(result.overwritten.length).toBeGreaterThan(0)

      // 验证数据已被覆盖
      const scenario = await prisma.scenario.findUnique({
        where: { id: duplicateScenarioId },
        include: { entries: true }
      })

      const magicSchoolEntry = scenario!.entries.find(e => e.title === '魔法学院')
      expect(magicSchoolEntry!.content).toBe(tavernAIPlusTestData.entries[0].content)
    })

    test('merge策略应该合并字段', async () => {
      const result = await importExportService.importScenario({
        format: 'json',
        data: tavernAIPlusTestData,
        userId: testUserId,
        conflictResolution: 'merge',
        validateData: true,
        targetScenarioId: duplicateScenarioId
      })

      expect(result.success).toBe(true)
      expect(result.merged.length).toBeGreaterThan(0)
    })

    test('rename策略应该创建新项目', async () => {
      const result = await importExportService.importScenario({
        format: 'json',
        data: tavernAIPlusTestData,
        userId: testUserId,
        conflictResolution: 'rename',
        validateData: true
      })

      expect(result.success).toBe(true)
      expect(result.scenario!.name).not.toBe(tavernAIPlusTestData.name)
      expect(result.scenario!.name).toContain('副本')
    })
  })

  describe('批量导入导出', () => {
    test('应该支持批量导入多个剧本', async () => {
      const batchData = [
        { ...tavernAIPlusTestData, name: '批量剧本1' },
        { ...tavernAIPlusTestData, name: '批量剧本2' },
        { ...tavernAIPlusTestData, name: '批量剧本3' }
      ]

      const results = await importExportService.batchImportScenarios({
        format: 'json',
        scenarios: batchData,
        userId: testUserId,
        conflictResolution: 'rename',
        validateData: true
      })

      expect(results.length).toBe(3)
      results.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.scenario).toBeDefined()
      })
    })

    test('应该支持批量导出剧本', async () => {
      const userScenarios = await prisma.scenario.findMany({
        where: { userId: testUserId },
        select: { id: true }
      })

      const scenarioIds = userScenarios.map(s => s.id)
      const exported = await importExportService.batchExportScenarios(scenarioIds, 'json')

      expect(exported.scenarios.length).toBe(scenarioIds.length)
      expect(exported.metadata).toBeDefined()
      expect(exported.metadata.exportedAt).toBeDefined()
      expect(exported.metadata.totalScenarios).toBe(scenarioIds.length)
    })
  })

  describe('数据验证和完整性', () => {
    test('应该验证导入数据结构', async () => {
      const invalidData = {
        name: '', // 无效的名称
        entries: 'invalid' // 无效的条目格式
      }

      const result = await importExportService.importScenario({
        format: 'json',
        data: invalidData,
        userId: testUserId,
        conflictResolution: 'skip',
        validateData: true
      })

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    test('应该检查数据完整性', async () => {
      const originalScenario = await prisma.scenario.findUnique({
        where: { id: testScenarioId },
        include: { entries: true }
      })

      // 导出然后重新导入
      const exported = await importExportService.exportScenario(testScenarioId, 'json')
      const reimportResult = await importExportService.importScenario({
        format: 'json',
        data: exported,
        userId: testUserId,
        conflictResolution: 'rename',
        validateData: true
      })

      expect(reimportResult.success).toBe(true)

      const reimportedScenario = await prisma.scenario.findUnique({
        where: { id: reimportResult.scenario!.id },
        include: { entries: true }
      })

      // 验证数据完整性
      expect(reimportedScenario!.entries.length).toBe(originalScenario!.entries.length)
      expect(reimportedScenario!.description).toBe(originalScenario!.description)
      expect(reimportedScenario!.tags).toEqual(originalScenario!.tags)
    })

    test('应该处理大文件导入', async () => {
      // 创建包含大量条目的测试数据
      const largeData = {
        ...tavernAIPlusTestData,
        name: '大型剧本',
        entries: Array(1000).fill(null).map((_, i) => ({
          title: `大型条目 ${i}`,
          content: `这是第${i}个大型世界信息条目，包含详细的描述信息。`.repeat(10),
          keywords: [`keyword${i}`, `large${i}`],
          priority: Math.floor(Math.random() * 100),
          insertDepth: 0,
          isActive: true,
          matchType: 'keyword',
          probability: 100
        }))
      }

      const start = performance.now()
      const result = await importExportService.importScenario({
        format: 'json',
        data: largeData,
        userId: testUserId,
        conflictResolution: 'rename',
        validateData: true
      })
      const duration = performance.now() - start

      expect(result.success).toBe(true)
      expect(result.importedEntries).toHaveLength(1000)
      expect(duration).toBeLessThan(10000) // 应在10秒内完成
    })
  })

  describe('格式转换器测试', () => {
    test('应该正确转换SillyTavern到TavernAI Plus', () => {
      const converted = formatConverters.sillyTavernToTavernAIPlus(sillyTavernTestData)

      expect(converted.name).toBeDefined()
      expect(converted.entries).toHaveLength(2)
      expect(converted.entries[0].title).toBeDefined()
      expect(converted.entries[0].keywords).toBeDefined()
      expect(Array.isArray(converted.entries[0].keywords)).toBe(true)
    })

    test('应该正确转换TavernAI Plus到SillyTavern', () => {
      const converted = formatConverters.tavernAIPlusToSillyTavern(tavernAIPlusTestData)

      expect(converted.entries).toBeDefined()
      expect(Object.keys(converted.entries)).toHaveLength(2)

      const entry = converted.entries["0"]
      expect(entry.uid).toBeDefined()
      expect(entry.key).toBeDefined()
      expect(entry.content).toBeDefined()
    })

    test('应该处理字段映射边界情况', () => {
      const edgeCaseData = {
        entries: {
          "0": {
            uid: 1,
            key: [], // 空关键词数组
            content: "",  // 空内容
            order: null, // null优先级
            disable: true // 禁用状态
          }
        }
      }

      const converted = formatConverters.sillyTavernToTavernAIPlus(edgeCaseData)

      expect(converted.entries).toHaveLength(1)
      expect(converted.entries[0].keywords).toEqual([])
      expect(converted.entries[0].content).toBe("")
      expect(converted.entries[0].isActive).toBe(false)
    })
  })

  describe('错误处理和恢复', () => {
    test('应该处理网络中断', async () => {
      // 模拟数据库连接错误
      const originalConnect = prisma.$connect
      jest.spyOn(prisma, '$connect').mockRejectedValueOnce(new Error('Connection failed'))

      const result = await importExportService.importScenario({
        format: 'json',
        data: tavernAIPlusTestData,
        userId: testUserId,
        conflictResolution: 'skip',
        validateData: true
      })

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)

      // 恢复原始方法
      jest.restoreAllMocks()
    })

    test('应该支持部分导入', async () => {
      const mixedData = {
        ...tavernAIPlusTestData,
        entries: [
          ...tavernAIPlusTestData.entries,
          {
            title: '', // 无效条目
            content: '',
            keywords: [],
            priority: -1 // 无效优先级
          }
        ]
      }

      const result = await importExportService.importScenario({
        format: 'json',
        data: mixedData,
        userId: testUserId,
        conflictResolution: 'skip',
        validateData: true,
        allowPartialImport: true
      })

      expect(result.success).toBe(true) // 部分成功
      expect(result.importedEntries.length).toBe(2) // 只导入了有效条目
      expect(result.errors.length).toBeGreaterThan(0) // 有错误记录
    })
  })
})

// 辅助函数

async function setupTestData() {
  try {
    // 创建测试用户
    await prisma.user.upsert({
      where: { id: testUserId },
      update: {},
      create: {
        id: testUserId,
        email: 'test-import-export@example.com',
        username: 'testimportuser',
        passwordHash: 'dummy-hash',
        isActive: true
      }
    })

    console.log('✅ 导入导出测试数据设置成功')
  } catch (error) {
    console.error('❌ 设置导入导出测试数据失败:', error)
  }
}

async function cleanupTestData() {
  try {
    // 删除世界信息条目
    await prisma.worldInfoEntry.deleteMany({
      where: {
        scenario: { userId: testUserId }
      }
    })

    // 删除剧本
    await prisma.scenario.deleteMany({
      where: { userId: testUserId }
    })

    // 删除测试用户
    await prisma.user.delete({
      where: { id: testUserId }
    })

    console.log('✅ 导入导出测试数据清理成功')
  } catch (error) {
    console.error('❌ 清理导入导出测试数据失败:', error)
  }
}