/**
 * 智能中继服务 - 参考 new-api 的核心设计
 * 实现智能负载均衡、自动故障转移、请求重试等高级特性
 */
import { EventEmitter } from 'events';
export declare enum ChannelStatus {
    ACTIVE = "active",
    DISABLED = "disabled",
    EXHAUSTED = "exhausted",
    ERROR = "error",
    TESTING = "testing"
}
export interface Channel {
    id: string;
    name: string;
    type: string;
    key: string;
    endpoint?: string;
    models: string[];
    priority: number;
    weight: number;
    status: ChannelStatus;
    balance?: number;
    rpm?: number;
    tpm?: number;
    errorCount: number;
    successCount: number;
    avgLatency: number;
    lastUsedAt?: Date;
    lastErrorAt?: Date;
    metadata?: any;
}
export interface RelayContext {
    requestId: string;
    userId: string;
    model: string;
    originalModel: string;
    group?: string;
    retryCount: number;
    usedChannels: string[];
    startTime: number;
    stream: boolean;
    temperature?: number;
    maxTokens?: number;
}
declare class RelayService extends EventEmitter {
    private channels;
    private channelGroups;
    private requestQueues;
    private circuitBreakers;
    private healthChecker;
    private readonly config;
    constructor();
    private initialize;
    private loadChannels;
    private selectChannel;
    private weightedRoundRobin;
    private leastConnections;
    relay(ctx: RelayContext, requestBody: any): Promise<any>;
    private executeRequest;
    private handleStreamRequest;
    private buildHeaders;
    private buildUrl;
    private transformRequest;
    private transformResponse;
    private shouldRetry;
    private updateChannelStats;
    private logUsage;
    private startHealthCheck;
    private delay;
    private getDefaultEndpoint;
    private setupEventListeners;
    private transformToAnthropic;
    private transformFromAnthropic;
    private transformToGoogle;
    private transformFromGoogle;
    private transformStream;
    private countTokens;
    private calculateCost;
}
export declare const relayService: RelayService;
export {};
//# sourceMappingURL=relay.d.ts.map