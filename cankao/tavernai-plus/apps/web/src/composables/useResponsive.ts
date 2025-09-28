import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * 响应式断点检测组合式函数
 */

export interface BreakpointOptions {
  sm?: number
  md?: number
  lg?: number
  xl?: number
  xxl?: number
}

const DEFAULT_BREAKPOINTS: Required<BreakpointOptions> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536
}

export function useResponsive(customBreakpoints: BreakpointOptions = {}) {
  const breakpoints = { ...DEFAULT_BREAKPOINTS, ...customBreakpoints }

  // 响应式状态
  const windowWidth = ref(0)
  const windowHeight = ref(0)

  // 断点检测
  const isSm = computed(() => windowWidth.value >= breakpoints.sm)
  const isMd = computed(() => windowWidth.value >= breakpoints.md)
  const isLg = computed(() => windowWidth.value >= breakpoints.lg)
  const isXl = computed(() => windowWidth.value >= breakpoints.xl)
  const isXxl = computed(() => windowWidth.value >= breakpoints.xxl)

  // 便捷检测
  const isMobile = computed(() => windowWidth.value < breakpoints.md)
  const isTablet = computed(() => windowWidth.value >= breakpoints.md && windowWidth.value < breakpoints.lg)
  const isDesktop = computed(() => windowWidth.value >= breakpoints.lg)

  // 当前断点
  const currentBreakpoint = computed(() => {
    if (windowWidth.value >= breakpoints.xxl) return 'xxl'
    if (windowWidth.value >= breakpoints.xl) return 'xl'
    if (windowWidth.value >= breakpoints.lg) return 'lg'
    if (windowWidth.value >= breakpoints.md) return 'md'
    if (windowWidth.value >= breakpoints.sm) return 'sm'
    return 'xs'
  })

  // 屏幕方向
  const isPortrait = computed(() => windowHeight.value > windowWidth.value)
  const isLandscape = computed(() => windowWidth.value > windowHeight.value)

  // 更新尺寸
  const updateSize = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }

  // 生命周期管理
  onMounted(() => {
    updateSize()
    window.addEventListener('resize', updateSize, { passive: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateSize)
  })

  return {
    // 窗口尺寸
    windowWidth: readonly(windowWidth),
    windowHeight: readonly(windowHeight),

    // 断点检测
    isSm,
    isMd,
    isLg,
    isXl,
    isXxl,

    // 便捷检测
    isMobile,
    isTablet,
    isDesktop,

    // 当前断点
    currentBreakpoint,

    // 屏幕方向
    isPortrait,
    isLandscape,

    // 方法
    updateSize
  }
}

/**
 * 移动端检测组合式函数
 */
export function useMobileDetection() {
  const isMobileUserAgent = ref(false)
  const isTouchDevice = ref(false)

  onMounted(() => {
    // User Agent 检测
    isMobileUserAgent.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )

    // 触摸设备检测
    isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })

  const { isMobile: isScreenMobile } = useResponsive()

  // 综合判断是否为移动设备
  const isMobile = computed(() =>
    isMobileUserAgent.value || isScreenMobile.value || isTouchDevice.value
  )

  return {
    isMobile,
    isMobileUserAgent: readonly(isMobileUserAgent),
    isTouchDevice: readonly(isTouchDevice),
    isScreenMobile
  }
}
