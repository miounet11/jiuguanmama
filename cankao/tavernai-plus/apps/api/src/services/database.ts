/**
 * 类型安全的数据库访问层
 * 提供高级查询构造器和优化的数据访问模式
 */

import { PrismaClient, Prisma } from '@prisma/client'
import {
  DbUser,
  DbCharacter,
  DbChatSession,
  DbMessage,
  CharacterListOptions,
  ChatSessionListOptions,
  CharacterWithCreator,
  CharacterWithStats,
  ChatSessionWithCharacter,
  MessageWithRelations,
  SafeUser,
  parseCharacterTags,
  parseCharacterExampleDialogs,
  parseCharacterMetadata,
  parseChatSessionMetadata,
  stringifyCharacterTags,
  stringifyCharacterExampleDialogs,
  stringifyCharacterMetadata,
  stringifyChatSessionMetadata
} from '../types/database'

export class DatabaseService {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * 用户查询服务
   */
  users = {
    /**
     * 根据ID查找用户
     */
    findById: async (id: string): Promise<DbUser | null> => {
      return this.prisma.user.findUnique({
        where: { id }
      })
    },

    /**
     * 根据邮箱查找用户
     */
    findByEmail: async (email: string): Promise<DbUser | null> => {
      return this.prisma.user.findUnique({
        where: { email }
      })
    },

    /**
     * 根据用户名查找用户
     */
    findByUsername: async (username: string): Promise<DbUser | null> => {
      return this.prisma.user.findUnique({
        where: { username }
      })
    },

    /**
     * 创建用户
     */
    create: async (data: Prisma.UserCreateInput): Promise<DbUser> => {
      return this.prisma.user.create({
        data
      })
    },

    /**
     * 更新用户
     */
    update: async (id: string, data: Prisma.UserUpdateInput): Promise<DbUser> => {
      return this.prisma.user.update({
        where: { id },
        data
      })
    },

    /**
     * 获取用户统计信息
     */
    getStats: async (userId: string) => {
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
      })
      return stats?._count || null
    },

    /**
     * 删除用户（软删除）
     */
    deactivate: async (id: string): Promise<DbUser> => {
      return this.prisma.user.update({
        where: { id },
        data: { isActive: false }
      })
    }
  }

  /**
   * 角色查询服务
   */
  characters = {
    /**
     * 根据ID查找角色（包含创建者信息）
     */
    findById: async (id: string): Promise<CharacterWithCreator | null> => {
      return this.prisma.character.findUnique({
        where: { id },
        include: {
          creator: true
        }
      })
    },

    /**
     * 查找公开角色（包含创建者和统计信息）
     */
    findPublicById: async (id: string, userId?: string): Promise<CharacterWithStats | null> => {
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
      }) as Promise<CharacterWithStats | null>
    },

    /**
     * 列出角色（分页和过滤）
     */
    list: async (options: CharacterListOptions = {}, userId?: string): Promise<{
      characters: CharacterWithStats[]
      total: number
    }> => {
      const {
        page = 1,
        limit = 20,
        sort = 'created',
        search,
        tags,
        category,
        creatorId,
        isPublic = true,
        isNSFW,
        isFeatured
      } = options

      // 构建查询条件
      const where: Prisma.CharacterWhereInput = {
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
      }

      // 构建排序条件
      const orderBy: Prisma.CharacterOrderByWithRelationInput[] = []
      switch (sort) {
        case 'rating':
          orderBy.push({ rating: 'desc' }, { ratingCount: 'desc' })
          break
        case 'popular':
          orderBy.push({ chatCount: 'desc' }, { favoriteCount: 'desc' })
          break
        case 'favorites':
          orderBy.push({ favoriteCount: 'desc' })
          break
        default:
          orderBy.push({ createdAt: 'desc' })
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
        }) as Promise<CharacterWithStats[]>,
        this.prisma.character.count({ where })
      ])

      // 添加计算字段
      const enrichedCharacters = characters.map(char => ({
        ...char,
        isFavorited: userId ? (char as any).favorites.length > 0 : false,
        isNew: new Date(char.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      }))

      return {
        characters: enrichedCharacters,
        total
      }
    },

    /**
     * 创建角色
     */
    create: async (data: Prisma.CharacterCreateInput): Promise<DbCharacter> => {
      return this.prisma.character.create({
        data: {
          ...data,
          tags: data.tags || stringifyCharacterTags([]),
          metadata: data.metadata || stringifyCharacterMetadata({})
        }
      })
    },

    /**
     * 更新角色
     */
    update: async (id: string, data: Prisma.CharacterUpdateInput): Promise<DbCharacter> => {
      return this.prisma.character.update({
        where: { id },
        data
      })
    },

    /**
     * 删除角色
     */
    delete: async (id: string): Promise<DbCharacter> => {
      return this.prisma.character.delete({
        where: { id }
      })
    },

    /**
     * 增加聊天计数
     */
    incrementChatCount: async (id: string): Promise<void> => {
      await this.prisma.character.update({
        where: { id },
        data: {
          chatCount: {
            increment: 1
          }
        }
      })
    },

    /**
     * 更新评分
     */
    updateRating: async (id: string): Promise<void> => {
      const result = await this.prisma.characterRating.aggregate({
        where: { characterId: id },
        _avg: { rating: true },
        _count: { rating: true }
      })

      await this.prisma.character.update({
        where: { id },
        data: {
          rating: result._avg.rating || 0,
          ratingCount: result._count.rating
        }
      })
    },

    /**
     * 更新收藏计数
     */
    updateFavoriteCount: async (id: string): Promise<void> => {
      const count = await this.prisma.characterFavorite.count({
        where: { characterId: id }
      })

      await this.prisma.character.update({
        where: { id },
        data: { favoriteCount: count }
      })
    }
  }

  /**
   * 聊天会话查询服务
   */
  chatSessions = {
    /**
     * 根据ID查找会话
     */
    findById: async (id: string): Promise<ChatSessionWithCharacter | null> => {
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
      }) as Promise<ChatSessionWithCharacter | null>
    },

    /**
     * 列出用户的聊天会话
     */
    listByUser: async (userId: string, options: ChatSessionListOptions = {}): Promise<{
      sessions: ChatSessionWithCharacter[]
      total: number
    }> => {
      const {
        page = 1,
        limit = 20,
        characterId,
        isArchived = false,
        sort = 'updated'
      } = options

      const where: Prisma.ChatSessionWhereInput = {
        userId,
        isArchived,
        ...(characterId && { characterId })
      }

      const orderBy: Prisma.ChatSessionOrderByWithRelationInput =
        sort === 'created' ? { createdAt: 'desc' } :
        sort === 'messages' ? { messageCount: 'desc' } :
        { updatedAt: 'desc' }

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
        }) as Promise<ChatSessionWithCharacter[]>,
        this.prisma.chatSession.count({ where })
      ])

      return { sessions, total }
    },

    /**
     * 创建聊天会话
     */
    create: async (data: Prisma.ChatSessionCreateInput): Promise<DbChatSession> => {
      return this.prisma.chatSession.create({
        data: {
          ...data,
          metadata: data.metadata || stringifyChatSessionMetadata({})
        }
      })
    },

    /**
     * 更新会话
     */
    update: async (id: string, data: Prisma.ChatSessionUpdateInput): Promise<DbChatSession> => {
      return this.prisma.chatSession.update({
        where: { id },
        data
      })
    },

    /**
     * 更新最后消息时间
     */
    updateLastMessage: async (id: string): Promise<void> => {
      await this.prisma.chatSession.update({
        where: { id },
        data: {
          lastMessageAt: new Date(),
          messageCount: {
            increment: 1
          }
        }
      })
    },

    /**
     * 归档会话
     */
    archive: async (id: string): Promise<DbChatSession> => {
      return this.prisma.chatSession.update({
        where: { id },
        data: { isArchived: true }
      })
    },

    /**
     * 删除会话
     */
    delete: async (id: string): Promise<DbChatSession> => {
      return this.prisma.chatSession.delete({
        where: { id }
      })
    }
  }

  /**
   * 消息查询服务
   */
  messages = {
    /**
     * 根据会话ID列出消息
     */
    listBySession: async (sessionId: string, options: {
      page?: number
      limit?: number
      before?: string
      after?: string
    } = {}): Promise<{
      messages: MessageWithRelations[]
      total: number
    }> => {
      const { page = 1, limit = 50, before, after } = options

      const where: Prisma.MessageWhereInput = {
        sessionId,
        deleted: false,
        ...(before && {
          createdAt: { lt: new Date(before) }
        }),
        ...(after && {
          createdAt: { gt: new Date(after) }
        })
      }

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
        }) as Promise<MessageWithRelations[]>,
        this.prisma.message.count({ where })
      ])

      return { messages, total }
    },

    /**
     * 创建消息
     */
    create: async (data: Prisma.MessageCreateInput): Promise<DbMessage> => {
      return this.prisma.message.create({
        data
      })
    },

    /**
     * 更新消息
     */
    update: async (id: string, data: Prisma.MessageUpdateInput): Promise<DbMessage> => {
      return this.prisma.message.update({
        where: { id },
        data: {
          ...data,
          edited: true
        }
      })
    },

    /**
     * 软删除消息
     */
    softDelete: async (id: string): Promise<DbMessage> => {
      return this.prisma.message.update({
        where: { id },
        data: { deleted: true }
      })
    }
  }

  /**
   * 收藏和评分服务
   */
  favorites = {
    /**
     * 添加收藏
     */
    add: async (userId: string, characterId: string): Promise<void> => {
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
      })

      // 更新角色收藏计数
      await this.characters.updateFavoriteCount(characterId)
    },

    /**
     * 移除收藏
     */
    remove: async (userId: string, characterId: string): Promise<void> => {
      await this.prisma.characterFavorite.deleteMany({
        where: {
          userId,
          characterId
        }
      })

      // 更新角色收藏计数
      await this.characters.updateFavoriteCount(characterId)
    },

    /**
     * 检查是否已收藏
     */
    check: async (userId: string, characterId: string): Promise<boolean> => {
      const favorite = await this.prisma.characterFavorite.findUnique({
        where: {
          userId_characterId: {
            userId,
            characterId
          }
        }
      })
      return !!favorite
    }
  }

  ratings = {
    /**
     * 添加或更新评分
     */
    upsert: async (userId: string, characterId: string, rating: number, comment?: string): Promise<void> => {
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
      })

      // 更新角色评分
      await this.characters.updateRating(characterId)
    },

    /**
     * 删除评分
     */
    delete: async (userId: string, characterId: string): Promise<void> => {
      await this.prisma.characterRating.deleteMany({
        where: {
          userId,
          characterId
        }
      })

      // 更新角色评分
      await this.characters.updateRating(characterId)
    }
  }

  /**
   * 统计查询服务
   */
  stats = {
    /**
     * 获取系统统计
     */
    getSystemStats: async () => {
      const [
        totalUsers,
        activeUsers,
        totalCharacters,
        publicCharacters,
        totalSessions,
        totalMessages
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.character.count(),
        this.prisma.character.count({ where: { isPublic: true } }),
        this.prisma.chatSession.count(),
        this.prisma.message.count()
      ])

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
      }
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
      })
    }
  }
}

// 创建单例实例
let databaseService: DatabaseService | null = null

export const createDatabaseService = (prisma: PrismaClient): DatabaseService => {
  if (!databaseService) {
    databaseService = new DatabaseService(prisma)
  }
  return databaseService
}

export const getDatabaseService = (): DatabaseService => {
  if (!databaseService) {
    throw new Error('Database service not initialized. Call createDatabaseService first.')
  }
  return databaseService
}
