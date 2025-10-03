"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureGateService = exports.FeatureGateService = void 0;
const client_1 = require("../../node_modules/.prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * FeatureGateService
 *
 * Manages feature access control and progressive disclosure.
 * Implements the F1 (Progressive Disclosure) and F7 (Feature Gate) features.
 */
class FeatureGateService {
    /**
     * Check if a user can access a specific feature
     */
    async canAccess(userId, featureId) {
        try {
            // Get user data
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    role: true,
                    subscriptionTier: true,
                    userMode: {
                        select: {
                            currentMode: true,
                            userLevel: true,
                        },
                    },
                },
            });
            if (!user) {
                return {
                    canAccess: false,
                    reason: 'User not found',
                };
            }
            // Get feature configuration
            const featureConfig = await prisma.featureConfig.findUnique({
                where: { featureId },
            });
            if (!featureConfig) {
                return {
                    canAccess: false,
                    reason: 'Feature not found',
                };
            }
            // Check if feature is enabled
            if (!featureConfig.enabled) {
                return {
                    canAccess: false,
                    reason: 'Feature is currently disabled',
                };
            }
            // Parse required roles
            const requiredRoles = JSON.parse(featureConfig.requiredRoles);
            // Check role requirement
            if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
                return {
                    canAccess: false,
                    reason: 'Insufficient role permissions',
                    requiredRoles,
                };
            }
            // Check level requirement
            const userLevel = user.userMode?.userLevel || 1;
            if (userLevel < featureConfig.minLevel) {
                return {
                    canAccess: false,
                    reason: 'User level too low',
                    requiredLevel: featureConfig.minLevel,
                };
            }
            // Check premium requirement
            if (featureConfig.requiresPremium && user.subscriptionTier === 'free') {
                return {
                    canAccess: false,
                    reason: 'Premium subscription required',
                };
            }
            // Check dependencies
            const dependencies = JSON.parse(featureConfig.dependencies);
            if (dependencies.length > 0) {
                const missingDependencies = [];
                for (const depFeatureId of dependencies) {
                    const depCheck = await this.canAccess(userId, depFeatureId);
                    if (!depCheck.canAccess) {
                        missingDependencies.push(depFeatureId);
                    }
                }
                if (missingDependencies.length > 0) {
                    return {
                        canAccess: false,
                        reason: 'Missing required dependencies',
                        missingDependencies,
                    };
                }
            }
            // All checks passed
            return {
                canAccess: true,
            };
        }
        catch (error) {
            console.error('Error checking feature access:', error);
            return {
                canAccess: false,
                reason: 'Internal error',
            };
        }
    }
    /**
     * Unlock a feature for a user
     */
    async unlockFeature(userId, featureId, unlockMethod = 'manual') {
        try {
            // Check if already unlocked
            const existing = await prisma.featureUnlock.findFirst({
                where: {
                    userId,
                    featureId,
                },
            });
            if (existing) {
                return true; // Already unlocked
            }
            // Verify feature exists
            const featureConfig = await prisma.featureConfig.findUnique({
                where: { featureId },
            });
            if (!featureConfig) {
                throw new Error('Feature not found');
            }
            // Create unlock record
            await prisma.featureUnlock.create({
                data: {
                    userId,
                    featureId,
                    unlockTrigger: unlockMethod,
                    unlockCondition: null,
                    unlockedAt: new Date(),
                },
            });
            // Create notification
            await prisma.notification.create({
                data: {
                    userId,
                    type: 'feature_launch',
                    title: `新功能已解锁: ${featureConfig.name}`,
                    description: featureConfig.description,
                    icon: featureConfig.icon,
                    priority: 'normal',
                },
            });
            return true;
        }
        catch (error) {
            console.error('Error unlocking feature:', error);
            return false;
        }
    }
    /**
     * Get all available features for a user
     */
    async getAvailableFeatures(userId) {
        try {
            // Get all enabled features
            const features = await prisma.featureConfig.findMany({
                where: {
                    enabled: true,
                },
                orderBy: [
                    { category: 'asc' },
                    { minLevel: 'asc' },
                ],
            });
            // Get user's unlocks
            const unlocks = await prisma.featureUnlock.findMany({
                where: { userId },
            });
            const unlockMap = new Map(unlocks.map(u => [u.featureId, { unlockedAt: u.unlockedAt, unlockMethod: u.unlockTrigger }]));
            // Map features with unlock status
            const result = [];
            for (const feature of features) {
                const accessCheck = await this.canAccess(userId, feature.featureId);
                const unlock = unlockMap.get(feature.featureId);
                result.push({
                    id: feature.id,
                    featureId: feature.featureId,
                    name: feature.name,
                    description: feature.description,
                    icon: feature.icon,
                    category: feature.category,
                    requiredRoles: JSON.parse(feature.requiredRoles),
                    minLevel: feature.minLevel,
                    requiresPremium: feature.requiresPremium,
                    dependencies: JSON.parse(feature.dependencies),
                    enabled: feature.enabled,
                    beta: feature.beta,
                    version: feature.version,
                    launchedAt: feature.launchedAt || undefined,
                    unlocked: accessCheck.canAccess,
                    unlockedAt: unlock?.unlockedAt,
                    unlockMethod: unlock?.unlockMethod,
                });
            }
            return result;
        }
        catch (error) {
            console.error('Error getting available features:', error);
            return [];
        }
    }
    /**
     * Get features unlocked by a user
     */
    async getUserUnlocks(userId) {
        try {
            const unlocks = await prisma.featureUnlock.findMany({
                where: { userId },
                select: { featureId: true },
            });
            return unlocks.map(u => u.featureId);
        }
        catch (error) {
            console.error('Error getting user unlocks:', error);
            return [];
        }
    }
    /**
     * Check and auto-unlock features based on level
     */
    async autoUnlockFeaturesByLevel(userId, newLevel) {
        try {
            // Get user preferences
            const prefs = await prisma.userPreferenceExtended.findUnique({
                where: { userId },
            });
            if (!prefs?.autoUnlockFeatures) {
                return []; // Auto-unlock disabled
            }
            // Get features that should be unlocked at this level
            const features = await prisma.featureConfig.findMany({
                where: {
                    enabled: true,
                    minLevel: {
                        lte: newLevel,
                    },
                },
            });
            const unlockedFeatures = [];
            for (const feature of features) {
                const accessCheck = await this.canAccess(userId, feature.featureId);
                if (accessCheck.canAccess) {
                    const unlocked = await this.unlockFeature(userId, feature.featureId, 'level_up');
                    if (unlocked) {
                        unlockedFeatures.push(feature.featureId);
                    }
                }
            }
            return unlockedFeatures;
        }
        catch (error) {
            console.error('Error auto-unlocking features:', error);
            return [];
        }
    }
}
exports.FeatureGateService = FeatureGateService;
// Export singleton instance
exports.featureGateService = new FeatureGateService();
//# sourceMappingURL=feature-gate.service.js.map