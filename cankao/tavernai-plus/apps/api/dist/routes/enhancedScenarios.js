"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const { PrismaClient } = require('../../node_modules/.prisma/client');
const router = (0, express_1.Router)();
const prisma = new PrismaClient();
// GET /api/enhanced-scenarios - 获取所有增强剧本
router.get('/', async (req, res) => {
    try {
        const { page = '1', limit = '20', genre, complexity, contentRating, worldScope, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        const where = {};
        if (genre)
            where.genre = genre;
        if (complexity)
            where.complexity = complexity;
        if (contentRating)
            where.contentRating = contentRating;
        if (worldScope)
            where.worldScope = worldScope;
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { description: { contains: search } },
                { worldSetting: { contains: search } }
            ];
        }
        const [scenarios, total] = await Promise.all([
            prisma.scenario.findMany({
                where,
                skip,
                take,
                include: {
                    user: {
                        select: { id: true, username: true, email: true }
                    },
                    worldLocations: {
                        select: { id: true, name: true, locationType: true }
                    },
                    worldEvents: {
                        select: { id: true, name: true, eventType: true }
                    },
                    worldOrganizations: {
                        select: { id: true, name: true, organizationType: true }
                    },
                    worldInfos: {
                        select: { id: true, category: true }
                    },
                    _count: {
                        select: {
                            worldLocations: true,
                            worldEvents: true,
                            worldOrganizations: true,
                            worldInfos: true,
                            characters: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.scenario.count({ where })
        ]);
        res.json({
            scenarios,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    }
    catch (error) {
        console.error('Error fetching enhanced scenarios:', error);
        res.status(500).json({ error: '获取增强剧本失败' });
    }
});
// GET /api/enhanced-scenarios/:id - 获取特定增强剧本详情
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const scenario = await prisma.scenario.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, username: true, email: true }
                },
                worldLocations: {
                    include: {
                        parentLocation: true,
                        childLocations: true
                    },
                    orderBy: { significance: 'desc' }
                },
                worldEvents: {
                    orderBy: { importance: 'desc' }
                },
                worldOrganizations: {
                    orderBy: { influence: 'desc' }
                },
                worldCultures: {
                    orderBy: { influence: 'desc' }
                },
                worldItems: {
                    orderBy: { rarity: 'desc' }
                },
                worldRules: {
                    orderBy: { scope: 'desc' }
                },
                worldInfos: {
                    where: { isActive: true },
                    orderBy: { priority: 'desc' }
                },
                characters: {
                    include: {
                        character: {
                            select: { id: true, name: true, description: true, avatar: true }
                        },
                        characterWorldSettings: true
                    }
                }
            }
        });
        if (!scenario) {
            return res.status(404).json({ error: '剧本未找到' });
        }
        res.json(scenario);
    }
    catch (error) {
        console.error('Error fetching scenario details:', error);
        res.status(500).json({ error: '获取剧本详情失败' });
    }
});
// GET /api/enhanced-scenarios/:id/world-info - 获取世界信息条目
router.get('/:id/world-info', async (req, res) => {
    try {
        const { id } = req.params;
        const worldInfoEntries = await prisma.worldInfoEntry.findMany({
            where: {
                scenarioId: id,
                isActive: true
            },
            orderBy: { priority: 'desc' }
        });
        res.json({ worldInfoEntries });
    }
    catch (error) {
        console.error('Error fetching world info:', error);
        res.status(500).json({ error: '获取世界信息失败' });
    }
});
// GET /api/enhanced-scenarios/:id/locations - 获取世界地点
router.get('/:id/locations', async (req, res) => {
    try {
        const { id } = req.params;
        const locations = await prisma.worldLocation.findMany({
            where: { scenarioId: id },
            include: {
                parentLocation: true,
                childLocations: true
            },
            orderBy: { significance: 'desc' }
        });
        res.json({ locations });
    }
    catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ error: '获取地点信息失败' });
    }
});
// GET /api/enhanced-scenarios/:id/events - 获取世界事件
router.get('/:id/events', async (req, res) => {
    try {
        const { id } = req.params;
        const events = await prisma.worldEvent.findMany({
            where: { scenarioId: id },
            orderBy: { importance: 'desc' }
        });
        res.json({ events });
    }
    catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: '获取事件信息失败' });
    }
});
// GET /api/enhanced-scenarios/:id/organizations - 获取世界组织
router.get('/:id/organizations', async (req, res) => {
    try {
        const { id } = req.params;
        const organizations = await prisma.worldOrganization.findMany({
            where: { scenarioId: id },
            include: {
                leaderCharacter: {
                    select: { id: true, name: true, avatar: true }
                }
            },
            orderBy: { influence: 'desc' }
        });
        res.json({ organizations });
    }
    catch (error) {
        console.error('Error fetching organizations:', error);
        res.status(500).json({ error: '获取组织信息失败' });
    }
});
exports.default = router;
//# sourceMappingURL=enhancedScenarios.js.map