import { Router, Request, Response } from 'express'
import { AuthRequest, authenticate } from '../middleware/auth'
import PerformanceMonitor from '../services/performanceMonitor'
import CacheManager from '../services/cacheManager'
import DatabaseOptimizer from '../services/databaseOptimizer'
import ScalabilityManager from '../services/scalabilityManager'
import LoadBalancer from '../services/loadBalancer'
import { prisma } from '../lib/prisma'

const router = Router()

// 系统健康检查（详细版）
router.get('/health/detailed', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // 检查管理员权限
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    })

    if (!user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      })
    }

    // 获取各组件健康状况
    const [
      performanceMetrics,
      cacheHealth,
      dbHealth,
      scalabilityReport,
      loadBalancerStatus
    ] = await Promise.all([
      PerformanceMonitor.getCurrentMetrics(),
      CacheManager.getHealthStatus(),
      DatabaseOptimizer.healthCheck(),
      ScalabilityManager.getScalabilityReport(),
      LoadBalancer.getStatus()
    ])

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        overall: {
          status: 'healthy', // 简化实现
          uptime: process.uptime(),
          version: '1.0.0'
        },
        performance: performanceMetrics,
        cache: cacheHealth,
        database: dbHealth,
        scalability: scalabilityReport,
        loadBalancer: loadBalancerStatus
      }
    })
  } catch (error) {
    console.error('获取系统健康状况失败:', error)
    res.status(500).json({
      success: false,
      message: '获取系统健康状况失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 性能报告
router.get('/performance/report', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    })

    if (!user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      })
    }

    const { hours = 24 } = req.query
    const report = PerformanceMonitor.getPerformanceReport(Number(hours))

    res.json({
      success: true,
      data: report
    })
  } catch (error) {
    console.error('获取性能报告失败:', error)
    res.status(500).json({
      success: false,
      message: '获取性能报告失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 缓存统计
router.get('/cache/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    })

    if (!user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      })
    }

    const stats = CacheManager.getStats()
    const hitRates = CacheManager.getAllHitRates()

    res.json({
      success: true,
      data: {
        stats,
        hitRates,
        health: CacheManager.getHealthStatus()
      }
    })
  } catch (error) {
    console.error('获取缓存统计失败:', error)
    res.status(500).json({
      success: false,
      message: '获取缓存统计失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 清理缓存
router.post('/cache/flush', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    })

    if (!user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      })
    }

    const { cacheName } = req.body

    if (cacheName) {
      CacheManager.flush(cacheName)
    } else {
      CacheManager.flushAll()
    }

    res.json({
      success: true,
      message: cacheName ? `${cacheName}缓存已清理` : '所有缓存已清理'
    })
  } catch (error) {
    console.error('清理缓存失败:', error)
    res.status(500).json({
      success: false,
      message: '清理缓存失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 数据库优化统计
router.get('/database/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    })

    if (!user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      })
    }

    const [stats, healthCheck, slowQueries] = await Promise.all([
      DatabaseOptimizer.getPerformanceStats(),
      DatabaseOptimizer.healthCheck(),
      DatabaseOptimizer.getSlowQueryAnalysis()
    ])

    res.json({
      success: true,
      data: {
        stats,
        health: healthCheck,
        slowQueries
      }
    })
  } catch (error) {
    console.error('获取数据库统计失败:', error)
    res.status(500).json({
      success: false,
      message: '获取数据库统计失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 清理过期数据
router.post('/database/cleanup', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    })

    if (!user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      })
    }

    await DatabaseOptimizer.cleanupExpiredData()

    res.json({
      success: true,
      message: '过期数据清理完成'
    })
  } catch (error) {
    console.error('清理过期数据失败:', error)
    res.status(500).json({
      success: false,
      message: '清理过期数据失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 优化查询性能
router.post('/database/optimize', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    })

    if (!user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      })
    }

    await DatabaseOptimizer.optimizeQueries()

    res.json({
      success: true,
      message: '数据库优化完成'
    })
  } catch (error) {
    console.error('数据库优化失败:', error)
    res.status(500).json({
      success: false,
      message: '数据库优化失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 可扩展性报告
router.get('/scalability/report', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    })

    if (!user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      })
    }

    const report = ScalabilityManager.getScalabilityReport()

    res.json({
      success: true,
      data: report
    })
  } catch (error) {
    console.error('获取可扩展性报告失败:', error)
    res.status(500).json({
      success: false,
      message: '获取可扩展性报告失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 手动扩容
router.post('/scalability/scale-up', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    })

    if (!user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      })
    }

    await ScalabilityManager.manualScaleUp()

    res.json({
      success: true,
      message: '扩容操作已触发'
    })
  } catch (error) {
    console.error('手动扩容失败:', error)
    res.status(500).json({
      success: false,
      message: '手动扩容失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 手动缩容
router.post('/scalability/scale-down', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    })

    if (!user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      })
    }

    await ScalabilityManager.manualScaleDown()

    res.json({
      success: true,
      message: '缩容操作已触发'
    })
  } catch (error) {
    console.error('手动缩容失败:', error)
    res.status(500).json({
      success: false,
      message: '手动缩容失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 负载均衡状态
router.get('/loadbalancer/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    })

    if (!user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      })
    }

    const status = LoadBalancer.getStatus()

    res.json({
      success: true,
      data: status
    })
  } catch (error) {
    console.error('获取负载均衡状态失败:', error)
    res.status(500).json({
      success: false,
      message: '获取负载均衡状态失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 系统度量仪表板
router.get('/dashboard', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    })

    if (!user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      })
    }

    // 汇总所有关键指标
    const [
      performanceMetrics,
      cacheStats,
      dbStats,
      scalabilityReport,
      loadBalancerStatus,
      recentAlerts
    ] = await Promise.all([
      PerformanceMonitor.getCurrentMetrics(),
      CacheManager.getStats(),
      DatabaseOptimizer.getPerformanceStats(),
      ScalabilityManager.getScalabilityReport(),
      LoadBalancer.getStatus(),
      PerformanceMonitor.getRecentAlerts(5)
    ])

    // 计算健康评分
    const healthScore = calculateHealthScore({
      performance: performanceMetrics,
      cache: CacheManager.getHealthStatus(),
      database: await DatabaseOptimizer.healthCheck(),
      scalability: scalabilityReport
    })

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        healthScore,
        summary: {
          instances: loadBalancerStatus.workerCount,
          avgCpu: loadBalancerStatus.stats.avgCpu,
          avgMemory: loadBalancerStatus.stats.avgMemory,
          cacheHitRate: Object.values(CacheManager.getAllHitRates()).reduce((sum, rate) => sum + rate, 0) / Object.keys(CacheManager.getAllHitRates()).length * 100,
          totalRequests: loadBalancerStatus.stats.totalRequests,
          alerts: recentAlerts.length
        },
        details: {
          performance: performanceMetrics,
          cache: cacheStats,
          database: dbStats,
          scalability: scalabilityReport,
          loadBalancer: loadBalancerStatus,
          alerts: recentAlerts
        }
      }
    })
  } catch (error) {
    console.error('获取系统仪表板失败:', error)
    res.status(500).json({
      success: false,
      message: '获取系统仪表板失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

/**
 * 计算系统健康评分
 */
function calculateHealthScore(components: any): number {
  let score = 100
  let issues = 0

  // 性能评分
  if (components.performance) {
    if (components.performance.cpu.usage > 80) score -= 15
    if (components.performance.memory.usage > 85) score -= 15
    if (components.performance.api.responseTime > 2000) score -= 10
    if (components.performance.api.errorRate > 5) score -= 20
  }

  // 缓存评分
  if (components.cache.status !== 'healthy') {
    score -= 10
    issues += components.cache.issues.length
  }

  // 数据库评分
  if (components.database.status !== 'healthy') {
    score -= 15
    issues += components.database.issues.length
  }

  // 可扩展性评分
  if (components.scalability.metrics.trend === 'increasing') {
    score -= 5 // 负载增加，但这不是严重问题
  }

  // 每个问题扣2分
  score -= issues * 2

  return Math.max(0, Math.min(100, score))
}

export default router
