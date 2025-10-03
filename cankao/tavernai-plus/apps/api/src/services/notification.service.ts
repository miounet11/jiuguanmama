import { PrismaClient } from '../../node_modules/.prisma/client';

const prisma = new PrismaClient();

// Types
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
export class NotificationService {
  /**
   * Create a notification
   */
  async createNotification(data: CreateNotificationInput): Promise<NotificationData | null> {
    try {
      // Check user's notification preferences
      const prefs = await prisma.userPreferenceExtended.findUnique({
        where: { userId: data.userId },
      });

      // Check if notification type is allowed
      if (prefs) {
        if (data.type === 'feature_launch' && !prefs.featureLaunchAlerts) {
          return null; // User disabled feature launch alerts
        }
        if (data.type === 'achievement' && !prefs.achievementAlerts) {
          return null; // User disabled achievement alerts
        }
        if (data.type === 'system' && !prefs.systemAlerts) {
          return null; // User disabled system alerts
        }
      }

      // Create notification
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          description: data.description,
          icon: data.icon || null,
          actionLabel: data.actionLabel || null,
          actionPath: data.actionPath || null,
          priority: data.priority || 'normal',
          read: false,
          archived: false,
        },
      });

      // TODO: Send WebSocket event for real-time notification
      // this.broadcastNotification(notification);

      return this.mapToNotificationData(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  /**
   * Get notifications for a user (paginated)
   */
  async getNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      type?: string;
      priority?: string;
      unreadOnly?: boolean;
    } = {}
  ): Promise<{ notifications: NotificationData[]; total: number }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        userId,
        archived: false,
      };

      if (options.type) {
        where.type = options.type;
      }

      if (options.priority) {
        where.priority = options.priority;
      }

      if (options.unreadOnly) {
        where.read = false;
      }

      // Get notifications
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
          skip,
          take: limit,
        }),
        prisma.notification.count({ where }),
      ]);

      return {
        notifications: notifications.map(n => this.mapToNotificationData(n)),
        total,
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      return { notifications: [], total: 0 };
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await prisma.notification.count({
        where: {
          userId,
          read: false,
          archived: false,
        },
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          read: false,
          archived: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      return result.count;
    } catch (error) {
      console.error('Error marking all as read:', error);
      return 0;
    }
  }

  /**
   * Archive a notification
   */
  async archiveNotification(userId: string, notificationId: string): Promise<boolean> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId,
        },
        data: {
          archived: true,
        },
      });

      return true;
    } catch (error) {
      console.error('Error archiving notification:', error);
      return false;
    }
  }

  /**
   * Delete old archived notifications (cleanup)
   */
  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.notification.deleteMany({
        where: {
          archived: true,
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      return 0;
    }
  }

  /**
   * Get notification statistics
   */
  async getStats(userId: string): Promise<NotificationStats> {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          archived: false,
        },
        select: {
          type: true,
          priority: true,
          read: true,
        },
      });

      const stats: NotificationStats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        byType: {},
        byPriority: {},
      };

      // Count by type
      for (const n of notifications) {
        stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
      }

      // Count by priority
      for (const n of notifications) {
        stats.byPriority[n.priority] = (stats.byPriority[n.priority] || 0) + 1;
      }

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        total: 0,
        unread: 0,
        byType: {},
        byPriority: {},
      };
    }
  }

  /**
   * Broadcast notification (WebSocket)
   * TODO: Implement WebSocket broadcasting
   */
  async broadcastNotification(notification: NotificationData): Promise<void> {
    // This would use Socket.IO or similar to send real-time notifications
    // Example:
    // io.to(`user:${notification.userId}`).emit('notification', notification);
    console.log('Broadcasting notification:', notification.id);
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: {
      featureLaunchAlerts?: boolean;
      achievementAlerts?: boolean;
      systemAlerts?: boolean;
    }
  ): Promise<boolean> {
    try {
      await prisma.userPreferenceExtended.upsert({
        where: { userId },
        update: preferences,
        create: {
          userId,
          ...preferences,
        },
      });

      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  /**
   * Map database notification to NotificationData
   */
  private mapToNotificationData(notification: any): NotificationData {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      description: notification.description,
      icon: notification.icon || undefined,
      action:
        notification.actionLabel && notification.actionPath
          ? {
              label: notification.actionLabel,
              path: notification.actionPath,
            }
          : undefined,
      priority: notification.priority,
      read: notification.read,
      archived: notification.archived,
      createdAt: notification.createdAt,
      readAt: notification.readAt || undefined,
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
