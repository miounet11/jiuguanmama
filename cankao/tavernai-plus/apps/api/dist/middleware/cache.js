"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpCache = httpCache;
exports.apiCache = apiCache;
exports.userCache = userCache;
exports.contentCache = contentCache;
exports.cacheInvalidation = cacheInvalidation;
exports.smartCache = smartCache;
exports.warmCache = warmCache;
const crypto_1 = __importDefault(require("crypto"));
const redis_1 = require("../lib/redis");
const logger_1 = require("../services/logger");
/**
 * Generate cache key from request
 */
function generateCacheKey(req, options = {}) {
    if (options.key) {
        return options.key;
    }
    if (options.keyGenerator) {
        return options.keyGenerator(req);
    }
    // Build key components
    const components = [
        req.method,
        req.originalUrl || req.url,
    ];
    // Include query parameters (excluding specified ones)
    const queryParams = { ...req.query };
    if (options.excludeParams) {
        options.excludeParams.forEach(param => delete queryParams[param]);
    }
    if (Object.keys(queryParams).length > 0) {
        const sortedQuery = Object.keys(queryParams)
            .sort()
            .map(key => `${key}=${queryParams[key]}`)
            .join('&');
        components.push(sortedQuery);
    }
    // Include specific headers
    if (options.includeHeaders) {
        const headerValues = options.includeHeaders
            .map(header => req.get(header) || '')
            .join('|');
        components.push(headerValues);
    }
    // Include vary-by headers
    if (options.varyBy) {
        const varyValues = options.varyBy
            .map(header => req.get(header) || '')
            .join('|');
        components.push(varyValues);
    }
    // Create hash of components
    const keyString = components.join('::');
    const hash = crypto_1.default.createHash('md5').update(keyString).digest('hex');
    return redis_1.CacheKeys.API_RESPONSE(req.originalUrl || req.url, hash);
}
/**
 * HTTP Response Cache Middleware
 */
