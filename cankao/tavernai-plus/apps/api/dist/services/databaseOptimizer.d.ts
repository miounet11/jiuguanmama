export declare class DatabaseOptimizer {
    private static instance;
    private isOptimized;
    static getInstance(): DatabaseOptimizer;
    /**
     * 初始化数据库优化
     */
    initialize(): Promise<void>;
    /**
     * 应用数据库索引
     */
    private applyIndexes;
    /**
     * 优化数据库设置
     */
    private optimizeSettings;
    /**
     * 创建分析视图
     */
    private createAnalyticsViews;
    /**
     * 分析数据库统计信息
     */
    private analyzeDatabase;
    /**
     * 获取数据库性能统计
     */
    getPerformanceStats(): Promise<any>;
    /**
     * 清理过期数据
     */
    cleanupExpiredData(): Promise<void>;
    /**
     * 优化查询性能
     */
    optimizeQueries(): Promise<void>;
    /**
     * 监控数据库健康状况
     */
    healthCheck(): Promise<{
        status: 'healthy' | 'warning' | 'critical';
        issues: string[];
        recommendations: string[];
    }>;
    /**
     * 获取慢查询分析
     */
    getSlowQueryAnalysis(): Promise<any[]>;
}
declare const _default: DatabaseOptimizer;
export default _default;
//# sourceMappingURL=databaseOptimizer.d.ts.map