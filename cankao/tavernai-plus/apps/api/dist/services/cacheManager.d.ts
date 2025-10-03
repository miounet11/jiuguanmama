export interface CacheConfig {
    ttl: number;
    checkPeriod: number;
    maxKeys: number;
}
export interface CacheStats {
    hits: number;
    misses: number;
    keys: number;
    ksize: number;
    vsize: number;
}
export declare class CacheManager {
    private static instance;
    private caches;
    private stats;
    private readonly defaultConfigs;
    static getInstance(): CacheManager;
    constructor();
    /**
     * 初始化所有缓存实例
     */
    private initializeCaches;
    /**
     * 获取缓存值
     */
    get<T>(cacheName: string, key: string): T | undefined;
    /**
     * 设置缓存值
     */
    set<T>(cacheName: string, key: string, value: T, ttl?: number): boolean;
    /**
     * 删除缓存值
     */
    del(cacheName: string, key: string): number;
    /**
     * 清空指定缓存
     */
    flush(cacheName: string): void;
    /**
     * 清空所有缓存
     */
    flushAll(): void;
    /**
     * 获取缓存统计信息
     */
    getStats(cacheName?: string): Record<string, CacheStats> | CacheStats | null;
    /**
     * 获取缓存命中率
     */
    getHitRate(cacheName: string): number;
    /**
     * 获取所有缓存的命中率
     */
    getAllHitRates(): Record<string, number>;
    /**
     * 检查缓存健康状况
     */
    getHealthStatus(): {
        status: 'healthy' | 'warning' | 'critical';
        issues: string[];
        recommendations: string[];
    };
    /**
     * 预热缓存
     */
    warmup(): Promise<void>;
    /**
     * 缓存装饰器工厂
     */
    cache(cacheName: string, keyGenerator: (...args: any[]) => string, ttl?: number): (target: any, propertyName: string, descriptor: PropertyDescriptor) => void;
    /**
     * 智能缓存失效
     */
    invalidatePattern(cacheName: string, pattern: string): number;
    /**
     * 批量操作
     */
    mget<T>(cacheName: string, keys: string[]): Record<string, T>;
    /**
     * 批量设置
     */
    mset<T>(cacheName: string, keyValuePairs: Record<string, T>, ttl?: number): boolean;
}
declare const _default: CacheManager;
export default _default;
//# sourceMappingURL=cacheManager.d.ts.map