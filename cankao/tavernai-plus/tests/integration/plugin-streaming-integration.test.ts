import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import fs from 'fs/promises';
import path from 'path';
import EventSource from 'eventsource';
import { app } from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { initRedis, closeRedis } from '../../apps/api/src/lib/redis';

describe('插件与流式输出交互集成测试', () => {
  let server: any;
  let testUser: any;
  let authToken: string;
  let testExtension: any;
  let testCharacter: any;
  let chatSession: any;
  let testPluginPath: string;

  beforeAll(async () => {
    await initRedis();
    server = app;

    // 创建测试用户
    testUser = await prisma.user.create({
      data: {
        username: 'plugin_stream_user',
        email: 'pluginstream@example.com',
        passwordHash: 'test_hash',
        is_active: true,
        is_verified: true,
        role: 'user',
      },
    });

    authToken = 'mock_plugin_stream_token';

    // 创建测试角色
    testCharacter = await prisma.character.create({
      data: {
        userId: testUser.id,
        name: '流式插件测试助手',
        description: '用于测试插件和流式输出交互的AI助手',
        personality: '技术性、详细、支持插件功能',
        scenario: '在一个支持插件的聊天环境中与用户交互',
        firstMessage: '你好！我支持插件增强功能，准备测试吗？',
        systemPrompt: '你是一个支持插件的AI助手，可以配合插件进行功能增强。',
        is_public: false,
      },
    });

    // 创建流式输出拦截插件
    await createStreamInterceptorPlugin();
  });

  afterAll(async () => {
    // 清理测试数据
    if (testUser) {
      await prisma.extensionInstallation.deleteMany({ where: { userId: testUser.id } });
      await prisma.character.deleteMany({ where: { userId: testUser.id } });
      await prisma.chatSession.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }

    if (testExtension) {
      await prisma.extension.delete({ where: { id: testExtension.id } });
    }

    // 清理测试文件
    try {
      await fs.rm(testPluginPath, { recursive: true, force: true });
    } catch (error) {
      // 忽略清理错误
    }

    await closeRedis();
  });

  beforeEach(async () => {
    // 为每个测试创建新的聊天会话
    chatSession = await prisma.chatSession.create({
      data: {
        userId: testUser.id,
        title: '插件流式测试会话',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000,
        isActive: true,
      },
    });
  });

  afterEach(async () => {
    if (chatSession) {
      await prisma.chatMessage.deleteMany({ where: { sessionId: chatSession.id } });
      await prisma.chatSession.delete({ where: { id: chatSession.id } });
    }
  });

  async function createStreamInterceptorPlugin() {
    // 创建流式输出拦截插件
    testPluginPath = path.join(process.cwd(), 'test-data', 'stream-interceptor-plugin');
    await fs.mkdir(testPluginPath, { recursive: true });

    const manifest = {
      name: 'Stream Interceptor Plugin',
      version: '1.0.0',
      description: '拦截和修改流式输出的插件',
      author: 'Test Author',
      license: 'MIT',
      main: 'index.js',
      permissions: ['access_conversations', 'modify_conversations', 'ui_modification'],
      hooks: {
        'streaming.chunk': 'onStreamingChunk',
        'streaming.start': 'onStreamingStart',
        'streaming.end': 'onStreamingEnd',
      },
    };

    await fs.writeFile(
      path.join(testPluginPath, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    const pluginCode = `
class StreamInterceptorPlugin {
  constructor() {
    this.name = 'Stream Interceptor Plugin';
    this.chunkCount = 0;
    this.interceptedContent = [];
  }

  async activate() {
    console.log('Stream Interceptor Plugin activated');
    this.chunkCount = 0;
    this.interceptedContent = [];
    return true;
  }

  async deactivate() {
    console.log('Stream Interceptor Plugin deactivated');
    return true;
  }

  // 拦截流式输出开始
  async onStreamingStart(data) {
    console.log('Plugin: Streaming started', data.sessionId);
    this.chunkCount = 0;
    this.interceptedContent = [];

    // 可以修改流式输出的初始参数
    return {
      ...data,
      metadata: {
        ...data.metadata,
        pluginIntercepted: true,
        interceptorName: this.name,
      },
    };
  }

  // 拦截每个流式数据块
  async onStreamingChunk(chunk) {
    this.chunkCount++;
    console.log(\`Plugin: Processing chunk \${this.chunkCount}\`, chunk.content?.substring(0, 50));

    // 存储原始内容
    this.interceptedContent.push(chunk.content);

    // 修改内容 - 添加插件标记
    let modifiedContent = chunk.content;

    // 每5个chunk添加一个插件标记
    if (this.chunkCount % 5 === 0) {
      modifiedContent += ' [🔌Plugin-Enhanced]';
    }

    // 在特定关键词后添加增强信息
    if (modifiedContent.includes('测试')) {
      modifiedContent = modifiedContent.replace('测试', '测试✨[插件增强]');
    }

    return {
      ...chunk,
      content: modifiedContent,
      metadata: {
        ...chunk.metadata,
        pluginProcessed: true,
        chunkNumber: this.chunkCount,
        originalLength: chunk.content?.length || 0,
        modifiedLength: modifiedContent?.length || 0,
      },
    };
  }

  // 拦截流式输出结束
  async onStreamingEnd(data) {
    console.log(\`Plugin: Streaming ended, processed \${this.chunkCount} chunks\`);

    // 可以在结束时添加总结信息
    const summary = {
      totalChunks: this.chunkCount,
      totalContent: this.interceptedContent.join(''),
      processingComplete: true,
    };

    return {
      ...data,
      metadata: {
        ...data.metadata,
        pluginSummary: summary,
      },
    };
  }

  // 获取拦截统计
  getInterceptionStats() {
    return {
      chunkCount: this.chunkCount,
      contentLength: this.interceptedContent.join('').length,
      interceptedContent: this.interceptedContent,
    };
  }

  // 配置选项
  getConfigSchema() {
    return {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
          title: '启用插件',
          default: true,
        },
        enhancementMode: {
          type: 'string',
          title: '增强模式',
          enum: ['minimal', 'standard', 'aggressive'],
          default: 'standard',
        },
        addMarkersEvery: {
          type: 'number',
          title: '标记间隔（chunk数）',
          minimum: 1,
          maximum: 20,
          default: 5,
        },
      },
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StreamInterceptorPlugin;
} else {
  window.StreamInterceptorPlugin = StreamInterceptorPlugin;
}
`;

    await fs.writeFile(path.join(testPluginPath, 'index.js'), pluginCode);

    // 创建插件压缩包并上传
    const archiver = require('archiver');
    const zipPath = path.join(process.cwd(), 'test-data', 'stream-interceptor-plugin.zip');

    await new Promise<void>((resolve, reject) => {
      const output = require('fs').createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(testPluginPath, false);
      archive.finalize();
    });

    // 上传插件到系统
    const createResponse = await request(server)
      .post('/api/extensions')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('plugin', zipPath)
      .field('category', 'enhancement')
      .expect(201);

    testExtension = createResponse.body;

    // 安装插件
    await request(server)
      .post(`/api/extensions/${testExtension.id}/install`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        grantedPermissions: ['access_conversations', 'modify_conversations', 'ui_modification'],
        autoUpdate: false,
      })
      .expect(200);

    console.log('流式拦截插件创建并安装完成');
  }

  test('插件拦截和修改流式输出内容', async () => {
    // Step 1: 开始流式对话
    const streamingResponse = await request(server)
      .post('/api/streaming/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        sessionId: chatSession.id,
        characterId: testCharacter.id,
        message: '请进行一个包含"测试"关键词的详细对话，让我看看插件如何增强流式输出',
        enablePlugins: true, // 启用插件处理
      })
      .expect(200);

    const streamingSessionId = streamingResponse.body.sessionId;
    expect(streamingSessionId).toBeTruthy();

    // Step 2: 监听流式输出并验证插件拦截
    const streamUrl = `${server}/api/streaming/stream/${streamingSessionId}`;
    const eventSource = new EventSource(streamUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const streamingData: any[] = [];
    let pluginEnhancedChunks = 0;
    let testKeywordEnhanced = false;

    const streamingPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('流式输出超时'));
      }, 15000);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          streamingData.push(data);

          if (data.type === 'start') {
            // 验证插件开始处理
            expect(data.metadata?.pluginIntercepted).toBe(true);
            expect(data.metadata?.interceptorName).toBe('Stream Interceptor Plugin');
          } else if (data.type === 'chunk') {
            // 验证插件处理
            expect(data.metadata?.pluginProcessed).toBe(true);
            expect(data.metadata?.chunkNumber).toBeGreaterThan(0);

            // 检查插件标记
            if (data.content?.includes('[🔌Plugin-Enhanced]')) {
              pluginEnhancedChunks++;
            }

            // 检查关键词增强
            if (data.content?.includes('测试✨[插件增强]')) {
              testKeywordEnhanced = true;
            }
          } else if (data.type === 'done') {
            // 验证插件结束处理
            expect(data.metadata?.pluginSummary).toBeTruthy();
            expect(data.metadata?.pluginSummary?.processingComplete).toBe(true);

            clearTimeout(timeout);
            eventSource.close();
            resolve();
          } else if (data.type === 'error') {
            clearTimeout(timeout);
            eventSource.close();
            reject(new Error(data.error));
          }
        } catch (error) {
          clearTimeout(timeout);
          eventSource.close();
          reject(error);
        }
      };

      eventSource.onerror = (error) => {
        clearTimeout(timeout);
        eventSource.close();
        reject(error);
      };
    });

    await streamingPromise;

    // Step 3: 验证插件拦截效果
    expect(streamingData.length).toBeGreaterThan(0);
    expect(pluginEnhancedChunks).toBeGreaterThan(0); // 应该有插件增强的块
    expect(testKeywordEnhanced).toBe(true); // 关键词应该被增强

    const startData = streamingData.find(d => d.type === 'start');
    const endData = streamingData.find(d => d.type === 'done');
    const chunkData = streamingData.filter(d => d.type === 'chunk');

    expect(startData.metadata.pluginIntercepted).toBe(true);
    expect(endData.metadata.pluginSummary.totalChunks).toBe(chunkData.length);

    // Step 4: 验证最终消息保存
    const savedMessage = await prisma.chatMessage.findFirst({
      where: {
        sessionId: chatSession.id,
        type: 'assistant',
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(savedMessage).toBeTruthy();
    expect(savedMessage?.content).toContain('测试✨[插件增强]'); // 增强的内容应该保存
  });

  test('插件配置影响流式输出处理', async () => {
    // Step 1: 修改插件配置
    const configResponse = await request(server)
      .put(`/api/extensions/${testExtension.id}/config`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        enabled: true,
        enhancementMode: 'aggressive',
        addMarkersEvery: 2, // 每2个chunk添加标记
      })
      .expect(200);

    expect(configResponse.body.config.addMarkersEvery).toBe(2);

    // Step 2: 开始流式对话
    const streamingResponse = await request(server)
      .post('/api/streaming/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        sessionId: chatSession.id,
        characterId: testCharacter.id,
        message: '请进行一个较长的对话来测试插件的aggressive模式配置',
        enablePlugins: true,
      })
      .expect(200);

    const streamingSessionId = streamingResponse.body.sessionId;

    // Step 3: 监听并验证配置效果
    const streamUrl = `${server}/api/streaming/stream/${streamingSessionId}`;
    const eventSource = new EventSource(streamUrl, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    let enhancedChunkCount = 0;
    let totalChunkCount = 0;

    const configTestPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('配置测试超时'));
      }, 10000);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'chunk') {
            totalChunkCount++;

            // 根据新配置，每2个chunk应该有增强标记
            if (data.content?.includes('[🔌Plugin-Enhanced]')) {
              enhancedChunkCount++;
            }
          } else if (data.type === 'done') {
            clearTimeout(timeout);
            eventSource.close();
            resolve();
          }
        } catch (error) {
          clearTimeout(timeout);
          eventSource.close();
          reject(error);
        }
      };
    });

    await configTestPromise;

    // 验证配置生效：每2个chunk有增强，所以增强数应该约为总数的一半
    const expectedEnhanced = Math.floor(totalChunkCount / 2);
    expect(enhancedChunkCount).toBeGreaterThanOrEqual(expectedEnhanced - 1);
    expect(enhancedChunkCount).toBeLessThanOrEqual(expectedEnhanced + 1);
  });

  test('多个插件同时处理流式输出', async () => {
    // 这里模拟多插件场景，实际实现中会有插件链处理
    // 为了测试，我们验证单个插件的处理流程是否支持扩展

    // Step 1: 获取插件处理统计
    const statsResponse = await request(server)
      .get(`/api/extensions/${testExtension.id}/stats`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(statsResponse.body.stats).toBeTruthy();

    // Step 2: 开始监控多插件兼容性的流式对话
    const streamingResponse = await request(server)
      .post('/api/streaming/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        sessionId: chatSession.id,
        characterId: testCharacter.id,
        message: '测试多插件处理兼容性',
        enablePlugins: true,
        pluginChain: [testExtension.id], // 插件处理链
      })
      .expect(200);

    const streamingSessionId = streamingResponse.body.sessionId;

    // Step 3: 验证插件链处理
    const streamUrl = `${server}/api/streaming/stream/${streamingSessionId}`;
    const eventSource = new EventSource(streamUrl, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    let chainProcessed = false;

    const chainTestPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('插件链测试超时'));
      }, 8000);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'chunk' && data.metadata?.pluginProcessed) {
            chainProcessed = true;
          } else if (data.type === 'done') {
            clearTimeout(timeout);
            eventSource.close();
            resolve();
          }
        } catch (error) {
          clearTimeout(timeout);
          eventSource.close();
          reject(error);
        }
      };
    });

    await chainTestPromise;

    expect(chainProcessed).toBe(true);
  });

  test('插件错误处理和流式输出恢复', async () => {
    // Step 1: 模拟插件错误（通过错误的配置）
    await request(server)
      .put(`/api/extensions/${testExtension.id}/config`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        enabled: true,
        enhancementMode: 'invalid_mode', // 无效配置
        addMarkersEvery: -1, // 无效值
      })
      .expect(400); // 应该拒绝无效配置

    // Step 2: 验证插件错误不影响基本流式输出
    const streamingResponse = await request(server)
      .post('/api/streaming/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        sessionId: chatSession.id,
        characterId: testCharacter.id,
        message: '测试插件错误时的流式输出恢复',
        enablePlugins: true,
        gracefulFallback: true, // 启用优雅降级
      })
      .expect(200);

    const streamingSessionId = streamingResponse.body.sessionId;

    // Step 3: 验证流式输出仍然工作
    const streamUrl = `${server}/api/streaming/stream/${streamingSessionId}`;
    const eventSource = new EventSource(streamUrl, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    let streamingWorked = false;

    const errorRecoveryPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('错误恢复测试超时'));
      }, 8000);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'chunk') {
            streamingWorked = true;
          } else if (data.type === 'done') {
            clearTimeout(timeout);
            eventSource.close();
            resolve();
          } else if (data.type === 'error') {
            clearTimeout(timeout);
            eventSource.close();
            reject(new Error(data.error));
          }
        } catch (error) {
          clearTimeout(timeout);
          eventSource.close();
          reject(error);
        }
      };
    });

    await errorRecoveryPromise;

    expect(streamingWorked).toBe(true); // 流式输出应该正常工作
  });
});