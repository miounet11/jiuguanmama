"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRateLimiter = exports.logAdminAction = exports.requirePermission = exports.requireAdmin = exports.Permission = exports.UserRole = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const server_1 = require("../server");
// 管理员角色枚举
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["MODERATOR"] = "moderator";
    UserRole["ADMIN"] = "admin";
    UserRole["SUPER_ADMIN"] = "super_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
// 权限级别
var Permission;
(function (Permission) {
    // 用户管理
    Permission["USER_VIEW"] = "user:view";
    Permission["USER_CREATE"] = "user:create";
    Permission["USER_UPDATE"] = "user:update";
    Permission["USER_DELETE"] = "user:delete";
    // 模型管理
    Permission["MODEL_VIEW"] = "model:view";
    Permission["MODEL_CREATE"] = "model:create";
    Permission["MODEL_UPDATE"] = "model:update";
    Permission["MODEL_DELETE"] = "model:delete";
    // 系统配置
    Permission["SYSTEM_VIEW"] = "system:view";
    Permission["SYSTEM_UPDATE"] = "system:update";
    // 日志查看
    Permission["LOG_VIEW"] = "log:view";
    Permission["LOG_EXPORT"] = "log:export";
    // 财务管理
    Permission["FINANCE_VIEW"] = "finance:view";
    Permission["FINANCE_MANAGE"] = "finance:manage";
    // 渠道管理
    Permission["CHANNEL_VIEW"] = "channel:view";
    Permission["CHANNEL_MANAGE"] = "channel:manage";
})(Permission || (exports.Permission = Permission = {}));
// 角色权限映射
const rolePermissions = {
    [UserRole.USER]: [],
    [UserRole.MODERATOR]: [
        Permission.USER_VIEW,
        Permission.MODEL_VIEW,
        Permission.LOG_VIEW,
        Permission.CHANNEL_VIEW
    ],
    [UserRole.ADMIN]: [
        Permission.USER_VIEW,
        Permission.USER_CREATE,
        Permission.USER_UPDATE,
        Permission.MODEL_VIEW,
        Permission.MODEL_CREATE,
        Permission.MODEL_UPDATE,
        Permission.SYSTEM_VIEW,
        Permission.LOG_VIEW,
        Permission.LOG_EXPORT,
        Permission.FINANCE_VIEW,
        Permission.CHANNEL_VIEW,
        Permission.CHANNEL_MANAGE
    ],
    [UserRole.SUPER_ADMIN]: Object.values(Permission) // 所有权限
};
// 验证管理员身份中间件
const requireAdmin = async (req, res, next) => {
    try {
        // 从 header 获取 token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: '未授权访问'
            });
        }
        const token = authHeader.substring(7);
        // 验证 token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // 获取用户信息
        const user = await server_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                credits: true,
                subscriptionTier: true,
                isActive: true,
                isVerified: true
            }
        });
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: '用户不存在或已被禁用'
            });
        }
        // 检查是否是管理员
        const adminRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
        if (!adminRoles.includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: '需要管理员权限'
            });
        }
        // 附加到 request
        req.user = user;
        req.isAdmin = true;
        next();
    }
    catch (error) {
        console.error('管理员验证失败:', error);
        return res.status(401).json({
            success: false,
            message: '认证失败'
        });
    }
};
exports.requireAdmin = requireAdmin;
// 检查特定权限
const requirePermission = (permission) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: '未授权访问'
                });
            }
            const userRole = req.user.role;
            const userPermissions = rolePermissions[userRole] || [];
            const requiredPermissions = Array.isArray(permission) ? permission : [permission];
            const hasPermission = requiredPermissions.some(p => userPermissions.includes(p));
            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: '权限不足'
                });
            }
            next();
        }
        catch (error) {
            console.error('权限检查失败:', error);
            return res.status(500).json({
                success: false,
                message: '权限验证失败'
            });
        }
    };
};
exports.requirePermission = requirePermission;
// 记录管理操作日志
const logAdminAction = async (req, res, next) => {
    const startTime = Date.now();
    // 监听响应
    const originalSend = res.send;
    res.send = function (data) {
        res.send = originalSend;
        // 记录日志
        if (req.user && req.isAdmin) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            // 异步记录，不阻塞响应
            setImmediate(async () => {
                try {
                    await server_1.prisma.adminLog.create({
                        data: {
                            adminId: req.user?.id || '',
                            action: `${req.method} ${req.originalUrl}`,
                            targetType: 'admin_action',
                            targetId: null,
                            details: JSON.stringify({
                                requestBody: req.body,
                                responseStatus: res.statusCode,
                                duration,
                                path: req.path,
                                query: req.query,
                                params: req.params
                            }),
                            ip: req.ip || req.socket.remoteAddress || '',
                            userAgent: req.headers['user-agent'] || ''
                        }
                    });
                }
                catch (error) {
                    console.error('记录管理日志失败:', error);
                }
            });
        }
        return res.send(data);
    };
    next();
};
exports.logAdminAction = logAdminAction;
// 速率限制（管理接口特殊配置）
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.adminRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制100次请求
    message: '请求过于频繁，请稍后再试',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // 超级管理员跳过限制
        return req.user?.role === UserRole.SUPER_ADMIN;
    }
});
//# sourceMappingURL=admin.js.map