"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketServer = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const { PrismaClient } = require('../node_modules/.prisma/client');
const logger_1 = require("./services/logger");
const chatroom_1 = __importDefault(require("./services/chatroom"));
const prisma = new PrismaClient();
// 延迟加载配置以避免循环依赖
let config = null;
const getConfig = () => {
    if (!config) {
        try {
            const { getEnvConfig } = require('./config/env.config');
            config = getEnvConfig();
        }
        catch (error) {
            config = {
                JWT_SECRET: process.env.JWT_SECRET || 'development-secret'
            };
        }
    }
    return config;
};
/**
 * WebSocket服务器类 - 专门用于多角色实时聊天
 */
class WebSocketServer {
    io;
    connectedUsers = new Map();
    roomParticipants = new Map(); // roomId -> Set<userId>
    constructor(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling'],
            allowEIO3: true
        });
        this.setupEventHandlers();
        logger_1.logger.info('WebSocket server initialized');
    }
    /**
     * 获取Socket.IO实例
     */
    getIO() {
        return this.io;
    }
    /**
     * 设置事件处理器
     */
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            logger_1.logger.info('New WebSocket connection', { socketId: socket.id });
            // 认证中间件
            this.authenticateSocket(socket, (authenticated) => {
                if (authenticated) {
                    this.handleAuthenticatedConnection(socket);
                }
                else {
                    socket.emit('auth_error', { message: '认证失败' });
                    socket.disconnect();
                }
            });
        });
    }
    /**
     * Socket认证
     */
    authenticateSocket(socket, callback) {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            callback(false);
            return;
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, getConfig().JWT_SECRET);
            // 验证用户是否存在且活跃
            prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, username: true, isActive: true }
            }).then((user) => {
                if (user && user.isActive) {
                    socket.userId = user.id;
                    socket.username = user.username;
                    socket.currentRooms = new Set();
                    this.connectedUsers.set(user.id, socket);
                    logger_1.logger.info('Socket authenticated', { userId: user.id, username: user.username, socketId: socket.id });
                    callback(true);
                }
                else {
                    callback(false);
                }
            }).catch((error) => {
                logger_1.logger.error('Socket authentication error', { error });
                callback(false);
            });
        }
        catch (error) {
            logger_1.logger.error('JWT verification failed', { error });
            callback(false);
        }
    }
    /**
     * 处理已认证的连接
     */
    handleAuthenticatedConnection(socket) {
        // 连接成功通知
        socket.emit('connected', {
            userId: socket.userId,
            username: socket.username,
            timestamp: new Date().toISOString()
        });
        // 加入聊天室
        socket.on('join_room', async (data) => {
            try {
                await this.handleJoinRoom(socket, data);
            }
            catch (error) {
                logger_1.logger.error('Join room error', { error, data, userId: socket.userId });
                socket.emit('error', { message: '加入聊天室失败' });
            }
        });
        // 离开聊天室
        socket.on('leave_room', async (data) => {
            try {
                await this.handleLeaveRoom(socket, data.roomId);
            }
            catch (error) {
                logger_1.logger.error('Leave room error', { error, roomId: data.roomId, userId: socket.userId });
            }
        });
        // 发送消息
        socket.on('send_message', async (data) => {
            try {
                await this.handleSendMessage(socket, data);
            }
            catch (error) {
                logger_1.logger.error('Send message error', { error, data, userId: socket.userId });
                socket.emit('error', { message: '发送消息失败' });
            }
        });
        // 输入状态
        socket.on('typing', (data) => {
            this.handleTyping(socket, data);
        });
        // 召唤角色
        socket.on('summon_character', async (data) => {
            try {
                await this.handleSummonCharacter(socket, data);
            }
            catch (error) {
                logger_1.logger.error('Summon character error', { error, data, userId: socket.userId });
                socket.emit('error', { message: '召唤角色失败' });
            }
        });
        // 触发AI回复
        socket.on('trigger_ai_response', async (data) => {
            try {
                await this.handleTriggerAIResponse(socket, data);
            }
            catch (error) {
                logger_1.logger.error('Trigger AI response error', { error, data, userId: socket.userId });
                socket.emit('error', { message: '触发AI回复失败' });
            }
        });
        // 断开连接
        socket.on('disconnect', () => {
            this.handleDisconnect(socket);
        });
        // 错误处理
        socket.on('error', (error) => {
            logger_1.logger.error('Socket error', { error, userId: socket.userId, socketId: socket.id });
        });
    }
    /**
     * 处理加入聊天室
     */
    async handleJoinRoom(socket, data) {
        const { roomId } = data;
        // 验证权限并加入聊天室
        await chatroom_1.default.joinRoom({
            roomId,
            userId: socket.userId,
            role: 'member'
        });
        // 加入Socket.IO房间
        socket.join(roomId);
        socket.currentRooms.add(roomId);
        // 更新房间参与者列表
        if (!this.roomParticipants.has(roomId)) {
            this.roomParticipants.set(roomId, new Set());
        }
        this.roomParticipants.get(roomId).add(socket.userId);
        // 通知房间内其他用户
        socket.to(roomId).emit('user_joined', {
            userId: socket.userId,
            username: socket.username,
            timestamp: new Date().toISOString()
        });
        // 通知加入成功
        socket.emit('room_joined', {
            roomId,
            participantCount: this.roomParticipants.get(roomId).size,
            timestamp: new Date().toISOString()
        });
        logger_1.logger.info('User joined room', { userId: socket.userId, roomId });
    }
    /**
     * 处理离开聊天室
     */
    async handleLeaveRoom(socket, roomId) {
        // 从Socket.IO房间离开
        socket.leave(roomId);
        socket.currentRooms.delete(roomId);
        // 更新房间参与者列表
        if (this.roomParticipants.has(roomId)) {
            this.roomParticipants.get(roomId).delete(socket.userId);
            // 如果房间没有参与者，清除房间记录
            if (this.roomParticipants.get(roomId).size === 0) {
                this.roomParticipants.delete(roomId);
            }
        }
        // 通知房间内其他用户
        socket.to(roomId).emit('user_left', {
            userId: socket.userId,
            username: socket.username,
            timestamp: new Date().toISOString()
        });
        // 更新数据库参与状态
        await chatroom_1.default.leaveRoom(roomId, socket.userId);
        logger_1.logger.info('User left room', { userId: socket.userId, roomId });
    }
    /**
     * 处理发送消息
     */
    async handleSendMessage(socket, data) {
        const { roomId, content, messageType, replyToId } = data;
        // 验证用户是否在房间中
        if (!socket.currentRooms.has(roomId)) {
            throw new Error('未加入聊天室');
        }
        // 发送消息到数据库
        const message = await chatroom_1.default.sendMessage({
            roomId,
            senderId: socket.userId,
            content,
            messageType,
            replyToId
        });
        // 广播消息到房间内所有用户
        this.io.to(roomId).emit('new_message', {
            id: message.id,
            roomId,
            sender: message.sender,
            content: message.content,
            messageType: message.messageType,
            replyTo: message.replyTo,
            tokens: message.tokens,
            createdAt: message.createdAt
        });
        logger_1.logger.info('Message sent to room', {
            messageId: message.id,
            roomId,
            senderId: socket.userId
        });
    }
    /**
     * 处理输入状态
     */
    handleTyping(socket, data) {
        const { roomId, isTyping } = data;
        // 验证用户是否在房间中
        if (!socket.currentRooms.has(roomId)) {
            return;
        }
        // 广播输入状态到房间内其他用户
        socket.to(roomId).emit('user_typing', {
            userId: socket.userId,
            username: socket.username,
            isTyping,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * 处理召唤角色
     */
    async handleSummonCharacter(socket, data) {
        const { roomId, characterId, customPrompt } = data;
        // 验证用户是否在房间中
        if (!socket.currentRooms.has(roomId)) {
            throw new Error('未加入聊天室');
        }
        // 召唤角色
        const result = await chatroom_1.default.summonCharacter({
            roomId,
            characterId,
            userId: socket.userId,
            customPrompt
        });
        // 广播角色加入事件
        this.io.to(roomId).emit('character_summoned', {
            character: result.character,
            participant: result.participant,
            joinMessage: result.joinMessage,
            summonedBy: {
                userId: socket.userId,
                username: socket.username
            },
            timestamp: new Date().toISOString()
        });
        logger_1.logger.info('Character summoned', {
            roomId,
            characterId,
            userId: socket.userId
        });
    }
    /**
     * 处理触发AI回复
     */
    async handleTriggerAIResponse(socket, data) {
        const { roomId, characterId, trigger } = data;
        // 验证用户是否在房间中
        if (!socket.currentRooms.has(roomId)) {
            throw new Error('未加入聊天室');
        }
        // 通知房间AI正在思考
        this.io.to(roomId).emit('ai_thinking', {
            characterId,
            trigger,
            timestamp: new Date().toISOString()
        });
        try {
            // 生成AI回复
            const message = await chatroom_1.default.generateCharacterResponse(roomId, characterId, socket.userId, trigger);
            // 广播AI回复
            this.io.to(roomId).emit('new_message', {
                id: message.id,
                roomId,
                character: message.character,
                content: message.content,
                messageType: message.messageType,
                tokens: message.tokens,
                createdAt: message.createdAt
            });
            logger_1.logger.info('AI response generated', {
                messageId: message.id,
                roomId,
                characterId,
                triggeredBy: socket.userId
            });
        }
        catch (error) {
            // 通知AI回复失败
            this.io.to(roomId).emit('ai_response_failed', {
                characterId,
                error: 'AI回复生成失败',
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
    /**
     * 处理断开连接
     */
    handleDisconnect(socket) {
        logger_1.logger.info('Socket disconnected', { userId: socket.userId, socketId: socket.id });
        if (socket.userId) {
            // 从连接用户列表移除
            this.connectedUsers.delete(socket.userId);
            // 离开所有房间
            socket.currentRooms?.forEach(roomId => {
                socket.leave(roomId);
                // 更新房间参与者列表
                if (this.roomParticipants.has(roomId)) {
                    this.roomParticipants.get(roomId).delete(socket.userId);
                    if (this.roomParticipants.get(roomId).size === 0) {
                        this.roomParticipants.delete(roomId);
                    }
                }
                // 通知房间内其他用户
                socket.to(roomId).emit('user_disconnected', {
                    userId: socket.userId,
                    username: socket.username,
                    timestamp: new Date().toISOString()
                });
            });
        }
    }
    /**
     * 获取在线用户数量
     */
    getOnlineUsersCount() {
        return this.connectedUsers.size;
    }
    /**
     * 获取房间参与者数量
     */
    getRoomParticipantsCount(roomId) {
        return this.roomParticipants.get(roomId)?.size || 0;
    }
    /**
     * 向特定用户发送消息
     */
    sendToUser(userId, event, data) {
        const socket = this.connectedUsers.get(userId);
        if (socket) {
            socket.emit(event, data);
            return true;
        }
        return false;
    }
    /**
     * 向房间广播消息
     */
    broadcastToRoom(roomId, event, data) {
        this.io.to(roomId).emit(event, data);
    }
}
exports.WebSocketServer = WebSocketServer;
exports.default = WebSocketServer;
//# sourceMappingURL=websocket.js.map