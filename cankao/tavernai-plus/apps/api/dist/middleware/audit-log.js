"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditResolveAlert = exports.auditDemoteUser = exports.auditPromoteUser = exports.auditDeleteContent = exports.auditUpdateFeature = exports.auditChangeConfig = exports.auditFlagContent = exports.auditRejectContent = exports.auditApproveContent = exports.auditUnbanUser = exports.auditBanUser = void 0;
exports.auditLog = auditLog;
exports.auditLogManual = auditLogManual;
exports.logAdminAction = logAdminAction;
const server_1 = require("../server");
/**
 * Create an audit log entry
 */
async function createAuditLog(adminId, options, ipAddress, userAgent) {
    try {
        await server_1.prisma.adminAuditLog.create({
            data: {
                adminId,
                action: options.action,
                resource: options.resource,
                changes: JSON.stringify(options.changes || {}),
                ipAddress,
                userAgent,
            },
        });
    }
    catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw error - audit logging should not break the main operation
    }
}
/**
 * Middleware to automatically log admin actions
 * Usage: router.post('/ban-user', authenticate, requireAdmin, auditLog('ban_user'), handler)
 */
function auditLog(action, getResource) {
    return async (req, res, next) => {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }
        // Get resource identifier
        let resource = 'unknown';
        if (getResource) {
            resource = getResource(req);
        }
        else if (req.params.id) {
            resource = `${req.baseUrl}:${req.params.id}`;
        }
        else if (req.params.userId) {
            resource = `user:${req.params.userId}`;
        }
        else if (req.params.characterId) {
            resource = `character:${req.params.characterId}`;
        }
        else {
            resource = req.baseUrl || req.path;
        }
        // Get IP and user agent
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        // Store the original res.json to intercept it
        const originalJson = res.json.bind(res);
        // Intercept res.json to log after successful response
        res.json = function (body) {
            // Only log if the operation was successful
            if (body?.success !== false && res.statusCode < 400) {
                // Extract changes from request body
                const changes = {};
                if (req.body) {
                    // Common fields to log
                    const fieldsToLog = [
                        'reason',
                        'duration',
                        'status',
                        'enabled',
                        'value',
                        'config',
                        'settings',
                    ];
                    fieldsToLog.forEach((field) => {
                        if (req.body[field] !== undefined) {
                            changes[field] = req.body[field];
                        }
                    });
                    // Include action-specific data
                    if (req.body.action) {
                        changes.action = req.body.action;
                    }
                }
                // Create audit log entry asynchronously (don't wait)
                createAuditLog(userId, { action, resource, changes }, ipAddress, userAgent);
            }
            // Call original res.json
            return originalJson(body);
        };
        // Proceed to the next middleware/handler
        next();
    };
}
/**
 * Middleware to manually create an audit log from within a route handler
 * Attaches an auditLog function to the request object
 */
function auditLogManual(req, res, next) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
        return;
    }
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    // Attach manual audit log function to request
    req.createAuditLog = async (options) => {
        await createAuditLog(userId, options, ipAddress, userAgent);
    };
    next();
}
/**
 * Predefined audit log middleware for common actions
 */
exports.auditBanUser = auditLog('ban_user', (req) => `user:${req.params.userId}`);
exports.auditUnbanUser = auditLog('unban_user', (req) => `user:${req.params.userId}`);
exports.auditApproveContent = auditLog('approve_content', (req) => `content:${req.params.id}`);
exports.auditRejectContent = auditLog('reject_content', (req) => `content:${req.params.id}`);
exports.auditFlagContent = auditLog('flag_content', (req) => `content:${req.params.id}`);
exports.auditChangeConfig = auditLog('change_config', () => 'system:config');
exports.auditUpdateFeature = auditLog('update_feature', (req) => `feature:${req.params.featureId}`);
exports.auditDeleteContent = auditLog('delete_content', (req) => `content:${req.params.id}`);
exports.auditPromoteUser = auditLog('promote_user', (req) => `user:${req.params.userId}`);
exports.auditDemoteUser = auditLog('demote_user', (req) => `user:${req.params.userId}`);
exports.auditResolveAlert = auditLog('resolve_alert', (req) => `alert:${req.params.alertId}`);
/**
 * Utility function to manually create an audit log entry
 * Can be called from anywhere with adminId
 */
async function logAdminAction(adminId, action, resource, changes, ipAddress, userAgent) {
    await createAuditLog(adminId, { action, resource, changes }, ipAddress, userAgent);
}
//# sourceMappingURL=audit-log.js.map