export interface AdminDashboard {
    systemHealth: {
        status: 'healthy' | 'degraded' | 'down';
        uptime: number;
        lastCheck: Date;
    };
    userMetrics: {
        totalUsers: number;
        activeUsers24h: number;
        newUsersToday: number;
        bannedUsers: number;
    };
    contentMetrics: {
        totalCharacters: number;
        totalScenarios: number;
        pendingModeration: number;
        reportedContent: number;
    };
    systemMetrics: {
        totalRequests24h: number;
        averageResponseTime: number;
        errorRate: number;
        databaseSize: number;
    };
}
export interface RealtimeMetrics {
    currentActiveUsers: number;
    requestsPerMinute: number;
    averageResponseTime: number;
    errorCount: number;
    timestamp: Date;
}
export interface Alert {
    id: string;
    type: 'error' | 'warning' | 'info';
    severity: 'low' | 'normal' | 'high' | 'urgent';
    title: string;
    description: string;
    source: string;
    timestamp: Date;
    resolved: boolean;
    resolvedAt?: Date;
    resolvedBy?: string;
}
export interface ModerationQueueItem {
    id: string;
    type: 'character' | 'scenario' | 'comment' | 'post';
    resourceId: string;
    reportReason: string;
    reportedBy: string;
    reportedAt: Date;
    status: 'pending' | 'approved' | 'rejected' | 'flagged';
    content: {
        title: string;
        description: string;
        creatorId: string;
        creatorName: string;
    };
}
export interface AuditLogEntry {
    id: string;
    adminId: string;
    adminName: string;
    action: string;
    resource: string;
    changes: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}
/**
 * AdminConsoleService
 *
 * Manages admin console functionality: monitoring, moderation, system health.
 * Implements F6 (Admin System Console) feature.
 */
export declare class AdminConsoleService {
    /**
     * Get admin dashboard overview
     */
    getAdminDashboard(adminId: string): Promise<AdminDashboard | null>;
    /**
     * Get realtime metrics
     */
    getRealtimeMetrics(adminId: string): Promise<RealtimeMetrics | null>;
    /**
     * Get system alerts
     */
    getAlerts(adminId: string, options?: {
        severity?: string;
        resolved?: boolean;
        limit?: number;
    }): Promise<Alert[]>;
    /**
     * Resolve an alert
     */
    resolveAlert(adminId: string, alertId: string): Promise<boolean>;
    /**
     * Get moderation queue
     */
    getModerationQueue(adminId: string, options?: {
        type?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        items: ModerationQueueItem[];
        total: number;
    }>;
    /**
     * Process moderation item
     */
    processModerationItem(adminId: string, itemId: string, action: 'approve' | 'reject' | 'flag', reason?: string): Promise<boolean>;
    /**
     * Ban/unban user
     */
    banUser(adminId: string, userId: string, reason: string, duration?: number): Promise<boolean>;
    /**
     * Get audit logs
     */
    getAuditLogs(adminId: string, options?: {
        action?: string;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
    }): Promise<{
        logs: AuditLogEntry[];
        total: number;
    }>;
    /**
     * Log admin action
     */
    logAdminAction(adminId: string, action: string, resource: string, changes: Record<string, any>, metadata?: {
        ipAddress?: string;
        userAgent?: string;
    }): Promise<void>;
    /**
     * Get system configuration
     */
    getSystemConfig(adminId: string): Promise<Record<string, any> | null>;
    /**
     * Update system configuration
     */
    updateSystemConfig(adminId: string, config: Record<string, any>): Promise<boolean>;
}
export declare const adminConsoleService: AdminConsoleService;
//# sourceMappingURL=admin-console.service.d.ts.map