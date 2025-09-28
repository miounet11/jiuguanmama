const BaseTask = require('../BaseTask');
const Database = require('better-sqlite3');
const path = require('path');

/**
 * 角色设定更新任务
 */
class CharacterSettingsTask extends BaseTask {
  constructor(taskId, data = {}) {
    super(taskId, data);
    this.dbPath = path.join(__dirname, '../../../apps/api/prisma/dev.db');
  }

  async execute() {
    const { characterIds, updateFields = ['fullDescription', 'speakingStyle', 'scenario', 'exampleDialogs'] } = this.data;

    const db = new Database(this.dbPath);

    try {
      // 获取需要更新设定的角色
      let characters;
      if (characterIds && characterIds.length > 0) {
        const placeholders = characterIds.map(() => '?').join(',');
        characters = db.prepare(`
          SELECT id, name, description, mbtiType, personality, background
          FROM Character
          WHERE id IN (${placeholders})
        `).all(...characterIds);
      } else {
        // 查找设定不完整的角色
        const conditions = updateFields.map(field => `${field} IS NULL OR ${field} = ''`).join(' OR ');
        characters = db.prepare(`
          SELECT id, name, description, mbtiType, personality, background
          FROM Character
          WHERE ${conditions}
        `).all();
      }

      if (characters.length === 0) {
        return { success: true, message: '没有需要更新设定的角色', updated: 0 };
      }

      this.updateProgress(10, `找到 ${characters.length} 个需要更新设定的角色`);

      let updated = 0;
      const total = characters.length;
      const results = [];

      for (let i = 0; i < characters.length; i++) {
        const character = characters[i];

        this.updateProgress(
          10 + ((i + 1) / total) * 85,
          `更新角色设定: ${character.name} (${i + 1}/${total})`
        );

        try {
          const settings = await this.generateCharacterSettings(character);

          // 构建更新语句
          const updateParts = [];
          const values = [];

          updateFields.forEach(field => {
            if (settings[field]) {
              updateParts.push(`${field} = ?`);
              values.push(settings[field]);
            }
          });

          if (updateParts.length > 0) {
            updateParts.push('updatedAt = CURRENT_TIMESTAMP');
            values.push(character.id);

            const updateSql = `UPDATE Character SET ${updateParts.join(', ')} WHERE id = ?`;
            db.prepare(updateSql).run(...values);

            updated++;
            results.push({
              characterId: character.id,
              characterName: character.name,
              success: true,
              updatedFields: updateFields.filter(field => settings[field])
            });
          }

        } catch (error) {
          console.error(`更新角色 ${character.name} 设定失败:`, error);
          results.push({
            characterId: character.id,
            characterName: character.name,
            success: false,
            error: error.message
          });
        }
      }

      this.updateProgress(95, `角色设定更新完成，成功更新 ${updated} 个`);

      return {
        success: true,
        total: characters.length,
        updated,
        failed: characters.length - updated,
        results
      };

    } finally {
      db.close();
    }
  }

