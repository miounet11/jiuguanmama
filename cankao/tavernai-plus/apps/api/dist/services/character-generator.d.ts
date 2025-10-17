export interface GenerationOptions {
    prompt: string;
    style?: 'anime' | 'realistic' | 'cartoon' | 'fantasy';
    personality?: 'cheerful' | 'serious' | 'mysterious' | 'romantic' | 'adventurous';
    background?: 'modern' | 'fantasy' | 'scifi' | 'historical';
    generateImage?: boolean;
    imageStyle?: string;
    language?: 'zh-CN' | 'en-US' | 'ja-JP';
}
export interface GeneratedCharacter {
    name: string;
    description: string;
    personality: string;
    backstory: string;
    appearance: string;
    speakingStyle: string;
    scenario: string;
    firstMessage: string;
    exampleDialogs: Array<{
        user: string;
        char: string;
    }>;
    tags: string[];
    avatar?: string;
    metadata: {
        generatedBy: string;
        prompt: string;
        timestamp: Date;
    };
}
declare class CharacterGeneratorService {
    /**
     * 使用 AI 生成完整的角色设定
     */
    generateCharacter(options: GenerationOptions, userId: string): Promise<GeneratedCharacter>;
    /**
     * 构建系统提示词
     */
    private buildSystemPrompt;
    /**
     * 构建用户提示词
     */
    private buildUserPrompt;
    /**
     * 解析生成的内容
     */
    private parseGeneratedContent;
    /**
     * 生成角色头像（使用 NEWAPI）
     */
    generateAvatar(character: GeneratedCharacter, style?: string): Promise<string>;
    /**
     * 构建图像生成提示词
     */
    private buildImagePrompt;
    /**
     * 使用 NAI3 生成图像
     */
    private generateNAI3Image;
    /**
     * 使用 DALL-E 3 生成图像
     */
    private generateDALLE3Image;
    /**
     * 生成开场白
     */
    generateFirstMessage(character: Partial<GeneratedCharacter>, context?: string): Promise<string>;
    /**
     * 优化现有角色设定
     */
    enhanceCharacter(character: Partial<GeneratedCharacter>, aspects: ('personality' | 'backstory' | 'appearance' | 'all')[]): Promise<Partial<GeneratedCharacter>>;
    /**
     * 增强特定方面
     */
    private enhanceAspect;
    /**
     * 获取生成模板
     */
    getTemplates(): {
        schoolGirl: {
            prompt: string;
            style: string;
            personality: string;
            background: string;
        };
        knight: {
            prompt: string;
            style: string;
            personality: string;
            background: string;
        };
        scientist: {
            prompt: string;
            style: string;
            personality: string;
            background: string;
        };
        vampire: {
            prompt: string;
            style: string;
            personality: string;
            background: string;
        };
    };
}
export declare const characterGeneratorService: CharacterGeneratorService;
export {};
//# sourceMappingURL=character-generator.d.ts.map