import { PrismaClient } from '../../node_modules/.prisma/client';

const prisma = new PrismaClient();

// Types
export interface GamificationOverview {
  totalCharacters: number;
  totalAffinity: number;
  averageAffinityLevel: number;
  totalProficiencies: number;
  averageProficiencyLevel: number;
  totalAchievements: number;
  unlockedAchievements: number;
  completedQuests: number;
  activeQuests: number;
  dailyStreak: number;
}

export interface AffinityData {
  characterId: string;
  characterName: string;
  characterAvatar?: string;
  affinityLevel: number;
  affinityPoints: number;
  nextLevelPoints: number;
  lastInteraction: Date;
}

export interface ProficiencyData {
  characterId: string;
  characterName: string;
  proficiencyLevel: number;
  proficiencyPoints: number;
  skills: string[];
  nextLevelPoints: number;
}

export interface DailyQuestData {
  id: string;
  questType: string;
  description: string;
  progress: number;
  targetCount: number;
  rewards: {
    exp?: number;
    credits?: number;
    items?: string[];
  };
  isCompleted: boolean;
  isClaimed: boolean;
  expiresAt: Date;
}

export interface AchievementData {
  id: string;
  achievementId: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  progress: number;
  targetProgress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

/**
 * GamificationDashboardService
 *
 * Manages gamification dashboard: affinity, proficiency, quests, achievements.
 * Implements F5 (Gamification Player Dashboard) feature.
 */
export class GamificationDashboardService {
  /**
   * Get gamification overview
   */
  async getGamificationOverview(userId: string): Promise<GamificationOverview | null> {
    try {
      // Get affinity statistics
      const affinities = await prisma.characterAffinity.findMany({
        where: { userId },
      });

      const totalAffinity = affinities.reduce((sum, a) => sum + a.affinityPoints, 0);
      const averageAffinityLevel =
        affinities.length > 0
          ? affinities.reduce((sum, a) => sum + a.affinityLevel, 0) / affinities.length
          : 0;

      // Get proficiency statistics
      const proficiencies = await prisma.characterProficiency.findMany({
        where: { userId },
      });

      const totalProficiencies = proficiencies.length;
      const averageProficiencyLevel =
        proficiencies.length > 0
          ? proficiencies.reduce((sum, p) => sum + p.proficiencyLevel, 0) / proficiencies.length
          : 0;

      // Get achievement statistics
      const [totalAchievements, unlockedAchievements] = await Promise.all([
        prisma.userAchievement.count({
          where: { userId },
        }),
        prisma.userAchievement.count({
          where: { userId, isUnlocked: true },
        }),
      ]);

      // Get quest statistics
      const [completedQuests, activeQuests] = await Promise.all([
        prisma.dailyQuest.count({
          where: { userId, isCompleted: true },
        }),
        prisma.dailyQuest.count({
          where: {
            userId,
            isCompleted: false,
            expiresAt: {
              gt: new Date(),
            },
          },
        }),
      ]);

      // Calculate daily streak (placeholder)
      const dailyStreak = 0; // TODO: Implement streak calculation

      return {
        totalCharacters: affinities.length,
        totalAffinity,
        averageAffinityLevel,
        totalProficiencies,
        averageProficiencyLevel,
        totalAchievements,
        unlockedAchievements,
        completedQuests,
        activeQuests,
        dailyStreak,
      };
    } catch (error) {
      console.error('Error getting gamification overview:', error);
      return null;
    }
  }

  /**
   * Get affinity list with pagination
   */
  async getAffinityList(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: 'level' | 'points' | 'recent';
    } = {}
  ): Promise<{ affinities: AffinityData[]; total: number }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;

      // Determine sort order
      let orderBy: any = { affinityLevel: 'desc' };
      if (options.sortBy === 'points') {
        orderBy = { affinityPoints: 'desc' };
      } else if (options.sortBy === 'recent') {
        orderBy = { lastInteractionAt: 'desc' };
      }

      // Get affinities with character data
      const [affinities, total] = await Promise.all([
        prisma.characterAffinity.findMany({
          where: { userId },
          include: {
            character: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.characterAffinity.count({
          where: { userId },
        }),
      ]);

      return {
        affinities: affinities.map(a => ({
          characterId: a.characterId,
          characterName: a.character.name,
          characterAvatar: a.character.avatar || undefined,
          affinityLevel: a.affinityLevel,
          affinityPoints: a.affinityPoints,
          nextLevelPoints: this.getNextLevelPoints(a.affinityLevel),
          lastInteraction: a.lastInteractionAt,
        })),
        total,
      };
    } catch (error) {
      console.error('Error getting affinity list:', error);
      return { affinities: [], total: 0 };
    }
  }

  /**
   * Get proficiency list with pagination
   */
  async getProficiencyList(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: 'level' | 'points';
    } = {}
  ): Promise<{ proficiencies: ProficiencyData[]; total: number }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;

