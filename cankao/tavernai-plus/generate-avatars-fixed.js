/**
 * 修复版头像生成脚本
 * 使用300秒超时和改进的错误处理
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const config = {
  newapi: {
    key: 'sk-ap3W4RSYQgxXsatCrAog6dZwYKnxs12rHcyokvjIkPmgGZuY',
    baseURL: 'https://ttkk.inping.com/v1',
    model: 'nano-banana'
  },
  database: './apps/api/prisma/dev.db',
  outputDir: './apps/web/public/uploads/characters/avatars',
  batchLimit: 3, // 减少批量数量
  delayMs: 5000 // 增加延迟
};

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function buildAvatarPrompt(character) {
  let prompt = `高质量动漫风格头像，`;

  // 基于角色ID特殊处理
  if (character.name.includes('精灵') || character.description.includes('精灵')) {
    prompt += `精灵角色，尖耳朵，魔法气质，`;
  } else if (character.name.includes('AI') || character.description.includes('AI')) {
    prompt += `科幻AI角色，未来感，科技元素，`;
  } else if (character.name.includes('战士') || character.description.includes('战士')) {
    prompt += `战士角色，坚毅表情，战斗气质，`;
  } else if (character.name.includes('法师') || character.description.includes('法师')) {
    prompt += `法师角色，智慧气质，魔法氛围，`;
  } else if (character.description.includes('现代')) {
    prompt += `现代都市角色，时尚装扮，`;
  } else if (character.description.includes('古代') || character.description.includes('历史')) {
    prompt += `古代历史角色，传统服装，`;
  } else {
    prompt += `友善角色，温和表情，`;
  }

  // 根据性格添加描述
  if (character.personality) {
    if (character.personality.includes('温柔')) {
      prompt += `温柔表情，柔和眼神，`;
    } else if (character.personality.includes('冷漠') || character.personality.includes('冷酷')) {
      prompt += `冷漠表情，深邃眼神，`;
    } else if (character.personality.includes('活泼')) {
      prompt += `活泼表情，明亮笑容，`;
    } else if (character.personality.includes('神秘')) {
      prompt += `神秘表情，深不可测，`;
    }
  }

  prompt += `高质量，4K分辨率，精美细节，头像构图，正面角度`;

  return prompt;
}

async function generateAvatar(character) {
  try {
    const prompt = buildAvatarPrompt(character);
    console.log(`🎨 ${character.name}: 开始生成头像...`);
    console.log(`📝 提示词: ${prompt.substring(0, 80)}...`);

    const response = await axios.post(`${config.newapi.baseURL}/images/generations`, {
      model: config.newapi.model,
      prompt: prompt,
      n: 1,
      size: '512x512',
      quality: 'standard'
    }, {
      headers: {
        'Authorization': `Bearer ${config.newapi.key}`,
        'Content-Type': 'application/json'
      },
      timeout: 300000, // 300秒超时
      validateStatus: function (status) {
        return status >= 200 && status < 300;
      }
    });

    if (response.data && response.data.data && response.data.data[0]) {
      const imageUrl = response.data.data[0].url;
      console.log(`✅ API响应成功: ${imageUrl}`);

      // 下载图像
      console.log(`📥 下载图像...`);
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'stream',
        timeout: 60000 // 60秒下载超时
      });

      const filename = `${character.id}-avatar.png`;
      const filepath = path.join(config.outputDir, filename);
      const writer = fs.createWriteStream(filepath);

      imageResponse.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          const publicUrl = `/uploads/characters/avatars/${filename}`;
          console.log(`💾 ${character.name} 头像保存成功: ${publicUrl}`);
          resolve(publicUrl);
        });
        writer.on('error', (error) => {
          console.error(`💾 ${character.name} 保存失败:`, error.message);
          reject(error);
        });
      });

    } else {
      throw new Error('API返回格式异常');
    }

  } catch (error) {
    console.error(`❌ ${character.name} 生成失败:`, error.message);

    if (error.code === 'ECONNABORTED') {
      console.error(`⏰ 超时错误 - 建议增加延迟时间`);
    } else if (error.code === 'ENOTFOUND') {
      console.error(`🌐 DNS解析失败`);
    } else if (error.response) {
      console.error(`📊 HTTP ${error.response.status}: ${error.response.statusText}`);
    }

    return null;
  }
}

async function processMissingAvatars() {
  console.log(`🎨 开始生成缺失的角色头像 (300秒超时)...`);

  ensureDirectoryExists(config.outputDir);

  const db = new Database(config.database);

  // 查找缺失头像的角色
  const characters = db.prepare(`
    SELECT id, name, description, personality, avatar
    FROM Character
    WHERE avatar IS NULL
       OR avatar = ''
       OR avatar LIKE '%unsplash%'
    ORDER BY id
    LIMIT ?
  `).all(config.batchLimit);

  console.log(`📋 本批次处理 ${characters.length} 个角色`);

  if (characters.length === 0) {
    console.log('✅ 没有需要处理的角色！');
    db.close();
    return;
  }

  const updateAvatarStmt = db.prepare(`
    UPDATE Character
    SET avatar = ?, avatarStatus = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const updateStatusStmt = db.prepare(`
    UPDATE Character
    SET avatarStatus = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  let successCount = 0;
  let failCount = 0;

  // 逐个处理避免并发问题
  for (let i = 0; i < characters.length; i++) {
    const character = characters[i];

    console.log(`\n[${i+1}/${characters.length}] 处理 ${character.name}...`);
    console.log(`   当前头像: ${character.avatar || '无'}`);

    try {
      // 更新状态为生成中
      updateStatusStmt.run('GENERATING', character.id);

      const avatarUrl = await generateAvatar(character);

      if (avatarUrl) {
        updateAvatarStmt.run(avatarUrl, character.id);
        successCount++;
        console.log(`✅ 数据库更新成功`);
      } else {
        updateStatusStmt.run('FAILED', character.id);
        failCount++;
      }

    } catch (error) {
      updateStatusStmt.run('FAILED', character.id);
      failCount++;
      console.error(`❌ ${character.name} 处理失败:`, error.message);
    }

    // 每个角色间延迟
    if (i < characters.length - 1) {
      console.log(`⏱️ 等待 ${config.delayMs/1000} 秒避免请求过频...`);
      await new Promise(resolve => setTimeout(resolve, config.delayMs));
    }
  }

  db.close();

  console.log('\n🎉 本批次完成！');
  console.log(`📊 成功: ${successCount}, 失败: ${failCount}`);

  // 显示总进度
  const dbCheck = new Database(config.database);
  const stats = dbCheck.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN avatar IS NOT NULL AND avatar != '' AND avatar NOT LIKE '%unsplash%' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN avatar IS NULL OR avatar = '' OR avatar LIKE '%unsplash%' THEN 1 ELSE 0 END) as pending
    FROM Character
  `).get();

  console.log('\n📈 总体进度:');
  console.log(`   总计: ${stats.total}`);
  console.log(`   已完成: ${stats.completed}`);
  console.log(`   待处理: ${stats.pending}`);
  console.log(`   完成率: ${(stats.completed/stats.total*100).toFixed(1)}%`);

  dbCheck.close();

  if (stats.pending > 0) {
    console.log('\n💡 提示: 还有角色待处理，可以再次运行此脚本继续');
    console.log('   建议命令: node generate-avatars-fixed.js');
  }
}

if (require.main === module) {
  processMissingAvatars().catch(console.error);
}
