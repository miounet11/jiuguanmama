"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationHandler = void 0;
const notification_service_1 = require("../services/notification.service");
/**
 * WebSocket Notification Handler (T070)
 * Handles real-time notification delivery via Socket.IO
 */
class NotificationHandler {
    wsServer;
    notificationService;
    constructor(wsServer) {
        this.wsServer = wsServer;
        this.notificationService = notification_service_1.NotificationService.getInstance();
    }
    /**
     * Send notification to specific user via WebSocket
     */
    async sendNotificationToUser(userId, notification) {
        // Send via WebSocket
        this.wsServer.sendToUser(userId, 'notification:new', {
            notification,
            timestamp: new Date().toISOString(),
        });
        console.log(`[WebSocket] Notification sent to user ${userId}:`, notification.title);
    }
    /**
     * Broadcast notification to all online users
     */
    async broadcastNotification(notification) {
        this.wsServer.broadcast('notification:broadcast', {
            notification,
            timestamp: new Date().toISOString(),
        });
        console.log('[WebSocket] Notification broadcast:', notification.title);
    }
    /**
     * Send notification to multiple users
     */
    async sendNotificationToUsers(userIds, notification) {
        for (const userId of userIds) {
            await this.sendNotificationToUser(userId, notification);
        }
    }
    /**
     * Handle notification mark as read event
     */
    handleMarkAsRead(userId, notificationId) {
        // Notify user's other sessions about read status
        this.wsServer.sendToUser(userId, 'notification:read', {
            notificationId,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Handle notification deletion event
     */
    handleNotificationDelete(userId, notificationId) {
        this.wsServer.sendToUser(userId, 'notification:deleted', {
            notificationId,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Send unread count update to user
     */
    async sendUnreadCountUpdate(userId, unreadCount) {
        this.wsServer.sendToUser(userId, 'notification:unread_count', {
            count: unreadCount,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Create and send notification (convenience method)
     */
    async createAndSend(params) {
        try {
            // Create notification in database
            const result = await this.notificationService.createNotification({
                userId: params.userId,
                title: params.title,
                message: params.message,
                type: params.type,
                priority: params.priority || 'normal',
                actionUrl: params.actionUrl,
                metadata: params.metadata,
            });
            if (result.success && result.data) {
                // Send via WebSocket
                await this.sendNotificationToUser(params.userId, {
                    id: result.data.id,
                    title: result.data.title,
                    message: result.data.message,
                    type: result.data.type,
                    priority: result.data.priority,
                    actionUrl: result.data.actionUrl || undefined,
                    createdAt: result.data.createdAt,
                });
            }
        }
        catch (error) {
            console.error('[NotificationHandler] Error creating and sending notification:', error);
        }
    }
    /**
     * Send system alert to administrators
     */
    async sendSystemAlert(params) {
        try {
            // Get all admin users
            const { PrismaClient } = require('../../node_modules/.prisma/client');
            const prisma = new PrismaClient();
            const admins = await prisma.user.findMany({
                where: { role: 'admin' },
                select: { id: true },
            });
            // Create notifications for all admins
            for (const admin of admins) {
                await this.createAndSend({
                    userId: admin.id,
                    title: params.title,
                    message: params.message,
                    type: 'system_alert',
                    priority: params.severity === 'critical' ? 'urgent' : params.severity === 'error' ? 'high' : 'normal',
                    metadata: params.metadata,
                });
            }
            await prisma.$disconnect();
        }
        catch (error) {
            console.error('[NotificationHandler] Error sending system alert:', error);
        }
    }
    /**
     * Setup notification event listeners
     */
    setupEventListeners() {
        // Listen for notification service events if available
        console.log('[NotificationHandler] Event listeners setup complete');
    }
}
exports.NotificationHandler = NotificationHandler;
exports.default = NotificationHandler;
//# sourceMappingURL=notification-handler.js.map