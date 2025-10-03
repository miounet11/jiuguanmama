import { EventEmitter } from 'events';
import { Worker } from 'cluster';
export interface WorkerInfo {
    id: number;
    pid: number;
    status: 'online' | 'disconnected' | 'dead' | 'starting';
    memory: number;
    cpu: number;
    requests: number;
    lastActivity: Date;
    health: 'healthy' | 'warning' | 'critical';
}
export interface LoadBalancerConfig {
    maxWorkers: number;
    minWorkers: number;
    maxRequestsPerWorker: number;
    memoryThreshold: number;
    cpuThreshold: number;
    healthCheckInterval: number;
    gracefulShutdownTimeout: number;
}
export declare class LoadBalancer extends EventEmitter {
    private static instance;
    private workers;
    private config;
    private isRunning;
    private healthCheckInterval?;
    private requestQueue;
    static getInstance(): LoadBalancer;
    constructor();
    /**
     * 设置集群事件处理器
     */
    private setupClusterHandlers;
    /**
     * 启动负载均衡器
     */
    start(): void;
    /**
     * 停止负载均衡器
     */
    stop(): Promise<void>;
    /**
     * 启动单个工作进程
     */
    startWorker(): Worker | null;
    /**
     * 关闭单个工作进程
     */
    shutdownWorker(workerId: number): Promise<void>;
    /**
     * 启动健康检查
     */
    private startHealthCheck;
    /**
     * 检查工作进程健康状况
     */
    private checkWorkerHealth;
    /**
     * 负载均衡
     */
    private balanceLoad;
    /**
     * 重启工作进程
     */
    private restartWorker;
    /**
     * 更新工作进程统计信息
     */
    private updateWorkerStats;
    /**
     * 获取最佳工作进程
     */
    getBestWorker(): Worker | null;
    /**
     * 获取负载均衡状态
     */
    getStatus(): {
        isRunning: boolean;
        workerCount: number;
        config: LoadBalancerConfig;
        workers: WorkerInfo[];
        stats: {
            totalRequests: number;
            avgMemory: number;
            avgCpu: number;
            healthyWorkers: number;
        };
    };
    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<LoadBalancerConfig>): void;
    /**
     * 处理请求分发
     */
    handleRequest<T>(handler: () => Promise<T>): Promise<T>;
}
declare const _default: LoadBalancer;
export default _default;
//# sourceMappingURL=loadBalancer.d.ts.map