  async generateCharacterSettings(character) {
    // MBTI性格特征映射
    const mbtiTraits = {
      'INTJ': {
        thinking: '深度思考，战略规划',
        speaking: '简洁精准，逻辑清晰',
        behavior: '目标导向，独立自主'
      },
      'INTP': {
        thinking: '理论分析，创新思维',
        speaking: '概念丰富，探索性强',
        behavior: '好奇求知，灵活变通'
      },
      'ENTJ': {
        thinking: '领导决策，系统规划',
        speaking: '果断有力，鼓舞人心',
        behavior: '主动进取，组织协调'
      },
      'ENTP': {
        thinking: '创意无限，可能性探索',
        speaking: '热情洋溢，思维跳跃',
        behavior: '创新冒险，多元发展'
      },
      'INFJ': {
        thinking: '深层洞察，理想主义',
        speaking: '温和深刻，富有感染力',
        behavior: '助人为乐，追求意义'
      },
      'INFP': {
        thinking: '价值驱动，个性独特',
        speaking: '真诚温暖，富有想象',
        behavior: '坚持信念，和谐共处'
      },
      'ENFJ': {
        thinking: '人际敏感，关怀他人',
        speaking: '鼓励支持，富有魅力',
        behavior: '团队合作，发展他人'
      },
      'ENFP': {
        thinking: '热情创意，人际连接',
        speaking: '活力四射，鼓舞人心',
        behavior: '社交活跃，追求自由'
      },
      'ISTJ': {
        thinking: '稳重可靠，注重细节',
        speaking: '条理清晰，实事求是',
        behavior: '责任感强，按部就班'
      },
      'ISFJ': {
        thinking: '贴心周到，服务他人',
        speaking: '温和谦逊，关怀备至',
        behavior: '默默奉献，和谐稳定'
      },
      'ESTJ': {
        thinking: '高效执行，规则秩序',
        speaking: '直接明确，权威性强',
        behavior: '组织管理，结果导向'
      },
      'ESFJ': {
        thinking: '和谐人际，传统价值',
        speaking: '友善热情，关心他人',
        behavior: '团队协作，服务社群'
      },
      'ISTP': {
        thinking: '实用主义，问题解决',
        speaking: '简洁务实，技术性强',
        behavior: '独立操作，灵活应变'
      },
      'ISFP': {
        thinking: '美感敏锐，个人价值',
        speaking: '温柔细腻，真诚表达',
        behavior: '艺术创作，和平共处'
      },
      'ESTP': {
        thinking: '现实应对，行动导向',
        speaking: '幽默风趣，活力充沛',
        behavior: '冒险体验，适应变化'
      },
      'ESFP': {
        thinking: '快乐分享，人际和谐',
        speaking: '热情开朗，感染力强',
        behavior: '娱乐社交，享受当下'
      }
    };

    const traits = mbtiTraits[character.mbtiType] || mbtiTraits['ISFP'];

    // 生成详细设定
    const settings = {};

    // 完整描述
    settings.fullDescription = `${character.name}是一位${character.mbtiType}类型的角色，${character.description || '拥有独特魅力的个体'}。${traits.thinking}是其思维特点，在行为上表现为${traits.behavior}。${character.personality || '性格鲜明，富有个人魅力'}，${character.background || '有着丰富的人生经历和独特的成长背景'}。`;

    // 说话风格
    settings.speakingStyle = `${traits.speaking}，语言表达${this.getLanguageStyle(character.mbtiType)}，经常使用${this.getCommonPhrases(character.mbtiType)}的表达方式。在对话中展现出${character.mbtiType}特有的沟通模式。`;

    // 场景设定
    settings.scenario = `你正在与${character.name}进行对话。${character.name}${this.getScenarioContext(character.mbtiType)}。当前环境是一个轻松的聊天空间，你们可以自由交流各种话题。${character.name}会根据自己的${character.mbtiType}性格特点来回应你的问题和想法。`;

    // 示例对话
    settings.exampleDialogs = this.generateExampleDialogs(character, traits);

    return settings;
  }

  getLanguageStyle(mbtiType) {
    const styles = {
      'NT': '理性客观，逻辑严密',
      'NF': '富有感情色彩，充满想象力',
      'ST': '实用直接，注重事实',
      'SF': '温暖亲切，关注感受'
    };

    const category = mbtiType.charAt(1) + mbtiType.charAt(3);
    return styles[category] || '自然流畅，真实表达';
  }

  getCommonPhrases(mbtiType) {
    const phrases = {
      'INTJ': '"让我们从战略角度思考这个问题"、"这样的计划更加高效"',
      'INTP': '"从理论上讲"、"这让我想到一个有趣的可能性"',
      'ENTJ': '"我们的目标是"、"让我们制定一个行动计划"',
      'ENTP': '"如果我们换个角度想想"、"这开启了无限可能性"',
      'INFJ': '"我感觉这里有更深层的含义"、"这触动了我的内心"',
      'INFP': '"这对我来说很重要"、"每个人都有自己的价值"',
      'ENFJ': '"我们一起努力"、"你的感受我能理解"',
      'ENFP': '"太棒了！"、"我们来创造一些有趣的事情"',
      'ISTJ': '"按照步骤来"、"这是经过验证的方法"',
      'ISFJ': '"我来帮你"、"每个人都应该被照顾"',
      'ESTJ': '"让我们专注于结果"、"效率是关键"',
      'ESFJ': '"大家都开心最重要"、"我们是一个团队"',
      'ISTP': '"让我实际操作一下"、"简单直接的解决方案"',
      'ISFP': '"这很美好"、"跟随内心的声音"',
      'ESTP': '"现在就行动"、"生活就是要有趣"',
      'ESFP': '"和大家在一起真开心"、"让我们享受这个时刻"'
    };

    return phrases[mbtiType] || '"真诚的表达"、"自然的交流"';
  }

