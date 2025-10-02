/**
 * User Experience Types
 * Covers role views, onboarding, tutorials, and notifications
 */

export type UserRole = 'player' | 'creator' | 'admin';
export type Theme = 'dark' | 'light';

// Role-Based View Types
export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  requiredFeatures?: string[];
  visible: boolean;
  badge?: string | number;
  children?: NavigationItem[];
}

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  description?: string;
  data: any;
  position: { x: number; y: number; w: number; h: number };
  refreshInterval?: number;
}

export interface RoleViewConfig {
  role: UserRole;
  theme: ThemeConfig;
  navigation: NavigationItem[];
  dashboard: DashboardWidget[];
  features: string[];
}

// Onboarding Types
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'input' | 'selection' | 'action';
  optional: boolean;
  completed: boolean;
  data?: any;
}

export interface OnboardingStatus {
  userId: string;
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  skipped: boolean;
  steps: OnboardingStep[];
  progress: number;
}

export interface CharacterRecommendation {
  characterId: string;
  name: string;
  description: string;
  avatar?: string;
  matchScore: number;
  matchReasons: string[];
  tags: string[];
}

// Tutorial Types
export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedTime: number;
  steps: TutorialStep[];
  prerequisites?: string[];
}

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: string;
  action?: {
    type: string;
    target: string;
    params?: any;
  };
  validation?: {
    type: string;
    condition: any;
  };
}

export interface TutorialProgress {
  id: string;
  userId: string;
  tutorialId: string;
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  skipped: boolean;
  startedAt: Date;
  completedAt?: Date;
}

// Notification Types
export type NotificationType = 'feature_launch' | 'achievement' | 'alert' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  description: string;
  icon?: string;
  actionLabel?: string;
  actionPath?: string;
  priority: NotificationPriority;
  read: boolean;
  archived: boolean;
  createdAt: Date;
  readAt?: Date;
}

export interface NotificationPreferences {
  featureLaunchAlerts: boolean;
  achievementAlerts: boolean;
  systemAlerts: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

// User Preferences Types
export interface UserPreferences {
  userId: string;
  primaryRole: UserRole;
  theme: Theme;
  language: string;
  dashboardLayout: any;
  navigationCollapsed: boolean;
  progressiveDisclosure: boolean;
  showTutorials: boolean;
  showNewBadges: boolean;
  autoUnlockFeatures: boolean;
  notifications: NotificationPreferences;
}

// API Response Types
export interface RoleViewResponse {
  success: boolean;
  data: RoleViewConfig;
}

export interface OnboardingStatusResponse {
  success: boolean;
  data: OnboardingStatus;
}

export interface RecommendationsResponse {
  success: boolean;
  data: CharacterRecommendation[];
  count: number;
}

export interface TutorialListResponse {
  success: boolean;
  data: Tutorial[];
  count: number;
}

export interface TutorialDetailResponse {
  success: boolean;
  data: Tutorial;
}

export interface TutorialProgressResponse {
  success: boolean;
  data: TutorialProgress;
}

export interface NotificationListResponse {
  success: boolean;
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NotificationCountResponse {
  success: boolean;
  data: { count: number };
}

export interface NotificationStatsResponse {
  success: boolean;
  data: NotificationStats;
}
