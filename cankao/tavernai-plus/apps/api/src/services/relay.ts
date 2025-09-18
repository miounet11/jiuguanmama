/**
 * 智能中继服务 - 参考 new-api 的核心设计
 * 实现智能负载均衡、自动故障转移、请求重试等高级特性
 */

import { EventEmitter } from 'events'
import axios, { AxiosInstance, AxiosError } from 'axios'
import { prisma } from '../server'
import { modelConfigService, ModelConfig } from './model-config'
import PQueue from 'p-queue'
import crypto from 'crypto'

// 渠道状态
export enum ChannelStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
  EXHAUSTED = 'exhausted',
  ERROR = 'error',
  TESTING = 'testing'
}

// 渠道类型
export interface Channel {
  id: string
  name: string
  type: string // openai, anthropic, google, etc
  key: string
  endpoint?: string
  models: string[]
  priority: number
  weight: number  // 权重，用于负载均衡
  status: ChannelStatus
  balance?: number  // 余额（如果适用）
  rpm?: number      // 每分钟请求限制
  tpm?: number      // 每分钟token限制
  errorCount: number
  successCount: number
  avgLatency: number
  lastUsedAt?: Date
  lastErrorAt?: Date
  metadata?: any
}

// 请求上下文
export interface RelayContext {
  requestId: string
  userId: string
  model: string
  originalModel: string
  group?: string
  retryCount: number
  usedChannels: string[]
  startTime: number
  stream: boolean
  temperature?: number
  maxTokens?: number
}

// 重试配置
interface RetryConfig {
  maxRetries: number
  retryDelay: number
  backoffMultiplier: number
  retryableErrors: string[]
}

class RelayService extends EventEmitter {
  private channels: Map<string, Channel> = new Map()
  private channelGroups: Map<string, string[]> = new Map()
  private requestQueues: Map<string, PQueue> = new Map()
  private circuitBreakers: Map<string, CircuitBreaker> = new Map()
  private healthChecker: HealthChecker

  // 配置
  private readonly config = {
    retry: {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', '429', '503']
    } as RetryConfig,
    loadBalance: {
      algorithm: 'weighted-round-robin', // weighted-round-robin, least-connections, random
      stickySession: false,
      sessionTimeout: 300000 // 5分钟
    },
    circuitBreaker: {
      threshold: 5,        // 错误阈值
      timeout: 60000,      // 熔断时长
      resetTimeout: 30000  // 半开状态超时
    },
    rateLimit: {
      globalRpm: 10000,
      globalTpm: 1000000,
      perUserRpm: 100,
      perUserTpm: 10000
    }
  }

  constructor() {
    super()
    this.healthChecker = new HealthChecker(this)
    this.initialize()
  }

  // 初始化
  private async initialize() {
    await this.loadChannels()
    this.startHealthCheck()
    this.setupEventListeners()
  }

  // 加载渠道配置
  private async loadChannels() {
    try {
      // 从数据库加载渠道
      const channelsData = await prisma.channel.findMany({
        where: { isActive: true }
      })

      channelsData.forEach(ch => {
        const channel: Channel = {
          id: ch.id,
          name: ch.name,
          type: ch.provider, // 使用provider作为type
          key: ch.apiKey,
          endpoint: ch.baseUrl || '',
          models: JSON.parse(ch.models || '[]') as string[],
          priority: ch.priority,
          weight: ch.weight,
          status: ch.isActive ? ChannelStatus.ACTIVE : ChannelStatus.DISABLED,
          balance: 0, // 默认值，实际字段不存在
          rpm: ch.rpmLimit || 0,
          tpm: ch.tpmLimit || 0,
          errorCount: ch.errorCount,
          successCount: ch.usageCount, // 使用usageCount作为successCount
          avgLatency: 0,
          metadata: {} // 默认空对象，实际字段不存在
        }

        this.channels.set(channel.id, channel)

        // 初始化请求队列
        this.requestQueues.set(channel.id, new PQueue({
          concurrency: channel.rpm ? Math.ceil(channel.rpm / 60) : 10,
          interval: 1000,
          intervalCap: channel.rpm ? Math.ceil(channel.rpm / 60) : 10
        }))

        // 初始化熔断器
        this.circuitBreakers.set(channel.id, new CircuitBreaker(
          channel.id,
          this.config.circuitBreaker
        ))
      })

      console.log(`✅ 加载了 ${this.channels.size} 个渠道`)
    } catch (error) {
      console.error('加载渠道失败:', error)
    }
  }

