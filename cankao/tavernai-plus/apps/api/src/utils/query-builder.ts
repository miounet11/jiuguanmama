/**
 * 类型安全的查询构造器
 * 提供链式查询API和优化的查询模式
 */

const { PrismaClient, Prisma } = require('../../node_modules/.prisma/client')
import {
  CharacterListOptions,
  ChatSessionListOptions,
  parseCharacterTags
} from '../types/database'

/**
 * 基础查询构造器
 */
export class QueryBuilder<T> {
  protected where: any = {}
  protected orderBy: any[] = []
  protected include: any = {}
  protected select: any = null
  protected skip: number = 0
  protected take: number = 20

  constructor(protected prisma: InstanceType<typeof PrismaClient>, protected model: string) {}

  /**
   * 添加WHERE条件
   */
  addWhere(condition: any): this {
    this.where = { ...this.where, ...condition }
    return this
  }

  /**
   * 添加OR条件
   */
  addOr(conditions: any[]): this {
    if (this.where.OR) {
      this.where.OR.push(...conditions)
    } else {
      this.where.OR = conditions
    }
    return this
  }

  /**
   * 添加排序
   */
  addOrderBy(orderBy: any): this {
    if (Array.isArray(orderBy)) {
      this.orderBy.push(...orderBy)
    } else {
      this.orderBy.push(orderBy)
    }
    return this
  }

  /**
   * 设置关联查询
   */
  addInclude(include: any): this {
    this.include = { ...this.include, ...include }
    return this
  }

  /**
   * 设置字段选择
   */
  addSelect(select: any): this {
    this.select = { ...this.select, ...select }
    return this
  }

  /**
   * 设置分页
   */
  paginate(page: number, limit: number): this {
    this.skip = (page - 1) * limit
    this.take = limit
    return this
  }

  /**
   * 获取查询参数
   */
  getQuery() {
    const query: any = {
      where: this.where,
      orderBy: this.orderBy.length > 0 ? this.orderBy : undefined,
      skip: this.skip,
      take: this.take
    }

    if (Object.keys(this.include).length > 0) {
      query.include = this.include
    }

    if (this.select) {
      query.select = this.select
    }

    return query
  }
}

/**
 * 角色查询构造器
 */
export class CharacterQueryBuilder extends QueryBuilder<Prisma.CharacterFindManyArgs> {
  constructor(prisma: InstanceType<typeof PrismaClient>) {
    super(prisma, 'character')
  }

  /**
   * 应用角色列表选项
   */
  applyListOptions(options: CharacterListOptions, userId?: string): this {
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

    // 基础条件
    this.addWhere({
      isPublic,
      ...(creatorId && { creatorId }),
      ...(isNSFW !== undefined && { isNSFW }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(category && { category })
    })

    // 搜索条件
    if (search) {
      this.addOr([
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ])
    }

    // 标签过滤（需要在应用层处理，因为SQLite不支持JSON查询）
    if (tags && tags.length > 0) {
      // 这里我们先获取所有结果，然后在应用层过滤
      // 在生产环境中，应该考虑使用支持JSON查询的数据库
    }

    // 排序
    switch (sort) {
      case 'rating':
        this.addOrderBy([{ rating: 'desc' }, { ratingCount: 'desc' }])
        break
      case 'popular':
        this.addOrderBy([{ chatCount: 'desc' }, { favoriteCount: 'desc' }])
        break
      case 'favorites':
        this.addOrderBy({ favoriteCount: 'desc' })
        break
      default:
        this.addOrderBy({ createdAt: 'desc' })
    }

    // 分页
    this.paginate(page, limit)

    // 包含创建者信息
    this.addInclude({
      creator: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      _count: {
        select: {
          chatSessions: true,
          messages: true,
          favorites: true,
          ratings: true
        }
      }
    })

    // 如果提供了用户ID，包含收藏信息
    if (userId) {
      this.addInclude({
        favorites: {
          where: { userId },
          select: { id: true }
        }
      })
    }

    return this
  }

  /**
   * 只查询公开角色
   */
  onlyPublic(): this {
    this.addWhere({ isPublic: true })
    return this
  }

  /**
   * 只查询精选角色
   */
  onlyFeatured(): this {
    this.addWhere({ isFeatured: true })
    return this
  }

  /**
   * 按创建者过滤
   */
  byCreator(creatorId: string): this {
    this.addWhere({ creatorId })
    return this
  }

  /**
   * 按分类过滤
   */
  byCategory(category: string): this {
    this.addWhere({ category })
    return this
  }

  /**
   * 搜索角色
   */
  search(query: string): this {
    this.addOr([
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } }
    ])
    return this
  }

  /**
   * 按评分排序
   */
  orderByRating(): this {
    this.addOrderBy([{ rating: 'desc' }, { ratingCount: 'desc' }])
    return this
  }

  /**
   * 按人气排序
   */
  orderByPopularity(): this {
    this.addOrderBy([{ chatCount: 'desc' }, { favoriteCount: 'desc' }])
    return this
  }

  /**
   * 包含完整信息
   */
  withFullInfo(userId?: string): this {
    this.addInclude({
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
        },
        ratings: {
          where: { userId },
          select: { rating: true, comment: true }
        }
      })
    })
    return this
  }

  /**
   * 执行查询
   */
  async execute() {
    const query = this.getQuery()
    return this.prisma.character.findMany(query)
  }

  /**
   * 执行计数查询
   */
  async count() {
    return this.prisma.character.count({ where: this.where })
  }

  /**
   * 执行分页查询
   */
  async executeWithCount() {
    const [items, total] = await Promise.all([
      this.execute(),
      this.count()
    ])
    return { items, total }
  }
}

