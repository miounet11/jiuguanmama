"use strict";
/**
 * 实时监控和自动扩缩容系统
 * 参考 new-api 的监控设计，实现智能化运维
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitorService = void 0;
const events_1 = require("events");
const server_1 = require("../server");
const os_1 = __importDefault(require("os"));
const server_2 = require("../server");
class MonitorService extends events_1.EventEmitter {
    metrics;
    alertRules = new Map();
    alertStates = new Map();
    autoScaleConfig;
    metricsHistory;
    isCollecting = false;
    constructor() {
        super();
        this.metrics = this.initializeMetrics();
        this.metricsHistory = new MetricsHistory();
        this.autoScaleConfig = this.loadAutoScaleConfig();
        this.initialize();
    }
    initializeMetrics() {
        return {
            cpu: {
                usage: 0,
                cores: os_1.default.cpus().length,
                loadAvg: [0, 0, 0]
            },
            memory: {
                total: 0,
                used: 0,
                free: 0,
                percentage: 0
            },
            disk: {
                total: 0,
                used: 0,
                free: 0,
                percentage: 0
            },
            network: {
                rx: 0,
                tx: 0
            },
            requests: {
                total: 0,
                success: 0,
                failed: 0,
                pending: 0,
                rpm: 0,
                avgLatency: 0
            },
            models: {
                usage: new Map(),
                costs: new Map(),
                errors: new Map()
            },
            users: {
                active: 0,
                online: 0,
                new: 0
            },
            revenue: {
                today: 0,
                week: 0,
                month: 0
            }
        };
    }
    async initialize() {
        await this.loadAlertRules();
        this.startMetricsCollection();
        this.startAutoScale();
        this.setupRealtimeBroadcast();
    }
    // 开始收集指标
    startMetricsCollection() {
        if (this.isCollecting)
            return;
        this.isCollecting = true;
        // 每秒收集一次系统指标
        setInterval(() => {
            this.collectSystemMetrics();
        }, 1000);
        // 每10秒收集一次业务指标
        setInterval(() => {
            this.collectBusinessMetrics();
        }, 10000);
        // 每分钟检查告警规则
        setInterval(() => {
            this.checkAlertRules();
        }, 60000);
        console.log('✅ 监控服务已启动');
    }
    // 收集系统指标
    collectSystemMetrics() {
        // CPU使用率
        const cpus = os_1.default.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });
        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;
        this.metrics.cpu.usage = 100 - ~~(100 * idle / total);
        this.metrics.cpu.loadAvg = os_1.default.loadavg();
        // 内存使用
        const totalMem = os_1.default.totalmem();
        const freeMem = os_1.default.freemem();
        this.metrics.memory.total = totalMem;
        this.metrics.memory.free = freeMem;
        this.metrics.memory.used = totalMem - freeMem;
        this.metrics.memory.percentage = ((totalMem - freeMem) / totalMem) * 100;
        // 记录历史
        this.metricsHistory.record('cpu', this.metrics.cpu.usage);
        this.metricsHistory.record('memory', this.metrics.memory.percentage);
        // 发出事件
        this.emit('metrics:system', {
            cpu: this.metrics.cpu,
            memory: this.metrics.memory
        });
    }
    // 收集业务指标
    async collectBusinessMetrics() {
        try {
            // 请求统计
            const requestStats = await server_1.prisma.usageLog.aggregate({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 60000) // 最近1分钟
                    }
                },
                _count: true,
                _avg: {
                    responseTime: true
                }
            });
            this.metrics.requests.rpm = requestStats._count;
            this.metrics.requests.avgLatency = requestStats._avg.responseTime || 0;
            // 模型使用统计（简化版 - 模型字段尚未在UsageLog中实现）
            const totalRequests = await server_1.prisma.usageLog.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 3600000) // 最近1小时
                    }
                }
            });
            this.metrics.models.usage.clear();
            this.metrics.models.costs.clear();
            // 暂时使用总计数，待模型字段实现后完善
            this.metrics.models.usage.set('total', totalRequests);
            this.metrics.models.costs.set('total', 0);
            // 用户统计
            const activeUsers = await server_1.prisma.user.count({
                where: {
                    lastLoginAt: {
                        gte: new Date(Date.now() - 86400000) // 24小时内
                    }
                }
            });
            this.metrics.users.active = activeUsers;
            // 收入统计
            const revenueToday = await server_1.prisma.transaction.aggregate({
                where: {
                    status: 'success',
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                },
                _sum: {
                    amount: true
                }
            });
            this.metrics.revenue.today = revenueToday._sum.amount || 0;
            // 发出事件
            this.emit('metrics:business', {
                requests: this.metrics.requests,
                models: Object.fromEntries(this.metrics.models.usage),
                users: this.metrics.users,
                revenue: this.metrics.revenue
            });
        }
        catch (error) {
            console.error('收集业务指标失败:', error);
        }
    }
    // 检查告警规则
    async checkAlertRules() {
        for (const [ruleId, rule] of this.alertRules) {
            const value = this.getMetricValue(rule.metric);
            const triggered = this.evaluateCondition(value, rule.operator, rule.threshold);
            const state = this.alertStates.get(ruleId) || new AlertState(ruleId);
            if (triggered) {
                state.increment();
                // 检查是否达到持续时间要求
                if (state.duration >= rule.duration && !state.isAlerting) {
                    // 检查冷却时间
                    if (!state.lastAlertTime ||
                        Date.now() - state.lastAlertTime.getTime() > rule.cooldown * 1000) {
                        await this.triggerAlert(rule, value);
                        state.isAlerting = true;
                        state.lastAlertTime = new Date();
                    }
                }
            }
            else {
                state.reset();
            }
            this.alertStates.set(ruleId, state);
        }
    }
    // 触发告警
    async triggerAlert(rule, value) {
        console.warn(`⚠️ 告警触发: ${rule.name}, 当前值: ${value}, 阈值: ${rule.threshold}`);
        // 记录告警
        await server_1.prisma.alert.create({
            data: {
                type: 'monitor',
                severity: rule.severity,
                title: rule.name,
                message: `${rule.name}: ${rule.metric} = ${value} ${rule.operator} ${rule.threshold}`,
                source: 'system_monitor',
                metadata: JSON.stringify({
                    ruleId: rule.id,
                    metric: rule.metric,
                    value,
                    threshold: rule.threshold,
                    operator: rule.operator
                })
            }
        });
        // 执行告警动作
        for (const action of rule.actions) {
            await this.executeAlertAction(action, rule, value);
        }
        // 发出告警事件
        this.emit('alert:triggered', {
            rule,
            value,
            timestamp: new Date()
        });
    }
    // 执行告警动作
    async executeAlertAction(action, rule, value) {
        switch (action.type) {
            case 'email':
                // 发送告警邮件
                await this.sendAlertEmail(action.config, rule, value);
                break;
            case 'webhook':
                // 调用 Webhook
                await this.callWebhook(action.config, rule, value);
                break;
            case 'scale':
                // 触发扩缩容
                await this.triggerAutoScale(action.config);
                break;
            case 'restart':
                // 重启服务
                console.log('触发服务重启...');
                break;
        }
    }
    // 自动扩缩容
    startAutoScale() {
        if (!this.autoScaleConfig.enabled)
            return;
        setInterval(async () => {
            const shouldScale = this.evaluateScaling();
            if (shouldScale === 'up') {
                await this.scaleUp();
            }
            else if (shouldScale === 'down') {
                await this.scaleDown();
            }
        }, 30000); // 每30秒检查一次
    }
    // 评估是否需要扩缩容
    evaluateScaling() {
        const cpuUsage = this.metrics.cpu.usage;
        const memUsage = this.metrics.memory.percentage;
        const rpm = this.metrics.requests.rpm;
        // 扩容条件
        if (cpuUsage > this.autoScaleConfig.targetCPU * this.autoScaleConfig.scaleUpThreshold ||
            memUsage > this.autoScaleConfig.targetMemory * this.autoScaleConfig.scaleUpThreshold ||
            rpm > this.autoScaleConfig.targetRPS * 60 * this.autoScaleConfig.scaleUpThreshold) {
            return 'up';
        }
        // 缩容条件
        if (cpuUsage < this.autoScaleConfig.targetCPU * this.autoScaleConfig.scaleDownThreshold &&
            memUsage < this.autoScaleConfig.targetMemory * this.autoScaleConfig.scaleDownThreshold &&
            rpm < this.autoScaleConfig.targetRPS * 60 * this.autoScaleConfig.scaleDownThreshold) {
            return 'down';
        }
        return null;
    }
    // 扩容
    async scaleUp() {
        console.log('🚀 执行扩容操作');
        // 这里可以调用 K8s API 或云服务 API 进行扩容
        this.emit('scale:up', {
            timestamp: new Date(),
            metrics: this.metrics
        });
    }
    // 缩容
    async scaleDown() {
        console.log('📉 执行缩容操作');
        // 这里可以调用 K8s API 或云服务 API 进行缩容
        this.emit('scale:down', {
            timestamp: new Date(),
            metrics: this.metrics
        });
    }
    // 实时广播
    setupRealtimeBroadcast() {
        // 每秒向前端广播系统指标
        setInterval(() => {
            server_2.io.emit('metrics:realtime', {
                cpu: this.metrics.cpu.usage,
                memory: this.metrics.memory.percentage,
                rpm: this.metrics.requests.rpm,
                latency: this.metrics.requests.avgLatency,
                timestamp: Date.now()
            });
        }, 1000);
        // 每分钟广播完整指标
        setInterval(() => {
            server_2.io.emit('metrics:full', this.metrics);
        }, 60000);
    }
    // 获取指标值
    getMetricValue(metric) {
        const parts = metric.split('.');
        let value = this.metrics;
        for (const part of parts) {
            value = value[part];
            if (value === undefined)
                return 0;
        }
        return typeof value === 'number' ? value : 0;
    }
    // 评估条件
    evaluateCondition(value, operator, threshold) {
        switch (operator) {
            case 'gt': return value > threshold;
            case 'lt': return value < threshold;
            case 'eq': return value === threshold;
            case 'gte': return value >= threshold;
            case 'lte': return value <= threshold;
            default: return false;
        }
    }
    // 加载告警规则
    async loadAlertRules() {
        // 默认规则
        const defaultRules = [
            {
                id: 'high-cpu',
                name: '高 CPU 使用率',
                metric: 'cpu.usage',
                operator: 'gt',
                threshold: 80,
                duration: 300,
                severity: 'warning',
                actions: [
                    { type: 'email', config: { to: 'admin@example.com' } }
                ],
                cooldown: 1800
            },
            {
                id: 'high-memory',
                name: '高内存使用率',
                metric: 'memory.percentage',
                operator: 'gt',
                threshold: 90,
                duration: 300,
                severity: 'critical',
                actions: [
                    { type: 'email', config: { to: 'admin@example.com' } },
                    { type: 'scale', config: { action: 'up' } }
                ],
                cooldown: 1800
            },
            {
                id: 'high-error-rate',
                name: '高错误率',
                metric: 'requests.errorRate',
                operator: 'gt',
                threshold: 5,
                duration: 60,
                severity: 'critical',
                actions: [
                    { type: 'webhook', config: { url: 'https://hooks.slack.com/...' } }
                ],
                cooldown: 600
            }
        ];
        defaultRules.forEach(rule => {
            this.alertRules.set(rule.id, rule);
        });
    }
    // 加载自动扩缩容配置
    loadAutoScaleConfig() {
        return {
            enabled: process.env.AUTO_SCALE_ENABLED === 'true',
            minInstances: parseInt(process.env.AUTO_SCALE_MIN || '1'),
            maxInstances: parseInt(process.env.AUTO_SCALE_MAX || '10'),
            targetCPU: 70,
            targetMemory: 80,
            targetRPS: 100,
            scaleUpThreshold: 1.2,
            scaleDownThreshold: 0.8,
            cooldownPeriod: 300
        };
    }
    // 发送告警邮件
    async sendAlertEmail(config, rule, value) {
        // 实现邮件发送逻辑
        console.log(`发送告警邮件到 ${config.to}`);
    }
    // 调用 Webhook
    async callWebhook(config, rule, value) {
        // 实现 Webhook 调用逻辑
        console.log(`调用 Webhook: ${config.url}`);
    }
    // 触发自动扩缩容
    async triggerAutoScale(config) {
        if (config.action === 'up') {
            await this.scaleUp();
        }
        else if (config.action === 'down') {
            await this.scaleDown();
        }
    }
    // 公共方法：获取当前指标
    getMetrics() {
        return this.metrics;
    }
    // 公共方法：获取历史指标
    getHistory(metric, duration) {
        return this.metricsHistory.get(metric, duration);
    }
    // 公共方法：添加自定义告警规则
    addAlertRule(rule) {
        this.alertRules.set(rule.id, rule);
    }
    // 公共方法：删除告警规则
    removeAlertRule(ruleId) {
        this.alertRules.delete(ruleId);
    }
}
// 告警状态
class AlertState {
    ruleId;
    duration;
    isAlerting;
    lastAlertTime;
    constructor(ruleId, duration = 0, isAlerting = false, lastAlertTime) {
        this.ruleId = ruleId;
        this.duration = duration;
        this.isAlerting = isAlerting;
        this.lastAlertTime = lastAlertTime;
    }
    increment() {
        this.duration++;
    }
    reset() {
        this.duration = 0;
        this.isAlerting = false;
    }
}
// 指标历史记录
class MetricsHistory {
    data = new Map();
    maxSize = 3600; // 保留1小时的秒级数据
    record(metric, value) {
        if (!this.data.has(metric)) {
            this.data.set(metric, []);
        }
        const history = this.data.get(metric);
        history.push(value);
        // 限制大小
        if (history.length > this.maxSize) {
            history.shift();
        }
    }
    get(metric, duration) {
        const history = this.data.get(metric) || [];
        const start = Math.max(0, history.length - duration);
        return history.slice(start);
    }
}
exports.monitorService = new MonitorService();
//# sourceMappingURL=monitor.js.map