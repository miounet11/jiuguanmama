/**
 * Universal UX System Integration Tests (T074)
 * Tests the complete user experience flow from onboarding to advanced features
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../index';
import { featureFlagManager } from '../../config/features.config';

const prisma = new PrismaClient();

describe('Universal UX System Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let creatorToken: string;
  let creatorId: string;
  let adminToken: string;
  let adminId: string;

  // Setup test users before all tests
  beforeAll(async () => {
    // Clean up test data
    await prisma.featureUnlock.deleteMany({
      where: {
        user: {
          email: {
            in: ['test-player@example.com', 'test-creator@example.com', 'test-admin@example.com'],
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test-player@example.com', 'test-creator@example.com', 'test-admin@example.com'],
        },
      },
    });

    // Create test player user
    const playerRes = await request(app).post('/api/v1/auth/register').send({
      username: 'test-player',
      email: 'test-player@example.com',
      password: 'TestPassword123!',
    });
    authToken = playerRes.body.data.accessToken;
    userId = playerRes.body.data.user.id;

    // Create test creator user
    const creatorRes = await request(app).post('/api/v1/auth/register').send({
      username: 'test-creator',
      email: 'test-creator@example.com',
      password: 'TestPassword123!',
    });
    creatorToken = creatorRes.body.data.accessToken;
    creatorId = creatorRes.body.data.user.id;

    // Update creator role
    await prisma.user.update({
      where: { id: creatorId },
      data: { role: 'creator' },
    });

    // Create test admin user
    const adminRes = await request(app).post('/api/v1/auth/register').send({
      username: 'test-admin',
      email: 'test-admin@example.com',
      password: 'TestPassword123!',
    });
    adminToken = adminRes.body.data.accessToken;
    adminId = adminRes.body.data.user.id;

    // Update admin role
    await prisma.user.update({
      where: { id: adminId },
      data: { role: 'admin' },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.featureUnlock.deleteMany({
      where: {
        userId: {
          in: [userId, creatorId, adminId],
        },
      },
    });
    await prisma.notification.deleteMany({
      where: {
        userId: {
          in: [userId, creatorId, adminId],
        },
      },
    });
    await prisma.tutorialProgress.deleteMany({
      where: {
        userId: {
          in: [userId, creatorId, adminId],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [userId, creatorId, adminId],
        },
      },
    });

    await prisma.$disconnect();
  });

  describe('Feature Gate System (F8)', () => {
    describe('GET /api/v1/features', () => {
      it('should return all available features', async () => {
        const res = await request(app)
          .get('/api/v1/features')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0]).toHaveProperty('id');
        expect(res.body.data[0]).toHaveProperty('name');
        expect(res.body.data[0]).toHaveProperty('description');
      });

      it('should reject requests without authentication', async () => {
        await request(app).get('/api/v1/features').expect(401);
      });
    });

    describe('GET /api/v1/features/unlocks', () => {
      it('should return user feature unlocks', async () => {
        const res = await request(app)
          .get('/api/v1/features/unlocks')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
      });

      it('should include unlock metadata', async () => {
        // First unlock a feature
        await request(app)
          .post('/api/v1/features/unlock')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            featureId: 'F1',
            unlockMethod: 'manual',
          });

        const res = await request(app)
          .get('/api/v1/features/unlocks')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const unlock = res.body.data.find((u: any) => u.featureId === 'F1');
        expect(unlock).toBeDefined();
        expect(unlock).toHaveProperty('unlockedAt');
        expect(unlock).toHaveProperty('unlockMethod');
      });
    });

    describe('POST /api/v1/features/unlock', () => {
      it('should unlock a feature for the user', async () => {
        const res = await request(app)
          .post('/api/v1/features/unlock')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            featureId: 'F2',
            unlockMethod: 'manual',
          })
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data.featureId).toBe('F2');
      });

      it('should prevent duplicate unlocks', async () => {
        // First unlock
        await request(app)
          .post('/api/v1/features/unlock')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            featureId: 'F3',
            unlockMethod: 'manual',
          })
          .expect(200);

        // Try to unlock again
        const res = await request(app)
          .post('/api/v1/features/unlock')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            featureId: 'F3',
            unlockMethod: 'manual',
          })
          .expect(409);

        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('already unlocked');
      });

      it('should validate feature exists', async () => {
        const res = await request(app)
          .post('/api/v1/features/unlock')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            featureId: 'INVALID',
            unlockMethod: 'manual',
          })
          .expect(404);

        expect(res.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/features/:featureId/check', () => {
      it('should check if feature is unlocked', async () => {
        // Unlock F5
        await request(app)
          .post('/api/v1/features/unlock')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            featureId: 'F5',
            unlockMethod: 'manual',
          });

        const res = await request(app)
          .get('/api/v1/features/F5/check')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.unlocked).toBe(true);
      });

      it('should return false for locked features', async () => {
        const res = await request(app)
          .get('/api/v1/features/F11/check')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.unlocked).toBe(false);
      });
    });
  });

  describe('Onboarding System (F3)', () => {
    describe('POST /api/v1/onboarding/complete', () => {
      it('should mark onboarding as complete', async () => {
        const res = await request(app)
          .post('/api/v1/onboarding/complete')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            mbtiType: 'INTJ',
            interests: ['sci-fi', 'fantasy', 'mystery'],
            preferredGenres: ['adventure', 'romance'],
          })
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('onboardingCompleted', true);
        expect(res.body.data).toHaveProperty('mbtiType', 'INTJ');
      });

      it('should validate MBTI type format', async () => {
        const res = await request(app)
          .post('/api/v1/onboarding/complete')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            mbtiType: 'INVALID',
            interests: ['sci-fi'],
          })
          .expect(400);

        expect(res.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/onboarding/status', () => {
      it('should return onboarding status', async () => {
        const res = await request(app)
          .get('/api/v1/onboarding/status')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('completed');
        expect(res.body.data).toHaveProperty('currentStep');
      });
    });
  });

  describe('Tutorial System (F9)', () => {
    describe('GET /api/v1/tutorials', () => {
      it('should return available tutorials', async () => {
        const res = await request(app)
          .get('/api/v1/tutorials')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
      });
    });

    describe('POST /api/v1/tutorials/:tutorialId/complete', () => {
      it('should mark tutorial as complete', async () => {
        const res = await request(app)
          .post('/api/v1/tutorials/chat-basics/complete')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            completedSteps: ['step1', 'step2', 'step3'],
          })
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('completed', true);
      });
    });

    describe('GET /api/v1/tutorials/progress', () => {
      it('should return tutorial progress', async () => {
        const res = await request(app)
          .get('/api/v1/tutorials/progress')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
      });
    });
  });

  describe('Notification System (F10)', () => {
    describe('GET /api/v1/notifications', () => {
      it('should return user notifications', async () => {
        const res = await request(app)
          .get('/api/v1/notifications')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
      });

      it('should support pagination', async () => {
        const res = await request(app)
          .get('/api/v1/notifications?page=1&limit=10')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.pagination).toBeDefined();
        expect(res.body.pagination.page).toBe(1);
        expect(res.body.pagination.limit).toBe(10);
      });

      it('should filter by read status', async () => {
        const res = await request(app)
          .get('/api/v1/notifications?read=false')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        const allUnread = res.body.data.every((n: any) => !n.read);
        expect(allUnread).toBe(true);
      });
    });

    describe('GET /api/v1/notifications/unread/count', () => {
      it('should return unread count', async () => {
        const res = await request(app)
          .get('/api/v1/notifications/unread/count')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('count');
        expect(typeof res.body.data.count).toBe('number');
      });
    });

    describe('PATCH /api/v1/notifications/:id/read', () => {
      it('should mark notification as read', async () => {
        // First create a notification
        const notification = await prisma.notification.create({
          data: {
            userId,
            title: 'Test Notification',
            message: 'Test message',
            type: 'info',
            priority: 'normal',
            read: false,
          },
        });

        const res = await request(app)
          .patch(`/api/v1/notifications/${notification.id}/read`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.read).toBe(true);
        expect(res.body.data.readAt).toBeDefined();
      });
    });

    describe('POST /api/v1/notifications/mark-all-read', () => {
      it('should mark all notifications as read', async () => {
        // Create multiple notifications
        await prisma.notification.createMany({
          data: [
            {
              userId,
              title: 'Notification 1',
              message: 'Message 1',
              type: 'info',
              priority: 'normal',
              read: false,
            },
            {
              userId,
              title: 'Notification 2',
              message: 'Message 2',
              type: 'info',
              priority: 'normal',
              read: false,
            },
          ],
        });

        const res = await request(app)
          .post('/api/v1/notifications/mark-all-read')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.count).toBeGreaterThan(0);

        // Verify all are marked as read
        const unreadCount = await prisma.notification.count({
          where: { userId, read: false },
        });
        expect(unreadCount).toBe(0);
      });
    });
  });

  describe('Gamification Dashboard (F5)', () => {
    describe('GET /api/v1/gamification/overview', () => {
      it('should return gamification overview', async () => {
        const res = await request(app)
          .get('/api/v1/gamification/overview')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('level');
        expect(res.body.data).toHaveProperty('totalAchievements');
        expect(res.body.data).toHaveProperty('totalQuests');
      });
    });

    describe('GET /api/v1/gamification/affinity', () => {
      it('should return affinity list', async () => {
        const res = await request(app)
          .get('/api/v1/gamification/affinity')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
      });

      it('should support pagination and sorting', async () => {
        const res = await request(app)
          .get('/api/v1/gamification/affinity?limit=5&sortBy=level&order=desc')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBeLessThanOrEqual(5);
      });
    });

    describe('GET /api/v1/gamification/proficiency', () => {
      it('should return proficiency skills', async () => {
        const res = await request(app)
          .get('/api/v1/gamification/proficiency')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
      });
    });

    describe('GET /api/v1/gamification/achievements', () => {
      it('should return achievements', async () => {
        const res = await request(app)
          .get('/api/v1/gamification/achievements')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
      });

      it('should filter by unlock status', async () => {
        const res = await request(app)
          .get('/api/v1/gamification/achievements?unlocked=true')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        const allUnlocked = res.body.data.every((a: any) => a.unlocked);
        expect(allUnlocked).toBe(true);
      });
    });

    describe('GET /api/v1/gamification/quests', () => {
      it('should return daily quests', async () => {
        const res = await request(app)
          .get('/api/v1/gamification/quests')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
      });

      it('should filter by completion status', async () => {
        const res = await request(app)
          .get('/api/v1/gamification/quests?completed=false')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        const allIncomplete = res.body.data.every((q: any) => !q.completed);
        expect(allIncomplete).toBe(true);
      });
    });
  });

  describe('Creator Studio (F4)', () => {
    describe('GET /api/v1/creator-studio/dashboard', () => {
      it('should return creator dashboard data', async () => {
        const res = await request(app)
          .get('/api/v1/creator-studio/dashboard')
          .set('Authorization', `Bearer ${creatorToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('totalCharacters');
        expect(res.body.data).toHaveProperty('totalScenarios');
        expect(res.body.data).toHaveProperty('totalRevenue');
      });

      it('should reject non-creator users', async () => {
        const res = await request(app)
          .get('/api/v1/creator-studio/dashboard')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(res.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/creator-studio/analytics', () => {
      it('should return creator analytics', async () => {
        const res = await request(app)
          .get('/api/v1/creator-studio/analytics?timeRange=7d')
          .set('Authorization', `Bearer ${creatorToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('views');
        expect(res.body.data).toHaveProperty('downloads');
      });
    });
  });

  describe('Admin Console (F6)', () => {
    describe('GET /api/v1/admin-console/dashboard', () => {
      it('should return admin dashboard metrics', async () => {
        const res = await request(app)
          .get('/api/v1/admin-console/dashboard')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('totalUsers');
        expect(res.body.data).toHaveProperty('activeUsers');
        expect(res.body.data).toHaveProperty('totalContent');
      });

      it('should reject non-admin users', async () => {
        const res = await request(app)
          .get('/api/v1/admin-console/dashboard')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(res.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/admin-console/monitoring', () => {
      it('should return system metrics', async () => {
        const res = await request(app)
          .get('/api/v1/admin-console/monitoring')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('usersOnline');
        expect(res.body.data).toHaveProperty('apiRequests');
        expect(res.body.data).toHaveProperty('avgResponseTime');
      });
    });

    describe('GET /api/v1/admin-console/alerts', () => {
      it('should return system alerts', async () => {
        const res = await request(app)
          .get('/api/v1/admin-console/alerts')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
      });
    });
  });

  describe('Feature Flag System', () => {
    describe('Feature Flag Manager', () => {
      it('should check if feature is enabled for all users', () => {
        const enabled = featureFlagManager.isFeatureEnabled('F1', {
          userId: 'test-user',
          userRole: 'player',
          environment: 'development',
        });

        expect(enabled).toBe(true);
      });

      it('should check role-based features', () => {
        // F4 requires creator or admin role
        const enabledForCreator = featureFlagManager.isFeatureEnabled('F4', {
          userId: creatorId,
          userRole: 'creator',
          environment: 'development',
        });

        const enabledForPlayer = featureFlagManager.isFeatureEnabled('F4', {
          userId,
          userRole: 'player',
          environment: 'development',
        });

        expect(enabledForCreator).toBe(true);
        expect(enabledForPlayer).toBe(false);
      });

      it('should check admin-only features', () => {
        // F6 requires admin role
        const enabledForAdmin = featureFlagManager.isFeatureEnabled('F6', {
          userId: adminId,
          userRole: 'admin',
          environment: 'development',
        });

        const enabledForCreator = featureFlagManager.isFeatureEnabled('F6', {
          userId: creatorId,
          userRole: 'creator',
          environment: 'development',
        });

        expect(enabledForAdmin).toBe(true);
        expect(enabledForCreator).toBe(false);
      });

      it('should use percentage rollout correctly', () => {
        // F7 has 80% rollout
        const results: boolean[] = [];

        // Test with 100 different user IDs
        for (let i = 0; i < 100; i++) {
          const enabled = featureFlagManager.isFeatureEnabled('F7', {
            userId: `user-${i}`,
            userRole: 'creator',
            environment: 'development',
          });
          results.push(enabled);
        }

        const enabledCount = results.filter((r) => r).length;

        // Should be close to 80% (allow 10% variance due to hash distribution)
        expect(enabledCount).toBeGreaterThanOrEqual(70);
        expect(enabledCount).toBeLessThanOrEqual(90);
      });

      it('should return disabled features', () => {
        // F11 is disabled
        const enabled = featureFlagManager.isFeatureEnabled('F11', {
          userId,
          userRole: 'player',
          environment: 'development',
        });

        expect(enabled).toBe(false);
      });

      it('should respect environment restrictions', () => {
        // F11 is only enabled in development
        const enabledInDev = featureFlagManager.isFeatureEnabled('F11', {
          userId,
          userRole: 'player',
          environment: 'development',
        });

        const enabledInProd = featureFlagManager.isFeatureEnabled('F11', {
          userId,
          userRole: 'player',
          environment: 'production',
        });

        expect(enabledInDev).toBe(false); // Still false because flag is disabled
        expect(enabledInProd).toBe(false);
      });
    });
  });

  describe('End-to-End User Journeys', () => {
    describe('Player Journey', () => {
      it('should complete full player onboarding and feature progression', async () => {
        // 1. Register new player
        const registerRes = await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'new-player',
            email: 'new-player@example.com',
            password: 'TestPassword123!',
          })
          .expect(200);

        const token = registerRes.body.data.accessToken;
        const newUserId = registerRes.body.data.user.id;

        // 2. Complete onboarding
        await request(app)
          .post('/api/v1/onboarding/complete')
          .set('Authorization', `Bearer ${token}`)
          .send({
            mbtiType: 'ENFP',
            interests: ['fantasy', 'adventure'],
          })
          .expect(200);

        // 3. Get feature recommendations
        const featuresRes = await request(app)
          .get('/api/v1/features')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(featuresRes.body.data.length).toBeGreaterThan(0);

        // 4. Unlock gamification feature
        await request(app)
          .post('/api/v1/features/unlock')
          .set('Authorization', `Bearer ${token}`)
          .send({
            featureId: 'F5',
            unlockMethod: 'achievement',
          })
          .expect(200);

        // 5. Access gamification dashboard
        const dashboardRes = await request(app)
          .get('/api/v1/gamification/overview')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(dashboardRes.body.success).toBe(true);

        // Cleanup
        await prisma.featureUnlock.deleteMany({ where: { userId: newUserId } });
        await prisma.user.delete({ where: { id: newUserId } });
      });
    });

    describe('Creator Journey', () => {
      it('should complete full creator workflow', async () => {
        // 1. Access creator studio
        const dashboardRes = await request(app)
          .get('/api/v1/creator-studio/dashboard')
          .set('Authorization', `Bearer ${creatorToken}`)
          .expect(200);

        expect(dashboardRes.body.success).toBe(true);

        // 2. View analytics
        const analyticsRes = await request(app)
          .get('/api/v1/creator-studio/analytics?timeRange=30d')
          .set('Authorization', `Bearer ${creatorToken}`)
          .expect(200);

        expect(analyticsRes.body.success).toBe(true);

        // 3. Check revenue
        expect(dashboardRes.body.data).toHaveProperty('totalRevenue');
      });
    });
  });
});
