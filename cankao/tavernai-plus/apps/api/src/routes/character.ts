import { Router } from 'express'
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../server'
import { aiService } from '../services/ai'

const router = Router()

// 获取公开角色列表
router.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = 'created',
      search = '',
      tags = []
    } = req.query

    const orderBy = sort === 'rating'
      ? { rating: 'desc' as const }
      : sort === 'popular'
      ? { chatCount: 'desc' as const }
      : { createdAt: 'desc' as const }

    // 构建查询条件
    const where: any = { isPublic: true }

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } }
      ]
    }

    // TODO: Fix tag filtering for SQLite (tags is now a JSON string)
    // if (tags && Array.isArray(tags) && tags.length > 0) {
    //   where.tags = { hasSome: tags }
    // }

    const characters = await prisma.character.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        tags: true,
        rating: true,
        ratingCount: true,
        chatCount: true,
        favoriteCount: true,
        isNSFW: true,
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        createdAt: true,
        _count: {
          select: {
            favorites: {
              where: {
                userId: req.user?.id
              }
            }
          }
        }
      },
      orderBy,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    })

    // 添加是否收藏标记
    const charactersWithFavorite = characters.map(char => ({
      ...char,
      isFavorited: char._count.favorites > 0,
      isNew: new Date(char.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    }))

    const total = await prisma.character.count({ where })

    res.json({
      success: true,
      characters: charactersWithFavorite,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    next(error)
  }
})

// 获取热门角色
router.get('/popular', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const characters = await prisma.character.findMany({
      where: {
        isPublic: true,
        isFeatured: false // 不包括特色角色
      },
      orderBy: [
        { chatCount: 'desc' },
        { rating: 'desc' },
        { favoriteCount: 'desc' }
      ],
      take: 12,
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        tags: true,
        rating: true,
        ratingCount: true,
        chatCount: true,
        favoriteCount: true,
        creator: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })

    res.json({
      success: true,
      characters
    })
  } catch (error) {
    next(error)
  }
})

// 获取我的角色
router.get('/my', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const characters = await prisma.character.findMany({
      where: { creatorId: req.user!.id },
      orderBy: { updatedAt: 'desc' }
    })

    res.json({
      success: true,
      characters
    })
  } catch (error) {
    next(error)
  }
})

// 获取收藏的角色
router.get('/favorites', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const favorites = await prisma.characterFavorite.findMany({
      where: { userId: req.user!.id },
      include: {
        character: {
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      characters: favorites.map(f => f.character)
    })
  } catch (error) {
    next(error)
  }
})



// 获取热门标签
router.get('/tags/popular', async (req, res, next) => {
  try {
    const characters = await prisma.character.findMany({
      where: { isPublic: true },
      select: { tags: true }
    })

    // 统计标签出现频率
    const tagCount: Record<string, number> = {}
    characters.forEach(char => {
      const tags = typeof char.tags === 'string' ? JSON.parse(char.tags) : char.tags
      if (Array.isArray(tags)) {
        tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1
        })
      }
    })

    // 排序并返回前20个
    const popularTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag]) => tag)

    res.json({
      success: true,
      tags: popularTags
    })
  } catch (error) {
    next(error)
  }
})

// AI 生成角色
router.post('/generate', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { name, tags = [] } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '请提供角色名称'
      })
    }

    // 调用 AI 服务生成角色设定
    const generated = await aiService.generateCharacterProfile(name, tags)

    res.json({
      success: true,
      character: generated
    })
  } catch (error) {
    console.error('生成角色失败:', error)
    res.status(500).json({
      success: false,
      message: '生成角色失败，请稍后重试'
    })
  }
})

// 获取单个角色详情
router.get('/:id', optionalAuth, async (req: AuthRequest, res, next) => {
  try {

    const character = await prisma.character.findUnique({
      where: { id: req.params.id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        _count: {
          select: {
            favorites: {
              where: {
                userId: req.user?.id
              }
            }
          }
        }
      }
    })

    if (!character) {
      return res.status(404).json({
        success: false,
        message: 'Character not found'
      })
    }

    // 如果角色不是公开的，只有创建者可以查看
    if (!character.isPublic && character.creatorId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    res.json({
      success: true,
      character: {
        ...character,
        isFavorited: character._count.favorites > 0
      }
    })
  } catch (error) {
    next(error)
  }
})

// 创建新角色
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const character = await prisma.character.create({
      data: {
        ...req.body,
        creatorId: req.user!.id
      }
    })

    res.status(201).json({
      success: true,
      character
    })
  } catch (error) {
    next(error)
  }
})

// 更新角色
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    // 验证所有权
    const existing = await prisma.character.findUnique({
      where: { id: req.params.id }
    })

    if (!existing || existing.creatorId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const character = await prisma.character.update({
      where: { id: req.params.id },
      data: req.body
    })

    res.json({
      success: true,
      character
    })
  } catch (error) {
    next(error)
  }
})

