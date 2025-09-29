/**
 * 插件安装合约测试 (T018)
 *
 * 测试插件安装流程、验证、权限检查和错误处理
 * 接口设计符合核心竞争力提升规范
 */

import request from 'supertest';
import { app } from '../../../src/server';
import { prisma } from '../../../src/lib/prisma';

describe('Extensions Installation API Contract Tests', () => {
  let testUserId: string;
  let testExtensionId: string;
  let testAuthorId: string;

  beforeAll(async () => {
    // 创建测试用户
    const user = await prisma.user.create({
      data: {
        username: 'install_test_user',
        email: 'install@test.com',
        passwordHash: 'test_hash'
      }
    });
    testUserId = user.id;

    // 创建扩展作者
    const author = await prisma.user.create({
      data: {
        username: 'extension_author',
        email: 'author@test.com',
        passwordHash: 'test_hash'
      }
    });
    testAuthorId = author.id;

    // 创建测试扩展
    const extension = await prisma.extension.create({
      data: {
        id: 'test-installable-extension',
        name: 'Test Installable Extension',
        version: '1.0.0',
        authorId: testAuthorId,
        description: 'A test extension for installation testing',
        category: 'tool',
        status: 'approved',
        manifestUrl: 'https://cdn.example.com/test-extension/manifest.json',
        packageUrl: 'https://cdn.example.com/test-extension/v1.0.0.zip',
        iconUrl: 'https://cdn.example.com/test-extension/icon.png',
        screenshots: JSON.stringify(['https://cdn.example.com/test-extension/screenshot1.png']),
        permissions: JSON.stringify(['storage:read', 'ui:modify']),
        sandboxLevel: 'basic',
        securityReview: true
      }
    });
    testExtensionId = extension.id;
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.extensionInstallation.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.extension.deleteMany({
      where: { id: testExtensionId }
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUserId, testAuthorId] } }
    });
  });

  describe('POST /api/extensions/install - 基本安装功能', () => {
    afterEach(async () => {
      // 清理安装记录
      await prisma.extensionInstallation.deleteMany({
        where: { userId: testUserId, extensionId: testExtensionId }
      });
    });

    it('应该成功安装扩展', async () => {
      const installData = {
        extensionId: testExtensionId,
        version: '1.0.0'
      };

      const response = await request(app)
        .post('/api/extensions/install')
        .send(installData)
        // .set('Authorization', `Bearer ${userToken}`) // 需要实现认证
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.installation).toBeDefined();
      expect(response.body.installation.extensionId).toBe(testExtensionId);
      expect(response.body.installation.version).toBe('1.0.0');
      expect(response.body.installation.status).toBe('installing');
      expect(response.body.installation.enabled).toBe(true);

      // 验证数据库记录
      const installation = await prisma.extensionInstallation.findUnique({
        where: {
          userId_extensionId: {
            userId: testUserId,
            extensionId: testExtensionId
          }
        }
      });
      expect(installation).toBeDefined();
      expect(installation?.version).toBe('1.0.0');
      expect(installation?.status).toBe('installing');
    });

    it('应该支持自定义配置安装', async () => {
      const installData = {
        extensionId: testExtensionId,
        version: '1.0.0',
        config: {
          autoStart: false,
          theme: 'dark',
          notifications: true
        },
        autoUpdate: false
      };

      const response = await request(app)
        .post('/api/extensions/install')
        .send(installData)
        .expect(201);

      expect(response.body.installation.config).toEqual(installData.config);
      expect(response.body.installation.autoUpdate).toBe(false);

      // 验证数据库配置
      const installation = await prisma.extensionInstallation.findUnique({
        where: {
          userId_extensionId: {
            userId: testUserId,
            extensionId: testExtensionId
          }
        }
      });
      expect(JSON.parse(installation?.config || '{}')).toEqual(installData.config);
      expect(installation?.autoUpdate).toBe(false);
    });

    it('应该返回安装进度信息', async () => {
      const installData = {
        extensionId: testExtensionId,
        version: '1.0.0'
      };

      const response = await request(app)
        .post('/api/extensions/install')
        .send(installData)
        .expect(201);

      expect(response.body.progress).toBeDefined();
      expect(response.body.progress.stage).toBe('downloading');
      expect(response.body.progress.percentage).toBeDefined();
      expect(response.body.progress.estimatedTimeRemaining).toBeDefined();
    });
  });

  describe('安装验证和权限检查', () => {
    it('应该拒绝安装不存在的扩展', async () => {
      const installData = {
        extensionId: 'non-existent-extension',
        version: '1.0.0'
      };

      await request(app)
        .post('/api/extensions/install')
        .send(installData)
        .expect(404)
        .expect(res => {
          expect(res.body.error).toBe('Extension not found');
        });
    });

    it('应该拒绝安装未批准的扩展', async () => {
      // 创建未批准的扩展
      const pendingExtension = await prisma.extension.create({
        data: {
          id: 'pending-extension',
          name: 'Pending Extension',
          version: '1.0.0',
          authorId: testAuthorId,
          description: 'A pending extension',
          category: 'tool',
          status: 'pending',
          manifestUrl: 'https://example.com/pending/manifest.json',
          permissions: JSON.stringify(['storage:read']),
          sandboxLevel: 'basic'
        }
      });

      const installData = {
        extensionId: 'pending-extension',
        version: '1.0.0'
      };

      await request(app)
        .post('/api/extensions/install')
        .send(installData)
        .expect(403)
        .expect(res => {
          expect(res.body.error).toBe('Extension is not approved for installation');
        });

      // 清理
      await prisma.extension.delete({ where: { id: 'pending-extension' } });
    });

    it('应该拒绝安装被拒绝的扩展', async () => {
      // 创建被拒绝的扩展
      const rejectedExtension = await prisma.extension.create({
        data: {
          id: 'rejected-extension',
          name: 'Rejected Extension',
          version: '1.0.0',
          authorId: testAuthorId,
          description: 'A rejected extension',
          category: 'tool',
          status: 'rejected',
          manifestUrl: 'https://example.com/rejected/manifest.json',
          permissions: JSON.stringify(['system:admin']),
          sandboxLevel: 'none'
        }
      });

      const installData = {
        extensionId: 'rejected-extension',
        version: '1.0.0'
      };

      await request(app)
        .post('/api/extensions/install')
        .send(installData)
        .expect(403)
        .expect(res => {
          expect(res.body.error).toBe('Extension is not approved for installation');
        });

      // 清理
      await prisma.extension.delete({ where: { id: 'rejected-extension' } });
    });

    it('应该验证版本兼容性', async () => {
      const installData = {
        extensionId: testExtensionId,
        version: '999.0.0' // 不存在的版本
      };

      await request(app)
        .post('/api/extensions/install')
        .send(installData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toBe('Requested version not available');
        });
    });

    it('应该检查权限冲突', async () => {
      // 创建需要管理员权限的扩展
      const adminExtension = await prisma.extension.create({
        data: {
          id: 'admin-extension',
          name: 'Admin Extension',
          version: '1.0.0',
          authorId: testAuthorId,
          description: 'Extension requiring admin permissions',
          category: 'tool',
          status: 'approved',
          manifestUrl: 'https://example.com/admin/manifest.json',
          permissions: JSON.stringify(['system:admin', 'users:manage']),
          sandboxLevel: 'none',
          securityReview: true
        }
      });

      const installData = {
        extensionId: 'admin-extension',
        version: '1.0.0'
      };

      await request(app)
        .post('/api/extensions/install')
        .send(installData)
        .expect(403)
        .expect(res => {
          expect(res.body.error).toContain('Insufficient permissions');
          expect(res.body.requiredPermissions).toBeDefined();
        });

      // 清理
      await prisma.extension.delete({ where: { id: 'admin-extension' } });
    });

    it('应该防止重复安装', async () => {
      // 先安装一次
      const installData = {
        extensionId: testExtensionId,
        version: '1.0.0'
      };

      await request(app)
        .post('/api/extensions/install')
        .send(installData)
        .expect(201);

      // 尝试再次安装
      await request(app)
        .post('/api/extensions/install')
        .send(installData)
        .expect(409)
        .expect(res => {
          expect(res.body.error).toBe('Extension already installed');
          expect(res.body.currentVersion).toBe('1.0.0');
        });
    });
  });

  describe('安装状态跟踪', () => {
    let installationId: string;

    beforeEach(async () => {
      const installation = await prisma.extensionInstallation.create({
        data: {
          userId: testUserId,
          extensionId: testExtensionId,
          version: '1.0.0',
          status: 'installing'
        }
      });
      installationId = installation.id;
    });

    afterEach(async () => {
      await prisma.extensionInstallation.deleteMany({
        where: { id: installationId }
      });
    });

    it('应该提供安装状态查询', async () => {
      const response = await request(app)
        .get(`/api/extensions/install/${installationId}/status`)
        .expect(200);

      expect(response.body.status).toBe('installing');
      expect(response.body.progress).toBeDefined();
      expect(response.body.progress.stage).toBeDefined();
      expect(response.body.progress.percentage).toBeGreaterThanOrEqual(0);
      expect(response.body.progress.percentage).toBeLessThanOrEqual(100);
    });

    it('应该支持取消安装', async () => {
      const response = await request(app)
        .post(`/api/extensions/install/${installationId}/cancel`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Installation cancelled');

      // 验证状态更新
      const installation = await prisma.extensionInstallation.findUnique({
        where: { id: installationId }
      });
      expect(installation?.status).toBe('error');
    });

    it('应该处理安装错误', async () => {
      // 模拟安装错误
      await prisma.extensionInstallation.update({
        where: { id: installationId },
        data: { status: 'error' }
      });

      const response = await request(app)
        .get(`/api/extensions/install/${installationId}/status`)
        .expect(200);

      expect(response.body.status).toBe('error');
      expect(response.body.error).toBeDefined();
    });
  });

  describe('批量安装功能', () => {
    afterEach(async () => {
      await prisma.extensionInstallation.deleteMany({
        where: { userId: testUserId }
      });
    });

    it('应该支持批量安装扩展', async () => {
      // 创建另一个测试扩展
      const secondExtension = await prisma.extension.create({
        data: {
          id: 'second-test-extension',
          name: 'Second Test Extension',
          version: '1.0.0',
          authorId: testAuthorId,
          description: 'Second test extension',
          category: 'ui',
          status: 'approved',
          manifestUrl: 'https://example.com/second/manifest.json',
          permissions: JSON.stringify(['ui:theme']),
          sandboxLevel: 'basic',
          securityReview: true
        }
      });

      const batchInstallData = {
        extensions: [
          { extensionId: testExtensionId, version: '1.0.0' },
          { extensionId: 'second-test-extension', version: '1.0.0' }
        ]
      };

      const response = await request(app)
        .post('/api/extensions/install/batch')
        .send(batchInstallData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.installations).toBeDefined();
      expect(response.body.installations.length).toBe(2);
      expect(response.body.batchId).toBeDefined();

      // 验证数据库记录
      const installations = await prisma.extensionInstallation.findMany({
        where: { userId: testUserId }
      });
      expect(installations.length).toBe(2);

      // 清理
      await prisma.extension.delete({ where: { id: 'second-test-extension' } });
    });

    it('应该处理批量安装中的部分失败', async () => {
      const batchInstallData = {
        extensions: [
          { extensionId: testExtensionId, version: '1.0.0' },
          { extensionId: 'non-existent-extension', version: '1.0.0' }
        ],
        continueOnError: true
      };

      const response = await request(app)
        .post('/api/extensions/install/batch')
        .send(batchInstallData)
        .expect(207); // Multi-Status

      expect(response.body.success).toBe(true);
      expect(response.body.results).toBeDefined();
      expect(response.body.results.length).toBe(2);
      expect(response.body.results[0].success).toBe(true);
      expect(response.body.results[1].success).toBe(false);
      expect(response.body.results[1].error).toBeDefined();
    });
  });

  describe('依赖关系处理', () => {
    let dependencyExtensionId: string;

    beforeAll(async () => {
      // 创建依赖扩展
      const dependencyExtension = await prisma.extension.create({
        data: {
          id: 'dependency-extension',
          name: 'Dependency Extension',
          version: '1.0.0',
          authorId: testAuthorId,
          description: 'A dependency extension',
          category: 'tool',
          status: 'approved',
          manifestUrl: 'https://example.com/dependency/manifest.json',
          permissions: JSON.stringify(['storage:read']),
          sandboxLevel: 'basic',
          securityReview: true
        }
      });
      dependencyExtensionId = dependencyExtension.id;

      // 更新主扩展以包含依赖
      await prisma.extension.update({
        where: { id: testExtensionId },
        data: {
          // 在实际实现中，这应该是一个单独的dependencies字段
          description: `Depends on: ${dependencyExtensionId}`
        }
      });
    });

    afterAll(async () => {
      await prisma.extension.delete({ where: { id: dependencyExtensionId } });
    });

    afterEach(async () => {
      await prisma.extensionInstallation.deleteMany({
        where: { userId: testUserId }
      });
    });

    it('应该自动安装依赖扩展', async () => {
      const installData = {
        extensionId: testExtensionId,
        version: '1.0.0',
        installDependencies: true
      };

      const response = await request(app)
        .post('/api/extensions/install')
        .send(installData)
        .expect(201);

      expect(response.body.dependencies).toBeDefined();
      expect(response.body.dependencies.length).toBeGreaterThanOrEqual(1);
      expect(response.body.dependencies[0].extensionId).toBe(dependencyExtensionId);
      expect(response.body.dependencies[0].status).toBe('installing');
    });

    it('应该提示缺少的依赖', async () => {
      const installData = {
        extensionId: testExtensionId,
        version: '1.0.0',
        installDependencies: false
      };

      await request(app)
        .post('/api/extensions/install')
        .send(installData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toBe('Missing required dependencies');
          expect(res.body.missingDependencies).toBeDefined();
          expect(res.body.missingDependencies.length).toBeGreaterThan(0);
        });
    });
  });

  describe('安全和性能', () => {
    it('应该验证文件完整性', async () => {
      const installData = {
        extensionId: testExtensionId,
        version: '1.0.0',
        verifyIntegrity: true
      };

      const response = await request(app)
        .post('/api/extensions/install')
        .send(installData)
        .expect(201);

      expect(response.body.integrity).toBeDefined();
      expect(response.body.integrity.verified).toBe(true);
      expect(response.body.integrity.checksum).toBeDefined();
    });

    it('应该限制并发安装数量', async () => {
      // 创建多个安装请求
      const requests = Array(10).fill(null).map((_, index) =>
        request(app)
          .post('/api/extensions/install')
          .send({
            extensionId: testExtensionId,
            version: '1.0.0',
            installId: `test-${index}` // 避免重复安装错误
          })
      );

      const responses = await Promise.allSettled(requests);

      // 应该有一些请求被限制
      const tooManyRequests = responses.filter(
        result => result.status === 'fulfilled' && (result.value as any).status === 429
      );

      expect(tooManyRequests.length).toBeGreaterThan(0);
    });

    it('应该在合理时间内开始安装', async () => {
      const startTime = Date.now();

      const installData = {
        extensionId: testExtensionId,
        version: '1.0.0'
      };

      await request(app)
        .post('/api/extensions/install')
        .send(installData)
        .expect(201);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(2000); // 2秒内开始安装
    });
  });

  describe('错误处理和验证', () => {
    it('应该验证必需字段', async () => {
      const incompleteData = {
        version: '1.0.0'
        // 缺少 extensionId
      };

      await request(app)
        .post('/api/extensions/install')
        .send(incompleteData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('extensionId is required');
        });
    });

    it('应该验证版本格式', async () => {
      const invalidData = {
        extensionId: testExtensionId,
        version: 'invalid-version'
      };

      await request(app)
        .post('/api/extensions/install')
        .send(invalidData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Invalid version format');
        });
    });

    it('应该处理网络错误', async () => {
      // 创建一个packageUrl无效的扩展
      const brokenExtension = await prisma.extension.create({
        data: {
          id: 'broken-extension',
          name: 'Broken Extension',
          version: '1.0.0',
          authorId: testAuthorId,
          description: 'Extension with broken download',
          category: 'tool',
          status: 'approved',
          manifestUrl: 'https://invalid-domain.com/manifest.json',
          packageUrl: 'https://invalid-domain.com/package.zip',
          permissions: JSON.stringify(['storage:read']),
          sandboxLevel: 'basic'
        }
      });

      const installData = {
        extensionId: 'broken-extension',
        version: '1.0.0'
      };

      await request(app)
        .post('/api/extensions/install')
        .send(installData)
        .expect(500)
        .expect(res => {
          expect(res.body.error).toContain('Download failed');
        });

      // 清理
      await prisma.extension.delete({ where: { id: 'broken-extension' } });
    });
  });
});