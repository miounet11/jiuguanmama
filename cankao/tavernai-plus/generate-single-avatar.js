/**
 * 单个角色头像生成测试脚本
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

// MBTI视觉风格
const mbtiStyles = {
  'INTJ': '深邃眼神，简约时尚，专业商务装扮',
  'ENFJ': '温暖笑容，亲和装扮，领导魅力',
  'INFP': '梦幻气质，艺术风格，温柔表情',
  'ESTP': '活力四射，时尚装扮，冒险精神',
  'INTP': '若有所思，休闲学者风，书卷气质'
};

async function generateSingleAvatar(characterId) {
  console.log(`🎨 为角色 ${characterId} 生成头像...`);

  try {
    // 连接数据库获取角色信息
    const db = new Database(config.database);
    const character = db.prepare(`
      SELECT id, name, description, personality, mbtiType
      FROM Character
      WHERE id = ?
    `).get(characterId);

    if (!character) {
      console.log('❌ 角色不存在');
      return;
    }

    console.log(`📋 角色信息: ${character.name} - ${character.mbtiType}`);

    // 构建提示词
    let prompt = '';
    const mbtiStyle = mbtiStyles[character.mbtiType] || '自然随和的气质';

    switch (characterId) {
      case 'char1': // 艾莉娅·月语
        prompt = `高质量动漫风格头像，银白色长发精灵女性，绿宝石眼眸，尖耳朵，月白色法师袍，${mbtiStyle}，森林月光背景，高质量，4K分辨率，精美细节，头像构图`;
        break;
      case 'char2': // 瓦拉克·铁拳
        prompt = `高质量动漫风格头像，魁梧兽人男性战士，深褐色皮肤，黑色发辫，琥珀色眼眸，部落纹身，${mbtiStyle}，战场背景，高质量，4K分辨率，精美细节，头像构图`;
        break;
      case 'featured1': // 司夜
        prompt = `高质量动漫风格头像，银白色长发精美女性，深紫色眼眸，苍白肌肤，黑色华贵服装，血族女王气质，${mbtiStyle}，月夜背景，高质量，4K分辨率，精美细节，头像构图`;
        break;
      default:
        prompt = `高质量动漫风格头像，${character.description}，${character.personality}，${mbtiStyle}，高质量，4K分辨率，精美细节，头像构图`;
    }

    console.log(`📝 提示词: ${prompt}`);

    // 调用图像生成API
    console.log('🚀 调用NewAPI生成图像...');
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
      console.log(`✅ 图像生成成功: ${imageUrl}`);

      // 下载图像
      console.log('📥 下载图像...');
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'stream',
        timeout: 30000
      });

      // 确保目录存在
      if (!fs.existsSync(config.outputDir)) {
        fs.mkdirSync(config.outputDir, { recursive: true });
      }

      const filename = `${characterId}-avatar.png`;
      const filepath = path.join(config.outputDir, filename);
      const writer = fs.createWriteStream(filepath);

      imageResponse.data.pipe(writer);

      writer.on('finish', () => {
        const publicUrl = `/uploads/characters/avatars/${filename}`;
        console.log(`💾 头像已保存: ${filepath}`);

        // 更新数据库
        const updateStmt = db.prepare(`
          UPDATE Character
          SET avatar = ?, avatarStatus = 'COMPLETED'
          WHERE id = ?
        `);

        const result = updateStmt.run(publicUrl, characterId);

        if (result.changes > 0) {
          console.log(`✅ 数据库更新成功，新头像URL: ${publicUrl}`);
        } else {
          console.log('⚠️ 数据库更新失败');
        }

        db.close();
      });

      writer.on('error', (error) => {
        console.error('❌ 文件保存失败:', error.message);
        db.close();
      });

    } else {
      console.log('❌ API返回格式异常');
      console.log('响应数据:', JSON.stringify(response.data, null, 2));
      db.close();
    }

  } catch (error) {
    console.error('❌ 生成失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const characterId = process.argv[2] || 'char1';
  console.log(`🎯 开始为角色 ${characterId} 生成头像`);
  generateSingleAvatar(characterId);
}