// 删除角色
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    // 验证所有权
    const existing = await prisma.character.findUnique({
      where: { id: req.params.id }
    })

    if (!existing || existing.creatorId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    await prisma.character.delete({
      where: { id: req.params.id }
    })

    res.json({
      success: true,
      message: 'Character deleted'
    })
  } catch (error) {
    next(error)
  }
})

// 收藏/取消收藏角色
router.post('/:id/favorite', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const characterId = req.params.id
    const userId = req.user!.id

    // 检查是否已收藏
    const existing = await prisma.characterFavorite.findUnique({
      where: {
        userId_characterId: {
          userId,
          characterId
        }
      }
    })

    if (existing) {
      // 取消收藏
      await prisma.characterFavorite.delete({
        where: {
          userId_characterId: {
            userId,
            characterId
          }
        }
      })

      await prisma.character.update({
        where: { id: characterId },
        data: { favoriteCount: { decrement: 1 } }
      })

      res.json({
        success: true,
        message: 'Unfavorited'
      })
    } else {
      // 添加收藏
      await prisma.characterFavorite.create({
        data: {
          userId,
          characterId
        }
      })

      await prisma.character.update({
        where: { id: characterId },
        data: { favoriteCount: { increment: 1 } }
      })

      res.json({
        success: true,
        message: 'Favorited'
      })
    }
  } catch (error) {
    next(error)
  }
})

// 评分角色
router.post('/:id/rate', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { rating } = req.body
    const characterId = req.params.id
    const userId = req.user!.id

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      })
    }

    // 检查是否已评分
    const existing = await prisma.characterRating.findUnique({
      where: {
        userId_characterId: {
          userId,
          characterId
        }
      }
    })

    if (existing) {
      // 更新评分
      await prisma.characterRating.update({
        where: {
          userId_characterId: {
            userId,
            characterId
          }
        },
        data: { rating }
      })
    } else {
      // 新增评分
      await prisma.characterRating.create({
        data: {
          userId,
          characterId,
          rating
        }
      })
    }

    // 重新计算平均评分
    const ratings = await prisma.characterRating.findMany({
      where: { characterId }
    })

    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length

    await prisma.character.update({
      where: { id: characterId },
      data: {
        rating: avgRating,
        ratingCount: ratings.length
      }
    })

    res.json({
      success: true,
      message: 'Rated successfully'
    })
  } catch (error) {
    next(error)
  }
})

// 克隆角色
router.post('/:id/clone', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const original = await prisma.character.findUnique({
      where: { id: req.params.id }
    })

    if (!original || (!original.isPublic && original.creatorId !== req.user!.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const { id, creatorId, chatCount, favoriteCount, rating, ratingCount, createdAt, updatedAt, ...characterData } = original

    const cloned = await prisma.character.create({
      data: {
        ...characterData,
        name: `${characterData.name} (副本)`,
        creatorId: req.user!.id,
        isPublic: false
      }
    })

    res.json({
      success: true,
      character: cloned
    })
  } catch (error) {
    next(error)
  }
})

// 获取角色评论
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query

    const reviews = await prisma.characterRating.findMany({
      where: {
        characterId: req.params.id,
        // 只显示有评论文本的评分
        comment: { not: null }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    })

    const total = await prisma.characterRating.count({
      where: {
        characterId: req.params.id,
        comment: { not: null }
      }
    })

    res.json({
      success: true,
      reviews: reviews.map(review => ({
        id: review.id,
        username: review.user.username,
        userAvatar: review.user.avatar,
        rating: review.rating,
        comment: review.comment,
        date: review.createdAt.toISOString().split('T')[0]
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    next(error)
  }
})

// 获取相关角色
router.get('/:id/related', async (req, res, next) => {
  try {
    const { limit = 6 } = req.query

    // 获取当前角色信息
    const currentCharacter = await prisma.character.findUnique({
      where: { id: req.params.id },
      select: { category: true, tags: true }
    })

    if (!currentCharacter) {
      return res.status(404).json({
        success: false,
        message: 'Character not found'
      })
    }

    // 基于分类和标签推荐相关角色
    const relatedCharacters = await prisma.character.findMany({
      where: {
        id: { not: req.params.id }, // 排除自己
        isPublic: true,
        OR: [
          { category: currentCharacter.category }, // 相同分类
          // TODO: 在SQLite中实现标签匹配（需要JSON解析）
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        rating: true,
        ratingCount: true,
        chatCount: true,
        favoriteCount: true,
        creator: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: [
        { rating: 'desc' },
        { chatCount: 'desc' },
        { favoriteCount: 'desc' }
      ],
      take: Number(limit)
    })

    res.json({
      success: true,
      characters: relatedCharacters
    })
  } catch (error) {
    next(error)
  }
})

export default router
