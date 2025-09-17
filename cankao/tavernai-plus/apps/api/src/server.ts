import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { PrismaClient } from '@prisma/client'
import WebSocketServer from './websocket'

// 配置环境变量
dotenv.config()

// 导入配置验证器
import { configValidator } from './config/env.config'

// 立即验证配置
const envConfig = configValidator.validateAndLoad()

// 导入中间件
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'
import { rateLimiter } from './middleware/rateLimiter'

// 导入路由
import authRoutes from './routes/auth'
import userRoutes from './routes/user'
import characterRoutes from './routes/character'
import chatRoutes from './routes/chat'
// import chatroomRoutes from './routes/chatroom'
import marketplaceRoutes from './routes/marketplace'
import logsRoutes from './routes/logs'
import aiFeaturesRoutes from './routes/ai-features'

// 导入工作流调度器


// 创建应用实例
const app: Application = express()
const httpServer = createServer(app)

// 创建数据库客户端
export const prisma = new PrismaClient()

// 创建 WebSocket 服务器
const wsServer = new WebSocketServer(httpServer)
export const io = wsServer.getIO()
export { wsServer }

// 基础中间件 - 配置安全头
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "ws:", "wss:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production'
}))

// CORS 配置 - 简化配置以确保工作
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}))
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 请求日志
app.use(requestLogger)

// 速率限制
app.use('/api', rateLimiter)

// 静态文件服务
app.use('/uploads', express.static('uploads'))

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/characters', characterRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/chats', chatRoutes) // 支持复数形式，兼容前端调用
// app.use('/api/chatrooms', chatroomRoutes) // 多角色聊天室 API
app.use('/api/marketplace', marketplaceRoutes)
app.use('/api/logs', logsRoutes)
app.use('/api/ai', aiFeaturesRoutes) // QuackAI 核心功能 API
// app.use('/api/workflows', workflowRoutes) // 智能工作流 API - 已删除

// 健康检查端点
app.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: envConfig.NODE_ENV,
      version: '0.1.0',
      services: {
        database: true,
        ai: {
          configured: configValidator.checkAIConfig(),
          model: envConfig.DEFAULT_MODEL,
          reachable: false,
          error: null
        }
      }
    }

    // 检查 AI 服务状态
    if (healthStatus.services.ai.configured) {
      try {
        const aiHealth = await configValidator.getAIHealthStatus()
        healthStatus.services.ai.reachable = aiHealth.reachable || false
        if (aiHealth.error) {
          healthStatus.services.ai.error = aiHealth.error
        }
      } catch (aiError) {
        healthStatus.services.ai.error = 'AI service check failed'
      }
    }

    res.json(healthStatus)
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    })
  }
})

// WebSocket 连接已在 WebSocketServer 中处理

// 错误处理中间件（必须放在最后）
app.use(errorHandler)

async function startServer() {
  try {
    console.log('🚀 启动 TavernAI Plus 服务器...')

    // 连接数据库
    await prisma.$connect()
    console.log('✅ 数据库连接成功')

    // 检查 AI 服务配置
    if (configValidator.checkAIConfig()) {
      console.log('✅ AI 服务配置检查通过')

      // 测试 AI 服务连接
      const aiHealthStatus = await configValidator.getAIHealthStatus()
      if (aiHealthStatus.reachable) {
        console.log('✅ Grok-3 LLM 服务连接成功')
      } else {
        console.log('⚠️  Grok-3 LLM 服务连接失败:', aiHealthStatus.error)
      }
    } else {
      console.log('❌ AI 服务配置不完整，部分功能可能不可用')
    }



    // 启动 HTTP 服务器
    httpServer.listen(envConfig.PORT, () => {
      console.log(`🚀 服务器运行在 http://${envConfig.HOST}:${envConfig.PORT}`)
      console.log(`📱 WebSocket 服务器就绪`)
      console.log(`🌍 环境: ${envConfig.NODE_ENV}`)
      console.log(`🤖 AI 模型: ${envConfig.DEFAULT_MODEL}`)
      console.log('📋 可用端点:')
      console.log('   GET  /health - 健康检查')
      console.log('   POST /api/auth/* - 认证服务')
      console.log('   GET  /api/characters/* - 角色管理')
      console.log('   POST /api/chat/* - 对话服务')
      console.log('   GET  /api/ai/* - AI 功能')
    })
  } catch (error) {
    console.error('❌ 服务器启动失败:', error)
    process.exit(1)
  }
}

// 优雅关闭
async function gracefulShutdown(signal: string) {
  console.log(`${signal} received, shutting down gracefully...`)



  httpServer.close(() => {
    console.log('HTTP server closed')
  })

  await prisma.$disconnect()
  console.log('Database disconnected')

  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// 启动服务器
startServer()

export { app }
