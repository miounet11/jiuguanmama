"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.characterGeneratorService = void 0;
const ai_1 = require("./ai");
const newapi_image_generator_1 = __importDefault(require("./newapi-image-generator"));
class CharacterGeneratorService {
    /**
     * 使用 AI 生成完整的角色设定
     */
    async generateCharacter(options, userId) {
        const { prompt, style, personality, background, language = 'zh-CN' } = options;
        // 构建生成提示词
        const systemPrompt = this.buildSystemPrompt(language);
        const userPrompt = this.buildUserPrompt(prompt, style, personality, background, language);
        try {
            // 调用 AI 生成角色设定
            const response = await ai_1.aiService.generateChatResponse({
                sessionId: `gen_${Date.now()}`,
                userId,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                model: 'gpt-4', // 使用更强的模型生成
                temperature: 0.8,
                maxTokens: 2000,
                stream: false
            });
            // 解析生成的内容
            const generatedContent = response.content;
            const character = this.parseGeneratedContent(generatedContent, options);
            // 如果需要生成头像
            if (options.generateImage) {
                character.avatar = await this.generateAvatar(character, options.imageStyle);
            }
            return character;
        }
        catch (error) {
            console.error('生成角色失败:', error);
            throw new Error('角色生成失败，请重试');
        }
    }
    /**
     * 构建系统提示词
     */
    buildSystemPrompt(language) {
        const prompts = {
            'zh-CN': `你是一个专业的角色创作助手。你需要根据用户的描述创建一个完整、有深度的角色设定。

输出格式要求（请严格按照此JSON格式输出）：
{
  "name": "角色名称",
  "description": "角色的简短描述（50字以内）",
  "personality": "详细的性格描述，包括性格特点、习惯、喜好等（200字）",
  "backstory": "角色的背景故事，包括出身、经历、重要事件等（300字）",
  "appearance": "外观描述，包括身高、体型、发色、瞳色、服装等（150字）",
  "speakingStyle": "说话风格和语言习惯的描述（100字）",
  "scenario": "角色所在的世界观或场景设定（150字）",
  "firstMessage": "角色的开场白，要符合角色性格（100字）",
  "exampleDialogs": [
    {"user": "用户示例对话1", "char": "角色回复1"},
    {"user": "用户示例对话2", "char": "角色回复2"},
    {"user": "用户示例对话3", "char": "角色回复3"}
  ],
  "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"]
}

要求：
1. 角色要有独特的个性和深度
2. 设定要自洽，符合逻辑
3. 语言要生动有趣
4. 标签要准确概括角色特点`,
            'en-US': `You are a professional character creation assistant. Create a complete, in-depth character based on the user's description.

Output format (strictly follow this JSON format):
{
  "name": "Character name",
  "description": "Brief character description (under 50 words)",
  "personality": "Detailed personality description including traits, habits, preferences (200 words)",
  "backstory": "Character's background story including origin, experiences, important events (300 words)",
  "appearance": "Physical description including height, build, hair color, eye color, clothing (150 words)",
  "speakingStyle": "Speaking style and language habits description (100 words)",
  "scenario": "Character's world or scenario setting (150 words)",
  "firstMessage": "Character's opening greeting that fits their personality (100 words)",
  "exampleDialogs": [
    {"user": "User example 1", "char": "Character response 1"},
    {"user": "User example 2", "char": "Character response 2"},
    {"user": "User example 3", "char": "Character response 3"}
  ],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Requirements:
1. Character must have unique personality and depth
2. Settings must be consistent and logical
3. Language should be vivid and interesting
4. Tags should accurately summarize character traits`
        };
        return prompts[language] || prompts['zh-CN'];
    }
    /**
     * 构建用户提示词
     */
    buildUserPrompt(prompt, style, personality, background, language = 'zh-CN') {
        const parts = [];
        if (language === 'zh-CN') {
            parts.push(`请创建一个角色，基础设定：${prompt}`);
            if (style) {
                const styleMap = {
                    anime: '动漫风格',
                    realistic: '写实风格',
                    cartoon: '卡通风格',
                    fantasy: '奇幻风格'
                };
                parts.push(`风格：${styleMap[style] || style}`);
            }
            if (personality) {
                const personalityMap = {
                    cheerful: '开朗活泼',
                    serious: '严肃认真',
                    mysterious: '神秘莫测',
                    romantic: '浪漫多情',
                    adventurous: '冒险精神'
                };
                parts.push(`性格倾向：${personalityMap[personality] || personality}`);
            }
            if (background) {
                const backgroundMap = {
                    modern: '现代都市',
                    fantasy: '奇幻世界',
                    scifi: '科幻未来',
                    historical: '历史古代'
                };
                parts.push(`背景设定：${backgroundMap[background] || background}`);
            }
        }
        else {
            parts.push(`Create a character based on: ${prompt}`);
            if (style)
                parts.push(`Style: ${style}`);
            if (personality)
                parts.push(`Personality: ${personality}`);
            if (background)
                parts.push(`Setting: ${background}`);
        }
        return parts.join('\n');
    }
    /**
     * 解析生成的内容
     */
    parseGeneratedContent(content, options) {
        try {
            // 尝试解析 JSON
            const parsed = JSON.parse(content);
            return {
                ...parsed,
                metadata: {
                    generatedBy: 'AI',
                    prompt: options.prompt,
                    timestamp: new Date()
                }
            };
        }
        catch (error) {
            // 如果解析失败，尝试提取内容
            console.error('解析生成内容失败:', error);
            // 返回基础角色
            return {
                name: '未命名角色',
                description: options.prompt,
                personality: '待完善',
                backstory: '待完善',
                appearance: '待完善',
                speakingStyle: '待完善',
                scenario: '待完善',
                firstMessage: '你好，很高兴认识你！',
                exampleDialogs: [],
                tags: ['AI生成'],
                metadata: {
                    generatedBy: 'AI',
                    prompt: options.prompt,
                    timestamp: new Date()
                }
            };
        }
    }
    /**
     * 生成角色头像（使用 NEWAPI）
     */
    async generateAvatar(character, style) {
        try {
            // 构建图像生成提示词
            const imagePrompt = this.buildImagePrompt(character, style);
            // 使用 NEWAPI 生成图像
            const imageGenerator = new newapi_image_generator_1.default();
            return await imageGenerator.generateAvatar(character);
        }
        catch (error) {
            console.error('生成头像失败:', error);
            return '/avatars/default.png';
        }
    }
    /**
     * 构建图像生成提示词
     */
    buildImagePrompt(character, style) {
        const parts = [];
        // 基于外观描述
        if (character.appearance) {
            parts.push(character.appearance);
        }
        // 添加风格
        if (style) {
            parts.push(style);
        }
        // 添加质量标签
        parts.push('masterpiece', 'best quality', 'detailed', 'portrait');
        return parts.join(', ');
    }
    /**
     * 使用 NAI3 生成图像
     */
    async generateNAI3Image(prompt) {
        const response = await axios.post('https://api.novelai.net/ai/generate-image', {
            input: prompt,
            model: 'nai-diffusion-3',
            parameters: {
                width: 512,
                height: 768,
                scale: 11,
                sampler: 'k_euler',
                steps: 28,
                n_samples: 1,
                ucPreset: 0,
                qualityToggle: true
            }
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.NAI3_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        // 保存图像并返回 URL
        const imageData = response.data.images[0];
        // TODO: 保存到存储服务
        return `data:image/png;base64,${imageData}`;
    }
    /**
     * 使用 DALL-E 3 生成图像
     */
    async generateDALLE3Image(prompt) {
        const response = await axios.post('https://api.openai.com/v1/images/generations', {
            model: 'dall-e-3',
            prompt: prompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard'
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data.data[0].url;
    }
    /**
     * 生成开场白
     */
    async generateFirstMessage(character, context) {
        const prompt = `基于以下角色设定，生成一个符合角色性格的开场白：

角色名：${character.name}
性格：${character.personality}
背景：${character.backstory}
说话风格：${character.speakingStyle}
${context ? `场景：${context}` : ''}

要求：
1. 符合角色性格
2. 自然亲切
3. 100字左右
4. 能引起对话兴趣`;
        const response = await ai_1.aiService.generateChatResponse({
            sessionId: `msg_${Date.now()}`,
            userId: 'system',
            messages: [
                { role: 'user', content: prompt }
            ],
            model: 'gpt-3.5-turbo',
            temperature: 0.9,
            maxTokens: 200,
            stream: false
        });
        return response.content;
    }
    /**
     * 优化现有角色设定
     */
    async enhanceCharacter(character, aspects) {
        const enhanced = { ...character };
        for (const aspect of aspects) {
            if (aspect === 'all' || aspect === 'personality') {
                enhanced.personality = await this.enhanceAspect(character.personality || '', 'personality', character.name || '');
            }
            if (aspect === 'all' || aspect === 'backstory') {
                enhanced.backstory = await this.enhanceAspect(character.backstory || '', 'backstory', character.name || '');
            }
            if (aspect === 'all' || aspect === 'appearance') {
                enhanced.appearance = await this.enhanceAspect(character.appearance || '', 'appearance', character.name || '');
            }
        }
        return enhanced;
    }
    /**
     * 增强特定方面
     */
    async enhanceAspect(current, aspect, characterName) {
        const aspectPrompts = {
            personality: '性格特征、行为习惯、内心世界',
            backstory: '成长经历、重要事件、人际关系',
            appearance: '外貌特征、穿着打扮、气质风格'
        };
        const prompt = `请优化和扩展以下角色的${aspectPrompts[aspect]}：

角色名：${characterName}
当前设定：${current}

要求：
1. 保留原有核心特征
2. 增加更多细节和深度
3. 让角色更加立体生动
4. 200字左右`;
        const response = await ai_1.aiService.generateChatResponse({
            sessionId: `enhance_${Date.now()}`,
            userId: 'system',
            messages: [
                { role: 'user', content: prompt }
            ],
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 300,
            stream: false
        });
        return response.content;
    }
    /**
     * 获取生成模板
     */
    getTemplates() {
        return {
            schoolGirl: {
                prompt: '可爱的高中女生，活泼开朗',
                style: 'anime',
                personality: 'cheerful',
                background: 'modern'
            },
            knight: {
                prompt: '勇敢的女骑士，正义感强',
                style: 'fantasy',
                personality: 'serious',
                background: 'fantasy'
            },
            scientist: {
                prompt: '天才科学家，理性冷静',
                style: 'realistic',
                personality: 'serious',
                background: 'scifi'
            },
            vampire: {
                prompt: '神秘的吸血鬼贵族',
                style: 'fantasy',
                personality: 'mysterious',
                background: 'fantasy'
            }
        };
    }
}
exports.characterGeneratorService = new CharacterGeneratorService();
//# sourceMappingURL=character-generator.js.map