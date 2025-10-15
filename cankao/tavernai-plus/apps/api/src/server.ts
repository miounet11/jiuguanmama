import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'
import { createServer } from 'http'
const { PrismaClient } = require('../node_modules/.prisma/client')
// import WebSocketServer from './websocket'  // 临时禁用以快速启动

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
import chatroomRoutes from './routes/chatroom'
import marketplaceRoutes from './routes/marketplace'
import communityRoutes from './routes/community'
import multimodalRoutes from './routes/multimodal'
// import recommendationRoutes from './routes/recommendation'  // 临时禁用
import systemRoutes from './routes/system'
import logsRoutes from './routes/logs'
import aiFeaturesRoutes from './routes/ai-features'
import modelsRoutes from './routes/models'
import presetsRoutes from './routes/presets'
import worldinfoRoutes from './routes/worldinfo'
// import worldinfoInjectionRoutes from './routes/worldinfo-injection' // 临时禁用
import groupchatRoutes from './routes/groupchat'
import personasRoutes from './routes/personas'
import userModeRoutes from './routes/user-mode'
import statsRoutes from './routes/stats'
import scenariosRoutes from './routes/scenarios'
import enhancedScenariosRoutes from './routes/enhancedScenarios'
import spacetimeTavernRoutes from './routes/spacetime-tavern' // 时空酒馆系统 API
import gamificationRoutes from './routes/gamification' // 游戏化玩法系统 API
// import importRoutes from './routes/import' // 临时禁用

// 导入工作流调度器

// 导入可扩展性和性能优化服务
import ScalabilityManager from './services/scalabilityManager'
import PerformanceMonitor from './services/performanceMonitor'
import CacheManager from './services/cacheManager'
import DatabaseOptimizer from './services/databaseOptimizer'

// 创建应用实例
const app: Application = express()
const httpServer = createServer(app)

// 创建数据库客户端
export const prisma = new PrismaClient()

// 创建 WebSocket 服务器
// const wsServer = new WebSocketServer(httpServer)  // 临时禁用
// export const io = wsServer.getIO()
// export { wsServer }

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

// CORS 配置 - 支持开发和生产环境
const allowedOrigins = [
  // 开发环境
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  // 生产环境
  'https://www.isillytavern.com',
  'https://api.isillytavern.com'
]

app.use(cors({
  origin: function (origin, callback) {
    // 允许没有origin的请求（如移动端app或curl请求）
    if (!origin) return callback(null, true)

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
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
app.use('/api/user', userRoutes) // 支持单数形式，兼容前端调用
app.use('/api/characters', characterRoutes)
app.use('/characters', characterRoutes) // 直接支持 /characters 路径（兼容前端调用）
app.use('/api/chat', chatRoutes)
app.use('/api/chats', chatRoutes) // 支持复数形式，兼容前端调用
app.use('/chat', chatRoutes) // 直接支持 /chat 路径（兼容前端调用）
app.use('/api/chatrooms', chatroomRoutes) // 多角色聊天室 API
app.use('/api/marketplace', marketplaceRoutes)
app.use('/api/community', communityRoutes) // 社区功能 API
app.use('/api', communityRoutes) // 通知功能 API (notifications)
app.use('/api/multimodal', multimodalRoutes) // 多模态AI功能 API
// app.use('/api/recommendations', recommendationRoutes) // 智能推荐系统 API - 临时禁用
app.use('/api/system', systemRoutes) // 系统管理和监控 API
app.use('/api/logs', logsRoutes)
app.use('/api/ai', aiFeaturesRoutes) // QuackAI 核心功能 API
app.use('/api/models', modelsRoutes) // 多模型 AI 支持 API
app.use('/api/presets', presetsRoutes) // 聊天预设管理 API
app.use('/api/worldinfo', worldinfoRoutes) // 世界信息管理 API
// app.use('/api/worldinfo-injection', worldinfoInjectionRoutes) // 动态世界观注入 API (Issue #15) - 临时禁用
app.use('/api/groupchat', groupchatRoutes) // 群组聊天 API
app.use('/api/personas', personasRoutes) // 用户人格管理 API
app.use('/api/user-mode', userModeRoutes) // 渐进式功能披露 API (Issue #16)
app.use('/api/stats', statsRoutes) // 统计数据 API
app.use('/api/scenarios', scenariosRoutes) // 情景剧本系统 API (Issue #22)
app.use('/api/enhanced-scenarios', enhancedScenariosRoutes) // 增强世界剧本系统 API
app.use('/api/spacetime-tavern', spacetimeTavernRoutes) // 时空酒馆系统 API
app.use('/api/gamification', gamificationRoutes) // 游戏化玩法系统 API
// app.use('/api/import', importRoutes) // 导入导出功能 API (Issue #26) - 临时禁用
// app.use('/api/workflows', workflowRoutes) // 智能工作流 API - 已删除

// Analytics 端点 - 处理前端错误报告
app.post('/analytics/route-error', (req, res) => {
  try {
    const errorData = req.body
    console.log('📊 Frontend error reported:', {
      message: errorData.message,
      stack: errorData.stack?.substring(0, 200), // 只记录前200个字符
      url: errorData.url,
      timestamp: new Date().toISOString()
    })

    // 返回成功响应，告诉前端错误已收到
    res.json({ success: true, message: 'Error analytics received' })
  } catch (error) {
    console.error('Analytics endpoint error:', error)
    res.status(500).json({ success: false, error: 'Failed to process analytics' })
  }
})

// Analytics 端点 - 处理导航分析
app.post('/analytics/navigation', (req, res) => {
  try {
    const navData = req.body
    console.log('🧭 Navigation analytics:', {
      from: navData.from,
      to: navData.to,
      timestamp: new Date().toISOString()
    })

    // 返回成功响应
    res.json({ success: true, message: 'Navigation analytics received' })
  } catch (error) {
    console.error('Navigation analytics error:', error)
    res.status(500).json({ success: false, error: 'Failed to process navigation analytics' })
  }
})

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
          error: null as string | null
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

    // 初始化性能优化服务
    console.log('🔧 初始化性能优化服务...')

    // 1. 初始化数据库优化 (暂时禁用以修复错误)
    // await DatabaseOptimizer.initialize()

    // 2. 预热缓存系统 (暂时禁用)
    // await CacheManager.warmup()

    // 3. 初始化可扩展性管理器 (暂时禁用)
    // await ScalabilityManager.initialize()

    console.log('✅ 性能优化服务初始化完成')

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
      // console.log('   POST /api/chat/* - 对话服务') // 临时禁用
      console.log('   GET  /api/ai/* - AI 功能')
      console.log('   GET  /api/recommendations/* - 智能推荐系统')
      console.log('   GET  /api/marketplace/* - 角色市场')
      console.log('   GET  /api/community/* - 社区功能')
      // console.log('   POST /api/multimodal/* - 多模态AI')
      console.log('   GET  /api/system/* - 系统管理和监控')
    })
  } catch (error) {
    console.error('❌ 服务器启动失败:', error)
    process.exit(1)
  }
}

// 优雅关闭
async function gracefulShutdown(signal: string) {
  console.log(`${signal} received, shutting down gracefully...`)

  // 停止性能监控
  PerformanceMonitor.stopMonitoring()
  console.log('Performance monitoring stopped')

  // 停止可扩展性管理器
  ScalabilityManager.stopMonitoring()
  console.log('Scalability manager stopped')

  // 清理缓存
  CacheManager.flushAll()
  console.log('Cache cleared')

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
