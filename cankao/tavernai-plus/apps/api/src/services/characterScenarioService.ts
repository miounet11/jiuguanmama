/**
 * 角色剧本关联服务
 * Character-Scenario Association Service
 */

const { PrismaClient } = require('../../node_modules/.prisma/client')
import { logger } from './logger'
import CacheManager from './cacheManager'

interface CharacterScenarioAssociation {
  id: string
  characterId: string
  scenarioId: string
  isDefault: boolean
  isActive: boolean
  customSettings: Record<string, any>
  character?: Character
  scenario?: Scenario
  worldSetting?: CharacterWorldSetting
  createdAt: Date
  updatedAt: Date
}

interface CharacterWorldSetting {
  id: string
  characterId: string
  scenarioId: string
  backgroundOverride?: string
  relationships: Record<string, any>
  specialAbilities: Array<{
    name: string
    description: string
    type: string
    scope: string
    limitations?: string[]
  }>
  restrictions: Array<{
    type: string
    description: string
    severity: string
    conditions?: string[]
  }>
  startingLocationId?: string
  startingItems: string[]
  reputation: Record<string, any>
  secretsKnown: Array<{
    secret: string
    importance: number
    source: string
    consequences_if_revealed?: string
  }>
  personalGoals?: Array<{
    description: string
    motivation: string
    obstacles: string[]
    progress: number
  }>
  isActive: boolean
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

interface Character {
  id: string
  name: string
  description?: string
  avatar?: string
  personality?: string
  background?: string
  tags: string[]
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

interface Scenario {
  id: string
  name: string
  description?: string
  category: string
  tags: string[]
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

interface ScenarioRecommendation {
  scenario: Scenario
  matchScore: number
  reasons: string[]
  compatibility: {
    thematic: number
    genre: number
    complexity: number
    overall: number
  }
}

interface CharacterRecommendation {
  character: Character
  matchScore: number
  reasons: string[]
  suggestedRole: string
  compatibility: {
    personality: number
    background: number
    abilities: number
    overall: number
  }
}

export class CharacterScenarioService {
  private prisma: PrismaClient
  private cache: CacheManager

  constructor(prisma: PrismaClient, cache: CacheManager) {
    this.prisma = prisma
    this.cache = cache
  }

