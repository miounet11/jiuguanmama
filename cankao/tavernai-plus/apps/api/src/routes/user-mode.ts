import express from 'express';
const { PrismaClient } = require('../../node_modules/.prisma/client');
import { authenticate as auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// 验证schema
const updateUserModeSchema = z.object({
  currentMode: z.enum(['simplified', 'expert']),
  reason: z.string().optional()
});

const recordFeatureUsageSchema = z.object({
  featureId: z.string().min(1),
  isExpertFeature: z.boolean().optional().default(false)
});

const analyzeUpgradeSchema = z.object({
  includeHistory: z.boolean().optional().default(false)
});

/**
 * GET /api/user-mode
 * 获取用户模式配置
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user!.id;

    // 获取或创建用户模式
    let userMode = await prisma.userMode.findUnique({
      where: { userId }
    });

    if (!userMode) {
      userMode = await prisma.userMode.create({
        data: { userId }
      });
    }

    // 获取最近的功能使用记录
    const recentUsage = await prisma.featureUsageLog.findMany({
      where: { userId },
      orderBy: { lastUsedAt: 'desc' },
      take: 10
    });

    // 获取已解锁的功能
    const unlockedFeatures = await prisma.featureUnlock.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' }
    });

    // 计算用户体验数据
    const totalSessions = await prisma.chatSession.count({
      where: { userId }
    });

    const messagesCount = await prisma.message.count({
      where: { userId }
    });

    const charactersUsed = await prisma.character.count({
      where: { creatorId: userId }
    });

    const featuresUsed = recentUsage.map((usage: any) => usage.featureId);
    const expertFeaturesUsed = recentUsage
      .filter((usage: any) => usage.isExpertFeature)
      .map((usage: any) => usage.featureId);

    // 更新统计数据
    await prisma.userMode.update({
      where: { userId },
      data: {
        totalSessions,
        messagesCount,
        charactersUsed
      }
    });

    const response = {
      currentMode: userMode.currentMode,
      skillLevel: userMode.skillLevel,
      preferences: JSON.parse(userMode.preferences),
      experience: {
        totalSessions,
        messagesCount,
        charactersUsed,
        featuresUsed,
        expertFeaturesUsed,
        lastActiveDate: userMode.updatedAt
      },
      recentUsage: recentUsage.map((usage: any) => ({
        featureId: usage.featureId,
        usageCount: usage.usageCount,
        lastUsedAt: usage.lastUsedAt,
        isExpertFeature: usage.isExpertFeature
      })),
      unlockedFeatures: unlockedFeatures.map((unlock: any) => ({
        featureId: unlock.featureId,
        unlockedAt: unlock.unlockedAt,
        trigger: unlock.unlockTrigger
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching user mode:', error);
    res.status(500).json({ error: 'Failed to fetch user mode' });
  }
});

/**
 * PUT /api/user-mode
 * 更新用户模式
 */
router.put('/', auth, validate(updateUserModeSchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const { currentMode, reason } = req.body;

    // 获取当前模式
    const currentUserMode = await prisma.userMode.findUnique({
      where: { userId }
    });

    const fromMode = currentUserMode?.currentMode || 'simplified';

    // 更新用户模式
    const updatedUserMode = await prisma.userMode.upsert({
      where: { userId },
      update: { currentMode },
      create: {
        userId,
        currentMode
      }
    });

    // 记录模式切换历史
    if (fromMode !== currentMode) {
      await prisma.modeTransition.create({
        data: {
          userId,
          fromMode,
          toMode: currentMode,
          reason: reason || 'manual',
          userInitiated: true
        }
      });
    }

    res.json({
      currentMode: updatedUserMode.currentMode,
      skillLevel: updatedUserMode.skillLevel,
      transitionRecorded: fromMode !== currentMode
    });
  } catch (error) {
    console.error('Error updating user mode:', error);
    res.status(500).json({ error: 'Failed to update user mode' });
  }
});

/**
 * POST /api/user-mode/feature-usage
 * 记录功能使用情况
 */
