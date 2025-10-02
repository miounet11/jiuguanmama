# Universal User Experience System - Implementation Plan

**Feature**: Universal User Experience System
**Created**: 2025-09-30
**Status**: Planning
**Version**: 1.0.0
**Timeline**: 12 weeks (3 months)

---

## Executive Summary

### Feature Overview
The Universal User Experience System transforms Spacetime Tavern into an intelligent, adaptive platform that provides tailored experiences for creators, players, and administrators. Through progressive feature disclosure, role-oriented interfaces, and intelligent onboarding, the system ensures every user can quickly and efficiently leverage platform capabilities while supporting seamless future expansion.

### Implementation Approach
We will adopt a phased approach starting with foundational infrastructure (feature gating, role management), followed by role-specific dashboards, then AI-powered enhancements, and finally integration frameworks. The implementation follows TypeScript-first, production-ready principles with comprehensive testing at each phase.

### Success Criteria
- Creator efficiency: Character creation time reduced from 15 min to 5 min
- Player retention: 7-day retention increased from 40% to 60%
- Admin efficiency: Platform monitoring time reduced from 20 min to 5 min
- Feature discovery: New feature discovery time reduced from 7 days to 1 day
- User satisfaction: NPS score increased from 40 to 60

---

## Phase 0: Research & Analysis (Week 1)

### Technical Research
- [x] Analyze existing codebase structure (Prisma models, API patterns, Vue components)
- [ ] Research progressive disclosure patterns and best practices
- [ ] Evaluate role-based access control (RBAC) implementations
- [ ] Study onboarding flow optimization techniques
- [ ] Review gamification integration strategies

### Architecture Analysis
- [ ] Map current system architecture and identify integration points
- [ ] Analyze existing user, character, scenario, and gamification models
- [ ] Review current API route organization and middleware patterns
- [ ] Assess Vue component structure and state management approach
- [ ] Evaluate performance implications of new features

### Risk Assessment
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Feature complexity overwhelms users | High | Medium | Progressive disclosure with gradual unlock |
| Performance degradation from role checks | Medium | Low | Implement caching layer for permissions |
| Breaking changes to existing UI | High | Medium | Feature flags for gradual rollout |
| AI generation quality inconsistency | Medium | Medium | Multiple model fallbacks and user feedback |
| Database migration complexity | High | Low | Staged migrations with rollback plans |

---

## Phase 1: Foundation & Contracts (Week 2-3)

### 1.1 Data Model Design

#### Database Schema Extensions
```prisma
// Feature configuration and gating
model FeatureConfig {
  id              String   @id @default(uuid())
  featureId       String   @unique
  name            String
  description     String
  icon            String
  category        String
  requiredRoles   Json     // UserRole[]
  minLevel        Int      @default(1)
  requiresPremium Boolean  @default(false)
  dependencies    Json     // string[]
  enabled         Boolean  @default(true)
  beta            Boolean  @default(false)
  version         String
  launchedAt      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  unlocks         FeatureUnlock[]
  
  @@index([category])
  @@index([enabled])
}

// User feature unlocks
model FeatureUnlock {
  id           String   @id @default(uuid())
  userId       String
  featureId    String
  unlockedAt   DateTime @default(now())
  unlockMethod String   // 'level_up', 'achievement', 'payment', 'manual'
  
  // Relations
  user         User          @relation(fields: [userId], references: [id])
  feature      FeatureConfig @relation(fields: [featureId], references: [id])
  
  @@unique([userId, featureId])
  @@index([userId])
  @@index([featureId])
}

// User preferences extension
model UserPreferenceExtended {
  id                    String   @id @default(uuid())
  userId                String   @unique
  
  // Interface preferences
  primaryRole           String   @default("player")
  theme                 String   @default("dark")
  language              String   @default("zh-CN")
  dashboardLayout       Json     // Custom dashboard widget layout
  navigationCollapsed   Boolean  @default(false)
  
  // Feature preferences
  progressiveDisclosure Boolean  @default(true)
  showTutorials         Boolean  @default(true)
  showNewBadges         Boolean  @default(true)
  autoUnlockFeatures    Boolean  @default(true)
  
  // Notification preferences
  featureLaunchAlerts   Boolean  @default(true)
  achievementAlerts     Boolean  @default(true)
  systemAlerts          Boolean  @default(false)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relations
  user                  User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
}

// Tutorial progress tracking
model TutorialProgress {
  id          String   @id @default(uuid())
  userId      String
  tutorialId  String
  currentStep Int      @default(0)
  totalSteps  Int
  completed   Boolean  @default(false)
  skipped     Boolean  @default(false)
  startedAt   DateTime @default(now())
  completedAt DateTime?
  
  // Relations
  user        User     @relation(fields: [userId], references: [id])
  
  @@unique([userId, tutorialId])
  @@index([userId])
  @@index([tutorialId])
}

// Notification system
model Notification {
  id          String   @id @default(uuid())
  userId      String
  type        String   // 'feature_launch', 'achievement', 'alert', 'system'
  title       String
  description String
  icon        String?
  actionLabel String?
  actionPath  String?
  priority    String   @default("normal") // 'low', 'normal', 'high', 'urgent'
  read        Boolean  @default(false)
  archived    Boolean  @default(false)
  createdAt   DateTime @default(now())
  readAt      DateTime?
  
  // Relations
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([userId, createdAt])
  @@index([userId, read])
  @@index([type])
}

// Admin audit log
model AdminAuditLog {
  id          String   @id @default(uuid())
  adminId     String
  action      String   // 'ban_user', 'approve_content', 'change_config'
  resource    String   // 'user:123', 'character:456'
  changes     Json     // Change details
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime @default(now())
  
  // Relations
  admin       User     @relation(fields: [adminId], references: [id])
  
  @@index([adminId, timestamp])
  @@index([action, timestamp])
}
```

