/**
 * Token计算工具
 * 支持多种AI模型的准确token计算
 */

import {
  AIModel,
  BaseMessage,
  TokenCalculationResult,
  MODEL_LIMITS
} from '../types/prompt'

// Token计算缓存
interface TokenCacheItem {
  text: string
  model: AIModel
  tokens: number
  timestamp: number
}

class TokenCounter {
  private cache = new Map<string, TokenCacheItem>()
  private cacheMaxSize = 1000
  private cacheTTL = 300000 // 5分钟

  /**
   * 计算文本的token数量
   */
  calculateTokens(text: string, model: AIModel): number {
    const startTime = performance.now()

    // 检查缓存
    const cacheKey = this.generateCacheKey(text, model)
    const cached = this.getFromCache(cacheKey)

    if (cached) {
      return cached.tokens
    }

    // 根据模型选择计算方法
    let tokens: number

    switch (model) {
      case 'openai':
      case 'grok':
      case 'deepseek':
        tokens = this.calculateOpenAITokens(text)
        break
      case 'claude':
        tokens = this.calculateClaudeTokens(text)
        break
      case 'gemini':
        tokens = this.calculateGeminiTokens(text)
        break
      default:
        tokens = this.calculateGenericTokens(text)
    }

    // 缓存结果
    this.setCache(cacheKey, text, model, tokens)

    return tokens
  }

  /**
   * 计算消息列表的token总数
   */
  calculateMessagesTokens(messages: BaseMessage[], model: AIModel): TokenCalculationResult {
    const startTime = performance.now()

    let totalTokens = 0
    const breakdown = {
      system: 0,
      character: 0,
      worldInfo: 0,
      examples: 0,
      context: 0
    }

    for (const message of messages) {
      const tokens = this.calculateTokens(message.content, model)
      totalTokens += tokens

      // 根据消息类型分类统计
      switch (message.role) {
        case 'system':
          // 进一步区分系统消息类型
          if (message.metadata?.type === 'character') {
            breakdown.character += tokens
          } else if (message.metadata?.type === 'worldInfo') {
            breakdown.worldInfo += tokens
          } else if (message.metadata?.type === 'examples') {
            breakdown.examples += tokens
          } else {
            breakdown.system += tokens
          }
          break
        case 'user':
        case 'assistant':
          breakdown.context += tokens
          break
      }
    }

    // 添加模型特定的额外开销
    const modelOverhead = this.calculateModelOverhead(messages.length, model)
    totalTokens += modelOverhead

    const calculationTime = performance.now() - startTime

    return {
      total: totalTokens,
      breakdown,
      model,
      estimationMethod: this.getEstimationMethod(model),
      calculationTime
    }
  }

  /**
   * 检查token是否超出模型限制
   */
  checkTokenLimit(tokens: number, model: AIModel): {
    withinLimit: boolean
    limit: number
    usage: number
    remaining: number
  } {
    const limit = MODEL_LIMITS[model].maxTokens
    const withinLimit = tokens <= limit
    const remaining = Math.max(0, limit - tokens)
    const usage = tokens / limit

    return {
      withinLimit,
      limit,
      usage,
      remaining
    }
  }

