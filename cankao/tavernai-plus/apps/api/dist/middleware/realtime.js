"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realtimeNotification = realtimeNotification;
exports.sessionRealtime = sessionRealtime;
exports.userRealtime = userRealtime;
exports.extensionRealtime = extensionRealtime;
exports.adminRealtime = adminRealtime;
exports.connectionStatus = connectionStatus;
exports.realtimeRateLimit = realtimeRateLimit;
exports.messageRouter = messageRouter;
exports.presenceTracking = presenceTracking;
const websocket_1 = require("../lib/websocket");
const redis_1 = require("../lib/redis");
const logger_1 = require("../services/logger");
/**
 * Real-time notification middleware
 * Emits events to WebSocket clients based on HTTP actions
 */
function realtimeNotification(options) {
    return (req, res, next) => {
        try {
            const wsManager = (0, websocket_1.getWebSocketManager)();
            if (!wsManager) {
                // Continue without real-time if WebSocket is not available
                return next();
            }
            // Capture the original response methods
            const originalSend = res.send.bind(res);
            const originalJson = res.json.bind(res);
            let responseData;
            let statusCode;
            // Override res.json to capture response data
            res.json = function (data) {
                responseData = data;
                statusCode = res.statusCode;
                return originalJson(data);
            };
            // Override res.send to capture response data
            res.send = function (data) {
                if (!responseData) {
                    responseData = data;
                    statusCode = res.statusCode;
                }
                return originalSend(data);
            };
            // Emit event after response is sent
            res.on('finish', () => {
                try {
                    // Check condition
                    if (options.condition && !options.condition(req, res)) {
                        return;
                    }
                    // Only emit for successful responses
                    if (statusCode >= 200 && statusCode < 300) {
                        const eventName = options.event || `${req.method.toLowerCase()}_${req.route?.path || req.path}`;
                        // Prepare event data
                        let eventData = responseData;
                        if (options.dataTransformer) {
                            eventData = options.dataTransformer(eventData, req, res);
                        }
                        // Include user info if requested
                        if (options.includeUser && req.user) {
                            eventData = {
                                ...eventData,
                                user: {
                                    id: req.user.id,
                                    username: req.user.username,
                                    avatar: req.user.avatar,
                                },
                            };
                        }
                        // Add metadata
                        const fullEventData = {
                            ...eventData,
                            timestamp: new Date(),
                            method: req.method,
                            path: req.originalUrl,
                        };
                        // Determine room
                        let room;
                        if (options.room) {
                            room = typeof options.room === 'function' ? options.room(req) : options.room;
                        }
                        // Emit event
                        const io = wsManager.getIO();
                        if (io) {
                            if (room) {
                                io.to(room).emit(eventName, fullEventData);
                                logger_1.logger.debug(`Real-time event emitted to room ${room}: ${eventName}`);
                            }
                            else {
                                io.emit(eventName, fullEventData);
                                logger_1.logger.debug(`Real-time event broadcasted: ${eventName}`);
                            }
                        }
                    }
                }
                catch (error) {
                    logger_1.logger.error('Real-time notification error:', error);
                }
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('Real-time middleware error:', error);
            next();
        }
    };
}
/**
 * Session-based real-time updates
 */
function sessionRealtime(options = {}) {
    return realtimeNotification({
        event: options.event || 'session_update',
        room: (req) => {
            const sessionId = req.params.sessionId || req.body.sessionId || req.query.sessionId;
            return sessionId ? `session:${sessionId}` : '';
        },
        condition: (req, res) => {
            return res.statusCode >= 200 && res.statusCode < 300;
        },
        includeUser: options.includeUser || true,
    });
}
/**
 * User-specific real-time updates
 */
function userRealtime(options = {}) {
    return (req, res, next) => {
        try {
            const wsManager = (0, websocket_1.getWebSocketManager)();
            if (!wsManager) {
                return next();
            }
            // Capture response data
            const originalJson = res.json.bind(res);
            let responseData;
            res.json = function (data) {
                responseData = data;
                return originalJson(data);
            };
            res.on('finish', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        // Get target user ID
                        const targetUserIdField = options.targetUserIdField || 'userId';
                        const targetUserId = req.params[targetUserIdField] ||
                            req.body[targetUserIdField] ||
                            req.query[targetUserIdField] ||
                            req.user?.id;
                        if (targetUserId) {
                            const eventName = options.event || 'user_update';
                            const eventData = {
                                ...responseData,
                                timestamp: new Date(),
                                method: req.method,
                                path: req.originalUrl,
                            };
                            wsManager.sendToUser(targetUserId, eventName, eventData);
                            logger_1.logger.debug(`Real-time event sent to user ${targetUserId}: ${eventName}`);
                        }
                    }
                }
                catch (error) {
                    logger_1.logger.error('User real-time notification error:', error);
                }
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('User real-time middleware error:', error);
            next();
        }
    };
}
/**
 * Extension real-time updates
 */
function extensionRealtime(options = {}) {
    return realtimeNotification({
        event: options.event || 'extension_update',
        room: (req) => {
            const extensionIdField = options.extensionIdField || 'extensionId';
            const extensionId = req.params[extensionIdField] ||
                req.body[extensionIdField] ||
                req.query[extensionIdField];
            return extensionId ? `extension:${extensionId}` : '';
        },
        condition: (req, res) => res.statusCode >= 200 && res.statusCode < 300,
        includeUser: true,
    });
}
/**
 * Admin real-time updates
 */
function adminRealtime(options = {}) {
    return realtimeNotification({
        event: options.event || 'admin_update',
        room: 'admin',
        condition: (req, res) => {
            // Check if user is admin
            if (!req.user || req.user.role !== 'admin') {
                return false;
            }
            return options.condition ? options.condition(req, res) : res.statusCode >= 200 && res.statusCode < 300;
        },
        includeUser: true,
    });
}
/**
 * Connection status middleware
 * Tracks user online/offline status
 */
function connectionStatus() {
    return async (req, res, next) => {
        try {
            const redisManager = (0, redis_1.getRedisManager)();
            const wsManager = (0, websocket_1.getWebSocketManager)();
            if (!redisManager || !wsManager || !req.user) {
                return next();
            }
            // Update user's last seen timestamp
            const userId = req.user.id;
            const lastSeenKey = `user:${userId}:last_seen`;
            await redisManager.safeSet(lastSeenKey, Date.now().toString(), 3600); // 1 hour TTL
            // Check if user is currently connected via WebSocket
            const stats = wsManager.getStats();
            const isOnline = stats.authenticatedUsers > 0;
            // Update online status if changed
            const statusKey = `user:${userId}:status`;
            const currentStatus = await redisManager.safeGet(statusKey);
            if (currentStatus !== 'online') {
                await redisManager.safeSet(statusKey, 'online', 1800); // 30 minutes TTL
                // Notify friends/followers about status change
                wsManager.broadcast('user_status_changed', {
                    userId,
                    status: 'online',
                    timestamp: new Date(),
                });
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('Connection status middleware error:', error);
            next();
        }
    };
}
/**
 * Rate limiting with real-time feedback
 */
function realtimeRateLimit(options = { windowMs: 60000, maxRequests: 100 }) {
    return async (req, res, next) => {
        try {
            const redisManager = (0, redis_1.getRedisManager)();
            const wsManager = (0, websocket_1.getWebSocketManager)();
            if (!redisManager) {
                return next();
            }
            // Generate rate limit key
            const key = options.keyGenerator
                ? options.keyGenerator(req)
                : `rate_limit:${req.ip}:${req.originalUrl}`;
            // Get current count
            const currentCount = await redisManager.safeGet(key);
            const count = currentCount ? parseInt(currentCount) : 0;
            if (count >= options.maxRequests) {
                // Rate limit exceeded - send real-time notification
                if (wsManager && req.user) {
                    wsManager.sendToUser(req.user.id, 'rate_limit_exceeded', {
                        endpoint: req.originalUrl,
                        limit: options.maxRequests,
                        windowMs: options.windowMs,
                        retryAfter: options.windowMs,
                        timestamp: new Date(),
                    });
                }
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    retryAfter: options.windowMs,
                });
            }
            // Increment counter
            if (count === 0) {
                await redisManager.safeSet(key, '1', Math.floor(options.windowMs / 1000));
            }
            else {
                const redis = redisManager.getClient();
                if (redis) {
                    await redis.incr(key);
                }
            }
            // Add rate limit headers
            res.set({
                'X-RateLimit-Limit': options.maxRequests.toString(),
                'X-RateLimit-Remaining': (options.maxRequests - count - 1).toString(),
                'X-RateLimit-Reset': new Date(Date.now() + options.windowMs).toISOString(),
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('Real-time rate limit error:', error);
            next();
        }
    };
}
/**
 * Message routing middleware for WebSocket events
 */
function messageRouter() {
    return (req, res, next) => {
        try {
            const wsManager = (0, websocket_1.getWebSocketManager)();
            if (!wsManager) {
                return next();
            }
            // Add helper methods to response object
            res.realtimeEmit = (event, data, room) => {
                const io = wsManager.getIO();
                if (io) {
                    if (room) {
                        io.to(room).emit(event, { ...data, timestamp: new Date() });
                    }
                    else {
                        io.emit(event, { ...data, timestamp: new Date() });
                    }
                }
            };
            res.realtimeSendToUser = (userId, event, data) => {
                wsManager.sendToUser(userId, event, { ...data, timestamp: new Date() });
            };
            res.realtimeBroadcast = (event, data) => {
                wsManager.broadcast(event, { ...data, timestamp: new Date() });
            };
            next();
        }
        catch (error) {
            logger_1.logger.error('Message router middleware error:', error);
            next();
        }
    };
}
/**
 * Presence tracking middleware
 */
function presenceTracking() {
    return async (req, res, next) => {
        try {
            const redisManager = (0, redis_1.getRedisManager)();
            const wsManager = (0, websocket_1.getWebSocketManager)();
            if (!redisManager || !wsManager || !req.user) {
                return next();
            }
            const userId = req.user.id;
            const presenceKey = `presence:${userId}`;
            // Update presence information
            const presenceData = {
                userId,
                username: req.user.username,
                avatar: req.user.avatar,
                status: 'active',
                lastActivity: new Date(),
                endpoint: req.originalUrl,
                userAgent: req.get('User-Agent'),
                ip: req.ip,
            };
            await redisManager.safeSet(presenceKey, JSON.stringify(presenceData), 300 // 5 minutes TTL
            );
            // Notify presence update
            wsManager.broadcast('presence_update', {
                userId,
                status: 'active',
                timestamp: new Date(),
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('Presence tracking middleware error:', error);
            next();
        }
    };
}
exports.default = {
    realtimeNotification,
    sessionRealtime,
    userRealtime,
    extensionRealtime,
    adminRealtime,
    connectionStatus,
    realtimeRateLimit,
    messageRouter,
    presenceTracking,
};
//# sourceMappingURL=realtime.js.map