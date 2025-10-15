/**
 * 增强的世界信息服务
 * Enhanced World Info Service
 */
interface MatchResult {
    entry: EnhancedWorldInfoEntry;
    matchedKeywords: string[];
    confidence: number;
    insertPosition: number;
    context: string;
}
interface EnhancedWorldInfoEntry {
    id: string;
    scenarioId: string;
    title: string;
    content: string;
    keywords: string[];
    priority: number;
    insertDepth: number;
    probability: number;
    matchType: 'exact' | 'partial' | 'regex' | 'semantic';
    caseSensitive: boolean;
    isActive: boolean;
    triggerOnce: boolean;
    category: string;
    displayOrder: number;
    triggerCount: number;
    entryType: 'knowledge' | 'description' | 'rule' | 'secret' | 'relationship' | 'history' | 'prophecy';
    relatedEntities: string[];
    visibility: 'public' | 'private' | 'conditional' | 'secret' | 'gm_only';
    conditions: Array<{
        type: string;
        requirement: string;
        description?: string;
    }>;
    sourceType: 'manual' | 'ai_generated' | 'imported' | 'collaborative' | 'template';
    lastTriggeredAt?: Date;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
interface MatchContext {
    currentLocation?: string;
    presentCharacters?: string[];
    currentEvents?: string[];
    ownedItems?: string[];
    relationships?: Array<{
        entityId: string;
        entityType: string;
        relationship: string;
    }>;
    secretsKnown?: string[];
    reputation?: Record<string, number>;
}
export declare class EnhancedWorldInfoService {
    private prisma;
    private cache;
    private semanticCache;
    constructor(prisma: PrismaClient, cache: CacheManager);
    /**
     * 获取场景的所有世界信息条目
     */
    getWorldInfoEntries(scenarioId: string, includeInactive?: boolean): Promise<EnhancedWorldInfoEntry[]>;
    /**
     * 智能匹配世界信息条目
     */
    findMatchingEntries(scenarioId: string, text: string, context?: MatchContext, maxResults?: number): Promise<MatchResult[]>;
    /**
     * 创建世界信息条目
     */
    createWorldInfoEntry(scenarioId: string, userId: string, data: Partial<EnhancedWorldInfoEntry>): Promise<EnhancedWorldInfoEntry>;
    /**
     * 更新世界信息条目
     */
    updateWorldInfoEntry(entryId: string, userId: string, data: Partial<EnhancedWorldInfoEntry>): Promise<EnhancedWorldInfoEntry>;
    /**
     * 删除世界信息条目
     */
    deleteWorldInfoEntry(entryId: string, userId: string): Promise<void>;
    /**
     * 批量重新排序条目
     */
    reorderEntries(scenarioId: string, userId: string, entryOrders: Array<{
        id: string;
        displayOrder: number;
    }>): Promise<void>;
    /**
     * 记录条目触发
     */
    recordTrigger(entryId: string): Promise<void>;
    /**
     * 智能生成相关条目
     */
    generateRelatedEntries(scenarioId: string, userId: string, sourceEntryId: string, count?: number): Promise<EnhancedWorldInfoEntry[]>;
    /**
     * 测试关键词匹配
     */
    testKeywordMatching(scenarioId: string, testText: string, userId: string): Promise<{
        matches: MatchResult[];
        coverage: number;
        suggestions: string[];
    }>;
    /**
     * 私有方法：检查可见性条件
     */
    private checkVisibility;
    /**
     * 私有方法：检查触发条件
     */
    private checkConditions;
    /**
     * 私有方法：关键词匹配
     */
    private matchKeywords;
    /**
     * 私有方法：计算字符串相似度
     */
    private calculateStringSimilarity;
    /**
     * 私有方法：计算编辑距离
     */
    private calculateLevenshteinDistance;
    /**
     * 私有方法：计算语义相似度（简化版）
     */
    private calculateSemanticSimilarity;
    /**
     * 私有方法：生成匹配建议
     */
    private generateMatchingSuggestions;
    /**
     * 私有方法：转换数据库记录为增强接口
     */
    private transformToEnhanced;
    /**
     * 私有方法：清除缓存
     */
    private invalidateCache;
}
export default EnhancedWorldInfoService;
//# sourceMappingURL=enhancedWorldInfoService.d.ts.map