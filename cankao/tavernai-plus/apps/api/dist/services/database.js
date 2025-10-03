"use strict";
/**
 * 类型安全的数据库访问层
 * 提供高级查询构造器和优化的数据访问模式
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseService = exports.createDatabaseService = exports.DatabaseService = void 0;
const { PrismaClient, Prisma } = require('../../node_modules/.prisma/client');
const database_1 = require("../types/database");
class DatabaseService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * 用户查询服务
     */
    users = {
        /**
         * 根据ID查找用户
         */
        findById: async (id) => {
            return this.prisma.user.findUnique({
                where: { id }
            });
        },
        /**
         * 根据邮箱查找用户
         */
        findByEmail: async (email) => {
            return this.prisma.user.findUnique({
                where: { email }
            });
        },
        /**
         * 根据用户名查找用户
         */
        findByUsername: async (username) => {
            return this.prisma.user.findUnique({
                where: { username }
            });
        },
        /**
         * 创建用户
         */
        create: async (data) => {
            return this.prisma.user.create({
                data
            });
        },
        /**
         * 更新用户
         */
        update: async (id, data) => {
            return this.prisma.user.update({
                where: { id },
                data
            });
        },
        /**
         * 获取用户统计信息
         */
        getStats: async (userId) => {
            const stats = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    _count: {
                        select: {
                            characters: true,
                            chatSessions: true,
                            favorites: true,
                            ratings: true
                        }
                    }
                }
            });
            return stats?._count || null;
        },
        /**
         * 删除用户（软删除）
         */
        deactivate: async (id) => {
            return this.prisma.user.update({
                where: { id },
                data: { isActive: false }
            });
        }
    };
    /**
     * 角色查询服务
     */
    characters = {
        /**
         * 根据ID查找角色（包含创建者信息）
         */
        findById: async (id) => {
            return this.prisma.character.findUnique({
                where: { id },
                include: {
                    creator: true
                }
            });
        },
        /**
         * 查找公开角色（包含创建者和统计信息）
         */
        findPublicById: async (id, userId) => {
            return this.prisma.character.findFirst({
                where: {
                    id,
                    isPublic: true
                },
                include: {
                    creator: true,
                    _count: {
                        select: {
                            chatSessions: true,
                            messages: true,
                            favorites: true,
                            ratings: true
                        }
                    },
                    ...(userId && {
                        favorites: {
                            where: { userId },
                            select: { id: true }
                        }
                    })
                }
            });
        },
        /**
         * 列出角色（分页和过滤）
         */
        list: async (options = {}, userId) => {
            const { page = 1, limit = 20, sort = 'created', search, tags, category, creatorId, isPublic = true, isNSFW, isFeatured } = options;
            // 构建查询条件
            const where = {
                isPublic,
                ...(creatorId && { creatorId }),
                ...(isNSFW !== undefined && { isNSFW }),
                ...(isFeatured !== undefined && { isFeatured }),
                ...(category && { category }),
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } }
                    ]
                })
                // TODO: 实现标签过滤（需要JSON查询支持）
            };
            // 构建排序条件
            const orderBy = [];
            switch (sort) {
                case 'rating':
                    orderBy.push({ rating: 'desc' }, { ratingCount: 'desc' });
                    break;
                case 'popular':
                    orderBy.push({ chatCount: 'desc' }, { favoriteCount: 'desc' });
                    break;
                case 'favorites':
                    orderBy.push({ favoriteCount: 'desc' });
                    break;
                default:
                    orderBy.push({ createdAt: 'desc' });
            }
            const [characters, total] = await Promise.all([
                this.prisma.character.findMany({
                    where,
                    include: {
                        creator: true,
                        _count: {
                            select: {
                                chatSessions: true,
                                messages: true,
                                favorites: true,
                                ratings: true
                            }
                        },
                        ...(userId && {
                            favorites: {
                                where: { userId },
                                select: { id: true }
                            }
                        })
                    },
                    orderBy,
                    skip: (page - 1) * limit,
                    take: limit
                }),
                this.prisma.character.count({ where })
            ]);
            // 添加计算字段
            const enrichedCharacters = characters.map(char => ({
                ...char,
                isFavorited: userId ? char.favorites.length > 0 : false,
                isNew: new Date(char.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
            }));
            return {
                characters: enrichedCharacters,
                total
            };
        },
        /**
         * 创建角色
         */
        create: async (data) => {
            return this.prisma.character.create({
                data: {
                    ...data,
                    tags: data.tags || (0, database_1.stringifyCharacterTags)([]),
                    metadata: data.metadata || (0, database_1.stringifyCharacterMetadata)({})
                }
            });
        },
        /**
         * 更新角色
         */
        update: async (id, data) => {
            return this.prisma.character.update({
                where: { id },
                data
            });
        },
        /**
         * 删除角色
         */
        delete: async (id) => {
            return this.prisma.character.delete({
                where: { id }
            });
        },
        /**
         * 增加聊天计数
         */
        incrementChatCount: async (id) => {
            await this.prisma.character.update({
                where: { id },
                data: {
                    chatCount: {
                        increment: 1
                    }
                }
            });
        },
        /**
         * 更新评分
         */
        updateRating: async (id) => {
            const result = await this.prisma.characterRating.aggregate({
                where: { characterId: id },
                _avg: { rating: true },
                _count: { rating: true }
            });
            await this.prisma.character.update({
                where: { id },
                data: {
                    rating: result._avg.rating || 0,
                    ratingCount: result._count.rating
                }
            });
        },
        /**
         * 更新收藏计数
         */
        updateFavoriteCount: async (id) => {
            const count = await this.prisma.characterFavorite.count({
                where: { characterId: id }
            });
            await this.prisma.character.update({
                where: { id },
                data: { favoriteCount: count }
            });
        }
    };
    /**
     * 聊天会话查询服务
     */
    chatSessions = {
        /**
         * 根据ID查找会话
         */
        findById: async (id) => {
            return this.prisma.chatSession.findUnique({
                where: { id },
                include: {
                    user: true,
                    character: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                            description: true
                        }
                    },
                    _count: {
                        select: {
                            messages: true
                        }
                    }
                }
            });
        },
        /**
         * 列出用户的聊天会话
         */
        listByUser: async (userId, options = {}) => {
            const { page = 1, limit = 20, characterId, isArchived = false, sort = 'updated' } = options;
            const where = {
                userId,
                isArchived,
                ...(characterId && { characterId })
            };
            const orderBy = sort === 'created' ? { createdAt: 'desc' } :
                sort === 'messages' ? { messageCount: 'desc' } :
                    { updatedAt: 'desc' };
            const [sessions, total] = await Promise.all([
                this.prisma.chatSession.findMany({
                    where,
                    include: {
                        user: true,
                        character: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                                description: true
                            }
                        },
                        _count: {
                            select: {
                                messages: true
                            }
                        }
                    },
                    orderBy,
                    skip: (page - 1) * limit,
                    take: limit
                }),
                this.prisma.chatSession.count({ where })
            ]);
            return { sessions, total };
        },
        /**
         * 创建聊天会话
         */
        create: async (data) => {
            return this.prisma.chatSession.create({
                data: {
                    ...data,
                    metadata: data.metadata || (0, database_1.stringifyChatSessionMetadata)({})
                }
            });
        },
        /**
         * 更新会话
         */
        update: async (id, data) => {
            return this.prisma.chatSession.update({
                where: { id },
                data
            });
        },
        /**
         * 更新最后消息时间
         */
        updateLastMessage: async (id) => {
            await this.prisma.chatSession.update({
                where: { id },
                data: {
                    lastMessageAt: new Date(),
                    messageCount: {
                        increment: 1
                    }
                }
            });
        },
        /**
         * 归档会话
         */
        archive: async (id) => {
            return this.prisma.chatSession.update({
                where: { id },
                data: { isArchived: true }
            });
        },
        /**
         * 删除会话
         */
        delete: async (id) => {
            return this.prisma.chatSession.delete({
                where: { id }
            });
        }
    };
    /**
     * 消息查询服务
     */
    messages = {
        /**
         * 根据会话ID列出消息
         */
        listBySession: async (sessionId, options = {}) => {
            const { page = 1, limit = 50, before, after } = options;
            const where = {
                sessionId,
                deleted: false,
                ...(before && {
                    createdAt: { lt: new Date(before) }
                }),
                ...(after && {
                    createdAt: { gt: new Date(after) }
                })
            };
            const [messages, total] = await Promise.all([
                this.prisma.message.findMany({
                    where,
                    include: {
                        user: true,
                        character: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' },
                    skip: (page - 1) * limit,
                    take: limit
                }),
                this.prisma.message.count({ where })
            ]);
            return { messages, total };
        },
        /**
         * 创建消息
         */
        create: async (data) => {
            return this.prisma.message.create({
                data
            });
        },
        /**
         * 更新消息
         */
        update: async (id, data) => {
            return this.prisma.message.update({
                where: { id },
                data: {
                    ...data,
                    edited: true
                }
            });
        },
        /**
         * 软删除消息
         */
        softDelete: async (id) => {
            return this.prisma.message.update({
                where: { id },
                data: { deleted: true }
            });
        }
    };
    /**
     * 收藏和评分服务
     */
    favorites = {
        /**
         * 添加收藏
         */
        add: async (userId, characterId) => {
            await this.prisma.characterFavorite.upsert({
                where: {
                    userId_characterId: {
                        userId,
                        characterId
                    }
                },
                create: {
                    userId,
                    characterId
                },
                update: {}
            });
            // 更新角色收藏计数
            await this.characters.updateFavoriteCount(characterId);
        },
        /**
         * 移除收藏
         */
        remove: async (userId, characterId) => {
            await this.prisma.characterFavorite.deleteMany({
                where: {
                    userId,
                    characterId
                }
            });
            // 更新角色收藏计数
            await this.characters.updateFavoriteCount(characterId);
        },
        /**
         * 检查是否已收藏
         */
        check: async (userId, characterId) => {
            const favorite = await this.prisma.characterFavorite.findUnique({
                where: {
                    userId_characterId: {
                        userId,
                        characterId
                    }
                }
            });
            return !!favorite;
        }
    };
    ratings = {
        /**
         * 添加或更新评分
         */
        upsert: async (userId, characterId, rating, comment) => {
            await this.prisma.characterRating.upsert({
                where: {
                    userId_characterId: {
                        userId,
                        characterId
                    }
                },
                create: {
                    userId,
                    characterId,
                    rating,
                    comment
                },
                update: {
                    rating,
                    comment,
                    updatedAt: new Date()
                }
            });
            // 更新角色评分
            await this.characters.updateRating(characterId);
        },
        /**
         * 删除评分
         */
        delete: async (userId, characterId) => {
            await this.prisma.characterRating.deleteMany({
                where: {
                    userId,
                    characterId
                }
            });
            // 更新角色评分
            await this.characters.updateRating(characterId);
        }
    };
    /**
     * 统计查询服务
     */
    stats = {
        /**
         * 获取系统统计
         */
        getSystemStats: async () => {
            const [totalUsers, activeUsers, totalCharacters, publicCharacters, totalSessions, totalMessages] = await Promise.all([
                this.prisma.user.count(),
                this.prisma.user.count({ where: { isActive: true } }),
                this.prisma.character.count(),
                this.prisma.character.count({ where: { isPublic: true } }),
                this.prisma.chatSession.count(),
                this.prisma.message.count()
            ]);
            return {
                users: {
                    total: totalUsers,
                    active: activeUsers
                },
                characters: {
                    total: totalCharacters,
                    public: publicCharacters
                },
                sessions: {
                    total: totalSessions
                },
                messages: {
                    total: totalMessages
                }
            };
        },
        /**
         * 获取热门角色
         */
        getPopularCharacters: async (limit = 10) => {
            return this.prisma.character.findMany({
                where: { isPublic: true },
                orderBy: [
                    { chatCount: 'desc' },
                    { favoriteCount: 'desc' },
                    { rating: 'desc' }
                ],
                take: limit,
                include: {
                    creator: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            });
        }
    };
}
exports.DatabaseService = DatabaseService;
// 创建单例实例
let databaseService = null;
const createDatabaseService = (prisma) => {
    if (!databaseService) {
        databaseService = new DatabaseService(prisma);
    }
    return databaseService;
};
exports.createDatabaseService = createDatabaseService;
const getDatabaseService = () => {
    if (!databaseService) {
        throw new Error('Database service not initialized. Call createDatabaseService first.');
    }
    return databaseService;
};
exports.getDatabaseService = getDatabaseService;
//# sourceMappingURL=database.js.map