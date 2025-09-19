import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
const { PrismaClient } = require('../../node_modules/.prisma/client')
import { getEnvConfig } from '../config/env.config'

const prisma = new PrismaClient()

// 扩展 Request 类型以包含完整用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        username: string
        email: string
        role: string
        credits: number
        subscriptionTier: string
        isActive: boolean
        isVerified: boolean
      }
    }
  }
}

// 导出认证后的请求类型
export interface AuthRequest extends Request {
  user?: {
    id: string
    username: string
    email: string
    role: string
    credits: number
    subscriptionTier: string
    isActive: boolean
    isVerified: boolean
  }
}

export interface JWTPayload {
  userId: string
  username: string
  email: string
  role: string
  iat?: number
  exp?: number
}

/**
 * JWT Token 管理器
 */
export class TokenManager {
  private static jwtSecret: string
  private static jwtRefreshSecret: string

  static initialize() {
    const config = getEnvConfig()
    this.jwtSecret = config.JWT_SECRET
    this.jwtRefreshSecret = config.JWT_REFRESH_SECRET
  }

  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: '15m' })
  }

  static generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.jwtRefreshSecret, { expiresIn: '7d' })
  }

  static verifyAccessToken(token: string): JWTPayload {
    return jwt.verify(token, this.jwtSecret) as JWTPayload
  }

  static verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, this.jwtRefreshSecret) as JWTPayload
  }

  static async generateTokenPair(user: {
    id: string
    username: string
    email: string
    role: string
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }

    const accessToken = this.generateAccessToken(payload)
    const refreshToken = this.generateRefreshToken(payload)

    // 保存刷新令牌到数据库
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })

    return { accessToken, refreshToken }
  }

  static async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { token } })
  }
}

/**
 * 密码管理器
 */
export class PasswordManager {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }
}

/**
 * 主要认证中间件
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      })
      return
    }

    const decoded = TokenManager.verifyAccessToken(token)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        credits: true,
        subscriptionTier: true,
        isActive: true,
        isVerified: true
      }
    })

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      })
      return
    }

    req.user = user
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired'
      })
      return
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      })
      return
    }

    console.error('Authentication error:', error)
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    })
  }
}

/**
 * 可选认证中间件
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const decoded = TokenManager.verifyAccessToken(token)
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          credits: true,
          subscriptionTier: true,
          isActive: true,
          isVerified: true
        }
      })

      if (user && user.isActive) {
        req.user = user
      }
    }

    next()
  } catch (error) {
    // 可选认证失败时继续，不阻塞请求
    next()
  }
}

/**
 * 角色权限检查中间件
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      })
      return
    }

    next()
  }
}

/**
 * 管理员权限检查
 */
export const requireAdmin = requireRole(['admin'])

/**
 * 订阅等级检查中间件
 */
export const requireSubscription = (minTier: string) => {
  const tierHierarchy = ['free', 'plus', 'pro']

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
      return
    }

    const userTierIndex = tierHierarchy.indexOf(req.user.subscriptionTier)
    const requiredTierIndex = tierHierarchy.indexOf(minTier)

    if (userTierIndex < requiredTierIndex) {
      res.status(403).json({
        success: false,
        error: `${minTier} subscription required`,
        currentTier: req.user.subscriptionTier,
        requiredTier: minTier
      })
      return
    }

    next()
  }
}

/**
 * 积分检查中间件
 */
export const requireCredits = (cost: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
      return
    }

    if (req.user.credits < cost) {
      res.status(402).json({
        success: false,
        error: 'Insufficient credits',
        required: cost,
        available: req.user.credits
      })
      return
    }

    next()
  }
}

// 初始化 TokenManager
TokenManager.initialize()
