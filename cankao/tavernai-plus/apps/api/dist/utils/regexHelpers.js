"use strict";
/**
 * 正则表达式辅助工具
 * 提供安全的正则表达式编译、缓存和匹配功能
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeCompileRegex = safeCompileRegex;
exports.isRegexSafe = isRegexSafe;
exports.escapeRegexChars = escapeRegexChars;
exports.wildcardToRegex = wildcardToRegex;
exports.createWholeWordRegex = createWholeWordRegex;
exports.createContainsRegex = createContainsRegex;
exports.createStartsWithRegex = createStartsWithRegex;
exports.createEndsWithRegex = createEndsWithRegex;
exports.compileRegexBatch = compileRegexBatch;
exports.testRegexPerformance = testRegexPerformance;
exports.parseSillyTavernKeywords = parseSillyTavernKeywords;
exports.getRegexCacheStats = getRegexCacheStats;
exports.clearRegexCache = clearRegexCache;
exports.validateKeywordSyntax = validateKeywordSyntax;
// 正则表达式编译缓存
class RegexCache {
    cache = new Map();
    accessOrder = [];
    maxSize;
    statsData = { hits: 0, misses: 0 };
    constructor(maxSize = 1000) {
        this.maxSize = maxSize;
    }
    get(key) {
        const item = this.cache.get(key);
        if (item) {
            this.statsData.hits++;
            // 更新访问顺序
            this.updateAccessOrder(key);
            return item;
        }
        this.statsData.misses++;
        return undefined;
    }
    set(key, value) {
        if (this.cache.has(key)) {
            this.cache.set(key, value);
            this.updateAccessOrder(key);
        }
        else {
            if (this.cache.size >= this.maxSize) {
                this.evictLRU();
            }
            this.cache.set(key, value);
            this.accessOrder.push(key);
        }
    }
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.accessOrder = this.accessOrder.filter(k => k !== key);
        }
        return deleted;
    }
    clear() {
        this.cache.clear();
        this.accessOrder = [];
        this.statsData = { hits: 0, misses: 0 };
    }
    size() {
        return this.cache.size;
    }
    stats() {
        const total = this.statsData.hits + this.statsData.misses;
        return {
            ...this.statsData,
            hitRate: total > 0 ? this.statsData.hits / total : 0
        };
    }
    updateAccessOrder(key) {
        this.accessOrder = this.accessOrder.filter(k => k !== key);
        this.accessOrder.push(key);
    }
    evictLRU() {
        const oldest = this.accessOrder.shift();
        if (oldest) {
            this.cache.delete(oldest);
        }
    }
}
// 全局正则表达式缓存实例
const regexCache = new RegexCache(1000);
/**
 * 安全编译正则表达式
 * 防止ReDoS攻击和无效模式
 */
function safeCompileRegex(pattern, flags = 'gi') {
    try {
        // 检查缓存
        const cacheKey = `${pattern}::${flags}`;
        const cached = regexCache.get(cacheKey);
        if (cached) {
            return cached.regex;
        }
        // 验证模式安全性
        if (!isRegexSafe(pattern)) {
            console.warn(`Potentially unsafe regex pattern: ${pattern}`);
            return null;
        }
        // 编译正则表达式
        const regex = new RegExp(pattern, flags);
        // 缓存编译结果
        const cacheItem = {
            pattern,
            regex,
            flags,
            compiled: new Date()
        };
        regexCache.set(cacheKey, cacheItem);
        return regex;
    }
    catch (error) {
        console.error(`Failed to compile regex: ${pattern}`, error);
        return null;
    }
}
/**
 * 检查正则表达式是否安全
 * 防止ReDoS攻击
 */
