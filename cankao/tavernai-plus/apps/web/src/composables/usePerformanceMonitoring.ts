// 性能监控组合函数 - Issue #36
import { ref, onMounted, onUnmounted } from 'vue'

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  url?: string
}

interface MemoryInfo {
  used: number
  total: number
  limit: number
}

export const usePerformanceMonitoring = () => {
  const metrics = ref<PerformanceMetric[]>([])
  const memoryUsage = ref<MemoryInfo | null>(null)
  const isMonitoring = ref(false)
  
  let memoryInterval: number | null = null

  // Web Vitals监控
  const reportWebVitals = (metric: any) => {
    const perfMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      timestamp: Date.now(),
      url: window.location.pathname
    }
    
    metrics.value.push(perfMetric)
    
    // 警告阈值检查
    const thresholds = {
      CLS: 0.1,
      FID: 100,
      LCP: 2500,
      FCP: 1800,
      TTFB: 600
    }
    
    if (thresholds[metric.name as keyof typeof thresholds] && 
        metric.value > thresholds[metric.name as keyof typeof thresholds]) {
      console.warn(`性能指标超标: ${metric.name} = ${metric.value}`)
    }
    
    // 存储到localStorage（最近100条）
    const stored = JSON.parse(localStorage.getItem('perfMetrics') || '[]')
    stored.push(perfMetric)
    localStorage.setItem('perfMetrics', JSON.stringify(stored.slice(-100)))
  }

  // 内存监控
  const monitorMemory = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      memoryUsage.value = {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576)
      }
      
      // 内存使用率过高警告
      if (memoryUsage.value.used > memoryUsage.value.total * 0.9) {
        console.warn('内存使用率过高:', memoryUsage.value)
      }
    }
  }

  // 开始监控
  const startMonitoring = async () => {
    if (isMonitoring.value) return
    
    isMonitoring.value = true
    
    try {
      // 动态导入web-vitals
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals')
      
      getCLS(reportWebVitals)
      getFID(reportWebVitals)
      getFCP(reportWebVitals)
      getLCP(reportWebVitals)
      getTTFB(reportWebVitals)
      
      // 内存监控（每30秒）
      memoryInterval = setInterval(monitorMemory, 30000)
      monitorMemory() // 立即执行一次
      
      console.log('性能监控已启动')
    } catch (error) {
      console.error('启动性能监控失败:', error)
    }
  }

  // 停止监控
  const stopMonitoring = () => {
    isMonitoring.value = false
    
    if (memoryInterval) {
      clearInterval(memoryInterval)
      memoryInterval = null
    }
    
    console.log('性能监控已停止')
  }

  // 获取性能报告
  const getPerformanceReport = () => {
    const stored = JSON.parse(localStorage.getItem('perfMetrics') || '[]')
    
    const report = {
      currentSession: metrics.value,
      historical: stored,
      memoryUsage: memoryUsage.value,
      summary: {
        avgLCP: calculateAverage(stored.filter(m => m.name === 'LCP')),
        avgFID: calculateAverage(stored.filter(m => m.name === 'FID')),
        avgCLS: calculateAverage(stored.filter(m => m.name === 'CLS')),
        avgFCP: calculateAverage(stored.filter(m => m.name === 'FCP')),
        avgTTFB: calculateAverage(stored.filter(m => m.name === 'TTFB'))
      }
    }
    
    return report
  }

  // 计算平均值
  const calculateAverage = (metrics: PerformanceMetric[]) => {
    if (metrics.length === 0) return 0
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0)
    return Math.round(sum / metrics.length)
  }

  // 清除历史数据
  const clearMetrics = () => {
    metrics.value = []
    localStorage.removeItem('perfMetrics')
  }

  // 生命周期钩子
  onMounted(() => {
    // 如果在生产环境且用户同意，自动启动监控
    if (import.meta.env.PROD && 
        localStorage.getItem('perfMonitoringEnabled') !== 'false') {
      startMonitoring()
    }
  })

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    metrics: readonly(metrics),
    memoryUsage: readonly(memoryUsage),
    isMonitoring: readonly(isMonitoring),
    startMonitoring,
    stopMonitoring,
    getPerformanceReport,
    clearMetrics
  }
}

// 性能预算检查
export const usePerformanceBudget = () => {
  const budgets = {
    bundleSize: 8 * 1024 * 1024, // 8MB
    loadTime: 2000, // 2秒
    lcp: 2500, // 2.5秒
    fid: 100, // 100ms
    cls: 0.1 // 0.1
  }

  const checkBudget = (metric: string, value: number) => {
    const budget = budgets[metric as keyof typeof budgets]
    if (budget && value > budget) {
      console.warn(`性能预算超标: ${metric} = ${value}, 预算: ${budget}`)
      return false
    }
    return true
  }

  return { budgets, checkBudget }
}
