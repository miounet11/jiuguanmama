"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Monitoring Service (T072)
 * Handles system monitoring, logging, and metrics tracking
 */
class MonitoringService {
    static instance;
    constructor() { }
    static getInstance() {
        if (!MonitoringService.instance) {
            MonitoringService.instance = new MonitoringService();
        }
        return MonitoringService.instance;
    }
    /**
     * Log feature access event
     */
    async logFeatureAccess(params) {
        try {
            await prisma.adminAuditLog.create({
                data: {
                    userId: params.userId,
                    action: `feature_${params.action}`,
                    targetType: 'feature',
                    targetId: params.featureId,
                    ipAddress: '',
                    userAgent: '',
                    changes: params.metadata || {},
                },
            });
            // Log metrics
            this.logMetric('feature_access', {
                featureId: params.featureId,
                action: params.action,
                userId: params.userId,
            });
            console.log(`[Monitoring] Feature access logged: ${params.featureId} - ${params.action} by ${params.userId}`);
        }
        catch (error) {
            console.error('[Monitoring] Error logging feature access:', error);
        }
    }
    /**
     * Log feature usage metrics
     */
    async logFeatureUsage(params) {
        try {
            this.logMetric('feature_usage', {
                featureId: params.featureId,
                userId: params.userId,
                duration: params.duration,
                timestamp: new Date().toISOString(),
                ...params.metadata,
            });
            console.log(`[Monitoring] Feature usage logged: ${params.featureId} by ${params.userId}`);
        }
        catch (error) {
            console.error('[Monitoring] Error logging feature usage:', error);
        }
    }
    /**
     * Track API performance
     */
    async trackApiPerformance(params) {
        try {
            this.logMetric('api_performance', {
                endpoint: params.endpoint,
                method: params.method,
                statusCode: params.statusCode,
                responseTime: params.responseTime,
                userId: params.userId,
                timestamp: new Date().toISOString(),
            });
            // Log slow requests (>1s)
            if (params.responseTime > 1000) {
                console.warn(`[Monitoring] Slow API request: ${params.method} ${params.endpoint} - ${params.responseTime}ms`);
            }
            // Log errors
            if (params.statusCode >= 500) {
                console.error(`[Monitoring] API error: ${params.method} ${params.endpoint} - ${params.statusCode}`);
            }
        }
        catch (error) {
            console.error('[Monitoring] Error tracking API performance:', error);
        }
    }
    /**
     * Log error events
     */
    async logError(params) {
        try {
            const errorData = {
                name: params.error.name,
                message: params.error.message,
                stack: params.error.stack,
                context: params.context,
                userId: params.userId,
                timestamp: new Date().toISOString(),
                ...params.metadata,
            };
            this.logMetric('error', errorData);
            console.error(`[Monitoring] Error logged: ${params.context}`, errorData);
            // Create audit log for critical errors
            if (params.userId) {
                await prisma.adminAuditLog.create({
                    data: {
                        userId: params.userId,
                        action: 'error_occurred',
                        targetType: 'system',
                        targetId: params.context,
                        ipAddress: '',
                        userAgent: '',
                        changes: errorData,
                    },
                });
            }
        }
        catch (error) {
            console.error('[Monitoring] Error logging error:', error);
        }
    }
    /**
     * Log custom metric
     */
    logMetric(metricName, data) {
        // In production, this would send to monitoring service (Prometheus, DataDog, etc.)
        // For now, we'll log to console with structured format
        const metric = {
            metric: metricName,
            timestamp: new Date().toISOString(),
            data,
        };
        if (process.env.NODE_ENV === 'production') {
            // TODO: Send to external monitoring service
            console.log(JSON.stringify(metric));
        }
        else {
            console.log(`[Metric] ${metricName}:`, data);
        }
    }
    /**
     * Get system metrics
     */
    async getSystemMetrics() {
        try {
            // These would come from actual monitoring systems in production
            // For now, return sample data
            return {
                usersOnline: 0,
                apiRequests: 0,
                totalErrors: 0,
                avgResponseTime: 0,
                aiTokensUsed: 0,
                aiCost: 0,
                dbConnections: 0,
                dbPoolSize: 10,
            };
        }
        catch (error) {
            console.error('[Monitoring] Error getting system metrics:', error);
            throw error;
        }
    }
    /**
     * Log user activity
     */
    async logUserActivity(params) {
        try {
            await prisma.adminAuditLog.create({
                data: {
                    userId: params.userId,
                    action: params.action,
                    targetType: params.targetType,
                    targetId: params.targetId,
                    ipAddress: '',
                    userAgent: '',
                    changes: params.metadata || {},
                },
            });
            this.logMetric('user_activity', {
                userId: params.userId,
                action: params.action,
                targetType: params.targetType,
                targetId: params.targetId,
            });
        }
        catch (error) {
            console.error('[Monitoring] Error logging user activity:', error);
        }
    }
    /**
     * Track feature adoption
     */
    async trackFeatureAdoption(featureId) {
        try {
            const totalUsers = await prisma.user.count();
            const totalUnlocks = await prisma.featureUnlock.count({
                where: { featureId },
            });
            // Count users who used the feature in last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const activeUsers = await prisma.featureUnlock.count({
                where: {
                    featureId,
                    unlockedAt: {
                        gte: sevenDaysAgo,
                    },
                },
            });
            const adoptionRate = totalUsers > 0 ? (totalUnlocks / totalUsers) * 100 : 0;
            return {
                totalUnlocks,
                activeUsers,
                adoptionRate,
            };
        }
        catch (error) {
            console.error('[Monitoring] Error tracking feature adoption:', error);
            throw error;
        }
    }
    /**
     * Get performance summary
     */
    async getPerformanceSummary(timeRange = 'day') {
        try {
            // In production, this would aggregate from monitoring service
            return {
                timeRange,
                avgResponseTime: 150,
                p95ResponseTime: 300,
                p99ResponseTime: 500,
                errorRate: 0.5,
                requestCount: 10000,
                successRate: 99.5,
            };
        }
        catch (error) {
            console.error('[Monitoring] Error getting performance summary:', error);
            throw error;
        }
    }
    /**
     * Create alert
     */
    async createAlert(params) {
        try {
            // Log the alert
            this.logMetric('alert', {
                title: params.title,
                message: params.message,
                severity: params.severity,
                metadata: params.metadata,
            });
            console.log(`[Monitoring] Alert created: [${params.severity.toUpperCase()}] ${params.title}`);
            // In production, this would trigger notification systems
            // For now, just log
            if (params.severity === 'critical' || params.severity === 'error') {
                console.error(`[ALERT] ${params.title}: ${params.message}`);
            }
            else {
                console.warn(`[ALERT] ${params.title}: ${params.message}`);
            }
        }
        catch (error) {
            console.error('[Monitoring] Error creating alert:', error);
        }
    }
    /**
     * Log configuration change
     */
    async logConfigChange(params) {
        try {
            await prisma.adminAuditLog.create({
                data: {
                    userId: params.userId,
                    action: 'config_change',
                    targetType: 'configuration',
                    targetId: params.configKey,
                    ipAddress: '',
                    userAgent: '',
                    changes: {
                        key: params.configKey,
                        oldValue: params.oldValue,
                        newValue: params.newValue,
                        reason: params.reason,
                    },
                },
            });
            console.log(`[Monitoring] Config change logged: ${params.configKey} by ${params.userId}`);
        }
        catch (error) {
            console.error('[Monitoring] Error logging config change:', error);
        }
    }
}
exports.MonitoringService = MonitoringService;
exports.default = MonitoringService;
//# sourceMappingURL=monitoring.service.js.map