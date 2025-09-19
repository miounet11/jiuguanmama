import { EventEmitter } from 'events'
import os from 'os'
import { prisma } from '../lib/prisma'
import CacheManager from './cacheManager'
import DatabaseOptimizer from './databaseOptimizer'

export interface PerformanceMetrics {
  timestamp: Date
  cpu: {
    usage: number
    loadAverage: number[]
  }
  memory: {
    used: number
    total: number
    usage: number
    heap: {
      used: number
      total: number
    }
  }
  database: {
    connections: number
    queryTime: number
    errorRate: number
  }
  api: {
    requestCount: number
    responseTime: number
    errorRate: number
  }
  cache: {
    hitRate: number
    memoryUsage: number
  }
  recommendation: {
    requestCount: number
    avgResponseTime: number
    clickRate: number
  }
}

export interface Alert {
  id: string
  type: 'info' | 'warning' | 'error' | 'critical'
  message: string
  timestamp: Date
  metric: string
  value: number
  threshold: number
}

export class PerformanceMonitor extends EventEmitter {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics[] = []
  private alerts: Alert[] = []
  private isMonitoring = false
  private intervalId?: NodeJS.Timeout
  private requestStats = {
    count: 0,
    totalTime: 0,
    errors: 0
  }
  private recommendationStats = {
    count: 0,
    totalTime: 0,
    clicks: 0
  }

