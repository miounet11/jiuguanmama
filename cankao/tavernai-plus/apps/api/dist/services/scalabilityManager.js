"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScalabilityManager = void 0;
const events_1 = require("events");
const cluster_1 = __importDefault(require("cluster"));
const performanceMonitor_1 = __importDefault(require("./performanceMonitor"));
const cacheManager_1 = __importDefault(require("./cacheManager"));
const databaseOptimizer_1 = __importDefault(require("./databaseOptimizer"));
const loadBalancer_1 = __importDefault(require("./loadBalancer"));
class ScalabilityManager extends events_1.EventEmitter {
    static instance;
    config;
    lastScalingAction = 0;
    isScaling = false;
    metrics = [];
    monitoringInterval;
    static getInstance() {
        if (!ScalabilityManager.instance) {
            ScalabilityManager.instance = new ScalabilityManager();
        }
        return ScalabilityManager.instance;
    }
    constructor() {
        super();
        this.config = {
            autoScaling: {
                enabled: true,
                minInstances: 2,
                maxInstances: 8,
                targetCpuUtilization: 70,
                targetMemoryUtilization: 75,
                scaleUpThreshold: 80,
                scaleDownThreshold: 30,
                cooldownPeriod: 300 // 5分钟
            },
            database: {
                connectionPoolSize: 20,
                queryTimeout: 10000,
                enableReadReplicas: false
            },
            cache: {
                distributedCache: false,
                maxMemoryUsage: 512,
                evictionPolicy: 'lru'
            },
            rateLimit: {
                enabled: true,
                maxRequestsPerMinute: 1000,
                burstLimit: 100
            }
        };
        this.setupEventListeners();
    }
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听性能指标变化
        performanceMonitor_1.default.on('metrics', (metrics) => {
            this.handlePerformanceMetrics(metrics);
        });
        // 监听工作进程状态变化
        loadBalancer_1.default.on('worker:health_changed', (workerId, health, issues) => {
            if (health === 'critical') {
                this.handleUnhealthyWorker(workerId, issues);
            }
        });
        // 监听缓存状态变化
        this.on('cache:memory_pressure', () => {
            this.handleCacheMemoryPressure();
        });
    }
    /**
     * 初始化可扩展性管理器
     */
    async initialize() {
        try {
            console.log('🚀 初始化可扩展性管理器...');
            // 1. 初始化数据库优化
            await databaseOptimizer_1.default.initialize();
            // 2. 预热缓存
            await cacheManager_1.default.warmup();
            // 3. 启动负载均衡器
            if (cluster_1.default.isPrimary) {
                loadBalancer_1.default.start();
            }
            // 4. 启动性能监控
            performanceMonitor_1.default.startMonitoring();
            // 5. 启动可扩展性监控
            this.startMonitoring();
            console.log('✅ 可扩展性管理器初始化完成');
        }
        catch (error) {
            console.error('❌ 可扩展性管理器初始化失败:', error);
            throw error;
        }
    }
    /**
     * 启动监控
     */
    startMonitoring() {
        this.monitoringInterval = setInterval(() => {
            this.collectScalabilityMetrics();
            this.evaluateScaling();
        }, 30000); // 每30秒监控一次
        console.log('📊 可扩展性监控已启动');
    }
    /**
     * 停止监控
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
        console.log('⏹️ 可扩展性监控已停止');
    }
    /**
     * 收集可扩展性指标
     */
    async collectScalabilityMetrics() {
        try {
            const loadBalancerStatus = loadBalancer_1.default.getStatus();
            const cacheStats = cacheManager_1.default.getStats();
            const performanceMetrics = performanceMonitor_1.default.getCurrentMetrics();
            const dbStats = await databaseOptimizer_1.default.getPerformanceStats();
            const metrics = {
                timestamp: new Date(),
                instances: {
                    total: loadBalancerStatus.workerCount,
                    healthy: loadBalancerStatus.stats.healthyWorkers,
                    cpu: loadBalancerStatus.stats.avgCpu,
                    memory: loadBalancerStatus.stats.avgMemory
                },
                requests: {
                    perSecond: performanceMetrics?.api.requestCount || 0,
                    queueLength: 0, // 简化实现
                    avgResponseTime: performanceMetrics?.api.responseTime || 0,
                    errorRate: performanceMetrics?.api.errorRate || 0
                },
                database: {
                    activeConnections: 1, // 简化实现
                    queryTime: performanceMetrics?.database.queryTime || 0,
                    queueLength: 0 // 简化实现
                },
                cache: {
                    hitRate: performanceMetrics?.cache.hitRate || 0,
                    memoryUsage: performanceMetrics?.cache.memoryUsage || 0,
                    evictions: 0 // 简化实现
                }
            };
            this.metrics.push(metrics);
            // 保留最近1000条记录
            if (this.metrics.length > 1000) {
                this.metrics = this.metrics.slice(-1000);
            }
            this.emit('metrics', metrics);
        }
        catch (error) {
            console.error('收集可扩展性指标失败:', error);
        }
    }
    /**
     * 评估是否需要扩容或缩容
     */
    evaluateScaling() {
        if (!this.config.autoScaling.enabled || this.isScaling) {
            return;
        }
        const now = Date.now();
        if (now - this.lastScalingAction < this.config.autoScaling.cooldownPeriod * 1000) {
            return; // 冷却期内，不进行扩容/缩容
        }
        const recentMetrics = this.metrics.slice(-5); // 最近5次指标
        if (recentMetrics.length < 3) {
            return; // 指标不足
        }
        const avgCpu = recentMetrics.reduce((sum, m) => sum + m.instances.cpu, 0) / recentMetrics.length;
        const avgMemory = recentMetrics.reduce((sum, m) => sum + m.instances.memory, 0) / recentMetrics.length;
        const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.requests.avgResponseTime, 0) / recentMetrics.length;
        const errorRate = recentMetrics.reduce((sum, m) => sum + m.requests.errorRate, 0) / recentMetrics.length;
        const currentInstances = recentMetrics[recentMetrics.length - 1].instances.total;
        // 扩容条件
        const shouldScaleUp = (avgCpu > this.config.autoScaling.scaleUpThreshold ||
            avgMemory > this.config.autoScaling.scaleUpThreshold ||
            avgResponseTime > 2000 ||
            errorRate > 5) &&
            currentInstances < this.config.autoScaling.maxInstances;
        // 缩容条件
        const shouldScaleDown = avgCpu < this.config.autoScaling.scaleDownThreshold &&
            avgMemory < this.config.autoScaling.scaleDownThreshold &&
            avgResponseTime < 500 &&
            errorRate < 1 &&
            currentInstances > this.config.autoScaling.minInstances;
        if (shouldScaleUp) {
            this.scaleUp();
        }
        else if (shouldScaleDown) {
            this.scaleDown();
        }
    }
    /**
     * 扩容
     */
    async scaleUp() {
        this.isScaling = true;
        this.lastScalingAction = Date.now();
        try {
            console.log('📈 触发扩容操作');
            // 使用负载均衡器启动新的工作进程
            const newWorker = loadBalancer_1.default.startWorker();
            if (newWorker) {
                // 等待新实例就绪
                await this.waitForWorkerReady(newWorker.id);
                // 预热新实例的缓存
                await this.warmupNewInstance(newWorker.id);
                console.log('✅ 扩容操作完成');
                this.emit('scaled:up', newWorker.id);
            }
            else {
                console.log('⚠️ 扩容失败：无法创建新的工作进程');
            }
        }
        catch (error) {
            console.error('❌ 扩容操作失败:', error);
        }
        finally {
            this.isScaling = false;
        }
    }
    /**
     * 缩容
     */
    async scaleDown() {
        this.isScaling = true;
        this.lastScalingAction = Date.now();
        try {
            console.log('📉 触发缩容操作');
            const loadBalancerStatus = loadBalancer_1.default.getStatus();
            // 找到负载最低的健康工作进程
            const lightestWorker = loadBalancerStatus.workers
                .filter(w => w.status === 'online' && w.health === 'healthy')
                .sort((a, b) => a.requests - b.requests)[0];
            if (lightestWorker) {
                // 优雅关闭工作进程
                await loadBalancer_1.default.shutdownWorker(lightestWorker.id);
                console.log('✅ 缩容操作完成');
                this.emit('scaled:down', lightestWorker.id);
            }
            else {
                console.log('⚠️ 缩容失败：没有可关闭的工作进程');
            }
        }
        catch (error) {
            console.error('❌ 缩容操作失败:', error);
        }
        finally {
            this.isScaling = false;
        }
    }
    /**
     * 等待工作进程就绪
     */
    waitForWorkerReady(workerId) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('工作进程启动超时'));
            }, 30000);
            const checkReady = () => {
                const status = loadBalancer_1.default.getStatus();
                const worker = status.workers.find(w => w.id === workerId);
                if (worker && worker.status === 'online' && worker.health === 'healthy') {
                    clearTimeout(timeout);
                    resolve();
                }
                else {
                    setTimeout(checkReady, 500);
                }
            };
            checkReady();
        });
    }
    /**
     * 预热新实例
     */
    async warmupNewInstance(workerId) {
        try {
            // 这里可以向新实例发送预热请求
            // 例如：预加载常用数据、建立数据库连接等
            console.log(`🔥 为工作进程 ${workerId} 进行预热`);
            // 模拟预热过程
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log(`✅ 工作进程 ${workerId} 预热完成`);
        }
        catch (error) {
            console.error(`❌ 工作进程 ${workerId} 预热失败:`, error);
        }
    }
    /**
     * 处理性能指标
     */
    handlePerformanceMetrics(metrics) {
        // 检查是否需要紧急扩容
        if (metrics.cpu.usage > 95 || metrics.memory.usage > 95) {
            console.log('🚨 检测到资源严重不足，触发紧急扩容');
            this.emergencyScaleUp();
        }
        // 检查缓存内存压力
        if (metrics.cache.memoryUsage > this.config.cache.maxMemoryUsage * 0.9) {
            this.emit('cache:memory_pressure');
        }
    }
    /**
     * 处理不健康的工作进程
     */
    handleUnhealthyWorker(workerId, issues) {
        console.log(`⚠️ 检测到不健康的工作进程 ${workerId}: ${issues.join(', ')}`);
        // 如果当前健康工作进程数量不足，立即启动新的工作进程
        const status = loadBalancer_1.default.getStatus();
        const healthyWorkers = status.workers.filter(w => w.health === 'healthy').length;
        if (healthyWorkers < this.config.autoScaling.minInstances) {
            console.log('🚨 健康工作进程不足，启动替换进程');
            this.emergencyScaleUp();
        }
    }
    /**
     * 处理缓存内存压力
     */
    handleCacheMemoryPressure() {
        console.log('🧹 缓存内存压力过高，执行清理操作');
        // 清理过期的缓存项
        cacheManager_1.default.flush('search'); // 清理搜索缓存
        cacheManager_1.default.flush('trending'); // 清理热门内容缓存
        // 如果仍然有压力，考虑增加缓存容量或调整TTL
        this.emit('cache:pressure_handled');
    }
    /**
     * 紧急扩容
     */
    async emergencyScaleUp() {
        if (this.isScaling)
            return;
        console.log('🚨 执行紧急扩容');
        // 忽略冷却期，立即扩容
        this.lastScalingAction = 0;
        await this.scaleUp();
    }
    /**
     * 获取可扩展性报告
     */
    getScalabilityReport() {
        const recentMetrics = this.metrics.slice(-10);
        const currentMetrics = recentMetrics[recentMetrics.length - 1] || null;
        let trend = 'stable';
        let recommendations = [];
        if (recentMetrics.length >= 3) {
            const recent = recentMetrics.slice(-3);
            const avgCpu = recent.reduce((sum, m) => sum + m.instances.cpu, 0) / recent.length;
            const avgMemory = recent.reduce((sum, m) => sum + m.instances.memory, 0) / recent.length;
            const avgResponseTime = recent.reduce((sum, m) => sum + m.requests.avgResponseTime, 0) / recent.length;
            if (avgCpu > 80 || avgMemory > 80 || avgResponseTime > 2000) {
                trend = 'increasing';
                recommendations.push('考虑增加实例数量或优化性能');
            }
            else if (avgCpu < 30 && avgMemory < 30 && avgResponseTime < 500) {
                trend = 'decreasing';
                recommendations.push('可以考虑减少实例数量以节省资源');
            }
            // 缓存建议
            if (recent.some(m => m.cache.hitRate < 60)) {
                recommendations.push('优化缓存策略以提高命中率');
            }
            // 数据库建议
            if (recent.some(m => m.database.queryTime > 1000)) {
                recommendations.push('优化数据库查询性能');
            }
        }
        const loadBalancerStatus = loadBalancer_1.default.getStatus();
        return {
            config: this.config,
            metrics: {
                current: currentMetrics,
                trend,
                recommendations
            },
            instances: {
                total: loadBalancerStatus.workerCount,
                healthy: loadBalancerStatus.stats.healthyWorkers,
                target: this.calculateTargetInstances()
            },
            performance: {
                avgCpu: recentMetrics.reduce((sum, m) => sum + m.instances.cpu, 0) / recentMetrics.length || 0,
                avgMemory: recentMetrics.reduce((sum, m) => sum + m.instances.memory, 0) / recentMetrics.length || 0,
                avgResponseTime: recentMetrics.reduce((sum, m) => sum + m.requests.avgResponseTime, 0) / recentMetrics.length || 0,
                errorRate: recentMetrics.reduce((sum, m) => sum + m.requests.errorRate, 0) / recentMetrics.length || 0
            }
        };
    }
    /**
     * 计算目标实例数
     */
    calculateTargetInstances() {
        const recentMetrics = this.metrics.slice(-5);
        if (recentMetrics.length === 0) {
            return this.config.autoScaling.minInstances;
        }
        const avgCpu = recentMetrics.reduce((sum, m) => sum + m.instances.cpu, 0) / recentMetrics.length;
        const avgMemory = recentMetrics.reduce((sum, m) => sum + m.instances.memory, 0) / recentMetrics.length;
        // 基于CPU和内存使用率计算理想实例数
        const cpuBasedInstances = Math.ceil((avgCpu / this.config.autoScaling.targetCpuUtilization) * recentMetrics[0].instances.total);
        const memoryBasedInstances = Math.ceil((avgMemory / this.config.autoScaling.targetMemoryUtilization) * recentMetrics[0].instances.total);
        const targetInstances = Math.max(cpuBasedInstances, memoryBasedInstances);
        return Math.max(this.config.autoScaling.minInstances, Math.min(this.config.autoScaling.maxInstances, targetInstances));
    }
    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('⚙️ 可扩展性配置已更新');
        this.emit('config:updated', this.config);
    }
    /**
     * 手动扩容
     */
    async manualScaleUp() {
        console.log('📈 手动触发扩容');
        this.lastScalingAction = 0; // 重置冷却期
        await this.scaleUp();
    }
    /**
     * 手动缩容
     */
    async manualScaleDown() {
        console.log('📉 手动触发缩容');
        this.lastScalingAction = 0; // 重置冷却期
        await this.scaleDown();
    }
}
exports.ScalabilityManager = ScalabilityManager;
exports.default = ScalabilityManager.getInstance();
//# sourceMappingURL=scalabilityManager.js.map