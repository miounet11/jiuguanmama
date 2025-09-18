/**
 * 类型安全的查询构造器
 * 提供链式查询API和优化的查询模式
 */
import { Prisma, PrismaClient } from '@prisma/client';
import { CharacterListOptions, ChatSessionListOptions } from '../types/database';
/**
 * 基础查询构造器
 */
export declare class QueryBuilder<T> {
    protected prisma: PrismaClient;
    protected model: string;
    protected where: any;
    protected orderBy: any[];
    protected include: any;
    protected select: any;
    protected skip: number;
    protected take: number;
    constructor(prisma: PrismaClient, model: string);
    /**
     * 添加WHERE条件
     */
    addWhere(condition: any): this;
    /**
     * 添加OR条件
     */
    addOr(conditions: any[]): this;
    /**
     * 添加排序
     */
    addOrderBy(orderBy: any): this;
    /**
     * 设置关联查询
     */
    addInclude(include: any): this;
    /**
     * 设置字段选择
     */
    addSelect(select: any): this;
    /**
     * 设置分页
     */
    paginate(page: number, limit: number): this;
    /**
     * 获取查询参数
     */
    getQuery(): any;
}
/**
 * 角色查询构造器
 */
export declare class CharacterQueryBuilder extends QueryBuilder<Prisma.CharacterFindManyArgs> {
    constructor(prisma: PrismaClient);
    /**
     * 应用角色列表选项
     */
    applyListOptions(options: CharacterListOptions, userId?: string): this;
    /**
     * 只查询公开角色
     */
    onlyPublic(): this;
    /**
     * 只查询精选角色
     */
    onlyFeatured(): this;
    /**
     * 按创建者过滤
     */
    byCreator(creatorId: string): this;
    /**
     * 按分类过滤
     */
    byCategory(category: string): this;
    /**
     * 搜索角色
     */
    search(query: string): this;
    /**
     * 按评分排序
     */
    orderByRating(): this;
    /**
     * 按人气排序
     */
    orderByPopularity(): this;
    /**
     * 包含完整信息
     */
    withFullInfo(userId?: string): this;
    /**
     * 执行查询
     */
    execute(): Promise<{
        description: string;
        id: string;
        metadata: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        avatar: string | null;
        model: string;
        temperature: number;
        maxTokens: number;
        personality: string | null;
        backstory: string | null;
        speakingStyle: string | null;
        firstMessage: string | null;
        creatorId: string;
        fullDescription: string | null;
        scenario: string | null;
        systemPrompt: string | null;
        exampleDialogs: string | null;
        coverImage: string | null;
        category: string;
        tags: string;
        language: string;
        isPublic: boolean;
        isNSFW: boolean;
        isFeatured: boolean;
        rating: number;
        ratingCount: number;
        chatCount: number;
        favoriteCount: number;
        importedFrom: string | null;
        version: number;
    }[]>;
    /**
     * 执行计数查询
     */
    count(): Promise<number>;
    /**
     * 执行分页查询
     */
    executeWithCount(): Promise<{
        items: {
            description: string;
            id: string;
            metadata: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            avatar: string | null;
            model: string;
            temperature: number;
            maxTokens: number;
            personality: string | null;
            backstory: string | null;
            speakingStyle: string | null;
            firstMessage: string | null;
            creatorId: string;
            fullDescription: string | null;
            scenario: string | null;
            systemPrompt: string | null;
            exampleDialogs: string | null;
            coverImage: string | null;
            category: string;
            tags: string;
            language: string;
            isPublic: boolean;
            isNSFW: boolean;
            isFeatured: boolean;
            rating: number;
            ratingCount: number;
            chatCount: number;
            favoriteCount: number;
            importedFrom: string | null;
            version: number;
        }[];
        total: number;
    }>;
}
/**
 * 聊天会话查询构造器
 */
export declare class ChatSessionQueryBuilder extends QueryBuilder<Prisma.ChatSessionFindManyArgs> {
    constructor(prisma: PrismaClient);
    /**
     * 应用会话列表选项
     */
    applyListOptions(options: ChatSessionListOptions): this;
    /**
     * 按用户过滤
     */
    byUser(userId: string): this;
    /**
     * 按角色过滤
     */
    byCharacter(characterId: string): this;
    /**
     * 只查询活跃会话
     */
    onlyActive(): this;
    /**
     * 只查询归档会话
     */
    onlyArchived(): this;
    /**
     * 按更新时间排序
     */
    orderByUpdated(): this;
    /**
     * 按消息数量排序
     */
    orderByMessageCount(): this;
    /**
     * 执行查询
     */
    execute(): Promise<{
        id: string;
        metadata: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        model: string;
        characterId: string;
        lastMessageAt: Date | null;
        messageCount: number;
        totalTokens: number;
        title: string | null;
        presetId: string | null;
        worldInfoId: string | null;
        isArchived: boolean;
        isPinned: boolean;
    }[]>;
    /**
     * 执行计数查询
     */
    count(): Promise<number>;
    /**
     * 执行分页查询
     */
    executeWithCount(): Promise<{
        items: {
            id: string;
            metadata: string | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            model: string;
            characterId: string;
            lastMessageAt: Date | null;
            messageCount: number;
            totalTokens: number;
            title: string | null;
            presetId: string | null;
            worldInfoId: string | null;
            isArchived: boolean;
            isPinned: boolean;
        }[];
        total: number;
    }>;
}
/**
 * 消息查询构造器
 */
