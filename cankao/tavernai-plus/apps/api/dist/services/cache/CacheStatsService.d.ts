import { EventEmitter } from 'events';
export interface CacheMetrics {
    timestamp: Date;
    hitRate: number;
    missRate: number;
    throughput: number;
    avgResponseTime: number;
    memoryUsage: number;
    memoryUtilization: number;
    keyCount: number;
    evictionRate: number;
    errorRate: number;
}
export interface CacheTierMetrics {
    tier: string;
    hitRate: number;
    size: number;
    capacity: number;
    utilization: number;
    avgAccessTime: number;
    operations: {
        gets: number;
        sets: number;
        deletes: number;
        evictions: number;
    };
}
export interface CacheAlert {
    id: string;
    type: 'high_miss_rate' | 'memory_limit' | 'slow_response' | 'error_rate' | 'eviction_rate';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    value: number;
    threshold: number;
    timestamp: Date;
    resolved: boolean;
}
export interface CacheHealthStatus {
    overall: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
    metrics: CacheMetrics;
    tiers: CacheTierMetrics[];
}
export declare class CacheStatsService extends EventEmitter {
    private metrics;
    private alerts;
    private collectionInterval;
    private maxMetricsHistory;
    private thresholds;
    private lastMetrics;
    constructor();
    /**
     * Start metrics collection
     */
    private startCollection;
    /**
     * Setup cache event listeners
     */
    private setupCacheEventListeners;
    /**
     * Collect current cache metrics
     */
    collectMetrics(): Promise<CacheMetrics>;
    /**
     * Get current cache health status
     */
    getHealthStatus(): Promise<CacheHealthStatus>;
    /**
     * Get metrics history
     */
    getMetricsHistory(hours?: number, resolution?: 'minute' | 'hour'): CacheMetrics[];
    /**
     * Get active alerts
     */
    getActiveAlerts(): CacheAlert[];
    /**
     * Get alert history
     */
    getAlertHistory(hours?: number): CacheAlert[];
    /**
     * Resolve alert
     */
    resolveAlert(alertId: string): boolean;
    /**
     * Set custom thresholds
     */
    setThresholds(thresholds: Partial<typeof this.thresholds>): void;
    /**
     * Get performance insights
     */
    getPerformanceInsights(): {
        insights: string[];
        optimizations: string[];
        trends: Record<string, 'improving' | 'stable' | 'degrading'>;
    };
    private checkAlerts;
    private createAlert;
    private checkEvictionRate;
    private calculateMemoryUtilization;
    private calculateErrorRate;
    private average;
    private getTrend;
    /**
     * Shutdown the stats service
     */
    shutdown(): void;
}
export declare const cacheStatsService: CacheStatsService;
//# sourceMappingURL=CacheStatsService.d.ts.map