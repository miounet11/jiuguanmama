/**
 * 生成缺失的角色头像脚本
 * 基于现有数据库结构，为缺失头像的角色生成头像
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
  batchLimit: 10,
  delayMs: 3000
};

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function buildAvatarPrompt(character) {
  let prompt = `高质量动漫风格头像，`;

  // 基于角色名称和描述构建提示词
  if (character.name) {
    prompt += `${character.name}，`;
  }

  // 根据角色描述添加风格
  if (character.description) {
    if (character.description.includes('精灵') || character.description.includes('魔法')) {
      prompt += `精灵或魔法师角色，`;
    } else if (character.description.includes('战士') || character.description.includes('军官')) {
      prompt += `战士或军官角色，`;
    } else if (character.description.includes('AI') || character.description.includes('科幻')) {
      prompt += `科幻AI角色，`;
    } else if (character.description.includes('古代') || character.description.includes('历史')) {
      prompt += `古代历史角色，`;
    } else if (character.description.includes('现代') || character.description.includes('都市')) {
      prompt += `现代都市角色，`;
    }
  }

  // 根据性格添加表情描述
  if (character.personality) {
    if (character.personality.includes('冷漠') || character.personality.includes('冷酷')) {
      prompt += `冷漠表情，`;
    } else if (character.personality.includes('温柔') || character.personality.includes('温和')) {
      prompt += `温柔表情，`;
    } else if (character.personality.includes('活泼') || character.personality.includes('开朗')) {
      prompt += `活泼表情，`;
    } else if (character.personality.includes('神秘')) {
      prompt += `神秘表情，`;
    } else if (character.personality.includes('自信') || character.personality.includes('强势')) {
      prompt += `自信表情，`;
    } else {
      prompt += `友善表情，`;
    }
  }

  prompt += `高质量，4K分辨率，精美细节，专业绘画，头像构图，正面角度`;

  return prompt;
}

async function generateAvatar(character) {
  try {
    const prompt = buildAvatarPrompt(character);
    console.log(`🎨 ${character.name}: ${prompt.substring(0, 100)}...`);

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
      timeout: 60000
    });

    if (response.data && response.data.data && response.data.data[0]) {
      const imageUrl = response.data.data[0].url;

      // 下载图像
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'stream',
        timeout: 30000
      });

      const filename = `${character.id}-avatar.png`;
      const filepath = path.join(config.outputDir, filename);
      const writer = fs.createWriteStream(filepath);

      imageResponse.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          const publicUrl = `/uploads/characters/avatars/${filename}`;
          console.log(`✅ ${character.name} 头像生成成功: ${publicUrl}`);
          resolve(publicUrl);
        });
        writer.on('error', reject);
      });
    } else {
      throw new Error('API返回格式异常');
    }
  } catch (error) {
    console.error(`❌ ${character.name} 失败:`, error.message);
    return null;
  }
}

async function processMissingAvatars() {
  console.log(`🎨 开始生成缺失的角色头像...`);

  ensureDirectoryExists(config.outputDir);

  const db = new Database(config.database);

  // 查找缺失头像的角色（头像为空或使用Unsplash占位图）
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
    SET avatar = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  let successCount = 0;
  let failCount = 0;

  // 逐个处理避免并发过多
  for (let i = 0; i < characters.length; i++) {
    const character = characters[i];

    console.log(`\n[${i+1}/${characters.length}] 处理 ${character.name}...`);
    console.log(`   当前头像: ${character.avatar || '无'}`);

    try {
      const avatarUrl = await generateAvatar(character);

      if (avatarUrl) {
        updateAvatarStmt.run(avatarUrl, character.id);
        successCount++;
        console.log(`   更新数据库: ${avatarUrl}`);
      } else {
        failCount++;
      }

    } catch (error) {
      failCount++;
      console.error(`❌ ${character.name} 处理失败:`, error.message);
    }

    // 每个角色间延迟
    if (i < characters.length - 1) {
      console.log(`⏱️ 等待 ${config.delayMs/1000} 秒...`);
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
  }
}

if (require.main === module) {
  processMissingAvatars().catch(console.error);
}
