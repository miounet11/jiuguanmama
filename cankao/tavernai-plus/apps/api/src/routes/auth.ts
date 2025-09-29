import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'

const router = Router()

// 验证模式
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(6)
})

const refreshTokenSchema = z.object({
  refreshToken: z.string()
})

// 生成 JWT
const generateTokens = (user: { id: string; email: string; username: string }) => {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET || 'default-secret-change-this',
    { expiresIn: '15m' } as any
  )

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-this',
    { expiresIn: '7d' } as any
  )

  return { accessToken, refreshToken }
}

// 注册
router.post('/register', validate(registerSchema), async (req, res, next): Promise<void> => {
  try {
    const { username, email, password } = req.body

    // 检查用户是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    })

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: existingUser.email === email
          ? 'Email already registered'
          : 'Username already taken'
      })
      return
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        verificationToken: crypto.randomBytes(32).toString('hex')
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        credits: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        createdAt: true
      }
    })

    // 生成令牌
    const { accessToken, refreshToken } = generateTokens(user)

    // 保存刷新令牌
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天
      }
    })

    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      user
    })
  } catch (error) {
    next(error)
    return
  }
})

// 登录
router.post('/login', validate(loginSchema), async (req, res, next): Promise<void> => {
  try {
    const { email, password } = req.body

    console.log('🔍 登录请求:', { email, passwordLength: password?.length })

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        avatar: true,
        bio: true,
        credits: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        isActive: true,
        createdAt: true
      }
    })

    console.log('👤 用户查询结果:', {
      found: !!user,
      hasPasswordHash: !!user?.passwordHash,
      isActive: user?.isActive,
      username: user?.username
    })

    if (!user || !user.passwordHash) {
      console.log('❌ 用户不存在或没有密码哈希')
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
      return
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Account has been deactivated'
      })
      return
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
      return
    }

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // 生成令牌
    const { accessToken, refreshToken } = generateTokens(user)

    // 保存刷新令牌
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })

    // 移除密码字段
    const { passwordHash, ...userWithoutPassword } = user

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: userWithoutPassword
    })
  } catch (error) {
    next(error)
    return
  }
})

// 刷新令牌
router.post('/refresh', validate(refreshTokenSchema), async (req, res, next): Promise<void> => {
  try {
    const { refreshToken } = req.body

    // 验证刷新令牌
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as {
      userId: string
      type: string
    }

    if (decoded.type !== 'refresh') {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      })
      return
    }

    // 检查令牌是否存在于数据库
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    })

    if (!storedToken || storedToken.expiresAt < new Date()) {
      res.status(401).json({
        success: false,
        message: 'Refresh token expired or invalid'
      })
      return
    }

    // 删除旧的刷新令牌
    await prisma.refreshToken.delete({
      where: { id: storedToken.id }
    })

    // 生成新令牌
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      id: storedToken.user.id,
      email: storedToken.user.email,
      username: storedToken.user.username
    })

    // 保存新的刷新令牌
    await prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })

    res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken
    })
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Refresh token expired'
      })
      return
    }
    next(error)
    return
  }
})

// 退出登录
router.post('/logout', authenticate, async (req: AuthRequest, res, next): Promise<void> => {
  try {
    // 删除用户的所有刷新令牌
    await prisma.refreshToken.deleteMany({
      where: { userId: req.user!.id }
    })

    res.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    next(error)
    return
  }
})

// 获取当前用户信息
// 更新用户信息
router.patch('/profile', authenticate, async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { username, bio } = req.body

    // 验证用户名唯一性（如果提供）
    if (username && username !== req.user!.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: req.user!.id }
        }
      })

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: '用户名已被使用'
        })
        return
      }
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(username && { username }),
        ...(bio !== undefined && { bio })
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        credits: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        createdAt: true
      }
    })

    res.json({
      success: true,
      user: updatedUser
    })
  } catch (error) {
    next(error)
  }
})

// 上传头像
router.post('/avatar', authenticate, async (req: AuthRequest, res, next): Promise<void> => {
  try {
    // 这里需要文件上传中间件，在实际项目中需要配置multer
    // 暂时返回模拟响应
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.user!.id}`

    // 更新用户头像
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar: avatarUrl }
    })

    res.json({
      success: true,
      avatarUrl
    })
  } catch (error) {
    next(error)
  }
})

// 修改密码
router.post('/change-password', authenticate, async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body

    // 获取用户当前密码哈希
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    })

    if (!user || !user.passwordHash) {
      res.status(400).json({
        success: false,
        message: '用户不存在或未设置密码'
      })
      return
    }

    // 验证当前密码
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isValidPassword) {
      res.status(400).json({
        success: false,
        message: '当前密码错误'
      })
      return
    }

    // 哈希新密码
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // 更新密码
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { passwordHash: hashedPassword }
    })

    res.json({
      success: true,
      message: '密码修改成功'
    })
  } catch (error) {
    next(error)
  }
})

router.get('/profile', authenticate, async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        credits: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        isVerified: true,
        createdAt: true,
        // 游戏化数据
        _count: {
          select: {
            characterAffinities: true,
            scenarioProgresses: true,
            achievements: true
          }
        }
      }
    })

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      })
      return
    }

    // 获取游戏化统计
    const gamingStats = await getUserGamingStats(req.user!.id)

    res.json({
      success: true,
      user,
      gamingStats
    })
  } catch (error) {
    next(error)
    return
  }
})

// 获取用户游戏化统计
async function getUserGamingStats(userId: string) {
  const [
    totalAffinities,
    completedScenarios,
    totalAchievements,
    topCharacters,
    recentProgress
  ] = await Promise.all([
    // 总亲密度等级
    prisma.characterAffinity.aggregate({
      where: { userId },
      _sum: { affinityLevel: true }
    }),
    // 已完成的剧本
    prisma.scenarioProgress.count({
      where: { userId, status: 'completed' }
    }),
    // 成就数量
    prisma.userAchievement.count({
      where: { userId }
    }),
    // 亲密度最高的角色
    prisma.characterAffinity.findMany({
      where: { userId },
      include: { character: { select: { name: true, avatar: true } } },
      orderBy: { affinityLevel: 'desc' },
      take: 3
    }),
    // 最近的进度
    prisma.scenarioProgress.findMany({
      where: { userId },
      include: { scenario: { select: { name: true } } },
      orderBy: { lastPlayedAt: 'desc' },
      take: 5
    })
  ])

  return {
    totalAffinityLevel: totalAffinities._sum.affinityLevel || 0,
    completedScenarios,
    totalAchievements,
    topCharacters,
    recentProgress
  }
}

export default router
