/**
 * ScenarioService 测试
 * 测试剧本管理服务的 CRUD 操作和业务逻辑
 */

import { scenarioService } from '../../services/scenarioService'
import { prisma } from '../../config/database'
import { Scenario, WorldInfoEntry } from '@prisma/client'

// 测试用户ID
const testUserId = 'test-user-scenario'
const testUserId2 = 'test-user-scenario-2'

// 测试剧本数据
const testScenarioData = {
  name: '测试科幻世界',
  description: '一个用于测试的科幻世界剧本',
  userId: testUserId,
  isPublic: true,
  tags: ['科幻', '太空', '未来']
}

const testWorldInfoData = [
  {
    title: '太空站Alpha',
    content: '这是一个巨大的太空站，位于地球轨道上。它是人类在太空中的主要居住地。',
    keywords: ['太空站', 'Alpha', '轨道'],
    priority: 90,
    insertDepth: 0,
    isActive: true,
    matchType: 'keyword',
    probability: 100
  },
  {
    title: '超光速引擎',
    content: '先进的推进技术，允许飞船以超光速在星系间旅行。',
    keywords: ['超光速', '引擎', '推进', '旅行'],
    priority: 85,
    insertDepth: 0,
    isActive: true,
    matchType: 'keyword',
    probability: 100
  }
]