export declare class MessageQueryBuilder extends QueryBuilder<Prisma.MessageFindManyArgs> {
    constructor(prisma: PrismaClient);
    /**
     * 按会话过滤
     */
    bySession(sessionId: string): this;
    /**
     * 只查询未删除的消息
     */
    notDeleted(): this;
    /**
     * 按时间范围过滤
     */
    timeRange(before?: Date, after?: Date): this;
    /**
     * 按时间排序
     */
    orderByTime(direction?: 'asc' | 'desc'): this;
    /**
     * 包含用户和角色信息
     */
    withRelations(): this;
    /**
     * 执行查询
     */
    execute(): Promise<{
        id: string;
        metadata: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        role: string;
        content: string;
        sessionId: string;
        characterId: string | null;
        tokens: number;
        edited: boolean;
        deleted: boolean;
    }[]>;
    /**
     * 执行计数查询
     */
    count(): Promise<number>;
}
/**
 * 查询构造器工厂
 */
export declare class QueryBuilderFactory {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * 创建角色查询构造器
     */
    characters(): CharacterQueryBuilder;
    /**
     * 创建聊天会话查询构造器
     */
    chatSessions(): ChatSessionQueryBuilder;
    /**
     * 创建消息查询构造器
     */
    messages(): MessageQueryBuilder;
}
/**
 * 高级查询工具
 */
export declare class AdvancedQueries {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * 获取角色的详细统计信息
     */
    getCharacterDetailedStats(characterId: string): Promise<{
        basic: {
            createdAt: Date;
            _count: {
                chatSessions: number;
                messages: number;
            };
            rating: number;
            ratingCount: number;
            chatCount: number;
            favoriteCount: number;
        } | null;
        recentChats: number;
        topUsers: (Prisma.PickEnumerable<Prisma.ChatSessionGroupByOutputType, "userId"[]> & {
            _count: {
                userId: number;
            };
        })[];
        ratingDistribution: (Prisma.PickEnumerable<Prisma.CharacterRatingGroupByOutputType, "rating"[]> & {
            _count: {
                rating: number;
            };
        })[];
    }>;
    /**
     * 获取用户的聊天统计
     */
    getUserChatStats(userId: string): Promise<{
        totalSessions: number;
        totalMessages: number;
        favoriteCharacters: number;
        recentActivity: ({
            character: {
                id: string;
                name: string;
                avatar: string | null;
            };
        } & {
            id: string;
            metadata: string | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            model: string;
            characterId: string;
            lastMessageAt: Date | null;
            messageCount: number;
            totalTokens: number;
            title: string | null;
            presetId: string | null;
            worldInfoId: string | null;
            isArchived: boolean;
            isPinned: boolean;
        })[];
    }>;
    /**
     * 搜索角色（支持标签过滤）
     */
    searchCharacters(query: string, tags?: string[], options?: CharacterListOptions): Promise<{
        description: string;
        id: string;
        metadata: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        avatar: string | null;
        model: string;
        temperature: number;
        maxTokens: number;
        personality: string | null;
        backstory: string | null;
        speakingStyle: string | null;
        firstMessage: string | null;
        creatorId: string;
        fullDescription: string | null;
        scenario: string | null;
        systemPrompt: string | null;
        exampleDialogs: string | null;
        coverImage: string | null;
        category: string;
        tags: string;
        language: string;
        isPublic: boolean;
        isNSFW: boolean;
        isFeatured: boolean;
        rating: number;
        ratingCount: number;
        chatCount: number;
        favoriteCount: number;
        importedFrom: string | null;
        version: number;
    }[]>;
}
export declare const createQueryBuilder: (prisma: PrismaClient) => QueryBuilderFactory;
export declare const createAdvancedQueries: (prisma: PrismaClient) => AdvancedQueries;
//# sourceMappingURL=query-builder.d.ts.map