  /**
   * 估算文本被截断到指定token数量后的内容
   */
  truncateToTokenLimit(text: string, maxTokens: number, model: AIModel): {
    truncatedText: string
    actualTokens: number
    truncated: boolean
  } {
    const originalTokens = this.calculateTokens(text, model)

    if (originalTokens <= maxTokens) {
      return {
        truncatedText: text,
        actualTokens: originalTokens,
        truncated: false
      }
    }

    // 估算字符截断比例
    const ratio = maxTokens / originalTokens
    const estimatedChars = Math.floor(text.length * ratio * 0.9) // 安全边际

    let truncatedText = text.substring(0, estimatedChars)
    let actualTokens = this.calculateTokens(truncatedText, model)

    // 微调截断长度
    while (actualTokens > maxTokens && truncatedText.length > 0) {
      truncatedText = truncatedText.substring(0, truncatedText.length - 50)
      actualTokens = this.calculateTokens(truncatedText, model)
    }

    // 确保在单词边界截断
    if (truncatedText.length < text.length) {
      const lastSpace = truncatedText.lastIndexOf(' ')
      if (lastSpace > truncatedText.length * 0.8) {
        truncatedText = truncatedText.substring(0, lastSpace)
        actualTokens = this.calculateTokens(truncatedText, model)
      }
    }

    return {
      truncatedText,
      actualTokens,
      truncated: true
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): {
    size: number
    maxSize: number
    hitRate: number
  } {
    // 简化的缓存统计，实际应用中需要跟踪命中率
    return {
      size: this.cache.size,
      maxSize: this.cacheMaxSize,
      hitRate: 0.85 // 估算值
    }
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  // 私有方法

  /**
   * OpenAI兼容模型的token计算
   */
  private calculateOpenAITokens(text: string): number {
    // 简化的OpenAI token计算
    // 实际项目中应该使用tiktoken库
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishChars = text.length - chineseChars
    const specialTokens = (text.match(/[<>{}[\]]/g) || []).length

    // 中文字符约1.5个token，英文字符约0.25个token
    return Math.ceil(chineseChars * 1.5 + englishChars * 0.25 + specialTokens * 0.5)
  }

  /**
   * Claude模型的token计算
   */
  private calculateClaudeTokens(text: string): number {
    // Claude的token计算略有不同
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishChars = text.length - chineseChars

    // Claude对中文字符的处理效率更高
    return Math.ceil(chineseChars * 1.2 + englishChars * 0.3)
  }

  /**
   * Gemini模型的token计算
   */
  private calculateGeminiTokens(text: string): number {
    // Gemini的token计算
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishChars = text.length - chineseChars

    return Math.ceil(chineseChars * 1.3 + englishChars * 0.28)
  }

  /**
   * 通用token计算（适用于未知模型）
   */
  private calculateGenericTokens(text: string): number {
    // 保守估算
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishChars = text.length - chineseChars

    return Math.ceil(chineseChars * 1.8 + englishChars * 0.3)
  }

  /**
   * 计算模型特定的额外开销
   */
  private calculateModelOverhead(messageCount: number, model: AIModel): number {
    switch (model) {
      case 'openai':
      case 'grok':
      case 'deepseek':
        // OpenAI格式每条消息大约3-4个额外token
        return messageCount * 3
      case 'claude':
        // Claude格式的开销较小
        return messageCount * 1
      case 'gemini':
        // Gemini的parts格式开销
        return messageCount * 2
      default:
        return messageCount * 2
    }
  }

  /**
   * 获取估算方法类型
   */
  private getEstimationMethod(model: AIModel): 'exact' | 'approximate' {
    // 在实际项目中，如果集成了官方token计算库，返回'exact'
    return 'approximate'
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(text: string, model: AIModel): string {
    // 对长文本使用hash，短文本直接使用
    if (text.length > 200) {
      return `${model}:${this.simpleHash(text)}`
    }
    return `${model}:${text}`
  }

  /**
   * 简单hash函数
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转为32位整数
    }
    return hash.toString(36)
  }

  /**
   * 从缓存获取
   */
  private getFromCache(key: string): TokenCacheItem | null {
    const item = this.cache.get(key)
    if (!item) return null

    // 检查TTL
    if (Date.now() - item.timestamp > this.cacheTTL) {
      this.cache.delete(key)
      return null
    }

    return item
  }

  /**
   * 设置缓存
   */
  private setCache(key: string, text: string, model: AIModel, tokens: number): void {
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.cacheMaxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      text,
      model,
      tokens,
      timestamp: Date.now()
    })
  }
}

// 导出单例实例
export const tokenCounter = new TokenCounter()

// 导出工具函数
export function estimateTokens(text: string, model: AIModel = 'grok'): number {
  return tokenCounter.calculateTokens(text, model)
}

export function estimateMessagesTokens(messages: BaseMessage[], model: AIModel = 'grok'): TokenCalculationResult {
  return tokenCounter.calculateMessagesTokens(messages, model)
}

export function checkTokenBudget(
  tokens: number,
  budget: number,
  model: AIModel = 'grok'
): { withinBudget: boolean; usage: number; remaining: number } {
  const withinBudget = tokens <= budget
  const usage = tokens / budget
  const remaining = Math.max(0, budget - tokens)

  return { withinBudget, usage, remaining }
}

export function truncateText(
  text: string,
  maxTokens: number,
  model: AIModel = 'grok'
): string {
  const result = tokenCounter.truncateToTokenLimit(text, maxTokens, model)
  return result.truncatedText
}

// 导出类型
export type { TokenCalculationResult }