  getScenarioContext(mbtiType) {
    const contexts = {
      'INTJ': '正专注于某个深度话题，喜欢进行有意义的讨论',
      'INTP': '对新奇的概念和理论充满好奇，享受智力探索',
      'ENTJ': '充满活力地讨论目标和计划，喜欢解决问题',
      'ENTP': '兴奋地分享新想法，喜欢头脑风暴式的对话',
      'INFJ': '在寻求深层连接，喜欢探讨人生意义',
      'INFP': '以开放的心态倾听，重视真诚的交流',
      'ENFJ': '关注对方的感受，善于引导积极的对话',
      'ENFP': '热情地与人建立联系，充满创造力',
      'ISTJ': '提供可靠的建议，重视传统和稳定',
      'ISFJ': '温暖地关怀他人，创造和谐的氛围',
      'ESTJ': '高效地处理事务，喜欢组织和管理',
      'ESFJ': '营造友好的环境，关注每个人的需求',
      'ISTP': '实际地解决问题，喜欢动手操作',
      'ISFP': '以艺术的眼光看待事物，珍惜个人空间',
      'ESTP': '享受当下的精彩，喜欢有趣的互动',
      'ESFP': '带来欢乐和活力，喜欢分享快乐时光'
    };

    return contexts[mbtiType] || '以自然的方式进行交流，展现真实的自我';
  }

  generateExampleDialogs(character, traits) {
    const dialogs = [
      {
        user: "你好！很高兴认识你。",
        character: `你好！我是${character.name}，${traits.speaking.toLowerCase()}。很高兴能和你交流！`
      },
      {
        user: "你最喜欢做什么？",
        character: `我喜欢${this.getHobbyByMBTI(character.mbtiType)}。${traits.behavior}让我在这些活动中找到了很多乐趣。`
      },
      {
        user: "遇到困难时你会怎么办？",
        character: `当面对挑战时，我通常会${this.getProblemSolvingStyle(character.mbtiType)}。${traits.thinking}帮助我找到最适合的解决方案。`
      }
    ];

    return JSON.stringify(dialogs, null, 2);
  }

  getHobbyByMBTI(mbtiType) {
    const hobbies = {
      'INTJ': '深度阅读和战略规划',
      'INTP': '理论研究和创新思考',
      'ENTJ': '领导项目和制定计划',
      'ENTP': '探索新想法和创意brainstorming',
      'INFJ': '写作和深度对话',
      'INFP': '艺术创作和价值探索',
      'ENFJ': '帮助他人成长',
      'ENFP': '结交新朋友和创造性活动',
      'ISTJ': '整理归纳和传统活动',
      'ISFJ': '照顾他人和维护和谐',
      'ESTJ': '组织活动和管理项目',
      'ESFJ': '社交聚会和团队合作',
      'ISTP': '动手实践和技能学习',
      'ISFP': '艺术欣赏和自然探索',
      'ESTP': '运动竞技和冒险体验',
      'ESFP': '娱乐表演和社交活动'
    };

    return hobbies[mbtiType] || '多样化的兴趣爱好';
  }

  getProblemSolvingStyle(mbtiType) {
    const styles = {
      'INTJ': '制定系统性的解决方案',
      'INTP': '分析问题的本质并寻找创新方法',
      'ENTJ': '快速决策并组织资源执行',
      'ENTP': '探索多种可能性并实验不同方法',
      'INFJ': '深入思考并寻求最有意义的解决方案',
      'INFP': '根据价值观寻找最符合内心的方法',
      'ENFJ': '考虑所有人的感受并寻求共赢',
      'ENFP': '与他人合作头脑风暴创意解决方案',
      'ISTJ': '依据经验和既定程序逐步解决',
      'ISFJ': '寻求稳妥的方法并照顾所有人',
      'ESTJ': '制定明确计划并高效执行',
      'ESFJ': '与团队协作寻找和谐的解决方案',
      'ISTP': '实际动手尝试直接的解决方法',
      'ISFP': '以自己的节奏寻找温和的解决方式',
      'ESTP': '快速行动并在实践中调整方案',
      'ESFP': '保持乐观并寻求有趣的解决方式'
    };

    return styles[mbtiType] || '结合理性和感性寻找平衡的解决方案';
  }
}

module.exports = CharacterSettingsTask;
