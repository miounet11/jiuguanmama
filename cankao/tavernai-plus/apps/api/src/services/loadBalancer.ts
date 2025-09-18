import { EventEmitter } from 'events'
import cluster from 'cluster'
import os from 'os'

export interface WorkerInfo {
  id: number
  pid: number
  status: 'online' | 'disconnected' | 'dead' | 'starting'
  memory: number
  cpu: number
  requests: number
  lastActivity: Date
  health: 'healthy' | 'warning' | 'critical'
}

export interface LoadBalancerConfig {
  maxWorkers: number
  minWorkers: number
  maxRequestsPerWorker: number
  memoryThreshold: number // MB
  cpuThreshold: number // %
  healthCheckInterval: number // ms
  gracefulShutdownTimeout: number // ms
}

export class LoadBalancer extends EventEmitter {
  private static instance: LoadBalancer
  private workers: Map<number, WorkerInfo> = new Map()
  private config: LoadBalancerConfig
  private isRunning = false
  private healthCheckInterval?: NodeJS.Timeout
  private requestQueue: Array<{ resolve: Function; reject: Function }> = []

  static getInstance(): LoadBalancer {
    if (!LoadBalancer.instance) {
      LoadBalancer.instance = new LoadBalancer()
    }
    return LoadBalancer.instance
  }

  constructor() {
    super()

    this.config = {
      maxWorkers: Math.min(os.cpus().length, 8), // 最多8个工作进程
      minWorkers: Math.max(2, Math.floor(os.cpus().length / 2)), // 最少2个
      maxRequestsPerWorker: 10000,
      memoryThreshold: 512, // 512MB
      cpuThreshold: 80, // 80%
      healthCheckInterval: 30000, // 30秒
      gracefulShutdownTimeout: 10000 // 10秒
    }

    this.setupClusterHandlers()
  }

  /**
   * 设置集群事件处理器
   */
  private setupClusterHandlers(): void {
    if (cluster.isPrimary) {
      cluster.on('fork', (worker) => {
        console.log(`🚀 工作进程 ${worker.process.pid} 已启动`)

        this.workers.set(worker.id, {
          id: worker.id,
          pid: worker.process.pid!,
          status: 'starting',
          memory: 0,
          cpu: 0,
          requests: 0,
          lastActivity: new Date(),
          health: 'healthy'
        })

        this.emit('worker:started', worker.id)
      })

      cluster.on('online', (worker) => {
        console.log(`✅ 工作进程 ${worker.process.pid} 已就绪`)

        const workerInfo = this.workers.get(worker.id)
        if (workerInfo) {
          workerInfo.status = 'online'
          workerInfo.lastActivity = new Date()
        }

        this.emit('worker:online', worker.id)
      })

      cluster.on('disconnect', (worker) => {
        console.log(`⚠️ 工作进程 ${worker.process.pid} 已断开连接`)

        const workerInfo = this.workers.get(worker.id)
        if (workerInfo) {
          workerInfo.status = 'disconnected'
        }

        this.emit('worker:disconnected', worker.id)
      })

      cluster.on('exit', (worker, code, signal) => {
        console.log(`❌ 工作进程 ${worker.process.pid} 已退出 (code: ${code}, signal: ${signal})`)

        this.workers.delete(worker.id)
        this.emit('worker:died', worker.id, code, signal)

        // 如果不是正常关闭且负载均衡器正在运行，重启工作进程
        if (this.isRunning && code !== 0 && signal !== 'SIGTERM') {
          console.log('🔄 重启工作进程...')
          this.startWorker()
        }
      })

      // 监听工作进程消息
      cluster.on('message', (worker, message) => {
        if (message.type === 'stats') {
          this.updateWorkerStats(worker.id, message.data)
        }
      })
    }
  }

  /**
   * 启动负载均衡器
   */
  start(): void {
    if (cluster.isWorker) {
      console.log('❌ 负载均衡器只能在主进程中启动')
      return
    }

    if (this.isRunning) {
      console.log('负载均衡器已在运行')
      return
    }

    console.log('🚀 启动负载均衡器...')
    this.isRunning = true

    // 启动初始工作进程
    for (let i = 0; i < this.config.minWorkers; i++) {
      this.startWorker()
    }

    // 启动健康检查
    this.startHealthCheck()

    console.log(`✅ 负载均衡器已启动，工作进程数: ${this.config.minWorkers}`)
  }

