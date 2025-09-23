/**
 * Prompt注入器服务
 * 核心世界信息注入系统，支持多AI模型的prompt格式适配
 */

import {
  AIModel,
  BaseMessage,
  InjectionConfig,
  InjectionPosition,
  InjectionResult,
  PromptContext,
  PromptInjectorConfig,
  TokenBudget,
  WorldInfoItem,
  LengthAdjustmentConfig,
  PerformanceMetrics,
  PromptInjectionError,
  DEFAULT_TOKEN_BUDGET,
  DEFAULT_INJECTION_CONFIG,
  DEFAULT_LENGTH_ADJUSTMENT
} from '../types/prompt'

import { tokenCounter, estimateTokens, checkTokenBudget, TokenCalculationResult } from '../utils/tokenCounter'
import { worldInfoMatcher } from './worldInfoMatcher'
import { scenarioService } from './scenarioService'

/**
 * 模型格式化器抽象类
 */
abstract class BaseModelFormatter {
  abstract formatSystemMessage(content: string, metadata?: Record<string, any>): BaseMessage
  abstract formatUserMessage(content: string): BaseMessage
  abstract formatAssistantMessage(content: string): BaseMessage
  abstract combineMessages(messages: BaseMessage[]): BaseMessage[]
  abstract getModelLimits(): { maxTokens: number; maxMessages: number; contextWindow: number }

  estimateTokens(text: string): number {
    return estimateTokens(text, this.getModelType())
  }

  abstract getModelType(): AIModel
}

/**
 * OpenAI兼容格式化器
 */
class OpenAIFormatter extends BaseModelFormatter {
  constructor(private model: AIModel = 'openai') {
    super()
  }

  formatSystemMessage(content: string, metadata?: Record<string, any>): BaseMessage {
    return {
      role: 'system',
      content,
      metadata
    }
  }

  formatUserMessage(content: string): BaseMessage {
    return {
      role: 'user',
      content
    }
  }

  formatAssistantMessage(content: string): BaseMessage {
    return {
      role: 'assistant',
      content
    }
  }

  combineMessages(messages: BaseMessage[]): BaseMessage[] {
    // OpenAI格式支持独立的system消息
    return messages
  }

  getModelLimits() {
    const limits = {
      openai: { maxTokens: 4096, maxMessages: 100, contextWindow: 4096 },
      grok: { maxTokens: 4000, maxMessages: 50, contextWindow: 4000 },
      deepseek: { maxTokens: 4096, maxMessages: 100, contextWindow: 4096 }
    }
    return limits[this.model as keyof typeof limits] || limits.openai
  }

  getModelType(): AIModel {
    return this.model
  }
}

/**
 * Claude格式化器
 */
class ClaudeFormatter extends BaseModelFormatter {
  formatSystemMessage(content: string, metadata?: Record<string, any>): BaseMessage {
    // Claude不支持独立system消息，需要融入到用户消息中
    return {
      role: 'user',
      content: `System: ${content}`,
      metadata: { ...metadata, originalRole: 'system' }
    }
  }

  formatUserMessage(content: string): BaseMessage {
    return {
      role: 'user',
      content: `Human: ${content}`
    }
  }

  formatAssistantMessage(content: string): BaseMessage {
    return {
      role: 'assistant',
      content: `Assistant: ${content}`
    }
  }

  combineMessages(messages: BaseMessage[]): BaseMessage[] {
    // Claude要求严格的Human/Assistant交替格式
    const combined: BaseMessage[] = []
    let systemMessages: string[] = []

    // 收集所有system消息
    for (const msg of messages) {
      if (msg.role === 'system' || msg.metadata?.originalRole === 'system') {
        systemMessages.push(msg.content.replace(/^System:\s*/, ''))
      }
    }

    // 将system消息合并到第一个user消息中
    let firstUserMessage = true
    for (const msg of messages) {
      if (msg.role === 'system' || msg.metadata?.originalRole === 'system') {
        continue // 跳过，已处理
      }

      if (msg.role === 'user' && firstUserMessage && systemMessages.length > 0) {
        const systemContent = systemMessages.join('\n\n')
        combined.push({
          role: 'user',
          content: `${systemContent}\n\nHuman: ${msg.content}`
        })
        firstUserMessage = false
      } else {
        combined.push(msg)
      }
    }

    return combined
  }

