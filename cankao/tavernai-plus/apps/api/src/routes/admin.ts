import { Router } from 'express'
import { requireAdmin, requirePermission, logAdminAction, Permission, adminRateLimiter } from '../middleware/admin'
import { adminController, getUsers } from '../controllers/admin'

// Create temporary controller objects for compatibility
const userController = { getUsers, getAll: getUsers, get: getUsers, create: getUsers, update: getUsers, delete: getUsers }
const systemController = { getInfo: getUsers, getHealth: getUsers, getLogs: getUsers }
const logController = { getAll: getUsers, get: getUsers, delete: getUsers }
const statsController = { getOverview: getUsers, getUsageStats: getUsers, getUserStats: getUsers, getRevenueStats: getUsers }
const modelController = { getAll: getUsers, get: getUsers, create: getUsers, update: getUsers, delete: getUsers }

const router = Router()

// 所有管理路由都需要管理员权限和日志记录
router.use(requireAdmin)
router.use(logAdminAction)
router.use(adminRateLimiter)

// ==================== 仪表板 ====================
router.get('/dashboard', adminController.getDashboard)
router.get('/stats/overview', statsController.getOverview)
router.get('/stats/usage', statsController.getUsageStats)
router.get('/stats/revenue', statsController.getRevenueStats)
router.get('/stats/models', statsController.getModelStats)

// ==================== 用户管理 ====================
router.get('/users',
  requirePermission(Permission.USER_VIEW),
  userController.getUsers
)

router.get('/users/:id',
  requirePermission(Permission.USER_VIEW),
  userController.getUserDetail
)

router.post('/users',
  requirePermission(Permission.USER_CREATE),
  userController.createUser
)

router.put('/users/:id',
  requirePermission(Permission.USER_UPDATE),
  userController.updateUser
)

router.delete('/users/:id',
  requirePermission(Permission.USER_DELETE),
  userController.deleteUser
)

// 用户操作
router.post('/users/:id/reset-password',
  requirePermission(Permission.USER_UPDATE),
  userController.resetUserPassword
)

router.post('/users/:id/toggle-status',
  requirePermission(Permission.USER_UPDATE),
  userController.toggleUserStatus
)

router.post('/users/:id/add-credits',
  requirePermission(Permission.FINANCE_MANAGE),
  userController.addUserCredits
)

router.post('/users/:id/change-role',
  requirePermission(Permission.USER_UPDATE),
  userController.changeUserRole
)

// ==================== 模型管理 ====================
router.get('/models',
  requirePermission(Permission.MODEL_VIEW),
  modelController.getModels
)

router.get('/models/:id',
  requirePermission(Permission.MODEL_VIEW),
  modelController.getModelDetail
)

router.post('/models',
  requirePermission(Permission.MODEL_CREATE),
  modelController.createModel
)

router.put('/models/:id',
  requirePermission(Permission.MODEL_UPDATE),
  modelController.updateModel
)

router.delete('/models/:id',
  requirePermission(Permission.MODEL_DELETE),
  modelController.deleteModel
)

// 模型操作
router.post('/models/:id/toggle',
  requirePermission(Permission.MODEL_UPDATE),
  modelController.toggleModel
)

router.post('/models/test',
  requirePermission(Permission.MODEL_VIEW),
  modelController.testModel
)

router.post('/models/batch-update',
  requirePermission(Permission.MODEL_UPDATE),
  modelController.batchUpdateModels
)

router.get('/models/:id/stats',
  requirePermission(Permission.MODEL_VIEW),
  modelController.getModelStats
)

// ==================== 渠道管理 ====================
router.get('/channels',
  requirePermission(Permission.CHANNEL_VIEW),
  adminController.getChannels
)

router.post('/channels',
  requirePermission(Permission.CHANNEL_MANAGE),
  adminController.createChannel
)

router.put('/channels/:id',
  requirePermission(Permission.CHANNEL_MANAGE),
  adminController.updateChannel
)

router.delete('/channels/:id',
  requirePermission(Permission.CHANNEL_MANAGE),
  adminController.deleteChannel
)

router.post('/channels/:id/test',
  requirePermission(Permission.CHANNEL_MANAGE),
  adminController.testChannel
)

router.post('/channels/:id/toggle',
  requirePermission(Permission.CHANNEL_MANAGE),
  adminController.toggleChannel
)

router.get('/channels/:id/balance',
  requirePermission(Permission.CHANNEL_VIEW),
  adminController.getChannelBalance
)

// ==================== 系统配置 ====================
router.get('/system/config',
  requirePermission(Permission.SYSTEM_VIEW),
  systemController.getConfig
)

router.put('/system/config',
  requirePermission(Permission.SYSTEM_UPDATE),
  systemController.updateConfig
)

router.get('/system/config/:key',
  requirePermission(Permission.SYSTEM_VIEW),
  systemController.getConfigByKey
)

