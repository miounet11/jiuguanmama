import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import fs from 'fs/promises';
import path from 'path';
import { app } from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { initRedis, closeRedis } from '../../apps/api/src/lib/redis';

describe('高级配置导入导出集成测试', () => {
  let server: any;
  let testUser: any;
  let authToken: string;
  let testConfigDir: string;

  // SillyTavern 配置样本
  const sillyTavernConfig = {
    // 基础设置
    user_name: 'TestUser',
    character_greeting: 'Hello! I am your AI assistant.',
    world_info_settings: {
      world_info_depth: 4,
      world_info_budget: 25,
      world_info_recursive: true,
    },

    // AI 模型配置
    main_api: 'openai',
    openai_setting_id: 'default',
    api_url_scale: '',

    // OpenAI 设置
    openai_settings: [
      {
        name: 'default',
        api_url: 'https://api.openai.com/v1',
        api_key_openai: 'sk-test-key',
        openai_model: 'gpt-3.5-turbo',
        openai_max_context: 4096,
        openai_max_tokens: 1000,
        temp_openai: 0.7,
        freq_pen_openai: 0.0,
        pres_pen_openai: 0.0,
        top_p_openai: 1.0,
        stream_openai: true,
      },
    ],

    // 角色设置
    characters: [
      {
        name: '智能助手',
        description: '一个友好的AI助手',
        personality: '聪明、友好、乐于助人',
        scenario: '在办公室环境中协助用户工作',
        first_mes: '你好！我是你的智能助手，有什么可以帮助你的吗？',
        mes_example: '<START>\n{{user}}: 你好\n{{char}}: 你好！很高兴见到你！',
        avatar: 'default_avatar.png',
        chat: 'default_chat_id',
        create_date: '2024-01-01T00:00:00.000Z',
        talkativeness: 0.5,
        fav: false,
      },
    ],

    // 聊天设置
    chat_settings: {
      auto_save_msg: true,
      auto_fix_generated_markup: true,
      auto_scroll_chat_to_bottom: true,
      chat_width: 60,
      chat_truncation: 100,
      max_context_unlocked: true,
      fast_ui_mode: false,
    },

    // 界面设置
    ui_settings: {
      theme: 'dark',
      font_size: 16,
      blur_strength: 0,
      shadow_width: 2,
      border_image_url: '',
      custom_css: '',
      avatar_style: 1,
      chat_display: 0,
      noShadows: false,
      tag_color: '#7C4DFF',
    },

    // 扩展设置
    extensions: {
      enabled: ['auto_translate', 'word_count'],
      auto_translate: {
        target_language: 'zh-CN',
        service: 'google',
        enabled: true,
      },
      word_count: {
        enabled: true,
        position: 'bottom',
      },
    },
  };

  beforeAll(async () => {
    // 初始化测试环境
    await initRedis();
    server = app;

    // 创建测试用户
    testUser = await prisma.user.create({
      data: {
        username: 'config_test_user',
        email: 'configtest@example.com',
        passwordHash: 'test_hash',
        is_active: true,
        is_verified: true,
        role: 'user',
      },
    });

    // 模拟获取认证令牌
    authToken = 'mock_config_test_token';

    // 创建测试配置目录
    testConfigDir = path.join(process.cwd(), 'test-data', 'config-test');
    await fs.mkdir(testConfigDir, { recursive: true });
  });

  afterAll(async () => {
    // 清理测试数据
    if (testUser) {
      await prisma.advancedConfig.deleteMany({ where: { userId: testUser.id } });
      await prisma.configTemplate.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }

    // 清理测试文件
    try {
      await fs.rm(testConfigDir, { recursive: true, force: true });
    } catch (error) {
      // 忽略清理错误
    }

    await closeRedis();
  });

  beforeEach(async () => {
    // 每个测试前清理配置
    await prisma.advancedConfig.deleteMany({ where: { userId: testUser.id } });
    await prisma.configTemplate.deleteMany({ where: { userId: testUser.id } });
  });

  test('SillyTavern配置完整导入流程', async () => {
    // Step 1: 创建SillyTavern配置文件
    const configFilePath = path.join(testConfigDir, 'silly-tavern-config.json');
    await fs.writeFile(configFilePath, JSON.stringify(sillyTavernConfig, null, 2));

    // Step 2: 开始导入流程 - 上传配置文件
    const uploadResponse = await request(server)
      .post('/api/config/import/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('config', configFilePath)
      .field('source', 'sillytavern')
      .field('importType', 'file')
      .expect(200);

    const importId = uploadResponse.body.importId;
    expect(importId).toBeTruthy();
    expect(uploadResponse.body.status).toBe('uploaded');

    // Step 3: 解析配置并获取预览
    const parseResponse = await request(server)
      .post(`/api/config/import/${importId}/parse`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(parseResponse.body.status).toBe('parsed');
    expect(parseResponse.body.preview).toBeTruthy();
    expect(parseResponse.body.preview.characters).toHaveLength(1);
    expect(parseResponse.body.preview.aiModels).toHaveLength(1);
    expect(parseResponse.body.mappingOptions).toBeTruthy();

    // Step 4: 检查兼容性
    const compatibilityResponse = await request(server)
      .get(`/api/config/import/${importId}/compatibility`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(compatibilityResponse.body.compatible).toBe(true);
    expect(compatibilityResponse.body.warnings).toBeDefined();
    expect(compatibilityResponse.body.unsupportedFeatures).toBeDefined();

    // Step 5: 配置字段映射
    const mappingConfig = {
      characters: {
        nameField: 'name',
        descriptionField: 'description',
        personalityField: 'personality',
        scenarioField: 'scenario',
        firstMessageField: 'first_mes',
        avatarField: 'avatar',
      },
      aiModels: {
        nameField: 'name',
        apiUrlField: 'api_url',
        modelField: 'openai_model',
        temperatureField: 'temp_openai',
        maxTokensField: 'openai_max_tokens',
      },
      chatSettings: {
        autoSaveField: 'auto_save_msg',
        maxContextField: 'openai_max_context',
        streamingField: 'stream_openai',
      },
    };

    const mappingResponse = await request(server)
      .put(`/api/config/import/${importId}/mapping`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ mapping: mappingConfig })
      .expect(200);

    expect(mappingResponse.body.status).toBe('mapped');

    // Step 6: 预览转换结果
    const previewResponse = await request(server)
      .get(`/api/config/import/${importId}/preview`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(previewResponse.body.convertedConfig).toBeTruthy();
    expect(previewResponse.body.convertedConfig.characters).toHaveLength(1);
    expect(previewResponse.body.statistics).toBeTruthy();

    // Step 7: 执行导入
    const importOptions = {
      createBackup: true,
      mergeStrategy: 'replace', // 'merge' | 'replace' | 'skip'
      importCharacters: true,
      importAiSettings: true,
      importChatSettings: true,
      importUiSettings: true,
      importExtensions: false, // 跳过扩展设置
    };

    const executeResponse = await request(server)
      .post(`/api/config/import/${importId}/execute`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(importOptions)
      .expect(200);

    expect(executeResponse.body.status).toBe('completed');
    expect(executeResponse.body.importedItems).toBeTruthy();
    expect(executeResponse.body.backupId).toBeTruthy();

    // Step 8: 验证导入结果
    // 验证角色是否正确导入
    const charactersResponse = await request(server)
      .get('/api/characters')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(charactersResponse.body.characters).toHaveLength(1);
    const importedCharacter = charactersResponse.body.characters[0];
    expect(importedCharacter.name).toBe('智能助手');
    expect(importedCharacter.description).toBe('一个友好的AI助手');

    // 验证高级配置是否正确导入
    const configResponse = await request(server)
      .get('/api/config/advanced')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(configResponse.body.config).toBeTruthy();
    expect(configResponse.body.config.aiModels).toHaveLength(1);
    expect(configResponse.body.config.aiModels[0].model).toBe('gpt-3.5-turbo');

    // Step 9: 验证备份创建
    const backupsResponse = await request(server)
      .get('/api/config/backups')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(backupsResponse.body.backups).toHaveLength(1);
    expect(backupsResponse.body.backups[0].source).toBe('sillytavern_import');
  });

  test('配置导出和重导入完整流程', async () => {
    // Step 1: 创建一些测试配置数据
    const testCharacter = await prisma.character.create({
      data: {
        userId: testUser.id,
        name: '导出测试角色',
        description: '用于测试配置导出的角色',
        personality: '测试性格',
        scenario: '测试场景',
        firstMessage: '导出测试消息',
        systemPrompt: '你是一个测试角色',
        is_public: false,
      },
    });

    const testConfig = await prisma.advancedConfig.create({
      data: {
        userId: testUser.id,
        name: '导出测试配置',
        category: 'ai_models',
        config: {
          model: 'gpt-4',
          temperature: 0.8,
          maxTokens: 2000,
          systemPrompt: '你是一个专业的AI助手',
          streaming: true,
        },
        isActive: true,
      },
    });

    // Step 2: 导出配置
    const exportResponse = await request(server)
      .post('/api/config/export')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        format: 'tavernai', // 'tavernai' | 'sillytavern' | 'json'
        includeCharacters: true,
        includeAiSettings: true,
        includeChatSettings: true,
        includeUiSettings: true,
        includeUserData: false, // 不包含敏感数据
        compression: true,
      })
      .expect(200);

    expect(exportResponse.body.exportId).toBeTruthy();
    expect(exportResponse.body.downloadUrl).toBeTruthy();

    // Step 3: 下载导出文件
    const downloadResponse = await request(server)
      .get(exportResponse.body.downloadUrl)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(downloadResponse.headers['content-type']).toContain('application/zip');

    // Step 4: 清理现有配置
    await prisma.character.delete({ where: { id: testCharacter.id } });
    await prisma.advancedConfig.delete({ where: { id: testConfig.id } });

    // Step 5: 保存导出文件并重新导入
    const exportFilePath = path.join(testConfigDir, 'exported-config.zip');
    await fs.writeFile(exportFilePath, downloadResponse.body);

    // Step 6: 重新导入
    const reimportResponse = await request(server)
      .post('/api/config/import/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('config', exportFilePath)
      .field('source', 'tavernai')
      .field('importType', 'file')
      .expect(200);

    const reimportId = reimportResponse.body.importId;

    // Step 7: 快速导入（跳过映射步骤，因为是同格式）
    const quickImportResponse = await request(server)
      .post(`/api/config/import/${reimportId}/quick-import`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        createBackup: true,
        mergeStrategy: 'merge',
      })
      .expect(200);

    expect(quickImportResponse.body.status).toBe('completed');

    // Step 8: 验证重导入结果
    const charactersResponse = await request(server)
      .get('/api/characters')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const reimportedCharacter = charactersResponse.body.characters.find(
      (c: any) => c.name === '导出测试角色'
    );
    expect(reimportedCharacter).toBeTruthy();
    expect(reimportedCharacter.description).toBe('用于测试配置导出的角色');

    const configResponse = await request(server)
      .get('/api/config/advanced')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const reimportedConfig = configResponse.body.configs.find(
      (c: any) => c.name === '导出测试配置'
    );
    expect(reimportedConfig).toBeTruthy();
    expect(reimportedConfig.config.model).toBe('gpt-4');
  });

  test('URL导入功能测试', async () => {
    // 模拟一个可访问的配置URL（实际测试中这应该是一个真实的URL）
    const configUrl = 'https://example.com/test-config.json';

    // Step 1: 通过URL导入配置
    const urlImportResponse = await request(server)
      .post('/api/config/import/url')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        url: configUrl,
        source: 'sillytavern',
        headers: {
          'User-Agent': 'TavernAI-Plus-Test',
        },
      })
      .expect(202); // 异步处理

    const importId = urlImportResponse.body.importId;
    expect(importId).toBeTruthy();

    // Step 2: 轮询导入状态
    let statusResponse;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
      statusResponse = await request(server)
        .get(`/api/config/import/${importId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      attempts++;
    } while (statusResponse.body.status === 'downloading' && attempts < maxAttempts);

    // 由于这是模拟URL，期望会失败，但测试流程应该正确
    expect(['downloaded', 'failed'].includes(statusResponse.body.status)).toBe(true);

    if (statusResponse.body.status === 'failed') {
      expect(statusResponse.body.error).toBeTruthy();
    }
  });

  test('配置模板系统测试', async () => {
    // Step 1: 创建配置模板
    const templateData = {
      name: 'GPT-4对话模板',
      description: '适用于日常对话的GPT-4配置模板',
      category: 'conversation',
      config: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1500,
        systemPrompt: '你是一个友好的AI助手，请用自然、对话式的语调回应用户。',
        streaming: true,
        presencePenalty: 0.1,
        frequencyPenalty: 0.1,
      },
      tags: ['gpt-4', '对话', '日常'],
      isPublic: false,
    };

    const createTemplateResponse = await request(server)
      .post('/api/config/templates')
      .set('Authorization', `Bearer ${authToken}`)
      .send(templateData)
      .expect(201);

    const templateId = createTemplateResponse.body.id;
    expect(createTemplateResponse.body.name).toBe(templateData.name);

    // Step 2: 获取模板列表
    const templatesResponse = await request(server)
      .get('/api/config/templates')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ category: 'conversation' })
      .expect(200);

    expect(templatesResponse.body.templates).toHaveLength(1);
    expect(templatesResponse.body.templates[0].id).toBe(templateId);

    // Step 3: 应用模板
    const applyTemplateResponse = await request(server)
      .post(`/api/config/templates/${templateId}/apply`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        targetConfigId: null, // 创建新配置
        customizations: {
          name: '我的GPT-4配置',
          temperature: 0.8, // 覆盖模板值
        },
      })
      .expect(200);

    const appliedConfigId = applyTemplateResponse.body.configId;
    expect(appliedConfigId).toBeTruthy();

    // Step 4: 验证应用结果
    const configResponse = await request(server)
      .get(`/api/config/advanced/${appliedConfigId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(configResponse.body.name).toBe('我的GPT-4配置');
    expect(configResponse.body.config.model).toBe('gpt-4');
    expect(configResponse.body.config.temperature).toBe(0.8); // 自定义值
    expect(configResponse.body.config.maxTokens).toBe(1500); // 模板值

    // Step 5: 更新模板
    const updateTemplateResponse = await request(server)
      .put(`/api/config/templates/${templateId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        description: '更新后的GPT-4对话模板',
        config: {
          ...templateData.config,
          temperature: 0.9,
        },
      })
      .expect(200);

    expect(updateTemplateResponse.body.description).toBe('更新后的GPT-4对话模板');

    // Step 6: 删除模板
    await request(server)
      .delete(`/api/config/templates/${templateId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Step 7: 验证删除
    await request(server)
      .get(`/api/config/templates/${templateId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });

  test('配置备份和恢复测试', async () => {
    // Step 1: 创建一些配置数据
    const configToBackup = await prisma.advancedConfig.create({
      data: {
        userId: testUser.id,
        name: '备份测试配置',
        category: 'ai_models',
        config: {
          model: 'claude-3',
          temperature: 0.6,
          maxTokens: 4000,
        },
        isActive: true,
      },
    });

    // Step 2: 创建手动备份
    const backupResponse = await request(server)
      .post('/api/config/backups')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: '手动备份测试',
        description: '测试手动备份功能',
        includeCharacters: true,
        includeConfigs: true,
      })
      .expect(201);

    const backupId = backupResponse.body.id;
    expect(backupResponse.body.name).toBe('手动备份测试');

    // Step 3: 修改配置
    await prisma.advancedConfig.update({
      where: { id: configToBackup.id },
      data: {
        config: {
          model: 'gpt-4',
          temperature: 0.9,
          maxTokens: 2000,
        },
      },
    });

    // Step 4: 从备份恢复
    const restoreResponse = await request(server)
      .post(`/api/config/backups/${backupId}/restore`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        restoreType: 'full', // 'full' | 'selective'
        createBackupBeforeRestore: true,
      })
      .expect(200);

    expect(restoreResponse.body.status).toBe('completed');
    expect(restoreResponse.body.preRestoreBackupId).toBeTruthy();

    // Step 5: 验证恢复结果
    const restoredConfig = await prisma.advancedConfig.findUnique({
      where: { id: configToBackup.id },
    });

    expect(restoredConfig?.config).toEqual({
      model: 'claude-3',
      temperature: 0.6,
      maxTokens: 4000,
    });

    // Step 6: 获取备份列表
    const backupsResponse = await request(server)
      .get('/api/config/backups')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(backupsResponse.body.backups.length).toBeGreaterThanOrEqual(2); // 原备份 + 恢复前备份

    // Step 7: 删除备份
    await request(server)
      .delete(`/api/config/backups/${backupId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });
});