function isRegexSafe(pattern) {
    // 检查危险模式
    const dangerousPatterns = [
        /\(\?\=/, // 正向先行断言
        /\(\?\!/, // 负向先行断言
        /\(\?\<=/, // 正向后行断言
        /\(\?\<!/, // 负向后行断言
        /\*\+/, // 嵌套量词
        /\+\*/, // 嵌套量词
        /\{\d+,\s*\}/, // 开放式重复
        /\(\?\:\.\*\)\+/, // 贪婪匹配组合
        /\.\*\.\*/, // 多个贪婪匹配
    ];
    for (const dangerous of dangerousPatterns) {
        if (dangerous.test(pattern)) {
            return false;
        }
    }
    // 检查模式长度
    if (pattern.length > 1000) {
        return false;
    }
    // 检查嵌套深度
    const parenDepth = countNestedParentheses(pattern);
    if (parenDepth > 10) {
        return false;
    }
    return true;
}
/**
 * 计算括号嵌套深度
 */
function countNestedParentheses(pattern) {
    let maxDepth = 0;
    let currentDepth = 0;
    for (let i = 0; i < pattern.length; i++) {
        const char = pattern[i];
        const prevChar = i > 0 ? pattern[i - 1] : '';
        if (char === '(' && prevChar !== '\\') {
            currentDepth++;
            maxDepth = Math.max(maxDepth, currentDepth);
        }
        else if (char === ')' && prevChar !== '\\') {
            currentDepth--;
        }
    }
    return maxDepth;
}
/**
 * 转义正则表达式特殊字符
 */
function escapeRegexChars(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * 将通配符模式转换为正则表达式
 * 支持 * 和 ? 通配符
 */
function wildcardToRegex(pattern) {
    // 转义除了 * 和 ? 之外的所有正则字符
    let escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    // 将通配符转换为正则表达式
    escaped = escaped.replace(/\*/g, '.*'); // * 匹配任意字符
    escaped = escaped.replace(/\?/g, '.'); // ? 匹配单个字符
    return `^${escaped}$`;
}
/**
 * 创建全词匹配的正则表达式
 */
function createWholeWordRegex(word, flags = 'gi') {
    const escaped = escapeRegexChars(word);
    const pattern = `\\b${escaped}\\b`;
    return safeCompileRegex(pattern, flags);
}
/**
 * 创建包含匹配的正则表达式
 */
function createContainsRegex(text, flags = 'gi') {
    const escaped = escapeRegexChars(text);
    return safeCompileRegex(escaped, flags);
}
/**
 * 创建开始匹配的正则表达式
 */
function createStartsWithRegex(text, flags = 'gi') {
    const escaped = escapeRegexChars(text);
    const pattern = `^${escaped}`;
    return safeCompileRegex(pattern, flags);
}
/**
 * 创建结束匹配的正则表达式
 */
function createEndsWithRegex(text, flags = 'gi') {
    const escaped = escapeRegexChars(text);
    const pattern = `${escaped}$`;
    return safeCompileRegex(pattern, flags);
}
/**
 * 批量编译正则表达式
 */
function compileRegexBatch(patterns) {
    return patterns.map(({ pattern, flags = 'gi' }) => {
        try {
            const regex = safeCompileRegex(pattern, flags);
            return { pattern, regex };
        }
        catch (error) {
            return {
                pattern,
                regex: null,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    });
}
/**
 * 测试正则表达式性能
 */
function testRegexPerformance(regex, testString, iterations = 1000) {
    const start = performance.now();
    let matchCount = 0;
    for (let i = 0; i < iterations; i++) {
        const matches = testString.match(regex);
        if (matches) {
            matchCount += matches.length;
        }
    }
    const end = performance.now();
    const averageTime = (end - start) / iterations;
    return { averageTime, matchCount };
}
/**
 * 解析SillyTavern风格的关键词语法
 * 支持正则表达式、通配符、逻辑操作符
 */
function parseSillyTavernKeywords(keywordString) {
    const result = {
        exact: [],
        regex: [],
        wildcard: [],
        operator: 'AND_ANY',
        caseSensitive: false,
        wholeWord: false
    };
    if (!keywordString || typeof keywordString !== 'string') {
        return result;
    }
    // 解析修饰符
    let working = keywordString.trim();
    // 检查大小写敏感标志
    if (working.includes('(?-i)')) {
        result.caseSensitive = true;
        working = working.replace(/\(\?\-i\)/g, '');
    }
    // 检查全词匹配标志
    if (working.includes('\\b')) {
        result.wholeWord = true;
    }
    // 检查逻辑操作符
    if (working.startsWith('NOT_ALL:')) {
        result.operator = 'NOT_ALL';
        working = working.substring(8);
    }
    else if (working.startsWith('NOT_ANY:')) {
        result.operator = 'NOT_ANY';
        working = working.substring(8);
    }
    else if (working.startsWith('AND_ALL:')) {
        result.operator = 'AND_ALL';
        working = working.substring(8);
    }
    else if (working.startsWith('AND_ANY:')) {
        result.operator = 'AND_ANY';
        working = working.substring(8);
    }
    // 分割关键词
    const keywords = working.split(',').map(k => k.trim()).filter(k => k.length > 0);
    for (const keyword of keywords) {
        if (keyword.startsWith('/') && keyword.endsWith('/')) {
            // 正则表达式模式
            const pattern = keyword.slice(1, -1);
            const regex = safeCompileRegex(pattern, result.caseSensitive ? 'g' : 'gi');
            if (regex) {
                result.regex.push(regex);
            }
        }
        else if (keyword.includes('*') || keyword.includes('?')) {
            // 通配符模式
            const regexPattern = wildcardToRegex(keyword);
            const regex = safeCompileRegex(regexPattern, result.caseSensitive ? 'g' : 'gi');
            if (regex) {
                result.wildcard.push(regex);
            }
        }
        else {
            // 精确匹配
            result.exact.push(keyword);
        }
    }
    return result;
}
/**
 * 获取正则表达式缓存统计
 */
function getRegexCacheStats() {
    return {
        cacheStats: regexCache.stats(),
        cacheSize: regexCache.size()
    };
}
/**
 * 清理正则表达式缓存
 */
function clearRegexCache() {
    regexCache.clear();
}
/**
 * 验证关键词字符串格式
 */
function validateKeywordSyntax(keywordString) {
    const errors = [];
    const warnings = [];
    if (!keywordString || typeof keywordString !== 'string') {
        errors.push('关键词字符串不能为空');
        return { isValid: false, errors, warnings };
    }
    if (keywordString.length > 10000) {
        errors.push('关键词字符串过长（最大10000字符）');
    }
    // 检查正则表达式语法
    const regexMatches = keywordString.match(/\/(.+?)\//g);
    if (regexMatches) {
        for (const regexMatch of regexMatches) {
            const pattern = regexMatch.slice(1, -1);
            if (!isRegexSafe(pattern)) {
                warnings.push(`潜在不安全的正则表达式: ${pattern}`);
            }
            try {
                new RegExp(pattern);
            }
            catch (error) {
                errors.push(`无效的正则表达式: ${pattern}`);
            }
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
//# sourceMappingURL=regexHelpers.js.map