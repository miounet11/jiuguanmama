"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// 验证模式
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6)
});
const registerSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6)
});
const refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string()
});
// 生成 JWT
const generateTokens = (user) => {
    const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, username: user.username }, process.env.JWT_SECRET || 'default-secret-change-this', { expiresIn: '15m' });
    const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-this', { expiresIn: '7d' });
    return { accessToken, refreshToken };
};
// 注册
router.post('/register', (0, validate_1.validate)(registerSchema), async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        // 检查用户是否已存在
        const existingUser = await prisma_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: existingUser.email === email
                    ? 'Email already registered'
                    : 'Username already taken'
            });
        }
        // 加密密码
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // 创建用户
        const user = await prisma_1.prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                verificationToken: crypto_1.default.randomBytes(32).toString('hex')
            },
            select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                bio: true,
                credits: true,
                subscriptionTier: true,
                subscriptionExpiresAt: true,
                createdAt: true
            }
        });
        // 生成令牌
        const { accessToken, refreshToken } = generateTokens(user);
        // 保存刷新令牌
        await prisma_1.prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天
            }
        });
        res.status(201).json({
            success: true,
            accessToken,
            refreshToken,
            user
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
// 登录
router.post('/login', (0, validate_1.validate)(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // 查找用户
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                username: true,
                email: true,
                passwordHash: true,
                avatar: true,
                bio: true,
                credits: true,
                subscriptionTier: true,
                subscriptionExpiresAt: true,
                isActive: true,
                createdAt: true
            }
        });
        if (!user || !user.passwordHash) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account has been deactivated'
            });
        }
        // 验证密码
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        // 更新最后登录时间
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });
        // 生成令牌
        const { accessToken, refreshToken } = generateTokens(user);
        // 保存刷新令牌
        await prisma_1.prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
        // 移除密码字段
        const { passwordHash, ...userWithoutPassword } = user;
        res.json({
            success: true,
            accessToken,
            refreshToken,
            user: userWithoutPassword
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
// 刷新令牌
router.post('/refresh', (0, validate_1.validate)(refreshTokenSchema), async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        // 验证刷新令牌
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
        // 检查令牌是否存在于数据库
        const storedToken = await prisma_1.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true }
        });
        if (!storedToken || storedToken.expiresAt < new Date()) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token expired or invalid'
            });
        }
        // 删除旧的刷新令牌
        await prisma_1.prisma.refreshToken.delete({
            where: { id: storedToken.id }
        });
        // 生成新令牌
        const { accessToken, refreshToken: newRefreshToken } = generateTokens({
            id: storedToken.user.id,
            email: storedToken.user.email,
            username: storedToken.user.username
        });
        // 保存新的刷新令牌
        await prisma_1.prisma.refreshToken.create({
            data: {
                userId: storedToken.user.id,
                token: newRefreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
        res.json({
            success: true,
            accessToken,
            refreshToken: newRefreshToken
        });
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token expired'
            });
        }
        next(error);
        return;
    }
});
// 退出登录
router.post('/logout', auth_1.authenticate, async (req, res, next) => {
    try {
        // 删除用户的所有刷新令牌
        await prisma_1.prisma.refreshToken.deleteMany({
            where: { userId: req.user.id }
        });
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
// 获取当前用户信息
router.get('/profile', auth_1.authenticate, async (req, res, next) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                bio: true,
                credits: true,
                subscriptionTier: true,
                subscriptionExpiresAt: true,
                isVerified: true,
                createdAt: true
            }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            user
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map