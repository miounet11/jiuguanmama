export type RecommendationType = 'character' | 'post' | 'user' | 'creator';
interface RecommendationConfig {
    algorithm: 'collaborative' | 'content' | 'hybrid';
    maxResults: number;
    diversityWeight: number;
    freshnessWeight: number;
    popularityWeight: number;
    personalWeight: number;
}
/**
 * 智能推荐引擎
 * 支持多种推荐算法和实时个性化推荐
 */
export declare class RecommendationEngine {
    private userProfiles;
    private itemVectors;
    private userSimilarities;
    private config;
    constructor();
    /**
     * 初始化推荐引擎
     */
    private initializeEngine;
    /**
     * 获取角色推荐
     */
    getCharacterRecommendations(userId: string, options?: Partial<RecommendationConfig>): Promise<{
        characters: any[];
        algorithm: string;
        confidence: number;
        explanation: string[];
    }>;
    /**
     * 获取社区动态推荐
     */
    getPostRecommendations(userId: string, options?: Partial<RecommendationConfig>): Promise<{
        posts: any[];
        algorithm: string;
        confidence: number;
        explanation: string[];
    }>;
    /**
     * 获取用户推荐
     */
    getUserRecommendations(userId: string, options?: Partial<RecommendationConfig>): Promise<{
        users: any[];
        algorithm: string;
        confidence: number;
        explanation: string[];
    }>;
    /**
     * 记录用户行为
     */
    recordUserBehavior(userId: string, action: string, targetType: string, targetId: string, metadata?: any): Promise<void>;
    /**
     * 获取推荐解释
     */
    getRecommendationExplanation(userId: string, itemId: string, itemType: string): Promise<{
        reasons: string[];
        confidence: number;
        factors: {
            [key: string]: number;
        };
    }>;
    /**
     * 获取推荐统计
     */
    getRecommendationStats(timeRange?: {
        start: Date;
        end: Date;
    }): Promise<{
        totalRecommendations: number;
        clickThroughRate: number;
        conversionRate: number;
        userEngagement: number;
        algorithmPerformance: {
            [key: string]: number;
        };
        topRecommendedItems: any[];
    }>;
    /**
     * 加载用户画像
     */
    private loadUserProfiles;
    /**
     * 构建物品特征向量
     */
    private buildItemVectors;
    /**
     * 提取角色特征
     */
    private extractCharacterFeatures;
    /**
     * 计算余弦相似度
     */
    private calculateCosineSimilarity;
    /**
     * 协同过滤角色推荐
     */
    private getCollaborativeCharacterRecommendations;
    /**
     * 基于内容的角色推荐
     */
    private getContentBasedCharacterRecommendations;
    /**
     * 冷启动角色推荐
     */
    private getColdStartCharacterRecommendations;
    /**
     * 混合推荐合并
     */
    private hybridMerge;
    /**
     * 应用多样性过滤
     */
    private applyDiversityFilter;
    /**
     * 应用新鲜度过滤
     */
    private applyFreshnessFilter;
    /**
     * 记录推荐日志
     */
    private logRecommendation;
    /**
     * 计算推荐置信度
     */
    private calculateConfidence;
    /**
     * 获取用户行为数据
     */
    private getUserBehaviorData;
    /**
     * 更新用户画像
     */
    private updateUserProfile;
    /**
     * 计算用户偏好向量
     */
    private calculateUserPreferenceVector;
    /**
     * 计算向量相似度
     */
    private calculateVectorSimilarity;
    /**
     * 计算内容相似度
     */
    private calculateContentSimilarity;
    private getUserInterests;
    private getFollowingPosts;
    private getInterestBasedPosts;
    private getTrendingPosts;
    private mergePostRecommendations;
    private deduplicatePosts;
    private filterSeenPosts;
    private applyTimeDecay;
    private getSimilarUsers;
    private getCommonInterestUsers;
    private getPopularCreators;
    private mergeUserRecommendations;
    private filterFollowedUsers;
    /**
     * 跟踪模型性能指标
     */
    trackModelPerformance(userId: string, targetId: string, score: number): Promise<void>;
    /**
     * 重新训练推荐模型
     */
    retrainModels(): Promise<void>;
    /**
     * 重新计算物品特征向量
     */
    private computeItemVectors;
    /**
     * 更新所有用户画像
     */
    private updateAllUserProfiles;
    /**
     * 评估模型性能
     */
    private evaluateModelPerformance;
    /**
     * 字符串哈希函数
     */
    private stringToHash;
}
declare const _default: RecommendationEngine;
export default _default;
//# sourceMappingURL=recommendationEngine.d.ts.map