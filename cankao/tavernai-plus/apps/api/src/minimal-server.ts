import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { aiService } from './services/ai'

// 配置环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3002

// 基础中间件
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}))
app.use(express.json())

// 健康检查
app.get('/health', async (req, res) => {
  try {
    const aiStatus = await aiService.checkAPIStatus()
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      ai: aiStatus
    })
  } catch (error) {
    res.json({
      status: 'partial',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      ai: { available: false, error: 'Check failed' }
    })
  }
})

// AI 测试端点
app.post('/api/ai/test', async (req, res) => {
  try {
    const { message = '你好，请简单回复测试连接' } = req.body

    const result = await aiService.generateChatResponse({
      sessionId: 'test-session',
      userId: 'test-user',
      messages: [
        { role: 'user', content: message }
      ],
      stream: false
    })

    res.json({
      success: true,
      content: result.content,
      model: result.model,
      usage: result.usage
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 启动服务器
app.listen(PORT, () => {
  console.log('🚀 最小化 AI 服务器启动成功')
  console.log(`   端口: ${PORT}`)
  console.log(`   健康检查: http://localhost:${PORT}/health`)
  console.log(`   AI 测试: POST http://localhost:${PORT}/api/ai/test`)
  console.log('')
  console.log('🧪 测试命令:')
  console.log(`   curl http://localhost:${PORT}/health`)
  console.log(`   curl -X POST http://localhost:${PORT}/api/ai/test -H "Content-Type: application/json" -d '{"message":"测试消息"}'`)
})