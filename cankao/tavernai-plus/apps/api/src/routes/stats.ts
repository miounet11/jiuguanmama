import { Router, Request, Response } from 'express'

const router = Router()

// 测试端点 - 简单返回静态数据
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Stats route working!', timestamp: new Date().toISOString() })
})

// 获取社区统计数据 - 完全静态实现
router.get('/community', (req: Request, res: Response) => {
  console.log('社区统计端点被调用')

  const stats = {
    users: {
      total: 49,
      active: 15
    },
    characters: {
      total: 5,
      sharedToday: 2
    },
    sessions: {
      total: 77,
      today: 12
    },
    messages: {
      total: 1165,
      today: 89
    },
    engagement: {
      dailyActiveRate: '30.0',
      messagesPerSession: '15.1'
    },
    lastUpdated: new Date().toISOString()
  }

  res.json(stats)
})

export default router