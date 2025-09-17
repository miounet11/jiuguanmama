"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_1 = require("../middleware/admin");
const admin_2 = require("../controllers/admin");
// Create temporary controller objects for compatibility
const userController = { getUsers: admin_2.getUsers, getAll: admin_2.getUsers, get: admin_2.getUsers, create: admin_2.getUsers, update: admin_2.getUsers, delete: admin_2.getUsers };
const systemController = { getInfo: admin_2.getUsers, getHealth: admin_2.getUsers, getLogs: admin_2.getUsers };
const logController = { getAll: admin_2.getUsers, get: admin_2.getUsers, delete: admin_2.getUsers };
const statsController = { getOverview: admin_2.getUsers, getUsageStats: admin_2.getUsers, getUserStats: admin_2.getUsers, getRevenueStats: admin_2.getUsers };
const modelController = { getAll: admin_2.getUsers, get: admin_2.getUsers, create: admin_2.getUsers, update: admin_2.getUsers, delete: admin_2.getUsers };
const router = (0, express_1.Router)();
// 所有管理路由都需要管理员权限和日志记录
router.use(admin_1.requireAdmin);
router.use(admin_1.logAdminAction);
router.use(admin_1.adminRateLimiter);
// ==================== 仪表板 ====================
router.get('/dashboard', admin_2.adminController.getDashboard);
router.get('/stats/overview', statsController.getOverview);
router.get('/stats/usage', statsController.getUsageStats);
router.get('/stats/revenue', statsController.getRevenueStats);
router.get('/stats/models', statsController.getModelStats);
// ==================== 用户管理 ====================
router.get('/users', (0, admin_1.requirePermission)(admin_1.Permission.USER_VIEW), userController.getUsers);
router.get('/users/:id', (0, admin_1.requirePermission)(admin_1.Permission.USER_VIEW), userController.getUserDetail);
router.post('/users', (0, admin_1.requirePermission)(admin_1.Permission.USER_CREATE), userController.createUser);
router.put('/users/:id', (0, admin_1.requirePermission)(admin_1.Permission.USER_UPDATE), userController.updateUser);
router.delete('/users/:id', (0, admin_1.requirePermission)(admin_1.Permission.USER_DELETE), userController.deleteUser);
// 用户操作
router.post('/users/:id/reset-password', (0, admin_1.requirePermission)(admin_1.Permission.USER_UPDATE), userController.resetUserPassword);
router.post('/users/:id/toggle-status', (0, admin_1.requirePermission)(admin_1.Permission.USER_UPDATE), userController.toggleUserStatus);
router.post('/users/:id/add-credits', (0, admin_1.requirePermission)(admin_1.Permission.FINANCE_MANAGE), userController.addUserCredits);
router.post('/users/:id/change-role', (0, admin_1.requirePermission)(admin_1.Permission.USER_UPDATE), userController.changeUserRole);
// ==================== 模型管理 ====================
router.get('/models', (0, admin_1.requirePermission)(admin_1.Permission.MODEL_VIEW), modelController.getModels);
router.get('/models/:id', (0, admin_1.requirePermission)(admin_1.Permission.MODEL_VIEW), modelController.getModelDetail);
router.post('/models', (0, admin_1.requirePermission)(admin_1.Permission.MODEL_CREATE), modelController.createModel);
router.put('/models/:id', (0, admin_1.requirePermission)(admin_1.Permission.MODEL_UPDATE), modelController.updateModel);
router.delete('/models/:id', (0, admin_1.requirePermission)(admin_1.Permission.MODEL_DELETE), modelController.deleteModel);
// 模型操作
router.post('/models/:id/toggle', (0, admin_1.requirePermission)(admin_1.Permission.MODEL_UPDATE), modelController.toggleModel);
router.post('/models/test', (0, admin_1.requirePermission)(admin_1.Permission.MODEL_VIEW), modelController.testModel);
router.post('/models/batch-update', (0, admin_1.requirePermission)(admin_1.Permission.MODEL_UPDATE), modelController.batchUpdateModels);
router.get('/models/:id/stats', (0, admin_1.requirePermission)(admin_1.Permission.MODEL_VIEW), modelController.getModelStats);
// ==================== 渠道管理 ====================
router.get('/channels', (0, admin_1.requirePermission)(admin_1.Permission.CHANNEL_VIEW), admin_2.adminController.getChannels);
router.post('/channels', (0, admin_1.requirePermission)(admin_1.Permission.CHANNEL_MANAGE), admin_2.adminController.createChannel);
router.put('/channels/:id', (0, admin_1.requirePermission)(admin_1.Permission.CHANNEL_MANAGE), admin_2.adminController.updateChannel);
router.delete('/channels/:id', (0, admin_1.requirePermission)(admin_1.Permission.CHANNEL_MANAGE), admin_2.adminController.deleteChannel);
router.post('/channels/:id/test', (0, admin_1.requirePermission)(admin_1.Permission.CHANNEL_MANAGE), admin_2.adminController.testChannel);
router.post('/channels/:id/toggle', (0, admin_1.requirePermission)(admin_1.Permission.CHANNEL_MANAGE), admin_2.adminController.toggleChannel);
router.get('/channels/:id/balance', (0, admin_1.requirePermission)(admin_1.Permission.CHANNEL_VIEW), admin_2.adminController.getChannelBalance);
// ==================== 系统配置 ====================
router.get('/system/config', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_VIEW), systemController.getConfig);
router.put('/system/config', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_UPDATE), systemController.updateConfig);
router.get('/system/config/:key', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_VIEW), systemController.getConfigByKey);
router.put('/system/config/:key', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_UPDATE), systemController.updateConfigByKey);
// 邮件配置
router.get('/system/email', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_VIEW), systemController.getEmailConfig);
router.put('/system/email', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_UPDATE), systemController.updateEmailConfig);
router.post('/system/email/test', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_UPDATE), systemController.testEmailConfig);
// 支付配置
router.get('/system/payment', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_VIEW), systemController.getPaymentConfig);
router.put('/system/payment', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_UPDATE), systemController.updatePaymentConfig);
// OAuth 配置
router.get('/system/oauth', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_VIEW), systemController.getOAuthConfig);
router.put('/system/oauth', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_UPDATE), systemController.updateOAuthConfig);
// 通知配置
router.get('/system/notification', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_VIEW), systemController.getNotificationConfig);
router.put('/system/notification', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_UPDATE), systemController.updateNotificationConfig);
// ==================== 日志管理 ====================
router.get('/logs/usage', (0, admin_1.requirePermission)(admin_1.Permission.LOG_VIEW), logController.getUsageLogs);
router.get('/logs/admin', (0, admin_1.requirePermission)(admin_1.Permission.LOG_VIEW), logController.getAdminLogs);
router.get('/logs/error', (0, admin_1.requirePermission)(admin_1.Permission.LOG_VIEW), logController.getErrorLogs);
router.get('/logs/payment', (0, admin_1.requirePermission)(admin_1.Permission.FINANCE_VIEW), logController.getPaymentLogs);
router.post('/logs/export', (0, admin_1.requirePermission)(admin_1.Permission.LOG_EXPORT), logController.exportLogs);
router.delete('/logs/cleanup', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_UPDATE), logController.cleanupLogs);
// ==================== 财务管理 ====================
router.get('/finance/transactions', (0, admin_1.requirePermission)(admin_1.Permission.FINANCE_VIEW), admin_2.adminController.getTransactions);
router.get('/finance/revenue', (0, admin_1.requirePermission)(admin_1.Permission.FINANCE_VIEW), admin_2.adminController.getRevenue);
router.get('/finance/subscriptions', (0, admin_1.requirePermission)(admin_1.Permission.FINANCE_VIEW), admin_2.adminController.getSubscriptions);
router.post('/finance/refund/:id', (0, admin_1.requirePermission)(admin_1.Permission.FINANCE_MANAGE), admin_2.adminController.processRefund);
// ==================== 兑换码管理 ====================
router.get('/redemptions', (0, admin_1.requirePermission)(admin_1.Permission.FINANCE_VIEW), admin_2.adminController.getRedemptions);
router.post('/redemptions', (0, admin_1.requirePermission)(admin_1.Permission.FINANCE_MANAGE), admin_2.adminController.createRedemption);
router.delete('/redemptions/:id', (0, admin_1.requirePermission)(admin_1.Permission.FINANCE_MANAGE), admin_2.adminController.deleteRedemption);
router.post('/redemptions/batch', (0, admin_1.requirePermission)(admin_1.Permission.FINANCE_MANAGE), admin_2.adminController.batchCreateRedemptions);
// ==================== 公告管理 ====================
router.get('/announcements', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_VIEW), admin_2.adminController.getAnnouncements);
router.post('/announcements', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_UPDATE), admin_2.adminController.createAnnouncement);
router.put('/announcements/:id', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_UPDATE), admin_2.adminController.updateAnnouncement);
router.delete('/announcements/:id', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_UPDATE), admin_2.adminController.deleteAnnouncement);
// ==================== 系统维护 ====================
router.get('/maintenance/status', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_VIEW), systemController.getMaintenanceStatus);
router.post('/maintenance/enable', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_UPDATE), systemController.enableMaintenance);
router.post('/maintenance/disable', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_UPDATE), systemController.disableMaintenance);
router.post('/cache/clear', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_UPDATE), systemController.clearCache);
router.get('/backup/list', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_VIEW), systemController.getBackups);
router.post('/backup/create', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_UPDATE), systemController.createBackup);
router.post('/backup/restore/:id', (0, admin_1.requirePermission)(admin_1.Permission.SYSTEM_UPDATE), systemController.restoreBackup);
exports.default = router;
//# sourceMappingURL=admin.js.map