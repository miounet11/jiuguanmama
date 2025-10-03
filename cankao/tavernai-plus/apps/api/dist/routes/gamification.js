"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// 验证模式
const affinityUpdateSchema = zod_1.z.object({
    characterId: zod_1.z.string(),
    affinityPoints: zod_1.z.number().min(0).max(100),
    interactionType: zod_1.z.string().optional()
});
const scenarioProgressUpdateSchema = zod_1.z.object({
    scenarioId: zod_1.z.string(),
    progressPercentage: zod_1.z.number().min(0).max(1),
    sessionTime: zod_1.z.number().optional(),
    messagesCount: zod_1.z.number().optional(),
    tokensUsed: zod_1.z.number().optional()
});
const proficiencyUpdateSchema = zod_1.z.object({
    characterId: zod_1.z.string(),
    proficiencyPoints: zod_1.z.number().min(0),
    interactionType: zod_1.z.string(),
    success: zod_1.z.boolean().optional()
});
// ==================== 亲密度系统 ====================
// 获取用户与角色的亲密度
router.get('/affinity/:characterId', auth_1.authenticate, async (req, res) => {
    try {
        const { characterId } = req.params;
        const userId = req.user.id;
        const affinity = await prisma_1.prisma.characterAffinity.findUnique({
            where: {
                userId_characterId: { userId, characterId }
            },
            include: {
                character: {
                    select: {
                        name: true,
                        avatar: true,
                        description: true
                    }
                }
            }
        });
        if (!affinity) {
            // 如果不存在，创建初始亲密度记录
            const newAffinity = await prisma_1.prisma.characterAffinity.create({
                data: {
                    userId,
                    characterId,
                    affinityLevel: 1,
                    affinityPoints: 0,
                    relationshipType: 'stranger',
                    unlockCount: 0,
                    spacetimeMemories: '[]',
                    specialEvents: '[]',
                    giftsGiven: '[]',
                    sharedSecrets: '[]'
                },
                include: {
                    character: {
                        select: {
                            name: true,
                            avatar: true,
                            description: true
                        }
                    }
                }
            });
            return res.json({
                success: true,
                affinity: newAffinity
            });
        }
        res.json({
            success: true,
            affinity
        });
    }
    catch (error) {
        console.error('获取亲密度失败:', error);
        res.status(500).json({
            success: false,
            message: '获取亲密度信息失败'
        });
    }
});
// 更新角色亲密度
router.post('/affinity/update', auth_1.authenticate, (0, validate_1.validate)(affinityUpdateSchema), async (req, res) => {
    try {
        const { characterId, affinityPoints, interactionType } = req.body;
        const userId = req.user.id;
        // 获取或创建亲密度记录
        let affinity = await prisma_1.prisma.characterAffinity.findUnique({
            where: {
                userId_characterId: { userId, characterId }
            }
        });
        if (!affinity) {
            affinity = await prisma_1.prisma.characterAffinity.create({
                data: {
                    userId,
                    characterId,
                    affinityLevel: 1,
                    affinityPoints: 0,
                    relationshipType: 'stranger',
                    unlockCount: 0,
                    spacetimeMemories: '[]',
                    specialEvents: '[]',
                    giftsGiven: '[]',
                    sharedSecrets: '[]'
                }
            });
        }
        // 计算新的亲密度
        const newPoints = affinity.affinityPoints + affinityPoints;
        const newLevel = Math.min(10, Math.floor(newPoints / 100) + 1);
        const relationshipTypes = ['stranger', 'acquaintance', 'friend', 'close_friend', 'best_friend', 'soulmate'];
        const newRelationshipType = relationshipTypes[Math.min(newLevel - 1, relationshipTypes.length - 1)];
        const leveledUp = newLevel > affinity.affinityLevel;
        // 更新亲密度
        const updatedAffinity = await prisma_1.prisma.characterAffinity.update({
            where: { id: affinity.id },
            data: {
                affinityPoints: newPoints,
                affinityLevel: newLevel,
                relationshipType: newRelationshipType,
                lastInteractionAt: new Date(),
                unlockCount: { increment: 1 }
            },
            include: {
                character: {
                    select: {
                        name: true,
                        avatar: true
                    }
                }
            }
        });
        // 检查是否解锁成就
        if (leveledUp) {
            await checkAffinityAchievements(userId, characterId, newLevel);
        }
        // 记录时空记忆（如果是特殊交互）
        if (interactionType === 'special_event' || affinityPoints >= 50) {
            const memories = JSON.parse(affinity.spacetimeMemories || '[]');
            memories.push({
                timestamp: new Date().toISOString(),
                type: interactionType || 'interaction',
                points: affinityPoints,
                level: newLevel
            });
            await prisma_1.prisma.characterAffinity.update({
                where: { id: affinity.id },
                data: {
                    spacetimeMemories: JSON.stringify(memories.slice(-10)) // 只保留最近10条
                }
            });
        }
        res.json({
            success: true,
            affinity: updatedAffinity,
            leveledUp
        });
    }
    catch (error) {
        console.error('更新亲密度失败:', error);
        res.status(500).json({
            success: false,
            message: '更新亲密度失败'
        });
    }
});
// 设置角色收藏
router.post('/affinity/:characterId/favorite', auth_1.authenticate, async (req, res) => {
    try {
        const { characterId } = req.params;
        const { favorite } = req.body;
        const userId = req.user.id;
        const affinity = await prisma_1.prisma.characterAffinity.upsert({
            where: {
                userId_characterId: { userId, characterId }
            },
            update: {
                favorite: favorite,
                lastInteractionAt: new Date()
            },
            create: {
                userId,
                characterId,
                favorite: favorite,
                affinityLevel: 1,
                affinityPoints: 0,
                relationshipType: 'stranger',
                unlockCount: 0,
                spacetimeMemories: '[]',
                specialEvents: '[]',
                giftsGiven: '[]',
                sharedSecrets: '[]'
            },
            include: {
                character: {
                    select: {
                        name: true,
                        avatar: true
                    }
                }
            }
        });
        res.json({
            success: true,
            affinity
        });
    }
    catch (error) {
        console.error('设置收藏失败:', error);
        res.status(500).json({
            success: false,
            message: '设置收藏失败'
        });
    }
});
// 获取用户所有角色亲密度列表
router.get('/affinities', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { sort = 'level', limit = 20 } = req.query;
        const orderBy = sort === 'level' ? { affinityLevel: 'desc' } :
            sort === 'points' ? { affinityPoints: 'desc' } :
                { lastInteractionAt: 'desc' };
        const affinities = await prisma_1.prisma.characterAffinity.findMany({
            where: { userId },
            include: {
                character: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        description: true
                    }
                }
            },
            orderBy,
            take: Number(limit)
        });
        res.json({
            success: true,
            affinities
        });
    }
    catch (error) {
        console.error('获取亲密度列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取亲密度列表失败'
        });
    }
});
// ==================== 剧本进度系统 ====================
// 获取剧本进度
router.get('/scenario-progress/:scenarioId', auth_1.authenticate, async (req, res) => {
    try {
        const { scenarioId } = req.params;
        const userId = req.user.id;
        const progress = await prisma_1.prisma.scenarioProgress.findUnique({
            where: {
                userId_scenarioId: { userId, scenarioId }
            },
            include: {
                scenario: {
                    select: {
                        name: true,
                        description: true,
                        contentRating: true,
                        complexity: true
                    }
                }
            }
        });
        if (!progress) {
            return res.json({
                success: true,
                progress: null
            });
        }
        res.json({
            success: true,
            progress
        });
    }
    catch (error) {
        console.error('获取剧本进度失败:', error);
        res.status(500).json({
            success: false,
            message: '获取剧本进度失败'
        });
    }
});
// 更新剧本进度
router.post('/scenario-progress/update', auth_1.authenticate, (0, validate_1.validate)(scenarioProgressUpdateSchema), async (req, res) => {
    try {
        const { scenarioId, progressPercentage, sessionTime, messagesCount, tokensUsed } = req.body;
        const userId = req.user.id;
        // 获取或创建进度记录
        let progress = await prisma_1.prisma.scenarioProgress.findUnique({
            where: {
                userId_scenarioId: { userId, scenarioId }
            }
        });
        const isFirstTime = !progress;
        const oldProgress = progress?.progressPercentage || 0;
        if (!progress) {
            progress = await prisma_1.prisma.scenarioProgress.create({
                data: {
                    userId,
                    scenarioId,
                    status: 'in_progress',
                    startedAt: new Date(),
                    progressPercentage: 0,
                    totalSessions: 0,
                    totalMessages: 0,
                    totalTokens: 0,
                    averageSessionTime: 0,
                    proficiencyLevel: 1,
                    proficiencyPoints: 0,
                    spacetimeExploration: '{}',
                    plotBranchesChosen: '[]',
                    keyDecisions: '[]',
                    achievements: '[]',
                    difficulty: 'normal'
                }
            });
        }
        // 计算新的统计数据
        const newTotalSessions = progress.totalSessions + 1;
        const newTotalMessages = progress.totalMessages + (messagesCount || 0);
        const newTotalTokens = progress.totalTokens + (tokensUsed || 0);
        const newAverageSessionTime = sessionTime
            ? Math.round((progress.averageSessionTime * progress.totalSessions + sessionTime) / newTotalSessions)
            : progress.averageSessionTime;
        // 计算熟练度
        const progressDelta = Math.max(0, progressPercentage - oldProgress);
        const newProficiencyPoints = progress.proficiencyPoints + Math.floor(progressDelta * 1000);
        const newProficiencyLevel = Math.min(20, Math.floor(newProficiencyPoints / 100) + 1);
        // 更新状态
        let newStatus = progress.status;
        if (progressPercentage >= 1.0 && progress.status !== 'completed') {
            newStatus = 'completed';
        }
        else if (progress.status === 'not_started') {
            newStatus = 'in_progress';
        }
        const updatedProgress = await prisma_1.prisma.scenarioProgress.update({
            where: { id: progress.id },
            data: {
                status: newStatus,
                progressPercentage: Math.min(1.0, progressPercentage),
                totalSessions: newTotalSessions,
                totalMessages: newTotalMessages,
                totalTokens: newTotalTokens,
                averageSessionTime: newAverageSessionTime,
                proficiencyLevel: newProficiencyLevel,
                proficiencyPoints: newProficiencyPoints,
                lastPlayedAt: new Date(),
                ...(newStatus === 'completed' && !progress.completedAt ? { completedAt: new Date() } : {})
            },
            include: {
                scenario: {
                    select: {
                        name: true,
                        description: true
                    }
                }
            }
        });
        // 检查成就
        if (newStatus === 'completed' && oldProgress < 1.0) {
            await checkScenarioCompletionAchievements(userId, scenarioId, newProficiencyLevel);
        }
        // 检查熟练度升级
        const leveledUp = newProficiencyLevel > progress.proficiencyLevel;
        res.json({
            success: true,
            progress: updatedProgress,
            completed: newStatus === 'completed' && oldProgress < 1.0,
            leveledUp,
            isFirstTime
        });
    }
    catch (error) {
        console.error('更新剧本进度失败:', error);
        res.status(500).json({
            success: false,
            message: '更新剧本进度失败'
        });
    }
});
// 获取用户所有剧本进度列表
router.get('/scenario-progresses', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, sort = 'recent', limit = 20 } = req.query;
        const where = { userId };
        if (status) {
            where.status = status;
        }
        const orderBy = sort === 'progress' ? { progressPercentage: 'desc' } :
            sort === 'level' ? { proficiencyLevel: 'desc' } :
                { lastPlayedAt: 'desc' };
        const progresses = await prisma_1.prisma.scenarioProgress.findMany({
            where,
            include: {
                scenario: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        genre: true,
                        complexity: true,
                        contentRating: true
                    }
                }
            },
            orderBy,
            take: Number(limit)
        });
        res.json({
            success: true,
            progresses
        });
    }
    catch (error) {
        console.error('获取剧本进度列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取剧本进度列表失败'
        });
    }
});
// 放弃剧本
router.post('/scenario-progress/:scenarioId/abandon', auth_1.authenticate, async (req, res) => {
    try {
        const { scenarioId } = req.params;
        const userId = req.user.id;
        const progress = await prisma_1.prisma.scenarioProgress.findUnique({
            where: {
                userId_scenarioId: { userId, scenarioId }
            }
        });
        if (!progress) {
            return res.status(404).json({
                success: false,
                message: '进度记录不存在'
            });
        }
        await prisma_1.prisma.scenarioProgress.update({
            where: { id: progress.id },
            data: {
                status: 'abandoned',
                lastPlayedAt: new Date()
            }
        });
        res.json({
            success: true,
            message: '已放弃该剧本'
        });
    }
    catch (error) {
        console.error('放弃剧本失败:', error);
        res.status(500).json({
            success: false,
            message: '放弃剧本失败'
        });
    }
});
// ==================== 熟练度系统 ====================
// 获取角色熟练度
router.get('/proficiency/:characterId', auth_1.authenticate, async (req, res) => {
    try {
        const { characterId } = req.params;
        const userId = req.user.id;
        const proficiency = await prisma_1.prisma.characterProficiency.findUnique({
            where: {
                userId_characterId: { userId, characterId }
            },
            include: {
                character: {
                    select: {
                        name: true,
                        avatar: true,
                        personality: true
                    }
                }
            }
        });
        if (!proficiency) {
            // 创建初始熟练度记录
            const newProficiency = await prisma_1.prisma.characterProficiency.create({
                data: {
                    userId,
                    characterId,
                    proficiencyLevel: 1,
                    proficiencyPoints: 0,
                    masteryAreas: '[]',
                    skillTreeUnlocked: '["basic_dialogue"]',
                    activeSkills: '[]',
                    skillPoints: 0,
                    spacetimeAdaptation: '{}',
                    dialogueMastery: '{}',
                    characterInsights: '[]',
                    totalInteractions: 0,
                    successfulOutcomes: 0,
                    averageRating: 0.0
                },
                include: {
                    character: {
                        select: {
                            name: true,
                            avatar: true,
                            personality: true
                        }
                    }
                }
            });
            return res.json({
                success: true,
                proficiency: newProficiency
            });
        }
        res.json({
            success: true,
            proficiency
        });
    }
    catch (error) {
        console.error('获取熟练度失败:', error);
        res.status(500).json({
            success: false,
            message: '获取熟练度信息失败'
        });
    }
});
// 更新角色熟练度
router.post('/proficiency/update', auth_1.authenticate, (0, validate_1.validate)(proficiencyUpdateSchema), async (req, res) => {
    try {
        const { characterId, proficiencyPoints, interactionType, success = true } = req.body;
        const userId = req.user.id;
        // 获取或创建熟练度记录
        let proficiency = await prisma_1.prisma.characterProficiency.findUnique({
            where: {
                userId_characterId: { userId, characterId }
            }
        });
        if (!proficiency) {
            proficiency = await prisma_1.prisma.characterProficiency.create({
                data: {
                    userId,
                    characterId,
                    proficiencyLevel: 1,
                    proficiencyPoints: 0,
                    masteryAreas: '[]',
                    skillTreeUnlocked: '["basic_dialogue"]',
                    activeSkills: '[]',
                    skillPoints: 0,
                    spacetimeAdaptation: '{}',
                    dialogueMastery: '{}',
                    characterInsights: '[]',
                    totalInteractions: 0,
                    successfulOutcomes: 0,
                    averageRating: 0.0
                }
            });
        }
        // 更新熟练度
        const newPoints = proficiency.proficiencyPoints + proficiencyPoints;
        const newLevel = Math.min(50, Math.floor(newPoints / 200) + 1);
        const leveledUp = newLevel > proficiency.proficiencyLevel;
        const updatedProficiency = await prisma_1.prisma.characterProficiency.update({
            where: { id: proficiency.id },
            data: {
                proficiencyLevel: newLevel,
                proficiencyPoints: newPoints,
                totalInteractions: { increment: 1 },
                successfulOutcomes: success ? { increment: 1 } : undefined,
                lastInteractionAt: new Date()
            },
            include: {
                character: {
                    select: {
                        name: true,
                        avatar: true
                    }
                }
            }
        });
        // 更新平均评分
        const totalInteractions = updatedProficiency.totalInteractions;
        const successfulOutcomes = updatedProficiency.successfulOutcomes;
        const averageRating = totalInteractions > 0 ? successfulOutcomes / totalInteractions : 0;
        await prisma_1.prisma.characterProficiency.update({
            where: { id: proficiency.id },
            data: {
                averageRating: Math.round(averageRating * 100) / 100
            }
        });
        // 检查技能解锁
        if (leveledUp) {
            await checkSkillUnlocks(userId, characterId, newLevel, interactionType);
        }
        res.json({
            success: true,
            proficiency: updatedProficiency,
            leveledUp
        });
    }
    catch (error) {
        console.error('更新熟练度失败:', error);
        res.status(500).json({
            success: false,
            message: '更新熟练度失败'
        });
    }
});
// 获取用户所有角色熟练度列表
router.get('/proficiencies', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { sort = 'level', limit = 20 } = req.query;
        const orderBy = sort === 'level' ? { proficiencyLevel: 'desc' } :
            sort === 'points' ? { proficiencyPoints: 'desc' } :
                sort === 'rating' ? { averageRating: 'desc' } :
                    { lastInteractionAt: 'desc' };
        const proficiencies = await prisma_1.prisma.characterProficiency.findMany({
            where: { userId },
            include: {
                character: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        personality: true
                    }
                }
            },
            orderBy,
            take: Number(limit)
        });
        res.json({
            success: true,
            proficiencies
        });
    }
    catch (error) {
        console.error('获取熟练度列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取熟练度列表失败'
        });
    }
});
// ==================== 成就系统 ====================
// 获取用户成就
router.get('/achievements', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, rarity, limit = 100 } = req.query;
        const where = { userId };
        if (type)
            where.achievementType = type;
        if (rarity)
            where.rarity = rarity;
        const achievements = await prisma_1.prisma.userAchievement.findMany({
            where,
            orderBy: { unlockedAt: 'desc' },
            take: Number(limit)
        });
        // 按稀有度分组统计
        const stats = await prisma_1.prisma.userAchievement.groupBy({
            by: ['rarity'],
            where: { userId },
            _count: true,
            _sum: { points: true }
        });
        const statsMap = stats.reduce((acc, stat) => {
            acc[stat.rarity] = {
                count: stat._count,
                totalPoints: stat._sum.points || 0
            };
            return acc;
        }, {});
        res.json({
            success: true,
            achievements,
            stats: statsMap
        });
    }
    catch (error) {
        console.error('获取成就失败:', error);
        res.status(500).json({
            success: false,
            message: '获取成就信息失败'
        });
    }
});
// ==================== 每日任务 ====================
// 获取每日任务
router.get('/daily-quests', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const quests = await prisma_1.prisma.dailyQuest.findMany({
            where: {
                userId,
                createdAt: {
                    gte: today
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        // 如果今天没有任务，生成新任务
        if (quests.length === 0) {
            const newQuests = await generateDailyQuests(userId);
            return res.json({
                success: true,
                quests: newQuests
            });
        }
        res.json({
            success: true,
            quests
        });
    }
    catch (error) {
        console.error('获取每日任务失败:', error);
        res.status(500).json({
            success: false,
            message: '获取每日任务失败'
        });
    }
});
// 更新任务进度
router.post('/daily-quests/:questId/progress', auth_1.authenticate, async (req, res) => {
    try {
        const { questId } = req.params;
        const { increment = 1 } = req.body;
        const userId = req.user.id;
        const quest = await prisma_1.prisma.dailyQuest.findFirst({
            where: {
                id: questId,
                userId,
                isCompleted: false
            }
        });
        if (!quest) {
            return res.status(404).json({
                success: false,
                message: '任务不存在或已完成'
            });
        }
        const newValue = Math.min(quest.currentValue + increment, quest.targetValue);
        const isCompleted = newValue >= quest.targetValue;
        const updatedQuest = await prisma_1.prisma.dailyQuest.update({
            where: { id: questId },
            data: {
                currentValue: newValue,
                isCompleted,
                ...(isCompleted ? { completedAt: new Date() } : {})
            }
        });
        res.json({
            success: true,
            quest: updatedQuest,
            completed: isCompleted
        });
    }
    catch (error) {
        console.error('更新任务进度失败:', error);
        res.status(500).json({
            success: false,
            message: '更新任务进度失败'
        });
    }
});
// 领取任务奖励
router.post('/daily-quests/:questId/claim', auth_1.authenticate, async (req, res) => {
    try {
        const { questId } = req.params;
        const userId = req.user.id;
        const quest = await prisma_1.prisma.dailyQuest.findFirst({
            where: {
                id: questId,
                userId,
                isCompleted: true,
                isClaimed: false
            }
        });
        if (!quest) {
            return res.status(404).json({
                success: false,
                message: '任务不存在或无法领取'
            });
        }
        // 更新任务状态
        await prisma_1.prisma.dailyQuest.update({
            where: { id: questId },
            data: {
                isClaimed: true,
                claimedAt: new Date()
            }
        });
        // 发放奖励
        if (quest.rewardType === 'credits') {
            await prisma_1.prisma.user.update({
                where: { id: userId },
                data: {
                    credits: { increment: quest.rewardPoints }
                }
            });
        }
        res.json({
            success: true,
            reward: {
                type: quest.rewardType,
                points: quest.rewardPoints
            }
        });
    }
    catch (error) {
        console.error('领取奖励失败:', error);
        res.status(500).json({
            success: false,
            message: '领取奖励失败'
        });
    }
});
// ==================== 游戏化概览 ====================
// 获取用户游戏化总览
router.get('/overview', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const [totalAffinities, completedScenarios, totalAchievements, topCharacters, recentProgress, activeProficiencies] = await Promise.all([
            // 总亲密度等级
            prisma_1.prisma.characterAffinity.aggregate({
                where: { userId },
                _sum: { affinityLevel: true },
                _count: true
            }),
            // 已完成的剧本
            prisma_1.prisma.scenarioProgress.count({
                where: { userId, status: 'completed' }
            }),
            // 成就数量和总积分
            prisma_1.prisma.userAchievement.aggregate({
                where: { userId },
                _count: true,
                _sum: { points: true }
            }),
            // 亲密度最高的角色
            prisma_1.prisma.characterAffinity.findMany({
                where: { userId },
                include: {
                    character: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true
                        }
                    }
                },
                orderBy: { affinityLevel: 'desc' },
                take: 5
            }),
            // 最近的剧本进度
            prisma_1.prisma.scenarioProgress.findMany({
                where: { userId },
                include: {
                    scenario: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            genre: true
                        }
                    }
                },
                orderBy: { lastPlayedAt: 'desc' },
                take: 5
            }),
            // 熟练度最高的角色
            prisma_1.prisma.characterProficiency.findMany({
                where: { userId },
                include: {
                    character: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true
                        }
                    }
                },
                orderBy: { proficiencyLevel: 'desc' },
                take: 5
            })
        ]);
        res.json({
            success: true,
            overview: {
                totalAffinityLevel: totalAffinities._sum.affinityLevel || 0,
                totalCharactersInteracted: totalAffinities._count,
                completedScenarios,
                inProgressScenarios: await prisma_1.prisma.scenarioProgress.count({
                    where: { userId, status: 'in_progress' }
                }),
                totalAchievements: totalAchievements._count,
                totalAchievementPoints: totalAchievements._sum.points || 0,
                topCharacters: topCharacters.map(a => ({
                    character: a.character,
                    affinityLevel: a.affinityLevel,
                    relationshipType: a.relationshipType
                })),
                recentProgress: recentProgress.map(p => ({
                    scenario: p.scenario,
                    progressPercentage: p.progressPercentage,
                    proficiencyLevel: p.proficiencyLevel,
                    status: p.status,
                    lastPlayedAt: p.lastPlayedAt
                })),
                topProficiencies: activeProficiencies.map(p => ({
                    character: p.character,
                    proficiencyLevel: p.proficiencyLevel,
                    averageRating: p.averageRating
                }))
            }
        });
    }
    catch (error) {
        console.error('获取游戏化概览失败:', error);
        res.status(500).json({
            success: false,
            message: '获取游戏化概览失败'
        });
    }
});
// ==================== 辅助函数 ====================
async function checkAffinityAchievements(userId, characterId, level) {
    const achievements = [
        { id: `first_friend_${characterId}`, threshold: 3, title: '初识', description: '与角色成为朋友', rarity: 'common', points: 10 },
        { id: `close_buddy_${characterId}`, threshold: 5, title: '挚友', description: '与角色达到亲密度5级', rarity: 'rare', points: 30 },
        { id: `soulmate_${characterId}`, threshold: 10, title: '灵魂伴侣', description: '与角色达到最高亲密度', rarity: 'epic', points: 100 }
    ];
    for (const achievement of achievements) {
        if (level >= achievement.threshold) {
            await unlockAchievement(userId, achievement.id, achievement.title, achievement.description, 'character_affinity', achievement.rarity, achievement.points);
        }
    }
}
async function checkScenarioCompletionAchievements(userId, scenarioId, proficiencyLevel) {
    // 检查完成数量
    const completedCount = await prisma_1.prisma.scenarioProgress.count({
        where: { userId, status: 'completed' }
    });
    const completionAchievements = [
        { id: 'first_scenario', threshold: 1, title: '冒险开始', description: '完成第一个剧本', rarity: 'common', points: 10 },
        { id: 'scenario_explorer', threshold: 5, title: '剧本探索者', description: '完成5个剧本', rarity: 'rare', points: 50 },
        { id: 'scenario_master', threshold: 10, title: '剧本大师', description: '完成10个剧本', rarity: 'epic', points: 150 },
        { id: 'scenario_legend', threshold: 20, title: '时空传奇', description: '完成20个剧本', rarity: 'legendary', points: 300 }
    ];
    for (const achievement of completionAchievements) {
        if (completedCount >= achievement.threshold) {
            await unlockAchievement(userId, achievement.id, achievement.title, achievement.description, 'scenario_progress', achievement.rarity, achievement.points);
        }
    }
    // 熟练度成就
    if (proficiencyLevel >= 10) {
        await unlockAchievement(userId, `scenario_proficiency_${scenarioId}`, '熟练掌握', '在剧本中达到10级熟练度', 'skill_mastery', 'rare', 30);
    }
    if (proficiencyLevel >= 20) {
        await unlockAchievement(userId, `scenario_expert_${scenarioId}`, '剧本专家', '在剧本中达到最高熟练度', 'skill_mastery', 'epic', 100);
    }
}
async function checkSkillUnlocks(userId, characterId, level, interactionType) {
    const skillUnlocks = [
        { level: 5, skill: 'advanced_dialogue', name: '高级对话' },
        { level: 10, skill: 'emotional_intelligence', name: '情感洞察' },
        { level: 15, skill: 'role_immersion', name: '角色沉浸' },
        { level: 25, skill: 'storytelling_master', name: '叙事大师' },
        { level: 30, skill: 'spacetime_mastery', name: '时空掌控' },
        { level: 40, skill: 'ultimate_bond', name: '终极羁绊' }
    ];
    for (const unlock of skillUnlocks) {
        if (level >= unlock.level) {
            const proficiency = await prisma_1.prisma.characterProficiency.findUnique({
                where: { userId_characterId: { userId, characterId } }
            });
            if (proficiency) {
                const unlockedSkills = JSON.parse(proficiency.skillTreeUnlocked);
                if (!unlockedSkills.includes(unlock.skill)) {
                    unlockedSkills.push(unlock.skill);
                    await prisma_1.prisma.characterProficiency.update({
                        where: { id: proficiency.id },
                        data: {
                            skillTreeUnlocked: JSON.stringify(unlockedSkills),
                            skillPoints: { increment: 1 }
                        }
                    });
                    // 解锁技能成就
                    await unlockAchievement(userId, `skill_unlock_${unlock.skill}`, `解锁技能：${unlock.name}`, `成功解锁 ${unlock.name} 技能`, 'skill_mastery', 'rare', 20);
                }
            }
        }
    }
}
async function unlockAchievement(userId, achievementId, title, description, type, rarity = 'common', points = 10) {
    try {
        const existing = await prisma_1.prisma.userAchievement.findUnique({
            where: { userId_achievementId: { userId, achievementId } }
        });
        if (!existing) {
            await prisma_1.prisma.userAchievement.create({
                data: {
                    userId,
                    achievementId,
                    title,
                    description,
                    achievementType: type,
                    rarity,
                    points,
                    progress: 1.0,
                    metadata: '{}',
                    unlockedAt: new Date()
                }
            });
            // 增加用户积分
            await prisma_1.prisma.user.update({
                where: { id: userId },
                data: { credits: { increment: points } }
            });
            console.log(`✨ 用户 ${userId} 解锁成就: ${title} (+${points}点)`);
        }
    }
    catch (error) {
        console.error('解锁成就失败:', error);
    }
}
// 生成每日任务
async function generateDailyQuests(userId) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const questTemplates = [
        {
            type: 'chat',
            title: '每日对话',
            description: '与任意AI角色进行3次对话',
            targetValue: 3,
            rewardPoints: 30,
            rewardType: 'credits'
        },
        {
            type: 'character_interaction',
            title: '角色互动',
            description: '与2个不同的角色对话',
            targetValue: 2,
            rewardPoints: 20,
            rewardType: 'credits'
        },
        {
            type: 'scenario_progress',
            title: '剧本推进',
            description: '在任意剧本中推进进度',
            targetValue: 1,
            rewardPoints: 25,
            rewardType: 'affinity_boost'
        },
        {
            type: 'chat',
            title: '深度对话',
            description: '发送10条消息',
            targetValue: 10,
            rewardPoints: 40,
            rewardType: 'proficiency_boost'
        }
    ];
    const quests = await Promise.all(questTemplates.map(template => prisma_1.prisma.dailyQuest.create({
        data: {
            userId,
            questType: template.type,
            title: template.title,
            description: template.description,
            targetValue: template.targetValue,
            currentValue: 0,
            rewardPoints: template.rewardPoints,
            rewardType: template.rewardType,
            isCompleted: false,
            isClaimed: false,
            expiresAt: tomorrow
        }
    })));
    return quests;
}
exports.default = router;
//# sourceMappingURL=gamification.js.map