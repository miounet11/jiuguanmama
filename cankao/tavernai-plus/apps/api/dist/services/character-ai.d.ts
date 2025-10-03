export interface CharacterPersonality {
    id: string;
    name: string;
    personality: string;
    systemPrompt?: string;
    speakingStyle?: string;
    backstory?: string;
    exampleDialogs?: Array<{
        user: string;
        character: string;
    }>;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}
export interface ContextualMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    characterId?: string;
    timestamp?: Date;
}
export interface AIResponseRequest {
    characterId: string;
    userId: string;
    roomId?: string;
    messages: ContextualMessage[];
    trigger?: string;
    contextLength?: number;
}
/**
 * AI角色个性化服务
 * 专门处理角色的个性化回复和上下文管理
 */
export declare class CharacterAIService {
    /**
     * 生成角色个性化回复
     */
    static generateCharacterResponse(request: AIResponseRequest): Promise<string>;
    /**
     * 获取角色个性化信息
     */
    private static getCharacterPersonality;
    /**
     * 构建上下文消息
     */
    private static buildContextMessages;
    /**
     * 构建系统提示词
     */
    private static buildSystemPrompt;
    /**
     * 应用角色说话风格后处理
     */
    private static applyCharacterStyle;
    /**
     * 分析角色对话模式
     */
    static analyzeCharacterPattern(characterId: string, roomId?: string): Promise<any>;
    /**
     * 获取角色推荐回复
     */
    static getCharacterSuggestions(characterId: string, context: string, count?: number): Promise<string[]>;
    /**
     * 更新角色学习数据
     */
    static updateCharacterLearning(characterId: string, interaction: {
        userMessage: string;
        characterResponse: string;
        feedback?: 'positive' | 'negative';
        context?: string;
    }): Promise<void>;
    /**
     * 获取角色适应度指标
     */
    static getCharacterMetrics(characterId: string): Promise<any>;
}
export default CharacterAIService;
//# sourceMappingURL=character-ai.d.ts.map