/**
 * Prompt系统类型定义
 * 支持世界信息注入到AI对话prompt的完整功能
 */
export type AIModel = 'openai' | 'claude' | 'gemini' | 'grok' | 'deepseek';
export type MessageRole = 'system' | 'user' | 'assistant';
export interface BaseMessage {
    role: MessageRole;
    content: string;
    metadata?: Record<string, any>;
}
export type InjectionPosition = 'before_character' | 'after_character' | 'before_examples' | 'after_examples' | 'at_depth' | 'system_start' | 'system_end';
export interface InjectionConfig {
    position: InjectionPosition;
    depth?: number;
    maxTokens: number;
    priority: number;
    preserveOrder?: boolean;
}
export interface TokenBudget {
    maxTotal: number;
    reserved: number;
    worldInfoLimit: number;
    characterLimit: number;
    examplesLimit: number;
    contextLimit: number;
}
export interface ModelFormatter {
    formatSystemMessage(content: string): BaseMessage;
    formatUserMessage(content: string): BaseMessage;
    formatAssistantMessage(content: string): BaseMessage;
    combineMessages(messages: BaseMessage[]): BaseMessage[];
    estimateTokens(text: string): number;
    getModelLimits(): {
        maxTokens: number;
        maxMessages: number;
        contextWindow: number;
    };
}
export interface WorldInfoItem {
    id: string;
    title: string;
    content: string;
    priority: number;
    insertPosition: number;
    tokens?: number;
}
export interface PromptContext {
    userId?: string;
    sessionId: string;
    characterId?: string;
    scenarioId?: string;
    messages: BaseMessage[];
    worldInfo?: WorldInfoItem[];
    settings: {
        model: AIModel;
        temperature?: number;
        maxTokens?: number;
    };
    metadata?: Record<string, any>;
}
export interface InjectionResult {
    success: boolean;
    finalPrompt: BaseMessage[];
    injectedItems: WorldInfoItem[];
    tokenUsage: {
        total: number;
        character: number;
        worldInfo: number;
        examples: number;
        context: number;
        available: number;
    };
    performance: {
        injectionTime: number;
        tokenCalculationTime: number;
        totalTime: number;
    };
    warnings?: string[];
    errors?: string[];
}
export interface LengthAdjustmentConfig {
    enabled: boolean;
    strategy: 'truncate' | 'summarize' | 'prioritize';
    minContextMessages: number;
    maxWorldInfoEntries: number;
    truncateThreshold: number;
    summaryPrompt?: string;
}
export interface CacheConfig {
    enabled: boolean;
    ttl: number;
    maxSize: number;
    keyStrategy: 'full' | 'hash';
}
export interface PromptInjectorConfig {
    tokenBudget: TokenBudget;
    lengthAdjustment: LengthAdjustmentConfig;
    cache: CacheConfig;
    defaultInjection: InjectionConfig;
    modelFormatters: Partial<Record<AIModel, ModelFormatter>>;
    performanceThreshold: number;
    enableMetrics: boolean;
}
export interface PerformanceMetrics {
    totalInjections: number;
    averageInjectionTime: number;
    cacheHitRate: number;
    tokenCalculationTime: number;
    worldInfoMatchTime: number;
    formatTime: number;
    memoryUsage: number;
}
export declare class PromptInjectionError extends Error {
    code: string;
    context?: any;
    constructor(message: string, code: string, context?: any);
}
export interface TokenCalculationResult {
    total: number;
    breakdown: {
        system: number;
        character: number;
        worldInfo: number;
        examples: number;
        context: number;
    };
    model: AIModel;
    estimationMethod: 'exact' | 'approximate';
    calculationTime: number;
}
export interface ModelSpecificConfig {
    openai: {
        systemMessageSupport: true;
        maxTokens: 4096 | 8192 | 16384 | 32768;
        tokenCalculationMethod: 'tiktoken';
        promptFormat: 'messages';
    };
    claude: {
        systemMessageSupport: false;
        maxTokens: 100000;
        tokenCalculationMethod: 'anthropic';
        promptFormat: 'human-assistant';
    };
    gemini: {
        systemMessageSupport: true;
        maxTokens: 32768;
        tokenCalculationMethod: 'google';
        promptFormat: 'parts';
    };
    grok: {
        systemMessageSupport: true;
        maxTokens: 4096;
        tokenCalculationMethod: 'openai-compatible';
        promptFormat: 'messages';
    };
    deepseek: {
        systemMessageSupport: true;
        maxTokens: 4096;
        tokenCalculationMethod: 'openai-compatible';
        promptFormat: 'messages';
    };
}
export declare const DEFAULT_TOKEN_BUDGET: TokenBudget;
export declare const DEFAULT_INJECTION_CONFIG: InjectionConfig;
export declare const DEFAULT_LENGTH_ADJUSTMENT: LengthAdjustmentConfig;
export declare const MODEL_LIMITS: Record<AIModel, {
    maxTokens: number;
    contextWindow: number;
}>;
//# sourceMappingURL=prompt.d.ts.map