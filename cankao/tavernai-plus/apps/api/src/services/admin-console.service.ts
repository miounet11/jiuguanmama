import { PrismaClient } from '../../node_modules/.prisma/client';

const prisma = new PrismaClient();

// Types
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
export class AdminConsoleService {
  /**
   * Get admin dashboard overview
   */
  async getAdminDashboard(adminId: string): Promise<AdminDashboard | null> {
    try {
      // Verify admin permissions
      const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: { isAdmin: true },
      });

      if (!admin?.isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      // Get user metrics
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const today = new Date(now.setHours(0, 0, 0, 0));

      const [totalUsers, activeUsers24h, newUsersToday, bannedUsers] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            lastLoginAt: {
              gte: yesterday,
            },
          },
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: today,
            },
          },
        }),
        prisma.user.count({
          where: {
            isActive: false,
          },
        }),
      ]);

      // Get content metrics
      const [totalCharacters, totalScenarios] = await Promise.all([
        prisma.character.count(),
        prisma.scenario.count(),
      ]);

      // Placeholder for moderation metrics
      const pendingModeration = 0;
      const reportedContent = 0;

      // Placeholder for system metrics
      const totalRequests24h = 0;
      const averageResponseTime = 0;
      const errorRate = 0;
      const databaseSize = 0;

      return {
        systemHealth: {
          status: 'healthy',
          uptime: process.uptime(),
          lastCheck: new Date(),
        },
        userMetrics: {
          totalUsers,
          activeUsers24h,
          newUsersToday,
          bannedUsers,
        },
        contentMetrics: {
          totalCharacters,
          totalScenarios,
          pendingModeration,
          reportedContent,
        },
        systemMetrics: {
          totalRequests24h,
          averageResponseTime,
          errorRate,
          databaseSize,
        },
      };
    } catch (error) {
      console.error('Error getting admin dashboard:', error);
      return null;
    }
  }

  /**
   * Get realtime metrics
   */
  async getRealtimeMetrics(adminId: string): Promise<RealtimeMetrics | null> {
    try {
      // Verify admin permissions
      const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: { isAdmin: true },
      });

      if (!admin?.isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      // Get active users (logged in within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const currentActiveUsers = await prisma.user.count({
        where: {
          lastLoginAt: {
            gte: fiveMinutesAgo,
          },
        },
      });

      // Placeholder for other metrics
      // In production, these would come from monitoring systems like Prometheus
      return {
        currentActiveUsers,
        requestsPerMinute: 0,
        averageResponseTime: 0,
        errorCount: 0,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error getting realtime metrics:', error);
      return null;
    }
  }

  /**
   * Get system alerts
   */
  async getAlerts(
    adminId: string,
    options: {
      severity?: string;
      resolved?: boolean;
      limit?: number;
    } = {}
  ): Promise<Alert[]> {
    try {
      // Verify admin permissions
      const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: { isAdmin: true },
      });

      if (!admin?.isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      // This would typically come from a monitoring system or alerts table
      // Returning placeholder data
      return [];
    } catch (error) {
      console.error('Error getting alerts:', error);
      return [];
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(adminId: string, alertId: string): Promise<boolean> {
    try {
      // Verify admin permissions
      const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: { isAdmin: true, username: true },
      });

      if (!admin?.isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      // Log the action
      await this.logAdminAction(adminId, 'resolve_alert', `alert:${alertId}`, {
        alertId,
        resolvedAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error('Error resolving alert:', error);
      return false;
    }
  }

  /**
   * Get moderation queue
   */
  async getModerationQueue(
    adminId: string,
    options: {
      type?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ items: ModerationQueueItem[]; total: number }> {
    try {
      // Verify admin permissions
      const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: { isAdmin: true },
      });

      if (!admin?.isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      // This would typically come from a moderation/reports table
      // Returning placeholder data
      return {
        items: [],
        total: 0,
      };
    } catch (error) {
      console.error('Error getting moderation queue:', error);
      return { items: [], total: 0 };
    }
  }

  /**
   * Process moderation item
   */
  async processModerationItem(
    adminId: string,
    itemId: string,
    action: 'approve' | 'reject' | 'flag',
    reason?: string
  ): Promise<boolean> {
    try {
      // Verify admin permissions
      const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: { isAdmin: true },
      });

      if (!admin?.isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      // Log the moderation action
      await this.logAdminAction(adminId, `moderation_${action}`, `moderation:${itemId}`, {
        itemId,
        action,
        reason,
      });

      return true;
    } catch (error) {
      console.error('Error processing moderation item:', error);
      return false;
    }
  }

  /**
   * Ban/unban user
   */
  async banUser(
    adminId: string,
    userId: string,
    reason: string,
    duration?: number
  ): Promise<boolean> {
    try {
      // Verify admin permissions
      const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: { isAdmin: true },
      });

      if (!admin?.isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      // Ban user
      await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
        },
      });

      // Log the action
      await this.logAdminAction(adminId, 'ban_user', `user:${userId}`, {
        userId,
        reason,
        duration,
      });

      // Send notification to user
      await prisma.notification.create({
        data: {
          userId,
          type: 'alert',
          title: '账号已被封禁',
          description: `封禁原因: ${reason}`,
          priority: 'urgent',
        },
      });

      return true;
    } catch (error) {
      console.error('Error banning user:', error);
      return false;
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(
    adminId: string,
    options: {
      action?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ logs: AuditLogEntry[]; total: number }> {
    try {
      // Verify admin permissions
      const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: { isAdmin: true },
      });

      if (!admin?.isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (options.action) {
        where.action = options.action;
      }

      if (options.startDate || options.endDate) {
        where.timestamp = {};
        if (options.startDate) {
          where.timestamp.gte = options.startDate;
        }
        if (options.endDate) {
          where.timestamp.lte = options.endDate;
        }
      }

      // Get audit logs
      const [logs, total] = await Promise.all([
        prisma.adminAuditLog.findMany({
          where,
          include: {
            admin: {
              select: {
                username: true,
              },
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.adminAuditLog.count({ where }),
      ]);

      return {
        logs: logs.map(log => ({
          id: log.id,
          adminId: log.adminId,
          adminName: log.admin.username,
          action: log.action,
          resource: log.resource,
          changes: JSON.parse(log.changes),
          ipAddress: log.ipAddress || undefined,
          userAgent: log.userAgent || undefined,
          timestamp: log.timestamp,
        })),
        total,
      };
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return { logs: [], total: 0 };
    }
  }

  /**
   * Log admin action
   */
  async logAdminAction(
    adminId: string,
    action: string,
    resource: string,
    changes: Record<string, any>,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      await prisma.adminAuditLog.create({
        data: {
          adminId,
          action,
          resource,
          changes: JSON.stringify(changes),
          ipAddress: metadata?.ipAddress || null,
          userAgent: metadata?.userAgent || null,
        },
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }

  /**
   * Get system configuration
   */
  async getSystemConfig(adminId: string): Promise<Record<string, any> | null> {
    try {
      // Verify admin permissions
      const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: { isAdmin: true },
      });

      if (!admin?.isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      // Return system configuration
      // This would typically come from a config table or environment
      return {
        features: {
          registrationEnabled: true,
          maintenanceMode: false,
          aiGenerationEnabled: true,
        },
        limits: {
          maxCharactersPerUser: 100,
          maxScenariosPerUser: 50,
          dailyAiRequests: 100,
        },
        pricing: {
          basicCredits: 100,
          premiumCredits: 1000,
        },
      };
    } catch (error) {
      console.error('Error getting system config:', error);
      return null;
    }
  }

  /**
   * Update system configuration
   */
  async updateSystemConfig(
    adminId: string,
    config: Record<string, any>
  ): Promise<boolean> {
    try {
      // Verify admin permissions
      const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: { isAdmin: true },
      });

      if (!admin?.isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      // Log the configuration change
      await this.logAdminAction(adminId, 'change_config', 'system:config', config);

      // Update configuration
      // This would typically update a config table or environment

      return true;
    } catch (error) {
      console.error('Error updating system config:', error);
      return false;
    }
  }
}

// Export singleton instance
export const adminConsoleService = new AdminConsoleService();
