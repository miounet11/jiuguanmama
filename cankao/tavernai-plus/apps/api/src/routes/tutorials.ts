import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { tutorialService } from '../services/tutorial.service';

const router = Router();

// Validation schemas
const updateProgressSchema = z.object({
  step: z.number().int().min(0),
});

/**
 * GET /api/v1/tutorials
 * List all available tutorials for the authenticated user
 */
router.get('/', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.id;

    const tutorials = await tutorialService.getTutorials(userId);

    res.json({
      success: true,
      data: tutorials,
      count: tutorials.length,
    });
  } catch (error) {
    console.error('Error getting tutorials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tutorials',
    });
  }
});

/**
 * GET /api/v1/tutorials/:tutorialId
 * Get details of a specific tutorial
 */
router.get('/:tutorialId', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { tutorialId } = req.params;

    const tutorial = tutorialService.getTutorialById(tutorialId);

    if (!tutorial) {
      res.status(404).json({
        success: false,
        message: 'Tutorial not found',
      });
      return;
    }

    res.json({
      success: true,
      data: tutorial,
    });
  } catch (error) {
    console.error('Error getting tutorial:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tutorial',
    });
  }
});

/**
 * POST /api/v1/tutorials/:tutorialId/start
 * Start a tutorial
 */
router.post('/:tutorialId/start', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { tutorialId } = req.params;

    const progress = await tutorialService.startTutorial(userId, tutorialId);

    if (!progress) {
      res.status(400).json({
        success: false,
        message: 'Failed to start tutorial',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Tutorial started',
      data: progress,
    });
  } catch (error) {
    console.error('Error starting tutorial:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start tutorial',
    });
  }
});

/**
 * POST /api/v1/tutorials/:tutorialId/progress
 * Update tutorial progress
 */
router.post(
  '/:tutorialId/progress',
  authenticate,
  validate(updateProgressSchema),
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { tutorialId } = req.params;
      const { step } = req.body;

      const progress = await tutorialService.updateProgress(userId, tutorialId, step);

      if (!progress) {
        res.status(400).json({
          success: false,
          message: 'Failed to update progress',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Progress updated',
        data: progress,
      });
    } catch (error) {
      console.error('Error updating tutorial progress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update progress',
      });
    }
  }
);

/**
 * POST /api/v1/tutorials/:tutorialId/complete
 * Complete a tutorial
 */
router.post('/:tutorialId/complete', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { tutorialId } = req.params;

    const success = await tutorialService.completeTutorial(userId, tutorialId);

    if (success) {
      res.json({
        success: true,
        message: 'Tutorial completed!',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to complete tutorial',
      });
    }
  } catch (error) {
    console.error('Error completing tutorial:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete tutorial',
    });
  }
});

/**
 * POST /api/v1/tutorials/:tutorialId/skip
 * Skip a tutorial
 */
router.post('/:tutorialId/skip', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { tutorialId } = req.params;

    const success = await tutorialService.skipTutorial(userId, tutorialId);

    if (success) {
      res.json({
        success: true,
        message: 'Tutorial skipped',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to skip tutorial',
      });
    }
  } catch (error) {
    console.error('Error skipping tutorial:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to skip tutorial',
    });
  }
});

export default router;
