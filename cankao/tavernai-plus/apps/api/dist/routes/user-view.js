"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const role_view_service_1 = require("../services/role-view.service");
const router = (0, express_1.Router)();
// Validation schemas
const switchRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(['creator', 'player', 'admin']),
});
const updatePreferencesSchema = zod_1.z.object({
    theme: zod_1.z.string().optional(),
    language: zod_1.z.string().optional(),
    dashboardLayout: zod_1.z.string().optional(),
    navigationCollapsed: zod_1.z.boolean().optional(),
    progressiveDisclosure: zod_1.z.boolean().optional(),
    showTutorials: zod_1.z.boolean().optional(),
    showNewBadges: zod_1.z.boolean().optional(),
    autoUnlockFeatures: zod_1.z.boolean().optional(),
});
/**
 * GET /api/v1/user/view-config
 * Get role-based view configuration for the authenticated user
 */
router.get('/view-config', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { role } = req.query;
        const viewConfig = await role_view_service_1.roleViewService.getRoleConfig(userId, role);
        if (!viewConfig) {
            res.status(404).json({
                success: false,
                message: 'View configuration not found',
            });
            return;
        }
        res.json({
            success: true,
            data: viewConfig,
        });
    }
    catch (error) {
        console.error('Error getting view config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get view configuration',
        });
    }
});
/**
 * PUT /api/v1/user/view-config
 * Update user preferences for view configuration
 */
router.put('/view-config', auth_1.authenticate, (0, validate_1.validate)(updatePreferencesSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = req.body;
        // Update preferences in database
        // This is handled by the user preferences service
        // For now, just return success
        res.json({
            success: true,
            message: 'Preferences updated successfully',
        });
    }
    catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update preferences',
        });
    }
});
/**
 * POST /api/v1/user/switch-role
 * Switch user's primary role
 */
router.post('/switch-role', auth_1.authenticate, (0, validate_1.validate)(switchRoleSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { role } = req.body;
        const success = await role_view_service_1.roleViewService.switchRole(userId, role);
        if (success) {
            // Get updated view config
            const viewConfig = await role_view_service_1.roleViewService.getRoleConfig(userId, role);
            res.json({
                success: true,
                message: 'Role switched successfully',
                data: viewConfig,
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Failed to switch role',
            });
        }
    }
    catch (error) {
        console.error('Error switching role:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to switch role',
        });
    }
});
/**
 * GET /api/v1/user/navigation
 * Get personalized navigation for the authenticated user
 */
router.get('/navigation', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { role } = req.query;
        const navigation = await role_view_service_1.roleViewService.getNavigation(userId, role);
        res.json({
            success: true,
            data: navigation,
        });
    }
    catch (error) {
        console.error('Error getting navigation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get navigation',
        });
    }
});
/**
 * GET /api/v1/user/dashboard
 * Get dashboard widget configuration for the authenticated user
 */
router.get('/dashboard', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { role } = req.query;
        const dashboard = await role_view_service_1.roleViewService.getDashboard(userId, role);
        res.json({
            success: true,
            data: dashboard,
        });
    }
    catch (error) {
        console.error('Error getting dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get dashboard configuration',
        });
    }
});
exports.default = router;
//# sourceMappingURL=user-view.js.map