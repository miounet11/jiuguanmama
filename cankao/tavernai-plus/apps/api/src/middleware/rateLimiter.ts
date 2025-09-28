import rateLimit from 'express-rate-limit'
import { Request, Response } from 'express'

// 扩展Express Request类型以包含rateLimit属性
declare global {
  namespace Express {
    interface Request {
      rateLimit?: {
        limit: number
        current: number
        remaining: number
        resetTime?: Date
      }
    }
  }
}

export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || (process.env.NODE_ENV === 'development' ? '10000' : '100')), // 开发环境10000个请求，生产环境100个
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      retryAfter: req.rateLimit?.resetTime
    })
  },
  skip: (req: Request) => {
    // 开发环境跳过频率限制
    if (process.env.NODE_ENV === 'development') {
      return true
    }
    // 跳过健康检查和静态资源
    return req.path === '/health' || req.path.startsWith('/uploads')
  }
})

// 严格限制的速率限制（用于认证相关路由）
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: process.env.NODE_ENV === 'development' ? 1000 : 5, // 开发环境1000个请求，生产环境5个
  message: 'Too many attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 成功的请求不计入限制
  skip: (req: Request) => {
    // 开发环境跳过严格频率限制
    return process.env.NODE_ENV === 'development'
  }
})
