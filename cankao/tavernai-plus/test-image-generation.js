#!/usr/bin/env node

/**
 * 角色图片生成功能测试脚本
 *
 * 测试内容：
 * 1. NewAPI 连接测试
 * 2. 数据库字段检查
 * 3. API 端点测试
 * 4. 图片生成流程测试
 * 5. MBTI 系统测试
 */

const axios = require('axios');
const { PrismaClient } = require('./apps/api/node_modules/.prisma/client');

// 配置
const API_BASE_URL = 'http://localhost:3001';
const NEWAPI_CONFIG = {
  key: process.env.NEWAPI_KEY || 'sk-ap3W4RSYQgxXsatCrAog6dZwYKnxs12rHcyokvjIkPmgGZuY',
  baseUrl: process.env.NEWAPI_BASE_URL || 'https://ttkk.inping.com/v1',
  model: process.env.DEFAULT_MODEL || 'nano-banana'
};

const prisma = new PrismaClient();

// 测试用角色数据
const TEST_CHARACTER = {
  name: '测试角色小雪',
  description: '温柔可爱的猫娘，喜欢在咖啡厅里看书',
  mbtiType: 'INFP',
  personality: '温和、内向、富有创意',
  scenario: '温馨的咖啡厅环境'
};

// 测试用户认证token（需要替换为真实token）
let AUTH_TOKEN = '';

// 颜色输出函数
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

function log(level, message) {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: colors.blue('ℹ'),
    success: colors.green('✅'),
    warning: colors.yellow('⚠️ '),
    error: colors.red('❌'),
    test: colors.cyan('🧪')
  }[level] || 'ℹ';

  console.log(`${prefix} ${timestamp} - ${message}`);
}

