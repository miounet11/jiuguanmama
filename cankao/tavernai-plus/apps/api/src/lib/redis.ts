import Redis, { RedisOptions, Cluster, ClusterOptions } from 'ioredis';
import { logger } from './logger';

// Redis connection configuration
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
    nodes: Array<{ host: string; port: number }>;
    options?: ClusterOptions;
  };
}

class RedisManager {
  private redis: Redis | Cluster | null = null;
  private config: RedisConfig;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(config: RedisConfig) {
    this.config = config;
  }

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    try {
      if (this.config.cluster) {
        // Cluster mode
        const clusterOptions: ClusterOptions = {
          enableOfflineQueue: false,
          redisOptions: {
            password: this.config.password,
            connectTimeout: this.config.connectTimeout || 10000,
            maxRetriesPerRequest: this.config.maxRetriesPerRequest || 3,
          },
          ...this.config.cluster.options,
        };

        this.redis = new Redis.Cluster(this.config.cluster.nodes, clusterOptions);

        this.redis.on('connect', () => {
          logger.info('Redis cluster connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
        });

        this.redis.on('error', (error) => {
          logger.error('Redis cluster error:', error);
          this.isConnected = false;
        });

        this.redis.on('close', () => {
          logger.warn('Redis cluster connection closed');
          this.isConnected = false;
          this.handleReconnect();
        });

      } else {
        // Single instance mode
        const options: RedisOptions = {
          host: this.config.host,
          port: this.config.port,
          password: this.config.password,
          db: this.config.db || 0,
          connectTimeout: this.config.connectTimeout || 10000,
          maxRetriesPerRequest: this.config.maxRetriesPerRequest || 3,
          retryDelayOnFailover: this.config.retryDelayOnFailover || 100,
          lazyConnect: this.config.lazyConnect || true,
        };

        this.redis = new Redis(options);

        this.redis.on('connect', () => {
          logger.info('Redis connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
        });

        this.redis.on('error', (error) => {
          logger.error('Redis error:', error);
          this.isConnected = false;
        });

        this.redis.on('close', () => {
          logger.warn('Redis connection closed');
          this.isConnected = false;
          this.handleReconnect();
        });

        this.redis.on('reconnecting', () => {
          logger.info('Redis reconnecting...');
        });
      }

      // Initial connection for non-lazy connections
      if (!this.config.lazyConnect) {
        await this.redis.ping();
        logger.info('Redis ping successful');
      }

    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Handle automatic reconnection
   */
  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    logger.info(`Attempting to reconnect to Redis (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        logger.error('Reconnection failed:', error);
      }
    }, delay);
  }

  /**
   * Get Redis instance
   */
  getClient(): Redis | Cluster | null {
    return this.redis;
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected && !!this.redis;
  }

  /**
   * Gracefully disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isConnected = false;
      logger.info('Redis disconnected');
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; latency?: number }> {
    if (!this.redis || !this.isConnected) {
      return { status: 'disconnected' };
    }

    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      return { status: 'connected', latency };
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return { status: 'error' };
    }
  }

  /**
   * Cache operations wrapper with error handling
   */
  async safeGet(key: string): Promise<string | null> {
    try {
      if (!this.isReady()) return null;
      return await this.redis!.get(key);
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  }

  async safeSet(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (!this.isReady()) return false;
      if (ttl) {
        await this.redis!.setex(key, ttl, value);
      } else {
        await this.redis!.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  }

  async safeDel(key: string): Promise<boolean> {
    try {
      if (!this.isReady()) return false;
      await this.redis!.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  }

  async safeExists(key: string): Promise<boolean> {
    try {
      if (!this.isReady()) return false;
      const result = await this.redis!.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  }
}

// Create Redis configuration from environment
const createRedisConfig = (): RedisConfig => {
  const config: RedisConfig = {
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
let redisManager: RedisManager | null = null;

/**
 * Initialize Redis connection
 */
export const initRedis = async (): Promise<RedisManager> => {
  if (!redisManager) {
    const config = createRedisConfig();
    redisManager = new RedisManager(config);
    await redisManager.connect();
  }
  return redisManager;
};

/**
 * Get Redis manager instance
 */
export const getRedisManager = (): RedisManager | null => {
  return redisManager;
};

/**
 * Get Redis client directly
 */
export const getRedisClient = (): Redis | Cluster | null => {
  return redisManager?.getClient() || null;
};

/**
 * Close Redis connection
 */
export const closeRedis = async (): Promise<void> => {
  if (redisManager) {
    await redisManager.disconnect();
    redisManager = null;
  }
};

// Cache key helpers
export const CacheKeys = {
  USER_SESSION: (userId: string) => `session:${userId}`,
  API_RESPONSE: (endpoint: string, params: string) => `api:${endpoint}:${params}`,
  EXTENSION_DATA: (extensionId: string) => `extension:${extensionId}`,
  STREAMING_SESSION: (sessionId: string) => `stream:${sessionId}`,
  RATE_LIMIT: (identifier: string) => `ratelimit:${identifier}`,
  CONFIG: (configId: string) => `config:${configId}`,
  USER_PREFERENCES: (userId: string) => `preferences:${userId}`,
} as const;

export default redisManager;