  // 智能选择渠道
  private selectChannel(ctx: RelayContext): Channel | null {
    const availableChannels = Array.from(this.channels.values())
      .filter(ch => {
        // 基础过滤
        if (ch.status !== ChannelStatus.ACTIVE) return false
        if (ctx.usedChannels.includes(ch.id)) return false
        if (!ch.models.includes(ctx.model)) return false

        // 熔断器检查
        const breaker = this.circuitBreakers.get(ch.id)
        if (breaker && !breaker.canPass()) return false

        // 余额检查
        if (ch.balance !== undefined && ch.balance <= 0) return false

        return true
      })
      .sort((a, b) => {
        // 优先级排序
        if (a.priority !== b.priority) {
          return b.priority - a.priority
        }
        // 错误率排序
        const aErrorRate = a.errorCount / (a.successCount + a.errorCount + 1)
        const bErrorRate = b.errorCount / (b.successCount + b.errorCount + 1)
        if (aErrorRate !== bErrorRate) {
          return aErrorRate - bErrorRate
        }
        // 延迟排序
        return a.avgLatency - b.avgLatency
      })

    if (availableChannels.length === 0) {
      return null
    }

    // 根据配置的算法选择
    switch (this.config.loadBalance.algorithm) {
      case 'weighted-round-robin':
        return this.weightedRoundRobin(availableChannels)
      case 'least-connections':
        return this.leastConnections(availableChannels)
      case 'random':
        return availableChannels[Math.floor(Math.random() * availableChannels.length)]
      default:
        return availableChannels[0]
    }
  }

  // 加权轮询
  private weightedRoundRobin(channels: Channel[]): Channel {
    const totalWeight = channels.reduce((sum, ch) => sum + ch.weight, 0)
    let random = Math.random() * totalWeight

    for (const channel of channels) {
      random -= channel.weight
      if (random <= 0) {
        return channel
      }
    }

    return channels[0]
  }

  // 最少连接
  private leastConnections(channels: Channel[]): Channel {
    return channels.reduce((min, ch) => {
      const minQueue = this.requestQueues.get(min.id)
      const chQueue = this.requestQueues.get(ch.id)

      const minPending = minQueue?.pending || 0
      const chPending = chQueue?.pending || 0

      return chPending < minPending ? ch : min
    })
  }

  // 执行中继请求
  async relay(ctx: RelayContext, requestBody: any): Promise<any> {
    ctx.startTime = Date.now()

    // 重试逻辑
    for (let i = 0; i <= this.config.retry.maxRetries; i++) {
      ctx.retryCount = i

      // 选择渠道
      const channel = this.selectChannel(ctx)
      if (!channel) {
        if (i === this.config.retry.maxRetries) {
          throw new Error('没有可用的渠道')
        }
        // 等待后重试
        await this.delay(this.config.retry.retryDelay * Math.pow(this.config.retry.backoffMultiplier, i))
        continue
      }

      ctx.usedChannels.push(channel.id)

      try {
        // 通过队列执行请求
        const queue = this.requestQueues.get(channel.id)!
        const result = await queue.add(async () => {
          return await this.executeRequest(channel, ctx, requestBody)
        })

        // 更新统计
        this.updateChannelStats(channel, true, Date.now() - ctx.startTime)

        // 记录使用日志
        await this.logUsage(channel, ctx, result)

        return result
      } catch (error: any) {
        console.error(`渠道 ${channel.name} 请求失败:`, error.message)

        // 更新统计
        this.updateChannelStats(channel, false, Date.now() - ctx.startTime)

        // 记录错误
        const breaker = this.circuitBreakers.get(channel.id)
        breaker?.recordError()

        // 判断是否需要重试
        if (!this.shouldRetry(error) || i === this.config.retry.maxRetries) {
          throw error
        }

        // 等待后重试
        await this.delay(this.config.retry.retryDelay * Math.pow(this.config.retry.backoffMultiplier, i))
      }
    }

    throw new Error('请求失败，已达最大重试次数')
  }