function httpCache(options = {}) {
    const defaultTTL = options.ttl || 300; // 5 minutes default
    return async (req, res, next) => {
        try {
            const redisManager = (0, redis_1.getRedisManager)();
            // Skip caching if Redis is not available
            if (!redisManager || !redisManager.isReady()) {
                return next();
            }
            // Check condition
            if (options.condition && !options.condition(req)) {
                return next();
            }
            // Only cache GET requests by default
            if (req.method !== 'GET') {
                return next();
            }
            const cacheKey = generateCacheKey(req, options);
            // Try to get from cache
            const cachedData = await redisManager.safeGet(cacheKey);
            if (cachedData) {
                try {
                    const cached = JSON.parse(cachedData);
                    // Set cached headers
                    if (cached.headers) {
                        Object.entries(cached.headers).forEach(([key, value]) => {
                            res.set(key, value);
                        });
                    }
                    // Add cache headers
                    res.set('X-Cache', 'HIT');
                    res.set('X-Cache-Key', cacheKey);
                    logger_1.logger.debug(`Cache HIT for ${req.originalUrl}`);
                    return res.status(cached.status || 200).json(cached.data);
                }
                catch (error) {
                    logger_1.logger.error('Failed to parse cached data:', error);
                    // Continue to next middleware if cache parsing fails
                }
            }
            // Cache miss - intercept response
            const originalSend = res.send.bind(res);
            const originalJson = res.json.bind(res);
            let responseData;
            let statusCode = 200;
            let responseHeaders = {};
            // Override res.json to capture response
            res.json = function (data) {
                responseData = data;
                statusCode = res.statusCode;
                // Capture specific headers for caching
                if (options.includeHeaders) {
                    options.includeHeaders.forEach(header => {
                        const value = res.get(header);
                        if (value) {
                            responseHeaders[header] = value;
                        }
                    });
                }
                return originalJson(data);
            };
            // Override res.send to capture response
            res.send = function (data) {
                if (!responseData) {
                    responseData = data;
                    statusCode = res.statusCode;
                }
                return originalSend(data);
            };
            // Add cache miss header
            res.set('X-Cache', 'MISS');
            res.set('X-Cache-Key', cacheKey);
            // Store response in cache after it's sent
            res.on('finish', async () => {
                try {
                    // Only cache successful responses
                    if (statusCode >= 200 && statusCode < 300 && responseData) {
                        const cacheData = {
                            data: responseData,
                            status: statusCode,
                            headers: responseHeaders,
                            timestamp: Date.now(),
                        };
                        await redisManager.safeSet(cacheKey, JSON.stringify(cacheData), defaultTTL);
                        logger_1.logger.debug(`Cached response for ${req.originalUrl} with TTL ${defaultTTL}s`);
                    }
                }
                catch (error) {
                    logger_1.logger.error('Failed to cache response:', error);
                }
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('Cache middleware error:', error);
            next();
        }
    };
}
/**
 * API Response Cache with configurable options
 */
function apiCache(ttl = 300) {
    return httpCache({
        ttl,
        condition: (req) => req.method === 'GET',
        includeHeaders: ['Content-Type'],
        excludeParams: ['_', 'timestamp', 'cache-bust'],
    });
}
/**
 * User-specific cache
 */
function userCache(ttl = 300) {
    return httpCache({
        ttl,
        keyGenerator: (req) => {
            const userId = req.user?.id || 'anonymous';
            const path = req.originalUrl || req.url;
            const hash = crypto_1.default.createHash('md5').update(path).digest('hex');
            return `user:${userId}:${hash}`;
        },
        condition: (req) => req.method === 'GET',
    });
}
/**
 * Content-based cache with ETag support
 */
function contentCache(ttl = 600) {
    return async (req, res, next) => {
        try {
            const redisManager = (0, redis_1.getRedisManager)();
            if (!redisManager || !redisManager.isReady() || req.method !== 'GET') {
                return next();
            }
            const cacheKey = generateCacheKey(req, { ttl });
            // Check for If-None-Match header (ETag)
            const clientETag = req.get('If-None-Match');
            const cachedETag = await redisManager.safeGet(`${cacheKey}:etag`);
            if (clientETag && cachedETag && clientETag === cachedETag) {
                res.set('X-Cache', 'ETAG-HIT');
                return res.status(304).end();
            }
            // Try regular cache
            const cachedData = await redisManager.safeGet(cacheKey);
            if (cachedData) {
                try {
                    const cached = JSON.parse(cachedData);
                    res.set('X-Cache', 'HIT');
                    res.set('ETag', cached.etag || '');
                    return res.status(cached.status || 200).json(cached.data);
                }
                catch (error) {
                    logger_1.logger.error('Failed to parse cached content:', error);
                }
            }
            // Capture response for caching
            const originalJson = res.json.bind(res);
            res.json = function (data) {
                // Generate ETag from response data
                const etag = crypto_1.default.createHash('md5')
                    .update(JSON.stringify(data))
                    .digest('hex');
                res.set('ETag', etag);
                res.set('X-Cache', 'MISS');
                // Cache the response
                const cacheData = {
                    data,
                    status: res.statusCode,
                    etag,
                    timestamp: Date.now(),
                };
                Promise.all([
                    redisManager.safeSet(cacheKey, JSON.stringify(cacheData), ttl),
                    redisManager.safeSet(`${cacheKey}:etag`, etag, ttl)
                ]).catch(error => {
                    logger_1.logger.error('Failed to cache content:', error);
                });
                return originalJson(data);
            };
            next();
        }
        catch (error) {
            logger_1.logger.error('Content cache middleware error:', error);
            next();
        }
    };
}
/**
 * Cache invalidation middleware
 */
function cacheInvalidation(patterns) {
    return async (req, res, next) => {
        try {
            const redisManager = (0, redis_1.getRedisManager)();
            if (!redisManager || !redisManager.isReady()) {
                return next();
            }
            // Get patterns to invalidate
            const invalidationPatterns = typeof patterns === 'function'
                ? patterns(req)
                : patterns;
            // Invalidate cache after successful response
            res.on('finish', async () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const redis = redisManager.getClient();
                        if (redis) {
                            for (const pattern of invalidationPatterns) {
                                const keys = await redis.keys(pattern);
                                if (keys.length > 0) {
                                    await redis.del(...keys);
                                    logger_1.logger.debug(`Invalidated ${keys.length} cache entries matching: ${pattern}`);
                                }
                            }
                        }
                    }
                    catch (error) {
                        logger_1.logger.error('Cache invalidation error:', error);
                    }
                }
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('Cache invalidation middleware error:', error);
            next();
        }
    };
}
/**
 * Smart cache that varies by user agent, language, etc.
 */
function smartCache(options = {}) {
    const varyBy = [];
    if (options.varyByUserAgent)
        varyBy.push('User-Agent');
    if (options.varyByLanguage)
        varyBy.push('Accept-Language');
    if (options.varyByEncoding)
        varyBy.push('Accept-Encoding');
    return httpCache({
        ttl: options.ttl || 300,
        varyBy,
        condition: (req) => req.method === 'GET',
    });
}
/**
 * Cache warming utility
 */
async function warmCache(urls, baseUrl = '') {
    const redisManager = (0, redis_1.getRedisManager)();
    if (!redisManager || !redisManager.isReady()) {
        logger_1.logger.warn('Cannot warm cache: Redis not available');
        return;
    }
    logger_1.logger.info(`Warming cache for ${urls.length} URLs`);
    for (const url of urls) {
        try {
            const fullUrl = baseUrl + url;
            // You would typically make HTTP requests to these URLs
            // This is a placeholder for the actual implementation
            logger_1.logger.debug(`Cache warming URL: ${fullUrl}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to warm cache for ${url}:`, error);
        }
    }
}
exports.default = {
    httpCache,
    apiCache,
    userCache,
    contentCache,
    cacheInvalidation,
    smartCache,
    warmCache,
};
//# sourceMappingURL=cache.js.map