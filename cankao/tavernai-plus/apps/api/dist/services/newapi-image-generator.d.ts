import { Character } from '@prisma/client';
/**
 * NewAPI 图片生成服务
 * 支持角色头像、对话背景图生成
 */
export declare class NewAPIImageGenerator {
    private apiKey;
    private baseUrl;
    private model;
    constructor();
    /**
     * 生成角色头像 (512x512 适合卡片显示)
     */
    generateAvatar(character: Character): Promise<string>;
    /**
     * 生成对话背景图 (1920x1080 适合聊天界面)
     */
    generateBackground(character: Character): Promise<string>;
    /**
     * 核心图片生成方法
     */
    private generateImage;
    /**
     * 构建角色头像生成提示词
     */
    private buildAvatarPrompt;
    /**
     * 构建对话背景图生成提示词
     */
    private buildBackgroundPrompt;
    /**
     * 根据MBTI类型获取视觉风格
     */
    private getMBTIVisualStyle;
    /**
     * 根据MBTI类型获取背景氛围
     */
    private getMBTIAmbiance;
    /**
     * 从性格描述中提取视觉关键词
     */
    private extractVisualKeywords;
    /**
     * 从背景故事中提取环境关键词
     */
    private extractEnvironmentKeywords;
    /**
     * 验证NewAPI连接
     */
    testConnection(): Promise<boolean>;
}
export default NewAPIImageGenerator;
//# sourceMappingURL=newapi-image-generator.d.ts.map