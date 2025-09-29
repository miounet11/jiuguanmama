/**
 * 世界信息匹配器
 * 负责在对话中匹配和激活世界信息条目
 */

import { prisma } from '../server'

export interface MatchResult {
  entryId: string
  content: string
  keywords: string[]
  priority: number
  matched: boolean
  matchedKeywords: string[]
  spacetimeScore?: number // 时空感知匹配分数
  relationTriggers?: any[] // 关系触发器
  culturalContext?: any // 文化语境
  plotPhaseWeight?: number // 剧情阶段权重
  dynamicWeight?: any // 动态权重配置
}

export interface PerformanceMetrics {
  matchTime: number
  entriesProcessed: number
  matchesFound: number
  cacheHits: number
}

class WorldInfoMatcher {
  private performanceMetrics: PerformanceMetrics = {
    matchTime: 0,
    entriesProcessed: 0,
    matchesFound: 0,
    cacheHits: 0
  }

  /**
   * 时空感知的世界信息匹配
   * 支持MBTI兼容性、关系触发器、文化语境、剧情阶段等多维度匹配
   */
  async findSpacetimeEntries(
    scenarioId: string,
    text: string,
    context: {
      characterId?: string
      mbtiType?: string
      currentPlotPhase?: string
      spacetimeAttributes?: string[]
      activeCharacters?: Array<{ id: string, mbtiType?: string }>
    } = {},
    depth: number = 3
  ): Promise<MatchResult[]> {
    const startTime = Date.now()

    try {
      // 获取该情景的所有世界信息条目，包括时空扩展字段
      const worldInfoEntries = await prisma.worldInfoEntry.findMany({
        where: {
          scenarioId: scenarioId,
          isActive: true
        },
        orderBy: {
          priority: 'desc'
        }
      })

      this.performanceMetrics.entriesProcessed = worldInfoEntries.length

      const matchResults: MatchResult[] = []
      const lowerText = text.toLowerCase()

      for (const entry of worldInfoEntries) {
        const keywords = entry.keywords ? JSON.parse(entry.keywords) : []
        const spacetimeAttributes = entry.spacetimeAttributes ? JSON.parse(entry.spacetimeAttributes) : []
        const relationTriggers = entry.relationTriggers ? JSON.parse(entry.relationTriggers) : []
        const culturalContext = entry.culturalContext ? JSON.parse(entry.culturalContext) : null
        const plotPhases = entry.plotPhases ? JSON.parse(entry.plotPhases) : []
        const dynamicWeight = entry.dynamicWeight ? JSON.parse(entry.dynamicWeight) : null

        const matchedKeywords: string[] = []

        // 基础关键词匹配
        for (const keyword of keywords) {
          if (lowerText.includes(keyword.toLowerCase())) {
            matchedKeywords.push(keyword)
          }
        }

        const basicMatched = matchedKeywords.length > 0

        // 时空感知匹配分数计算
        let spacetimeScore = 0
        let plotPhaseWeight = 1.0

        // 1. 时空属性匹配
        if (context.spacetimeAttributes && spacetimeAttributes.length > 0) {
          const attributeMatches = context.spacetimeAttributes.filter(attr =>
            spacetimeAttributes.includes(attr)
          ).length
          spacetimeScore += attributeMatches * 0.3
        }

        // 2. 剧情阶段权重
        if (context.currentPlotPhase && plotPhases.length > 0) {
          const phaseConfig = plotPhases.find((p: any) => p.phase === context.currentPlotPhase)
          if (phaseConfig) {
            plotPhaseWeight = phaseConfig.weightMultiplier || 1.0
          }
        }

        // 3. 角色关系触发器匹配
        if (context.activeCharacters && relationTriggers.length > 0) {
          for (const trigger of relationTriggers) {
            const characterInContext = context.activeCharacters.find(char => char.id === trigger.characterId)
            if (characterInContext) {
              // MBTI兼容性计算
              if (characterInContext.mbtiType && context.mbtiType) {
                const compatibility = this.calculateMbtiCompatibility(characterInContext.mbtiType, context.mbtiType)
                if (compatibility >= trigger.triggerProbability) {
                  spacetimeScore += compatibility * 0.4
                }
              }
            }
          }
        }

        // 4. 文化语境匹配
        if (culturalContext && context.spacetimeAttributes) {
          const culturalMatches = context.spacetimeAttributes.filter(attr =>
            culturalContext.valueSystem?.includes(attr) ||
            culturalContext.culturalSymbols?.includes(attr)
          ).length
          spacetimeScore += culturalMatches * 0.2
        }

        // 5. 动态权重调整
        if (dynamicWeight) {
          const characterPresence = context.activeCharacters?.length || 0
          const characterMultiplier = dynamicWeight.characterPresenceMultiplier || 1.0
          spacetimeScore *= (1 + characterPresence * characterMultiplier * 0.1)
        }

        // 综合匹配判断：基础匹配或时空分数足够高
        const spacetimeThreshold = 0.5 // 可配置的时空感知阈值
        const matched = basicMatched || spacetimeScore >= spacetimeThreshold

        matchResults.push({
          entryId: entry.id,
          content: entry.content,
          keywords: keywords,
          priority: entry.priority || 0,
          matched,
          matchedKeywords,
          spacetimeScore,
          relationTriggers,
          culturalContext,
          plotPhaseWeight,
          dynamicWeight
        })

        if (matched) {
          this.performanceMetrics.matchesFound++
        }
      }

      // 按时空分数和优先级排序
      matchResults.sort((a, b) => {
        const aScore = (a.spacetimeScore || 0) * (a.plotPhaseWeight || 1.0)
        const bScore = (b.spacetimeScore || 0) * (b.plotPhaseWeight || 1.0)

        if (a.matched && !b.matched) return -1
        if (!a.matched && b.matched) return 1

        if (Math.abs(aScore - bScore) > 0.01) {
          return bScore - aScore
        }

        return b.priority - a.priority
      })

      // 根据depth限制返回结果
      const limitedResults = matchResults.slice(0, depth)

      this.performanceMetrics.matchTime = Date.now() - startTime
      return limitedResults

    } catch (error) {
      console.error('时空感知世界信息匹配失败:', error)
      this.performanceMetrics.matchTime = Date.now() - startTime
      return []
    }
  }

