/**
 * 安全条件评估器
 * 用于评估功能解锁条件，支持复杂的逻辑表达式
 */

import type { UserExperience } from './featureManifest'

export interface EvaluationContext {
  sessions: number
  messages: number
  characters: number
  features: number
  expertFeatures: number
  skillLevel: string
  daysSinceFirstUse: number
  lastActiveDate: Date
  featuresUsed: string[]
  expertFeaturesUsed: string[]
}

export interface ConditionEvaluationResult {
  result: boolean
  details: string
  evaluatedAt: Date
  context: EvaluationContext
}

/**
 * 支持的操作符
 */
const OPERATORS = {
  '>=': (a: number, b: number) => a >= b,
  '<=': (a: number, b: number) => a <= b,
  '>': (a: number, b: number) => a > b,
  '<': (a: number, b: number) => a < b,
  '==': (a: any, b: any) => a === b,
  '!=': (a: any, b: any) => a !== b,
  '===': (a: any, b: any) => a === b,
  '!==': (a: any, b: any) => a !== b
} as const

/**
 * 支持的技能等级映射
 */
const SKILL_LEVEL_MAP = {
  'beginner': 1,
  'intermediate': 2,
  'advanced': 3,
  'expert': 4
} as const

/**
 * 从用户体验数据创建评估上下文
 */
export function createEvaluationContext(userExperience: UserExperience): EvaluationContext {
  const now = new Date()
  const firstUseDate = userExperience.lastActiveDate || now
  const daysSinceFirstUse = Math.floor((now.getTime() - firstUseDate.getTime()) / (1000 * 60 * 60 * 24))

  return {
    sessions: userExperience.totalSessions || 0,
    messages: userExperience.messagesCount || 0,
    characters: userExperience.charactersUsed || 0,
    features: userExperience.featuresUsed?.length || 0,
    expertFeatures: userExperience.expertFeaturesUsed?.length || 0,
    skillLevel: userExperience.skillLevel || 'beginner',
    daysSinceFirstUse,
    lastActiveDate: userExperience.lastActiveDate || now,
    featuresUsed: userExperience.featuresUsed || [],
    expertFeaturesUsed: userExperience.expertFeaturesUsed || []
  }
}

/**
 * 安全的条件评估器
 * 支持复杂的逻辑表达式和多种数据类型
 */
export function evaluateCondition(
  condition: string,
  context: EvaluationContext
): ConditionEvaluationResult {
  const startTime = new Date()

  try {
    const result = evaluateExpression(condition.trim(), context)

    return {
      result,
      details: `条件 "${condition}" 评估结果: ${result}`,
      evaluatedAt: startTime,
      context
    }
  } catch (error) {
    console.error('条件评估失败:', error)
    return {
      result: false,
      details: `条件评估错误: ${error instanceof Error ? error.message : '未知错误'}`,
      evaluatedAt: startTime,
      context
    }
  }
}

/**
 * 评估单个表达式
 */
function evaluateExpression(expression: string, context: EvaluationContext): boolean {
  // 处理括号分组
  if (expression.includes('(')) {
    return evaluateGroupedExpression(expression, context)
  }

  // 处理逻辑操作符
  if (expression.includes('&&')) {
    return evaluateAndExpression(expression, context)
  }

  if (expression.includes('||')) {
    return evaluateOrExpression(expression, context)
  }

  // 处理单个比较表达式
  return evaluateComparison(expression, context)
}

/**
 * 处理带括号的分组表达式
 */
function evaluateGroupedExpression(expression: string, context: EvaluationContext): boolean {
  // 简单的括号处理 - 找到最内层括号并递归评估
  const regex = /\([^()]+\)/
  let current = expression

  while (regex.test(current)) {
    current = current.replace(regex, (match) => {
      const inner = match.slice(1, -1) // 移除括号
      const result = evaluateExpression(inner, context)
      return result.toString()
    })
  }

  // 如果还有逻辑操作符，继续评估
  if (current.includes('&&') || current.includes('||')) {
    // 替换 true/false 字符串为实际布尔值
    current = current.replace(/\btrue\b/g, '1').replace(/\bfalse\b/g, '0')
    return evaluateExpression(current, context)
  }

  // 如果结果是 true/false 字符串，转换为布尔值
  if (current === 'true') return true
  if (current === 'false') return false

  // 否则作为比较表达式处理
  return evaluateComparison(current, context)
}

/**
 * 处理 AND 逻辑操作
 */
function evaluateAndExpression(expression: string, context: EvaluationContext): boolean {
  const parts = expression.split('&&').map(part => part.trim())
  return parts.every(part => evaluateExpression(part, context))
}

/**
 * 处理 OR 逻辑操作
 */
function evaluateOrExpression(expression: string, context: EvaluationContext): boolean {
  const parts = expression.split('||').map(part => part.trim())
  return parts.some(part => evaluateExpression(part, context))
}

/**
 * 处理比较表达式
 */
function evaluateComparison(expression: string, context: EvaluationContext): boolean {
  // 按操作符长度排序，优先匹配长操作符
  const operators = Object.keys(OPERATORS).sort((a, b) => b.length - a.length)

  for (const op of operators) {
    if (expression.includes(op)) {
      const [leftStr, rightStr] = expression.split(op, 2).map(s => s.trim())

      const leftValue = resolveValue(leftStr, context)
      const rightValue = resolveValue(rightStr, context)

      const operatorFn = OPERATORS[op as keyof typeof OPERATORS]
      return operatorFn(leftValue, rightValue)
    }
  }

  // 如果没有操作符，检查是否是单个布尔值或变量
  const value = resolveValue(expression, context)
  return Boolean(value)
}