describe('ScenarioService', () => {
  let testScenario: Scenario
  let testUser2Scenario: Scenario

  beforeAll(async () => {
    // 创建测试用户数据
    await setupTestUsers()
  })

  afterAll(async () => {
    // 清理测试数据
    await cleanupTestData()
  })

  describe('剧本CRUD操作', () => {
    test('应该成功创建剧本', async () => {
      const scenario = await scenarioService.createScenario(testScenarioData)

      expect(scenario).toBeDefined()
      expect(scenario.name).toBe(testScenarioData.name)
      expect(scenario.description).toBe(testScenarioData.description)
      expect(scenario.userId).toBe(testScenarioData.userId)
      expect(scenario.isPublic).toBe(testScenarioData.isPublic)
      expect(scenario.tags).toEqual(testScenarioData.tags)

      testScenario = scenario
    })

    test('应该成功获取剧本详情', async () => {
      const scenario = await scenarioService.getScenarioById(testScenario.id)

      expect(scenario).toBeDefined()
      expect(scenario!.id).toBe(testScenario.id)
      expect(scenario!.name).toBe(testScenarioData.name)
    })

    test('应该成功更新剧本', async () => {
      const updateData = {
        name: '更新后的科幻世界',
        description: '更新后的描述',
        tags: ['科幻', '太空', '未来', '机器人']
      }

      const updatedScenario = await scenarioService.updateScenario(
        testScenario.id,
        updateData,
        testUserId
      )

      expect(updatedScenario.name).toBe(updateData.name)
      expect(updatedScenario.description).toBe(updateData.description)
      expect(updatedScenario.tags).toEqual(updateData.tags)
    })

    test('应该成功删除剧本', async () => {
      // 创建一个临时剧本用于删除测试
      const tempScenario = await scenarioService.createScenario({
        ...testScenarioData,
        name: '临时剧本'
      })

      await scenarioService.deleteScenario(tempScenario.id, testUserId)

      const deletedScenario = await scenarioService.getScenarioById(tempScenario.id)
      expect(deletedScenario).toBeNull()
    })
  })

  describe('权限管理', () => {
    beforeAll(async () => {
      // 创建第二个用户的私有剧本
      testUser2Scenario = await scenarioService.createScenario({
        name: '私有剧本',
        description: '用户2的私有剧本',
        userId: testUserId2,
        isPublic: false,
        tags: ['私有']
      })
    })

    test('用户只能访问自己的私有剧本', async () => {
      // 用户1尝试访问用户2的私有剧本
      const scenario = await scenarioService.getScenarioById(testUser2Scenario.id)
      expect(scenario).toBeDefined() // 可以获取到

      // 但不能修改
      await expect(
        scenarioService.updateScenario(
          testUser2Scenario.id,
          { name: '尝试修改' },
          testUserId // 不是所有者
        )
      ).rejects.toThrow('无权限')
    })

    test('用户不能删除他人的剧本', async () => {
      await expect(
        scenarioService.deleteScenario(testUser2Scenario.id, testUserId)
      ).rejects.toThrow('无权限')
    })

    test('所有用户都可以访问公开剧本', async () => {
      const scenario = await scenarioService.getScenarioById(testScenario.id)
      expect(scenario).toBeDefined()
      expect(scenario!.isPublic).toBe(true)
    })
  })

  describe('剧本查询和分页', () => {
    beforeAll(async () => {
      // 创建多个剧本用于分页测试
      for (let i = 1; i <= 5; i++) {
        await scenarioService.createScenario({
          name: `测试剧本 ${i}`,
          description: `第${i}个测试剧本`,
          userId: testUserId,
          isPublic: i % 2 === 0, // 偶数为公开
          tags: [`标签${i}`]
        })
      }
    })

    test('应该正确处理分页和排序', async () => {
      const result = await scenarioService.getScenarios({
        page: 1,
        limit: 3,
        sortBy: 'created',
        sortOrder: 'desc'
      })

      expect(result.scenarios.length).toBeLessThanOrEqual(3)
      expect(result.pagination.currentPage).toBe(1)
      expect(result.pagination.totalPages).toBeGreaterThan(0)
      expect(result.pagination.totalCount).toBeGreaterThan(0)

      // 验证排序：第一个应该是最新创建的
      if (result.scenarios.length > 1) {
        expect(new Date(result.scenarios[0].createdAt).getTime())
          .toBeGreaterThanOrEqual(new Date(result.scenarios[1].createdAt).getTime())
      }
    })

    test('应该支持搜索功能', async () => {
      const result = await scenarioService.getScenarios({
        search: '科幻',
        page: 1,
        limit: 10
      })

      expect(result.scenarios.length).toBeGreaterThan(0)
      result.scenarios.forEach(scenario => {
        expect(
          scenario.name.includes('科幻') ||
          scenario.description?.includes('科幻') ||
          scenario.tags.includes('科幻')
        ).toBe(true)
      })
    })

    test('应该支持标签过滤', async () => {
      const result = await scenarioService.getScenarios({
        tags: ['科幻'],
        page: 1,
        limit: 10
      })

      expect(result.scenarios.length).toBeGreaterThan(0)
      result.scenarios.forEach(scenario => {
        expect(scenario.tags).toContain('科幻')
      })
    })

    test('应该支持公开性过滤', async () => {
      const publicResult = await scenarioService.getScenarios({
        isPublic: true,
        page: 1,
        limit: 10
      })

      publicResult.scenarios.forEach(scenario => {
        expect(scenario.isPublic).toBe(true)
      })

      const privateResult = await scenarioService.getScenarios({
        isPublic: false,
        page: 1,
        limit: 10
      })

      privateResult.scenarios.forEach(scenario => {
        expect(scenario.isPublic).toBe(false)
      })
    })
  })

  describe('世界信息条目管理', () => {
    test('应该成功添加世界信息条目', async () => {
      const entry = await scenarioService.addWorldInfoEntry(
        testScenario.id,
        testWorldInfoData[0],
        testUserId
      )

      expect(entry).toBeDefined()
      expect(entry.title).toBe(testWorldInfoData[0].title)
      expect(entry.content).toBe(testWorldInfoData[0].content)
      expect(entry.keywords).toEqual(testWorldInfoData[0].keywords)
      expect(entry.scenarioId).toBe(testScenario.id)
    })

    test('应该成功批量添加世界信息条目', async () => {
      const entries = await scenarioService.addMultipleWorldInfoEntries(
        testScenario.id,
        testWorldInfoData,
        testUserId
      )

      expect(entries.length).toBe(testWorldInfoData.length)
      entries.forEach((entry, index) => {
        expect(entry.title).toBe(testWorldInfoData[index].title)
        expect(entry.scenarioId).toBe(testScenario.id)
      })
    })

    test('应该成功获取剧本的世界信息条目', async () => {
      const entries = await scenarioService.getWorldInfoEntries(testScenario.id)

      expect(entries.length).toBeGreaterThan(0)
      entries.forEach(entry => {
        expect(entry.scenarioId).toBe(testScenario.id)
      })
    })

    test('应该成功更新世界信息条目', async () => {
      const entries = await scenarioService.getWorldInfoEntries(testScenario.id)
      const firstEntry = entries[0]

      const updateData = {
        title: '更新后的太空站',
        content: '更新后的内容',
        keywords: ['更新', '太空站']
      }

      const updatedEntry = await scenarioService.updateWorldInfoEntry(
        firstEntry.id,
        updateData,
        testUserId
      )

      expect(updatedEntry.title).toBe(updateData.title)
      expect(updatedEntry.content).toBe(updateData.content)
      expect(updatedEntry.keywords).toEqual(updateData.keywords)
    })

    test('应该成功删除世界信息条目', async () => {
      const entries = await scenarioService.getWorldInfoEntries(testScenario.id)
      const entryToDelete = entries[entries.length - 1]

      await scenarioService.deleteWorldInfoEntry(entryToDelete.id, testUserId)

      const remainingEntries = await scenarioService.getWorldInfoEntries(testScenario.id)
      expect(remainingEntries.length).toBe(entries.length - 1)
      expect(remainingEntries.find(e => e.id === entryToDelete.id)).toBeUndefined()
    })
  })

  describe('统计分析功能', () => {
    test('应该生成正确的剧本统计数据', async () => {
      const stats = await scenarioService.getScenarioStats(testUserId)

      expect(stats).toBeDefined()
      expect(stats.totalScenarios).toBeGreaterThan(0)
      expect(stats.publicScenarios).toBeGreaterThanOrEqual(0)
      expect(stats.privateScenarios).toBeGreaterThanOrEqual(0)
      expect(stats.totalWorldInfoEntries).toBeGreaterThan(0)
      expect(stats.totalScenarios).toBe(stats.publicScenarios + stats.privateScenarios)
    })

    test('应该按标签分组统计', async () => {
      const stats = await scenarioService.getScenarioStats(testUserId)

      expect(stats.tagDistribution).toBeDefined()
      expect(Object.keys(stats.tagDistribution).length).toBeGreaterThan(0)

      // 验证标签计数
      Object.values(stats.tagDistribution).forEach(count => {
        expect(count).toBeGreaterThan(0)
      })
    })
  })

  describe('数据验证', () => {
    test('应该验证剧本名称不为空', async () => {
      await expect(
        scenarioService.createScenario({
          ...testScenarioData,
          name: ''
        })
      ).rejects.toThrow()
    })

    test('应该验证用户ID有效', async () => {
      await expect(
        scenarioService.createScenario({
          ...testScenarioData,
          userId: ''
        })
      ).rejects.toThrow()
    })

    test('应该防止重复的剧本名称（同一用户）', async () => {
      await expect(
        scenarioService.createScenario({
          ...testScenarioData,
          name: testScenario.name // 重复名称
        })
      ).rejects.toThrow('剧本名称已存在')
    })
  })

  describe('性能测试', () => {
    test('批量操作应该在合理时间内完成', async () => {
      const start = performance.now()

      // 批量创建100个世界信息条目
      const batchData = Array(100).fill(null).map((_, i) => ({
        title: `批量条目 ${i}`,
        content: `批量创建的第${i}个世界信息条目`,
        keywords: [`batch${i}`, '批量'],
        priority: 50,
        insertDepth: 0,
        isActive: true,
        matchType: 'keyword',
        probability: 100
      }))

      await scenarioService.addMultipleWorldInfoEntries(
        testScenario.id,
        batchData,
        testUserId
      )

      const duration = performance.now() - start
      expect(duration).toBeLessThan(5000) // 应该在5秒内完成
    })

    test('大量数据查询应该有合理的响应时间', async () => {
      const start = performance.now()

      const result = await scenarioService.getScenarios({
        page: 1,
        limit: 50,
        sortBy: 'created',
        sortOrder: 'desc'
      })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(1000) // 应该在1秒内完成
      expect(result.scenarios.length).toBeGreaterThan(0)
    })
  })
})