#### Migration Strategy
- [ ] Create migration for feature configuration tables (2 hours)
- [ ] Create migration for user preference extensions (2 hours)
- [ ] Create migration for tutorial and notification tables (2 hours)
- [ ] Test migrations on development database (1 hour)
- [ ] Document rollback procedures (1 hour)

### 1.2 API Contract Design

#### Feature Management Endpoints
```typescript
// Feature gating APIs
GET    /api/v1/features                      // List available features
GET    /api/v1/features/:id                  // Get feature details
POST   /api/v1/features/:id/unlock           // Unlock a feature
GET    /api/v1/features/:id/can-access       // Check access permission
GET    /api/v1/features/user-unlocks         // Get user's unlocked features

// User view management
GET    /api/v1/user/view-config              // Get role-based view configuration
PUT    /api/v1/user/view-config              // Update view preferences
POST   /api/v1/user/switch-role              // Switch between roles
GET    /api/v1/user/navigation               // Get personalized navigation
GET    /api/v1/user/dashboard                // Get dashboard configuration

// Onboarding APIs
GET    /api/v1/onboarding/status             // Get onboarding progress
POST   /api/v1/onboarding/start              // Start onboarding flow
POST   /api/v1/onboarding/complete-step      // Mark step as complete
POST   /api/v1/onboarding/skip               // Skip onboarding
GET    /api/v1/onboarding/recommendations    // Get personalized recommendations

// Tutorial APIs
GET    /api/v1/tutorials                     // List available tutorials
GET    /api/v1/tutorials/:id                 // Get tutorial details
POST   /api/v1/tutorials/:id/start           // Start tutorial
POST   /api/v1/tutorials/:id/progress        // Update progress
POST   /api/v1/tutorials/:id/complete        // Complete tutorial

// Notification APIs
GET    /api/v1/notifications                 // Get notifications (paginated)
GET    /api/v1/notifications/unread-count    // Get unread count
PUT    /api/v1/notifications/:id/read        // Mark as read
PUT    /api/v1/notifications/mark-all-read   // Mark all as read
DELETE /api/v1/notifications/:id             // Archive notification
POST   /api/v1/notifications/preferences     // Update notification preferences
```

#### Request/Response Types
```typescript
// Feature types
interface FeatureConfigResponse {
  id: string
  featureId: string
  name: string
  description: string
  icon: string
  category: string
  requiredRoles: UserRole[]
  minLevel: number
  requiresPremium: boolean
  unlocked: boolean
  unlockMethod?: string
  unlockedAt?: string
}

interface UnlockFeatureRequest {
  featureId: string
  unlockMethod: 'achievement' | 'payment' | 'manual'
}

// View configuration types
interface RoleViewConfig {
  role: UserRole
  theme: ThemeConfig
  navigation: NavigationItem[]
  dashboard: DashboardWidget[]
  features: string[] // Available feature IDs
}

interface NavigationItem {
  id: string
  label: string
  icon: string
  path: string
  badge?: 'new' | 'beta' | 'pro' | number
  children?: NavigationItem[]
  visible: boolean
  priority: number
}

interface DashboardWidget {
  id: string
  type: string
  title: string
  size: { w: number; h: number }
  position: { x: number; y: number }
  config: Record<string, any>
}

// Onboarding types
interface OnboardingStatus {
  completed: boolean
  currentStep: number
  totalSteps: number
  selectedRole: UserRole
  interests: string[]
  mbtiType?: string
}

interface OnboardingStepComplete {
  stepId: string
  data: Record<string, any>
}

// Tutorial types
interface TutorialConfig {
  id: string
  name: string
  description: string
  steps: TutorialStep[]
  category: string
  estimatedTime: number // minutes
}

interface TutorialStep {
  id: string
  title: string
  description: string
  targetElement?: string
  action?: string
  validation?: string
  skippable: boolean
}

// Notification types
interface NotificationResponse {
  id: string
  type: 'feature_launch' | 'achievement' | 'alert' | 'system'
  title: string
  description: string
  icon?: string
  action?: {
    label: string
    path: string
  }
  priority: 'low' | 'normal' | 'high' | 'urgent'
  read: boolean
  createdAt: string
}
```

### 1.3 Service Layer Design

#### Core Services

**FeatureGateService**
- Methods: `canAccess`, `unlockFeature`, `getAvailableFeatures`, `checkDependencies`
- Dependencies: PrismaService, UserService, CacheService

**RoleViewService**
- Methods: `getRoleConfig`, `switchRole`, `getNavigation`, `getDashboard`
- Dependencies: FeatureGateService, UserPreferenceService

**OnboardingService**
- Methods: `startOnboarding`, `completeStep`, `getRecommendations`, `skipOnboarding`
- Dependencies: UserService, RecommendationService, AchievementService

**TutorialService**
- Methods: `getTutorials`, `startTutorial`, `updateProgress`, `completeTutorial`
- Dependencies: UserService, AchievementService, NotificationService

**NotificationService**
- Methods: `createNotification`, `getNotifications`, `markAsRead`, `broadcast`
- Dependencies: PrismaService, WebSocketService, EmailService

