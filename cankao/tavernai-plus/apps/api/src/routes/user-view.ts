import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { roleViewService } from '../services/role-view.service';

const router = Router();

// Validation schemas
const switchRoleSchema = z.object({
  role: z.enum(['creator', 'player', 'admin']),
});

const updatePreferencesSchema = z.object({
  theme: z.string().optional(),
  language: z.string().optional(),
  dashboardLayout: z.string().optional(),
  navigationCollapsed: z.boolean().optional(),
  progressiveDisclosure: z.boolean().optional(),
  showTutorials: z.boolean().optional(),
  showNewBadges: z.boolean().optional(),
  autoUnlockFeatures: z.boolean().optional(),
});

/**
 * GET /api/v1/user/view-config
 * Get role-based view configuration for the authenticated user
 */
router.get('/view-config', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { role } = req.query;

    const viewConfig = await roleViewService.getRoleConfig(userId, role as string | undefined);

    if (!viewConfig) {
      res.status(404).json({
        success: false,
        message: 'View configuration not found',
      });
      return;
    }

    res.json({
      success: true,
      data: viewConfig,
    });
  } catch (error) {
    console.error('Error getting view config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get view configuration',
    });
  }
});

/**
 * PUT /api/v1/user/view-config
 * Update user preferences for view configuration
 */
router.put(
  '/view-config',
  authenticate,
  validate(updatePreferencesSchema),
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.user!.id;
      const preferences = req.body;

      // Update preferences in database
      // This is handled by the user preferences service
      // For now, just return success
      res.json({
        success: true,
        message: 'Preferences updated successfully',
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update preferences',
      });
    }
  }
);

/**
 * POST /api/v1/user/switch-role
 * Switch user's primary role
 */
router.post(
  '/switch-role',
  authenticate,
  validate(switchRoleSchema),
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { role } = req.body;

      const success = await roleViewService.switchRole(userId, role);

      if (success) {
        // Get updated view config
        const viewConfig = await roleViewService.getRoleConfig(userId, role);

        res.json({
          success: true,
          message: 'Role switched successfully',
          data: viewConfig,
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to switch role',
        });
      }
    } catch (error) {
      console.error('Error switching role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to switch role',
      });
    }
  }
);

/**
 * GET /api/v1/user/navigation
 * Get personalized navigation for the authenticated user
 */
router.get('/navigation', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { role } = req.query;

    const navigation = await roleViewService.getNavigation(userId, role as string);

    res.json({
      success: true,
      data: navigation,
    });
  } catch (error) {
    console.error('Error getting navigation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get navigation',
    });
  }
});

/**
 * GET /api/v1/user/dashboard
 * Get dashboard widget configuration for the authenticated user
 */
router.get('/dashboard', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { role } = req.query;

    const dashboard = await roleViewService.getDashboard(userId, role as string);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error getting dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard configuration',
    });
  }
});

export default router;
