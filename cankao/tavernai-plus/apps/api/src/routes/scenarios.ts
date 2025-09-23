import { Router } from 'express'
import { authenticate as auth } from '../middleware/auth'

const router = Router()

// 临时的模拟数据，防止前端404错误
const mockScenarios = [
  {
    id: '1',
    name: '幻想冒险',
    description: '在一个充满魔法和奇迹的世界中展开冒险',
    category: 'fantasy',
    tags: ['冒险', '魔法', '奇幻'],
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    creatorId: 'system',
    creator: {
      id: 'system',
      username: '系统',
      avatar: null
    },
    usage: 0,
    rating: 4.5,
    ratingCount: 10
  },
  {
    id: '2',
    name: '现代都市',
    description: '现代城市背景下的日常生活故事',
    category: 'modern',
    tags: ['都市', '现代', '日常'],
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    creatorId: 'system',
    creator: {
      id: 'system',
      username: '系统',
      avatar: null
    },
    usage: 0,
    rating: 4.2,
    ratingCount: 8
  },
  {
    id: '3',
    name: '科幻未来',
    description: '未来世界的科技与人文探索',
    category: 'sci-fi',
    tags: ['科幻', '未来', '科技'],
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    creatorId: 'system',
    creator: {
      id: 'system',
      username: '系统',
      avatar: null
    },
    usage: 0,
    rating: 4.7,
    ratingCount: 15
  }
]

const mockCategories = [
  { id: 'fantasy', name: '奇幻', count: 5 },
  { id: 'modern', name: '现代', count: 8 },
  { id: 'sci-fi', name: '科幻', count: 3 },
  { id: 'romance', name: '浪漫', count: 7 },
  { id: 'adventure', name: '冒险', count: 6 }
]

const mockTags = [
  { id: '1', name: '冒险', count: 12 },
  { id: '2', name: '魔法', count: 8 },
  { id: '3', name: '奇幻', count: 10 },
  { id: '4', name: '都市', count: 6 },
  { id: '5', name: '现代', count: 9 },
  { id: '6', name: '日常', count: 7 },
  { id: '7', name: '科幻', count: 5 },
  { id: '8', name: '未来', count: 4 },
  { id: '9', name: '科技', count: 6 }
]

// GET /scenarios - 获取剧本列表
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 12, sort = 'created', category, tags, search } = req.query

    let filteredScenarios = [...mockScenarios]

    // 分类过滤
    if (category && category !== 'all') {
      filteredScenarios = filteredScenarios.filter(s => s.category === category)
    }

    // 标签过滤
    if (tags) {
      const tagArray = typeof tags === 'string' ? tags.split(',') : []
      filteredScenarios = filteredScenarios.filter(s =>
        tagArray.some(tag => s.tags.includes(tag))
      )
    }

    // 搜索过滤
    if (search) {
      const searchLower = String(search).toLowerCase()
      filteredScenarios = filteredScenarios.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower)
      )
    }

    // 排序
    switch (sort) {
      case 'popular':
        filteredScenarios.sort((a, b) => b.usage - a.usage)
        break
      case 'rating':
        filteredScenarios.sort((a, b) => b.rating - a.rating)
        break
      case 'created':
      default:
        filteredScenarios.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
    }

    // 分页
    const pageNum = parseInt(String(page))
    const limitNum = parseInt(String(limit))
    const startIndex = (pageNum - 1) * limitNum
    const endIndex = startIndex + limitNum
    const paginatedScenarios = filteredScenarios.slice(startIndex, endIndex)

    res.json({
      success: true,
      data: {
        scenarios: paginatedScenarios,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredScenarios.length,
          totalPages: Math.ceil(filteredScenarios.length / limitNum)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching scenarios:', error)
    res.status(500).json({
      success: false,
      error: '获取剧本列表失败'
    })
  }
})

// GET /scenarios/categories - 获取分类列表
router.get('/categories', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: mockCategories
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({
      success: false,
      error: '获取分类列表失败'
    })
  }
})

// GET /scenarios/tags - 获取标签列表
router.get('/tags', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: mockTags
    })
  } catch (error) {
    console.error('Error fetching tags:', error)
    res.status(500).json({
      success: false,
      error: '获取标签列表失败'
    })
  }
})

// GET /scenarios/:id - 获取剧本详情
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    const scenario = mockScenarios.find(s => s.id === id)

    if (!scenario) {
      return res.status(404).json({
        success: false,
        error: '剧本不存在'
      })
    }

    // 添加详细信息
    const detailedScenario = {
      ...scenario,
      worldInfos: [
        {
          id: '1',
          title: '世界背景',
          content: '这是一个充满魔法的世界，各种种族和谐共存...',
          keywords: ['魔法', '种族', '世界'],
          priority: 100,
          isActive: true
        },
        {
          id: '2',
          title: '重要人物',
          content: '艾莉亚是这个世界的传奇法师，拥有强大的魔法力量...',
          keywords: ['艾莉亚', '法师', '魔法'],
          priority: 90,
          isActive: true
        }
      ],
      creator: {
        id: 'system',
        username: '系统',
        avatar: null
      }
    }

    res.json({
      success: true,
      data: detailedScenario
    })
  } catch (error) {
    console.error('Error fetching scenario:', error)
    res.status(500).json({
      success: false,
      error: '获取剧本详情失败'
    })
  }
})

// POST /scenarios - 创建新剧本
router.post('/', auth, async (req, res) => {
  try {
    // 这里应该创建新剧本，现在返回临时响应
    res.status(501).json({
      success: false,
      error: '剧本创建功能正在开发中'
    })
  } catch (error) {
    console.error('Error creating scenario:', error)
    res.status(500).json({
      success: false,
      error: '创建剧本失败'
    })
  }
})

// PUT /scenarios/:id - 更新剧本
router.put('/:id', auth, async (req, res) => {
  try {
    // 这里应该更新剧本，现在返回临时响应
    res.status(501).json({
      success: false,
      error: '剧本更新功能正在开发中'
    })
  } catch (error) {
    console.error('Error updating scenario:', error)
    res.status(500).json({
      success: false,
      error: '更新剧本失败'
    })
  }
})

// DELETE /scenarios/:id - 删除剧本
router.delete('/:id', auth, async (req, res) => {
  try {
    // 这里应该删除剧本，现在返回临时响应
    res.status(501).json({
      success: false,
      error: '剧本删除功能正在开发中'
    })
  } catch (error) {
    console.error('Error deleting scenario:', error)
    res.status(500).json({
      success: false,
      error: '删除剧本失败'
    })
  }
})

export default router