/**
 * 性能监控组合式函数
 * 用于在 Vue 组件中集成 Web Vitals 监控
 */

import { ref, onMounted, onUnmounted } from 'vue'
import {
  getWebVitalsReport,
  sendPerformanceData,
  type PerformanceReport,
  type WebVitalsMetric
} from '@/utils/performance/webVitals'

export interface PerformanceState {
  isLoading: boolean
  report: PerformanceReport | null
  error: string | null
  score: number
}

export function usePerformanceMonitoring() {
  const state = ref<PerformanceState>({
    isLoading: false,
    report: null,
    error: null,
    score: 0
  })

  /**
   * 计算性能得分
   */
  function calculatePerformanceScore(report: PerformanceReport): number {
    let score = 0
    let count = 0

    // LCP 权重: 25%
    if (report.LCP) {
      count++
      if (report.LCP.rating === 'good') score += 25
      else if (report.LCP.rating === 'needs-improvement') score += 15
      else score += 5
    }

    // FID 权重: 25%
    if (report.FID) {
      count++
      if (report.FID.rating === 'good') score += 25
      else if (report.FID.rating === 'needs-improvement') score += 15
      else score += 5
    }

    // CLS 权重: 25%
    if (report.CLS) {
      count++
      if (report.CLS.rating === 'good') score += 25
      else if (report.CLS.rating === 'needs-improvement') score += 15
      else score += 5
    }

    // FCP 权重: 15%
    if (report.FCP) {
      count++
      if (report.FCP.rating === 'good') score += 15
      else if (report.FCP.rating === 'needs-improvement') score += 10
      else score += 3
    }

    // TTFB 权重: 10%
    if (report.TTFB) {
      count++
      if (report.TTFB.rating === 'good') score += 10
      else if (report.TTFB.rating === 'needs-improvement') score += 6
      else score += 2
    }

    return count > 0 ? Math.round(score / count * 4) : 0 // 转换为 0-100 分
  }

  /**
   * 收集性能指标
   */
  async function collectMetrics() {
    state.value.isLoading = true
    state.value.error = null

    try {
      const report = await getWebVitalsReport()
      state.value.report = report
      state.value.score = calculatePerformanceScore(report)

      // 发送到服务器
      await sendPerformanceData(report)
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '未知错误'
      console.error('性能监控失败:', error)
    } finally {
      state.value.isLoading = false
    }
  }

  /**
   * 获取性能建议
   */
  function getPerformanceAdvice(): string[] {
    const advice: string[] = []
    if (!state.value.report) return advice

    const { LCP, FID, CLS, FCP, TTFB } = state.value.report

    if (LCP?.rating === 'poor') {
      advice.push('🎯 LCP 过慢：考虑优化图片加载、减少渲染阻塞资源')
    }

    if (FID?.rating === 'poor') {
      advice.push('⚡ FID 过高：减少 JavaScript 执行时间，优化事件处理')
    }

    if (CLS?.rating === 'poor') {
      advice.push('📐 CLS 过高：为图片和广告位预留空间，避免布局突变')
    }

    if (FCP?.rating === 'poor') {
      advice.push('🚀 FCP 过慢：优化关键渲染路径，减少阻塞资源')
    }

    if (TTFB?.rating === 'poor') {
      advice.push('🌐 TTFB 过高：优化服务器响应时间，考虑使用 CDN')
    }

    if (advice.length === 0) {
      advice.push('✅ 性能表现良好！继续保持。')
    }

    return advice
  }

  /**
   * 格式化性能指标显示
   */
  function formatMetric(metric: WebVitalsMetric): string {
    switch (metric.name) {
      case 'LCP':
      case 'FCP':
      case 'FID':
      case 'TTFB':
        return metric.value.toFixed(0) + 'ms'
      case 'CLS':
        return metric.value.toFixed(3)
      default:
        return metric.value.toString()
    }
  }

  /**
   * 获取性能等级颜色
   */
  function getRatingColor(rating: string): string {
    switch (rating) {
      case 'good':
        return '#52c41a' // 绿色
      case 'needs-improvement':
        return '#faad14' // 橙色
      case 'poor':
        return '#f5222d' // 红色
      default:
        return '#d9d9d9' // 灰色
    }
  }

  // 页面可见性变化监听
  let visibilityChangeHandler: (() => void) | null = null

  onMounted(() => {
    // 页面加载完成后收集指标
    if (document.readyState === 'complete') {
      setTimeout(collectMetrics, 1000)
    } else {
      window.addEventListener('load', () => {
        setTimeout(collectMetrics, 1000)
      })
    }

    // 监听页面可见性变化
    visibilityChangeHandler = () => {
      if (document.visibilityState === 'hidden') {
        // 页面隐藏时最后一次收集指标
        collectMetrics()
      }
    }
    document.addEventListener('visibilitychange', visibilityChangeHandler)
  })

  onUnmounted(() => {
    if (visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', visibilityChangeHandler)
    }
  })

  return {
    state: state.value,
    collectMetrics,
    getPerformanceAdvice,
    formatMetric,
    getRatingColor,
    calculatePerformanceScore
  }
}
