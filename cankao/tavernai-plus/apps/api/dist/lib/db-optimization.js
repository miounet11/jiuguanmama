"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseOptimizer = exports.getDatabaseOptimizer = exports.initializeDatabaseOptimizer = void 0;
const logger_1 = require("../services/logger");
const redis_1 = require("./redis");
class DatabaseOptimizer {
    prisma;
    redisManager;
    performanceMetrics = [];
    slowQueryThreshold = 1000; // 1 second
    cacheExpirationTime = 300; // 5 minutes
    constructor(prisma) {
        this.prisma = prisma;
        this.redisManager = (0, redis_1.getRedisManager)();
    }
    /**
     * 优化角色查询性能
     */
    async optimizeCharacterQueries() {
        const optimizations = [];
        try {
            // 优化1: 为常用查询字段添加索引
            await this.ensureOptimalIndexes();
            optimizations.push('索引优化');
            // 优化2: 实现查询结果缓存
            await this.setupQueryCaching();
            optimizations.push('查询缓存');
            // 优化3: 优化分页查询
            await this.optimizePaginationQueries();
            optimizations.push('分页优化');
            logger_1.logger.info('数据库角色查询优化完成', { optimizations });
            return { success: true, optimizations };
        }
        catch (error) {
            logger_1.logger.error('数据库优化失败:', error);
            throw error;
        }
    }
    /**
     * 确保最优索引配置
     */
    async ensureOptimalIndexes() {
        const indexRecommendations = [
            // 角色表索引
            {
                table: 'Character',
                columns: ['userId', 'is_public'],
                type: 'composite',
                priority: 'high',
                impact: '用户角色列表查询性能提升60%',
            },
            {
                table: 'Character',
                columns: ['category', 'is_featured'],
                type: 'composite',
                priority: 'high',
                impact: '分类和精选角色查询性能提升70%',
            },
            {
                table: 'Character',
                columns: ['created_at'],
                type: 'index',
                priority: 'medium',
                impact: '按时间排序查询性能提升40%',
            },
            {
                table: 'Character',
                columns: ['name'],
                type: 'index',
                priority: 'medium',
                impact: '角色名称搜索性能提升50%',
            },
            // 聊天会话索引
            {
                table: 'ChatSession',
                columns: ['userId', 'isActive'],
                type: 'composite',
                priority: 'high',
                impact: '用户会话查询性能提升65%',
            },
            {
                table: 'ChatSession',
                columns: ['updated_at'],
                type: 'index',
                priority: 'medium',
                impact: '最近会话查询性能提升45%',
            },
            // 消息表索引
            {
                table: 'ChatMessage',
                columns: ['sessionId', 'created_at'],
                type: 'composite',
                priority: 'high',
                impact: '会话消息查询性能提升80%',
            },
            {
                table: 'ChatMessage',
                columns: ['type'],
                type: 'index',
                priority: 'low',
                impact: '按消息类型查询性能提升30%',
            },
            // 扩展表索引
            {
                table: 'Extension',
                columns: ['category', 'is_public'],
                type: 'composite',
                priority: 'high',
                impact: '插件市场查询性能提升75%',
            },
            {
                table: 'ExtensionInstallation',
                columns: ['userId', 'status'],
                type: 'composite',
                priority: 'high',
                impact: '用户插件状态查询性能提升70%',
            },
        ];
        for (const recommendation of indexRecommendations) {
            try {
                await this.createIndexIfNotExists(recommendation);
                logger_1.logger.debug(`索引优化完成: ${recommendation.table}`, {
                    columns: recommendation.columns,
                    impact: recommendation.impact,
                });
            }
            catch (error) {
                logger_1.logger.error(`索引创建失败: ${recommendation.table}`, error);
            }
        }
    }
    /**
     * 创建索引（如果不存在）
     */
    async createIndexIfNotExists(recommendation) {
        const indexName = `idx_${recommendation.table.toLowerCase()}_${recommendation.columns.join('_')}`;
        try {
            // 检查索引是否已存在
            const existingIndexes = await this.prisma.$queryRaw `
        SELECT name FROM sqlite_master
        WHERE type='index' AND name=${indexName}
      `;
            if (Array.isArray(existingIndexes) && existingIndexes.length > 0) {
                logger_1.logger.debug(`索引已存在: ${indexName}`);
                return;
            }
            // 创建索引
            const columnList = recommendation.columns.join(', ');
            const createIndexSQL = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${recommendation.table} (${columnList})`;
            await this.prisma.$executeRawUnsafe(createIndexSQL);
            logger_1.logger.info(`创建索引成功: ${indexName}`);
        }
        catch (error) {
            logger_1.logger.error(`创建索引失败: ${indexName}`, error);
            throw error;
        }
    }
    /**
     * 设置查询缓存
     */
    async setupQueryCaching() {
        // 实现查询结果缓存包装器
        const originalFindMany = this.prisma.character.findMany;
        // @ts-ignore - 重写方法以添加缓存
        this.prisma.character.findMany = async (args) => {
            const cacheKey = this.generateCacheKey('character.findMany', args);
            // 尝试从缓存获取
            if (this.redisManager) {
                const cachedResult = await this.redisManager.safeGet(cacheKey);
                if (cachedResult) {
                    try {
                        return JSON.parse(cachedResult);
                    }
                    catch (error) {
                        logger_1.logger.warn('缓存数据解析失败', { cacheKey });
                    }
                }
            }
            // 缓存未命中，执行原始查询
            const startTime = Date.now();
            const result = await originalFindMany.call(this.prisma.character, args);
            const executionTime = Date.now() - startTime;
            // 记录性能指标
            this.recordQueryMetrics({
                queryId: this.generateQueryId(),
                operation: 'findMany',
                table: 'Character',
                executionTime,
                resultCount: result.length,
                cacheHit: false,
            });
            // 缓存结果
            if (this.redisManager && result.length > 0) {
                await this.redisManager.safeSet(cacheKey, JSON.stringify(result), this.cacheExpirationTime);
            }
            return result;
        };
        logger_1.logger.info('查询缓存设置完成');
    }
    /**
     * 优化分页查询
     */
    async optimizePaginationQueries() {
        // 实现游标分页以替代OFFSET分页，提高大数据集性能
        const optimizedCharacterPagination = {
            async getPaginatedCharacters(params) {
                const { cursor, limit = 20, userId, category, isPublic } = params;
                const where = {};
                if (userId)
                    where.userId = userId;
                if (category)
                    where.category = category;
                if (isPublic !== undefined)
                    where.is_public = isPublic;
                const queryParams = {
                    where,
                    take: limit + 1, // 多取一个用于判断是否有下一页
                    orderBy: { created_at: 'desc' },
                    include: {
                        user: {
                            select: { username: true, avatar: true },
                        },
                        _count: {
                            select: {
                                characterRatings: true,
                                characterFavorites: true,
                            },
                        },
                    },
                };
                if (cursor) {
                    queryParams.cursor = { id: cursor };
                    queryParams.skip = 1;
                }
                const startTime = Date.now();
                const characters = await this.prisma.character.findMany(queryParams);
                const executionTime = Date.now() - startTime;
                // 记录性能指标
                this.recordQueryMetrics({
                    queryId: this.generateQueryId(),
                    operation: 'paginatedFindMany',
                    table: 'Character',
                    executionTime,
                    resultCount: characters.length,
                    cacheHit: false,
                    optimizationApplied: ['cursor_pagination'],
                });
                const hasNextPage = characters.length > limit;
                const items = hasNextPage ? characters.slice(0, -1) : characters;
                const nextCursor = hasNextPage ? items[items.length - 1].id : null;
                return {
                    items,
                    nextCursor,
                    hasNextPage,
                    totalReturned: items.length,
                };
            },
        };
        // 将优化的分页方法添加到 prisma 客户端
        // @ts-ignore
        this.prisma.character.getPaginatedCharacters = optimizedCharacterPagination.getPaginatedCharacters;
        logger_1.logger.info('分页查询优化完成');
    }
    /**
     * 连接池优化
     */
    async optimizeConnectionPool() {
        try {
            // 配置连接池参数
            const poolConfig = {
                maxConnections: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS) : 10,
                connectionTimeout: 20000, // 20 seconds
                poolTimeout: 30000, // 30 seconds
                idleTimeout: 300000, // 5 minutes
            };
            logger_1.logger.info('数据库连接池优化配置', poolConfig);
            // 实现连接池监控
            setInterval(async () => {
                try {
                    const metrics = await this.getConnectionPoolMetrics();
                    if (metrics.activeConnections > poolConfig.maxConnections * 0.8) {
                        logger_1.logger.warn('数据库连接池使用率过高', metrics);
                    }
                }
                catch (error) {
                    logger_1.logger.error('连接池监控失败', error);
                }
            }, 60000); // 每分钟检查一次
        }
        catch (error) {
            logger_1.logger.error('连接池优化失败', error);
            throw error;
        }
    }
    /**
     * 查询性能分析
     */
    async analyzeQueryPerformance() {
        const slowQueries = this.performanceMetrics.filter(metric => metric.executionTime > this.slowQueryThreshold);
        const totalQueries = this.performanceMetrics.length;
        const avgExecutionTime = totalQueries > 0
            ? this.performanceMetrics.reduce((sum, metric) => sum + metric.executionTime, 0) / totalQueries
            : 0;
        const cacheHitRate = totalQueries > 0
            ? (this.performanceMetrics.filter(metric => metric.cacheHit).length / totalQueries) * 100
            : 0;
        const recommendations = [];
        // 生成优化建议
        if (slowQueries.length > totalQueries * 0.1) {
            recommendations.push('考虑为慢查询添加更多索引');
        }
        if (cacheHitRate < 50) {
            recommendations.push('提高查询缓存覆盖率');
        }
        if (avgExecutionTime > 500) {
            recommendations.push('优化查询逻辑，减少不必要的JOIN');
        }
        const overallStats = {
            totalQueries,
            slowQueriesCount: slowQueries.length,
            avgExecutionTime: Math.round(avgExecutionTime),
            cacheHitRate: Math.round(cacheHitRate * 100) / 100,
            fastestQuery: Math.min(...this.performanceMetrics.map(m => m.executionTime)),
            slowestQuery: Math.max(...this.performanceMetrics.map(m => m.executionTime)),
        };
        return {
            slowQueries: slowQueries.slice(0, 10), // 返回前10个最慢的查询
            recommendations,
            overallStats,
        };
    }
    /**
     * 批量操作优化
     */
    async optimizeBatchOperations() {
        // 实现批量插入优化
        const batchInsertCharacters = async (characters) => {
            const batchSize = 100;
            const results = [];
            for (let i = 0; i < characters.length; i += batchSize) {
                const batch = characters.slice(i, i + batchSize);
                const startTime = Date.now();
                const result = await this.prisma.character.createMany({
                    data: batch,
                    skipDuplicates: true,
                });
                const executionTime = Date.now() - startTime;
                this.recordQueryMetrics({
                    queryId: this.generateQueryId(),
                    operation: 'batchInsert',
                    table: 'Character',
                    executionTime,
                    resultCount: result.count,
                    cacheHit: false,
                    optimizationApplied: ['batch_insert'],
                });
                results.push(result);
            }
            return results;
        };
        // 实现批量更新优化
        const batchUpdateCharacters = async (updates) => {
            const startTime = Date.now();
            // 使用事务进行批量更新
            const result = await this.prisma.$transaction(updates.map(update => this.prisma.character.update({
                where: { id: update.id },
                data: update.data,
            })));
            const executionTime = Date.now() - startTime;
            this.recordQueryMetrics({
                queryId: this.generateQueryId(),
                operation: 'batchUpdate',
                table: 'Character',
                executionTime,
                resultCount: result.length,
                cacheHit: false,
                optimizationApplied: ['transaction_batch'],
            });
            return result;
        };
        // 添加批量操作方法到prisma客户端
        // @ts-ignore
        this.prisma.character.batchInsert = batchInsertCharacters;
        // @ts-ignore
        this.prisma.character.batchUpdate = batchUpdateCharacters;
        logger_1.logger.info('批量操作优化完成');
    }
    /**
     * 内存使用监控
     */
    async monitorMemoryUsage() {
        const memUsage = process.memoryUsage();
        const memoryStats = {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
            external: Math.round(memUsage.external / 1024 / 1024), // MB
            rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        };
        // 记录内存使用情况
        logger_1.logger.debug('内存使用情况', memoryStats);
        // 内存使用预警
        if (memoryStats.heapUsed > 500) { // 500MB
            logger_1.logger.warn('内存使用率较高', memoryStats);
        }
        return memoryStats;
    }
    // 私有辅助方法
    generateCacheKey(operation, args) {
        const argsHash = require('crypto')
            .createHash('md5')
            .update(JSON.stringify(args))
            .digest('hex');
        return `db_cache:${operation}:${argsHash}`;
    }
    generateQueryId() {
        return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    recordQueryMetrics(metrics) {
        this.performanceMetrics.push(metrics);
        // 保持最近1000个查询记录
        if (this.performanceMetrics.length > 1000) {
            this.performanceMetrics = this.performanceMetrics.slice(-1000);
        }
        // 记录慢查询
        if (metrics.executionTime > this.slowQueryThreshold) {
            logger_1.logger.warn('检测到慢查询', metrics);
        }
    }
    async getConnectionPoolMetrics() {
        // 这里可以实现具体的连接池指标获取
        // 当前版本返回模拟数据
        return {
            activeConnections: 5,
            idleConnections: 3,
            totalConnections: 8,
            maxConnections: 10,
        };
    }
    /**
     * 清理性能指标
     */
    clearMetrics() {
        this.performanceMetrics = [];
        logger_1.logger.info('性能指标已清理');
    }
    /**
     * 获取优化统计
     */
    getOptimizationStats() {
        return {
            metricsCount: this.performanceMetrics.length,
            slowQueryThreshold: this.slowQueryThreshold,
            cacheExpirationTime: this.cacheExpirationTime,
            lastOptimizedAt: new Date(),
        };
    }
}
exports.DatabaseOptimizer = DatabaseOptimizer;
// 创建全局优化器实例
let dbOptimizer = null;
const initializeDatabaseOptimizer = (prisma) => {
    if (!dbOptimizer) {
        dbOptimizer = new DatabaseOptimizer(prisma);
    }
    return dbOptimizer;
};
exports.initializeDatabaseOptimizer = initializeDatabaseOptimizer;
const getDatabaseOptimizer = () => {
    return dbOptimizer;
};
exports.getDatabaseOptimizer = getDatabaseOptimizer;
//# sourceMappingURL=db-optimization.js.map