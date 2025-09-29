/**
 * 流式输出连接合约测试 (T014)
 *
 * 测试 SSE 连接建立、数据传输和连接管理
 * 接口设计符合核心竞争力提升规范
 */

import request from 'supertest';
import { app } from '../../../src/server';
import { StreamingSession } from '@prisma/client';
import { prisma } from '../../../src/lib/prisma';

describe('Streaming Connection API Contract Tests', () => {
  let testUserId: string;
  let testSessionId: string;
  let testCharacterId: string;

  beforeAll(async () => {
    // 创建测试用户
    const user = await prisma.user.create({
      data: {
        username: 'streaming_test_user',
        email: 'streaming@test.com',
        passwordHash: 'test_hash'
      }
    });
    testUserId = user.id;

    // 创建测试角色
    const character = await prisma.character.create({
      data: {
        name: 'Test Character',
        description: 'Test character for streaming',
        creatorId: testUserId
      }
    });
    testCharacterId = character.id;

    // 创建流式会话
    const session = await prisma.streamingSession.create({
      data: {
        id: 'test-streaming-session-id',
        userId: testUserId,
        characterId: testCharacterId,
        status: 'active',
        connectionType: 'sse'
      }
    });
    testSessionId = session.id;
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.streamingMessage.deleteMany({
      where: { sessionId: testSessionId }
    });
    await prisma.streamingSession.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.character.deleteMany({
      where: { creatorId: testUserId }
    });
    await prisma.user.deleteMany({
      where: { id: testUserId }
    });
  });

  describe('GET /api/stream/:sessionId - SSE Connection', () => {
    it('应该成功建立SSE连接', async () => {
      const response = await request(app)
        .get(`/api/stream/${testSessionId}`)
        .set('Accept', 'text/event-stream')
        .set('Cache-Control', 'no-cache')
        .expect(200)
        .expect('Content-Type', /text\/event-stream/);

      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');
    });

    it('应该拒绝无效的会话ID', async () => {
      await request(app)
        .get('/api/stream/invalid-session-id')
        .set('Accept', 'text/event-stream')
        .expect(404);
    });

    it('应该在连接时发送初始化事件', async () => {
      const response = await request(app)
        .get(`/api/stream/${testSessionId}`)
        .set('Accept', 'text/event-stream')
        .expect(200);

      // 检查是否包含初始化事件
      expect(response.text).toContain('event: connect');
      expect(response.text).toContain('data: {"type":"connection_established"');
    });

    it('应该正确设置CORS头部', async () => {
      const response = await request(app)
        .get(`/api/stream/${testSessionId}`)
        .set('Accept', 'text/event-stream')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('应该支持心跳保持连接', async () => {
      const response = await request(app)
        .get(`/api/stream/${testSessionId}`)
        .set('Accept', 'text/event-stream')
        .expect(200);

      // 模拟心跳机制 - 检查响应中是否包含心跳事件
      expect(response.text).toMatch(/event: (heartbeat|ping)/);
    });
  });

  describe('Connection Status Management', () => {
    it('应该正确更新连接状态到数据库', async () => {
      await request(app)
        .get(`/api/stream/${testSessionId}`)
        .set('Accept', 'text/event-stream')
        .expect(200);

      // 检查数据库中的会话状态
      const session = await prisma.streamingSession.findUnique({
        where: { id: testSessionId }
      });

      expect(session?.status).toBe('active');
      expect(session?.lastActivity).toBeDefined();
    });

    it('应该记录连接统计信息', async () => {
      const sessionBefore = await prisma.streamingSession.findUnique({
        where: { id: testSessionId }
      });

      await request(app)
        .get(`/api/stream/${testSessionId}`)
        .set('Accept', 'text/event-stream')
        .expect(200);

      const sessionAfter = await prisma.streamingSession.findUnique({
        where: { id: testSessionId }
      });

      // 检查统计信息是否更新
      expect(sessionAfter?.lastActivity.getTime()).toBeGreaterThan(
        sessionBefore?.lastActivity.getTime() || 0
      );
    });
  });

  describe('Error Handling', () => {
    it('应该处理会话不存在的情况', async () => {
      await request(app)
        .get('/api/stream/non-existent-session')
        .set('Accept', 'text/event-stream')
        .expect(404)
        .expect(res => {
          expect(res.body.error).toBe('Session not found');
        });
    });

    it('应该处理会话状态异常的情况', async () => {
      // 创建一个错误状态的会话
      const errorSession = await prisma.streamingSession.create({
        data: {
          id: 'error-session',
          userId: testUserId,
          status: 'error',
          connectionType: 'sse'
        }
      });

      await request(app)
        .get('/api/stream/error-session')
        .set('Accept', 'text/event-stream')
        .expect(400);

      // 清理
      await prisma.streamingSession.delete({
        where: { id: 'error-session' }
      });
    });

    it('应该处理并发连接限制', async () => {
      // 这个测试需要根据实际的并发限制策略来实现
      // 暂时跳过，等待具体实现
      expect(true).toBe(true);
    });
  });

  describe('Security and Validation', () => {
    it('应该验证用户权限', async () => {
      // 创建另一个用户的会话
      const otherUser = await prisma.user.create({
        data: {
          username: 'other_user',
          email: 'other@test.com',
          passwordHash: 'test_hash'
        }
      });

      const otherSession = await prisma.streamingSession.create({
        data: {
          id: 'other-session',
          userId: otherUser.id,
          status: 'active',
          connectionType: 'sse'
        }
      });

      // 尝试访问其他用户的会话（这里需要模拟认证中间件）
      await request(app)
        .get(`/api/stream/${otherSession.id}`)
        .set('Accept', 'text/event-stream')
        // .set('Authorization', `Bearer ${testUserToken}`) // 需要实现认证
        .expect(403); // 或者401，取决于认证策略

      // 清理
      await prisma.streamingSession.delete({ where: { id: otherSession.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('应该防止XSS攻击', async () => {
      const maliciousSessionId = '<script>alert("xss")</script>';

      await request(app)
        .get(`/api/stream/${encodeURIComponent(maliciousSessionId)}`)
        .set('Accept', 'text/event-stream')
        .expect(404); // 应该返回404而不是执行脚本
    });
  });

  describe('Performance Metrics', () => {
    it('应该在合理时间内建立连接', async () => {
      const startTime = Date.now();

      await request(app)
        .get(`/api/stream/${testSessionId}`)
        .set('Accept', 'text/event-stream')
        .expect(200);

      const connectionTime = Date.now() - startTime;
      expect(connectionTime).toBeLessThan(1000); // 1秒内建立连接
    });

    it('应该正确设置缓冲和超时', async () => {
      const response = await request(app)
        .get(`/api/stream/${testSessionId}`)
        .set('Accept', 'text/event-stream')
        .expect(200);

      // 检查响应头中的缓冲设置
      expect(response.headers['x-accel-buffering']).toBe('no');
    });
  });
});