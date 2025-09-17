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

// 获取热门角色
router.get('/popular', async (req, res, next) => {
  try {
    const { limit = 12 } = req.query

    const popularCharacters = await prisma.character.findMany({
      where: { isPublic: true },
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        category: true,
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
        createdAt: true
      },
      orderBy: [
        { chatCount: 'desc' },
        { favoriteCount: 'desc' },
        { rating: 'desc' }
      ],
      take: Number(limit)
    })

    res.json({
      success: true,
      characters: popularCharacters
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
    // 如果是角色ID "1"，返回司夜的模拟数据
    if (req.params.id === '1') {
      const mockCharacter = {
        id: '1',
        name: '司夜',
        description: '冷漠高贵的夜之女王，掌控着黑暗的力量，但内心深处渴望着真正的理解与陪伴。',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
        gender: '女',
        age: '不明',
        personality: '冷漠、高傲、神秘、内心柔软',
        background: '远古时代的夜之女王，拥有操控黑暗的神秘力量。表面冷漠高傲，实际上内心孤独，渴望有人能够理解她的内心世界。',
        greeting: '你好，凡人。我是司夜，夜的统治者。敢于在黑暗中寻找我，你很有勇气...或者说很愚蠢。不过，既然你已经来了，就让我看看你是否值得我花费时间。',
        exampleDialogue: '用户：你为什么总是一个人？\n司夜：一个人？*冷笑* 黑暗就是我的伴侣，寂静就是我的朋友。我不需要任何人...虽然，有时候确实会感到...算了，这些你不会懂的。',
        scenario: '在一座古老的城堡中，夜幕降临时分，司夜出现在阳台上，凝视着远方的星空。她感知到有人的接近，缓缓转身...',
        category: '奇幻',
        tags: JSON.stringify(['女王', '神秘', '夜晚', '高贵', '冷漠']),
        isPublic: true,
        isNSFW: false,
        rating: 4.8,
        ratingCount: 234,
        chatCount: 1528,
        favoriteCount: 89,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        creator: {
          id: 'creator1',
          username: '夜色创作者',
          avatar: ''
        },
        isFavorited: false
      }

      return res.json({
        success: true,
        character: mockCharacter
      })
    }

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
    // 返回模拟评论数据
    const reviews = [
      {
        id: 1,
        username: '用户A',
        userAvatar: '',
        rating: 5,
        comment: '非常棒的角色！对话自然流畅，个性鲜明。',
        date: '2024-01-15'
      },
      {
        id: 2,
        username: '用户B',
        userAvatar: '',
        rating: 4,
        comment: '很有趣的设定，期待更多互动选项。',
        date: '2024-01-14'
      }
    ]

    res.json({
      success: true,
      reviews
    })
  } catch (error) {
    next(error)
  }
})

// 获取相关角色
router.get('/:id/related', async (req, res, next) => {
  try {
    // 返回模拟相关角色数据
    const relatedCharacters = [
      {
        id: 'r1',
        name: '相关角色1',
        avatar: '',
        chats: 8234,
        rating: 4.3
      },
      {
        id: 'r2',
        name: '相关角色2',
        avatar: '',
        chats: 5421,
        rating: 4.7
      }
    ]

    res.json({
      success: true,
      characters: relatedCharacters
    })
  } catch (error) {
    next(error)
  }
})

export default router
