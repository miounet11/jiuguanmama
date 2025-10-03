"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.creatorStudioService = exports.CreatorStudioService = void 0;
const client_1 = require("../../node_modules/.prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * CreatorStudioService
 *
 * Manages Creator Studio functionality: statistics, AI generation, revenue.
 * Implements F4 (Creator Studio Dashboard) feature.
 */
class CreatorStudioService {
    /**
     * Get creator overview statistics
     */
    async getCreatorOverview(userId) {
        try {
            // Get character counts
            const [totalCharacters, publishedCharacters, draftCharacters] = await Promise.all([
                prisma.character.count({
                    where: { creatorId: userId },
                }),
                prisma.character.count({
                    where: { creatorId: userId, isPublic: true },
                }),
                prisma.character.count({
                    where: { creatorId: userId, isPublic: false },
                }),
            ]);
            // Get scenario counts
            const [totalScenarios, publishedScenarios, draftScenarios] = await Promise.all([
                prisma.scenario.count({
                    where: { userId },
                }),
                prisma.scenario.count({
                    where: { userId, isPublic: true },
                }),
                prisma.scenario.count({
                    where: { userId, isPublic: false },
                }),
            ]);
            // Get engagement statistics
            const characters = await prisma.character.findMany({
                where: { creatorId: userId },
                select: {
                    views: true,
                    favorites: true,
                    ratings: true,
                },
            });
            const totalViews = characters.reduce((sum, c) => sum + (c.views || 0), 0);
            const totalFavorites = characters.reduce((sum, c) => sum + c.favorites.length, 0);
            const totalLikes = characters.reduce((sum, c) => sum + c.ratings.length, 0);
            // Get follower count
            const followerCount = await prisma.follow.count({
                where: { followingId: userId },
            });
            // Calculate revenue (placeholder - implement based on your payment system)
            const revenueThisMonth = 0; // TODO: Implement revenue calculation
            return {
                totalCharacters,
                totalScenarios,
                publishedWorks: publishedCharacters + publishedScenarios,
                draftWorks: draftCharacters + draftScenarios,
                totalViews,
                totalLikes,
                totalFavorites,
                revenueThisMonth,
                followerCount,
            };
        }
        catch (error) {
            console.error('Error getting creator overview:', error);
            return null;
        }
    }
    /**
     * Get detailed work statistics
     */
    async getWorkStatistics(userId, options = {}) {
        try {
            const limit = options.limit || 10;
            const sortBy = options.sortBy || 'views';
            // Get character statistics
            const characters = await prisma.character.findMany({
                where: { creatorId: userId, isPublic: true },
                select: {
                    id: true,
                    name: true,
                    views: true,
                    rating: true,
                    createdAt: true,
                    favorites: {
                        select: { id: true },
                    },
                    ratings: {
                        select: { id: true },
                    },
                },
                orderBy: sortBy === 'views'
                    ? { views: 'desc' }
                    : sortBy === 'rating'
                        ? { rating: 'desc' }
                        : { createdAt: 'desc' },
                take: limit,
            });
            // Get scenario statistics
            const scenarios = await prisma.scenario.findMany({
                where: { userId, isPublic: true },
                select: {
                    id: true,
                    name: true,
                    views: true,
                    rating: true,
                    createdAt: true,
                    favorites: {
                        select: { id: true },
                    },
                    ratings: {
                        select: { id: true },
                    },
                },
                orderBy: sortBy === 'views'
                    ? { views: 'desc' }
                    : sortBy === 'rating'
                        ? { rating: 'desc' }
                        : { createdAt: 'desc' },
                take: limit,
            });
            // Get performance trend (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const performanceTrend = await this.getPerformanceTrend(userId, thirtyDaysAgo);
            return {
                characterStats: characters.map(c => ({
                    id: c.id,
                    name: c.name,
                    views: c.views || 0,
                    likes: c.ratings.length,
                    favorites: c.favorites.length,
                    rating: c.rating || 0,
                    createdAt: c.createdAt,
                })),
                scenarioStats: scenarios.map(s => ({
                    id: s.id,
                    name: s.name,
                    views: s.views || 0,
                    likes: s.ratings.length,
                    favorites: s.favorites.length,
                    rating: s.rating || 0,
                    createdAt: s.createdAt,
                })),
                performanceTrend,
            };
        }
        catch (error) {
            console.error('Error getting work statistics:', error);
            return null;
        }
    }
    /**
     * AI-powered character generation
     */
    async aiGenerateCharacter(userId, prompt, config = {}) {
        try {
            // Check if user has permission
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { credits: true },
            });
            if (!user || user.credits < 10) {
                return {
                    success: false,
                    error: 'Insufficient credits',
                };
            }
            // TODO: Integrate with existing AIService
            // This is a placeholder implementation
            const characterData = {
                name: `AI Generated Character ${Date.now()}`,
                description: `Generated from prompt: ${prompt}`,
                personality: 'AI-generated personality based on prompt',
                backstory: 'AI-generated backstory',
                firstMessage: 'Hello! I was created just for you.',
                systemPrompt: `You are a character created from this description: ${prompt}`,
            };
            // Create character
            const character = await prisma.character.create({
                data: {
                    ...characterData,
                    creatorId: userId,
                    isPublic: false, // Draft by default
                    tags: JSON.stringify(['ai-generated']),
                },
            });
            // Deduct credits
            await prisma.user.update({
                where: { id: userId },
                data: {
                    credits: {
                        decrement: 10,
                    },
                },
            });
            // Track AI request
            await prisma.aIRequest.create({
                data: {
                    userId,
                    requestType: 'character_generation',
                    prompt,
                    response: JSON.stringify(characterData),
                    tokensUsed: 500, // Placeholder
                    cost: 0.01, // Placeholder
                },
            });
            return {
                success: true,
                data: character,
                tokensUsed: 500,
                cost: 0.01,
            };
        }
        catch (error) {
            console.error('Error generating character:', error);
            return {
                success: false,
                error: 'Failed to generate character',
            };
        }
    }
    /**
     * AI-powered scenario generation
     */
    async aiGenerateScenario(userId, prompt, config = {}) {
        try {
            // Check if user has permission
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { credits: true },
            });
            if (!user || user.credits < 15) {
                return {
                    success: false,
                    error: 'Insufficient credits',
                };
            }
            // TODO: Integrate with existing AIService
            // This is a placeholder implementation
            const scenarioData = {
                name: `AI Generated Scenario ${Date.now()}`,
                description: `Generated from prompt: ${prompt}`,
                content: 'AI-generated scenario content with plot, characters, and settings',
                tags: JSON.stringify(['ai-generated']),
            };
            // Create scenario
            const scenario = await prisma.scenario.create({
                data: {
                    ...scenarioData,
                    userId,
                    isPublic: false, // Draft by default
                },
            });
            // Deduct credits
            await prisma.user.update({
                where: { id: userId },
                data: {
                    credits: {
                        decrement: 15,
                    },
                },
            });
            // Track AI request
            await prisma.aIRequest.create({
                data: {
                    userId,
                    requestType: 'scenario_generation',
                    prompt,
                    response: JSON.stringify(scenarioData),
                    tokensUsed: 750, // Placeholder
                    cost: 0.015, // Placeholder
                },
            });
            return {
                success: true,
                data: scenario,
                tokensUsed: 750,
                cost: 0.015,
            };
        }
        catch (error) {
            console.error('Error generating scenario:', error);
            return {
                success: false,
                error: 'Failed to generate scenario',
            };
        }
    }
    /**
     * Get performance trend data
     */
    async getPerformanceTrend(userId, startDate) {
        try {
            // This is a simplified implementation
            // In production, you'd want to track daily metrics in a separate table
            const characters = await prisma.character.findMany({
                where: {
                    creatorId: userId,
                    createdAt: {
                        gte: startDate,
                    },
                },
                select: {
                    createdAt: true,
                    views: true,
                    favorites: {
                        where: {
                            createdAt: {
                                gte: startDate,
                            },
                        },
                    },
                },
            });
            // Group by date
            const trendMap = new Map();
            for (const char of characters) {
                const dateKey = char.createdAt.toISOString().split('T')[0];
                const existing = trendMap.get(dateKey) || { views: 0, favorites: 0 };
                existing.views += char.views || 0;
                existing.favorites += char.favorites.length;
                trendMap.set(dateKey, existing);
            }
            // Convert to array and sort
            return Array.from(trendMap.entries())
                .map(([date, data]) => ({
                date,
                ...data,
            }))
                .sort((a, b) => a.date.localeCompare(b.date));
        }
        catch (error) {
            console.error('Error getting performance trend:', error);
            return [];
        }
    }
}
exports.CreatorStudioService = CreatorStudioService;
// Export singleton instance
exports.creatorStudioService = new CreatorStudioService();
//# sourceMappingURL=creator-studio.service.js.map