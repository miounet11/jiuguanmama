export interface FeatureAccessCheck {
    canAccess: boolean;
    reason?: string;
    requiredLevel?: number;
    requiredRoles?: string[];
    missingDependencies?: string[];
}
export interface FeatureConfigData {
    id: string;
    featureId: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    requiredRoles: string[];
    minLevel: number;
    requiresPremium: boolean;
    dependencies: string[];
    enabled: boolean;
    beta: boolean;
    version: string;
    launchedAt?: Date;
    unlocked?: boolean;
    unlockedAt?: Date;
    unlockMethod?: string;
}
/**
 * FeatureGateService
 *
 * Manages feature access control and progressive disclosure.
 * Implements the F1 (Progressive Disclosure) and F7 (Feature Gate) features.
 */
export declare class FeatureGateService {
    /**
     * Check if a user can access a specific feature
     */
    canAccess(userId: string, featureId: string): Promise<FeatureAccessCheck>;
    /**
     * Unlock a feature for a user
     */
    unlockFeature(userId: string, featureId: string, unlockMethod?: 'level_up' | 'achievement' | 'payment' | 'manual'): Promise<boolean>;
    /**
     * Get all available features for a user
     */
    getAvailableFeatures(userId: string): Promise<FeatureConfigData[]>;
    /**
     * Get features unlocked by a user
     */
    getUserUnlocks(userId: string): Promise<string[]>;
    /**
     * Check and auto-unlock features based on level
     */
    autoUnlockFeaturesByLevel(userId: string, newLevel: number): Promise<string[]>;
}
export declare const featureGateService: FeatureGateService;
//# sourceMappingURL=feature-gate.service.d.ts.map