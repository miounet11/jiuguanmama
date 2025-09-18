"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCredits = exports.requireSubscription = exports.requireAdmin = exports.requireRole = exports.optionalAuth = exports.authenticate = exports.PasswordManager = exports.TokenManager = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const env_config_1 = require("../config/env.config");
const prisma = new client_1.PrismaClient();
/**
 * JWT Token 管理器
 */
class TokenManager {
    static jwtSecret;
    static jwtRefreshSecret;
    static initialize() {
        const config = (0, env_config_1.getEnvConfig)();
        this.jwtSecret = config.JWT_SECRET;
        this.jwtRefreshSecret = config.JWT_REFRESH_SECRET;
    }
    static generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.jwtSecret, { expiresIn: '15m' });
    }
    static generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.jwtRefreshSecret, { expiresIn: '7d' });
    }
    static verifyAccessToken(token) {
        return jsonwebtoken_1.default.verify(token, this.jwtSecret);
    }
    static verifyRefreshToken(token) {
        return jsonwebtoken_1.default.verify(token, this.jwtRefreshSecret);
    }
    static async generateTokenPair(user) {
        const payload = {
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };
        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken(payload);
        // 保存刷新令牌到数据库
        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
        return { accessToken, refreshToken };
    }
    static async revokeRefreshToken(token) {
        await prisma.refreshToken.deleteMany({ where: { token } });
    }
}
exports.TokenManager = TokenManager;
/**
 * 密码管理器
 */
class PasswordManager {
    static async hashPassword(password) {
        return bcryptjs_1.default.hash(password, 12);
    }
    static async comparePassword(password, hash) {
        return bcryptjs_1.default.compare(password, hash);
    }
}
exports.PasswordManager = PasswordManager;
/**
 * 主要认证中间件
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Access token required'
            });
            return;
        }
        const decoded = TokenManager.verifyAccessToken(token);
        const user = await prisma.user.findUnique({
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
            res.status(401).json({
                success: false,
                error: 'User not found or inactive'
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: 'Token expired'
            });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
            return;
        }
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
};
exports.authenticate = authenticate;
/**
 * 可选认证中间件
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const decoded = TokenManager.verifyAccessToken(token);
            const user = await prisma.user.findUnique({
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
            if (user && user.isActive) {
                req.user = user;
            }
        }
        next();
    }
    catch (error) {
        // 可选认证失败时继续，不阻塞请求
        next();
    }
};
exports.optionalAuth = optionalAuth;
/**
 * 角色权限检查中间件
 */
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
/**
 * 管理员权限检查
 */
exports.requireAdmin = (0, exports.requireRole)(['admin']);
/**
 * 订阅等级检查中间件
 */
const requireSubscription = (minTier) => {
    const tierHierarchy = ['free', 'plus', 'pro'];
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return;
        }
        const userTierIndex = tierHierarchy.indexOf(req.user.subscriptionTier);
        const requiredTierIndex = tierHierarchy.indexOf(minTier);
        if (userTierIndex < requiredTierIndex) {
            res.status(403).json({
                success: false,
                error: `${minTier} subscription required`,
                currentTier: req.user.subscriptionTier,
                requiredTier: minTier
            });
            return;
        }
        next();
    };
};
exports.requireSubscription = requireSubscription;
/**
 * 积分检查中间件
 */
const requireCredits = (cost) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return;
        }
        if (req.user.credits < cost) {
            res.status(402).json({
                success: false,
                error: 'Insufficient credits',
                required: cost,
                available: req.user.credits
            });
            return;
        }
        next();
    };
};
exports.requireCredits = requireCredits;
// 初始化 TokenManager
TokenManager.initialize();
//# sourceMappingURL=auth.js.map