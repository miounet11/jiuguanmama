/**
 * 角色头像生成脚本
 * 使用NewAPI为所有角色生成个性化头像
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// 配置
const config = {
  newapi: {
    key: 'sk-ap3W4RSYQgxXsatCrAog6dZwYKnxs12rHcyokvjIkPmgGZuY',
    baseURL: 'https://ttkk.inping.com/v1',
    model: 'nano-banana'
  },
  database: './apps/api/prisma/dev.db',
  outputDir: './apps/web/public/uploads/characters/avatars'
};

// MBTI类型对应的视觉风格
const mbtiStyles = {
  'INTJ': '深邃眼神，简约时尚，专业商务装扮，冷静理性的气质',
  'INTP': '若有所思，休闲学者风，书卷气质，创新思维者',
  'ENTJ': '坚定表情，正装领导者气质，自信姿态，权威感',
  'ENTP': '机智表情，创意休闲装，充满活力，辩论家风范',
  'INFJ': '温和神秘，柔和色调，知性优雅，深度思考者',
  'INFP': '梦幻气质，艺术风格，温柔表情，理想主义者',
  'ENFJ': '温暖笑容，亲和装扮，领导魅力，人际关怀者',
  'ENFP': '活泼表情，色彩丰富，充满热情，竞选者风格',
  'ISTJ': '严肃专业，传统服装，可靠形象，务实稳重',
  'ISFJ': '温柔关怀，朴素优雅，亲切表情，守护者气质',
  'ESTJ': '权威气质，正式着装，自信领导者，执行官风范',
  'ESFJ': '友善表情，得体装扮，社交魅力，执政官风格',
  'ISTP': '冷静理性，实用装扮，工匠气质，技术专家',
  'ISFP': '艺术气息，自然风格，敏感表情，探险家精神',
  'ESTP': '活力四射，时尚装扮，冒险精神，企业家风范',
  'ESFP': '开朗笑容，活泼装扮，表演天赋，娱乐家气质'
};

// 创建输出目录
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 构建角色头像提示词
function buildAvatarPrompt(character) {
  const mbtiStyle = mbtiStyles[character.mbtiType] || '自然随和的气质';

  let prompt = `高质量动漫风格头像，`;

  // 基于角色特征的描述
  switch (character.id) {
    case 'featured1': // 司夜
      prompt += `银白色长发精美女性，深紫色眼眸，苍白肌肤，黑色华贵服装，血族女王气质，${mbtiStyle}，月夜背景`;
      break;
    case 'featured2': // 露娜
      prompt += `银蓝色长发女神，海蓝色眼眸，月光女神，银白光辉，浅色飘逸长裙，${mbtiStyle}，星空月光背景`;
      break;
    case 'char1': // 艾莉娅·月语
      prompt += `银白色长发精灵女性，绿宝石眼眸，尖耳朵，月白色法师袍，${mbtiStyle}，森林月光背景`;
      break;
    case 'char2': // 瓦拉克·铁拳
      prompt += `魁梧兽人男性战士，深褐色皮肤，黑色发辫，琥珀色眼眸，部落纹身，${mbtiStyle}，战场背景`;
      break;
    case 'char3': // ARIA-7
      prompt += `未来科技风格女性AI，全息投影效果，蓝色光芒，科技元素，${mbtiStyle}，数字空间背景`;
      break;
    case 'char4': // Nova
      prompt += `星际舰长女性，未来军装，坚毅表情，${mbtiStyle}，太空舰桥背景`;
      break;
    case 'char5': // 林夏雨
      prompt += `温暖亚洲女性心理咨询师，治愈系笑容，现代职业装，${mbtiStyle}，温馨办公室背景`;
      break;
    case 'char6': // 陈墨轩
      prompt += `年轻亚洲男性程序员，创意宅系风格，${mbtiStyle}，工作室背景`;
      break;
    case 'char7': // 李清照
      prompt += `古典中国女性，宋代服装，优雅气质，才女风范，${mbtiStyle}，古典庭院背景`;
      break;
    case 'char8': // 亚历山大
      prompt += `古代马其顿男性战士，希腊军装，英雄气概，${mbtiStyle}，战场背景`;
      break;
    default:
      prompt += `${character.name}，${character.personality}，${mbtiStyle}`;
  }

  prompt += `, 高质量，4K分辨率，精美细节，专业绘画，头像构图，正面角度`;

  return prompt;
}

// 生成单个角色头像
async function generateCharacterAvatar(character) {
  console.log(`🎨 为角色 "${character.name}" 生成头像...`);

  try {
    const prompt = buildAvatarPrompt(character);
    console.log(`提示词: ${prompt}`);

    const response = await axios.post(`${config.newapi.baseURL}/images/generations`, {
      model: config.newapi.model,
      prompt: prompt,
      n: 1,
      size: '512x512',
      quality: 'standard',
      style: 'vivid'
    }, {
      headers: {
        'Authorization': `Bearer ${config.newapi.key}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    if (response.data && response.data.data && response.data.data[0]) {
      const imageUrl = response.data.data[0].url;
      console.log(`✅ 头像生成成功: ${imageUrl}`);

      // 下载并保存图像
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
          console.log(`💾 头像已保存: ${filepath}`);
          resolve(publicUrl);
        });
        writer.on('error', reject);
      });
    } else {
      throw new Error('NewAPI返回格式异常');
    }

  } catch (error) {
    console.error(`❌ 为角色 "${character.name}" 生成头像失败:`, error.message);
    return null;
  }
}

// 更新数据库中的头像URL
function updateCharacterAvatar(db, characterId, avatarUrl) {
  const updateStmt = db.prepare(`
    UPDATE Character
    SET avatar = ?, avatarStatus = 'COMPLETED'
    WHERE id = ?
  `);

  const result = updateStmt.run(avatarUrl, characterId);
  return result.changes > 0;
}

// 主函数
async function main() {
  console.log('🚀 开始批量生成角色头像...');

  // 确保输出目录存在
  ensureDirectoryExists(config.outputDir);

  try {
    // 连接数据库
    const db = new Database(config.database);

    // 获取所有角色
    const characters = db.prepare(`
      SELECT id, name, description, personality, mbtiType, avatarStatus
      FROM Character
      WHERE avatarStatus != 'COMPLETED' OR avatar LIKE '%unsplash%'
      ORDER BY id
    `).all();

    console.log(`📋 找到 ${characters.length} 个需要生成头像的角色`);

    if (characters.length === 0) {
      console.log('✅ 所有角色头像都已完成！');
      db.close();
      return;
    }

    let successCount = 0;
    let failCount = 0;

    // 逐个生成头像（避免并发过多）
    for (const character of characters) {
      console.log(`\n📸 处理角色 ${character.id}: ${character.name}`);

      // 更新状态为生成中
      db.prepare(`UPDATE Character SET avatarStatus = 'GENERATING' WHERE id = ?`)
        .run(character.id);

      const avatarUrl = await generateCharacterAvatar(character);

      if (avatarUrl) {
        const updated = updateCharacterAvatar(db, character.id, avatarUrl);
        if (updated) {
          successCount++;
          console.log(`✅ 角色 "${character.name}" 头像更新成功`);
        } else {
          console.log(`⚠️ 角色 "${character.name}" 数据库更新失败`);
        }
      } else {
        // 更新状态为失败
        db.prepare(`UPDATE Character SET avatarStatus = 'FAILED' WHERE id = ?`)
          .run(character.id);
        failCount++;
      }

      // 避免请求过频，等待一下
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    db.close();

    console.log('\n🎉 批量头像生成完成！');
    console.log(`📊 统计: 成功 ${successCount} 个，失败 ${failCount} 个`);

    if (failCount > 0) {
      console.log('💡 提示: 失败的角色可以稍后重新运行脚本进行重试');
    }

  } catch (error) {
    console.error('❌ 程序执行失败:', error.message);
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  generateCharacterAvatar,
  buildAvatarPrompt,
  mbtiStyles
};
