import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { app } from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { initRedis, closeRedis } from '../../apps/api/src/lib/redis';

describe('插件完整生命周期集成测试', () => {
  let server: any;
  let testUser: any;
  let adminUser: any;
  let authToken: string;
  let adminToken: string;
  let testExtension: any;
  let testPluginPath: string;
  let testPluginZipPath: string;

  beforeAll(async () => {
    // 初始化测试环境
    await initRedis();
    server = app;

    // 创建测试用户
    testUser = await prisma.user.create({
      data: {
        username: 'plugin_test_user',
        email: 'plugintest@example.com',
        passwordHash: 'test_hash',
        is_active: true,
        is_verified: true,
        role: 'user',
      },
    });

    // 创建管理员用户
    adminUser = await prisma.user.create({
      data: {
        username: 'plugin_admin',
        email: 'pluginadmin@example.com',
        passwordHash: 'admin_hash',
        is_active: true,
        is_verified: true,
        role: 'admin',
      },
    });

    // 模拟获取认证令牌
    authToken = 'mock_user_token';
    adminToken = 'mock_admin_token';

    // 创建测试插件
    await createTestPlugin();
  });

  afterAll(async () => {
    // 清理测试数据
    if (testUser) {
      await prisma.extensionInstallation.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }

    if (adminUser) {
      await prisma.user.delete({ where: { id: adminUser.id } });
    }

    if (testExtension) {
      await prisma.extensionReview.deleteMany({ where: { extensionId: testExtension.id } });
      await prisma.extension.delete({ where: { id: testExtension.id } });
    }

    // 清理测试文件
    try {
      await fs.unlink(testPluginZipPath);
      await fs.rm(testPluginPath, { recursive: true, force: true });
    } catch (error) {
      // 忽略清理错误
    }

    await closeRedis();
  });

  async function createTestPlugin() {
    // 创建测试插件目录
    testPluginPath = path.join(process.cwd(), 'test-data', 'test-plugin');
    await fs.mkdir(testPluginPath, { recursive: true });

    // 创建插件清单文件
    const manifest = {
      name: 'Test Plugin',
      version: '1.0.0',
      description: '用于集成测试的示例插件',
      author: 'Test Author',
      license: 'MIT',
      main: 'index.js',
      permissions: ['ui_modification', 'notification_system'],
      dependencies: {},
      engines: {
        tavernai: '>=1.0.0',
      },
      keywords: ['test', 'example'],
      repository: 'https://github.com/test/test-plugin',
    };

    await fs.writeFile(
      path.join(testPluginPath, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    // 创建插件主文件
    const pluginCode = `
// Test Plugin Main File
class TestPlugin {
  constructor() {
    this.name = 'Test Plugin';
    this.version = '1.0.0';
  }

  async activate() {
    console.log('Test plugin activated');
    // 注册UI修改
    this.addTestButton();
    // 发送测试通知
    this.sendTestNotification();
    return true;
  }

  async deactivate() {
    console.log('Test plugin deactivated');
    this.removeTestButton();
    return true;
  }

  addTestButton() {
    // 模拟添加UI元素
    console.log('Adding test button to UI');
  }

  removeTestButton() {
    // 模拟移除UI元素
    console.log('Removing test button from UI');
  }

  sendTestNotification() {
    // 模拟发送通知
    if (typeof notify !== 'undefined') {
      notify('测试插件已激活', 'info');
    }
  }

  // 导出配置选项
  getConfigSchema() {
    return {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
          title: '启用插件',
          default: true,
        },
        message: {
          type: 'string',
          title: '自定义消息',
          default: 'Hello from Test Plugin!',
        },
        interval: {
          type: 'number',
          title: '通知间隔(秒)',
          minimum: 5,
          maximum: 3600,
          default: 30,
        },
      },
    };
  }
}

// 导出插件类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TestPlugin;
} else {
  window.TestPlugin = TestPlugin;
}
`;

    await fs.writeFile(path.join(testPluginPath, 'index.js'), pluginCode);

    // 创建README文件
    const readme = `# Test Plugin

这是一个用于集成测试的示例插件。

## 功能

- UI修改示例
- 通知系统示例
- 配置管理示例

## 安装

通过TavernAI Plus的插件市场安装。

## 配置

插件提供以下配置选项：

- \`enabled\`: 是否启用插件
- \`message\`: 自定义消息
- \`interval\`: 通知间隔

## 许可证

MIT License
`;

    await fs.writeFile(path.join(testPluginPath, 'README.md'), readme);

    // 创建插件压缩包
    testPluginZipPath = path.join(process.cwd(), 'test-data', 'test-plugin.zip');
    await createZipFile(testPluginPath, testPluginZipPath);

    console.log('测试插件创建完成:', { testPluginPath, testPluginZipPath });
  }

  async function createZipFile(sourceDir: string, targetPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = require('fs').createWriteStream(targetPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  test('完整插件生命周期: 浏览 → 安装 → 配置 → 使用 → 卸载', async () => {
    // Step 1: 创建插件到市场
    const createResponse = await request(server)
      .post('/api/extensions')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('plugin', testPluginZipPath)
      .field('category', 'utility')
      .field('tags', JSON.stringify(['test', 'example']))
      .expect(201);

    testExtension = createResponse.body;
    expect(testExtension.id).toBeTruthy();
    expect(testExtension.name).toBe('Test Plugin');
    expect(testExtension.version).toBe('1.0.0');

    // Step 2: 浏览插件市场
    const browseResponse = await request(server)
      .get('/api/extensions')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ category: 'utility', search: 'test' })
      .expect(200);

    expect(browseResponse.body.extensions).toHaveLength(1);
    expect(browseResponse.body.extensions[0].id).toBe(testExtension.id);

    // Step 3: 查看插件详情
    const detailResponse = await request(server)
      .get(`/api/extensions/${testExtension.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(detailResponse.body.name).toBe('Test Plugin');
    expect(detailResponse.body.permissions).toEqual(['ui_modification', 'notification_system']);

    // Step 4: 安装插件
    const installResponse = await request(server)
      .post(`/api/extensions/${testExtension.id}/install`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        grantedPermissions: ['ui_modification', 'notification_system'],
        autoUpdate: true,
      })
      .expect(200);

    const installation = installResponse.body;
    expect(installation.extensionId).toBe(testExtension.id);
    expect(installation.status).toBe('active');
    expect(installation.permissions).toEqual(['ui_modification', 'notification_system']);

    // Step 5: 验证安装状态
    const statusResponse = await request(server)
      .get('/api/extensions/installed')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const installedExtensions = statusResponse.body.extensions;
    expect(installedExtensions).toHaveLength(1);
    expect(installedExtensions[0].extension.id).toBe(testExtension.id);

    // Step 6: 配置插件
    const configData = {
      enabled: true,
      message: '这是自定义的测试消息',
      interval: 60,
    };

    const configResponse = await request(server)
      .put(`/api/extensions/${testExtension.id}/config`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(configData)
      .expect(200);

    expect(configResponse.body.config).toEqual(configData);

    // Step 7: 获取配置
    const getConfigResponse = await request(server)
      .get(`/api/extensions/${testExtension.id}/config`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(getConfigResponse.body.config).toEqual(configData);

    // Step 8: 使用插件 (模拟API调用)
    const useResponse = await request(server)
      .post(`/api/extensions/${testExtension.id}/execute`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Extension-ID', testExtension.id)
      .send({
        method: 'sendTestNotification',
        params: { message: '测试插件执行' },
      })
      .expect(200);

    expect(useResponse.body.success).toBe(true);

    // Step 9: 查看插件日志
    const logsResponse = await request(server)
      .get(`/api/extensions/${testExtension.id}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(logsResponse.body.logs).toBeTruthy();
    expect(logsResponse.body.logs.length).toBeGreaterThan(0);

    // Step 10: 暂时禁用插件
    const disableResponse = await request(server)
      .post(`/api/extensions/${testExtension.id}/disable`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(disableResponse.body.status).toBe('disabled');

    // Step 11: 重新启用插件
    const enableResponse = await request(server)
      .post(`/api/extensions/${testExtension.id}/enable`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(enableResponse.body.status).toBe('active');

    // Step 12: 卸载插件
    const uninstallResponse = await request(server)
      .delete(`/api/extensions/${testExtension.id}/install`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(uninstallResponse.body.success).toBe(true);

    // Step 13: 验证卸载状态
    const finalStatusResponse = await request(server)
      .get('/api/extensions/installed')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(finalStatusResponse.body.extensions).toHaveLength(0);
  });

  test('插件权限验证和安全测试', async () => {
    // 创建一个需要高级权限的插件
    const highPrivilegeManifest = {
      name: 'High Privilege Plugin',
      version: '1.0.0',
      description: '需要高级权限的插件',
      permissions: ['admin_functions', 'database_access', 'file_system'],
      main: 'index.js',
    };

    const testHighPrivPath = path.join(process.cwd(), 'test-data', 'high-priv-plugin');
    await fs.mkdir(testHighPrivPath, { recursive: true });
    await fs.writeFile(
      path.join(testHighPrivPath, 'manifest.json'),
      JSON.stringify(highPrivilegeManifest, null, 2)
    );
    await fs.writeFile(path.join(testHighPrivPath, 'index.js'), 'console.log("High privilege plugin");');

    const highPrivZipPath = path.join(process.cwd(), 'test-data', 'high-priv-plugin.zip');
    await createZipFile(testHighPrivPath, highPrivZipPath);

    try {
      // 创建高权限插件（需要管理员权限）
      const createResponse = await request(server)
        .post('/api/extensions')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('plugin', highPrivZipPath)
        .field('category', 'system')
        .expect(201);

      const highPrivExtension = createResponse.body;

      // 普通用户尝试安装高权限插件应该失败
      await request(server)
        .post(`/api/extensions/${highPrivExtension.id}/install`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          grantedPermissions: ['admin_functions', 'database_access'],
        })
        .expect(403);

      // 管理员可以安装
      const adminInstallResponse = await request(server)
        .post(`/api/extensions/${highPrivExtension.id}/install`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          grantedPermissions: ['admin_functions'],
        })
        .expect(200);

      expect(adminInstallResponse.body.status).toBe('active');

      // 测试权限限制 - 尝试访问未授权的权限
      await request(server)
        .post(`/api/extensions/${highPrivExtension.id}/execute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Extension-ID', highPrivExtension.id)
        .send({
          method: 'accessDatabase',
          params: {},
        })
        .expect(403); // 应该被拒绝，因为只授予了 admin_functions 权限

      // 清理
      await prisma.extensionInstallation.deleteMany({ where: { extensionId: highPrivExtension.id } });
      await prisma.extension.delete({ where: { id: highPrivExtension.id } });
    } finally {
      // 清理测试文件
      try {
        await fs.unlink(highPrivZipPath);
        await fs.rm(testHighPrivPath, { recursive: true, force: true });
      } catch (error) {
        // 忽略清理错误
      }
    }
  });

  test('插件更新流程测试', async () => {
    // 创建初始版本插件
    const v1Manifest = {
      name: 'Updateable Plugin',
      version: '1.0.0',
      description: '可更新的测试插件',
      permissions: ['ui_modification'],
      main: 'index.js',
    };

    const updateTestPath = path.join(process.cwd(), 'test-data', 'update-plugin-v1');
    await fs.mkdir(updateTestPath, { recursive: true });
    await fs.writeFile(
      path.join(updateTestPath, 'manifest.json'),
      JSON.stringify(v1Manifest, null, 2)
    );
    await fs.writeFile(path.join(updateTestPath, 'index.js'), 'console.log("Plugin v1.0.0");');

    const v1ZipPath = path.join(process.cwd(), 'test-data', 'update-plugin-v1.zip');
    await createZipFile(updateTestPath, v1ZipPath);

    try {
      // 创建并安装 v1.0.0
      const createV1Response = await request(server)
        .post('/api/extensions')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('plugin', v1ZipPath)
        .expect(201);

      const extensionV1 = createV1Response.body;

      await request(server)
        .post(`/api/extensions/${extensionV1.id}/install`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ grantedPermissions: ['ui_modification'] })
        .expect(200);

      // 创建 v2.0.0 更新版本
      const v2Manifest = {
        ...v1Manifest,
        version: '2.0.0',
        description: '更新版本的测试插件',
        permissions: ['ui_modification', 'notification_system'], // 新增权限
      };

      const v2Path = path.join(process.cwd(), 'test-data', 'update-plugin-v2');
      await fs.mkdir(v2Path, { recursive: true });
      await fs.writeFile(
        path.join(v2Path, 'manifest.json'),
        JSON.stringify(v2Manifest, null, 2)
      );
      await fs.writeFile(path.join(v2Path, 'index.js'), 'console.log("Plugin v2.0.0 with new features");');

      const v2ZipPath = path.join(process.cwd(), 'test-data', 'update-plugin-v2.zip');
      await createZipFile(v2Path, v2ZipPath);

      // 上传更新版本
      const updateResponse = await request(server)
        .put(`/api/extensions/${extensionV1.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('plugin', v2ZipPath)
        .expect(200);

      expect(updateResponse.body.version).toBe('2.0.0');

      // 检查更新通知
      const updatesResponse = await request(server)
        .get('/api/extensions/updates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(updatesResponse.body.updates).toHaveLength(1);
      expect(updatesResponse.body.updates[0].currentVersion).toBe('1.0.0');
      expect(updatesResponse.body.updates[0].latestVersion).toBe('2.0.0');

      // 执行更新
      const performUpdateResponse = await request(server)
        .post(`/api/extensions/${extensionV1.id}/update`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          grantedPermissions: ['ui_modification', 'notification_system'], // 授予新权限
        })
        .expect(200);

      expect(performUpdateResponse.body.version).toBe('2.0.0');

      // 验证更新后状态
      const statusResponse = await request(server)
        .get('/api/extensions/installed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const installation = statusResponse.body.extensions[0];
      expect(installation.extension.version).toBe('2.0.0');
      expect(installation.permissions).toEqual(['ui_modification', 'notification_system']);

      // 清理
      await fs.unlink(v2ZipPath);
      await fs.rm(v2Path, { recursive: true, force: true });
      await prisma.extensionInstallation.deleteMany({ where: { extensionId: extensionV1.id } });
      await prisma.extension.delete({ where: { id: extensionV1.id } });
    } finally {
      // 清理测试文件
      try {
        await fs.unlink(v1ZipPath);
        await fs.rm(updateTestPath, { recursive: true, force: true });
      } catch (error) {
        // 忽略清理错误
      }
    }
  });

  test('插件评价和反馈系统', async () => {
    // 创建测试插件
    const reviewTestResponse = await request(server)
      .post('/api/extensions')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('plugin', testPluginZipPath)
      .field('category', 'utility')
      .expect(201);

    const reviewTestExtension = reviewTestResponse.body;

    try {
      // 安装插件
      await request(server)
        .post(`/api/extensions/${reviewTestExtension.id}/install`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ grantedPermissions: ['ui_modification', 'notification_system'] })
        .expect(200);

      // 提交评价
      const reviewResponse = await request(server)
        .post(`/api/extensions/${reviewTestExtension.id}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5,
          title: '优秀的测试插件',
          content: '功能完整，使用简单，非常推荐！',
          tags: ['实用', '稳定', '易用'],
        })
        .expect(201);

      expect(reviewResponse.body.rating).toBe(5);
      expect(reviewResponse.body.title).toBe('优秀的测试插件');

      // 获取评价列表
      const reviewsResponse = await request(server)
        .get(`/api/extensions/${reviewTestExtension.id}/reviews`)
        .expect(200);

      expect(reviewsResponse.body.reviews).toHaveLength(1);
      expect(reviewsResponse.body.averageRating).toBe(5);
      expect(reviewsResponse.body.totalReviews).toBe(1);

      // 更新评价
      const updateReviewResponse = await request(server)
        .put(`/api/extensions/${reviewTestExtension.id}/reviews/${reviewResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 4,
          title: '不错的测试插件',
          content: '功能还可以，但还有改进空间。',
        })
        .expect(200);

      expect(updateReviewResponse.body.rating).toBe(4);

      // 举报评价（模拟）
      await request(server)
        .post(`/api/extensions/${reviewTestExtension.id}/reviews/${reviewResponse.body.id}/report`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'spam',
          description: '测试举报功能',
        })
        .expect(200);

      // 管理员删除评价
      await request(server)
        .delete(`/api/extensions/${reviewTestExtension.id}/reviews/${reviewResponse.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 验证评价已删除
      const finalReviewsResponse = await request(server)
        .get(`/api/extensions/${reviewTestExtension.id}/reviews`)
        .expect(200);

      expect(finalReviewsResponse.body.reviews).toHaveLength(0);
    } finally {
      // 清理
      await prisma.extensionInstallation.deleteMany({ where: { extensionId: reviewTestExtension.id } });
      await prisma.extensionReview.deleteMany({ where: { extensionId: reviewTestExtension.id } });
      await prisma.extension.delete({ where: { id: reviewTestExtension.id } });
    }
  });
});