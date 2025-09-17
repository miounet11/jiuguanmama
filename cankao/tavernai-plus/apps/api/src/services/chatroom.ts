import { PrismaClient } from '@prisma/client'
import { logger } from './logger'
import { aiService } from './ai'
import { CharacterAIService } from './character-ai'

const prisma = new PrismaClient()

export interface CreateChatRoomData {
  name: string
  description?: string
  ownerId: string
  maxParticipants?: number
  isPrivate?: boolean
  allowSpectators?: boolean
  roomType?: string
  settings?: any
}

export interface JoinRoomData {
  roomId: string
  userId?: string
  characterId?: string
  role?: string
}

export interface SendMessageData {
  roomId: string
  senderId?: string
  characterId?: string
  content: string
  messageType?: string
  replyToId?: string
}

export interface SummonCharacterData {
  roomId: string
  characterId: string
  userId: string
  customPrompt?: string
}

/**
 * 多角色聊天室服务
 */
export class ChatRoomService {

  /**
   * 创建聊天室
   */
  static async createRoom(data: CreateChatRoomData) {
    try {
      const room = await prisma.chatRoom.create({
        data: {
          name: data.name,
          description: data.description,
          ownerId: data.ownerId,
          maxParticipants: data.maxParticipants || 10,
          isPrivate: data.isPrivate || false,
          allowSpectators: data.allowSpectators || true,
          roomType: data.roomType || 'multichar',
          settings: data.settings || {}
        },
        include: {
          owner: {
            select: { id: true, username: true, avatar: true }
          },
          participants: {
            include: {
              user: { select: { id: true, username: true, avatar: true } },
              character: { select: { id: true, name: true, avatar: true } }
            }
          }
        }
      })

      // 自动将房主加入为管理员
      await this.joinRoom({
        roomId: room.id,
        userId: data.ownerId,
        role: 'owner'
      })

      logger.info('Chat room created', { roomId: room.id, name: data.name, ownerId: data.ownerId })
      return room

    } catch (error) {
      logger.error('Failed to create chat room', { error, data })
      throw new Error('创建聊天室失败')
    }
  }

