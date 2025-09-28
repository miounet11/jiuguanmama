/**
 * 小批量头像生成（每次5个角色）
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
  batchLimit: 5
};

// MBTI视觉风格
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

  if (character.description.includes('奇幻')) prompt += '，魔法背景';
  else if (character.description.includes('科幻')) prompt += '，科技背景';
  else if (character.description.includes('动漫')) prompt += '，青春背景';

  return prompt + '，精美细节，头像构图';
}

async function generate5Avatars() {
  console.log('🎨 生成5个角色头像...');

  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  const db = new Database(config.database);

  const characters = db.prepare(`
    SELECT id, name, description, personality, mbtiType
    FROM Character
    WHERE avatarStatus != 'COMPLETED'
    ORDER BY id
    LIMIT ?
  `).all(config.batchLimit);

  console.log(`📋 处理 ${characters.length} 个角色`);

  const updateAvatar = db.prepare(`UPDATE Character SET avatar = ?, avatarStatus = 'COMPLETED' WHERE id = ?`);
  const updateStatus = db.prepare(`UPDATE Character SET avatarStatus = ? WHERE id = ?`);

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    console.log(`\n[${i+1}/${characters.length}] ${char.name} (${char.mbtiType})`);

    try {
      updateStatus.run('GENERATING', char.id);

      const prompt = buildPrompt(char);
      console.log(`提示词: ${prompt}`);

      const response = await axios.post(`${config.newapi.baseURL}/images/generations`, {
        model: config.newapi.model,
        prompt: prompt,
        n: 1,
        size: '512x512'
      }, {
        headers: { 'Authorization': `Bearer ${config.newapi.key}` },
        timeout: 60000
      });

      if (response.data?.data?.[0]?.url) {
        const imageUrl = response.data.data[0].url;

        // 下载图像
        const imgResp = await axios.get(imageUrl, { responseType: 'stream', timeout: 30000 });
        const filename = `${char.id}-avatar.png`;
        const filepath = path.join(config.outputDir, filename);
        const writer = fs.createWriteStream(filepath);

        imgResp.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', () => {
            const publicUrl = `/uploads/characters/avatars/${filename}`;
            updateAvatar.run(publicUrl, char.id);
            console.log(`✅ ${char.name} 成功`);
            resolve();
          });
          writer.on('error', reject);
        });

      } else {
        throw new Error('API返回异常');
      }

    } catch (error) {
      updateStatus.run('FAILED', char.id);
      console.error(`❌ ${char.name} 失败:`, error.message);
    }

    // 延迟2秒
    if (i < characters.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // 显示进度
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN avatarStatus = 'COMPLETED' THEN 1 ELSE 0 END) as completed
    FROM Character
  `).get();

  console.log(`\n📊 总进度: ${stats.completed}/${stats.total} (${(stats.completed/stats.total*100).toFixed(1)}%)`);

  db.close();
}

generate5Avatars().catch(console.error);
