/**
 * 限量批量头像生成（每次处理10个角色）
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
  batchLimit: 10, // 限制每次处理数量
  delayMs: 3000
};

// MBTI视觉风格映射
const mbtiStyles = {
  'INTJ': '深邃眼神，简约时尚，专业商务装扮',
  'INTP': '若有所思，休闲学者风，书卷气质',
  'ENTJ': '坚定表情，正装领导者气质，自信姿态',
  'ENTP': '机智表情，创意休闲装，充满活力',
  'INFJ': '温和神秘，柔和色调，知性优雅',
  'INFP': '梦幻气质，艺术风格，温柔表情',
  'ENFJ': '温暖笑容，亲和装扮，领导魅力',
  'ENFP': '活泼表情，色彩丰富，充满热情',
  'ISTJ': '严肃专业，传统服装，可靠形象',
  'ISFJ': '温柔关怀，朴素优雅，亲切表情',
  'ESTJ': '权威气质，正式着装，自信领导者',
  'ESFJ': '友善表情，得体装扮，社交魅力',
  'ISTP': '冷静理性，实用装扮，工匠气质',
  'ISFP': '艺术气息，自然风格，敏感表情',
  'ESTP': '活力四射，时尚装扮，冒险精神',
  'ESFP': '开朗笑容，活泼装扮，表演天赋'
};

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function buildAvatarPrompt(character) {
  const mbtiStyle = mbtiStyles[character.mbtiType] || '自然随和的气质';

  let prompt = `高质量动漫风格头像，`;

  // 根据世界类型和性格构建描述
  if (character.description.includes('奇幻')) {
    if (character.personality.includes('冷漠')) {
      prompt += `冷酷精灵或法师，${character.personality}，${mbtiStyle}，魔法背景`;
    } else if (character.personality.includes('神秘')) {
      prompt += `神秘精灵女性，${character.personality}，${mbtiStyle}，森林背景`;
    } else if (character.personality.includes('温和')) {
      prompt += `温和治愈系角色，${character.personality}，${mbtiStyle}，自然背景`;
    } else {
      prompt += `奇幻世界角色，${character.personality}，${mbtiStyle}，魔法背景`;
    }
  } else if (character.description.includes('科幻')) {
    prompt += `科幻未来角色，${character.personality}，${mbtiStyle}，科技背景`;
  } else if (character.description.includes('现代')) {
    prompt += `现代都市角色，${character.personality}，${mbtiStyle}，都市背景`;
  } else if (character.description.includes('历史')) {
    prompt += `历史古典角色，${character.personality}，${mbtiStyle}，古代背景`;
  } else if (character.description.includes('动漫')) {
    prompt += `动漫风格角色，${character.personality}，${mbtiStyle}，青春背景`;
  } else {
    prompt += `${character.name}，${character.personality}，${mbtiStyle}`;
  }

  prompt += `, 高质量，4K分辨率，精美细节，头像构图，正面角度`;

  return prompt;
}

async function generateAvatar(character) {
  try {
    const prompt = buildAvatarPrompt(character);
    console.log(`🎨 ${character.name}: ${character.mbtiType} - ${character.personality}`);

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
          console.log(`✅ ${character.name} 头像生成成功`);
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

async function processLimitedBatch() {
  console.log(`🎨 开始限量批量生成头像 (最多${config.batchLimit}个)...`);

  ensureDirectoryExists(config.outputDir);

  const db = new Database(config.database);

  const characters = db.prepare(`
    SELECT id, name, description, personality, mbtiType
    FROM Character
    WHERE avatarStatus != 'COMPLETED'
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
    SET avatar = ?, avatarStatus = 'COMPLETED'
    WHERE id = ?
  `);

  const updateStatusStmt = db.prepare(`
    UPDATE Character
    SET avatarStatus = ?
    WHERE id = ?
  `);

  let successCount = 0;
  let failCount = 0;

  // 逐个处理避免并发过多
  for (let i = 0; i < characters.length; i++) {
    const character = characters[i];

    console.log(`\n[${i+1}/${characters.length}] 处理 ${character.name}...`);

    try {
      updateStatusStmt.run('GENERATING', character.id);

      const avatarUrl = await generateAvatar(character);

      if (avatarUrl) {
        updateAvatarStmt.run(avatarUrl, character.id);
        successCount++;
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
      SUM(CASE WHEN avatarStatus = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN avatarStatus = 'FAILED' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN avatarStatus = 'PENDING' THEN 1 ELSE 0 END) as pending
    FROM Character
  `).get();

  console.log('\n📈 总体进度:');
  console.log(`   总计: ${stats.total}`);
  console.log(`   已完成: ${stats.completed}`);
  console.log(`   失败: ${stats.failed}`);
  console.log(`   待处理: ${stats.pending}`);
  console.log(`   完成率: ${(stats.completed/stats.total*100).toFixed(1)}%`);

  dbCheck.close();

  if (stats.pending > 0) {
    console.log('\n💡 提示: 还有角色待处理，可以再次运行此脚本继续');
  }
}

if (require.main === module) {
  processLimitedBatch().catch(console.error);
}
