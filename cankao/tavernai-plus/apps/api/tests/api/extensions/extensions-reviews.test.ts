/**
 * 插件评价合约测试 (T020)
 *
 * 测试插件评价系统：评价提交、查看、统计、举报和管理
 * 接口设计符合核心竞争力提升规范
 */

import request from 'supertest';
import { app } from '../../../src/server';
import { prisma } from '../../../src/lib/prisma';

describe('Extensions Reviews API Contract Tests', () => {
  let testUserId: string;
  let testExtensionId: string;
  let testAuthorId: string;
  let testReviewId: string;
  let secondUserId: string;

  beforeAll(async () => {
    // 创建测试用户
    const user = await prisma.user.create({
      data: {
        username: 'review_test_user',
        email: 'review@test.com',
        passwordHash: 'test_hash'
      }
    });
    testUserId = user.id;

    // 创建第二个测试用户
    const secondUser = await prisma.user.create({
      data: {
        username: 'second_reviewer',
        email: 'reviewer2@test.com',
        passwordHash: 'test_hash'
      }
    });
    secondUserId = secondUser.id;

    // 创建扩展作者
    const author = await prisma.user.create({
      data: {
        username: 'review_author',
        email: 'reviewauthor@test.com',
        passwordHash: 'test_hash'
      }
    });
    testAuthorId = author.id;

    // 创建测试扩展
    const extension = await prisma.extension.create({
      data: {
        id: 'reviewable-extension',
        name: 'Reviewable Extension',
        version: '1.0.0',
        authorId: testAuthorId,
        description: 'Extension for review testing',
        category: 'tool',
        status: 'approved',
        manifestUrl: 'https://cdn.example.com/reviewable/manifest.json',
        packageUrl: 'https://cdn.example.com/reviewable/v1.0.0.zip',
        iconUrl: 'https://cdn.example.com/reviewable/icon.png',
        screenshots: JSON.stringify(['https://cdn.example.com/reviewable/screenshot1.png']),
        permissions: JSON.stringify(['storage:read', 'ui:modify']),
        sandboxLevel: 'basic',
        securityReview: true,
        downloads: 500,
        rating: 0.0,
        ratingCount: 0
      }
    });
    testExtensionId = extension.id;

    // 确保用户已安装扩展（评价的前提条件）
    await prisma.extensionInstallation.create({
      data: {
        userId: testUserId,
        extensionId: testExtensionId,
        version: '1.0.0',
        status: 'active'
      }
    });

    await prisma.extensionInstallation.create({
      data: {
        userId: secondUserId,
        extensionId: testExtensionId,
        version: '1.0.0',
        status: 'active'
      }
    });
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.extensionReview.deleteMany({
      where: { extensionId: testExtensionId }
    });
    await prisma.extensionInstallation.deleteMany({
      where: { extensionId: testExtensionId }
    });
    await prisma.extension.deleteMany({
      where: { id: testExtensionId }
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUserId, testAuthorId, secondUserId] } }
    });
  });

  describe('POST /api/extensions/:extensionId/reviews - 提交评价', () => {
    afterEach(async () => {
      // 清理评价数据
      await prisma.extensionReview.deleteMany({
        where: { extensionId: testExtensionId, userId: testUserId }
      });
    });

    it('应该成功提交新评价', async () => {
      const reviewData = {
        rating: 5,
        review: 'Excellent extension! Very useful and well-designed.',
        version: '1.0.0'
      };

      const response = await request(app)
        .post(`/api/extensions/${testExtensionId}/reviews`)
        .send(reviewData)
        // .set('Authorization', `Bearer ${userToken}`) // 需要实现认证
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.review).toBeDefined();
      expect(response.body.review.rating).toBe(5);
      expect(response.body.review.review).toBe(reviewData.review);
      expect(response.body.review.version).toBe('1.0.0');
      expect(response.body.review.status).toBe('active');

      // 验证数据库记录
      const review = await prisma.extensionReview.findFirst({
        where: { extensionId: testExtensionId, userId: testUserId }
      });
      expect(review).toBeDefined();
      expect(review?.rating).toBe(5);

      testReviewId = response.body.review.id;
    });

    it('应该只允许已安装用户评价', async () => {
      // 创建未安装扩展的用户
      const nonInstalledUser = await prisma.user.create({
        data: {
          username: 'non_installed_user',
          email: 'noninstalled@test.com',
          passwordHash: 'test_hash'
        }
      });

      const reviewData = {
        rating: 4,
        review: 'Good extension',
        version: '1.0.0'
      };

      await request(app)
        .post(`/api/extensions/${testExtensionId}/reviews`)
        .send(reviewData)
        // .set('Authorization', `Bearer ${nonInstalledUserToken}`)
        .expect(403)
        .expect(res => {
          expect(res.body.error).toBe('You must install the extension before reviewing');
        });

      // 清理
      await prisma.user.delete({ where: { id: nonInstalledUser.id } });
    });

    it('应该验证评分范围', async () => {
      const invalidReviewData = {
        rating: 6, // 超出1-5范围
        review: 'Test review',
        version: '1.0.0'
      };

      await request(app)
        .post(`/api/extensions/${testExtensionId}/reviews`)
        .send(invalidReviewData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Rating must be between 1 and 5');
        });
    });

    it('应该支持仅评分不评论', async () => {
      const ratingOnlyData = {
        rating: 4,
        version: '1.0.0'
      };

      const response = await request(app)
        .post(`/api/extensions/${testExtensionId}/reviews`)
        .send(ratingOnlyData)
        .expect(201);

      expect(response.body.review.rating).toBe(4);
      expect(response.body.review.review).toBeNull();
    });

    it('应该防止重复评价', async () => {
      // 先提交一个评价
      const firstReview = {
        rating: 5,
        review: 'First review',
        version: '1.0.0'
      };

      await request(app)
        .post(`/api/extensions/${testExtensionId}/reviews`)
        .send(firstReview)
        .expect(201);

      // 尝试再次评价
      const secondReview = {
        rating: 3,
        review: 'Second review',
        version: '1.0.0'
      };

      await request(app)
        .post(`/api/extensions/${testExtensionId}/reviews`)
        .send(secondReview)
        .expect(409)
        .expect(res => {
          expect(res.body.error).toBe('You have already reviewed this extension');
          expect(res.body.existingReview).toBeDefined();
        });
    });

    it('应该验证评论内容长度', async () => {
      const longReviewData = {
        rating: 4,
        review: 'a'.repeat(2001), // 超过2000字符限制
        version: '1.0.0'
      };

      await request(app)
        .post(`/api/extensions/${testExtensionId}/reviews`)
        .send(longReviewData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Review text too long');
        });
    });
  });

  describe('GET /api/extensions/:extensionId/reviews - 获取评价列表', () => {
    beforeAll(async () => {
      // 创建多个测试评价
      const reviewsData = [
        {
          userId: testUserId,
          extensionId: testExtensionId,
          rating: 5,
          review: 'Excellent extension with great features!',
          version: '1.0.0',
          status: 'active',
          helpfulCount: 15,
          createdAt: new Date('2024-01-15')
        },
        {
          userId: secondUserId,
          extensionId: testExtensionId,
          rating: 4,
          review: 'Good extension, but could use some improvements.',
          version: '1.0.0',
          status: 'active',
          helpfulCount: 8,
          createdAt: new Date('2024-02-10')
        },
        {
          id: 'hidden-review',
          userId: testUserId,
          extensionId: testExtensionId,
          rating: 2,
          review: 'This review was hidden due to inappropriate content.',
          version: '1.0.0',
          status: 'hidden',
          helpfulCount: 0,
          createdAt: new Date('2024-03-01')
        }
      ];

      for (const reviewData of reviewsData) {
        await prisma.extensionReview.create({ data: reviewData });
      }

      // 更新扩展的平均评分
      await prisma.extension.update({
        where: { id: testExtensionId },
        data: {
          rating: 4.5,
          ratingCount: 2
        }
      });
    });

    afterAll(async () => {
      await prisma.extensionReview.deleteMany({
        where: { extensionId: testExtensionId }
      });
    });

    it('应该返回扩展的所有公开评价', async () => {
      const response = await request(app)
        .get(`/api/extensions/${testExtensionId}/reviews`)
        .expect(200);

      expect(response.body.reviews).toBeDefined();
      expect(Array.isArray(response.body.reviews)).toBe(true);
      expect(response.body.reviews.length).toBe(2); // 只显示active状态的评价
      expect(response.body.total).toBe(2);
      expect(response.body.statistics).toBeDefined();

      // 验证不显示隐藏的评价
      expect(response.body.reviews.every((review: any) => review.status === 'active')).toBe(true);
    });

    it('应该包含评价统计信息', async () => {
      const response = await request(app)
        .get(`/api/extensions/${testExtensionId}/reviews`)
        .expect(200);

      expect(response.body.statistics.averageRating).toBeDefined();
      expect(response.body.statistics.totalReviews).toBe(2);
      expect(response.body.statistics.ratingDistribution).toBeDefined();
      expect(response.body.statistics.ratingDistribution['5']).toBe(1);
      expect(response.body.statistics.ratingDistribution['4']).toBe(1);
    });

    it('应该支持分页', async () => {
      const response = await request(app)
        .get(`/api/extensions/${testExtensionId}/reviews`)
        .query({ page: 1, limit: 1 })
        .expect(200);

      expect(response.body.reviews.length).toBe(1);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    it('应该支持按评分过滤', async () => {
      const response = await request(app)
        .get(`/api/extensions/${testExtensionId}/reviews`)
        .query({ rating: '5' })
        .expect(200);

      expect(response.body.reviews.every((review: any) => review.rating === 5)).toBe(true);
      expect(response.body.reviews.length).toBe(1);
    });

    it('应该支持按有用程度排序', async () => {
      const response = await request(app)
        .get(`/api/extensions/${testExtensionId}/reviews`)
        .query({ sortBy: 'helpful', sortOrder: 'desc' })
        .expect(200);

      const reviews = response.body.reviews;
      for (let i = 1; i < reviews.length; i++) {
        expect(reviews[i - 1].helpfulCount).toBeGreaterThanOrEqual(reviews[i].helpfulCount);
      }
    });

    it('应该支持按时间排序', async () => {
      const response = await request(app)
        .get(`/api/extensions/${testExtensionId}/reviews`)
        .query({ sortBy: 'date', sortOrder: 'desc' })
        .expect(200);

      const reviews = response.body.reviews;
      for (let i = 1; i < reviews.length; i++) {
        const prevTime = new Date(reviews[i - 1].createdAt).getTime();
        const currTime = new Date(reviews[i].createdAt).getTime();
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }
    });

    it('应该包含用户信息', async () => {
      const response = await request(app)
        .get(`/api/extensions/${testExtensionId}/reviews`)
        .expect(200);

      const review = response.body.reviews[0];
      expect(review.user).toBeDefined();
      expect(review.user.username).toBeDefined();
      expect(review.user.avatar).toBeDefined();
      // 不应该包含敏感信息
      expect(review.user.email).toBeUndefined();
      expect(review.user.passwordHash).toBeUndefined();
    });
  });

  describe('PATCH /api/extensions/:extensionId/reviews/:reviewId - 更新评价', () => {
    let updateableReviewId: string;

    beforeEach(async () => {
      const review = await prisma.extensionReview.create({
        data: {
          userId: testUserId,
          extensionId: testExtensionId,
          rating: 4,
          review: 'Original review text',
          version: '1.0.0',
          status: 'active'
        }
      });
      updateableReviewId = review.id;
    });

    afterEach(async () => {
      await prisma.extensionReview.deleteMany({
        where: { id: updateableReviewId }
      });
    });

    it('应该允许用户更新自己的评价', async () => {
      const updateData = {
        rating: 5,
        review: 'Updated review with new thoughts!'
      };

      const response = await request(app)
        .patch(`/api/extensions/${testExtensionId}/reviews/${updateableReviewId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.review.rating).toBe(5);
      expect(response.body.review.review).toBe(updateData.review);
      expect(response.body.review.updatedAt).toBeDefined();

      // 验证数据库更新
      const review = await prisma.extensionReview.findUnique({
        where: { id: updateableReviewId }
      });
      expect(review?.rating).toBe(5);
      expect(review?.review).toBe(updateData.review);
    });

    it('应该防止用户更新他人的评价', async () => {
      const updateData = {
        rating: 1,
        review: 'Malicious update attempt'
      };

      await request(app)
        .patch(`/api/extensions/${testExtensionId}/reviews/${updateableReviewId}`)
        .send(updateData)
        // .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403)
        .expect(res => {
          expect(res.body.error).toBe('You can only update your own reviews');
        });
    });

    it('应该限制更新频率', async () => {
      const updateData1 = { rating: 5 };
      const updateData2 = { rating: 3 };

      // 第一次更新
      await request(app)
        .patch(`/api/extensions/${testExtensionId}/reviews/${updateableReviewId}`)
        .send(updateData1)
        .expect(200);

      // 立即第二次更新
      await request(app)
        .patch(`/api/extensions/${testExtensionId}/reviews/${updateableReviewId}`)
        .send(updateData2)
        .expect(429)
        .expect(res => {
          expect(res.body.error).toContain('Too many updates');
          expect(res.body.retryAfter).toBeDefined();
        });
    });
  });

  describe('DELETE /api/extensions/:extensionId/reviews/:reviewId - 删除评价', () => {
    let deletableReviewId: string;

    beforeEach(async () => {
      const review = await prisma.extensionReview.create({
        data: {
          userId: testUserId,
          extensionId: testExtensionId,
          rating: 3,
          review: 'Review to be deleted',
          version: '1.0.0',
          status: 'active'
        }
      });
      deletableReviewId = review.id;
    });

    it('应该允许用户删除自己的评价', async () => {
      const response = await request(app)
        .delete(`/api/extensions/${testExtensionId}/reviews/${deletableReviewId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Review deleted successfully');

      // 验证数据库中已删除
      const review = await prisma.extensionReview.findUnique({
        where: { id: deletableReviewId }
      });
      expect(review).toBeNull();
    });

    it('应该防止用户删除他人的评价', async () => {
      await request(app)
        .delete(`/api/extensions/${testExtensionId}/reviews/${deletableReviewId}`)
        // .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403)
        .expect(res => {
          expect(res.body.error).toBe('You can only delete your own reviews');
        });
    });
  });

  describe('POST /api/extensions/:extensionId/reviews/:reviewId/helpful - 有用投票', () => {
    let votableReviewId: string;

    beforeAll(async () => {
      const review = await prisma.extensionReview.create({
        data: {
          userId: secondUserId,
          extensionId: testExtensionId,
          rating: 5,
          review: 'Very helpful review',
          version: '1.0.0',
          status: 'active',
          helpfulCount: 0
        }
      });
      votableReviewId = review.id;
    });

    afterAll(async () => {
      await prisma.extensionReview.deleteMany({
        where: { id: votableReviewId }
      });
    });

    it('应该允许用户标记评价为有用', async () => {
      const response = await request(app)
        .post(`/api/extensions/${testExtensionId}/reviews/${votableReviewId}/helpful`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.helpful).toBe(true);
      expect(response.body.helpfulCount).toBe(1);

      // 验证数据库更新
      const review = await prisma.extensionReview.findUnique({
        where: { id: votableReviewId }
      });
      expect(review?.helpfulCount).toBe(1);
    });

    it('应该支持取消有用投票', async () => {
      // 先投票
      await request(app)
        .post(`/api/extensions/${testExtensionId}/reviews/${votableReviewId}/helpful`)
        .expect(200);

      // 再次投票应该取消
      const response = await request(app)
        .post(`/api/extensions/${testExtensionId}/reviews/${votableReviewId}/helpful`)
        .expect(200);

      expect(response.body.helpful).toBe(false);
      expect(response.body.helpfulCount).toBe(0);
    });

    it('应该防止用户给自己的评价投票', async () => {
      // 创建用户自己的评价
      const ownReview = await prisma.extensionReview.create({
        data: {
          userId: testUserId,
          extensionId: testExtensionId,
          rating: 4,
          review: 'My own review',
          version: '1.0.0',
          status: 'active'
        }
      });

      await request(app)
        .post(`/api/extensions/${testExtensionId}/reviews/${ownReview.id}/helpful`)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toBe('You cannot vote on your own review');
        });

      // 清理
      await prisma.extensionReview.delete({ where: { id: ownReview.id } });
    });
  });

  describe('POST /api/extensions/:extensionId/reviews/:reviewId/report - 举报评价', () => {
    let reportableReviewId: string;

    beforeAll(async () => {
      const review = await prisma.extensionReview.create({
        data: {
          userId: secondUserId,
          extensionId: testExtensionId,
          rating: 1,
          review: 'Inappropriate content that should be reported',
          version: '1.0.0',
          status: 'active'
        }
      });
      reportableReviewId = review.id;
    });

    afterAll(async () => {
      await prisma.extensionReview.deleteMany({
        where: { id: reportableReviewId }
      });
    });

    it('应该允许用户举报不当评价', async () => {
      const reportData = {
        reason: 'spam',
        description: 'This review contains spam content'
      };

      const response = await request(app)
        .post(`/api/extensions/${testExtensionId}/reviews/${reportableReviewId}/report`)
        .send(reportData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Review reported successfully');
      expect(response.body.reportId).toBeDefined();
    });

    it('应该验证举报原因', async () => {
      const invalidReportData = {
        reason: 'invalid_reason',
        description: 'Test report'
      };

      await request(app)
        .post(`/api/extensions/${testExtensionId}/reviews/${reportableReviewId}/report`)
        .send(invalidReportData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Invalid report reason');
          expect(res.body.validReasons).toBeDefined();
        });
    });

    it('应该防止重复举报', async () => {
      const reportData = {
        reason: 'inappropriate',
        description: 'First report'
      };

      // 第一次举报
      await request(app)
        .post(`/api/extensions/${testExtensionId}/reviews/${reportableReviewId}/report`)
        .send(reportData)
        .expect(200);

      // 尝试再次举报
      await request(app)
        .post(`/api/extensions/${testExtensionId}/reviews/${reportableReviewId}/report`)
        .send(reportData)
        .expect(409)
        .expect(res => {
          expect(res.body.error).toBe('You have already reported this review');
        });
    });
  });

  describe('管理员功能', () => {
    let adminUserId: string;
    let moderatableReviewId: string;

    beforeAll(async () => {
      // 创建管理员用户
      const admin = await prisma.user.create({
        data: {
          username: 'admin_user',
          email: 'admin@test.com',
          passwordHash: 'test_hash',
          role: 'admin'
        }
      });
      adminUserId = admin.id;

      // 创建需要审核的评价
      const review = await prisma.extensionReview.create({
        data: {
          userId: testUserId,
          extensionId: testExtensionId,
          rating: 2,
          review: 'This review needs moderation',
          version: '1.0.0',
          status: 'active'
        }
      });
      moderatableReviewId = review.id;
    });

    afterAll(async () => {
      await prisma.extensionReview.deleteMany({
        where: { id: moderatableReviewId }
      });
      await prisma.user.deleteMany({
        where: { id: adminUserId }
      });
    });

    it('应该允许管理员隐藏不当评价', async () => {
      const moderationData = {
        action: 'hide',
        reason: 'Inappropriate content',
        notifyUser: true
      };

      const response = await request(app)
        .post(`/api/extensions/${testExtensionId}/reviews/${moderatableReviewId}/moderate`)
        .send(moderationData)
        // .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.action).toBe('hide');

      // 验证评价状态更新
      const review = await prisma.extensionReview.findUnique({
        where: { id: moderatableReviewId }
      });
      expect(review?.status).toBe('hidden');
    });

    it('应该允许管理员查看所有评价包括隐藏的', async () => {
      const response = await request(app)
        .get(`/api/extensions/${testExtensionId}/reviews`)
        .query({ includeHidden: 'true' })
        // .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.reviews.some((review: any) => review.status === 'hidden')).toBe(true);
    });

    it('应该拒绝非管理员的审核请求', async () => {
      const moderationData = {
        action: 'hide',
        reason: 'Test'
      };

      await request(app)
        .post(`/api/extensions/${testExtensionId}/reviews/${moderatableReviewId}/moderate`)
        .send(moderationData)
        // .set('Authorization', `Bearer ${userToken}`)
        .expect(403)
        .expect(res => {
          expect(res.body.error).toBe('Insufficient permissions');
        });
    });
  });

  describe('性能和缓存', () => {
    it('应该设置适当的缓存头', async () => {
      const response = await request(app)
        .get(`/api/extensions/${testExtensionId}/reviews`)
        .expect(200);

      expect(response.headers['cache-control']).toBeDefined();
      expect(response.headers['etag']).toBeDefined();
    });

    it('应该快速响应评价列表请求', async () => {
      const startTime = Date.now();

      await request(app)
        .get(`/api/extensions/${testExtensionId}/reviews`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // 1秒内响应
    });

    it('应该正确更新扩展评分统计', async () => {
      // 添加新评价
      const newReviewData = {
        rating: 3,
        review: 'Average extension',
        version: '1.0.0'
      };

      await request(app)
        .post(`/api/extensions/${testExtensionId}/reviews`)
        .send(newReviewData)
        .expect(201);

      // 检查扩展的评分是否更新
      const extension = await prisma.extension.findUnique({
        where: { id: testExtensionId }
      });

      expect(extension?.ratingCount).toBeGreaterThan(0);
      expect(extension?.rating).toBeGreaterThan(0);
      expect(extension?.rating).toBeLessThanOrEqual(5);

      // 清理
      await prisma.extensionReview.deleteMany({
        where: { extensionId: testExtensionId, userId: testUserId }
      });
    });
  });

  describe('错误处理', () => {
    it('应该处理不存在的扩展', async () => {
      await request(app)
        .get('/api/extensions/non-existent-extension/reviews')
        .expect(404)
        .expect(res => {
          expect(res.body.error).toBe('Extension not found');
        });
    });

    it('应该处理不存在的评价', async () => {
      await request(app)
        .patch(`/api/extensions/${testExtensionId}/reviews/non-existent-review`)
        .send({ rating: 5 })
        .expect(404)
        .expect(res => {
          expect(res.body.error).toBe('Review not found');
        });
    });

    it('应该验证必需字段', async () => {
      const incompleteData = {
        review: 'Missing rating'
      };

      await request(app)
        .post(`/api/extensions/${testExtensionId}/reviews`)
        .send(incompleteData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Rating is required');
        });
    });
  });
});