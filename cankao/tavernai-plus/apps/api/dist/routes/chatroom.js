"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const chatroom_1 = __importDefault(require("../services/chatroom"));
const logger_1 = require("../services/logger");
const router = (0, express_1.Router)();
// 验证模式
const createRoomSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50),
    description: zod_1.z.string().max(500).optional(),
    maxParticipants: zod_1.z.number().min(2).max(50).optional(),
    isPrivate: zod_1.z.boolean().optional(),
    allowSpectators: zod_1.z.boolean().optional(),
    roomType: zod_1.z.enum(['multichar', 'group', 'roleplay']).optional()
});
const joinRoomSchema = zod_1.z.object({
    roomId: zod_1.z.string().uuid(),
    characterId: zod_1.z.string().uuid().optional()
});
const sendMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(2000),
    messageType: zod_1.z.enum(['text', 'action', 'system', 'ooc']).optional(),
    replyToId: zod_1.z.string().uuid().optional()
});
const summonCharacterSchema = zod_1.z.object({
    characterId: zod_1.z.string().uuid(),
    customPrompt: zod_1.z.string().max(500).optional()
});
const paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).optional()
});
/**
 * 创建聊天室
 */
router.post('/create', auth_1.authenticate, (0, validate_1.validate)(createRoomSchema), async (req, res, next) => {
    try {
        const userId = req.user.id;
        const room = await chatroom_1.default.createRoom({
            ...req.body,
            ownerId: userId
        });
        res.status(201).json({
            success: true,
            room
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取聊天室列表
 */
router.get('/list', auth_1.authenticate, (0, validate_1.validate)(paginationSchema, 'query'), async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const rooms = await chatroom_1.default.getRooms(userId, page, limit);
        res.json({
            success: true,
            rooms,
            pagination: {
                page,
                limit,
                hasMore: rooms.length === limit
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取聊天室详情
 */
router.get('/:roomId', auth_1.authenticate, async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;
        const room = await chatroom_1.default.getRoomDetails(roomId, userId);
        res.json({
            success: true,
            room
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 加入聊天室
 */
router.post('/:roomId/join', auth_1.authenticate, (0, validate_1.validate)(joinRoomSchema), async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;
        const { characterId } = req.body;
        const participant = await chatroom_1.default.joinRoom({
            roomId,
            userId,
            characterId,
            role: 'member'
        });
        res.json({
            success: true,
            participant
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 离开聊天室
 */
router.post('/:roomId/leave', auth_1.authenticate, async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;
        await chatroom_1.default.leaveRoom(roomId, userId);
        res.json({
            success: true,
            message: '已离开聊天室'
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 发送消息
 */
router.post('/:roomId/messages', auth_1.authenticate, (0, validate_1.validate)(sendMessageSchema), async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;
        const { content, messageType, replyToId } = req.body;
        const message = await chatroom_1.default.sendMessage({
            roomId,
            senderId: userId,
            content,
            messageType,
            replyToId
        });
        res.json({
            success: true,
            message
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取聊天消息
 */
router.get('/:roomId/messages', auth_1.authenticate, (0, validate_1.validate)(paginationSchema, 'query'), async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;
        const { page = 1, limit = 50 } = req.query;
        const messages = await chatroom_1.default.getMessages(roomId, userId, page, limit);
        res.json({
            success: true,
            messages,
            pagination: {
                page,
                limit,
                hasMore: messages.length === limit
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 召唤角色到聊天室
 */
router.post('/:roomId/summon', auth_1.authenticate, (0, validate_1.validate)(summonCharacterSchema), async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;
        const { characterId, customPrompt } = req.body;
        const result = await chatroom_1.default.summonCharacter({
            roomId,
            characterId,
            userId,
            customPrompt
        });
        res.json({
            success: true,
            ...result
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 触发AI角色回复
 */
router.post('/:roomId/characters/:characterId/respond', auth_1.authenticate, async (req, res, next) => {
    try {
        const { roomId, characterId } = req.params;
        const userId = req.user.id;
        const { trigger } = req.body;
        // 验证用户是否有权限触发角色回复
        const room = await chatroom_1.default.getRoomDetails(roomId, userId);
        const message = await chatroom_1.default.generateCharacterResponse(roomId, characterId, userId, trigger);
        res.json({
            success: true,
            message
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 移除角色从聊天室
 */
router.delete('/:roomId/characters/:characterId', auth_1.authenticate, async (req, res, next) => {
    try {
        const { roomId, characterId } = req.params;
        const userId = req.user.id;
        // 验证用户权限（房主或管理员）
        const room = await chatroom_1.default.getRoomDetails(roomId, userId);
        const userParticipant = room.participants.find((p) => p.userId === userId);
        if (!userParticipant || !['owner', 'admin'].includes(userParticipant.role)) {
            return res.status(403).json({
                success: false,
                error: '无权限移除角色'
            });
        }
        await chatroom_1.default.leaveRoom(roomId, undefined, characterId);
        res.json({
            success: true,
            message: '角色已移除'
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 更新聊天室设置
 */
router.patch('/:roomId/settings', auth_1.authenticate, async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;
        const updates = req.body;
        // 验证房主权限
        const room = await chatroom_1.default.getRoomDetails(roomId, userId);
        if (room.ownerId !== userId) {
            return res.status(403).json({
                success: false,
                error: '只有房主可以修改设置'
            });
        }
        // 这里可以添加更新逻辑
        logger_1.logger.info('Chat room settings update requested', { roomId, userId, updates });
        res.json({
            success: true,
            message: '设置已更新'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=chatroom.js.map