/**
 * Feature Flag Configuration (T073)
 * Manages feature flags for gradual rollout and A/B testing
 */
export interface FeatureFlag {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    rolloutPercentage?: number;
    rolloutType?: 'percentage' | 'user_list' | 'role' | 'all';
    allowedUsers?: string[];
    allowedRoles?: string[];
    environments?: string[];
    betaOnly?: boolean;
    betaUsers?: string[];
    requiresFeatures?: string[];
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
}
/**
 * Feature Flag Manager
 */
export declare class FeatureFlagManager {
    private static instance;
    private flags;
    private constructor();
    static getInstance(): FeatureFlagManager;
    /**
     * Initialize default feature flags
     */
    private initializeFlags;
    /**
     * Check if feature is enabled for a user
     */
    isFeatureEnabled(featureId: string, context: {
        userId?: string;
        userRole?: string;
        environment?: string;
        isBetaUser?: boolean;
    }): boolean;
    /**
     * Check if user is in rollout percentage (deterministic)
     */
    private isUserInPercentage;
    /**
     * Simple string hash function
     */
    private hashString;
    /**
     * Get all feature flags
     */
    getAllFlags(): FeatureFlag[];
    /**
     * Get feature flag by ID
     */
    getFlag(featureId: string): FeatureFlag | undefined;
    /**
     * Update feature flag
     */
    updateFlag(featureId: string, updates: Partial<FeatureFlag>): boolean;
    /**
     * Enable feature flag
     */
    enableFlag(featureId: string): boolean;
    /**
     * Disable feature flag
     */
    disableFlag(featureId: string): boolean;
    /**
     * Set rollout percentage
     */
    setRolloutPercentage(featureId: string, percentage: number): boolean;
    /**
     * Add user to beta
     */
    addBetaUser(featureId: string, userId: string): boolean;
    /**
     * Remove user from beta
     */
    removeBetaUser(featureId: string, userId: string): boolean;
    /**
     * Get feature flag status for user
     */
    getUserFeatureStatus(userId: string, userRole: string, isBetaUser?: boolean): Record<string, boolean>;
    /**
     * Export flags as JSON
     */
    exportFlags(): string;
    /**
     * Import flags from JSON
     */
    importFlags(json: string): boolean;
}
export declare const featureFlagManager: FeatureFlagManager;
export default featureFlagManager;
//# sourceMappingURL=features.config.d.ts.map