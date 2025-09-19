import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { getEnvConfig } from './config/env.config'

// 初始化并验证环境配置
const configValidator = require('./config/env.config').ConfigValidator.getInstance()
const envConfig = configValidator.validateAndLoad()

// 导入基础路由
import authRoutes from './routes/auth'
import userRoutes from './routes/user'
import characterRoutes from './routes/character'
// import chatRoutes from './routes/chat' // 暂时禁用，包含复杂依赖
import modelsRoutes from './routes/models'

const app = express()

// 基础中间件
app.use(helmet())
app.use(compression())
app.use(cors({
  origin: envConfig.CLIENT_URL,
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 基础路由
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/characters', characterRoutes)
// app.use('/api/chat', chatRoutes) // 暂时禁用
app.use('/api/models', modelsRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: envConfig.NODE_ENV,
    version: '0.1.0'
  })
})

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  })
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
})

const PORT = envConfig.PORT || 3007

app.listen(PORT, () => {
  console.log(`🚀 API服务器启动成功！`)
  console.log(`📍 运行地址: http://localhost:${PORT}`)
  console.log(`🌍 环境: ${envConfig.NODE_ENV}`)
  console.log(`🤖 AI模型: ${envConfig.DEFAULT_MODEL}`)
})

export default app
