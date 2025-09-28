import { computed, type ComputedRef } from 'vue'

/**
 * 增强的时间格式化组合式函数
 * 提供健壮的错误处理和多种格式化选项
 */

export interface DateFormatOptions {
  /**
   * 格式化类型
   * - 'auto': 自动选择合适的格式（相对时间 vs 绝对时间）
   * - 'relative': 相对时间（如"5分钟前"）
   * - 'absolute': 绝对时间（如"2024-01-01 15:30"）
   * - 'time': 仅时间（如"15:30"）
   * - 'date': 仅日期（如"2024-01-01"）
   */
  format?: 'auto' | 'relative' | 'absolute' | 'time' | 'date'

  /**
   * 是否显示秒数（仅对time格式有效）
   */
  showSeconds?: boolean

  /**
   * 相对时间的最大范围（天数），超过后显示绝对时间
   */
  maxRelativeDays?: number

  /**
   * 无效日期时的回退文本
   */
  fallbackText?: string

  /**
   * 是否使用12小时制
   */
  use12HourFormat?: boolean
}

const DEFAULT_OPTIONS: Required<DateFormatOptions> = {
  format: 'auto',
  showSeconds: false,
  maxRelativeDays: 7,
  fallbackText: '未知时间',
  use12HourFormat: false
}

/**
 * 安全地解析日期，处理各种输入格式
 */
const parseDate = (input: string | number | Date | null | undefined): Date | null => {
  if (!input) return null

  try {
    const date = new Date(input)

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return null
    }

    // 检查日期是否在合理范围内（1970-2100）
    const year = date.getFullYear()
    if (year < 1970 || year > 2100) {
      return null
    }

    return date
  } catch {
    return null
  }
}

/**
 * 格式化相对时间
 */
const formatRelativeTime = (date: Date, now: Date = new Date()): string => {
  const diff = now.getTime() - date.getTime()

  // 未来时间
  if (diff < 0) {
    const futureDiff = Math.abs(diff)
    if (futureDiff < 60 * 1000) return '即将'
    if (futureDiff < 60 * 60 * 1000) {
      const minutes = Math.floor(futureDiff / (60 * 1000))
      return `${minutes}分钟后`
    }
    if (futureDiff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(futureDiff / (60 * 60 * 1000))
      return `${hours}小时后`
    }
    const days = Math.floor(futureDiff / (24 * 60 * 60 * 1000))
    return `${days}天后`
  }

  // 过去时间
  if (diff < 60 * 1000) return '刚刚'

  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return `${minutes}分钟前`
  }

  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours}小时前`
  }

  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  return `${days}天前`
}

/**
 * 格式化绝对时间
 */
const formatAbsoluteTime = (date: Date, options: Required<DateFormatOptions>): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  let ampm = ''

  if (options.use12HourFormat) {
    ampm = hours >= 12 ? ' PM' : ' AM'
    hours = hours % 12 || 12
  }

  const hoursStr = String(hours).padStart(2, '0')
  const seconds = options.showSeconds ? `:${String(date.getSeconds()).padStart(2, '0')}` : ''

  const timeStr = `${hoursStr}:${minutes}${seconds}${ampm}`

  return `${year}-${month}-${day} ${timeStr}`
}

/**
 * 格式化仅时间
 */
const formatTimeOnly = (date: Date, options: Required<DateFormatOptions>): string => {
  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  let ampm = ''

  if (options.use12HourFormat) {
    ampm = hours >= 12 ? ' PM' : ' AM'
    hours = hours % 12 || 12
  }

  const hoursStr = String(hours).padStart(2, '0')
  const seconds = options.showSeconds ? `:${String(date.getSeconds()).padStart(2, '0')}` : ''

  return `${hoursStr}:${minutes}${seconds}${ampm}`
}

/**
 * 格式化仅日期
 */
const formatDateOnly = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * 主要的格式化函数
 */
const formatDate = (
  input: string | number | Date | null | undefined,
  options: DateFormatOptions = {}
): string => {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const date = parseDate(input)

  if (!date) {
    return opts.fallbackText
  }

  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000))

  switch (opts.format) {
    case 'relative':
      return formatRelativeTime(date, now)

    case 'absolute':
      return formatAbsoluteTime(date, opts)

    case 'time':
      return formatTimeOnly(date, opts)

    case 'date':
      return formatDateOnly(date)

    case 'auto':
    default:
      // 如果在相对时间范围内，使用相对时间，否则使用绝对时间
      if (Math.abs(daysDiff) <= opts.maxRelativeDays) {
        return formatRelativeTime(date, now)
      } else {
        return formatAbsoluteTime(date, opts)
      }
  }
}

/**
 * 组合式函数：时间格式化
 */
export function useDateFormatter(options: DateFormatOptions = {}) {
  /**
   * 格式化单个日期
   */
  const formatDateTime = (input: string | number | Date | null | undefined): string => {
    return formatDate(input, options)
  }

  /**
   * 格式化响应式日期
   */
  const formatReactiveDateTime = (
    input: ComputedRef<string | number | Date | null | undefined> | string | number | Date | null | undefined
  ): ComputedRef<string> => {
    return computed(() => {
      const value = typeof input === 'function' ? input.value : input
      return formatDate(value, options)
    })
  }

  /**
   * 检查日期是否有效
   */
  const isValidDate = (input: string | number | Date | null | undefined): boolean => {
    return parseDate(input) !== null
  }

  /**
   * 获取相对时间描述（仅相对格式）
   */
  const getRelativeTime = (input: string | number | Date | null | undefined): string => {
    return formatDate(input, { ...options, format: 'relative' })
  }

  /**
   * 获取绝对时间描述（仅绝对格式）
   */
  const getAbsoluteTime = (input: string | number | Date | null | undefined): string => {
    return formatDate(input, { ...options, format: 'absolute' })
  }

  /**
   * 判断是否为今天
   */
  const isToday = (input: string | number | Date | null | undefined): boolean => {
    const date = parseDate(input)
    if (!date) return false

    const today = new Date()
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate()
  }

  /**
   * 判断是否为昨天
   */
  const isYesterday = (input: string | number | Date | null | undefined): boolean => {
    const date = parseDate(input)
    if (!date) return false

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    return date.getFullYear() === yesterday.getFullYear() &&
           date.getMonth() === yesterday.getMonth() &&
           date.getDate() === yesterday.getDate()
  }

  return {
    formatDateTime,
    formatReactiveDateTime,
    isValidDate,
    getRelativeTime,
    getAbsoluteTime,
    isToday,
    isYesterday,

    // 便捷方法
    formatTime: (input: string | number | Date | null | undefined) =>
      formatDate(input, { ...options, format: 'time' }),
    formatDate: (input: string | number | Date | null | undefined) =>
      formatDate(input, { ...options, format: 'date' }),
  }
}

/**
 * 预设配置的组合式函数
 */

/**
 * 聊天消息时间格式化（优先显示相对时间）
 */
export function useChatDateFormatter() {
  return useDateFormatter({
    format: 'auto',
    maxRelativeDays: 1, // 超过1天显示绝对时间
    fallbackText: '时间未知'
  })
}

/**
 * 列表项时间格式化（仅显示时间部分）
 */
export function useTimeOnlyFormatter() {
  return useDateFormatter({
    format: 'time',
    showSeconds: false,
    fallbackText: '--:--'
  })
}

/**
 * 日志时间格式化（始终显示完整时间）
 */
export function useLogDateFormatter() {
  return useDateFormatter({
    format: 'absolute',
    showSeconds: true,
    fallbackText: '无效时间'
  })
}
