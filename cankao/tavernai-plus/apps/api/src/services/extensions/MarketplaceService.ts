import { v4 as uuidv4 } from 'uuid';
import semver from 'semver';
import { prisma } from '../../database';
import { logger } from '../../utils/logger';

export interface MarketplaceExtension {
  id: string;
  name: string;
  displayName: string;
  version: string;
  description: string;
  longDescription?: string;
  author: string;
  authorEmail?: string;
  license: string;
  homepage?: string;
  repository?: string;
  keywords: string[];
  category: 'character' | 'chat' | 'ui' | 'ai' | 'utility' | 'theme';
  screenshots: string[];
  icon?: string;
  downloadUrl: string;
  downloadCount: number;
  rating: number;
  reviewCount: number;
  size: number;
  lastUpdated: Date;
  publishedAt: Date;
  isOfficial: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  compatibility: {
    minVersion: string;
    maxVersion?: string;
    platforms: string[];
  };
  dependencies: Record<string, string>;
  permissions: string[];
  metadata: Record<string, any>;
}

export interface ExtensionReview {
  id: string;
  extensionId: string;
  userId: string;
  rating: number;
  title: string;
  content: string;
  helpfulVotes: number;
  totalVotes: number;
  isVerifiedPurchase: boolean;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  replies: ExtensionReplyReview[];
}

export interface ExtensionReplyReview {
  id: string;
  reviewId: string;
  userId: string;
  content: string;
  isAuthorReply: boolean;
  createdAt: Date;
}

export interface MarketplaceStats {
  totalExtensions: number;
  totalDownloads: number;
  averageRating: number;
  totalReviews: number;
  byCategory: Record<string, number>;
  topRated: MarketplaceExtension[];
  mostDownloaded: MarketplaceExtension[];
  recentlyUpdated: MarketplaceExtension[];
}

export interface SearchFilter {
  query?: string;
  category?: string;
  author?: string;
  minRating?: number;
  maxRating?: number;
  sortBy?: 'relevance' | 'downloads' | 'rating' | 'updated' | 'published' | 'name';
  sortOrder?: 'asc' | 'desc';
  official?: boolean;
  featured?: boolean;
  verified?: boolean;
  limit?: number;
  offset?: number;
}

export class MarketplaceService {
  /**
   * Search extensions in marketplace
   */
  public async searchExtensions(filter: SearchFilter = {}): Promise<{
    extensions: MarketplaceExtension[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const {
        query,
        category,
        author,
        minRating = 0,
        maxRating = 5,
        sortBy = 'relevance',
        sortOrder = 'desc',
        official,
        featured,
        verified,
        limit = 20,
        offset = 0
      } = filter;

      const where: any = {};

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
      if (category) where.category = category;
      if (author) where.author = { contains: author, mode: 'insensitive' };
      if (minRating > 0 || maxRating < 5) {
        where.rating = { gte: minRating, lte: maxRating };
      }
      if (official !== undefined) where.isOfficial = official;
      if (featured !== undefined) where.isFeatured = featured;
      if (verified !== undefined) where.isVerified = verified;

      // Sorting
      let orderBy: any = {};
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
        prisma.marketplaceExtension.findMany({
          where,
          orderBy,
          skip: offset,
          take: limit
        }),
        prisma.marketplaceExtension.count({ where })
      ]);

