import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { gamificationDashboardService } from '../services/gamification-dashboard.service';

const router = Router();

/**
 * GET /api/v1/gamification/overview
 * Get gamification overview for the authenticated user
 */
router.get('/overview', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const overview = await gamificationDashboardService.getGamificationOverview(userId);

    if (!overview) {
      res.status(404).json({
        success: false,
        message: 'Gamification overview not found',
      });
      return;
    }

    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    console.error('Error getting gamification overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get gamification overview',
    });
  }
});

/**
 * GET /api/v1/gamification/affinity-list
 * Get affinity list with pagination
 */
router.get('/affinity-list', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { page = '1', limit = '20', sortBy = 'level' } = req.query;

    const result = await gamificationDashboardService.getAffinityList(userId, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: sortBy as 'level' | 'points' | 'recent',
    });

    res.json({
      success: true,
      data: result.affinities,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        totalPages: Math.ceil(result.total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Error getting affinity list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get affinity list',
    });
  }
});

/**
 * GET /api/v1/gamification/proficiency-list
 * Get proficiency list with pagination
 */
router.get('/proficiency-list', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { page = '1', limit = '20', sortBy = 'level' } = req.query;

    const result = await gamificationDashboardService.getProficiencyList(userId, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: sortBy as 'level' | 'points',
    });

    res.json({
      success: true,
      data: result.proficiencies,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        totalPages: Math.ceil(result.total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Error getting proficiency list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get proficiency list',
    });
  }
});

/**
 * GET /api/v1/gamification/daily-quests
 * Get daily quests for the authenticated user
 */
router.get('/daily-quests', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const quests = await gamificationDashboardService.getDailyQuests(userId);

    res.json({
      success: true,
      data: quests,
      count: quests.length,
    });
  } catch (error) {
    console.error('Error getting daily quests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily quests',
    });
  }
});

/**
 * GET /api/v1/gamification/achievements
 * Get achievements with filters
 */
router.get('/achievements', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { category, unlocked, rarity } = req.query;

    const achievements = await gamificationDashboardService.getAchievements(userId, {
      category: category as string,
      unlocked: unlocked === 'true' ? true : unlocked === 'false' ? false : undefined,
      rarity: rarity as string,
    });

    res.json({
      success: true,
      data: achievements,
      count: achievements.length,
    });
  } catch (error) {
    console.error('Error getting achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get achievements',
    });
  }
});

export default router;
