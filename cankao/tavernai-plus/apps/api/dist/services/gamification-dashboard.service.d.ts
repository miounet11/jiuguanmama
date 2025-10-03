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
export declare class GamificationDashboardService {
    /**
     * Get gamification overview
     */
    getGamificationOverview(userId: string): Promise<GamificationOverview | null>;
    /**
     * Get affinity list with pagination
     */
    getAffinityList(userId: string, options?: {
        page?: number;
        limit?: number;
        sortBy?: 'level' | 'points' | 'recent';
    }): Promise<{
        affinities: AffinityData[];
        total: number;
    }>;
    /**
     * Get proficiency list with pagination
     */
    getProficiencyList(userId: string, options?: {
        page?: number;
        limit?: number;
        sortBy?: 'level' | 'points';
    }): Promise<{
        proficiencies: ProficiencyData[];
        total: number;
    }>;
    /**
     * Get daily quests
     */
    getDailyQuests(userId: string): Promise<DailyQuestData[]>;
    /**
     * Get achievements with filters
     */
    getAchievements(userId: string, filters?: {
        category?: string;
        unlocked?: boolean;
        rarity?: string;
    }): Promise<AchievementData[]>;
    /**
     * Calculate next level points requirement
     */
    private getNextLevelPoints;
    /**
     * Get achievement metadata (placeholder - should be from config)
     */
    private getAchievementName;
    private getAchievementDescription;
    private getAchievementIcon;
    private getAchievementCategory;
    private getAchievementRarity;
}
export declare const gamificationDashboardService: GamificationDashboardService;
//# sourceMappingURL=gamification-dashboard.service.d.ts.map