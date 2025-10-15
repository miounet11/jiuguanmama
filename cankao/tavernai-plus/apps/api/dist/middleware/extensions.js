"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extensionExecutionMiddleware = exports.extensionSecurityMiddleware = exports.validateExtensionUpload = exports.sandboxManager = exports.executionMonitor = exports.securityAudit = exports.extensionRateLimit = exports.requireExtensionEnabled = exports.checkExtensionPermissions = exports.validateExtensionAccess = void 0;
const ExtensionService_1 = require("../services/extensions/ExtensionService");
const SandboxService_1 = require("../services/extensions/SandboxService");
const logger_1 = require("../utils/logger");
/**
 * Middleware to validate extension ownership and access
 */
const validateExtensionAccess = async (req, res, next) => {
    try {
        const extensionId = req.params.extensionId || req.body.extensionId;
        const userId = req.user?.id;
        if (!extensionId) {
            return res.status(400).json({
                error: 'Extension ID is required',
                code: 'MISSING_EXTENSION_ID'
            });
        }
        if (!userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        // Get user's extensions
        const userExtensions = await ExtensionService_1.extensionService.getInstalledExtensions(userId);
        const extension = userExtensions.find(ext => ext.id === extensionId);
        if (!extension) {
            return res.status(404).json({
                error: 'Extension not found or not installed',
                code: 'EXTENSION_NOT_FOUND'
            });
        }
        // Add extension context to request
        req.extension = {
            id: extension.id,
            isInstalled: extension.isInstalled,
            isEnabled: extension.isEnabled,
            permissions: extension.permissions.map(p => p.name),
            isOfficial: extension.isOfficial
        };
        next();
    }
    catch (error) {
        logger_1.logger.error('Extension access validation failed', {
            extensionId: req.params.extensionId || req.body.extensionId,
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Extension access validation failed',
            code: 'EXTENSION_ACCESS_ERROR'
        });
    }
};
exports.validateExtensionAccess = validateExtensionAccess;
/**
 * Middleware to check extension permissions
 */
const checkExtensionPermissions = (requiredPermissions) => {
    return (req, res, next) => {
        try {
            if (!req.extension) {
                return res.status(400).json({
                    error: 'Extension context not found',
                    code: 'EXTENSION_CONTEXT_MISSING'
                });
            }
            const { permissions } = req.extension;
            // Check if all required permissions are granted
            const missingPermissions = requiredPermissions.filter(permission => !permissions.includes(permission));
            if (missingPermissions.length > 0) {
                return res.status(403).json({
                    error: 'Insufficient extension permissions',
                    code: 'INSUFFICIENT_PERMISSIONS',
                    requiredPermissions,
                    missingPermissions,
                    grantedPermissions: permissions
                });
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('Extension permission check failed', {
                extensionId: req.extension?.id,
                requiredPermissions,
                error: error instanceof Error ? error.message : String(error)
            });
            res.status(500).json({
                error: 'Permission check failed',
                code: 'PERMISSION_CHECK_ERROR'
            });
        }
    };
};
exports.checkExtensionPermissions = checkExtensionPermissions;
/**
 * Middleware to validate extension is enabled
 */
const requireExtensionEnabled = (req, res, next) => {
    try {
        if (!req.extension) {
            return res.status(400).json({
                error: 'Extension context not found',
                code: 'EXTENSION_CONTEXT_MISSING'
            });
        }
        if (!req.extension.isEnabled) {
            return res.status(403).json({
                error: 'Extension is disabled',
                code: 'EXTENSION_DISABLED',
                extensionId: req.extension.id
            });
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Extension enabled check failed', {
            extensionId: req.extension?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Extension status check failed',
            code: 'EXTENSION_STATUS_ERROR'
        });
    }
};
exports.requireExtensionEnabled = requireExtensionEnabled;
/**
 * Middleware for extension rate limiting
 */
const extensionRateLimit = (maxExecutionsPerMinute = 10, maxSandboxContexts = 3) => {
    const userExecutionCounts = new Map();
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const extensionId = req.extension?.id;
            if (!userId || !extensionId) {
                return res.status(400).json({
                    error: 'User ID and Extension ID are required',
                    code: 'MISSING_REQUIRED_IDS'
                });
            }
            const userKey = `${userId}:${extensionId}`;
            const now = Date.now();
            const resetTime = Math.floor(now / 60000) * 60000 + 60000; // Next minute
            // Check execution rate limit
            const userExecutionData = userExecutionCounts.get(userKey);
            if (!userExecutionData || userExecutionData.resetTime <= now) {
                userExecutionCounts.set(userKey, { count: 1, resetTime });
            }
            else {
                userExecutionData.count++;
                if (userExecutionData.count > maxExecutionsPerMinute) {
                    return res.status(429).json({
                        error: `Extension execution rate limit exceeded. Maximum ${maxExecutionsPerMinute} executions per minute`,
                        code: 'EXECUTION_RATE_LIMIT_EXCEEDED',
                        limit: maxExecutionsPerMinute,
                        resetTime: userExecutionData.resetTime
                    });
                }
            }
            // Check sandbox context limit
            const activeContexts = SandboxService_1.sandboxService.getActiveContexts();
            const userContexts = activeContexts.filter(ctx => ctx.extensionId === extensionId);
            if (userContexts.length >= maxSandboxContexts) {
                return res.status(429).json({
                    error: `Too many active sandbox contexts. Maximum ${maxSandboxContexts} contexts per extension`,
                    code: 'SANDBOX_CONTEXT_LIMIT_EXCEEDED',
                    limit: maxSandboxContexts,
                    current: userContexts.length
                });
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('Extension rate limit check failed', {
                userId: req.user?.id,
                extensionId: req.extension?.id,
                error: error instanceof Error ? error.message : String(error)
            });
            res.status(500).json({
                error: 'Rate limit check failed',
                code: 'RATE_LIMIT_ERROR'
            });
        }
    };
};
exports.extensionRateLimit = extensionRateLimit;
/**
 * Middleware for extension security audit
 */
