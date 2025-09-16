export interface GenerateOptions {
    sessionId: string;
    userId: string;
    characterId?: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
}
export interface StreamChunk {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        delta: {
            role?: string;
            content?: string;
        };
        finish_reason: string | null;
    }>;
}
declare class AIService {
    generateChatResponse(options: GenerateOptions): Promise<any>;
    generateChatStream(options: GenerateOptions): AsyncGenerator<string, void, unknown>;
    private buildCharacterPrompt;
    generateCharacterProfile(name: string, tags?: string[]): Promise<any>;
    checkAPIStatus(): Promise<{
        available: boolean;
        models: any;
        error?: undefined;
    } | {
        available: boolean;
        error: string;
        models?: undefined;
    }>;
    estimateTokens(text: string): number;
}
export declare const aiService: AIService;
export {};
//# sourceMappingURL=ai.d.ts.map