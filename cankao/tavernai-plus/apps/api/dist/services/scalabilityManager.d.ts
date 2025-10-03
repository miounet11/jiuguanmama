import { EventEmitter } from 'events';
export interface ScalabilityConfig {
    autoScaling: {
        enabled: boolean;
        minInstances: number;
        maxInstances: number;
        targetCpuUtilization: number;
        targetMemoryUtilization: number;
        scaleUpThreshold: number;
        scaleDownThreshold: number;
        cooldownPeriod: number;
    };
    database: {
        connectionPoolSize: number;
        queryTimeout: number;
        enableReadReplicas: boolean;
    };
    cache: {
        distributedCache: boolean;
        maxMemoryUsage: number;
        evictionPolicy: 'lru' | 'lfu' | 'fifo';
    };
    rateLimit: {
        enabled: boolean;
        maxRequestsPerMinute: number;
        burstLimit: number;
    };
}
export interface ScalabilityMetrics {
    timestamp: Date;
    instances: {
        total: number;
        healthy: number;
        cpu: number;
        memory: number;
    };
    requests: {
        perSecond: number;
        queueLength: number;
        avgResponseTime: number;
        errorRate: number;
    };
    database: {
        activeConnections: number;
        queryTime: number;
        queueLength: number;
    };
    cache: {
        hitRate: number;
        memoryUsage: number;
        evictions: number;
    };
}
export declare class ScalabilityManager extends EventEmitter {
    private static instance;
    private config;
    private lastScalingAction;
    private isScaling;
    private metrics;
    private monitoringInterval?;
    static getInstance(): ScalabilityManager;
    constructor();
    /**
     * 设置事件监听器
     */
    private setupEventListeners;
    /**
     * 初始化可扩展性管理器
     */
    initialize(): Promise<void>;
    /**
     * 启动监控
     */
    private startMonitoring;
    /**
     * 停止监控
     */
    stopMonitoring(): void;
    /**
     * 收集可扩展性指标
     */
    private collectScalabilityMetrics;
    /**
     * 评估是否需要扩容或缩容
     */
    private evaluateScaling;
    /**
     * 扩容
     */
    private scaleUp;
    /**
     * 缩容
     */
    private scaleDown;
    /**
     * 等待工作进程就绪
     */
    private waitForWorkerReady;
    /**
     * 预热新实例
     */
    private warmupNewInstance;
    /**
     * 处理性能指标
     */
    private handlePerformanceMetrics;
    /**
     * 处理不健康的工作进程
     */
    private handleUnhealthyWorker;
    /**
     * 处理缓存内存压力
     */
    private handleCacheMemoryPressure;
    /**
     * 紧急扩容
     */
    private emergencyScaleUp;
    /**
     * 获取可扩展性报告
     */
    getScalabilityReport(): {
        config: ScalabilityConfig;
        metrics: {
            current: ScalabilityMetrics | null;
            trend: string;
            recommendations: string[];
        };
        instances: {
            total: number;
            healthy: number;
            target: number;
        };
        performance: {
            avgCpu: number;
            avgMemory: number;
            avgResponseTime: number;
            errorRate: number;
        };
    };
    /**
     * 计算目标实例数
     */
    private calculateTargetInstances;
    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<ScalabilityConfig>): void;
    /**
     * 手动扩容
     */
    manualScaleUp(): Promise<void>;
    /**
     * 手动缩容
     */
    manualScaleDown(): Promise<void>;
}
declare const _default: ScalabilityManager;
export default _default;
//# sourceMappingURL=scalabilityManager.d.ts.map