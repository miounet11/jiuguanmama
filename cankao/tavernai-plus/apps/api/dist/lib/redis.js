"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheKeys = exports.closeRedis = exports.getRedisClient = exports.getRedisManager = exports.initRedis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("./logger");
class RedisManager {
    redis = null;
    config;
    isConnected = false;
    reconnectAttempts = 0;
    maxReconnectAttempts = 10;
    constructor(config) {
        this.config = config;
    }
    /**
     * Initialize Redis connection
     */
    async connect() {
        try {
            if (this.config.cluster) {
                // Cluster mode
                const clusterOptions = {
                    enableOfflineQueue: false,
                    redisOptions: {
                        password: this.config.password,
                        connectTimeout: this.config.connectTimeout || 10000,
                        maxRetriesPerRequest: this.config.maxRetriesPerRequest || 3,
                    },
                    ...this.config.cluster.options,
                };
                this.redis = new ioredis_1.default.Cluster(this.config.cluster.nodes, clusterOptions);
                this.redis.on('connect', () => {
                    logger_1.logger.info('Redis cluster connected');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                });
                this.redis.on('error', (error) => {
                    logger_1.logger.error('Redis cluster error:', error);
                    this.isConnected = false;
                });
                this.redis.on('close', () => {
                    logger_1.logger.warn('Redis cluster connection closed');
                    this.isConnected = false;
                    this.handleReconnect();
                });
            }
            else {
                // Single instance mode
                const options = {
                    host: this.config.host,
                    port: this.config.port,
                    password: this.config.password,
                    db: this.config.db || 0,
                    connectTimeout: this.config.connectTimeout || 10000,
                    maxRetriesPerRequest: this.config.maxRetriesPerRequest || 3,
                    retryDelayOnFailover: this.config.retryDelayOnFailover || 100,
                    lazyConnect: this.config.lazyConnect || true,
                };
                this.redis = new ioredis_1.default(options);
                this.redis.on('connect', () => {
                    logger_1.logger.info('Redis connected');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                });
                this.redis.on('error', (error) => {
                    logger_1.logger.error('Redis error:', error);
                    this.isConnected = false;
                });
                this.redis.on('close', () => {
                    logger_1.logger.warn('Redis connection closed');
                    this.isConnected = false;
                    this.handleReconnect();
                });
                this.redis.on('reconnecting', () => {
                    logger_1.logger.info('Redis reconnecting...');
                });
            }
            // Initial connection for non-lazy connections
            if (!this.config.lazyConnect) {
                await this.redis.ping();
                logger_1.logger.info('Redis ping successful');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to Redis:', error);
            throw error;
        }
    }
    /**
     * Handle automatic reconnection
     */
    async handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger_1.logger.error('Max reconnection attempts reached. Giving up.');
            return;
        }
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        logger_1.logger.info(`Attempting to reconnect to Redis (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
        setTimeout(async () => {
            try {
                await this.connect();
            }
            catch (error) {
                logger_1.logger.error('Reconnection failed:', error);
            }
        }, delay);
    }
    /**
     * Get Redis instance
     */
    getClient() {
        return this.redis;
    }
    /**
     * Check if Redis is connected
     */
    isReady() {
        return this.isConnected && !!this.redis;
    }
    /**
     * Gracefully disconnect from Redis
     */
    async disconnect() {
        if (this.redis) {
            await this.redis.quit();
            this.redis = null;
            this.isConnected = false;
            logger_1.logger.info('Redis disconnected');
        }
    }
    /**
     * Health check
     */
    async healthCheck() {
        if (!this.redis || !this.isConnected) {
            return { status: 'disconnected' };
        }
        try {
            const start = Date.now();
            await this.redis.ping();
            const latency = Date.now() - start;
            return { status: 'connected', latency };
        }
        catch (error) {
            logger_1.logger.error('Redis health check failed:', error);
            return { status: 'error' };
        }
    }
    /**
     * Cache operations wrapper with error handling
     */
    async safeGet(key) {
        try {
            if (!this.isReady())
                return null;
            return await this.redis.get(key);
        }
        catch (error) {
            logger_1.logger.error('Redis GET error:', error);
            return null;
        }
    }
    async safeSet(key, value, ttl) {
        try {
            if (!this.isReady())
                return false;
            if (ttl) {
                await this.redis.setex(key, ttl, value);
            }
            else {
                await this.redis.set(key, value);
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error('Redis SET error:', error);
            return false;
        }
    }
    async safeDel(key) {
        try {
            if (!this.isReady())
                return false;
            await this.redis.del(key);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Redis DEL error:', error);
            return false;
        }
    }
    async safeExists(key) {
        try {
            if (!this.isReady())
                return false;
            const result = await this.redis.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error('Redis EXISTS error:', error);
            return false;
        }
    }
}
// Create Redis configuration from environment
const createRedisConfig = () => {
    const config = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        connectTimeout: 10000,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
    };
    // Cluster configuration
    if (process.env.REDIS_CLUSTER_NODES) {
        const nodes = process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
            const [host, port] = node.trim().split(':');
            return { host, port: parseInt(port) };
        });
        config.cluster = {
            nodes,
            options: {
                enableOfflineQueue: false,
                scaleReads: 'slave',
                maxRedirections: 16,
            },
        };
    }
    return config;
};
// Global Redis manager instance
let redisManager = null;
/**
 * Initialize Redis connection
 */
const initRedis = async () => {
    if (!redisManager) {
        const config = createRedisConfig();
        redisManager = new RedisManager(config);
        await redisManager.connect();
    }
    return redisManager;
};
exports.initRedis = initRedis;
/**
 * Get Redis manager instance
 */
const getRedisManager = () => {
    return redisManager;
};
exports.getRedisManager = getRedisManager;
/**
 * Get Redis client directly
 */
const getRedisClient = () => {
    return redisManager?.getClient() || null;
};
exports.getRedisClient = getRedisClient;
/**
 * Close Redis connection
 */
const closeRedis = async () => {
    if (redisManager) {
        await redisManager.disconnect();
        redisManager = null;
    }
};
exports.closeRedis = closeRedis;
// Cache key helpers
exports.CacheKeys = {
    USER_SESSION: (userId) => `session:${userId}`,
    API_RESPONSE: (endpoint, params) => `api:${endpoint}:${params}`,
    EXTENSION_DATA: (extensionId) => `extension:${extensionId}`,
    STREAMING_SESSION: (sessionId) => `stream:${sessionId}`,
    RATE_LIMIT: (identifier) => `ratelimit:${identifier}`,
    CONFIG: (configId) => `config:${configId}`,
    USER_PREFERENCES: (userId) => `preferences:${userId}`,
};
exports.default = redisManager;
//# sourceMappingURL=redis.js.map