import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export interface BreakpointConfig {
  mobile: number
  tablet: number
  desktop: number
  wide: number
}

export interface TouchGestures {
  swipeLeft?: () => void
  swipeRight?: () => void
  swipeUp?: () => void
  swipeDown?: () => void
  pinchIn?: () => void
  pinchOut?: () => void
}

export interface MobileConfig {
  breakpoints: BreakpointConfig
  enableGestures: boolean
  enableHapticFeedback: boolean
  enablePullToRefresh: boolean
  enableVirtualScrolling: boolean
}

const DEFAULT_CONFIG: MobileConfig = {
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1280,
    wide: 1536
  },
  enableGestures: true,
  enableHapticFeedback: true,
  enablePullToRefresh: true,
  enableVirtualScrolling: false
}

/**
 * 移动端优化组合式函数
 */
export function useMobileOptimization(config: Partial<MobileConfig> = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  // 响应式状态
  const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)
  const windowHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 800)
  const isTouchDevice = ref(false)
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(false)
  const isWide = ref(false)
  const orientation = ref<'portrait' | 'landscape'>('landscape')

  // 更新断点状态
  const updateBreakpoints = () => {
    const width = windowWidth.value

    isMobile.value = width < cfg.breakpoints.mobile
    isTablet.value = width >= cfg.breakpoints.mobile && width < cfg.breakpoints.desktop
    isDesktop.value = width >= cfg.breakpoints.desktop && width < cfg.breakpoints.wide
    isWide.value = width >= cfg.breakpoints.wide
  }

  // 更新设备方向
  const updateOrientation = () => {
    if (typeof window !== 'undefined') {
      orientation.value = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
    }
  }

  // 检测触摸设备
  const detectTouchDevice = () => {
    if (typeof window !== 'undefined') {
      isTouchDevice.value = 'ontouchstart' in window ||
                          navigator.maxTouchPoints > 0 ||
                          (navigator as any).msMaxTouchPoints > 0
    }
  }

  // 窗口大小变化处理
  const handleResize = () => {
    if (typeof window !== 'undefined') {
      windowWidth.value = window.innerWidth
      windowHeight.value = window.innerHeight
      updateBreakpoints()
      updateOrientation()
    }
  }

  // 方向变化处理
  const handleOrientationChange = () => {
    setTimeout(() => {
      updateOrientation()
    }, 100)
  }

  // 获取当前断点名称
  const currentBreakpoint = computed(() => {
    if (isMobile.value) return 'mobile'
    if (isTablet.value) return 'tablet'
    if (isDesktop.value) return 'desktop'
    return 'wide'
  })

  // 获取设备类型
  const deviceType = computed(() => {
    if (isMobile.value) return 'mobile'
    if (isTablet.value) return 'tablet'
    return 'desktop'
  })

  // 安全区域检测（支持刘海屏等）
  const safeAreaInsets = computed(() => {
    if (typeof window === 'undefined' || !window.getComputedStyle) {
      return { top: 0, right: 0, bottom: 0, left: 0 }
    }

    const root = document.documentElement
    const style = getComputedStyle(root)

    return {
      top: parseInt(style.getPropertyValue('safe-area-inset-top') || '0'),
      right: parseInt(style.getPropertyValue('safe-area-inset-right') || '0'),
      bottom: parseInt(style.getPropertyValue('safe-area-inset-bottom') || '0'),
      left: parseInt(style.getPropertyValue('safe-area-inset-left') || '0')
    }
  })

  // 视口高度检测（处理移动端浏览器地址栏影响）
  const viewportHeight = computed(() => {
    if (typeof window === 'undefined') return windowHeight.value

    // 使用CSS变量获取真实的视口高度
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)

    return window.innerHeight
  })

  // 触摸手势处理
  const touchState = ref({
    startX: 0,
    startY: 0,
    startTime: 0,
    distanceX: 0,
    distanceY: 0,
    isTracking: false
  })

  const handleTouchStart = (event: TouchEvent) => {
    if (!cfg.enableGestures) return

    const touch = event.touches[0]
    touchState.value = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      distanceX: 0,
      distanceY: 0,
      isTracking: true
    }
  }

  const handleTouchMove = (event: TouchEvent) => {
    if (!cfg.enableGestures || !touchState.value.isTracking) return

    const touch = event.touches[0]
    touchState.value.distanceX = touch.clientX - touchState.value.startX
    touchState.value.distanceY = touch.clientY - touchState.value.startY
  }

  const handleTouchEnd = (event: TouchEvent, gestures: TouchGestures) => {
    if (!cfg.enableGestures || !touchState.value.isTracking) return

    const { distanceX, distanceY, startTime } = touchState.value
    const duration = Date.now() - startTime
    const minDistance = 50
    const maxDuration = 300

    // 检查是否为有效滑动
    if (Math.abs(distanceX) < minDistance && Math.abs(distanceY) < minDistance || duration > maxDuration) {
      touchState.value.isTracking = false
      return
    }

    // 确定滑动方向
    const isHorizontal = Math.abs(distanceX) > Math.abs(distanceY)

    if (isHorizontal) {
      if (distanceX > 0 && gestures.swipeRight) {
        gestures.swipeRight()
        triggerHapticFeedback('light')
      } else if (distanceX < 0 && gestures.swipeLeft) {
        gestures.swipeLeft()
        triggerHapticFeedback('light')
      }
    } else {
      if (distanceY > 0 && gestures.swipeDown) {
        gestures.swipeDown()
        triggerHapticFeedback('light')
      } else if (distanceY < 0 && gestures.swipeUp) {
        gestures.swipeUp()
        triggerHapticFeedback('light')
      }
    }

    touchState.value.isTracking = false
  }

  // 触觉反馈
  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
    if (!cfg.enableHapticFeedback || !('vibrate' in navigator)) return

    const patterns = {
      light: [10],
      medium: [50],
      heavy: [100],
      success: [10, 50, 10],
      warning: [20, 100],
      error: [100, 50, 100]
    }

    navigator.vibrate(patterns[type] || patterns.light)
  }

  // 下拉刷新
  const pullToRefreshState = ref({
    isPulling: false,
    pullDistance: 0,
    shouldRefresh: false,
    startY: 0
  })

  const handlePullToRefreshStart = (event: TouchEvent) => {
    if (!cfg.enablePullToRefresh || window.scrollY > 0) return

    pullToRefreshState.value = {
      isPulling: true,
      pullDistance: 0,
      shouldRefresh: false,
      startY: event.touches[0].clientY
    }
  }

  const handlePullToRefreshMove = (event: TouchEvent) => {
    if (!pullToRefreshState.value.isPulling) return

    const currentY = event.touches[0].clientY
    const pullDistance = currentY - pullToRefreshState.value.startY

    if (pullDistance > 0 && window.scrollY === 0) {
      pullToRefreshState.value.pullDistance = Math.min(pullDistance, 100)
      pullToRefreshState.value.shouldRefresh = pullDistance > 60

      event.preventDefault()
    }
  }

  const handlePullToRefreshEnd = (onRefresh?: () => Promise<void>) => {
    if (!pullToRefreshState.value.isPulling) return

    if (pullToRefreshState.value.shouldRefresh && onRefresh) {
      triggerHapticFeedback('medium')
      onRefresh().finally(() => {
        resetPullToRefresh()
      })
    } else {
      resetPullToRefresh()
    }
  }

  const resetPullToRefresh = () => {
    pullToRefreshState.value = {
      isPulling: false,
      pullDistance: 0,
      shouldRefresh: false,
      startY: 0
    }
  }

  // 虚拟滚动优化
  const createVirtualScrollManager = (itemHeight: number, bufferSize: number = 5) => {
    const scrollTop = ref(0)
    const containerHeight = ref(0)
    const totalItems = ref(0)
    const items = ref<any[]>([])

    const visibleRange = computed(() => {
      const start = Math.floor(scrollTop.value / itemHeight)
      const end = Math.min(
        start + Math.ceil(containerHeight.value / itemHeight) + bufferSize,
        totalItems.value
      )
      return { start: Math.max(0, start - bufferSize), end }
    })

    const visibleItems = computed(() => {
      const { start, end } = visibleRange.value
      return items.value.slice(start, end).map((item, index) => ({
        item,
        index: start + index,
        transform: `translateY(${(start + index) * itemHeight}px)`
      }))
    })

    const totalHeight = computed(() => totalItems.value * itemHeight)

    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement
      scrollTop.value = target.scrollTop
    }

    const updateItems = (newItems: any[]) => {
      items.value = newItems
      totalItems.value = newItems.length
    }

    return {
      visibleItems,
      totalHeight,
      handleScroll,
      updateItems,
      setContainerHeight: (height: number) => { containerHeight.value = height }
    }
  }

  // 图片懒加载
  const createImageLazyLoader = () => {
    const observer = ref<IntersectionObserver | null>(null)
    const loadedImages = ref(new Set<string>())

    const loadImage = (image: HTMLImageElement, src: string) => {
      if (loadedImages.value.has(src)) return

      const img = new Image()
      img.onload = () => {
        image.src = src
        image.classList.add('loaded')
        loadedImages.value.add(src)
      }
      img.onerror = () => {
        image.classList.add('error')
      }
      img.src = src
    }

    const observe = (element: HTMLElement) => {
      if (!observer.value) {
        observer.value = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const img = entry.target as HTMLImageElement
                const src = img.dataset.src
                if (src) {
                  loadImage(img, src)
                  observer.value?.unobserve(img)
                }
              }
            }
          },
          { rootMargin: '50px' }
        )
      }

      observer.value.observe(element)
    }

    const disconnect = () => {
      observer.value?.disconnect()
    }

    return { observe, disconnect }
  }

  // 性能监控
  const performanceMetrics = ref({
    fps: 60,
    memoryUsage: 0,
    networkSpeed: 0
  })

  const startPerformanceMonitoring = () => {
    let lastTime = performance.now()
    let frameCount = 0

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()

      if (currentTime - lastTime >= 1000) {
        performanceMetrics.value.fps = frameCount
        frameCount = 0
        lastTime = currentTime
      }

      requestAnimationFrame(measureFPS)
    }

    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        performanceMetrics.value.memoryUsage = memory.usedJSHeapSize / 1024 / 1024
      }
    }

    const measureNetwork = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        performanceMetrics.value.networkSpeed = connection.downlink || 0
      }
    }

    measureFPS()
    setInterval(measureMemory, 5000)
    setInterval(measureNetwork, 10000)
  }

  // 防抖函数
  const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void => {
    let timeout: NodeJS.Timeout

    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  // 节流函数
  const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void => {
    let inThrottle: boolean

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  // 监听窗口变化
  onMounted(() => {
    if (typeof window !== 'undefined') {
      handleResize()
      detectTouchDevice()
      window.addEventListener('resize', debounce(handleResize, 100))
      window.addEventListener('orientationchange', handleOrientationChange)

      if (isTouchDevice.value && cfg.enableGestures) {
        startPerformanceMonitoring()
      }
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  })

  // 监听设备类型变化
  watch(deviceType, (newType, oldType) => {
    if (newType !== oldType) {
      console.log(`设备类型变化: ${oldType} -> ${newType}`)
      triggerHapticFeedback('success')
    }
  })

  return {
    // 状态
    windowWidth,
    windowHeight,
    isTouchDevice,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    orientation,
    currentBreakpoint,
    deviceType,
    safeAreaInsets,
    viewportHeight,
    performanceMetrics,
    pullToRefreshState,

    // 方法
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    triggerHapticFeedback,
    handlePullToRefreshStart,
    handlePullToRefreshMove,
    handlePullToRefreshEnd,
    resetPullToRefresh,

    // 工具函数
    createVirtualScrollManager,
    createImageLazyLoader,
    debounce,
    throttle
  }
}

/**
 * CSS媒体查询辅助函数
 */
export const createMediaQuery = (breakpoint: string) => {
  if (typeof window === 'undefined') return { matches: false }

  return window.matchMedia(breakpoint)
}

/**
 * 设备像素比检测
 */
export const getPixelRatio = () => {
  if (typeof window === 'undefined') return 1
  return window.devicePixelRatio || 1
}

/**
 * 检测是否为高分辨率屏幕
 */
export const isHighDensityScreen = () => {
  return getPixelRatio() > 1
}