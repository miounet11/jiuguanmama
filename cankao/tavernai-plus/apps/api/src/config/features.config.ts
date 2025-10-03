/**
 * Feature Flag Configuration (T073)
 * Manages feature flags for gradual rollout and A/B testing
 */

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  // Rollout strategy
  rolloutPercentage?: number; // 0-100
  rolloutType?: 'percentage' | 'user_list' | 'role' | 'all';
  // User targeting
  allowedUsers?: string[]; // User IDs
  allowedRoles?: string[]; // User roles
  // Environment
  environments?: string[]; // ['development', 'staging', 'production']
  // Beta testing
  betaOnly?: boolean;
  betaUsers?: string[];
  // Dependencies
  requiresFeatures?: string[]; // Other feature IDs that must be enabled
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

/**
 * Feature Flag Manager
 */
export class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  private flags: Map<string, FeatureFlag> = new Map();

  private constructor() {
    this.initializeFlags();
  }

  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  /**
   * Initialize default feature flags
   */
  private initializeFlags(): void {
    const defaultFlags: FeatureFlag[] = [
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
  isFeatureEnabled(
    featureId: string,
    context: {
      userId?: string;
      userRole?: string;
      environment?: string;
      isBetaUser?: boolean;
    }
  ): boolean {
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
        if (!context.userId || !flag.allowedUsers) return false;
        return flag.allowedUsers.includes(context.userId);

      case 'role':
        if (!context.userRole || !flag.allowedRoles) return false;
        return flag.allowedRoles.includes(context.userRole);

      case 'percentage':
        if (!context.userId) return false;
        return this.isUserInPercentage(context.userId, flag.rolloutPercentage || 0);

      default:
        return false;
    }
  }

  /**
   * Check if user is in rollout percentage (deterministic)
   */
  private isUserInPercentage(userId: string, percentage: number): boolean {
    if (percentage >= 100) return true;
    if (percentage <= 0) return false;

    // Use consistent hash of userId to determine inclusion
    const hash = this.hashString(userId);
    const userPercentage = (hash % 100) + 1;

    return userPercentage <= percentage;
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
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
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get feature flag by ID
   */
  getFlag(featureId: string): FeatureFlag | undefined {
    return this.flags.get(featureId);
  }

  /**
   * Update feature flag
   */
  updateFlag(featureId: string, updates: Partial<FeatureFlag>): boolean {
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
  enableFlag(featureId: string): boolean {
    return this.updateFlag(featureId, { enabled: true });
  }

  /**
   * Disable feature flag
   */
  disableFlag(featureId: string): boolean {
    return this.updateFlag(featureId, { enabled: false });
  }

  /**
   * Set rollout percentage
   */
  setRolloutPercentage(featureId: string, percentage: number): boolean {
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
  addBetaUser(featureId: string, userId: string): boolean {
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
  removeBetaUser(featureId: string, userId: string): boolean {
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
  getUserFeatureStatus(
    userId: string,
    userRole: string,
    isBetaUser: boolean = false
  ): Record<string, boolean> {
    const environment = process.env.NODE_ENV || 'development';
    const status: Record<string, boolean> = {};

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
  exportFlags(): string {
    const flags = this.getAllFlags();
    return JSON.stringify(flags, null, 2);
  }

  /**
   * Import flags from JSON
   */
  importFlags(json: string): boolean {
    try {
      const flags: FeatureFlag[] = JSON.parse(json);

      flags.forEach((flag) => {
        this.flags.set(flag.id, flag);
      });

      console.log(`[FeatureFlags] Imported ${flags.length} flags`);
      return true;
    } catch (error) {
      console.error('[FeatureFlags] Import failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const featureFlagManager = FeatureFlagManager.getInstance();
export default featureFlagManager;
