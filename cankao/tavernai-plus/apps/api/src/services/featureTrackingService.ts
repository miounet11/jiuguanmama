const { PrismaClient } = require('../../node_modules/.prisma/client');

const prisma = new PrismaClient();

export interface FeatureDefinition {
  id: string;
  name: string;
  category: 'core' | 'advanced' | 'expert';
  isExpertFeature: boolean;
  unlockCondition?: string;
  dependencies?: string[];
  scope: string[];
}

export interface UserExperience {
  totalSessions: number;
  messagesCount: number;
  charactersUsed: number;
  featuresUsed: string[];
  expertFeaturesUsed: string[];
  skillLevel: string;
}

// 功能清单定义
export const FEATURE_MANIFEST: FeatureDefinition[] = [
  // 角色浏览功能
  {
    id: 'character-basic-browse',
    name: '角色浏览',
    category: 'core',
    isExpertFeature: false,
    scope: ['character-discovery']
  },
  {
    id: 'character-advanced-search',
    name: '高级搜索',
    category: 'advanced',
    isExpertFeature: true,
    unlockCondition: 'charactersUsed >= 10 || totalSessions >= 5',
    scope: ['character-discovery']
  },

  // 对话功能
  {
    id: 'chat-basic',
    name: '基础对话',
    category: 'core',
    isExpertFeature: false,
    scope: ['chat']
  },
  {
    id: 'chat-message-editing',
    name: '消息编辑',
    category: 'advanced',
    isExpertFeature: true,
    unlockCondition: 'messagesCount >= 50',
    scope: ['chat']
  },
  {
    id: 'chat-ai-model-selection',
    name: 'AI模型选择',
    category: 'expert',
    isExpertFeature: true,
    unlockCondition: 'totalSessions >= 15 && featuresUsed >= 8',
    scope: ['chat']
  },

  // 角色创建功能
  {
    id: 'character-creation-basic',
    name: '角色创建',
    category: 'advanced',
    isExpertFeature: false,
    unlockCondition: 'totalSessions >= 3',
    scope: ['character-creation']
  },
  {
    id: 'character-ai-generation',
    name: 'AI角色生成',
    category: 'advanced',
    isExpertFeature: true,
    unlockCondition: 'charactersUsed >= 2 && messagesCount >= 100',
    dependencies: ['character-creation-basic'],
    scope: ['character-creation']
  },

  // 世界观功能
  {
    id: 'worldinfo-basic',
    name: '世界观信息',
    category: 'advanced',
    isExpertFeature: false,
    unlockCondition: 'messagesCount >= 30',
    scope: ['chat', 'worldinfo']
  },
  {
    id: 'worldinfo-dynamic-injection',
    name: '动态世界观',
    category: 'expert',
    isExpertFeature: true,
    unlockCondition: 'totalSessions >= 10 && skillLevel >= "intermediate"',
    dependencies: ['worldinfo-basic'],
    scope: ['chat', 'worldinfo']
  },

  // 高级功能
  {
    id: 'chat-export',
    name: '对话导出',
    category: 'expert',
    isExpertFeature: true,
    unlockCondition: 'messagesCount >= 200',
    scope: ['chat']
  },
  {
    id: 'character-sharing',
    name: '角色分享',
    category: 'expert',
    isExpertFeature: true,
    unlockCondition: 'charactersUsed >= 5 && totalSessions >= 20',
    scope: ['character-creation']
  }
];

/**
 * 功能追踪服务类
 */