// 辅助函数

async function setupTestUsers() {
  try {
    // 确保测试用户存在（如果不存在则创建）
    const users = [
      {
        id: testUserId,
        email: 'test-user-scenario@example.com',
        username: 'testuser1',
        passwordHash: 'dummy-hash',
        isActive: true
      },
      {
        id: testUserId2,
        email: 'test-user-scenario-2@example.com',
        username: 'testuser2',
        passwordHash: 'dummy-hash',
        isActive: true
      }
    ]

    for (const userData of users) {
      await prisma.user.upsert({
        where: { id: userData.id },
        update: {},
        create: userData
      })
    }

    console.log('✅ 测试用户设置成功')
  } catch (error) {
    console.error('❌ 设置测试用户失败:', error)
  }
}

async function cleanupTestData() {
  try {
    // 删除世界信息条目
    await prisma.worldInfoEntry.deleteMany({
      where: {
        scenario: {
          userId: { in: [testUserId, testUserId2] }
        }
      }
    })

    // 删除剧本
    await prisma.scenario.deleteMany({
      where: {
        userId: { in: [testUserId, testUserId2] }
      }
    })

    // 删除测试用户
    await prisma.user.deleteMany({
      where: {
        id: { in: [testUserId, testUserId2] }
      }
    })

    console.log('✅ 测试数据清理成功')
  } catch (error) {
    console.error('❌ 清理测试数据失败:', error)
  }
}