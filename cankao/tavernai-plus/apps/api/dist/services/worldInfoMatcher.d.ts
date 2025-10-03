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
    spacetimeScore?: number;
    relationTriggers?: any[];
    culturalContext?: any;
    plotPhaseWeight?: number;
    dynamicWeight?: any;
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
     * 时空感知的世界信息匹配
     * 支持MBTI兼容性、关系触发器、文化语境、剧情阶段等多维度匹配
     */
    findSpacetimeEntries(scenarioId: string, text: string, context?: {
        characterId?: string;
        mbtiType?: string;
        currentPlotPhase?: string;
        spacetimeAttributes?: string[];
        activeCharacters?: Array<{
            id: string;
            mbtiType?: string;
        }>;
    }, depth?: number): Promise<MatchResult[]>;
    /**
     * 在指定情景中查找激活的世界信息条目 (原有方法保持兼容)
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
    /**
     * 计算MBTI人格类型的兼容性
     */
    private calculateMbtiCompatibility;
}
export declare const worldInfoMatcher: WorldInfoMatcher;
export {};
//# sourceMappingURL=worldInfoMatcher.d.ts.map