// 性能预算监控工具 - Issue #36
interface PerformanceBudget {
  name: string
  limit: number
  current?: number
  unit: string
  critical: boolean
}

interface BundleAnalysis {
  totalSize: number
  chunks: Array<{
    name: string
    size: number
    type: 'vendor' | 'app' | 'async'
  }>
  recommendations: string[]
}

export class PerformanceBudgetMonitor {
  private budgets: PerformanceBudget[] = [
    { name: 'Bundle Size', limit: 8 * 1024 * 1024, unit: 'bytes', critical: true },
    { name: 'Load Time', limit: 2000, unit: 'ms', critical: true },
    { name: 'LCP', limit: 2500, unit: 'ms', critical: true },
    { name: 'FID', limit: 100, unit: 'ms', critical: true },
    { name: 'CLS', limit: 0.1, unit: 'score', critical: true },
    { name: 'Memory Usage', limit: 100 * 1024 * 1024, unit: 'bytes', critical: false },
    { name: 'DOM Nodes', limit: 1500, unit: 'count', critical: false }
  ]

  private violations: string[] = []

  // 检查性能预算
  checkBudget(metricName: string, value: number): boolean {
    const budget = this.budgets.find(b => b.name === metricName)
    if (!budget) return true

    budget.current = value
    
    if (value > budget.limit) {
      const violation = `${metricName}: ${this.formatValue(value, budget.unit)} > ${this.formatValue(budget.limit, budget.unit)}`
      this.violations.push(violation)
      
      if (budget.critical) {
        console.error(`🚨 关键性能预算超标: ${violation}`)
      } else {
        console.warn(`⚠️ 性能预算超标: ${violation}`)
      }
      
      return false
    }
    
    return true
  }

  // 分析Bundle大小
  analyzeBundleSize(): BundleAnalysis {
    const chunks = this.getBundleInfo()
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0)
    
    const analysis: BundleAnalysis = {
      totalSize,
      chunks,
      recommendations: []
    }

    // 生成优化建议
    if (totalSize > 8 * 1024 * 1024) {
      analysis.recommendations.push('Bundle总大小超过8MB，建议进一步代码分割')
    }

    const vendorChunk = chunks.find(c => c.type === 'vendor')
    if (vendorChunk && vendorChunk.size > 3 * 1024 * 1024) {
      analysis.recommendations.push('Vendor chunk过大，建议拆分第三方库')
    }

    const largeAsyncChunks = chunks.filter(c => c.type === 'async' && c.size > 1024 * 1024)
    if (largeAsyncChunks.length > 0) {
      analysis.recommendations.push(`发现${largeAsyncChunks.length}个大型异步chunk，建议进一步分割`)
    }

    return analysis
  }

  // 获取Bundle信息（模拟）
  private getBundleInfo() {
    // 在实际环境中，这些信息来自webpack-bundle-analyzer或类似工具
    return [
      { name: 'vue-vendor', size: 800 * 1024, type: 'vendor' as const },
      { name: 'ui-vendor', size: 1200 * 1024, type: 'vendor' as const },
      { name: 'utils-vendor', size: 300 * 1024, type: 'vendor' as const },
      { name: 'app', size: 500 * 1024, type: 'app' as const },
      { name: 'characters', size: 400 * 1024, type: 'async' as const },
      { name: 'studio', size: 600 * 1024, type: 'async' as const },
      { name: 'marketplace', size: 350 * 1024, type: 'async' as const }
    ]
  }

  // 检查运行时性能
  checkRuntimePerformance() {
    // DOM节点数量
    const domNodes = document.querySelectorAll('*').length
    this.checkBudget('DOM Nodes', domNodes)

    // 内存使用（如果可用）
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.checkBudget('Memory Usage', memory.usedJSHeapSize)
    }

    // 长任务检测
    this.detectLongTasks()
  }

  // 检测长任务
  private detectLongTasks() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`检测到长任务: ${entry.duration.toFixed(2)}ms`)
          }
        }
      })
      
      try {
        observer.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        // longtask可能不被支持
      }
    }
  }

  // 生成性能报告
  generateReport() {
    const bundleAnalysis = this.analyzeBundleSize()
    
    return {
      timestamp: new Date().toISOString(),
      budgets: this.budgets.map(budget => ({
        ...budget,
        status: budget.current ? 
          (budget.current <= budget.limit ? 'pass' : 'fail') : 'pending',
        usage: budget.current ? 
          Math.round((budget.current / budget.limit) * 100) : 0
      })),
      violations: this.violations,
      bundleAnalysis,
      score: this.calculateScore()
    }
  }

  // 计算性能分数
  private calculateScore(): number {
    const criticalBudgets = this.budgets.filter(b => b.critical && b.current !== undefined)
    const passedCritical = criticalBudgets.filter(b => b.current! <= b.limit).length
    
    return criticalBudgets.length > 0 ? 
      Math.round((passedCritical / criticalBudgets.length) * 100) : 100
  }

  // 格式化数值
  private formatValue(value: number, unit: string): string {
    switch (unit) {
      case 'bytes':
        return `${(value / 1024 / 1024).toFixed(2)}MB`
      case 'ms':
        return `${value}ms`
      case 'score':
        return value.toFixed(3)
      case 'count':
        return value.toString()
      default:
        return value.toString()
    }
  }

  // 清除历史记录
  clearHistory() {
    this.violations = []
    this.budgets.forEach(budget => budget.current = undefined)
  }

  // 设置自定义预算
  setBudget(name: string, limit: number, unit: string, critical = false) {
    const existingIndex = this.budgets.findIndex(b => b.name === name)
    if (existingIndex >= 0) {
      this.budgets[existingIndex] = { name, limit, unit, critical }
    } else {
      this.budgets.push({ name, limit, unit, critical })
    }
  }
}

// 单例实例
export const performanceBudget = new PerformanceBudgetMonitor()

// 自动化预算检查
export const enableAutomaticBudgetCheck = () => {
  // 页面加载完成后检查
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceBudget.checkRuntimePerformance()
    }, 1000)
  })

  // 定期检查（每分钟）
  setInterval(() => {
    performanceBudget.checkRuntimePerformance()
  }, 60000)
}