/**
 * 聊天会话查询构造器
 */
export class ChatSessionQueryBuilder extends QueryBuilder<Prisma.ChatSessionFindManyArgs> {
  constructor(prisma: InstanceType<typeof PrismaClient>) {
    super(prisma, 'chatSession')
  }

  /**
   * 应用会话列表选项
   */
  applyListOptions(options: ChatSessionListOptions): this {
    const {
      page = 1,
      limit = 20,
      characterId,
      isArchived = false,
      sort = 'updated'
    } = options

    // 基础条件
    this.addWhere({
      isArchived,
      ...(characterId && { characterId })
    })

    // 排序
    switch (sort) {
      case 'created':
        this.addOrderBy({ createdAt: 'desc' })
        break
      case 'messages':
        this.addOrderBy({ messageCount: 'desc' })
        break
      default:
        this.addOrderBy({ updatedAt: 'desc' })
    }

    // 分页
    this.paginate(page, limit)

    // 包含关联信息
    this.addInclude({
      user: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
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
    })

    return this
  }

  /**
   * 按用户过滤
   */
  byUser(userId: string): this {
    this.addWhere({ userId })
    return this
  }

  /**
   * 按角色过滤
   */
  byCharacter(characterId: string): this {
    this.addWhere({ characterId })
    return this
  }

  /**
   * 只查询活跃会话
   */
  onlyActive(): this {
    this.addWhere({ isArchived: false })
    return this
  }

  /**
   * 只查询归档会话
   */
  onlyArchived(): this {
    this.addWhere({ isArchived: true })
    return this
  }

  /**
   * 按更新时间排序
   */
  orderByUpdated(): this {
    this.addOrderBy({ updatedAt: 'desc' })
    return this
  }

  /**
   * 按消息数量排序
   */
  orderByMessageCount(): this {
    this.addOrderBy({ messageCount: 'desc' })
    return this
  }

  /**
   * 执行查询
   */
  async execute() {
    const query = this.getQuery()
    return this.prisma.chatSession.findMany(query)
  }

  /**
   * 执行计数查询
   */
  async count() {
    return this.prisma.chatSession.count({ where: this.where })
  }

  /**
   * 执行分页查询
   */
  async executeWithCount() {
    const [items, total] = await Promise.all([
      this.execute(),
      this.count()
    ])
    return { items, total }
  }
}

/**
 * 消息查询构造器
 */
export class MessageQueryBuilder extends QueryBuilder<Prisma.MessageFindManyArgs> {
  constructor(prisma: InstanceType<typeof PrismaClient>) {
    super(prisma, 'message')
  }

  /**
   * 按会话过滤
   */
  bySession(sessionId: string): this {
    this.addWhere({ sessionId })
    return this
  }

  /**
   * 只查询未删除的消息
   */
  notDeleted(): this {
    this.addWhere({ deleted: false })
    return this
  }

  /**
   * 按时间范围过滤
   */
  timeRange(before?: Date, after?: Date): this {
    const timeCondition: any = {}
    if (before) timeCondition.lt = before
    if (after) timeCondition.gt = after

    if (Object.keys(timeCondition).length > 0) {
      this.addWhere({ createdAt: timeCondition })
    }
    return this
  }

