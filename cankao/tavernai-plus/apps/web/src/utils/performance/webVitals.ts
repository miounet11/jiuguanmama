/**
 * Web Vitals 性能监控工具
 * 用于监控和报告 Core Web Vitals 指标
 */

export interface WebVitalsMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  url: string
}

export interface PerformanceReport {
  LCP?: WebVitalsMetric  // Largest Contentful Paint
  FID?: WebVitalsMetric  // First Input Delay
  CLS?: WebVitalsMetric  // Cumulative Layout Shift
  FCP?: WebVitalsMetric  // First Contentful Paint
  TTFB?: WebVitalsMetric // Time to First Byte
}

// Core Web Vitals 阈值标准
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },     // ms
  FID: { good: 100, poor: 300 },       // ms
  CLS: { good: 0.1, poor: 0.25 },      // score
  FCP: { good: 1800, poor: 3000 },     // ms
  TTFB: { good: 800, poor: 1800 }      // ms
}

/**
 * 获取性能指标评级
 */
function getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metricName as keyof typeof THRESHOLDS]
  if (!threshold) return 'good'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

/**
 * 创建性能指标对象
 */
function createMetric(name: string, value: number): WebVitalsMetric {
  return {
    name,
    value,
    rating: getRating(name, value),
    timestamp: Date.now(),
    url: window.location.href
  }
}

/**
 * 获取 LCP (Largest Contentful Paint)
 */
export function getLCP(): Promise<WebVitalsMetric | null> {
  return new Promise((resolve) => {
    if (!('PerformanceObserver' in window)) {
      resolve(null)
      return
    }

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      
      if (lastEntry) {
        resolve(createMetric('LCP', lastEntry.startTime))
        observer.disconnect()
      }
    })

    observer.observe({ entryTypes: ['largest-contentful-paint'] })

    // 10秒后超时
    setTimeout(() => {
      observer.disconnect()
      resolve(null)
    }, 10000)
  })
}

/**
 * 获取 FID (First Input Delay)
 */
export function getFID(): Promise<WebVitalsMetric | null> {
  return new Promise((resolve) => {
    if (!('PerformanceObserver' in window)) {
      resolve(null)
      return
    }

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      
      for (const entry of entries) {
        if (entry.processingStart && entry.startTime) {
          const fid = entry.processingStart - entry.startTime
          resolve(createMetric('FID', fid))
          observer.disconnect()
          return
        }
      }
    })

    observer.observe({ entryTypes: ['first-input'] })

    // 监听第一次用户交互
    const handleFirstInput = () => {
      // FID 会通过 PerformanceObserver 获取
      document.removeEventListener('click', handleFirstInput)
      document.removeEventListener('keydown', handleFirstInput)
    }

    document.addEventListener('click', handleFirstInput, { once: true })
    document.addEventListener('keydown', handleFirstInput, { once: true })
  })
}

/**
 * 获取 CLS (Cumulative Layout Shift)
 */
export function getCLS(): Promise<WebVitalsMetric | null> {
  return new Promise((resolve) => {
    if (!('PerformanceObserver' in window)) {
      resolve(null)
      return
    }

    let clsValue = 0
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      }
    })

    observer.observe({ entryTypes: ['layout-shift'] })

    // 页面可见性变化时计算最终 CLS
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        observer.disconnect()
        resolve(createMetric('CLS', clsValue))
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 10秒后超时
    setTimeout(() => {
      observer.disconnect()
      resolve(createMetric('CLS', clsValue))
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, 10000)
  })
}

/**
 * 获取 FCP (First Contentful Paint)
 */
export function getFCP(): Promise<WebVitalsMetric | null> {
  return new Promise((resolve) => {
    if (!('PerformanceObserver' in window)) {
      // Fallback 到 performance.timing
      const timing = performance.timing
      if (timing.domContentLoadedEventStart && timing.navigationStart) {
        const fcp = timing.domContentLoadedEventStart - timing.navigationStart
        resolve(createMetric('FCP', fcp))
        return
      }
      resolve(null)
      return
    }

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          resolve(createMetric('FCP', entry.startTime))
          observer.disconnect()
          return
        }
      }
    })

    observer.observe({ entryTypes: ['paint'] })

    // 5秒后超时
    setTimeout(() => {
      observer.disconnect()
      resolve(null)
    }, 5000)
  })
}

/**
 * 获取 TTFB (Time to First Byte)
 */
export function getTTFB(): Promise<WebVitalsMetric | null> {
  return new Promise((resolve) => {
    if (!('PerformanceObserver' in window)) {
      // Fallback 到 performance.timing
      const timing = performance.timing
      if (timing.responseStart && timing.navigationStart) {
        const ttfb = timing.responseStart - timing.navigationStart
        resolve(createMetric('TTFB', ttfb))
        return
      }
      resolve(null)
      return
    }

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          if (navEntry.responseStart && navEntry.requestStart) {
            const ttfb = navEntry.responseStart - navEntry.requestStart
            resolve(createMetric('TTFB', ttfb))
            observer.disconnect()
            return
          }
        }
      }
    })

    observer.observe({ entryTypes: ['navigation'] })

    // 5秒后超时
    setTimeout(() => {
      observer.disconnect()
      resolve(null)
    }, 5000)
  })
}

/**
 * 获取完整的性能报告
 */
export async function getWebVitalsReport(): Promise<PerformanceReport> {
  const report: PerformanceReport = {}

  try {
    const [lcp, fid, cls, fcp, ttfb] = await Promise.allSettled([
      getLCP(),
      getFID(),
      getCLS(),
      getFCP(),
      getTTFB()
    ])

    if (lcp.status === 'fulfilled' && lcp.value) report.LCP = lcp.value
    if (fid.status === 'fulfilled' && fid.value) report.FID = fid.value
    if (cls.status === 'fulfilled' && cls.value) report.CLS = cls.value
    if (fcp.status === 'fulfilled' && fcp.value) report.FCP = fcp.value
    if (ttfb.status === 'fulfilled' && ttfb.value) report.TTFB = ttfb.value
  } catch (error) {
    console.warn('获取 Web Vitals 指标失败:', error)
  }

  return report
}

/**
 * 发送性能数据到服务器
 */
export async function sendPerformanceData(report: PerformanceReport) {
  try {
    // 只在生产环境发送数据
    if (import.meta.env.DEV) {
      console.log('🎯 Web Vitals 性能报告:', report)
      return
    }

    // 发送到 API
    await fetch('/api/analytics/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...report,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        url: window.location.href
      })
    })
  } catch (error) {
    console.warn('发送性能数据失败:', error)
  }
}

/**
 * 性能监控初始化
 */
export function initWebVitalsMonitoring() {
  // 页面加载完成后收集指标
  if (document.readyState === 'complete') {
    collectMetrics()
  } else {
    window.addEventListener('load', collectMetrics)
  }
}

async function collectMetrics() {
  // 延迟收集，确保页面完全加载
  setTimeout(async () => {
    const report = await getWebVitalsReport()
    await sendPerformanceData(report)
  }, 1000)
}
