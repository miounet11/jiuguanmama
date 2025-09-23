/**
 * 情景剧本系统 API 集成测试
 * 测试所有剧本管理相关的API端点
 */

import request from 'supertest'
import { app } from '../../server'
import { prisma } from '../../server'
import { TokenManager } from '../../middleware/auth'

// 测试数据
let testUser: any
let testScenario: any
let testWorldInfoEntry: any
let authToken: string

// 测试用例数据
const testUserData = {
  username: 'scenario-test-user',
  email: 'scenario-test@example.com',
  passwordHash: '$2a$12$test.hash.for.testing',
  isActive: true,
  isVerified: true
}

const testScenarioData = {
  name: '测试剧本',
  description: '这是一个测试用的剧本',
  content: '剧本详细内容',
  isPublic: true,
  tags: ['测试', '剧本'],
  category: '测试分类',
  language: 'zh-CN'
}

const testWorldInfoData = {
  title: '测试世界信息',
  content: '这是一个测试的世界信息条目',
  keywords: ['测试', '关键词'],
  priority: 100,
  insertDepth: 4,
  probability: 1.0,
  matchType: 'contains',
  caseSensitive: false,
  isActive: true,
  triggerOnce: false,
  excludeRecursion: true,
  category: '测试',
  position: 'before'
}