  getModelLimits() {
    return { maxTokens: 100000, maxMessages: 200, contextWindow: 100000 }
  }

  getModelType(): AIModel {
    return 'claude'
  }
}

/**
 * Gemini格式化器
 */
class GeminiFormatter extends BaseModelFormatter {
  formatSystemMessage(content: string, metadata?: Record<string, any>): BaseMessage {
    return {
      role: 'system',
      content,
      metadata
    }
  }

  formatUserMessage(content: string): BaseMessage {
    return {
      role: 'user',
      content
    }
  }

  formatAssistantMessage(content: string): BaseMessage {
    return {
      role: 'assistant',
      content
    }
  }

  combineMessages(messages: BaseMessage[]): BaseMessage[] {
    // Gemini支持system消息，但有特定的格式要求
    return messages
  }

  getModelLimits() {
    return { maxTokens: 32768, maxMessages: 150, contextWindow: 32768 }
  }

  getModelType(): AIModel {
    return 'gemini'
  }
}

/**
 * Prompt注入器核心类
 */
export class PromptInjector {
  private config: PromptInjectorConfig
  private formatters: Map<AIModel, BaseModelFormatter>
  private performanceMetrics: PerformanceMetrics
  private injectionCache = new Map<string, InjectionResult>()

  constructor(config?: Partial<PromptInjectorConfig>) {
    this.config = {
      tokenBudget: DEFAULT_TOKEN_BUDGET,
      lengthAdjustment: DEFAULT_LENGTH_ADJUSTMENT,
      cache: {
        enabled: true,
        ttl: 300000, // 5分钟
        maxSize: 1000,
        keyStrategy: 'hash'
      },
      defaultInjection: DEFAULT_INJECTION_CONFIG,
      modelFormatters: {},
      performanceThreshold: 200,
      enableMetrics: true,
      ...config
    }

    this.initializeFormatters()
    this.initializeMetrics()
  }

  /**
   * 主要注入方法：向prompt中注入世界信息
   */
  async injectWorldInfo(
    context: PromptContext,
    injectionConfig?: Partial<InjectionConfig>
  ): Promise<InjectionResult> {
    const startTime = performance.now()
    const config = { ...this.config.defaultInjection, ...injectionConfig }

    try {
      // 检查缓存
      const cacheKey = this.generateCacheKey(context, config)
      if (this.config.cache.enabled) {
        const cached = this.getFromCache(cacheKey)
        if (cached) {
          this.updateMetrics('cache_hit', performance.now() - startTime)
          return cached
        }
      }

      // 获取世界信息
      const worldInfoStartTime = performance.now()
      const worldInfo = await this.getWorldInfo(context)
      const worldInfoTime = performance.now() - worldInfoStartTime

      // 计算token预算
      const tokenBudgetStartTime = performance.now()
      const budget = this.calculateTokenBudget(context, config)
      const tokenBudgetTime = performance.now() - tokenBudgetStartTime

      // 选择和优化世界信息条目
      const optimizedWorldInfo = this.optimizeWorldInfo(worldInfo, budget, config)

      // 构建最终prompt
      const buildStartTime = performance.now()
      const result = await this.buildFinalPrompt(context, optimizedWorldInfo, config, budget)
      const buildTime = performance.now() - buildStartTime

      // 添加性能信息
      result.performance = {
        injectionTime: worldInfoTime,
        tokenCalculationTime: tokenBudgetTime,
        totalTime: performance.now() - startTime
      }

      // 缓存结果
      if (this.config.cache.enabled) {
        this.setCache(cacheKey, result)
      }

      this.updateMetrics('injection', result.performance.totalTime)
      return result

    } catch (error) {
      const errorResult: InjectionResult = {
        success: false,
        finalPrompt: context.messages,
        injectedItems: [],
        tokenUsage: this.getEmptyTokenUsage(),
        performance: {
          injectionTime: 0,
          tokenCalculationTime: 0,
          totalTime: performance.now() - startTime
        },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }

      throw new PromptInjectionError(
        '世界信息注入失败',
        'INJECTION_FAILED',
        { context, config, error }
      )
    }
  }

