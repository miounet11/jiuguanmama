export interface FeatureDefinition {
    id: string;
    name: string;
    category: 'core' | 'advanced' | 'expert';
    isExpertFeature: boolean;
    unlockCondition?: string;
    dependencies?: string[];
    scope: string[];
}
export interface UserExperience {
    totalSessions: number;
    messagesCount: number;
    charactersUsed: number;
    featuresUsed: string[];
    expertFeaturesUsed: string[];
    skillLevel: string;
}
export declare const FEATURE_MANIFEST: FeatureDefinition[];
/**
 * 功能追踪服务类
 */
export declare class FeatureTrackingService {
    /**
     * 记录功能使用并检查解锁条件
     */
    static recordFeatureUsage(userId: string, featureId: string): Promise<{
        recorded: boolean;
        newUnlocks: string[];
        skillLevelChanged: boolean;
        newSkillLevel?: string;
    }>;
    /**
     * 获取用户体验数据
     */
    static getUserExperience(userId: string): Promise<UserExperience>;
    /**
     * 检查功能解锁条件
     */
    static checkFeatureUnlocks(userId: string, userExperience: UserExperience): Promise<string[]>;
    /**
     * 安全地评估解锁条件
     */
    static evaluateUnlockCondition(condition: string, userExp: UserExperience): boolean;
    /**
     * 更新用户技能水平
     */
    static updateSkillLevel(userId: string, userExperience: UserExperience): Promise<{
        changed: boolean;
        newLevel?: string;
    }>;
    /**
     * 获取指定范围的功能清单
     */
    static getFeatureManifest(scope?: string): FeatureDefinition[];
    /**
     * 获取用户可见的功能
     */
    static getVisibleFeatures(userId: string, mode: 'simplified' | 'expert', scope?: string): Promise<FeatureDefinition[]>;
    /**
     * 分析用户升级到专家模式的时机
     */
    static analyzeUpgradeOpportunity(userId: string): Promise<{
        shouldUpgrade: boolean;
        confidence: number;
        reasons: string[];
        signals: Record<string, boolean>;
    }>;
}
//# sourceMappingURL=featureTrackingService.d.ts.map