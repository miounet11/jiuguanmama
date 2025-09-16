"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const server_1 = require("../server");
const server_2 = require("../server");
const ai_1 = require("../services/ai");
const router = (0, express_1.Router)();
// 获取用户的聊天会话列表
router.get('/sessions', auth_1.authenticate, async (req, res, next) => {
    try {
        const sessions = await server_1.prisma.chatSession.findMany({
            where: {
                userId: req.user.id,
                isArchived: false
            },
            select: {
                id: true,
                title: true,
                characterIds: true,
                lastMessageAt: true,
                messageCount: true,
                updatedAt: true,
                characters: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            take: 20
        });
        res.json({
            success: true,
            sessions
        });
    }
    catch (error) {
        next(error);
    }
});
// 创建新的聊天会话
router.post('/sessions', auth_1.authenticate, async (req, res, next) => {
    try {
        const { characterIds, title } = req.body;
        const session = await server_1.prisma.chatSession.create({
            data: {
                userId: req.user.id,
                characterIds,
                title,
                characters: {
                    connect: characterIds.map((id) => ({ id }))
                }
            },
            include: {
                characters: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        firstMessage: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            session
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取会话的消息历史
router.get('/sessions/:sessionId/messages', auth_1.authenticate, async (req, res, next) => {
    try {
        const session = await server_1.prisma.chatSession.findFirst({
            where: {
                id: req.params.sessionId,
                userId: req.user.id
            }
        });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        const messages = await server_1.prisma.message.findMany({
            where: { sessionId: req.params.sessionId },
            orderBy: { createdAt: 'asc' },
            include: {
                character: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            }
        });
        res.json({
            success: true,
            messages
        });
    }
    catch (error) {
        next(error);
    }
});
// 发送消息
router.post('/sessions/:sessionId/messages', auth_1.authenticate, async (req, res, next) => {
    try {
        const { content, characterId } = req.body;
        // 验证会话所有权
        const session = await server_1.prisma.chatSession.findFirst({
            where: {
                id: req.params.sessionId,
                userId: req.user.id
            },
            include: {
                characters: true
            }
        });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        // 创建用户消息
        const userMessage = await server_1.prisma.message.create({
            data: {
                sessionId: req.params.sessionId,
                userId: req.user.id,
                role: 'user',
                content,
                tokens: Math.ceil(content.length / 4) // 简单估算
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true
                    }
                }
            }
        });
        // 更新会话统计
        await server_1.prisma.chatSession.update({
            where: { id: req.params.sessionId },
            data: {
                messageCount: { increment: 1 },
                lastMessageAt: new Date(),
                totalTokens: { increment: userMessage.tokens }
            }
        });
        // 通过 WebSocket 广播用户消息
        server_2.io.to(`session:${req.params.sessionId}`).emit('message', {
            type: 'user_message',
            sessionId: req.params.sessionId,
            message: userMessage
        });
        // 异步生成 AI 回复
        setImmediate(async () => {
            try {
                const character = session.characters[0];
                // 获取历史消息作为上下文
                const recentMessages = await server_1.prisma.message.findMany({
                    where: {
                        sessionId: req.params.sessionId,
                        deleted: false
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: {
                        role: true,
                        content: true
                    }
                });
                // 构建消息历史（倒序排列）
                const messageHistory = recentMessages
                    .reverse()
                    .slice(0, -1) // 排除刚发送的消息（已在上面）
                    .map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));
                // 添加最新的用户消息
                messageHistory.push({
                    role: 'user',
                    content
                });
                // 使用流式生成
                const generator = ai_1.aiService.generateChatStream({
                    sessionId: req.params.sessionId,
                    userId: req.user.id,
                    characterId: character?.id,
                    messages: messageHistory,
                    model: session.model || 'grok-3',
                    temperature: 0.7,
                    maxTokens: 1000
                });
                let fullContent = '';
                let chunkCount = 0;
                // 先创建消息记录
                const aiMessage = await server_1.prisma.message.create({
                    data: {
                        sessionId: req.params.sessionId,
                        characterId: character?.id,
                        role: 'assistant',
                        content: '',
                        tokens: 0
                    },
                    include: {
                        character: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true
                            }
                        }
                    }
                });
                // 流式发送内容
                for await (const chunk of generator) {
                    fullContent += chunk;
                    chunkCount++;
                    // 每收到一定数量的块就发送一次
                    if (chunkCount % 3 === 0) {
                        server_2.io.to(`session:${req.params.sessionId}`).emit('message_chunk', {
                            sessionId: req.params.sessionId,
                            messageId: aiMessage.id,
                            chunk,
                            partial: fullContent
                        });
                    }
                }
                // 更新消息内容
                const finalMessage = await server_1.prisma.message.update({
                    where: { id: aiMessage.id },
                    data: {
                        content: fullContent,
                        tokens: ai_1.aiService.estimateTokens(fullContent)
                    },
                    include: {
                        character: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true
                            }
                        }
                    }
                });
                // 更新会话统计
                await server_1.prisma.chatSession.update({
                    where: { id: req.params.sessionId },
                    data: {
                        messageCount: { increment: 1 },
                        lastMessageAt: new Date(),
                        totalTokens: { increment: finalMessage.tokens }
                    }
                });
                // 发送完整消息
                server_2.io.to(`session:${req.params.sessionId}`).emit('message', {
                    type: 'assistant_message',
                    sessionId: req.params.sessionId,
                    message: finalMessage
                });
            }
            catch (error) {
                console.error('生成 AI 回复失败:', error);
                server_2.io.to(`session:${req.params.sessionId}`).emit('error', {
                    message: '生成回复失败',
                    error: error instanceof Error ? error.message : '未知错误'
                });
            }
        });
        res.json({
            success: true,
            message: userMessage
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取会话详情
router.get('/sessions/:sessionId', auth_1.authenticate, async (req, res, next) => {
    try {
        const session = await server_1.prisma.chatSession.findFirst({
            where: {
                id: req.params.sessionId,
                userId: req.user.id
            },
            include: {
                characters: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        description: true
                    }
                }
            }
        });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        res.json({
            success: true,
            session
        });
    }
    catch (error) {
        next(error);
    }
});
// 删除会话
router.delete('/sessions/:sessionId', auth_1.authenticate, async (req, res, next) => {
    try {
        const session = await server_1.prisma.chatSession.findFirst({
            where: {
                id: req.params.sessionId,
                userId: req.user.id
            }
        });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        await server_1.prisma.chatSession.delete({
            where: { id: req.params.sessionId }
        });
        res.json({
            success: true,
            message: 'Session deleted'
        });
    }
    catch (error) {
        next(error);
    }
});
// 归档会话
router.post('/sessions/:sessionId/archive', auth_1.authenticate, async (req, res, next) => {
    try {
        const session = await server_1.prisma.chatSession.findFirst({
            where: {
                id: req.params.sessionId,
                userId: req.user.id
            }
        });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        await server_1.prisma.chatSession.update({
            where: { id: req.params.sessionId },
            data: { isArchived: true }
        });
        res.json({
            success: true,
            message: 'Session archived'
        });
    }
    catch (error) {
        next(error);
    }
});
// 编辑消息
router.put('/sessions/:sessionId/messages/:messageId', auth_1.authenticate, async (req, res, next) => {
    try {
        const { content } = req.body;
        const message = await server_1.prisma.message.findFirst({
            where: {
                id: req.params.messageId,
                sessionId: req.params.sessionId,
                userId: req.user.id
            }
        });
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        const updatedMessage = await server_1.prisma.message.update({
            where: { id: req.params.messageId },
            data: {
                content,
                edited: true,
                tokens: Math.ceil(content.length / 4)
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true
                    }
                },
                character: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            }
        });
        res.json({
            success: true,
            message: updatedMessage
        });
    }
    catch (error) {
        next(error);
    }
});
// 删除消息
router.delete('/sessions/:sessionId/messages/:messageId', auth_1.authenticate, async (req, res, next) => {
    try {
        const message = await server_1.prisma.message.findFirst({
            where: {
                id: req.params.messageId,
                sessionId: req.params.sessionId
            }
        });
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        // 软删除
        await server_1.prisma.message.update({
            where: { id: req.params.messageId },
            data: { deleted: true }
        });
        res.json({
            success: true,
            message: 'Message deleted'
        });
    }
    catch (error) {
        next(error);
    }
});
// 重新生成消息
router.post('/sessions/:sessionId/messages/:messageId/regenerate', auth_1.authenticate, async (req, res, next) => {
    try {
        const message = await server_1.prisma.message.findFirst({
            where: {
                id: req.params.messageId,
                sessionId: req.params.sessionId,
                role: 'assistant'
            }
        });
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        // TODO: 调用 AI API 重新生成
        const newContent = `重新生成的消息内容`;
        const updatedMessage = await server_1.prisma.message.update({
            where: { id: req.params.messageId },
            data: {
                content: newContent,
                edited: true,
                tokens: Math.ceil(newContent.length / 4)
            },
            include: {
                character: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            }
        });
        res.json({
            success: true,
            message: updatedMessage
        });
    }
    catch (error) {
        next(error);
    }
});
// 停止生成
router.post('/sessions/:sessionId/stop', auth_1.authenticate, async (req, res, next) => {
    try {
        // TODO: 实现停止 AI 生成的逻辑
        server_2.io.to(`session:${req.params.sessionId}`).emit('generation_stopped', {
            sessionId: req.params.sessionId
        });
        res.json({
            success: true,
            message: 'Generation stopped'
        });
    }
    catch (error) {
        next(error);
    }
});
// 清空上下文
router.post('/sessions/:sessionId/clear-context', auth_1.authenticate, async (req, res, next) => {
    try {
        const session = await server_1.prisma.chatSession.findFirst({
            where: {
                id: req.params.sessionId,
                userId: req.user.id
            }
        });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        // 重置会话的元数据
        await server_1.prisma.chatSession.update({
            where: { id: req.params.sessionId },
            data: {
                metadata: {}
            }
        });
        res.json({
            success: true,
            message: 'Context cleared'
        });
    }
    catch (error) {
        next(error);
    }
});
// 更新会话设置
router.put('/sessions/:sessionId/settings', auth_1.authenticate, async (req, res, next) => {
    try {
        const session = await server_1.prisma.chatSession.findFirst({
            where: {
                id: req.params.sessionId,
                userId: req.user.id
            }
        });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        await server_1.prisma.chatSession.update({
            where: { id: req.params.sessionId },
            data: {
                model: req.body.model || session.model,
                metadata: {
                    ...session.metadata,
                    settings: req.body
                }
            }
        });
        res.json({
            success: true,
            message: 'Settings updated'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=chat.js.map