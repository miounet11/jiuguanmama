"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tutorialService = exports.TutorialService = void 0;
const client_1 = require("../../node_modules/.prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * TutorialService
 *
 * Manages in-app tutorial system and progress tracking.
 * Supports the onboarding and help system features.
 */
class TutorialService {
    // Tutorial definitions
    tutorials = [
        {
            id: 'character-chat-basics',
            name: '角色对话基础',
            description: '学习如何与AI角色进行对话',
            category: 'chat',
            estimatedTime: 5,
            steps: [
                {
                    id: 'select-character',
                    title: '选择角色',
                    description: '从角色列表中选择一个角色开始对话',
                    targetElement: '#character-list',
                    skippable: false,
                },
                {
                    id: 'send-message',
                    title: '发送消息',
                    description: '在输入框中输入您的消息并发送',
                    targetElement: '#message-input',
                    action: 'type-and-send',
                    skippable: false,
                },
                {
                    id: 'view-response',
                    title: '查看回复',
                    description: 'AI角色会根据设定回复您的消息',
                    targetElement: '#chat-messages',
                    skippable: true,
                },
            ],
        },
        {
            id: 'character-creation',
            name: '角色创建教程',
            description: '学习如何创建自己的AI角色',
            category: 'creation',
            estimatedTime: 10,
            requiredLevel: 3,
            steps: [
                {
                    id: 'basic-info',
                    title: '基本信息',
                    description: '填写角色的名字和简介',
                    targetElement: '#character-form-basic',
                    skippable: false,
                },
                {
                    id: 'personality',
                    title: '性格设定',
                    description: '描述角色的性格特点',
                    targetElement: '#character-form-personality',
                    skippable: false,
                },
                {
                    id: 'system-prompt',
                    title: '系统提示词',
                    description: '设置角色的行为规则和背景',
                    targetElement: '#character-form-system-prompt',
                    skippable: true,
                },
                {
                    id: 'test-character',
                    title: '测试角色',
                    description: '与创建的角色进行测试对话',
                    action: 'test-chat',
                    skippable: true,
                },
            ],
        },
        {
            id: 'gamification-intro',
            name: '游戏化系统介绍',
            description: '了解亲密度、熟练度和成就系统',
            category: 'gamification',
            estimatedTime: 8,
            requiredLevel: 5,
            steps: [
                {
                    id: 'affinity-system',
                    title: '亲密度系统',
                    description: '通过对话提升与角色的亲密度',
                    targetElement: '#affinity-panel',
                    skippable: false,
                },
                {
                    id: 'proficiency-system',
                    title: '熟练度系统',
                    description: '在对话中展现您的技能',
                    targetElement: '#proficiency-panel',
                    skippable: false,
                },
                {
                    id: 'achievements',
                    title: '成就系统',
                    description: '完成任务解锁成就和奖励',
                    targetElement: '#achievements-panel',
                    skippable: true,
                },
            ],
        },
    ];
    /**
     * Get available tutorials for a user
     */
    async getTutorials(userId) {
        try {
            // Get user level
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    userMode: {
                        select: {
                            userLevel: true,
                        },
                    },
                },
            });
            const userLevel = user?.userMode?.userLevel || 1;
            // Get user's tutorial progress
            const progress = await prisma.tutorialProgress.findMany({
                where: { userId },
            });
            const progressMap = new Map(progress.map(p => [p.tutorialId, p]));
            // Filter tutorials by level and add progress
            return this.tutorials
                .filter(tutorial => !tutorial.requiredLevel || userLevel >= tutorial.requiredLevel)
                .map(tutorial => ({
                ...tutorial,
                progress: progressMap.get(tutorial.id),
            }));
        }
        catch (error) {
            console.error('Error getting tutorials:', error);
            return [];
        }
    }
    /**
     * Start a tutorial
     */
    async startTutorial(userId, tutorialId) {
        try {
            // Find tutorial
            const tutorial = this.tutorials.find(t => t.id === tutorialId);
            if (!tutorial) {
                throw new Error('Tutorial not found');
            }
            // Check if already started
            let progress = await prisma.tutorialProgress.findUnique({
                where: {
                    userId_tutorialId: {
                        userId,
                        tutorialId,
                    },
                },
            });
            if (!progress) {
                // Create new progress
                progress = await prisma.tutorialProgress.create({
                    data: {
                        userId,
                        tutorialId,
                        currentStep: 0,
                        totalSteps: tutorial.steps.length,
                        completed: false,
                        skipped: false,
                    },
                });
            }
            else if (progress.completed) {
                // Reset completed tutorial
                progress = await prisma.tutorialProgress.update({
                    where: {
                        userId_tutorialId: {
                            userId,
                            tutorialId,
                        },
                    },
                    data: {
                        currentStep: 0,
                        completed: false,
                        skipped: false,
                        completedAt: null,
                        startedAt: new Date(),
                    },
                });
            }
            return {
                id: progress.id,
                tutorialId: progress.tutorialId,
                currentStep: progress.currentStep,
                totalSteps: progress.totalSteps,
                completed: progress.completed,
                skipped: progress.skipped,
                startedAt: progress.startedAt,
                completedAt: progress.completedAt || undefined,
            };
        }
        catch (error) {
            console.error('Error starting tutorial:', error);
            return null;
        }
    }
    /**
     * Update tutorial progress
     */
    async updateProgress(userId, tutorialId, step) {
        try {
            const tutorial = this.tutorials.find(t => t.id === tutorialId);
            if (!tutorial) {
                throw new Error('Tutorial not found');
            }
            // Validate step
            if (step < 0 || step >= tutorial.steps.length) {
                throw new Error('Invalid step');
            }
            // Update progress
            const progress = await prisma.tutorialProgress.update({
                where: {
                    userId_tutorialId: {
                        userId,
                        tutorialId,
                    },
                },
                data: {
                    currentStep: step,
                },
            });
            return {
                id: progress.id,
                tutorialId: progress.tutorialId,
                currentStep: progress.currentStep,
                totalSteps: progress.totalSteps,
                completed: progress.completed,
                skipped: progress.skipped,
                startedAt: progress.startedAt,
                completedAt: progress.completedAt || undefined,
            };
        }
        catch (error) {
            console.error('Error updating tutorial progress:', error);
            return null;
        }
    }
    /**
     * Complete a tutorial
     */
    async completeTutorial(userId, tutorialId) {
        try {
            const tutorial = this.tutorials.find(t => t.id === tutorialId);
            if (!tutorial) {
                throw new Error('Tutorial not found');
            }
            // Mark as completed
            await prisma.tutorialProgress.update({
                where: {
                    userId_tutorialId: {
                        userId,
                        tutorialId,
                    },
                },
                data: {
                    currentStep: tutorial.steps.length,
                    completed: true,
                    completedAt: new Date(),
                },
            });
            // Send completion notification
            await prisma.notification.create({
                data: {
                    userId,
                    type: 'achievement',
                    title: `教程完成: ${tutorial.name}`,
                    description: `恭喜您完成了"${tutorial.name}"教程！`,
                    icon: 'AcademicCap',
                    priority: 'normal',
                },
            });
            // Try to unlock achievement
            try {
                await prisma.userAchievement.create({
                    data: {
                        userId,
                        achievementId: `tutorial-${tutorialId}`,
                        progress: 100,
                        isUnlocked: true,
                        unlockedAt: new Date(),
                    },
                });
            }
            catch (e) {
                // Achievement might already exist
            }
            return true;
        }
        catch (error) {
            console.error('Error completing tutorial:', error);
            return false;
        }
    }
    /**
     * Skip a tutorial
     */
    async skipTutorial(userId, tutorialId) {
        try {
            await prisma.tutorialProgress.update({
                where: {
                    userId_tutorialId: {
                        userId,
                        tutorialId,
                    },
                },
                data: {
                    skipped: true,
                    completed: true,
                    completedAt: new Date(),
                },
            });
            return true;
        }
        catch (error) {
            console.error('Error skipping tutorial:', error);
            return false;
        }
    }
    /**
     * Get tutorial by ID
     */
    getTutorialById(tutorialId) {
        return this.tutorials.find(t => t.id === tutorialId) || null;
    }
}
exports.TutorialService = TutorialService;
// Export singleton instance
exports.tutorialService = new TutorialService();
//# sourceMappingURL=tutorial.service.js.map