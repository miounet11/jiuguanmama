import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { onboardingService } from '../services/onboarding.service';

const router = Router();

// Validation schemas
const completeStepSchema = z.object({
  stepId: z.string(),
  data: z.record(z.any()),
});

const recommendationsSchema = z.object({
  interests: z.array(z.string()),
  mbtiType: z.string().optional(),
});

/**
 * GET /api/v1/onboarding/status
 * Get onboarding progress for the authenticated user
 */
router.get('/status', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const status = await onboardingService.startOnboarding(userId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting onboarding status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get onboarding status',
    });
  }
});

/**
 * POST /api/v1/onboarding/start
 * Start onboarding for the authenticated user
 */
router.post('/start', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const status = await onboardingService.startOnboarding(userId);

    res.json({
      success: true,
      message: 'Onboarding started',
      data: status,
    });
  } catch (error) {
    console.error('Error starting onboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start onboarding',
    });
  }
});

/**
 * POST /api/v1/onboarding/complete-step
 * Complete an onboarding step
 */
router.post(
  '/complete-step',
  authenticate,
  validate(completeStepSchema),
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const stepData = req.body;

      const status = await onboardingService.completeStep(userId, stepData);

      res.json({
        success: true,
        message: status.completed ? 'Onboarding completed!' : 'Step completed',
        data: status,
      });
    } catch (error) {
      console.error('Error completing onboarding step:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete onboarding step',
      });
    }
  }
);

/**
 * POST /api/v1/onboarding/skip
 * Skip onboarding for the authenticated user
 */
router.post('/skip', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const success = await onboardingService.skipOnboarding(userId);

    if (success) {
      res.json({
        success: true,
        message: 'Onboarding skipped',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to skip onboarding',
      });
    }
  } catch (error) {
    console.error('Error skipping onboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to skip onboarding',
    });
  }
});

/**
 * GET /api/v1/onboarding/recommendations
 * Get personalized character recommendations
 */
router.get(
  '/recommendations',
  authenticate,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { interests, mbtiType } = req.query;

      // Parse interests from query string
      const interestsArray = interests
        ? (interests as string).split(',').map(i => i.trim())
        : [];

      const recommendations = await onboardingService.getRecommendations(
        userId,
        interestsArray,
        mbtiType as string | undefined
      );

      res.json({
        success: true,
        data: recommendations,
        count: recommendations.length,
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recommendations',
      });
    }
  }
);

export default router;