  /**
   * 获取角色关联的所有剧本
   */
  async getCharacterScenarios(
    characterId: string,
    userId: string,
    includeInactive = false
  ): Promise<CharacterScenarioAssociation[]> {
    logger.info(`Getting scenarios for character ${characterId}`, { userId })

    const cacheKey = `character_scenarios:${characterId}:${includeInactive}`
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    const associations = await this.prisma.characterScenario.findMany({
      where: {
        characterId,
        character: { userId },
        ...(includeInactive ? {} : { isActive: true })
      },
      include: {
        character: true,
        scenario: true
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // 获取世界设定
    const associationsWithSettings = await Promise.all(
      associations.map(async (assoc) => {
        const worldSetting = await this.getCharacterWorldSetting(characterId, assoc.scenarioId)
        return {
          ...this.transformAssociation(assoc),
          worldSetting
        }
      })
    )

    await this.cache.set(cacheKey, JSON.stringify(associationsWithSettings), 300)
    return associationsWithSettings
  }

  /**
   * 获取剧本关联的所有角色
   */
  async getScenarioCharacters(
    scenarioId: string,
    userId: string,
    includeInactive = false
  ): Promise<CharacterScenarioAssociation[]> {
    logger.info(`Getting characters for scenario ${scenarioId}`, { userId })

    const cacheKey = `scenario_characters:${scenarioId}:${includeInactive}`
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    const associations = await this.prisma.characterScenario.findMany({
      where: {
        scenarioId,
        scenario: { userId },
        ...(includeInactive ? {} : { isActive: true })
      },
      include: {
        character: true,
        scenario: true
      },
      orderBy: [
        { isDefault: 'desc' },
        { character: { name: 'asc' } }
      ]
    })

    const associationsWithSettings = await Promise.all(
      associations.map(async (assoc) => {
        const worldSetting = await this.getCharacterWorldSetting(assoc.characterId, scenarioId)
        return {
          ...this.transformAssociation(assoc),
          worldSetting
        }
      })
    )

    await this.cache.set(cacheKey, JSON.stringify(associationsWithSettings), 300)
    return associationsWithSettings
  }

  /**
   * 创建角色剧本关联
   */
  async associateCharacterWithScenario(
    characterId: string,
    scenarioId: string,
    userId: string,
    options: {
      isDefault?: boolean
      isActive?: boolean
      customSettings?: Record<string, any>
      worldSetting?: Partial<CharacterWorldSetting>
    } = {}
  ): Promise<CharacterScenarioAssociation> {
    logger.info(`Associating character ${characterId} with scenario ${scenarioId}`, { userId })

    // 验证角色和剧本的所有权
    const [character, scenario] = await Promise.all([
      this.prisma.character.findFirst({
        where: { id: characterId, userId }
      }),
      this.prisma.scenario.findFirst({
        where: { id: scenarioId, userId }
      })
    ])

    if (!character) {
      throw new Error('Character not found or access denied')
    }

    if (!scenario) {
      throw new Error('Scenario not found or access denied')
    }

    // 检查是否已存在关联
    const existing = await this.prisma.characterScenario.findUnique({
      where: {
        characterId_scenarioId: {
          characterId,
          scenarioId
        }
      }
    })

    if (existing) {
      throw new Error('Association already exists')
    }

    // 如果设置为默认剧本，先取消其他默认设置
    if (options.isDefault) {
      await this.prisma.characterScenario.updateMany({
        where: {
          characterId,
          isDefault: true
        },
        data: {
          isDefault: false,
          updated_at: new Date()
        }
      })
    }

    // 创建关联
    const association = await this.prisma.characterScenario.create({
      data: {
        characterId,
        scenarioId,
        isDefault: options.isDefault || false,
        isActive: options.isActive !== false,
        custom_settings: JSON.stringify(options.customSettings || {})
      },
      include: {
        character: true,
        scenario: true
      }
    })

    // 如果提供了世界设定，创建或更新
    if (options.worldSetting) {
      await this.createOrUpdateCharacterWorldSetting(
        characterId,
        scenarioId,
        userId,
        options.worldSetting
      )
    }

    // 清除缓存
    await this.invalidateCache(characterId, scenarioId)

    return this.transformAssociation(association)
  }

  /**
   * 更新角色剧本关联
   */
  async updateCharacterScenarioAssociation(
    characterId: string,
    scenarioId: string,
    userId: string,
    updates: {
      isDefault?: boolean
      isActive?: boolean
      customSettings?: Record<string, any>
    }
  ): Promise<CharacterScenarioAssociation> {
    logger.info(`Updating association between character ${characterId} and scenario ${scenarioId}`, { userId })

    // 验证关联存在且有权限
    const existing = await this.prisma.characterScenario.findFirst({
      where: {
        characterId,
        scenarioId,
        character: { userId }
      },
      include: {
        character: true,
        scenario: true
      }
    })

    if (!existing) {
      throw new Error('Association not found or access denied')
    }

    // 如果设置为默认剧本，先取消其他默认设置
    if (updates.isDefault) {
      await this.prisma.characterScenario.updateMany({
        where: {
          characterId,
          isDefault: true,
          id: { not: existing.id }
        },
        data: {
          isDefault: false,
          updated_at: new Date()
        }
      })
    }

    const updated = await this.prisma.characterScenario.update({
      where: {
        characterId_scenarioId: {
          characterId,
          scenarioId
        }
      },
      data: {
        ...(updates.isDefault !== undefined && { isDefault: updates.isDefault }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
        ...(updates.customSettings && { custom_settings: JSON.stringify(updates.customSettings) }),
        updated_at: new Date()
      },
      include: {
        character: true,
        scenario: true
      }
    })

    // 清除缓存
    await this.invalidateCache(characterId, scenarioId)

    return this.transformAssociation(updated)
  }

  /**
   * 删除角色剧本关联
   */
  async removeCharacterScenarioAssociation(
    characterId: string,
    scenarioId: string,
    userId: string
  ): Promise<void> {
    logger.info(`Removing association between character ${characterId} and scenario ${scenarioId}`, { userId })

    // 验证关联存在且有权限
    const existing = await this.prisma.characterScenario.findFirst({
      where: {
        characterId,
        scenarioId,
        character: { userId }
      }
    })

    if (!existing) {
      throw new Error('Association not found or access denied')
    }

    // 删除关联和相关世界设定
    await Promise.all([
      this.prisma.characterScenario.delete({
        where: {
          characterId_scenarioId: {
            characterId,
            scenarioId
          }
        }
      }),
      this.prisma.characterWorldSetting.deleteMany({
        where: {
          characterId,
          scenarioId
        }
      })
    ])

    // 清除缓存
    await this.invalidateCache(characterId, scenarioId)
  }

  /**
   * 获取角色的世界设定
   */
  async getCharacterWorldSetting(
    characterId: string,
    scenarioId: string
  ): Promise<CharacterWorldSetting | null> {
    const setting = await this.prisma.characterWorldSetting.findUnique({
      where: {
        characterId_scenarioId: {
          characterId,
          scenarioId
        }
      }
    })

    return setting ? this.transformWorldSetting(setting) : null
  }

  /**
   * 创建或更新角色世界设定
   */
  async createOrUpdateCharacterWorldSetting(
    characterId: string,
    scenarioId: string,
    userId: string,
    data: Partial<CharacterWorldSetting>
  ): Promise<CharacterWorldSetting> {
    logger.info(`Creating/updating world setting for character ${characterId} in scenario ${scenarioId}`, { userId })

    // 验证权限
    const association = await this.prisma.characterScenario.findFirst({
      where: {
        characterId,
        scenarioId,
        character: { userId }
      }
    })

    if (!association) {
      throw new Error('Association not found or access denied')
    }

    const settingData = {
      characterId,
      scenarioId,
      background_override: data.backgroundOverride,
      relationships: JSON.stringify(data.relationships || {}),
      special_abilities: JSON.stringify(data.specialAbilities || []),
      restrictions: JSON.stringify(data.restrictions || []),
      starting_location_id: data.startingLocationId,
      starting_items: JSON.stringify(data.startingItems || []),
      reputation: JSON.stringify(data.reputation || {}),
      secrets_known: JSON.stringify(data.secretsKnown || []),
      is_active: data.isActive !== false,
      metadata: JSON.stringify(data.metadata || {})
    }

    const setting = await this.prisma.characterWorldSetting.upsert({
      where: {
        characterId_scenarioId: {
          characterId,
          scenarioId
        }
      },
      create: settingData,
      update: {
        ...settingData,
        updated_at: new Date()
      }
    })

    return this.transformWorldSetting(setting)
  }

  /**
   * 为角色推荐适合的剧本
   */
  async recommendScenariosForCharacter(
    characterId: string,
    userId: string,
    limit = 10
  ): Promise<ScenarioRecommendation[]> {
    logger.info(`Recommending scenarios for character ${characterId}`, { userId, limit })

    const character = await this.prisma.character.findFirst({
      where: { id: characterId, userId },
      include: {
        scenarios: {
          include: { scenario: true }
        }
      }
    })

    if (!character) {
      throw new Error('Character not found or access denied')
    }

    // 获取角色尚未关联的公开剧本
    const existingScenarioIds = character.scenarios.map(s => s.scenarioId)
    const availableScenarios = await this.prisma.scenario.findMany({
      where: {
        isPublic: true,
        isActive: true,
        id: { notIn: existingScenarioIds }
      },
      take: limit * 3 // 获取更多候选剧本用于推荐计算
    })

    // 计算匹配分数
    const recommendations = availableScenarios.map(scenario => {
      const matchScore = this.calculateScenarioMatchScore(character, scenario)
      const reasons = this.generateScenarioMatchReasons(character, scenario)
      const compatibility = this.calculateScenarioCompatibility(character, scenario)

      return {
        scenario: this.transformScenario(scenario),
        matchScore,
        reasons,
        compatibility
      }
    })

    // 按匹配分数排序并返回前limit个
    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
  }

  /**
   * 为剧本推荐适合的角色
   */
  async recommendCharactersForScenario(
    scenarioId: string,
    userId: string,
    limit = 10
  ): Promise<CharacterRecommendation[]> {
    logger.info(`Recommending characters for scenario ${scenarioId}`, { userId, limit })

    const scenario = await this.prisma.scenario.findFirst({
      where: { id: scenarioId, userId },
      include: {
        characters: {
          include: { character: true }
        }
      }
    })

    if (!scenario) {
      throw new Error('Scenario not found or access denied')
    }

    // 获取剧本尚未关联的公开角色
    const existingCharacterIds = scenario.characters.map(c => c.characterId)
    const availableCharacters = await this.prisma.character.findMany({
      where: {
        isPublic: true,
        isActive: true,
        id: { notIn: existingCharacterIds }
      },
      take: limit * 3
    })

    // 计算匹配分数
    const recommendations = availableCharacters.map(character => {
      const matchScore = this.calculateCharacterMatchScore(character, scenario)
      const reasons = this.generateCharacterMatchReasons(character, scenario)
      const suggestedRole = this.suggestCharacterRole(character, scenario)
      const compatibility = this.calculateCharacterCompatibility(character, scenario)

      return {
        character: this.transformCharacter(character),
        matchScore,
        reasons,
        suggestedRole,
        compatibility
      }
    })

    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
  }

  /**
   * 批量导入角色到剧本
   */
  async bulkImportCharactersToScenario(
    scenarioId: string,
    characterIds: string[],
    userId: string,
    options: {
      createWorldSettings?: boolean
      defaultSettings?: Record<string, any>
    } = {}
  ): Promise<CharacterScenarioAssociation[]> {
    logger.info(`Bulk importing characters to scenario ${scenarioId}`, { userId, count: characterIds.length })

    // 验证剧本权限
    const scenario = await this.prisma.scenario.findFirst({
      where: { id: scenarioId, userId }
    })

    if (!scenario) {
      throw new Error('Scenario not found or access denied')
    }

    // 验证角色权限
    const characters = await this.prisma.character.findMany({
      where: {
        id: { in: characterIds },
        userId
      }
    })

    if (characters.length !== characterIds.length) {
      throw new Error('Some characters not found or access denied')
    }

    // 批量创建关联
    const associations = await Promise.all(
      characterIds.map(characterId =>
        this.associateCharacterWithScenario(
          characterId,
          scenarioId,
          userId,
          {
            customSettings: options.defaultSettings,
            worldSetting: options.createWorldSettings ? {} : undefined
          }
        )
      )
    )

    return associations
  }

  /**
   * 私有方法：计算剧本匹配分数
   */
  private calculateScenarioMatchScore(character: any, scenario: any): number {
    let score = 0

    // 标签匹配
    const characterTags = JSON.parse(character.tags || '[]')
    const scenarioTags = JSON.parse(scenario.tags || '[]')
    const tagMatches = characterTags.filter((tag: string) => scenarioTags.includes(tag))
    score += tagMatches.length * 10

    // 类别匹配
    const characterCategory = character.category || ''
    const scenarioCategory = scenario.category || ''
    if (characterCategory === scenarioCategory) {
      score += 15
    }

    // 复杂度匹配（简化计算）
    const scenarioComplexity = scenario.complexity_level || 1
    const characterComplexity = this.estimateCharacterComplexity(character)
    const complexityDiff = Math.abs(scenarioComplexity - characterComplexity)
    score += Math.max(0, 10 - complexityDiff * 2)

    // 背景设定匹配
    if (this.checkBackgroundCompatibility(character, scenario)) {
      score += 20
    }

    return Math.min(100, score)
  }

  /**
   * 私有方法：计算角色匹配分数
   */
  private calculateCharacterMatchScore(character: any, scenario: any): number {
    return this.calculateScenarioMatchScore(character, scenario)
  }

  /**
   * 私有方法：生成剧本匹配原因
   */
  private generateScenarioMatchReasons(character: any, scenario: any): string[] {
    const reasons: string[] = []

    const characterTags = JSON.parse(character.tags || '[]')
    const scenarioTags = JSON.parse(scenario.tags || '[]')
    const tagMatches = characterTags.filter((tag: string) => scenarioTags.includes(tag))

    if (tagMatches.length > 0) {
      reasons.push(`共同标签：${tagMatches.join(', ')}`)
    }

    if (character.category === scenario.category) {
      reasons.push(`类别匹配：${scenario.category}`)
    }

    if (this.checkBackgroundCompatibility(character, scenario)) {
      reasons.push('背景设定兼容')
    }

    return reasons
  }

  /**
   * 私有方法：生成角色匹配原因
   */
  private generateCharacterMatchReasons(character: any, scenario: any): string[] {
    return this.generateScenarioMatchReasons(character, scenario)
  }

  /**
   * 私有方法：建议角色职能
   */
  private suggestCharacterRole(character: any, scenario: any): string {
    const characterTags = JSON.parse(character.tags || '[]')
    const scenarioCategory = scenario.category || ''

    // 基于标签和类别推测角色职能
    if (characterTags.includes('领导者') || characterTags.includes('英雄')) {
      return '主角'
    } else if (characterTags.includes('导师') || characterTags.includes('智者')) {
      return '指导者'
    } else if (characterTags.includes('反派') || characterTags.includes('敌对')) {
      return '对手'
    } else {
      return '配角'
    }
  }

  /**
   * 私有方法：计算剧本兼容性
   */
  private calculateScenarioCompatibility(character: any, scenario: any): any {
    const thematic = this.calculateThematicCompatibility(character, scenario)
    const genre = this.calculateGenreCompatibility(character, scenario)
    const complexity = this.calculateComplexityCompatibility(character, scenario)
    const overall = (thematic + genre + complexity) / 3

    return { thematic, genre, complexity, overall }
  }

  /**
   * 私有方法：计算角色兼容性
   */
  private calculateCharacterCompatibility(character: any, scenario: any): any {
    const personality = this.calculatePersonalityCompatibility(character, scenario)
    const background = this.calculateBackgroundCompatibility(character, scenario)
    const abilities = this.calculateAbilitiesCompatibility(character, scenario)
    const overall = (personality + background + abilities) / 3

    return { personality, background, abilities, overall }
  }

  /**
   * 私有方法：估算角色复杂度
   */
  private estimateCharacterComplexity(character: any): number {
    let complexity = 1

    if (character.personality && character.personality.length > 100) complexity++
    if (character.background && character.background.length > 200) complexity++

    const tags = JSON.parse(character.tags || '[]')
    if (tags.length > 5) complexity++

    return Math.min(5, complexity)
  }

  /**
   * 私有方法：检查背景兼容性
   */
  private checkBackgroundCompatibility(character: any, scenario: any): boolean {
    // 简化的兼容性检查
    const characterBg = (character.background || '').toLowerCase()
    const scenarioDesc = (scenario.description || '').toLowerCase()

    const commonThemes = ['魔法', '科幻', '现代', '古代', '奇幻', '武侠', '校园']

    return commonThemes.some(theme =>
      characterBg.includes(theme) && scenarioDesc.includes(theme)
    )
  }

  /**
   * 私有方法：计算主题兼容性
   */
  private calculateThematicCompatibility(character: any, scenario: any): number {
    // 简化实现，实际应该使用更复杂的语义分析
    return Math.random() * 100 // 暂时返回随机值
  }

  /**
   * 私有方法：计算类型兼容性
   */
  private calculateGenreCompatibility(character: any, scenario: any): number {
    return character.category === scenario.category ? 100 : 50
  }

  /**
   * 私有方法：计算复杂度兼容性
   */
  private calculateComplexityCompatibility(character: any, scenario: any): number {
    const charComplexity = this.estimateCharacterComplexity(character)
    const scenarioComplexity = scenario.complexity_level || 1
    const diff = Math.abs(charComplexity - scenarioComplexity)
    return Math.max(0, 100 - diff * 20)
  }

  /**
   * 私有方法：计算性格兼容性
   */
  private calculatePersonalityCompatibility(character: any, scenario: any): number {
    // 简化实现
    return Math.random() * 100
  }

  /**
   * 私有方法：计算背景兼容性
   */
  private calculateBackgroundCompatibility(character: any, scenario: any): number {
    return this.checkBackgroundCompatibility(character, scenario) ? 100 : 50
  }

  /**
   * 私有方法：计算能力兼容性
   */
  private calculateAbilitiesCompatibility(character: any, scenario: any): number {
    // 简化实现
    return Math.random() * 100
  }

  /**
   * 私有方法：转换关联数据
   */
  private transformAssociation(assoc: any): CharacterScenarioAssociation {
    return {
      id: assoc.id,
      characterId: assoc.character_id,
      scenarioId: assoc.scenario_id,
      isDefault: assoc.isDefault,
      isActive: assoc.isActive,
      customSettings: JSON.parse(assoc.custom_settings || '{}'),
      character: assoc.character ? this.transformCharacter(assoc.character) : undefined,
      scenario: assoc.scenario ? this.transformScenario(assoc.scenario) : undefined,
      createdAt: assoc.created_at,
      updatedAt: assoc.updated_at
    }
  }

  /**
   * 私有方法：转换世界设定数据
   */
  private transformWorldSetting(setting: any): CharacterWorldSetting {
    return {
      id: setting.id,
      characterId: setting.character_id,
      scenarioId: setting.scenario_id,
      backgroundOverride: setting.background_override,
      relationships: JSON.parse(setting.relationships || '{}'),
      specialAbilities: JSON.parse(setting.special_abilities || '[]'),
      restrictions: JSON.parse(setting.restrictions || '[]'),
      startingLocationId: setting.starting_location_id,
      startingItems: JSON.parse(setting.starting_items || '[]'),
      reputation: JSON.parse(setting.reputation || '{}'),
      secretsKnown: JSON.parse(setting.secrets_known || '[]'),
      personalGoals: JSON.parse(setting.personal_goals || '[]'),
      isActive: setting.is_active,
      metadata: JSON.parse(setting.metadata || '{}'),
      createdAt: setting.created_at,
      updatedAt: setting.updated_at
    }
  }

  /**
   * 私有方法：转换角色数据
   */
  private transformCharacter(character: any): Character {
    return {
      id: character.id,
      name: character.name,
      description: character.description,
      avatar: character.avatar,
      personality: character.personality,
      background: character.background,
      tags: JSON.parse(character.tags || '[]'),
      isPublic: character.isPublic,
      createdAt: character.created_at,
      updatedAt: character.updated_at
    }
  }

  /**
   * 私有方法：转换剧本数据
   */
  private transformScenario(scenario: any): Scenario {
    return {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      category: scenario.category,
      tags: JSON.parse(scenario.tags || '[]'),
      isPublic: scenario.isPublic,
      createdAt: scenario.created_at,
      updatedAt: scenario.updated_at
    }
  }

  /**
   * 私有方法：清除缓存
   */
  private async invalidateCache(characterId: string, scenarioId: string): Promise<void> {
    const keys = [
      `character_scenarios:${characterId}:true`,
      `character_scenarios:${characterId}:false`,
      `scenario_characters:${scenarioId}:true`,
      `scenario_characters:${scenarioId}:false`
    ]

    await Promise.all(keys.map(key => this.cache.delete(key)))
  }
}

export default CharacterScenarioService
