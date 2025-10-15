import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useDebounceFn, useThrottleFn } from '@vueuse/core'

// 性能监控接口
interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  scrollFPS: number
  interactionDelay: number
}

// 虚拟滚动配置
interface VirtualScrollConfig {
  itemHeight: number
  bufferSize: number
  threshold: number
}

// 缓存配置
interface CacheConfig {
  maxSize: number
  ttl: number
  strategy: 'lru' | 'fifo' | 'lfu'
}

/**
 * 聊天列表性能优化组合函数
 * 提供虚拟滚动、懒加载、缓存等性能优化功能
 */
export function useChatListPerformance() {
  // === 性能监控 ===
  const metrics = ref<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    scrollFPS: 60,
    interactionDelay: 0
  })

  const isPerformanceMode = ref(false)
  const frameTimeHistory = ref<number[]>([])

  // 监控FPS
  let lastFrameTime = performance.now()
  let frameCount = 0

  const monitorFPS = () => {
    const currentTime = performance.now()
    const deltaTime = currentTime - lastFrameTime

    frameCount++

    if (deltaTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / deltaTime)
      metrics.value.scrollFPS = fps

      // 记录帧时间历史
      frameTimeHistory.value.push(1000 / fps)
      if (frameTimeHistory.value.length > 60) {
        frameTimeHistory.value.shift()
      }

      // 自动性能模式
      if (fps < 30 && !isPerformanceMode.value) {
        enablePerformanceMode()
      } else if (fps > 50 && isPerformanceMode.value) {
        disablePerformanceMode()
      }

      frameCount = 0
      lastFrameTime = currentTime
    }

    requestAnimationFrame(monitorFPS)
  }

  // 监控内存使用
  const monitorMemory = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      metrics.value.memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024)
    }
  }

  // === 虚拟滚动 ===
  const virtualScrollConfig = ref<VirtualScrollConfig>({
    itemHeight: 80,
    bufferSize: 5,
    threshold: 100
  })

  const scrollTop = ref(0)
  const containerHeight = ref(0)
  const totalHeight = ref(0)

  // 计算可见项目范围
  const visibleRange = computed(() => {
    const start = Math.floor(scrollTop.value / virtualScrollConfig.value.itemHeight)
    const end = Math.ceil((scrollTop.value + containerHeight.value) / virtualScrollConfig.value.itemHeight)

    const bufferedStart = Math.max(0, start - virtualScrollConfig.value.bufferSize)
    const bufferedEnd = end + virtualScrollConfig.value.bufferSize

    return {
      start: bufferedStart,
      end: bufferedEnd,
      visibleStart: start,
      visibleEnd: end
    }
  })

  // 处理滚动事件（节流）
  const handleScroll = useThrottleFn((event: Event) => {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop

    // 记录滚动性能
    const startTime = performance.now()
    requestAnimationFrame(() => {
      metrics.value.interactionDelay = performance.now() - startTime
    })
  }, 16) // 约60fps

  // === 缓存系统 ===
  class LRUCache<K, V> {
    private cache = new Map<K, { value: V; timestamp: number }>()
    private maxSize: number
    private ttl: number

    constructor(maxSize: number, ttl: number) {
      this.maxSize = maxSize
      this.ttl = ttl
    }

    get(key: K): V | undefined {
      const item = this.cache.get(key)
      if (!item) return undefined

      // 检查TTL
      if (Date.now() - item.timestamp > this.ttl) {
        this.cache.delete(key)
        return undefined
      }

      // 移动到最后（LRU）
      this.cache.delete(key)
      this.cache.set(key, item)
      return item.value
    }

    set(key: K, value: V): void {
      // 删除过期的条目
      this.cleanup()

      // 如果达到最大大小，删除最旧的条目
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value
        this.cache.delete(firstKey)
      }

      this.cache.set(key, { value, timestamp: Date.now() })
    }

    has(key: K): boolean {
      const item = this.cache.get(key)
      return item !== undefined
    }

    clear(): void {
      this.cache.clear()
    }

    private cleanup(): void {
      const now = Date.now()
      for (const [key, item] of this.cache.entries()) {
        if (now - item.timestamp > this.ttl) {
          this.cache.delete(key)
        }
      }
    }
  }

  // 创建缓存实例
  const conversationCache = new LRUCache<string, any>(100, 5 * 60 * 1000) // 5分钟TTL
  const avatarCache = new LRUCache<string, string>(50, 10 * 60 * 1000) // 10分钟TTL
  const searchCache = new LRUCache<string, any[]>(30, 2 * 60 * 1000) // 2分钟TTL

  // === 懒加载 ===
  const observer = ref<IntersectionObserver | null>(null)
  const lazyItems = ref<Map<string, HTMLElement>>(new Map())

  const setupLazyLoading = () => {
    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement
            const itemId = element.dataset.id

            if (itemId) {
              loadItemContent(itemId, element)
              lazyItems.value.delete(itemId)
            }
          }
        })
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    )
  }

  const observeLazyItem = (id: string, element: HTMLElement) => {
    if (observer.value) {
      lazyItems.value.set(id, element)
      observer.value.observe(element)
    }
  }

  const loadItemContent = async (id: string, element: HTMLElement) => {
    try {
      // 模拟加载内容
      await new Promise(resolve => setTimeout(resolve, 100))

      // 加载完成后标记为已加载
      element.dataset.loaded = 'true'
    } catch (error) {
      console.error('Failed to load item content:', error)
    }
  }

  // === 防抖搜索 ===
  const searchQuery = ref('')
  const searchResults = ref<any[]>([])
  const isSearching = ref(false)

  const debouncedSearch = useDebounceFn(async (query: string) => {
    if (!query.trim()) {
      searchResults.value = []
      return
    }

    // 检查缓存
    const cacheKey = query.toLowerCase()
    const cached = searchCache.get(cacheKey)
    if (cached) {
      searchResults.value = cached
      return
    }

    isSearching.value = true

    try {
      // 模拟搜索API调用
      await new Promise(resolve => setTimeout(resolve, 300))

      // 这里应该调用实际的搜索API
      const results = [] // await api.search(query)

      searchResults.value = results
      searchCache.set(cacheKey, results)
    } catch (error) {
      console.error('Search failed:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)

  // 监听搜索查询变化
  const handleSearch = (query: string) => {
    searchQuery.value = query
    debouncedSearch(query)
  }

  // === 性能模式切换 ===
  const enablePerformanceMode = () => {
    isPerformanceMode.value = true

    // 减少动画复杂度
    document.documentElement.style.setProperty('--animation-duration', '0.1s')

    // 减少缓冲区大小
    virtualScrollConfig.value.bufferSize = 2

    // 禁用一些高消耗功能
    console.log('Performance mode enabled')
  }

  const disablePerformanceMode = () => {
    isPerformanceMode.value = false

    // 恢复正常动画
    document.documentElement.style.setProperty('--animation-duration', '0.3s')

    // 恢复缓冲区大小
    virtualScrollConfig.value.bufferSize = 5

    console.log('Performance mode disabled')
  }

  // === 图片懒加载和优化 ===
  const optimizeImage = (src: string, options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'avif' | 'jpeg' | 'png'
  } = {}): string => {
    const {
      width = 48,
      height = 48,
      quality = 80,
      format = 'webp'
    } = options

    // 这里应该根据实际的图片服务来构建URL
    // 例如：return `${imageServiceUrl}?w=${width}&h=${height}&q=${quality}&f=${format}`
    return src
  }

  const preloadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  // === 批量操作优化 ===
  const batchOperations = ref<Array<() => Promise<void>>>([])
  const isProcessingBatch = ref(false)

  const addToBatch = (operation: () => Promise<void>) => {
    batchOperations.value.push(operation)
  }

  const processBatch = async () => {
    if (isProcessingBatch.value || batchOperations.value.length === 0) return

    isProcessingBatch.value = true
    const startTime = performance.now()

    try {
      // 分批处理，避免阻塞UI
      const batchSize = 5
      for (let i = 0; i < batchOperations.value.length; i += batchSize) {
        const batch = batchOperations.value.slice(i, i + batchSize)
        await Promise.all(batch.map(op => op()))

        // 让出控制权给浏览器
        await nextTick()
      }
    } catch (error) {
      console.error('Batch processing failed:', error)
    } finally {
      batchOperations.value = []
      isProcessingBatch.value = false

      const endTime = performance.now()
      metrics.value.renderTime = endTime - startTime
    }
  }

  // === 内存管理 ===
  const cleanup = () => {
    // 清理缓存
    conversationCache.clear()
    avatarCache.clear()
    searchCache.clear()

    // 断开观察器
    if (observer.value) {
      observer.value.disconnect()
    }

    // 清理懒加载项目
    lazyItems.value.clear()

    console.log('Performance cleanup completed')
  }

  // === 生命周期 ===
  onMounted(() => {
    // 启动性能监控
    requestAnimationFrame(monitorFPS)

    // 定期监控内存
    const memoryInterval = setInterval(monitorMemory, 5000)

    // 设置懒加载
    setupLazyLoading()

    // 清理定时器
    onUnmounted(() => {
      clearInterval(memoryInterval)
      cleanup()
    })
  })

  return {
    // 性能指标
    metrics,
    isPerformanceMode,
    frameTimeHistory,

    // 虚拟滚动
    virtualScrollConfig,
    scrollTop,
    containerHeight,
    totalHeight,
    visibleRange,
    handleScroll,

    // 缓存系统
    conversationCache,
    avatarCache,
    searchCache,

    // 懒加载
    observeLazyItem,
    lazyItems,

    // 搜索功能
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,

    // 性能模式
    enablePerformanceMode,
    disablePerformanceMode,

    // 图片优化
    optimizeImage,
    preloadImage,

    // 批量操作
    batchOperations,
    isProcessingBatch,
    addToBatch,
    processBatch,

    // 内存管理
    cleanup
  }
}

/**
 * 简化版性能优化钩子
 * 适用于只需要基本性能优化功能的场景
 */
export function useSimpleChatPerformance() {
  const {
    metrics,
    isPerformanceMode,
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,
    enablePerformanceMode,
    disablePerformanceMode
  } = useChatListPerformance()

  return {
    metrics,
    isPerformanceMode,
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,
    enablePerformanceMode,
    disablePerformanceMode
  }
}

export default useChatListPerformance