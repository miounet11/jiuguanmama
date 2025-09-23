import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import type { Ref } from 'vue'

export interface InfiniteScrollOptions {
  sentinelRef: Ref<HTMLElement | undefined>
  threshold?: number
  rootMargin?: string
  onIntersect?: () => void
  onError?: (error: Error) => void
  debounceMs?: number
  disabled?: Ref<boolean>
}

/**
 * 无限滚动组合式函数
 * 基于 IntersectionObserver 实现高性能的无限滚动
 */
export function useInfiniteScroll(options: InfiniteScrollOptions) {
  const {
    sentinelRef,
    threshold = 0.1,
    rootMargin = '100px',
    onIntersect,
    onError,
    debounceMs = 300,
    disabled
  } = options

  // 状态管理
  const isIntersecting = ref(false)
  const isLoading = ref(false)
  const hasError = ref(false)
  const errorMessage = ref<string>('')

  // IntersectionObserver 实例
  let intersectionObserver: IntersectionObserver | null = null

  // 防抖计时器
  let debounceTimer: number | null = null

  // 防抖处理函数
  const debouncedIntersect = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = window.setTimeout(() => {
      try {
        if (!disabled?.value && onIntersect) {
          isLoading.value = true
          hasError.value = false
          errorMessage.value = ''
          onIntersect()
        }
      } catch (error) {
        hasError.value = true
        errorMessage.value = error instanceof Error ? error.message : 'Unknown error'

        if (onError) {
          onError(error instanceof Error ? error : new Error('Unknown error'))
        } else {
          console.error('InfiniteScroll error:', error)
        }
      } finally {
        isLoading.value = false
      }
    }, debounceMs)
  }

  // 设置 IntersectionObserver
  const setupIntersectionObserver = () => {
    if (typeof IntersectionObserver === 'undefined') {
      console.warn('IntersectionObserver is not supported in this browser')
      return
    }

    if (!sentinelRef.value) {
      console.warn('Sentinel element not found')
      return
    }

    // 清理旧的观察器
    if (intersectionObserver) {
      intersectionObserver.disconnect()
    }

    intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        const wasIntersecting = isIntersecting.value
        isIntersecting.value = entry.isIntersecting

        // 只在从不可见变为可见时触发
        if (entry.isIntersecting && !wasIntersecting && !isLoading.value) {
          debouncedIntersect()
        }
      },
      {
        threshold,
        rootMargin,
        root: null // 使用视口作为根元素
      }
    )

    intersectionObserver.observe(sentinelRef.value)
  }

  // 手动触发加载
  const triggerLoad = () => {
    if (!disabled?.value && !isLoading.value) {
      debouncedIntersect()
    }
  }

  // 重置状态
  const reset = () => {
    isIntersecting.value = false
    isLoading.value = false
    hasError.value = false
    errorMessage.value = ''

    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  // 重新初始化
  const reinitialize = async () => {
    cleanup()
    await nextTick()
    setupIntersectionObserver()
  }

  // 清理资源
  const cleanup = () => {
    if (intersectionObserver) {
      intersectionObserver.disconnect()
      intersectionObserver = null
    }

    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  // 监听 sentinel 元素变化
  const watchSentinel = () => {
    if (!sentinelRef.value) {
      // 延迟重试
      setTimeout(() => {
        if (sentinelRef.value) {
          setupIntersectionObserver()
        }
      }, 100)
    } else {
      setupIntersectionObserver()
    }
  }

  // 生命周期
  onMounted(() => {
    nextTick(watchSentinel)
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    // 状态
    isIntersecting: readonly(isIntersecting),
    isLoading: readonly(isLoading),
    hasError: readonly(hasError),
    errorMessage: readonly(errorMessage),

    // 方法
    triggerLoad,
    reset,
    reinitialize,
    setupIntersectionObserver,
    cleanup
  }
}

// 只读包装函数
function readonly<T>(ref: Ref<T>) {
  return computed(() => ref.value)
}

// 导入 computed
import { computed } from 'vue'

/**
 * 高级无限滚动组合函数
 * 支持双向加载、预加载、错误重试等高级功能
 */
export function useAdvancedInfiniteScroll<T = any>(options: {
  loadMore: () => Promise<T[]>
  loadPrevious?: () => Promise<T[]>
  hasMore?: Ref<boolean>
  hasPrevious?: Ref<boolean>
  threshold?: number
  rootMargin?: string
  retryAttempts?: number
  retryDelay?: number
  preloadDistance?: number
}) {
  const {
    loadMore,
    loadPrevious,
    hasMore = ref(true),
    hasPrevious = ref(false),
    threshold = 0.1,
    rootMargin = '100px',
    retryAttempts = 3,
    retryDelay = 1000,
    preloadDistance = 200
  } = options

  // 状态管理
  const isLoadingMore = ref(false)
  const isLoadingPrevious = ref(false)
  const error = ref<Error | null>(null)
  const retryCount = ref(0)

  // Sentinel 元素引用
  const bottomSentinelRef = ref<HTMLElement>()
  const topSentinelRef = ref<HTMLElement>()

  // 重试机制
  const executeWithRetry = async (
    fn: () => Promise<T[]>,
    attempts: number = retryAttempts
  ): Promise<T[]> => {
    try {
      const result = await fn()
      retryCount.value = 0
      error.value = null
      return result
    } catch (err) {
      retryCount.value++

      if (retryCount.value < attempts) {
        // 指数退避重试
        const delay = retryDelay * Math.pow(2, retryCount.value - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
        return executeWithRetry(fn, attempts)
      } else {
        error.value = err instanceof Error ? err : new Error('Load failed')
        throw err
      }
    }
  }

  // 加载更多数据
  const handleLoadMore = async () => {
    if (isLoadingMore.value || !hasMore.value) return

    isLoadingMore.value = true
    try {
      await executeWithRetry(loadMore)
    } catch (err) {
      console.error('Failed to load more:', err)
    } finally {
      isLoadingMore.value = false
    }
  }

  // 加载之前的数据
  const handleLoadPrevious = async () => {
    if (!loadPrevious || isLoadingPrevious.value || !hasPrevious.value) return

    isLoadingPrevious.value = true
    try {
      await executeWithRetry(loadPrevious)
    } catch (err) {
      console.error('Failed to load previous:', err)
    } finally {
      isLoadingPrevious.value = false
    }
  }

  // 底部无限滚动
  const bottomInfiniteScroll = useInfiniteScroll({
    sentinelRef: bottomSentinelRef,
    threshold,
    rootMargin,
    onIntersect: handleLoadMore,
    disabled: computed(() => !hasMore.value || isLoadingMore.value)
  })

  // 顶部无限滚动
  const topInfiniteScroll = loadPrevious
    ? useInfiniteScroll({
        sentinelRef: topSentinelRef,
        threshold,
        rootMargin,
        onIntersect: handleLoadPrevious,
        disabled: computed(() => !hasPrevious.value || isLoadingPrevious.value)
      })
    : null

  // 手动重试
  const retry = () => {
    error.value = null
    retryCount.value = 0

    if (bottomInfiniteScroll.isIntersecting.value && hasMore.value) {
      handleLoadMore()
    }

    if (topInfiniteScroll?.isIntersecting.value && hasPrevious.value) {
      handleLoadPrevious()
    }
  }

  // 重置状态
  const resetAll = () => {
    bottomInfiniteScroll.reset()
    topInfiniteScroll?.reset()
    error.value = null
    retryCount.value = 0
    isLoadingMore.value = false
    isLoadingPrevious.value = false
  }

  return {
    // Refs
    bottomSentinelRef,
    topSentinelRef,

    // 状态
    isLoadingMore: readonly(isLoadingMore),
    isLoadingPrevious: readonly(isLoadingPrevious),
    error: readonly(error),
    retryCount: readonly(retryCount),

    // 方法
    loadMore: handleLoadMore,
    loadPrevious: handleLoadPrevious,
    retry,
    reset: resetAll,

    // 底层控制
    bottomInfiniteScroll,
    topInfiniteScroll
  }
}