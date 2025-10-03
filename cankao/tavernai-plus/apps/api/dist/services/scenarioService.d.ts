/**
 * 情景剧本业务逻辑服务
 * 提供剧本和世界信息的高级业务功能，包括权限管理、数据验证、统计分析等
 */
import { ApiScenario, ApiScenarioDetail, CreateScenarioRequest, UpdateScenarioRequest, ScenarioListQuery } from '../types/api';
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
     * 测试关键词匹配
     */
    testMatching(scenarioId: string, userId: string, testText: string, depth?: number): Promise<{
        testText: string;
        depth: number;
        matchResults: {
            entry: {
                id: any;
                title: any;
                content: any;
                keywords: string[];
                priority: any;
                matchType: any;
                category: any;
            };
            matches: any;
            confidence: any;
            priority: number;
            insertPosition: any;
        }[];
        statistics: {
            totalEntries: number;
            matchingTime: number;
            averageConfidence: number;
        };
        performanceMetrics: import("./worldInfoMatcher").PerformanceMetrics;
    }>;
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
    /**
     * 获取剧本分类列表
     */
    getCategories(): Promise<{
        name: string;
        count: number;
    }[]>;
    /**
     * 获取标签列表
     */
    getTags(): Promise<{
        name: string;
        count: number;
    }[]>;
    /**
     * 克隆剧本
     */
    cloneScenario(scenarioId: string, userId: string): Promise<any>;
    /**
     * 获取剧本的世界信息条目
     */
    getWorldInfoEntries(scenarioId: string, userId?: string): Promise<any[]>;
    /**
     * 测试世界信息匹配
     */
    testWorldInfoMatching(scenarioId: string, text: string, userId?: string): Promise<any[]>;
    /**
     * 重新排序世界信息条目
     */
    reorderWorldInfoEntries(scenarioId: string, entryIds: string[], userId: string): Promise<boolean>;
}
export declare const scenarioService: ScenarioService;
//# sourceMappingURL=scenarioService.d.ts.map