  /**
   * 停止负载均衡器
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    console.log('⏹️ 停止负载均衡器...')
    this.isRunning = false

    // 停止健康检查
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    // 优雅关闭所有工作进程
    const shutdownPromises = Array.from(this.workers.keys()).map(workerId =>
      this.shutdownWorker(workerId)
    )

    await Promise.all(shutdownPromises)
    console.log('✅ 负载均衡器已停止')
  }

  /**
   * 启动单个工作进程
   */
  startWorker(): cluster.Worker | null {
    if (this.workers.size >= this.config.maxWorkers) {
      console.log('⚠️ 已达到最大工作进程数')
      return null
    }

    return cluster.fork()
  }

  /**
   * 关闭单个工作进程
   */
  async shutdownWorker(workerId: number): Promise<void> {
    const worker = cluster.workers![workerId]
    if (!worker) return

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log(`⚠️ 工作进程 ${workerId} 强制终止`)
        worker.kill('SIGKILL')
        resolve()
      }, this.config.gracefulShutdownTimeout)

      worker.once('disconnect', () => {
        clearTimeout(timeout)
        resolve()
      })

      worker.disconnect()
    })
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.checkWorkerHealth()
      this.balanceLoad()
    }, this.config.healthCheckInterval)
  }

  /**
   * 检查工作进程健康状况
   */
  private checkWorkerHealth(): void {
    for (const [workerId, workerInfo] of this.workers) {
      let health: 'healthy' | 'warning' | 'critical' = 'healthy'
      const issues: string[] = []

      // 检查内存使用
      if (workerInfo.memory > this.config.memoryThreshold) {
        health = 'warning'
        issues.push(`内存使用过高: ${workerInfo.memory}MB`)
      }

      // 检查CPU使用
      if (workerInfo.cpu > this.config.cpuThreshold) {
        health = workerInfo.cpu > 95 ? 'critical' : 'warning'
        issues.push(`CPU使用过高: ${workerInfo.cpu}%`)
      }

      // 检查请求数
      if (workerInfo.requests > this.config.maxRequestsPerWorker) {
        health = 'warning'
        issues.push(`请求数过高: ${workerInfo.requests}`)
      }

      // 检查活跃状态
      const inactiveTime = Date.now() - workerInfo.lastActivity.getTime()
      if (inactiveTime > 5 * 60 * 1000) { // 5分钟无活动
        health = 'critical'
        issues.push('长时间无响应')
      }

      if (health !== workerInfo.health) {
        workerInfo.health = health
        this.emit('worker:health_changed', workerId, health, issues)

        if (health === 'critical') {
          console.log(`🚨 工作进程 ${workerId} 健康状况严重，准备重启`)
          this.restartWorker(workerId)
        }
      }
    }
  }

  /**
   * 负载均衡
   */
  private balanceLoad(): void {
    const activeWorkers = Array.from(this.workers.values())
      .filter(w => w.status === 'online' && w.health !== 'critical')

    const avgRequests = activeWorkers.reduce((sum, w) => sum + w.requests, 0) / activeWorkers.length || 0
    const avgMemory = activeWorkers.reduce((sum, w) => sum + w.memory, 0) / activeWorkers.length || 0
    const avgCpu = activeWorkers.reduce((sum, w) => sum + w.cpu, 0) / activeWorkers.length || 0

    // 如果平均负载过高且未达到最大工作进程数，启动新的工作进程
    if (activeWorkers.length < this.config.maxWorkers) {
      const shouldScale =
        avgRequests > this.config.maxRequestsPerWorker * 0.8 ||
        avgMemory > this.config.memoryThreshold * 0.8 ||
        avgCpu > this.config.cpuThreshold * 0.8

      if (shouldScale) {
        console.log('📈 负载较高，启动新的工作进程')
        this.startWorker()
      }
    }

    // 如果负载很低且工作进程数超过最小值，关闭多余的工作进程
    if (activeWorkers.length > this.config.minWorkers) {
      const shouldDownscale =
        avgRequests < this.config.maxRequestsPerWorker * 0.2 &&
        avgMemory < this.config.memoryThreshold * 0.3 &&
        avgCpu < this.config.cpuThreshold * 0.3

      if (shouldDownscale) {
        // 找到负载最低的工作进程
        const lightestWorker = activeWorkers
          .sort((a, b) => a.requests - b.requests)[0]

        if (lightestWorker) {
          console.log('📉 负载较低，关闭多余的工作进程')
          this.shutdownWorker(lightestWorker.id)
        }
      }
    }
  }

  /**
   * 重启工作进程
   */
  private async restartWorker(workerId: number): Promise<void> {
    console.log(`🔄 重启工作进程 ${workerId}`)

    // 先启动新的工作进程
    const newWorker = this.startWorker()

    if (newWorker) {
      // 等待新工作进程就绪
      await new Promise<void>((resolve) => {
        const checkReady = () => {
          const workerInfo = this.workers.get(newWorker.id)
          if (workerInfo && workerInfo.status === 'online') {
            resolve()
          } else {
            setTimeout(checkReady, 100)
          }
        }
        checkReady()
      })

      // 关闭旧的工作进程
      await this.shutdownWorker(workerId)
    }
  }

  /**
   * 更新工作进程统计信息
   */
  private updateWorkerStats(workerId: number, stats: any): void {
    const workerInfo = this.workers.get(workerId)
    if (workerInfo) {
      workerInfo.memory = stats.memory
      workerInfo.cpu = stats.cpu
      workerInfo.requests = stats.requests
      workerInfo.lastActivity = new Date()
    }
  }

  /**
   * 获取最佳工作进程
   */
  getBestWorker(): cluster.Worker | null {
    const availableWorkers = Array.from(this.workers.entries())
      .filter(([_, info]) => info.status === 'online' && info.health !== 'critical')
      .sort(([_, a], [__, b]) => {
        // 综合考虑请求数、内存和CPU使用率
        const scoreA = a.requests * 0.4 + a.memory * 0.3 + a.cpu * 0.3
        const scoreB = b.requests * 0.4 + b.memory * 0.3 + b.cpu * 0.3
        return scoreA - scoreB
      })

    if (availableWorkers.length === 0) {
      return null
    }

    const [workerId] = availableWorkers[0]
    return cluster.workers![workerId] || null
  }

  /**
   * 获取负载均衡状态
   */
  getStatus(): {
    isRunning: boolean
    workerCount: number
    config: LoadBalancerConfig
    workers: WorkerInfo[]
    stats: {
      totalRequests: number
      avgMemory: number
      avgCpu: number
      healthyWorkers: number
    }
  } {
    const workers = Array.from(this.workers.values())
    const healthyWorkers = workers.filter(w => w.health === 'healthy' && w.status === 'online')

    const totalRequests = workers.reduce((sum, w) => sum + w.requests, 0)
    const avgMemory = workers.length > 0 ? workers.reduce((sum, w) => sum + w.memory, 0) / workers.length : 0
    const avgCpu = workers.length > 0 ? workers.reduce((sum, w) => sum + w.cpu, 0) / workers.length : 0

    return {
      isRunning: this.isRunning,
      workerCount: workers.length,
      config: this.config,
      workers,
      stats: {
        totalRequests,
        avgMemory,
        avgCpu,
        healthyWorkers: healthyWorkers.length
      }
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<LoadBalancerConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('⚙️ 负载均衡器配置已更新')
    this.emit('config:updated', this.config)
  }

  /**
   * 处理请求分发
   */
  async handleRequest<T>(handler: () => Promise<T>): Promise<T> {
    if (cluster.isWorker) {
      // 在工作进程中直接执行
      return handler()
    }

    // 在主进程中分发到工作进程
    const worker = this.getBestWorker()

    if (!worker) {
      throw new Error('没有可用的工作进程')
    }

    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substr(2, 9)
      const timeout = setTimeout(() => {
        reject(new Error('请求超时'))
      }, 30000)

      worker.once('message', (response) => {
        if (response.requestId === requestId) {
          clearTimeout(timeout)
          if (response.error) {
            reject(new Error(response.error))
          } else {
            resolve(response.result)
          }
        }
      })

      worker.send({
        type: 'request',
        requestId,
        handler: handler.toString()
      })
    })
  }
}

export default LoadBalancer.getInstance()
