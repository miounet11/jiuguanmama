/**
 * SillyTavern导入合约测试 (T023)
 *
 * 测试SillyTavern配置和数据的导入功能
 * 接口设计符合核心竞争力提升规范
 */

import request from 'supertest';
import { app } from '../../../src/server';
import { prisma } from '../../../src/lib/prisma';

describe('SillyTavern Import API Contract Tests', () => {
  let testUserId: string;

  beforeAll(async () => {
    // 创建测试用户
    const user = await prisma.user.create({
      data: {
        username: 'sillytavern_import_user',
        email: 'import@test.com',
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
    await prisma.character.deleteMany({
      where: { creatorId: testUserId }
    });
    await prisma.user.deleteMany({
      where: { id: testUserId }
    });
  });

  describe('POST /api/config/import/sillytavern - 基本导入功能', () => {
    afterEach(async () => {
      // 清理导入的数据
      await prisma.advancedConfig.deleteMany({
        where: { userId: testUserId, importSource: 'sillytavern' }
      });
    });

    it('应该成功导入SillyTavern配置文件', async () => {
      const sillyTavernConfig = {
        main_api: 'openai',
        api_url_scale: 'https://api.openai.com/v1',
        openai_model: 'gpt-4-turbo-preview',
        openai_max_context: 128000,
        openai_max_tokens: 4096,
        temp: 0.7,
        top_p: 0.9,
        top_k: 40,
        rep_pen: 1.0,
        rep_pen_range: 1024,
        streaming: true,
        system_prompt: 'You are a helpful AI assistant.',
        user_prompt_bias: '',
        assistant_prompt_bias: ''
      };

      const importData = {
        source: 'file',
        data: sillyTavernConfig,
        preserveIds: false,
        overwriteExisting: false
      };

      const response = await request(app)
        .post('/api/config/import/sillytavern')
        .send(importData)
        // .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.imported).toBeDefined();
      expect(response.body.imported.configs).toBeGreaterThan(0);
      expect(response.body.mapping).toBeDefined();

      // 验证数据库中的配置
      const configs = await prisma.advancedConfig.findMany({
        where: { userId: testUserId, importSource: 'sillytavern' }
      });
      expect(configs.length).toBeGreaterThan(0);

      const modelConfig = configs.find(c => c.configType === 'model');
      expect(modelConfig).toBeDefined();
      const configData = JSON.parse(modelConfig?.configData || '{}');
      expect(configData.model).toBe('gpt-4-turbo-preview');
      expect(configData.temperature).toBe(0.7);
    });

    it('应该正确转换SillyTavern角色数据', async () => {
      const sillyTavernCharacter = {
        name: 'Test Character',
        description: 'A test character from SillyTavern',
        personality: 'Friendly and helpful',
        scenario: 'Modern day assistant',
        first_mes: 'Hello! I\'m here to help you.',
        mes_example: '<START>\n{{user}}: Hi there!\n{{char}}: Hello! How can I assist you today?\n<END>',
        avatar: 'https://example.com/avatar.png',
        chat: 'test-character',
        talkativeness: 0.7,
        fav: false,
        tags: ['friendly', 'assistant'],
        spec: 'chara_card_v2',
        spec_version: '2.0'
      };

      const importData = {
        source: 'character',
        data: sillyTavernCharacter,
        importType: 'character'
      };

      const response = await request(app)
        .post('/api/config/import/sillytavern')
        .send(importData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.imported.characters).toBe(1);

      // 验证数据库中的角色
      const character = await prisma.character.findFirst({
        where: { creatorId: testUserId, name: 'Test Character' }
      });
      expect(character).toBeDefined();
      expect(character?.description).toBe('A test character from SillyTavern');
      expect(character?.personality).toBe('Friendly and helpful');
      expect(character?.firstMessage).toBe('Hello! I\'m here to help you.');
    });

    it('应该支持批量导入SillyTavern数据', async () => {
      const batchData = {
        source: 'batch',
        data: {
          settings: {
            main_api: 'openai',
            openai_model: 'gpt-4',
            temp: 0.8
          },
          characters: [
            {
              name: 'Character 1',
              description: 'First character',
              personality: 'Cheerful'
            },
            {
              name: 'Character 2',
              description: 'Second character',
              personality: 'Serious'
            }
          ],
          presets: [
            {
              name: 'Creative Writing',
              temperature: 0.9,
              top_p: 0.95
            }
          ]
        }
      };

      const response = await request(app)
        .post('/api/config/import/sillytavern')
        .send(batchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.imported.characters).toBe(2);
      expect(response.body.imported.configs).toBeGreaterThan(0);
      expect(response.body.imported.presets).toBe(1);
    });

    it('应该验证SillyTavern数据格式', async () => {
      const invalidData = {
        source: 'file',
        data: {
          invalid_field: 'invalid_value',
          missing_required_fields: true
        }
      };

      await request(app)
        .post('/api/config/import/sillytavern')
        .send(invalidData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Invalid SillyTavern format');
          expect(res.body.validationErrors).toBeDefined();
        });
    });

    it('应该支持预览导入（不保存到数据库）', async () => {
      const previewData = {
        source: 'file',
        data: {
          main_api: 'claude',
          claude_model: 'claude-3-opus-20240229',
          temp: 0.5
        },
        preview: true
      };

      const response = await request(app)
        .post('/api/config/import/sillytavern')
        .send(previewData)
        .expect(200);

      expect(response.body.preview).toBe(true);
      expect(response.body.converted).toBeDefined();
      expect(response.body.converted.configs).toBeDefined();
      expect(response.body.conflicts).toBeDefined();

      // 验证数据库中没有创建记录
      const configs = await prisma.advancedConfig.findMany({
        where: { userId: testUserId }
      });
      expect(configs.length).toBe(0);
    });
  });

  describe('兼容性映射和转换', () => {
    it('应该正确映射OpenAI模型配置', async () => {
      const openaiConfig = {
        main_api: 'openai',
        openai_model: 'gpt-3.5-turbo-16k',
        openai_max_context: 16384,
        openai_max_tokens: 4096,
        temp: 0.7,
        top_p: 1.0,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      };

      const response = await request(app)
        .post('/api/config/import/sillytavern')
        .send({ source: 'file', data: openaiConfig, preview: true })
        .expect(200);

      const convertedConfig = response.body.converted.configs[0];
      expect(convertedConfig.configType).toBe('model');
      expect(convertedConfig.configData.provider).toBe('openai');
      expect(convertedConfig.configData.model).toBe('gpt-3.5-turbo-16k');
      expect(convertedConfig.configData.maxTokens).toBe(4096);
      expect(convertedConfig.configData.temperature).toBe(0.7);
      expect(convertedConfig.configData.topP).toBe(1.0);
    });

    it('应该正确映射Claude模型配置', async () => {
      const claudeConfig = {
        main_api: 'claude',
        claude_model: 'claude-3-sonnet-20240229',
        claude_max_context: 200000,
        claude_max_tokens: 4096,
        temp: 0.8
      };

      const response = await request(app)
        .post('/api/config/import/sillytavern')
        .send({ source: 'file', data: claudeConfig, preview: true })
        .expect(200);

      const convertedConfig = response.body.converted.configs[0];
      expect(convertedConfig.configData.provider).toBe('anthropic');
      expect(convertedConfig.configData.model).toBe('claude-3-sonnet-20240229');
      expect(convertedConfig.configData.temperature).toBe(0.8);
    });

    it('应该处理未知或不支持的配置', async () => {
      const unsupportedConfig = {
        main_api: 'unknown_provider',
        custom_field: 'custom_value',
        experimental_setting: true
      };

      const response = await request(app)
        .post('/api/config/import/sillytavern')
        .send({ source: 'file', data: unsupportedConfig, preview: true })
        .expect(200);

      expect(response.body.warnings).toBeDefined();
      expect(response.body.warnings.length).toBeGreaterThan(0);
      expect(response.body.warnings.some((w: any) => w.includes('unknown_provider'))).toBe(true);
    });

    it('应该保留SillyTavern特有的元数据', async () => {
      const configWithMetadata = {
        main_api: 'openai',
        openai_model: 'gpt-4',
        temp: 0.7,
        sillytavern_version: '1.11.3',
        import_date: '2024-03-15',
        user_notes: 'My custom configuration'
      };

      const response = await request(app)
        .post('/api/config/import/sillytavern')
        .send({ source: 'file', data: configWithMetadata })
        .expect(200);

      const config = await prisma.advancedConfig.findFirst({
        where: { userId: testUserId }
      });

      const configData = JSON.parse(config?.configData || '{}');
      expect(configData.metadata).toBeDefined();
      expect(configData.metadata.sillytavernVersion).toBe('1.11.3');
      expect(configData.metadata.userNotes).toBe('My custom configuration');
    });
  });

  describe('冲突处理和合并策略', () => {
    beforeEach(async () => {
      // 创建现有配置用于冲突测试
      await prisma.advancedConfig.create({
        data: {
          userId: testUserId,
          configName: 'Existing Config',
          configType: 'model',
          configData: JSON.stringify({
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            temperature: 0.5
          }),
          isDefault: true
        }
      });
    });

    afterEach(async () => {
      await prisma.advancedConfig.deleteMany({
        where: { userId: testUserId }
      });
    });

    it('应该检测配置名称冲突', async () => {
      const conflictingData = {
        source: 'file',
        data: {
          main_api: 'openai',
          openai_model: 'gpt-4',
          temp: 0.8
        },
        configName: 'Existing Config'
      };

      const response = await request(app)
        .post('/api/config/import/sillytavern')
        .send(conflictingData)
        .expect(409);

      expect(response.body.error).toBe('Configuration name conflicts');
      expect(response.body.conflicts).toBeDefined();
      expect(response.body.suggestions).toBeDefined();
    });

    it('应该支持强制覆盖现有配置', async () => {
      const overwriteData = {
        source: 'file',
        data: {
          main_api: 'openai',
          openai_model: 'gpt-4',
          temp: 0.9
        },
        configName: 'Existing Config',
        overwriteExisting: true
      };

      const response = await request(app)
        .post('/api/config/import/sillytavern')
        .send(overwriteData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.overwritten).toBe(1);

      // 验证配置已更新
      const config = await prisma.advancedConfig.findFirst({
        where: { userId: testUserId, configName: 'Existing Config' }
      });
      const configData = JSON.parse(config?.configData || '{}');
      expect(configData.model).toBe('gpt-4');
      expect(configData.temperature).toBe(0.9);
    });

    it('应该支持自动重命名策略', async () => {
      const autoRenameData = {
        source: 'file',
        data: {
          main_api: 'openai',
          openai_model: 'gpt-4',
          temp: 0.8
        },
        configName: 'Existing Config',
        conflictResolution: 'auto_rename'
      };

      const response = await request(app)
        .post('/api/config/import/sillytavern')
        .send(autoRenameData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.renamed).toBe(1);

      // 验证新配置使用了不同的名称
      const configs = await prisma.advancedConfig.findMany({
        where: { userId: testUserId }
      });
      expect(configs.length).toBe(2);
      expect(configs.some(c => c.configName.includes('Copy'))).toBe(true);
    });
  });

  describe('文件格式支持', () => {
    it('应该支持JSON格式导入', async () => {
      const jsonData = {
        source: 'file',
        format: 'json',
        data: JSON.stringify({
          main_api: 'openai',
          openai_model: 'gpt-4',
          temp: 0.7
        })
      };

      await request(app)
        .post('/api/config/import/sillytavern')
        .send(jsonData)
        .expect(200);
    });

    it('应该支持PNG角色卡导入', async () => {
      const pngCardData = {
        source: 'character_card',
        format: 'png',
        data: {
          // 模拟PNG角色卡的base64数据
          imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          characterData: {
            name: 'PNG Character',
            description: 'Character from PNG card',
            personality: 'Embedded in image'
          }
        }
      };

      const response = await request(app)
        .post('/api/config/import/sillytavern')
        .send(pngCardData)
        .expect(200);

      expect(response.body.imported.characters).toBe(1);
    });

    it('应该支持TavernAI角色文件导入', async () => {
      const tavernData = {
        source: 'tavern_character',
        format: 'json',
        data: {
          char_name: 'Tavern Character',
          char_persona: 'Classic TavernAI format character',
          world_scenario: 'Fantasy realm',
          char_greeting: 'Greetings, traveler!',
          example_dialogue: 'Example conversation',
          name: 'Tavern Character'
        }
      };

      const response = await request(app)
        .post('/api/config/import/sillytavern')
        .send(tavernData)
        .expect(200);

      expect(response.body.imported.characters).toBe(1);
      expect(response.body.converted.characters[0].name).toBe('Tavern Character');
    });

    it('应该处理损坏或无效的文件', async () => {
      const corruptedData = {
        source: 'file',
        format: 'json',
        data: '{"invalid": json}'
      };

      await request(app)
        .post('/api/config/import/sillytavern')
        .send(corruptedData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Invalid file format');
        });
    });
  });

  describe('导入历史和回滚', () => {
    it('应该记录导入历史', async () => {
      const importData = {
        source: 'file',
        data: {
          main_api: 'openai',
          openai_model: 'gpt-4',
          temp: 0.7
        }
      };

      const response = await request(app)
        .post('/api/config/import/sillytavern')
        .send(importData)
        .expect(200);

      expect(response.body.importId).toBeDefined();

      // 检查导入历史
      const historyResponse = await request(app)
        .get('/api/config/import/history')
        .query({ userId: testUserId })
        .expect(200);

      expect(historyResponse.body.imports.length).toBeGreaterThan(0);
      expect(historyResponse.body.imports[0].importId).toBe(response.body.importId);
    });

    it('应该支持回滚导入操作', async () => {
      // 先执行导入
      const importResponse = await request(app)
        .post('/api/config/import/sillytavern')
        .send({
          source: 'file',
          data: { main_api: 'openai', openai_model: 'gpt-4' }
        })
        .expect(200);

      const importId = importResponse.body.importId;

      // 执行回滚
      const rollbackResponse = await request(app)
        .post(`/api/config/import/${importId}/rollback`)
        .expect(200);

      expect(rollbackResponse.body.success).toBe(true);
      expect(rollbackResponse.body.removed).toBeGreaterThan(0);

      // 验证配置已被删除
      const configs = await prisma.advancedConfig.findMany({
        where: { userId: testUserId, importSource: 'sillytavern' }
      });
      expect(configs.length).toBe(0);
    });
  });

  describe('性能和限制', () => {
    it('应该处理大文件导入', async () => {
      const largeData = {
        source: 'batch',
        data: {
          characters: Array.from({ length: 100 }, (_, i) => ({
            name: `Character ${i}`,
            description: `Description for character ${i}`,
            personality: 'Test personality'
          }))
        }
      };

      const response = await request(app)
        .post('/api/config/import/sillytavern')
        .send(largeData)
        .expect(200);

      expect(response.body.imported.characters).toBe(100);
    });

    it('应该限制导入文件大小', async () => {
      const oversizedData = {
        source: 'file',
        data: {
          // 模拟超大配置数据
          large_field: 'x'.repeat(10 * 1024 * 1024) // 10MB
        }
      };

      await request(app)
        .post('/api/config/import/sillytavern')
        .send(oversizedData)
        .expect(413)
        .expect(res => {
          expect(res.body.error).toContain('File too large');
        });
    });

    it('应该在合理时间内完成导入', async () => {
      const startTime = Date.now();

      await request(app)
        .post('/api/config/import/sillytavern')
        .send({
          source: 'file',
          data: { main_api: 'openai', openai_model: 'gpt-4' }
        })
        .expect(200);

      const importTime = Date.now() - startTime;
      expect(importTime).toBeLessThan(5000); // 5秒内完成
    });
  });

  describe('错误处理和验证', () => {
    it('应该验证必需字段', async () => {
      const incompleteData = {
        // 缺少 source 和 data
      };

      await request(app)
        .post('/api/config/import/sillytavern')
        .send(incompleteData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('source is required');
        });
    });

    it('应该处理网络错误和超时', async () => {
      const urlImportData = {
        source: 'url',
        url: 'https://invalid-domain-that-does-not-exist.com/config.json'
      };

      await request(app)
        .post('/api/config/import/sillytavern')
        .send(urlImportData)
        .expect(500)
        .expect(res => {
          expect(res.body.error).toContain('Failed to fetch from URL');
        });
    });

    it('应该提供详细的验证错误信息', async () => {
      const invalidData = {
        source: 'file',
        data: {
          main_api: '',
          temp: 'invalid_number',
          max_tokens: -1
        }
      };

      await request(app)
        .post('/api/config/import/sillytavern')
        .send(invalidData)
        .expect(400)
        .expect(res => {
          expect(res.body.validationErrors).toBeDefined();
          expect(res.body.validationErrors.length).toBeGreaterThan(0);
        });
    });
  });
});