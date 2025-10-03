import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../server'

// 扩展 Request 接口
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
        featureUnlocks?: string[]
      }
      isAdmin?: boolean
    }
  }
}

// 管理员角色枚举
export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// 权限级别
export enum Permission {
  // 用户管理
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // 模型管理
  MODEL_VIEW = 'model:view',
  MODEL_CREATE = 'model:create',
  MODEL_UPDATE = 'model:update',
  MODEL_DELETE = 'model:delete',

  // 系统配置
  SYSTEM_VIEW = 'system:view',
  SYSTEM_UPDATE = 'system:update',

  // 日志查看
  LOG_VIEW = 'log:view',
  LOG_EXPORT = 'log:export',

  // 财务管理
  FINANCE_VIEW = 'finance:view',
  FINANCE_MANAGE = 'finance:manage',

  // 渠道管理
  CHANNEL_VIEW = 'channel:view',
  CHANNEL_MANAGE = 'channel:manage'
}

// 角色权限映射
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [],
  [UserRole.MODERATOR]: [
    Permission.USER_VIEW,
    Permission.MODEL_VIEW,
    Permission.LOG_VIEW,
    Permission.CHANNEL_VIEW
  ],
  [UserRole.ADMIN]: [
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.MODEL_VIEW,
    Permission.MODEL_CREATE,
    Permission.MODEL_UPDATE,
    Permission.SYSTEM_VIEW,
    Permission.LOG_VIEW,
    Permission.LOG_EXPORT,
    Permission.FINANCE_VIEW,
    Permission.CHANNEL_VIEW,
    Permission.CHANNEL_MANAGE
  ],
  [UserRole.SUPER_ADMIN]: Object.values(Permission) // 所有权限
}

// 验证管理员身份中间件
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 从 header 获取 token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未授权访问'
      })
    }

    const token = authHeader.substring(7)

    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // 获取用户信息
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
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      })
    }

    // 检查是否是管理员
    const adminRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    if (!adminRoles.includes(user.role as UserRole)) {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限'
      })
    }

    // 附加到 request
    req.user = user
    req.isAdmin = true

    next()
  } catch (error) {
    console.error('管理员验证失败:', error)
    return res.status(401).json({
      success: false,
      message: '认证失败'
    })
  }
}

// 检查特定权限
export const requirePermission = (permission: Permission | Permission[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未授权访问'
        })
      }

      const userRole = req.user.role as UserRole
      const userPermissions = rolePermissions[userRole] || []

      const requiredPermissions = Array.isArray(permission) ? permission : [permission]
      const hasPermission = requiredPermissions.some(p => userPermissions.includes(p))

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: '权限不足'
        })
      }

      next()
    } catch (error) {
      console.error('权限检查失败:', error)
      return res.status(500).json({
        success: false,
        message: '权限验证失败'
      })
    }
  }
}

// 记录管理操作日志
export const logAdminAction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now()

  // 监听响应
  const originalSend = res.send
  res.send = function(data: any) {
    res.send = originalSend

    // 记录日志
    if (req.user && req.isAdmin) {
      const endTime = Date.now()
      const duration = endTime - startTime

      // 异步记录，不阻塞响应
      setImmediate(async () => {
        try {
          await prisma.adminLog.create({
            data: {
              adminId: req.user?.id || '',
              action: `${req.method} ${req.originalUrl}`,
              targetType: 'admin_action',
              targetId: null,
              details: JSON.stringify({
                requestBody: req.body,
                responseStatus: res.statusCode,
                duration,
                path: req.path,
                query: req.query,
                params: req.params
              }),
              ip: req.ip || req.socket.remoteAddress || '',
              userAgent: req.headers['user-agent'] || ''
            }
          })
        } catch (error) {
          console.error('记录管理日志失败:', error)
        }
      })
    }

    return res.send(data)
  }

  next()
}

// 速率限制（管理接口特殊配置）
import rateLimit from 'express-rate-limit'

export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制100次请求
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // 超级管理员跳过限制
    return req.user?.role === UserRole.SUPER_ADMIN
  }
})
