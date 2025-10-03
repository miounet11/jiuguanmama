export interface GuidanceOptions {
    sessionId: string;
    messageId?: string;
    guidance: {
        type: 'continue' | 'rewrite' | 'expand' | 'shorten' | 'custom';
        instruction?: string;
        tone?: 'friendly' | 'formal' | 'casual' | 'romantic' | 'dramatic';
        direction?: string;
        keywords?: string[];
        avoidWords?: string[];
        length?: 'short' | 'medium' | 'long';
    };
}
export interface GuidancePrompt {
    systemAddition: string;
    userInstruction: string;
    constraints: string[];
}
declare class GuidanceService {
    /**
     * 构建指导回复的提示词
     */
    buildGuidancePrompt(options: GuidanceOptions): GuidancePrompt;
    /**
     * 应用指导到消息生成
     */
    applyGuidanceToMessages(messages: Array<{
        role: string;
        content: string;
    }>, guidancePrompt: GuidancePrompt): Array<{
        role: string;
        content: string;
    }>;
    /**
     * 保存指导历史
     */
    saveGuidanceHistory(sessionId: string, messageId: string, guidance: GuidanceOptions['guidance']): Promise<void>;
    /**
     * 获取智能指导建议
     */
    getSuggestions(sessionId: string, context: string): Promise<string[]>;
    /**
     * 批量应用指导模板
     */
    getGuidanceTemplates(): {
        romantic: {
            tone: "romantic";
            keywords: string[];
            direction: string;
        };
        adventure: {
            tone: "dramatic";
            keywords: string[];
            direction: string;
        };
        mystery: {
            tone: "formal";
            keywords: string[];
            direction: string;
        };
        comedy: {
            tone: "casual";
            keywords: string[];
            direction: string;
        };
    };
}
export declare const guidanceService: GuidanceService;
export {};
//# sourceMappingURL=guidance.d.ts.map