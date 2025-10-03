/**
 * 前端性能监控工具
 * 监控Core Web Vitals、用户体验指标、资源加载性能
 */

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent: string;
}

interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: string;
  cached: boolean;
}

interface UserInteractionMetric {
  type: 'click' | 'scroll' | 'navigation' | 'input';
  target: string;
  duration: number;
  timestamp: number;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private interactions: UserInteractionMetric[] = [];
  private observer: PerformanceObserver | null = null;
  private isEnabled = true;
  private reportingEndpoint = '/api/analytics/performance';
  private batchSize = 10;
  private reportingInterval = 30000; // 30 seconds
  private reportingTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * 初始化性能监控
   */
  private initializeMonitoring(): void {
    if (!this.isEnabled || typeof window === 'undefined') {
      return;
    }

    try {
      // 监控Core Web Vitals
      this.monitorCoreWebVitals();

      // 监控资源加载性能
      this.monitorResourceLoading();

      // 监控用户交互性能
      this.monitorUserInteractions();

      // 监控内存使用
      this.monitorMemoryUsage();

      // 监控路由性能
      this.monitorRouteChanges();

      // 开始定期报告
      this.startPeriodicReporting();

      console.log('🔍 性能监控已启动');
    } catch (error) {
      console.error('性能监控初始化失败:', error);
    }
  }

  /**
   * 监控Core Web Vitals
   */
  private monitorCoreWebVitals(): void {
    if (!('PerformanceObserver' in window)) {
      console.warn('当前浏览器不支持PerformanceObserver');
      return;
    }

    try {
      // Largest Contentful Paint (LCP)
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        this.recordMetric({
          name: 'LCP',
          value: lastEntry.startTime,
          rating: this.getRating('LCP', lastEntry.startTime),
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        });
      });

      this.observer.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-input') {
            const fid = (entry as any).processingStart - entry.startTime;