/**
 * 解析值（变量、字符串、数字）
 */
function resolveValue(valueStr: string, context: EvaluationContext): any {
  const trimmed = valueStr.trim()

  // 布尔值
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false

  // 字符串字面量
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }

  // 数字
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed)
  }

  // 上下文变量
  if (trimmed in context) {
    const value = context[trimmed as keyof EvaluationContext]

    // 特殊处理技能等级
    if (trimmed === 'skillLevel' && typeof value === 'string') {
      return SKILL_LEVEL_MAP[value as keyof typeof SKILL_LEVEL_MAP] || 1
    }

    return value
  }

  // 特殊函数调用
  if (trimmed.startsWith('hasFeature(')) {
    return evaluateHasFeatureFunction(trimmed, context)
  }

  if (trimmed.startsWith('daysSince(')) {
    return evaluateDaysSinceFunction(trimmed, context)
  }

  // 如果无法解析，抛出错误
  throw new Error(`无法解析值: ${trimmed}`)
}

/**
 * 评估 hasFeature 函数
 * 例: hasFeature('character-creation')
 */
function evaluateHasFeatureFunction(expression: string, context: EvaluationContext): boolean {
  const match = expression.match(/hasFeature\(['"]([^'"]+)['"]\)/)
  if (!match) {
    throw new Error(`无效的 hasFeature 函数调用: ${expression}`)
  }

  const featureId = match[1]
  return context.featuresUsed.includes(featureId) || context.expertFeaturesUsed.includes(featureId)
}

/**
 * 评估 daysSince 函数
 * 例: daysSince('2024-01-01') >= 7
 */
function evaluateDaysSinceFunction(expression: string, context: EvaluationContext): number {
  const match = expression.match(/daysSince\(['"]([^'"]+)['"]\)/)
  if (!match) {
    throw new Error(`无效的 daysSince 函数调用: ${expression}`)
  }

  const dateStr = match[1]
  const targetDate = new Date(dateStr)
  if (isNaN(targetDate.getTime())) {
    throw new Error(`无效的日期格式: ${dateStr}`)
  }

  const now = new Date()
  return Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * 批量评估条件
 */
export function evaluateMultipleConditions(
  conditions: string[],
  context: EvaluationContext
): Record<string, ConditionEvaluationResult> {
  const results: Record<string, ConditionEvaluationResult> = {}

  conditions.forEach((condition, index) => {
    const key = `condition_${index}`
    results[key] = evaluateCondition(condition, context)
  })

  return results
}

/**
 * 预定义的常用条件模板
 */
export const CONDITION_TEMPLATES = {
  // 新手用户
  IS_BEGINNER: 'sessions < 5 && messages < 50',

  // 活跃用户
  IS_ACTIVE: 'sessions >= 10 && messages >= 100',

  // 专家用户
  IS_EXPERT: 'skillLevel >= "advanced" && expertFeatures >= 3',

  // 长期用户
  IS_VETERAN: 'daysSinceFirstUse >= 30 && sessions >= 20',

  // 创作者
  IS_CREATOR: 'characters >= 3 && hasFeature("character-creation-basic")',

  // 高级对话用户
  IS_CHAT_EXPERT: 'messages >= 500 && hasFeature("chat-message-editing")'
} as const

/**
 * 使用模板评估条件
 */
export function evaluateTemplate(
  templateName: keyof typeof CONDITION_TEMPLATES,
  context: EvaluationContext
): ConditionEvaluationResult {
  const condition = CONDITION_TEMPLATES[templateName]
  return evaluateCondition(condition, context)
}

/**
 * 验证条件语法
 */
export function validateConditionSyntax(condition: string): {
  isValid: boolean
  error?: string
} {
  try {
    // 创建一个测试上下文
    const testContext: EvaluationContext = {
      sessions: 1,
      messages: 1,
      characters: 1,
      features: 1,
      expertFeatures: 1,
      skillLevel: 'beginner',
      daysSinceFirstUse: 1,
      lastActiveDate: new Date(),
      featuresUsed: [],
      expertFeaturesUsed: []
    }

    // 尝试评估条件
    evaluateCondition(condition, testContext)
    return { isValid: true }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : '未知语法错误'
    }
  }
}

/**
 * 获取条件中引用的变量
 */
export function extractVariables(condition: string): string[] {
  const variables = new Set<string>()
  const contextKeys = [
    'sessions', 'messages', 'characters', 'features', 'expertFeatures',
    'skillLevel', 'daysSinceFirstUse'
  ]

  contextKeys.forEach(key => {
    if (condition.includes(key)) {
      variables.add(key)
    }
  })

  // 提取 hasFeature 函数中的特征ID
  const featureMatches = condition.match(/hasFeature\(['"]([^'"]+)['"]\)/g)
  if (featureMatches) {
    featureMatches.forEach(match => {
      const featureId = match.match(/hasFeature\(['"]([^'"]+)['"]\)/)?.[1]
      if (featureId) {
        variables.add(`hasFeature(${featureId})`)
      }
    })
  }

  return Array.from(variables)
}