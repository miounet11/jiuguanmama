"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const ai_1 = require("../services/ai");
const server_1 = require("../server");
const router = (0, express_1.Router)();
// 获取用户的群组聊天列表
router.get('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const { status = 'all', limit = 20, offset = 0 } = req.query;
        // TODO: 从数据库获取真实数据
        const sampleGroups = [
            {
                id: 'group_1',
                name: '魔法学院聊天室',
                description: '一个充满魔法的学院聊天环境',
                ownerId: req.user.id,
                participants: [
                    {
                        id: 'p1',
                        type: 'user',
                        userId: req.user.id,
                        name: '用户',
                        role: 'owner',
                        isActive: true,
                        autoReply: false,
                        replyProbability: 0,
                        joinedAt: new Date().toISOString()
                    },
                    {
                        id: 'p2',
                        type: 'character',
                        characterId: 'char_1',
                        name: '艾莉丝',
                        avatar: '/avatars/alice.png',
                        role: 'member',
                        isActive: true,
                        speakingOrder: 1,
                        autoReply: true,
                        replyProbability: 0.8,
                        joinedAt: new Date().toISOString()
                    },
                    {
                        id: 'p3',
                        type: 'character',
                        characterId: 'char_2',
                        name: '教授',
                        avatar: '/avatars/professor.png',
                        role: 'member',
                        isActive: true,
                        speakingOrder: 2,
                        autoReply: true,
                        replyProbability: 0.6,
                        joinedAt: new Date().toISOString()
                    }
                ],
                settings: {
                    maxParticipants: 10,
                    speakingMode: 'natural',
                    autoModeration: true,
                    allowUserMessages: true,
                    messageDelay: 2000,
                    conversationStyle: 'roleplay',
                    worldInfoIds: ['world_1'],
                    contextSettings: {
                        maxTokens: 2048,
                        includeSystemMessages: true,
                        includeCharacterCards: true,
                        messageHistory: 20
                    }
                },
                lastMessageAt: new Date().toISOString(),
                messageCount: 15,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        res.json({
            success: true,
            groups: sampleGroups,
            total: sampleGroups.length,
            pagination: {
                limit: Number(limit),
                offset: Number(offset),
                hasMore: false
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// 创建新的群组聊天
router.post('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const { name, description, characterIds = [], settings = {} } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: '群组名称不能为空'
            });
        }
        // 默认设置
        const defaultSettings = {
            maxParticipants: 10,
            speakingMode: 'natural',
            autoModeration: true,
            allowUserMessages: true,
            messageDelay: 2000,
            conversationStyle: 'natural',
            worldInfoIds: [],
            contextSettings: {
                maxTokens: 2048,
                includeSystemMessages: true,
                includeCharacterCards: true,
                messageHistory: 20
            }
        };
        // 创建参与者列表（用户 + 角色）
        const participants = [
            {
                id: `p_${Date.now()}`,
                type: 'user',
                userId: req.user.id,
                name: '用户', // TODO: 从用户信息获取
                role: 'owner',
                isActive: true,
                autoReply: false,
                replyProbability: 0,
                joinedAt: new Date().toISOString()
            }
        ];
        // 添加角色参与者
        for (let i = 0; i < characterIds.length; i++) {
            const characterId = characterIds[i];
            // TODO: 从数据库获取角色信息
            participants.push({
                id: `p_${Date.now()}_${i}`,
                type: 'character',
                characterId,
                name: `角色${i + 1}`, // TODO: 实际角色名称
                role: 'member',
                isActive: true,
                speakingOrder: i + 1,
                autoReply: true,
                replyProbability: 0.7,
                joinedAt: new Date().toISOString()
            });
        }
        const newGroup = {
            id: `group_${Date.now()}`,
            name,
            description,
            ownerId: req.user.id,
            participants,
            settings: { ...defaultSettings, ...settings },
            messageCount: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        // TODO: 保存到数据库
        res.json({
            success: true,
            group: newGroup,
            message: '群组聊天创建成功'
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取单个群组聊天详情
router.get('/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        // TODO: 从数据库获取并验证权限
        res.status(404).json({
            success: false,
            message: '群组聊天不存在'
        });
    }
    catch (error) {
        next(error);
    }
});
// 发送群组消息
router.post('/:id/messages', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { content, mentionedParticipants = [] } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: '消息内容不能为空'
            });
        }
        // TODO: 验证群组存在和用户权限
        // TODO: 保存用户消息到数据库
        // 创建用户消息
        const userMessage = {
            id: `msg_${Date.now()}`,
            groupId: id,
            senderId: req.user.id,
            senderType: 'user',
            senderName: '用户', // TODO: 从用户信息获取
            content: content.trim(),
            mentionedParticipants,
            timestamp: new Date().toISOString(),
            messageType: 'text'
        };
        // 通过WebSocket广播消息给群组成员
        server_1.io.to(`group_${id}`).emit('groupMessage', userMessage);
        // 触发AI角色自动回复
        setTimeout(async () => {
            await handleGroupAutoReplies(id, userMessage);
        }, 1000);
        res.json({
            success: true,
            message: userMessage,
            autoRepliesScheduled: true
        });
    }
    catch (error) {
        next(error);
    }
});
// 处理群组自动回复逻辑
async function handleGroupAutoReplies(groupId, triggerMessage) {
    try {
        // TODO: 从数据库获取群组信息和参与者
        // TODO: 根据设置决定哪些角色应该回复
        // 模拟角色回复逻辑
        const characterReplies = [
            {
                characterId: 'char_1',
                name: '艾莉丝',
                replyProbability: 0.8,
                speakingOrder: 1
            },
            {
                characterId: 'char_2',
                name: '教授',
                replyProbability: 0.6,
                speakingOrder: 2
            }
        ];
        for (const char of characterReplies) {
            // 根据概率决定是否回复
            if (Math.random() < char.replyProbability) {
                setTimeout(async () => {
                    try {
                        // 构建上下文消息
                        const contextMessages = [
                            {
                                role: 'system',
                                content: `你正在参与一个群组聊天。你是${char.name}。请根据最近的对话内容做出自然的回应。保持角色特色，避免重复其他人刚说过的内容。`
                            },
                            {
                                role: 'user',
                                content: `最近的消息: "${triggerMessage.content}"`
                            }
                        ];
                        // 调用AI生成回复
                        const aiResponse = await ai_1.aiService.generateChatResponse({
                            model: 'grok-3',
                            messages: contextMessages,
                            maxTokens: 200,
                            temperature: 0.8
                        });
                        if (aiResponse.content) {
                            const aiMessage = {
                                id: `msg_${Date.now()}_${char.characterId}`,
                                groupId,
                                senderId: char.characterId,
                                senderType: 'character',
                                senderName: char.name,
                                content: aiResponse.content,
                                timestamp: new Date().toISOString(),
                                messageType: 'text',
                                tokensUsed: aiResponse.tokensUsed
                            };
                            // 广播AI回复
                            server_1.io.to(`group_${groupId}`).emit('groupMessage', aiMessage);
                            // TODO: 保存到数据库
                        }
                    }
                    catch (error) {
                        console.error(`角色 ${char.name} 自动回复失败:`, error);
                    }
                }, char.speakingOrder * 2000); // 按顺序延迟回复
            }
        }
    }
    catch (error) {
        console.error('处理群组自动回复失败:', error);
    }
}
// 获取群组消息历史
router.get('/:id/messages', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { limit = 50, before, after } = req.query;
        // TODO: 从数据库获取消息历史
        const sampleMessages = [
            {
                id: 'msg_1',
                groupId: id,
                senderId: 'user1',
                senderType: 'user',
                senderName: '用户',
                content: '大家好！欢迎来到魔法学院！',
                timestamp: new Date(Date.now() - 60000).toISOString(),
                messageType: 'text'
            },
            {
                id: 'msg_2',
                groupId: id,
                senderId: 'char_1',
                senderType: 'character',
                senderName: '艾莉丝',
                content: '你好！我是艾莉丝，很高兴认识大家！这里的魔法氛围真是太棒了！',
                timestamp: new Date(Date.now() - 45000).toISOString(),
                messageType: 'text'
            }
        ];
        res.json({
            success: true,
            messages: sampleMessages,
            hasMore: false,
            total: sampleMessages.length
        });
    }
    catch (error) {
        next(error);
    }
});
// 添加角色到群组
router.post('/:id/participants', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { characterId, autoReply = true, replyProbability = 0.7 } = req.body;
        if (!characterId) {
            return res.status(400).json({
                success: false,
                message: '角色ID不能为空'
            });
        }
        // TODO: 验证群组存在、权限和角色存在
        // TODO: 检查是否已经在群组中
        // TODO: 检查群组参与者数量限制
        const newParticipant = {
            id: `p_${Date.now()}`,
            type: 'character',
            characterId,
            name: '新角色', // TODO: 从数据库获取角色名称
            role: 'member',
            isActive: true,
            autoReply,
            replyProbability,
            joinedAt: new Date().toISOString()
        };
        // TODO: 保存到数据库
        // 通知群组成员
        server_1.io.to(`group_${id}`).emit('participantJoined', newParticipant);
        res.json({
            success: true,
            participant: newParticipant,
            message: '角色添加成功'
        });
    }
    catch (error) {
        next(error);
    }
});
// 移除群组参与者
router.delete('/:id/participants/:participantId', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id, participantId } = req.params;
        // TODO: 验证权限和参与者存在
        // TODO: 不能移除群组所有者
        // TODO: 从数据库删除
        // 通知群组成员
        server_1.io.to(`group_${id}`).emit('participantLeft', { participantId });
        res.json({
            success: true,
            message: '参与者移除成功'
        });
    }
    catch (error) {
        next(error);
    }
});
// 更新群组设置
router.put('/:id/settings', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { settings } = req.body;
        // TODO: 验证权限（只有所有者和管理员可以修改设置）
        // TODO: 验证设置参数
        // TODO: 更新数据库
        res.json({
            success: true,
            message: '群组设置更新成功'
        });
    }
    catch (error) {
        next(error);
    }
});
// 启动/停止群组
router.post('/:id/toggle', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        // TODO: 验证权限
        // TODO: 更新群组状态
        res.json({
            success: true,
            message: isActive ? '群组已启动' : '群组已停止'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=groupchat.js.map