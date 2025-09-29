import { prisma } from '../lib/prisma'

// 时空酒馆服务类
export class SpacetimeTavernService {

  // 获取角色的MBTI信息
  static async getCharacterMbti(characterId: string) {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: {
        mbtiType: true,
        mbtiDescription: true,
        mbtiTraits: true,
        mbtiCompatibility: true,
        mbtiWeaknesses: true
      }
    })
    return character
  }

  // 更新角色的MBTI信息
  static async updateCharacterMbti(characterId: string, mbtiData: {
    mbtiType?: string
    mbtiDescription?: string
    mbtiTraits?: string[]
    mbtiCompatibility?: string[]
    mbtiWeaknesses?: string[]
  }) {
    const updateData: any = {}
    if (mbtiData.mbtiType !== undefined) updateData.mbtiType = mbtiData.mbtiType
    if (mbtiData.mbtiDescription !== undefined) updateData.mbtiDescription = mbtiData.mbtiDescription
    if (mbtiData.mbtiTraits !== undefined) updateData.mbtiTraits = JSON.stringify(mbtiData.mbtiTraits)
    if (mbtiData.mbtiCompatibility !== undefined) updateData.mbtiCompatibility = JSON.stringify(mbtiData.mbtiCompatibility)
    if (mbtiData.mbtiWeaknesses !== undefined) updateData.mbtiWeaknesses = JSON.stringify(mbtiData.mbtiWeaknesses)

    const character = await prisma.character.update({
      where: { id: characterId },
      data: updateData,
      select: {
        id: true,
        mbtiType: true,
        mbtiDescription: true,
        mbtiTraits: true,
        mbtiCompatibility: true,
        mbtiWeaknesses: true
      }
    })
    return character
  }

  // 获取角色的关联网络
  static async getCharacterRelations(characterId: string) {
    const outgoingRelations = await prisma.characterRelation.findMany({
      where: {
        fromCharacterId: characterId,
        isActive: true
      },
      include: {
        toCharacter: {
          select: {
            id: true,
            name: true,
            avatar: true,
            mbtiType: true
          }
        }
      }
    })

    const incomingRelations = await prisma.characterRelation.findMany({
      where: {
        toCharacterId: characterId,
        isActive: true
      },
      include: {
        fromCharacter: {
          select: {
            id: true,
            name: true,
            avatar: true,
            mbtiType: true
          }
        }
      }
    })

    return {
      outgoing: outgoingRelations,
      incoming: incomingRelations
    }
  }

  // 创建角色关联
  static async createCharacterRelation(fromCharacterId: string, toCharacterId: string, relationData: {
    relationType: string
    description: string
    interactionTriggers?: string[]
    compatibilityScore?: number
    importance?: number
  }) {
    const relation = await prisma.characterRelation.create({
      data: {
        fromCharacterId,
        toCharacterId,
        relationType: relationData.relationType,
        description: relationData.description,
        interactionTriggers: JSON.stringify(relationData.interactionTriggers || []),
        compatibilityScore: relationData.compatibilityScore,
        importance: relationData.importance || 1
      },
      include: {
        fromCharacter: { select: { name: true } },
        toCharacter: { select: { name: true } }
      }
    })
    return relation
  }

  // 更新剧本的时空酒馆设置
  static async updateScenarioSpacetimeHub(scenarioId: string, spacetimeData: {
    spacetimeHubEnabled?: boolean
    spacetimeAttributes?: string[]
    spacetimeLayout?: string
    fusionMechanisms?: string
    plotPhases?: string
  }) {
    const updateData: any = {}
    if (spacetimeData.spacetimeHubEnabled !== undefined) updateData.spacetimeHubEnabled = spacetimeData.spacetimeHubEnabled
    if (spacetimeData.spacetimeAttributes !== undefined) updateData.spacetimeAttributes = JSON.stringify(spacetimeData.spacetimeAttributes)
    if (spacetimeData.spacetimeLayout !== undefined) updateData.spacetimeLayout = spacetimeData.spacetimeLayout
    if (spacetimeData.fusionMechanisms !== undefined) updateData.fusionMechanisms = spacetimeData.fusionMechanisms
    if (spacetimeData.plotPhases !== undefined) updateData.plotPhases = spacetimeData.plotPhases

    const scenario = await prisma.scenario.update({
      where: { id: scenarioId },
      data: updateData,
      select: {
        id: true,
        spacetimeHubEnabled: true,
        spacetimeAttributes: true,
        spacetimeLayout: true,
        fusionMechanisms: true,
        plotPhases: true
      }
    })
    return scenario
  }

  // 更新WorldInfo条目的时空属性
  static async updateWorldInfoSpacetime(worldInfoId: string, spacetimeData: {
    spacetimeAttributes?: string[]
    relationTriggers?: any[]
    culturalContext?: any
    plotPhases?: any[]
    dynamicWeight?: any
  }) {
    const updateData: any = {}
    if (spacetimeData.spacetimeAttributes !== undefined) updateData.spacetimeAttributes = JSON.stringify(spacetimeData.spacetimeAttributes)
    if (spacetimeData.relationTriggers !== undefined) updateData.relationTriggers = JSON.stringify(spacetimeData.relationTriggers)
    if (spacetimeData.culturalContext !== undefined) updateData.culturalContext = JSON.stringify(spacetimeData.culturalContext)
    if (spacetimeData.plotPhases !== undefined) updateData.plotPhases = JSON.stringify(spacetimeData.plotPhases)
    if (spacetimeData.dynamicWeight !== undefined) updateData.dynamicWeight = JSON.stringify(spacetimeData.dynamicWeight)

    const worldInfo = await prisma.worldInfoEntry.update({
      where: { id: worldInfoId },
      data: updateData,
      select: {
        id: true,
        spacetimeAttributes: true,
        relationTriggers: true,
        culturalContext: true,
        plotPhases: true,
        dynamicWeight: true
      }
    })
    return worldInfo
  }

  // 记录时空事件到消息
  static async addSpacetimeEventToMessage(messageId: string, spacetimeEvent: {
    type: string
    title: string
    description: string
    effects?: string[]
    triggeredBy?: string
  }) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { spacetimeEvents: true }
    })

    const currentEvents = message?.spacetimeEvents ? JSON.parse(message.spacetimeEvents) : []
    const newEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...spacetimeEvent,
      timestamp: new Date().toISOString()
    }

    const updatedEvents = [...currentEvents, newEvent]

    await prisma.message.update({
      where: { id: messageId },
      data: {
        spacetimeEvents: JSON.stringify(updatedEvents)
      }
    })

    return newEvent
  }

  // 记录关系触发到消息
  static async addRelationTriggerToMessage(messageId: string, relationTrigger: {
    characterId: string
    characterName: string
    relationType: string
    description: string
    compatibilityScore?: number
  }) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { relationTriggers: true }
    })

    const currentTriggers = message?.relationTriggers ? JSON.parse(message.relationTriggers) : []
    const newTrigger = {
      id: `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...relationTrigger,
      timestamp: new Date().toISOString()
    }

    const updatedTriggers = [...currentTriggers, newTrigger]

    await prisma.message.update({
      where: { id: messageId },
      data: {
        relationTriggers: JSON.stringify(updatedTriggers)
      }
    })

    return newTrigger
  }

  // 计算MBTI兼容性
  static calculateMbtiCompatibility(type1: string, type2: string): number {
    // 简化的MBTI兼容性计算逻辑
    // 在实际实现中可以使用更复杂的算法
    const compatibilityMatrix: Record<string, Record<string, number>> = {
      'INTJ': { 'ENFP': 0.9, 'ENTP': 0.8, 'INFJ': 0.7, 'INTP': 0.6 },
      'ENFP': { 'INTJ': 0.9, 'INFJ': 0.8, 'ENFJ': 0.7, 'INFP': 0.6 },
      // 可以扩展更多类型
    }

    return compatibilityMatrix[type1]?.[type2] || 0.5
  }
}
