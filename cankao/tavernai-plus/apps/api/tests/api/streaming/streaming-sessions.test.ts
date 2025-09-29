/**
 * 流式会话管理合约测试 (T016)
 *
 * 测试流式会话的CRUD操作、状态管理和查询功能
 * 接口设计符合核心竞争力提升规范
 */

import request from 'supertest';
import { app } from '../../../src/server';
import { prisma } from '../../../src/lib/prisma';

describe('Streaming Sessions API Contract Tests', () => {
  let testUserId: string;
  let testCharacterId: string;
  let testChatId: string;

  beforeAll(async () => {
    // 创建测试用户
    const user = await prisma.user.create({
      data: {
        username: 'session_test_user',
        email: 'session@test.com',
        passwordHash: 'test_hash'
      }
    });
    testUserId = user.id;

    // 创建测试角色
    const character = await prisma.character.create({
      data: {
        name: 'Session Test Character',
        description: 'Test character for session management',
        creatorId: testUserId
      }
    });
    testCharacterId = character.id;

    // 创建测试聊天会话
    const chatSession = await prisma.chatSession.create({
      data: {
        userId: testUserId,
        characterId: testCharacterId,
        title: 'Test Chat Session'
      }
    });
    testChatId = chatSession.id;
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.streamingMessage.deleteMany({
      where: { session: { userId: testUserId } }
    });
    await prisma.streamingSession.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.chatSession.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.character.deleteMany({
      where: { creatorId: testUserId }
    });
    await prisma.user.deleteMany({
      where: { id: testUserId }
    });
  });

  describe('POST /api/stream/sessions - 创建流式会话', () => {
    it('应该成功创建新的流式会话', async () => {
      const sessionData = {
        userId: testUserId,
        characterId: testCharacterId,
        chatId: testChatId,
        connectionType: 'sse',
        chunkSize: 1024,
        heartbeatInterval: 30,
        maxDuration: 300
      };

      const response = await request(app)
        .post('/api/stream/sessions')
        .send(sessionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.session).toBeDefined();
      expect(response.body.session.id).toBeDefined();
      expect(response.body.session.userId).toBe(testUserId);
      expect(response.body.session.characterId).toBe(testCharacterId);
      expect(response.body.session.status).toBe('active');
      expect(response.body.session.connectionType).toBe('sse');

      // 验证数据库中的数据
      const session = await prisma.streamingSession.findUnique({
        where: { id: response.body.session.id }
      });
      expect(session).toBeDefined();
      expect(session?.chunkSize).toBe(1024);
      expect(session?.heartbeatInterval).toBe(30);
    });

    it('应该支持WebSocket连接类型', async () => {
      const sessionData = {
        userId: testUserId,
        characterId: testCharacterId,
        connectionType: 'websocket',
        chunkSize: 2048
      };

      const response = await request(app)
        .post('/api/stream/sessions')
        .send(sessionData)
        .expect(201);

      expect(response.body.session.connectionType).toBe('websocket');
      expect(response.body.session.chunkSize).toBe(2048);
    });

    it('应该使用默认配置创建会话', async () => {
      const sessionData = {
        userId: testUserId,
        characterId: testCharacterId
      };

      const response = await request(app)
        .post('/api/stream/sessions')
        .send(sessionData)
        .expect(201);

      expect(response.body.session.connectionType).toBe('sse');
      expect(response.body.session.chunkSize).toBe(1024);
      expect(response.body.session.heartbeatInterval).toBe(30);
      expect(response.body.session.maxDuration).toBe(300);
    });

    it('应该验证必需字段', async () => {
      const incompleteData = {
        characterId: testCharacterId
        // 缺少 userId
      };

      await request(app)
        .post('/api/stream/sessions')
        .send(incompleteData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('userId is required');
        });
    });

    it('应该验证字段类型和范围', async () => {
      const invalidData = {
        userId: testUserId,
        characterId: testCharacterId,
        chunkSize: -1, // 无效值
        heartbeatInterval: 0, // 无效值
        maxDuration: 7201 // 超过最大值 (2小时)
      };

      await request(app)
        .post('/api/stream/sessions')
        .send(invalidData)
        .expect(400)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors.some((err: any) => err.field === 'chunkSize')).toBe(true);
        });
    });
  });

  describe('GET /api/stream/sessions - 获取会话列表', () => {
    let testSessionIds: string[] = [];

    beforeAll(async () => {
      // 创建多个测试会话
      for (let i = 0; i < 5; i++) {
        const session = await prisma.streamingSession.create({
          data: {
            id: `test-session-${i}`,
            userId: testUserId,
            characterId: testCharacterId,
            status: i % 2 === 0 ? 'active' : 'completed',
            connectionType: 'sse',
            messagesSent: i * 10,
            createdAt: new Date(Date.now() - i * 60000) // 不同的创建时间
          }
        });
        testSessionIds.push(session.id);
      }
    });

    afterAll(async () => {
      await prisma.streamingSession.deleteMany({
        where: { id: { in: testSessionIds } }
      });
    });

    it('应该返回用户的所有会话', async () => {
      const response = await request(app)
        .get('/api/stream/sessions')
        .query({ userId: testUserId })
        .expect(200);

      expect(response.body.sessions).toBeDefined();
      expect(Array.isArray(response.body.sessions)).toBe(true);
      expect(response.body.sessions.length).toBeGreaterThanOrEqual(5);
      expect(response.body.total).toBeGreaterThanOrEqual(5);
    });

    it('应该支持状态过滤', async () => {
      const response = await request(app)
        .get('/api/stream/sessions')
        .query({ userId: testUserId, status: 'active' })
        .expect(200);

      expect(response.body.sessions.every((s: any) => s.status === 'active')).toBe(true);
      expect(response.body.sessions.length).toBeGreaterThanOrEqual(3);
    });

    it('应该支持分页', async () => {
      const response = await request(app)
        .get('/api/stream/sessions')
        .query({ userId: testUserId, page: 1, limit: 2 })
        .expect(200);

      expect(response.body.sessions.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(5);
      expect(response.body.pagination.totalPages).toBeGreaterThanOrEqual(3);
    });

    it('应该支持按时间排序', async () => {
      const response = await request(app)
        .get('/api/stream/sessions')
        .query({ userId: testUserId, sortBy: 'createdAt', sortOrder: 'desc' })
        .expect(200);

      const sessions = response.body.sessions;
      for (let i = 1; i < sessions.length; i++) {
        const prevTime = new Date(sessions[i - 1].createdAt).getTime();
        const currTime = new Date(sessions[i].createdAt).getTime();
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }
    });

    it('应该支持按角色过滤', async () => {
      const response = await request(app)
        .get('/api/stream/sessions')
        .query({ userId: testUserId, characterId: testCharacterId })
        .expect(200);

      expect(response.body.sessions.every((s: any) => s.characterId === testCharacterId)).toBe(true);
    });

    it('应该包含会话统计信息', async () => {
      const response = await request(app)
        .get('/api/stream/sessions')
        .query({ userId: testUserId, include: 'statistics' })
        .expect(200);

      expect(response.body.statistics).toBeDefined();
      expect(response.body.statistics.total).toBeDefined();
      expect(response.body.statistics.active).toBeDefined();
      expect(response.body.statistics.completed).toBeDefined();
      expect(response.body.statistics.totalMessages).toBeDefined();
      expect(response.body.statistics.totalBytes).toBeDefined();
    });
  });

  describe('GET /api/stream/sessions/:sessionId - 获取单个会话', () => {
    let testSessionId: string;

    beforeAll(async () => {
      const session = await prisma.streamingSession.create({
        data: {
          id: 'single-session-test',
          userId: testUserId,
          characterId: testCharacterId,
          status: 'active',
          connectionType: 'sse',
          messagesSent: 15,
          bytesTransferred: 2048
        }
      });
      testSessionId = session.id;

      // 添加一些消息
      await prisma.streamingMessage.createMany({
        data: [
          {
            sessionId: testSessionId,
            eventType: 'message',
            content: 'Test message 1',
            sequenceNumber: 1,
            status: 'sent'
          },
          {
            sessionId: testSessionId,
            eventType: 'message',
            content: 'Test message 2',
            sequenceNumber: 2,
            status: 'sent'
          }
        ]
      });
    });

    afterAll(async () => {
      await prisma.streamingMessage.deleteMany({
        where: { sessionId: testSessionId }
      });
      await prisma.streamingSession.delete({
        where: { id: testSessionId }
      });
    });

    it('应该返回会话详细信息', async () => {
      const response = await request(app)
        .get(`/api/stream/sessions/${testSessionId}`)
        .expect(200);

      expect(response.body.session).toBeDefined();
      expect(response.body.session.id).toBe(testSessionId);
      expect(response.body.session.userId).toBe(testUserId);
      expect(response.body.session.messagesSent).toBe(15);
      expect(response.body.session.bytesTransferred).toBe(2048);
    });

    it('应该支持包含关联数据', async () => {
      const response = await request(app)
        .get(`/api/stream/sessions/${testSessionId}`)
        .query({ include: 'user,character,messages' })
        .expect(200);

      expect(response.body.session.user).toBeDefined();
      expect(response.body.session.character).toBeDefined();
      expect(response.body.session.messages).toBeDefined();
      expect(Array.isArray(response.body.session.messages)).toBe(true);
      expect(response.body.session.messages.length).toBeGreaterThanOrEqual(2);
    });

    it('应该处理不存在的会话', async () => {
      await request(app)
        .get('/api/stream/sessions/non-existent-session')
        .expect(404)
        .expect(res => {
          expect(res.body.error).toBe('Session not found');
        });
    });
  });

  describe('PATCH /api/stream/sessions/:sessionId - 更新会话', () => {
    let testSessionId: string;

    beforeEach(async () => {
      const session = await prisma.streamingSession.create({
        data: {
          id: `update-session-${Date.now()}`,
          userId: testUserId,
          characterId: testCharacterId,
          status: 'active',
          connectionType: 'sse'
        }
      });
      testSessionId = session.id;
    });

    afterEach(async () => {
      await prisma.streamingSession.deleteMany({
        where: { id: testSessionId }
      });
    });

    it('应该更新会话状态', async () => {
      const updateData = {
        status: 'paused'
      };

      const response = await request(app)
        .patch(`/api/stream/sessions/${testSessionId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.session.status).toBe('paused');

      // 验证数据库更新
      const session = await prisma.streamingSession.findUnique({
        where: { id: testSessionId }
      });
      expect(session?.status).toBe('paused');
    });

    it('应该更新配置参数', async () => {
      const updateData = {
        chunkSize: 2048,
        heartbeatInterval: 60
      };

      const response = await request(app)
        .patch(`/api/stream/sessions/${testSessionId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.session.chunkSize).toBe(2048);
      expect(response.body.session.heartbeatInterval).toBe(60);
    });

    it('应该验证状态转换', async () => {
      // 先将状态设为completed
      await prisma.streamingSession.update({
        where: { id: testSessionId },
        data: { status: 'completed' }
      });

      // 尝试将completed状态改为active（应该被拒绝）
      await request(app)
        .patch(`/api/stream/sessions/${testSessionId}`)
        .send({ status: 'active' })
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Invalid status transition');
        });
    });

    it('应该拒绝更新只读字段', async () => {
      const updateData = {
        id: 'new-id',
        userId: 'different-user',
        createdAt: new Date().toISOString()
      };

      await request(app)
        .patch(`/api/stream/sessions/${testSessionId}`)
        .send(updateData)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Read-only fields cannot be updated');
        });
    });
  });

  describe('DELETE /api/stream/sessions/:sessionId - 删除会话', () => {
    let testSessionId: string;

    beforeEach(async () => {
      const session = await prisma.streamingSession.create({
        data: {
          id: `delete-session-${Date.now()}`,
          userId: testUserId,
          characterId: testCharacterId,
          status: 'completed',
          connectionType: 'sse'
        }
      });
      testSessionId = session.id;
    });

    it('应该删除已完成的会话', async () => {
      const response = await request(app)
        .delete(`/api/stream/sessions/${testSessionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Session deleted successfully');

      // 验证数据库中已删除
      const session = await prisma.streamingSession.findUnique({
        where: { id: testSessionId }
      });
      expect(session).toBeNull();
    });

    it('应该拒绝删除活动会话', async () => {
      await prisma.streamingSession.update({
        where: { id: testSessionId },
        data: { status: 'active' }
      });

      await request(app)
        .delete(`/api/stream/sessions/${testSessionId}`)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toBe('Cannot delete active session');
        });
    });

    it('应该支持强制删除', async () => {
      await prisma.streamingSession.update({
        where: { id: testSessionId },
        data: { status: 'active' }
      });

      const response = await request(app)
        .delete(`/api/stream/sessions/${testSessionId}`)
        .query({ force: 'true' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.forced).toBe(true);
    });

    it('应该级联删除相关消息', async () => {
      // 添加一些消息
      await prisma.streamingMessage.createMany({
        data: [
          {
            sessionId: testSessionId,
            eventType: 'message',
            content: 'Message to be deleted',
            sequenceNumber: 1,
            status: 'sent'
          }
        ]
      });

      await request(app)
        .delete(`/api/stream/sessions/${testSessionId}`)
        .expect(200);

      // 验证消息也被删除
      const messages = await prisma.streamingMessage.findMany({
        where: { sessionId: testSessionId }
      });
      expect(messages.length).toBe(0);
    });
  });

  describe('权限和安全性', () => {
    it('应该验证用户只能访问自己的会话', async () => {
      // 创建另一个用户的会话
      const otherUser = await prisma.user.create({
        data: {
          username: 'other_session_user',
          email: 'othersession@test.com',
          passwordHash: 'test_hash'
        }
      });

      const otherSession = await prisma.streamingSession.create({
        data: {
          id: 'other-user-session',
          userId: otherUser.id,
          status: 'active',
          connectionType: 'sse'
        }
      });

      // 尝试访问其他用户的会话
      await request(app)
        .get(`/api/stream/sessions/${otherSession.id}`)
        // .set('Authorization', `Bearer ${testUserToken}`) // 需要实现认证
        .expect(403);

      // 清理
      await prisma.streamingSession.delete({ where: { id: otherSession.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });
});