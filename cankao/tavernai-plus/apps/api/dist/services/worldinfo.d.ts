export interface WorldInfoEntry {
    id: string;
    name: string;
    triggers: string[];
    content: string;
    category: string;
    priority: number;
    isActive: boolean;
    context: {
        always: boolean;
        minDepth?: number;
        maxDepth?: number;
        probability?: number;
    };
    metadata?: {
        author?: string;
        source?: string;
        tags?: string[];
        embedding?: number[];
    };
}
export interface WorldInfo {
    id: string;
    name: string;
    description: string;
    creatorId: string;
    isPublic: boolean;
    entries: WorldInfoEntry[];
    settings: {
        maxEntries: number;
        scanDepth: number;
        insertionStrategy: 'before' | 'after' | 'mixed';
        budgetCap: number;
        recursiveScanning: boolean;
    };
}
declare class WorldInfoService {
    /**
     * 创建世界观设定
     */
    createWorldInfo(userId: string, data: Partial<WorldInfo>): Promise<WorldInfo>;
    /**
     * 添加知识条目
     */
    addEntry(worldInfoId: string, entry: Omit<WorldInfoEntry, 'id'>): Promise<WorldInfoEntry>;
    /**
     * 扫描消息并激活相关知识
     */
    scanAndActivate(worldInfoId: string, messages: Array<{
        role: string;
        content: string;
    }>, settings?: WorldInfo['settings']): Promise<WorldInfoEntry[]>;
    /**
     * 递归扫描（激活的条目可能触发其他条目）
     */
    private recursiveScan;
    /**
     * 将激活的知识注入到消息上下文
     */
    injectWorldInfo(messages: Array<{
        role: string;
        content: string;
    }>, entries: WorldInfoEntry[], strategy?: 'before' | 'after' | 'mixed'): Array<{
        role: string;
        content: string;
    }>;
    /**
     * 格式化世界观信息
     */
    private formatWorldInfo;
    /**
     * 导入世界观设定（支持 JSON、TXT 格式）
     */
    importWorldInfo(userId: string, data: string, format?: 'json' | 'txt'): Promise<WorldInfo>;
    /**
     * 解析文本格式的世界观
     */
    private parseTextFormat;
    /**
     * 智能推荐相关知识
     */
    recommendEntries(context: string, limit?: number): Promise<WorldInfoEntry[]>;
    /**
     * 获取模拟条目（开发用）
     */
    private getMockEntries;
    private generateId;
}
export declare const worldInfoService: WorldInfoService;
export {};
//# sourceMappingURL=worldinfo.d.ts.map