            this.recordMetric({
              name: 'FID',
              value: fid,
              rating: this.getRating('FID', fid),
              timestamp: Date.now(),
              url: window.location.href,
              userAgent: navigator.userAgent,
            });
          }
        }
      });

      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }

        this.recordMetric({
          name: 'CLS',
          value: clsValue,
          rating: this.getRating('CLS', clsValue),
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        });
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric({
              name: 'FCP',
              value: entry.startTime,
              rating: this.getRating('FCP', entry.startTime),
              timestamp: Date.now(),
              url: window.location.href,
              userAgent: navigator.userAgent,
            });
          }
        }
      });

      fcpObserver.observe({ entryTypes: ['paint'] });

    } catch (error) {
      console.error('Core Web Vitals监控设置失败:', error);
    }
  }

  /**
   * 监控资源加载性能
   */
  private monitorResourceLoading(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];

        entries.forEach((entry) => {
          const resourceInfo: ResourceTiming = {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize || 0,
            type: this.getResourceType(entry.name),
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
          };

          // 记录慢资源
          if (resourceInfo.duration > 1000) {
            console.warn('慢资源检测:', resourceInfo);
            this.recordSlowResource(resourceInfo);
          }

          // 记录大文件
          if (resourceInfo.size > 1024 * 1024) { // > 1MB
            console.warn('大文件检测:', resourceInfo);
            this.recordLargeResource(resourceInfo);
          }
        });
      });

      resourceObserver.observe({ entryTypes: ['resource'] });

      // 监控导航性能
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceNavigationTiming[];

        entries.forEach((entry) => {
          const navigationMetrics = {
            DNS: entry.domainLookupEnd - entry.domainLookupStart,
            TCP: entry.connectEnd - entry.connectStart,
            SSL: entry.connectEnd - entry.secureConnectionStart,
            TTFB: entry.responseStart - entry.requestStart,
            Download: entry.responseEnd - entry.responseStart,
            DOMParse: entry.domContentLoadedEventStart - entry.responseEnd,
            DOMReady: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            FullLoad: entry.loadEventEnd - entry.loadEventStart,
          };

          this.recordNavigationMetrics(navigationMetrics);
        });
      });

      navigationObserver.observe({ entryTypes: ['navigation'] });

    } catch (error) {
      console.error('资源加载监控设置失败:', error);
    }
  }

  /**
   * 监控用户交互性能
   */
  private monitorUserInteractions(): void {
    // 监控点击响应时间
    document.addEventListener('click', (event) => {
      const startTime = performance.now();
      const target = (event.target as Element)?.tagName || 'unknown';

      // 使用requestAnimationFrame来测量渲染时间
      requestAnimationFrame(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.interactions.push({
          type: 'click',
          target,
          duration,
          timestamp: Date.now(),
        });

        // 记录慢响应
        if (duration > 100) {
          console.warn('慢点击响应:', { target, duration });
        }
      });
    });

    // 监控滚动性能
    let scrollStartTime = 0;
    let scrollTimeout: NodeJS.Timeout;

    document.addEventListener('scroll', () => {
      if (scrollStartTime === 0) {
        scrollStartTime = performance.now();
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const duration = performance.now() - scrollStartTime;

        this.interactions.push({
          type: 'scroll',
          target: 'document',
          duration,
          timestamp: Date.now(),
        });

        scrollStartTime = 0;
      }, 100);
    });

    // 监控输入响应时间
    document.addEventListener('input', (event) => {
      const startTime = performance.now();
      const target = (event.target as HTMLElement)?.tagName || 'unknown';

      setTimeout(() => {
        const duration = performance.now() - startTime;

        this.interactions.push({
          type: 'input',
          target,
          duration,
          timestamp: Date.now(),
        });

        if (duration > 50) {
          console.warn('输入延迟:', { target, duration });
        }
      }, 0);
    });
  }

  /**
   * 监控内存使用
   */
  private monitorMemoryUsage(): void {
    if (!('memory' in performance)) {
      console.warn('当前浏览器不支持内存监控');
      return;
    }

    const checkMemory = () => {
      try {
        const memory = (performance as any).memory as MemoryInfo;

        const memoryUsage = {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
        };

        // 内存使用预警
        if (memoryUsage.used > memoryUsage.limit * 0.8) {
          console.warn('内存使用率过高:', memoryUsage);
          this.recordMetric({
            name: 'HIGH_MEMORY_USAGE',
            value: memoryUsage.used,
            rating: 'poor',
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          });
        }

        // 定期记录内存使用情况
        this.recordMetric({
          name: 'MEMORY_USAGE',
          value: memoryUsage.used,
          rating: memoryUsage.used < 50 ? 'good' : memoryUsage.used < 100 ? 'needs-improvement' : 'poor',
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        });

      } catch (error) {
        console.error('内存监控失败:', error);
      }
    };

    // 每30秒检查一次内存使用
    setInterval(checkMemory, 30000);

    // 立即检查一次
    checkMemory();
  }

  /**
   * 监控路由变化性能
   */
  private monitorRouteChanges(): void {
    let routeStartTime = performance.now();

    // 监听历史记录变化
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      routeStartTime = performance.now();
      return originalPushState.apply(this, args);
    };

    history.replaceState = function(...args) {
      routeStartTime = performance.now();
      return originalReplaceState.apply(this, args);
    };

    // 监听路由完成
    window.addEventListener('popstate', () => {
      routeStartTime = performance.now();
    });

    // 监听DOM变化作为路由完成的指标
    if ('MutationObserver' in window) {
      const observer = new MutationObserver(() => {
        if (routeStartTime > 0) {
          const routeDuration = performance.now() - routeStartTime;

          this.recordMetric({
            name: 'ROUTE_CHANGE',
            value: routeDuration,
            rating: routeDuration < 300 ? 'good' : routeDuration < 1000 ? 'needs-improvement' : 'poor',
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          });

          routeStartTime = 0;
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  /**
   * 记录性能指标
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // 保持最近1000个指标
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // 实时警告
    if (metric.rating === 'poor') {
      console.warn(`性能警告 - ${metric.name}:`, metric);
    }

    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('performance-metric', {
      detail: metric,
    }));
  }

  /**
   * 获取性能评级
   */
  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
    };

    const threshold = thresholds[metricName as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * 获取资源类型
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.webp')) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    if (url.includes('api/')) return 'api';
    return 'other';
  }

  /**
   * 记录慢资源
   */
  private recordSlowResource(resource: ResourceTiming): void {
    this.recordMetric({
      name: 'SLOW_RESOURCE',
      value: resource.duration,
      rating: 'poor',
      timestamp: Date.now(),
      url: resource.name,
      userAgent: navigator.userAgent,
    });
  }

  /**
   * 记录大文件
   */
  private recordLargeResource(resource: ResourceTiming): void {
    this.recordMetric({
      name: 'LARGE_RESOURCE',
      value: resource.size,
      rating: 'needs-improvement',
      timestamp: Date.now(),
      url: resource.name,
      userAgent: navigator.userAgent,
    });
  }

  /**
   * 记录导航指标
   */
  private recordNavigationMetrics(metrics: any): void {
    Object.entries(metrics).forEach(([name, value]) => {
      this.recordMetric({
        name: `NAV_${name}`,
        value: value as number,
        rating: this.getNavigationRating(name, value as number),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });
  }

  /**
   * 获取导航性能评级
   */
  private getNavigationRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      DNS: { good: 50, poor: 200 },
      TCP: { good: 100, poor: 300 },
      TTFB: { good: 200, poor: 600 },
      Download: { good: 500, poor: 1500 },
      DOMParse: { good: 300, poor: 1000 },
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * 开始定期报告
   */
  private startPeriodicReporting(): void {
    this.reportingTimer = setInterval(() => {
      this.reportMetrics();
    }, this.reportingInterval);
  }

  /**
   * 报告性能指标
   */
  private async reportMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    try {
      const metricsToReport = this.metrics.splice(0, this.batchSize);
      const interactionsToReport = this.interactions.splice(0, this.batchSize);

      const payload = {
        metrics: metricsToReport,
        interactions: interactionsToReport,
        sessionId: this.getSessionId(),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      // 使用beacon API优先发送
      if ('sendBeacon' in navigator) {
        navigator.sendBeacon(
          this.reportingEndpoint,
          JSON.stringify(payload)
        );
      } else {
        // 降级到fetch
        await fetch(this.reportingEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

    } catch (error) {
      console.error('性能指标报告失败:', error);
      // 报告失败时将指标放回队列
    }
  }

  /**
   * 获取或生成会话ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('performance-session-id');
    if (!sessionId) {
      sessionId = 'perf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('performance-session-id', sessionId);
    }
    return sessionId;
  }

  /**
   * 手动记录自定义指标
   */
  recordCustomMetric(name: string, value: number, rating?: 'good' | 'needs-improvement' | 'poor'): void {
    this.recordMetric({
      name,
      value,
      rating: rating || 'good',
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): any {
    const now = Date.now();
    const last5Minutes = now - 5 * 60 * 1000;

    const recentMetrics = this.metrics.filter(m => m.timestamp > last5Minutes);
    const recentInteractions = this.interactions.filter(i => i.timestamp > last5Minutes);

    return {
      coreWebVitals: this.getCoreWebVitals(recentMetrics),
      resourcePerformance: this.getResourcePerformance(recentMetrics),
      userInteractions: this.getUserInteractionSummary(recentInteractions),
      memoryUsage: this.getMemoryUsageSummary(recentMetrics),
      navigationPerformance: this.getNavigationSummary(recentMetrics),
      overallScore: this.calculateOverallScore(recentMetrics),
    };
  }

  /**
   * 获取Core Web Vitals摘要
   */
  private getCoreWebVitals(metrics: PerformanceMetric[]): any {
    const coreMetrics = ['LCP', 'FID', 'CLS', 'FCP'];
    const summary: any = {};

    coreMetrics.forEach(metric => {
      const metricData = metrics.filter(m => m.name === metric);
      if (metricData.length > 0) {
        const latest = metricData[metricData.length - 1];
        summary[metric] = {
          value: latest.value,
          rating: latest.rating,
          unit: metric === 'CLS' ? 'score' : 'ms',
        };
      }
    });

    return summary;
  }

  private getResourcePerformance(metrics: PerformanceMetric[]): any {
    const slowResources = metrics.filter(m => m.name === 'SLOW_RESOURCE');
    const largeResources = metrics.filter(m => m.name === 'LARGE_RESOURCE');

    return {
      slowResourcesCount: slowResources.length,
      largeResourcesCount: largeResources.length,
      avgResourceLoadTime: slowResources.length > 0
        ? slowResources.reduce((sum, m) => sum + m.value, 0) / slowResources.length
        : 0,
    };
  }

  private getUserInteractionSummary(interactions: UserInteractionMetric[]): any {
    const clickInteractions = interactions.filter(i => i.type === 'click');
    const avgClickResponseTime = clickInteractions.length > 0
      ? clickInteractions.reduce((sum, i) => sum + i.duration, 0) / clickInteractions.length
      : 0;

    return {
      totalInteractions: interactions.length,
      clickInteractions: clickInteractions.length,
      avgClickResponseTime,
      slowInteractions: interactions.filter(i => i.duration > 100).length,
    };
  }

  private getMemoryUsageSummary(metrics: PerformanceMetric[]): any {
    const memoryMetrics = metrics.filter(m => m.name === 'MEMORY_USAGE');
    if (memoryMetrics.length === 0) return { current: 0, peak: 0 };

    const values = memoryMetrics.map(m => m.value);
    return {
      current: values[values.length - 1],
      peak: Math.max(...values),
      average: values.reduce((sum, v) => sum + v, 0) / values.length,
    };
  }

  private getNavigationSummary(metrics: PerformanceMetric[]): any {
    const navMetrics = metrics.filter(m => m.name.startsWith('NAV_'));
    const routeMetrics = metrics.filter(m => m.name === 'ROUTE_CHANGE');

    return {
      navigationCount: navMetrics.length,
      routeChanges: routeMetrics.length,
      avgRouteChangeTime: routeMetrics.length > 0
        ? routeMetrics.reduce((sum, m) => sum + m.value, 0) / routeMetrics.length
        : 0,
    };
  }

  private calculateOverallScore(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 100;

    const weights = { good: 100, 'needs-improvement': 60, poor: 20 };
    const weightedSum = metrics.reduce((sum, metric) => {
      return sum + weights[metric.rating];
    }, 0);

    return Math.round(weightedSum / metrics.length);
  }

  /**
   * 停止性能监控
   */
  stop(): void {
    this.isEnabled = false;

    if (this.observer) {
      this.observer.disconnect();
    }

    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
    }

    // 发送最后的指标
    if (this.metrics.length > 0) {
      this.reportMetrics();
    }
  }
}

// 创建全局监控实例
const performanceMonitor = new PerformanceMonitor();

// 页面卸载时发送最后的指标
window.addEventListener('beforeunload', () => {
  performanceMonitor.stop();
});

export default performanceMonitor;
export { PerformanceMonitor, PerformanceMetric, ResourceTiming, UserInteractionMetric };