"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = void 0;
const axios_1 = __importDefault(require("axios"));
const server_1 = require("../server");
// 多模型 LLM 配置 - 从环境变量获取
const NEWAPI_BASE_URL = process.env.NEWAPI_BASE_URL || 'https://ttkk.inping.com/v1';
const NEWAPI_KEY = process.env.NEWAPI_KEY;
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'grok-3';
const DEFAULT_MAX_TOKENS = parseInt(process.env.NEWAPI_MAX_TOKENS || '4000');
const DEFAULT_TEMPERATURE = parseFloat(process.env.NEWAPI_TEMPERATURE || '0.7');
const SUPPORTED_MODELS = {
    'grok-3': {
        id: 'grok-3',
        name: 'Grok-3',
        provider: 'newapi',
        baseUrl: NEWAPI_BASE_URL,
        apiKey: NEWAPI_KEY,
        maxTokens: 4000,
        temperature: 0.7,
        description: '强大的对话模型，擅长创意写作和复杂推理',
        features: ['对话', '创意写作', '代码生成', '逻辑推理'],
        pricePer1k: 0.01
    },
    'gpt-4': {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'newapi',
        baseUrl: NEWAPI_BASE_URL,
        apiKey: NEWAPI_KEY,
        maxTokens: 8000,
        temperature: 0.7,
        description: 'OpenAI 最强大的模型，适合复杂任务',
        features: ['对话', '分析', '创作', '编程', '推理'],
        pricePer1k: 0.03
    },
    'gpt-3.5-turbo': {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'newapi',
        baseUrl: NEWAPI_BASE_URL,
        apiKey: NEWAPI_KEY,
        maxTokens: 4000,
        temperature: 0.7,
        description: '快速响应，成本较低的对话模型',
        features: ['对话', '文本生成', '总结'],
        pricePer1k: 0.002
    },
    'claude-3': {
        id: 'claude-3',
        name: 'Claude 3',
        provider: 'newapi',
        baseUrl: NEWAPI_BASE_URL,
        apiKey: NEWAPI_KEY,
        maxTokens: 4000,
        temperature: 0.7,
        description: 'Anthropic 的安全可靠对话模型',
        features: ['对话', '分析', '安全回复'],
        pricePer1k: 0.015
    },
    'gemini-pro': {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'newapi',
        baseUrl: NEWAPI_BASE_URL,
        apiKey: NEWAPI_KEY,
        maxTokens: 2048,
        temperature: 0.7,
        description: 'Google 的多模态模型，支持文本和图像',
        features: ['对话', '多模态', '分析'],
        pricePer1k: 0.001
    }
};
// 连接稳定性配置
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000, // 1秒
    maxDelay: 10000, // 10秒
    backoffMultiplier: 2
};
const CONNECTION_POOL_CONFIG = {
    maxConnections: 10,
    timeout: 30000, // 30秒超时
    keepAlive: true,
    keepAliveMsecs: 60000 // 60秒keep-alive
};
// 验证关键配置
if (!NEWAPI_KEY) {
    console.error('❌ 错误: NEWAPI_KEY 未配置，AI服务将不可用');
}
else {
    console.log('✅ Grok-3 LLM 配置已加载');
    console.log(`   Base URL: ${NEWAPI_BASE_URL}`);
    console.log(`   Model: ${DEFAULT_MODEL}`);
    console.log(`   Max Tokens: ${DEFAULT_MAX_TOKENS}`);
    console.log(`   Temperature: ${DEFAULT_TEMPERATURE}`);
    console.log(`   Retry Config: ${RETRY_CONFIG.maxRetries} retries, ${RETRY_CONFIG.baseDelay}ms base delay`);
}
// 指数退避延迟计算
const calculateDelay = (attempt) => {
    const delay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
    return Math.min(delay, RETRY_CONFIG.maxDelay);
};
// 延迟函数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
// 重试包装器
async function withRetry(operation, context = 'AI Service') {
    let lastError = null;
    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
        try {
            const result = await operation();
            if (attempt > 0) {
                console.log(`✅ ${context}: 重试成功 (第 ${attempt + 1} 次尝试)`);
            }
            return result;
        }
        catch (error) {
            lastError = error;
            const isRetriable = error.code === 'ECONNRESET' ||
                error.code === 'ECONNREFUSED' ||
                error.code === 'ETIMEDOUT' ||
                error.code === 'ENOTFOUND' ||
                (error.response?.status >= 500 && error.response?.status < 600) ||
                error.response?.status === 429; // Rate limit
            if (!isRetriable || attempt === RETRY_CONFIG.maxRetries) {
                console.error(`❌ ${context}: 操作失败 (第 ${attempt + 1} 次尝试)`, {
                    error: error.message,
                    code: error.code,
                    status: error.response?.status
                });
                break;
            }
            const delay = calculateDelay(attempt);
            console.warn(`⚠️ ${context}: 第 ${attempt + 1} 次尝试失败，${delay}ms 后重试`, {
                error: error.message,
                nextRetryIn: `${delay}ms`
            });
            await sleep(delay);
        }
    }
    throw lastError || new Error(`${context}: 操作失败`);
}
// 创建连接池优化的 axios 实例
const aiClient = axios_1.default.create({
    baseURL: NEWAPI_BASE_URL,
    headers: {
        'Authorization': `Bearer ${NEWAPI_KEY}`,
        'Content-Type': 'application/json',
        'Connection': 'keep-alive'
    },
    timeout: CONNECTION_POOL_CONFIG.timeout,
    maxRedirects: 3,
    // 连接池配置
    httpAgent: new (require('http').Agent)({
        keepAlive: CONNECTION_POOL_CONFIG.keepAlive,
        keepAliveMsecs: CONNECTION_POOL_CONFIG.keepAliveMsecs,
        maxSockets: CONNECTION_POOL_CONFIG.maxConnections,
        timeout: CONNECTION_POOL_CONFIG.timeout
    }),
    httpsAgent: new (require('https').Agent)({
        keepAlive: CONNECTION_POOL_CONFIG.keepAlive,
        keepAliveMsecs: CONNECTION_POOL_CONFIG.keepAliveMsecs,
        maxSockets: CONNECTION_POOL_CONFIG.maxConnections,
        timeout: CONNECTION_POOL_CONFIG.timeout
    })
});
// 请求拦截器 - 添加请求ID和日志
aiClient.interceptors.request.use((config) => {
    const requestId = Math.random().toString(36).substr(2, 9);
    config.headers['X-Request-ID'] = requestId;
    console.log(`🚀 AI API 请求 [${requestId}]:`, {
        method: config.method?.toUpperCase(),
        url: config.url,
        timeout: config.timeout
    });
    return config;
}, (error) => {
    console.error('❌ AI API 请求配置错误:', error.message);
    return Promise.reject(error);
});
// 响应拦截器 - 错误处理和日志
aiClient.interceptors.response.use((response) => {
    const requestId = response.config.headers['X-Request-ID'];
    console.log(`✅ AI API 响应 [${requestId}]:`, {
        status: response.status,
        model: response.data.model,
        usage: response.data.usage
    });
    return response;
}, (error) => {
    const requestId = error.config?.headers?.['X-Request-ID'] || 'unknown';
    if (error.response) {
        console.error(`❌ AI API 错误响应 [${requestId}]:`, {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
        });
    }
    else if (error.request) {
        console.error(`❌ AI API 网络错误 [${requestId}]:`, {
            code: error.code,
            message: error.message
        });
    }
    else {
        console.error(`❌ AI API 配置错误 [${requestId}]:`, error.message);
    }
    return Promise.reject(error);
});
class AIService {
    // 获取支持的模型列表
    getSupportedModels() {
        return Object.values(SUPPORTED_MODELS);
    }
    // 获取特定模型配置
    getModelConfig(modelId) {
        return SUPPORTED_MODELS[modelId] || null;
    }
    // 验证模型是否可用
    async validateModel(modelId) {
        const config = this.getModelConfig(modelId);
        if (!config)
            return false;
        try {
            // 创建针对特定模型的客户端
            const client = this.createModelClient(config);
            // 发送测试请求
            const response = await client.post('/chat/completions', {
                model: modelId,
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 1,
                temperature: 0
            });
            return response.status === 200;
        }
        catch (error) {
            console.error(`模型 ${modelId} 验证失败:`, error);
            return false;
        }
    }
    // 创建模型专用客户端
    createModelClient(config) {
        return axios_1.default.create({
            baseURL: config.baseUrl || NEWAPI_BASE_URL,
            headers: {
                'Authorization': `Bearer ${config.apiKey || NEWAPI_KEY}`,
                'Content-Type': 'application/json',
                'Connection': 'keep-alive'
            },
            timeout: CONNECTION_POOL_CONFIG.timeout,
            maxRedirects: 3,
            httpAgent: new (require('http').Agent)({
                keepAlive: CONNECTION_POOL_CONFIG.keepAlive,
                keepAliveMsecs: CONNECTION_POOL_CONFIG.keepAliveMsecs,
                maxSockets: CONNECTION_POOL_CONFIG.maxConnections,
                timeout: CONNECTION_POOL_CONFIG.timeout
            }),
            httpsAgent: new (require('https').Agent)({
                keepAlive: CONNECTION_POOL_CONFIG.keepAlive,
                keepAliveMsecs: CONNECTION_POOL_CONFIG.keepAliveMsecs,
                maxSockets: CONNECTION_POOL_CONFIG.maxConnections,
                timeout: CONNECTION_POOL_CONFIG.timeout
            })
        });
    }
    // 生成聊天回复（带重试机制和多模型支持）
    async generateChatResponse(options) {
        const { sessionId, userId, characterId, messages, model = DEFAULT_MODEL, temperature = DEFAULT_TEMPERATURE, maxTokens = DEFAULT_MAX_TOKENS, stream = true } = options;
        return await withRetry(async () => {
            // 获取角色信息来构建系统提示
            let systemPrompt = '你是一个友好的AI助手。';
            if (characterId) {
                const character = await server_1.prisma.character.findUnique({
                    where: { id: characterId }
                });
                if (character) {
                    systemPrompt = this.buildCharacterPrompt(character);
                }
            }
            // 构建消息列表
            const apiMessages = [
                { role: 'system', content: systemPrompt },
                ...messages
            ];
            // 调用 NewAPI
            const response = await aiClient.post('/chat/completions', {
                model,
                messages: apiMessages,
                temperature,
                max_tokens: maxTokens,
                stream
            });
            if (stream) {
                // 返回流式响应
                return response.data;
            }
            else {
                // 返回完整响应
                const content = response.data.choices[0]?.message?.content || '';
                // 如果内容为空，则抛出错误重试
                if (!content.trim()) {
                    throw new Error('AI 返回空响应');
                }
                return {
                    content,
                    model: response.data.model,
                    usage: response.data.usage
                };
            }
        }, `AI 聊天生成 (${model})`);
    }
    // 流式生成聊天回复
    async *generateChatStream(options) {
        const { sessionId, userId, characterId, messages, model = DEFAULT_MODEL, temperature = DEFAULT_TEMPERATURE, maxTokens = DEFAULT_MAX_TOKENS } = options;
        try {
            // 获取角色信息
            let systemPrompt = '你是一个友好的AI助手。';
            if (characterId) {
                const character = await server_1.prisma.character.findUnique({
                    where: { id: characterId }
                });
                if (character) {
                    systemPrompt = this.buildCharacterPrompt(character);
                }
            }
            // 构建消息列表
            const apiMessages = [
                { role: 'system', content: systemPrompt },
                ...messages
            ];
            // 调用 NewAPI 流式接口
            const response = await aiClient.post('/chat/completions', {
                model,
                messages: apiMessages,
                temperature,
                max_tokens: maxTokens,
                stream: true
            }, {
                responseType: 'stream'
            });
            // 处理流式响应
            const stream = response.data;
            let buffer = '';
            for await (const chunk of stream) {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices[0]?.delta?.content;
                            if (content) {
                                yield content;
                            }
                        }
                        catch (e) {
                            console.error('解析流数据失败:', e);
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('流式生成失败:', error);
            throw new Error('流式生成失败: ' + error.message);
        }
    }
    // 构建角色提示词
    buildCharacterPrompt(character) {
        let prompt = `你是${character.name}。`;
        if (character.description) {
            prompt += `\n\n角色描述：${character.description}`;
        }
        if (character.personality) {
            prompt += `\n\n性格特征：${character.personality}`;
        }
        if (character.backstory) {
            prompt += `\n\n背景故事：${character.backstory}`;
        }
        if (character.speakingStyle) {
            prompt += `\n\n说话风格：${character.speakingStyle}`;
        }
        if (character.systemPrompt) {
            prompt += `\n\n${character.systemPrompt}`;
        }
        prompt += '\n\n请根据以上角色设定进行对话，保持角色的一致性。';
        return prompt;
    }
    // 生成角色设定（带重试机制）
    async generateCharacterProfile(name, tags = []) {
        return await withRetry(async () => {
            const prompt = `请为一个名为"${name}"的AI角色生成详细的角色设定。
标签：${tags.join('、') || '无特定标签'}

请生成以下内容：
1. 角色描述（50-100字）
2. 性格特征（30-50字）
3. 背景故事（100-200字）
4. 说话风格（30-50字）
5. 初始消息（一句友好的问候）

请以JSON格式返回，包含以下字段：
- description
- personality
- backstory
- speakingStyle
- firstMessage`;
            const response = await aiClient.post('/chat/completions', {
                model: DEFAULT_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的角色设计师，擅长创建有趣且独特的AI角色。请直接返回JSON格式的内容，不要包含任何其他说明。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 800
            });
            const content = response.data.choices[0]?.message?.content || '{}';
            try {
                // 尝试解析JSON
                const parsed = JSON.parse(content);
                // 验证必要字段
                if (!parsed.description || !parsed.personality || !parsed.firstMessage) {
                    throw new Error('AI 返回的角色设定缺少必要字段');
                }
                return parsed;
            }
            catch (e) {
                // 如果解析失败，返回默认值
                console.error('解析角色设定JSON失败:', e);
                return {
                    description: `${name}是一个独特而有趣的AI角色。`,
                    personality: '友好、聪明、富有同情心',
                    backstory: `${name}来自一个充满想象力的世界，拥有丰富的经历和故事。`,
                    speakingStyle: '温和友善，偶尔幽默',
                    firstMessage: `你好！我是${name}，很高兴认识你！有什么我可以帮助你的吗？`
                };
            }
        }, `角色设定生成 (${name})`);
    }
    // 检查API状态（带重试机制）
    async checkAPIStatus() {
        try {
            return await withRetry(async () => {
                const response = await aiClient.get('/models');
                return {
                    available: true,
                    models: response.data.data || [],
                    responseTime: Date.now()
                };
            }, 'API 状态检查');
        }
        catch (error) {
            return {
                available: false,
                error: error.message || 'API不可用',
                lastChecked: Date.now()
            };
        }
    }
    // 健康检查
    async healthCheck() {
        const startTime = Date.now();
        try {
            const status = await this.checkAPIStatus();
            const responseTime = Date.now() - startTime;
            return {
                healthy: status.available,
                responseTime,
                details: status
            };
        }
        catch (error) {
            return {
                healthy: false,
                responseTime: Date.now() - startTime,
                error: error.message
            };
        }
    }
    // 计算tokens数量（简单估算）
    estimateTokens(text) {
        // 中文大约1.5个字符一个token，英文大约4个字符一个token
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishChars = text.length - chineseChars;
        return Math.ceil(chineseChars / 1.5 + englishChars / 4);
    }
    // 获取所有可用模型
    async getAvailableModels() {
        return Object.values(SUPPORTED_MODELS);
    }
    // 获取特定模型信息
    async getModelInfo(modelId) {
        return SUPPORTED_MODELS[modelId] || null;
    }
    // 获取模型统计信息
    async getModelStats(modelId, startDate) {
        try {
            // 从消息表获取统计信息
            const messages = await server_1.prisma.message.findMany({
                where: {
                    createdAt: {
                        gte: startDate
                    },
                    // 假设我们在metadata中存储了模型信息
                    metadata: {
                        contains: modelId
                    }
                },
                select: {
                    tokens: true,
                    createdAt: true,
                    metadata: true
                }
            });
            const totalRequests = messages.length;
            const totalTokensUsed = messages.reduce((sum, msg) => sum + (msg.tokens || 0), 0);
            // 计算成功率（简化处理，假设所有记录都是成功的）
            const successfulRequests = totalRequests;
            const failedRequests = 0;
            // 计算平均响应时间（这里需要从日志或其他地方获取）
            const averageResponseTime = 1500; // 默认值，实际应该从性能监控中获取
            return {
                totalRequests,
                successfulRequests,
                failedRequests,
                totalTokensUsed,
                averageResponseTime
            };
        }
        catch (error) {
            console.error('获取模型统计失败:', error);
            return {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                totalTokensUsed: 0,
                averageResponseTime: 0
            };
        }
    }
}
exports.aiService = new AIService();
//# sourceMappingURL=ai-backup.js.map