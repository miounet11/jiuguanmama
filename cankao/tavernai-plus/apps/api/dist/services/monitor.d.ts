/**
 * 实时监控和自动扩缩容系统
 * 参考 new-api 的监控设计，实现智能化运维
 */
import { EventEmitter } from 'events';
interface Metrics {
    cpu: {
        usage: number;
        cores: number;
        loadAvg: number[];
    };
    memory: {
        total: number;
        used: number;
        free: number;
        percentage: number;
    };
    disk: {
        total: number;
        used: number;
        free: number;
        percentage: number;
    };
    network: {
        rx: number;
        tx: number;
    };
    requests: {
        total: number;
        success: number;
        failed: number;
        pending: number;
        rpm: number;
        avgLatency: number;
    };
    models: {
        usage: Map<string, number>;
        costs: Map<string, number>;
        errors: Map<string, number>;
    };
    users: {
        active: number;
        online: number;
        new: number;
    };
    revenue: {
        today: number;
        week: number;
        month: number;
    };
}
interface AlertRule {
    id: string;
    name: string;
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    duration: number;
    severity: 'info' | 'warning' | 'critical';
    actions: AlertAction[];
    cooldown: number;
}
interface AlertAction {
    type: 'email' | 'webhook' | 'scale' | 'restart';
    config: any;
}
declare class MonitorService extends EventEmitter {
    private metrics;
    private alertRules;
    private alertStates;
    private autoScaleConfig;
    private metricsHistory;
    private isCollecting;
    constructor();
    private initializeMetrics;
    private initialize;
    private startMetricsCollection;
    private collectSystemMetrics;
    private collectBusinessMetrics;
    private checkAlertRules;
    private triggerAlert;
    private executeAlertAction;
    private startAutoScale;
    private evaluateScaling;
    private scaleUp;
    private scaleDown;
    private setupRealtimeBroadcast;
    private getMetricValue;
    private evaluateCondition;
    private loadAlertRules;
    private loadAutoScaleConfig;
    private sendAlertEmail;
    private callWebhook;
    private triggerAutoScale;
    getMetrics(): Metrics;
    getHistory(metric: string, duration: number): number[];
    addAlertRule(rule: AlertRule): void;
    removeAlertRule(ruleId: string): void;
}
export declare const monitorService: MonitorService;
export {};
//# sourceMappingURL=monitor.d.ts.map