/**
 * 移动端性能优化组合函数
 * 提供内存监控、图片优化、滚动优化等移动端性能优化功能
 */
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'

export interface PerformanceMetrics {
  // 内存使用情况
  memory: {
    used: number      // 已使用内存 (MB)
    total: number     // 总内存 (MB)
    percentage: number // 使用百分比
  }

  // FPS 监控
  fps: {
    current: number   // 当前 FPS
    average: number   // 平均 FPS
    min: number       // 最低 FPS
    max: number       // 最高 FPS
  }

  // 网络状态
  network: {
    effectiveType: string  // 网络类型 (4g, 3g, 2g, slow-2g)
    downlink: number       // 下行带宽 (Mbps)
    rtt: number           // 往返时间 (ms)
    saveData: boolean     // 是否开启流量节省
  }

  // 设备信息
  device: {
    memory: number         // 设备内存 (GB)
    cores: number          // CPU 核心数
    platform: string       // 平台信息
    userAgent: string      // 用户代理
  }
}

export interface ImageOptimizationOptions {
  quality?: number          // 压缩质量 (0-1)
  maxWidth?: number        // 最大宽度
  maxHeight?: number       // 最大高度
  format?: 'webp' | 'jpeg' | 'png'  // 输出格式
  progressive?: boolean    // 渐进式加载
}

