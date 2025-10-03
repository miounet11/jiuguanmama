/**
 * Feature Management Types
 * Matches API contracts from backend routes
 */

export type UserRole = 'player' | 'creator' | 'admin';

export interface FeatureConfig {
  id: string;
  featureId: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requiredRoles: UserRole[];
  minLevel: number;
  requiresPremium: boolean;
  dependencies: string[];
  enabled: boolean;
  beta: boolean;
  version: string;
  launchedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureAccessCheck {
  canAccess: boolean;
  reason?: string;
  requiredLevel?: number;
  requiresPremium?: boolean;
  missingDependencies?: string[];
}

export interface UnlockFeatureRequest {
  featureId: string;
  unlockMethod: 'level_up' | 'achievement' | 'payment' | 'manual';
}

export interface FeatureUnlock {
  id: string;
  userId: string;
  featureId: string;
  unlockTrigger: string;
  unlockCondition?: string;
  unlockedAt: Date;
}

// API Response Types
export interface FeatureListResponse {
  success: boolean;
  data: FeatureConfig[];
  count: number;
}

export interface FeatureDetailResponse {
  success: boolean;
  data: FeatureConfig;
}

export interface FeatureAccessResponse {
  success: boolean;
  data: FeatureAccessCheck;
}

export interface UserUnlocksResponse {
  success: boolean;
  data: string[];
  count: number;
}

export interface UnlockFeatureResponse {
  success: boolean;
  message: string;
  data?: FeatureUnlock;
}
