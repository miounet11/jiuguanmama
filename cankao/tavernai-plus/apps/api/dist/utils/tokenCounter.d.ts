/**
 * Token计算工具
 * 支持多种AI模型的准确token计算
 */
import { AIModel, BaseMessage, TokenCalculationResult } from '../types/prompt';
declare class TokenCounter {
    private cache;
    private cacheMaxSize;
    private cacheTTL;
    /**
     * 计算文本的token数量
     */
    calculateTokens(text: string, model: AIModel): number;
    /**
     * 计算消息列表的token总数
     */
    calculateMessagesTokens(messages: BaseMessage[], model: AIModel): TokenCalculationResult;
    /**
     * 检查token是否超出模型限制
     */
    checkTokenLimit(tokens: number, model: AIModel): {
        withinLimit: boolean;
        limit: number;
        usage: number;
        remaining: number;
    };
    /**
     * 估算文本被截断到指定token数量后的内容
     */
    truncateToTokenLimit(text: string, maxTokens: number, model: AIModel): {
        truncatedText: string;
        actualTokens: number;
        truncated: boolean;
    };
    /**
     * 获取缓存统计信息
     */
    getCacheStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
    };
    /**
     * 清理缓存
     */
    clearCache(): void;
    /**
     * OpenAI兼容模型的token计算
     */
    private calculateOpenAITokens;
    /**
     * Claude模型的token计算
     */
    private calculateClaudeTokens;
    /**
     * Gemini模型的token计算
     */
    private calculateGeminiTokens;
    /**
     * 通用token计算（适用于未知模型）
     */
    private calculateGenericTokens;
    /**
     * 计算模型特定的额外开销
     */
    private calculateModelOverhead;
    /**
     * 获取估算方法类型
     */
    private getEstimationMethod;
    /**
     * 生成缓存键
     */
    private generateCacheKey;
    /**
     * 简单hash函数
     */
    private simpleHash;
    /**
     * 从缓存获取
     */
    private getFromCache;
    /**
     * 设置缓存
     */
    private setCache;
}
export declare const tokenCounter: TokenCounter;
export declare function estimateTokens(text: string, model?: AIModel): number;
export declare function estimateMessagesTokens(messages: BaseMessage[], model?: AIModel): TokenCalculationResult;
export declare function checkTokenBudget(tokens: number, budget: number, model?: AIModel): {
    withinBudget: boolean;
    usage: number;
    remaining: number;
};
export declare function truncateText(text: string, maxTokens: number, model?: AIModel): string;
export type { TokenCalculationResult };
//# sourceMappingURL=tokenCounter.d.ts.map