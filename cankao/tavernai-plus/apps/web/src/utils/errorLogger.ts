/**
 * 错误日志记录工具
 */

interface ErrorLog {
  timestamp: string
  type: string
  message: string
  details?: any
  stack?: string
  url?: string
}

class ErrorLogger {
  private logs: ErrorLog[] = []
  private maxLogs = 100 // 最多保存100条日志

  /**
   * 记录通用错误
   */
  log(message: string, details?: any) {
    this.addLog({
      type: 'general',
      message,
      details
    })
  }

  /**
   * 记录 API 错误
   */
  apiError(url: string, method: string, status: number, message: string, details?: any) {
    this.addLog({
      type: 'api',
      message: `[${method}] ${url} - ${status}: ${message}`,
      url,
      details: {
        method,
        status,
        ...details
      }
    })
  }

  /**
   * 记录运行时错误
   */
  runtimeError(error: Error) {
    this.addLog({
      type: 'runtime',
      message: error.message,
      stack: error.stack
    })
  }

  /**
   * 记录组件错误
   */
  componentError(componentName: string, error: any) {
    this.addLog({
      type: 'component',
      message: `Component error in ${componentName}`,
      details: {
        component: componentName,
        error: error instanceof Error ? error.message : String(error)
      },
      stack: error instanceof Error ? error.stack : undefined
    })
  }

  /**
   * 添加日志
   */
  private addLog(log: Omit<ErrorLog, 'timestamp'>) {
    const errorLog: ErrorLog = {
      ...log,
      timestamp: new Date().toISOString()
    }

    this.logs.unshift(errorLog)

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // 在开发环境下输出到控制台
    if (import.meta.env.DEV) {
      console.error('[Error Logger]', errorLog)
    }

    // 持久化到 localStorage（可选）
    try {
      localStorage.setItem('error_logs', JSON.stringify(this.logs))
    } catch (e) {
      // localStorage 可能已满，忽略错误
    }
  }

  /**
   * 获取所有日志
   */
  getLogs(): ErrorLog[] {
    return [...this.logs]
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = []
    try {
      localStorage.removeItem('error_logs')
    } catch (e) {
      // 忽略错误
    }
  }

  /**
   * 从 localStorage 恢复日志
   */
  restoreLogs() {
    try {
      const stored = localStorage.getItem('error_logs')
      if (stored) {
        this.logs = JSON.parse(stored)
      }
    } catch (e) {
      // 忽略错误
    }
  }
}

export const errorLogger = new ErrorLogger()

// 恢复之前的日志
errorLogger.restoreLogs()

// 全局错误处理
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorLogger.runtimeError(new Error(event.message))
  })

  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.log('Unhandled Promise Rejection', event.reason)
  })
}