**CreatorStudioService**
- Methods: `getCreatorOverview`, `getWorkStatistics`, `aiGenerateCharacter`, `aiGenerateScenario`
- Dependencies: CharacterService, ScenarioService, AIService, StatisticsService

**GamificationDashboardService**
- Methods: `getGamificationOverview`, `getAffinityList`, `getProficiencyList`, `getDailyQuests`
- Dependencies: GamificationService, CharacterAffinityService, AchievementService

**AdminConsoleService**
- Methods: `getAdminDashboard`, `getRealtimeMetrics`, `getAlerts`, `processModeration`
- Dependencies: MonitoringService, ModerationService, AuditService

---

## Phase 2: Implementation Tasks (Week 4-9)

### 2.1 Backend Implementation

#### Database Layer (8 hours total)
- [ ] **Task**: Create Prisma schema extensions for feature system
  - **File**: `apps/api/prisma/schema.prisma`
  - **Estimate**: 2 hours
  - **Dependencies**: None

- [ ] **Task**: Create database migrations for new tables
  - **Files**: `apps/api/prisma/migrations/`
  - **Estimate**: 2 hours
  - **Dependencies**: Schema extensions

- [ ] **Task**: Create comprehensive seed data for features and tutorials
  - **File**: `apps/api/prisma/seed/features.ts`
  - **Estimate**: 4 hours
  - **Dependencies**: Schema models

#### Service Layer (40 hours total)
- [ ] **Task**: Implement FeatureGateService (F1, F7)
  - **File**: `apps/api/src/services/feature-gate.service.ts`
  - **Estimate**: 6 hours
  - **Dependencies**: Prisma models
  - **Tests**: `apps/api/src/services/__tests__/feature-gate.service.test.ts`

- [ ] **Task**: Implement RoleViewService (F2, F9)
  - **File**: `apps/api/src/services/role-view.service.ts`
  - **Estimate**: 6 hours
  - **Dependencies**: FeatureGateService
  - **Tests**: `apps/api/src/services/__tests__/role-view.service.test.ts`

- [ ] **Task**: Implement OnboardingService (F3)
  - **File**: `apps/api/src/services/onboarding.service.ts`
  - **Estimate**: 5 hours
  - **Dependencies**: UserService, RecommendationService
  - **Tests**: `apps/api/src/services/__tests__/onboarding.service.test.ts`

- [ ] **Task**: Implement TutorialService
  - **File**: `apps/api/src/services/tutorial.service.ts`
  - **Estimate**: 4 hours
  - **Dependencies**: UserService, NotificationService
  - **Tests**: `apps/api/src/services/__tests__/tutorial.service.test.ts`

- [ ] **Task**: Implement NotificationService (F11)
  - **File**: `apps/api/src/services/notification.service.ts`
  - **Estimate**: 4 hours
  - **Dependencies**: WebSocketService
  - **Tests**: `apps/api/src/services/__tests__/notification.service.test.ts`

- [ ] **Task**: Implement CreatorStudioService (F4)
  - **File**: `apps/api/src/services/creator-studio.service.ts`
  - **Estimate**: 6 hours
  - **Dependencies**: CharacterService, AIService
  - **Tests**: `apps/api/src/services/__tests__/creator-studio.service.test.ts`

- [ ] **Task**: Implement GamificationDashboardService (F5)
  - **File**: `apps/api/src/services/gamification-dashboard.service.ts`
  - **Estimate**: 5 hours
  - **Dependencies**: GamificationService
  - **Tests**: `apps/api/src/services/__tests__/gamification-dashboard.service.test.ts`

- [ ] **Task**: Implement AdminConsoleService (F6)
  - **File**: `apps/api/src/services/admin-console.service.ts`
  - **Estimate**: 4 hours
  - **Dependencies**: MonitoringService, AuditService
  - **Tests**: `apps/api/src/services/__tests__/admin-console.service.test.ts`

#### API Routes (24 hours total)
- [ ] **Task**: Implement feature management routes
  - **File**: `apps/api/src/routes/features.ts`
  - **Estimate**: 4 hours
  - **Dependencies**: FeatureGateService
  - **Tests**: `apps/api/src/routes/__tests__/features.test.ts`

- [ ] **Task**: Implement user view configuration routes
  - **File**: `apps/api/src/routes/user-view.ts`
  - **Estimate**: 3 hours
  - **Dependencies**: RoleViewService
  - **Tests**: `apps/api/src/routes/__tests__/user-view.test.ts`

- [ ] **Task**: Implement onboarding routes
  - **File**: `apps/api/src/routes/onboarding.ts`
  - **Estimate**: 3 hours
  - **Dependencies**: OnboardingService
  - **Tests**: `apps/api/src/routes/__tests__/onboarding.test.ts`

- [ ] **Task**: Implement tutorial routes
  - **File**: `apps/api/src/routes/tutorials.ts`
  - **Estimate**: 2 hours
  - **Dependencies**: TutorialService
  - **Tests**: `apps/api/src/routes/__tests__/tutorials.test.ts`

- [ ] **Task**: Implement notification routes
  - **File**: `apps/api/src/routes/notifications.ts`
  - **Estimate**: 3 hours
  - **Dependencies**: NotificationService
  - **Tests**: `apps/api/src/routes/__tests__/notifications.test.ts`