export function useMobilePerformance() {
  // 性能指标
  const metrics = ref<PerformanceMetrics>({
    memory: { used: 0, total: 0, percentage: 0 },
    fps: { current: 0, average: 0, min: 60, max: 0 },
    network: { effectiveType: 'unknown', downlink: 0, rtt: 0, saveData: false },
    device: { memory: 0, cores: 0, platform: '', userAgent: '' }
  })

  // 监控状态
  const isMonitoring = ref(false)
  const performanceWarnings = ref<string[]>([])

  // FPS 监控相关
  let frameCount = 0
  let lastFrameTime = performance.now()
  let fpsHistory: number[] = []
  let animationFrameId: number = 0

  // 内存监控定时器
  let memoryMonitorInterval: NodeJS.Timeout | null = null

  // 获取内存使用情况
  const getMemoryUsage = (): { used: number; total: number; percentage: number } => {
    // 使用 performance.memory API (Chrome)
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const used = memory.usedJSHeapSize / 1024 / 1024 // 转换为 MB
      const total = memory.totalJSHeapSize / 1024 / 1024
      const percentage = (used / total) * 100

      return { used, total, percentage }
    }

    // 降级方案：估算内存使用
    const estimatedUsed = document.querySelectorAll('*').length * 0.001 // 粗略估算
    return { used: estimatedUsed, total: 100, percentage: estimatedUsed }
  }

  // 获取网络状态
  const getNetworkInfo = () => {
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection

    if (connection) {
      return {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false
      }
    }

    return {
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false
    }
  }

  // 获取设备信息
  const getDeviceInfo = () => {
    const memory = (navigator as any).deviceMemory || 0
    const cores = navigator.hardwareConcurrency || 0
    const platform = navigator.platform || 'unknown'
    const userAgent = navigator.userAgent

    return { memory, cores, platform, userAgent }
  }

  // FPS 监控
  const monitorFPS = () => {
    const now = performance.now()
    frameCount++

    if (now - lastFrameTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (now - lastFrameTime))

      // 更新 FPS 历史
      fpsHistory.push(fps)
      if (fpsHistory.length > 60) { // 保留最近 60 秒的数据
        fpsHistory.shift()
      }

      // 计算统计信息
      const average = Math.round(fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length)
      const min = Math.min(...fpsHistory)
      const max = Math.max(...fpsHistory)

      metrics.value.fps = {
        current: fps,
        average,
        min,
        max
      }

      // 性能警告
      if (fps < 30) {
        addPerformanceWarning(`FPS 过低: ${fps}`)
      }

      frameCount = 0
      lastFrameTime = now
    }

    if (isMonitoring.value) {
      animationFrameId = requestAnimationFrame(monitorFPS)
    }
  }

  // 添加性能警告
  const addPerformanceWarning = (warning: string) => {
    if (!performanceWarnings.value.includes(warning)) {
      performanceWarnings.value.push(warning)

      // 限制警告数量
      if (performanceWarnings.value.length > 10) {
        performanceWarnings.value.shift()
      }
    }
  }

  // 启动性能监控
  const startMonitoring = () => {
    if (isMonitoring.value) return

    isMonitoring.value = true

    // 初始化设备信息
    metrics.value.device = getDeviceInfo()
    metrics.value.network = getNetworkInfo()

    // 启动 FPS 监控
    animationFrameId = requestAnimationFrame(monitorFPS)

    // 启动内存监控
    memoryMonitorInterval = setInterval(() => {
      metrics.value.memory = getMemoryUsage()
      metrics.value.network = getNetworkInfo()

      // 内存警告
      if (metrics.value.memory.percentage > 80) {
        addPerformanceWarning(`内存使用过高: ${metrics.value.memory.percentage.toFixed(1)}%`)
      }
    }, 2000)
  }

  // 停止性能监控
  const stopMonitoring = () => {
    isMonitoring.value = false

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = 0
    }

    if (memoryMonitorInterval) {
      clearInterval(memoryMonitorInterval)
      memoryMonitorInterval = null
    }
  }

  // 图片优化
  const optimizeImage = async (
    file: File,
    options: ImageOptimizationOptions = {}
  ): Promise<Blob> => {
    const {
      quality = 0.8,
      maxWidth = 1920,
      maxHeight = 1080,
      format = 'webp'
    } = options

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // 计算新尺寸
        let { width, height } = img
        const aspectRatio = width / height

        if (width > maxWidth) {
          width = maxWidth
          height = width / aspectRatio
        }

        if (height > maxHeight) {
          height = maxHeight
          width = height * aspectRatio
        }

        // 设置画布尺寸
        canvas.width = width
        canvas.height = height

        // 绘制图片
        ctx!.drawImage(img, 0, 0, width, height)

        // 转换为 Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('图片优化失败'))
            }
          },
          `image/${format}`,
          quality
        )
      }

      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = URL.createObjectURL(file)
    })
  }

  // 懒加载图片
  const createLazyImage = (src: string, options: {
    placeholder?: string
    threshold?: number
    rootMargin?: string
  } = {}) => {
    const {
      placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="100%25" height="100%25" fill="%23f0f0f0"/%3E%3C/svg%3E',
      threshold = 0.1,
      rootMargin = '50px'
    } = options

    const img = new Image()
    let hasLoaded = false

    const load = () => {
      if (hasLoaded) return
      hasLoaded = true
      img.src = src
    }

    // 创建 Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            load()
            observer.disconnect()
          }
        })
      },
      { threshold, rootMargin }
    )

    // 返回控制接口
    return {
      img,
      load,
      observe: (element: HTMLElement) => observer.observe(element),
      disconnect: () => observer.disconnect()
    }
  }

  // 节流滚动事件
  const createThrottledScroll = (
    callback: (event: Event) => void,
    delay = 16 // 约 60 FPS
  ) => {
    let timeoutId: NodeJS.Timeout | null = null
    let lastExecTime = 0

    return (event: Event) => {
      const currentTime = Date.now()

      if (currentTime - lastExecTime > delay) {
        callback(event)
        lastExecTime = currentTime
      } else {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          callback(event)
          lastExecTime = Date.now()
        }, delay)
      }
    }
  }

  // 预加载关键资源
  const preloadResource = (url: string, type: 'script' | 'style' | 'image' | 'font' = 'image') => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url

    switch (type) {
      case 'script':
        link.as = 'script'
        break
      case 'style':
        link.as = 'style'
        break
      case 'image':
        link.as = 'image'
        break
      case 'font':
        link.as = 'font'
        link.crossOrigin = 'anonymous'
        break
    }

    document.head.appendChild(link)
  }

  // 清理性能警告
  const clearWarnings = () => {
    performanceWarnings.value = []
  }

  // 性能等级评估
  const performanceLevel = computed(() => {
    const avgFps = metrics.value.fps.average
    const memoryUsage = metrics.value.memory.percentage

    if (avgFps >= 50 && memoryUsage < 50) return 'excellent'
    if (avgFps >= 30 && memoryUsage < 70) return 'good'
    if (avgFps >= 20 && memoryUsage < 85) return 'fair'
    return 'poor'
  })

  // 是否为低性能设备
  const isLowEndDevice = computed(() => {
    const { memory, cores } = metrics.value.device
    return memory <= 2 || cores <= 2 // 2GB 内存或 2 核以下
  })

  // 生命周期
  onMounted(() => {
    // 自动开始监控
    nextTick(() => {
      startMonitoring()
    })
  })

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    // 状态
    metrics: readonly(metrics),
    isMonitoring: readonly(isMonitoring),
    performanceWarnings: readonly(performanceWarnings),
    performanceLevel,
    isLowEndDevice,

    // 监控控制
    startMonitoring,
    stopMonitoring,
    clearWarnings,

    // 优化工具
    optimizeImage,
    createLazyImage,
    createThrottledScroll,
    preloadResource,

    // 工具方法
    getMemoryUsage,
    getNetworkInfo,
    getDeviceInfo
  }
}

// 简化版本：只监控内存和网络
export function useLightweightPerformance() {
  const { metrics, isLowEndDevice, getMemoryUsage, getNetworkInfo } = useMobilePerformance()

  return {
    memory: computed(() => metrics.value.memory),
    network: computed(() => metrics.value.network),
    isLowEndDevice,
    getMemoryUsage,
    getNetworkInfo
  }
}