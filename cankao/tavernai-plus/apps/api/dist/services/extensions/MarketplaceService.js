"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketplaceService = exports.MarketplaceService = void 0;
const uuid_1 = require("uuid");
const semver_1 = __importDefault(require("semver"));
const database_1 = require("../../database");
const logger_1 = require("../../utils/logger");
class MarketplaceService {
    /**
     * Search extensions in marketplace
     */
    async searchExtensions(filter = {}) {
        try {
            const { query, category, author, minRating = 0, maxRating = 5, sortBy = 'relevance', sortOrder = 'desc', official, featured, verified, limit = 20, offset = 0 } = filter;
            const where = {};
            // Text search
            if (query) {
                where.OR = [
                    { name: { contains: query, mode: 'insensitive' } },
                    { displayName: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { keywords: { hasSome: [query] } }
                ];
            }
            // Filters
            if (category)
                where.category = category;
            if (author)
                where.author = { contains: author, mode: 'insensitive' };
            if (minRating > 0 || maxRating < 5) {
                where.rating = { gte: minRating, lte: maxRating };
            }
            if (official !== undefined)
                where.isOfficial = official;
            if (featured !== undefined)
                where.isFeatured = featured;
            if (verified !== undefined)
                where.isVerified = verified;
            // Sorting
            let orderBy = {};
            switch (sortBy) {
                case 'downloads':
                    orderBy = { downloadCount: sortOrder };
                    break;
                case 'rating':
                    orderBy = { rating: sortOrder };
                    break;
                case 'updated':
                    orderBy = { lastUpdated: sortOrder };
                    break;
                case 'published':
                    orderBy = { publishedAt: sortOrder };
                    break;
                case 'name':
                    orderBy = { displayName: sortOrder };
                    break;
                default:
                    // Relevance scoring (simplified)
                    orderBy = [
                        { isFeatured: 'desc' },
                        { isOfficial: 'desc' },
                        { rating: 'desc' },
                        { downloadCount: 'desc' }
                    ];
            }
            const [extensions, total] = await Promise.all([
                database_1.prisma.marketplaceExtension.findMany({
                    where,
                    orderBy,
                    skip: offset,
                    take: limit
                }),
                database_1.prisma.marketplaceExtension.count({ where })
            ]);
            return {
                extensions: extensions.map(ext => this.mapPrismaExtension(ext)),
                total,
                hasMore: offset + extensions.length < total
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to search marketplace extensions', {
                filter,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to search extensions');
        }
    }
    /**
     * Get extension details by ID
     */
    async getExtension(extensionId) {
        try {
            const extension = await database_1.prisma.marketplaceExtension.findUnique({
                where: { id: extensionId }
            });
            return extension ? this.mapPrismaExtension(extension) : null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get marketplace extension', {
                extensionId,
                error: error instanceof Error ? error.message : String(error)
            });
            return null;
        }
    }
    /**
     * Get extensions by category
     */
    async getExtensionsByCategory(category, limit = 20, offset = 0) {
        try {
            const extensions = await database_1.prisma.marketplaceExtension.findMany({
                where: { category },
                orderBy: [
                    { isFeatured: 'desc' },
                    { rating: 'desc' },
                    { downloadCount: 'desc' }
                ],
                skip: offset,
                take: limit
            });
            return extensions.map(ext => this.mapPrismaExtension(ext));
        }
        catch (error) {
            logger_1.logger.error('Failed to get extensions by category', {
                category,
                error: error instanceof Error ? error.message : String(error)
            });
            return [];
        }
    }
    /**
     * Get featured extensions
     */
    async getFeaturedExtensions(limit = 10) {
        try {
            const extensions = await database_1.prisma.marketplaceExtension.findMany({
                where: { isFeatured: true },
                orderBy: { rating: 'desc' },
                take: limit
            });
            return extensions.map(ext => this.mapPrismaExtension(ext));
        }
        catch (error) {
            logger_1.logger.error('Failed to get featured extensions', {
                error: error instanceof Error ? error.message : String(error)
            });
            return [];
        }
    }
    /**
     * Get marketplace statistics
     */
    async getStats() {
        try {
            const [totalExtensions, totalDownloads, averageRating, totalReviews, categoryStats, topRated, mostDownloaded, recentlyUpdated] = await Promise.all([
                database_1.prisma.marketplaceExtension.count(),
                database_1.prisma.marketplaceExtension.aggregate({
                    _sum: { downloadCount: true }
                }),
                database_1.prisma.marketplaceExtension.aggregate({
                    _avg: { rating: true }
                }),
                database_1.prisma.extensionReview.count(),
                database_1.prisma.marketplaceExtension.groupBy({
                    by: ['category'],
                    _count: { category: true }
                }),
                database_1.prisma.marketplaceExtension.findMany({
                    orderBy: { rating: 'desc' },
                    take: 5
                }),
                database_1.prisma.marketplaceExtension.findMany({
                    orderBy: { downloadCount: 'desc' },
                    take: 5
                }),
                database_1.prisma.marketplaceExtension.findMany({
                    orderBy: { lastUpdated: 'desc' },
                    take: 5
                })
            ]);
            const byCategory = categoryStats.reduce((acc, stat) => {
                acc[stat.category] = stat._count.category;
                return acc;
            }, {});
            return {
                totalExtensions,
                totalDownloads: totalDownloads._sum.downloadCount || 0,
                averageRating: averageRating._avg.rating || 0,
                totalReviews,
                byCategory,
                topRated: topRated.map(ext => this.mapPrismaExtension(ext)),
                mostDownloaded: mostDownloaded.map(ext => this.mapPrismaExtension(ext)),
                recentlyUpdated: recentlyUpdated.map(ext => this.mapPrismaExtension(ext))
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get marketplace stats', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to get marketplace statistics');
        }
    }
    /**
     * Track extension download
     */
    async trackDownload(extensionId, userId) {
        try {
            await database_1.prisma.marketplaceExtension.update({
                where: { id: extensionId },
                data: {
                    downloadCount: { increment: 1 }
                }
            });
            // Track download event
            if (userId) {
                await database_1.prisma.extensionDownload.create({
                    data: {
                        id: (0, uuid_1.v4)(),
                        extensionId,
                        userId,
                        downloadedAt: new Date()
                    }
                });
            }
            logger_1.logger.info('Extension download tracked', { extensionId, userId });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to track extension download', {
                extensionId,
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    /**
     * Submit extension review
     */
    async submitReview(extensionId, userId, rating, title, content, version) {
        try {
            // Validate rating
            if (rating < 1 || rating > 5) {
                throw new Error('Rating must be between 1 and 5');
            }
            // Check if user already reviewed this extension
            const existingReview = await database_1.prisma.extensionReview.findFirst({
                where: { extensionId, userId }
            });
            if (existingReview) {
                throw new Error('User has already reviewed this extension');
            }
            // Create review
            const review = await database_1.prisma.extensionReview.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    extensionId,
                    userId,
                    rating,
                    title,
                    content,
                    version,
                    helpfulVotes: 0,
                    totalVotes: 0,
                    isVerifiedPurchase: true, // Simplified
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            // Update extension rating
            await this.updateExtensionRating(extensionId);
            logger_1.logger.info('Extension review submitted', {
                extensionId,
                userId,
                rating,
                reviewId: review.id
            });
            return this.mapPrismaReview(review);
        }
        catch (error) {
            logger_1.logger.error('Failed to submit extension review', {
                extensionId,
                userId,
                rating,
                error: error instanceof Error ? error.message : String(error)
            });
            return null;
        }
    }
    /**
     * Get extension reviews
     */
    async getReviews(extensionId, limit = 20, offset = 0, sortBy = 'newest') {
        try {
            let orderBy;
            switch (sortBy) {
                case 'oldest':
                    orderBy = { createdAt: 'asc' };
                    break;
                case 'rating':
                    orderBy = { rating: 'desc' };
                    break;
                case 'helpful':
                    orderBy = { helpfulVotes: 'desc' };
                    break;
                default:
                    orderBy = { createdAt: 'desc' };
            }
            const [reviews, total] = await Promise.all([
                database_1.prisma.extensionReview.findMany({
                    where: { extensionId },
                    orderBy,
                    skip: offset,
                    take: limit,
                    include: {
                        replies: {
                            orderBy: { createdAt: 'asc' }
                        }
                    }
                }),
                database_1.prisma.extensionReview.count({ where: { extensionId } })
            ]);
            return {
                reviews: reviews.map(review => this.mapPrismaReview(review)),
                total,
                hasMore: offset + reviews.length < total
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get extension reviews', {
                extensionId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to get extension reviews');
        }
    }
    /**
     * Vote on review helpfulness
     */
    async voteReview(reviewId, userId, isHelpful) {
        try {
            // Check if user already voted
            const existingVote = await database_1.prisma.reviewVote.findFirst({
                where: { reviewId, userId }
            });
            if (existingVote) {
                // Update existing vote
                await database_1.prisma.reviewVote.update({
                    where: { id: existingVote.id },
                    data: { isHelpful }
                });
            }
            else {
                // Create new vote
                await database_1.prisma.reviewVote.create({
                    data: {
                        id: (0, uuid_1.v4)(),
                        reviewId,
                        userId,
                        isHelpful,
                        createdAt: new Date()
                    }
                });
            }
            // Update review vote counts
            const [helpfulVotes, totalVotes] = await Promise.all([
                database_1.prisma.reviewVote.count({
                    where: { reviewId, isHelpful: true }
                }),
                database_1.prisma.reviewVote.count({
                    where: { reviewId }
                })
            ]);
            await database_1.prisma.extensionReview.update({
                where: { id: reviewId },
                data: { helpfulVotes, totalVotes }
            });
            logger_1.logger.info('Review vote recorded', { reviewId, userId, isHelpful });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to vote on review', {
                reviewId,
                userId,
                isHelpful,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    /**
     * Report extension or review
     */
    async reportContent(userId, type, targetId, reason, description) {
        try {
            await database_1.prisma.contentReport.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    userId,
                    type,
                    targetId,
                    reason,
                    description,
                    status: 'pending',
                    createdAt: new Date()
                }
            });
            logger_1.logger.info('Content reported', { userId, type, targetId, reason });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to report content', {
                userId,
                type,
                targetId,
                reason,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    /**
     * Get user's download history
     */
    async getUserDownloads(userId, limit = 20, offset = 0) {
        try {
            const [downloads, total] = await Promise.all([
                database_1.prisma.extensionDownload.findMany({
                    where: { userId },
                    orderBy: { downloadedAt: 'desc' },
                    skip: offset,
                    take: limit,
                    include: {
                        extension: true
                    }
                }),
                database_1.prisma.extensionDownload.count({ where: { userId } })
            ]);
            return {
                downloads: downloads.map(download => ({
                    extension: this.mapPrismaExtension(download.extension),
                    downloadedAt: download.downloadedAt
                })),
                total,
                hasMore: offset + downloads.length < total
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get user downloads', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to get user downloads');
        }
    }
    /**
     * Check for extension updates
     */
    async checkUpdates(installedExtensions) {
        try {
            const results = [];
            for (const installed of installedExtensions) {
                const latest = await this.getExtension(installed.id);
                if (latest) {
                    const updateAvailable = semver_1.default.gt(latest.version, installed.version);
                    results.push({
                        extensionId: installed.id,
                        currentVersion: installed.version,
                        latestVersion: latest.version,
                        updateAvailable
                    });
                }
            }
            return results;
        }
        catch (error) {
            logger_1.logger.error('Failed to check for updates', {
                error: error instanceof Error ? error.message : String(error)
            });
            return [];
        }
    }
    // Private helper methods
    async updateExtensionRating(extensionId) {
        try {
            const result = await database_1.prisma.extensionReview.aggregate({
                where: { extensionId },
                _avg: { rating: true },
                _count: { rating: true }
            });
            await database_1.prisma.marketplaceExtension.update({
                where: { id: extensionId },
                data: {
                    rating: result._avg.rating || 0,
                    reviewCount: result._count.rating || 0
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update extension rating', {
                extensionId,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    mapPrismaExtension(extension) {
        return {
            id: extension.id,
            name: extension.name,
            displayName: extension.displayName,
            version: extension.version,
            description: extension.description,
            longDescription: extension.longDescription,
            author: extension.author,
            authorEmail: extension.authorEmail,
            license: extension.license,
            homepage: extension.homepage,
            repository: extension.repository,
            keywords: extension.keywords || [],
            category: extension.category,
            screenshots: extension.screenshots || [],
            icon: extension.icon,
            downloadUrl: extension.downloadUrl,
            downloadCount: extension.downloadCount,
            rating: extension.rating,
            reviewCount: extension.reviewCount,
            size: extension.size,
            lastUpdated: extension.lastUpdated,
            publishedAt: extension.publishedAt,
            isOfficial: extension.isOfficial,
            isFeatured: extension.isFeatured,
            isVerified: extension.isVerified,
            compatibility: extension.compatibility || {
                minVersion: '1.0.0',
                platforms: ['web']
            },
            dependencies: extension.dependencies || {},
            permissions: extension.permissions || [],
            metadata: extension.metadata || {}
        };
    }
    mapPrismaReview(review) {
        return {
            id: review.id,
            extensionId: review.extensionId,
            userId: review.userId,
            rating: review.rating,
            title: review.title,
            content: review.content,
            helpfulVotes: review.helpfulVotes,
            totalVotes: review.totalVotes,
            isVerifiedPurchase: review.isVerifiedPurchase,
            version: review.version,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
            replies: (review.replies || []).map((reply) => ({
                id: reply.id,
                reviewId: reply.reviewId,
                userId: reply.userId,
                content: reply.content,
                isAuthorReply: reply.isAuthorReply,
                createdAt: reply.createdAt
            }))
        };
    }
}
exports.MarketplaceService = MarketplaceService;
// Singleton instance
exports.marketplaceService = new MarketplaceService();
//# sourceMappingURL=MarketplaceService.js.map