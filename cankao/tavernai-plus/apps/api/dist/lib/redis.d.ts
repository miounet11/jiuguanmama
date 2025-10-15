import Redis, { Cluster, ClusterOptions } from 'ioredis';
interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    maxRetriesPerRequest?: number;
    retryDelayOnFailover?: number;
    connectTimeout?: number;
    lazyConnect?: boolean;
    cluster?: {
        nodes: Array<{
            host: string;
            port: number;
        }>;
        options?: ClusterOptions;
    };
}
declare class RedisManager {
    private redis;
    private config;
    private isConnected;
    private reconnectAttempts;
    private maxReconnectAttempts;
    constructor(config: RedisConfig);
    /**
     * Initialize Redis connection
     */
    connect(): Promise<void>;
    /**
     * Handle automatic reconnection
     */
    private handleReconnect;
    /**
     * Get Redis instance
     */
    getClient(): Redis | Cluster | null;
    /**
     * Check if Redis is connected
     */
    isReady(): boolean;
    /**
     * Gracefully disconnect from Redis
     */
    disconnect(): Promise<void>;
    /**
     * Health check
     */
    healthCheck(): Promise<{
        status: string;
        latency?: number;
    }>;
    /**
     * Cache operations wrapper with error handling
     */
    safeGet(key: string): Promise<string | null>;
    safeSet(key: string, value: string, ttl?: number): Promise<boolean>;
    safeDel(key: string): Promise<boolean>;
    safeExists(key: string): Promise<boolean>;
}
declare let redisManager: RedisManager | null;
/**
 * Initialize Redis connection
 */
export declare const initRedis: () => Promise<RedisManager>;
/**
 * Get Redis manager instance
 */
export declare const getRedisManager: () => RedisManager | null;
/**
 * Get Redis client directly
 */
export declare const getRedisClient: () => Redis | Cluster | null;
/**
 * Close Redis connection
 */
export declare const closeRedis: () => Promise<void>;
export declare const CacheKeys: {
    readonly USER_SESSION: (userId: string) => string;
    readonly API_RESPONSE: (endpoint: string, params: string) => string;
    readonly EXTENSION_DATA: (extensionId: string) => string;
    readonly STREAMING_SESSION: (sessionId: string) => string;
    readonly RATE_LIMIT: (identifier: string) => string;
    readonly CONFIG: (configId: string) => string;
    readonly USER_PREFERENCES: (userId: string) => string;
};
export default redisManager;
//# sourceMappingURL=redis.d.ts.map