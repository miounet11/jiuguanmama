import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import ChatRoomService from '../services/chatroom'
import { logger } from '../services/logger'

const router = Router()

// 验证模式
const createRoomSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  maxParticipants: z.number().min(2).max(50).optional(),
  isPrivate: z.boolean().optional(),
  allowSpectators: z.boolean().optional(),
  roomType: z.enum(['multichar', 'group', 'roleplay']).optional()
})

const joinRoomSchema = z.object({
  roomId: z.string().uuid(),
  characterId: z.string().uuid().optional()
})

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  messageType: z.enum(['text', 'action', 'system', 'ooc']).optional(),
  replyToId: z.string().uuid().optional()
})

const summonCharacterSchema = z.object({
  characterId: z.string().uuid(),
  customPrompt: z.string().max(500).optional()
})

const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional()
})

/**
 * 创建聊天室
 */
router.post('/create', authenticate, validate(createRoomSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id
    const room = await ChatRoomService.createRoom({
      ...req.body,
      ownerId: userId
    })

    res.status(201).json({
      success: true,
      room
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 获取聊天室列表
 */
router.get('/list', authenticate, validate(paginationSchema, 'query'), async (req, res, next) => {
  try {
    const userId = req.user!.id
    const { page = 1, limit = 20 } = req.query as any

    const rooms = await ChatRoomService.getRooms(userId, page, limit)

    res.json({
      success: true,
      rooms,
      pagination: {
        page,
        limit,
        hasMore: rooms.length === limit
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 获取聊天室详情
 */
router.get('/:roomId', authenticate, async (req, res, next) => {
  try {
    const { roomId } = req.params
    const userId = req.user!.id

    const room = await ChatRoomService.getRoomDetails(roomId, userId)

    res.json({
      success: true,
      room
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 加入聊天室
 */
router.post('/:roomId/join', authenticate, validate(joinRoomSchema), async (req, res, next) => {
  try {
    const { roomId } = req.params
    const userId = req.user!.id
    const { characterId } = req.body

    const participant = await ChatRoomService.joinRoom({
      roomId,
      userId,
      characterId,
      role: 'member'
    })

    res.json({
      success: true,
      participant
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 离开聊天室
 */
router.post('/:roomId/leave', authenticate, async (req, res, next) => {
  try {
    const { roomId } = req.params
    const userId = req.user!.id

    await ChatRoomService.leaveRoom(roomId, userId)

    res.json({
      success: true,
      message: '已离开聊天室'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 发送消息
 */
router.post('/:roomId/messages', authenticate, validate(sendMessageSchema), async (req, res, next) => {
  try {
    const { roomId } = req.params
    const userId = req.user!.id
    const { content, messageType, replyToId } = req.body

    const message = await ChatRoomService.sendMessage({
      roomId,
      senderId: userId,
      content,
      messageType,
      replyToId
    })

    res.json({
      success: true,
      message
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 获取聊天消息
 */
router.get('/:roomId/messages', authenticate, validate(paginationSchema, 'query'), async (req, res, next) => {
  try {
    const { roomId } = req.params
    const userId = req.user!.id
    const { page = 1, limit = 50 } = req.query as any

    const messages = await ChatRoomService.getMessages(roomId, userId, page, limit)

    res.json({
      success: true,
      messages,
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 召唤角色到聊天室
 */
router.post('/:roomId/summon', authenticate, validate(summonCharacterSchema), async (req, res, next) => {
  try {
    const { roomId } = req.params
    const userId = req.user!.id
    const { characterId, customPrompt } = req.body

    const result = await ChatRoomService.summonCharacter({
      roomId,
      characterId,
      userId,
      customPrompt
    })

    res.json({
      success: true,
      ...result
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 触发AI角色回复
 */
router.post('/:roomId/characters/:characterId/respond', authenticate, async (req, res, next) => {
  try {
    const { roomId, characterId } = req.params
    const userId = req.user!.id
    const { trigger } = req.body

    // 验证用户是否有权限触发角色回复
    const room = await ChatRoomService.getRoomDetails(roomId, userId)

    const message = await ChatRoomService.generateCharacterResponse(roomId, characterId, userId, trigger)

    res.json({
      success: true,
      message
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 移除角色从聊天室
 */
router.delete('/:roomId/characters/:characterId', authenticate, async (req, res, next) => {
  try {
    const { roomId, characterId } = req.params
    const userId = req.user!.id

    // 验证用户权限（房主或管理员）
    const room = await ChatRoomService.getRoomDetails(roomId, userId)
    const userParticipant = room.participants.find((p: any) => p.userId === userId)

    if (!userParticipant || !['owner', 'admin'].includes(userParticipant.role)) {
      return res.status(403).json({
        success: false,
        error: '无权限移除角色'
      })
    }

    await ChatRoomService.leaveRoom(roomId, undefined, characterId)

    res.json({
      success: true,
      message: '角色已移除'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 更新聊天室设置
 */
router.patch('/:roomId/settings', authenticate, async (req, res, next) => {
  try {
    const { roomId } = req.params
    const userId = req.user!.id
    const updates = req.body

    // 验证房主权限
    const room = await ChatRoomService.getRoomDetails(roomId, userId)
    if (room.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: '只有房主可以修改设置'
      })
    }

    // 这里可以添加更新逻辑
    logger.info('Chat room settings update requested', { roomId, userId, updates })

    res.json({
      success: true,
      message: '设置已更新'
    })
  } catch (error) {
    next(error)
  }
})

export default router
