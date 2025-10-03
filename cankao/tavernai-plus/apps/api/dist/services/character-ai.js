"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterAIService = void 0;
const { PrismaClient } = require('../../node_modules/.prisma/client');
const logger_1 = require("./logger");
const ai_1 = require("./ai");
const prisma = new PrismaClient();
/**
 * AI角色个性化服务
 * 专门处理角色的个性化回复和上下文管理
 */
class CharacterAIService {
    /**
     * 生成角色个性化回复
     */
    static async generateCharacterResponse(request) {
        try {
            // 获取角色信息
            const character = await this.getCharacterPersonality(request.characterId);
            if (!character) {
                throw new Error('角色不存在');
            }
            // 构建上下文消息
            const contextMessages = await this.buildContextMessages(character, request.messages, request.contextLength || 20);
            // 构建系统提示词
            const systemPrompt = this.buildSystemPrompt(character, request.trigger);
            // 准备API请求
            const messages = [
                { role: 'system', content: systemPrompt },
                ...contextMessages.map(msg => ({
                    role: (msg.role === 'system' ? 'system' : (msg.characterId ? 'assistant' : 'user')),
                    content: msg.content
                }))
            ];
            // 调用AI服务
            const response = await ai_1.aiService.generateChatResponse({
                sessionId: request.roomId, // 使用roomId作为sessionId
                userId: request.userId,
                characterId: request.characterId,
                model: character.model || 'grok-3',
                messages,
                temperature: character.temperature || 0.8,
                maxTokens: character.maxTokens || 1000
            });
            if (response.content) {
                // 应用角色说话风格后处理
                const styledResponse = this.applyCharacterStyle(response.content, character);
                logger_1.logger.info('Character AI response generated', {
                    characterId: request.characterId,
                    roomId: request.roomId,
                    contentLength: styledResponse.length,
                    model: character.model
                });
                return styledResponse;
            }
            throw new Error('AI生成回复失败');
        }
        catch (error) {
            logger_1.logger.error('Failed to generate character response', { error, request });
            throw error;
        }
    }
    /**
     * 获取角色个性化信息
     */
    static async getCharacterPersonality(characterId) {
        try {
            const character = await prisma.character.findUnique({
                where: { id: characterId },
                select: {
                    id: true,
                    name: true,
                    personality: true,
                    systemPrompt: true,
                    speakingStyle: true,
                    backstory: true,
                    exampleDialogs: true,
                    model: true,
                    temperature: true,
                    maxTokens: true
                }
            });
            if (!character) {
                return null;
            }
            // 安全地解析exampleDialogs字段
            let exampleDialogs = [];
            if (character.exampleDialogs) {
                try {
                    if (typeof character.exampleDialogs === 'string') {
                        exampleDialogs = JSON.parse(character.exampleDialogs);
                    }
                    else {
                        exampleDialogs = character.exampleDialogs;
                    }
                }
                catch (e) {
                    console.warn('Failed to parse exampleDialogs:', e);
                    exampleDialogs = [];
                }
            }
            return {
                id: character.id,
                name: character.name,
                personality: character.personality || '',
                systemPrompt: character.systemPrompt || '',
                speakingStyle: character.speakingStyle || '',
                backstory: character.backstory || '',
                exampleDialogs,
                model: character.model || 'grok-3',
                temperature: character.temperature || 0.8,
                maxTokens: character.maxTokens || 1000
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get character personality', { error, characterId });
            throw error;
        }
    }
    /**
     * 构建上下文消息
     */
    static async buildContextMessages(character, messages, contextLength) {
        // 取最近的消息作为上下文
        const recentMessages = messages.slice(-contextLength);
        // 如果有示例对话，添加到上下文前面
        const contextMessages = [];
        if (character.exampleDialogs && character.exampleDialogs.length > 0) {
            character.exampleDialogs.forEach((example, index) => {
                if (index < 3) { // 最多包含3个示例
                    contextMessages.push({ role: 'user', content: example.user }, { role: 'assistant', content: example.character, characterId: character.id });
                }
            });
            // 添加分隔符
            contextMessages.push({
                role: 'system',
                content: '--- 以下是当前对话 ---'
            });
        }
        // 添加最近的消息
        contextMessages.push(...recentMessages);
        return contextMessages;
    }
    /**
     * 构建系统提示词
     */
    static buildSystemPrompt(character, trigger) {
        let prompt = `你是${character.name}。`;
        // 添加基础个性描述
        if (character.personality) {
            prompt += `\n\n性格特点：${character.personality}`;
        }
        // 添加背景故事
        if (character.backstory) {
            prompt += `\n\n背景故事：${character.backstory}`;
        }
        // 添加说话风格
        if (character.speakingStyle) {
            prompt += `\n\n说话风格：${character.speakingStyle}`;
        }
        // 添加系统提示词
        if (character.systemPrompt) {
            prompt += `\n\n${character.systemPrompt}`;
        }
        // 添加基本行为指南
        prompt += `\n\n请以${character.name}的身份回复，保持角色一致性。回复要自然、生动，符合角色的性格特点。`;
        // 如果有触发词，添加相关指导
        if (trigger) {
            prompt += `\n\n当前触发词：${trigger}\n请结合这个触发词来回复。`;
        }
        return prompt;
    }
    /**
     * 应用角色说话风格后处理
     */
    static applyCharacterStyle(content, character) {
        let styledContent = content;
        // 确保回复以第一人称进行
        if (styledContent.includes(`${character.name}说`) || styledContent.includes(`${character.name}：`)) {
            styledContent = styledContent
                .replace(new RegExp(`${character.name}说[:：]?`, 'g'), '')
                .replace(new RegExp(`${character.name}[:：]`, 'g'), '')
                .trim();
        }
        // 移除多余的引号
        styledContent = styledContent.replace(/^["「]|["」]$/g, '');
        // 确保自然的语言流畅度
        styledContent = styledContent.trim();
        return styledContent;
    }
    /**
     * 分析角色对话模式
     */
    static async analyzeCharacterPattern(characterId, roomId) {
        try {
            // 获取角色最近的对话记录
            const whereClause = { characterId };
            if (roomId) {
                whereClause.roomId = roomId;
            }
            const recentMessages = await prisma.chatMessage.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                take: 50,
                select: {
                    content: true,
                    createdAt: true,
                    tokens: true
                }
            });
            if (recentMessages.length === 0) {
                return {
                    messageCount: 0,
                    avgLength: 0,
                    avgTokens: 0,
                    commonPhrases: [],
                    activityPattern: {}
                };
            }
            // 计算统计数据
            const totalTokens = recentMessages.reduce((sum, msg) => sum + msg.tokens, 0);
            const totalLength = recentMessages.reduce((sum, msg) => sum + msg.content.length, 0);
            // 分析常用短语（简单实现）
            const allText = recentMessages.map((msg) => msg.content).join(' ');
            const words = allText.split(/\s+/);
            const wordFreq = words.reduce((freq, word) => {
                freq[word] = (freq[word] || 0) + 1;
                return freq;
            }, {});
            const commonWords = Object.entries(wordFreq)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([word]) => word);
            // 分析活跃时间模式
            const hourCounts = recentMessages.reduce((counts, msg) => {
                const hour = new Date(msg.createdAt).getHours();
                counts[hour] = (counts[hour] || 0) + 1;
                return counts;
            }, {});
            return {
                messageCount: recentMessages.length,
                avgLength: Math.round(totalLength / recentMessages.length),
                avgTokens: Math.round(totalTokens / recentMessages.length),
                commonPhrases: commonWords,
                activityPattern: hourCounts,
                lastActive: recentMessages[0].createdAt
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to analyze character pattern', { error, characterId, roomId });
            throw error;
        }
    }
    /**
     * 获取角色推荐回复
     */
    static async getCharacterSuggestions(characterId, context, count = 3) {
        try {
            const character = await this.getCharacterPersonality(characterId);
            if (!character) {
                throw new Error('角色不存在');
            }
            const suggestions = [];
            // 基于上下文和角色性格生成多个候选回复
            for (let i = 0; i < count; i++) {
                const prompt = this.buildSystemPrompt(character) +
                    `\n\n当前对话上下文：${context}` +
                    `\n\n请生成一个简短的回复建议（10-30字）。这是第${i + 1}个建议，请与其他建议有所不同。`;
                const response = await ai_1.aiService.generateChatResponse({
                    sessionId: `suggestion-${characterId}-${Date.now()}`, // 生成临时session ID
                    userId: 'system', // 系统生成的建议
                    characterId: characterId,
                    model: character.model || 'grok-3',
                    messages: [{ role: 'system', content: prompt }],
                    temperature: 0.9 + (i * 0.1), // 增加随机性以获得不同建议
                    maxTokens: 50
                });
                if (response.content) {
                    const suggestion = this.applyCharacterStyle(response.content, character);
                    suggestions.push(suggestion);
                }
            }
            return suggestions.filter(s => s.length > 0);
        }
        catch (error) {
            logger_1.logger.error('Failed to get character suggestions', { error, characterId });
            return [];
        }
    }
    /**
     * 更新角色学习数据
     */
    static async updateCharacterLearning(characterId, interaction) {
        try {
            // 这里可以实现角色学习逻辑
            // 比如保存成功的对话模式，调整回复风格等
            logger_1.logger.info('Character learning data updated', {
                characterId,
                feedback: interaction.feedback,
                responseLength: interaction.characterResponse.length
            });
            // TODO: 实现角色学习算法
            // 1. 分析用户反馈
            // 2. 调整角色参数
            // 3. 优化回复模式
        }
        catch (error) {
            logger_1.logger.error('Failed to update character learning', { error, characterId });
        }
    }
    /**
     * 获取角色适应度指标
     */
    static async getCharacterMetrics(characterId) {
        try {
            // 计算角色的各种指标
            const metrics = {
                responseCount: 0,
                avgResponseTime: 0,
                userSatisfaction: 0,
                contextRelevance: 0,
                personalityConsistency: 0
            };
            // 获取角色的使用统计
            const messageCount = await prisma.chatMessage.count({
                where: { characterId }
            });
            const avgTokens = await prisma.chatMessage.aggregate({
                where: { characterId },
                _avg: { tokens: true }
            });
            metrics.responseCount = messageCount;
            // TODO: 实现其他指标的计算
            return metrics;
        }
        catch (error) {
            logger_1.logger.error('Failed to get character metrics', { error, characterId });
            throw error;
        }
    }
}
exports.CharacterAIService = CharacterAIService;
exports.default = CharacterAIService;
//# sourceMappingURL=character-ai.js.map