  /**
   * 优化prompt长度（动态调整）
   */
  async optimizeForModel(
    prompt: BaseMessage[],
    model: AIModel,
    targetTokens?: number
  ): Promise<BaseMessage[]> {
    const formatter = this.getFormatter(model)
    const modelLimits = formatter.getModelLimits()
    const maxTokens = targetTokens || modelLimits.maxTokens

    // 计算当前token使用量
    const currentTokens = tokenCounter.calculateMessagesTokens(prompt, model)

    if (currentTokens.total <= maxTokens) {
      return formatter.combineMessages(prompt)
    }

    // 需要优化长度
    const optimizedPrompt = await this.applyLengthAdjustment(
      prompt,
      maxTokens,
      model,
      this.config.lengthAdjustment
    )

    return formatter.combineMessages(optimizedPrompt)
  }

  /**
   * 计算token使用情况
   */
  calculateTokenUsage(prompt: BaseMessage[], model: AIModel): TokenCalculationResult {
    return tokenCounter.calculateMessagesTokens(prompt, model)
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.injectionCache.clear()
    tokenCounter.clearCache()
  }

  // 私有方法

  /**
   * 初始化格式化器
   */
  private initializeFormatters(): void {
    this.formatters = new Map([
      ['openai', new OpenAIFormatter('openai')],
      ['grok', new OpenAIFormatter('grok')],
      ['deepseek', new OpenAIFormatter('deepseek')],
      ['claude', new ClaudeFormatter()],
      ['gemini', new GeminiFormatter()]
    ])
  }

  /**
   * 初始化性能指标
   */
  private initializeMetrics(): void {
    this.performanceMetrics = {
      totalInjections: 0,
      averageInjectionTime: 0,
      cacheHitRate: 0,
      tokenCalculationTime: 0,
      worldInfoMatchTime: 0,
      formatTime: 0,
      memoryUsage: 0
    }
  }

  /**
   * 获取世界信息
   */
  private async getWorldInfo(context: PromptContext): Promise<WorldInfoItem[]> {
    if (!context.scenarioId) {
      return []
    }

    try {
      // 构建匹配上下文
      const matchContext = context.messages
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .join(' ')

      // 使用世界信息匹配器
      const matchResults = await worldInfoMatcher.findActiveEntries(
        context.scenarioId,
        matchContext,
        1 // depth
      )

      // 转换为WorldInfoItem格式
      return matchResults.map(result => ({
        id: result.entry.id,
        title: result.entry.title,
        content: result.entry.content,
        priority: result.priority,
        insertPosition: result.insertPosition,
        tokens: estimateTokens(result.entry.content, context.settings.model)
      }))

    } catch (error) {
      console.error('获取世界信息失败:', error)
      return []
    }
  }

  /**
   * 计算token预算
   */
  private calculateTokenBudget(context: PromptContext, config: InjectionConfig): TokenBudget {
    const baseModel = context.settings.model
    const formatter = this.getFormatter(baseModel)
    const modelLimits = formatter.getModelLimits()

    // 基于模型限制调整预算
    const scaleFactor = modelLimits.maxTokens / 4000 // 以4000为基准
    const scaledBudget = {
      maxTotal: Math.min(modelLimits.maxTokens * 0.8, this.config.tokenBudget.maxTotal * scaleFactor),
      reserved: this.config.tokenBudget.reserved * scaleFactor,
      worldInfoLimit: Math.min(config.maxTokens, this.config.tokenBudget.worldInfoLimit * scaleFactor),
      characterLimit: this.config.tokenBudget.characterLimit * scaleFactor,
      examplesLimit: this.config.tokenBudget.examplesLimit * scaleFactor,
      contextLimit: this.config.tokenBudget.contextLimit * scaleFactor
    }

    return scaledBudget
  }