  // 执行实际请求
  private async executeRequest(channel: Channel, ctx: RelayContext, requestBody: any): Promise<any> {
    const headers = this.buildHeaders(channel, ctx)
    const url = this.buildUrl(channel, ctx)

    // 转换请求体格式（适配不同提供商）
    const transformedBody = this.transformRequest(channel, requestBody)

    // 创建 axios 实例
    const client = axios.create({
      baseURL: channel.endpoint || this.getDefaultEndpoint(channel.type),
      timeout: 60000,
      headers
    })

    // 处理流式响应
    if (ctx.stream) {
      return await this.handleStreamRequest(client, url, transformedBody, channel)
    }

    // 普通请求
    const response = await client.post(url, transformedBody)

    // 转换响应格式（统一化）
    return this.transformResponse(channel, response.data)
  }

  // 处理流式请求
  private async handleStreamRequest(
    client: AxiosInstance,
    url: string,
    body: any,
    channel: Channel
  ): Promise<any> {
    const response = await client.post(url, body, {
      responseType: 'stream'
    })

    // 返回转换后的流
    return this.transformStream(channel, response.data)
  }

  // 构建请求头
  private buildHeaders(channel: Channel, ctx: RelayContext): any {
    const headers: any = {
      'Content-Type': 'application/json'
    }

    switch (channel.type) {
      case 'openai':
        headers['Authorization'] = `Bearer ${channel.key}`
        break
      case 'anthropic':
        headers['x-api-key'] = channel.key
        headers['anthropic-version'] = '2023-06-01'
        break
      case 'google':
        headers['x-goog-api-key'] = channel.key
        break
      default:
        headers['Authorization'] = `Bearer ${channel.key}`
    }

    return headers
  }

  // 构建URL
  private buildUrl(channel: Channel, ctx: RelayContext): string {
    switch (channel.type) {
      case 'openai':
        if (ctx.model.startsWith('dall-e')) {
          return '/v1/images/generations'
        }
        return '/v1/chat/completions'
      case 'anthropic':
        return '/v1/messages'
      case 'google':
        return `/v1/models/${ctx.model}:generateContent`
      default:
        return '/v1/chat/completions'
    }
  }

  // 转换请求格式
  private transformRequest(channel: Channel, requestBody: any): any {
    // 根据不同的提供商转换请求格式
    switch (channel.type) {
      case 'anthropic':
        return this.transformToAnthropic(requestBody)
      case 'google':
        return this.transformToGoogle(requestBody)
      default:
        return requestBody
    }
  }

  // 转换响应格式
  private transformResponse(channel: Channel, response: any): any {
    // 统一不同提供商的响应格式
    switch (channel.type) {
      case 'anthropic':
        return this.transformFromAnthropic(response)
      case 'google':
        return this.transformFromGoogle(response)
      default:
        return response
    }
  }

  // 判断是否应该重试
  private shouldRetry(error: any): boolean {
    if (error.code && this.config.retry.retryableErrors.includes(error.code)) {
      return true
    }

    if (error.response?.status) {
      const status = error.response.status
      return [429, 500, 502, 503, 504].includes(status)
    }

    return false
  }

  // 更新渠道统计
  private updateChannelStats(channel: Channel, success: boolean, latency: number) {
    if (success) {
      channel.successCount++
      channel.avgLatency = (channel.avgLatency * (channel.successCount - 1) + latency) / channel.successCount
    } else {
      channel.errorCount++
      channel.lastErrorAt = new Date()
    }
    channel.lastUsedAt = new Date()

    // 异步更新数据库
    setImmediate(() => {
      prisma.channel.update({
        where: { id: channel.id },
        data: {
          usageCount: channel.successCount,
          errorCount: channel.errorCount,
          lastUsedAt: channel.lastUsedAt || new Date()
        }
      }).catch(console.error)
    })
  }

  // 记录使用日志
  private async logUsage(channel: Channel, ctx: RelayContext, result: any) {
    try {
      const tokens = this.countTokens(result)
      const cost = this.calculateCost(channel, tokens)

      await prisma.usageLog.create({
        data: {
          userId: ctx.userId,
          endpoint: '/v1/chat/completions',
          method: 'POST',
          statusCode: 200,
          responseTime: Date.now() - ctx.startTime,
          ip: '',
          userAgent: ''
        }
      })
    } catch (error) {
      console.error('记录使用日志失败:', error)
    }
  }

  // 健康检查
  private startHealthCheck() {
    setInterval(() => {
      this.channels.forEach(channel => {
        this.healthChecker.check(channel)
      })
    }, 60000) // 每分钟检查一次
  }

