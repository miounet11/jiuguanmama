export interface UpgradeAnalysis {
    userId: string;
    currentMode: string;
    recommendation: 'stay' | 'upgrade' | 'consider';
    confidence: number;
    reasons: string[];
    timeline: string;
    benefits: string[];
    risks: string[];
    readinessScore: number;
    personalizedMessage: string;
}
export interface UserBehaviorPattern {
    sessionFrequency: number;
    averageSessionLength: number;
    featureExplorationRate: number;
    expertFeatureAdoption: number;
    consistencyScore: number;
    learningVelocity: number;
}
/**
 * 升级分析服务类
 */
export declare class UpgradeAnalysisService {
    /**
     * 执行完整的升级分析
     */
    static analyzeUserUpgrade(userId: string): Promise<UpgradeAnalysis>;
    /**
     * 分析用户行为模式
     */
    private static analyzeBehaviorPattern;
    /**
     * 计算活跃天数
     */
    private static calculateDaysWithActivity;
    /**
     * 计算学习速度
     */
    private static calculateLearningVelocity;
    /**
     * 计算准备度分数 (0-100)
     */
    private static calculateReadinessScore;
    /**
     * 生成推荐决策
     */
    private static generateRecommendation;
    /**
     * 生成推荐理由
     */
    private static generateReasons;
    /**
     * 生成升级好处
     */
    private static generateBenefits;
    /**
     * 生成潜在风险
     */
    private static generateRisks;
    /**
     * 生成个性化消息
     */
    private static generatePersonalizedMessage;
    /**
     * 为已在专家模式的用户创建分析
     */
    private static createExpertModeAnalysis;
    /**
     * 批量分析多个用户的升级建议
     */
    static batchAnalyzeUpgrades(userIds: string[]): Promise<UpgradeAnalysis[]>;
    /**
     * 获取系统级升级统计
     */
    static getUpgradeStatistics(): Promise<{
        totalUsers: number;
        simplifiedUsers: number;
        expertUsers: number;
        readyForUpgrade: number;
        averageReadinessScore: number;
        upgradeRate: number;
    }>;
}
//# sourceMappingURL=upgradeAnalysisService.d.ts.map