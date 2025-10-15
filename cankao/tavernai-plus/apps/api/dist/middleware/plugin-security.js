"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLUGIN_PERMISSIONS = void 0;
exports.requirePluginPermission = requirePluginPermission;
exports.pluginSandbox = pluginSandbox;
exports.apiAccessControl = apiAccessControl;
exports.securityAudit = securityAudit;
exports.pluginIsolation = pluginIsolation;
const vm2_1 = require("vm2");
const redis_1 = require("../lib/redis");
const logger_1 = require("../services/logger");
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../lib/prisma");
// Define available plugin permissions
const PLUGIN_PERMISSIONS = {
    'read_user_data': {
        id: 'read_user_data',
        name: 'Read User Data',
        description: 'Access to user profile and basic information',
        risk_level: 'medium',
        requires_approval: true,
    },
    'write_user_data': {
        id: 'write_user_data',
        name: 'Write User Data',
        description: 'Modify user profile and preferences',
        risk_level: 'high',
        requires_approval: true,
    },
    'access_conversations': {
        id: 'access_conversations',
        name: 'Access Conversations',
        description: 'Read chat messages and conversation history',
        risk_level: 'high',
        requires_approval: true,
    },
    'modify_conversations': {
        id: 'modify_conversations',
        name: 'Modify Conversations',
        description: 'Edit or delete chat messages',
        risk_level: 'critical',
        requires_approval: true,
    },
    'network_access': {
        id: 'network_access',
        name: 'Network Access',
        description: 'Make HTTP requests to external services',
        risk_level: 'high',
        requires_approval: true,
    },
    'file_system': {
        id: 'file_system',
        name: 'File System Access',
        description: 'Read and write files on the server',
        risk_level: 'critical',
        requires_approval: true,
    },
    'database_access': {
        id: 'database_access',
        name: 'Database Access',
        description: 'Direct database queries and modifications',
        risk_level: 'critical',
        requires_approval: true,
    },
    'admin_functions': {
        id: 'admin_functions',
        name: 'Admin Functions',
        description: 'Access to administrative features',
        risk_level: 'critical',
        requires_approval: true,
    },
    'ui_modification': {
        id: 'ui_modification',
        name: 'UI Modification',
        description: 'Modify the user interface',
        risk_level: 'medium',
        requires_approval: false,
    },
    'notification_system': {
        id: 'notification_system',
        name: 'Notification System',
        description: 'Send notifications to users',
        risk_level: 'low',
        requires_approval: false,
    },
};
exports.PLUGIN_PERMISSIONS = PLUGIN_PERMISSIONS;
/**
 * Plugin permission verification middleware
 */
function requirePluginPermission(requiredPermissions) {
    return async (req, res, next) => {
        try {
            const extensionId = req.headers['x-extension-id'];
            const userId = req.user?.id;
            if (!extensionId) {
                return res.status(400).json({
                    error: 'Missing extension ID in request headers',
                });
            }
            if (!userId) {
                return res.status(401).json({
                    error: 'User authentication required',
                });
            }
            // Normalize permissions to array
            const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
            // Check if extension exists and is installed for the user
            const installation = await prisma_1.prisma.extensionInstallation.findFirst({
                where: {
                    extensionId,
                    userId,
                    status: 'active',
                },
                include: {
                    extension: true,
                },
            });
            if (!installation) {
                return res.status(403).json({
                    error: 'Extension not installed or not active',
                });
            }
            // Check if all required permissions are granted
            const grantedPermissions = installation.permissions;
            const missingPermissions = permissions.filter(permission => !grantedPermissions.includes(permission));
            if (missingPermissions.length > 0) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    missing_permissions: missingPermissions,
                    required_permissions: permissions,
                });
            }
            // Add plugin context to request
            req.pluginContext = {
                extensionId,
                userId,
                permissions: grantedPermissions,
                resourceLimits: {
                    memoryLimit: installation.extension.resourceLimits?.memoryLimit || 10 * 1024 * 1024, // 10MB
                    timeoutMs: installation.extension.resourceLimits?.timeoutMs || 5000, // 5 seconds
                    allowedAPIs: installation.extension.resourceLimits?.allowedAPIs || [],
                },
            };
            // Log permission usage
            await logPermissionUsage(extensionId, userId, permissions, req.originalUrl);
            next();
        }
        catch (error) {
            logger_1.logger.error('Plugin permission verification error:', error);
            res.status(500).json({
                error: 'Internal server error during permission verification',
            });
        }
    };
}
/**
 * Plugin sandbox middleware for secure code execution
 */
