"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const performanceMonitor_1 = __importDefault(require("../services/performanceMonitor"));
const cacheManager_1 = __importDefault(require("../services/cacheManager"));
const databaseOptimizer_1 = __importDefault(require("../services/databaseOptimizer"));
const scalabilityManager_1 = __importDefault(require("../services/scalabilityManager"));
const loadBalancer_1 = __importDefault(require("../services/loadBalancer"));
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// 系统健康检查（详细版）
router.get('/health/detailed', auth_1.authenticate, async (req, res) => {
    try {
        // 检查管理员权限
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user?.isAdmin) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }
        // 获取各组件健康状况
        const [performanceMetrics, cacheHealth, dbHealth, scalabilityReport, loadBalancerStatus] = await Promise.all([
            performanceMonitor_1.default.getCurrentMetrics(),
            cacheManager_1.default.getHealthStatus(),
            databaseOptimizer_1.default.healthCheck(),
            scalabilityManager_1.default.getScalabilityReport(),
            loadBalancer_1.default.getStatus()
        ]);
        res.json({
            success: true,
            data: {
                timestamp: new Date().toISOString(),
                overall: {
                    status: 'healthy', // 简化实现
                    uptime: process.uptime(),
                    version: '1.0.0'
                },
                performance: performanceMetrics,
                cache: cacheHealth,
                database: dbHealth,
                scalability: scalabilityReport,
                loadBalancer: loadBalancerStatus
            }
        });
    }
    catch (error) {
        console.error('获取系统健康状况失败:', error);
        res.status(500).json({
            success: false,
            message: '获取系统健康状况失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
// 性能报告
router.get('/performance/report', auth_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user?.isAdmin) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }
        const { hours = 24 } = req.query;
        const report = performanceMonitor_1.default.getPerformanceReport(Number(hours));
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        console.error('获取性能报告失败:', error);
        res.status(500).json({
            success: false,
            message: '获取性能报告失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
// 缓存统计
router.get('/cache/stats', auth_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user?.isAdmin) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }
        const stats = cacheManager_1.default.getStats();
        const hitRates = cacheManager_1.default.getAllHitRates();
        res.json({
            success: true,
            data: {
                stats,
                hitRates,
                health: cacheManager_1.default.getHealthStatus()
            }
        });
    }
    catch (error) {
        console.error('获取缓存统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取缓存统计失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
// 清理缓存
router.post('/cache/flush', auth_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user?.isAdmin) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }
        const { cacheName } = req.body;
        if (cacheName) {
            cacheManager_1.default.flush(cacheName);
        }
        else {
            cacheManager_1.default.flushAll();
        }
        res.json({
            success: true,
            message: cacheName ? `${cacheName}缓存已清理` : '所有缓存已清理'
        });
    }
    catch (error) {
        console.error('清理缓存失败:', error);
        res.status(500).json({
            success: false,
            message: '清理缓存失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
// 数据库优化统计
router.get('/database/stats', auth_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user?.isAdmin) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }
        const [stats, healthCheck, slowQueries] = await Promise.all([
            databaseOptimizer_1.default.getPerformanceStats(),
            databaseOptimizer_1.default.healthCheck(),
            databaseOptimizer_1.default.getSlowQueryAnalysis()
        ]);
        res.json({
            success: true,
            data: {
                stats,
                health: healthCheck,
                slowQueries
            }
        });
    }
    catch (error) {
        console.error('获取数据库统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取数据库统计失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
// 清理过期数据
router.post('/database/cleanup', auth_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user?.isAdmin) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }
        await databaseOptimizer_1.default.cleanupExpiredData();
        res.json({
            success: true,
            message: '过期数据清理完成'
        });
    }
    catch (error) {
        console.error('清理过期数据失败:', error);
        res.status(500).json({
            success: false,
            message: '清理过期数据失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
// 优化查询性能
router.post('/database/optimize', auth_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user?.isAdmin) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }
        await databaseOptimizer_1.default.optimizeQueries();
        res.json({
            success: true,
            message: '数据库优化完成'
        });
    }
    catch (error) {
        console.error('数据库优化失败:', error);
        res.status(500).json({
            success: false,
            message: '数据库优化失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
// 可扩展性报告
router.get('/scalability/report', auth_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user?.isAdmin) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }
        const report = scalabilityManager_1.default.getScalabilityReport();
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        console.error('获取可扩展性报告失败:', error);
        res.status(500).json({
            success: false,
            message: '获取可扩展性报告失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
// 手动扩容
router.post('/scalability/scale-up', auth_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user?.isAdmin) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }
        await scalabilityManager_1.default.manualScaleUp();
        res.json({
            success: true,
            message: '扩容操作已触发'
        });
    }
    catch (error) {
        console.error('手动扩容失败:', error);
        res.status(500).json({
            success: false,
            message: '手动扩容失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
// 手动缩容
router.post('/scalability/scale-down', auth_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user?.isAdmin) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }
        await scalabilityManager_1.default.manualScaleDown();
        res.json({
            success: true,
            message: '缩容操作已触发'
        });
    }
    catch (error) {
        console.error('手动缩容失败:', error);
        res.status(500).json({
            success: false,
            message: '手动缩容失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
// 负载均衡状态
router.get('/loadbalancer/status', auth_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user?.isAdmin) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }
        const status = loadBalancer_1.default.getStatus();
        res.json({
            success: true,
            data: status
        });
    }
    catch (error) {
        console.error('获取负载均衡状态失败:', error);
        res.status(500).json({
            success: false,
            message: '获取负载均衡状态失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
// 系统度量仪表板
router.get('/dashboard', auth_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user?.isAdmin) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }
        // 汇总所有关键指标
        const [performanceMetrics, cacheStats, dbStats, scalabilityReport, loadBalancerStatus, recentAlerts] = await Promise.all([
            performanceMonitor_1.default.getCurrentMetrics(),
            cacheManager_1.default.getStats(),
            databaseOptimizer_1.default.getPerformanceStats(),
            scalabilityManager_1.default.getScalabilityReport(),
            loadBalancer_1.default.getStatus(),
            performanceMonitor_1.default.getRecentAlerts(5)
        ]);
        // 计算健康评分
        const healthScore = calculateHealthScore({
            performance: performanceMetrics,
            cache: cacheManager_1.default.getHealthStatus(),
            database: await databaseOptimizer_1.default.healthCheck(),
            scalability: scalabilityReport
        });
        res.json({
            success: true,
            data: {
                timestamp: new Date().toISOString(),
                healthScore,
                summary: {
                    instances: loadBalancerStatus.workerCount,
                    avgCpu: loadBalancerStatus.stats.avgCpu,
                    avgMemory: loadBalancerStatus.stats.avgMemory,
                    cacheHitRate: Object.values(cacheManager_1.default.getAllHitRates()).reduce((sum, rate) => sum + rate, 0) / Object.keys(cacheManager_1.default.getAllHitRates()).length * 100,
                    totalRequests: loadBalancerStatus.stats.totalRequests,
                    alerts: recentAlerts.length
                },
                details: {
                    performance: performanceMetrics,
                    cache: cacheStats,
                    database: dbStats,
                    scalability: scalabilityReport,
                    loadBalancer: loadBalancerStatus,
                    alerts: recentAlerts
                }
            }
        });
    }
    catch (error) {
        console.error('获取系统仪表板失败:', error);
        res.status(500).json({
            success: false,
            message: '获取系统仪表板失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
/**
 * 计算系统健康评分
 */
/**
 * 计算系统健康评分
 */
function calculateHealthScore(components) {
    let score = 100;
    let issues = 0;
    // 性能评分
    if (components.performance) {
        if (components.performance.cpu.usage > 80)
            score -= 15;
        if (components.performance.memory.usage > 85)
            score -= 15;
        if (components.performance.api.responseTime > 2000)
            score -= 10;
        if (components.performance.api.errorRate > 5)
            score -= 20;
    }
    // 缓存评分
    if (components.cache.status !== 'healthy') {
        score -= 10;
        issues += components.cache.issues.length;
    }
    // 数据库评分
    if (components.database.status !== 'healthy') {
        score -= 15;
        issues += components.database.issues.length;
    }
    // 可扩展性评分
    if (components.scalability.metrics.trend === 'increasing') {
        score -= 5; // 负载增加，但这不是严重问题
    }
    // 每个问题扣2分
    score -= issues * 2;
    return Math.max(0, Math.min(100, score));
}
exports.default = router;
//# sourceMappingURL=system.js.map