      // Determine sort order
      const orderBy =
        options.sortBy === 'points'
          ? { proficiencyPoints: 'desc' }
          : { proficiencyLevel: 'desc' };

      // Get proficiencies with character data
      const [proficiencies, total] = await Promise.all([
        prisma.characterProficiency.findMany({
          where: { userId },
          include: {
            character: {
              select: {
                name: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.characterProficiency.count({
          where: { userId },
        }),
      ]);

      return {
        proficiencies: proficiencies.map(p => ({
          characterId: p.characterId,
          characterName: p.character.name,
          proficiencyLevel: p.proficiencyLevel,
          proficiencyPoints: p.proficiencyPoints,
          skills: JSON.parse(p.skills || '[]'),
          nextLevelPoints: this.getNextLevelPoints(p.proficiencyLevel),
        })),
        total,
      };
    } catch (error) {
      console.error('Error getting proficiency list:', error);
      return { proficiencies: [], total: 0 };
    }
  }

  /**
   * Get daily quests
   */
  async getDailyQuests(userId: string): Promise<DailyQuestData[]> {
    try {
      const now = new Date();

      const quests = await prisma.dailyQuest.findMany({
        where: {
          userId,
          expiresAt: {
            gt: now,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return quests.map(q => ({
        id: q.id,
        questType: q.questType,
        description: q.description,
        progress: q.progress,
        targetCount: q.targetCount,
        rewards: JSON.parse(q.rewards),
        isCompleted: q.isCompleted,
        isClaimed: q.isClaimed,
        expiresAt: q.expiresAt,
      }));
    } catch (error) {
      console.error('Error getting daily quests:', error);
      return [];
    }
  }

  /**
   * Get achievements with filters
   */
  async getAchievements(
    userId: string,
    filters: {
      category?: string;
      unlocked?: boolean;
      rarity?: string;
    } = {}
  ): Promise<AchievementData[]> {
    try {
      const where: any = { userId };

      if (filters.unlocked !== undefined) {
        where.isUnlocked = filters.unlocked;
      }

      const achievements = await prisma.userAchievement.findMany({
        where,
        orderBy: [{ isUnlocked: 'desc' }, { unlockedAt: 'desc' }],
      });

      // Map to achievement data (with placeholder metadata)
      return achievements.map(a => ({
        id: a.id,
        achievementId: a.achievementId,
        name: this.getAchievementName(a.achievementId),
        description: this.getAchievementDescription(a.achievementId),
        icon: this.getAchievementIcon(a.achievementId),
        category: this.getAchievementCategory(a.achievementId),
        progress: a.progress,
        targetProgress: 100,
        isUnlocked: a.isUnlocked,
        unlockedAt: a.unlockedAt || undefined,
        rarity: this.getAchievementRarity(a.achievementId),
      }));
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  }

  /**
   * Calculate next level points requirement
   */
  private getNextLevelPoints(currentLevel: number): number {
    // Progressive scaling: level * 100 points per level
    return currentLevel * 100;
  }

  /**
   * Get achievement metadata (placeholder - should be from config)
   */
  private getAchievementName(achievementId: string): string {
    const names: Record<string, string> = {
      'onboarding-complete': '新手上路',
      'first-chat': '初次相遇',
      'chat-100': '健谈者',
      'affinity-max': '真爱无敌',
    };
    return names[achievementId] || achievementId;
  }

  private getAchievementDescription(achievementId: string): string {
    const descriptions: Record<string, string> = {
      'onboarding-complete': '完成新手引导',
      'first-chat': '与角色进行第一次对话',
      'chat-100': '累计发送100条消息',
      'affinity-max': '与角色达到满级亲密度',
    };
    return descriptions[achievementId] || '成就描述';
  }

  private getAchievementIcon(achievementId: string): string {
    const icons: Record<string, string> = {
      'onboarding-complete': 'AcademicCap',
      'first-chat': 'ChatBubble',
      'chat-100': 'Fire',
      'affinity-max': 'Heart',
    };
    return icons[achievementId] || 'Star';
  }

  private getAchievementCategory(achievementId: string): string {
    if (achievementId.includes('chat')) return 'social';
    if (achievementId.includes('affinity')) return 'relationship';
    if (achievementId.includes('onboarding')) return 'progress';
    return 'general';
  }

  private getAchievementRarity(achievementId: string): 'common' | 'rare' | 'epic' | 'legendary' {
    if (achievementId.includes('max') || achievementId.includes('100')) return 'epic';
    if (achievementId.includes('first') || achievementId.includes('onboarding')) return 'common';
    return 'rare';
  }
}

// Export singleton instance
export const gamificationDashboardService = new GamificationDashboardService();
