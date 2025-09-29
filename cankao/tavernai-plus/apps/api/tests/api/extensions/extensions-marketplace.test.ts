/**
 * 插件市场合约测试 (T017)
 *
 * 测试插件市场的浏览、搜索、过滤和详情展示功能
 * 接口设计符合核心竞争力提升规范
 */

import request from 'supertest';
import { app } from '../../../src/server';
import { prisma } from '../../../src/lib/prisma';

describe('Extensions Marketplace API Contract Tests', () => {
  let testAuthorId: string;
  let testExtensionIds: string[] = [];

  beforeAll(async () => {
    // 创建测试作者
    const author = await prisma.user.create({
      data: {
        username: 'extension_author',
        email: 'author@test.com',
        passwordHash: 'test_hash'
      }
    });
    testAuthorId = author.id;

    // 创建多个测试扩展
    const extensionsData = [
      {
        id: 'ui-theme-dark',
        name: 'Dark Theme Extension',
        version: '1.0.0',
        authorId: testAuthorId,
        description: 'A beautiful dark theme for the interface',
        category: 'ui',
        status: 'approved',
        downloads: 1500,
        rating: 4.5,
        ratingCount: 120,
        manifestUrl: 'https://example.com/dark-theme/manifest.json',
        packageUrl: 'https://example.com/dark-theme/package.zip',
        iconUrl: 'https://example.com/dark-theme/icon.png',
        screenshots: JSON.stringify(['https://example.com/dark-theme/screenshot1.png']),
        permissions: JSON.stringify(['ui:theme', 'storage:write']),
        sandboxLevel: 'basic',
        securityReview: true,
        publishedAt: new Date('2024-01-15')
      },
      {
        id: 'api-translator',
        name: 'Real-time Translator',
        version: '2.1.0',
        authorId: testAuthorId,
        description: 'Translate messages in real-time using multiple APIs',
        category: 'api',
        status: 'approved',
        downloads: 850,
        rating: 4.2,
        ratingCount: 75,
        manifestUrl: 'https://example.com/translator/manifest.json',
        packageUrl: 'https://example.com/translator/package.zip',
        iconUrl: 'https://example.com/translator/icon.png',
        screenshots: JSON.stringify(['https://example.com/translator/screenshot1.png', 'https://example.com/translator/screenshot2.png']),
        permissions: JSON.stringify(['api:external', 'messages:read', 'messages:modify']),
        sandboxLevel: 'strict',
        securityReview: true,
        publishedAt: new Date('2024-02-20')
      },
      {
        id: 'tool-backup',
        name: 'Conversation Backup Tool',
        version: '1.5.2',
        authorId: testAuthorId,
        description: 'Automatically backup your conversations to cloud storage',
        category: 'tool',
        status: 'approved',
        downloads: 2200,
        rating: 4.8,
        ratingCount: 180,
        manifestUrl: 'https://example.com/backup/manifest.json',
        packageUrl: 'https://example.com/backup/package.zip',
        iconUrl: 'https://example.com/backup/icon.png',
        screenshots: JSON.stringify(['https://example.com/backup/screenshot1.png']),
        permissions: JSON.stringify(['storage:write', 'export:data', 'cloud:upload']),
        sandboxLevel: 'strict',
        securityReview: true,
        publishedAt: new Date('2024-03-10')
      },
      {
        id: 'theme-winter',
        name: 'Winter Theme',
        version: '1.0.1',
        authorId: testAuthorId,
        description: 'A cozy winter-themed interface',
        category: 'theme',
        status: 'pending',
        downloads: 0,
        rating: 0,
        ratingCount: 0,
        manifestUrl: 'https://example.com/winter/manifest.json',
        packageUrl: 'https://example.com/winter/package.zip',
        iconUrl: 'https://example.com/winter/icon.png',
        screenshots: JSON.stringify(['https://example.com/winter/screenshot1.png']),
        permissions: JSON.stringify(['ui:theme']),
        sandboxLevel: 'basic',
        securityReview: false,
        publishedAt: null
      },
      {
        id: 'rejected-ext',
        name: 'Rejected Extension',
        version: '1.0.0',
        authorId: testAuthorId,
        description: 'This extension was rejected for security reasons',
        category: 'tool',
        status: 'rejected',
        downloads: 0,
        rating: 0,
        ratingCount: 0,
        manifestUrl: 'https://example.com/rejected/manifest.json',
        packageUrl: null,
        iconUrl: null,
        screenshots: JSON.stringify([]),
        permissions: JSON.stringify(['system:admin']),
        sandboxLevel: 'none',
        securityReview: false,
        publishedAt: null
      }
    ];

    for (const extData of extensionsData) {
      const extension = await prisma.extension.create({ data: extData });
      testExtensionIds.push(extension.id);
    }
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.extensionReview.deleteMany({
      where: { extensionId: { in: testExtensionIds } }
    });
    await prisma.extension.deleteMany({
      where: { id: { in: testExtensionIds } }
    });
    await prisma.user.deleteMany({
      where: { id: testAuthorId }
    });
  });

  describe('GET /api/extensions/marketplace - 基本列表功能', () => {
    it('应该返回已发布的扩展列表', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace')
        .expect(200);

      expect(response.body.extensions).toBeDefined();
      expect(Array.isArray(response.body.extensions)).toBe(true);
      expect(response.body.total).toBeGreaterThanOrEqual(3);
      expect(response.body.pagination).toBeDefined();

      // 验证只返回已批准的扩展
      const approvedExtensions = response.body.extensions.filter((ext: any) => ext.status === 'approved');
      expect(approvedExtensions.length).toBe(response.body.extensions.length);
    });

    it('应该包含扩展的基本信息', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace')
        .expect(200);

      const extension = response.body.extensions[0];
      expect(extension.id).toBeDefined();
      expect(extension.name).toBeDefined();
      expect(extension.version).toBeDefined();
      expect(extension.description).toBeDefined();
      expect(extension.category).toBeDefined();
      expect(extension.downloads).toBeDefined();
      expect(extension.rating).toBeDefined();
      expect(extension.ratingCount).toBeDefined();
      expect(extension.iconUrl).toBeDefined();
      expect(extension.author).toBeDefined();
      expect(extension.publishedAt).toBeDefined();
    });

    it('应该支持分页', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.extensions.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(3);
      expect(response.body.pagination.totalPages).toBeGreaterThanOrEqual(2);
    });

    it('应该默认按热门度排序', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace')
        .expect(200);

      const extensions = response.body.extensions;
      for (let i = 1; i < extensions.length; i++) {
        const prevScore = extensions[i - 1].downloads + (extensions[i - 1].rating * extensions[i - 1].ratingCount);
        const currScore = extensions[i].downloads + (extensions[i].rating * extensions[i].ratingCount);
        expect(prevScore).toBeGreaterThanOrEqual(currScore);
      }
    });
  });

  describe('搜索和过滤功能', () => {
    it('应该支持按名称搜索', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace')
        .query({ search: 'Dark Theme' })
        .expect(200);

      expect(response.body.extensions.length).toBeGreaterThanOrEqual(1);
      expect(response.body.extensions.some((ext: any) => ext.name.includes('Dark Theme'))).toBe(true);
    });

    it('应该支持按描述搜索', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace')
        .query({ search: 'translator' })
        .expect(200);

      expect(response.body.extensions.length).toBeGreaterThanOrEqual(1);
      expect(response.body.extensions.some((ext: any) =>
        ext.name.toLowerCase().includes('translator') ||
        ext.description.toLowerCase().includes('translator')
      )).toBe(true);
    });

    it('应该支持按分类过滤', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace')
        .query({ category: 'ui' })
        .expect(200);

      expect(response.body.extensions.every((ext: any) => ext.category === 'ui')).toBe(true);
      expect(response.body.extensions.length).toBeGreaterThanOrEqual(1);
    });

    it('应该支持多分类过滤', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace')
        .query({ category: 'ui,api' })
        .expect(200);

      expect(response.body.extensions.every((ext: any) =>
        ext.category === 'ui' || ext.category === 'api'
      )).toBe(true);
      expect(response.body.extensions.length).toBeGreaterThanOrEqual(2);
    });

    it('应该支持按评分过滤', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace')
        .query({ minRating: 4.5 })
        .expect(200);

      expect(response.body.extensions.every((ext: any) => ext.rating >= 4.5)).toBe(true);
    });

    it('应该支持按权限过滤', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace')
        .query({ permission: 'ui:theme' })
        .expect(200);

      expect(response.body.extensions.every((ext: any) =>
        ext.permissions.includes('ui:theme')
      )).toBe(true);
    });

    it('应该支持按安全级别过滤', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace')
        .query({ sandboxLevel: 'strict' })
        .expect(200);

      expect(response.body.extensions.every((ext: any) => ext.sandboxLevel === 'strict')).toBe(true);
      expect(response.body.extensions.length).toBeGreaterThanOrEqual(2);
    });

    it('应该支持已安全审核过滤', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace')
        .query({ securityReviewed: 'true' })
        .expect(200);

      expect(response.body.extensions.every((ext: any) => ext.securityReview === true)).toBe(true);
    });

    it('应该支持复合搜索条件', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace')
        .query({
          category: 'tool',
          minRating: 4.0,
          securityReviewed: 'true'
        })
        .expect(200);

      expect(response.body.extensions.every((ext: any) =>
        ext.category === 'tool' &&
        ext.rating >= 4.0 &&
        ext.securityReview === true
      )).toBe(true);
    });
  });

  describe('排序功能', () => {
    it('应该支持按下载量排序', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace')
        .query({ sortBy: 'downloads', sortOrder: 'desc' })
        .expect(200);

      const extensions = response.body.extensions;
      for (let i = 1; i < extensions.length; i++) {
        expect(extensions[i - 1].downloads).toBeGreaterThanOrEqual(extensions[i].downloads);
      }
    });

    it('应该支持按评分排序', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace')
        .query({ sortBy: 'rating', sortOrder: 'desc' })
        .expect(200);

      const extensions = response.body.extensions;
      for (let i = 1; i < extensions.length; i++) {
        expect(extensions[i - 1].rating).toBeGreaterThanOrEqual(extensions[i].rating);
      }
    });

    it('应该支持按发布时间排序', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace')
        .query({ sortBy: 'publishedAt', sortOrder: 'desc' })
        .expect(200);

      const extensions = response.body.extensions;
      for (let i = 1; i < extensions.length; i++) {
        const prevTime = new Date(extensions[i - 1].publishedAt).getTime();
        const currTime = new Date(extensions[i].publishedAt).getTime();
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }
    });

    it('应该支持按名称排序', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace')
        .query({ sortBy: 'name', sortOrder: 'asc' })
        .expect(200);

      const extensions = response.body.extensions;
      for (let i = 1; i < extensions.length; i++) {
        expect(extensions[i - 1].name.localeCompare(extensions[i].name)).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('分类统计功能', () => {
    it('应该返回分类统计信息', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace')
        .query({ includeStats: 'true' })
        .expect(200);

      expect(response.body.statistics).toBeDefined();
      expect(response.body.statistics.categories).toBeDefined();
      expect(response.body.statistics.totalExtensions).toBeDefined();
      expect(response.body.statistics.totalDownloads).toBeDefined();
      expect(response.body.statistics.averageRating).toBeDefined();

      // 验证分类统计
      const categories = response.body.statistics.categories;
      expect(categories.ui).toBeGreaterThanOrEqual(1);
      expect(categories.api).toBeGreaterThanOrEqual(1);
      expect(categories.tool).toBeGreaterThanOrEqual(1);
    });

    it('应该返回热门标签', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace')
        .query({ includeTags: 'true' })
        .expect(200);

      expect(response.body.popularTags).toBeDefined();
      expect(Array.isArray(response.body.popularTags)).toBe(true);
    });
  });

  describe('GET /api/extensions/marketplace/:extensionId - 扩展详情', () => {
    it('应该返回扩展的详细信息', async () => {
      const extensionId = testExtensionIds[0]; // ui-theme-dark

      const response = await request(app)
        .get(`/api/extensions/marketplace/${extensionId}`)
        .expect(200);

      expect(response.body.extension).toBeDefined();
      expect(response.body.extension.id).toBe(extensionId);
      expect(response.body.extension.name).toBe('Dark Theme Extension');
      expect(response.body.extension.version).toBe('1.0.0');
      expect(response.body.extension.description).toBeDefined();
      expect(response.body.extension.manifestUrl).toBeDefined();
      expect(response.body.extension.packageUrl).toBeDefined();
      expect(response.body.extension.screenshots).toBeDefined();
      expect(response.body.extension.permissions).toBeDefined();
      expect(response.body.extension.author).toBeDefined();
    });

    it('应该包含安全信息', async () => {
      const extensionId = testExtensionIds[1]; // api-translator (strict sandbox)

      const response = await request(app)
        .get(`/api/extensions/marketplace/${extensionId}`)
        .expect(200);

      expect(response.body.extension.sandboxLevel).toBe('strict');
      expect(response.body.extension.securityReview).toBe(true);
      expect(response.body.extension.permissions).toBeDefined();
      expect(Array.isArray(response.body.extension.permissions)).toBe(true);
    });

    it('应该包含统计信息', async () => {
      const extensionId = testExtensionIds[0];

      const response = await request(app)
        .get(`/api/extensions/marketplace/${extensionId}`)
        .expect(200);

      expect(response.body.extension.downloads).toBe(1500);
      expect(response.body.extension.rating).toBe(4.5);
      expect(response.body.extension.ratingCount).toBe(120);
    });

    it('应该支持包含评价信息', async () => {
      const extensionId = testExtensionIds[0];

      const response = await request(app)
        .get(`/api/extensions/marketplace/${extensionId}`)
        .query({ includeReviews: 'true' })
        .expect(200);

      expect(response.body.extension.reviews).toBeDefined();
      expect(Array.isArray(response.body.extension.reviews)).toBe(true);
    });

    it('应该拒绝访问未发布的扩展', async () => {
      const pendingExtensionId = testExtensionIds.find(id => id === 'theme-winter');

      await request(app)
        .get(`/api/extensions/marketplace/${pendingExtensionId}`)
        .expect(404)
        .expect(res => {
          expect(res.body.error).toBe('Extension not found or not available');
        });
    });

    it('应该拒绝访问被拒绝的扩展', async () => {
      const rejectedExtensionId = testExtensionIds.find(id => id === 'rejected-ext');

      await request(app)
        .get(`/api/extensions/marketplace/${rejectedExtensionId}`)
        .expect(404)
        .expect(res => {
          expect(res.body.error).toBe('Extension not found or not available');
        });
    });

    it('应该处理不存在的扩展', async () => {
      await request(app)
        .get('/api/extensions/marketplace/non-existent-extension')
        .expect(404)
        .expect(res => {
          expect(res.body.error).toBe('Extension not found or not available');
        });
    });
  });

  describe('GET /api/extensions/marketplace/categories - 分类信息', () => {
    it('应该返回所有可用分类', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace/categories')
        .expect(200);

      expect(response.body.categories).toBeDefined();
      expect(Array.isArray(response.body.categories)).toBe(true);
      expect(response.body.categories.length).toBeGreaterThanOrEqual(3);

      const categoryNames = response.body.categories.map((cat: any) => cat.name);
      expect(categoryNames).toContain('ui');
      expect(categoryNames).toContain('api');
      expect(categoryNames).toContain('tool');
    });

    it('应该包含每个分类的统计信息', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace/categories')
        .expect(200);

      const uiCategory = response.body.categories.find((cat: any) => cat.name === 'ui');
      expect(uiCategory).toBeDefined();
      expect(uiCategory.count).toBeGreaterThanOrEqual(1);
      expect(uiCategory.totalDownloads).toBeGreaterThanOrEqual(0);
      expect(uiCategory.averageRating).toBeDefined();
    });
  });

  describe('缓存和性能', () => {
    it('应该设置适当的缓存头', async () => {
      const response = await request(app)
        .get('/api/extensions/marketplace')
        .expect(200);

      expect(response.headers['cache-control']).toBeDefined();
      expect(response.headers['etag']).toBeDefined();
    });

    it('应该支持条件请求', async () => {
      const initialResponse = await request(app)
        .get('/api/extensions/marketplace')
        .expect(200);

      const etag = initialResponse.headers['etag'];

      await request(app)
        .get('/api/extensions/marketplace')
        .set('If-None-Match', etag)
        .expect(304);
    });

    it('应该在合理时间内响应', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/extensions/marketplace')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // 1秒内响应
    });
  });

  describe('错误处理', () => {
    it('应该验证查询参数', async () => {
      await request(app)
        .get('/api/extensions/marketplace')
        .query({ page: -1 })
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Invalid page number');
        });
    });

    it('应该处理无效的排序字段', async () => {
      await request(app)
        .get('/api/extensions/marketplace')
        .query({ sortBy: 'invalid_field' })
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Invalid sort field');
        });
    });

    it('应该处理无效的分类', async () => {
      await request(app)
        .get('/api/extensions/marketplace')
        .query({ category: 'invalid_category' })
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Invalid category');
        });
    });
  });
});