import { computed } from 'vue'

export interface DateFormatOptions {
  format?: 'auto' | 'relative' | 'absolute' | 'time' | 'date'
  showSeconds?: boolean
  maxRelativeDays?: number
  fallbackText?: string
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
export function useChatDateFormatter(options: DateFormatOptions = {}) {
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
    input: any
  ) => {
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

  /**
   * 格式化持续时间
   */
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}天${hours % 24}小时`
    } else if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`
    } else {
      return `${seconds}秒`
    }
  }

  /**
   * 格式化日期范围
   */
  const formatDateRange = (startDate: string | number | Date, endDate: string | number | Date): string => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    // 如果是同一天
    if (isSameDay(start, end)) {
      return formatDate(start)
    }

    // 如果是同一年
    if (isSameYear(start, end)) {
      return `${formatDate(start)} - ${formatDate(end)}`
    }

    // 跨年
    return `${formatDate(start, { dateStyle: 'short' })} - ${formatDate(end, { dateStyle: 'short' })}`
  }

  /**
   * 格式化简短时间
   */
  const formatShortTime = (date: Date | string | number): string => {
    const dateObj = new Date(date)
    const hours = dateObj.getHours().toString().padStart(2, '0')
    const minutes = dateObj.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  /**
   * 格式化聊天时间戳
   */
  const formatChatTimestamp = (date: Date | string | number): string => {
    const dateObj = new Date(date)

    // 今天
    if (isToday(dateObj)) {
      return formatShortTime(dateObj)
    }

    // 昨天
    if (isYesterday(dateObj)) {
      return `昨天 ${formatShortTime(dateObj)}`
    }

    // 本周
    if (isThisWeek(dateObj)) {
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return `${weekDays[dateObj.getDay()]} ${formatShortTime(dateObj)}`
    }

    // 更早
    return formatDate(dateObj)
  }

  /**
   * 获取友好的日期字符串
   */
  const getFriendlyDateString = (date: Date | string | number): string => {
    const dateObj = new Date(date)

    if (isToday(dateObj)) {
      return '今天'
    } else if (isYesterday(dateObj)) {
      return '昨天'
    } else if (isThisWeek(dateObj)) {
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return weekDays[dateObj.getDay()]
    } else {
      return formatDate(dateObj)
    }
  }

  // 辅助函数：判断是否为同一天
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  // 辅助函数：判断是否为同一年
  const isSameYear = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear()
  }

  // 辅助函数：判断是否为本周
  const isThisWeek = (date: Date): boolean => {
    const dateObj = new Date(date)
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6))
    return dateObj >= startOfWeek && dateObj <= endOfWeek
  }

  return {
    // 主要格式化方法
    formatDateTime,
    formatReactiveDateTime,
    isValidDate,
    getRelativeTime,
    getAbsoluteTime,

    // 聊天相关格式化
    formatChatTimestamp,
    getFriendlyDateString,

    // 其他格式化
    formatDuration,
    formatDateRange,
    formatShortTime,

    // 时间判断方法
    isToday,
    isYesterday,

    // 便捷方法
    formatTime: (input: string | number | Date | null | undefined) =>
      formatDate(input, { ...options, format: 'time' }),
    formatDate: (input: string | number | Date | null | undefined) =>
      formatDate(input, { ...options, format: 'date' }),
  }
}