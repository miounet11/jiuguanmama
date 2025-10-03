export interface NotificationData {
    id: string;
    userId: string;
    type: 'feature_launch' | 'achievement' | 'alert' | 'system';
    title: string;
    description: string;
    icon?: string;
    action?: {
        label: string;
        path: string;
    };
    priority: 'low' | 'normal' | 'high' | 'urgent';
    read: boolean;
    archived: boolean;
    createdAt: Date;
    readAt?: Date;
}
export interface CreateNotificationInput {
    userId: string;
    type: 'feature_launch' | 'achievement' | 'alert' | 'system';
    title: string;
    description: string;
    icon?: string;
    actionLabel?: string;
    actionPath?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
}
export interface NotificationStats {
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
}
/**
 * NotificationService
 *
 * Manages real-time notification system.
 * Implements F11 (Real-Time Notification Center) feature.
 */
export declare class NotificationService {
    /**
     * Create a notification
     */
    createNotification(data: CreateNotificationInput): Promise<NotificationData | null>;
    /**
     * Get notifications for a user (paginated)
     */
    getNotifications(userId: string, options?: {
        page?: number;
        limit?: number;
        type?: string;
        priority?: string;
        unreadOnly?: boolean;
    }): Promise<{
        notifications: NotificationData[];
        total: number;
    }>;
    /**
     * Get unread notification count
     */
    getUnreadCount(userId: string): Promise<number>;
    /**
     * Mark notification as read
     */
    markAsRead(userId: string, notificationId: string): Promise<boolean>;
    /**
     * Mark all notifications as read
     */
    markAllAsRead(userId: string): Promise<number>;
    /**
     * Archive a notification
     */
    archiveNotification(userId: string, notificationId: string): Promise<boolean>;
    /**
     * Delete old archived notifications (cleanup)
     */
    deleteOldNotifications(daysOld?: number): Promise<number>;
    /**
     * Get notification statistics
     */
    getStats(userId: string): Promise<NotificationStats>;
    /**
     * Broadcast notification (WebSocket)
     * TODO: Implement WebSocket broadcasting
     */
    broadcastNotification(notification: NotificationData): Promise<void>;
    /**
     * Update notification preferences
     */
    updatePreferences(userId: string, preferences: {
        featureLaunchAlerts?: boolean;
        achievementAlerts?: boolean;
        systemAlerts?: boolean;
    }): Promise<boolean>;
    /**
     * Map database notification to NotificationData
     */
    private mapToNotificationData;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notification.service.d.ts.map