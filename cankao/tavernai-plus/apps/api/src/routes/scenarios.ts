import { Router } from 'express'
import { z } from 'zod'
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { scenarioService } from '../services/scenarioService'

const router = Router()

// Zod 验证 schemas
const createScenarioSchema = z.object({
  name: z.string().min(1, '剧本名称不能为空').max(100, '剧本名称不能超过100字符'),
  description: z.string().optional(),
  content: z.string().optional(),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  category: z.string().default('通用'),
  language: z.string().default('zh-CN')
})

const updateScenarioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  language: z.string().optional()
})

const scenarioQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  sort: z.enum(['created', 'updated', 'rating', 'popular', 'name']).default('created'),
  search: z.string().optional(),
  category: z.string().optional(),
  isPublic: z.string().transform(val => val === 'true').optional(),
  tags: z.string().transform(val => val.split(',')).optional()
})

const createWorldInfoEntrySchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
  content: z.string().min(1, '内容不能为空'),
  keywords: z.array(z.string()).min(1, '关键词不能为空'),
  priority: z.number().int().min(0).max(999).default(0),
  insertDepth: z.number().int().min(0).default(4),
  probability: z.number().min(0).max(1).default(1.0),
  matchType: z.enum(['exact', 'contains', 'regex', 'starts_with', 'ends_with', 'wildcard']).default('contains'),
  caseSensitive: z.boolean().default(false),
  isActive: z.boolean().default(true),
  triggerOnce: z.boolean().default(false),
  excludeRecursion: z.boolean().default(true),
  category: z.string().default('通用'),
  group: z.string().optional(),
  position: z.enum(['before', 'after', 'replace']).default('before')
})

const updateWorldInfoEntrySchema = createWorldInfoEntrySchema.partial()

const testMatchingSchema = z.object({
  testText: z.string().min(1, '测试文本不能为空'),
  depth: z.number().int().min(1).max(5).default(1)
})

// 剧本 CRUD API

/**
 * GET /api/scenarios - 获取剧本列表
 */
router.get('/', optionalAuth, validate(scenarioQuerySchema, 'query'), async (req: AuthRequest, res) => {
  try {
    const { page, limit, sort, search, category, isPublic, tags } = req.query
    const userId = req.user?.id

    const { scenarios, total } = await scenarioService.getScenarios(userId, {
      page, limit, sort, search, category, isPublic, tags
    })

    const totalPages = Math.ceil(total / limit)

    res.json({
      success: true,
      data: {
        scenarios,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    })
  } catch (error) {
    console.error('获取剧本列表失败:', error)
    res.status(500).json({
      success: false,
      error: '获取剧本列表失败'
    })
  }
})

/**
 * GET /api/scenarios/:id - 获取剧本详情
 */
router.get('/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    const scenario = await scenarioService.getScenarioById(id, userId)

    if (!scenario) {
      return res.status(404).json({
        success: false,
        error: '剧本不存在'
      })
    }

    res.json({
      success: true,
      data: scenario
    })
  } catch (error) {
    console.error('获取剧本详情失败:', error)
    if (error.message === '没有权限访问此剧本') {
      return res.status(403).json({
        success: false,
        error: error.message
      })
    }
    res.status(500).json({
      success: false,
      error: '获取剧本详情失败'
    })
  }
})

/**
 * POST /api/scenarios - 创建新剧本
 */
router.post('/', authenticate, validate(createScenarioSchema), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const scenario = await scenarioService.createScenario(userId, req.body)

    res.status(201).json({
      success: true,
      data: scenario,
      message: '剧本创建成功'
    })
  } catch (error) {
    console.error('创建剧本失败:', error)
    if (error.message === '已存在同名剧本') {
      return res.status(400).json({
        success: false,
        error: error.message
      })
    }
    res.status(500).json({
      success: false,
      error: '创建剧本失败'
    })
  }
})

/**
 * PUT /api/scenarios/:id - 更新剧本
 */
router.put('/:id', authenticate, validate(updateScenarioSchema), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const scenario = await scenarioService.updateScenario(id, userId, req.body)

    res.json({
      success: true,
      data: scenario,
      message: '剧本更新成功'
    })
  } catch (error) {
    console.error('更新剧本失败:', error)
    if (error.message === '剧本不存在') {
      return res.status(404).json({ success: false, error: error.message })
    }
    if (error.message === '没有权限操作此剧本' || error.message === '已存在同名剧本') {
      return res.status(400).json({ success: false, error: error.message })
    }
    res.status(500).json({
      success: false,
      error: '更新剧本失败'
    })
  }
})