function pluginSandbox() {
    return async (req, res, next) => {
        try {
            const context = req.pluginContext;
            if (!context) {
                return res.status(400).json({
                    error: 'Plugin context not found. Use requirePluginPermission middleware first.',
                });
            }
            // Create secure VM sandbox
            const sandbox = new vm2_1.VM({
                timeout: context.resourceLimits.timeoutMs,
                sandbox: {
                    console: {
                        log: (...args) => logger_1.logger.info(`[Plugin ${context.extensionId}]`, ...args),
                        error: (...args) => logger_1.logger.error(`[Plugin ${context.extensionId}]`, ...args),
                        warn: (...args) => logger_1.logger.warn(`[Plugin ${context.extensionId}]`, ...args),
                    },
                    // Provide safe APIs based on permissions
                    ...createSafeAPIContext(context),
                },
                eval: false,
                wasm: false,
                fixAsync: true,
            });
            context.sandbox = sandbox;
            // Monitor resource usage
            const startTime = Date.now();
            const startMemory = process.memoryUsage().heapUsed;
            res.on('finish', () => {
                const endTime = Date.now();
                const endMemory = process.memoryUsage().heapUsed;
                const executionTime = endTime - startTime;
                const memoryUsed = endMemory - startMemory;
                // Log resource usage
                logResourceUsage(context.extensionId, context.userId, {
                    executionTime,
                    memoryUsed,
                    endpoint: req.originalUrl,
                });
                // Check for resource violations
                if (executionTime > context.resourceLimits.timeoutMs) {
                    logger_1.logger.warn(`Plugin ${context.extensionId} exceeded time limit: ${executionTime}ms`);
                }
                if (memoryUsed > context.resourceLimits.memoryLimit) {
                    logger_1.logger.warn(`Plugin ${context.extensionId} exceeded memory limit: ${memoryUsed} bytes`);
                }
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('Plugin sandbox error:', error);
            res.status(500).json({
                error: 'Sandbox initialization failed',
            });
        }
    };
}
/**
 * API access control middleware
 */
function apiAccessControl() {
    return async (req, res, next) => {
        try {
            const context = req.pluginContext;
            if (!context) {
                return next(); // Skip if not a plugin request
            }
            const endpoint = req.originalUrl;
            const method = req.method;
            // Check if the API endpoint is allowed
            const isAllowed = await checkAPIAccess(context, endpoint, method);
            if (!isAllowed) {
                return res.status(403).json({
                    error: 'API access denied',
                    endpoint,
                    method,
                    extension: context.extensionId,
                });
            }
            // Rate limiting for plugin API calls
            const rateLimitKey = `plugin_rate_limit:${context.extensionId}:${context.userId}`;
            const isRateLimited = await checkRateLimit(rateLimitKey, 100, 60000); // 100 requests per minute
            if (isRateLimited) {
                return res.status(429).json({
                    error: 'Plugin rate limit exceeded',
                    extension: context.extensionId,
                });
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('API access control error:', error);
            res.status(500).json({
                error: 'Access control check failed',
            });
        }
    };
}
/**
 * Security audit middleware
 */
function securityAudit() {
    return async (req, res, next) => {
        try {
            const context = req.pluginContext;
            if (!context) {
                return next();
            }
            // Audit sensitive operations
            const isSensitiveOperation = checkSensitiveOperation(req);
            if (isSensitiveOperation) {
                await logSecurityEvent({
                    extensionId: context.extensionId,
                    userId: context.userId,
                    operation: req.originalUrl,
                    method: req.method,
                    userAgent: req.get('User-Agent'),
                    ip: req.ip,
                    timestamp: new Date(),
                    requestBody: req.body,
                    headers: req.headers,
                });
                // Additional verification for critical operations
                if (hasCriticalPermissions(context.permissions)) {
                    const verificationToken = req.headers['x-verification-token'];
                    if (!verificationToken || !await verifySecurityToken(verificationToken, context)) {
                        return res.status(403).json({
                            error: 'Additional security verification required for critical operations',
                        });
                    }
                }
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('Security audit error:', error);
            res.status(500).json({
                error: 'Security audit failed',
            });
        }
    };
}
/**
 * Plugin isolation middleware
 */
function pluginIsolation() {
    return async (req, res, next) => {
        try {
            const context = req.pluginContext;
            if (!context) {
                return next();
            }
            // Create isolated request context
            const isolatedContext = {
                user: {
                    id: req.user?.id,
                    username: req.user?.username,
                    // Only expose safe user properties
                },
                extension: {
                    id: context.extensionId,
                    permissions: context.permissions,
                },
                request: {
                    method: req.method,
                    url: req.originalUrl,
                    headers: filterSafeHeaders(req.headers),
                    query: req.query,
                    body: sanitizeRequestBody(req.body),
                },
            };
            // Replace request context for plugin
            req.isolatedContext = isolatedContext;
            // Prevent access to dangerous globals
            req.pluginGlobals = {
                Buffer: undefined,
                process: undefined,
                global: undefined,
                require: undefined,
                module: undefined,
                exports: undefined,
            };
            next();
        }
        catch (error) {
            logger_1.logger.error('Plugin isolation error:', error);
            res.status(500).json({
                error: 'Isolation setup failed',
            });
        }
    };
}
// Helper functions
/**
 * Create safe API context for plugin sandbox
 */
function createSafeAPIContext(context) {
    const safeContext = {};
    // Add APIs based on permissions
    if (context.permissions.includes('read_user_data')) {
        safeContext.user = {
            getId: () => context.userId,
            // Add other safe user methods
        };
    }
    if (context.permissions.includes('network_access')) {
        safeContext.fetch = createSafeFetch(context);
    }
    if (context.permissions.includes('notification_system')) {
        safeContext.notify = createNotificationAPI(context);
    }
    return safeContext;
}
/**
 * Create safe fetch function with restrictions
 */
function createSafeFetch(context) {
    return async (url, options) => {
        // Validate URL
        if (!isValidURL(url)) {
            throw new Error('Invalid URL');
        }
        // Check allowed domains
        if (!isAllowedDomain(url, context)) {
            throw new Error('Domain not allowed');
        }
        // Add timeout and other restrictions
        const safeOptions = {
            ...options,
            timeout: Math.min(options?.timeout || 5000, 10000),
            headers: {
                'User-Agent': `TavernAI-Plugin/${context.extensionId}`,
                ...options?.headers,
            },
        };
        // Make request with logging
        logger_1.logger.info(`Plugin ${context.extensionId} making request to ${url}`);
        // Implementation would use actual fetch here
        return { ok: true, status: 200, json: async () => ({}) };
    };
}
/**
 * Create notification API
 */
function createNotificationAPI(context) {
    return {
        send: async (message, type = 'info') => {
            await logNotification(context.extensionId, context.userId, message, type);
            return true;
        },
    };
}
/**
 * Check API access permissions
 */
async function checkAPIAccess(context, endpoint, method) {
    // Define API access rules
    const apiRules = [
        {
            pattern: /^\/api\/users\/me$/,
            methods: ['GET'],
            requiredPermission: 'read_user_data',
        },
        {
            pattern: /^\/api\/users\/me$/,
            methods: ['PUT', 'PATCH'],
            requiredPermission: 'write_user_data',
        },
        {
            pattern: /^\/api\/conversations/,
            methods: ['GET'],
            requiredPermission: 'access_conversations',
        },
        {
            pattern: /^\/api\/conversations/,
            methods: ['POST', 'PUT', 'DELETE'],
            requiredPermission: 'modify_conversations',
        },
        // Add more rules as needed
    ];
    for (const rule of apiRules) {
        if (rule.pattern.test(endpoint) && rule.methods.includes(method)) {
            return context.permissions.includes(rule.requiredPermission);
        }
    }
    // Default: allow if no specific rule matches and no critical permissions
    return !hasCriticalPermissions(context.permissions);
}
/**
 * Check rate limit
 */
async function checkRateLimit(key, limit, windowMs) {
    const redisManager = (0, redis_1.getRedisManager)();
    if (!redisManager) {
        return false; // Allow if Redis is not available
    }
    const current = await redisManager.safeGet(key);
    const count = current ? parseInt(current) : 0;
    if (count >= limit) {
        return true; // Rate limited
    }
    // Increment counter
    if (count === 0) {
        await redisManager.safeSet(key, '1', Math.floor(windowMs / 1000));
    }
    else {
        const redis = redisManager.getClient();
        if (redis) {
            await redis.incr(key);
        }
    }
    return false; // Not rate limited
}
/**
 * Check if operation is sensitive
 */
function checkSensitiveOperation(req) {
    const sensitivePatterns = [
        /\/api\/admin/,
        /\/api\/users\/.*\/delete/,
        /\/api\/conversations\/.*\/delete/,
        /\/api\/extensions\/.*\/install/,
        /\/api\/extensions\/.*\/uninstall/,
    ];
    return sensitivePatterns.some(pattern => pattern.test(req.originalUrl));
}
/**
 * Check if permissions include critical ones
 */
function hasCriticalPermissions(permissions) {
    const criticalPermissions = ['admin_functions', 'database_access', 'file_system'];
    return permissions.some(permission => criticalPermissions.includes(permission));
}
/**
 * Verify security token
 */
async function verifySecurityToken(token, context) {
    try {
        // Implementation would verify token against stored values
        const expectedToken = crypto_1.default
            .createHmac('sha256', process.env.PLUGIN_SECRET || 'default-secret')
            .update(`${context.extensionId}:${context.userId}:${Date.now()}`)
            .digest('hex');
        return crypto_1.default.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
    }
    catch (error) {
        return false;
    }
}
/**
 * Log permission usage
 */
async function logPermissionUsage(extensionId, userId, permissions, endpoint) {
    try {
        await prisma_1.prisma.extensionLog.create({
            data: {
                extensionId,
                userId,
                action: 'permission_usage',
                details: {
                    permissions,
                    endpoint,
                    timestamp: new Date(),
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to log permission usage:', error);
    }
}
/**
 * Log resource usage
 */
async function logResourceUsage(extensionId, userId, usage) {
    try {
        await prisma_1.prisma.extensionLog.create({
            data: {
                extensionId,
                userId,
                action: 'resource_usage',
                details: {
                    ...usage,
                    timestamp: new Date(),
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to log resource usage:', error);
    }
}
/**
 * Log security events
 */
async function logSecurityEvent(event) {
    try {
        await prisma_1.prisma.extensionLog.create({
            data: {
                extensionId: event.extensionId,
                userId: event.userId,
                action: 'security_event',
                details: event,
            },
        });
        logger_1.logger.warn('Security event logged:', event);
    }
    catch (error) {
        logger_1.logger.error('Failed to log security event:', error);
    }
}
/**
 * Log notifications
 */
async function logNotification(extensionId, userId, message, type) {
    try {
        await prisma_1.prisma.extensionLog.create({
            data: {
                extensionId,
                userId,
                action: 'notification',
                details: {
                    message,
                    type,
                    timestamp: new Date(),
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to log notification:', error);
    }
}
/**
 * Utility functions
 */
function isValidURL(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
function isAllowedDomain(url, context) {
    // Implementation would check against allowed domains list
    const allowedDomains = context.resourceLimits.allowedAPIs || [];
    const urlObject = new URL(url);
    return allowedDomains.includes(urlObject.hostname) || allowedDomains.includes('*');
}
function filterSafeHeaders(headers) {
    const safeHeaders = ['content-type', 'accept', 'user-agent'];
    const filtered = {};
    safeHeaders.forEach(header => {
        if (headers[header]) {
            filtered[header] = headers[header];
        }
    });
    return filtered;
}
function sanitizeRequestBody(body) {
    // Remove sensitive fields
    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    return sanitized;
}
//# sourceMappingURL=plugin-security.js.map