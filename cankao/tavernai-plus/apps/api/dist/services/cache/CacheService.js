"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const lru_cache_1 = require("lru-cache");
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
class CacheService extends events_1.EventEmitter {
    redis = null;
    memoryCache;
    distributedLocks = new Map();
    stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        evictions: 0,
        hitRate: 0,
        totalKeys: 0,
        memoryUsage: 0,
        avgAccessTime: 0
    };
    tiers = [
        {
            name: 'L3-Memory',
            type: 'memory',
            priority: 1,
            stats: { ...this.stats }
        },
        {
            name: 'L4-Redis',
            type: 'redis',
            priority: 2,
            stats: { ...this.stats }
        }
    ];
    constructor() {
        super();
        // Initialize memory cache (L3)
        this.memoryCache = new lru_cache_1.LRUCache({
            max: 1000, // Maximum number of items
            maxSize: 100 * 1024 * 1024, // 100MB max size
            sizeCalculation: (value) => {
                return JSON.stringify(value).length;
            },
            ttl: 1000 * 60 * 5, // 5 minutes default TTL
            allowStale: false,
            updateAgeOnGet: true,
            updateAgeOnHas: false,
            dispose: (value, key, reason) => {
                this.stats.evictions++;
                this.emit('evicted', { key, reason });
            }
        });
        this.initializeRedis();
        this.startCleanupInterval();
    }
    /**
     * Initialize Redis connection (L4 cache)
     */
    async initializeRedis() {
        try {
            if (process.env.REDIS_URL) {
                this.redis = new ioredis_1.default(process.env.REDIS_URL, {
                    retryDelayOnFailover: 100,
                    enableReadyCheck: false,
                    maxRetriesPerRequest: 3,
                    lazyConnect: true
                });
                this.redis.on('connect', () => {
                    logger_1.logger.info('Redis cache connected');
                });
                this.redis.on('error', (error) => {
                    logger_1.logger.error('Redis cache error', { error: error.message });
                });
                this.redis.on('close', () => {
                    logger_1.logger.warn('Redis cache connection closed');
                });
                await this.redis.connect();
            }
            else {
                logger_1.logger.warn('Redis URL not configured, using memory cache only');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Redis cache', {
                error: error instanceof Error ? error.message : String(error)
            });
            this.redis = null;
        }
    }
    /**
     * Get value from cache with multi-tier fallback
     */
    async get(key, options = {}) {
        const startTime = Date.now();
        const namespacedKey = this.getNamespacedKey(key, options.namespace);
        try {
            // L3: Memory cache first
            const memoryValue = this.memoryCache.get(namespacedKey);
            if (memoryValue !== undefined) {
                this.recordHit('memory', Date.now() - startTime);
                this.emit('cacheHit', { key: namespacedKey, tier: 'memory' });
                return memoryValue;
            }
            // L4: Redis cache fallback
            if (this.redis) {
                const redisValue = await this.redis.get(namespacedKey);
                if (redisValue !== null) {
                    const parsedValue = this.deserialize(redisValue, options.serializer);
                    // Promote to memory cache
                    this.memoryCache.set(namespacedKey, parsedValue, {
                        ttl: (options.ttl || 300) * 1000 // Convert to milliseconds
                    });
                    this.recordHit('redis', Date.now() - startTime);
                    this.emit('cacheHit', { key: namespacedKey, tier: 'redis' });
                    return parsedValue;
                }
            }
            // Cache miss
            this.recordMiss(Date.now() - startTime);
            this.emit('cacheMiss', { key: namespacedKey });
            return null;
        }
        catch (error) {
            logger_1.logger.error('Cache get error', {
                key: namespacedKey,
                error: error instanceof Error ? error.message : String(error)
            });
            this.recordMiss(Date.now() - startTime);
            return null;
        }
    }
    /**
     * Set value in cache across all tiers
     */
    async set(key, value, options = {}) {
        const namespacedKey = this.getNamespacedKey(key, options.namespace);
        const ttl = options.ttl || 300; // 5 minutes default
        try {
            // Serialize value
            const serializedValue = this.serialize(value, options.serializer);
            // L3: Set in memory cache
            this.memoryCache.set(namespacedKey, value, {
                ttl: ttl * 1000, // Convert to milliseconds
                sizeCalculation: options.maxSize
            });
            // L4: Set in Redis cache
            if (this.redis) {
                if (ttl > 0) {
                    await this.redis.setex(namespacedKey, ttl, serializedValue);
                }
                else {
                    await this.redis.set(namespacedKey, serializedValue);
                }
            }
            this.stats.sets++;
            this.stats.totalKeys++;
            this.emit('cacheSet', {
                key: namespacedKey,
                ttl,
                size: serializedValue.length
            });
            logger_1.logger.debug('Cache set completed', {
                key: namespacedKey,
                ttl,
                size: serializedValue.length
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Cache set error', {
                key: namespacedKey,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    /**
     * Delete key from all cache tiers
     */
    async delete(key, options = {}) {
        const namespacedKey = this.getNamespacedKey(key, options.namespace);
        try {
            // Delete from memory cache
            const memoryDeleted = this.memoryCache.delete(namespacedKey);
            // Delete from Redis cache
            let redisDeleted = false;
            if (this.redis) {
                const result = await this.redis.del(namespacedKey);
                redisDeleted = result > 0;
            }
            if (memoryDeleted || redisDeleted) {
                this.stats.deletes++;
                this.stats.totalKeys = Math.max(0, this.stats.totalKeys - 1);
                this.emit('cacheDelete', { key: namespacedKey });
            }
            return memoryDeleted || redisDeleted;
        }
        catch (error) {
            logger_1.logger.error('Cache delete error', {
                key: namespacedKey,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    /**
     * Check if key exists in any cache tier
     */
    async exists(key, options = {}) {
        const namespacedKey = this.getNamespacedKey(key, options.namespace);
        try {
            // Check memory cache
            if (this.memoryCache.has(namespacedKey)) {
                return true;
            }
            // Check Redis cache
            if (this.redis) {
                const exists = await this.redis.exists(namespacedKey);
                return exists === 1;
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error('Cache exists error', {
                key: namespacedKey,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    /**
     * Get multiple keys at once
     */
    async mget(keys, options = {}) {
        const results = {};
        for (const key of keys) {
            results[key] = await this.get(key, options);
        }
        return results;
    }
    /**
     * Set multiple key-value pairs
     */
    async mset(data, options = {}) {
        try {
            const promises = Object.entries(data).map(([key, value]) => this.set(key, value, options));
            const results = await Promise.all(promises);
            return results.every(result => result === true);
        }
        catch (error) {
            logger_1.logger.error('Cache mset error', {
                keys: Object.keys(data),
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    /**
     * Increment numeric value
     */
    async increment(key, amount = 1, options = {}) {
        const namespacedKey = this.getNamespacedKey(key, options.namespace);
        try {
            // Try Redis first for atomic operation
            if (this.redis) {
                const result = await this.redis.incrby(namespacedKey, amount);
                // Update memory cache
                this.memoryCache.set(namespacedKey, result, {
                    ttl: (options.ttl || 300) * 1000
                });
                return result;
            }
            // Fallback to memory cache (not atomic)
            const current = this.memoryCache.get(namespacedKey) || 0;
            const newValue = (typeof current === 'number' ? current : 0) + amount;
            this.memoryCache.set(namespacedKey, newValue, {
                ttl: (options.ttl || 300) * 1000
            });
            return newValue;
        }
        catch (error) {
            logger_1.logger.error('Cache increment error', {
                key: namespacedKey,
                amount,
                error: error instanceof Error ? error.message : String(error)
            });
            return 0;
        }
    }
    /**
     * Acquire distributed lock
     */
    async acquireLock(lockKey, ttl = 30, timeout = 5000) {
        const lockId = `lock:${lockKey}`;
        const holder = `${process.pid}:${Date.now()}:${Math.random()}`;
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            try {
                // Try Redis first for true distributed locking
                if (this.redis) {
                    const result = await this.redis.set(lockId, holder, 'EX', ttl, 'NX');
                    if (result === 'OK') {
                        logger_1.logger.debug('Distributed lock acquired', { lockKey, holder });
                        return holder;
                    }
                }
                else {
                    // Fallback to in-memory locking (single process only)
                    const existing = this.distributedLocks.get(lockId);
                    if (!existing || existing.expires < Date.now()) {
                        this.distributedLocks.set(lockId, {
                            expires: Date.now() + (ttl * 1000),
                            holder
                        });
                        logger_1.logger.debug('Memory lock acquired', { lockKey, holder });
                        return holder;
                    }
                }
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            catch (error) {
                logger_1.logger.error('Lock acquisition error', {
                    lockKey,
                    error: error instanceof Error ? error.message : String(error)
                });
                break;
            }
        }
        logger_1.logger.warn('Failed to acquire lock', { lockKey, timeout });
        return null;
    }
    /**
     * Release distributed lock
     */
    async releaseLock(lockKey, holder) {
        const lockId = `lock:${lockKey}`;
        try {
            if (this.redis) {
                // Use Lua script for atomic check-and-delete
                const script = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end
        `;
                const result = await this.redis.eval(script, 1, lockId, holder);
                const released = result === 1;
                if (released) {
                    logger_1.logger.debug('Distributed lock released', { lockKey, holder });
                }
                return released;
            }
            else {
                // In-memory lock release
                const existing = this.distributedLocks.get(lockId);
                if (existing && existing.holder === holder) {
                    this.distributedLocks.delete(lockId);
                    logger_1.logger.debug('Memory lock released', { lockKey, holder });
                    return true;
                }
                return false;
            }
        }
        catch (error) {
            logger_1.logger.error('Lock release error', {
                lockKey,
                holder,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    /**
     * Invalidate cache by pattern
     */
    async invalidatePattern(pattern, options = {}) {
        const namespacedPattern = this.getNamespacedKey(pattern, options.namespace);
        let deletedCount = 0;
        try {
            // Memory cache pattern deletion
            for (const key of this.memoryCache.keys()) {
                if (this.matchPattern(key, namespacedPattern)) {
                    this.memoryCache.delete(key);
                    deletedCount++;
                }
            }
            // Redis pattern deletion
            if (this.redis) {
                const keys = await this.redis.keys(namespacedPattern);
                if (keys.length > 0) {
                    const result = await this.redis.del(...keys);
                    deletedCount += result;
                }
            }
            logger_1.logger.info('Cache pattern invalidated', {
                pattern: namespacedPattern,
                deletedCount
            });
            return deletedCount;
        }
        catch (error) {
            logger_1.logger.error('Cache pattern invalidation error', {
                pattern: namespacedPattern,
                error: error instanceof Error ? error.message : String(error)
            });
            return 0;
        }
    }
    /**
     * Get cache statistics
     */
    getStats() {
        // Update memory usage
        this.stats.memoryUsage = this.memoryCache.calculatedSize || 0;
        this.stats.totalKeys = this.memoryCache.size;
        this.stats.hitRate = this.stats.hits + this.stats.misses > 0
            ? this.stats.hits / (this.stats.hits + this.stats.misses)
            : 0;
        return {
            ...this.stats,
            tiers: [...this.tiers]
        };
    }
    /**
     * Clear all caches
     */
    async clear(namespace) {
        try {
            if (namespace) {
                // Clear specific namespace
                await this.invalidatePattern(`${namespace}:*`);
            }
            else {
                // Clear all caches
                this.memoryCache.clear();
                if (this.redis) {
                    await this.redis.flushdb();
                }
            }
            logger_1.logger.info('Cache cleared', { namespace });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Cache clear error', {
                namespace,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    /**
     * Health check
     */
    async healthCheck() {
        const health = {
            memory: true,
            redis: true,
            overall: true
        };
        try {
            // Test memory cache
            const testKey = '__health_check__';
            this.memoryCache.set(testKey, 'test');
            const memoryValue = this.memoryCache.get(testKey);
            health.memory = memoryValue === 'test';
            this.memoryCache.delete(testKey);
        }
        catch (error) {
            health.memory = false;
        }
        try {
            // Test Redis cache
            if (this.redis) {
                await this.redis.ping();
            }
        }
        catch (error) {
            health.redis = false;
        }
        health.overall = health.memory && (health.redis || !this.redis);
        return health;
    }
    // Private helper methods
    getNamespacedKey(key, namespace) {
        const ns = namespace || 'default';
        return `${ns}:${key}`;
    }
    serialize(value, serializer = 'json') {
        switch (serializer) {
            case 'json':
                return JSON.stringify(value);
            case 'msgpack':
                // Implementation would require msgpack library
                return JSON.stringify(value);
            default:
                return JSON.stringify(value);
        }
    }
    deserialize(value, serializer = 'json') {
        switch (serializer) {
            case 'json':
                return JSON.parse(value);
            case 'msgpack':
                // Implementation would require msgpack library
                return JSON.parse(value);
            default:
                return JSON.parse(value);
        }
    }
    recordHit(tier, accessTime) {
        this.stats.hits++;
        this.updateAccessTime(accessTime);
        const tierStats = this.tiers.find(t => t.name.toLowerCase().includes(tier));
        if (tierStats) {
            tierStats.stats.hits++;
        }
    }
    recordMiss(accessTime) {
        this.stats.misses++;
        this.updateAccessTime(accessTime);
    }
    updateAccessTime(accessTime) {
        const totalAccesses = this.stats.hits + this.stats.misses;
        this.stats.avgAccessTime = (this.stats.avgAccessTime * (totalAccesses - 1) + accessTime) / totalAccesses;
    }
    matchPattern(key, pattern) {
        // Simple pattern matching with * wildcard
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(key);
    }
    startCleanupInterval() {
        setInterval(() => {
            this.cleanupExpiredLocks();
        }, 60000); // Every minute
    }
    cleanupExpiredLocks() {
        const now = Date.now();
        let cleanedCount = 0;
        for (const [lockId, lock] of this.distributedLocks.entries()) {
            if (lock.expires < now) {
                this.distributedLocks.delete(lockId);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            logger_1.logger.debug('Cleaned up expired locks', { count: cleanedCount });
        }
    }
    /**
     * Shutdown cache service
     */
    async shutdown() {
        logger_1.logger.info('Shutting down cache service');
        if (this.redis) {
            await this.redis.quit();
        }
        this.memoryCache.clear();
        this.distributedLocks.clear();
        this.removeAllListeners();
    }
}
exports.CacheService = CacheService;
// Singleton instance
exports.cacheService = new CacheService();
// Graceful shutdown
process.on('SIGTERM', () => {
    exports.cacheService.shutdown();
});
process.on('SIGINT', () => {
    exports.cacheService.shutdown();
});
//# sourceMappingURL=CacheService.js.map