  /**
   * 加入聊天室
   */
  static async joinRoom(data: JoinRoomData) {
    try {
      const room = await prisma.chatRoom.findUnique({
        where: { id: data.roomId },
        include: {
          participants: true
        }
      })

      if (!room) {
        throw new Error('聊天室不存在')
      }

      if (!room.isActive) {
        throw new Error('聊天室已关闭')
      }

      // 检查参与者数量限制
      const activeParticipants = room.participants.filter(p => p.isActive).length
      if (activeParticipants >= room.maxParticipants) {
        throw new Error('聊天室已满')
      }

      // 检查用户或角色是否已在房间中
      const existing = room.participants.find(p =>
        (data.userId && p.userId === data.userId) ||
        (data.characterId && p.characterId === data.characterId)
      )

      if (existing) {
        if (existing.isActive) {
          throw new Error('已在聊天室中')
        } else {
          // 重新激活参与者
          const participant = await prisma.chatParticipant.update({
            where: { id: existing.id },
            data: {
              isActive: true,
              joinedAt: new Date(),
              lastSeenAt: new Date()
            },
            include: {
              user: { select: { id: true, username: true, avatar: true } },
              character: { select: { id: true, name: true, avatar: true } }
            }
          })
          return participant
        }
      }

      // 创建新参与者
      const participant = await prisma.chatParticipant.create({
        data: {
          roomId: data.roomId,
          userId: data.userId,
          characterId: data.characterId,
          role: data.role || 'member',
          permissions: JSON.stringify({})
        },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          character: { select: { id: true, name: true, avatar: true } }
        }
      })

      logger.info('User joined chat room', {
        roomId: data.roomId,
        userId: data.userId,
        characterId: data.characterId
      })

      return participant

    } catch (error) {
      logger.error('Failed to join chat room', { error, data })
      throw error
    }
  }

  /**
   * 离开聊天室
   */
  static async leaveRoom(roomId: string, userId?: string, characterId?: string) {
    try {
      const participant = await prisma.chatParticipant.findFirst({
        where: {
          roomId,
          OR: [
            { userId },
            { characterId }
          ]
        }
      })

      if (participant) {
        await prisma.chatParticipant.update({
          where: { id: participant.id },
          data: { isActive: false }
        })

        logger.info('User left chat room', { roomId, userId, characterId })
      }

    } catch (error) {
      logger.error('Failed to leave chat room', { error, roomId, userId, characterId })
      throw new Error('离开聊天室失败')
    }
  }

  /**
   * 发送消息
   */
  static async sendMessage(data: SendMessageData) {
    try {
      // 验证参与者权限
      if (data.senderId) {
        const participant = await prisma.chatParticipant.findFirst({
          where: {
            roomId: data.roomId,
            userId: data.senderId,
            isActive: true
          }
        })

        if (!participant) {
          throw new Error('未加入聊天室或无权限')
        }

        if (participant.isMuted) {
          throw new Error('已被禁言')
        }
      }

      // 创建消息
      const message = await prisma.chatMessage.create({
        data: {
          roomId: data.roomId,
          senderId: data.senderId,
          characterId: data.characterId,
          content: data.content,
          messageType: data.messageType || 'text',
          replyToId: data.replyToId,
          tokens: this.estimateTokens(data.content)
        },
        include: {
          sender: { select: { id: true, username: true, avatar: true } },
          character: { select: { id: true, name: true, avatar: true } },
          replyTo: {
            include: {
              sender: { select: { id: true, username: true, avatar: true } },
              character: { select: { id: true, name: true, avatar: true } }
            }
          }
        }
      })

      // 更新房间最后消息时间和计数
      await prisma.chatRoom.update({
        where: { id: data.roomId },
        data: {
          lastMessageAt: new Date(),
          messageCount: { increment: 1 },
          totalTokens: { increment: message.tokens }
        }
      })

      // 更新参与者最后查看时间
      if (data.senderId) {
        await prisma.chatParticipant.updateMany({
          where: {
            roomId: data.roomId,
            userId: data.senderId
          },
          data: { lastSeenAt: new Date() }
        })
      }

      logger.info('Message sent to chat room', {
        roomId: data.roomId,
        messageId: message.id,
        senderId: data.senderId,
        characterId: data.characterId
      })

      return message

    } catch (error) {
      logger.error('Failed to send message', { error, data })
      throw error
    }
  }

  /**
   * 召唤AI角色到聊天室
   */
  static async summonCharacter(data: SummonCharacterData) {
    try {
      // 验证用户权限
      const participant = await prisma.chatParticipant.findFirst({
        where: {
          roomId: data.roomId,
          userId: data.userId,
          isActive: true
        }
      })

      if (!participant) {
        throw new Error('未加入聊天室')
      }

      if (!['owner', 'admin', 'member'].includes(participant.role)) {
        throw new Error('无权限召唤角色')
      }

      // 获取角色信息
      const character = await prisma.character.findUnique({
        where: { id: data.characterId },
        select: {
          id: true,
          name: true,
          avatar: true,
          personality: true,
          systemPrompt: true,
          isPublic: true,
          creatorId: true
        }
      })

      if (!character) {
        throw new Error('角色不存在')
      }

      // 检查权限（公开角色或自己创建的角色）
      if (!character.isPublic && character.creatorId !== data.userId) {
        throw new Error('无权限使用该角色')
      }

      // 将角色加入聊天室
      const charParticipant = await this.joinRoom({
        roomId: data.roomId,
        characterId: data.characterId,
        role: 'member'
      })

      // 发送系统消息通知角色加入
      const joinMessage = await this.sendMessage({
        roomId: data.roomId,
        characterId: data.characterId,
        content: `*${character.name} 加入了聊天*`,
        messageType: 'system'
      })

      // 如果有自定义提示词，让角色发送初始消息
      if (data.customPrompt) {
        await this.generateCharacterResponse(data.roomId, data.characterId, data.userId, data.customPrompt)
      }

      logger.info('Character summoned to chat room', {
        roomId: data.roomId,
        characterId: data.characterId,
        userId: data.userId
      })

      return {
        participant: charParticipant,
        joinMessage,
        character
      }

    } catch (error) {
      logger.error('Failed to summon character', { error, data })
      throw error
    }
  }

  /**
   * 生成AI角色回复
   */
  static async generateCharacterResponse(roomId: string, characterId: string, userId: string, trigger?: string) {
    try {
      // 获取最近的聊天历史
      const recentMessages = await prisma.chatMessage.findMany({
        where: {
          roomId,
          isDeleted: false
        },
        include: {
          sender: { select: { username: true } },
          character: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 15
      })

      // 构建上下文消息
      const contextMessages = recentMessages.reverse().map(msg => ({
        role: (msg.characterId ? 'assistant' : 'user') as 'assistant' | 'user',
        content: `${msg.sender?.username || msg.character?.name || 'Unknown'}: ${msg.content}`,
        characterId: msg.characterId || undefined,
        timestamp: msg.createdAt
      }))

      // 使用增强的AI角色服务生成回复
      const aiResponse = await CharacterAIService.generateCharacterResponse({
        characterId,
        userId,
        roomId,
        messages: contextMessages,
        trigger,
        contextLength: 15
      })

      if (aiResponse) {
        // 发送AI回复
        const message = await this.sendMessage({
          roomId,
          characterId,
          content: aiResponse,
          messageType: 'text'
        })

        return message
      }

      throw new Error('AI生成回复失败')

    } catch (error) {
      logger.error('Failed to generate character response', { error, roomId, characterId })
      throw error
    }
  }

  /**
   * 获取聊天室列表
   */
  static async getRooms(userId: string, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit

      const rooms = await prisma.chatRoom.findMany({
        where: {
          OR: [
            { isPrivate: false },
            { ownerId: userId },
            {
              participants: {
                some: {
                  userId,
                  isActive: true
                }
              }
            }
          ],
          isActive: true
        },
        include: {
          owner: { select: { id: true, username: true, avatar: true } },
          participants: {
            where: { isActive: true },
            include: {
              user: { select: { id: true, username: true, avatar: true } },
              character: { select: { id: true, name: true, avatar: true } }
            }
          },
          _count: {
            select: { messages: true }
          }
        },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit
      })

      return rooms

    } catch (error) {
      logger.error('Failed to get chat rooms', { error, userId })
      throw new Error('获取聊天室列表失败')
    }
  }

  /**
   * 获取聊天室详情
   */
  static async getRoomDetails(roomId: string, userId: string) {
    try {
      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId },
        include: {
          owner: { select: { id: true, username: true, avatar: true } },
          participants: {
            where: { isActive: true },
            include: {
              user: { select: { id: true, username: true, avatar: true } },
              character: { select: { id: true, name: true, avatar: true, personality: true } }
            }
          }
        }
      })

      if (!room) {
        throw new Error('聊天室不存在')
      }

      // 检查访问权限
      const hasAccess = !room.isPrivate ||
        room.ownerId === userId ||
        room.participants.some(p => p.userId === userId)

      if (!hasAccess) {
        throw new Error('无权限访问该聊天室')
      }

      return room

    } catch (error) {
      logger.error('Failed to get room details', { error, roomId, userId })
      throw error
    }
  }

  /**
   * 获取聊天消息
   */
  static async getMessages(roomId: string, userId: string, page = 1, limit = 50) {
    try {
      // 验证用户权限
      const room = await this.getRoomDetails(roomId, userId)

      const skip = (page - 1) * limit

      const messages = await prisma.chatMessage.findMany({
        where: {
          roomId,
          isDeleted: false
        },
        include: {
          sender: { select: { id: true, username: true, avatar: true } },
          character: { select: { id: true, name: true, avatar: true } },
          replyTo: {
            include: {
              sender: { select: { id: true, username: true, avatar: true } },
              character: { select: { id: true, name: true, avatar: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })

      return messages.reverse()

    } catch (error) {
      logger.error('Failed to get messages', { error, roomId, userId })
      throw error
    }
  }

  /**
   * 估算token数量
   */
  private static estimateTokens(text: string): number {
    // 简单的token估算：中文字符约1.5个token，英文单词约1个token
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    const others = text.length - chineseChars - englishWords

    return Math.ceil(chineseChars * 1.5 + englishWords + others * 0.5)
  }
}

export default ChatRoomService