export class FeatureTrackingService {
  /**
   * 记录功能使用并检查解锁条件
   */
  static async recordFeatureUsage(userId: string, featureId: string): Promise<{
    recorded: boolean;
    newUnlocks: string[];
    skillLevelChanged: boolean;
    newSkillLevel?: string;
  }> {
    try {
      const feature = FEATURE_MANIFEST.find(f => f.id === featureId);
      if (!feature) {
        throw new Error(`Feature ${featureId} not found in manifest`);
      }

      // 记录功能使用
      await prisma.featureUsageLog.upsert({
        where: {
          user_feature_unique: { userId, featureId }
        },
        update: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
          isExpertFeature: feature.isExpertFeature
        },
        create: {
          userId,
          featureId,
          isExpertFeature: feature.isExpertFeature,
          usageCount: 1
        }
      });

      // 获取用户当前状态
      const userExperience = await this.getUserExperience(userId);

      // 检查新功能解锁
      const newUnlocks = await this.checkFeatureUnlocks(userId, userExperience);

      // 更新技能水平
      const { changed, newLevel } = await this.updateSkillLevel(userId, userExperience);

      return {
        recorded: true,
        newUnlocks,
        skillLevelChanged: changed,
        newSkillLevel: newLevel
      };
    } catch (error) {
      console.error('Error recording feature usage:', error);
      return {
        recorded: false,
        newUnlocks: [],
        skillLevelChanged: false
      };
    }
  }

  /**
   * 获取用户体验数据
   */
  static async getUserExperience(userId: string): Promise<UserExperience> {
    const [userMode, totalSessions, messagesCount, charactersUsed, featureUsage] = await Promise.all([
      prisma.userMode.findUnique({ where: { userId } }),
      prisma.chatSession.count({ where: { userId } }),
      prisma.message.count({ where: { userId } }),
      prisma.character.count({ where: { creatorId: userId } }),
      prisma.featureUsageLog.findMany({ where: { userId } })
    ]);

    const featuresUsed = featureUsage.map(f => f.featureId);
    const expertFeaturesUsed = featureUsage
      .filter(f => f.isExpertFeature)
      .map(f => f.featureId);

    return {
      totalSessions,
      messagesCount,
      charactersUsed,
      featuresUsed,
      expertFeaturesUsed,
      skillLevel: userMode?.skillLevel || 'beginner'
    };
  }

  /**
   * 检查功能解锁条件
   */
  static async checkFeatureUnlocks(userId: string, userExperience: UserExperience): Promise<string[]> {
    const newUnlocks: string[] = [];

    // 获取已解锁的功能
    const existingUnlocks = await prisma.featureUnlock.findMany({
      where: { userId },
      select: { featureId: true }
    });
    const unlockedFeatureIds = new Set(existingUnlocks.map(u => u.featureId));

    for (const feature of FEATURE_MANIFEST) {
      // 跳过已解锁的功能
      if (unlockedFeatureIds.has(feature.id)) continue;

      // 跳过没有解锁条件的功能
      if (!feature.unlockCondition) continue;

      // 检查依赖项
      if (feature.dependencies) {
        const dependenciesMet = feature.dependencies.every(dep =>
          unlockedFeatureIds.has(dep)
        );
        if (!dependenciesMet) continue;
      }

      // 评估解锁条件
      if (this.evaluateUnlockCondition(feature.unlockCondition, userExperience)) {
        // 解锁功能
        await prisma.featureUnlock.create({
          data: {
            userId,
            featureId: feature.id,
            unlockTrigger: 'usage',
            unlockCondition: feature.unlockCondition
          }
        });

        newUnlocks.push(feature.id);
        unlockedFeatureIds.add(feature.id);
      }
    }

    return newUnlocks;
  }

  /**
   * 安全地评估解锁条件
   */
  static evaluateUnlockCondition(condition: string, userExp: UserExperience): boolean {
    try {
      const context = {
        totalSessions: userExp.totalSessions,
        messagesCount: userExp.messagesCount,
        charactersUsed: userExp.charactersUsed,
        featuresUsed: userExp.featuresUsed.length,
        expertFeaturesUsed: userExp.expertFeaturesUsed.length,
        skillLevel: userExp.skillLevel
      };

      // 简单的条件解析器
      const operators = ['>=', '<=', '>', '<', '==', '!='];

      // 处理 && 操作符
      if (condition.includes('&&')) {
        const conditions = condition.split('&&').map(c => c.trim());
        return conditions.every(c => this.evaluateUnlockCondition(c, userExp));
      }

      // 处理 || 操作符
      if (condition.includes('||')) {
        const conditions = condition.split('||').map(c => c.trim());
        return conditions.some(c => this.evaluateUnlockCondition(c, userExp));
      }

      // 处理单个条件
      for (const op of operators) {
        if (condition.includes(op)) {
          const [left, right] = condition.split(op).map(s => s.trim());
          const leftValue = context[left as keyof typeof context] || 0;

          // 处理字符串比较
          if (left === 'skillLevel') {
            const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
            const leftIndex = skillLevels.indexOf(leftValue as string);
            const rightIndex = skillLevels.indexOf(right.replace(/"/g, ''));

            switch (op) {
              case '>=': return leftIndex >= rightIndex;
              case '<=': return leftIndex <= rightIndex;
              case '>': return leftIndex > rightIndex;
              case '<': return leftIndex < rightIndex;
              case '==': return leftIndex === rightIndex;
              case '!=': return leftIndex !== rightIndex;
            }
          } else {
            // 数值比较
            const rightValue = parseInt(right) || 0;
            const numLeftValue = Number(leftValue);

            switch (op) {
              case '>=': return numLeftValue >= rightValue;
              case '<=': return numLeftValue <= rightValue;
              case '>': return numLeftValue > rightValue;
              case '<': return numLeftValue < rightValue;
              case '==': return numLeftValue === rightValue;
              case '!=': return numLeftValue !== rightValue;
            }
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error evaluating unlock condition:', error);
      return false;
    }
  }

  /**
   * 更新用户技能水平
   */
  static async updateSkillLevel(userId: string, userExperience: UserExperience): Promise<{
    changed: boolean;
    newLevel?: string;
  }> {
    const currentLevel = userExperience.skillLevel;
    const totalScore = userExperience.totalSessions +
                      userExperience.messagesCount / 10 +
                      userExperience.charactersUsed * 2 +
                      userExperience.featuresUsed.length * 3;

    let newLevel = currentLevel;

    if (totalScore >= 200 && userExperience.expertFeaturesUsed.length >= 5) {
      newLevel = 'expert';
    } else if (totalScore >= 100 && userExperience.featuresUsed.length >= 10) {
      newLevel = 'advanced';
    } else if (totalScore >= 50 && userExperience.featuresUsed.length >= 5) {
      newLevel = 'intermediate';
    } else {
      newLevel = 'beginner';
    }

    if (newLevel !== currentLevel) {
      await prisma.userMode.upsert({
        where: { userId },
        update: {
          skillLevel: newLevel,
          totalSessions: userExperience.totalSessions,
          messagesCount: userExperience.messagesCount,
          charactersUsed: userExperience.charactersUsed
        },
        create: {
          userId,
          skillLevel: newLevel,
          totalSessions: userExperience.totalSessions,
          messagesCount: userExperience.messagesCount,
          charactersUsed: userExperience.charactersUsed
        }
      });

      return { changed: true, newLevel };
    }

    return { changed: false };
  }

  /**
   * 获取指定范围的功能清单
   */
  static getFeatureManifest(scope = 'global'): FeatureDefinition[] {
    if (scope === 'global') {
      return FEATURE_MANIFEST;
    }

    return FEATURE_MANIFEST.filter(feature =>
      feature.scope.includes(scope)
    );
  }

  /**
   * 获取用户可见的功能
   */
  static async getVisibleFeatures(userId: string, mode: 'simplified' | 'expert', scope = 'global'): Promise<FeatureDefinition[]> {
    const manifest = this.getFeatureManifest(scope);

    if (mode === 'expert') {
      return manifest; // 专家模式显示所有功能
    }

    // 简洁模式只显示核心功能和已解锁的功能
    const unlockedFeatures = await prisma.featureUnlock.findMany({
      where: { userId },
      select: { featureId: true }
    });
    const unlockedIds = new Set(unlockedFeatures.map(u => u.featureId));

    return manifest.filter(feature =>
      feature.category === 'core' || unlockedIds.has(feature.id)
    );
  }

  /**
   * 分析用户升级到专家模式的时机
   */
  static async analyzeUpgradeOpportunity(userId: string): Promise<{
    shouldUpgrade: boolean;
    confidence: number;
    reasons: string[];
    signals: Record<string, boolean>;
  }> {
    const userExperience = await this.getUserExperience(userId);

    const upgradeSignals = {
      hasEnoughSessions: userExperience.totalSessions >= 10,
      hasEnoughMessages: userExperience.messagesCount >= 100,
      hasCreatedCharacters: userExperience.charactersUsed >= 5,
      hasUsedManyFeatures: userExperience.featuresUsed.length >= 8,
      hasUsedExpertFeatures: userExperience.expertFeaturesUsed.length >= 2,
      isAdvancedUser: ['advanced', 'expert'].includes(userExperience.skillLevel)
    };

    const signalCount = Object.values(upgradeSignals).filter(Boolean).length;
    const shouldUpgrade = signalCount >= 4; // 至少满足4个条件
    const confidence = Math.min(signalCount / 6, 1); // 信心度

    const reasons: string[] = [];
    if (upgradeSignals.hasEnoughSessions) reasons.push('有丰富的对话经验');
    if (upgradeSignals.hasEnoughMessages) reasons.push('发送了大量消息');
    if (upgradeSignals.hasCreatedCharacters) reasons.push('创建了多个角色');
    if (upgradeSignals.hasUsedManyFeatures) reasons.push('使用了多种功能');
    if (upgradeSignals.hasUsedExpertFeatures) reasons.push('尝试了高级功能');
    if (upgradeSignals.isAdvancedUser) reasons.push('技能水平较高');

    return {
      shouldUpgrade,
      confidence,
      reasons,
      signals: upgradeSignals
    };
  }
}