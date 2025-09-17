import { createLogger, format, transports } from 'winston'

// 延迟加载配置以避免循环依赖
let config: any = null
const getConfig = () => {
  if (!config) {
    try {
      const { getEnvConfig } = require('../config/env.config')
      config = getEnvConfig()
    } catch (error) {
      // 如果配置未初始化，使用默认值
      config = {
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
    }
  }
  return config
}

// 创建 Winston 日志器
export const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta
      })
    })
  ),
  defaultMeta: {
    service: 'tavernai-plus-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // 控制台输出
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          return `${timestamp} [${level}]: ${message} ${metaStr}`
        })
      )
    }),

    // 错误日志文件
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    // 所有日志文件
    new transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ]
})

// 请求日志中间件
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id
    }

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData)
    } else {
      logger.info('HTTP Request', logData)
    }
  })

  next()
}

// API 使用日志记录器
export class ApiUsageLogger {
  static async logApiCall(data: {
    userId?: string
    endpoint: string
    method: string
    statusCode: number
    responseTime: number
    ip?: string
    userAgent?: string
  }) {
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()

      await prisma.usageLog.create({
        data: {
          userId: data.userId || null,
          endpoint: data.endpoint,
          method: data.method,
          statusCode: data.statusCode,
          responseTime: data.responseTime,
          ip: data.ip || null,
          userAgent: data.userAgent || null
        }
      })

      await prisma.$disconnect()
    } catch (error) {
      logger.error('Failed to log API usage', { error })
    }
  }

  static async getUsageStats(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day') {
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()

      const now = new Date()
      let startDate = new Date()

      switch (timeframe) {
        case 'hour':
          startDate.setHours(now.getHours() - 1)
          break
        case 'day':
          startDate.setDate(now.getDate() - 1)
          break
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
      }

      const stats = await prisma.usageLog.groupBy({
        by: ['endpoint', 'method'],
        where: {
          createdAt: {
            gte: startDate
          }
        },
        _count: {
          id: true
        },
        _avg: {
          responseTime: true
        }
      })

      await prisma.$disconnect()
      return stats
    } catch (error) {
      logger.error('Failed to get usage stats', { error })
      return []
    }
  }
}

// 错误追踪器
export class ErrorTracker {
  static async trackError(error: Error, context?: any) {
    const errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    }

    logger.error('Application Error', errorData)

    // 在生产环境中，可以发送到错误追踪服务如 Sentry
    if (process.env.NODE_ENV === 'production') {
      // TODO: 集成 Sentry 或其他错误追踪服务
    }
  }

  static async createAlert(data: {
    type: 'error' | 'warning' | 'info'
    severity: 'low' | 'medium' | 'high' | 'critical'
    title: string
    message: string
    source?: string
    metadata?: any
  }) {
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()

      await prisma.alert.create({
        data: {
          type: data.type,
          severity: data.severity,
          title: data.title,
          message: data.message,
          source: data.source || 'system',
          metadata: data.metadata ? JSON.stringify(data.metadata) : null
        }
      })

      await prisma.$disconnect()

      logger.warn('System Alert Created', data)
    } catch (error) {
      logger.error('Failed to create alert', { error })
    }
  }
}

export default logger