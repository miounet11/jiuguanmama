"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const openai_1 = __importDefault(require("openai"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
class MultimodalAIService {
    openai;
    providers = new Map();
    constructor() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.loadProviders();
    }
    // 加载AI提供商配置
    async loadProviders() {
        try {
            const providers = await prisma.aIProvider.findMany({
                where: { isActive: true },
                orderBy: { priority: 'asc' }
            });
            for (const provider of providers) {
                this.providers.set(provider.name, {
                    name: provider.name,
                    apiKey: provider.apiKey,
                    baseUrl: provider.baseUrl || undefined,
                    models: JSON.parse(provider.models),
                    isActive: provider.isActive,
                    priority: provider.priority
                });
            }
            console.log(`✅ 已加载 ${providers.length} 个AI提供商配置`);
        }
        catch (error) {
            console.error('❌ 加载AI提供商配置失败:', error);
        }
    }
    // 文本生成
    async generateText(prompt, options) {
        const startTime = Date.now();
        try {
            // 获取角色信息和系统提示
            let systemPrompt = options.systemPrompt || '';
            if (options.characterId) {
                const character = await prisma.character.findUnique({
                    where: { id: options.characterId }
                });
                if (character) {
                    systemPrompt = this.buildCharacterSystemPrompt(character);
                }
            }
            const response = await this.openai.chat.completions.create({
                model: options.model || 'gpt-4',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 1000
            });
            const content = response.choices[0]?.message?.content || '';
            const usage = response.usage;
            const cost = this.calculateCost('text', usage.total_tokens);
            // 记录AI请求
            await this.logAIRequest({
                userId: options.userId,
                type: 'text',
                provider: 'openai',
                model: options.model || 'gpt-4',
                inputTokens: usage.prompt_tokens,
                outputTokens: usage.completion_tokens,
                totalTokens: usage.total_tokens,
                cost,
                duration: Date.now() - startTime,
                characterId: options.characterId
            });
            return {
                content,
                usage: {
                    promptTokens: usage.prompt_tokens,
                    completionTokens: usage.completion_tokens,
                    totalTokens: usage.total_tokens
                },
                cost
            };
        }
        catch (error) {
            console.error('文本生成失败:', error);
            throw new Error('文本生成服务暂时不可用');
        }
    }
    // 语音合成
    async synthesizeSpeech(text, options) {
        const startTime = Date.now();
        try {
            // 获取角色语音配置
            let voiceConfig = options.voiceConfig;
            if (options.characterId && !voiceConfig) {
                const voiceProfile = await prisma.voiceProfile.findFirst({
                    where: { characterId: options.characterId }
                });
                if (voiceProfile) {
                    voiceConfig = JSON.parse(voiceProfile.config);
                }
            }
            // 默认语音配置
            voiceConfig = voiceConfig || {
                provider: 'openai',
                voice: 'alloy',
                speed: 1.0,
                pitch: 1.0
            };
            const response = await this.openai.audio.speech.create({
                model: 'tts-1',
                voice: voiceConfig.voice,
                input: text,
                speed: voiceConfig.speed
            });
            // 生成文件名和保存路径
            const fileName = `speech_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
            const filePath = path_1.default.join(process.cwd(), 'uploads', 'audio', fileName);
            // 确保目录存在
            await promises_1.default.mkdir(path_1.default.dirname(filePath), { recursive: true });
            // 保存音频文件
            const arrayBuffer = await response.arrayBuffer();
            await promises_1.default.writeFile(filePath, Buffer.from(arrayBuffer));
            const audioUrl = `/uploads/audio/${fileName}`;
            const duration = await this.getAudioDuration(filePath);
            const cost = this.calculateCost('tts', text.length);
            // 保存媒体文件记录
            await prisma.mediaFile.create({
                data: {
                    userId: options.userId,
                    type: 'audio',
                    originalName: fileName,
                    fileName,
                    filePath: audioUrl,
                    mimeType: 'audio/mpeg',
                    size: Buffer.from(arrayBuffer).length,
                    duration,
                    metadata: JSON.stringify({ voiceConfig, characterId: options.characterId })
                }
            });
            // 记录AI请求
            await this.logAIRequest({
                userId: options.userId,
                type: 'tts',
                provider: 'openai',
                model: 'tts-1',
                inputTokens: text.length,
                outputTokens: 0,
                totalTokens: text.length,
                cost,
                duration: Date.now() - startTime,
                characterId: options.characterId,
                outputUrl: audioUrl
            });
            return {
                audioUrl,
                duration,
                cost
            };
        }
        catch (error) {
            console.error('语音合成失败:', error);
            throw new Error('语音合成服务暂时不可用');
        }
    }
    // 语音转文字
    async transcribeAudio(audioFilePath, options) {
        const startTime = Date.now();
        try {
            const audioFile = await promises_1.default.readFile(audioFilePath);
            const response = await this.openai.audio.transcriptions.create({
                file: new File([audioFile], path_1.default.basename(audioFilePath)),
                model: 'whisper-1',
                language: options.language || 'zh',
                response_format: 'verbose_json'
            });
            const cost = this.calculateCost('stt', audioFile.length);
            // 记录AI请求
            await this.logAIRequest({
                userId: options.userId,
                type: 'stt',
                provider: 'openai',
                model: 'whisper-1',
                inputTokens: audioFile.length,
                outputTokens: response.text.length,
                totalTokens: audioFile.length + response.text.length,
                cost,
                duration: Date.now() - startTime
            });
            return {
                text: response.text,
                language: response.language || 'zh',
                confidence: 0.95, // Whisper doesn't provide confidence, using default
                cost
            };
        }
        catch (error) {
            console.error('语音转文字失败:', error);
            throw new Error('语音转文字服务暂时不可用');
        }
    }
    // 图像生成
    async generateImage(prompt, options) {
        const startTime = Date.now();
        try {
            const imageConfig = options.imageConfig || {
                provider: 'openai',
                style: 'natural',
                quality: 'standard',
                size: '1024x1024'
            };
            const response = await this.openai.images.generate({
                model: 'dall-e-3',
                prompt: prompt,
                n: 1,
                quality: imageConfig.quality,
                size: imageConfig.size,
                style: imageConfig.style
            });
            const imageUrl = response.data[0].url;
            const revisedPrompt = response.data[0].revised_prompt;
            // 下载并保存图像
            const imageResponse = await axios_1.default.get(imageUrl, { responseType: 'arraybuffer' });
            const fileName = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
            const filePath = path_1.default.join(process.cwd(), 'uploads', 'images', fileName);
            await promises_1.default.mkdir(path_1.default.dirname(filePath), { recursive: true });
            await promises_1.default.writeFile(filePath, imageResponse.data);
            const localImageUrl = `/uploads/images/${fileName}`;
            const cost = this.calculateCost('image', 1);
            // 保存媒体文件记录
            await prisma.mediaFile.create({
                data: {
                    userId: options.userId,
                    type: 'image',
                    originalName: fileName,
                    fileName,
                    filePath: localImageUrl,
                    mimeType: 'image/png',
                    size: imageResponse.data.length,
                    metadata: JSON.stringify({
                        imageConfig,
                        characterId: options.characterId,
                        originalPrompt: prompt,
                        revisedPrompt
                    })
                }
            });
            // 保存图像生成记录
            await prisma.imageGeneration.create({
                data: {
                    userId: options.userId,
                    characterId: options.characterId,
                    prompt: prompt,
                    revisedPrompt,
                    imageUrl: localImageUrl,
                    model: 'dall-e-3',
                    style: imageConfig.style,
                    quality: imageConfig.quality,
                    size: imageConfig.size,
                    cost
                }
            });
            // 记录AI请求
            await this.logAIRequest({
                userId: options.userId,
                type: 'image',
                provider: 'openai',
                model: 'dall-e-3',
                inputTokens: prompt.length,
                outputTokens: 1,
                totalTokens: prompt.length + 1,
                cost,
                duration: Date.now() - startTime,
                characterId: options.characterId,
                outputUrl: localImageUrl
            });
            return {
                imageUrl: localImageUrl,
                cost,
                revisedPrompt
            };
        }
        catch (error) {
            console.error('图像生成失败:', error);
            throw new Error('图像生成服务暂时不可用');
        }
    }
    // 图像分析
    async analyzeImage(imageUrl, prompt, options) {
        const startTime = Date.now();
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-vision-preview',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            { type: 'image_url', image_url: { url: imageUrl } }
                        ]
                    }
                ],
                max_tokens: 500
            });
            const analysis = response.choices[0]?.message?.content || '';
            const cost = this.calculateCost('vision', response.usage?.total_tokens || 0);
            // 记录AI请求
            await this.logAIRequest({
                userId: options.userId,
                type: 'vision',
                provider: 'openai',
                model: 'gpt-4-vision-preview',
                inputTokens: response.usage?.prompt_tokens || 0,
                outputTokens: response.usage?.completion_tokens || 0,
                totalTokens: response.usage?.total_tokens || 0,
                cost,
                duration: Date.now() - startTime,
                characterId: options.characterId
            });
            return {
                analysis,
                cost
            };
        }
        catch (error) {
            console.error('图像分析失败:', error);
            throw new Error('图像分析服务暂时不可用');
        }
    }
    // 获取可用模型列表
    async getAvailableModels() {
        const models = {
            text: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet'],
            image: ['dall-e-3', 'dall-e-2', 'midjourney', 'stable-diffusion'],
            speech: ['tts-1', 'tts-1-hd', 'elevenlabs', 'azure-speech']
        };
        return models;
    }
    // 获取使用统计
    async getUsageStats(userId, timeRange) {
        const requests = await prisma.aIRequest.findMany({
            where: {
                userId,
                createdAt: {
                    gte: timeRange.startDate,
                    lte: timeRange.endDate
                }
            }
        });
        const stats = {
            totalRequests: requests.length,
            totalCost: requests.reduce((sum, req) => sum + req.cost, 0),
            breakdown: {
                text: { requests: 0, cost: 0 },
                image: { requests: 0, cost: 0 },
                speech: { requests: 0, cost: 0 }
            }
        };
        for (const request of requests) {
            if (['text', 'tts', 'stt'].includes(request.type)) {
                const category = request.type === 'text' ? 'text' : 'speech';
                stats.breakdown[category].requests++;
                stats.breakdown[category].cost += request.cost;
            }
            else if (['image', 'vision'].includes(request.type)) {
                stats.breakdown.image.requests++;
                stats.breakdown.image.cost += request.cost;
            }
        }
        return stats;
    }
    // 私有方法：构建角色系统提示
    buildCharacterSystemPrompt(character) {
        let systemPrompt = `你是${character.name}。`;
        if (character.personality) {
            systemPrompt += `\n性格特征：${character.personality}`;
        }
        if (character.backstory) {
            systemPrompt += `\n背景故事：${character.backstory}`;
        }
        if (character.speakingStyle) {
            systemPrompt += `\n说话风格：${character.speakingStyle}`;
        }
        if (character.scenario) {
            systemPrompt += `\n当前场景：${character.scenario}`;
        }
        systemPrompt += '\n\n请始终保持角色设定，用中文回应。';
        return systemPrompt;
    }
    // 私有方法：计算使用成本
    calculateCost(type, units) {
        const pricing = {
            text: 0.002, // 每1000 tokens
            tts: 0.015, // 每1000字符
            stt: 0.006, // 每分钟
            image: 0.04, // 每张图像
            vision: 0.01 // 每1000 tokens
        };
        const rate = pricing[type] || 0;
        switch (type) {
            case 'text':
            case 'vision':
                return (units / 1000) * rate;
            case 'tts':
                return (units / 1000) * rate;
            case 'stt':
                return (units / 60) * rate; // 假设1MB音频约1分钟
            case 'image':
                return rate;
            default:
                return 0;
        }
    }
    // 私有方法：记录AI请求
    async logAIRequest(data) {
        try {
            await prisma.aIRequest.create({
                data: {
                    userId: data.userId,
                    type: data.type,
                    provider: data.provider,
                    model: data.model,
                    inputTokens: data.inputTokens,
                    outputTokens: data.outputTokens,
                    totalTokens: data.totalTokens,
                    cost: data.cost,
                    duration: data.duration,
                    characterId: data.characterId,
                    outputUrl: data.outputUrl,
                    metadata: JSON.stringify({
                        timestamp: new Date().toISOString(),
                        userAgent: 'TavernAI-Plus'
                    })
                }
            });
        }
        catch (error) {
            console.error('记录AI请求失败:', error);
        }
    }
    // 私有方法：获取音频时长
    async getAudioDuration(filePath) {
        // 这里应该使用ffprobe或类似工具获取真实时长
        // 暂时返回估算值
        const stats = await promises_1.default.stat(filePath);
        return Math.round(stats.size / 1000); // 粗略估算：1KB约1秒
    }
}
exports.default = new MultimodalAIService();
//# sourceMappingURL=multimodalAI.js.map