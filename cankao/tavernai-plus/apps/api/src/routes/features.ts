import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { featureGateService } from '../services/feature-gate.service';

const router = Router();

// Validation schemas
const unlockFeatureSchema = z.object({
  unlockMethod: z.enum(['level_up', 'achievement', 'payment', 'manual']).optional(),
});

/**
 * GET /api/v1/features
 * List all available features for the authenticated user
 */
router.get('/', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.id;

    const features = await featureGateService.getAvailableFeatures(userId);

    res.json({
      success: true,
      data: features,
      count: features.length,
    });
  } catch (error) {
    console.error('Error getting features:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get features',
    });
  }
});

/**
 * GET /api/v1/features/:featureId
 * Get details of a specific feature
 */
router.get('/:featureId', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { featureId } = req.params;

    const features = await featureGateService.getAvailableFeatures(userId);
    const feature = features.find(f => f.featureId === featureId);

    if (!feature) {
      res.status(404).json({
        success: false,
        message: 'Feature not found',
      });
      return;
    }

    res.json({
      success: true,
      data: feature,
    });
  } catch (error) {
    console.error('Error getting feature:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feature',
    });
  }
});

/**
 * POST /api/v1/features/:featureId/unlock
 * Unlock a feature for the authenticated user
 */
router.post(
  '/:featureId/unlock',
  authenticate,
  validate(unlockFeatureSchema),
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { featureId } = req.params;
      const { unlockMethod = 'manual' } = req.body;

      // Check if user can access the feature
      const accessCheck = await featureGateService.canAccess(userId, featureId);

      if (!accessCheck.canAccess) {
        res.status(403).json({
          success: false,
          message: accessCheck.reason || 'Cannot unlock feature',
          details: {
            requiredLevel: accessCheck.requiredLevel,
            requiredRoles: accessCheck.requiredRoles,
            missingDependencies: accessCheck.missingDependencies,
          },
        });
        return;
      }

      // Unlock the feature
      const unlocked = await featureGateService.unlockFeature(userId, featureId, unlockMethod);

      if (unlocked) {
        res.json({
          success: true,
          message: 'Feature unlocked successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to unlock feature',
        });
      }
    } catch (error) {
      console.error('Error unlocking feature:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unlock feature',
      });
    }
  }
);

/**
 * GET /api/v1/features/:featureId/can-access
 * Check if user can access a specific feature
 */
router.get('/:featureId/can-access', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { featureId } = req.params;

    const accessCheck = await featureGateService.canAccess(userId, featureId);

    res.json({
      success: true,
      data: accessCheck,
    });
  } catch (error) {
    console.error('Error checking feature access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check feature access',
    });
  }
});

/**
 * GET /api/v1/features/user-unlocks
 * Get all features unlocked by the user
 */
router.get('/user-unlocks', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.id;

    const unlocks = await featureGateService.getUserUnlocks(userId);

    res.json({
      success: true,
      data: unlocks,
      count: unlocks.length,
    });
  } catch (error) {
    console.error('Error getting user unlocks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user unlocks',
    });
  }
});

export default router;
