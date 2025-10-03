/**
 * Monitoring Service (T072)
 * Handles system monitoring, logging, and metrics tracking
 */
export declare class MonitoringService {
    private static instance;
    private constructor();
    static getInstance(): MonitoringService;
    /**
     * Log feature access event
     */
    logFeatureAccess(params: {
        userId: string;
        featureId: string;
        action: 'view' | 'use' | 'unlock' | 'lock';
        metadata?: any;
    }): Promise<void>;
    /**
     * Log feature usage metrics
     */
    logFeatureUsage(params: {
        featureId: string;
        userId: string;
        duration?: number;
        metadata?: any;
    }): Promise<void>;
    /**
     * Track API performance
     */
    trackApiPerformance(params: {
        endpoint: string;
        method: string;
        statusCode: number;
        responseTime: number;
        userId?: string;
    }): Promise<void>;
    /**
     * Log error events
     */
    logError(params: {
        error: Error;
        context: string;
        userId?: string;
        metadata?: any;
    }): Promise<void>;
    /**
     * Log custom metric
     */
    private logMetric;
    /**
     * Get system metrics
     */
    getSystemMetrics(): Promise<{
        usersOnline: number;
        apiRequests: number;
        totalErrors: number;
        avgResponseTime: number;
        aiTokensUsed: number;
        aiCost: number;
        dbConnections: number;
        dbPoolSize: number;
    }>;
    /**
     * Log user activity
     */
    logUserActivity(params: {
        userId: string;
        action: string;
        targetType: string;
        targetId: string;
        metadata?: any;
    }): Promise<void>;
    /**
     * Track feature adoption
     */
    trackFeatureAdoption(featureId: string): Promise<{
        totalUnlocks: number;
        activeUsers: number;
        adoptionRate: number;
    }>;
    /**
     * Get performance summary
     */
    getPerformanceSummary(timeRange?: 'hour' | 'day' | 'week'): Promise<any>;
    /**
     * Create alert
     */
    createAlert(params: {
        title: string;
        message: string;
        severity: 'info' | 'warning' | 'error' | 'critical';
        metadata?: any;
    }): Promise<void>;
    /**
     * Log configuration change
     */
    logConfigChange(params: {
        userId: string;
        configKey: string;
        oldValue: any;
        newValue: any;
        reason?: string;
    }): Promise<void>;
}
export default MonitoringService;
//# sourceMappingURL=monitoring.service.d.ts.map