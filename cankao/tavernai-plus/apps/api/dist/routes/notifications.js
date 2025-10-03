"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const notification_service_1 = require("../services/notification.service");
const router = (0, express_1.Router)();
// Validation schemas
const updatePreferencesSchema = zod_1.z.object({
    featureLaunchAlerts: zod_1.z.boolean().optional(),
    achievementAlerts: zod_1.z.boolean().optional(),
    systemAlerts: zod_1.z.boolean().optional(),
});
/**
 * GET /api/v1/notifications
 * Get paginated notifications for the authenticated user
 */
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = '1', limit = '20', type, priority, unreadOnly = 'false', } = req.query;
        const result = await notification_service_1.notificationService.getNotifications(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            type: type,
            priority: priority,
            unreadOnly: unreadOnly === 'true',
        });
        res.json({
            success: true,
            data: result.notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.total,
                totalPages: Math.ceil(result.total / parseInt(limit)),
            },
        });
    }
    catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notifications',
        });
    }
});
/**
 * GET /api/v1/notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await notification_service_1.notificationService.getUnreadCount(userId);
        res.json({
            success: true,
            data: { count },
        });
    }
    catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count',
        });
    }
});
/**
 * PUT /api/v1/notifications/:notificationId/read
 * Mark a notification as read
 */
router.put('/:notificationId/read', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;
        const success = await notification_service_1.notificationService.markAsRead(userId, notificationId);
        if (success) {
            res.json({
                success: true,
                message: 'Notification marked as read',
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Failed to mark notification as read',
            });
        }
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
        });
    }
});
/**
 * PUT /api/v1/notifications/mark-all-read
 * Mark all notifications as read
 */
router.put('/mark-all-read', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await notification_service_1.notificationService.markAllAsRead(userId);
        res.json({
            success: true,
            message: `${count} notifications marked as read`,
            data: { count },
        });
    }
    catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
        });
    }
});
/**
 * DELETE /api/v1/notifications/:notificationId
 * Archive a notification
 */
router.delete('/:notificationId', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;
        const success = await notification_service_1.notificationService.archiveNotification(userId, notificationId);
        if (success) {
            res.json({
                success: true,
                message: 'Notification archived',
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Failed to archive notification',
            });
        }
    }
    catch (error) {
        console.error('Error archiving notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to archive notification',
        });
    }
});
/**
 * POST /api/v1/notifications/preferences
 * Update notification preferences
 */
router.post('/preferences', auth_1.authenticate, (0, validate_1.validate)(updatePreferencesSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = req.body;
        const success = await notification_service_1.notificationService.updatePreferences(userId, preferences);
        if (success) {
            res.json({
                success: true,
                message: 'Notification preferences updated',
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Failed to update notification preferences',
            });
        }
    }
    catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notification preferences',
        });
    }
});
/**
 * GET /api/v1/notifications/stats
 * Get notification statistics
 */
router.get('/stats', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await notification_service_1.notificationService.getStats(userId);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error('Error getting notification stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notification stats',
        });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map