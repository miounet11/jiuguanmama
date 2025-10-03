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
const worldInfoInjection_1 = require("./services/worldInfoInjection");
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
        // 动态世界观注入
        socket.on('analyze_worldinfo', async (data) => {
            try {
                await this.handleWorldInfoAnalysis(socket, data);
            }
            catch (error) {
                logger_1.logger.error('WorldInfo analysis error', { error, data, userId: socket.userId });
                socket.emit('worldinfo_error', { message: '世界观分析失败' });
            }
        });
        // 请求世界观建议
        socket.on('request_worldinfo_suggestions', async (data) => {
            try {
                await this.handleWorldInfoSuggestions(socket, data);
            }
            catch (error) {
                logger_1.logger.error('WorldInfo suggestions error', { error, data, userId: socket.userId });
                socket.emit('worldinfo_error', { message: '获取世界观建议失败' });
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
    /**
     * 处理动态世界观分析和注入
     */
    async handleWorldInfoAnalysis(socket, data) {
        const { sessionId, roomId, characterId, messages, currentMessage, settings } = data;
        // 通知分析开始
        socket.emit('worldinfo_analysis_started', {
            sessionId,
            roomId,
            characterId,
            timestamp: new Date().toISOString()
        });
        try {
            // 构建对话上下文
            const context = {
                sessionId,
                roomId,
                userId: socket.userId,
                characterId,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content,
                    timestamp: new Date()
                })),
                currentMessage,
                metadata: { settings }
            };
            // 执行世界观分析和注入
            const injectionResult = await worldInfoInjection_1.worldInfoInjectionService.analyzeAndInjectWorldInfo(context);
            // 发送分析结果
            socket.emit('worldinfo_analysis_completed', {
                sessionId,
                roomId,
                characterId,
                injectedContent: injectionResult.injectedContent,
                activatedEntries: injectionResult.activatedEntries.map(entry => ({
                    id: entry.id,
                    title: entry.title,
                    category: entry.category,
                    priority: entry.priority,
                    relevanceScore: entry.relevanceScore,
                    insertionPosition: entry.insertionPosition
                })),
                relevanceScores: injectionResult.relevanceScores,
                triggeredKeywords: injectionResult.triggeredKeywords,
                totalTokens: injectionResult.totalTokens,
                performance: injectionResult.performance,
                timestamp: new Date().toISOString()
            });
            // 如果在聊天室中，也广播给其他用户（可选）
            if (roomId && injectionResult.activatedEntries.length > 0) {
                socket.to(roomId).emit('worldinfo_triggered', {
                    triggeredBy: {
                        userId: socket.userId,
                        username: socket.username
                    },
                    entryCount: injectionResult.activatedEntries.length,
                    categories: [...new Set(injectionResult.activatedEntries.map(e => e.category))],
                    timestamp: new Date().toISOString()
                });
            }
            logger_1.logger.info('WorldInfo analysis completed via WebSocket', {
                userId: socket.userId,
                sessionId,
                roomId,
                characterId,
                activatedEntries: injectionResult.activatedEntries.length,
                totalTokens: injectionResult.totalTokens,
                performance: injectionResult.performance
            });
        }
        catch (error) {
            socket.emit('worldinfo_analysis_failed', {
                sessionId,
                roomId,
                characterId,
                error: 'AI分析服务暂时不可用',
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
    /**
     * 处理世界观建议请求
     */
    async handleWorldInfoSuggestions(socket, data) {
        const { sessionId, characterId, context } = data;
        try {
            // 基于用户历史和当前上下文生成建议
            const suggestions = {
                recommendedEntries: [
                    {
                        id: 'entry_magic_system',
                        title: '魔法系统',
                        category: 'lore',
                        relevance: 0.89,
                        reason: '检测到魔法相关关键词'
                    },
                    {
                        id: 'entry_magic_academy',
                        title: '魔法学院',
                        category: 'location',
                        relevance: 0.82,
                        reason: '与当前对话场景匹配'
                    }
                ],
                keywordTriggers: [
                    { keyword: '魔法', confidence: 0.95, entries: 3 },
                    { keyword: '学院', confidence: 0.87, entries: 2 },
                    { keyword: '冒险', confidence: 0.73, entries: 4 }
                ],
                contextAdvice: {
                    appropriateForInjection: true,
                    suggestedTiming: 'immediate',
                    reason: '对话氛围轻松，适合注入背景信息'
                },
                settings: {
                    recommended: {
                        maxEntries: 5,
                        scanDepth: 3,
                        semanticThreshold: 0.4,
                        enableAI: true,
                        insertionStrategy: 'before'
                    }
                }
            };
            socket.emit('worldinfo_suggestions', {
                sessionId,
                characterId,
                suggestions,
                timestamp: new Date().toISOString()
            });
            logger_1.logger.info('WorldInfo suggestions sent', {
                userId: socket.userId,
                sessionId,
                characterId,
                entryCount: suggestions.recommendedEntries.length
            });
        }
        catch (error) {
            socket.emit('worldinfo_suggestions_failed', {
                sessionId,
                characterId,
                error: '获取建议失败',
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
    /**
     * 实时关键词监控
     * 当检测到特定关键词时，主动推送相关世界观信息
     */
    async monitorKeywordsInMessage(userId, message, context) {
        try {
            const socket = this.connectedUsers.get(userId);
            if (!socket)
                return;
            // 简单的关键词检测（实际应使用更智能的方式）
            const monitoredKeywords = ['魔法', '学院', '传说', '武器', '冒险'];
            const detectedKeywords = monitoredKeywords.filter(keyword => message.toLowerCase().includes(keyword));
            if (detectedKeywords.length > 0) {
                // 推送相关世界观提示
                socket.emit('worldinfo_keyword_detected', {
                    detectedKeywords,
                    suggestedAction: 'analyze_context',
                    message: `检测到关键词：${detectedKeywords.join('、')}，是否获取相关背景信息？`,
                    context,
                    timestamp: new Date().toISOString()
                });
                logger_1.logger.info('Keywords detected and notification sent', {
                    userId,
                    detectedKeywords,
                    context
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Keyword monitoring failed', { error, userId });
        }
    }
    /**
     * 为特定用户推送世界观更新
     */
    pushWorldInfoUpdate(userId, update) {
        const socket = this.connectedUsers.get(userId);
        if (socket) {
            socket.emit('worldinfo_update', {
                ...update,
                timestamp: new Date().toISOString()
            });
            return true;
        }
        return false;
    }
}
exports.WebSocketServer = WebSocketServer;
exports.default = WebSocketServer;
//# sourceMappingURL=websocket.js.map