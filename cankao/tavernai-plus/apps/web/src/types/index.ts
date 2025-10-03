/**
 * Central type exports for Universal UX System
 */

// Feature Management
export type {
  UserRole,
  FeatureConfig,
  FeatureAccessCheck,
  UnlockFeatureRequest,
  FeatureUnlock,
  FeatureListResponse,
  FeatureDetailResponse,
  FeatureAccessResponse,
  UserUnlocksResponse,
  UnlockFeatureResponse,
} from './features';

// User Experience
export type {
  Theme,
  ThemeConfig,
  NavigationItem,
  DashboardWidget,
  RoleViewConfig,
  OnboardingStep,
  OnboardingStatus,
  CharacterRecommendation,
  Tutorial,
  TutorialStep,
  TutorialProgress,
  NotificationType,
  NotificationPriority,
  Notification,
  NotificationPreferences,
  NotificationStats,
  UserPreferences,
  RoleViewResponse,
  OnboardingStatusResponse,
  RecommendationsResponse,
  TutorialListResponse,
  TutorialDetailResponse,
  TutorialProgressResponse,
  NotificationListResponse,
  NotificationCountResponse,
  NotificationStatsResponse,
} from './user-experience';
