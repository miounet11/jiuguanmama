import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { createServer } from 'http'
import dotenv from 'dotenv'

// 配置环境变量
dotenv.config()

const app = express()
const httpServer = createServer(app)

// 基础中间件
app.use(helmet({
  contentSecurityPolicy: false // 简化CSP配置
}))
app.use(compression())
app.use(cors({
  origin: [
    'http://localhost:8080', 'http://localhost:8081',
    'http://127.0.0.1:8080', 'http://127.0.0.1:8081'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 请求日志
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.path}`)
  void next() // 显式忽略Promise返回值
})

// 健康检查端点
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '0.1.0-test',
    services: {
      database: {
        status: 'disabled_temporarily',
        message: '使用简化版本进行测试'
      },
      ai: {
        configured: !!process.env.NEWAPI_KEY,
        model: process.env.DEFAULT_MODEL || 'grok-3',
        reachable: false,
        error: null
      }
    }
  })
})

// API测试端点
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API服务器正常运行',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// 角色API端点（返回测试数据）
app.get('/api/characters', (req, res) => {
  const testCharacters = [
    {
      id: 'test-1',
      name: '司夜',
      description: '神秘夜之女王，冷漠高贵但内心柔软',
      avatar: null,
      personality: '冷漠高贵，内心柔软，拥有强大的暗黑魔法',
      backstory: '来自暗夜王国的女王，统治着永恒的夜晚，外表冷漠但内心渴望温暖',
      tags: ['冷漠', '高贵', '魔法', '女王'],
      rating: 4.8,
      chatCount: 156,
      favoriteCount: 42,
      isPublic: true,
      creator: {
        id: 'user-1',
        username: '测试用户1',
        avatar: null
      },
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'test-2',
      name: '艾莉亚',
      description: '活泼精灵法师，开朗好奇',
      avatar: null,
      personality: '开朗好奇，善良纯真，对魔法充满热情',
      backstory: '来自精灵森林的年轻法师，对世界充满好奇，正在学习强大的自然魔法',
      tags: ['活泼', '精灵', '法师', '好奇'],
      rating: 4.6,
      chatCount: 234,
      favoriteCount: 38,
      isPublic: true,
      creator: {
        id: 'user-2',
        username: '测试用户2',
        avatar: null
      },
      createdAt: new Date('2024-02-20').toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'test-3',
      name: '雷克斯',
      description: '傲慢龙王，威严强大',
      avatar: null,
      personality: '傲慢威严，强大自信，重视荣誉和传统',
      backstory: '远古龙王族的后裔，拥有强大的龙族血脉，守护着古老的秘密',
      tags: ['傲慢', '龙王', '威严', '强大'],
      rating: 4.9,
      chatCount: 189,
      favoriteCount: 51,
      isPublic: true,
      creator: {
        id: 'user-3',
        username: '测试用户3',
        avatar: null
      },
      createdAt: new Date('2024-01-08').toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  res.json({
    success: true,
    data: testCharacters,
    pagination: {
      page: 1,
      limit: 10,
      total: testCharacters.length,
      totalPages: 1
    }
  })
})

// 单个角色API
app.get('/api/characters/:id', (req, res) => {
  const { id } = req.params
  const testCharacter = {
    id: id,
    name: '司夜',
    description: '神秘夜之女王，冷漠高贵但内心柔软',
    avatar: null,
    personality: '冷漠高贵，内心柔软，拥有强大的暗黑魔法',
    backstory: '来自暗夜王国的女王，统治着永恒的夜晚。外表冷漠，但内心渴望温暖和友谊。拥有操控暗影和星光的强大魔法。',
    firstMessage: '*暗夜女王司夜缓缓抬起头，紫色的眼眸中闪烁着神秘的光芒* "凡人，你为何要来到我的暗夜王国？"',
    tags: ['冷漠', '高贵', '魔法', '女王'],
    rating: 4.8,
    chatCount: 156,
    favoriteCount: 42,
    isPublic: true,
    creator: {
      id: 'user-1',
      username: '测试用户1',
      avatar: null
    },
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
    chatExamples: [
      {
        user: '女王陛下，您为什么总是一个人？',
        character: '*司夜的眼神中闪过一丝落寞* "统治者的道路总是孤独的...但或许，你愿意陪伴我吗？"'
      }
    ]
  }

  res.json({
    success: true,
    data: testCharacter
  })
})

// 用户认证API（简化版）
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body

  // 简化的测试认证
  if (email === 'admin@tavernai.com' && password === 'Admin123!@#') {
    res.json({
      success: true,
      data: {
        user: {
          id: 'admin-user',
          email: 'admin@tavernai.com',
          username: '管理员',
          avatar: null,
          role: 'admin'
        },
        token: 'test-jwt-token-admin',
        refreshToken: 'test-refresh-token-admin'
      }
    })
  } else if (email === 'test@example.com' && password === 'test123') {
    res.json({
      success: true,
      data: {
        user: {
          id: 'test-user',
          email: 'test@example.com',
          username: '测试用户',
          avatar: null,
          role: 'user'
        },
        token: 'test-jwt-token-user',
        refreshToken: 'test-refresh-token-user'
      }
    })
  } else {
    res.status(401).json({
      success: false,
      message: '邮箱或密码错误'
    })
  }
})

// 用户注册API
app.post('/api/auth/register', (req, res) => {
  const { email, username, password } = req.body

  // 简化的注册逻辑
  if (email && username && password) {
    res.json({
      success: true,
      data: {
        user: {
          id: 'new-user-' + Date.now(),
          email,
          username,
          avatar: null,
          role: 'user'
        },
        token: 'test-jwt-token-new',
        refreshToken: 'test-refresh-token-new'
      }
    })
  } else {
    res.status(400).json({
      success: false,
      message: '请提供完整的注册信息'
    })
  }
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    path: req.originalUrl
  })
})

// 错误处理
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', error)
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? error.message : '服务暂时不可用'
  })
})

const PORT = process.env.PORT || 8081
const HOST = process.env.HOST || 'localhost'

// 启动服务器
httpServer.listen(PORT, HOST, () => {
  console.log('🚀 TavernAI Plus 简化版API服务器启动成功！')
  console.log(`📍 运行地址: http://${HOST}:${PORT}`)
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🤖 AI 模型: ${process.env.DEFAULT_MODEL || 'grok-3'}`)
  console.log('📋 可用端点:')
  console.log('   GET  /health - 健康检查')
  console.log('   GET  /api/test - API测试')
  console.log('   GET  /api/characters - 角色列表')
  console.log('   GET  /api/characters/:id - 角色详情')
  console.log('   POST /api/auth/login - 用户登录')
  console.log('   POST /api/auth/register - 用户注册')
  console.log('')
  console.log('⚠️  注意：这是简化测试版本，使用模拟数据')
  console.log('💡 测试账号: admin@tavernai.com / Admin123!@#')
})

export default app