// 测试 NewAPI 连接
async function testNewAPIConnection() {
  log('test', '测试 NewAPI 连接...');

  try {
    const response = await axios.get(`${NEWAPI_CONFIG.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${NEWAPI_CONFIG.key}`
      },
      timeout: 10000
    });

    if (response.status === 200) {
      log('success', `NewAPI 连接成功! 可用模型: ${response.data.data?.length || 0} 个`);

      // 检查目标模型是否可用
      const models = response.data.data || [];
      const targetModel = models.find(m => m.id === NEWAPI_CONFIG.model);
      if (targetModel) {
        log('success', `目标模型 "${NEWAPI_CONFIG.model}" 可用`);
      } else {
        log('warning', `目标模型 "${NEWAPI_CONFIG.model}" 不在可用列表中`);
        log('info', `可用模型: ${models.map(m => m.id).join(', ')}`);
      }
      return true;
    }
  } catch (error) {
    log('error', `NewAPI 连接失败: ${error.message}`);
    if (error.response) {
      log('error', `响应状态: ${error.response.status}`);
      log('error', `响应内容: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// 测试数据库字段
async function testDatabaseFields() {
  log('test', '检查数据库字段...');

  try {
    // 检查是否存在新字段
    const result = await prisma.$queryRaw`
      PRAGMA table_info(Character)
    `;

    const fields = result.map(field => field.name);
    const requiredFields = [
      'backgroundImage', 'mbtiType', 'emotionPack',
      'avatarStatus', 'backgroundStatus', 'emotionStatus'
    ];

    const missingFields = requiredFields.filter(field => !fields.includes(field));

    if (missingFields.length === 0) {
      log('success', '所有必需字段都存在');
      return true;
    } else {
      log('error', `缺少字段: ${missingFields.join(', ')}`);
      log('info', '请运行数据库迁移: node migrate-character-images.js');
      return false;
    }
  } catch (error) {
    log('error', `数据库字段检查失败: ${error.message}`);
    return false;
  }
}

// 创建测试角色
async function createTestCharacter() {
  log('test', '创建测试角色...');

  try {
    const character = await prisma.character.create({
      data: {
        ...TEST_CHARACTER,
        creatorId: 'test-user-id', // 需要真实的用户ID
        category: '测试',
        tags: '["测试", "AI生成"]',
        isPublic: false
      }
    });

    log('success', `测试角色创建成功: ${character.name} (ID: ${character.id})`);
    return character;
  } catch (error) {
    log('error', `创建测试角色失败: ${error.message}`);
    return null;
  }
}

// 测试获取用户token（简化版，实际需要登录）
async function getAuthToken() {
  log('test', '获取认证token...');

  try {
    // 这里应该实现真实的登录逻辑
    // 暂时跳过，在实际测试中需要手动设置token
    log('warning', '认证token获取跳过，请手动设置 AUTH_TOKEN 变量');
    return false;
  } catch (error) {
    log('error', `获取认证token失败: ${error.message}`);
    return false;
  }
}

// 测试头像生成API
async function testAvatarGeneration(characterId) {
  log('test', '测试头像生成API...');

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/characters/${characterId}/generate-avatar`,
      {
        style: 'anime',
        quality: 'standard',
        mbtiType: TEST_CHARACTER.mbtiType,
        creativity: 70
      },
      {
        headers: AUTH_TOKEN ? { 'Authorization': `Bearer ${AUTH_TOKEN}` } : {},
        timeout: 30000
      }
    );

    if (response.status === 200 && response.data.success) {
      log('success', '头像生成API调用成功');
      log('info', `生成结果: ${JSON.stringify(response.data.data, null, 2)}`);
      return response.data.data;
    } else {
      log('error', `头像生成API返回异常: ${JSON.stringify(response.data)}`);
      return null;
    }
  } catch (error) {
    log('error', `头像生成API测试失败: ${error.message}`);
    if (error.response) {
      log('error', `状态码: ${error.response.status}`);
      log('error', `响应: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

// 测试背景生成API
async function testBackgroundGeneration(characterId) {
  log('test', '测试背景生成API...');

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/characters/${characterId}/generate-background`,
      {
        style: 'anime',
        quality: 'standard',
        mbtiType: TEST_CHARACTER.mbtiType,
        creativity: 70
      },
      {
        headers: AUTH_TOKEN ? { 'Authorization': `Bearer ${AUTH_TOKEN}` } : {},
        timeout: 30000
      }
    );

    if (response.status === 200 && response.data.success) {
      log('success', '背景生成API调用成功');
      log('info', `生成结果: ${JSON.stringify(response.data.data, null, 2)}`);
      return response.data.data;
    } else {
      log('error', `背景生成API返回异常: ${JSON.stringify(response.data)}`);
      return null;
    }
  } catch (error) {
    log('error', `背景生成API测试失败: ${error.message}`);
    if (error.response) {
      log('error', `状态码: ${error.response.status}`);
      log('error', `响应: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

// 测试生成状态查询
async function testGenerationStatus(characterId) {
  log('test', '测试生成状态查询...');

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/characters/${characterId}/generation-status`,
      {
        headers: AUTH_TOKEN ? { 'Authorization': `Bearer ${AUTH_TOKEN}` } : {},
        timeout: 10000
      }
    );

    if (response.status === 200 && response.data.success) {
      log('success', '生成状态查询成功');
      log('info', `状态信息: ${JSON.stringify(response.data.data, null, 2)}`);
      return response.data.data;
    } else {
      log('error', `生成状态查询异常: ${JSON.stringify(response.data)}`);
      return null;
    }
  } catch (error) {
    log('error', `生成状态查询失败: ${error.message}`);
    return null;
  }
}

// 测试MBTI系统
async function testMBTISystem() {
  log('test', '测试MBTI系统...');

  const mbtiTypes = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP'
  ];

  try {
    for (const mbtiType of mbtiTypes.slice(0, 3)) { // 只测试前3种
      const character = await prisma.character.create({
        data: {
          name: `MBTI测试角色-${mbtiType}`,
          description: `测试${mbtiType}性格类型的角色`,
          mbtiType: mbtiType,
          creatorId: 'test-user-id',
          category: '测试',
          tags: '["MBTI测试"]',
          isPublic: false
        }
      });

      log('success', `MBTI角色创建成功: ${character.name} (${mbtiType})`);
    }

    log('success', 'MBTI系统测试完成');
    return true;
  } catch (error) {
    log('error', `MBTI系统测试失败: ${error.message}`);
    return false;
  }
}

// 清理测试数据
async function cleanupTestData() {
  log('test', '清理测试数据...');

  try {
    const result = await prisma.character.deleteMany({
      where: {
        OR: [
          { name: { contains: '测试角色' } },
          { name: { contains: 'MBTI测试角色' } },
          { category: '测试' }
        ]
      }
    });

    log('success', `清理完成，删除了 ${result.count} 个测试角色`);
    return true;
  } catch (error) {
    log('error', `清理测试数据失败: ${error.message}`);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log(colors.bold('\n🚀 角色图片生成功能测试开始\n'));

  const results = {
    newapi: false,
    database: false,
    character: null,
    avatar: false,
    background: false,
    status: false,
    mbti: false
  };

  try {
    // 1. 测试NewAPI连接
    results.newapi = await testNewAPIConnection();

    // 2. 测试数据库字段
    results.database = await testDatabaseFields();

    if (!results.database) {
      log('error', '数据库字段检查失败，跳过后续测试');
      return results;
    }

    // 3. 获取认证token（可选）
    await getAuthToken();

    // 4. 创建测试角色
    results.character = await createTestCharacter();

    if (!results.character) {
      log('error', '测试角色创建失败，跳过API测试');
      return results;
    }

    // 5. 测试生成状态查询
    results.status = await testGenerationStatus(results.character.id);

    // 6. 测试头像生成（仅当NewAPI可用时）
    if (results.newapi) {
      results.avatar = await testAvatarGeneration(results.character.id);

      // 7. 测试背景生成
      results.background = await testBackgroundGeneration(results.character.id);
    } else {
      log('warning', '跳过图片生成API测试（NewAPI不可用）');
    }

    // 8. 测试MBTI系统
    results.mbti = await testMBTISystem();

    return results;

  } catch (error) {
    log('error', `测试执行出错: ${error.message}`);
    return results;
  }
}

// 生成测试报告
function generateReport(results) {
  console.log(colors.bold('\n📊 测试报告\n'));

  const testItems = [
    { name: 'NewAPI连接', status: results.newapi, critical: false },
    { name: '数据库字段', status: results.database, critical: true },
    { name: '测试角色创建', status: !!results.character, critical: true },
    { name: '生成状态查询', status: results.status, critical: true },
    { name: '头像生成API', status: results.avatar, critical: false },
    { name: '背景生成API', status: results.background, critical: false },
    { name: 'MBTI系统', status: results.mbti, critical: true }
  ];

  let passed = 0;
  let critical_failed = 0;

  testItems.forEach(item => {
    const status = item.status ? colors.green('✅ 通过') : colors.red('❌ 失败');
    const critical = item.critical ? colors.yellow('[关键]') : '[可选]';
    console.log(`${status} ${critical} ${item.name}`);

    if (item.status) passed++;
    if (!item.status && item.critical) critical_failed++;
  });

  console.log(`\n📈 测试统计:`);
  console.log(`   通过: ${colors.green(passed)}/${testItems.length}`);
  console.log(`   失败: ${colors.red(testItems.length - passed)}/${testItems.length}`);
  console.log(`   关键失败: ${colors.red(critical_failed)}`);

  if (critical_failed === 0) {
    console.log(colors.green('\n🎉 核心功能测试通过！系统可以正常使用'));

    if (!results.newapi) {
      console.log(colors.yellow('\n⚠️  NewAPI不可用，图片生成功能将使用备用方案'));
    }

    console.log('\n🚀 建议下一步操作:');
    console.log('   1. 运行数据库迁移: node migrate-character-images.js');
    console.log('   2. 启动开发服务器: npm run dev');
    console.log('   3. 访问前端测试图片生成功能');
    console.log('   4. 检查管理后台批量生成功能');

  } else {
    console.log(colors.red('\n❌ 存在关键功能问题，请修复后再使用'));
  }
}

// 主执行函数
async function main() {
  try {
    const results = await runTests();
    generateReport(results);

    // 询问是否清理测试数据
    console.log('\n🧹 是否清理测试数据？(y/N)');
    // 在实际使用中可以添加用户输入处理
    // 这里默认不清理，方便调试

  } catch (error) {
    log('error', `测试执行失败: ${error.message}`);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🏁 测试完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 测试失败:', error);
      process.exit(1);
    });
}

module.exports = {
  runTests,
  generateReport,
  testNewAPIConnection,
  testDatabaseFields
};
