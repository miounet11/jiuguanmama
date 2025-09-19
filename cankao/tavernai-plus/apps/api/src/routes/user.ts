import { Router } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

// 获取用户列表（仅供管理员）
router.get('/', authenticate, async (req, res, next) => {
  try {
    // TODO: 添加管理员权限检查
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        subscriptionTier: true,
        createdAt: true
      },
      take: 20
    })

    res.json({
      success: true,
      users
    })
  } catch (error) {
    next(error)
  }
})

// 获取指定用户信息
router.get('/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            characters: {
              where: { isPublic: true }
            }
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      user
    })
  } catch (error) {
    next(error)
  }
})

export default router