  // 延迟
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 获取默认端点
  private getDefaultEndpoint(type: string): string {
    const endpoints: Record<string, string> = {
      openai: 'https://api.openai.com',
      anthropic: 'https://api.anthropic.com',
      google: 'https://generativelanguage.googleapis.com',
      deepseek: 'https://api.deepseek.com'
    }
    return endpoints[type] || ''
  }

  // 设置事件监听
  private setupEventListeners() {
    this.on('channel:error', (channelId: string) => {
      const channel = this.channels.get(channelId)
      if (channel && channel.errorCount > 10) {
        channel.status = ChannelStatus.ERROR
        console.error(`渠道 ${channel.name} 错误过多，已禁用`)
      }
    })

    this.on('channel:recovered', (channelId: string) => {
      const channel = this.channels.get(channelId)
      if (channel) {
        channel.status = ChannelStatus.ACTIVE
        channel.errorCount = 0
        console.log(`渠道 ${channel.name} 已恢复`)
      }
    })
  }

  // 辅助方法略...
  private transformToAnthropic(body: any): any {
    // OpenAI 格式转 Anthropic 格式
    return {
      model: body.model,
      messages: body.messages,
      max_tokens: body.max_tokens || 1024,
      temperature: body.temperature
    }
  }

  private transformFromAnthropic(response: any): any {
    // Anthropic 格式转 OpenAI 格式
    return {
      id: response.id,
      object: 'chat.completion',
      created: Date.now() / 1000,
      model: response.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: response.content[0].text
        },
        finish_reason: response.stop_reason
      }],
      usage: response.usage
    }
  }

  private transformToGoogle(body: any): any {
    // OpenAI 格式转 Google 格式
    return {
      contents: body.messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      generationConfig: {
        temperature: body.temperature,
        maxOutputTokens: body.max_tokens
      }
    }
  }

  private transformFromGoogle(response: any): any {
    // Google 格式转 OpenAI 格式
    return {
      id: crypto.randomBytes(16).toString('hex'),
      object: 'chat.completion',
      created: Date.now() / 1000,
      model: 'gemini-pro',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: response.candidates[0].content.parts[0].text
        },
        finish_reason: 'stop'
      }]
    }
  }

  private transformStream(channel: Channel, stream: any): any {
    // 转换流式响应（实现略）
    return stream
  }

  private countTokens(result: any): any {
    // 计算 token 数量（实现略）
    return {
      prompt: result.usage?.prompt_tokens || 0,
      completion: result.usage?.completion_tokens || 0,
      total: result.usage?.total_tokens || 0
    }
  }

  private calculateCost(channel: Channel, tokens: any): number {
    // 计算成本（实现略）
    return 0
  }
}

// 熔断器
class CircuitBreaker {
  private channelId: string
  private errorCount: number = 0
  private lastErrorTime?: Date
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private config: any

  constructor(channelId: string, config: any) {
    this.channelId = channelId
    this.config = config
  }

  canPass(): boolean {
    if (this.state === 'closed') {
      return true
    }

    if (this.state === 'open') {
      // 检查是否可以进入半开状态
      if (this.lastErrorTime &&
          Date.now() - this.lastErrorTime.getTime() > this.config.timeout) {
        this.state = 'half-open'
        return true
      }
      return false
    }

    // 半开状态，允许少量请求通过
    return Math.random() < 0.1
  }

  recordError() {
    this.errorCount++
    this.lastErrorTime = new Date()

    if (this.errorCount >= this.config.threshold) {
      this.state = 'open'
      console.log(`熔断器开启: ${this.channelId}`)

      // 自动重置
      setTimeout(() => {
        this.reset()
      }, this.config.resetTimeout)
    }
  }

  recordSuccess() {
    if (this.state === 'half-open') {
      this.reset()
    }
  }

  reset() {
    this.errorCount = 0
    this.state = 'closed'
    console.log(`熔断器重置: ${this.channelId}`)
  }
}

// 健康检查器
class HealthChecker {
  constructor(private relayService: RelayService) {}

  async check(channel: Channel) {
    try {
      // 发送测试请求
      const response = await axios.post(
        `${channel.endpoint || ''}/v1/models`,
        {},
        {
          headers: { Authorization: `Bearer ${channel.key}` },
          timeout: 5000
        }
      )

      if (response.status === 200) {
        this.relayService.emit('channel:recovered', channel.id)
      }
    } catch (error) {
      // 忽略错误，由主逻辑处理
    }
  }
}

export const relayService = new RelayService()
