"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewAPIImageGenerator = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * NewAPI 图片生成服务
 * 支持角色头像、对话背景图生成
 */
class NewAPIImageGenerator {
    apiKey;
    baseUrl;
    model;
    constructor() {
        this.apiKey = process.env.NEWAPI_KEY || '';
        this.baseUrl = process.env.NEWAPI_BASE_URL || 'https://ttkk.inping.com/v1';
        this.model = process.env.DEFAULT_MODEL || 'nano-banana';
        if (!this.apiKey) {
            throw new Error('NEWAPI_KEY environment variable is required');
        }
    }
    /**
     * 生成角色头像 (512x512 适合卡片显示)
     */
    async generateAvatar(character) {
        const prompt = this.buildAvatarPrompt(character);
        return this.generateImage(prompt, '512x512', 'avatar');
    }
    /**
     * 生成对话背景图 (1920x1080 适合聊天界面)
     */
    async generateBackground(character) {
        const prompt = this.buildBackgroundPrompt(character);
        return this.generateImage(prompt, '1920x1080', 'background');
    }
    /**
     * 核心图片生成方法
     */
    async generateImage(prompt, size, type) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/images/generations`, {
                model: this.model,
                prompt: prompt,
                n: 1,
                size: size,
                quality: 'standard',
                response_format: 'url'
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000 // 60秒超时
            });
            if (response.data?.data?.[0]?.url) {
                return response.data.data[0].url;
            }
            else {
                throw new Error('Invalid response format from NewAPI');
            }
        }
        catch (error) {
            console.error(`Failed to generate ${type} image:`, error);
            throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * 构建角色头像生成提示词
     */
    buildAvatarPrompt(character) {
        const mbtiStyle = this.getMBTIVisualStyle(character.mbtiType);
        const basePrompt = `portrait of ${character.name}`;
        let prompt = basePrompt;
        // 添加角色描述
        if (character.description) {
            prompt += `, ${character.description}`;
        }
        // 添加外貌特征（如果有）
        if (character.personality) {
            const personalityKeywords = this.extractVisualKeywords(character.personality);
            if (personalityKeywords) {
                prompt += `, ${personalityKeywords}`;
            }
        }
        // 添加MBTI视觉风格
        if (mbtiStyle) {
            prompt += `, ${mbtiStyle}`;
        }
        // 添加质量和风格标签
        prompt += ', anime style, high quality, detailed face, clean background, character portrait, card game character art';
        return prompt.trim();
    }
    /**
     * 构建对话背景图生成提示词
     */
    buildBackgroundPrompt(character) {
        let prompt = `conversation background for ${character.name}`;
        // 添加场景设定
        if (character.scenario) {
            prompt += `, ${character.scenario}`;
        }
        // 添加背景故事中的环境描述
        if (character.backstory) {
            const environmentKeywords = this.extractEnvironmentKeywords(character.backstory);
            if (environmentKeywords) {
                prompt += `, ${environmentKeywords}`;
            }
        }
        // 添加MBTI氛围
        if (character.mbtiType) {
            const mbtiAmbiance = this.getMBTIAmbiance(character.mbtiType);
            prompt += `, ${mbtiAmbiance}`;
        }
        // 添加质量和风格标签
        prompt += ', atmospheric mood, no characters, environmental art, cinematic lighting, detailed background';
        return prompt.trim();
    }
    /**
     * 根据MBTI类型获取视觉风格
     */
    getMBTIVisualStyle(mbtiType) {
        if (!mbtiType)
            return '';
        const mbtiStyles = {
            // 分析家(NT)
            'INTJ': 'serious expression, intellectual appearance, dark clothing, strategic pose',
            'INTP': 'curious expression, casual style, thoughtful pose, creative background',
            'ENTJ': 'confident expression, formal attire, leadership pose, professional look',
            'ENTP': 'energetic expression, stylish clothing, dynamic pose, innovative vibe',
            // 外交家(NF)
            'INFJ': 'gentle expression, elegant style, serene pose, mystical atmosphere',
            'INFP': 'dreamy expression, artistic clothing, peaceful pose, creative ambiance',
            'ENFJ': 'warm expression, approachable style, welcoming pose, inspiring aura',
            'ENFP': 'enthusiastic expression, colorful clothing, expressive pose, vibrant energy',
            // 守护者(SJ)
            'ISTJ': 'reliable expression, traditional clothing, steady pose, organized background',
            'ISFJ': 'caring expression, gentle style, nurturing pose, comfortable atmosphere',
            'ESTJ': 'determined expression, business attire, authoritative pose, structured setting',
            'ESFJ': 'friendly expression, social style, welcoming pose, harmonious environment',
            // 探险家(SP)
            'ISTP': 'focused expression, practical clothing, skilled pose, workshop setting',
            'ISFP': 'sensitive expression, artistic style, graceful pose, natural background',
            'ESTP': 'confident expression, trendy clothing, action pose, dynamic environment',
            'ESFP': 'joyful expression, fashionable style, playful pose, festive atmosphere'
        };
        return mbtiStyles[mbtiType.toUpperCase()] || '';
    }
    /**
     * 根据MBTI类型获取背景氛围
     */
    getMBTIAmbiance(mbtiType) {
        const mbtiAmbiances = {
            // 分析家(NT)
            'INTJ': 'dark academic atmosphere, library or study room, strategic planning mood',
            'INTP': 'creative workspace, laboratory or workshop, innovative thinking environment',
            'ENTJ': 'executive office, boardroom, leadership command center',
            'ENTP': 'dynamic startup space, brainstorming room, innovative hub',
            // 外交家(NF)
            'INFJ': 'serene meditation space, quiet garden, peaceful sanctuary',
            'INFP': 'artistic studio, cozy reading nook, dreamy landscape',
            'ENFJ': 'community center, teaching space, inspirational environment',
            'ENFP': 'vibrant social space, creative commons, energetic gathering place',
            // 守护者(SJ)
            'ISTJ': 'organized office, traditional home, structured environment',
            'ISFJ': 'comfortable home, caring space, nurturing environment',
            'ESTJ': 'corporate headquarters, management office, professional setting',
            'ESFJ': 'social gathering space, community center, harmonious home',
            // 探险家(SP)
            'ISTP': 'workshop, garage, hands-on working space',
            'ISFP': 'art studio, natural outdoor setting, peaceful creative space',
            'ESTP': 'sports arena, adventure location, action-packed environment',
            'ESFP': 'party venue, entertainment space, lively social setting'
        };
        return mbtiAmbiances[mbtiType.toUpperCase()] || '';
    }
    /**
     * 从性格描述中提取视觉关键词
     */
    extractVisualKeywords(personality) {
        const visualKeywords = {
            '冷静': 'calm expression, composed demeanor',
            '活泼': 'lively expression, energetic pose',
            '温柔': 'gentle expression, soft features',
            '严肃': 'serious expression, formal appearance',
            '开朗': 'cheerful expression, bright smile',
            '神秘': 'mysterious expression, enigmatic aura',
            '优雅': 'elegant posture, refined appearance',
            '可爱': 'cute expression, adorable features',
            '成熟': 'mature appearance, sophisticated style',
            '青春': 'youthful appearance, fresh look'
        };
        const foundKeywords = [];
        for (const [keyword, visual] of Object.entries(visualKeywords)) {
            if (personality.includes(keyword)) {
                foundKeywords.push(visual);
            }
        }
        return foundKeywords.slice(0, 2).join(', '); // 限制最多2个关键词
    }
    /**
     * 从背景故事中提取环境关键词
     */
    extractEnvironmentKeywords(backstory) {
        const environmentKeywords = {
            '学校': 'school environment, classroom setting',
            '城市': 'urban environment, city skyline',
            '森林': 'forest setting, natural environment',
            '海边': 'seaside setting, ocean view',
            '咖啡厅': 'cafe environment, cozy interior',
            '图书馆': 'library setting, book-filled environment',
            '办公室': 'office environment, professional setting',
            '家': 'home environment, domestic setting',
            '公园': 'park setting, outdoor environment',
            '夜晚': 'nighttime atmosphere, evening mood'
        };
        const foundKeywords = [];
        for (const [keyword, environment] of Object.entries(environmentKeywords)) {
            if (backstory.includes(keyword)) {
                foundKeywords.push(environment);
            }
        }
        return foundKeywords.slice(0, 2).join(', '); // 限制最多2个环境关键词
    }
    /**
     * 验证NewAPI连接
     */
    async testConnection() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                timeout: 10000
            });
            return response.status === 200;
        }
        catch (error) {
            console.error('NewAPI connection test failed:', error);
            return false;
        }
    }
}
exports.NewAPIImageGenerator = NewAPIImageGenerator;
exports.default = NewAPIImageGenerator;
//# sourceMappingURL=newapi-image-generator.js.map