/**
 * DELETE /api/scenarios/:id - 删除剧本
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    await scenarioService.deleteScenario(id, userId)

    res.json({
      success: true,
      message: '剧本删除成功'
    })
  } catch (error) {
    console.error('删除剧本失败:', error)
    if (error.message === '剧本不存在') {
      return res.status(404).json({ success: false, error: error.message })
    }
    if (error.message === '没有权限操作此剧本') {
      return res.status(403).json({ success: false, error: error.message })
    }
    res.status(500).json({
      success: false,
      error: '删除剧本失败'
    })
  }
})

// 世界信息条目 API

/**
 * POST /api/scenarios/:id/entries - 添加世界信息条目
 */
router.post('/:id/entries', authenticate, validate(createWorldInfoEntrySchema), async (req: AuthRequest, res) => {
  try {
    const { id: scenarioId } = req.params
    const userId = req.user!.id
    const entry = await scenarioService.createWorldInfoEntry(scenarioId, userId, req.body)

    res.status(201).json({
      success: true,
      data: entry,
      message: '世界信息条目添加成功'
    })
  } catch (error) {
    console.error('添加世界信息条目失败:', error)
    if (error.message === '剧本不存在') {
      return res.status(404).json({ success: false, error: error.message })
    }
    if (error.message === '没有权限操作此剧本') {
      return res.status(403).json({ success: false, error: error.message })
    }
    res.status(500).json({
      success: false,
      error: '添加世界信息条目失败'
    })
  }
})

/**
 * PUT /api/scenarios/:id/entries/:entryId - 更新世界信息条目
 */
router.put('/:id/entries/:entryId', authenticate, validate(updateWorldInfoEntrySchema), async (req: AuthRequest, res) => {
  try {
    const { id: scenarioId, entryId } = req.params
    const userId = req.user!.id
    const entry = await scenarioService.updateWorldInfoEntry(scenarioId, entryId, userId, req.body)

    res.json({
      success: true,
      data: entry,
      message: '世界信息条目更新成功'
    })
  } catch (error) {
    console.error('更新世界信息条目失败:', error)
    if (error.message === '剧本不存在' || error.message === '世界信息条目不存在') {
      return res.status(404).json({ success: false, error: error.message })
    }
    if (error.message === '没有权限操作此剧本') {
      return res.status(403).json({ success: false, error: error.message })
    }
    res.status(500).json({
      success: false,
      error: '更新世界信息条目失败'
    })
  }
})

/**
 * DELETE /api/scenarios/:id/entries/:entryId - 删除世界信息条目
 */
router.delete('/:id/entries/:entryId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id: scenarioId, entryId } = req.params
    const userId = req.user!.id
    await scenarioService.deleteWorldInfoEntry(scenarioId, entryId, userId)

    res.json({
      success: true,
      message: '世界信息条目删除成功'
    })
  } catch (error) {
    console.error('删除世界信息条目失败:', error)
    if (error.message === '剧本不存在' || error.message === '世界信息条目不存在') {
      return res.status(404).json({ success: false, error: error.message })
    }
    if (error.message === '没有权限操作此剧本') {
      return res.status(403).json({ success: false, error: error.message })
    }
    res.status(500).json({
      success: false,
      error: '删除世界信息条目失败'
    })
  }
})

/**
 * POST /api/scenarios/:id/test - 测试关键词匹配
 */
router.post('/:id/test', authenticate, validate(testMatchingSchema), async (req: AuthRequest, res) => {
  try {
    const { id: scenarioId } = req.params
    const { testText, depth } = req.body
    const userId = req.user!.id

    const result = await scenarioService.testMatching(scenarioId, userId, testText, depth)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('测试关键词匹配失败:', error)
    if (error.message === '剧本不存在') {
      return res.status(404).json({ success: false, error: error.message })
    }
    if (error.message === '没有权限操作此剧本') {
      return res.status(403).json({ success: false, error: error.message })
    }
    res.status(500).json({
      success: false,
      error: '测试关键词匹配失败'
    })
  }
})

export default router