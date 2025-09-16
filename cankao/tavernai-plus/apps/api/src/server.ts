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

// 导入中间件
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'
import { rateLimiter } from './middleware/rateLimiter'

// 导入路由
import authRoutes from './routes/auth'
import userRoutes from './routes/user'
import characterRoutes from './routes/character'
import chatRoutes from './routes/chat'
import marketplaceRoutes from './routes/marketplace'

// 创建应用实例
const app: Application = express()
const httpServer = createServer(app)

// 创建数据库客户端
export const prisma = new PrismaClient()

// 创建 WebSocket 服务器
const wsServer = new WebSocketServer(httpServer)
export const io = wsServer.getIO()
export { wsServer }

// 基础中间件
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}))
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
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
app.use('/api/marketplace', marketplaceRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
})

// WebSocket 连接已在 WebSocketServer 中处理

// 错误处理中间件（必须放在最后）
app.use(errorHandler)

// 启动服务器
const PORT = process.env.PORT || 5000
const HOST = process.env.HOST || 'localhost'

async function startServer() {
  try {
    // 连接数据库
    await prisma.$connect()
    console.log('✅ Database connected')
    
    // 启动 HTTP 服务器
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://${HOST}:${PORT}`)
      console.log(`📱 WebSocket server ready`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  
  httpServer.close(() => {
    console.log('HTTP server closed')
  })
  
  await prisma.$disconnect()
  console.log('Database disconnected')
  
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...')
  
  httpServer.close(() => {
    console.log('HTTP server closed')
  })
  
  await prisma.$disconnect()
  console.log('Database disconnected')
  
  process.exit(0)
})

// 启动服务器
startServer()

export { app }