  // 性能阈值配置
  private readonly thresholds = {
    cpu: 80, // CPU使用率阈值
    memory: 85, // 内存使用率阈值
    responseTime: 2000, // 响应时间阈值（毫秒）
    errorRate: 5, // 错误率阈值（百分比）
    cacheHitRate: 60, // 缓存命中率阈值（百分比）
    dbQueryTime: 1000 // 数据库查询时间阈值（毫秒）
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  constructor() {
    super()
    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    this.on('alert', (alert: Alert) => {
      console.log(`🚨 [${alert.type.toUpperCase()}] ${alert.message}`)

      // 在生产环境中，这里应该发送通知到监控系统
      // 如: Slack, Discord, 邮件等
    })

    this.on('metrics', (metrics: PerformanceMetrics) => {
      this.checkThresholds(metrics)
    })
  }

  /**
   * 开始监控
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      console.log('性能监控已在运行')
      return
    }

    this.isMonitoring = true
    this.intervalId = setInterval(() => {
      this.collectMetrics()
    }, intervalMs)

    console.log(`✅ 性能监控已启动，采集间隔: ${intervalMs}ms`)
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }

    this.isMonitoring = false
    console.log('⏹️ 性能监控已停止')
  }

  /**
   * 收集性能指标
   */
  private async collectMetrics(): Promise<void> {
    try {
      const timestamp = new Date()

      // CPU 指标
      const cpuUsage = await this.getCpuUsage()
      const loadAverage = os.loadavg()

      // 内存指标
      const memUsage = process.memoryUsage()
      const totalMem = os.totalmem()
      const freeMem = os.freemem()
      const usedMem = totalMem - freeMem

      // 数据库指标
      const dbMetrics = await this.getDatabaseMetrics()

      // API 指标
      const apiMetrics = this.getApiMetrics()

      // 缓存指标
      const cacheMetrics = this.getCacheMetrics()

      // 推荐系统指标
      const recommendationMetrics = this.getRecommendationMetrics()

      const metrics: PerformanceMetrics = {
        timestamp,
        cpu: {
          usage: cpuUsage,
          loadAverage
        },
        memory: {
          used: usedMem,
          total: totalMem,
          usage: (usedMem / totalMem) * 100,
          heap: {
            used: memUsage.heapUsed,
            total: memUsage.heapTotal
          }
        },
        database: dbMetrics,
        api: apiMetrics,
        cache: cacheMetrics,
        recommendation: recommendationMetrics
      }

      this.metrics.push(metrics)

      // 保留最近1000条记录
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000)
      }

      this.emit('metrics', metrics)
    } catch (error) {
      console.error('收集性能指标失败:', error)
    }
  }

  /**
   * 获取CPU使用率
   */
  private getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startMeasures = os.cpus()

      setTimeout(() => {
        const endMeasures = os.cpus()

        let totalIdle = 0
        let totalTick = 0

        for (let i = 0; i < startMeasures.length; i++) {
          const startMeasure = startMeasures[i]
          const endMeasure = endMeasures[i]

          const startIdle = startMeasure.times.idle
          const startTotal = Object.values(startMeasure.times).reduce((a, b) => a + b, 0)

          const endIdle = endMeasure.times.idle
          const endTotal = Object.values(endMeasure.times).reduce((a, b) => a + b, 0)

          const idle = endIdle - startIdle
          const total = endTotal - startTotal

          totalIdle += idle
          totalTick += total
        }

        const usage = 100 - (totalIdle / totalTick * 100)
        resolve(Math.round(usage * 100) / 100)
      }, 100)
    })
  }

  /**
   * 获取数据库指标
   */
  private async getDatabaseMetrics(): Promise<{
    connections: number
    queryTime: number
    errorRate: number
  }> {
    try {
      // 简化实现，实际项目中应该从连接池获取真实指标
      const start = Date.now()
      await prisma.$queryRaw`SELECT 1`
      const queryTime = Date.now() - start

      return {
        connections: 1, // 简化值
        queryTime,
        errorRate: 0 // 简化值
      }
    } catch (error) {
      return {
        connections: 0,
        queryTime: 0,
        errorRate: 100
      }
    }
  }

  /**
   * 获取API指标
   */
  private getApiMetrics(): {
    requestCount: number
    responseTime: number
    errorRate: number
  } {
    const { count, totalTime, errors } = this.requestStats

    return {
      requestCount: count,
      responseTime: count > 0 ? totalTime / count : 0,
      errorRate: count > 0 ? (errors / count) * 100 : 0
    }
  }

  /**
   * 获取缓存指标
   */
  private getCacheMetrics(): {
    hitRate: number
    memoryUsage: number
  } {
    // const cacheManager = new CacheManager() // 临时禁用，因为构造函数问题
    const hitRates = {} as Record<string, number> // 临时使用空对象
    const stats = {} as Record<string, any>

    // 计算平均命中率
    const hitRateValues = Object.values(hitRates) as number[]
    const avgHitRate = hitRateValues.length > 0 ? hitRateValues.reduce((sum: number, rate: number) => sum + rate, 0) / hitRateValues.length : 0

    // 计算总内存使用
    const totalMemory = Object.values(stats).reduce((sum: number, stat: any) => sum + stat.vsize, 0)

    return {
      hitRate: avgHitRate * 100,
      memoryUsage: totalMemory
    }
  }

  /**
   * 获取推荐系统指标
   */
  private getRecommendationMetrics(): {
    requestCount: number
    avgResponseTime: number
    clickRate: number
  } {
    const { count, totalTime, clicks } = this.recommendationStats

    return {
      requestCount: count,
      avgResponseTime: count > 0 ? totalTime / count : 0,
      clickRate: count > 0 ? (clicks / count) * 100 : 0
    }
  }

  /**
   * 检查阈值并生成告警
   */
  private checkThresholds(metrics: PerformanceMetrics): void {
    const alerts: Alert[] = []

    // CPU 检查
    if (metrics.cpu.usage > this.thresholds.cpu) {
      alerts.push({
        id: `cpu-${Date.now()}`,
        type: metrics.cpu.usage > 90 ? 'critical' : 'warning',
        message: `CPU使用率过高: ${metrics.cpu.usage.toFixed(1)}%`,
        timestamp: new Date(),
        metric: 'cpu.usage',
        value: metrics.cpu.usage,
        threshold: this.thresholds.cpu
      })
    }

    // 内存检查
    if (metrics.memory.usage > this.thresholds.memory) {
      alerts.push({
        id: `memory-${Date.now()}`,
        type: metrics.memory.usage > 95 ? 'critical' : 'warning',
        message: `内存使用率过高: ${metrics.memory.usage.toFixed(1)}%`,
        timestamp: new Date(),
        metric: 'memory.usage',
        value: metrics.memory.usage,
        threshold: this.thresholds.memory
      })
    }

    // API响应时间检查
    if (metrics.api.responseTime > this.thresholds.responseTime) {
      alerts.push({
        id: `api-response-${Date.now()}`,
        type: 'warning',
        message: `API响应时间过长: ${metrics.api.responseTime}ms`,
        timestamp: new Date(),
        metric: 'api.responseTime',
        value: metrics.api.responseTime,
        threshold: this.thresholds.responseTime
      })
    }

    // API错误率检查
    if (metrics.api.errorRate > this.thresholds.errorRate) {
      alerts.push({
        id: `api-error-${Date.now()}`,
        type: metrics.api.errorRate > 10 ? 'critical' : 'warning',
        message: `API错误率过高: ${metrics.api.errorRate.toFixed(1)}%`,
        timestamp: new Date(),
        metric: 'api.errorRate',
        value: metrics.api.errorRate,
        threshold: this.thresholds.errorRate
      })
    }

    // 缓存命中率检查
    if (metrics.cache.hitRate < this.thresholds.cacheHitRate) {
      alerts.push({
        id: `cache-hit-${Date.now()}`,
        type: 'warning',
        message: `缓存命中率过低: ${metrics.cache.hitRate.toFixed(1)}%`,
        timestamp: new Date(),
        metric: 'cache.hitRate',
        value: metrics.cache.hitRate,
        threshold: this.thresholds.cacheHitRate
      })
    }

    // 数据库查询时间检查
    if (metrics.database.queryTime > this.thresholds.dbQueryTime) {
      alerts.push({
        id: `db-query-${Date.now()}`,
        type: 'warning',
        message: `数据库查询时间过长: ${metrics.database.queryTime}ms`,
        timestamp: new Date(),
        metric: 'database.queryTime',
        value: metrics.database.queryTime,
        threshold: this.thresholds.dbQueryTime
      })
    }

    // 发出告警
    alerts.forEach(alert => {
      this.alerts.push(alert)
      this.emit('alert', alert)
    })

    // 保留最近100条告警
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100)
    }
  }

  /**
   * 记录API请求
   */
  recordApiRequest(responseTime: number, isError: boolean = false): void {
    this.requestStats.count++
    this.requestStats.totalTime += responseTime

    if (isError) {
      this.requestStats.errors++
    }

    // 每小时重置统计
    if (this.requestStats.count % 3600 === 0) {
      this.requestStats = { count: 0, totalTime: 0, errors: 0 }
    }
  }

  /**
   * 记录推荐请求
   */
  recordRecommendationRequest(responseTime: number, wasClicked: boolean = false): void {
    this.recommendationStats.count++
    this.recommendationStats.totalTime += responseTime

    if (wasClicked) {
      this.recommendationStats.clicks++
    }

    // 每小时重置统计
    if (this.recommendationStats.count % 1000 === 0) {
      this.recommendationStats = { count: 0, totalTime: 0, clicks: 0 }
    }
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(hoursBack: number = 24): {
    summary: any
    metrics: PerformanceMetrics[]
    alerts: Alert[]
    recommendations: string[]
  } {
    const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000)
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoff)
    const recentAlerts = this.alerts.filter(a => a.timestamp >= cutoff)

    if (recentMetrics.length === 0) {
      return {
        summary: {},
        metrics: [],
        alerts: recentAlerts,
        recommendations: ['监控数据不足，建议运行更长时间']
      }
    }

    // 计算汇总统计
    const summary = {
      avgCpuUsage: recentMetrics.reduce((sum, m) => sum + m.cpu.usage, 0) / recentMetrics.length,
      avgMemoryUsage: recentMetrics.reduce((sum, m) => sum + m.memory.usage, 0) / recentMetrics.length,
      avgResponseTime: recentMetrics.reduce((sum, m) => sum + m.api.responseTime, 0) / recentMetrics.length,
      avgCacheHitRate: recentMetrics.reduce((sum, m) => sum + m.cache.hitRate, 0) / recentMetrics.length,
      totalRequests: recentMetrics.reduce((sum, m) => sum + m.api.requestCount, 0),
      alertCount: recentAlerts.length
    }

    // 生成优化建议
    const recommendations = this.generateRecommendations(summary, recentAlerts)

    return {
      summary,
      metrics: recentMetrics,
      alerts: recentAlerts,
      recommendations
    }
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(summary: any, alerts: Alert[]): string[] {
    const recommendations: string[] = []

    if (summary.avgCpuUsage > 70) {
      recommendations.push('CPU使用率较高，考虑优化算法或增加服务器资源')
    }

    if (summary.avgMemoryUsage > 80) {
      recommendations.push('内存使用率较高，检查内存泄漏或增加内存')
    }

    if (summary.avgResponseTime > 1000) {
      recommendations.push('API响应时间较长，考虑优化数据库查询或增加缓存')
    }

    if (summary.avgCacheHitRate < 70) {
      recommendations.push('缓存命中率较低，检查缓存策略和TTL设置')
    }

    if (alerts.filter(a => a.type === 'critical').length > 0) {
      recommendations.push('存在严重告警，需要立即处理')
    }

    if (recommendations.length === 0) {
      recommendations.push('系统运行良好，继续保持监控')
    }

    return recommendations
  }

  /**
   * 获取实时指标
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  /**
   * 获取最近的告警
   */
  getRecentAlerts(count: number = 10): Alert[] {
    return this.alerts.slice(-count).reverse()
  }

  /**
   * 清理历史数据
   */
  cleanup(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    this.metrics = this.metrics.filter(m => m.timestamp > oneDayAgo)
    this.alerts = this.alerts.filter(a => a.timestamp > oneDayAgo)

    console.log('🧹 性能监控历史数据已清理')
  }
}

export default PerformanceMonitor.getInstance()
