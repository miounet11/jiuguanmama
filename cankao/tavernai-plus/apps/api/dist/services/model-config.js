"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelConfigService = exports.DEFAULT_MODELS = exports.ModelProvider = void 0;
// 模型提供商枚举
var ModelProvider;
(function (ModelProvider) {
    ModelProvider["OPENAI"] = "openai";
    ModelProvider["ANTHROPIC"] = "anthropic";
    ModelProvider["GOOGLE"] = "google";
    ModelProvider["DEEPSEEK"] = "deepseek";
    ModelProvider["MOONSHOT"] = "moonshot";
    ModelProvider["BAIDU"] = "baidu";
    ModelProvider["ALIBABA"] = "alibaba";
    ModelProvider["CUSTOM"] = "custom";
})(ModelProvider || (exports.ModelProvider = ModelProvider = {}));
// 预定义模型配置
exports.DEFAULT_MODELS = [
    // OpenAI 模型
    {
        id: 'gpt-4-turbo',
        name: 'gpt-4-turbo-preview',
        displayName: 'GPT-4 Turbo',
        provider: ModelProvider.OPENAI,
        model: 'gpt-4-turbo-preview',
        contextLength: 128000,
        maxTokens: 4096,
        temperature: {
            default: 0.7,
            min: 0,
            max: 2
        },
        pricing: {
            input: 0.01,
            output: 0.03,
            currency: 'USD'
        },
        features: {
            streaming: true,
            functionCalling: true,
            vision: true,
            audio: false,
            plugins: true
        },
        enabled: true,
        priority: 10
    },
    {
        id: 'gpt-4',
        name: 'gpt-4',
        displayName: 'GPT-4',
        provider: ModelProvider.OPENAI,
        model: 'gpt-4',
        contextLength: 8192,
        maxTokens: 4096,
        temperature: {
            default: 0.7,
            min: 0,
            max: 2
        },
        pricing: {
            input: 0.03,
            output: 0.06,
            currency: 'USD'
        },
        features: {
            streaming: true,
            functionCalling: true,
            vision: false,
            audio: false,
            plugins: true
        },
        enabled: true,
        priority: 9
    },
    {
        id: 'gpt-3.5-turbo',
        name: 'gpt-3.5-turbo',
        displayName: 'GPT-3.5 Turbo',
        provider: ModelProvider.OPENAI,
        model: 'gpt-3.5-turbo',
        contextLength: 16384,
        maxTokens: 4096,
        temperature: {
            default: 0.7,
            min: 0,
            max: 2
        },
        pricing: {
            input: 0.0005,
            output: 0.0015,
            currency: 'USD'
        },
        features: {
            streaming: true,
            functionCalling: true,
            vision: false,
            audio: false,
            plugins: true
        },
        enabled: true,
        priority: 5
    },
    // Anthropic 模型
    {
        id: 'claude-3-opus',
        name: 'claude-3-opus',
        displayName: 'Claude 3 Opus',
        provider: ModelProvider.ANTHROPIC,
        model: 'claude-3-opus-20240229',
        contextLength: 200000,
        maxTokens: 4096,
        temperature: {
            default: 0.7,
            min: 0,
            max: 1
        },
        pricing: {
            input: 0.015,
            output: 0.075,
            currency: 'USD'
        },
        features: {
            streaming: true,
            functionCalling: true,
            vision: true,
            audio: false,
            plugins: false
        },
        enabled: true,
        priority: 10
    },
    {
        id: 'claude-3-sonnet',
        name: 'claude-3-sonnet',
        displayName: 'Claude 3 Sonnet',
        provider: ModelProvider.ANTHROPIC,
        model: 'claude-3-sonnet-20240229',
        contextLength: 200000,
        maxTokens: 4096,
        temperature: {
            default: 0.7,
            min: 0,
            max: 1
        },
        pricing: {
            input: 0.003,
            output: 0.015,
            currency: 'USD'
        },
        features: {
            streaming: true,
            functionCalling: true,
            vision: true,
            audio: false,
            plugins: false
        },
        enabled: true,
        priority: 8
    },
    // Google 模型
    {
        id: 'gemini-pro',
        name: 'gemini-pro',
        displayName: 'Gemini Pro',
        provider: ModelProvider.GOOGLE,
        model: 'gemini-pro',
        contextLength: 32768,
        maxTokens: 2048,
        temperature: {
            default: 0.7,
            min: 0,
            max: 1
        },
        pricing: {
            input: 0.0005,
            output: 0.0015,
            currency: 'USD'
        },
        features: {
            streaming: true,
            functionCalling: true,
            vision: false,
            audio: false,
            plugins: false
        },
        enabled: true,
        priority: 7
    },
    {
        id: 'gemini-pro-vision',
        name: 'gemini-pro-vision',
        displayName: 'Gemini Pro Vision',
        provider: ModelProvider.GOOGLE,
        model: 'gemini-pro-vision',
        contextLength: 32768,
        maxTokens: 2048,
        temperature: {
            default: 0.7,
            min: 0,
            max: 1
        },
        pricing: {
            input: 0.0005,
            output: 0.0015,
            currency: 'USD'
        },
        features: {
            streaming: true,
            functionCalling: false,
            vision: true,
            audio: false,
            plugins: false
        },
        enabled: true,
        priority: 7
    },
    // DeepSeek 模型
    {
        id: 'deepseek-chat',
        name: 'deepseek-chat',
        displayName: 'DeepSeek Chat',
        provider: ModelProvider.DEEPSEEK,
        model: 'deepseek-chat',
        contextLength: 32768,
        maxTokens: 4096,
        temperature: {
            default: 0.7,
            min: 0,
            max: 2
        },
        pricing: {
            input: 0.0001,
            output: 0.0002,
            currency: 'USD'
        },
        features: {
            streaming: true,
            functionCalling: true,
            vision: false,
            audio: false,
            plugins: false
        },
        enabled: true,
        priority: 6
    },
    // Moonshot 模型
    {
        id: 'moonshot-v1-128k',
        name: 'moonshot-v1-128k',
        displayName: 'Moonshot 128K',
        provider: ModelProvider.MOONSHOT,
        model: 'moonshot-v1-128k',
        contextLength: 128000,
        maxTokens: 4096,
        temperature: {
            default: 0.7,
            min: 0,
            max: 1
        },
        pricing: {
            input: 0.006,
            output: 0.012,
            currency: 'CNY'
        },
        features: {
            streaming: true,
            functionCalling: true,
            vision: false,
            audio: false,
            plugins: false
        },
        enabled: true,
        priority: 6
    }
];
class ModelConfigService {
    models = new Map();
    providerEndpoints = new Map([
        [ModelProvider.OPENAI, 'https://api.openai.com/v1'],
        [ModelProvider.ANTHROPIC, 'https://api.anthropic.com/v1'],
        [ModelProvider.GOOGLE, 'https://generativelanguage.googleapis.com/v1'],
        [ModelProvider.DEEPSEEK, 'https://api.deepseek.com/v1'],
        [ModelProvider.MOONSHOT, 'https://api.moonshot.cn/v1'],
        [ModelProvider.BAIDU, 'https://aip.baidubce.com'],
        [ModelProvider.ALIBABA, 'https://dashscope.aliyuncs.com/api/v1']
    ]);
    constructor() {
        this.loadDefaultModels();
        this.loadCustomModels();
    }
    // 加载默认模型
    loadDefaultModels() {
        exports.DEFAULT_MODELS.forEach(model => {
            this.models.set(model.id, model);
        });
        console.log(`✅ 加载了 ${exports.DEFAULT_MODELS.length} 个默认模型配置`);
    }
    // 从数据库加载自定义模型
    async loadCustomModels() {
        try {
            // 这里可以从数据库加载用户自定义的模型配置
            // const customModels = await prisma.modelConfig.findMany()
            // customModels.forEach(model => {
            //   this.models.set(model.id, model)
            // })
        }
        catch (error) {
            console.error('加载自定义模型失败:', error);
        }
    }
    // 获取所有可用模型
    getAvailableModels(userId) {
        const models = Array.from(this.models.values())
            .filter(m => m.enabled)
            .sort((a, b) => b.priority - a.priority);
        // 根据用户权限过滤模型
        if (userId) {
            // TODO: 实现基于用户订阅级别的模型过滤
        }
        return models;
    }
    // 获取特定模型配置
    getModel(modelId) {
        return this.models.get(modelId) || null;
    }
    // 根据提供商获取模型
    getModelsByProvider(provider) {
        return Array.from(this.models.values())
            .filter(m => m.provider === provider && m.enabled);
    }
    // 添加或更新模型配置
    async upsertModel(config) {
        this.models.set(config.id, config);
        // TODO: 保存到数据库
        // await prisma.modelConfig.upsert({
        //   where: { id: config.id },
        //   update: config,
        //   create: config
        // })
    }
    // 删除模型配置
    async deleteModel(modelId) {
        this.models.delete(modelId);
        // TODO: 从数据库删除
        // await prisma.modelConfig.delete({
        //   where: { id: modelId }
        // })
    }
    // 获取模型端点
    getModelEndpoint(model) {
        if (model.endpoint) {
            return model.endpoint;
        }
        return this.providerEndpoints.get(model.provider) || '';
    }
    // 获取模型 API 密钥
    getModelApiKey(model) {
        if (model.apiKey) {
            return model.apiKey;
        }
        // 从环境变量获取提供商密钥
        const keyMap = {
            [ModelProvider.OPENAI]: process.env.OPENAI_API_KEY,
            [ModelProvider.ANTHROPIC]: process.env.ANTHROPIC_API_KEY,
            [ModelProvider.GOOGLE]: process.env.GOOGLE_AI_API_KEY,
            [ModelProvider.DEEPSEEK]: process.env.DEEPSEEK_API_KEY,
            [ModelProvider.MOONSHOT]: process.env.MOONSHOT_API_KEY,
            [ModelProvider.BAIDU]: process.env.BAIDU_API_KEY,
            [ModelProvider.ALIBABA]: process.env.ALIBABA_API_KEY,
            [ModelProvider.CUSTOM]: process.env.CUSTOM_API_KEY
        };
        return keyMap[model.provider] || '';
    }
    // 计算使用成本
    calculateCost(model, inputTokens, outputTokens) {
        const inputCost = (inputTokens / 1000) * model.pricing.input;
        const outputCost = (outputTokens / 1000) * model.pricing.output;
        return {
            amount: inputCost + outputCost,
            currency: model.pricing.currency
        };
    }
    // 检查速率限制
    checkRateLimit(model, userId, usage) {
        if (!model.rateLimit) {
            return { allowed: true };
        }
        if (usage.rpm >= model.rateLimit.rpm) {
            return { allowed: false, reason: '每分钟请求数超限' };
        }
        if (usage.tpm >= model.rateLimit.tpm) {
            return { allowed: false, reason: '每分钟 tokens 超限' };
        }
        if (usage.rpd >= model.rateLimit.rpd) {
            return { allowed: false, reason: '每日请求数超限' };
        }
        return { allowed: true };
    }
    // 选择最佳模型（基于负载均衡和优先级）
    selectBestModel(requirements, excludeModels = []) {
        const eligibleModels = Array.from(this.models.values())
            .filter(m => {
            if (!m.enabled)
                return false;
            if (excludeModels.includes(m.id))
                return false;
            if (requirements.contextLength && m.contextLength < requirements.contextLength)
                return false;
            if (requirements.vision && !m.features.vision)
                return false;
            if (requirements.streaming && !m.features.streaming)
                return false;
            if (requirements.maxCost && m.pricing.input > requirements.maxCost)
                return false;
            return true;
        })
            .sort((a, b) => {
            // 优先级高的排前面
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            // 价格低的排前面
            return a.pricing.input - b.pricing.input;
        });
        return eligibleModels[0] || null;
    }
    // 获取模型统计信息
    async getModelStats(modelId, timeRange) {
        // TODO: 从数据库获取使用统计
        return {
            totalRequests: 0,
            totalTokens: 0,
            totalCost: 0,
            avgLatency: 0,
            errorRate: 0
        };
    }
}
exports.modelConfigService = new ModelConfigService();
//# sourceMappingURL=model-config.js.map