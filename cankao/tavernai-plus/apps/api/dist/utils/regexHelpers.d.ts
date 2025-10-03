/**
 * 正则表达式辅助工具
 * 提供安全的正则表达式编译、缓存和匹配功能
 */
/**
 * 安全编译正则表达式
 * 防止ReDoS攻击和无效模式
 */
export declare function safeCompileRegex(pattern: string, flags?: string): RegExp | null;
/**
 * 检查正则表达式是否安全
 * 防止ReDoS攻击
 */
export declare function isRegexSafe(pattern: string): boolean;
/**
 * 转义正则表达式特殊字符
 */
export declare function escapeRegexChars(text: string): string;
/**
 * 将通配符模式转换为正则表达式
 * 支持 * 和 ? 通配符
 */
export declare function wildcardToRegex(pattern: string): string;
/**
 * 创建全词匹配的正则表达式
 */
export declare function createWholeWordRegex(word: string, flags?: string): RegExp | null;
/**
 * 创建包含匹配的正则表达式
 */
export declare function createContainsRegex(text: string, flags?: string): RegExp | null;
/**
 * 创建开始匹配的正则表达式
 */
export declare function createStartsWithRegex(text: string, flags?: string): RegExp | null;
/**
 * 创建结束匹配的正则表达式
 */
export declare function createEndsWithRegex(text: string, flags?: string): RegExp | null;
/**
 * 批量编译正则表达式
 */
export declare function compileRegexBatch(patterns: Array<{
    pattern: string;
    flags?: string;
}>): Array<{
    pattern: string;
    regex: RegExp | null;
    error?: string;
}>;
/**
 * 测试正则表达式性能
 */
export declare function testRegexPerformance(regex: RegExp, testString: string, iterations?: number): {
    averageTime: number;
    matchCount: number;
};
/**
 * 解析SillyTavern风格的关键词语法
 * 支持正则表达式、通配符、逻辑操作符
 */
export declare function parseSillyTavernKeywords(keywordString: string): {
    exact: string[];
    regex: RegExp[];
    wildcard: RegExp[];
    operator: 'AND_ANY' | 'AND_ALL' | 'NOT_ANY' | 'NOT_ALL';
    caseSensitive: boolean;
    wholeWord: boolean;
};
/**
 * 获取正则表达式缓存统计
 */
export declare function getRegexCacheStats(): {
    cacheStats: {
        hits: number;
        misses: number;
        hitRate: number;
    };
    cacheSize: number;
};
/**
 * 清理正则表达式缓存
 */
export declare function clearRegexCache(): void;
/**
 * 验证关键词字符串格式
 */
export declare function validateKeywordSyntax(keywordString: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
};
//# sourceMappingURL=regexHelpers.d.ts.map