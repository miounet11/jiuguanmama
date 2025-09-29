/**
 * 配置模板合约测试 (T022)
 *
 * 测试配置模板系统：模板创建、浏览、应用和管理
 * 接口设计符合核心竞争力提升规范
 */

import request from 'supertest';
import { app } from '../../../src/server';
import { prisma } from '../../../src/lib/prisma';

describe('Configuration Templates API Contract Tests', () => {
  let testUserId: string;
  let testAuthorId: string;
  let testTemplateId: string;

  beforeAll(async () => {
    // 创建测试用户
    const user = await prisma.user.create({
      data: {
        username: 'template_test_user',
        email: 'template@test.com',
        passwordHash: 'test_hash'
      }
    });
    testUserId = user.id;

    // 创建模板作者
    const author = await prisma.user.create({
      data: {
        username: 'template_author',
        email: 'templateauthor@test.com',
        passwordHash: 'test_hash',
        role: 'admin' // 假设需要管理员权限创建官方模板
      }
    });
    testAuthorId = author.id;
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.configTemplate.deleteMany({
      where: { authorId: { in: [testUserId, testAuthorId] } }
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUserId, testAuthorId] } }
    });
  });

  describe('GET /api/config/templates - 获取模板列表', () => {
    beforeAll(async () => {
      // 创建多个测试模板
      const templates = [
        {
          id: 'official-gpt4-template',
          name: 'GPT-4 Turbo Default',
          description: 'Official GPT-4 Turbo configuration with optimized settings',
          configType: 'model',
          authorId: testAuthorId,
          templateData: JSON.stringify({
            provider: 'openai',
            model: 'gpt-4-turbo-preview',
            temperature: 0.7,
            maxTokens: 4096,
            topP: 0.9,
            frequencyPenalty: 0.0,
            presencePenalty: 0.0
          }),
          variables: JSON.stringify({
            temperature: { type: 'number', min: 0, max: 2, default: 0.7 },
            maxTokens: { type: 'number', min: 1, max: 8192, default: 4096 }
          }),
          isOfficial: true,
          downloads: 1250,
          rating: 4.8,
          createdAt: new Date('2024-01-15')
        },
        {
          id: 'creative-prompt-template',
          name: 'Creative Writing Assistant',
          description: 'Perfect for creative writing tasks and storytelling',
          configType: 'prompt',
          authorId: testUserId,
          templateData: JSON.stringify({
            systemPrompt: 'You are a creative writing assistant. Help users craft engaging stories with vivid descriptions and compelling characters.',
            userPromptTemplate: 'Help me write a {{genre}} story about {{topic}}',
            variables: ['genre', 'topic', 'mood', 'length']
          }),
          variables: JSON.stringify({
            genre: { type: 'select', options: ['fantasy', 'sci-fi', 'mystery', 'romance'] },
            topic: { type: 'text', placeholder: 'Enter the main topic or theme' },
            mood: { type: 'select', options: ['dark', 'light', 'mysterious', 'humorous'] },
            length: { type: 'select', options: ['short', 'medium', 'long'] }
          }),
          isOfficial: false,
          downloads: 325,
          rating: 4.2,
          createdAt: new Date('2024-02-20')
        },
        {
          id: 'professional-ui-template',
          name: 'Professional Dark Theme',
          description: 'Clean and professional dark theme for extended usage',
          configType: 'ui',
          authorId: testUserId,
          templateData: JSON.stringify({
            theme: 'dark',
            primaryColor: '{{primaryColor}}',
            secondaryColor: '{{secondaryColor}}',
            fontSize: '{{fontSize}}',
            fontFamily: 'Inter',
            layout: 'sidebar',
            compactMode: false
          }),
          variables: JSON.stringify({
            primaryColor: { type: 'color', default: '#3b82f6' },
            secondaryColor: { type: 'color', default: '#1e40af' },
            fontSize: { type: 'select', options: ['small', 'medium', 'large'], default: 'medium' }
          }),
          isOfficial: false,
          downloads: 89,
          rating: 4.5,
          createdAt: new Date('2024-03-10')
        },
        {
          id: 'session-management-template',
          name: 'Extended Session Manager',
          description: 'Optimized for long conversations with smart memory management',
          configType: 'session',
          authorId: testAuthorId,
          templateData: JSON.stringify({
            maxMessages: '{{maxMessages}}',
            contextWindow: '{{contextWindow}}',
            memoryStrategy: 'sliding_window',
            summarizationThreshold: '{{summaryThreshold}}',
            autoSave: true
          }),
          variables: JSON.stringify({
            maxMessages: { type: 'number', min: 10, max: 1000, default: 100 },
            contextWindow: { type: 'number', min: 1024, max: 32768, default: 8192 },
            summaryThreshold: { type: 'number', min: 10, max: 500, default: 50 }
          }),
          isOfficial: true,
          downloads: 892,
          rating: 4.6,
          createdAt: new Date('2024-01-30')
        }
      ];

      for (const templateData of templates) {
        await prisma.configTemplate.create({ data: templateData });
      }
    });

    afterAll(async () => {
      await prisma.configTemplate.deleteMany({
        where: { id: { in: ['official-gpt4-template', 'creative-prompt-template', 'professional-ui-template', 'session-management-template'] } }
      });
    });

    it('应该返回所有公开模板', async () => {
      const response = await request(app)
        .get('/api/config/templates')
        .expect(200);

      expect(response.body.templates).toBeDefined();
      expect(Array.isArray(response.body.templates)).toBe(true);
      expect(response.body.templates.length).toBeGreaterThanOrEqual(4);
      expect(response.body.total).toBeGreaterThanOrEqual(4);

      // 验证返回的数据结构
      const template = response.body.templates[0];
      expect(template.id).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.description).toBeDefined();
      expect(template.configType).toBeDefined();
      expect(template.templateData).toBeDefined();
      expect(template.variables).toBeDefined();
      expect(template.downloads).toBeDefined();
      expect(template.rating).toBeDefined();
    });

    it('应该支持按配置类型过滤', async () => {
      const response = await request(app)
        .get('/api/config/templates')
        .query({ type: 'model' })
        .expect(200);

      expect(response.body.templates.every((template: any) => template.configType === 'model')).toBe(true);
      expect(response.body.templates.length).toBeGreaterThanOrEqual(1);
    });

    it('应该支持按官方状态过滤', async () => {
      const response = await request(app)
        .get('/api/config/templates')
        .query({ official: 'true' })
        .expect(200);

      expect(response.body.templates.every((template: any) => template.isOfficial === true)).toBe(true);
      expect(response.body.templates.length).toBeGreaterThanOrEqual(2);
    });

    it('应该支持搜索模板名称和描述', async () => {
      const response = await request(app)
        .get('/api/config/templates')
        .query({ search: 'Creative' })
        .expect(200);

      expect(response.body.templates.some((template: any) =>
        template.name.includes('Creative') || template.description.includes('creative')
      )).toBe(true);
    });

    it('应该支持按下载量排序', async () => {
      const response = await request(app)
        .get('/api/config/templates')
        .query({ sortBy: 'downloads', sortOrder: 'desc' })
        .expect(200);

      const templates = response.body.templates;
      for (let i = 1; i < templates.length; i++) {
        expect(templates[i - 1].downloads).toBeGreaterThanOrEqual(templates[i].downloads);
      }
    });

    it('应该支持按评分排序', async () => {
      const response = await request(app)
        .get('/api/config/templates')
        .query({ sortBy: 'rating', sortOrder: 'desc' })
        .expect(200);

      const templates = response.body.templates;
      for (let i = 1; i < templates.length; i++) {
        expect(templates[i - 1].rating).toBeGreaterThanOrEqual(templates[i].rating);
      }
    });

    it('应该支持分页', async () => {
      const response = await request(app)
        .get('/api/config/templates')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.templates.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.totalPages).toBeGreaterThanOrEqual(2);
    });

    it('应该包含模板统计信息', async () => {
      const response = await request(app)
        .get('/api/config/templates')
        .query({ includeStats: 'true' })
        .expect(200);

      expect(response.body.statistics).toBeDefined();
      expect(response.body.statistics.totalTemplates).toBeDefined();
      expect(response.body.statistics.officialTemplates).toBeDefined();
      expect(response.body.statistics.typeBreakdown).toBeDefined();
      expect(response.body.statistics.mostPopular).toBeDefined();
    });
  });

  describe('GET /api/config/templates/:templateId - 获取模板详情', () => {
    beforeAll(async () => {
      const template = await prisma.configTemplate.create({
        data: {
          id: 'detailed-template',
          name: 'Detailed Test Template',
          description: 'A comprehensive template for testing detailed views',
          configType: 'model',
          authorId: testAuthorId,
          templateData: JSON.stringify({
            provider: 'anthropic',
            model: 'claude-3-opus-20240229',
            temperature: '{{temperature}}',
            maxTokens: '{{maxTokens}}',
            systemPrompt: '{{systemPrompt}}'
          }),
          variables: JSON.stringify({
            temperature: {
              type: 'number',
              min: 0,
              max: 1,
              step: 0.1,
              default: 0.7,
              description: 'Controls randomness in responses'
            },
            maxTokens: {
              type: 'number',
              min: 1,
              max: 4096,
              default: 2048,
              description: 'Maximum number of tokens to generate'
            },
            systemPrompt: {
              type: 'textarea',
              default: 'You are a helpful assistant.',
              placeholder: 'Enter the system prompt...',
              description: 'Instructions for the AI assistant'
            }
          }),
          isOfficial: true,
          downloads: 567,
          rating: 4.7
        }
      });
      testTemplateId = template.id;
    });

    afterAll(async () => {
      await prisma.configTemplate.deleteMany({
        where: { id: 'detailed-template' }
      });
    });

    it('应该返回模板的详细信息', async () => {
      const response = await request(app)
        .get(`/api/config/templates/${testTemplateId}`)
        .expect(200);

      expect(response.body.template).toBeDefined();
      expect(response.body.template.id).toBe(testTemplateId);
      expect(response.body.template.name).toBe('Detailed Test Template');
      expect(response.body.template.configType).toBe('model');
      expect(response.body.template.templateData).toBeDefined();
      expect(response.body.template.variables).toBeDefined();
      expect(response.body.template.author).toBeDefined();
    });

    it('应该解析模板变量定义', async () => {
      const response = await request(app)
        .get(`/api/config/templates/${testTemplateId}`)
        .expect(200);

      const variables = response.body.template.variables;
      expect(variables.temperature).toBeDefined();
      expect(variables.temperature.type).toBe('number');
      expect(variables.temperature.min).toBe(0);
      expect(variables.temperature.max).toBe(1);
      expect(variables.temperature.description).toBeDefined();

      expect(variables.systemPrompt).toBeDefined();
      expect(variables.systemPrompt.type).toBe('textarea');
      expect(variables.systemPrompt.placeholder).toBeDefined();
    });

    it('应该包含作者信息', async () => {
      const response = await request(app)
        .get(`/api/config/templates/${testTemplateId}`)
        .expect(200);

      expect(response.body.template.author).toBeDefined();
      expect(response.body.template.author.username).toBeDefined();
      expect(response.body.template.author.id).toBe(testAuthorId);
      // 不应该包含敏感信息
      expect(response.body.template.author.email).toBeUndefined();
      expect(response.body.template.author.passwordHash).toBeUndefined();
    });

    it('应该处理不存在的模板', async () => {
      await request(app)
        .get('/api/config/templates/non-existent-template')
        .expect(404)
        .expect(res => {
          expect(res.body.error).toBe('Template not found');
        });
    });
  });

  describe('POST /api/config/templates/:templateId/apply - 应用模板', () => {
    let applicableTemplateId: string;

    beforeAll(async () => {
      const template = await prisma.configTemplate.create({
        data: {
          id: 'applicable-template',
          name: 'Applicable Template',
          description: 'Template for application testing',
          configType: 'model',
          authorId: testAuthorId,
          templateData: JSON.stringify({
            provider: 'openai',
            model: 'gpt-4',
            temperature: '{{temperature}}',
            maxTokens: '{{maxTokens}}',
            systemPrompt: '{{systemPrompt}}'
          }),
          variables: JSON.stringify({
            temperature: { type: 'number', default: 0.7 },
            maxTokens: { type: 'number', default: 2048 },
            systemPrompt: { type: 'textarea', default: 'You are helpful.' }
          }),
          isOfficial: false,
          downloads: 0,
          rating: 0
        }
      });
      applicableTemplateId = template.id;
    });

    afterAll(async () => {
      await prisma.configTemplate.deleteMany({
        where: { id: 'applicable-template' }
      });
      await prisma.advancedConfig.deleteMany({
        where: { userId: testUserId, configName: { contains: 'from template' } }
      });
    });

    it('应该使用默认值应用模板', async () => {
      const applicationData = {
        configName: 'Applied Config from template'
      };

      const response = await request(app)
        .post(`/api/config/templates/${applicableTemplateId}/apply`)
        .send(applicationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.config).toBeDefined();
      expect(response.body.config.configName).toBe('Applied Config from template');
      expect(response.body.config.configType).toBe('model');
      expect(response.body.config.configData.temperature).toBe(0.7);
      expect(response.body.config.configData.maxTokens).toBe(2048);
      expect(response.body.config.configData.systemPrompt).toBe('You are helpful.');

      // 验证下载次数增加
      const template = await prisma.configTemplate.findUnique({
        where: { id: applicableTemplateId }
      });
      expect(template?.downloads).toBe(1);
    });

    it('应该使用自定义变量值应用模板', async () => {
      const applicationData = {
        configName: 'Custom Applied Config',
        variables: {
          temperature: 0.9,
          maxTokens: 4096,
          systemPrompt: 'You are a creative writing assistant.'
        }
      };

      const response = await request(app)
        .post(`/api/config/templates/${applicableTemplateId}/apply`)
        .send(applicationData)
        .expect(201);

      expect(response.body.config.configData.temperature).toBe(0.9);
      expect(response.body.config.configData.maxTokens).toBe(4096);
      expect(response.body.config.configData.systemPrompt).toBe('You are a creative writing assistant.');
    });

    it('应该验证变量类型和范围', async () => {
      const invalidApplicationData = {
        configName: 'Invalid Config',
        variables: {
          temperature: 5.0, // 超出范围
          maxTokens: 'invalid-number',
          systemPrompt: null
        }
      };

      await request(app)
        .post(`/api/config/templates/${applicableTemplateId}/apply`)
        .send(invalidApplicationData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Invalid variable values');
          expect(res.body.validationErrors).toBeDefined();
        });
    });

    it('应该支持预览模式', async () => {
      const previewData = {
        variables: {
          temperature: 0.8,
          maxTokens: 3000,
          systemPrompt: 'Preview prompt'
        },
        preview: true
      };

      const response = await request(app)
        .post(`/api/config/templates/${applicableTemplateId}/apply`)
        .send(previewData)
        .expect(200);

      expect(response.body.preview).toBe(true);
      expect(response.body.configData).toBeDefined();
      expect(response.body.configData.temperature).toBe(0.8);
      // 预览模式不应该创建实际配置或增加下载次数
      expect(response.body.config).toBeUndefined();
    });

    it('应该处理缺少必需变量', async () => {
      const incompleteData = {
        configName: 'Incomplete Config',
        variables: {
          temperature: 0.7
          // 缺少其他必需变量
        }
      };

      const response = await request(app)
        .post(`/api/config/templates/${applicableTemplateId}/apply`)
        .send(incompleteData)
        .expect(201); // 应该使用默认值成功创建

      expect(response.body.config.configData.maxTokens).toBe(2048); // 默认值
      expect(response.body.config.configData.systemPrompt).toBe('You are helpful.'); // 默认值
    });
  });

  describe('POST /api/config/templates - 创建新模板', () => {
    afterEach(async () => {
      // 清理创建的模板
      await prisma.configTemplate.deleteMany({
        where: { authorId: testUserId }
      });
    });

    it('应该成功创建用户模板', async () => {
      const templateData = {
        name: 'User Created Template',
        description: 'A template created by a regular user',
        configType: 'prompt',
        templateData: {
          systemPrompt: 'You are a {{role}} assistant specializing in {{domain}}.',
          userPromptTemplate: 'Help me with {{task}} in the context of {{context}}'
        },
        variables: {
          role: {
            type: 'select',
            options: ['helpful', 'expert', 'creative'],
            default: 'helpful'
          },
          domain: {
            type: 'text',
            placeholder: 'Enter domain (e.g., programming, writing)'
          },
          task: {
            type: 'textarea',
            placeholder: 'Describe the task you need help with'
          },
          context: {
            type: 'text',
            placeholder: 'Provide relevant context'
          }
        }
      };

      const response = await request(app)
        .post('/api/config/templates')
        .send(templateData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.template).toBeDefined();
      expect(response.body.template.name).toBe(templateData.name);
      expect(response.body.template.configType).toBe('prompt');
      expect(response.body.template.isOfficial).toBe(false);
      expect(response.body.template.authorId).toBe(testUserId);
      expect(response.body.template.downloads).toBe(0);
      expect(response.body.template.rating).toBe(0);
    });

    it('应该验证模板数据结构', async () => {
      const invalidTemplateData = {
        name: 'Invalid Template',
        configType: 'model',
        templateData: 'invalid-json-string'
      };

      await request(app)
        .post('/api/config/templates')
        .send(invalidTemplateData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('templateData must be an object');
        });
    });

    it('应该验证变量定义', async () => {
      const invalidVariablesData = {
        name: 'Invalid Variables Template',
        configType: 'model',
        templateData: { model: 'gpt-4' },
        variables: {
          invalidVariable: {
            type: 'invalid_type'
          }
        }
      };

      await request(app)
        .post('/api/config/templates')
        .send(invalidVariablesData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Invalid variable type');
          expect(res.body.validTypes).toBeDefined();
        });
    });

    it('应该防止重复模板名称', async () => {
      const templateData = {
        name: 'Duplicate Template Name',
        configType: 'model',
        templateData: { model: 'gpt-4' }
      };

      // 第一次创建
      await request(app)
        .post('/api/config/templates')
        .send(templateData)
        .expect(201);

      // 尝试创建重复名称
      await request(app)
        .post('/api/config/templates')
        .send(templateData)
        .expect(409)
        .expect(res => {
          expect(res.body.error).toBe('Template name already exists');
        });
    });

    it('应该验证必需字段', async () => {
      const incompleteData = {
        name: 'Incomplete Template'
        // 缺少 configType 和 templateData
      };

      await request(app)
        .post('/api/config/templates')
        .send(incompleteData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('configType is required');
        });
    });
  });

  describe('GET /api/config/templates/categories - 获取模板分类', () => {
    it('应该返回所有模板分类统计', async () => {
      const response = await request(app)
        .get('/api/config/templates/categories')
        .expect(200);

      expect(response.body.categories).toBeDefined();
      expect(Array.isArray(response.body.categories)).toBe(true);

      const modelCategory = response.body.categories.find((cat: any) => cat.type === 'model');
      expect(modelCategory).toBeDefined();
      expect(modelCategory.count).toBeGreaterThanOrEqual(0);
      expect(modelCategory.averageRating).toBeDefined();
      expect(modelCategory.totalDownloads).toBeDefined();
    });

    it('应该包含每个分类的热门模板', async () => {
      const response = await request(app)
        .get('/api/config/templates/categories')
        .query({ includePopular: 'true' })
        .expect(200);

      const categories = response.body.categories;
      categories.forEach((category: any) => {
        if (category.count > 0) {
          expect(category.popularTemplates).toBeDefined();
          expect(Array.isArray(category.popularTemplates)).toBe(true);
        }
      });
    });
  });

  describe('POST /api/config/templates/:templateId/rate - 评价模板', () => {
    let ratableTemplateId: string;

    beforeAll(async () => {
      const template = await prisma.configTemplate.create({
        data: {
          id: 'ratable-template',
          name: 'Ratable Template',
          description: 'Template for rating tests',
          configType: 'ui',
          authorId: testAuthorId,
          templateData: JSON.stringify({ theme: 'light' }),
          variables: JSON.stringify({}),
          isOfficial: false,
          downloads: 10,
          rating: 0
        }
      });
      ratableTemplateId = template.id;
    });

    afterAll(async () => {
      await prisma.configTemplate.deleteMany({
        where: { id: 'ratable-template' }
      });
    });

    it('应该允许用户评价模板', async () => {
      const ratingData = {
        rating: 5,
        review: 'Excellent template, very useful!'
      };

      const response = await request(app)
        .post(`/api/config/templates/${ratableTemplateId}/rate`)
        .send(ratingData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.currentRating).toBeDefined();
      expect(response.body.totalRatings).toBe(1);

      // 验证模板评分更新
      const template = await prisma.configTemplate.findUnique({
        where: { id: ratableTemplateId }
      });
      expect(template?.rating).toBeGreaterThan(0);
    });

    it('应该验证评分范围', async () => {
      const invalidRating = {
        rating: 6 // 超出1-5范围
      };

      await request(app)
        .post(`/api/config/templates/${ratableTemplateId}/rate`)
        .send(invalidRating)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Rating must be between 1 and 5');
        });
    });

    it('应该防止重复评价', async () => {
      const ratingData = { rating: 4 };

      // 第一次评价
      await request(app)
        .post(`/api/config/templates/${ratableTemplateId}/rate`)
        .send(ratingData)
        .expect(200);

      // 尝试再次评价
      await request(app)
        .post(`/api/config/templates/${ratableTemplateId}/rate`)
        .send(ratingData)
        .expect(409)
        .expect(res => {
          expect(res.body.error).toBe('You have already rated this template');
        });
    });
  });

  describe('权限和安全性', () => {
    it('应该只允许管理员创建官方模板', async () => {
      const officialTemplateData = {
        name: 'Unauthorized Official Template',
        configType: 'model',
        templateData: { model: 'gpt-4' },
        isOfficial: true
      };

      await request(app)
        .post('/api/config/templates')
        .send(officialTemplateData)
        // .set('Authorization', `Bearer ${userToken}`)
        .expect(403)
        .expect(res => {
          expect(res.body.error).toBe('Only administrators can create official templates');
        });
    });

    it('应该验证模板内容安全性', async () => {
      const maliciousTemplateData = {
        name: 'Malicious Template',
        configType: 'model',
        templateData: {
          systemPrompt: '<script>alert("xss")</script>',
          apiKey: '{{userApiKey}}' // 尝试获取用户API密钥
        }
      };

      await request(app)
        .post('/api/config/templates')
        .send(maliciousTemplateData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Template contains potentially unsafe content');
        });
    });
  });

  describe('性能和缓存', () => {
    it('应该快速响应模板列表请求', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/config/templates')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // 1秒内响应
    });

    it('应该设置适当的缓存头', async () => {
      const response = await request(app)
        .get('/api/config/templates')
        .expect(200);

      expect(response.headers['cache-control']).toBeDefined();
      expect(response.headers['etag']).toBeDefined();
    });

    it('应该支持条件请求', async () => {
      const initialResponse = await request(app)
        .get('/api/config/templates')
        .expect(200);

      const etag = initialResponse.headers['etag'];

      await request(app)
        .get('/api/config/templates')
        .set('If-None-Match', etag)
        .expect(304);
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的模板ID', async () => {
      await request(app)
        .post('/api/config/templates/invalid-id/apply')
        .send({ configName: 'Test' })
        .expect(404)
        .expect(res => {
          expect(res.body.error).toBe('Template not found');
        });
    });

    it('应该验证查询参数', async () => {
      await request(app)
        .get('/api/config/templates')
        .query({ page: -1 })
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Invalid page number');
        });
    });

    it('应该处理模板名称长度限制', async () => {
      const longNameData = {
        name: 'a'.repeat(256), // 超长名称
        configType: 'model',
        templateData: { model: 'gpt-4' }
      };

      await request(app)
        .post('/api/config/templates')
        .send(longNameData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Template name too long');
        });
    });
  });
});