router.post('/feature-usage', auth, validate(recordFeatureUsageSchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const { featureId, isExpertFeature } = req.body;

    // 更新或创建功能使用记录
    const featureUsage = await prisma.featureUsageLog.upsert({
      where: {
        user_feature_unique: {
          userId,
          featureId
        }
      },
      update: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
        isExpertFeature
      },
      create: {
        userId,
        featureId,
        isExpertFeature,
        usageCount: 1
      }
    });

    // 检查是否需要更新技能水平
    const totalUsage = await prisma.featureUsageLog.count({
      where: { userId }
    });

    const expertUsage = await prisma.featureUsageLog.count({
      where: { userId, isExpertFeature: true }
    });

    const userMode = await prisma.userMode.findUnique({
      where: { userId }
    });

    if (userMode) {
      let newSkillLevel = userMode.skillLevel;
      const totalSessions = userMode.totalSessions;
      const messagesCount = userMode.messagesCount;

      // 技能水平判断逻辑
      const totalScore = totalSessions + messagesCount / 10 + totalUsage * 5;

      if (totalScore >= 200 && expertUsage >= 5) {
        newSkillLevel = 'expert';
      } else if (totalScore >= 100 && totalUsage >= 10) {
        newSkillLevel = 'advanced';
      } else if (totalScore >= 50 && totalUsage >= 5) {
        newSkillLevel = 'intermediate';
      }

      if (newSkillLevel !== userMode.skillLevel) {
        await prisma.userMode.update({
          where: { userId },
          data: { skillLevel: newSkillLevel }
        });
      }
    }

    res.json({
      featureId,
      usageCount: featureUsage.usageCount,
      isExpertFeature,
      recordedAt: featureUsage.lastUsedAt
    });
  } catch (error) {
    console.error('Error recording feature usage:', error);
    res.status(500).json({ error: 'Failed to record feature usage' });
  }
});

/**
 * GET /api/user-mode/feature-unlocks
 * 获取功能解锁状态
 */
router.get('/feature-unlocks', auth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const unlocks = await prisma.featureUnlock.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' }
    });

    res.json({
      unlocks: unlocks.map(unlock => ({
        featureId: unlock.featureId,
        unlockedAt: unlock.unlockedAt,
        trigger: unlock.unlockTrigger,
        condition: unlock.unlockCondition
      }))
    });
  } catch (error) {
    console.error('Error fetching feature unlocks:', error);
    res.status(500).json({ error: 'Failed to fetch feature unlocks' });
  }
});

/**
 * POST /api/user-mode/analyze-upgrade
 * 分析升级建议
 */
router.post('/analyze-upgrade', auth, validate(analyzeUpgradeSchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const { includeHistory } = req.body;

    // 获取用户模式和统计数据
    const userMode = await prisma.userMode.findUnique({
      where: { userId }
    });

    if (!userMode) {
      return res.status(404).json({ error: 'User mode not found' });
    }

    if (userMode.currentMode === 'expert') {
      return res.json({
        shouldUpgrade: false,
        reason: 'Already in expert mode',
        currentMode: 'expert'
      });
    }

    // 获取功能使用统计
    const totalFeatures = await prisma.featureUsageLog.count({
      where: { userId }
    });

    const expertFeatures = await prisma.featureUsageLog.count({
      where: { userId, isExpertFeature: true }
    });

    // 升级建议算法
    const upgradeSignals = [
      userMode.totalSessions >= 10,
      userMode.messagesCount >= 100,
      userMode.charactersUsed >= 5,
      totalFeatures >= 8,
      expertFeatures >= 2
    ];

    const signalCount = upgradeSignals.filter(Boolean).length;
    const shouldUpgrade = signalCount >= 3;

    const response: any = {
      shouldUpgrade,
      currentMode: userMode.currentMode,
      skillLevel: userMode.skillLevel,
      signalCount,
      totalSignals: upgradeSignals.length,
      signals: {
        hasEnoughSessions: upgradeSignals[0],
        hasEnoughMessages: upgradeSignals[1],
        hasCreatedCharacters: upgradeSignals[2],
        hasUsedManyFeatures: upgradeSignals[3],
        hasUsedExpertFeatures: upgradeSignals[4]
      },
      stats: {
        totalSessions: userMode.totalSessions,
        messagesCount: userMode.messagesCount,
        charactersUsed: userMode.charactersUsed,
        totalFeatures,
        expertFeatures
      }
    };

    if (includeHistory) {
      const transitions = await prisma.modeTransition.findMany({
        where: { userId },
        orderBy: { transitionedAt: 'desc' },
        take: 5
      });

      response.transitionHistory = transitions.map((t: any) => ({
        fromMode: t.fromMode,
        toMode: t.toMode,
        reason: t.reason,
        transitionedAt: t.transitionedAt
      }));
    }

    res.json(response);
  } catch (error) {
    console.error('Error analyzing upgrade opportunity:', error);
    res.status(500).json({ error: 'Failed to analyze upgrade opportunity' });
  }
});

/**
 * GET /api/user-mode/transitions
 * 获取模式切换历史
 */
router.get('/transitions', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 10;

    const transitions = await prisma.modeTransition.findMany({
      where: { userId },
      orderBy: { transitionedAt: 'desc' },
      take: limit
    });

    res.json({
      transitions: transitions.map((t: any) => ({
        id: t.id,
        fromMode: t.fromMode,
        toMode: t.toMode,
        reason: t.reason,
        userInitiated: t.userInitiated,
        transitionedAt: t.transitionedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching mode transitions:', error);
    res.status(500).json({ error: 'Failed to fetch mode transitions' });
  }
});

export default router;