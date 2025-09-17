import { prisma } from '../server'

export interface SummonOptions {
  sessionId: string
  characterId: string
  summonType: 'join' | 'replace' | 'temporary'
  context?: {
    reason?: string           // 召唤原因
    introduction?: string     // 角色介绍方式
    relationship?: string     // 与现有角色的关系
    duration?: number        // 临时召唤的消息数
  }
}

export interface MultiCharacterSession {
  sessionId: string
  mainCharacterId: string
  activeCharacters: Array<{
    characterId: string
    joinedAt: Date
    isActive: boolean
    lastMessageAt?: Date
    messageCount: number
    role: 'main' | 'supporting' | 'guest'
  }>
}

class SummonService {
  /**
   * 召唤新角色加入对话
   */
  async summonCharacter(options: SummonOptions) {
    const { sessionId, characterId, summonType, context } = options

    // 获取会话信息
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        character: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!session) {
      throw new Error('会话不存在')
    }

    // 获取要召唤的角色
    const summonedCharacter = await prisma.character.findUnique({
      where: { id: characterId }
    })

    if (!summonedCharacter) {
      throw new Error('角色不存在')
    }

    // 构建召唤消息
    const summonMessage = this.buildSummonMessage(
      summonedCharacter,
      session.character,
      context
    )

