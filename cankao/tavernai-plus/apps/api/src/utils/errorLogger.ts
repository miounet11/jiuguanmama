import fs from 'fs'
import path from 'path'
import { format } from 'date-fns'

const logsDir = path.join(process.cwd(), 'logs')

// 确保日志目录存在
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

interface ErrorLog {
  timestamp: string
  level: 'ERROR' | 'WARN' | 'INFO'
  endpoint?: string
  method?: string
  statusCode?: number
  message: string
  userId?: string
  ip?: string
  userAgent?: string
  stack?: string
}

class ErrorLogger {
  private logFile: string
  private currentDate: string

  constructor() {
    this.currentDate = format(new Date(), 'yyyy-MM-dd')
    this.logFile = path.join(logsDir, `api-errors-${this.currentDate}.log`)
  }

  private checkDateAndRotate() {
    const today = format(new Date(), 'yyyy-MM-dd')
    if (today !== this.currentDate) {
      this.currentDate = today
      this.logFile = path.join(logsDir, `api-errors-${this.currentDate}.log`)
    }
  }

  private formatLog(log: ErrorLog): string {
    const parts = [
      `[${log.timestamp}]`,
      `[${log.level}]`,
      log.endpoint ? `[${log.method} ${log.endpoint}]` : '',
      log.statusCode ? `[${log.statusCode}]` : '',
      log.userId ? `[User: ${log.userId}]` : '',
      log.message
    ].filter(Boolean)

    return parts.join(' ')
  }

  log(log: Partial<ErrorLog>) {
    this.checkDateAndRotate()

    const fullLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: log.level || 'ERROR',
      ...log
    } as ErrorLog

    const logLine = this.formatLog(fullLog) + '\n'

    // 写入文件
    fs.appendFileSync(this.logFile, logLine)

    // 在开发环境也打印到控制台
    if (process.env.NODE_ENV === 'development') {
      if (fullLog.level === 'ERROR') {
        console.error(logLine)
      } else if (fullLog.level === 'WARN') {
        console.warn(logLine)
      } else {
        console.log(logLine)
      }
    }
  }

  error(message: string, details?: any) {
    this.log({
      level: 'ERROR',
      message,
      ...details
    })
  }

  warn(message: string, details?: any) {
    this.log({
      level: 'WARN',
      message,
      ...details
    })
  }

  info(message: string, details?: any) {
    this.log({
      level: 'INFO',
      message,
      ...details
    })
  }

  // 获取最近的错误日志
  getRecentLogs(lines: number = 100): string[] {
    this.checkDateAndRotate()

    if (!fs.existsSync(this.logFile)) {
      return []
    }

    const content = fs.readFileSync(this.logFile, 'utf-8')
    const allLines = content.split('\n').filter(line => line.trim())

    return allLines.slice(-lines)
  }

  // 清理旧日志（保留最近7天）
  cleanOldLogs() {
    const files = fs.readdirSync(logsDir)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    files.forEach(file => {
      if (file.startsWith('api-errors-') && file.endsWith('.log')) {
        const filePath = path.join(logsDir, file)
        const stats = fs.statSync(filePath)

        if (stats.mtime < sevenDaysAgo) {
          fs.unlinkSync(filePath)
          console.log(`Deleted old log file: ${file}`)
        }
      }
    })
  }
}

export const errorLogger = new ErrorLogger()
export default errorLogger