  /**
   * 在指定情景中查找激活的世界信息条目 (原有方法保持兼容)
   */
  async findActiveEntries(scenarioId: string, text: string, depth: number = 3): Promise<MatchResult[]> {
    const startTime = Date.now()

    try {
      // 获取该情景的所有世界信息条目
      const worldInfoEntries = await prisma.worldInfoEntry.findMany({
        where: {
          scenarioId: scenarioId,
          isActive: true
        },
        orderBy: {
          priority: 'desc'
        }
      })

      this.performanceMetrics.entriesProcessed = worldInfoEntries.length

      const matchResults: MatchResult[] = []
      const lowerText = text.toLowerCase()

      for (const entry of worldInfoEntries) {
        const keywords = entry.keywords ? entry.keywords.split(',').map(k => k.trim().toLowerCase()) : []
        const matchedKeywords: string[] = []

        // 检查关键词匹配
        for (const keyword of keywords) {
          if (lowerText.includes(keyword)) {
            matchedKeywords.push(keyword)
          }
        }

        const matched = matchedKeywords.length > 0

        matchResults.push({
          entryId: entry.id,
          content: entry.content,
          keywords: keywords,
          priority: entry.priority || 0,
          matched,
          matchedKeywords
        })

        if (matched) {
          this.performanceMetrics.matchesFound++
        }
      }

      // 按优先级和匹配度排序
      matchResults.sort((a, b) => {
        if (a.matched && !b.matched) return -1
        if (!a.matched && b.matched) return 1
        return b.priority - a.priority
      })

      // 根据depth限制返回结果
      const limitedResults = matchResults.slice(0, depth)

      this.performanceMetrics.matchTime = Date.now() - startTime
      return limitedResults

    } catch (error) {
      console.error('世界信息匹配失败:', error)
      this.performanceMetrics.matchTime = Date.now() - startTime
      return []
    }
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  /**
   * 重置性能指标
   */
  resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      matchTime: 0,
      entriesProcessed: 0,
      matchesFound: 0,
      cacheHits: 0
    }
  }

  /**
   * 计算MBTI人格类型的兼容性
   */
  private calculateMbtiCompatibility(type1: string, type2: string): number {
    // MBTI兼容性矩阵 (0-1之间的兼容性评分)
    const compatibilityMatrix: Record<string, Record<string, number>> = {
      // 内向 vs 外向
      'INTJ': {
        'ENFP': 0.95, 'ENTP': 0.85, 'INFJ': 0.80, 'INTP': 0.75,
        'INTJ': 0.70, 'INFP': 0.65, 'ENFJ': 0.60, 'ENTJ': 0.55
      },
      'INTP': {
        'ENTJ': 0.90, 'ENFP': 0.85, 'ESTJ': 0.80, 'INTJ': 0.75,
        'ENTP': 0.70, 'INTP': 0.65, 'INFJ': 0.60, 'ENFJ': 0.55
      },
      'INFJ': {
        'ENFP': 0.95, 'ENFJ': 0.90, 'INFP': 0.85, 'INTJ': 0.80,
        'ENTP': 0.75, 'INFJ': 0.70, 'INTJ': 0.65, 'ENTJ': 0.60
      },
      'INFP': {
        'ENFJ': 0.95, 'INFJ': 0.90, 'INTJ': 0.85, 'ENTP': 0.80,
        'INFP': 0.75, 'ENFP': 0.70, 'ENTJ': 0.65, 'ESTJ': 0.60
      },
      'ENTJ': {
        'INTP': 0.90, 'ENTP': 0.85, 'INTJ': 0.80, 'ESTJ': 0.75,
        'ENFJ': 0.70, 'ENTJ': 0.65, 'INFJ': 0.60, 'ENFP': 0.55
      },
      'ENTP': {
        'INFJ': 0.90, 'INTJ': 0.85, 'ENTJ': 0.80, 'ENFP': 0.75,
        'INTP': 0.70, 'ENTP': 0.65, 'ESTJ': 0.60, 'ENFJ': 0.55
      },
      'ENFJ': {
        'INFP': 0.95, 'INFJ': 0.90, 'ISFP': 0.85, 'ISFJ': 0.80,
        'ENFJ': 0.75, 'ENTJ': 0.70, 'ENFP': 0.65, 'ENTP': 0.60
      },
      'ENFP': {
        'INFJ': 0.95, 'INTJ': 0.90, 'INFP': 0.85, 'ENTP': 0.80,
        'ENFP': 0.75, 'INTP': 0.70, 'ENFJ': 0.65, 'ENTJ': 0.60
      },
      // 传感型人格的基础兼容性
      'ISTJ': {
        'ESTJ': 0.85, 'ISFJ': 0.80, 'ISTP': 0.75, 'ESTP': 0.70,
        'ESFJ': 0.65, 'ISTJ': 0.60, 'ISFP': 0.55, 'ESFP': 0.50
      },
      'ISFJ': {
        'ESFJ': 0.90, 'ISTJ': 0.85, 'ISFP': 0.80, 'ESTJ': 0.75,
        'ESFP': 0.70, 'ISFJ': 0.65, 'ISTP': 0.60, 'ESTP': 0.55
      },
      'ISTP': {
        'ESTP': 0.85, 'ISTJ': 0.80, 'ISFP': 0.75, 'ESFP': 0.70,
        'ESTJ': 0.65, 'ISTP': 0.60, 'ISFJ': 0.55, 'ESFJ': 0.50
      },
      'ISFP': {
        'ESFP': 0.90, 'ISFJ': 0.85, 'ISTP': 0.80, 'ESFJ': 0.75,
        'ESFP': 0.70, 'ISFP': 0.65, 'ISTJ': 0.60, 'ESTP': 0.55
      },
      'ESTJ': {
        'ISTJ': 0.85, 'ESTP': 0.80, 'ESFJ': 0.75, 'ENTJ': 0.70,
        'ISFJ': 0.65, 'ESTJ': 0.60, 'ISFP': 0.55, 'ENFP': 0.50
      },
      'ESFJ': {
        'ISFJ': 0.90, 'ESFP': 0.85, 'ESTJ': 0.80, 'ENFJ': 0.75,
        'ISFP': 0.70, 'ESFJ': 0.65, 'ISTJ': 0.60, 'ENTP': 0.55
      },
      'ESTP': {
        'ISTP': 0.85, 'ESFP': 0.80, 'ESTJ': 0.75, 'ENTP': 0.70,
        'ISTJ': 0.65, 'ESTP': 0.60, 'ISFJ': 0.55, 'ENFJ': 0.50
      },
      'ESFP': {
        'ISFP': 0.90, 'ESFJ': 0.85, 'ESTP': 0.80, 'ENFP': 0.75,
        'ISFJ': 0.70, 'ESFP': 0.65, 'ISTP': 0.60, 'ENTJ': 0.55
      }
    }

    // 对称填充矩阵
    const getSymmetricalCompatibility = (type1: string, type2: string): number => {
      if (compatibilityMatrix[type1]?.[type2] !== undefined) {
        return compatibilityMatrix[type1][type2]
      }
      if (compatibilityMatrix[type2]?.[type1] !== undefined) {
        return compatibilityMatrix[type2][type1]
      }
      // 默认兼容性评分
      return 0.5
    }

    return getSymmetricalCompatibility(type1, type2)
  }
}

// 导出单例实例
export const worldInfoMatcher = new WorldInfoMatcher()
