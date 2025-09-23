/**
 * 情景剧本业务逻辑服务
 * 提供剧本和世界信息的高级业务功能，包括权限管理、数据验证、统计分析等
 */

import { Prisma } from '@prisma/client'
import { prisma } from '../server'
import { worldInfoMatcher } from './worldInfoMatcher'
import {
  ApiScenario,
  ApiScenarioDetail,
  ApiWorldInfoEntry,
  CreateScenarioRequest,
  UpdateScenarioRequest,
  CreateWorldInfoEntryRequest,
  UpdateWorldInfoEntryRequest,
  ScenarioListQuery,
  ScenarioStats
} from '../types/api'

export class ScenarioService {
  /**
   * 获取剧本列表（支持分页和筛选）
   */
  async getScenarios(
    userId?: string,
    query: ScenarioListQuery = {}
  ): Promise<{ scenarios: ApiScenario[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      sort = 'created',
      search,
      category,
      isPublic,
      tags
    } = query

    const skip = (page - 1) * limit

    // 构建查询条件
    const where: Prisma.ScenarioWhereInput = {}

    // 权限控制：未登录用户只能看公开剧本，登录用户可以看自己的私有剧本
    if (userId) {
      where.OR = [
        { isPublic: true },
        { userId }
      ]
    } else {
      where.isPublic = true
    }

    // 只显示活跃的剧本
    where.isActive = true

    // 搜索条件
    if (search) {
      const searchCondition: Prisma.ScenarioWhereInput = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }

      if (where.OR) {
        where.AND = [{ OR: where.OR }, searchCondition]
        delete where.OR
      } else {
        Object.assign(where, searchCondition)
      }
    }

    // 分类筛选
    if (category) {
      where.category = category
    }

    // 公开性筛选（仅对已登录用户有效）
    if (userId && isPublic !== undefined) {
      where.isPublic = isPublic
      if (!isPublic) {
        where.userId = userId // 只能看到自己的私有剧本
      }
    }

    // 标签筛选
    if (tags && tags.length > 0) {
      const tagConditions = tags.map(tag => ({
        tags: { contains: `"${tag}"` }
      }))
      if (where.AND) {
        where.AND.push({ OR: tagConditions })
      } else {
        where.AND = [{ OR: tagConditions }]
      }
    }

    // 排序设置
    let orderBy: Prisma.ScenarioOrderByWithRelationInput | Prisma.ScenarioOrderByWithRelationInput[]
    switch (sort) {
      case 'updated':
        orderBy = { updatedAt: 'desc' }
        break
      case 'rating':
        orderBy = { rating: 'desc' }
        break
      case 'popular':
        orderBy = [{ useCount: 'desc' }, { favoriteCount: 'desc' }]
        break
      case 'name':
        orderBy = { name: 'asc' }
        break
      default:
        orderBy = { createdAt: 'desc' }
    }