    // 根据召唤类型处理
    switch (summonType) {
      case 'join':
        return this.handleJoinSummon(session, summonedCharacter, summonMessage)

      case 'replace':
        return this.handleReplaceSummon(session, summonedCharacter, summonMessage)

      case 'temporary':
        return this.handleTemporarySummon(session, summonedCharacter, summonMessage, context?.duration)

      default:
        throw new Error('未知的召唤类型')
    }
  }

  /**
   * 构建召唤消息
   */
  private buildSummonMessage(
    summonedCharacter: any,
    currentCharacter: any,
    context?: SummonOptions['context']
  ): string {
    let message = ''

    // 添加召唤原因
    if (context?.reason) {
      message += `[${context.reason}]\n\n`
    }

    // 默认介绍
    if (context?.introduction) {
      message += context.introduction
    } else {
      message += `*${summonedCharacter.name}加入了对话*\n\n`

      if (summonedCharacter.description) {
        message += `${summonedCharacter.name}：${summonedCharacter.firstMessage || '大家好！'}`
      }
    }

    // 添加关系说明
    if (context?.relationship) {
      message += `\n\n（${summonedCharacter.name}是${currentCharacter.name}的${context.relationship}）`
    }

    return message
  }

  /**
   * 处理加入型召唤（多角色同时在场）
   */
  private async handleJoinSummon(
    session: any,
    summonedCharacter: any,
    summonMessage: string
  ) {
    // 创建系统消息记录召唤
    const systemMessage = await prisma.message.create({
      data: {
        sessionId: session.id,
        role: 'system',
        content: summonMessage,
        metadata: JSON.stringify({
          type: 'character_summoned',
          characterId: summonedCharacter.id,
          characterName: summonedCharacter.name
        })
      }
    })

    // 更新会话元数据，记录多角色状态
    const metadata = JSON.parse(session.metadata || '{}')
    if (!metadata.activeCharacters) {
      metadata.activeCharacters = [
        {
          id: session.characterId,
          name: session.character.name,
          role: 'main',
          joinedAt: session.createdAt
        }
      ]
    }

    metadata.activeCharacters.push({
      id: summonedCharacter.id,
      name: summonedCharacter.name,
      role: 'supporting',
      joinedAt: new Date()
    })

    await prisma.chatSession.update({
      where: { id: session.id },
      data: {
        metadata: JSON.stringify(metadata)
      }
    })

    // 生成召唤角色的开场白
    const introMessage = await prisma.message.create({
      data: {
        sessionId: session.id,
        characterId: summonedCharacter.id,
        role: 'assistant',
        content: summonedCharacter.firstMessage || `你好，我是${summonedCharacter.name}。很高兴加入你们的对话！`
      }
    })

    return {
      success: true,
      systemMessage,
      introMessage,
      activeCharacters: metadata.activeCharacters
    }
  }

  /**
   * 处理替换型召唤（切换当前对话角色）
   */
  private async handleReplaceSummon(
    session: any,
    summonedCharacter: any,
    summonMessage: string
  ) {
    // 记录角色离开
    const farewellMessage = await prisma.message.create({
      data: {
        sessionId: session.id,
        characterId: session.characterId,
        role: 'assistant',
        content: `我要先离开一下，让${summonedCharacter.name}来陪你聊天。`,
        metadata: JSON.stringify({
          type: 'character_leaving',
          characterName: session.character.name
        })
      }
    })

    // 更新会话的当前角色
    await prisma.chatSession.update({
      where: { id: session.id },
      data: {
        characterId: summonedCharacter.id
      }
    })

    // 记录新角色加入
    const joinMessage = await prisma.message.create({
      data: {
        sessionId: session.id,
        characterId: summonedCharacter.id,
        role: 'assistant',
        content: summonedCharacter.firstMessage || summonMessage
      }
    })

    return {
      success: true,
      farewellMessage,
      joinMessage,
      currentCharacter: summonedCharacter
    }
  }

  /**
   * 处理临时召唤（角色短暂出现）
   */
  private async handleTemporarySummon(
    session: any,
    summonedCharacter: any,
    summonMessage: string,
    duration: number = 5
  ) {
    // 记录临时召唤
    const metadata = JSON.parse(session.metadata || '{}')
    metadata.temporarySummon = {
      characterId: summonedCharacter.id,
      characterName: summonedCharacter.name,
      remainingMessages: duration,
      summonedAt: new Date()
    }

    await prisma.chatSession.update({
      where: { id: session.id },
      data: {
        metadata: JSON.stringify(metadata)
      }
    })

    // 创建临时角色的消息
    const tempMessage = await prisma.message.create({
      data: {
        sessionId: session.id,
        characterId: summonedCharacter.id,
        role: 'assistant',
        content: summonMessage || `[${summonedCharacter.name}短暂出现] ${summonedCharacter.firstMessage}`,
        metadata: JSON.stringify({
          type: 'temporary_summon',
          duration
        })
      }
    })

    return {
      success: true,
      tempMessage,
      duration,
      character: summonedCharacter
    }
  }

  /**
   * 获取可召唤的角色列表
   */
  async getSummonableCharacters(
    sessionId: string,
    userId: string
  ) {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId }
    })

    if (!session) {
      throw new Error('会话不存在')
    }

    // 获取用户的所有角色和公开角色
    const characters = await prisma.character.findMany({
      where: {
        AND: [
          { id: { not: session.characterId } }, // 排除当前角色
          {
            OR: [
              { creatorId: userId },
              { isPublic: true }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        category: true,
        tags: true
      },
      orderBy: [
        { favoriteCount: 'desc' },
        { rating: 'desc' }
      ],
      take: 50
    })

    return characters
  }

  /**
   * 管理多角色对话流程
   */
  async manageMultiCharacterFlow(
    sessionId: string,
    activeCharacters: string[]
  ) {
    // 实现多角色轮流发言的逻辑
    const turnOrder = this.calculateTurnOrder(activeCharacters)

    return {
      nextSpeaker: turnOrder[0],
      turnOrder,
      suggestion: '可以让角色们进行互动对话'
    }
  }

  /**
   * 计算发言顺序
   */
  private calculateTurnOrder(characterIds: string[]): string[] {
    // 简单的轮流机制，后续可以加入更智能的算法
    return [...characterIds].sort(() => Math.random() - 0.5)
  }

  /**
   * 自动召唤建议
   */
  async getAutoSummonSuggestions(
    sessionId: string,
    context: string
  ): Promise<Array<{ characterId: string; reason: string }>> {
    // TODO: 基于上下文智能推荐可以召唤的角色
    // 例如：谈到美食时推荐厨师角色，谈到冒险时推荐战士角色

    const suggestions = []

    // 简单的关键词匹配
    if (context.includes('美食') || context.includes('cooking')) {
      suggestions.push({
        characterId: 'chef-character-id',
        reason: '谈到美食，也许需要一位专业厨师的建议'
      })
    }

    if (context.includes('冒险') || context.includes('adventure')) {
      suggestions.push({
        characterId: 'adventurer-character-id',
        reason: '开始冒险了，需要一位经验丰富的冒险者'
      })
    }

    return suggestions
  }
}

export const summonService = new SummonService()
