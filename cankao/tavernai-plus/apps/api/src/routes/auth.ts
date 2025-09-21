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

    if (!user || !user.passwordHash) {
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
        createdAt: true
      }
    })

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      })
      return
    }

    res.json({
      success: true,
      user
    })
  } catch (error) {
    next(error)
    return
  }
})

export default router
