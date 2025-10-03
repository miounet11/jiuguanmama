import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { notificationService } from '../services/notification.service';

const router = Router();

// Validation schemas
const updatePreferencesSchema = z.object({
  featureLaunchAlerts: z.boolean().optional(),
  achievementAlerts: z.boolean().optional(),
  systemAlerts: z.boolean().optional(),
});

/**
 * GET /api/v1/notifications
 * Get paginated notifications for the authenticated user
 */
router.get('/', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      page = '1',
      limit = '20',
      type,
      priority,
      unreadOnly = 'false',
    } = req.query;

    const result = await notificationService.getNotifications(userId, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      type: type as string,
      priority: priority as string,
      unreadOnly: unreadOnly === 'true',
    });

    res.json({
      success: true,
      data: result.notifications,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        totalPages: Math.ceil(result.total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
    });
  }
});

/**
 * GET /api/v1/notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.id;

    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
    });
  }
});

/**
 * PUT /api/v1/notifications/:notificationId/read
 * Mark a notification as read
 */
router.put('/:notificationId/read', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { notificationId } = req.params;

    const success = await notificationService.markAsRead(userId, notificationId);

    if (success) {
      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to mark notification as read',
      });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
    });
  }
});

/**
 * PUT /api/v1/notifications/mark-all-read
 * Mark all notifications as read
 */
router.put('/mark-all-read', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.id;

    const count = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: `${count} notifications marked as read`,
      data: { count },
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
    });
  }
});

/**
 * DELETE /api/v1/notifications/:notificationId
 * Archive a notification
 */
router.delete('/:notificationId', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { notificationId } = req.params;

    const success = await notificationService.archiveNotification(userId, notificationId);

    if (success) {
      res.json({
        success: true,
        message: 'Notification archived',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to archive notification',
      });
    }
  } catch (error) {
    console.error('Error archiving notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive notification',
    });
  }
});

/**
 * POST /api/v1/notifications/preferences
 * Update notification preferences
 */
router.post(
  '/preferences',
  authenticate,
  validate(updatePreferencesSchema),
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.user!.id;
      const preferences = req.body;

      const success = await notificationService.updatePreferences(userId, preferences);

      if (success) {
        res.json({
          success: true,
          message: 'Notification preferences updated',
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to update notification preferences',
        });
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification preferences',
      });
    }
  }
);

/**
 * GET /api/v1/notifications/stats
 * Get notification statistics
 */
router.get('/stats', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.id;

    const stats = await notificationService.getStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification stats',
    });
  }
});

export default router;
