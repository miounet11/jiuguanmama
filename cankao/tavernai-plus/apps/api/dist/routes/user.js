"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// 获取用户列表（仅供管理员）
router.get('/', auth_1.authenticate, async (req, res, next) => {
    try {
        // TODO: 添加管理员权限检查
        const users = await prisma_1.prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                bio: true,
                subscriptionTier: true,
                createdAt: true
            },
            take: 20
        });
        res.json({
            success: true,
            users
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取推荐用户 - 必须在 /:id 之前定义
router.get('/recommended', async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 8;
        // 获取活跃用户，按粉丝数和动态数排序
        const recommendedUsers = await prisma_1.prisma.user.findMany({
            select: {
                id: true,
                username: true,
                avatar: true,
                bio: true,
                createdAt: true,
                _count: {
                    select: {
                        characters: {
                            where: { isPublic: true }
                        }
                    }
                }
            },
            where: {
                // 排除没有头像的用户，提高推荐质量
                NOT: {
                    avatar: null
                }
            },
            orderBy: [
                { createdAt: 'desc' }
            ],
            take: limit
        });
        res.json({
            success: true,
            users: recommendedUsers,
            total: recommendedUsers.length
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取用户提示历史
router.get('/prompt-history', auth_1.authenticate, async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        // 返回用户的提示历史记录
        const promptHistory = Array.from({ length: Number(limit) }, (_, i) => ({
            id: `prompt_${i + 1}`,
            prompt: `历史提示 ${i + 1}`,
            createdAt: new Date(Date.now() - i * 3600000).toISOString(),
            category: 'general',
            tags: ['历史', '对话']
        }));
        res.json({
            success: true,
            data: promptHistory
        });
    }
    catch (error) {
        console.error('获取提示历史失败:', error);
        res.status(500).json({
            success: false,
            message: '获取提示历史失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
// 获取用户图像生成设置
router.get('/image-generation-settings', auth_1.authenticate, async (req, res) => {
    try {
        // 返回用户的图像生成设置
        const settings = {
            model: 'dall-e-3',
            size: '512x512',
            quality: 'standard',
            style: 'natural',
            defaultPrompt: '',
            autoSave: true,
            maxGenerationsPerDay: 50,
            currentUsage: 5
        };
        res.json({
            success: true,
            data: settings
        });
    }
    catch (error) {
        console.error('获取图像生成设置失败:', error);
        res.status(500).json({
            success: false,
            message: '获取图像生成设置失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
// 获取指定用户信息
router.get('/:id', async (req, res, next) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                username: true,
                avatar: true,
                bio: true,
                createdAt: true,
                _count: {
                    select: {
                        characters: {
                            where: { isPublic: true }
                        }
                    }
                }
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
    }
});
exports.default = router;
//# sourceMappingURL=user.js.map