  /**
   * 按时间排序
   */
  orderByTime(direction: 'asc' | 'desc' = 'asc'): this {
    this.addOrderBy({ createdAt: direction })
    return this
  }

  /**
   * 包含用户和角色信息
   */
  withRelations(): this {
    this.addInclude({
      user: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      character: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    })
    return this
  }

  /**
   * 执行查询
   */
  async execute() {
    const query = this.getQuery()
    return this.prisma.message.findMany(query)
  }

  /**
   * 执行计数查询
   */
  async count() {
    return this.prisma.message.count({ where: this.where })
  }
}

/**
 * 查询构造器工厂
 */
export class QueryBuilderFactory {
  constructor(private prisma: InstanceType<typeof PrismaClient>) {}

  /**
   * 创建角色查询构造器
   */
  characters(): CharacterQueryBuilder {
    return new CharacterQueryBuilder(this.prisma)
  }

  /**
   * 创建聊天会话查询构造器
   */
  chatSessions(): ChatSessionQueryBuilder {
    return new ChatSessionQueryBuilder(this.prisma)
  }

  /**
   * 创建消息查询构造器
   */
  messages(): MessageQueryBuilder {
    return new MessageQueryBuilder(this.prisma)
  }
}

/**
 * 高级查询工具
 */
export class AdvancedQueries {
  constructor(private prisma: InstanceType<typeof PrismaClient>) {}

  /**
   * 获取角色的详细统计信息
   */
  async getCharacterDetailedStats(characterId: string) {
    const [
      basicStats,
      recentChats,
      topUsers,
      ratingDistribution
    ] = await Promise.all([
      // 基础统计
      this.prisma.character.findUnique({
        where: { id: characterId },
        select: {
          chatCount: true,
          favoriteCount: true,
          rating: true,
          ratingCount: true,
          createdAt: true,
          _count: {
            select: {
              chatSessions: true,
              messages: true
            }
          }
        }
      }),

      // 最近30天的聊天数据
      this.prisma.chatSession.count({
        where: {
          characterId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // 最活跃的用户
      this.prisma.chatSession.groupBy({
        by: ['userId'],
        where: { characterId },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 5
      }),

      // 评分分布
      this.prisma.characterRating.groupBy({
        by: ['rating'],
        where: { characterId },
        _count: { rating: true },
        orderBy: { rating: 'asc' }
      })
    ])

    return {
      basic: basicStats,
      recentChats,
      topUsers,
      ratingDistribution
    }
  }

  /**
   * 获取用户的聊天统计
   */
  async getUserChatStats(userId: string) {
    const [
      totalSessions,
      totalMessages,
      favoriteCharacters,
      recentActivity
    ] = await Promise.all([
      this.prisma.chatSession.count({
        where: { userId }
      }),

      this.prisma.message.count({
        where: { userId }
      }),

      this.prisma.characterFavorite.count({
        where: { userId }
      }),

      this.prisma.chatSession.findMany({
        where: {
          userId,
          lastMessageAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { lastMessageAt: 'desc' },
        take: 10,
        include: {
          character: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      })
    ])

    return {
      totalSessions,
      totalMessages,
      favoriteCharacters,
      recentActivity
    }
  }

  /**
   * 搜索角色（支持标签过滤）
   */
  async searchCharacters(
    query: string,
    tags: string[] = [],
    options: CharacterListOptions = {}
  ) {
    const builder = new CharacterQueryBuilder(this.prisma)
      .onlyPublic()
      .search(query)
      .applyListOptions(options)

    const characters = await builder.execute()

    // 在应用层进行标签过滤（SQLite限制）
    if (tags.length > 0) {
      const filteredCharacters = characters.filter((char: any) => {
        const characterTags = parseCharacterTags(char.tags)
        return tags.some(tag =>
          characterTags.some(charTag =>
            charTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      })
      return filteredCharacters
    }

    return characters
  }
}

// 导出工厂函数
export const createQueryBuilder = (prisma: InstanceType<typeof PrismaClient>) => {
  return new QueryBuilderFactory(prisma)
}

export const createAdvancedQueries = (prisma: InstanceType<typeof PrismaClient>) => {
  return new AdvancedQueries(prisma)
}
