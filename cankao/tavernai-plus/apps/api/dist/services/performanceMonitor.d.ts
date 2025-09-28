import { EventEmitter } from 'events';
export interface PerformanceMetrics {
    timestamp: Date;
    cpu: {
        usage: number;
        loadAverage: number[];
    };
    memory: {
        used: number;
        total: number;
        usage: number;
        heap: {
            used: number;
            total: number;
        };
    };
    database: {
        connections: number;
        queryTime: number;
        errorRate: number;
    };
    api: {
        requestCount: number;
        responseTime: number;
        errorRate: number;
    };
    cache: {
        hitRate: number;
        memoryUsage: number;
    };
    recommendation: {
        requestCount: number;
        avgResponseTime: number;
        clickRate: number;
    };
}
export interface Alert {
    id: string;
    type: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
    metric: string;
    value: number;
    threshold: number;
}
export declare class PerformanceMonitor extends EventEmitter {
    private static instance;
    private metrics;
    private alerts;
    private isMonitoring;
    private intervalId?;
    private requestStats;
    private recommendationStats;
    private readonly thresholds;
    static getInstance(): PerformanceMonitor;
    constructor();
    /**
     * 设置事件监听器
     */
    private setupEventListeners;
    /**
     * 开始监控
     */
    startMonitoring(intervalMs?: number): void;
    /**
     * 停止监控
     */
    stopMonitoring(): void;
    /**
     * 收集性能指标
     */
    private collectMetrics;
    /**
     * 获取CPU使用率
     */
    private getCpuUsage;
    /**
     * 获取数据库指标
     */
    private getDatabaseMetrics;
    /**
     * 获取API指标
     */
    private getApiMetrics;
    /**
     * 获取缓存指标
     */
    private getCacheMetrics;
    /**
     * 获取推荐系统指标
     */
    private getRecommendationMetrics;
    /**
     * 检查阈值并生成告警
     */
    private checkThresholds;
    /**
     * 记录API请求
     */
    recordApiRequest(responseTime: number, isError?: boolean): void;
    /**
     * 记录推荐请求
     */
    recordRecommendationRequest(responseTime: number, wasClicked?: boolean): void;
    /**
     * 获取性能报告
     */
    getPerformanceReport(hoursBack?: number): {
        summary: any;
        metrics: PerformanceMetrics[];
        alerts: Alert[];
        recommendations: string[];
    };
    /**
     * 生成优化建议
     */
    private generateRecommendations;
    /**
     * 获取实时指标
     */
    getCurrentMetrics(): PerformanceMetrics | null;
    /**
     * 获取最近的告警
     */
    getRecentAlerts(count?: number): Alert[];
    /**
     * 清理历史数据
     */
    cleanup(): void;
}
declare const _default: PerformanceMonitor;
export default _default;
//# sourceMappingURL=performanceMonitor.d.ts.map