const BaseTask = require('../BaseTask');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * 角色头像生成任务
 */
class CharacterAvatarTask extends BaseTask {
  constructor(taskId, data = {}) {
    super(taskId, data);
    this.dbPath = path.join(__dirname, '../../../apps/api/prisma/dev.db');
  }

  async execute() {
    const { characterIds, batchSize = 3, concurrency = 1 } = this.data;

    const db = new Database(this.dbPath);

    try {
      // 获取需要生成头像的角色
      let characters;
      if (characterIds && characterIds.length > 0) {
        const placeholders = characterIds.map(() => '?').join(',');
        characters = db.prepare(`
          SELECT id, name, description, mbtiType
          FROM Character
          WHERE id IN (${placeholders}) AND (avatar IS NULL OR avatar = '')
        `).all(...characterIds);
      } else {
        characters = db.prepare(`
          SELECT id, name, description, mbtiType
          FROM Character
          WHERE avatar IS NULL OR avatar = ''
        `).all();
      }

      if (characters.length === 0) {
        return { success: true, message: '没有需要生成头像的角色', generated: 0 };
      }

      this.updateProgress(10, `找到 ${characters.length} 个需要生成头像的角色`);

      let generated = 0;
      const total = characters.length;
      const results = [];

      // 分批处理
      for (let i = 0; i < characters.length; i += batchSize) {
        const batch = characters.slice(i, i + batchSize);
        this.updateProgress(
          10 + (i / total) * 80,
          `处理第 ${i + 1}-${Math.min(i + batchSize, total)} 个角色`
        );

        const batchPromises = batch.map(character =>
          this.generateSingleAvatar(character, db)
        );

        try {
          const batchResults = await Promise.allSettled(batchPromises);

          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              generated++;
              results.push({
                characterId: batch[index].id,
                characterName: batch[index].name,
                success: true,
                avatar: result.value
              });
            } else {
              results.push({
                characterId: batch[index].id,
                characterName: batch[index].name,
                success: false,
                error: result.reason.message
              });
            }
          });

          // 短暂延迟避免API限制
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`批次处理失败:`, error);
        }
      }

      this.updateProgress(95, `头像生成完成，成功生成 ${generated} 个`);

      return {
        success: true,
        total: characters.length,
        generated,
        failed: characters.length - generated,
        results
      };

    } finally {
      db.close();
    }
  }

  async generateSingleAvatar(character, db) {
    const { NewAPI } = require('../../../apps/api/src/lib/newapi');

    // MBTI视觉风格映射
    const mbtiStyles = {
      'INTJ': '深邃眼神，简约时尚，专业商务装扮，冷静自信的表情',
      'INTP': '聪慧眼神，随性休闲，学者气质，思考专注的神态',
      'ENTJ': '锐利眼神，正装套装，领导气场，坚定果断的表情',
      'ENTP': '活跃眼神，创意搭配，热情洋溢，充满想象力的神态',
      'INFJ': '温和眼神，文艺气质，神秘优雅，深思熟虑的表情',
      'INFP': '梦幻眼神，艺术风格，温柔浪漫，富有想象力的神态',
      'ENFJ': '亲和眼神，温暖搭配，魅力四射，充满关爱的表情',
      'ENFP': '明亮眼神，活力穿搭，热情开朗，富有感染力的笑容',
      'ISTJ': '稳重眼神，经典正装，传统优雅，可靠沉稳的表情',
      'ISFJ': '温柔眼神，舒适搭配，贴心体贴，关怀备至的神态',
      'ESTJ': '坚定眼神，权威装扮，高效干练，自信满满的表情',
      'ESFJ': '友善眼神，得体穿着，热情周到，温暖亲切的笑容',
      'ISTP': '冷静眼神，实用装扮，低调内敛，专业精准的神态',
      'ISFP': '柔和眼神，自然搭配，文静优美，细腻敏感的表情',
      'ESTP': '活力眼神，时尚潮流，动感十足，自信张扬的笑容',
      'ESFP': '灿烂眼神，亮丽穿搭，活泼可爱，热情洋溢的表情'
    };

    const styleDescription = mbtiStyles[character.mbtiType] || '自然亲和的表情，简约时尚的穿搭';

    const prompt = `一位动漫风格的角色头像，${character.name}，${styleDescription}，高质量数字艺术，细致的面部特征，专业的光影效果，4K分辨率`;

    try {
      const newapi = new NewAPI();
      const imageUrl = await newapi.generateImage(prompt, {
        model: 'nano-banana',
        steps: 20,
        cfg_scale: 7,
        width: 512,
        height: 512
      });

      // 更新数据库
      db.prepare(`
        UPDATE Character
        SET avatar = ?, avatarStatus = 'COMPLETED', updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(imageUrl, character.id);

      return imageUrl;
    } catch (error) {
      // 更新数据库记录错误状态
      db.prepare(`
        UPDATE Character
        SET avatarStatus = 'FAILED', updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(character.id);

      throw error;
    }
  }
}

module.exports = CharacterAvatarTask;
