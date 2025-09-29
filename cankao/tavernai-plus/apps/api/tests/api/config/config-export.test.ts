import request from 'supertest';
import { App } from '../../../src/app';
import { prisma } from '../../../src/database';

describe('Configuration Export API Contract Tests', () => {
  let app: App;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    app = new App();
    await app.initialize();

    const authResponse = await request(app.express)
      .post('/api/auth/login')
      .send({
        email: 'admin@tavernai.com',
        password: 'Admin123!@#'
      });

    authToken = authResponse.body.token;
    userId = authResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.configTemplate.deleteMany();
    await prisma.userPreference.deleteMany();
  });

  describe('GET /api/config/export - Basic Export', () => {
    test('应该导出完整的用户配置', async () => {
      await prisma.userPreference.create({
        data: {
          userId,
          category: 'ai_model',
          key: 'default_model',
          value: 'gpt-4',
          type: 'string'
        }
      });

      const response = await request(app.express)
        .get('/api/config/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        version: expect.stringMatching(/^\d+\.\d+\.\d+$/),
        exportedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        userId: userId,
        config: {
          aiModel: expect.objectContaining({
            defaultModel: 'gpt-4'
          }),
          prompts: expect.any(Object),
          ui: expect.any(Object),
          chat: expect.any(Object)
        }
      });
    });

    test('应该处理空配置导出', async () => {
      const response = await request(app.express)
        .get('/api/config/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.config).toEqual({
        aiModel: {},
        prompts: {},
        ui: {},
        chat: {}
      });
    });

    test('应该要求身份验证', async () => {
      await request(app.express)
        .get('/api/config/export')
        .expect(401);
    });
  });

  describe('GET /api/config/export?format=sillytavern - SillyTavern格式导出', () => {
    test('应该导出SillyTavern兼容格式', async () => {
      await prisma.userPreference.createMany({
        data: [
          {
            userId,
            category: 'ai_model',
            key: 'openai_api_key',
            value: 'sk-test123',
            type: 'string'
          },
          {
            userId,
            category: 'ai_model',
            key: 'model',
            value: 'gpt-3.5-turbo',
            type: 'string'
          },
          {
            userId,
            category: 'prompts',
            key: 'main_prompt',
            value: 'You are a helpful assistant',
            type: 'string'
          }
        ]
      });

      const response = await request(app.express)
        .get('/api/config/export?format=sillytavern')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        'textgenerationwebui_settings': {
          'max_new_tokens': expect.any(Number),
          'temperature': expect.any(Number),
          'top_p': expect.any(Number)
        },
        'openai_setting': {
          'openai_key': 'sk-test123',
          'openai_model': 'gpt-3.5-turbo'
        },
        'prompts': {
          'main': 'You are a helpful assistant'
        }
      });
    });

    test('应该处理复杂的提示词模板', async () => {
      await prisma.userPreference.createMany({
        data: [
          {
            userId,
            category: 'prompts',
            key: 'character_prompt',
            value: '{{char}}\'s personality: {{personality}}',
            type: 'string'
          },
          {
            userId,
            category: 'prompts',
            key: 'scenario_prompt',
            value: '{{scenario}}',
            type: 'string'
          }
        ]
      });

      const response = await request(app.express)
        .get('/api/config/export?format=sillytavern')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.prompts).toMatchObject({
        'character': '{{char}}\'s personality: {{personality}}',
        'scenario': '{{scenario}}'
      });
    });
  });

  describe('GET /api/config/export?format=json - JSON格式导出', () => {
    test('应该导出结构化JSON配置', async () => {
      await prisma.userPreference.createMany({
        data: [
          {
            userId,
            category: 'ui',
            key: 'theme',
            value: 'dark',
            type: 'string'
          },
          {
            userId,
            category: 'ui',
            key: 'language',
            value: 'zh-CN',
            type: 'string'
          },
          {
            userId,
            category: 'chat',
            key: 'max_context',
            value: '4096',
            type: 'number'
          }
        ]
      });

      const response = await request(app.express)
        .get('/api/config/export?format=json')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        metadata: {
          format: 'tavernai-plus',
          version: expect.any(String),
          exportedAt: expect.any(String)
        },
        preferences: {
          ui: {
            theme: 'dark',
            language: 'zh-CN'
          },
          chat: {
            maxContext: 4096
          }
        }
      });
    });

    test('应该包含类型信息', async () => {
      await prisma.userPreference.create({
        data: {
          userId,
          category: 'ai_model',
          key: 'temperature',
          value: '0.7',
          type: 'number'
        }
      });

      const response = await request(app.express)
        .get('/api/config/export?format=json')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.preferences.aiModel.temperature).toBe(0.7);
      expect(typeof response.body.preferences.aiModel.temperature).toBe('number');
    });
  });

  describe('GET /api/config/export?categories=ai_model,prompts - 分类导出', () => {
    test('应该只导出指定分类', async () => {
      await prisma.userPreference.createMany({
        data: [
          {
            userId,
            category: 'ai_model',
            key: 'model',
            value: 'gpt-4',
            type: 'string'
          },
          {
            userId,
            category: 'prompts',
            key: 'main',
            value: 'Hello',
            type: 'string'
          },
          {
            userId,
            category: 'ui',
            key: 'theme',
            value: 'dark',
            type: 'string'
          }
        ]
      });

      const response = await request(app.express)
        .get('/api/config/export?categories=ai_model,prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.config).toMatchObject({
        aiModel: { model: 'gpt-4' },
        prompts: { main: 'Hello' }
      });
      expect(response.body.config.ui).toBeUndefined();
    });

    test('应该验证分类参数', async () => {
      await request(app.express)
        .get('/api/config/export?categories=invalid_category')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/config/export - 包含模板导出', () => {
    test('应该包含用户创建的模板', async () => {
      await prisma.configTemplate.create({
        data: {
          name: 'My Custom Template',
          description: 'Custom AI configuration',
          category: 'ai_model',
          config: {
            model: 'claude-3-opus',
            temperature: 0.8,
            maxTokens: 2048
          },
          createdBy: userId,
          isOfficial: false,
          isPublic: true
        }
      });

      const response = await request(app.express)
        .get('/api/config/export?includeTemplates=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.templates).toHaveLength(1);
      expect(response.body.templates[0]).toMatchObject({
        name: 'My Custom Template',
        category: 'ai_model',
        config: {
          model: 'claude-3-opus',
          temperature: 0.8,
          maxTokens: 2048
        }
      });
    });

    test('应该排除其他用户的私有模板', async () => {
      const otherUser = await prisma.user.create({
        data: {
          username: 'otheruser',
          email: 'other@test.com',
          hashedPassword: 'hashedpass'
        }
      });

      await prisma.configTemplate.create({
        data: {
          name: 'Private Template',
          description: 'Should not be exported',
          category: 'ai_model',
          config: { model: 'private' },
          createdBy: otherUser.id,
          isOfficial: false,
          isPublic: false
        }
      });

      const response = await request(app.express)
        .get('/api/config/export?includeTemplates=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.templates || []).toHaveLength(0);
    });
  });

  describe('安全性和错误处理', () => {
    test('应该过滤敏感配置信息', async () => {
      await prisma.userPreference.createMany({
        data: [
          {
            userId,
            category: 'ai_model',
            key: 'api_key',
            value: 'sk-secret123',
            type: 'string'
          },
          {
            userId,
            category: 'ai_model',
            key: 'password',
            value: 'mypassword',
            type: 'string'
          },
          {
            userId,
            category: 'ai_model',
            key: 'model',
            value: 'gpt-4',
            type: 'string'
          }
        ]
      });

      const response = await request(app.express)
        .get('/api/config/export?secure=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.config.aiModel.apiKey).toBeUndefined();
      expect(response.body.config.aiModel.password).toBeUndefined();
      expect(response.body.config.aiModel.model).toBe('gpt-4');
    });

    test('应该处理无效的格式参数', async () => {
      await request(app.express)
        .get('/api/config/export?format=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    test('应该限制导出大小', async () => {
      const largeConfig = 'x'.repeat(10000);

      await prisma.userPreference.create({
        data: {
          userId,
          category: 'prompts',
          key: 'large_prompt',
          value: largeConfig,
          type: 'string'
        }
      });

      const response = await request(app.express)
        .get('/api/config/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const exportSize = JSON.stringify(response.body).length;
      expect(exportSize).toBeLessThan(1024 * 1024); // 1MB limit
    });
  });

  describe('性能和优化', () => {
    test('应该在合理时间内完成导出', async () => {
      await prisma.userPreference.createMany({
        data: Array.from({ length: 100 }, (_, i) => ({
          userId,
          category: 'test',
          key: `key_${i}`,
          value: `value_${i}`,
          type: 'string'
        }))
      });

      const startTime = Date.now();

      await request(app.express)
        .get('/api/config/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('应该支持分页导出大量配置', async () => {
      await prisma.userPreference.createMany({
        data: Array.from({ length: 500 }, (_, i) => ({
          userId,
          category: 'bulk',
          key: `key_${i}`,
          value: `value_${i}`,
          type: 'string'
        }))
      });

      const response = await request(app.express)
        .get('/api/config/export?limit=100&offset=50')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        total: 500,
        limit: 100,
        offset: 50,
        hasMore: true
      });
    });
  });

  describe('压缩和编码', () => {
    test('应该支持gzip压缩导出', async () => {
      await prisma.userPreference.createMany({
        data: Array.from({ length: 50 }, (_, i) => ({
          userId,
          category: 'test',
          key: `key_${i}`,
          value: `This is a longer value that should compress well ${i}`,
          type: 'string'
        }))
      });

      const response = await request(app.express)
        .get('/api/config/export?compress=gzip')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Encoding', 'gzip')
        .expect(200);

      expect(response.headers['content-encoding']).toBe('gzip');
    });

    test('应该支持base64编码导出', async () => {
      await prisma.userPreference.create({
        data: {
          userId,
          category: 'test',
          key: 'binary_data',
          value: 'Hello World',
          type: 'string'
        }
      });

      const response = await request(app.express)
        .get('/api/config/export?encoding=base64')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.encoding).toBe('base64');
      expect(response.body.data).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
    });
  });
});