import { Router, Request, Response } from 'express'
import { AuthRequest, authenticate } from '../middleware/auth'
import { RecommendationEngine } from '../services/recommendationEngine'
import { prisma } from '../lib/prisma'

const router = Router()
const recommendationEngine = new RecommendationEngine()

// 获取角色推荐
router.get('/characters', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const {
      limit = 10,
      algorithm = 'hybrid',
      minScore = 0.1,
      category,
      includeExplored = false
    } = req.query

    const options = {
      limit: Number(limit),
      algorithm: algorithm as 'collaborative' | 'content' | 'hybrid',
      minScore: Number(minScore),
      category: category as string,
      includeExplored: includeExplored === 'true'
    }

    const recommendations = await recommendationEngine.getCharacterRecommendations(userId, options)

    res.json({
      success: true,
      data: {
        recommendations,
        algorithm: options.algorithm,
        totalCount: Array.isArray(recommendations.characters) ? recommendations.characters.length : 0
      }
    })
  } catch (error) {
    console.error('获取角色推荐失败:', error)
    res.status(500).json({
      success: false,
      message: '获取角色推荐失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 获取内容推荐
router.get('/posts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const {
      limit = 10,
      algorithm = 'hybrid',
      minScore = 0.1,
      contentType,
      includeExplored = false
    } = req.query

    const options = {
      limit: Number(limit),
      algorithm: algorithm as 'collaborative' | 'content' | 'hybrid',
      minScore: Number(minScore),
      contentType: contentType as string,
      includeExplored: includeExplored === 'true'
    }

    const recommendations = await recommendationEngine.getPostRecommendations(userId, options)

    res.json({
      success: true,
      data: {
        recommendations,
        algorithm: options.algorithm,
        totalCount: Array.isArray(recommendations.posts) ? recommendations.posts.length : 0
      }
    })
  } catch (error) {
    console.error('获取内容推荐失败:', error)
    res.status(500).json({
      success: false,
      message: '获取内容推荐失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 记录用户行为
router.post('/behavior', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { action, targetType, targetId, weight = 1.0, metadata = {} } = req.body

    if (!action || !targetType || !targetId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: action, targetType, targetId'
      })
    }

    // 记录用户行为
    const behavior = await prisma.userBehavior.create({
      data: {
        userId,
        action,
        targetType,
        targetId,
        weight: Number(weight),
        metadata,
        timestamp: new Date()
      }
    })

    // 更新推荐模型性能指标
    await recommendationEngine.trackModelPerformance(userId, targetId, action === 'click' ? 1 : 0)

    res.json({
      success: true,
      data: behavior
    })
  } catch (error) {
    console.error('记录用户行为失败:', error)
    res.status(500).json({
      success: false,
      message: '记录用户行为失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 获取用户偏好
router.get('/preferences', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const preferences = await prisma.userPreference.findMany({
      where: { userId },
      orderBy: { weight: 'desc' }
    })

    res.json({
      success: true,
      data: preferences
    })
  } catch (error) {
    console.error('获取用户偏好失败:', error)
    res.status(500).json({
      success: false,
      message: '获取用户偏好失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 更新用户偏好
router.put('/preferences', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { preferences } = req.body

    if (!Array.isArray(preferences)) {
      return res.status(400).json({
        success: false,
        message: 'preferences 必须是数组格式'
      })
    }

    // 删除现有偏好
    await prisma.userPreference.deleteMany({
      where: { userId }
    })

    // 创建新偏好
    const newPreferences = await Promise.all(
      preferences.map((pref: any) =>
        prisma.userPreference.create({
          data: {
            userId,
            category: pref.category,
            value: pref.value,
            weight: pref.weight || 1.0
          }
        })
      )
    )

    res.json({
      success: true,
      data: newPreferences
    })
  } catch (error) {
    console.error('更新用户偏好失败:', error)
    res.status(500).json({
      success: false,
      message: '更新用户偏好失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 获取推荐统计信息
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id

    // 获取用户行为统计
    const behaviorStats = await prisma.userBehavior.groupBy({
      by: ['action'],
      where: { userId },
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } }
    })

    // 获取推荐点击率
    const recommendations = await prisma.recommendationFeedback.findMany({
      where: { userId },
      select: {
        clicked: true,
        useful: true,
        createdAt: true
      }
    })

    const totalRecommendations = recommendations.length
    const clickedRecommendations = recommendations.filter((r: any) => r.clicked).length
    const usefulRecommendations = recommendations.filter((r: any) => r.useful).length

    const clickRate = totalRecommendations > 0 ? clickedRecommendations / totalRecommendations : 0
    const usefulRate = totalRecommendations > 0 ? usefulRecommendations / totalRecommendations : 0

    // 获取模型性能
    const modelPerformance = await prisma.modelPerformance.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 1
    })

    res.json({
      success: true,
      data: {
        behaviorStats,
        clickRate,
        usefulRate,
        totalRecommendations,
        modelPerformance: modelPerformance[0] || null
      }
    })
  } catch (error) {
    console.error('获取推荐统计失败:', error)
    res.status(500).json({
      success: false,
      message: '获取推荐统计失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 提供推荐反馈
router.post('/feedback', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { recommendationId, clicked = false, useful = null, rating = null } = req.body

    if (!recommendationId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: recommendationId'
      })
    }

    const feedback = await prisma.recommendationFeedback.create({
      data: {
        userId,
        recommendationId,
        clicked,
        useful,
        rating
      }
    })

    res.json({
      success: true,
      data: feedback
    })
  } catch (error) {
    console.error('提供推荐反馈失败:', error)
    res.status(500).json({
      success: false,
      message: '提供推荐反馈失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 获取热门推荐（不需要认证）
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const { type = 'characters', limit = 10, timeframe = '7d' } = req.query

    const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30
    const since = new Date()
    since.setDate(since.getDate() - days)

    let trending: any[] = []

    if (type === 'characters') {
      // 获取热门角色（基于最近的互动数）
      trending = await prisma.character.findMany({
        include: {
          _count: {
            select: {
              conversations: {
                where: {
                  createdAt: { gte: since }
                }
              }
            }
          },
          creator: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: {
          conversations: {
            _count: 'desc'
          }
        },
        take: Number(limit)
      })
    } else if (type === 'posts') {
      // 获取热门内容（基于最近的点赞和评论）
      trending = await prisma.post.findMany({
        where: {
          createdAt: { gte: since }
        },
        include: {
          _count: {
            select: {
              likes: true,
              comments: true
            }
          },
          author: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: [
          { likes: { _count: 'desc' } },
          { comments: { _count: 'desc' } }
        ],
        take: Number(limit)
      })
    }

    res.json({
      success: true,
      data: {
        trending,
        type,
        timeframe,
        totalCount: trending.length
      }
    })
  } catch (error) {
    console.error('获取热门推荐失败:', error)
    res.status(500).json({
      success: false,
      message: '获取热门推荐失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 重新训练推荐模型（管理员功能）
router.post('/retrain', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // 检查管理员权限
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    })

    if (!user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      })
    }

    // 重新训练推荐模型
    await recommendationEngine.retrainModels()

    res.json({
      success: true,
      message: '推荐模型重新训练完成'
    })
  } catch (error) {
    console.error('重新训练推荐模型失败:', error)
    res.status(500).json({
      success: false,
      message: '重新训练推荐模型失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

export default router
