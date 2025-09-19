"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const socket_1 = require("../lib/socket");
const ai_1 = require("../services/ai");
const router = (0, express_1.Router)();
// 获取或创建与角色的聊天会话 (兼容前端的 /api/chats/{characterId} 调用)
router.get('/:characterId', auth_1.authenticate, async (req, res, next) => {
    try {
        const { characterId } = req.params;
        // 验证角色是否存在
        const character = await prisma_1.prisma.character.findUnique({
            where: { id: characterId },
            select: {
                id: true,
                name: true,
                avatar: true,
                description: true,
                firstMessage: true,
                creator: {
                    select: {
                        username: true
                    }
                }
            }
        });
        if (!character) {
            return res.status(404).json({
                success: false,
                message: 'Character not found'
            });
        }
        // 查找现有会话
        let session = await prisma_1.prisma.chatSession.findFirst({
            where: {
                userId: req.user.id,
                characterId,
                isArchived: false
            },
            orderBy: { updatedAt: 'desc' }
        });
        // 如果没有现有会话，创建新的
        if (!session) {
            session = await prisma_1.prisma.chatSession.create({
                data: {
                    userId: req.user.id,
                    characterId,
                    title: `与${character.name}的对话`,
                    metadata: JSON.stringify({
                        systemPrompt: character.firstMessage || `你好！我是${character.name}`,
                        temperature: 0.7,
                        maxTokens: 1000,
                        model: 'grok-3'
                    })
                }
            });
            // 如果角色有首条消息，添加它
            if (character.firstMessage) {
                await prisma_1.prisma.message.create({
                    data: {
                        sessionId: session.id,
                        characterId,
                        role: 'assistant',
                        content: character.firstMessage,
                        tokens: Math.ceil(character.firstMessage.length / 4)
                    }
                });
            }
        }
        // 获取消息历史
        const messages = await prisma_1.prisma.message.findMany({
            where: {
                sessionId: session.id,
                deleted: false
            },
            orderBy: { createdAt: 'asc' },
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
            session: {
                ...session,
                character: {
                    ...character,
                    creator: character.creator.username
                }
            },
            character: {
                ...character,
                creator: character.creator.username
            },
            messages
        });
    }
    catch (error) {
        next(error);
    }
});
// 发送消息到指定角色会话 (兼容前端的 /api/chats/{characterId}/messages 调用)
router.post('/:characterId/messages', auth_1.authenticate, async (req, res, next) => {
    try {
        const { content, settings = {}, stream = false } = req.body;
        const { characterId } = req.params;
        // 验证角色是否存在
        const character = await prisma_1.prisma.character.findUnique({
            where: { id: characterId },
            include: { creator: true }
        });
        if (!character) {
            return res.status(404).json({
                success: false,
                message: 'Character not found'
            });
        }
        // 查找或创建会话
        let session = await prisma_1.prisma.chatSession.findFirst({
            where: {
                characterId,
                userId: req.user.id
            }
        });
        if (!session) {
            session = await prisma_1.prisma.chatSession.create({
                data: {
                    userId: req.user.id,
                    characterId,
                    title: `与${character.name}的对话`,
                    metadata: JSON.stringify({
                        systemPrompt: character.firstMessage || `你好！我是${character.name}`,
                        temperature: settings.temperature || 0.7,
                        maxTokens: settings.maxTokens || 1000,
                        model: settings.model || 'grok-3'
                    })
                }
            });
        }
        // 创建用户消息
        const userMessage = await prisma_1.prisma.message.create({
            data: {
                sessionId: session.id,
                userId: req.user.id,
                role: 'user',
                content,
                tokens: Math.ceil(content.length / 4)
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
        await prisma_1.prisma.chatSession.update({
            where: { id: session.id },
            data: {
                messageCount: { increment: 1 },
                lastMessageAt: new Date(),
                totalTokens: { increment: userMessage.tokens }
            }
        });
        // 获取历史消息作为上下文
        const recentMessages = await prisma_1.prisma.message.findMany({
            where: {
                sessionId: session.id,
                deleted: false
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                role: true,
                content: true
            }
        });
        // 构建消息历史
        const messageHistory = recentMessages
            .reverse()
            .map((msg) => ({
            role: msg.role,
            content: msg.content
        }));
        if (stream) {
            // 流式响应
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control',
                'X-Accel-Buffering': 'no'
            });
            // 发送连接确认
            res.write(`data: ${JSON.stringify({
                type: 'connected',
                userMessage: {
                    id: userMessage.id,
                    content: userMessage.content,
                    timestamp: userMessage.createdAt
                }
            })}\n\n`);
            let fullContent = '';
            let aiMessage = null;
            try {
                // 使用流式生成
                const streamGenerator = ai_1.aiService.generateChatStream({
                    sessionId: session.id,
                    userId: req.user.id,
                    characterId: character.id,
                    messages: messageHistory,
                    model: settings.model || session.model || 'grok-3',
                    temperature: settings.temperature || 0.7,
                    maxTokens: settings.maxTokens || 1000
                });
                for await (const chunk of streamGenerator) {
                    if (chunk && chunk.trim()) {
                        fullContent += chunk;
                        // 发送流式数据块
                        res.write(`data: ${JSON.stringify({
                            type: 'chunk',
                            content: chunk,
                            fullContent: fullContent
                        })}\n\n`);
                    }
                }
                // 保存完整的AI消息
                if (fullContent.trim()) {
                    aiMessage = await prisma_1.prisma.message.create({
                        data: {
                            sessionId: session.id,
                            characterId: character.id,
                            role: 'assistant',
                            content: fullContent,
                            tokens: ai_1.aiService.estimateTokens(fullContent)
                        }
                    });
                    // 更新会话统计
                    await prisma_1.prisma.chatSession.update({
                        where: { id: session.id },
                        data: {
                            messageCount: { increment: 1 },
                            lastMessageAt: new Date(),
                            totalTokens: { increment: aiMessage.tokens }
                        }
                    });
                }
                // 发送完成信号
                res.write(`data: ${JSON.stringify({
                    type: 'complete',
                    id: aiMessage?.id || Date.now().toString(),
                    content: fullContent,
                    timestamp: aiMessage?.createdAt || new Date()
                })}\n\n`);
            }
            catch (error) {
                console.error('流式生成失败:', error);
                res.write(`data: ${JSON.stringify({
                    type: 'error',
                    message: '抱歉，我现在无法响应。请稍后再试。'
                })}\n\n`);
            }
            finally {
                res.end();
            }
        }
        else {
            // 非流式响应（原有逻辑）
            try {
                // 生成AI回复
                const aiResponse = await ai_1.aiService.generateChatResponse({
                    sessionId: session.id,
                    userId: req.user.id,
                    characterId: character.id,
                    messages: messageHistory,
                    model: settings.model || session.model || 'grok-3',
                    temperature: settings.temperature || 0.7,
                    maxTokens: settings.maxTokens || 1000,
                    stream: false
                });
                // 创建AI消息
                const aiMessage = await prisma_1.prisma.message.create({
                    data: {
                        sessionId: session.id,
                        characterId: character.id,
                        role: 'assistant',
                        content: aiResponse.content,
                        tokens: ai_1.aiService.estimateTokens(aiResponse.content)
                    }
                });
                // 更新会话统计
                await prisma_1.prisma.chatSession.update({
                    where: { id: session.id },
                    data: {
                        messageCount: { increment: 1 },
                        lastMessageAt: new Date(),
                        totalTokens: { increment: aiMessage.tokens }
                    }
                });
                // 返回AI回复消息给前端
                res.json({
                    success: true,
                    id: aiMessage.id,
                    content: aiMessage.content,
                    timestamp: aiMessage.createdAt,
                    userMessage
                });
            }
            catch (aiError) {
                console.error('生成 AI 回复失败:', aiError);
                // 如果AI回复失败，至少返回成功的用户消息
                res.json({
                    success: true,
                    id: Date.now().toString(),
                    content: '抱歉，我现在无法响应。请稍后再试。',
                    timestamp: new Date(),
                    userMessage
                });
            }
        }
    }
    catch (error) {
        if (!res.headersSent) {
            next(error);
        }
    }
});
// 获取用户的聊天会话列表 (兼容前端的 /api/chats 调用)
router.get('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const sessions = await prisma_1.prisma.chatSession.findMany({
            where: {
                userId: req.user.id,
                isArchived: false
            },
            select: {
                id: true,
                title: true,
                characterId: true,
                lastMessageAt: true,
                messageCount: true,
                updatedAt: true,
                character: {
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
// 创建新聊天会话 (兼容前端的 /api/chats POST 调用)
router.post('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const { characterId, title } = req.body;
        const session = await prisma_1.prisma.chatSession.create({
            data: {
                userId: req.user.id,
                characterId,
                title: title || `与${characterId}的对话`
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
        res.status(201).json({
            success: true,
            session
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取用户的聊天会话列表 (保持向后兼容)
router.get('/sessions', auth_1.authenticate, async (req, res, next) => {
    try {
        const sessions = await prisma_1.prisma.chatSession.findMany({
            where: {
                userId: req.user.id,
                isArchived: false
            },
            select: {
                id: true,
                title: true,
                characterId: true,
                lastMessageAt: true,
                messageCount: true,
                updatedAt: true,
                character: {
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
        const { characterId, title } = req.body;
        const session = await prisma_1.prisma.chatSession.create({
            data: {
                userId: req.user.id,
                characterId,
                title
            },
            include: {
                character: {
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
        const session = await prisma_1.prisma.chatSession.findFirst({
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
        const messages = await prisma_1.prisma.message.findMany({
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
        const session = await prisma_1.prisma.chatSession.findFirst({
            where: {
                id: req.params.sessionId,
                userId: req.user.id
            },
            include: {
                character: true
            }
        });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        // 创建用户消息
        const userMessage = await prisma_1.prisma.message.create({
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
        await prisma_1.prisma.chatSession.update({
            where: { id: req.params.sessionId },
            data: {
                messageCount: { increment: 1 },
                lastMessageAt: new Date(),
                totalTokens: { increment: userMessage.tokens }
            }
        });
        // 通过 WebSocket 广播用户消息
        const io = (0, socket_1.getSocket)();
        io.to(`session:${req.params.sessionId}`).emit('message', {
            type: 'user_message',
            sessionId: req.params.sessionId,
            message: userMessage
        });
        // 异步生成 AI 回复
        setImmediate(async () => {
            try {
                const character = session.character;
                // 获取历史消息作为上下文
                const recentMessages = await prisma_1.prisma.message.findMany({
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
                    .map((msg) => ({
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
                const aiMessage = await prisma_1.prisma.message.create({
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
                        const io = (0, socket_1.getSocket)();
                        io.to(`session:${req.params.sessionId}`).emit('message_chunk', {
                            sessionId: req.params.sessionId,
                            messageId: aiMessage.id,
                            chunk,
                            partial: fullContent
                        });
                    }
                }
                // 更新消息内容
                const finalMessage = await prisma_1.prisma.message.update({
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
                await prisma_1.prisma.chatSession.update({
                    where: { id: req.params.sessionId },
                    data: {
                        messageCount: { increment: 1 },
                        lastMessageAt: new Date(),
                        totalTokens: { increment: finalMessage.tokens }
                    }
                });
                // 发送完整消息
                const io = (0, socket_1.getSocket)();
                io.to(`session:${req.params.sessionId}`).emit('message', {
                    type: 'assistant_message',
                    sessionId: req.params.sessionId,
                    message: finalMessage
                });
            }
            catch (error) {
                console.error('生成 AI 回复失败:', error);
                const io = (0, socket_1.getSocket)();
                io.to(`session:${req.params.sessionId}`).emit('error', {
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
        const session = await prisma_1.prisma.chatSession.findFirst({
            where: {
                id: req.params.sessionId,
                userId: req.user.id
            },
            include: {
                character: {
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
        const session = await prisma_1.prisma.chatSession.findFirst({
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
        await prisma_1.prisma.chatSession.delete({
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
        const session = await prisma_1.prisma.chatSession.findFirst({
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
        await prisma_1.prisma.chatSession.update({
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
        const message = await prisma_1.prisma.message.findFirst({
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
        const updatedMessage = await prisma_1.prisma.message.update({
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
        const message = await prisma_1.prisma.message.findFirst({
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
        await prisma_1.prisma.message.update({
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
        const message = await prisma_1.prisma.message.findFirst({
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
        const updatedMessage = await prisma_1.prisma.message.update({
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
        const io = (0, socket_1.getSocket)();
        io.to(`session:${req.params.sessionId}`).emit('generation_stopped', {
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
        const session = await prisma_1.prisma.chatSession.findFirst({
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
        await prisma_1.prisma.chatSession.update({
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
        const session = await prisma_1.prisma.chatSession.findFirst({
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
        await prisma_1.prisma.chatSession.update({
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
// 更新聊天会话（固定/取消固定等）
router.patch('/:sessionId', auth_1.authenticate, async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { isPinned, title } = req.body;
        // 验证会话属于当前用户
        const existingSession = await prisma_1.prisma.chatSession.findFirst({
            where: {
                id: sessionId,
                userId: req.user.id
            }
        });
        if (!existingSession) {
            return res.status(404).json({
                success: false,
                message: 'Chat session not found'
            });
        }
        // 更新会话信息
        const updatedSession = await prisma_1.prisma.chatSession.update({
            where: { id: sessionId },
            data: {
                ...(isPinned !== undefined && { isPinned }),
                ...(title && { title })
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
            session: updatedSession
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=chat.js.map