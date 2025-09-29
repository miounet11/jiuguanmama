/**
 * 高级配置CRUD合约测试 (T021)
 *
 * 测试高级配置系统的创建、读取、更新、删除操作
 * 接口设计符合核心竞争力提升规范
 */

import request from 'supertest';
import { app } from '../../../src/server';
import { prisma } from '../../../src/lib/prisma';

describe('Advanced Configuration CRUD API Contract Tests', () => {
  let testUserId: string;
  let testConfigId: string;

  beforeAll(async () => {
    // 创建测试用户
    const user = await prisma.user.create({
      data: {
        username: 'config_test_user',
        email: 'config@test.com',
        passwordHash: 'test_hash'
      }
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.advancedConfig.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.user.deleteMany({
      where: { id: testUserId }
    });
  });

  describe('POST /api/config/advanced - 创建高级配置', () => {
    afterEach(async () => {
      // 清理配置数据
      await prisma.advancedConfig.deleteMany({
        where: { userId: testUserId }
      });
    });

    it('应该成功创建AI模型配置', async () => {
      const configData = {
        configName: 'OpenAI GPT-4 Turbo',
        configType: 'model',
        configData: {
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          temperature: 0.7,
          maxTokens: 4096,
          topP: 0.9,
          frequencyPenalty: 0.1,
          presencePenalty: 0.1,
          systemPrompt: 'You are a helpful AI assistant.',
          responseFormat: 'text',
          streaming: true
        },
        isDefault: false,
        isPublic: false,
        sillyTavernCompatible: true
      };

      const response = await request(app)
        .post('/api/config/advanced')
        .send(configData)
        // .set('Authorization', `Bearer ${userToken}`) // 需要实现认证
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.config).toBeDefined();
      expect(response.body.config.configName).toBe(configData.configName);
      expect(response.body.config.configType).toBe('model');
      expect(response.body.config.configData).toEqual(configData.configData);
      expect(response.body.config.sillyTavernCompatible).toBe(true);

      // 验证数据库记录
      const config = await prisma.advancedConfig.findUnique({
        where: { id: response.body.config.id }
      });
      expect(config).toBeDefined();
      expect(JSON.parse(config?.configData || '{}')).toEqual(configData.configData);

      testConfigId = response.body.config.id;
    });

    it('应该成功创建提示词配置', async () => {
      const promptConfig = {
        configName: 'Creative Writing Assistant',
        configType: 'prompt',
        configData: {
          systemPrompt: 'You are a creative writing assistant who helps with storytelling.',
          userPromptTemplate: 'Help me write a story about: {{topic}}',
          assistantPromptTemplate: 'I\'ll help you create an engaging story about {{topic}}.',
          stopSequences: ['---', '***'],
          contextLength: 2048,
          variables: ['topic', 'genre', 'mood']
        },
        isDefault: false,
        isPublic: true
      };

      const response = await request(app)
        .post('/api/config/advanced')
        .send(promptConfig)
        .expect(201);

      expect(response.body.config.configType).toBe('prompt');
      expect(response.body.config.configData.systemPrompt).toBeDefined();
      expect(response.body.config.isPublic).toBe(true);
    });

    it('应该成功创建会话配置', async () => {
      const sessionConfig = {
        configName: 'Extended Conversation',
        configType: 'session',
        configData: {
          maxMessages: 100,
          contextWindow: 8192,
          memoryStrategy: 'sliding_window',
          summarizationThreshold: 50,
          retentionPolicy: 'keep_important',
          autoSave: true,
          saveCadence: 'every_5_messages',
          exportFormat: 'json'
        }
      };

      const response = await request(app)
        .post('/api/config/advanced')
        .send(sessionConfig)
        .expect(201);

      expect(response.body.config.configType).toBe('session');
      expect(response.body.config.configData.maxMessages).toBe(100);
    });

    it('应该成功创建UI配置', async () => {
      const uiConfig = {
        configName: 'Dark Theme Professional',
        configType: 'ui',
        configData: {
          theme: 'dark',
          primaryColor: '#3b82f6',
          secondaryColor: '#1e40af',
          fontSize: 'medium',
          fontFamily: 'Inter',
          layout: 'sidebar',
          compactMode: false,
          showTimestamps: true,
          showAvatars: true,
          messageGrouping: true,
          animationSpeed: 'normal'
        }
      };

      const response = await request(app)
        .post('/api/config/advanced')
        .send(uiConfig)
        .expect(201);

      expect(response.body.config.configType).toBe('ui');
      expect(response.body.config.configData.theme).toBe('dark');
    });

    it('应该验证必需字段', async () => {
      const incompleteData = {
        configName: 'Test Config'
        // 缺少 configType 和 configData
      };

      await request(app)
        .post('/api/config/advanced')
        .send(incompleteData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('configType is required');
        });
    });

    it('应该验证配置类型', async () => {
      const invalidTypeData = {
        configName: 'Invalid Config',
        configType: 'invalid_type',
        configData: { test: 'value' }
      };

      await request(app)
        .post('/api/config/advanced')
        .send(invalidTypeData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Invalid config type');
          expect(res.body.validTypes).toEqual(['model', 'prompt', 'session', 'ui']);
        });
    });

    it('应该验证配置数据格式', async () => {
      const invalidConfigData = {
        configName: 'Invalid Data Config',
        configType: 'model',
        configData: 'invalid-json-string'
      };

      await request(app)
        .post('/api/config/advanced')
        .send(invalidConfigData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('configData must be an object');
        });
    });

    it('应该防止重复配置名称', async () => {
      const configData = {
        configName: 'Duplicate Config',
        configType: 'model',
        configData: { model: 'gpt-3.5-turbo' }
      };

      // 第一次创建
      await request(app)
        .post('/api/config/advanced')
        .send(configData)
        .expect(201);

      // 尝试创建重复名称
      await request(app)
        .post('/api/config/advanced')
        .send(configData)
        .expect(409)
        .expect(res => {
          expect(res.body.error).toBe('Configuration name already exists');
        });
    });
  });

  describe('GET /api/config/advanced - 获取配置列表', () => {
    beforeAll(async () => {
      // 创建多个测试配置
      const configs = [
        {
          userId: testUserId,
          configName: 'Default Model Config',
          configType: 'model',
          configData: JSON.stringify({ model: 'gpt-3.5-turbo', temperature: 0.7 }),
          isDefault: true,
          isPublic: false,
          usageCount: 25,
          createdAt: new Date('2024-01-15')
        },
        {
          userId: testUserId,
          configName: 'Creative Prompt',
          configType: 'prompt',
          configData: JSON.stringify({ systemPrompt: 'Be creative' }),
          isDefault: false,
          isPublic: true,
          usageCount: 15,
          createdAt: new Date('2024-02-20')
        },
        {
          userId: testUserId,
          configName: 'Dark UI Theme',
          configType: 'ui',
          configData: JSON.stringify({ theme: 'dark' }),
          isDefault: false,
          isPublic: false,
          usageCount: 8,
          createdAt: new Date('2024-03-10')
        }
      ];

      for (const configData of configs) {
        await prisma.advancedConfig.create({ data: configData });
      }
    });

    afterAll(async () => {
      await prisma.advancedConfig.deleteMany({
        where: { userId: testUserId }
      });
    });

    it('应该返回用户的所有配置', async () => {
      const response = await request(app)
        .get('/api/config/advanced')
        .query({ userId: testUserId })
        .expect(200);

      expect(response.body.configs).toBeDefined();
      expect(Array.isArray(response.body.configs)).toBe(true);
      expect(response.body.configs.length).toBeGreaterThanOrEqual(3);
      expect(response.body.total).toBeGreaterThanOrEqual(3);

      // 验证返回的数据结构
      const config = response.body.configs[0];
      expect(config.id).toBeDefined();
      expect(config.configName).toBeDefined();
      expect(config.configType).toBeDefined();
      expect(config.configData).toBeDefined();
      expect(config.createdAt).toBeDefined();
    });

    it('应该支持按类型过滤', async () => {
      const response = await request(app)
        .get('/api/config/advanced')
        .query({ userId: testUserId, type: 'model' })
        .expect(200);

      expect(response.body.configs.every((config: any) => config.configType === 'model')).toBe(true);
      expect(response.body.configs.length).toBeGreaterThanOrEqual(1);
    });

    it('应该支持按默认状态过滤', async () => {
      const response = await request(app)
        .get('/api/config/advanced')
        .query({ userId: testUserId, isDefault: 'true' })
        .expect(200);

      expect(response.body.configs.every((config: any) => config.isDefault === true)).toBe(true);
    });

    it('应该支持按公开状态过滤', async () => {
      const response = await request(app)
        .get('/api/config/advanced')
        .query({ userId: testUserId, isPublic: 'true' })
        .expect(200);

      expect(response.body.configs.every((config: any) => config.isPublic === true)).toBe(true);
    });

    it('应该支持搜索配置名称', async () => {
      const response = await request(app)
        .get('/api/config/advanced')
        .query({ userId: testUserId, search: 'Creative' })
        .expect(200);

      expect(response.body.configs.some((config: any) =>
        config.configName.includes('Creative')
      )).toBe(true);
    });

    it('应该支持分页', async () => {
      const response = await request(app)
        .get('/api/config/advanced')
        .query({ userId: testUserId, page: 1, limit: 2 })
        .expect(200);

      expect(response.body.configs.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('应该支持按使用次数排序', async () => {
      const response = await request(app)
        .get('/api/config/advanced')
        .query({ userId: testUserId, sortBy: 'usage', sortOrder: 'desc' })
        .expect(200);

      const configs = response.body.configs;
      for (let i = 1; i < configs.length; i++) {
        expect(configs[i - 1].usageCount).toBeGreaterThanOrEqual(configs[i].usageCount);
      }
    });

    it('应该包含使用统计信息', async () => {
      const response = await request(app)
        .get('/api/config/advanced')
        .query({ userId: testUserId, includeStats: 'true' })
        .expect(200);

      expect(response.body.statistics).toBeDefined();
      expect(response.body.statistics.totalConfigs).toBeDefined();
      expect(response.body.statistics.typeBreakdown).toBeDefined();
      expect(response.body.statistics.mostUsedConfig).toBeDefined();
      expect(response.body.statistics.defaultConfigs).toBeDefined();
    });
  });

  describe('GET /api/config/advanced/:configId - 获取单个配置', () => {
    let singleConfigId: string;

    beforeAll(async () => {
      const config = await prisma.advancedConfig.create({
        data: {
          userId: testUserId,
          configName: 'Detailed Test Config',
          configType: 'model',
          configData: JSON.stringify({
            provider: 'openai',
            model: 'gpt-4',
            temperature: 0.8,
            maxTokens: 2048,
            metadata: {
              created: '2024-01-01',
              version: '1.0.0'
            }
          }),
          isDefault: false,
          isPublic: true,
          usageCount: 10,
          lastUsed: new Date()
        }
      });
      singleConfigId = config.id;
    });

    afterAll(async () => {
      await prisma.advancedConfig.deleteMany({
        where: { id: singleConfigId }
      });
    });

    it('应该返回配置的详细信息', async () => {
      const response = await request(app)
        .get(`/api/config/advanced/${singleConfigId}`)
        .expect(200);

      expect(response.body.config).toBeDefined();
      expect(response.body.config.id).toBe(singleConfigId);
      expect(response.body.config.configName).toBe('Detailed Test Config');
      expect(response.body.config.configType).toBe('model');
      expect(response.body.config.configData).toBeDefined();
      expect(response.body.config.usageCount).toBe(10);
      expect(response.body.config.lastUsed).toBeDefined();
    });

    it('应该解析JSON配置数据', async () => {
      const response = await request(app)
        .get(`/api/config/advanced/${singleConfigId}`)
        .expect(200);

      const configData = response.body.config.configData;
      expect(configData.provider).toBe('openai');
      expect(configData.model).toBe('gpt-4');
      expect(configData.temperature).toBe(0.8);
      expect(configData.metadata).toBeDefined();
    });

    it('应该处理不存在的配置ID', async () => {
      await request(app)
        .get('/api/config/advanced/non-existent-id')
        .expect(404)
        .expect(res => {
          expect(res.body.error).toBe('Configuration not found');
        });
    });

    it('应该包含使用历史（如果请求）', async () => {
      const response = await request(app)
        .get(`/api/config/advanced/${singleConfigId}`)
        .query({ includeHistory: 'true' })
        .expect(200);

      expect(response.body.config.usageHistory).toBeDefined();
      // 在实际实现中，这可能包含使用时间戳、使用上下文等信息
    });
  });

  describe('PUT /api/config/advanced/:configId - 更新配置', () => {
    let updatableConfigId: string;

    beforeEach(async () => {
      const config = await prisma.advancedConfig.create({
        data: {
          userId: testUserId,
          configName: 'Updatable Config',
          configType: 'model',
          configData: JSON.stringify({
            model: 'gpt-3.5-turbo',
            temperature: 0.7
          }),
          isDefault: false,
          isPublic: false
        }
      });
      updatableConfigId = config.id;
    });

    afterEach(async () => {
      await prisma.advancedConfig.deleteMany({
        where: { id: updatableConfigId }
      });
    });

    it('应该成功更新配置名称', async () => {
      const updateData = {
        configName: 'Updated Config Name'
      };

      const response = await request(app)
        .put(`/api/config/advanced/${updatableConfigId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.config.configName).toBe('Updated Config Name');

      // 验证数据库更新
      const config = await prisma.advancedConfig.findUnique({
        where: { id: updatableConfigId }
      });
      expect(config?.configName).toBe('Updated Config Name');
    });

    it('应该成功更新配置数据', async () => {
      const updateData = {
        configData: {
          model: 'gpt-4',
          temperature: 0.9,
          maxTokens: 4096,
          newParameter: 'newValue'
        }
      };

      const response = await request(app)
        .put(`/api/config/advanced/${updatableConfigId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.config.configData).toEqual(updateData.configData);

      // 验证数据库更新
      const config = await prisma.advancedConfig.findUnique({
        where: { id: updatableConfigId }
      });
      expect(JSON.parse(config?.configData || '{}')).toEqual(updateData.configData);
    });

    it('应该成功更新可见性设置', async () => {
      const updateData = {
        isPublic: true,
        isDefault: true
      };

      const response = await request(app)
        .put(`/api/config/advanced/${updatableConfigId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.config.isPublic).toBe(true);
      expect(response.body.config.isDefault).toBe(true);
    });

    it('应该拒绝更新只读字段', async () => {
      const invalidUpdateData = {
        id: 'new-id',
        userId: 'different-user',
        createdAt: new Date().toISOString(),
        usageCount: 999
      };

      await request(app)
        .put(`/api/config/advanced/${updatableConfigId}`)
        .send(invalidUpdateData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Read-only fields cannot be updated');
        });
    });

    it('应该验证配置数据格式', async () => {
      const invalidUpdateData = {
        configData: 'invalid-json-string'
      };

      await request(app)
        .put(`/api/config/advanced/${updatableConfigId}`)
        .send(invalidUpdateData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('configData must be an object');
        });
    });

    it('应该更新最后修改时间', async () => {
      const beforeUpdate = new Date();

      const updateData = {
        configName: 'Time Update Test'
      };

      const response = await request(app)
        .put(`/api/config/advanced/${updatableConfigId}`)
        .send(updateData)
        .expect(200);

      const updatedAt = new Date(response.body.config.updatedAt);
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });
  });

  describe('DELETE /api/config/advanced/:configId - 删除配置', () => {
    let deletableConfigId: string;

    beforeEach(async () => {
      const config = await prisma.advancedConfig.create({
        data: {
          userId: testUserId,
          configName: 'Deletable Config',
          configType: 'model',
          configData: JSON.stringify({ model: 'gpt-3.5-turbo' }),
          isDefault: false,
          isPublic: false
        }
      });
      deletableConfigId = config.id;
    });

    it('应该成功删除配置', async () => {
      const response = await request(app)
        .delete(`/api/config/advanced/${deletableConfigId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Configuration deleted successfully');

      // 验证数据库中已删除
      const config = await prisma.advancedConfig.findUnique({
        where: { id: deletableConfigId }
      });
      expect(config).toBeNull();
    });

    it('应该拒绝删除默认配置', async () => {
      await prisma.advancedConfig.update({
        where: { id: deletableConfigId },
        data: { isDefault: true }
      });

      await request(app)
        .delete(`/api/config/advanced/${deletableConfigId}`)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toBe('Cannot delete default configuration');
        });
    });

    it('应该支持强制删除', async () => {
      await prisma.advancedConfig.update({
        where: { id: deletableConfigId },
        data: { isDefault: true }
      });

      const response = await request(app)
        .delete(`/api/config/advanced/${deletableConfigId}`)
        .query({ force: 'true' })
        .expect(200);

      expect(response.body.forced).toBe(true);
    });

    it('应该处理不存在的配置', async () => {
      await request(app)
        .delete('/api/config/advanced/non-existent-id')
        .expect(404)
        .expect(res => {
          expect(res.body.error).toBe('Configuration not found');
        });
    });
  });

  describe('POST /api/config/advanced/:configId/clone - 克隆配置', () => {
    let clonableConfigId: string;

    beforeAll(async () => {
      const config = await prisma.advancedConfig.create({
        data: {
          userId: testUserId,
          configName: 'Original Config',
          configType: 'model',
          configData: JSON.stringify({
            model: 'gpt-4',
            temperature: 0.8,
            systemPrompt: 'You are helpful.'
          }),
          isDefault: false,
          isPublic: true,
          usageCount: 15
        }
      });
      clonableConfigId = config.id;
    });

    afterAll(async () => {
      await prisma.advancedConfig.deleteMany({
        where: {
          OR: [
            { id: clonableConfigId },
            { configName: { contains: 'Copy of' } }
          ]
        }
      });
    });

    it('应该成功克隆配置', async () => {
      const cloneData = {
        configName: 'Copy of Original Config'
      };

      const response = await request(app)
        .post(`/api/config/advanced/${clonableConfigId}/clone`)
        .send(cloneData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.config.configName).toBe('Copy of Original Config');
      expect(response.body.config.configType).toBe('model');
      expect(response.body.config.configData).toBeDefined();
      expect(response.body.config.id).not.toBe(clonableConfigId);

      // 验证克隆的配置数据相同
      expect(response.body.config.configData.model).toBe('gpt-4');
      expect(response.body.config.configData.temperature).toBe(0.8);

      // 验证重置的字段
      expect(response.body.config.usageCount).toBe(0);
      expect(response.body.config.isDefault).toBe(false);
    });

    it('应该自动生成克隆名称', async () => {
      const response = await request(app)
        .post(`/api/config/advanced/${clonableConfigId}/clone`)
        .expect(201);

      expect(response.body.config.configName).toContain('Copy of');
      expect(response.body.config.configName).toContain('Original Config');
    });

    it('应该支持修改克隆时的配置数据', async () => {
      const cloneData = {
        configName: 'Modified Clone',
        configData: {
          model: 'gpt-3.5-turbo',
          temperature: 0.5,
          systemPrompt: 'Modified prompt.'
        }
      };

      const response = await request(app)
        .post(`/api/config/advanced/${clonableConfigId}/clone`)
        .send(cloneData)
        .expect(201);

      expect(response.body.config.configData.model).toBe('gpt-3.5-turbo');
      expect(response.body.config.configData.temperature).toBe(0.5);
    });
  });

  describe('权限和安全性', () => {
    it('应该验证用户只能访问自己的配置', async () => {
      // 创建另一个用户的配置
      const otherUser = await prisma.user.create({
        data: {
          username: 'other_config_user',
          email: 'otherconfig@test.com',
          passwordHash: 'test_hash'
        }
      });

      const otherConfig = await prisma.advancedConfig.create({
        data: {
          userId: otherUser.id,
          configName: 'Other User Config',
          configType: 'model',
          configData: JSON.stringify({ model: 'gpt-4' }),
          isPublic: false
        }
      });

      // 尝试访问其他用户的私有配置
      await request(app)
        .get(`/api/config/advanced/${otherConfig.id}`)
        // .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403);

      // 清理
      await prisma.advancedConfig.delete({ where: { id: otherConfig.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('应该允许访问其他用户的公开配置', async () => {
      const otherUser = await prisma.user.create({
        data: {
          username: 'public_config_user',
          email: 'publicconfig@test.com',
          passwordHash: 'test_hash'
        }
      });

      const publicConfig = await prisma.advancedConfig.create({
        data: {
          userId: otherUser.id,
          configName: 'Public Config',
          configType: 'model',
          configData: JSON.stringify({ model: 'gpt-4' }),
          isPublic: true
        }
      });

      const response = await request(app)
        .get(`/api/config/advanced/${publicConfig.id}`)
        .expect(200);

      expect(response.body.config.configName).toBe('Public Config');

      // 清理
      await prisma.advancedConfig.delete({ where: { id: publicConfig.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('性能和缓存', () => {
    it('应该快速响应配置列表请求', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/config/advanced')
        .query({ userId: testUserId })
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // 1秒内响应
    });

    it('应该设置适当的缓存头', async () => {
      const response = await request(app)
        .get('/api/config/advanced')
        .query({ userId: testUserId })
        .expect(200);

      expect(response.headers['cache-control']).toBeDefined();
    });

    it('应该正确更新使用统计', async () => {
      const config = await prisma.advancedConfig.create({
        data: {
          userId: testUserId,
          configName: 'Usage Test Config',
          configType: 'model',
          configData: JSON.stringify({ model: 'gpt-3.5-turbo' }),
          usageCount: 5
        }
      });

      // 模拟使用配置
      await request(app)
        .post(`/api/config/advanced/${config.id}/use`)
        .expect(200);

      // 验证使用次数增加
      const updatedConfig = await prisma.advancedConfig.findUnique({
        where: { id: config.id }
      });
      expect(updatedConfig?.usageCount).toBe(6);
      expect(updatedConfig?.lastUsed).toBeDefined();

      // 清理
      await prisma.advancedConfig.delete({ where: { id: config.id } });
    });
  });

  describe('错误处理和验证', () => {
    it('应该验证查询参数', async () => {
      await request(app)
        .get('/api/config/advanced')
        .query({ userId: testUserId, page: -1 })
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Invalid page number');
        });
    });

    it('应该处理大量配置数据', async () => {
      const largeConfigData = {
        configName: 'Large Config',
        configType: 'model',
        configData: {
          // 模拟大量配置数据
          ...Array.from({ length: 100 }, (_, i) => ({ [`param${i}`]: `value${i}` })).reduce((acc, obj) => ({ ...acc, ...obj }), {})
        }
      };

      const response = await request(app)
        .post('/api/config/advanced')
        .send(largeConfigData)
        .expect(201);

      expect(response.body.config.configData).toBeDefined();
      expect(Object.keys(response.body.config.configData).length).toBe(100);

      // 清理
      await prisma.advancedConfig.delete({ where: { id: response.body.config.id } });
    });

    it('应该处理配置名称长度限制', async () => {
      const longNameData = {
        configName: 'a'.repeat(256), // 超长名称
        configType: 'model',
        configData: { model: 'gpt-3.5-turbo' }
      };

      await request(app)
        .post('/api/config/advanced')
        .send(longNameData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Configuration name too long');
        });
    });
  });
});