"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseOptimizer = void 0;
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
class DatabaseOptimizer {
    static instance;
    isOptimized = false;
    static getInstance() {
        if (!DatabaseOptimizer.instance) {
            DatabaseOptimizer.instance = new DatabaseOptimizer();
        }
        return DatabaseOptimizer.instance;
    }
    /**
     * 初始化数据库优化
     */
    async initialize() {
        if (this.isOptimized)
            return;
        try {
            console.log('🔧 开始数据库优化...');
            // 1. 应用索引优化
            await this.applyIndexes();
            // 2. 优化数据库设置
            await this.optimizeSettings();
            // 3. 创建分析视图
            await this.createAnalyticsViews();
            // 4. 执行初始分析
            await this.analyzeDatabase();
            this.isOptimized = true;
            console.log('✅ 数据库优化完成');
        }
        catch (error) {
            console.error('❌ 数据库优化失败:', error);
            throw error;
        }
    }
    /**
     * 应用数据库索引
     */
    async applyIndexes() {
        try {
            const sqlPath = path_1.default.join(__dirname, '../database/optimization.sql');
            if (fs_1.default.existsSync(sqlPath)) {
                const sql = fs_1.default.readFileSync(sqlPath, 'utf8');
                // 分割SQL语句并执行
                const statements = sql
                    .split(';')
                    .map(stmt => stmt.trim())
                    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
                for (const statement of statements) {
                    if (statement.startsWith('CREATE INDEX') || statement.startsWith('CREATE VIEW')) {
                        try {
                            await prisma.$executeRawUnsafe(statement);
                        }
                        catch (error) {
                            // 忽略已存在的索引/视图错误
                            if (!error.message.includes('already exists')) {
                                console.warn(`索引/视图创建警告: ${error.message}`);
                            }
                        }
                    }
                    else if (statement === 'ANALYZE') {
                        await prisma.$executeRawUnsafe('ANALYZE');
                    }
                }
            }
            console.log('✅ 数据库索引应用完成');
        }
        catch (error) {
            console.error('❌ 应用数据库索引失败:', error);
            throw error;
        }
    }
    /**
     * 优化数据库设置
     */
    async optimizeSettings() {
        try {
            // SQLite特定优化设置
            const optimizations = [
                'PRAGMA journal_mode = WAL', // 启用WAL模式提高并发性能
                'PRAGMA synchronous = NORMAL', // 平衡安全性和性能
                'PRAGMA cache_size = -64000', // 设置64MB缓存
                'PRAGMA temp_store = memory', // 临时数据存储在内存中
                'PRAGMA mmap_size = 134217728', // 128MB内存映射
                'PRAGMA optimize' // 执行优化
            ];
            for (const pragma of optimizations) {
                try {
                    await prisma.$executeRawUnsafe(pragma);
                }
                catch (error) {
                    console.warn(`PRAGMA设置警告 (${pragma}): ${error.message}`);
                }
            }
            console.log('✅ 数据库设置优化完成');
        }
        catch (error) {
            console.error('❌ 数据库设置优化失败:', error);
        }
    }
    /**
     * 创建分析视图
     */
    async createAnalyticsViews() {
        try {
            // 推荐系统性能视图
            const recommendationPerformanceView = `
        CREATE VIEW IF NOT EXISTS RecommendationPerformanceView AS
        SELECT
          rl.algorithm,
          rl.type,
          COUNT(*) as total_recommendations,
          COUNT(rf.id) as feedback_count,
          COUNT(CASE WHEN rf.clicked = 1 THEN 1 END) as clicked_count,
          COUNT(CASE WHEN rf.useful = 1 THEN 1 END) as useful_count,
          AVG(rf.rating) as avg_rating,
          AVG(rl.confidence) as avg_confidence
        FROM RecommendationLog rl
        LEFT JOIN RecommendationFeedback rf ON rl.id = rf.recommendationId
        WHERE rl.createdAt > datetime('now', '-30 days')
        GROUP BY rl.algorithm, rl.type
      `;
            // 用户活跃度分析视图
            const userActivityView = `
        CREATE VIEW IF NOT EXISTS UserActivityView AS
        SELECT
          u.id,
          u.username,
          COUNT(DISTINCT ub.id) as behavior_count,
          COUNT(DISTINCT c.id) as conversation_count,
          COUNT(DISTINCT p.id) as post_count,
          MAX(ub.timestamp) as last_activity,
          COUNT(DISTINCT DATE(ub.timestamp)) as active_days
        FROM User u
        LEFT JOIN UserBehavior ub ON u.id = ub.userId AND ub.timestamp > datetime('now', '-30 days')
        LEFT JOIN Conversation c ON u.id = c.userId AND c.createdAt > datetime('now', '-30 days')
        LEFT JOIN Post p ON u.id = p.authorId AND p.createdAt > datetime('now', '-30 days')
        WHERE u.isActive = 1
        GROUP BY u.id, u.username
      `;
            // 内容受欢迎度视图
            const contentPopularityView = `
        CREATE VIEW IF NOT EXISTS ContentPopularityView AS
        SELECT
          'character' as content_type,
          c.id as content_id,
          c.name as content_name,
          COUNT(DISTINCT conv.id) as interaction_count,
          COUNT(DISTINCT ub.id) as behavior_count,
          AVG(CASE WHEN ub.action = 'rate' THEN ub.weight END) as avg_rating,
          c.createdAt
        FROM Character c
        LEFT JOIN Conversation conv ON c.id = conv.characterId
        LEFT JOIN UserBehavior ub ON c.id = ub.targetId AND ub.targetType = 'character'
        WHERE c.isPublic = 1 AND c.isDeleted = 0
        GROUP BY c.id, c.name, c.createdAt

        UNION ALL

        SELECT
          'post' as content_type,
          p.id as content_id,
          SUBSTR(p.content, 1, 50) || '...' as content_name,
          COUNT(DISTINCT l.id) + COUNT(DISTINCT com.id) as interaction_count,
          COUNT(DISTINCT ub.id) as behavior_count,
          NULL as avg_rating,
          p.createdAt
        FROM Post p
        LEFT JOIN Like l ON p.id = l.postId
        LEFT JOIN Comment com ON p.id = com.postId
        LEFT JOIN UserBehavior ub ON p.id = ub.targetId AND ub.targetType = 'post'
        WHERE p.isDeleted = 0 AND p.visibility = 'public'
        GROUP BY p.id, p.content, p.createdAt
      `;
            await prisma.$executeRawUnsafe(recommendationPerformanceView);
            await prisma.$executeRawUnsafe(userActivityView);
            await prisma.$executeRawUnsafe(contentPopularityView);
            console.log('✅ 分析视图创建完成');
        }
        catch (error) {
            console.error('❌ 创建分析视图失败:', error);
        }
    }
    /**
     * 分析数据库统计信息
     */
    async analyzeDatabase() {
        try {
            await prisma.$executeRawUnsafe('ANALYZE');
            console.log('✅ 数据库统计分析完成');
        }
        catch (error) {
            console.error('❌ 数据库分析失败:', error);
        }
    }
    /**
     * 获取数据库性能统计
     */
    async getPerformanceStats() {
        try {
            // 基础统计信息
            const stats = await Promise.all([
                prisma.user.count({ where: { isActive: true } }),
                prisma.character.count({ where: { isPublic: true, isDeleted: false } }),
                prisma.conversation.count(),
                prisma.userBehavior.count({
                    where: {
                        timestamp: {
                            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        }
                    }
                }),
                prisma.recommendationLog.count({
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        }
                    }
                })
            ]);
            // 推荐系统性能
            const recommendationPerformance = await prisma.$queryRaw `
        SELECT
          algorithm,
          COUNT(*) as count,
          AVG(confidence) as avgConfidence
        FROM RecommendationLog
        WHERE createdAt > datetime('now', '-7 days')
        GROUP BY algorithm
      `;
            // 用户活跃度
            const userActivity = await prisma.$queryRaw `
        SELECT
          COUNT(DISTINCT userId) as activeUsers,
          COUNT(*) as totalBehaviors
        FROM UserBehavior
        WHERE timestamp > datetime('now', '-24 hours')
      `;
            return {
                basic: {
                    activeUsers: stats[0],
                    publicCharacters: stats[1],
                    totalConversations: stats[2],
                    recentBehaviors: stats[3],
                    recentRecommendations: stats[4]
                },
                recommendation: recommendationPerformance,
                activity: userActivity[0] || { activeUsers: 0, totalBehaviors: 0 }
            };
        }
        catch (error) {
            console.error('获取性能统计失败:', error);
            return null;
        }
    }
    /**
     * 清理过期数据
     */
    async cleanupExpiredData() {
        try {
            console.log('🧹 开始清理过期数据...');
            // 清理90天前的用户行为数据
            const behaviorCleanup = await prisma.userBehavior.deleteMany({
                where: {
                    timestamp: {
                        lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
                    }
                }
            });
            // 清理30天前的推荐日志
            const logCleanup = await prisma.recommendationLog.deleteMany({
                where: {
                    createdAt: {
                        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            });
            // 清理过期的模型性能记录（保留系统级别的记录）
            const performanceCleanup = await prisma.modelPerformance.deleteMany({
                where: {
                    timestamp: {
                        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    },
                    NOT: {
                        modelType: 'recommendation_global'
                    }
                }
            });
            console.log(`✅ 过期数据清理完成:`);
            console.log(`   - 用户行为记录: ${behaviorCleanup.count}`);
            console.log(`   - 推荐日志: ${logCleanup.count}`);
            console.log(`   - 性能记录: ${performanceCleanup.count}`);
        }
        catch (error) {
            console.error('❌ 清理过期数据失败:', error);
        }
    }
    /**
     * 优化查询性能
     */
    async optimizeQueries() {
        try {
            console.log('🔍 执行查询优化...');
            // 重新分析数据库
            await prisma.$executeRawUnsafe('ANALYZE');
            // 执行SQLite优化
            await prisma.$executeRawUnsafe('PRAGMA optimize');
            // 检查并重建可能碎片化的索引
            await prisma.$executeRawUnsafe('REINDEX');
            console.log('✅ 查询优化完成');
        }
        catch (error) {
            console.error('❌ 查询优化失败:', error);
        }
    }
    /**
     * 监控数据库健康状况
     */
    async healthCheck() {
        const issues = [];
        const recommendations = [];
        try {
            // 检查数据库大小
            const dbInfo = await prisma.$queryRaw `
        SELECT
          page_count * page_size as size_bytes,
          page_count,
          page_size
        FROM pragma_page_count(), pragma_page_size()
      `;
            const sizeGB = dbInfo[0]?.size_bytes / (1024 * 1024 * 1024) || 0;
            if (sizeGB > 2) {
                issues.push(`数据库大小较大: ${sizeGB.toFixed(2)}GB`);
                recommendations.push('考虑数据归档或分片');
            }
            // 检查最近的用户活动
            const recentActivity = await prisma.userBehavior.count({
                where: {
                    timestamp: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                }
            });
            if (recentActivity < 10) {
                issues.push('用户活动较低');
                recommendations.push('检查推荐系统有效性');
            }
            // 检查推荐系统性能
            const recommendationFeedback = await prisma.recommendationFeedback.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    },
                    clicked: true
                }
            });
            const totalRecommendations = await prisma.recommendationLog.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            });
            const clickRate = totalRecommendations > 0 ? recommendationFeedback / totalRecommendations : 0;
            if (clickRate < 0.1) {
                issues.push(`推荐点击率较低: ${(clickRate * 100).toFixed(1)}%`);
                recommendations.push('优化推荐算法参数');
            }
            const status = issues.length === 0 ? 'healthy' :
                issues.length <= 2 ? 'warning' : 'critical';
            return { status, issues, recommendations };
        }
        catch (error) {
            console.error('健康检查失败:', error);
            return {
                status: 'critical',
                issues: ['数据库健康检查失败'],
                recommendations: ['检查数据库连接和权限']
            };
        }
    }
    /**
     * 获取慢查询分析
     */
    async getSlowQueryAnalysis() {
        try {
            // 在生产环境中，这里应该分析实际的慢查询日志
            // 当前返回模拟的分析结果
            return [
                {
                    query: 'RecommendationEngine.getCharacterRecommendations',
                    avgExecutionTime: '150ms',
                    frequency: 'high',
                    suggestion: '考虑添加用户行为缓存'
                },
                {
                    query: 'Community.getTrendingPosts',
                    avgExecutionTime: '200ms',
                    frequency: 'medium',
                    suggestion: '优化时间范围查询'
                }
            ];
        }
        catch (error) {
            console.error('慢查询分析失败:', error);
            return [];
        }
    }
}
exports.DatabaseOptimizer = DatabaseOptimizer;
exports.default = DatabaseOptimizer.getInstance();
//# sourceMappingURL=databaseOptimizer.js.map