/**
 * 日期时间工具函数
 */

/**
 * 格式化时间戳为可读的时间字符串
 */
export const formatTime = (timestamp: string | number | Date): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚'
  }

  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return `${minutes}分钟前`
  }

  // 小于1天
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours}小时前`
  }

  // 小于7天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    return `${days}天前`
  }

  // 超过7天，显示具体日期
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  // 如果是今年，不显示年份
  if (year === now.getFullYear()) {
    return `${month}-${day}`
  }

  return `${year}-${month}-${day}`
}

/**
 * 格式化为具体的日期时间字符串
 */
export const formatDateTime = (timestamp: string | number | Date): string => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * 格式化为时间字符串 (HH:MM)
 */
export const formatTimeOnly = (timestamp: string | number | Date): string => {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${hours}:${minutes}`
}

/**
 * 格式化为日期字符串 (YYYY-MM-DD)
 */
export const formatDateOnly = (timestamp: string | number | Date): string => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * 判断是否为今天
 */
export const isToday = (timestamp: string | number | Date): boolean => {
  const date = new Date(timestamp)
  const today = new Date()

  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate()
}

/**
 * 判断是否为昨天
 */
export const isYesterday = (timestamp: string | number | Date): boolean => {
  const date = new Date(timestamp)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  return date.getFullYear() === yesterday.getFullYear() &&
         date.getMonth() === yesterday.getMonth() &&
         date.getDate() === yesterday.getDate()
}

/**
 * 获取相对时间描述
 */
export const getRelativeTime = (timestamp: string | number | Date): string => {
  if (isToday(timestamp)) {
    return `今天 ${formatTimeOnly(timestamp)}`
  }

  if (isYesterday(timestamp)) {
    return `昨天 ${formatTimeOnly(timestamp)}`
  }

  return formatDateTime(timestamp)
}
