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
export declare class MarketplaceService {
    /**
     * Search extensions in marketplace
     */
    searchExtensions(filter?: SearchFilter): Promise<{
        extensions: MarketplaceExtension[];
        total: number;
        hasMore: boolean;
    }>;
    /**
     * Get extension details by ID
     */
    getExtension(extensionId: string): Promise<MarketplaceExtension | null>;
    /**
     * Get extensions by category
     */
    getExtensionsByCategory(category: string, limit?: number, offset?: number): Promise<MarketplaceExtension[]>;
    /**
     * Get featured extensions
     */
    getFeaturedExtensions(limit?: number): Promise<MarketplaceExtension[]>;
    /**
     * Get marketplace statistics
     */
    getStats(): Promise<MarketplaceStats>;
    /**
     * Track extension download
     */
    trackDownload(extensionId: string, userId?: string): Promise<boolean>;
    /**
     * Submit extension review
     */
    submitReview(extensionId: string, userId: string, rating: number, title: string, content: string, version: string): Promise<ExtensionReview | null>;
    /**
     * Get extension reviews
     */
    getReviews(extensionId: string, limit?: number, offset?: number, sortBy?: 'newest' | 'oldest' | 'rating' | 'helpful'): Promise<{
        reviews: ExtensionReview[];
        total: number;
        hasMore: boolean;
    }>;
    /**
     * Vote on review helpfulness
     */
    voteReview(reviewId: string, userId: string, isHelpful: boolean): Promise<boolean>;
    /**
     * Report extension or review
     */
    reportContent(userId: string, type: 'extension' | 'review', targetId: string, reason: string, description?: string): Promise<boolean>;
    /**
     * Get user's download history
     */
    getUserDownloads(userId: string, limit?: number, offset?: number): Promise<{
        downloads: Array<{
            extension: MarketplaceExtension;
            downloadedAt: Date;
        }>;
        total: number;
        hasMore: boolean;
    }>;
    /**
     * Check for extension updates
     */
    checkUpdates(installedExtensions: Array<{
        id: string;
        version: string;
    }>): Promise<Array<{
        extensionId: string;
        currentVersion: string;
        latestVersion: string;
        updateAvailable: boolean;
    }>>;
    private updateExtensionRating;
    private mapPrismaExtension;
    private mapPrismaReview;
}
export declare const marketplaceService: MarketplaceService;
//# sourceMappingURL=MarketplaceService.d.ts.map