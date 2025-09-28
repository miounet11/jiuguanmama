/**
 * 通过API批量生成缺失的角色头像
 */

const axios = require('axios');
const Database = require('better-sqlite3');

const config = {
  apiBaseUrl: 'http://localhost:3007',
  adminToken: 'admin-secret-token-change-this-in-production', // 从.env.local中的ADMIN_TOKEN
  database: './apps/api/prisma/dev.db',
  batchSize: 5 // 每批处理数量
};

async function getCharactersWithMissingAvatars() {
  const db = new Database(config.database);

  const characters = db.prepare(`
    SELECT id, name, avatar
    FROM Character
    WHERE avatar IS NULL
       OR avatar = ''
       OR avatar LIKE '%unsplash%'
    ORDER BY id
  `).all();

  db.close();

  console.log(`📋 找到 ${characters.length} 个需要生成头像的角色`);
  return characters;
}

async function batchGenerateAvatars(characterIds) {
  try {
    console.log(`🎨 开始批量生成 ${characterIds.length} 个角色的头像...`);

    const response = await axios.post(`${config.apiBaseUrl}/api/admin/characters/batch-generate`, {
      characterIds: characterIds,
      type: 'avatar'
    }, {
      headers: {
        'Authorization': `Bearer ${config.adminToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 300000 // 5分钟超时
    });

    if (response.data.success) {
      console.log('✅ 批量生成成功!');
      console.log(`📊 处理了 ${response.data.data.processed} 个角色`);
      console.log(`✅ 成功: ${response.data.data.successful}`);
      console.log(`❌ 失败: ${response.data.data.failed}`);

      if (response.data.data.errors && response.data.data.errors.length > 0) {
        console.log('\n❌ 错误详情:');
        response.data.data.errors.forEach(error => {
          console.log(`   ${error}`);
        });
      }

      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Batch generation failed');
    }

  } catch (error) {
    console.error('❌ 批量生成失败:', error.message);
    if (error.response) {
      console.error('📄 错误响应:', error.response.data);
    }
    throw error;
  }
}

async function generateSingleAvatar(characterId) {
  try {
    console.log(`🎨 为角色 ${characterId} 生成头像...`);

    const response = await axios.post(`${config.apiBaseUrl}/api/characters/${characterId}/generate-avatar`, {}, {
      headers: {
        'Authorization': `Bearer ${config.adminToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 2分钟超时
    });

    if (response.data.success) {
      console.log(`✅ 角色 ${characterId} 头像生成成功: ${response.data.data.avatar}`);
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Avatar generation failed');
    }

  } catch (error) {
    console.error(`❌ 角色 ${characterId} 生成失败:`, error.message);
    if (error.response) {
      console.error('📄 错误响应:', error.response.data);
    }
    return null;
  }
}

async function testAdminAuth() {
  try {
    console.log('🔑 测试管理员权限...');

    const response = await axios.get(`${config.apiBaseUrl}/api/characters`, {
      headers: {
        'Authorization': `Bearer ${config.adminToken}`
      },
      timeout: 10000
    });

    if (response.data.success) {
      console.log('✅ 管理员权限验证成功');
      return true;
    } else {
      console.log('❌ 管理员权限验证失败');
      return false;
    }

  } catch (error) {
    console.error('❌ 权限验证失败:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 开始批量头像生成任务...\n');

  try {
    // 1. 测试权限
    const authOk = await testAdminAuth();
    if (!authOk) {
      console.log('💡 提示: 请检查ADMIN_TOKEN配置或使用单个角色生成方式');
      return;
    }

    // 2. 获取需要生成头像的角色
    const characters = await getCharactersWithMissingAvatars();

    if (characters.length === 0) {
      console.log('✅ 所有角色都已有头像!');
      return;
    }

    console.log('\n缺失头像的角色:');
    characters.slice(0, 10).forEach(char => {
      console.log(`   ${char.id}: ${char.name} (当前: ${char.avatar || '无'})`);
    });
    if (characters.length > 10) {
      console.log(`   ... 还有 ${characters.length - 10} 个角色`);
    }

    // 3. 尝试批量生成
    console.log('\n🎨 方式1: 尝试批量生成...');

    const characterIds = characters.slice(0, config.batchSize).map(char => char.id);

    try {
      const batchResult = await batchGenerateAvatars(characterIds);
      console.log(`🎉 批量生成完成! 成功率: ${(batchResult.successful / batchResult.processed * 100).toFixed(1)}%`);
    } catch (batchError) {
      console.log('\n🔄 批量生成失败，切换到单个生成模式...');

      // 4. 单个生成作为后备方案
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < Math.min(3, characters.length); i++) { // 只测试前3个
        const character = characters[i];
        console.log(`\n[${i+1}/${Math.min(3, characters.length)}] 处理 ${character.id}: ${character.name}`);

        const result = await generateSingleAvatar(character.id);
        if (result) {
          successCount++;
        } else {
          failCount++;
        }

        // 延迟避免请求过频
        if (i < Math.min(3, characters.length) - 1) {
          console.log('⏱️ 等待 3 秒...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      console.log(`\n📊 单个生成测试结果: 成功 ${successCount}, 失败 ${failCount}`);
    }

  } catch (error) {
    console.error('\n💥 程序执行失败:', error.message);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
