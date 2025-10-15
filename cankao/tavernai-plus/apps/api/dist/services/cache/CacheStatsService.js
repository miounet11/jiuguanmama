"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheStatsService = exports.CacheStatsService = void 0;
const events_1 = require("events");
const CacheService_1 = require("./CacheService");
const logger_1 = require("../../utils/logger");
class CacheStatsService extends events_1.EventEmitter {
    metrics = [];
    alerts = new Map();
    collectionInterval = null;
    maxMetricsHistory = 1000; // Keep last 1000 data points
    thresholds = {
        hitRate: 0.7, // Alert if hit rate drops below 70%
        memoryUtilization: 0.85, // Alert if memory usage exceeds 85%
        avgResponseTime: 100, // Alert if avg response time exceeds 100ms
        errorRate: 0.05, // Alert if error rate exceeds 5%
        evictionRate: 0.1 // Alert if eviction rate exceeds 10%
    };
    lastMetrics = {
        operations: 0,
        errors: 0,
        evictions: 0,
        timestamp: Date.now()
    };
    constructor() {
        super();
        this.startCollection();
        this.setupCacheEventListeners();
    }
    /**
     * Start metrics collection
     */
    startCollection() {
        this.collectionInterval = setInterval(() => {
            this.collectMetrics();
        }, 60000); // Collect every minute
        logger_1.logger.info('Cache statistics collection started');
    }
    /**
     * Setup cache event listeners
     */
    setupCacheEventListeners() {
        CacheService_1.cacheService.on('cacheHit', (data) => {
            this.emit('cacheHit', data);
        });
        CacheService_1.cacheService.on('cacheMiss', (data) => {
            this.emit('cacheMiss', data);
        });
        CacheService_1.cacheService.on('evicted', (data) => {
            this.emit('evicted', data);
            this.checkEvictionRate();
        });
        CacheService_1.cacheService.on('error', (data) => {
            this.emit('cacheError', data);
        });
    }
    /**
     * Collect current cache metrics
     */
    async collectMetrics() {
        try {
            const stats = CacheService_1.cacheService.getStats();
            const now = Date.now();
            const timeDelta = (now - this.lastMetrics.timestamp) / 1000; // seconds
            // Calculate rates
            const totalOps = stats.hits + stats.misses + stats.sets + stats.deletes;
            const throughput = (totalOps - this.lastMetrics.operations) / timeDelta;
            const evictionRate = (stats.evictions - this.lastMetrics.evictions) / timeDelta;
            const metrics = {
                timestamp: new Date(),
                hitRate: stats.hitRate,
                missRate: 1 - stats.hitRate,
                throughput,
                avgResponseTime: stats.avgAccessTime,
                memoryUsage: stats.memoryUsage,
                memoryUtilization: this.calculateMemoryUtilization(stats.memoryUsage),
                keyCount: stats.totalKeys,
                evictionRate,
                errorRate: this.calculateErrorRate()
            };
            // Store metrics
            this.metrics.push(metrics);
            if (this.metrics.length > this.maxMetricsHistory) {
                this.metrics.shift();
            }
            // Update last metrics
            this.lastMetrics = {
                operations: totalOps,
                errors: 0, // Reset error count
                evictions: stats.evictions,
                timestamp: now
            };
            // Check for alerts
            this.checkAlerts(metrics);
            this.emit('metricsCollected', metrics);
            logger_1.logger.debug('Cache metrics collected', {
                hitRate: metrics.hitRate,
                throughput: metrics.throughput,
                memoryUsage: metrics.memoryUsage
            });
            return metrics;
        }
        catch (error) {
            logger_1.logger.error('Failed to collect cache metrics', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Get current cache health status
     */
    async getHealthStatus() {
        try {
            const currentMetrics = await this.collectMetrics();
            const cacheStats = CacheService_1.cacheService.getStats();
            const issues = [];
            const recommendations = [];
            let overallHealth = 'healthy';
            // Check hit rate
            if (currentMetrics.hitRate < this.thresholds.hitRate) {
                issues.push(`Low cache hit rate: ${(currentMetrics.hitRate * 100).toFixed(1)}%`);
                recommendations.push('Consider adjusting TTL values or cache warming strategies');
                overallHealth = 'warning';
            }
            // Check memory utilization
            if (currentMetrics.memoryUtilization > this.thresholds.memoryUtilization) {
                issues.push(`High memory utilization: ${(currentMetrics.memoryUtilization * 100).toFixed(1)}%`);
                recommendations.push('Consider increasing cache memory limits or reducing TTL');
                overallHealth = currentMetrics.memoryUtilization > 0.95 ? 'critical' : 'warning';
            }
            // Check response time
            if (currentMetrics.avgResponseTime > this.thresholds.avgResponseTime) {
                issues.push(`Slow cache response time: ${currentMetrics.avgResponseTime.toFixed(1)}ms`);
                recommendations.push('Check Redis connection or consider cache optimization');
                overallHealth = 'warning';
            }
            // Check error rate
            if (currentMetrics.errorRate > this.thresholds.errorRate) {
                issues.push(`High error rate: ${(currentMetrics.errorRate * 100).toFixed(1)}%`);
                recommendations.push('Check cache service logs for underlying issues');
                overallHealth = 'critical';
            }
            // Build tier metrics
            const tiers = cacheStats.tiers.map(tier => ({
                tier: tier.name,
                hitRate: tier.stats.hitRate,
                size: tier.stats.memoryUsage,
                capacity: tier.type === 'memory' ? 100 * 1024 * 1024 : 0, // Simplified
                utilization: tier.stats.memoryUsage / (100 * 1024 * 1024), // Simplified
                avgAccessTime: tier.stats.avgAccessTime,
                operations: {
                    gets: tier.stats.hits + tier.stats.misses,
                    sets: tier.stats.sets,
                    deletes: tier.stats.deletes,
                    evictions: tier.stats.evictions
                }
            }));
            return {
                overall: overallHealth,
                issues,
                recommendations,
                metrics: currentMetrics,
                tiers
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get cache health status', {
                error: error instanceof Error ? error.message : String(error)
            });
            return {
                overall: 'critical',
                issues: ['Failed to collect health metrics'],
                recommendations: ['Check cache service availability'],
                metrics: {},
                tiers: []
            };
        }
    }
    /**
     * Get metrics history
     */
    getMetricsHistory(hours = 24, resolution = 'minute') {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        let filteredMetrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff);
        if (resolution === 'hour') {
            // Aggregate by hour
            const hourlyMetrics = new Map();
            filteredMetrics.forEach(metric => {
                const hour = new Date(metric.timestamp);
                hour.setMinutes(0, 0, 0);
                const key = hour.toISOString();
                if (!hourlyMetrics.has(key)) {
                    hourlyMetrics.set(key, []);
                }
                hourlyMetrics.get(key).push(metric);
            });
            // Calculate averages for each hour
            filteredMetrics = Array.from(hourlyMetrics.entries()).map(([hour, metrics]) => {
                return {
                    timestamp: new Date(hour),
                    hitRate: this.average(metrics.map(m => m.hitRate)),
                    missRate: this.average(metrics.map(m => m.missRate)),
                    throughput: this.average(metrics.map(m => m.throughput)),
                    avgResponseTime: this.average(metrics.map(m => m.avgResponseTime)),
                    memoryUsage: this.average(metrics.map(m => m.memoryUsage)),
                    memoryUtilization: this.average(metrics.map(m => m.memoryUtilization)),
                    keyCount: Math.round(this.average(metrics.map(m => m.keyCount))),
                    evictionRate: this.average(metrics.map(m => m.evictionRate)),
                    errorRate: this.average(metrics.map(m => m.errorRate))
                };
            });
        }
        return filteredMetrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
    }
    /**
     * Get alert history
     */
    getAlertHistory(hours = 24) {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        return Array.from(this.alerts.values())
            .filter(alert => alert.timestamp.getTime() > cutoff)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Resolve alert
     */
    resolveAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.resolved = true;
            this.emit('alertResolved', alert);
            return true;
        }
        return false;
    }
    /**
     * Set custom thresholds
     */
    setThresholds(thresholds) {
        this.thresholds = { ...this.thresholds, ...thresholds };
        logger_1.logger.info('Cache alert thresholds updated', this.thresholds);
    }
    /**
     * Get performance insights
     */
    getPerformanceInsights() {
        const recentMetrics = this.getMetricsHistory(6); // Last 6 hours
        const insights = [];
        const optimizations = [];
        const trends = {};
        if (recentMetrics.length >= 2) {
            const latest = recentMetrics[recentMetrics.length - 1];
            const previous = recentMetrics[0];
            // Analyze trends
            trends.hitRate = this.getTrend(latest.hitRate, previous.hitRate);
            trends.responseTime = this.getTrend(previous.avgResponseTime, latest.avgResponseTime);
            trends.throughput = this.getTrend(latest.throughput, previous.throughput);
            // Generate insights
            if (trends.hitRate === 'improving') {
                insights.push('Cache hit rate is improving over time');
            }
            else if (trends.hitRate === 'degrading') {
                insights.push('Cache hit rate is declining');
                optimizations.push('Review cache keys and TTL settings');
            }
            if (trends.responseTime === 'degrading') {
                insights.push('Cache response times are increasing');
                optimizations.push('Check Redis connectivity and network latency');
            }
            if (latest.memoryUtilization > 0.8) {
                insights.push('Memory utilization is high');
                optimizations.push('Consider implementing LRU eviction or increasing memory');
            }
            if (latest.evictionRate > 0.05) {
                insights.push('High eviction rate detected');
                optimizations.push('Increase cache size or optimize TTL values');
            }
        }
        return { insights, optimizations, trends };
    }
    // Private helper methods
    checkAlerts(metrics) {
        // Hit rate alert
        if (metrics.hitRate < this.thresholds.hitRate) {
            this.createAlert('high_miss_rate', 'critical', `Cache hit rate dropped to ${(metrics.hitRate * 100).toFixed(1)}%`, metrics.hitRate, this.thresholds.hitRate);
        }
        // Memory utilization alert
        if (metrics.memoryUtilization > this.thresholds.memoryUtilization) {
            this.createAlert('memory_limit', metrics.memoryUtilization > 0.95 ? 'critical' : 'high', `Memory utilization at ${(metrics.memoryUtilization * 100).toFixed(1)}%`, metrics.memoryUtilization, this.thresholds.memoryUtilization);
        }
        // Response time alert
        if (metrics.avgResponseTime > this.thresholds.avgResponseTime) {
            this.createAlert('slow_response', 'medium', `Average response time: ${metrics.avgResponseTime.toFixed(1)}ms`, metrics.avgResponseTime, this.thresholds.avgResponseTime);
        }
        // Error rate alert
        if (metrics.errorRate > this.thresholds.errorRate) {
            this.createAlert('error_rate', 'high', `Error rate: ${(metrics.errorRate * 100).toFixed(1)}%`, metrics.errorRate, this.thresholds.errorRate);
        }
        // Eviction rate alert
        if (metrics.evictionRate > this.thresholds.evictionRate) {
            this.createAlert('eviction_rate', 'medium', `High eviction rate: ${(metrics.evictionRate * 100).toFixed(1)}%`, metrics.evictionRate, this.thresholds.evictionRate);
        }
    }
    createAlert(type, severity, message, value, threshold) {
        const alertId = `${type}_${Date.now()}`;
        const alert = {
            id: alertId,
            type,
            severity,
            message,
            value,
            threshold,
            timestamp: new Date(),
            resolved: false
        };
        this.alerts.set(alertId, alert);
        this.emit('alertCreated', alert);
        logger_1.logger.warn('Cache alert created', {
            type,
            severity,
            message,
            value,
            threshold
        });
    }
    checkEvictionRate() {
        // Simple eviction rate check based on recent events
        // In a real implementation, this would be more sophisticated
    }
    calculateMemoryUtilization(memoryUsage) {
        // Simplified calculation - in reality, this would be based on actual memory limits
        const maxMemory = 100 * 1024 * 1024; // 100MB
        return Math.min(memoryUsage / maxMemory, 1);
    }
    calculateErrorRate() {
        // Simplified error rate calculation
        return 0; // Would be implemented based on actual error tracking
    }
    average(values) {
        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    }
    getTrend(current, previous) {
        const change = (current - previous) / previous;
        if (Math.abs(change) < 0.05)
            return 'stable';
        return change > 0 ? 'improving' : 'degrading';
    }
    /**
     * Shutdown the stats service
     */
    shutdown() {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.collectionInterval = null;
        }
        this.removeAllListeners();
        logger_1.logger.info('Cache statistics service shut down');
    }
}
exports.CacheStatsService = CacheStatsService;
// Singleton instance
exports.cacheStatsService = new CacheStatsService();
// Graceful shutdown
process.on('SIGTERM', () => {
    exports.cacheStatsService.shutdown();
});
process.on('SIGINT', () => {
    exports.cacheStatsService.shutdown();
});
//# sourceMappingURL=CacheStatsService.js.map