- [ ] **Task**: Implement creator studio routes
  - **File**: `apps/api/src/routes/creator-studio.ts`
  - **Estimate**: 3 hours
  - **Dependencies**: CreatorStudioService
  - **Tests**: `apps/api/src/routes/__tests__/creator-studio.test.ts`

- [ ] **Task**: Implement gamification dashboard routes
  - **File**: `apps/api/src/routes/gamification-dashboard.ts`
  - **Estimate**: 3 hours
  - **Dependencies**: GamificationDashboardService
  - **Tests**: `apps/api/src/routes/__tests__/gamification-dashboard.test.ts`

- [ ] **Task**: Implement admin console routes
  - **File**: `apps/api/src/routes/admin-console.ts`
  - **Estimate**: 3 hours
  - **Dependencies**: AdminConsoleService
  - **Tests**: `apps/api/src/routes/__tests__/admin-console.test.ts`

#### Middleware (8 hours total)
- [ ] **Task**: Create feature gate middleware
  - **File**: `apps/api/src/middleware/feature-gate.ts`
  - **Estimate**: 3 hours
  - **Dependencies**: FeatureGateService
  - **Tests**: `apps/api/src/middleware/__tests__/feature-gate.test.ts`

- [ ] **Task**: Create role-based access middleware
  - **File**: `apps/api/src/middleware/role-access.ts`
  - **Estimate**: 3 hours
  - **Dependencies**: RoleViewService
  - **Tests**: `apps/api/src/middleware/__tests__/role-access.test.ts`

- [ ] **Task**: Create audit logging middleware
  - **File**: `apps/api/src/middleware/audit-log.ts`
  - **Estimate**: 2 hours
  - **Dependencies**: AdminConsoleService
  - **Tests**: `apps/api/src/middleware/__tests__/audit-log.test.ts`

### 2.2 Frontend Implementation

#### Type Definitions (4 hours total)
- [ ] **Task**: Create TypeScript types for features system
  - **File**: `apps/web/src/types/features.ts`
  - **Estimate**: 2 hours
  - **Dependencies**: API contracts

- [ ] **Task**: Create TypeScript types for user experience
  - **File**: `apps/web/src/types/user-experience.ts`
  - **Estimate**: 2 hours
  - **Dependencies**: API contracts

#### API Client Services (12 hours total)
- [ ] **Task**: Create feature management API client
  - **File**: `apps/web/src/services/featureApi.ts`
  - **Estimate**: 2 hours
  - **Dependencies**: Type definitions

- [ ] **Task**: Create user view API client
  - **File**: `apps/web/src/services/userViewApi.ts`
  - **Estimate**: 2 hours
  - **Dependencies**: Type definitions

- [ ] **Task**: Create onboarding API client
  - **File**: `apps/web/src/services/onboardingApi.ts`
  - **Estimate**: 2 hours
  - **Dependencies**: Type definitions

- [ ] **Task**: Create tutorial API client
  - **File**: `apps/web/src/services/tutorialApi.ts`
  - **Estimate**: 2 hours
  - **Dependencies**: Type definitions

- [ ] **Task**: Create notification API client
  - **File**: `apps/web/src/services/notificationApi.ts`
  - **Estimate**: 2 hours
  - **Dependencies**: Type definitions

- [ ] **Task**: Create dashboard API clients
  - **File**: `apps/web/src/services/dashboardApi.ts`
  - **Estimate**: 2 hours
  - **Dependencies**: Type definitions

#### State Management (16 hours total)
- [ ] **Task**: Create feature store (Pinia)
  - **File**: `apps/web/src/stores/features.ts`
  - **Estimate**: 3 hours
  - **Dependencies**: API client
  - **Tests**: `apps/web/src/stores/__tests__/features.test.ts`

- [ ] **Task**: Create user view store
  - **File**: `apps/web/src/stores/userView.ts`
  - **Estimate**: 3 hours
  - **Dependencies**: API client
  - **Tests**: `apps/web/src/stores/__tests__/userView.test.ts`

- [ ] **Task**: Create onboarding store
  - **File**: `apps/web/src/stores/onboarding.ts`
  - **Estimate**: 2 hours
  - **Dependencies**: API client
  - **Tests**: `apps/web/src/stores/__tests__/onboarding.test.ts`

- [ ] **Task**: Create tutorial store
  - **File**: `apps/web/src/stores/tutorial.ts`
  - **Estimate**: 2 hours
  - **Dependencies**: API client
  - **Tests**: `apps/web/src/stores/__tests__/tutorial.test.ts`

- [ ] **Task**: Create notification store
  - **File**: `apps/web/src/stores/notifications.ts`
  - **Estimate**: 3 hours
  - **Dependencies**: API client
  - **Tests**: `apps/web/src/stores/__tests__/notifications.test.ts`

- [ ] **Task**: Create dashboard stores
  - **File**: `apps/web/src/stores/dashboards.ts`
  - **Estimate**: 3 hours
  - **Dependencies**: API clients
  - **Tests**: `apps/web/src/stores/__tests__/dashboards.test.ts`

#### Core Components (40 hours total)

**Progressive Disclosure Components (F1)**
- [ ] **Task**: Create FeatureGate component
  - **File**: `apps/web/src/components/features/FeatureGate.vue`
  - **Estimate**: 3 hours
  - **Dependencies**: Feature store

- [ ] **Task**: Create ProgressiveDisclosurePanel component
  - **File**: `apps/web/src/components/features/ProgressiveDisclosurePanel.vue`
  - **Estimate**: 4 hours
  - **Dependencies**: Feature store

