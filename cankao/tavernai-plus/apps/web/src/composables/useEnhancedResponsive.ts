/**
 * 增强响应式组合式函数
 * 提供完整的移动端适配和响应式检测功能
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// 响应式断点配置
export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
} as const

// 设备类型定义
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'large-desktop'
export type Orientation = 'portrait' | 'landscape'
export type ThemeMode = 'light' | 'dark' | 'auto'

// 响应式状态接口
export interface ResponsiveState {
  width: number
  height: number
  deviceType: DeviceType
  orientation: Orientation
  isTouchDevice: boolean
  pixelRatio: number
  isOnline: boolean
  connectionType: string
  effectiveConnectionType: string
}

// 移动端功能检测接口
export interface MobileCapabilities {
  touchSupport: boolean
  multiTouch: boolean
  geolocation: boolean
  camera: boolean
  vibration: boolean
  clipboard: boolean
  shareAPI: boolean
  webShare: boolean
  fullscreen: boolean
  installPrompt: boolean
}

export function useEnhancedResponsive() {
  // 基础响应式状态
  const windowWidth = ref(0)
  const windowHeight = ref(0)
  const scrollX = ref(0)
  const scrollY = ref(0)

  // 设备信息
  const deviceType = ref<DeviceType>('mobile')
  const orientation = ref<Orientation>('portrait')
  const pixelRatio = ref(1)
  const isTouchDevice = ref(false)
  const maxTouchPoints = ref(0)

  // 网络状态
  const isOnline = ref(true)
  const connectionType = ref('unknown')
  const effectiveConnectionType = ref('unknown')
  const downlink = ref(0)
  const rtt = ref(0)

  // 移动端功能检测
  const capabilities = ref<MobileCapabilities>({
    touchSupport: false,
    multiTouch: false,
    geolocation: false,
    camera: false,
    vibration: false,
    clipboard: false,
    shareAPI: false,
    webShare: false,
    fullscreen: false,
    installPrompt: false,
  })

  // 主题检测
  const prefersDark = ref(false)
  const prefersReducedMotion = ref(false)
  const prefersHighContrast = ref(false)

  // 更新窗口尺寸
  const updateSize = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
    updateDeviceType()
    updateOrientation()
  }

  // 更新设备类型
  const updateDeviceType = () => {
    const width = windowWidth.value
    if (width < BREAKPOINTS.md) {
      deviceType.value = 'mobile'
    } else if (width < BREAKPOINTS.lg) {
      deviceType.value = 'tablet'
    } else if (width < BREAKPOINTS['2xl']) {
      deviceType.value = 'desktop'
    } else {
      deviceType.value = 'large-desktop'
    }
  }

  // 更新屏幕方向
  const updateOrientation = () => {
    orientation.value = windowHeight.value > windowWidth.value ? 'portrait' : 'landscape'
  }

  // 更新滚动位置
  const updateScroll = () => {
    scrollX.value = window.scrollX
    scrollY.value = window.scrollY
  }

  // 检测触摸设备
  const detectTouchDevice = () => {
    isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    maxTouchPoints.value = navigator.maxTouchPoints
    capabilities.value.touchSupport = isTouchDevice.value
    capabilities.value.multiTouch = maxTouchPoints.value > 1
  }

  // 检测设备能力
  const detectCapabilities = () => {
    // 地理定位
    capabilities.value.geolocation = 'geolocation' in navigator

    // 摄像头
    capabilities.value.camera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)

    // 震动
    capabilities.value.vibration = 'vibrate' in navigator

    // 剪贴板
    capabilities.value.clipboard = 'clipboard' in navigator

    // 分享API
    capabilities.value.shareAPI = 'share' in navigator
    capabilities.value.webShare = 'share' in navigator

    // 全屏
    capabilities.value.fullscreen = !!(document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled)

    // PWA安装提示
    capabilities.value.installPrompt = 'BeforeInstallPromptEvent' in window
  }

  // 更新网络状态
  const updateNetworkStatus = () => {
    isOnline.value = navigator.onLine

    // 网络信息API (如果支持)
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection

    if (connection) {
      connectionType.value = connection.type || 'unknown'
      effectiveConnectionType.value = connection.effectiveType || 'unknown'
      downlink.value = connection.downlink || 0
      rtt.value = connection.rtt || 0
    }
  }

  // 检测用户偏好
  const detectUserPreferences = () => {
    // 深色模式
    prefersDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches

    // 减少动画
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // 高对比度
    prefersHighContrast.value = window.matchMedia('(prefers-contrast: high)').matches
  }

  // 断点检测计算属性
  const isXs = computed(() => windowWidth.value >= BREAKPOINTS.xs)
  const isSm = computed(() => windowWidth.value >= BREAKPOINTS.sm)
  const isMd = computed(() => windowWidth.value >= BREAKPOINTS.md)
  const isLg = computed(() => windowWidth.value >= BREAKPOINTS.lg)
  const isXl = computed(() => windowWidth.value >= BREAKPOINTS.xl)
  const is2Xl = computed(() => windowWidth.value >= BREAKPOINTS['2xl'])
  const is3Xl = computed(() => windowWidth.value >= BREAKPOINTS['3xl'])

  // 便捷设备检测
  const isMobile = computed(() => deviceType.value === 'mobile')
  const isTablet = computed(() => deviceType.value === 'tablet')
  const isDesktop = computed(() => deviceType.value === 'desktop')
  const isLargeDesktop = computed(() => deviceType.value === 'large-desktop')

  // 当前断点
  const currentBreakpoint = computed(() => {
    if (windowWidth.value >= BREAKPOINTS['3xl']) return '3xl'
    if (windowWidth.value >= BREAKPOINTS['2xl']) return '2xl'
    if (windowWidth.value >= BREAKPOINTS.xl) return 'xl'
    if (windowWidth.value >= BREAKPOINTS.lg) return 'lg'
    if (windowWidth.value >= BREAKPOINTS.md) return 'md'
    if (windowWidth.value >= BREAKPOINTS.sm) return 'sm'
    return 'xs'
  })

  // 是否为移动设备 (综合判断)
  const isMobileDevice = computed(() => {
    return isMobile.value || isTouchDevice.value
  })

  // 是否为高性能设备
  const isHighPerformanceDevice = computed(() => {
    const cores = navigator.hardwareConcurrency || 2
    const memory = (navigator as any).deviceMemory || 2
    return cores >= 4 && memory >= 4
  })

  // 是否为低性能设备
  const isLowPerformanceDevice = computed(() => {
    const cores = navigator.hardwareConcurrency || 2
    const memory = (navigator as any).deviceMemory || 2
    return cores <= 2 || memory <= 2
  })

  // 网络质量
  const networkQuality = computed(() => {
    if (effectiveConnectionType.value === 'slow-2g' || effectiveConnectionType.value === '2g') {
      return 'poor'
    } else if (effectiveConnectionType.value === '3g') {
      return 'fair'
    } else if (effectiveConnectionType.value === '4g') {
      return 'good'
    }
    return 'excellent'
  })

  // 是否应该使用移动端优化
  const shouldUseMobileOptimizations = computed(() => {
    return isMobileDevice.value || isLowPerformanceDevice.value || networkQuality.value === 'poor'
  })

  // 响应式间距计算
  const getResponsiveSpacing = (mobile: number, tablet?: number, desktop?: number) => {
    if (isDesktop.value && desktop) return desktop
    if (isTablet.value && tablet) return tablet
    return mobile
  }

  // 响应式字体大小
  const getResponsiveFontSize = (mobile: string, tablet?: string, desktop?: string) => {
    if (isDesktop.value && desktop) return desktop
    if (isTablet.value && tablet) return tablet
    return mobile
  }

  // 触摸友好尺寸
  const getTouchSize = (defaultSize: number) => {
    if (isTouchDevice.value) {
      return Math.max(defaultSize, 44) // Apple HIG 最小触摸目标
    }
    return defaultSize
  }

  // 安全区域
  const getSafeAreaInsets = () => {
    const style = getComputedStyle(document.documentElement)
    return {
      top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
      right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
      bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
    }
  }

  // 媒体查询监听
  const setupMediaQueryListeners = () => {
    // 深色模式变化
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    darkModeQuery.addEventListener('change', (e) => {
      prefersDark.value = e.matches
    })

    // 减少动画变化
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotionQuery.addEventListener('change', (e) => {
      prefersReducedMotion.value = e.matches
    })

    // 高对比度变化
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)')
    highContrastQuery.addEventListener('change', (e) => {
      prefersHighContrast.value = e.matches
    })
  }

  // 事件监听器
  const eventListeners = {
    resize: () => updateSize(),
    scroll: () => updateScroll(),
    online: () => updateNetworkStatus(),
    offline: () => updateNetworkStatus(),
    orientationchange: () => {
      setTimeout(() => {
        updateSize()
        updateOrientation()
      }, 100) // 延迟更新以确保准确
    },
  }

  // 生命周期管理
  onMounted(() => {
    // 初始化所有状态
    updateSize()
    updateScroll()
    updateNetworkStatus()
    detectTouchDevice()
    detectCapabilities()
    detectUserPreferences()

    // 设置事件监听器
    window.addEventListener('resize', eventListeners.resize, { passive: true })
    window.addEventListener('scroll', eventListeners.scroll, { passive: true })
    window.addEventListener('online', eventListeners.online)
    window.addEventListener('offline', eventListeners.offline)
    window.addEventListener('orientationchange', eventListeners.orientationchange)

    // 网络状态监听 (如果支持)
    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus)
    }

    // 设置媒体查询监听器
    setupMediaQueryListeners()
  })

  onUnmounted(() => {
    // 清理事件监听器
    window.removeEventListener('resize', eventListeners.resize)
    window.removeEventListener('scroll', eventListeners.scroll)
    window.removeEventListener('online', eventListeners.online)
    window.removeEventListener('offline', eventListeners.offline)
    window.removeEventListener('orientationchange', eventListeners.orientationchange)

    const connection = (navigator as any).connection
    if (connection) {
      connection.removeEventListener('change', updateNetworkStatus)
    }
  })

  return {
    // 基础状态
    windowWidth: readonly(windowWidth),
    windowHeight: readonly(windowHeight),
    scrollX: readonly(scrollX),
    scrollY: readonly(scrollY),

    // 设备信息
    deviceType: readonly(deviceType),
    orientation: readonly(orientation),
    pixelRatio: readonly(pixelRatio),
    isTouchDevice: readonly(isTouchDevice),
    maxTouchPoints: readonly(maxTouchPoints),

    // 网络状态
    isOnline: readonly(isOnline),
    connectionType: readonly(connectionType),
    effectiveConnectionType: readonly(effectiveConnectionType),
    downlink: readonly(downlink),
    rtt: readonly(rtt),

    // 设备能力
    capabilities: readonly(capabilities),

    // 用户偏好
    prefersDark: readonly(prefersDark),
    prefersReducedMotion: readonly(prefersReducedMotion),
    prefersHighContrast: readonly(prefersHighContrast),

    // 断点检测
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    is3Xl,

    // 设备检测
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isMobileDevice,
    currentBreakpoint,

    // 性能检测
    isHighPerformanceDevice,
    isLowPerformanceDevice,
    shouldUseMobileOptimizations,
    networkQuality,

    // 工具方法
    getResponsiveSpacing,
    getResponsiveFontSize,
    getTouchSize,
    getSafeAreaInsets,
    updateSize,
    updateScroll,
    updateNetworkStatus,
  }
}

// 响应式Hook：监听断点变化
export function useBreakpointListener(breakpoint: keyof typeof BREAKPOINTS, callback: (matches: boolean) => void) {
  const { currentBreakpoint } = useEnhancedResponsive()

  const bpIndex = Object.keys(BREAKPOINTS).indexOf(breakpoint)
  const currentIndex = computed(() => Object.keys(BREAKPOINTS).indexOf(currentBreakpoint.value))
  const matches = computed(() => currentIndex.value >= bpIndex)

  watch(matches, (newMatches) => {
    callback(newMatches)
  }, { immediate: true })

  return matches
}

// 响应式Hook：监听设备类型变化
export function useDeviceTypeListener(callback: (deviceType: DeviceType) => void) {
  const { deviceType } = useEnhancedResponsive()

  watch(deviceType, (newDeviceType) => {
    callback(newDeviceType)
  }, { immediate: true })

  return deviceType
}

// 响应式Hook：监听方向变化
export function useOrientationListener(callback: (orientation: Orientation) => void) {
  const { orientation } = useEnhancedResponsive()

  watch(orientation, (newOrientation) => {
    callback(newOrientation)
  }, { immediate: true })

  return orientation
}

// 响应式Hook：监听网络状态变化
export function useNetworkStatusListener(callback: (status: { online: boolean; quality: string }) => void) {
  const { isOnline, networkQuality } = useEnhancedResponsive()

  const status = computed(() => ({
    online: isOnline.value,
    quality: networkQuality.value
  }))

  watch(status, (newStatus) => {
    callback(newStatus)
  }, { immediate: true, deep: true })

  return status
}