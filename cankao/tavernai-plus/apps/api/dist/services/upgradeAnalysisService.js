"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpgradeAnalysisService = void 0;
const { PrismaClient } = require('../../node_modules/.prisma/client');
const featureTrackingService_1 = require("./featureTrackingService");
const prisma = new PrismaClient();
/**
 * 升级分析服务类
 */
class UpgradeAnalysisService {
    /**
     * 执行完整的升级分析
     */
    static async analyzeUserUpgrade(userId) {
        try {
            // 获取用户模式信息
            const userMode = await prisma.userMode.findUnique({
                where: { userId }
            });
            if (!userMode) {
                throw new Error('User mode not found');
            }
            if (userMode.currentMode === 'expert') {
                return this.createExpertModeAnalysis(userId);
            }
            // 获取用户体验数据
            const userExperience = await featureTrackingService_1.FeatureTrackingService.getUserExperience(userId);
            // 分析行为模式
            const behaviorPattern = await this.analyzeBehaviorPattern(userId);
            // 计算准备度分数
            const readinessScore = this.calculateReadinessScore(userExperience, behaviorPattern);
            // 生成推荐
            const recommendation = this.generateRecommendation(readinessScore, userExperience, behaviorPattern);
            // 生成个性化消息
            const personalizedMessage = this.generatePersonalizedMessage(recommendation, userExperience, behaviorPattern);
            return {
                userId,
                currentMode: userMode.currentMode,
                recommendation: recommendation.type,
                confidence: recommendation.confidence,
                reasons: recommendation.reasons,
                timeline: recommendation.timeline,
                benefits: recommendation.benefits,
                risks: recommendation.risks,
                readinessScore,
                personalizedMessage
            };
        }
        catch (error) {
            console.error('Error analyzing user upgrade:', error);
            throw error;
        }
    }
    /**
     * 分析用户行为模式
     */
    static async analyzeBehaviorPattern(userId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        // 获取最近30天的数据
        const [recentSessions, recentMessages, recentFeatureUsage, modeTransitions] = await Promise.all([
            prisma.chatSession.findMany({
                where: {
                    userId,
                    createdAt: { gte: thirtyDaysAgo }
                },
                orderBy: { createdAt: 'asc' }
            }),
            prisma.message.findMany({
                where: {
                    userId,
                    createdAt: { gte: thirtyDaysAgo }
                }
            }),
            prisma.featureUsageLog.findMany({
                where: {
                    userId,
                    lastUsedAt: { gte: thirtyDaysAgo }
                }
            }),
            prisma.modeTransition.findMany({
                where: {
                    userId,
                    transitionedAt: { gte: thirtyDaysAgo }
                }
            })
        ]);
        // 计算会话频率
        const sessionFrequency = recentSessions.length / 30;
        // 计算平均会话长度
        const totalMessages = recentMessages.length;
        const averageSessionLength = recentSessions.length > 0
            ? (totalMessages / recentSessions.length) * 2 // 假设每条消息2分钟
            : 0;
        // 计算功能探索率
        const uniqueFeatures = new Set(recentFeatureUsage.map(f => f.featureId)).size;
        const totalFeatures = featureTrackingService_1.FeatureTrackingService.getFeatureManifest().length;
        const featureExplorationRate = uniqueFeatures / totalFeatures;
        // 计算专家功能采用率
        const expertFeatureUsage = recentFeatureUsage.filter(f => f.isExpertFeature).length;
        const expertFeatureAdoption = expertFeatureUsage / Math.max(recentFeatureUsage.length, 1);
        // 计算使用一致性分数
        const daysWithActivity = this.calculateDaysWithActivity(recentSessions, recentFeatureUsage);
        const consistencyScore = daysWithActivity / 30;
        // 计算学习速度
        const learningVelocity = this.calculateLearningVelocity(recentFeatureUsage);
        return {
            sessionFrequency,
            averageSessionLength,
            featureExplorationRate,
            expertFeatureAdoption,
            consistencyScore,
            learningVelocity
        };
    }
    /**
     * 计算活跃天数
     */
    static calculateDaysWithActivity(sessions, featureUsage) {
        const activeDays = new Set();
        sessions.forEach(session => {
            const day = session.createdAt.toISOString().split('T')[0];
            activeDays.add(day);
        });
        featureUsage.forEach(usage => {
            const day = usage.lastUsedAt.toISOString().split('T')[0];
            activeDays.add(day);
        });
        return activeDays.size;
    }
    /**
     * 计算学习速度
     */
    static calculateLearningVelocity(featureUsage) {
        if (featureUsage.length === 0)
            return 0;
        // 按时间排序功能使用记录
        const sortedUsage = featureUsage.sort((a, b) => a.firstUsedAt.getTime() - b.firstUsedAt.getTime());
        const firstUsage = sortedUsage[0].firstUsedAt;
        const lastUsage = sortedUsage[sortedUsage.length - 1].lastUsedAt;
        const timeDiff = lastUsage.getTime() - firstUsage.getTime();
        const daysDiff = Math.max(timeDiff / (1000 * 60 * 60 * 24), 1);
        return featureUsage.length / daysDiff; // 功能学习率：功能数/天
    }
    /**
     * 计算准备度分数 (0-100)
     */
    static calculateReadinessScore(userExperience, behaviorPattern) {
        const weights = {
            experience: 0.3,
            behavior: 0.4,
            consistency: 0.2,
            learning: 0.1
        };
        // 经验分数 (0-100)
        const experienceScore = Math.min((userExperience.totalSessions * 2 +
            userExperience.messagesCount * 0.1 +
            userExperience.charactersUsed * 5 +
            userExperience.featuresUsed.length * 3) / 2, 100);
        // 行为分数 (0-100)
        const behaviorScore = Math.min((behaviorPattern.sessionFrequency * 20 +
            behaviorPattern.featureExplorationRate * 50 +
            behaviorPattern.expertFeatureAdoption * 30), 100);
        // 一致性分数 (0-100)
        const consistencyScore = behaviorPattern.consistencyScore * 100;
        // 学习分数 (0-100)
        const learningScore = Math.min(behaviorPattern.learningVelocity * 20, 100);
        return Math.round(experienceScore * weights.experience +
            behaviorScore * weights.behavior +
            consistencyScore * weights.consistency +
            learningScore * weights.learning);
    }
    /**
     * 生成推荐决策
     */
    static generateRecommendation(readinessScore, userExperience, behaviorPattern) {
        let type;
        let confidence;
        let timeline;
        if (readinessScore >= 80) {
            type = 'upgrade';
            confidence = 0.9;
            timeline = '立即推荐';
        }
        else if (readinessScore >= 60) {
            type = 'consider';
            confidence = 0.7;
            timeline = '1-2周内考虑';
        }
        else {
            type = 'stay';
            confidence = 0.8;
            timeline = '继续使用简洁模式';
        }
        const reasons = this.generateReasons(type, userExperience, behaviorPattern, readinessScore);
        const benefits = this.generateBenefits(type);
        const risks = this.generateRisks(type);
        return {
            type,
            confidence,
            reasons,
            timeline,
            benefits,
            risks
        };
    }
    /**
     * 生成推荐理由
     */
    static generateReasons(type, userExperience, behaviorPattern, readinessScore) {
        const reasons = [];
        if (type === 'upgrade') {
            if (userExperience.totalSessions >= 15) {
                reasons.push(`您已经进行了${userExperience.totalSessions}次对话，经验丰富`);
            }
            if (userExperience.expertFeaturesUsed.length >= 3) {
                reasons.push(`您已经尝试了${userExperience.expertFeaturesUsed.length}个高级功能`);
            }
            if (behaviorPattern.featureExplorationRate > 0.6) {
                reasons.push('您表现出强烈的功能探索意愿');
            }
            if (behaviorPattern.consistencyScore > 0.7) {
                reasons.push('您的使用模式非常稳定');
            }
        }
        else if (type === 'consider') {
            if (readinessScore < 70) {
                reasons.push('建议先熟悉更多基础功能');
            }
            if (behaviorPattern.sessionFrequency < 0.5) {
                reasons.push('可以考虑增加使用频率');
            }
            if (userExperience.expertFeaturesUsed.length < 2) {
                reasons.push('建议先尝试一些高级功能');
            }
        }
        else {
            if (userExperience.totalSessions < 10) {
                reasons.push('建议积累更多对话经验');
            }
            if (userExperience.featuresUsed.length < 5) {
                reasons.push('建议探索更多功能');
            }
            if (behaviorPattern.consistencyScore < 0.5) {
                reasons.push('建议保持稳定的使用习惯');
            }
        }
        return reasons;
    }
    /**
     * 生成升级好处
     */
    static generateBenefits(type) {
        if (type === 'stay') {
            return [
                '界面简洁，专注核心功能',
                '学习成本低，容易上手',
                '避免功能过载的困扰'
            ];
        }
        return [
            '获得完整的功能控制权',
            '访问高级AI模型配置',
            '使用专业级的角色创建工具',
            '享受更丰富的个性化选项',
            '获得优先的新功能体验'
        ];
    }
    /**
     * 生成潜在风险
     */
    static generateRisks(type) {
        if (type === 'stay') {
            return [
                '可能错过强大的高级功能',
                '创作能力受到限制'
            ];
        }
        return [
            '界面复杂度增加',
            '需要时间学习新功能',
            '可能出现功能选择困难'
        ];
    }
    /**
     * 生成个性化消息
     */
    static generatePersonalizedMessage(recommendation, userExperience, behaviorPattern) {
        const { type } = recommendation;
        if (type === 'upgrade') {
            return `🎉 您已经是一位经验丰富的用户！您的${userExperience.totalSessions}次对话和对${userExperience.expertFeaturesUsed.length}个高级功能的探索表明您已经准备好体验专家模式的强大功能了。专家模式将为您提供更多创作自由和个性化控制选项。`;
        }
        else if (type === 'consider') {
            return `🤔 您正在稳步进步！再多探索一些功能，增加一些使用经验，很快就能解锁专家模式的全部潜力。我们建议您在接下来的1-2周内继续尝试新功能。`;
        }
        else {
            return `😊 简洁模式很适合您！继续享受当前的体验，随着您对平台的熟悉程度增加，我们会在合适的时机为您推荐升级。专注于探索基础功能，打好基础很重要。`;
        }
    }
    /**
     * 为已在专家模式的用户创建分析
     */
    static createExpertModeAnalysis(userId) {
        return {
            userId,
            currentMode: 'expert',
            recommendation: 'stay',
            confidence: 1.0,
            reasons: ['您已经在使用专家模式'],
            timeline: '持续使用',
            benefits: [
                '享受完整功能访问权限',
                '获得最佳创作体验',
                '拥有最大的自定义控制权'
            ],
            risks: [],
            readinessScore: 100,
            personalizedMessage: '🎯 您正在使用专家模式，享受TavernAI Plus的全部功能！如果您觉得界面过于复杂，随时可以切换回简洁模式。'
        };
    }
    /**
     * 批量分析多个用户的升级建议
     */
    static async batchAnalyzeUpgrades(userIds) {
        const analyses = await Promise.all(userIds.map(userId => this.analyzeUserUpgrade(userId).catch(error => {
            console.error(`Failed to analyze user ${userId}:`, error);
            return null;
        })));
        return analyses.filter(analysis => analysis !== null);
    }
    /**
     * 获取系统级升级统计
     */
    static async getUpgradeStatistics() {
        const [totalUsers, userModes, readyAnalyses] = await Promise.all([
            prisma.user.count(),
            prisma.userMode.findMany(),
            // 这里简化处理，实际应该分批计算
            prisma.userMode.count({ where: { currentMode: 'simplified' } })
        ]);
        const simplifiedUsers = userModes.filter(u => u.currentMode === 'simplified').length;
        const expertUsers = userModes.filter(u => u.currentMode === 'expert').length;
        // 估算准备升级的用户数（这里使用简化计算）
        const readyForUpgrade = Math.floor(simplifiedUsers * 0.2); // 假设20%的简洁模式用户准备升级
        const averageReadinessScore = 65; // 简化处理，实际应该计算真实分数
        const upgradeRate = expertUsers / totalUsers;
        return {
            totalUsers,
            simplifiedUsers,
            expertUsers,
            readyForUpgrade,
            averageReadinessScore,
            upgradeRate
        };
    }
}
exports.UpgradeAnalysisService = UpgradeAnalysisService;
//# sourceMappingURL=upgradeAnalysisService.js.map