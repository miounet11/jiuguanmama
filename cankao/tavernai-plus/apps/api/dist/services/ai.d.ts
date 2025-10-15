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
    scenarioId?: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    enableWorldInfo?: boolean;
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
    getAvailableModels(): Promise<ModelConfig[]>;
    getModelInfo(modelId: string): Promise<ModelConfig | null>;
    getModelStats(modelId: string, startDate: Date): Promise<{
        totalRequests: any;
        successfulRequests: any;
        failedRequests: number;
        totalTokensUsed: any;
        averageResponseTime: number;
    }>;
    private createModelClient;
    validateModel(modelId: string): Promise<boolean>;
    getSupportedModels(): ModelConfig[];
    getModelConfig(modelId: string): ModelConfig | null;
    generateChatResponse(options: any): Promise<{
        content: any;
        tokensUsed: any;
        model: any;
    }>;
    generateCharacterProfile(prompt: string, options?: any): Promise<any>;
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
        error?: never;
    } | {
        healthy: boolean;
        responseTime: number;
        error: any;
        details?: never;
    }>;
    checkAPIStatus(): Promise<{
        available: boolean;
        models: any;
        responseTime: number;
    } | {
        available: boolean;
        error: any;
        lastChecked: number;
    }>;
    estimateTokens(text: string): number;
    private convertToBaseMessages;
    private convertFromBaseMessages;
    private mapToAIModel;
    private buildCharacterPrompt;
    generateChatStream(options: GenerateOptions): AsyncGenerator<string, void, unknown>;
}
export declare const aiService: AIService;
export { ModelConfig };
//# sourceMappingURL=ai.d.ts.map