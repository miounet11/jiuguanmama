import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { requireAdmin } from '../middleware/role-access';
import { auditResolveAlert, auditBanUser, auditChangeConfig } from '../middleware/audit-log';
import { adminConsoleService } from '../services/admin-console.service';

const router = Router();

// Validation schemas
const banUserSchema = z.object({
  userId: z.string(),
  reason: z.string().min(10),
  duration: z.number().optional(),
});

const processModerationSchema = z.object({
  action: z.enum(['approve', 'reject', 'flag']),
  reason: z.string().optional(),
});

const updateConfigSchema = z.object({
  features: z.record(z.boolean()).optional(),
  limits: z.record(z.number()).optional(),
  pricing: z.record(z.number()).optional(),
});

/**
 * GET /api/v1/admin/dashboard
 * Get admin dashboard overview
 */
router.get('/dashboard', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const adminId = req.user!.userId;

    const dashboard = await adminConsoleService.getAdminDashboard(adminId);

    if (!dashboard) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required',
      });
      return;
    }

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error getting admin dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin dashboard',
    });
  }
});

/**
 * GET /api/v1/admin/metrics/realtime
 * Get realtime system metrics
 */
router.get('/metrics/realtime', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const adminId = req.user!.userId;

    const metrics = await adminConsoleService.getRealtimeMetrics(adminId);

    if (!metrics) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required',
      });
      return;
    }

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error getting realtime metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get realtime metrics',
    });
  }
});

/**
 * GET /api/v1/admin/alerts
 * Get system alerts
 */
router.get('/alerts', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const adminId = req.user!.userId;
    const { severity, resolved, limit = '50' } = req.query;

    const alerts = await adminConsoleService.getAlerts(adminId, {
      severity: severity as string,
      resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alerts',
    });
  }
});

/**
 * POST /api/v1/admin/alerts/:alertId/resolve
 * Resolve an alert
 */
router.post('/alerts/:alertId/resolve', authenticate, requireAdmin, auditResolveAlert, async (req: AuthRequest, res): Promise<void> => {
  try {
    const adminId = req.user!.userId;
    const { alertId } = req.params;

    const success = await adminConsoleService.resolveAlert(adminId, alertId);

    if (success) {
      res.json({
        success: true,
        message: 'Alert resolved successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to resolve alert',
      });
    }
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve alert',
    });
  }
});

/**
 * GET /api/v1/admin/moderation/queue
 * Get moderation queue
 */
router.get('/moderation/queue', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const adminId = req.user!.userId;
    const { type, status, page = '1', limit = '20' } = req.query;

    const result = await adminConsoleService.getModerationQueue(adminId, {
      type: type as string,
      status: status as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result.items,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        totalPages: Math.ceil(result.total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Error getting moderation queue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get moderation queue',
    });
  }
});

/**
 * POST /api/v1/admin/moderation/:itemId/process
 * Process moderation item
 */
router.post(
  '/moderation/:itemId/process',
  authenticate,
  validate(processModerationSchema),
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const adminId = req.user!.userId;
      const { itemId } = req.params;
      const { action, reason } = req.body;

      const success = await adminConsoleService.processModerationItem(
        adminId,
        itemId,
        action,
        reason
      );

      if (success) {
        res.json({
          success: true,
          message: `Moderation item ${action}ed successfully`,
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to process moderation item',
        });
      }
    } catch (error) {
      console.error('Error processing moderation item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process moderation item',
      });
    }
  }
);

/**
 * POST /api/v1/admin/users/:userId/ban
 * Ban a user
 */
router.post(
  '/users/:userId/ban',
  authenticate,
  requireAdmin,
  validate(banUserSchema),
  auditBanUser,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const adminId = req.user!.userId;
      const { userId } = req.params;
      const { reason, duration } = req.body;

      const success = await adminConsoleService.banUser(adminId, userId, reason, duration);

      if (success) {
        res.json({
          success: true,
          message: 'User banned successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to ban user',
        });
      }
    } catch (error) {
      console.error('Error banning user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to ban user',
      });
    }
  }
);

/**
 * GET /api/v1/admin/audit-logs
 * Get audit logs
 */
router.get('/audit-logs', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const adminId = req.user!.userId;
    const { action, startDate, endDate, page = '1', limit = '50' } = req.query;

    const result = await adminConsoleService.getAuditLogs(adminId, {
      action: action as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        totalPages: Math.ceil(result.total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get audit logs',
    });
  }
});

/**
 * GET /api/v1/admin/config
 * Get system configuration
 */
router.get('/config', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const adminId = req.user!.userId;

    const config = await adminConsoleService.getSystemConfig(adminId);

    if (!config) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required',
      });
      return;
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error getting system config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system configuration',
    });
  }
});

/**
 * PUT /api/v1/admin/config
 * Update system configuration
 */
router.put(
  '/config',
  authenticate,
  requireAdmin,
  validate(updateConfigSchema),
  auditChangeConfig,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const adminId = req.user!.userId;
      const config = req.body;

      const success = await adminConsoleService.updateSystemConfig(adminId, config);

      if (success) {
        res.json({
          success: true,
          message: 'System configuration updated successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to update system configuration',
        });
      }
    } catch (error) {
      console.error('Error updating system config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update system configuration',
      });
    }
  }
);

export default router;
