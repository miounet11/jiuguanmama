/**
 * 单个角色头像生成（从失败的角色开始）
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
  outputDir: './apps/web/public/uploads/characters/avatars'
};

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

function buildPrompt(character) {
  const style = mbtiStyles[character.mbtiType] || '自然气质';
  let prompt = `高质量动漫风格头像，${character.personality}，${style}`;

  if (character.description.includes('奇幻')) {
    prompt += '，奇幻魔法背景';
  } else if (character.description.includes('科幻')) {
    prompt += '，未来科技背景';
  } else if (character.description.includes('动漫')) {
    prompt += '，青春校园背景';
  } else if (character.description.includes('现代')) {
    prompt += '，现代都市背景';
  } else if (character.description.includes('历史')) {
    prompt += '，古典历史背景';
  }

  return prompt + '，精美细节，4K质量，头像构图';
}

async function generateSingleAvatar(characterId) {
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  const db = new Database(config.database);

  const character = db.prepare(`
    SELECT id, name, description, personality, mbtiType
    FROM Character
    WHERE id = ?
  `).get(characterId);

  if (!character) {
    console.log(`❌ 角色 ${characterId} 不存在`);
    return;
  }

  console.log(`🎨 为 ${character.name} (${character.mbtiType}) 生成头像...`);

  const updateAvatar = db.prepare(`UPDATE Character SET avatar = ?, avatarStatus = 'COMPLETED' WHERE id = ?`);
  const updateStatus = db.prepare(`UPDATE Character SET avatarStatus = ? WHERE id = ?`);

  try {
    updateStatus.run('GENERATING', character.id);

    const prompt = buildPrompt(character);
    console.log(`提示词: ${prompt}`);

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

    if (response.data?.data?.[0]?.url) {
      const imageUrl = response.data.data[0].url;
      console.log(`📥 下载图像: ${imageUrl}`);

      // 下载图像
      const imgResponse = await axios.get(imageUrl, {
        responseType: 'stream',
        timeout: 30000
      });

      const filename = `${character.id}-avatar.png`;
      const filepath = path.join(config.outputDir, filename);
      const writer = fs.createWriteStream(filepath);

      imgResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', () => {
          const publicUrl = `/uploads/characters/avatars/${filename}`;
          updateAvatar.run(publicUrl, character.id);
          console.log(`✅ ${character.name} 头像生成成功: ${publicUrl}`);
          resolve();
        });
        writer.on('error', reject);
      });

    } else {
      throw new Error('API返回格式异常');
    }

  } catch (error) {
    updateStatus.run('FAILED', character.id);
    console.error(`❌ ${character.name} 生成失败:`, error.message);
  }

  db.close();
}

// 如果直接运行此脚本
if (require.main === module) {
  const characterId = process.argv[2];
  if (!characterId) {
    console.log('用法: node generate-remaining-single.js <characterId>');
    console.log('例如: node generate-remaining-single.js char102');
    process.exit(1);
  }

  generateSingleAvatar(characterId).catch(console.error);
}

module.exports = { generateSingleAvatar };
