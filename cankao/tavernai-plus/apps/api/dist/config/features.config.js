"use strict";
/**
 * Feature Flag Configuration (T073)
 * Manages feature flags for gradual rollout and A/B testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureFlagManager = exports.FeatureFlagManager = void 0;
/**
 * Feature Flag Manager
 */
class FeatureFlagManager {
    static instance;
    flags = new Map();
    constructor() {
        this.initializeFlags();
    }
    static getInstance() {
        if (!FeatureFlagManager.instance) {
            FeatureFlagManager.instance = new FeatureFlagManager();
        }
        return FeatureFlagManager.instance;
    }
    /**
     * Initialize default feature flags
     */
    initializeFlags() {
        const defaultFlags = [
            {
                id: 'F1',
                name: 'Progressive Feature Disclosure',
                description: 'Gradual UI element revelation based on user level',
                enabled: true,
                rolloutType: 'all',
                environments: ['development', 'staging', 'production'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'F2',
                name: 'Role-Oriented Views',
                description: 'Customized dashboards per user role',
                enabled: true,
                rolloutType: 'all',
                environments: ['development', 'staging', 'production'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'F3',
                name: 'Intelligent Onboarding',
                description: 'Smart onboarding with MBTI and personalization',
                enabled: true,
                rolloutType: 'percentage',
                rolloutPercentage: 100,
                environments: ['development', 'staging', 'production'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'F4',
                name: 'Creator Studio',
                description: 'Advanced creator tools and analytics',
                enabled: true,
                rolloutType: 'role',
                allowedRoles: ['creator', 'admin'],
                environments: ['development', 'staging', 'production'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'F5',
                name: 'Gamification Dashboard',
                description: 'Achievement and progression tracking',
                enabled: true,
                rolloutType: 'percentage',
                rolloutPercentage: 100,
                environments: ['development', 'staging', 'production'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'F6',
                name: 'Admin Console',
                description: 'System monitoring and management',
                enabled: true,
                rolloutType: 'role',
                allowedRoles: ['admin'],
                environments: ['development', 'staging', 'production'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'F7',
                name: 'AI Content Generation',
                description: 'AI-powered character and scenario generation',
                enabled: true,
                rolloutType: 'percentage',
                rolloutPercentage: 80,
                requiresFeatures: ['F4'],
                environments: ['development', 'staging', 'production'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'F8',
                name: 'Feature Gate System',
                description: 'Progressive feature unlocking framework',
                enabled: true,
                rolloutType: 'all',
                environments: ['development', 'staging', 'production'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'F9',
                name: 'Tutorial System',
                description: 'Interactive tutorials and tooltips',
                enabled: true,
                rolloutType: 'percentage',
                rolloutPercentage: 100,
                environments: ['development', 'staging', 'production'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'F10',
                name: 'Real-time Notifications',
                description: 'WebSocket-based instant notifications',
                enabled: true,
                rolloutType: 'all',
                environments: ['development', 'staging', 'production'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'F11',
                name: 'Advanced Analytics',
                description: 'Detailed analytics and insights',
                enabled: false, // Not yet implemented
                rolloutType: 'percentage',
                rolloutPercentage: 0,
                betaOnly: true,
                environments: ['development'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'F12',
                name: 'Help Center',
                description: 'In-app help and documentation',
                enabled: false, // Not yet implemented
                rolloutType: 'percentage',
                rolloutPercentage: 0,
                environments: ['development'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];
        defaultFlags.forEach((flag) => {
            this.flags.set(flag.id, flag);
        });
        console.log(`[FeatureFlags] Initialized ${this.flags.size} feature flags`);
    }
    /**
     * Check if feature is enabled for a user
     */
    isFeatureEnabled(featureId, context) {
        const flag = this.flags.get(featureId);
        if (!flag) {
            console.warn(`[FeatureFlags] Flag not found: ${featureId}`);
            return false;
        }
        // Check if flag is globally enabled
        if (!flag.enabled) {
            return false;
        }
        // Check environment
        const currentEnv = context.environment || process.env.NODE_ENV || 'development';
        if (flag.environments && !flag.environments.includes(currentEnv)) {
            return false;
        }
        // Check beta restriction
        if (flag.betaOnly && !context.isBetaUser) {
            return false;
        }
        if (flag.betaUsers && context.userId && !flag.betaUsers.includes(context.userId)) {
            return false;
        }
        // Check rollout strategy
        switch (flag.rolloutType) {
            case 'all':
                return true;
            case 'user_list':
                if (!context.userId || !flag.allowedUsers)
                    return false;
                return flag.allowedUsers.includes(context.userId);
            case 'role':
                if (!context.userRole || !flag.allowedRoles)
                    return false;
                return flag.allowedRoles.includes(context.userRole);
            case 'percentage':
                if (!context.userId)
                    return false;
                return this.isUserInPercentage(context.userId, flag.rolloutPercentage || 0);
            default:
                return false;
        }
    }
    /**
     * Check if user is in rollout percentage (deterministic)
     */
    isUserInPercentage(userId, percentage) {
        if (percentage >= 100)
            return true;
        if (percentage <= 0)
            return false;
        // Use consistent hash of userId to determine inclusion
        const hash = this.hashString(userId);
        const userPercentage = (hash % 100) + 1;
        return userPercentage <= percentage;
    }
    /**
     * Simple string hash function
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }
    /**
     * Get all feature flags
     */
    getAllFlags() {
        return Array.from(this.flags.values());
    }
    /**
     * Get feature flag by ID
     */
    getFlag(featureId) {
        return this.flags.get(featureId);
    }
    /**
     * Update feature flag
     */
    updateFlag(featureId, updates) {
        const flag = this.flags.get(featureId);
        if (!flag) {
            console.error(`[FeatureFlags] Cannot update non-existent flag: ${featureId}`);
            return false;
        }
        const updatedFlag = {
            ...flag,
            ...updates,
            updatedAt: new Date(),
        };
        this.flags.set(featureId, updatedFlag);
        console.log(`[FeatureFlags] Updated flag: ${featureId}`);
        return true;
    }
    /**
     * Enable feature flag
     */
    enableFlag(featureId) {
        return this.updateFlag(featureId, { enabled: true });
    }
    /**
     * Disable feature flag
     */
    disableFlag(featureId) {
        return this.updateFlag(featureId, { enabled: false });
    }
    /**
     * Set rollout percentage
     */
    setRolloutPercentage(featureId, percentage) {
        if (percentage < 0 || percentage > 100) {
            console.error(`[FeatureFlags] Invalid percentage: ${percentage}`);
            return false;
        }
        return this.updateFlag(featureId, {
            rolloutType: 'percentage',
            rolloutPercentage: percentage,
        });
    }
    /**
     * Add user to beta
     */
    addBetaUser(featureId, userId) {
        const flag = this.flags.get(featureId);
        if (!flag) {
            return false;
        }
        const betaUsers = flag.betaUsers || [];
        if (!betaUsers.includes(userId)) {
            betaUsers.push(userId);
        }
        return this.updateFlag(featureId, { betaUsers });
    }
    /**
     * Remove user from beta
     */
    removeBetaUser(featureId, userId) {
        const flag = this.flags.get(featureId);
        if (!flag || !flag.betaUsers) {
            return false;
        }
        const betaUsers = flag.betaUsers.filter((id) => id !== userId);
        return this.updateFlag(featureId, { betaUsers });
    }
    /**
     * Get feature flag status for user
     */
    getUserFeatureStatus(userId, userRole, isBetaUser = false) {
        const environment = process.env.NODE_ENV || 'development';
        const status = {};
        this.flags.forEach((flag, featureId) => {
            status[featureId] = this.isFeatureEnabled(featureId, {
                userId,
                userRole,
                environment,
                isBetaUser,
            });
        });
        return status;
    }
    /**
     * Export flags as JSON
     */
    exportFlags() {
        const flags = this.getAllFlags();
        return JSON.stringify(flags, null, 2);
    }
    /**
     * Import flags from JSON
     */
    importFlags(json) {
        try {
            const flags = JSON.parse(json);
            flags.forEach((flag) => {
                this.flags.set(flag.id, flag);
            });
            console.log(`[FeatureFlags] Imported ${flags.length} flags`);
            return true;
        }
        catch (error) {
            console.error('[FeatureFlags] Import failed:', error);
            return false;
        }
    }
}
exports.FeatureFlagManager = FeatureFlagManager;
// Export singleton instance
exports.featureFlagManager = FeatureFlagManager.getInstance();
exports.default = exports.featureFlagManager;
//# sourceMappingURL=features.config.js.map