const securityAudit = (req, res, next) => {
    try {
        const { method, url, body, headers } = req;
        const userId = req.user?.id;
        const extensionId = req.extension?.id;
        // Log security-relevant operations
        const securityEvents = [
            'POST /api/extensions/upload',
            'POST /api/extensions/install',
            'DELETE /api/extensions/',
            'POST /api/extensions/.*/execute'
        ];
        const isSecurityEvent = securityEvents.some(pattern => {
            const regex = new RegExp(pattern.replace('*', '.*'));
            return regex.test(`${method} ${url}`);
        });
        if (isSecurityEvent) {
            logger_1.logger.warn('Extension security event', {
                event: `${method} ${url}`,
                userId,
                extensionId,
                userAgent: headers['user-agent'],
                ip: req.ip,
                timestamp: new Date().toISOString()
            });
            // Additional security checks for high-risk operations
            if (method === 'POST' && url.includes('/execute')) {
                const { functionName, args } = body;
                // Check for potentially dangerous function calls
                const dangerousFunctions = [
                    'eval', 'Function', 'require', 'import',
                    'process', 'global', 'Buffer', 'child_process'
                ];
                if (dangerousFunctions.some(fn => functionName?.includes(fn) || JSON.stringify(args)?.includes(fn))) {
                    logger_1.logger.error('Potentially dangerous extension execution attempt', {
                        userId,
                        extensionId,
                        functionName,
                        args: JSON.stringify(args),
                        ip: req.ip
                    });
                    return res.status(403).json({
                        error: 'Potentially dangerous function call detected',
                        code: 'DANGEROUS_FUNCTION_DETECTED',
                        functionName
                    });
                }
            }
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Security audit failed', {
            userId: req.user?.id,
            extensionId: req.extension?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        // Don't block requests due to audit failures
        next();
    }
};
exports.securityAudit = securityAudit;
/**
 * Middleware for extension execution monitoring
 */
const executionMonitor = (req, res, next) => {
    const startTime = Date.now();
    // Override res.json to capture execution results
    const originalJson = res.json;
    res.json = function (data) {
        const duration = Date.now() - startTime;
        const success = data.success !== false;
        // Log execution metrics
        logger_1.logger.info('Extension execution completed', {
            extensionId: req.extension?.id,
            userId: req.user?.id,
            method: req.method,
            url: req.url,
            duration,
            success,
            statusCode: res.statusCode,
            memoryUsed: data.memoryUsed || 0,
            executionTime: data.executionTime || duration
        });
        // Update extension activity timestamp
        if (req.extension?.id) {
            // This would update last activity in the database
            // For now, just log it
            logger_1.logger.debug('Extension activity updated', {
                extensionId: req.extension.id,
                timestamp: new Date().toISOString()
            });
        }
        return originalJson.call(this, data);
    };
    next();
};
exports.executionMonitor = executionMonitor;
/**
 * Middleware for sandbox management
 */
const sandboxManager = async (req, res, next) => {
    try {
        const extensionId = req.extension?.id;
        if (!extensionId) {
            return next();
        }
        // Check sandbox health
        const sandboxStats = SandboxService_1.sandboxService.getStats();
        const activeContexts = SandboxService_1.sandboxService.getActiveContexts();
        // Log sandbox status
        logger_1.logger.debug('Sandbox status check', {
            extensionId,
            totalContexts: sandboxStats.totalContexts,
            activeContexts: sandboxStats.activeContexts,
            memoryUsage: sandboxStats.memoryUsage,
            errorRate: sandboxStats.errorRate
        });
        // Warn if sandbox is under stress
        if (sandboxStats.activeContexts > 50) {
            logger_1.logger.warn('High sandbox load detected', {
                activeContexts: sandboxStats.activeContexts,
                memoryUsage: sandboxStats.memoryUsage
            });
        }
        // Emergency cleanup if too many contexts
        if (sandboxStats.activeContexts > 100) {
            logger_1.logger.error('Emergency sandbox cleanup triggered', {
                activeContexts: sandboxStats.activeContexts
            });
            // Kill old contexts for this extension
            const extensionContexts = activeContexts.filter(ctx => ctx.extensionId === extensionId &&
                Date.now() - ctx.lastActivity.getTime() > 300000 // 5 minutes
            );
            for (const context of extensionContexts) {
                await SandboxService_1.sandboxService.destroyContext(context.id);
            }
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Sandbox management failed', {
            extensionId: req.extension?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        // Don't block requests due to sandbox management failures
        next();
    }
};
exports.sandboxManager = sandboxManager;
/**
 * Middleware to validate extension file uploads
 */
const validateExtensionUpload = (req, res, next) => {
    try {
        if (!req.file) {
            return next();
        }
        const file = req.file;
        const maxSize = 50 * 1024 * 1024; // 50MB
        const allowedMimeTypes = [
            'application/zip',
            'application/x-zip-compressed',
            'application/gzip',
            'application/x-gzip',
            'application/x-tar'
        ];
        // Check file size
        if (file.size > maxSize) {
            return res.status(413).json({
                error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB`,
                code: 'FILE_TOO_LARGE',
                maxSize
            });
        }
        // Check MIME type
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return res.status(415).json({
                error: 'Invalid file type. Only ZIP and TAR files are allowed',
                code: 'INVALID_FILE_TYPE',
                allowedTypes: allowedMimeTypes
            });
        }
        // Log upload attempt
        logger_1.logger.info('Extension file upload attempt', {
            userId: req.user?.id,
            filename: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            ip: req.ip
        });
        next();
    }
    catch (error) {
        logger_1.logger.error('Extension upload validation failed', {
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Upload validation failed',
            code: 'UPLOAD_VALIDATION_ERROR'
        });
    }
};
exports.validateExtensionUpload = validateExtensionUpload;
/**
 * Composite middleware for extension security
 */
exports.extensionSecurityMiddleware = [
    exports.securityAudit,
    exports.executionMonitor,
    exports.sandboxManager
];
/**
 * Composite middleware for extension execution
 */
exports.extensionExecutionMiddleware = [
    exports.validateExtensionAccess,
    exports.requireExtensionEnabled,
    (0, exports.extensionRateLimit)(),
    ...exports.extensionSecurityMiddleware
];
//# sourceMappingURL=extensions.js.map