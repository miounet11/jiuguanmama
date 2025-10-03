export interface CreatorOverview {
    totalCharacters: number;
    totalScenarios: number;
    publishedWorks: number;
    draftWorks: number;
    totalViews: number;
    totalLikes: number;
    totalFavorites: number;
    revenueThisMonth: number;
    followerCount: number;
}
export interface WorkStatistics {
    characterStats: {
        id: string;
        name: string;
        views: number;
        likes: number;
        favorites: number;
        rating: number;
        createdAt: Date;
    }[];
    scenarioStats: {
        id: string;
        name: string;
        views: number;
        likes: number;
        favorites: number;
        rating: number;
        createdAt: Date;
    }[];
    performanceTrend: {
        date: string;
        views: number;
        favorites: number;
    }[];
}
export interface AIGenerationConfig {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    includeAvatar?: boolean;
    avatarStyle?: string;
}
export interface AIGenerationResult {
    success: boolean;
    data?: any;
    error?: string;
    tokensUsed?: number;
    cost?: number;
}
/**
 * CreatorStudioService
 *
 * Manages Creator Studio functionality: statistics, AI generation, revenue.
 * Implements F4 (Creator Studio Dashboard) feature.
 */
export declare class CreatorStudioService {
    /**
     * Get creator overview statistics
     */
    getCreatorOverview(userId: string): Promise<CreatorOverview | null>;
    /**
     * Get detailed work statistics
     */
    getWorkStatistics(userId: string, options?: {
        limit?: number;
        sortBy?: 'views' | 'likes' | 'rating' | 'recent';
    }): Promise<WorkStatistics | null>;
    /**
     * AI-powered character generation
     */
    aiGenerateCharacter(userId: string, prompt: string, config?: AIGenerationConfig): Promise<AIGenerationResult>;
    /**
     * AI-powered scenario generation
     */
    aiGenerateScenario(userId: string, prompt: string, config?: AIGenerationConfig): Promise<AIGenerationResult>;
    /**
     * Get performance trend data
     */
    private getPerformanceTrend;
}
export declare const creatorStudioService: CreatorStudioService;
//# sourceMappingURL=creator-studio.service.d.ts.map