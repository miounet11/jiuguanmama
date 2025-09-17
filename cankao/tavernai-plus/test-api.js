#!/usr/bin/env node

/**
 * API端点测试脚本
 * 用于验证所有API端点是否正常工作
 */

const axios = require('axios');
const colors = require('colors/safe');

const API_BASE = 'http://localhost:3001/api';
let token = null;
let testUserId = null;
let testCharacterId = null;
let testSessionId = null;

// 测试用户凭据
const testUser = {
  email: 'test@tavernai.com',
  password: '123456'
};

// Axios实例
const api = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加token
api.interceptors.request.use(config => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 测试结果统计
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 测试函数包装器
async function test(name, testFn) {
  results.total++;
  process.stdout.write(`Testing ${name}... `);

  try {
    await testFn();
    console.log(colors.green('✓ PASS'));
    results.passed++;
  } catch (error) {
    console.log(colors.red('✗ FAIL'));
    results.failed++;
    results.errors.push({
      test: name,
      error: error.response?.data?.message || error.message
    });
  }
}

// 主测试流程
async function runTests() {
  console.log(colors.cyan('\n=== TavernAI Plus API 测试 ===\n'));

  // 1. 测试健康检查
  await test('健康检查端点', async () => {
    const res = await api.get('/health');
    if (res.data.status !== 'ok') throw new Error('健康检查失败');
  });

  // 2. 测试认证
  console.log(colors.yellow('\n--- 认证测试 ---'));

  await test('用户登录', async () => {
    const res = await api.post('/auth/login', testUser);
    if (!res.data.success || !res.data.token) {
      throw new Error('登录响应格式错误');
    }
    token = res.data.token;
    testUserId = res.data.user.id;
  });

  await test('获取当前用户信息', async () => {
    const res = await api.get('/auth/me');
    if (!res.data.success || !res.data.user) {
      throw new Error('用户信息获取失败');
    }
  });

  // 3. 测试角色相关
  console.log(colors.yellow('\n--- 角色测试 ---'));

  await test('获取公开角色列表', async () => {
    const res = await api.get('/characters');
    if (!res.data.success) {
      throw new Error('角色列表获取失败');
    }
  });

  await test('获取热门角色', async () => {
    const res = await api.get('/characters/popular');
    if (!res.data.success) {
      throw new Error('热门角色获取失败');
    }
    // 保存一个角色ID用于后续测试
    if (res.data.characters && res.data.characters.length > 0) {
      testCharacterId = res.data.characters[0].id;
    }
  });

  await test('创建测试角色', async () => {
    const res = await api.post('/characters', {
      name: 'API测试角色',
      description: '这是一个用于API测试的角色',
      personality: '友好、乐于助人',
      greeting: '你好！我是测试角色。',
      isPublic: false
    });
    if (!res.data.success || !res.data.character) {
      throw new Error('角色创建失败');
    }
    testCharacterId = res.data.character.id;
  });

  if (testCharacterId) {
    await test('获取角色详情', async () => {
      const res = await api.get(`/characters/${testCharacterId}`);
      if (!res.data.success || !res.data.character) {
        throw new Error('角色详情获取失败');
      }
    });
  }

  // 4. 测试聊天相关
  console.log(colors.yellow('\n--- 聊天测试 ---'));

  await test('获取聊天会话列表', async () => {
    const res = await api.get('/chat/sessions');
    if (!res.data.success) {
      throw new Error('会话列表获取失败');
    }
  });

  if (testCharacterId) {
    await test('创建聊天会话', async () => {
      const res = await api.post('/chat/sessions', {
        characterId: testCharacterId,
        title: 'API测试会话'
      });
      if (!res.data.success || !res.data.session) {
        throw new Error('会话创建失败');
      }
      testSessionId = res.data.session.id;
    });

    if (testSessionId) {
      await test('获取会话详情', async () => {
        const res = await api.get(`/chat/sessions/${testSessionId}`);
        if (!res.data.success || !res.data.session) {
          throw new Error('会话详情获取失败');
        }
      });

      await test('发送消息', async () => {
        const res = await api.post(`/chat/sessions/${testSessionId}/messages`, {
          content: '你好，这是一条测试消息'
        });
        if (!res.data.success) {
          throw new Error('消息发送失败');
        }
      });

      await test('获取消息历史', async () => {
        const res = await api.get(`/chat/sessions/${testSessionId}/messages`);
        if (!res.data.success) {
          throw new Error('消息历史获取失败');
        }
      });
    }
  }

  // 5. 测试AI功能
  console.log(colors.yellow('\n--- AI功能测试 ---'));

  if (testSessionId) {
    await test('获取指导建议', async () => {
      const res = await api.get(`/ai/guidance/suggestions/${testSessionId}`);
      // AI功能可能返回空建议，只要不报错就算通过
    });

    await test('获取可召唤角色', async () => {
      const res = await api.get(`/ai/summon/available/${testSessionId}`);
      // AI功能可能返回空列表，只要不报错就算通过
    });
  }

  // 6. 清理测试数据
  console.log(colors.yellow('\n--- 清理测试数据 ---'));

  if (testSessionId) {
    await test('删除测试会话', async () => {
      const res = await api.delete(`/chat/sessions/${testSessionId}`);
      if (!res.data.success) {
        throw new Error('会话删除失败');
      }
    });
  }

  if (testCharacterId) {
    await test('删除测试角色', async () => {
      const res = await api.delete(`/characters/${testCharacterId}`);
      // 角色可能无法删除（如果不是创建者），忽略错误
    });
  }

  // 打印测试结果
  console.log(colors.cyan('\n=== 测试结果 ===\n'));
  console.log(`总计: ${results.total}`);
  console.log(colors.green(`通过: ${results.passed}`));
  console.log(colors.red(`失败: ${results.failed}`));

  if (results.errors.length > 0) {
    console.log(colors.red('\n失败详情:'));
    results.errors.forEach(err => {
      console.log(`  - ${err.test}: ${err.error}`);
    });
  }

  // 返回退出码
  process.exit(results.failed > 0 ? 1 : 0);
}

// 检查服务器是否运行
async function checkServer() {
  try {
    await axios.get(`${API_BASE.replace('/api', '')}/health`);
    return true;
  } catch (error) {
    return false;
  }
}

// 主函数
async function main() {
  console.log(colors.cyan('正在检查服务器状态...'));

  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log(colors.red('\n❌ 服务器未运行！请先启动后端服务器:'));
    console.log(colors.yellow('   cd apps/api && npm run dev\n'));
    process.exit(1);
  }

  console.log(colors.green('✓ 服务器运行正常'));

  // 运行测试
  await runTests();
}

// 运行
main().catch(error => {
  console.error(colors.red('\n未预期的错误:'), error);
  process.exit(1);
});
