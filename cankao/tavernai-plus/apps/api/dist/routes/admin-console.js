"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const role_access_1 = require("../middleware/role-access");
const audit_log_1 = require("../middleware/audit-log");
const admin_console_service_1 = require("../services/admin-console.service");
const router = (0, express_1.Router)();
// Validation schemas
const banUserSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    reason: zod_1.z.string().min(10),
    duration: zod_1.z.number().optional(),
});
const processModerationSchema = zod_1.z.object({
    action: zod_1.z.enum(['approve', 'reject', 'flag']),
    reason: zod_1.z.string().optional(),
});
const updateConfigSchema = zod_1.z.object({
    features: zod_1.z.record(zod_1.z.boolean()).optional(),
    limits: zod_1.z.record(zod_1.z.number()).optional(),
    pricing: zod_1.z.record(zod_1.z.number()).optional(),
});
/**
 * GET /api/v1/admin/dashboard
 * Get admin dashboard overview
 */
router.get('/dashboard', auth_1.authenticate, async (req, res) => {
    try {
        const adminId = req.user.id;
        const dashboard = await admin_console_service_1.adminConsoleService.getAdminDashboard(adminId);
        if (!dashboard) {
            res.status(403).json({
                success: false,
                message: 'Unauthorized: Admin access required',
            });
            return;
        }
        res.json({
            success: true,
            data: dashboard,
        });
    }
    catch (error) {
        console.error('Error getting admin dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get admin dashboard',
        });
    }
});
/**
 * GET /api/v1/admin/metrics/realtime
 * Get realtime system metrics
 */
router.get('/metrics/realtime', auth_1.authenticate, async (req, res) => {
    try {
        const adminId = req.user.id;
        const metrics = await admin_console_service_1.adminConsoleService.getRealtimeMetrics(adminId);
        if (!metrics) {
            res.status(403).json({
                success: false,
                message: 'Unauthorized: Admin access required',
            });
            return;
        }
        res.json({
            success: true,
            data: metrics,
        });
    }
    catch (error) {
        console.error('Error getting realtime metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get realtime metrics',
        });
    }
});
/**
 * GET /api/v1/admin/alerts
 * Get system alerts
 */
router.get('/alerts', auth_1.authenticate, async (req, res) => {
    try {
        const adminId = req.user.id;
        const { severity, resolved, limit = '50' } = req.query;
        const alerts = await admin_console_service_1.adminConsoleService.getAlerts(adminId, {
            severity: severity,
            resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
            limit: parseInt(limit),
        });
        res.json({
            success: true,
            data: alerts,
            count: alerts.length,
        });
    }
    catch (error) {
        console.error('Error getting alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get alerts',
        });
    }
});
/**
 * POST /api/v1/admin/alerts/:alertId/resolve
 * Resolve an alert
 */
router.post('/alerts/:alertId/resolve', auth_1.authenticate, role_access_1.requireAdmin, audit_log_1.auditResolveAlert, async (req, res) => {
    try {
        const adminId = req.user.id;
        const { alertId } = req.params;
        const success = await admin_console_service_1.adminConsoleService.resolveAlert(adminId, alertId);
        if (success) {
            res.json({
                success: true,
                message: 'Alert resolved successfully',
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Failed to resolve alert',
            });
        }
    }
    catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resolve alert',
        });
    }
});
/**
 * GET /api/v1/admin/moderation/queue
 * Get moderation queue
 */
router.get('/moderation/queue', auth_1.authenticate, async (req, res) => {
    try {
        const adminId = req.user.id;
        const { type, status, page = '1', limit = '20' } = req.query;
        const result = await admin_console_service_1.adminConsoleService.getModerationQueue(adminId, {
            type: type,
            status: status,
            page: parseInt(page),
            limit: parseInt(limit),
        });
        res.json({
            success: true,
            data: result.items,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.total,
                totalPages: Math.ceil(result.total / parseInt(limit)),
            },
        });
    }
    catch (error) {
        console.error('Error getting moderation queue:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get moderation queue',
        });
    }
});
/**
 * POST /api/v1/admin/moderation/:itemId/process
 * Process moderation item
 */
router.post('/moderation/:itemId/process', auth_1.authenticate, (0, validate_1.validate)(processModerationSchema), async (req, res) => {
    try {
        const adminId = req.user.id;
        const { itemId } = req.params;
        const { action, reason } = req.body;
        const success = await admin_console_service_1.adminConsoleService.processModerationItem(adminId, itemId, action, reason);
        if (success) {
            res.json({
                success: true,
                message: `Moderation item ${action}ed successfully`,
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Failed to process moderation item',
            });
        }
    }
    catch (error) {
        console.error('Error processing moderation item:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process moderation item',
        });
    }
});
/**
 * POST /api/v1/admin/users/:userId/ban
 * Ban a user
 */
router.post('/users/:userId/ban', auth_1.authenticate, role_access_1.requireAdmin, (0, validate_1.validate)(banUserSchema), audit_log_1.auditBanUser, async (req, res) => {
    try {
        const adminId = req.user.id;
        const { userId } = req.params;
        const { reason, duration } = req.body;
        const success = await admin_console_service_1.adminConsoleService.banUser(adminId, userId, reason, duration);
        if (success) {
            res.json({
                success: true,
                message: 'User banned successfully',
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Failed to ban user',
            });
        }
    }
    catch (error) {
        console.error('Error banning user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to ban user',
        });
    }
});
/**
 * GET /api/v1/admin/audit-logs
 * Get audit logs
 */
router.get('/audit-logs', auth_1.authenticate, async (req, res) => {
    try {
        const adminId = req.user.id;
        const { action, startDate, endDate, page = '1', limit = '50' } = req.query;
        const result = await admin_console_service_1.adminConsoleService.getAuditLogs(adminId, {
            action: action,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            page: parseInt(page),
            limit: parseInt(limit),
        });
        res.json({
            success: true,
            data: result.logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.total,
                totalPages: Math.ceil(result.total / parseInt(limit)),
            },
        });
    }
    catch (error) {
        console.error('Error getting audit logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get audit logs',
        });
    }
});
/**
 * GET /api/v1/admin/config
 * Get system configuration
 */
router.get('/config', auth_1.authenticate, async (req, res) => {
    try {
        const adminId = req.user.id;
        const config = await admin_console_service_1.adminConsoleService.getSystemConfig(adminId);
        if (!config) {
            res.status(403).json({
                success: false,
                message: 'Unauthorized: Admin access required',
            });
            return;
        }
        res.json({
            success: true,
            data: config,
        });
    }
    catch (error) {
        console.error('Error getting system config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get system configuration',
        });
    }
});
/**
 * PUT /api/v1/admin/config
 * Update system configuration
 */
router.put('/config', auth_1.authenticate, role_access_1.requireAdmin, (0, validate_1.validate)(updateConfigSchema), audit_log_1.auditChangeConfig, async (req, res) => {
    try {
        const adminId = req.user.id;
        const config = req.body;
        const success = await admin_console_service_1.adminConsoleService.updateSystemConfig(adminId, config);
        if (success) {
            res.json({
                success: true,
                message: 'System configuration updated successfully',
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Failed to update system configuration',
            });
        }
    }
    catch (error) {
        console.error('Error updating system config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update system configuration',
        });
    }
});
exports.default = router;
//# sourceMappingURL=admin-console.js.map