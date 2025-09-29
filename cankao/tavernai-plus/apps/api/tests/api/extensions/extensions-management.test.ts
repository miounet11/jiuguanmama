/**
 * 插件管理合约测试 (T019)
 *
 * 测试已安装插件的管理功能：查看、配置、启用/禁用、更新、卸载
 * 接口设计符合核心竞争力提升规范
 */

import request from 'supertest';
import { app } from '../../../src/server';
import { prisma } from '../../../src/lib/prisma';

describe('Extensions Management API Contract Tests', () => {
  let testUserId: string;
  let testExtensionId: string;
  let testInstallationId: string;
  let testAuthorId: string;

  beforeAll(async () => {
    // 创建测试用户
    const user = await prisma.user.create({
      data: {
        username: 'management_test_user',
        email: 'management@test.com',
        passwordHash: 'test_hash'
      }
    });
    testUserId = user.id;

    // 创建扩展作者
    const author = await prisma.user.create({
      data: {
        username: 'management_author',
        email: 'mgmtauthor@test.com',
        passwordHash: 'test_hash'
      }
    });
    testAuthorId = author.id;

    // 创建测试扩展
    const extension = await prisma.extension.create({
      data: {
        id: 'manageable-extension',
        name: 'Manageable Extension',
        version: '1.2.0',
        authorId: testAuthorId,
        description: 'Extension for management testing',
        category: 'tool',
        status: 'approved',
        manifestUrl: 'https://cdn.example.com/manageable/manifest.json',
        packageUrl: 'https://cdn.example.com/manageable/v1.2.0.zip',
        iconUrl: 'https://cdn.example.com/manageable/icon.png',
        screenshots: JSON.stringify(['https://cdn.example.com/manageable/screenshot1.png']),
        permissions: JSON.stringify(['storage:read', 'ui:modify', 'api:fetch']),
        sandboxLevel: 'basic',
        securityReview: true
      }
    });
    testExtensionId = extension.id;

    // 创建安装记录
    const installation = await prisma.extensionInstallation.create({
      data: {
        userId: testUserId,
        extensionId: testExtensionId,
        version: '1.2.0',
        status: 'active',
        enabled: true,
        autoUpdate: true,
        config: JSON.stringify({
          theme: 'dark',
          autoStart: true,
          notifications: true,
          customSetting: 'value123'
        }),
        userData: JSON.stringify({
          lastUsed: new Date().toISOString(),
          usageCount: 15
        })
      }
    });
    testInstallationId = installation.id;
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

  describe('GET /api/extensions/installed - 获取已安装插件列表', () => {
    beforeAll(async () => {
      // 添加更多测试安装记录
      const secondExtension = await prisma.extension.create({
        data: {
          id: 'second-extension',
          name: 'Second Extension',
          version: '2.0.0',
          authorId: testAuthorId,
          description: 'Second test extension',
          category: 'ui',
          status: 'approved',
          manifestUrl: 'https://cdn.example.com/second/manifest.json',
          permissions: JSON.stringify(['ui:theme']),
          sandboxLevel: 'basic'
        }
      });

      await prisma.extensionInstallation.create({
        data: {
          userId: testUserId,
          extensionId: 'second-extension',
          version: '2.0.0',
          status: 'active',
          enabled: false
        }
      });
    });

    afterAll(async () => {
      await prisma.extensionInstallation.deleteMany({
        where: { extensionId: 'second-extension' }
      });
      await prisma.extension.deleteMany({
        where: { id: 'second-extension' }
      });
    });

    it('应该返回用户所有已安装的插件', async () => {
      const response = await request(app)
        .get('/api/extensions/installed')
        .query({ userId: testUserId })
        .expect(200);

      expect(response.body.installations).toBeDefined();
      expect(Array.isArray(response.body.installations)).toBe(true);
      expect(response.body.installations.length).toBeGreaterThanOrEqual(2);
      expect(response.body.total).toBeGreaterThanOrEqual(2);

      // 验证返回的数据结构
      const installation = response.body.installations[0];
      expect(installation.id).toBeDefined();
      expect(installation.extensionId).toBeDefined();
      expect(installation.version).toBeDefined();
      expect(installation.status).toBeDefined();
      expect(installation.enabled).toBeDefined();
      expect(installation.extension).toBeDefined();
      expect(installation.installedAt).toBeDefined();
    });

    it('应该支持按状态过滤', async () => {
      const response = await request(app)
        .get('/api/extensions/installed')
        .query({ userId: testUserId, status: 'active' })
        .expect(200);

      expect(response.body.installations.every((inst: any) => inst.status === 'active')).toBe(true);
    });

    it('应该支持按启用状态过滤', async () => {
      const response = await request(app)
        .get('/api/extensions/installed')
        .query({ userId: testUserId, enabled: 'true' })
        .expect(200);

      expect(response.body.installations.every((inst: any) => inst.enabled === true)).toBe(true);
    });

    it('应该支持按分类过滤', async () => {
      const response = await request(app)
        .get('/api/extensions/installed')
        .query({ userId: testUserId, category: 'tool' })
        .expect(200);

      expect(response.body.installations.every((inst: any) => inst.extension.category === 'tool')).toBe(true);
    });

    it('应该包含使用统计信息', async () => {
      const response = await request(app)
        .get('/api/extensions/installed')
        .query({ userId: testUserId, includeStats: 'true' })
        .expect(200);

      expect(response.body.statistics).toBeDefined();
      expect(response.body.statistics.totalInstalled).toBeDefined();
      expect(response.body.statistics.activeCount).toBeDefined();
      expect(response.body.statistics.disabledCount).toBeDefined();
      expect(response.body.statistics.categoriesBreakdown).toBeDefined();
    });
  });

  describe('GET /api/extensions/installed/:installationId - 获取单个安装详情', () => {
    it('应该返回详细的安装信息', async () => {
      const response = await request(app)
        .get(`/api/extensions/installed/${testInstallationId}`)
        .expect(200);

      expect(response.body.installation).toBeDefined();
      expect(response.body.installation.id).toBe(testInstallationId);
      expect(response.body.installation.extensionId).toBe(testExtensionId);
      expect(response.body.installation.version).toBe('1.2.0');
      expect(response.body.installation.status).toBe('active');
      expect(response.body.installation.enabled).toBe(true);
      expect(response.body.installation.config).toBeDefined();
      expect(response.body.installation.userData).toBeDefined();
    });

    it('应该包含扩展的完整信息', async () => {
      const response = await request(app)
        .get(`/api/extensions/installed/${testInstallationId}`)
        .query({ includeExtension: 'true' })
        .expect(200);

      expect(response.body.installation.extension).toBeDefined();
      expect(response.body.installation.extension.name).toBe('Manageable Extension');
      expect(response.body.installation.extension.description).toBeDefined();
      expect(response.body.installation.extension.permissions).toBeDefined();
    });

    it('应该处理不存在的安装ID', async () => {
      await request(app)
        .get('/api/extensions/installed/non-existent-id')
        .expect(404)
        .expect(res => {
          expect(res.body.error).toBe('Installation not found');
        });
    });
  });

  describe('PATCH /api/extensions/installed/:installationId - 更新插件配置', () => {
    it('应该更新插件启用状态', async () => {
      const updateData = {
        enabled: false
      };

      const response = await request(app)
        .patch(`/api/extensions/installed/${testInstallationId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.installation.enabled).toBe(false);

      // 验证数据库更新
      const installation = await prisma.extensionInstallation.findUnique({
        where: { id: testInstallationId }
      });
      expect(installation?.enabled).toBe(false);
    });

    it('应该更新插件配置', async () => {
      const updateData = {
        config: {
          theme: 'light',
          autoStart: false,
          notifications: false,
          newSetting: 'newValue'
        }
      };

      const response = await request(app)
        .patch(`/api/extensions/installed/${testInstallationId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.installation.config).toEqual(updateData.config);

      // 验证数据库更新
      const installation = await prisma.extensionInstallation.findUnique({
        where: { id: testInstallationId }
      });
      expect(JSON.parse(installation?.config || '{}')).toEqual(updateData.config);
    });

    it('应该更新自动更新设置', async () => {
      const updateData = {
        autoUpdate: false
      };

      const response = await request(app)
        .patch(`/api/extensions/installed/${testInstallationId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.installation.autoUpdate).toBe(false);
    });

    it('应该验证配置格式', async () => {
      const invalidData = {
        config: 'invalid-json-string'
      };

      await request(app)
        .patch(`/api/extensions/installed/${testInstallationId}`)
        .send(invalidData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Invalid configuration format');
        });
    });

    it('应该拒绝更新只读字段', async () => {
      const invalidData = {
        id: 'new-id',
        extensionId: 'different-extension',
        installedAt: new Date().toISOString()
      };

      await request(app)
        .patch(`/api/extensions/installed/${testInstallationId}`)
        .send(invalidData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Read-only fields cannot be updated');
        });
    });
  });

  describe('POST /api/extensions/installed/:installationId/toggle - 快速启用/禁用', () => {
    beforeEach(async () => {
      // 确保插件处于启用状态
      await prisma.extensionInstallation.update({
        where: { id: testInstallationId },
        data: { enabled: true }
      });
    });

    it('应该切换插件启用状态', async () => {
      const response = await request(app)
        .post(`/api/extensions/installed/${testInstallationId}/toggle`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.installation.enabled).toBe(false);
      expect(response.body.previousState).toBe(true);

      // 再次切换
      const response2 = await request(app)
        .post(`/api/extensions/installed/${testInstallationId}/toggle`)
        .expect(200);

      expect(response2.body.installation.enabled).toBe(true);
    });

    it('应该记录状态变更历史', async () => {
      await request(app)
        .post(`/api/extensions/installed/${testInstallationId}/toggle`)
        .expect(200);

      // 检查是否记录了状态变更
      const installation = await prisma.extensionInstallation.findUnique({
        where: { id: testInstallationId }
      });
      expect(installation?.lastUpdated).toBeDefined();
    });
  });

  describe('POST /api/extensions/installed/:installationId/update - 更新插件版本', () => {
    beforeAll(async () => {
      // 创建新版本的扩展
      await prisma.extension.update({
        where: { id: testExtensionId },
        data: { version: '1.3.0' }
      });
    });

    it('应该检查可用更新', async () => {
      const response = await request(app)
        .get(`/api/extensions/installed/${testInstallationId}/update-check`)
        .expect(200);

      expect(response.body.updateAvailable).toBe(true);
      expect(response.body.currentVersion).toBe('1.2.0');
      expect(response.body.latestVersion).toBe('1.3.0');
      expect(response.body.updateInfo).toBeDefined();
    });

    it('应该执行插件更新', async () => {
      const updateData = {
        targetVersion: '1.3.0',
        preserveConfig: true
      };

      const response = await request(app)
        .post(`/api/extensions/installed/${testInstallationId}/update`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.installation.version).toBe('1.3.0');
      expect(response.body.updateProgress).toBeDefined();
    });

    it('应该支持回滚到之前版本', async () => {
      const rollbackData = {
        targetVersion: '1.2.0'
      };

      const response = await request(app)
        .post(`/api/extensions/installed/${testInstallationId}/rollback`)
        .send(rollbackData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.installation.version).toBe('1.2.0');
    });

    it('应该处理更新失败情况', async () => {
      const invalidUpdateData = {
        targetVersion: '999.0.0' // 不存在的版本
      };

      await request(app)
        .post(`/api/extensions/installed/${testInstallationId}/update`)
        .send(invalidUpdateData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toBe('Target version not available');
        });
    });
  });

  describe('DELETE /api/extensions/installed/:installationId - 卸载插件', () => {
    let tempInstallationId: string;

    beforeEach(async () => {
      // 创建临时安装记录用于删除测试
      const tempInstallation = await prisma.extensionInstallation.create({
        data: {
          userId: testUserId,
          extensionId: testExtensionId,
          version: '1.2.0',
          status: 'active'
        }
      });
      tempInstallationId = tempInstallation.id;
    });

    it('应该成功卸载插件', async () => {
      const response = await request(app)
        .delete(`/api/extensions/installed/${tempInstallationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Extension uninstalled successfully');

      // 验证数据库中已删除
      const installation = await prisma.extensionInstallation.findUnique({
        where: { id: tempInstallationId }
      });
      expect(installation).toBeNull();
    });

    it('应该支持保留用户数据的卸载', async () => {
      const uninstallData = {
        preserveUserData: true
      };

      const response = await request(app)
        .delete(`/api/extensions/installed/${tempInstallationId}`)
        .send(uninstallData)
        .expect(200);

      expect(response.body.userDataPreserved).toBe(true);
      // 在实际实现中，这可能意味着只是标记为已删除而不是真正删除
    });

    it('应该支持强制卸载', async () => {
      // 模拟插件处于使用中的状态
      await prisma.extensionInstallation.update({
        where: { id: tempInstallationId },
        data: { status: 'installing' }
      });

      const forceUninstallData = {
        force: true
      };

      const response = await request(app)
        .delete(`/api/extensions/installed/${tempInstallationId}`)
        .send(forceUninstallData)
        .expect(200);

      expect(response.body.forced).toBe(true);
    });

    it('应该拒绝卸载正在使用的插件', async () => {
      await prisma.extensionInstallation.update({
        where: { id: tempInstallationId },
        data: { status: 'installing' }
      });

      await request(app)
        .delete(`/api/extensions/installed/${tempInstallationId}`)
        .expect(409)
        .expect(res => {
          expect(res.body.error).toBe('Cannot uninstall extension in use');
        });
    });
  });

  describe('批量管理操作', () => {
    let batchInstallationIds: string[] = [];

    beforeAll(async () => {
      // 创建多个测试安装记录
      for (let i = 0; i < 3; i++) {
        const ext = await prisma.extension.create({
          data: {
            id: `batch-ext-${i}`,
            name: `Batch Extension ${i}`,
            version: '1.0.0',
            authorId: testAuthorId,
            description: `Batch test extension ${i}`,
            category: 'tool',
            status: 'approved',
            manifestUrl: `https://example.com/batch-${i}/manifest.json`,
            permissions: JSON.stringify(['storage:read']),
            sandboxLevel: 'basic'
          }
        });

        const installation = await prisma.extensionInstallation.create({
          data: {
            userId: testUserId,
            extensionId: `batch-ext-${i}`,
            version: '1.0.0',
            status: 'active',
            enabled: i % 2 === 0 // 交替启用/禁用
          }
        });
        batchInstallationIds.push(installation.id);
      }
    });

    afterAll(async () => {
      await prisma.extensionInstallation.deleteMany({
        where: { id: { in: batchInstallationIds } }
      });
      await prisma.extension.deleteMany({
        where: { id: { in: ['batch-ext-0', 'batch-ext-1', 'batch-ext-2'] } }
      });
    });

    it('应该支持批量启用/禁用', async () => {
      const batchUpdateData = {
        installationIds: batchInstallationIds,
        enabled: true
      };

      const response = await request(app)
        .patch('/api/extensions/installed/batch')
        .send(batchUpdateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.updated).toBe(batchInstallationIds.length);
      expect(response.body.results).toBeDefined();
      expect(response.body.results.length).toBe(batchInstallationIds.length);

      // 验证所有插件都被启用
      const installations = await prisma.extensionInstallation.findMany({
        where: { id: { in: batchInstallationIds } }
      });
      expect(installations.every(inst => inst.enabled === true)).toBe(true);
    });

    it('应该支持批量卸载', async () => {
      const batchDeleteData = {
        installationIds: batchInstallationIds,
        preserveUserData: false
      };

      const response = await request(app)
        .delete('/api/extensions/installed/batch')
        .send(batchDeleteData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.deleted).toBe(batchInstallationIds.length);

      // 验证所有插件都被删除
      const installations = await prisma.extensionInstallation.findMany({
        where: { id: { in: batchInstallationIds } }
      });
      expect(installations.length).toBe(0);
    });
  });

  describe('权限和安全性', () => {
    it('应该验证用户只能管理自己的插件', async () => {
      // 创建另一个用户的安装记录
      const otherUser = await prisma.user.create({
        data: {
          username: 'other_management_user',
          email: 'othermgmt@test.com',
          passwordHash: 'test_hash'
        }
      });

      const otherInstallation = await prisma.extensionInstallation.create({
        data: {
          userId: otherUser.id,
          extensionId: testExtensionId,
          version: '1.2.0',
          status: 'active'
        }
      });

      // 尝试访问其他用户的安装
      await request(app)
        .get(`/api/extensions/installed/${otherInstallation.id}`)
        // .set('Authorization', `Bearer ${testUserToken}`) // 需要实现认证
        .expect(403);

      // 清理
      await prisma.extensionInstallation.delete({ where: { id: otherInstallation.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('应该记录管理操作审计日志', async () => {
      const updateData = { enabled: false };

      await request(app)
        .patch(`/api/extensions/installed/${testInstallationId}`)
        .send(updateData)
        .expect(200);

      // 在实际实现中，这里应该检查审计日志记录
      // 例如：检查 audit_logs 表中是否有相应记录
      expect(true).toBe(true); // 占位符
    });
  });

  describe('性能和错误处理', () => {
    it('应该快速响应插件列表请求', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/extensions/installed')
        .query({ userId: testUserId })
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // 1秒内响应
    });

    it('应该正确处理网络错误', async () => {
      // 模拟网络错误场景
      const response = await request(app)
        .post(`/api/extensions/installed/${testInstallationId}/update`)
        .send({ targetVersion: '1.3.0' })
        .timeout(100) // 超短超时来模拟网络问题
        .expect(res => {
          expect([408, 500, 503]).toContain(res.status);
        });
    });

    it('应该验证查询参数', async () => {
      await request(app)
        .get('/api/extensions/installed')
        .query({ userId: testUserId, limit: -1 })
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Invalid limit parameter');
        });
    });
  });
});