    // 执行查询
    const [scenarios, total] = await Promise.all([
      prisma.scenario.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          tags: true,
          language: true,
          isPublic: true,
          isActive: true,
          viewCount: true,
          useCount: true,
          favoriteCount: true,
          rating: true,
          ratingCount: true,
          version: true,
          parentId: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          },
          _count: {
            select: {
              worldInfos: true,
              favorites: true,
              ratings: true
            }
          }
        }
      }),
      prisma.scenario.count({ where })
    ])

    // 解析标签并添加权限标记
    const scenariosWithPermissions: ApiScenario[] = scenarios.map(scenario => ({
      ...scenario,
      tags: this.parseTags(scenario.tags),
      canEdit: userId === scenario.user.id,
      isFavorited: false // 这里可以后续扩展查询用户收藏状态
    }))

    return { scenarios: scenariosWithPermissions, total }
  }

  /**
   * 获取剧本详情
   */
  async getScenarioById(id: string, userId?: string): Promise<ApiScenarioDetail | null> {
    const scenario = await prisma.scenario.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        worldInfos: {
          where: { isActive: true },
          orderBy: { priority: 'desc' }
        },
        _count: {
          select: {
            worldInfos: true,
            favorites: true,
            ratings: true,
            characters: true
          }
        }
      }
    })

    if (!scenario) {
      return null
    }

    // 权限检查：私有剧本只能被创建者查看
    if (!scenario.isPublic && (!userId || userId !== scenario.userId)) {
      throw new Error('没有权限访问此剧本')
    }

    // 增加浏览次数（如果不是创建者）
    if (!userId || userId !== scenario.userId) {
      await this.incrementViewCount(id)
    }

    // 转换世界信息条目
    const worldInfos: ApiWorldInfoEntry[] = scenario.worldInfos.map(entry => ({
      ...entry,
      keywords: this.parseKeywords(entry.keywords)
    }))

    return {
      ...scenario,
      tags: this.parseTags(scenario.tags),
      worldInfos,
      canEdit: userId === scenario.userId,
      isFavorited: false // 这里可以后续扩展查询用户收藏状态
    }
  }

  /**
   * 创建剧本
   */
  async createScenario(userId: string, data: CreateScenarioRequest): Promise<ApiScenario> {
    // 检查同名剧本
    const existingScenario = await prisma.scenario.findFirst({
      where: {
        userId,
        name: data.name,
        isActive: true
      }
    })

    if (existingScenario) {
      throw new Error('已存在同名剧本')
    }

    const scenario = await prisma.scenario.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        content: data.content,
        isPublic: data.isPublic ?? true,
        tags: JSON.stringify(data.tags ?? []),
        category: data.category ?? '通用',
        language: data.language ?? 'zh-CN'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        _count: {
          select: {
            worldInfos: true,
            favorites: true,
            ratings: true
          }
        }
      }
    })

    return {
      ...scenario,
      tags: this.parseTags(scenario.tags),
      canEdit: true,
      isFavorited: false
    }
  }

  /**
   * 更新剧本
   */
  async updateScenario(
    id: string,
    userId: string,
    data: UpdateScenarioRequest
  ): Promise<ApiScenario> {
    // 检查权限
    await this.checkScenarioOwnership(id, userId)

    // 如果修改名称，检查是否重名
    if (data.name) {
      const duplicateScenario = await prisma.scenario.findFirst({
        where: {
          userId,
          name: data.name,
          isActive: true,
          id: { not: id }
        }
      })

      if (duplicateScenario) {
        throw new Error('已存在同名剧本')
      }
    }

    // 处理标签数据
    const updateData: any = { ...data }
    if (data.tags) {
      updateData.tags = JSON.stringify(data.tags)
    }

    const updatedScenario = await prisma.scenario.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        _count: {
          select: {
            worldInfos: true,
            favorites: true,
            ratings: true
          }
        }
      }
    })

    return {
      ...updatedScenario,
      tags: this.parseTags(updatedScenario.tags),
      canEdit: true,
      isFavorited: false
    }
  }

  /**
   * 删除剧本（软删除）
   */
  async deleteScenario(id: string, userId: string): Promise<void> {
    // 检查权限
    await this.checkScenarioOwnership(id, userId)

    // 软删除
    await prisma.scenario.update({
      where: { id },
      data: { isActive: false }
    })
  }

  /**
   * 创建世界信息条目
   */
  async createWorldInfoEntry(
    scenarioId: string,
    userId: string,
    data: CreateWorldInfoEntryRequest
  ): Promise<ApiWorldInfoEntry> {
    // 检查剧本权限
    await this.checkScenarioOwnership(scenarioId, userId)

    const entry = await prisma.worldInfoEntry.create({
      data: {
        ...data,
        scenarioId,
        keywords: JSON.stringify(data.keywords)
      }
    })

    return {
      ...entry,
      keywords: this.parseKeywords(entry.keywords)
    }
  }

  /**
   * 更新世界信息条目
   */
  async updateWorldInfoEntry(
    scenarioId: string,
    entryId: string,
    userId: string,
    data: UpdateWorldInfoEntryRequest
  ): Promise<ApiWorldInfoEntry> {
    // 检查剧本权限
    await this.checkScenarioOwnership(scenarioId, userId)

    // 检查条目是否存在
    const existingEntry = await prisma.worldInfoEntry.findUnique({
      where: { id: entryId }
    })

    if (!existingEntry || existingEntry.scenarioId !== scenarioId) {
      throw new Error('世界信息条目不存在')
    }

    // 处理关键词数据
    const updateData: any = { ...data }
    if (data.keywords) {
      updateData.keywords = JSON.stringify(data.keywords)
    }

    const updatedEntry = await prisma.worldInfoEntry.update({
      where: { id: entryId },
      data: updateData
    })

    return {
      ...updatedEntry,
      keywords: this.parseKeywords(updatedEntry.keywords)
    }
  }

  /**
   * 删除世界信息条目
   */
  async deleteWorldInfoEntry(
    scenarioId: string,
    entryId: string,
    userId: string
  ): Promise<void> {
    // 检查剧本权限
    await this.checkScenarioOwnership(scenarioId, userId)

    // 检查条目是否存在
    const existingEntry = await prisma.worldInfoEntry.findUnique({
      where: { id: entryId }
    })

    if (!existingEntry || existingEntry.scenarioId !== scenarioId) {
      throw new Error('世界信息条目不存在')
    }

    // 删除条目
    await prisma.worldInfoEntry.delete({
      where: { id: entryId }
    })
  }

  /**
   * 测试关键词匹配
   */
  async testMatching(scenarioId: string, userId: string, testText: string, depth: number = 1) {
    // 检查剧本权限
    await this.checkScenarioOwnership(scenarioId, userId)

    // 使用世界信息匹配引擎进行测试
    const startTime = performance.now()
    const matchResults = await worldInfoMatcher.findActiveEntries(scenarioId, testText, depth)
    const matchingTime = performance.now() - startTime

    // 获取性能指标
    const performanceMetrics = worldInfoMatcher.getPerformanceMetrics()

    return {
      testText,
      depth,
      matchResults: matchResults.map(result => ({
        entry: {
          id: result.entry.id,
          title: result.entry.title,
          content: result.entry.content,
          keywords: this.parseKeywords(result.entry.keywords),
          priority: result.entry.priority,
          matchType: result.entry.matchType,
          category: result.entry.category
        },
        matches: result.matches,
        confidence: result.confidence,
        priority: result.priority,
        insertPosition: result.insertPosition
      })),
      statistics: {
        totalEntries: matchResults.length,
        matchingTime: Math.round(matchingTime * 100) / 100, // 保留2位小数
        averageConfidence: matchResults.length > 0
          ? matchResults.reduce((sum, r) => sum + r.confidence, 0) / matchResults.length
          : 0
      },
      performanceMetrics
    }
  }

  /**
   * 获取剧本统计信息
   */
  async getScenarioStats(): Promise<ScenarioStats> {
    const [
      totalScenarios,
      publicScenarios,
      privateScenarios,
      totalWorldInfoEntries,
      ratingData,
      viewData,
      useData,
      categoryData,
      popularScenarios
    ] = await Promise.all([
      prisma.scenario.count({ where: { isActive: true } }),
      prisma.scenario.count({ where: { isActive: true, isPublic: true } }),
      prisma.scenario.count({ where: { isActive: true, isPublic: false } }),
      prisma.worldInfoEntry.count({ where: { isActive: true } }),
      prisma.scenario.aggregate({
        where: { isActive: true, ratingCount: { gt: 0 } },
        _avg: { rating: true }
      }),
      prisma.scenario.aggregate({
        where: { isActive: true },
        _sum: { viewCount: true }
      }),
      prisma.scenario.aggregate({
        where: { isActive: true },
        _sum: { useCount: true }
      }),
      prisma.scenario.groupBy({
        by: ['category'],
        where: { isActive: true },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
        take: 10
      }),
      prisma.scenario.findMany({
        where: { isActive: true, isPublic: true },
        select: {
          id: true,
          name: true,
          useCount: true,
          rating: true
        },
        orderBy: { useCount: 'desc' },
        take: 10
      })
    ])

    return {
      totalScenarios,
      publicScenarios,
      privateScenarios,
      totalWorldInfoEntries,
      averageRating: ratingData._avg.rating || 0,
      totalViews: viewData._sum.viewCount || 0,
      totalUses: useData._sum.useCount || 0,
      topCategories: categoryData.map(item => ({
        category: item.category,
        count: item._count.category
      })),
      popularScenarios
    }
  }

  /**
   * 增加剧本浏览次数
   */
  private async incrementViewCount(scenarioId: string): Promise<void> {
    await prisma.scenario.update({
      where: { id: scenarioId },
      data: { viewCount: { increment: 1 } }
    })
  }

  /**
   * 检查剧本所有权
   */
  private async checkScenarioOwnership(scenarioId: string, userId: string): Promise<void> {
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
      select: { userId: true }
    })

    if (!scenario) {
      throw new Error('剧本不存在')
    }

    if (scenario.userId !== userId) {
      throw new Error('没有权限操作此剧本')
    }
  }

  /**
   * 解析标签字符串
   */
  private parseTags(tagsString: string): string[] {
    try {
      const parsed = JSON.parse(tagsString)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  /**
   * 解析关键词字符串
   */
  private parseKeywords(keywordsString: string): string[] {
    try {
      const parsed = JSON.parse(keywordsString)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return keywordsString.split(',').map(k => k.trim()).filter(k => k.length > 0)
    }
  }
}

// 导出单例服务实例
export const scenarioService = new ScenarioService()