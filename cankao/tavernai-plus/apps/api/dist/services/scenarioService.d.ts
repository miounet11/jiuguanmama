/**
 * 情景剧本业务逻辑服务
 * 提供剧本和世界信息的高级业务功能，包括权限管理、数据验证、统计分析等
 */
import { ApiScenario, ApiScenarioDetail, ApiWorldInfoEntry, CreateScenarioRequest, UpdateScenarioRequest, CreateWorldInfoEntryRequest, UpdateWorldInfoEntryRequest, ScenarioListQuery, ScenarioStats } from '../types/api';
export declare class ScenarioService {
    /**
     * 获取剧本列表（支持分页和筛选）
     */
    getScenarios(userId?: string, query?: ScenarioListQuery): Promise<{
        scenarios: ApiScenario[];
        total: number;
    }>;
    /**
     * 获取剧本详情
     */
    getScenarioById(id: string, userId?: string): Promise<ApiScenarioDetail | null>;
    /**
     * 创建剧本
     */
    createScenario(userId: string, data: CreateScenarioRequest): Promise<ApiScenario>;
    /**
     * 更新剧本
     */
    updateScenario(id: string, userId: string, data: UpdateScenarioRequest): Promise<ApiScenario>;
    /**
     * 删除剧本（软删除）
     */
    deleteScenario(id: string, userId: string): Promise<void>;
    /**
     * 创建世界信息条目
     */
    createWorldInfoEntry(scenarioId: string, userId: string, data: CreateWorldInfoEntryRequest): Promise<ApiWorldInfoEntry>;
    /**
     * 更新世界信息条目
     */
    updateWorldInfoEntry(scenarioId: string, entryId: string, userId: string, data: UpdateWorldInfoEntryRequest): Promise<ApiWorldInfoEntry>;
    /**
     * 删除世界信息条目
     */
    deleteWorldInfoEntry(scenarioId: string, entryId: string, userId: string): Promise<void>;
    /**
     * 测试关键词匹配
     */
    testMatching(scenarioId: string, userId: string, testText: string, depth?: number): Promise<{
        testText: string;
        depth: number;
        matchResults: any;
        statistics: {
            totalEntries: any;
            matchingTime: number;
            averageConfidence: number;
        };
        performanceMetrics: any;
    }>;
    /**
     * 获取剧本统计信息
     */
    getScenarioStats(): Promise<ScenarioStats>;
    /**
     * 增加剧本浏览次数
     */
    private incrementViewCount;
    /**
     * 检查剧本所有权
     */
    private checkScenarioOwnership;
    /**
     * 解析标签字符串
     */
    private parseTags;
    /**
     * 解析关键词字符串
     */
    private parseKeywords;
}
export declare const scenarioService: ScenarioService;
//# sourceMappingURL=scenarioService.d.ts.map