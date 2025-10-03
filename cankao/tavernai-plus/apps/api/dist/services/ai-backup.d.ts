interface ModelConfig {
    id: string;
    name: string;
    provider: 'newapi' | 'openai' | 'anthropic' | 'google';
    baseUrl?: string;
    apiKey?: string;
    maxTokens: number;
    temperature: number;
    description: string;
    features: string[];
    pricePer1k?: number;
}
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
    getSupportedModels(): ModelConfig[];
    getModelConfig(modelId: string): ModelConfig | null;
    validateModel(modelId: string): Promise<boolean>;
    private createModelClient;
    generateChatResponse(options: GenerateOptions): Promise<any>;
    generateChatStream(options: GenerateOptions): AsyncGenerator<string, void, unknown>;
    private buildCharacterPrompt;
    generateCharacterProfile(name: string, tags?: string[]): Promise<any>;
    checkAPIStatus(): Promise<{
        available: boolean;
        models: any;
        responseTime: number;
    } | {
        available: boolean;
        error: any;
        lastChecked: number;
    }>;
    healthCheck(): Promise<{
        healthy: boolean;
        responseTime: number;
        details: {
            available: boolean;
            models: any;
            responseTime: number;
        } | {
            available: boolean;
            error: any;
            lastChecked: number;
        };
        error?: undefined;
    } | {
        healthy: boolean;
        responseTime: number;
        error: any;
        details?: undefined;
    }>;
    estimateTokens(text: string): number;
    getAvailableModels(): Promise<ModelConfig[]>;
    getModelInfo(modelId: string): Promise<ModelConfig | null>;
    getModelStats(modelId: string, startDate: Date): Promise<{
        totalRequests: any;
        successfulRequests: any;
        failedRequests: number;
        totalTokensUsed: any;
        averageResponseTime: number;
    }>;
}
export declare const aiService: AIService;
export {};
//# sourceMappingURL=ai-backup.d.ts.map