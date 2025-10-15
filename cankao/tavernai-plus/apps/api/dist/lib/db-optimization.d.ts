import { PrismaClient } from '@prisma/client';
interface QueryPerformanceMetrics {
    queryId: string;
    operation: string;
    table: string;
    executionTime: number;
    resultCount: number;
    cacheHit: boolean;
    optimizationApplied?: string[];
}
interface IndexRecommendation {
    table: string;
    columns: string[];
    type: 'index' | 'composite' | 'unique';
    priority: 'high' | 'medium' | 'low';
    impact: string;
}
declare class DatabaseOptimizer {
    private prisma;
    private redisManager;
    private performanceMetrics;
    private slowQueryThreshold;
    private cacheExpirationTime;
    constructor(prisma: PrismaClient);
    /**
     * 优化角色查询性能
     */
    optimizeCharacterQueries(): Promise<{
        success: boolean;
        optimizations: string[];
    }>;
    /**
     * 确保最优索引配置
     */
    private ensureOptimalIndexes;
    /**
     * 创建索引（如果不存在）
     */
    private createIndexIfNotExists;
    /**
     * 设置查询缓存
     */
    private setupQueryCaching;
    /**
     * 优化分页查询
     */
    private optimizePaginationQueries;
    /**
     * 连接池优化
     */
    optimizeConnectionPool(): Promise<void>;
    /**
     * 查询性能分析
     */
    analyzeQueryPerformance(): Promise<{
        slowQueries: QueryPerformanceMetrics[];
        recommendations: string[];
        overallStats: any;
    }>;
    /**
     * 批量操作优化
     */
    optimizeBatchOperations(): Promise<void>;
    /**
     * 内存使用监控
     */
    monitorMemoryUsage(): Promise<{
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
    }>;
    private generateCacheKey;
    private generateQueryId;
    private recordQueryMetrics;
    private getConnectionPoolMetrics;
    /**
     * 清理性能指标
     */
    clearMetrics(): void;
    /**
     * 获取优化统计
     */
    getOptimizationStats(): any;
}
export declare const initializeDatabaseOptimizer: (prisma: PrismaClient) => DatabaseOptimizer;
export declare const getDatabaseOptimizer: () => DatabaseOptimizer | null;
export { DatabaseOptimizer, QueryPerformanceMetrics, IndexRecommendation };
//# sourceMappingURL=db-optimization.d.ts.map