**Role-Based Layout Components (F2)**
- [ ] **Task**: Create RoleBasedLayout component
  - **File**: `apps/web/src/components/layout/RoleBasedLayout.vue`
  - **Estimate**: 5 hours
  - **Dependencies**: User view store

- [ ] **Task**: Create DynamicNavigation component
  - **File**: `apps/web/src/components/layout/DynamicNavigation.vue`
  - **Estimate**: 4 hours
  - **Dependencies**: User view store

- [ ] **Task**: Create RoleSwitcher component
  - **File**: `apps/web/src/components/layout/RoleSwitcher.vue`
  - **Estimate**: 3 hours
  - **Dependencies**: User view store

**Onboarding Components (F3)**
- [ ] **Task**: Create OnboardingWizard component
  - **File**: `apps/web/src/components/onboarding/OnboardingWizard.vue`
  - **Estimate**: 5 hours
  - **Dependencies**: Onboarding store

- [ ] **Task**: Create InterestSelector component
  - **File**: `apps/web/src/components/onboarding/InterestSelector.vue`
  - **Estimate**: 3 hours
  - **Dependencies**: Onboarding store

- [ ] **Task**: Create MBTIQuiz component
  - **File**: `apps/web/src/components/onboarding/MBTIQuiz.vue`
  - **Estimate**: 4 hours
  - **Dependencies**: Onboarding store

**Tutorial Components**
- [ ] **Task**: Create TutorialOverlay component
  - **File**: `apps/web/src/components/tutorial/TutorialOverlay.vue`
  - **Estimate**: 4 hours
  - **Dependencies**: Tutorial store

- [ ] **Task**: Create TutorialTooltip component
  - **File**: `apps/web/src/components/tutorial/TutorialTooltip.vue`
  - **Estimate**: 3 hours
  - **Dependencies**: Tutorial store

**Notification Components (F11)**
- [ ] **Task**: Create NotificationCenter component
  - **File**: `apps/web/src/components/notifications/NotificationCenter.vue`
  - **Estimate**: 4 hours
  - **Dependencies**: Notification store

- [ ] **Task**: Create NotificationToast component
  - **File**: `apps/web/src/components/notifications/NotificationToast.vue`
  - **Estimate**: 2 hours
  - **Dependencies**: Notification store

#### Dashboard Views (48 hours total)

**Creator Studio Dashboard (F4)**
- [ ] **Task**: Create CreatorStudioDashboard view
  - **File**: `apps/web/src/views/CreatorStudio.vue`
  - **Estimate**: 6 hours
  - **Dependencies**: Dashboard stores, components

- [ ] **Task**: Create CreatorWorksSummary component
  - **File**: `apps/web/src/components/creator/WorksSummary.vue`
  - **Estimate**: 3 hours
  - **Dependencies**: Creator store

- [ ] **Task**: Create CreatorRevenueChart component
  - **File**: `apps/web/src/components/creator/RevenueChart.vue`
  - **Estimate**: 4 hours
  - **Dependencies**: Statistics service

- [ ] **Task**: Create AIGenerationPanel component
  - **File**: `apps/web/src/components/creator/AIGenerationPanel.vue`
  - **Estimate**: 5 hours
  - **Dependencies**: AI service

**Gamification Dashboard (F5)**
- [ ] **Task**: Create GamificationDashboard view
  - **File**: `apps/web/src/views/GamificationDashboard.vue`
  - **Estimate**: 6 hours
  - **Dependencies**: Gamification store

- [ ] **Task**: Create AffinityProgressCard component
  - **File**: `apps/web/src/components/gamification/AffinityProgressCard.vue`
  - **Estimate**: 3 hours
  - **Dependencies**: Affinity service

- [ ] **Task**: Create ProficiencySkillTree component
  - **File**: `apps/web/src/components/gamification/ProficiencySkillTree.vue`
  - **Estimate**: 5 hours
  - **Dependencies**: Proficiency service

- [ ] **Task**: Create DailyQuestPanel component
  - **File**: `apps/web/src/components/gamification/DailyQuestPanel.vue`
  - **Estimate**: 3 hours
  - **Dependencies**: Quest service

- [ ] **Task**: Create AchievementWall component
  - **File**: `apps/web/src/components/gamification/AchievementWall.vue`
  - **Estimate**: 4 hours
  - **Dependencies**: Achievement service

**Admin Console (F6)**
- [ ] **Task**: Create AdminConsole view
  - **File**: `apps/web/src/views/AdminConsole.vue`
  - **Estimate**: 6 hours
  - **Dependencies**: Admin store

- [ ] **Task**: Create RealTimeMonitor component
  - **File**: `apps/web/src/components/admin/RealTimeMonitor.vue`
  - **Estimate**: 4 hours
  - **Dependencies**: Monitoring service

- [ ] **Task**: Create AlertCenter component
  - **File**: `apps/web/src/components/admin/AlertCenter.vue`
  - **Estimate**: 3 hours
  - **Dependencies**: Alert service

- [ ] **Task**: Create ModerationQueue component
  - **File**: `apps/web/src/components/admin/ModerationQueue.vue`
  - **Estimate**: 4 hours
  - **Dependencies**: Moderation service

#### Routing Updates (4 hours total)
- [ ] **Task**: Add creator studio routes
  - **File**: `apps/web/src/router/index.ts`
  - **Estimate**: 1 hour
  - **Dependencies**: Views

