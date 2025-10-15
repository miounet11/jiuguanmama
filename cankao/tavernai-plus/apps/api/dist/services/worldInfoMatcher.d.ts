/**
 * 世界信息匹配器
 * 负责在对话中匹配和激活世界信息条目
 */
export interface MatchResult {
    entryId: string;
    content: string;
    keywords: string[];
    priority: number;
    matched: boolean;
    matchedKeywords: string[];
}
export interface PerformanceMetrics {
    matchTime: number;
    entriesProcessed: number;
    matchesFound: number;
    cacheHits: number;
}
declare class WorldInfoMatcher {
    private performanceMetrics;
    /**
     * 在指定情景中查找激活的世界信息条目
     */
    findActiveEntries(scenarioId: string, text: string, depth?: number): Promise<MatchResult[]>;
    /**
     * 获取性能指标
     */
    getPerformanceMetrics(): PerformanceMetrics;
    /**
     * 重置性能指标
     */
    resetPerformanceMetrics(): void;
}
export declare const worldInfoMatcher: WorldInfoMatcher;
export {};
//# sourceMappingURL=worldInfoMatcher.d.ts.map