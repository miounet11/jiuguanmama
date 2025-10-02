/**
 * Central store exports for Universal UX System
 * Pinia stores for state management
 */

// Core stores
export { useFeatureStore } from './features';
export { useUserViewStore } from './userView';
export { useNotificationStore } from './notifications';
export { useOnboardingStore } from './onboarding';
export { useTutorialStore } from './tutorials';

// Dashboard stores
export { useCreatorStudioStore } from './creatorStudio';
export { useGamificationStore } from './gamification';
export { useAdminConsoleStore } from './adminConsole';
export { useCreatorDashboardStore } from './creatorDashboard';
export { usePlayerDashboardStore } from './playerDashboard';
export { useAdminDashboardStore } from './adminDashboard';

// View stores
export { useExploreViewStore } from './exploreViewStore';
export { useSettingsViewStore } from './settingsViewStore';

// Re-export store types for convenience
export type { FeatureConfig } from '@/types';
export type { RoleViewConfig, UserRole, NavigationItem } from '@/types';
export type { Notification, NotificationStats } from '@/types';
export type { OnboardingStatus, CharacterRecommendation } from '@/types';
export type { Tutorial, TutorialProgress } from '@/types';
