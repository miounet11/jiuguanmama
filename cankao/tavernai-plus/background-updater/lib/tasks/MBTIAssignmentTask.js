const BaseTask = require('../BaseTask');
const Database = require('better-sqlite3');
const path = require('path');

/**
 * MBTI类型分配任务
 */
class MBTIAssignmentTask extends BaseTask {
  constructor(taskId, data = {}) {
    super(taskId, data);
    this.dbPath = path.join(__dirname, '../../../apps/api/prisma/dev.db');
  }

  async execute() {
    const { characterIds, forceUpdate = false } = this.data;

    const db = new Database(this.dbPath);

    try {
      // 获取需要分配MBTI的角色
      let characters;
      if (characterIds && characterIds.length > 0) {
        const placeholders = characterIds.map(() => '?').join(',');
        const condition = forceUpdate ?
          `id IN (${placeholders})` :
          `id IN (${placeholders}) AND (mbtiType IS NULL OR mbtiType = '')`;
        characters = db.prepare(`
          SELECT id, name, description, personality, background
          FROM Character
          WHERE ${condition}
        `).all(...characterIds);
      } else {
        const condition = forceUpdate ?
          '1=1' :
          '(mbtiType IS NULL OR mbtiType = \'\')';
        characters = db.prepare(`
          SELECT id, name, description, personality, background
          FROM Character
          WHERE ${condition}
        `).all();
      }

      if (characters.length === 0) {
        return { success: true, message: '没有需要分配MBTI的角色', assigned: 0 };
      }

      this.updateProgress(10, `找到 ${characters.length} 个需要分配MBTI的角色`);

      let assigned = 0;
      const total = characters.length;
      const results = [];

      for (let i = 0; i < characters.length; i++) {
        const character = characters[i];

        this.updateProgress(
          10 + ((i + 1) / total) * 85,
          `分配MBTI: ${character.name} (${i + 1}/${total})`
        );

        try {
          const mbtiType = this.assignMBTIType(character);

          // 更新数据库
          db.prepare(`
            UPDATE Character
            SET mbtiType = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(mbtiType, character.id);

          assigned++;
          results.push({
            characterId: character.id,
            characterName: character.name,
            mbtiType,
            success: true
          });

        } catch (error) {
          console.error(`分配角色 ${character.name} MBTI失败:`, error);
          results.push({
            characterId: character.id,
            characterName: character.name,
            success: false,
            error: error.message
          });
        }
      }

      this.updateProgress(95, `MBTI分配完成，成功分配 ${assigned} 个`);

      // 生成统计信息
      const mbtiStats = this.generateMBTIStatistics(results.filter(r => r.success));

      return {
        success: true,
        total: characters.length,
        assigned,
        failed: characters.length - assigned,
        results,
        statistics: mbtiStats
      };

    } finally {
      db.close();
    }
  }

  assignMBTIType(character) {
    // 定义16种MBTI类型及其特征关键词
    const mbtiProfiles = {
      'INTJ': {
        keywords: ['战略', '独立', '理性', '计划', '创新', '分析', '远见', '效率', '系统', '目标'],
        traits: ['智慧', '冷静', '深思', '领导', '完美主义'],
        weight: 1
      },
      'INTP': {
        keywords: ['理论', '逻辑', '思考', '创意', '好奇', '分析', '概念', '探索', '知识', '独特'],
        traits: ['聪明', '内向', '理性', '思辨', '创新'],
        weight: 1
      },
      'ENTJ': {
        keywords: ['领导', '决策', '目标', '组织', '效率', '权威', '管理', '成就', '竞争', '影响'],
        traits: ['强势', '自信', '果断', '野心', '组织力'],
        weight: 1
      },
      'ENTP': {
        keywords: ['创新', '辩论', '可能性', '创意', '灵活', '探索', '概念', '变化', '启发', '多样'],
        traits: ['活跃', '创新', '机智', '灵活', '富有想象力'],
        weight: 1
      },
      'INFJ': {
        keywords: ['洞察', '理想', '深度', '意义', '和谐', '直觉', '创意', '帮助', '理解', '未来'],
        traits: ['温和', '神秘', '理想主义', '富有同情心', '有洞察力'],
        weight: 1
      },
      'INFP': {
        keywords: ['价值', '真实', '创意', '和谐', '个性', '理想', '情感', '艺术', '独特', '内在'],
        traits: ['温柔', '理想主义', '艺术气质', '真诚', '富有创意'],
        weight: 1
      },
      'ENFJ': {
        keywords: ['人际', '鼓励', '和谐', '发展', '领导', '沟通', '团队', '影响', '关怀', '成长'],
        traits: ['魅力', '关怀', '鼓舞人心', '善于交际', '有组织力'],
        weight: 1
      },
      'ENFP': {
        keywords: ['热情', '创意', '人际', '可能性', '灵感', '自由', '多样', '乐观', '活力', '连接'],
        traits: ['热情', '活力', '创意', '乐观', '富有感染力'],
        weight: 1
      },
      'ISTJ': {
        keywords: ['责任', '稳定', '传统', '细节', '可靠', '系统', '秩序', '实践', '忠诚', '坚持'],
        traits: ['可靠', '务实', '守序', '负责任', '坚韧'],
        weight: 1
      },
      'ISFJ': {
        keywords: ['服务', '和谐', '支持', '关怀', '细心', '传统', '稳定', '帮助', '保护', '温暖'],
        traits: ['温暖', '体贴', '忠诚', '谦逊', '善良'],
        weight: 1
      },
      'ESTJ': {
        keywords: ['组织', '效率', '领导', '传统', '决策', '管理', '秩序', '结果', '权威', '实践'],
        traits: ['高效', '组织力强', '果断', '传统', '负责任'],
        weight: 1
      },
      'ESFJ': {
        keywords: ['和谐', '合作', '服务', '传统', '支持', '团队', '关怀', '社交', '责任', '人际'],
        traits: ['友善', '合作', '关怀他人', '善于交际', '重视和谐'],
        weight: 1
      },
      'ISTP': {
        keywords: ['实践', '技能', '独立', '适应', '工具', '解决', '灵活', '观察', '冷静', '效率'],
        traits: ['实用主义', '冷静', '独立', '灵活', '善于解决问题'],
        weight: 1
      },
      'ISFP': {
        keywords: ['艺术', '和谐', '价值', '美感', '温和', '个性', '自由', '创意', '敏感', '真实'],
        traits: ['温和', '艺术气质', '敏感', '和平', '富有创意'],
        weight: 1
      },
      'ESTP': {
        keywords: ['行动', '现实', '灵活', '冒险', '社交', '实践', '活力', '适应', '竞争', '当下'],
        traits: ['活跃', '实用', '灵活', '冒险', '善于交际'],
        weight: 1
      },
      'ESFP': {
        keywords: ['热情', '人际', '乐观', '灵活', '活力', '娱乐', '和谐', '自发', '表现', '享受'],
        traits: ['热情', '友善', '乐观', '活力四射', '善于娱乐'],
        weight: 1
      }
    };

    // 分析角色文本内容
    const textContent = [
      character.name || '',
      character.description || '',
      character.personality || '',
      character.background || ''
    ].join(' ').toLowerCase();

    // 计算每个MBTI类型的匹配分数
    const scores = {};

    Object.keys(mbtiProfiles).forEach(mbtiType => {
      const profile = mbtiProfiles[mbtiType];
      let score = 0;

      // 关键词匹配
      profile.keywords.forEach(keyword => {
        if (textContent.includes(keyword)) {
          score += 2;
        }
      });

      // 特征匹配
      profile.traits.forEach(trait => {
        if (textContent.includes(trait)) {
          score += 3;
        }
      });

      scores[mbtiType] = score;
    });

    // 找到最高分的MBTI类型
    let bestMBTI = 'ISFP'; // 默认类型
    let maxScore = 0;

    Object.keys(scores).forEach(mbtiType => {
      if (scores[mbtiType] > maxScore) {
        maxScore = scores[mbtiType];
        bestMBTI = mbtiType;
      }
    });

    // 如果没有明显匹配，基于角色名称和描述进行智能分配
    if (maxScore === 0) {
      bestMBTI = this.intelligentMBTIAssignment(character);
    }

    return bestMBTI;
  }

  intelligentMBTIAssignment(character) {
    const name = (character.name || '').toLowerCase();
    const description = (character.description || '').toLowerCase();

    // 基于常见名称模式的分配
    const namePatterns = {
      'INTJ': ['智', '策', '谋', '思', '博', '睿', '远'],
      'INTP': ['理', '逻', '析', '研', '学', '奇', '探'],
      'ENTJ': ['领', '帅', '王', '皇', '主', '霸', '威'],
      'ENTP': ['创', '新', '变', '活', '机', '巧', '灵'],
      'INFJ': ['梦', '诗', '雅', '静', '深', '玄', '慧'],
      'INFP': ['柔', '温', '美', '艺', '心', '情', '纯'],
      'ENFJ': ['暖', '光', '爱', '护', '帮', '导', '师'],
      'ENFP': ['阳', '欢', '乐', '活', '朝', '春', '花'],
      'ISTJ': ['稳', '守', '坚', '忠', '诚', '实', '勤'],
      'ISFJ': ['善', '仁', '护', '慈', '柔', '贤', '淑'],
      'ESTJ': ['刚', '强', '严', '正', '管', '组', '效'],
      'ESFJ': ['和', '友', '团', '合', '亲', '暖', '笑'],
      'ISTP': ['技', '工', '匠', '巧', '手', '练', '精'],
      'ISFP': ['美', '艺', '画', '音', '舞', '诗', '雅'],
      'ESTP': ['动', '冲', '闯', '拼', '勇', '敢', '快'],
      'ESFP': ['乐', '笑', '趣', '玩', '开', '心', '喜']
    };

    // 检查名称模式
    for (const [mbtiType, patterns] of Object.entries(namePatterns)) {
      for (const pattern of patterns) {
        if (name.includes(pattern)) {
          return mbtiType;
        }
      }
    }

    // 基于描述长度和复杂度的分配
    if (description.length > 100) {
      // 复杂描述倾向于内向思考型
      return Math.random() > 0.5 ? 'INTJ' : 'INFJ';
    } else if (description.length > 50) {
      // 中等描述倾向于外向型
      return Math.random() > 0.5 ? 'ENFP' : 'ESFJ';
    } else {
      // 简短描述倾向于实用型
      return Math.random() > 0.5 ? 'ISTP' : 'ISFP';
    }
  }

  generateMBTIStatistics(successfulResults) {
    const mbtiCounts = {};
    const mbtiCategories = {
      'Analysts': ['INTJ', 'INTP', 'ENTJ', 'ENTP'],
      'Diplomats': ['INFJ', 'INFP', 'ENFJ', 'ENFP'],
      'Sentinels': ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'],
      'Explorers': ['ISTP', 'ISFP', 'ESTP', 'ESFP']
    };

    // 统计各MBTI类型数量
    successfulResults.forEach(result => {
      const mbtiType = result.mbtiType;
      mbtiCounts[mbtiType] = (mbtiCounts[mbtiType] || 0) + 1;
    });

    // 统计各类别分布
    const categoryStats = {};
    Object.keys(mbtiCategories).forEach(category => {
      categoryStats[category] = {
        count: 0,
        types: {}
      };

      mbtiCategories[category].forEach(mbtiType => {
        const count = mbtiCounts[mbtiType] || 0;
        categoryStats[category].count += count;
        if (count > 0) {
          categoryStats[category].types[mbtiType] = count;
        }
      });
    });

    return {
      total: successfulResults.length,
      byType: mbtiCounts,
      byCategory: categoryStats,
      distribution: Object.keys(mbtiCounts).map(type => ({
        type,
        count: mbtiCounts[type],
        percentage: ((mbtiCounts[type] / successfulResults.length) * 100).toFixed(1)
      })).sort((a, b) => b.count - a.count)
    };
  }
}

module.exports = MBTIAssignmentTask;