describe('情景剧本系统 API', () => {
  // 测试前设置
  beforeAll(async () => {
    // 创建测试用户
    testUser = await prisma.user.create({
      data: testUserData
    })

    // 生成认证token
    authToken = TokenManager.generateAccessToken({
      userId: testUser.id,
      username: testUser.username,
      email: testUser.email,
      role: 'user'
    })
  })

  // 测试后清理
  afterAll(async () => {
    // 清理测试数据
    await prisma.worldInfoEntry.deleteMany({
      where: { scenario: { userId: testUser.id } }
    })
    await prisma.scenario.deleteMany({
      where: { userId: testUser.id }
    })
    await prisma.user.delete({
      where: { id: testUser.id }
    })
  })

  describe('GET /api/scenarios', () => {
    it('应该返回剧本列表', async () => {
      const response = await request(app)
        .get('/api/scenarios')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          scenarios: expect.any(Array),
          pagination: {
            page: 1,
            limit: 20,
            total: expect.any(Number),
            totalPages: expect.any(Number),
            hasNextPage: expect.any(Boolean),
            hasPrevPage: expect.any(Boolean)
          }
        }
      })
    })

    it('应该支持搜索功能', async () => {
      const response = await request(app)
        .get('/api/scenarios')
        .query({ search: '测试' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.scenarios).toEqual(expect.any(Array))
    })

    it('应该支持分页参数', async () => {
      const response = await request(app)
        .get('/api/scenarios')
        .query({ page: 1, limit: 5 })
        .expect(200)

      expect(response.body.data.pagination.page).toBe(1)
      expect(response.body.data.pagination.limit).toBe(5)
    })

    it('应该支持排序参数', async () => {
      const response = await request(app)
        .get('/api/scenarios')
        .query({ sort: 'rating' })
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })

  describe('POST /api/scenarios', () => {
    it('应该创建新剧本', async () => {
      const response = await request(app)
        .post('/api/scenarios')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testScenarioData)
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(String),
          name: testScenarioData.name,
          description: testScenarioData.description,
          content: testScenarioData.content,
          isPublic: testScenarioData.isPublic,
          tags: testScenarioData.tags,
          category: testScenarioData.category,
          language: testScenarioData.language,
          canEdit: true
        },
        message: '剧本创建成功'
      })

      testScenario = response.body.data
    })

    it('应该拒绝未认证的请求', async () => {
      await request(app)
        .post('/api/scenarios')
        .send(testScenarioData)
        .expect(401)
    })

    it('应该验证必需字段', async () => {
      await request(app)
        .post('/api/scenarios')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(422)
    })

    it('应该防止重名剧本', async () => {
      await request(app)
        .post('/api/scenarios')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testScenarioData)
        .expect(400)
    })
  })

  describe('GET /api/scenarios/:id', () => {
    it('应该返回剧本详情', async () => {
      const response = await request(app)
        .get(`/api/scenarios/${testScenario.id}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: testScenario.id,
          name: testScenario.name,
          worldInfos: expect.any(Array),
          _count: expect.any(Object)
        }
      })
    })

    it('应该返回404对不存在的剧本', async () => {
      await request(app)
        .get('/api/scenarios/non-existent-id')
        .expect(404)
    })
  })

  describe('PUT /api/scenarios/:id', () => {
    it('应该更新剧本', async () => {
      const updateData = {
        name: '更新后的测试剧本',
        description: '更新后的描述'
      }

      const response = await request(app)
        .put(`/api/scenarios/${testScenario.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: testScenario.id,
          name: updateData.name,
          description: updateData.description
        },
        message: '剧本更新成功'
      })
    })

    it('应该拒绝未授权的更新', async () => {
      await request(app)
        .put(`/api/scenarios/${testScenario.id}`)
        .send({ name: '恶意更新' })
        .expect(401)
    })
  })

  describe('POST /api/scenarios/:id/entries', () => {
    it('应该添加世界信息条目', async () => {
      const response = await request(app)
        .post(`/api/scenarios/${testScenario.id}/entries`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(testWorldInfoData)
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(String),
          scenarioId: testScenario.id,
          title: testWorldInfoData.title,
          content: testWorldInfoData.content,
          keywords: testWorldInfoData.keywords,
          priority: testWorldInfoData.priority
        },
        message: '世界信息条目添加成功'
      })

      testWorldInfoEntry = response.body.data
    })

    it('应该验证世界信息数据', async () => {
      await request(app)
        .post(`/api/scenarios/${testScenario.id}/entries`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(422)
    })
  })

  describe('PUT /api/scenarios/:id/entries/:entryId', () => {
    it('应该更新世界信息条目', async () => {
      const updateData = {
        title: '更新后的世界信息',
        priority: 200
      }

      const response = await request(app)
        .put(`/api/scenarios/${testScenario.id}/entries/${testWorldInfoEntry.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: testWorldInfoEntry.id,
          title: updateData.title,
          priority: updateData.priority
        },
        message: '世界信息条目更新成功'
      })
    })
  })

  describe('POST /api/scenarios/:id/test', () => {
    it('应该测试关键词匹配', async () => {
      const testData = {
        testText: '这是一个包含测试关键词的文本',
        depth: 1
      }

      const response = await request(app)
        .post(`/api/scenarios/${testScenario.id}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(testData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          testText: testData.testText,
          depth: testData.depth,
          matchResults: expect.any(Array),
          statistics: {
            totalEntries: expect.any(Number),
            matchingTime: expect.any(Number),
            averageConfidence: expect.any(Number)
          },
          performanceMetrics: expect.any(Object)
        }
      })
    })
  })

  describe('DELETE /api/scenarios/:id/entries/:entryId', () => {
    it('应该删除世界信息条目', async () => {
      await request(app)
        .delete(`/api/scenarios/${testScenario.id}/entries/${testWorldInfoEntry.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect.objectContaining({
        success: true,
        message: '世界信息条目删除成功'
      })
    })
  })

  describe('DELETE /api/scenarios/:id', () => {
    it('应该删除剧本', async () => {
      await request(app)
        .delete(`/api/scenarios/${testScenario.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect.objectContaining({
        success: true,
        message: '剧本删除成功'
      })
    })

    it('应该拒绝未授权的删除', async () => {
      await request(app)
        .delete(`/api/scenarios/${testScenario.id}`)
        .expect(401)
    })
  })

  describe('API 错误处理', () => {
    it('应该处理无效的JSON输入', async () => {
      await request(app)
        .post('/api/scenarios')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400)
    })

    it('应该处理无效的认证token', async () => {
      await request(app)
        .post('/api/scenarios')
        .set('Authorization', 'Bearer invalid-token')
        .send(testScenarioData)
        .expect(401)
    })

    it('应该处理过长的字段值', async () => {
      const invalidData = {
        ...testScenarioData,
        name: 'a'.repeat(200) // 超过最大长度
      }

      await request(app)
        .post('/api/scenarios')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(422)
    })
  })

  describe('API 性能测试', () => {
    it('GET /api/scenarios 应该在合理时间内响应', async () => {
      const startTime = Date.now()

      await request(app)
        .get('/api/scenarios')
        .expect(200)

      const responseTime = Date.now() - startTime
      expect(responseTime).toBeLessThan(500) // 500ms内响应
    })

    it('关键词匹配测试应该在合理时间内完成', async () => {
      // 先创建一个临时剧本用于性能测试
      const tempScenario = await request(app)
        .post('/api/scenarios')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testScenarioData,
          name: '性能测试剧本'
        })
        .expect(201)

      const startTime = Date.now()

      await request(app)
        .post(`/api/scenarios/${tempScenario.body.data.id}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          testText: '性能测试文本',
          depth: 1
        })
        .expect(200)

      const responseTime = Date.now() - startTime
      expect(responseTime).toBeLessThan(200) // 200ms内响应

      // 清理临时剧本
      await request(app)
        .delete(`/api/scenarios/${tempScenario.body.data.id}`)
        .set('Authorization', `Bearer ${authToken}`)
    })
  })
})