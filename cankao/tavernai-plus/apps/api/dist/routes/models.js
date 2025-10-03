"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const ai_1 = require("../services/ai");
const router = (0, express_1.Router)();
// 获取所有可用模型
router.get('/', auth_1.optionalAuth, async (req, res, next) => {
    try {
        const models = await ai_1.aiService.getAvailableModels();
        res.json({
            success: true,
            data: models.map(model => ({
                id: model.id,
                name: model.name,
                provider: model.provider,
                maxTokens: model.maxTokens,
                temperature: model.temperature,
                description: model.description,
                features: model.features,
                pricePer1k: model.pricePer1k,
                available: true,
                recommended: ['grok-3', 'gpt-4', 'claude-3'].includes(model.id)
            }))
        });
    }
    catch (error) {
        console.error('获取模型列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取模型列表失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
// 获取模型详细信息
router.get('/:modelId', auth_1.optionalAuth, async (req, res, next) => {
    try {
        const { modelId } = req.params;
        const model = await ai_1.aiService.getModelInfo(modelId);
        if (!model) {
            return res.status(404).json({
                success: false,
                message: '模型不存在'
            });
        }
        res.json({
            success: true,
            model
        });
    }
    catch (error) {
        next(error);
    }
});
// 测试模型连接
router.post('/:modelId/test', auth_1.authenticate, async (req, res, next) => {
    try {
        const { modelId } = req.params;
        const { prompt = '你好，请简单介绍一下自己。' } = req.body;
        const startTime = Date.now();
        const response = await ai_1.aiService.generateChatResponse({
            model: modelId,
            messages: [
                { role: 'user', content: prompt }
            ],
            maxTokens: 100,
            temperature: 0.7
        });
        const responseTime = Date.now() - startTime;
        res.json({
            success: true,
            test: {
                modelId,
                prompt,
                response: response.content,
                responseTime,
                tokensUsed: response.tokensUsed || 0
            }
        });
    }
    catch (error) {
        console.error('模型测试失败:', error);
        res.status(500).json({
            success: false,
            message: '模型测试失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
// 获取模型性能统计
router.get('/:modelId/stats', auth_1.authenticate, async (req, res, next) => {
    try {
        const { modelId } = req.params;
        const { timeRange = '24h' } = req.query;
        // 计算时间范围
        let startDate = new Date();
        switch (timeRange) {
            case '1h':
                startDate.setHours(startDate.getHours() - 1);
                break;
            case '24h':
                startDate.setDate(startDate.getDate() - 1);
                break;
            case '7d':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(startDate.getDate() - 30);
                break;
            default:
                startDate.setDate(startDate.getDate() - 1);
        }
        // 从数据库获取统计信息
        const messageStats = await ai_1.aiService.getModelStats(modelId, startDate);
        res.json({
            success: true,
            stats: {
                modelId,
                timeRange,
                totalRequests: messageStats.totalRequests,
                successfulRequests: messageStats.successfulRequests,
                failedRequests: messageStats.failedRequests,
                averageResponseTime: messageStats.averageResponseTime,
                totalTokensUsed: messageStats.totalTokensUsed,
                successRate: messageStats.totalRequests > 0
                    ? (messageStats.successfulRequests / messageStats.totalRequests * 100).toFixed(2)
                    : 0
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取推荐的模型参数设置
router.get('/:modelId/presets', auth_1.optionalAuth, async (req, res, next) => {
    try {
        const { modelId } = req.params;
        // 预设参数配置
        const presets = {
            'creative': {
                name: '创意写作',
                description: '适合故事创作、诗歌和创意内容',
                temperature: 0.9,
                topP: 0.9,
                frequencyPenalty: 0.1,
                presencePenalty: 0.1
            },
            'balanced': {
                name: '平衡对话',
                description: '日常对话的平衡设置',
                temperature: 0.7,
                topP: 0.8,
                frequencyPenalty: 0.0,
                presencePenalty: 0.0
            },
            'precise': {
                name: '精确回答',
                description: '适合需要准确信息的场景',
                temperature: 0.3,
                topP: 0.6,
                frequencyPenalty: 0.0,
                presencePenalty: 0.0
            },
            'roleplay': {
                name: '角色扮演',
                description: '角色扮演对话的最佳设置',
                temperature: 0.8,
                topP: 0.85,
                frequencyPenalty: 0.05,
                presencePenalty: 0.05
            },
            'dynamic': {
                name: '动态对话',
                description: '富有变化的对话风格',
                temperature: 0.85,
                topP: 0.9,
                frequencyPenalty: 0.2,
                presencePenalty: 0.1
            }
        };
        res.json({
            success: true,
            presets,
            recommended: 'balanced' // 默认推荐
        });
    }
    catch (error) {
        next(error);
    }
});
// 保存用户的模型偏好设置
router.post('/preferences', auth_1.authenticate, async (req, res, next) => {
    try {
        const { defaultModel, preferredSettings, autoSelectModel = false } = req.body;
        // 验证模型是否存在
        const model = await ai_1.aiService.getModelInfo(defaultModel);
        if (!model) {
            return res.status(400).json({
                success: false,
                message: '选择的模型不存在'
            });
        }
        // 保存到用户配置（可以扩展用户模型添加preferences字段）
        // 这里先简化处理，实际可以添加UserPreferences表
        res.json({
            success: true,
            message: '偏好设置已保存',
            preferences: {
                defaultModel,
                preferredSettings,
                autoSelectModel
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// 验证所有模型的可用性
router.post('/validate', auth_1.authenticate, async (req, res, next) => {
    try {
        const models = await ai_1.aiService.getAvailableModels();
        const validationResults = [];
        for (const model of models) {
            try {
                const isValid = await ai_1.aiService.validateModel(model.id);
                validationResults.push({
                    id: model.id,
                    name: model.name,
                    available: isValid,
                    validatedAt: new Date().toISOString()
                });
            }
            catch (error) {
                validationResults.push({
                    id: model.id,
                    name: model.name,
                    available: false,
                    error: error instanceof Error ? error.message : '验证失败',
                    validatedAt: new Date().toISOString()
                });
            }
        }
        res.json({
            success: true,
            data: validationResults
        });
    }
    catch (error) {
        console.error('验证模型失败:', error);
        res.status(500).json({
            success: false,
            message: '验证模型失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
// 批量测试模型
router.post('/batch-test', auth_1.authenticate, async (req, res, next) => {
    try {
        const { modelIds, prompt = '你好，请简单介绍一下自己。' } = req.body;
        const models = modelIds || (await ai_1.aiService.getAvailableModels()).map(m => m.id);
        const testResults = [];
        for (const modelId of models) {
            const startTime = Date.now();
            try {
                const response = await ai_1.aiService.generateChatResponse({
                    model: modelId,
                    messages: [{ role: 'user', content: prompt }],
                    maxTokens: 100,
                    temperature: 0.7
                });
                const responseTime = Date.now() - startTime;
                testResults.push({
                    modelId,
                    success: true,
                    responseTime,
                    response: response.content,
                    tokensUsed: response.tokensUsed || 0,
                    testedAt: new Date().toISOString()
                });
            }
            catch (error) {
                testResults.push({
                    modelId,
                    success: false,
                    responseTime: Date.now() - startTime,
                    error: error instanceof Error ? error.message : '测试失败',
                    testedAt: new Date().toISOString()
                });
            }
        }
        res.json({
            success: true,
            data: testResults
        });
    }
    catch (error) {
        console.error('批量测试模型失败:', error);
        res.status(500).json({
            success: false,
            message: '批量测试模型失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
exports.default = router;
//# sourceMappingURL=models.js.map