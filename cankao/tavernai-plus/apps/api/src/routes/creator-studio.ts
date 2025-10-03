import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { creatorStudioService } from '../services/creator-studio.service';

const router = Router();

// Validation schemas
const aiGenerationSchema = z.object({
  prompt: z.string().min(10).max(1000),
  config: z
    .object({
      model: z.string().optional(),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().min(100).max(4000).optional(),
      includeAvatar: z.boolean().optional(),
      avatarStyle: z.string().optional(),
    })
    .optional(),
});

/**
 * GET /api/v1/creator-studio/overview
 * Get creator overview statistics
 */
router.get('/overview', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.id;

    const overview = await creatorStudioService.getCreatorOverview(userId);

    if (!overview) {
      res.status(404).json({
        success: false,
        message: 'Creator overview not found',
      });
      return;
    }

    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    console.error('Error getting creator overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get creator overview',
    });
  }
});

/**
 * GET /api/v1/creator-studio/statistics
 * Get detailed work statistics
 */
router.get('/statistics', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { limit = '10', sortBy = 'views' } = req.query;

    const statistics = await creatorStudioService.getWorkStatistics(userId, {
      limit: parseInt(limit as string),
      sortBy: sortBy as 'views' | 'likes' | 'rating' | 'recent',
    });

    if (!statistics) {
      res.status(404).json({
        success: false,
        message: 'Work statistics not found',
      });
      return;
    }

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('Error getting work statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get work statistics',
    });
  }
});

/**
 * POST /api/v1/creator-studio/ai-generate-character
 * Generate a character using AI
 */
router.post(
  '/ai-generate-character',
  authenticate,
  validate(aiGenerationSchema),
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { prompt, config = {} } = req.body;

      const result = await creatorStudioService.aiGenerateCharacter(userId, prompt, config);

      if (result.success) {
        res.json({
          success: true,
          message: 'Character generated successfully',
          data: result.data,
          usage: {
            tokensUsed: result.tokensUsed,
            cost: result.cost,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to generate character',
        });
      }
    } catch (error) {
      console.error('Error generating character:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate character',
      });
    }
  }
);

/**
 * POST /api/v1/creator-studio/ai-generate-scenario
 * Generate a scenario using AI
 */
router.post(
  '/ai-generate-scenario',
  authenticate,
  validate(aiGenerationSchema),
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { prompt, config = {} } = req.body;

      const result = await creatorStudioService.aiGenerateScenario(userId, prompt, config);

      if (result.success) {
        res.json({
          success: true,
          message: 'Scenario generated successfully',
          data: result.data,
          usage: {
            tokensUsed: result.tokensUsed,
            cost: result.cost,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to generate scenario',
        });
      }
    } catch (error) {
      console.error('Error generating scenario:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate scenario',
      });
    }
  }
);

export default router;
