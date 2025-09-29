import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as clientIO, Socket } from 'socket.io-client';
import EventSource from 'eventsource';
import { app } from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { initRedis, closeRedis } from '../../apps/api/src/lib/redis';
import { initializeWebSocket } from '../../apps/api/src/lib/websocket';

describe('流式对话完整流程集成测试', () => {
  let server: any;
  let httpServer: any;
  let wsServer: Server;
  let clientSocket: Socket;
  let testUser: any;
  let authToken: string;
  let testCharacter: any;
  let chatSession: any;

  beforeAll(async () => {
    // 初始化测试环境
    await initRedis();

    // 创建HTTP服务器
    httpServer = createServer(app);
    wsServer = await initializeWebSocket(httpServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, resolve);
    });

    const port = httpServer.address()?.port;
    server = `http://localhost:${port}`;

    // 创建测试用户
    testUser = await prisma.user.create({
      data: {
        username: 'streamtest_user',
        email: 'streamtest@example.com',
        passwordHash: 'test_hash',
        is_active: true,
        is_verified: true,
      },
    });

    // 创建测试角色
    testCharacter = await prisma.character.create({
      data: {
        userId: testUser.id,
        name: '流式测试助手',
        description: '专门用于测试流式对话的AI助手',
        personality: '友好、耐心、乐于助人',
        scenario: '在一个测试环境中与用户进行流式对话',
        firstMessage: '你好！我是流式测试助手，准备开始测试吗？',
        systemPrompt: '你是一个测试助手，请配合进行流式对话测试。',
        is_public: false,
      },
    });

    // 获取认证令牌
    const loginResponse = await request(server)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'test_password', // 这里应该匹配实际的密码验证逻辑
      });

    authToken = loginResponse.body.token || 'mock_token_for_test';
  });

  afterAll(async () => {
    // 清理测试数据
    if (testUser) {
      await prisma.character.deleteMany({ where: { userId: testUser.id } });
      await prisma.chatSession.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }

    // 关闭连接
    if (clientSocket) {
      clientSocket.close();
    }
    if (httpServer) {
      httpServer.close();
    }
    await closeRedis();
  });

  beforeEach(async () => {
    // 为每个测试创建新的聊天会话
    chatSession = await prisma.chatSession.create({
      data: {
        userId: testUser.id,
        title: '流式测试会话',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000,
        isActive: true,
      },
    });

    // 建立WebSocket连接
    clientSocket = clientIO(server, {
      auth: {
        token: authToken,
      },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      clientSocket.on('connect', resolve);
    });
  });

  afterEach(async () => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.close();
    }

    // 清理会话数据
    if (chatSession) {
      await prisma.chatMessage.deleteMany({ where: { sessionId: chatSession.id } });
      await prisma.chatSession.delete({ where: { id: chatSession.id } });
    }
  });

  test('完整流式对话流程: 创建会话 → 建立连接 → 流式输出 → 正常结束', async () => {
    // Step 1: 加入聊天会话
    const joinPromise = new Promise<void>((resolve) => {
      clientSocket.on('session_joined', (data) => {
        expect(data.sessionId).toBe(chatSession.id);
        resolve();
      });
    });

    clientSocket.emit('join_session', {
      sessionId: chatSession.id,
      metadata: { testMode: true },
    });

    await joinPromise;

    // Step 2: 建立流式连接
    const streamingResponse = await request(server)
      .post('/api/streaming/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        sessionId: chatSession.id,
        characterId: testCharacter.id,
        message: '请开始一个流式对话测试',
      })
      .expect(200);

    const streamingSessionId = streamingResponse.body.sessionId;
    expect(streamingSessionId).toBeTruthy();

    // Step 3: 监听流式输出
    const streamUrl = `${server}/api/streaming/stream/${streamingSessionId}`;
    const eventSource = new EventSource(streamUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const streamingData: any[] = [];
    const streamingPromise = new Promise<void>((resolve, reject) => {
      let hasStarted = false;
      const timeout = setTimeout(() => {
        reject(new Error('流式输出超时'));
      }, 10000);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          streamingData.push(data);

          if (data.type === 'start') {
            hasStarted = true;
            expect(data.sessionId).toBe(streamingSessionId);
          } else if (data.type === 'chunk') {
            expect(hasStarted).toBe(true);
            expect(data.content).toBeTruthy();
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

      eventSource.onerror = (error) => {
        clearTimeout(timeout);
        eventSource.close();
        reject(error);
      };
    });

    await streamingPromise;

    // Step 4: 验证流式数据
    expect(streamingData.length).toBeGreaterThan(0);
    expect(streamingData[0].type).toBe('start');
    expect(streamingData[streamingData.length - 1].type).toBe('done');

    // 验证包含内容块
    const contentChunks = streamingData.filter(d => d.type === 'chunk');
    expect(contentChunks.length).toBeGreaterThan(0);

    // Step 5: 验证最终消息保存到数据库
    const savedMessage = await prisma.chatMessage.findFirst({
      where: {
        sessionId: chatSession.id,
        type: 'assistant',
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(savedMessage).toBeTruthy();
    expect(savedMessage?.content).toBeTruthy();

    // Step 6: 验证WebSocket通知
    const wsMessagePromise = new Promise<void>((resolve) => {
      clientSocket.on('new_message', (data) => {
        expect(data.sessionId).toBe(chatSession.id);
        expect(data.type).toBe('assistant');
        resolve();
      });
    });

    await wsMessagePromise;
  });

  test('流式对话中断与重连流程', async () => {
    // Step 1: 加入会话
    clientSocket.emit('join_session', { sessionId: chatSession.id });

    await new Promise<void>((resolve) => {
      clientSocket.on('session_joined', resolve);
    });

    // Step 2: 开始流式对话
    const streamingResponse = await request(server)
      .post('/api/streaming/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        sessionId: chatSession.id,
        characterId: testCharacter.id,
        message: '请开始一个较长的流式对话，我们要测试中断功能',
      })
      .expect(200);

    const streamingSessionId = streamingResponse.body.sessionId;

    // Step 3: 建立流式连接
    const streamUrl = `${server}/api/streaming/stream/${streamingSessionId}`;
    let eventSource = new EventSource(streamUrl, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const firstChunks: any[] = [];
    let interruptedSessionId: string;

    // Step 4: 收集一些数据后中断
    const interruptPromise = new Promise<void>((resolve, reject) => {
      let chunkCount = 0;
      const timeout = setTimeout(() => {
        reject(new Error('未能及时收到足够的流式数据'));
      }, 5000);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          firstChunks.push(data);

          if (data.type === 'chunk') {
            chunkCount++;
            if (chunkCount >= 3) {
              // 收到3个数据块后中断
              interruptedSessionId = data.sessionId;
              clearTimeout(timeout);
              eventSource.close();
              resolve();
            }
          }
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };
    });

    await interruptPromise;

    // Step 5: 请求中断流式输出
    await request(server)
      .post(`/api/streaming/sessions/${streamingSessionId}/interrupt`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Step 6: 重新连接并继续
    const reconnectResponse = await request(server)
      .post(`/api/streaming/sessions/${streamingSessionId}/reconnect`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(reconnectResponse.body.sessionId).toBe(streamingSessionId);

    // Step 7: 重新建立流式连接
    eventSource = new EventSource(streamUrl, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const reconnectData: any[] = [];
    const reconnectPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('重连后流式输出超时'));
      }, 10000);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          reconnectData.push(data);

          if (data.type === 'done') {
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

      eventSource.onerror = (error) => {
        clearTimeout(timeout);
        eventSource.close();
        reject(error);
      };
    });

    await reconnectPromise;

    // Step 8: 验证中断和重连
    expect(firstChunks.length).toBeGreaterThan(0);
    expect(reconnectData.length).toBeGreaterThan(0);
    expect(reconnectData[reconnectData.length - 1].type).toBe('done');

    // 验证最终消息完整性
    const finalMessage = await prisma.chatMessage.findFirst({
      where: {
        sessionId: chatSession.id,
        type: 'assistant',
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(finalMessage).toBeTruthy();
    expect(finalMessage?.content.length).toBeGreaterThan(0);
  });

  test('多用户同时流式对话不干扰', async () => {
    // 创建第二个测试用户
    const secondUser = await prisma.user.create({
      data: {
        username: 'streamtest_user2',
        email: 'streamtest2@example.com',
        passwordHash: 'test_hash',
        is_active: true,
        is_verified: true,
      },
    });

    const secondSession = await prisma.chatSession.create({
      data: {
        userId: secondUser.id,
        title: '第二个流式测试会话',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000,
        isActive: true,
      },
    });

    try {
      // 建立两个WebSocket连接
      const secondSocket = clientIO(server, {
        auth: { token: 'mock_token_user2' },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        secondSocket.on('connect', resolve);
      });

      // 两个用户同时加入各自的会话
      clientSocket.emit('join_session', { sessionId: chatSession.id });
      secondSocket.emit('join_session', { sessionId: secondSession.id });

      await Promise.all([
        new Promise<void>((resolve) => {
          clientSocket.on('session_joined', resolve);
        }),
        new Promise<void>((resolve) => {
          secondSocket.on('session_joined', resolve);
        }),
      ]);

      // 同时开始流式对话
      const [stream1Response, stream2Response] = await Promise.all([
        request(server)
          .post('/api/streaming/sessions')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            sessionId: chatSession.id,
            characterId: testCharacter.id,
            message: '用户1的流式测试消息',
          }),
        request(server)
          .post('/api/streaming/sessions')
          .set('Authorization', `Bearer mock_token_user2`)
          .send({
            sessionId: secondSession.id,
            characterId: testCharacter.id,
            message: '用户2的流式测试消息',
          }),
      ]);

      expect(stream1Response.status).toBe(200);
      expect(stream2Response.status).toBe(200);

      const sessionId1 = stream1Response.body.sessionId;
      const sessionId2 = stream2Response.body.sessionId;

      expect(sessionId1).not.toBe(sessionId2);

      // 监听两个WebSocket的消息，确保不会交叉
      const user1Messages: any[] = [];
      const user2Messages: any[] = [];

      clientSocket.on('new_message', (data) => {
        user1Messages.push(data);
      });

      secondSocket.on('new_message', (data) => {
        user2Messages.push(data);
      });

      // 等待一段时间让流式输出完成
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 验证消息隔离
      user1Messages.forEach(msg => {
        expect(msg.sessionId).toBe(chatSession.id);
      });

      user2Messages.forEach(msg => {
        expect(msg.sessionId).toBe(secondSession.id);
      });

      secondSocket.close();
    } finally {
      // 清理第二个用户数据
      await prisma.chatSession.delete({ where: { id: secondSession.id } });
      await prisma.user.delete({ where: { id: secondUser.id } });
    }
  });

  test('流式对话性能指标验证', async () => {
    // 加入会话
    clientSocket.emit('join_session', { sessionId: chatSession.id });
    await new Promise<void>((resolve) => {
      clientSocket.on('session_joined', resolve);
    });

    const startTime = Date.now();

    // 开始流式对话
    const streamingResponse = await request(server)
      .post('/api/streaming/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        sessionId: chatSession.id,
        characterId: testCharacter.id,
        message: '请进行一个性能测试对话',
      })
      .expect(200);

    const streamingSessionId = streamingResponse.body.sessionId;
    const streamUrl = `${server}/api/streaming/stream/${streamingSessionId}`;

    // 监听流式输出并记录性能指标
    const performanceMetrics = {
      firstChunkTime: 0,
      totalChunks: 0,
      totalBytes: 0,
      chunkIntervals: [] as number[],
      lastChunkTime: 0,
    };

    const eventSource = new EventSource(streamUrl, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const performancePromise = new Promise<void>((resolve, reject) => {
      let lastTime = startTime;
      const timeout = setTimeout(() => {
        reject(new Error('性能测试超时'));
      }, 15000);

      eventSource.onmessage = (event) => {
        try {
          const now = Date.now();
          const data = JSON.parse(event.data);

          if (data.type === 'chunk') {
            if (performanceMetrics.firstChunkTime === 0) {
              performanceMetrics.firstChunkTime = now - startTime;
            }

            performanceMetrics.totalChunks++;
            performanceMetrics.totalBytes += event.data.length;
            performanceMetrics.chunkIntervals.push(now - lastTime);
            performanceMetrics.lastChunkTime = now - startTime;
            lastTime = now;
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

      eventSource.onerror = (error) => {
        clearTimeout(timeout);
        eventSource.close();
        reject(error);
      };
    });

    await performancePromise;

    // 验证性能指标
    expect(performanceMetrics.firstChunkTime).toBeLessThan(2000); // 首块延迟 < 2秒
    expect(performanceMetrics.totalChunks).toBeGreaterThan(0);
    expect(performanceMetrics.totalBytes).toBeGreaterThan(0);

    // 计算平均块间隔
    const avgInterval = performanceMetrics.chunkIntervals.reduce((a, b) => a + b, 0) / performanceMetrics.chunkIntervals.length;
    expect(avgInterval).toBeLessThan(500); // 平均块间隔 < 500ms

    console.log('流式对话性能指标:', {
      首块延迟: `${performanceMetrics.firstChunkTime}ms`,
      总块数: performanceMetrics.totalChunks,
      总字节数: performanceMetrics.totalBytes,
      平均块间隔: `${avgInterval.toFixed(2)}ms`,
      总持续时间: `${performanceMetrics.lastChunkTime}ms`,
    });
  });
});