      return {
        extensions: extensions.map(ext => this.mapPrismaExtension(ext)),
        total,
        hasMore: offset + extensions.length < total
      };
    } catch (error) {
      logger.error('Failed to search marketplace extensions', {
        filter,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to search extensions');
    }
  }

  /**
   * Get extension details by ID
   */
  public async getExtension(extensionId: string): Promise<MarketplaceExtension | null> {
    try {
      const extension = await prisma.marketplaceExtension.findUnique({
        where: { id: extensionId }
      });

      return extension ? this.mapPrismaExtension(extension) : null;
    } catch (error) {
      logger.error('Failed to get marketplace extension', {
        extensionId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Get extensions by category
   */
  public async getExtensionsByCategory(
    category: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<MarketplaceExtension[]> {
    try {
      const extensions = await prisma.marketplaceExtension.findMany({
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
    } catch (error) {
      logger.error('Failed to get extensions by category', {
        category,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Get featured extensions
   */
  public async getFeaturedExtensions(limit: number = 10): Promise<MarketplaceExtension[]> {
    try {
      const extensions = await prisma.marketplaceExtension.findMany({
        where: { isFeatured: true },
        orderBy: { rating: 'desc' },
        take: limit
      });

      return extensions.map(ext => this.mapPrismaExtension(ext));
    } catch (error) {
      logger.error('Failed to get featured extensions', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Get marketplace statistics
   */
  public async getStats(): Promise<MarketplaceStats> {
    try {
      const [
        totalExtensions,
        totalDownloads,
        averageRating,
        totalReviews,
        categoryStats,
        topRated,
        mostDownloaded,
        recentlyUpdated
      ] = await Promise.all([
        prisma.marketplaceExtension.count(),
        prisma.marketplaceExtension.aggregate({
          _sum: { downloadCount: true }
        }),
        prisma.marketplaceExtension.aggregate({
          _avg: { rating: true }
        }),
        prisma.extensionReview.count(),
        prisma.marketplaceExtension.groupBy({
          by: ['category'],
          _count: { category: true }
        }),
        prisma.marketplaceExtension.findMany({
          orderBy: { rating: 'desc' },
          take: 5
        }),
        prisma.marketplaceExtension.findMany({
          orderBy: { downloadCount: 'desc' },
          take: 5
        }),
        prisma.marketplaceExtension.findMany({
          orderBy: { lastUpdated: 'desc' },
          take: 5
        })
      ]);

      const byCategory = categoryStats.reduce((acc, stat) => {
        acc[stat.category] = stat._count.category;
        return acc;
      }, {} as Record<string, number>);

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
    } catch (error) {
      logger.error('Failed to get marketplace stats', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to get marketplace statistics');
    }
  }

  /**
   * Track extension download
   */
  public async trackDownload(extensionId: string, userId?: string): Promise<boolean> {
    try {
      await prisma.marketplaceExtension.update({
        where: { id: extensionId },
        data: {
          downloadCount: { increment: 1 }
        }
      });

      // Track download event
      if (userId) {
        await prisma.extensionDownload.create({
          data: {
            id: uuidv4(),
            extensionId,
            userId,
            downloadedAt: new Date()
          }
        });
      }

      logger.info('Extension download tracked', { extensionId, userId });
      return true;
    } catch (error) {
      logger.error('Failed to track extension download', {
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
  public async submitReview(
    extensionId: string,
    userId: string,
    rating: number,
    title: string,
    content: string,
    version: string
  ): Promise<ExtensionReview | null> {
    try {
      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Check if user already reviewed this extension
      const existingReview = await prisma.extensionReview.findFirst({
        where: { extensionId, userId }
      });

      if (existingReview) {
        throw new Error('User has already reviewed this extension');
      }

      // Create review
      const review = await prisma.extensionReview.create({
        data: {
          id: uuidv4(),
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

      logger.info('Extension review submitted', {
        extensionId,
        userId,
        rating,
        reviewId: review.id
      });

      return this.mapPrismaReview(review);
    } catch (error) {
      logger.error('Failed to submit extension review', {
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
  public async getReviews(
    extensionId: string,
    limit: number = 20,
    offset: number = 0,
    sortBy: 'newest' | 'oldest' | 'rating' | 'helpful' = 'newest'
  ): Promise<{
    reviews: ExtensionReview[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      let orderBy: any;
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
        prisma.extensionReview.findMany({
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
        prisma.extensionReview.count({ where: { extensionId } })
      ]);

      return {
        reviews: reviews.map(review => this.mapPrismaReview(review)),
        total,
        hasMore: offset + reviews.length < total
      };
    } catch (error) {
      logger.error('Failed to get extension reviews', {
        extensionId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to get extension reviews');
    }
  }

  /**
   * Vote on review helpfulness
   */
  public async voteReview(
    reviewId: string,
    userId: string,
    isHelpful: boolean
  ): Promise<boolean> {
    try {
      // Check if user already voted
      const existingVote = await prisma.reviewVote.findFirst({
        where: { reviewId, userId }
      });

      if (existingVote) {
        // Update existing vote
        await prisma.reviewVote.update({
          where: { id: existingVote.id },
          data: { isHelpful }
        });
      } else {
        // Create new vote
        await prisma.reviewVote.create({
          data: {
            id: uuidv4(),
            reviewId,
            userId,
            isHelpful,
            createdAt: new Date()
          }
        });
      }

      // Update review vote counts
      const [helpfulVotes, totalVotes] = await Promise.all([
        prisma.reviewVote.count({
          where: { reviewId, isHelpful: true }
        }),
        prisma.reviewVote.count({
          where: { reviewId }
        })
      ]);

      await prisma.extensionReview.update({
        where: { id: reviewId },
        data: { helpfulVotes, totalVotes }
      });

      logger.info('Review vote recorded', { reviewId, userId, isHelpful });
      return true;
    } catch (error) {
      logger.error('Failed to vote on review', {
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
  public async reportContent(
    userId: string,
    type: 'extension' | 'review',
    targetId: string,
    reason: string,
    description?: string
  ): Promise<boolean> {
    try {
      await prisma.contentReport.create({
        data: {
          id: uuidv4(),
          userId,
          type,
          targetId,
          reason,
          description,
          status: 'pending',
          createdAt: new Date()
        }
      });

      logger.info('Content reported', { userId, type, targetId, reason });
      return true;
    } catch (error) {
      logger.error('Failed to report content', {
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
  public async getUserDownloads(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    downloads: Array<{
      extension: MarketplaceExtension;
      downloadedAt: Date;
    }>;
    total: number;
    hasMore: boolean;
  }> {
    try {
      const [downloads, total] = await Promise.all([
        prisma.extensionDownload.findMany({
          where: { userId },
          orderBy: { downloadedAt: 'desc' },
          skip: offset,
          take: limit,
          include: {
            extension: true
          }
        }),
        prisma.extensionDownload.count({ where: { userId } })
      ]);

      return {
        downloads: downloads.map(download => ({
          extension: this.mapPrismaExtension(download.extension),
          downloadedAt: download.downloadedAt
        })),
        total,
        hasMore: offset + downloads.length < total
      };
    } catch (error) {
      logger.error('Failed to get user downloads', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to get user downloads');
    }
  }

  /**
   * Check for extension updates
   */
  public async checkUpdates(installedExtensions: Array<{
    id: string;
    version: string;
  }>): Promise<Array<{
    extensionId: string;
    currentVersion: string;
    latestVersion: string;
    updateAvailable: boolean;
  }>> {
    try {
      const results = [];

      for (const installed of installedExtensions) {
        const latest = await this.getExtension(installed.id);

        if (latest) {
          const updateAvailable = semver.gt(latest.version, installed.version);
          results.push({
            extensionId: installed.id,
            currentVersion: installed.version,
            latestVersion: latest.version,
            updateAvailable
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Failed to check for updates', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  // Private helper methods
  private async updateExtensionRating(extensionId: string): Promise<void> {
    try {
      const result = await prisma.extensionReview.aggregate({
        where: { extensionId },
        _avg: { rating: true },
        _count: { rating: true }
      });

      await prisma.marketplaceExtension.update({
        where: { id: extensionId },
        data: {
          rating: result._avg.rating || 0,
          reviewCount: result._count.rating || 0
        }
      });
    } catch (error) {
      logger.error('Failed to update extension rating', {
        extensionId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private mapPrismaExtension(extension: any): MarketplaceExtension {
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

  private mapPrismaReview(review: any): ExtensionReview {
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
      replies: (review.replies || []).map((reply: any) => ({
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

// Singleton instance
export const marketplaceService = new MarketplaceService();