router.put('/system/config/:key',
  requirePermission(Permission.SYSTEM_UPDATE),
  systemController.updateConfigByKey
)

// 邮件配置
router.get('/system/email',
  requirePermission(Permission.SYSTEM_VIEW),
  systemController.getEmailConfig
)

router.put('/system/email',
  requirePermission(Permission.SYSTEM_UPDATE),
  systemController.updateEmailConfig
)

router.post('/system/email/test',
  requirePermission(Permission.SYSTEM_UPDATE),
  systemController.testEmailConfig
)

// 支付配置
router.get('/system/payment',
  requirePermission(Permission.SYSTEM_VIEW),
  systemController.getPaymentConfig
)

router.put('/system/payment',
  requirePermission(Permission.SYSTEM_UPDATE),
  systemController.updatePaymentConfig
)

// OAuth 配置
router.get('/system/oauth',
  requirePermission(Permission.SYSTEM_VIEW),
  systemController.getOAuthConfig
)

router.put('/system/oauth',
  requirePermission(Permission.SYSTEM_UPDATE),
  systemController.updateOAuthConfig
)

// 通知配置
router.get('/system/notification',
  requirePermission(Permission.SYSTEM_VIEW),
  systemController.getNotificationConfig
)

router.put('/system/notification',
  requirePermission(Permission.SYSTEM_UPDATE),
  systemController.updateNotificationConfig
)

// ==================== 日志管理 ====================
router.get('/logs/usage',
  requirePermission(Permission.LOG_VIEW),
  logController.getUsageLogs
)

router.get('/logs/admin',
  requirePermission(Permission.LOG_VIEW),
  logController.getAdminLogs
)

router.get('/logs/error',
  requirePermission(Permission.LOG_VIEW),
  logController.getErrorLogs
)

router.get('/logs/payment',
  requirePermission(Permission.FINANCE_VIEW),
  logController.getPaymentLogs
)

router.post('/logs/export',
  requirePermission(Permission.LOG_EXPORT),
  logController.exportLogs
)

router.delete('/logs/cleanup',
  requirePermission(Permission.SYSTEM_UPDATE),
  logController.cleanupLogs
)

// ==================== 财务管理 ====================
router.get('/finance/transactions',
  requirePermission(Permission.FINANCE_VIEW),
  adminController.getTransactions
)

router.get('/finance/revenue',
  requirePermission(Permission.FINANCE_VIEW),
  adminController.getRevenue
)

router.get('/finance/subscriptions',
  requirePermission(Permission.FINANCE_VIEW),
  adminController.getSubscriptions
)

router.post('/finance/refund/:id',
  requirePermission(Permission.FINANCE_MANAGE),
  adminController.processRefund
)

// ==================== 兑换码管理 ====================
router.get('/redemptions',
  requirePermission(Permission.FINANCE_VIEW),
  adminController.getRedemptions
)

router.post('/redemptions',
  requirePermission(Permission.FINANCE_MANAGE),
  adminController.createRedemption
)

router.delete('/redemptions/:id',
  requirePermission(Permission.FINANCE_MANAGE),
  adminController.deleteRedemption
)

router.post('/redemptions/batch',
  requirePermission(Permission.FINANCE_MANAGE),
  adminController.batchCreateRedemptions
)

// ==================== 公告管理 ====================
router.get('/announcements',
  requirePermission(Permission.SYSTEM_VIEW),
  adminController.getAnnouncements
)

router.post('/announcements',
  requirePermission(Permission.SYSTEM_UPDATE),
  adminController.createAnnouncement
)

router.put('/announcements/:id',
  requirePermission(Permission.SYSTEM_UPDATE),
  adminController.updateAnnouncement
)

router.delete('/announcements/:id',
  requirePermission(Permission.SYSTEM_UPDATE),
  adminController.deleteAnnouncement
)

// ==================== 系统维护 ====================
router.get('/maintenance/status',
  requirePermission(Permission.SYSTEM_VIEW),
  systemController.getMaintenanceStatus
)

router.post('/maintenance/enable',
  requirePermission(Permission.SYSTEM_UPDATE),
  systemController.enableMaintenance
)

router.post('/maintenance/disable',
  requirePermission(Permission.SYSTEM_UPDATE),
  systemController.disableMaintenance
)

router.post('/cache/clear',
  requirePermission(Permission.SYSTEM_UPDATE),
  systemController.clearCache
)

router.get('/backup/list',
  requirePermission(Permission.SYSTEM_VIEW),
  systemController.getBackups
)

router.post('/backup/create',
  requirePermission(Permission.SYSTEM_UPDATE),
  systemController.createBackup
)

router.post('/backup/restore/:id',
  requirePermission(Permission.SYSTEM_UPDATE),
  systemController.restoreBackup
)

export default router
