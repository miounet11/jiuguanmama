import { ref } from 'vue'

/**
 * 错误处理组合式函数
 */

export interface ErrorInfo {
  id: string
  message: string
  type: 'error' | 'warning' | 'network' | 'validation'
  timestamp: Date
  stack?: string
  context?: Record<string, any>
  retry?: () => void
}

export function useErrorHandler() {
  const errors = ref<ErrorInfo[]>([])
  const isLoading = ref(false)

  // 处理错误
  const handleError = (
    error: Error | string,
    type: ErrorInfo['type'] = 'error',
    context?: Record<string, any>,
    retryFunction?: () => void
  ) => {
    const errorInfo: ErrorInfo = {
      id: Date.now().toString(),
      message: typeof error === 'string' ? error : error.message,
      type,
      timestamp: new Date(),
      stack: typeof error === 'string' ? undefined : error.stack,
      context,
      retry: retryFunction
    }

    errors.value.unshift(errorInfo)

    // 控制台输出
    console.error(`[${type.toUpperCase()}]`, errorInfo.message, {
      error: typeof error === 'string' ? new Error(error) : error,
      context,
      timestamp: errorInfo.timestamp
    })

    // 限制错误数量
    if (errors.value.length > 50) {
      errors.value = errors.value.slice(0, 50)
    }
  }

  // 处理异步错误
  const handleAsync = async <T>(
    asyncFn: () => Promise<T>,
    errorMessage?: string,
    context?: Record<string, any>
  ): Promise<T | null> => {
    try {
      isLoading.value = true
      return await asyncFn()
    } catch (error) {
      handleError(
        error as Error,
        'error',
        context,
        () => handleAsync(asyncFn, errorMessage, context)
      )
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 处理网络错误
  const handleNetworkError = (error: Error, context?: Record<string, any>, retryFn?: () => void) => {
    let message = '网络请求失败'

    if (error.message.includes('fetch')) {
      message = '网络连接失败，请检查您的网络连接'
    } else if (error.message.includes('timeout')) {
      message = '请求超时，请稍后重试'
    } else if (error.message.includes('404')) {
      message = '请求的资源不存在'
    } else if (error.message.includes('500')) {
      message = '服务器内部错误'
    } else if (error.message.includes('401')) {
      message = '未授权访问，请重新登录'
    } else if (error.message.includes('403')) {
      message = '权限不足'
    }

    handleError(error, 'network', context, retryFn)
  }

  // 处理验证错误
  const handleValidationError = (message: string, context?: Record<string, any>) => {
    handleError(message, 'validation', context)
  }

  // 清除错误
  const clearError = (id: string) => {
    const index = errors.value.findIndex(e => e.id === id)
    if (index !== -1) {
      errors.value.splice(index, 1)
    }
  }

  // 清除所有错误
  const clearAllErrors = () => {
    errors.value = []
  }

  // 重试错误
  const retryError = (id: string) => {
    const error = errors.value.find(e => e.id === id)
    if (error?.retry) {
      clearError(id)
      error.retry()
    }
  }

  // 获取最新错误
  const latestError = computed(() => errors.value[0] || null)

  // 获取特定类型的错误
  const getErrorsByType = (type: ErrorInfo['type']) => {
    return errors.value.filter(e => e.type === type)
  }

  // 是否有错误
  const hasErrors = computed(() => errors.value.length > 0)
  const hasNetworkErrors = computed(() => getErrorsByType('network').length > 0)
  const hasValidationErrors = computed(() => getErrorsByType('validation').length > 0)

  return {
    // 状态
    errors: readonly(errors),
    isLoading: readonly(isLoading),
    latestError,
    hasErrors,
    hasNetworkErrors,
    hasValidationErrors,

    // 方法
    handleError,
    handleAsync,
    handleNetworkError,
    handleValidationError,
    clearError,
    clearAllErrors,
    retryError,
    getErrorsByType
  }
}

/**
 * 全局错误处理器
 */
export function setupGlobalErrorHandler() {
  const { handleError, handleNetworkError } = useErrorHandler()

  // 未捕获的 JavaScript 错误
  window.addEventListener('error', (event) => {
    handleError(event.error || new Error(event.message), 'error', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    })
  })

  // 未捕获的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason instanceof Error) {
      // 检查是否是网络错误
      if (event.reason.message.includes('fetch') ||
          event.reason.message.includes('network') ||
          event.reason.message.includes('timeout')) {
        handleNetworkError(event.reason)
      } else {
        handleError(event.reason, 'error')
      }
    } else {
      handleError(String(event.reason), 'error')
    }

    // 防止浏览器默认的错误处理
    event.preventDefault()
  })

  return { handleError, handleNetworkError }
}
