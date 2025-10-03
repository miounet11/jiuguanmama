/**
 * 类型安全的数据库访问层
 * 提供高级查询构造器和优化的数据访问模式
 */
import { DbUser, DbCharacter, DbChatSession, DbMessage, CharacterListOptions, ChatSessionListOptions, CharacterWithCreator, CharacterWithStats, ChatSessionWithCharacter, MessageWithRelations } from '../types/database';
export declare class DatabaseService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * 用户查询服务
     */
    users: {
        /**
         * 根据ID查找用户
         */
        findById: (id: string) => Promise<DbUser | null>;
        /**
         * 根据邮箱查找用户
         */
        findByEmail: (email: string) => Promise<DbUser | null>;
        /**
         * 根据用户名查找用户
         */
        findByUsername: (username: string) => Promise<DbUser | null>;
        /**
         * 创建用户
         */
        create: (data: Prisma.UserCreateInput) => Promise<DbUser>;
        /**
         * 更新用户
         */
        update: (id: string, data: Prisma.UserUpdateInput) => Promise<DbUser>;
        /**
         * 获取用户统计信息
         */
        getStats: (userId: string) => Promise<any>;
        /**
         * 删除用户（软删除）
         */
        deactivate: (id: string) => Promise<DbUser>;
    };
    /**
     * 角色查询服务
     */
    characters: {
        /**
         * 根据ID查找角色（包含创建者信息）
         */
        findById: (id: string) => Promise<CharacterWithCreator | null>;
        /**
         * 查找公开角色（包含创建者和统计信息）
         */
        findPublicById: (id: string, userId?: string) => Promise<CharacterWithStats | null>;
        /**
         * 列出角色（分页和过滤）
         */
        list: (options?: CharacterListOptions, userId?: string) => Promise<{
            characters: CharacterWithStats[];
            total: number;
        }>;
        /**
         * 创建角色
         */
        create: (data: Prisma.CharacterCreateInput) => Promise<DbCharacter>;
        /**
         * 更新角色
         */
        update: (id: string, data: Prisma.CharacterUpdateInput) => Promise<DbCharacter>;
        /**
         * 删除角色
         */
        delete: (id: string) => Promise<DbCharacter>;
        /**
         * 增加聊天计数
         */
        incrementChatCount: (id: string) => Promise<void>;
        /**
         * 更新评分
         */
        updateRating: (id: string) => Promise<void>;
        /**
         * 更新收藏计数
         */
        updateFavoriteCount: (id: string) => Promise<void>;
    };
    /**
     * 聊天会话查询服务
     */
    chatSessions: {
        /**
         * 根据ID查找会话
         */
        findById: (id: string) => Promise<ChatSessionWithCharacter | null>;
        /**
         * 列出用户的聊天会话
         */
        listByUser: (userId: string, options?: ChatSessionListOptions) => Promise<{
            sessions: ChatSessionWithCharacter[];
            total: number;
        }>;
        /**
         * 创建聊天会话
         */
        create: (data: Prisma.ChatSessionCreateInput) => Promise<DbChatSession>;
        /**
         * 更新会话
         */
        update: (id: string, data: Prisma.ChatSessionUpdateInput) => Promise<DbChatSession>;
        /**
         * 更新最后消息时间
         */
        updateLastMessage: (id: string) => Promise<void>;
        /**
         * 归档会话
         */
        archive: (id: string) => Promise<DbChatSession>;
        /**
         * 删除会话
         */
        delete: (id: string) => Promise<DbChatSession>;
    };
    /**
     * 消息查询服务
     */
    messages: {
        /**
         * 根据会话ID列出消息
         */
        listBySession: (sessionId: string, options?: {
            page?: number;
            limit?: number;
            before?: string;
            after?: string;
        }) => Promise<{
            messages: MessageWithRelations[];
            total: number;
        }>;
        /**
         * 创建消息
         */
        create: (data: Prisma.MessageCreateInput) => Promise<DbMessage>;
        /**
         * 更新消息
         */
        update: (id: string, data: Prisma.MessageUpdateInput) => Promise<DbMessage>;
        /**
         * 软删除消息
         */
        softDelete: (id: string) => Promise<DbMessage>;
    };
    /**
     * 收藏和评分服务
     */
    favorites: {
        /**
         * 添加收藏
         */
        add: (userId: string, characterId: string) => Promise<void>;
        /**
         * 移除收藏
         */
        remove: (userId: string, characterId: string) => Promise<void>;
        /**
         * 检查是否已收藏
         */
        check: (userId: string, characterId: string) => Promise<boolean>;
    };
    ratings: {
        /**
         * 添加或更新评分
         */
        upsert: (userId: string, characterId: string, rating: number, comment?: string) => Promise<void>;
        /**
         * 删除评分
         */
        delete: (userId: string, characterId: string) => Promise<void>;
    };
    /**
     * 统计查询服务
     */
    stats: {
        /**
         * 获取系统统计
         */
        getSystemStats: () => Promise<{
            users: {
                total: any;
                active: any;
            };
            characters: {
                total: any;
                public: any;
            };
            sessions: {
                total: any;
            };
            messages: {
                total: any;
            };
        }>;
        /**
         * 获取热门角色
         */
        getPopularCharacters: (limit?: number) => Promise<any>;
    };
}
export declare const createDatabaseService: (prisma: PrismaClient) => DatabaseService;
export declare const getDatabaseService: () => DatabaseService;
//# sourceMappingURL=database.d.ts.map