- [ ] **Task**: Add gamification dashboard routes
  - **File**: `apps/web/src/router/index.ts`
  - **Estimate**: 1 hour
  - **Dependencies**: Views

- [ ] **Task**: Add admin console routes
  - **File**: `apps/web/src/router/index.ts`
  - **Estimate**: 1 hour
  - **Dependencies**: Views

- [ ] **Task**: Add feature-gated route guards
  - **File**: `apps/web/src/router/guards.ts`
  - **Estimate**: 1 hour
  - **Dependencies**: Feature store

### 2.3 Integration Tasks (16 hours total)

- [ ] **Task**: Integrate feature gating with existing auth system
  - **Files**: `apps/api/src/middleware/auth.ts`, `apps/web/src/services/auth.ts`
  - **Estimate**: 3 hours

- [ ] **Task**: Connect WebSocket for real-time notifications
  - **Files**: `apps/api/src/websocket/notification-handler.ts`, `apps/web/src/services/websocket.ts`
  - **Estimate**: 4 hours

- [ ] **Task**: Integrate with existing gamification system
  - **Files**: `apps/api/src/services/gamification.service.ts`
  - **Estimate**: 3 hours

- [ ] **Task**: Add monitoring and logging instrumentation
  - **Files**: `apps/api/src/services/monitoring.service.ts`
  - **Estimate**: 3 hours

- [ ] **Task**: Setup feature flag configuration (F8)
  - **Files**: `apps/api/src/config/features.config.ts`
  - **Estimate**: 3 hours

---

## Phase 3: Testing Strategy (Week 10)

### 3.1 Unit Tests

#### Backend Unit Tests
- [ ] Feature gate service tests (4 hours)
  - Coverage target: >90%
  - Key scenarios: Access checks, unlocking, dependencies

- [ ] Role view service tests (4 hours)
  - Coverage target: >85%
  - Key scenarios: Role switching, navigation generation

- [ ] Onboarding service tests (3 hours)
  - Coverage target: >80%
  - Key scenarios: Flow completion, recommendations

- [ ] Tutorial service tests (3 hours)
  - Coverage target: >80%
  - Key scenarios: Progress tracking, completion

- [ ] Notification service tests (3 hours)
  - Coverage target: >85%
  - Key scenarios: Broadcast, filtering, real-time delivery

#### Frontend Unit Tests
- [ ] Component tests for feature gates (4 hours)
  - Coverage target: >75%
  - Key components: FeatureGate, ProgressiveDisclosure

- [ ] Component tests for dashboards (6 hours)
  - Coverage target: >70%
  - Key components: All dashboard views

- [ ] Store tests (4 hours)
  - Coverage target: >85%
  - Key actions: State mutations, API calls

### 3.2 Integration Tests

- [ ] **Test**: Feature unlock flow
  - **Scenarios**: Level-based unlock, achievement unlock, payment unlock
  - **Tools**: Supertest
  - **Estimate**: 4 hours

- [ ] **Test**: Onboarding completion flow
  - **Scenarios**: New user onboarding, role selection, interest configuration
  - **Tools**: Supertest + MSW
  - **Estimate**: 4 hours

- [ ] **Test**: Dashboard data aggregation
  - **Scenarios**: Creator stats, gamification progress, admin metrics
  - **Tools**: Supertest
  - **Estimate**: 4 hours

- [ ] **Test**: Real-time notification delivery
  - **Scenarios**: WebSocket connection, broadcast, acknowledgment
  - **Tools**: Socket.IO Client
  - **Estimate**: 3 hours

### 3.3 E2E Tests

- [ ] **Test**: Complete creator journey
  - **Scenario**: Login → Creator Studio → AI Generation → Publish
  - **Tools**: Playwright
  - **Estimate**: 6 hours

- [ ] **Test**: Complete player journey
  - **Scenario**: Onboarding → Dashboard → Achievements → Notifications
  - **Tools**: Playwright
  - **Estimate**: 6 hours

- [ ] **Test**: Complete admin workflow
  - **Scenario**: Login → Console → Alerts → Moderation → Audit
  - **Tools**: Playwright
  - **Estimate**: 6 hours

---

## Phase 4: Documentation (Week 11)

### 4.1 Technical Documentation

- [ ] **Doc**: Feature system architecture
  - **File**: `docs/architecture/feature-system.md`
  - **Content**: System design, data flow, decision rationale
  - **Estimate**: 4 hours

- [ ] **Doc**: API documentation
  - **File**: `docs/api/user-experience.md`
  - **Content**: All endpoints, request/response examples, auth requirements
  - **Estimate**: 6 hours

- [ ] **Doc**: Database schema documentation
  - **File**: `docs/database/ux-system.md`
  - **Content**: ERD, relationships, indexes, migration guide
  - **Estimate**: 3 hours

- [ ] **Doc**: Integration guide (F8)
  - **File**: `docs/developer-guide/feature-integration.md`
  - **Content**: How to add new features to the system
  - **Estimate**: 4 hours

### 4.2 User Documentation

- [ ] **Doc**: Creator guide
  - **File**: `docs/user-guide/creator-studio.md`
  - **Content**: Studio features, AI generation, analytics
  - **Estimate**: 4 hours

- [ ] **Doc**: Player guide
  - **File**: `docs/user-guide/gamification.md`
  - **Content**: Progress tracking, achievements, daily quests
  - **Estimate**: 4 hours

