import { EventEmitter } from 'events';
export interface CacheOptions {
    ttl: number;
    maxSize?: number;
    namespace?: string;
    compression?: boolean;
    serializer?: 'json' | 'msgpack' | 'custom';
}
export interface CacheItem<T = any> {
    key: string;
    value: T;
    ttl: number;
    createdAt: Date;
    lastAccessed: Date;
    accessCount: number;
    size: number;
}
export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    evictions: number;
    hitRate: number;
    totalKeys: number;
    memoryUsage: number;
    avgAccessTime: number;
}
export interface CacheTier {
    name: string;
    type: 'memory' | 'redis' | 'database';
    priority: number;
    stats: CacheStats;
}
export declare class CacheService extends EventEmitter {
    private redis;
    private memoryCache;
    private distributedLocks;
    private stats;
    private tiers;
    constructor();
    /**
     * Initialize Redis connection (L4 cache)
     */
    private initializeRedis;
    /**
     * Get value from cache with multi-tier fallback
     */
    get<T = any>(key: string, options?: Partial<CacheOptions>): Promise<T | null>;
    /**
     * Set value in cache across all tiers
     */
    set<T = any>(key: string, value: T, options?: Partial<CacheOptions>): Promise<boolean>;
    /**
     * Delete key from all cache tiers
     */
    delete(key: string, options?: Partial<CacheOptions>): Promise<boolean>;
    /**
     * Check if key exists in any cache tier
     */
    exists(key: string, options?: Partial<CacheOptions>): Promise<boolean>;
    /**
     * Get multiple keys at once
     */
    mget<T = any>(keys: string[], options?: Partial<CacheOptions>): Promise<Record<string, T | null>>;
    /**
     * Set multiple key-value pairs
     */
    mset<T = any>(data: Record<string, T>, options?: Partial<CacheOptions>): Promise<boolean>;
    /**
     * Increment numeric value
     */
    increment(key: string, amount?: number, options?: Partial<CacheOptions>): Promise<number>;
    /**
     * Acquire distributed lock
     */
    acquireLock(lockKey: string, ttl?: number, timeout?: number): Promise<string | null>;
    /**
     * Release distributed lock
     */
    releaseLock(lockKey: string, holder: string): Promise<boolean>;
    /**
     * Invalidate cache by pattern
     */
    invalidatePattern(pattern: string, options?: Partial<CacheOptions>): Promise<number>;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats & {
        tiers: CacheTier[];
    };
    /**
     * Clear all caches
     */
    clear(namespace?: string): Promise<boolean>;
    /**
     * Health check
     */
    healthCheck(): Promise<{
        memory: boolean;
        redis: boolean;
        overall: boolean;
    }>;
    private getNamespacedKey;
    private serialize;
    private deserialize;
    private recordHit;
    private recordMiss;
    private updateAccessTime;
    private matchPattern;
    private startCleanupInterval;
    private cleanupExpiredLocks;
    /**
     * Shutdown cache service
     */
    shutdown(): Promise<void>;
}
export declare const cacheService: CacheService;
//# sourceMappingURL=CacheService.d.ts.map