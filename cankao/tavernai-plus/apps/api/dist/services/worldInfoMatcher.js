"use strict";
/**
 * 世界信息匹配器
 * 负责在对话中匹配和激活世界信息条目
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.worldInfoMatcher = void 0;
const server_1 = require("../server");
class WorldInfoMatcher {
    performanceMetrics = {
        matchTime: 0,
        entriesProcessed: 0,
        matchesFound: 0,
        cacheHits: 0
    };
    /**
     * 在指定情景中查找激活的世界信息条目
     */
    async findActiveEntries(scenarioId, text, depth = 3) {
        const startTime = Date.now();
        try {
            // 获取该情景的所有世界信息条目
            const worldInfoEntries = await server_1.prisma.worldInfoEntry.findMany({
                where: {
                    scenarioId: scenarioId,
                    isActive: true
                },
                orderBy: {
                    priority: 'desc'
                }
            });
            this.performanceMetrics.entriesProcessed = worldInfoEntries.length;
            const matchResults = [];
            const lowerText = text.toLowerCase();
            for (const entry of worldInfoEntries) {
                const keywords = entry.keywords ? entry.keywords.split(',').map(k => k.trim().toLowerCase()) : [];
                const matchedKeywords = [];
                // 检查关键词匹配
                for (const keyword of keywords) {
                    if (lowerText.includes(keyword)) {
                        matchedKeywords.push(keyword);
                    }
                }
                const matched = matchedKeywords.length > 0;
                matchResults.push({
                    entryId: entry.id,
                    content: entry.content,
                    keywords: keywords,
                    priority: entry.priority || 0,
                    matched,
                    matchedKeywords
                });
                if (matched) {
                    this.performanceMetrics.matchesFound++;
                }
            }
            // 按优先级和匹配度排序
            matchResults.sort((a, b) => {
                if (a.matched && !b.matched)
                    return -1;
                if (!a.matched && b.matched)
                    return 1;
                return b.priority - a.priority;
            });
            // 根据depth限制返回结果
            const limitedResults = matchResults.slice(0, depth);
            this.performanceMetrics.matchTime = Date.now() - startTime;
            return limitedResults;
        }
        catch (error) {
            console.error('世界信息匹配失败:', error);
            this.performanceMetrics.matchTime = Date.now() - startTime;
            return [];
        }
    }
    /**
     * 获取性能指标
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }
    /**
     * 重置性能指标
     */
    resetPerformanceMetrics() {
        this.performanceMetrics = {
            matchTime: 0,
            entriesProcessed: 0,
            matchesFound: 0,
            cacheHits: 0
        };
    }
}
// 导出单例实例
exports.worldInfoMatcher = new WorldInfoMatcher();
//# sourceMappingURL=worldInfoMatcher.js.map