"use strict";
/**
 * Prompt系统类型定义
 * 支持世界信息注入到AI对话prompt的完整功能
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_LIMITS = exports.DEFAULT_LENGTH_ADJUSTMENT = exports.DEFAULT_INJECTION_CONFIG = exports.DEFAULT_TOKEN_BUDGET = exports.PromptInjectionError = void 0;
// 注入器错误类型
class PromptInjectionError extends Error {
    code;
    context;
    constructor(message, code, context) {
        super(message);
        this.code = code;
        this.context = context;
        this.name = 'PromptInjectionError';
    }
}
exports.PromptInjectionError = PromptInjectionError;
// 导出常量
exports.DEFAULT_TOKEN_BUDGET = {
    maxTotal: 4000,
    reserved: 1000,
    worldInfoLimit: 1000,
    characterLimit: 800,
    examplesLimit: 600,
    contextLimit: 1200
};
exports.DEFAULT_INJECTION_CONFIG = {
    position: 'after_character',
    maxTokens: 1000,
    priority: 50,
    preserveOrder: true
};
exports.DEFAULT_LENGTH_ADJUSTMENT = {
    enabled: true,
    strategy: 'prioritize',
    minContextMessages: 3,
    maxWorldInfoEntries: 10,
    truncateThreshold: 0.8,
    summaryPrompt: '请总结以下内容，保持关键信息：'
};
exports.MODEL_LIMITS = {
    openai: { maxTokens: 4096, contextWindow: 4096 },
    claude: { maxTokens: 100000, contextWindow: 100000 },
    gemini: { maxTokens: 32768, contextWindow: 32768 },
    grok: { maxTokens: 4000, contextWindow: 4000 },
    deepseek: { maxTokens: 4096, contextWindow: 4096 }
};
//# sourceMappingURL=prompt.js.map