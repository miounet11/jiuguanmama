export declare enum ModelProvider {
    OPENAI = "openai",
    ANTHROPIC = "anthropic",
    GOOGLE = "google",
    DEEPSEEK = "deepseek",
    MOONSHOT = "moonshot",
    BAIDU = "baidu",
    ALIBABA = "alibaba",
    CUSTOM = "custom"
}
export interface ModelConfig {
    id: string;
    name: string;
    displayName: string;
    provider: ModelProvider;
    model: string;
    contextLength: number;
    maxTokens: number;
    temperature: {
        default: number;
        min: number;
        max: number;
    };
    pricing: {
        input: number;
        output: number;
        currency: string;
    };
    features: {
        streaming: boolean;
        functionCalling: boolean;
        vision: boolean;
        audio: boolean;
        plugins: boolean;
    };
    endpoint?: string;
    apiKey?: string;
    headers?: Record<string, string>;
    rateLimit?: {
        rpm: number;
        tpm: number;
        rpd: number;
    };
    enabled: boolean;
    priority: number;
}
export declare const DEFAULT_MODELS: ModelConfig[];
declare class ModelConfigService {
    private models;
    private providerEndpoints;
    constructor();
    private loadDefaultModels;
    private loadCustomModels;
    getAvailableModels(userId?: string): ModelConfig[];
    getModel(modelId: string): ModelConfig | null;
    getModelsByProvider(provider: ModelProvider): ModelConfig[];
    upsertModel(config: ModelConfig): Promise<void>;
    deleteModel(modelId: string): Promise<void>;
    getModelEndpoint(model: ModelConfig): string;
    getModelApiKey(model: ModelConfig): string;
    calculateCost(model: ModelConfig, inputTokens: number, outputTokens: number): {
        amount: number;
        currency: string;
    };
    checkRateLimit(model: ModelConfig, userId: string, usage: {
        rpm: number;
        tpm: number;
        rpd: number;
    }): {
        allowed: boolean;
        reason?: string;
    };
    selectBestModel(requirements: {
        contextLength?: number;
        vision?: boolean;
        streaming?: boolean;
        maxCost?: number;
    }, excludeModels?: string[]): ModelConfig | null;
    getModelStats(modelId: string, timeRange: {
        start: Date;
        end: Date;
    }): Promise<{
        totalRequests: number;
        totalTokens: number;
        totalCost: number;
        avgLatency: number;
        errorRate: number;
    }>;
}
export declare const modelConfigService: ModelConfigService;
export {};
//# sourceMappingURL=model-config.d.ts.map