  /**
   * 优化世界信息选择
   */
  private optimizeWorldInfo(
    worldInfo: WorldInfoItem[],
    budget: TokenBudget,
    config: InjectionConfig
  ): WorldInfoItem[] {
    if (worldInfo.length === 0) {
      return []
    }

    // 按优先级排序
    const sortedInfo = [...worldInfo].sort((a, b) => b.priority - a.priority)

    // 选择符合token预算的条目
    const selectedInfo: WorldInfoItem[] = []
    let totalTokens = 0

    for (const item of sortedInfo) {
      if (totalTokens + (item.tokens || 0) <= budget.worldInfoLimit) {
        selectedInfo.push(item)
        totalTokens += item.tokens || 0
      }

      // 限制最大条目数
      if (selectedInfo.length >= this.config.lengthAdjustment.maxWorldInfoEntries) {
        break
      }
    }

    return selectedInfo
  }

  /**
   * 构建最终prompt
   */
  private async buildFinalPrompt(
    context: PromptContext,
    worldInfo: WorldInfoItem[],
    config: InjectionConfig,
    budget: TokenBudget
  ): Promise<InjectionResult> {
    const formatter = this.getFormatter(context.settings.model)
    const messages: BaseMessage[] = []
    let warnings: string[] = []

    // 1. 添加系统消息和角色信息
    const characterMessages = this.buildCharacterMessages(context)
    messages.push(...characterMessages)

    // 2. 在指定位置注入世界信息
    const worldInfoMessages = this.buildWorldInfoMessages(worldInfo, config.position)
    messages.push(...worldInfoMessages)

    // 3. 添加对话历史
    const contextMessages = this.buildContextMessages(context, budget)
    messages.push(...contextMessages.messages)
    warnings.push(...contextMessages.warnings)

    // 4. 计算token使用量
    const tokenUsage = this.calculateFinalTokenUsage(messages, context.settings.model)

    // 5. 检查是否需要长度调整
    if (tokenUsage.total > budget.maxTotal) {
      const adjustedMessages = await this.applyLengthAdjustment(
        messages,
        budget.maxTotal,
        context.settings.model,
        this.config.lengthAdjustment
      )
      messages.splice(0, messages.length, ...adjustedMessages)
      warnings.push('Prompt已自动调整长度以符合token限制')
    }

    // 6. 应用模型特定格式化
    const finalPrompt = formatter.combineMessages(messages)
    const finalTokenUsage = this.calculateFinalTokenUsage(finalPrompt, context.settings.model)

    return {
      success: true,
      finalPrompt,
      injectedItems: worldInfo,
      tokenUsage: {
        total: finalTokenUsage.total,
        character: finalTokenUsage.breakdown.character,
        worldInfo: finalTokenUsage.breakdown.worldInfo,
        examples: finalTokenUsage.breakdown.examples,
        context: finalTokenUsage.breakdown.context,
        available: budget.maxTotal - finalTokenUsage.total
      },
      performance: { injectionTime: 0, tokenCalculationTime: 0, totalTime: 0 },
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  /**
   * 构建角色消息
   */
  private buildCharacterMessages(context: PromptContext): BaseMessage[] {
    const formatter = this.getFormatter(context.settings.model)
    const messages: BaseMessage[] = []

    // 基础系统提示
    const systemPrompt = this.buildSystemPrompt(context)
    if (systemPrompt) {
      messages.push(formatter.formatSystemMessage(systemPrompt, { type: 'character' }))
    }

    return messages
  }

  /**
   * 构建系统提示
   */
  private buildSystemPrompt(context: PromptContext): string {
    const parts: string[] = []

    // 基础系统提示
    parts.push('你是一个智能AI助手，请根据以下设定进行对话。')

    // 角色特定信息（如果有）
    if (context.characterId) {
      parts.push('请严格按照角色设定进行对话，保持角色的一致性。')
    }

    // 对话指导
    parts.push('请提供有用、准确、友好的回复。')

    return parts.join('\n\n')
  }

  /**
   * 构建世界信息消息
   */
  private buildWorldInfoMessages(worldInfo: WorldInfoItem[], position: InjectionPosition): BaseMessage[] {
    if (worldInfo.length === 0) {
      return []
    }

    const formatter = this.getFormatter('grok') // 使用默认格式化器
    const messages: BaseMessage[] = []

    // 将世界信息按优先级分组
    const sortedInfo = worldInfo.sort((a, b) => b.priority - a.priority)

    // 构建世界信息内容
    const worldInfoContent = sortedInfo
      .map(item => `${item.title}:\n${item.content}`)
      .join('\n\n')

    const finalContent = `世界设定信息：\n\n${worldInfoContent}\n\n请根据以上世界设定信息进行对话。`

    messages.push(formatter.formatSystemMessage(finalContent, { type: 'worldInfo' }))

    return messages
  }

  /**
   * 构建上下文消息
   */
  private buildContextMessages(
    context: PromptContext,
    budget: TokenBudget
  ): { messages: BaseMessage[]; warnings: string[] } {
    const warnings: string[] = []
    const contextMessages = context.messages.filter(msg =>
      msg.role === 'user' || msg.role === 'assistant'
    )

    // 计算可用的上下文token
    let availableTokens = budget.contextLimit
    const selectedMessages: BaseMessage[] = []

    // 从最新消息开始选择，确保保留最近的对话
    for (let i = contextMessages.length - 1; i >= 0; i--) {
      const message = contextMessages[i]
      const tokens = estimateTokens(message.content, context.settings.model)

      if (tokens <= availableTokens) {
        selectedMessages.unshift(message)
        availableTokens -= tokens
      } else {
        warnings.push(`由于token限制，部分较早的对话记录被省略`)
        break
      }

      // 确保保留最少消息数
      if (selectedMessages.length >= this.config.lengthAdjustment.minContextMessages * 2) {
        // 保留用户和助手的对话对
        if (availableTokens < 100) break // 留一些buffer
      }
    }

    return { messages: selectedMessages, warnings }
  }

  /**
   * 应用长度调整
   */
  private async applyLengthAdjustment(
    messages: BaseMessage[],
    maxTokens: number,
    model: AIModel,
    config: LengthAdjustmentConfig
  ): Promise<BaseMessage[]> {
    if (!config.enabled) {
      return messages
    }

    const currentTokens = tokenCounter.calculateMessagesTokens(messages, model)

    if (currentTokens.total <= maxTokens) {
      return messages
    }

    switch (config.strategy) {
      case 'truncate':
        return this.truncateMessages(messages, maxTokens, model)
      case 'prioritize':
        return this.prioritizeMessages(messages, maxTokens, model)
      case 'summarize':
        return this.summarizeMessages(messages, maxTokens, model, config.summaryPrompt)
      default:
        return this.truncateMessages(messages, maxTokens, model)
    }
  }

  /**
   * 截断消息
   */
  private truncateMessages(messages: BaseMessage[], maxTokens: number, model: AIModel): BaseMessage[] {
    const result: BaseMessage[] = []
    let currentTokens = 0

    // 优先保留系统消息和最新的用户消息
    for (const message of messages.reverse()) {
      const tokens = estimateTokens(message.content, model)
      if (currentTokens + tokens <= maxTokens) {
        result.unshift(message)
        currentTokens += tokens
      }
    }

    return result
  }

  /**
   * 优先级消息选择
   */
  private prioritizeMessages(messages: BaseMessage[], maxTokens: number, model: AIModel): BaseMessage[] {
    // 按优先级排序：system > worldInfo > character > recent user/assistant
    const prioritized = [...messages].sort((a, b) => {
      const priorityA = this.getMessagePriority(a)
      const priorityB = this.getMessagePriority(b)
      return priorityB - priorityA
    })

    const result: BaseMessage[] = []
    let currentTokens = 0

    for (const message of prioritized) {
      const tokens = estimateTokens(message.content, model)
      if (currentTokens + tokens <= maxTokens) {
        result.push(message)
        currentTokens += tokens
      }
    }

    // 恢复原始顺序（保持system消息在前）
    return this.restoreMessageOrder(result, messages)
  }

  /**
   * 获取消息优先级
   */
  private getMessagePriority(message: BaseMessage): number {
    if (message.role === 'system') {
      if (message.metadata?.type === 'character') return 100
      if (message.metadata?.type === 'worldInfo') return 90
      return 95
    }
    if (message.role === 'user') return 70
    if (message.role === 'assistant') return 60
    return 50
  }

  /**
   * 恢复消息顺序
   */
  private restoreMessageOrder(selected: BaseMessage[], original: BaseMessage[]): BaseMessage[] {
    const result: BaseMessage[] = []

    for (const originalMsg of original) {
      const found = selected.find(msg =>
        msg.role === originalMsg.role &&
        msg.content === originalMsg.content
      )
      if (found) {
        result.push(found)
      }
    }

    return result
  }

  /**
   * 摘要消息（简化实现）
   */
  private async summarizeMessages(
    messages: BaseMessage[],
    maxTokens: number,
    model: AIModel,
    summaryPrompt?: string
  ): Promise<BaseMessage[]> {
    // 简化实现：直接截断，实际项目中应该调用AI进行摘要
    return this.truncateMessages(messages, maxTokens, model)
  }

  /**
   * 计算最终token使用量
   */
  private calculateFinalTokenUsage(messages: BaseMessage[], model: AIModel) {
    return tokenCounter.calculateMessagesTokens(messages, model)
  }

  /**
   * 获取格式化器
   */
  private getFormatter(model: AIModel): BaseModelFormatter {
    const formatter = this.formatters.get(model)
    if (!formatter) {
      throw new PromptInjectionError(
        `不支持的模型: ${model}`,
        'UNSUPPORTED_MODEL',
        { model }
      )
    }
    return formatter
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(context: PromptContext, config: InjectionConfig): string {
    const key = JSON.stringify({
      scenarioId: context.scenarioId,
      characterId: context.characterId,
      messageCount: context.messages.length,
      lastMessage: context.messages[context.messages.length - 1]?.content?.substring(0, 100),
      model: context.settings.model,
      position: config.position,
      maxTokens: config.maxTokens
    })

    if (this.config.cache.keyStrategy === 'hash') {
      return this.simpleHash(key)
    }
    return key
  }

  /**
   * 简单hash函数
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  /**
   * 从缓存获取
   */
  private getFromCache(key: string): InjectionResult | null {
    if (!this.config.cache.enabled) return null

    const item = this.injectionCache.get(key)
    if (!item) return null

    // 简化的TTL检查（实际应该使用timestamp）
    return item
  }

  /**
   * 设置缓存
   */
  private setCache(key: string, result: InjectionResult): void {
    if (!this.config.cache.enabled) return

    if (this.injectionCache.size >= this.config.cache.maxSize) {
      const firstKey = this.injectionCache.keys().next().value
      this.injectionCache.delete(firstKey)
    }

    this.injectionCache.set(key, result)
  }

  /**
   * 获取空token使用量
   */
  private getEmptyTokenUsage() {
    return {
      total: 0,
      character: 0,
      worldInfo: 0,
      examples: 0,
      context: 0,
      available: 0
    }
  }

  /**
   * 更新性能指标
   */
  private updateMetrics(type: 'injection' | 'cache_hit', duration: number): void {
    if (!this.config.enableMetrics) return

    this.performanceMetrics.totalInjections++
    this.performanceMetrics.averageInjectionTime =
      (this.performanceMetrics.averageInjectionTime + duration) / 2
  }
}

// 导出单例实例
export const promptInjector = new PromptInjector()

// 导出工具函数
export async function injectWorldInfoToPrompt(
  context: PromptContext,
  config?: Partial<InjectionConfig>
): Promise<InjectionResult> {
  return promptInjector.injectWorldInfo(context, config)
}

export function optimizePromptForModel(
  prompt: BaseMessage[],
  model: AIModel,
  targetTokens?: number
): Promise<BaseMessage[]> {
  return promptInjector.optimizeForModel(prompt, model, targetTokens)
}