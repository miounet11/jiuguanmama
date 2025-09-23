import { ref, onMounted, nextTick } from 'vue'

// 性能指标接口
interface PerformanceMetrics {
  loadTime: number
  domContentLoaded: number
  firstPaint: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  firstInputDelay: number
  cumulativeLayoutShift: number
  timeToInteractive: number
}

// 资源加载优化接口
interface ResourceOptimization {
  images: string[]
  scripts: string[]
  stylesheets: string[]
  preconnects: string[]
  prefetches: string[]
}

export function usePerformanceOptimization() {
  // 性能指标
  const metrics = ref<Partial<PerformanceMetrics>>({})
  const isLoading = ref(true)
  const loadProgress = ref(0)

  // 检测浏览器功能支持
  const features = ref({
    webp: false,
    avif: false,
    intersectionObserver: false,
    performanceObserver: false,
    serviceWorker: false,
    webWorker: false
  })

  // 检测图片格式支持
  const checkImageFormatSupport = async () => {
    // 检测WebP支持
    try {
      const webpData = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
      const webpImg = new Image()

      features.value.webp = await new Promise((resolve) => {
        webpImg.onload = () => resolve(webpImg.width === 2)
        webpImg.onerror = () => resolve(false)
        webpImg.src = webpData
      })
    } catch (error) {
      features.value.webp = false
    }

    // 检测AVIF支持
    try {
      const avifData = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
      const avifImg = new Image()

      features.value.avif = await new Promise((resolve) => {
        avifImg.onload = () => resolve(avifImg.width === 2)
        avifImg.onerror = () => resolve(false)
        avifImg.src = avifData
      })
    } catch (error) {
      features.value.avif = false
    }

    // 检测其他API支持
    features.value.intersectionObserver = 'IntersectionObserver' in window
    features.value.performanceObserver = 'PerformanceObserver' in window
    features.value.serviceWorker = 'serviceWorker' in navigator
    features.value.webWorker = typeof Worker !== 'undefined'
  }

  // 获取性能指标
  const collectPerformanceMetrics = () => {
    if (!window.performance) return

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

    if (navigation) {
      metrics.value.loadTime = navigation.loadEventEnd - navigation.fetchStart
      metrics.value.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart
    }

    // 获取Paint指标
    const paintEntries = performance.getEntriesByType('paint')
    paintEntries.forEach(entry => {
      if (entry.name === 'first-paint') {
        metrics.value.firstPaint = entry.startTime
      } else if (entry.name === 'first-contentful-paint') {
        metrics.value.firstContentfulPaint = entry.startTime
      }
    })

    // 使用PerformanceObserver获取更多指标
    if (features.value.performanceObserver) {
      // 监听LCP (Largest Contentful Paint)
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries()
          const lastEntry = entries[entries.length - 1]
          metrics.value.largestContentfulPaint = lastEntry.startTime
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (error) {
        console.warn('LCP observation failed:', error)
      }

      // 监听CLS (Cumulative Layout Shift)
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries() as PerformanceEntry[]) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
          metrics.value.cumulativeLayoutShift = clsValue
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (error) {
        console.warn('CLS observation failed:', error)
      }

      // 监听FID (First Input Delay)
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          const firstInput = entryList.getEntries()[0]
          if (firstInput) {
            metrics.value.firstInputDelay = (firstInput as any).processingStart - firstInput.startTime
          }
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
      } catch (error) {
        console.warn('FID observation failed:', error)
      }
    }
  }

  // 预加载关键资源
  const preloadCriticalResources = (resources: ResourceOptimization) => {
    const head = document.head

    // 预连接到重要域名
    resources.preconnects.forEach(href => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = href
      link.crossOrigin = 'anonymous'
      head.appendChild(link)
    })

    // 预取资源
    resources.prefetches.forEach(href => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = href
      head.appendChild(link)
    })

    // 预加载关键图片
    resources.images.forEach(src => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = src
      head.appendChild(link)
    })

    // 预加载关键脚本
    resources.scripts.forEach(src => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'script'
      link.href = src
      head.appendChild(link)
    })

    // 预加载关键样式表
    resources.stylesheets.forEach(href => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'style'
      link.href = href
      head.appendChild(link)
    })
  }

  // 优化图片加载
  const getOptimizedImageUrl = (originalUrl: string, options: {
    width?: number
    height?: number
    quality?: number
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png'
  } = {}) => {
    // 如果支持现代格式，自动使用
    let format = options.format || 'auto'

    if (format === 'auto') {
      if (features.value.avif) {
        format = 'avif'
      } else if (features.value.webp) {
        format = 'webp'
      } else {
        format = 'jpg'
      }
    }

    // 构建优化后的URL (这里需要根据实际的图片服务进行调整)
    let optimizedUrl = originalUrl

    // 如果是CDN服务，可以添加查询参数
    const params = new URLSearchParams()

    if (options.width) params.set('w', options.width.toString())
    if (options.height) params.set('h', options.height.toString())
    if (options.quality) params.set('q', options.quality.toString())
    if (format !== 'auto') params.set('f', format)

    const queryString = params.toString()
    if (queryString) {
      optimizedUrl = `${originalUrl}${originalUrl.includes('?') ? '&' : '?'}${queryString}`
    }

    return optimizedUrl
  }

  // 懒加载图片
  const setupLazyLoading = () => {
    if (!features.value.intersectionObserver) {
      // 降级处理：立即加载所有图片
      const lazyImages = document.querySelectorAll('img[data-src]')
      lazyImages.forEach((img: HTMLImageElement) => {
        img.src = img.dataset.src || ''
        img.removeAttribute('data-src')
      })
      return
    }

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.dataset.src

          if (src) {
            img.src = src
            img.removeAttribute('data-src')
            img.classList.add('loaded')
            imageObserver.unobserve(img)
          }
        }
      })
    }, {
      rootMargin: '50px' // 提前50px开始加载
    })

    // 观察所有懒加载图片
    const lazyImages = document.querySelectorAll('img[data-src]')
    lazyImages.forEach(img => imageObserver.observe(img))

    return () => imageObserver.disconnect()
  }

  // 节流函数
  const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }) as T
  }

  // 防抖函数
  const debounce = <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): T => {
    let timeoutId: ReturnType<typeof setTimeout>
    return ((...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(this, args), delay)
    }) as T
  }

  // 代码分割和动态导入
  const lazyImportComponent = async <T>(importFn: () => Promise<T>): Promise<T> => {
    try {
      return await importFn()
    } catch (error) {
      console.error('Component lazy import failed:', error)
      throw error
    }
  }

  // 监控内存使用情况
  const monitorMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        usedJSSize: memory.usedJSSize,
        totalJSSize: memory.totalJSSize,
        jsLimit: memory.jsLimit,
        usage: (memory.usedJSSize / memory.jsLimit) * 100
      }
    }
    return null
  }

  // 优化字体加载
  const optimizeFontLoading = (fonts: { family: string; variants: string[] }[]) => {
    fonts.forEach(font => {
      font.variants.forEach(variant => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'font'
        link.type = 'font/woff2'
        link.crossOrigin = 'anonymous'
        link.href = `/fonts/${font.family}-${variant}.woff2`
        document.head.appendChild(link)
      })
    })
  }

  // 首页性能优化设置
  const setupHomePageOptimizations = async () => {
    // 预连接到关键域名
    const criticalResources: ResourceOptimization = {
      preconnects: [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'https://cdn.jsdelivr.net'
      ],
      prefetches: [
        '/api/characters/featured',
        '/api/stats/homepage'
      ],
      images: [
        '/images/hero-background.webp',
        '/images/logo.svg'
      ],
      scripts: [],
      stylesheets: []
    }

    preloadCriticalResources(criticalResources)

    // 优化字体加载
    optimizeFontLoading([
      { family: 'Inter', variants: ['400', '500', '600', '700'] }
    ])

    // 设置懒加载
    await nextTick()
    setupLazyLoading()
  }

  // 获取页面性能分数
  const getPerformanceScore = (): number => {
    let score = 100
    const m = metrics.value

    // LCP评分 (理想 < 2.5s)
    if (m.largestContentfulPaint) {
      if (m.largestContentfulPaint > 4000) score -= 25
      else if (m.largestContentfulPaint > 2500) score -= 15
    }

    // FID评分 (理想 < 100ms)
    if (m.firstInputDelay) {
      if (m.firstInputDelay > 300) score -= 25
      else if (m.firstInputDelay > 100) score -= 15
    }

    // CLS评分 (理想 < 0.1)
    if (m.cumulativeLayoutShift) {
      if (m.cumulativeLayoutShift > 0.25) score -= 25
      else if (m.cumulativeLayoutShift > 0.1) score -= 15
    }

    // FCP评分 (理想 < 1.8s)
    if (m.firstContentfulPaint) {
      if (m.firstContentfulPaint > 3000) score -= 15
      else if (m.firstContentfulPaint > 1800) score -= 10
    }

    return Math.max(0, score)
  }

  // 报告性能数据
  const reportPerformanceData = () => {
    const report = {
      metrics: metrics.value,
      features: features.value,
      score: getPerformanceScore(),
      memory: monitorMemoryUsage(),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    // 发送到分析服务 (可选)
    console.log('Performance Report:', report)

    return report
  }

  // 初始化
  const init = async () => {
    await checkImageFormatSupport()
    collectPerformanceMetrics()

    // 页面加载完成后收集最终指标
    window.addEventListener('load', () => {
      setTimeout(() => {
        collectPerformanceMetrics()
        isLoading.value = false
        loadProgress.value = 100

        // 延迟报告，确保所有指标都被收集
        setTimeout(reportPerformanceData, 2000)
      }, 100)
    })

    // 监听加载进度
    const updateLoadProgress = () => {
      if (document.readyState === 'loading') {
        loadProgress.value = 25
      } else if (document.readyState === 'interactive') {
        loadProgress.value = 75
      } else if (document.readyState === 'complete') {
        loadProgress.value = 100
        isLoading.value = false
      }
    }

    document.addEventListener('readystatechange', updateLoadProgress)
    updateLoadProgress()
  }

  onMounted(() => {
    init()
  })

  return {
    // 状态
    metrics,
    features,
    isLoading,
    loadProgress,

    // 方法
    collectPerformanceMetrics,
    preloadCriticalResources,
    getOptimizedImageUrl,
    setupLazyLoading,
    throttle,
    debounce,
    lazyImportComponent,
    monitorMemoryUsage,
    optimizeFontLoading,
    setupHomePageOptimizations,
    getPerformanceScore,
    reportPerformanceData
  }
}