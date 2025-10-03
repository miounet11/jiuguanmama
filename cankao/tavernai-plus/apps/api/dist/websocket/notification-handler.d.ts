import { WebSocketServer } from './index';
/**
 * WebSocket Notification Handler (T070)
 * Handles real-time notification delivery via Socket.IO
 */
export declare class NotificationHandler {
    private wsServer;
    private notificationService;
    constructor(wsServer: WebSocketServer);
    /**
     * Send notification to specific user via WebSocket
     */
    sendNotificationToUser(userId: string, notification: {
        id: string;
        title: string;
        message: string;
        type: string;
        priority: string;
        actionUrl?: string;
        createdAt: Date;
    }): Promise<void>;
    /**
     * Broadcast notification to all online users
     */
    broadcastNotification(notification: {
        id: string;
        title: string;
        message: string;
        type: string;
        priority: string;
        createdAt: Date;
    }): Promise<void>;
    /**
     * Send notification to multiple users
     */
    sendNotificationToUsers(userIds: string[], notification: {
        id: string;
        title: string;
        message: string;
        type: string;
        priority: string;
        actionUrl?: string;
        createdAt: Date;
    }): Promise<void>;
    /**
     * Handle notification mark as read event
     */
    handleMarkAsRead(userId: string, notificationId: string): void;
    /**
     * Handle notification deletion event
     */
    handleNotificationDelete(userId: string, notificationId: string): void;
    /**
     * Send unread count update to user
     */
    sendUnreadCountUpdate(userId: string, unreadCount: number): Promise<void>;
    /**
     * Create and send notification (convenience method)
     */
    createAndSend(params: {
        userId: string;
        title: string;
        message: string;
        type: string;
        priority?: string;
        actionUrl?: string;
        metadata?: any;
    }): Promise<void>;
    /**
     * Send system alert to administrators
     */
    sendSystemAlert(params: {
        title: string;
        message: string;
        severity: 'info' | 'warning' | 'error' | 'critical';
        metadata?: any;
    }): Promise<void>;
    /**
     * Setup notification event listeners
     */
    setupEventListeners(): void;
}
export default NotificationHandler;
//# sourceMappingURL=notification-handler.d.ts.map