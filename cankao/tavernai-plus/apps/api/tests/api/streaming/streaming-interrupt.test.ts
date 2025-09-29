/**
 * 流式输出中断合约测试 (T015)
 *
 * 测试流式输出中断功能、状态管理和优雅停止
 * 接口设计符合核心竞争力提升规范
 */

import request from 'supertest';
import { app } from '../../../src/server';
import { prisma } from '../../../src/lib/prisma';

describe('Streaming Interrupt API Contract Tests', () => {
  let testUserId: string;
  let testSessionId: string;
  let testCharacterId: string;

  beforeAll(async () => {
    // 创建测试用户
    const user = await prisma.user.create({
      data: {
        username: 'interrupt_test_user',
        email: 'interrupt@test.com',
        passwordHash: 'test_hash'
      }
    });
    testUserId = user.id;

    // 创建测试角色
    const character = await prisma.character.create({
      data: {
        name: 'Interrupt Test Character',
        description: 'Test character for interrupt testing',
        creatorId: testUserId
      }
    });
    testCharacterId = character.id;

    // 创建活动流式会话
    const session = await prisma.streamingSession.create({
      data: {
        id: 'interrupt-test-session',
        userId: testUserId,
        characterId: testCharacterId,
        status: 'active',
        connectionType: 'sse',
        messagesSent: 5,
        bytesTransferred: 1024
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

  describe('POST /api/stream/:sessionId/interrupt - 基本中断功能', () => {
    beforeEach(async () => {
      // 确保会话处于活动状态
      await prisma.streamingSession.update({
        where: { id: testSessionId },
        data: { status: 'active' }
      });
    });

    it('应该成功中断活动的流式会话', async () => {
      const response = await request(app)
        .post(`/api/stream/${testSessionId}/interrupt`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Streaming session interrupted');
      expect(response.body.sessionId).toBe(testSessionId);

      // 验证数据库状态更新
      const session = await prisma.streamingSession.findUnique({
        where: { id: testSessionId }
      });
      expect(session?.status).toBe('completed');
      expect(session?.completedAt).toBeDefined();
    });

    it('应该返回中断前的统计信息', async () => {
      const response = await request(app)
        .post(`/api/stream/${testSessionId}/interrupt`)
        .expect(200);

      expect(response.body.statistics).toBeDefined();
      expect(response.body.statistics.messagesSent).toBeGreaterThanOrEqual(0);
      expect(response.body.statistics.bytesTransferred).toBeGreaterThanOrEqual(0);
      expect(response.body.statistics.duration).toBeDefined();
    });

    it('应该支持带原因的中断', async () => {
      const interruptReason = 'User requested stop';

      const response = await request(app)
        .post(`/api/stream/${testSessionId}/interrupt`)
        .send({ reason: interruptReason })
        .expect(200);

      expect(response.body.reason).toBe(interruptReason);

      // 检查是否记录了中断原因（可能需要在StreamingMessage中记录）
      const lastMessage = await prisma.streamingMessage.findFirst({
        where: {
          sessionId: testSessionId,
          eventType: 'interrupt'
        },
        orderBy: { createdAt: 'desc' }
      });

      expect(lastMessage).toBeDefined();
    });
  });

  describe('中断状态验证', () => {
    it('应该拒绝中断已完成的会话', async () => {
      // 先将会话标记为完成
      await prisma.streamingSession.update({
        where: { id: testSessionId },
        data: { status: 'completed' }
      });

      await request(app)
        .post(`/api/stream/${testSessionId}/interrupt`)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toBe('Session is not active');
        });
    });

    it('应该拒绝中断错误状态的会话', async () => {
      await prisma.streamingSession.update({
        where: { id: testSessionId },
        data: { status: 'error' }
      });

      await request(app)
        .post(`/api/stream/${testSessionId}/interrupt`)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toBe('Session is not active');
        });
    });

    it('应该处理不存在的会话', async () => {
      await request(app)
        .post('/api/stream/non-existent-session/interrupt')
        .expect(404)
        .expect(res => {
          expect(res.body.error).toBe('Session not found');
        });
    });
  });

  describe('并发中断处理', () => {
    beforeEach(async () => {
      await prisma.streamingSession.update({
        where: { id: testSessionId },
        data: { status: 'active' }
      });
    });

    it('应该处理并发中断请求', async () => {
      // 同时发送多个中断请求
      const requests = Array(3).fill(null).map(() =>
        request(app)
          .post(`/api/stream/${testSessionId}/interrupt`)
      );

      const responses = await Promise.allSettled(requests);

      // 应该有一个成功，其他的应该返回已中断的状态
      const successCount = responses.filter(
        result => result.status === 'fulfilled' && (result.value as any).status === 200
      ).length;

      expect(successCount).toBeGreaterThanOrEqual(1);

      // 验证最终状态
      const session = await prisma.streamingSession.findUnique({
        where: { id: testSessionId }
      });
      expect(session?.status).toBe('completed');
    });
  });

  describe('中断通知机制', () => {
    it('应该支持中断回调通知', async () => {
      const callbackUrl = 'http://localhost:3001/webhook/interrupt';

      const response = await request(app)
        .post(`/api/stream/${testSessionId}/interrupt`)
        .send({ callbackUrl })
        .expect(200);

      expect(response.body.callbackScheduled).toBe(true);
      // 注意：实际的回调测试需要模拟webhook接收器
    });

    it('应该创建中断事件消息', async () => {
      await request(app)
        .post(`/api/stream/${testSessionId}/interrupt`)
        .expect(200);

      // 检查是否创建了中断事件消息
      const interruptMessage = await prisma.streamingMessage.findFirst({
        where: {
          sessionId: testSessionId,
          eventType: 'interrupt'
        }
      });

      expect(interruptMessage).toBeDefined();
      expect(interruptMessage?.status).toBe('sent');
    });
  });

  describe('优雅停止和清理', () => {
    beforeEach(async () => {
      // 添加一些测试消息
      await prisma.streamingMessage.createMany({
        data: [
          {
            sessionId: testSessionId,
            eventType: 'message',
            content: 'Test message 1',
            sequenceNumber: 1,
            status: 'queued'
          },
          {
            sessionId: testSessionId,
            eventType: 'message',
            content: 'Test message 2',
            sequenceNumber: 2,
            status: 'sending'
          }
        ]
      });

      await prisma.streamingSession.update({
        where: { id: testSessionId },
        data: { status: 'active' }
      });
    });

    afterEach(async () => {
      await prisma.streamingMessage.deleteMany({
        where: { sessionId: testSessionId }
      });
    });

    it('应该完成队列中的消息发送', async () => {
      const response = await request(app)
        .post(`/api/stream/${testSessionId}/interrupt`)
        .send({ graceful: true })
        .expect(200);

      expect(response.body.gracefulShutdown).toBe(true);

      // 检查队列中的消息是否被处理
      const pendingMessages = await prisma.streamingMessage.findMany({
        where: {
          sessionId: testSessionId,
          status: 'queued'
        }
      });

      expect(pendingMessages.length).toBe(0);
    });

    it('应该支持强制立即中断', async () => {
      const response = await request(app)
        .post(`/api/stream/${testSessionId}/interrupt`)
        .send({ force: true })
        .expect(200);

      expect(response.body.forceInterrupt).toBe(true);

      // 验证会话立即停止
      const session = await prisma.streamingSession.findUnique({
        where: { id: testSessionId }
      });
      expect(session?.status).toBe('completed');
    });
  });

  describe('权限和安全性', () => {
    it('应该验证用户权限', async () => {
      // 创建另一个用户
      const otherUser = await prisma.user.create({
        data: {
          username: 'other_interrupt_user',
          email: 'otherinterrupt@test.com',
          passwordHash: 'test_hash'
        }
      });

      const otherSession = await prisma.streamingSession.create({
        data: {
          id: 'other-interrupt-session',
          userId: otherUser.id,
          status: 'active',
          connectionType: 'sse'
        }
      });

      // 尝试中断其他用户的会话
      await request(app)
        .post(`/api/stream/${otherSession.id}/interrupt`)
        // .set('Authorization', `Bearer ${testUserToken}`) // 需要实现认证
        .expect(403);

      // 清理
      await prisma.streamingSession.delete({ where: { id: otherSession.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('应该防止CSRF攻击', async () => {
      // 这个测试需要根据CSRF保护策略来实现
      const response = await request(app)
        .post(`/api/stream/${testSessionId}/interrupt`)
        .set('Origin', 'http://malicious-site.com')
        .expect(403);

      expect(response.body.error).toContain('CSRF');
    });
  });

  describe('性能和响应时间', () => {
    it('应该快速响应中断请求', async () => {
      const startTime = Date.now();

      await request(app)
        .post(`/api/stream/${testSessionId}/interrupt`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500); // 500ms内响应
    });

    it('应该正确更新连接中断次数', async () => {
      const sessionBefore = await prisma.streamingSession.findUnique({
        where: { id: testSessionId }
      });

      await request(app)
        .post(`/api/stream/${testSessionId}/interrupt`)
        .expect(200);

      const sessionAfter = await prisma.streamingSession.findUnique({
        where: { id: testSessionId }
      });

      expect(sessionAfter?.connectionDrops).toBe(
        (sessionBefore?.connectionDrops || 0) + 1
      );
    });
  });
});