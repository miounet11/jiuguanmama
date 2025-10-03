import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { performance } from 'perf_hooks';
import { app } from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { initRedis, closeRedis, getRedisManager } from '../../apps/api/src/lib/redis';

describe('缓存系统性能集成测试', () => {
  let server: any;
  let testUser: any;
  let authToken: string;
  let testCharacters: any[] = [];
  let redisManager: any;

  beforeAll(async () => {
    // 初始化测试环境
    await initRedis();
    redisManager = getRedisManager();
    server = app;

    // 创建测试用户
    testUser = await prisma.user.create({
      data: {
        username: 'cache_test_user',
        email: 'cachetest@example.com',
        passwordHash: 'test_hash',
        is_active: true,
        is_verified: true,
        role: 'user',
      },
    });

    // 模拟获取认证令牌
    authToken = 'mock_cache_test_token';

    // 创建测试数据
    await createTestData();
  });

  afterAll(async () => {
    // 清理测试数据
    if (testUser) {
      await prisma.character.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }

    // 清理Redis缓存
    if (redisManager) {
      const redis = redisManager.getClient();
      if (redis) {
        await redis.flushdb();
      }
    }

    await closeRedis();
  });

  beforeEach(async () => {
    // 每个测试前清理缓存
    if (redisManager) {
      const redis = redisManager.getClient();
      if (redis) {
        await redis.flushdb();
      }
    }
  });

  async function createTestData() {
    // 创建100个测试角色用于性能测试
    const characterPromises = [];
    for (let i = 0; i < 100; i++) {
      characterPromises.push(
        prisma.character.create({
          data: {
            userId: testUser.id,
            name: `性能测试角色 ${i + 1}`,
            description: `这是第${i + 1}个用于缓存性能测试的角色。包含详细的描述信息来模拟真实使用场景。`,
            personality: `性格特征 ${i + 1}`,
            scenario: `场景设定 ${i + 1}`,
            firstMessage: `你好！我是性能测试角色${i + 1}，很高兴认识你！`,
            systemPrompt: `你是性能测试角色${i + 1}，请保持友好和专业。`,
            category: i % 5 === 0 ? '官方' : '原创',
            tags: JSON.stringify([`tag${i % 10}`, `category${i % 5}`]),
            is_public: i % 3 === 0,
            is_featured: i % 20 === 0,
          },
        })
      );
    }

    testCharacters = await Promise.all(characterPromises);
    console.log(`创建了 ${testCharacters.length} 个测试角色`);
  }

  test('缓存预热性能测试', async () => {
    const warmupStartTime = performance.now();

    // Step 1: 预热角色列表缓存
    const warmupRequests = [];
    for (let i = 0; i < 10; i++) {
      warmupRequests.push(
        request(server)
          .get('/api/characters')
          .set('Authorization', `Bearer ${authToken}`)
          .query({
            page: Math.floor(i / 2) + 1,
            limit: 20,
            category: i % 2 === 0 ? '官方' : '原创',
          })
      );
    }

    const warmupResponses = await Promise.all(warmupRequests);
    const warmupEndTime = performance.now();
    const warmupDuration = warmupEndTime - warmupStartTime;

    // 验证预热请求成功
    warmupResponses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.headers['x-cache']).toBe('MISS'); // 首次请求应该是缓存未命中
    });

    console.log(`缓存预热完成，耗时: ${warmupDuration.toFixed(2)}ms`);

    // Step 2: 验证缓存命中
    const cachedStartTime = performance.now();

    const cachedRequests = [];
    for (let i = 0; i < 10; i++) {
      cachedRequests.push(
        request(server)
          .get('/api/characters')
          .set('Authorization', `Bearer ${authToken}`)
          .query({
            page: Math.floor(i / 2) + 1,
            limit: 20,
            category: i % 2 === 0 ? '官方' : '原创',
          })
      );
    }

    const cachedResponses = await Promise.all(cachedRequests);
    const cachedEndTime = performance.now();
    const cachedDuration = cachedEndTime - cachedStartTime;

    // 验证缓存命中
    cachedResponses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.headers['x-cache']).toBe('HIT'); // 应该是缓存命中
    });

    // 缓存命中应该显著快于缓存未命中
    const performanceImprovement = ((warmupDuration - cachedDuration) / warmupDuration) * 100;
    expect(performanceImprovement).toBeGreaterThan(30); // 至少30%的性能提升

    console.log(`缓存命中耗时: ${cachedDuration.toFixed(2)}ms, 性能提升: ${performanceImprovement.toFixed(2)}%`);
  });

  test('并发缓存访问性能测试', async () => {
    const concurrentUsers = 50;
    const requestsPerUser = 10;

    // Step 1: 模拟高并发访问
    const concurrentStartTime = performance.now();

    const concurrentPromises = [];
    for (let user = 0; user < concurrentUsers; user++) {
      for (let req = 0; req < requestsPerUser; req++) {
        concurrentPromises.push(
          request(server)
            .get('/api/characters')
            .set('Authorization', `Bearer ${authToken}`)
            .query({
              page: (req % 5) + 1,
              limit: 20,
              search: req % 3 === 0 ? '性能测试' : undefined,
            })
        );
      }
    }

    const concurrentResponses = await Promise.all(concurrentPromises);
    const concurrentEndTime = performance.now();
    const concurrentDuration = concurrentEndTime - concurrentStartTime;

    // Step 2: 验证并发请求结果
    const successfulRequests = concurrentResponses.filter(r => r.status === 200);
    const cacheHits = concurrentResponses.filter(r => r.headers['x-cache'] === 'HIT');
    const cacheMisses = concurrentResponses.filter(r => r.headers['x-cache'] === 'MISS');

    expect(successfulRequests.length).toBe(concurrentUsers * requestsPerUser);
    expect(cacheHits.length).toBeGreaterThan(cacheMisses.length); // 大部分应该是缓存命中

    const averageResponseTime = concurrentDuration / (concurrentUsers * requestsPerUser);
    const cacheHitRate = (cacheHits.length / concurrentResponses.length) * 100;

    console.log(`并发测试结果:`, {
      总请求数: concurrentUsers * requestsPerUser,
      总耗时: `${concurrentDuration.toFixed(2)}ms`,
      平均响应时间: `${averageResponseTime.toFixed(2)}ms`,
      缓存命中率: `${cacheHitRate.toFixed(2)}%`,
      缓存命中: cacheHits.length,
      缓存未命中: cacheMisses.length,
    });

    // 性能要求
    expect(averageResponseTime).toBeLessThan(100); // 平均响应时间小于100ms
    expect(cacheHitRate).toBeGreaterThan(60); // 缓存命中率大于60%
  });

  test('缓存失效验证测试', async () => {
    // Step 1: 建立缓存
    const initialResponse = await request(server)
      .get('/api/characters')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(initialResponse.headers['x-cache']).toBe('MISS');

    // Step 2: 验证缓存命中
    const cachedResponse = await request(server)
      .get('/api/characters')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(cachedResponse.headers['x-cache']).toBe('HIT');

    // Step 3: 修改数据（应该触发缓存失效）
    const newCharacter = await prisma.character.create({
      data: {
        userId: testUser.id,
        name: '缓存失效测试角色',
        description: '用于测试缓存失效的角色',
        personality: '测试性格',
        scenario: '测试场景',
        firstMessage: '缓存失效测试消息',
        systemPrompt: '你是缓存失效测试角色',
        is_public: true,
      },
    });

    // Step 4: 通过API创建角色（应该触发缓存失效）
    await request(server)
      .post('/api/characters')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'API创建测试角色',
        description: '通过API创建的角色',
        personality: 'API测试性格',
        scenario: 'API测试场景',
        firstMessage: 'API测试消息',
        systemPrompt: '你是API测试角色',
      })
      .expect(201);

    // Step 5: 验证缓存已失效
    const invalidatedResponse = await request(server)
      .get('/api/characters')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(invalidatedResponse.headers['x-cache']).toBe('MISS'); // 应该是缓存未命中
    expect(invalidatedResponse.body.characters.length).toBeGreaterThan(initialResponse.body.characters.length);

    // 清理测试数据
    await prisma.character.delete({ where: { id: newCharacter.id } });
  });

  test('多级缓存策略测试', async () => {
    // Step 1: 测试用户特定缓存
    const userCacheResponse1 = await request(server)
      .get('/api/characters/my')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(userCacheResponse1.headers['x-cache']).toBe('MISS');

    const userCacheResponse2 = await request(server)
      .get('/api/characters/my')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(userCacheResponse2.headers['x-cache']).toBe('HIT');

    // Step 2: 测试内容缓存（ETag）
    const contentResponse1 = await request(server)
      .get(`/api/characters/${testCharacters[0].id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const etag = contentResponse1.headers['etag'];
    expect(etag).toBeTruthy();

    // 使用ETag发送条件请求
    const contentResponse2 = await request(server)
      .get(`/api/characters/${testCharacters[0].id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('If-None-Match', etag)
      .expect(304); // Not Modified

    expect(contentResponse2.headers['x-cache']).toBe('ETAG-HIT');

    // Step 3: 测试智能缓存（根据User-Agent变化）
    const smartCacheResponse1 = await request(server)
      .get('/api/characters')
      .set('Authorization', `Bearer ${authToken}`)
      .set('User-Agent', 'TavernAI-Plus/1.0 (Mobile)')
      .expect(200);

    const smartCacheResponse2 = await request(server)
      .get('/api/characters')
      .set('Authorization', `Bearer ${authToken}`)
      .set('User-Agent', 'TavernAI-Plus/1.0 (Desktop)')
      .expect(200);

    // 不同的User-Agent应该产生不同的缓存
    expect(smartCacheResponse1.headers['x-cache']).toBe('MISS');
    expect(smartCacheResponse2.headers['x-cache']).toBe('MISS');

    // 相同的User-Agent应该命中缓存
    const smartCacheResponse3 = await request(server)
      .get('/api/characters')
      .set('Authorization', `Bearer ${authToken}`)
      .set('User-Agent', 'TavernAI-Plus/1.0 (Mobile)')
      .expect(200);

    expect(smartCacheResponse3.headers['x-cache']).toBe('HIT');
  });

  test('缓存内存使用监控测试', async () => {
    if (!redisManager || !redisManager.isReady()) {
      console.log('Redis不可用，跳过内存监控测试');
      return;
    }

    const redis = redisManager.getClient();

    // Step 1: 获取初始内存使用情况
    const initialInfo = await redis.info('memory');
    const initialMemory = parseRedisMemoryInfo(initialInfo);

    // Step 2: 产生大量缓存数据
    const largeDataRequests = [];
    for (let i = 0; i < 50; i++) {
      largeDataRequests.push(
        request(server)
          .get('/api/characters')
          .set('Authorization', `Bearer ${authToken}`)
          .query({
            page: i + 1,
            limit: 50,
            includeDetails: true,
          })
      );
    }

    await Promise.all(largeDataRequests);

    // Step 3: 获取缓存后内存使用情况
    const afterCacheInfo = await redis.info('memory');
    const afterCacheMemory = parseRedisMemoryInfo(afterCacheInfo);

    // Step 4: 验证内存使用合理性
    const memoryIncrease = afterCacheMemory.used_memory - initialMemory.used_memory;
    const memoryIncreasePercent = (memoryIncrease / initialMemory.used_memory) * 100;

    console.log('Redis内存使用情况:', {
      初始内存: `${(initialMemory.used_memory / 1024 / 1024).toFixed(2)}MB`,
      缓存后内存: `${(afterCacheMemory.used_memory / 1024 / 1024).toFixed(2)}MB`,
      内存增长: `${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
      增长百分比: `${memoryIncreasePercent.toFixed(2)}%`,
      最大内存: `${(afterCacheMemory.maxmemory / 1024 / 1024).toFixed(2)}MB`,
    });

    // 验证内存使用在合理范围内
    expect(memoryIncreasePercent).toBeLessThan(500); // 内存增长不超过500%

    if (afterCacheMemory.maxmemory > 0) {
      const memoryUsagePercent = (afterCacheMemory.used_memory / afterCacheMemory.maxmemory) * 100;
      expect(memoryUsagePercent).toBeLessThan(80); // 内存使用不超过80%
    }

    // Step 5: 测试缓存清理
    await redis.flushdb();

    const afterCleanInfo = await redis.info('memory');
    const afterCleanMemory = parseRedisMemoryInfo(afterCleanInfo);

    const cleanupReduction = afterCacheMemory.used_memory - afterCleanMemory.used_memory;
    expect(cleanupReduction).toBeGreaterThan(0); // 清理应该释放内存
  });

  test('缓存性能基准测试', async () => {
    const benchmarkResults = {
      cacheWrite: [],
      cacheRead: [],
      cacheDelete: [],
      dbQuery: [],
    };

    // Step 1: 缓存写入性能测试
    for (let i = 0; i < 100; i++) {
      const startTime = performance.now();

      await request(server)
        .get(`/api/characters/${testCharacters[i % testCharacters.length].id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = performance.now();
      benchmarkResults.cacheWrite.push(endTime - startTime);
    }

    // Step 2: 缓存读取性能测试
    for (let i = 0; i < 100; i++) {
      const startTime = performance.now();

      await request(server)
        .get(`/api/characters/${testCharacters[i % testCharacters.length].id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = performance.now();
      benchmarkResults.cacheRead.push(endTime - startTime);
    }

    // Step 3: 直接数据库查询性能测试（作为对比）
    for (let i = 0; i < 100; i++) {
      const startTime = performance.now();

      await prisma.character.findUnique({
        where: { id: testCharacters[i % testCharacters.length].id },
      });

      const endTime = performance.now();
      benchmarkResults.dbQuery.push(endTime - startTime);
    }

    // Step 4: 计算性能统计
    const stats = {
      cacheWrite: calculateStats(benchmarkResults.cacheWrite),
      cacheRead: calculateStats(benchmarkResults.cacheRead),
      dbQuery: calculateStats(benchmarkResults.dbQuery),
    };

    console.log('缓存性能基准测试结果:', {
      缓存写入: {
        平均: `${stats.cacheWrite.average.toFixed(2)}ms`,
        中位数: `${stats.cacheWrite.median.toFixed(2)}ms`,
        '95分位': `${stats.cacheWrite.p95.toFixed(2)}ms`,
      },
      缓存读取: {
        平均: `${stats.cacheRead.average.toFixed(2)}ms`,
        中位数: `${stats.cacheRead.median.toFixed(2)}ms`,
        '95分位': `${stats.cacheRead.p95.toFixed(2)}ms`,
      },
      数据库查询: {
        平均: `${stats.dbQuery.average.toFixed(2)}ms`,
        中位数: `${stats.dbQuery.median.toFixed(2)}ms`,
        '95分位': `${stats.dbQuery.p95.toFixed(2)}ms`,
      },
    });

    // 性能验证
    expect(stats.cacheRead.average).toBeLessThan(stats.cacheWrite.average); // 读取应该比写入快
    expect(stats.cacheRead.p95).toBeLessThan(50); // 95%的缓存读取应该在50ms内
    expect(stats.cacheWrite.p95).toBeLessThan(200); // 95%的缓存写入应该在200ms内
  });

  // 辅助函数
  function parseRedisMemoryInfo(info: string) {
    const lines = info.split('\r\n');
    const memory: any = {};

    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (key.includes('memory') || key === 'maxmemory') {
          memory[key] = parseInt(value) || 0;
        }
      }
    });

    return memory;
  }

  function calculateStats(numbers: number[]) {
    numbers.sort((a, b) => a - b);
    const length = numbers.length;

    return {
      average: numbers.reduce((a, b) => a + b, 0) / length,
      median: length % 2 === 0
        ? (numbers[length / 2 - 1] + numbers[length / 2]) / 2
        : numbers[Math.floor(length / 2)],
      p95: numbers[Math.floor(length * 0.95)],
      min: numbers[0],
      max: numbers[length - 1],
    };
  }
});