- [ ] **Doc**: Admin guide
  - **File**: `docs/user-guide/admin-console.md`
  - **Content**: Monitoring, moderation, configuration
  - **Estimate**: 4 hours

- [ ] **Doc**: Help system content (F12)
  - **File**: `docs/help/`
  - **Content**: FAQ, tutorials, troubleshooting
  - **Estimate**: 6 hours

---

## Phase 5: Deployment & Monitoring (Week 12)

### 5.1 Deployment Preparation

- [ ] Environment configuration
  - [ ] Development environment variables (1 hour)
  - [ ] Staging environment setup (2 hours)
  - [ ] Production configuration (2 hours)

- [ ] Database migrations
  - [ ] Test migrations on staging (2 hours)
  - [ ] Prepare rollback scripts (2 hours)
  - [ ] Production migration plan (1 hour)

- [ ] Feature flags setup
  - [ ] Define feature flag configuration (2 hours)
  - [ ] Implement gradual rollout strategy (3 hours)
  - [ ] Configure A/B testing groups (2 hours)

### 5.2 Monitoring Setup

- [ ] Metrics configuration
  - [ ] Define key metrics (feature adoption, performance) (2 hours)
  - [ ] Set up Prometheus metrics (3 hours)
  - [ ] Configure Grafana dashboards (4 hours)

- [ ] Logging setup
  - [ ] Structured logging for feature events (2 hours)
  - [ ] Log aggregation configuration (2 hours)
  - [ ] Error tracking with Sentry (2 hours)

- [ ] Alert configuration
  - [ ] Performance alerts (response time, error rate) (2 hours)
  - [ ] Business metric alerts (adoption rate) (2 hours)
  - [ ] Security alerts (unusual activity) (2 hours)

### 5.3 Performance Testing

- [ ] Load testing
  - [ ] Define test scenarios (1000+ concurrent users) (2 hours)
  - [ ] Run load tests on staging (4 hours)
  - [ ] Optimize identified bottlenecks (8 hours)

- [ ] Performance benchmarks
  - [ ] Measure API response times (2 hours)
  - [ ] Frontend performance audit (3 hours)
  - [ ] Database query optimization (4 hours)

---

## Phase 6: Launch & Post-Launch (Week 12)

### 6.1 Launch Checklist

- [ ] All unit tests passing (>80% coverage)
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Code review completed by 2+ developers
- [ ] Security audit passed
- [ ] Performance benchmarks met (<200ms API response)
- [ ] Documentation completed
- [ ] Staging environment validated
- [ ] Rollback plan documented and tested
- [ ] Support team trained
- [ ] Marketing materials prepared
- [ ] User communication sent

### 6.2 Post-Launch Tasks

- [ ] Monitor metrics and alerts (Day 1-7)
  - [ ] Feature adoption rate
  - [ ] Performance metrics
  - [ ] Error rates
  - [ ] User feedback

- [ ] Gather user feedback (Week 1-2)
  - [ ] In-app surveys
  - [ ] User interviews
  - [ ] Community feedback

- [ ] Address critical issues (Ongoing)
  - [ ] Bug fixes
  - [ ] Performance optimizations
  - [ ] UX improvements

- [ ] Plan iteration improvements (Week 2)
  - [ ] Analyze metrics
  - [ ] Prioritize enhancements
  - [ ] Update roadmap

---

## Timeline & Milestones

### Phase Breakdown
| Phase | Duration | Start Date | End Date | Owner |
|-------|----------|------------|----------|-------|
| Phase 0: Research | 5 days | 2025-10-01 | 2025-10-07 | Tech Lead |
| Phase 1: Foundation | 10 days | 2025-10-08 | 2025-10-21 | Backend Team |
| Phase 2: Implementation | 30 days | 2025-10-22 | 2025-12-02 | Full Stack Team |
| Phase 3: Testing | 5 days | 2025-12-03 | 2025-12-09 | QA Team |
| Phase 4: Documentation | 5 days | 2025-12-10 | 2025-12-16 | Tech Writers |
| Phase 5: Deployment | 5 days | 2025-12-17 | 2025-12-23 | DevOps Team |
| Phase 6: Launch | 2 days | 2025-12-24 | 2025-12-25 | All Teams |

### Key Milestones
- **M1: Foundation Complete** - October 21, 2025
  - Data models finalized and migrated
  - API contracts defined and documented
  - Service interfaces designed
  - Feature configuration system operational

- **M2: Backend Complete** - November 11, 2025
  - All API endpoints implemented
  - Service layer fully tested
  - Integration tests passing
  - WebSocket notifications working

- **M3: Frontend Complete** - December 2, 2025
  - All dashboard views implemented
  - Progressive disclosure working
  - Role-based layouts functional
  - E2E tests passing

- **M4: Production Ready** - December 23, 2025
  - All documentation complete
  - Performance optimized (<200ms P95)
  - Security validated
  - Monitoring configured

---

## Resource Requirements

### Team Allocation
- **Backend Developers**: 2 developers (40 hours/week)
- **Frontend Developers**: 2 developers (40 hours/week)
- **Full Stack Developer**: 1 developer (40 hours/week)
- **DevOps Engineer**: 1 engineer (20 hours/week)
- **QA Engineer**: 1 engineer (30 hours/week)
- **Technical Writer**: 1 writer (20 hours/week)
- **UI/UX Designer**: 1 designer (30 hours/week)

### Total Effort Estimation
- **Backend Development**: 280 hours
- **Frontend Development**: 320 hours
- **Testing**: 120 hours
- **Documentation**: 80 hours
- **Deployment & Monitoring**: 60 hours
- **Total**: 860 hours (approximately 21.5 person-weeks)

### External Dependencies
- **AI Service Credits**: Required for AI generation features
- **Monitoring Tools**: Prometheus + Grafana licenses
- **Testing Infrastructure**: Staging environment resources

---

## Risks & Mitigation

### Technical Risks
| Risk | Impact | Probability | Mitigation | Owner |
|------|--------|-------------|------------|-------|
| Complex role permission logic causes performance issues | High | Medium | Implement Redis caching layer, optimize database queries | Backend Team |
| Feature dependency conflicts | Medium | Medium | Thorough dependency graph testing, clear documentation | Tech Lead |
| WebSocket scalability issues | High | Low | Implement Socket.IO clustering, load testing | DevOps Team |
| AI generation quality inconsistency | Medium | Medium | Multiple model fallbacks, user feedback loop | AI Team |
| Migration failures on production | High | Low | Staged migrations, comprehensive rollback plans | Database Team |

### Schedule Risks
| Risk | Impact | Probability | Mitigation | Owner |
|------|--------|-------------|------------|-------|
| Frontend development delays | High | Medium | Parallel development tracks, component reuse | Frontend Lead |
| Integration complexity underestimated | Medium | Medium | Early integration testing, continuous integration | Tech Lead |
| Testing reveals critical bugs | High | Low | Comprehensive unit tests, early QA involvement | QA Lead |

### Resource Risks
| Risk | Impact | Probability | Mitigation | Owner |
|------|--------|-------------|------------|-------|
| Key developer unavailability | High | Low | Knowledge sharing, pair programming | Team Lead |
| External service outages | Medium | Low | Fallback services, graceful degradation | DevOps Team |

---

## Success Metrics

### Functional Metrics
- [ ] All 12 core features (F1-F12) fully implemented
- [ ] All acceptance criteria from specification met
- [ ] Zero critical bugs in production
- [ ] Feature adoption rate >40% in first month

### Quality Metrics
- [ ] Backend code coverage ≥85%
- [ ] Frontend code coverage ≥75%
- [ ] API response time <200ms (P95)
- [ ] Frontend load time <2s
- [ ] Zero security vulnerabilities (OWASP scan)
- [ ] TypeScript strict mode compliance 100%

### Business Metrics
- [ ] Creator efficiency: Character creation time <5 minutes (from 15)
- [ ] Player retention: 7-day retention >60% (from 40%)
- [ ] Admin efficiency: Monitoring tasks <5 minutes (from 20)
- [ ] Feature discovery: New features found within 1 day (from 7)
- [ ] User satisfaction: NPS score >60 (from 40)

---

## Open Questions & Decisions

### Open Questions
- [ ] Should users be able to permanently dismiss certain features?
  - **Recommendation**: Yes, with ability to re-enable in settings
- [ ] How should we handle feature conflicts between roles (creator + player)?
  - **Recommendation**: Allow role switching with persistent state
- [ ] Should AI generation consume user credits or be unlimited for creators?
  - **Recommendation**: Tiered system based on subscription level
- [ ] How granular should admin permissions be?
  - **Recommendation**: Start with role-based, add granular permissions in v2

### Decision Log
| Date | Decision | Rationale | Owner |
|------|----------|-----------|-------|
| 2025-09-30 | Use progressive disclosure for all users | Reduces cognitive load, improves onboarding | Product Team |
| 2025-09-30 | Implement three distinct role interfaces | Optimizes experience for each user type | UX Team |
| 2025-09-30 | Cache feature permissions in Redis | Reduces database queries, improves performance | Backend Team |
| 2025-09-30 | Use WebSocket for real-time notifications | Better user experience than polling | Architecture Team |

---

## Appendix

### A. References
- Feature Specification: `.specify/features/feature-20250930-165814/spec.md`
- Project Constitution: `.specify/memory/constitution.md`
- Existing Codebase: `cankao/tavernai-plus/`
- API Documentation: `cankao/tavernai-plus/API_ENDPOINTS.md`

### B. Technical Dependencies
- **Frameworks**: Vue 3.5, Express 4.18, Prisma 5.7
- **Services**: Redis 5.3, PostgreSQL 14+, Socket.IO 4.6
- **AI Providers**: OpenAI, Anthropic, Google AI
- **Monitoring**: Prometheus, Grafana, Sentry

### C. Change Log
| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-09-30 | 1.0.0 | Initial comprehensive plan | Tech Lead Orchestrator |

---

**Plan Status**: This implementation plan provides a complete roadmap for the Universal User Experience System, with detailed tasks, realistic estimates, and comprehensive coverage of all 12 core features. The plan follows production-ready principles and includes extensive testing and documentation requirements.

**Next Steps**: 
1. Review and approve the plan with stakeholders
2. Assign team members to specific phases
3. Set up project tracking in GitHub Projects
4. Begin Phase 0 research activities

---

**Total Implementation Timeline**: 12 weeks (3 months)
**Total Effort**: 860 hours (21.5 person-weeks)
**Team Size**: 7-8 people

The plan ensures complete implementation of the Universal User Experience System with progressive feature disclosure, role-oriented interfaces, intelligent onboarding, and comprehensive dashboards for all user types. All features are designed to integrate seamlessly with the existing TavernAI Plus architecture while maintaining production-ready quality standards.
