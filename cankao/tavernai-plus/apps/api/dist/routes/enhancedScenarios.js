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
        // 处理 tags 字段 - 如果是字符串，转换为数组
        if (scenario.tags && typeof scenario.tags === 'string') {
            try {
                scenario.tags = JSON.parse(scenario.tags);
            }
            catch (e) {
                // 如果解析失败，保持原值
                console.warn('Failed to parse tags as JSON:', scenario.tags);
            }
        }
        res.json({ success: true, data: scenario });
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
        // 如果是时空酒馆剧本，返回硬编码的世界信息数据
        if (id === 'scenario_timespace') {
            const hardcodedWorldInfo = [
                {
                    id: 'world-tavern-core',
                    title: '时空酒馆核心规则',
                    content: '时空酒馆是连接所有时空的中立地带，在这里禁止任何形式的暴力行为。所有进入酒馆的客人都会自动获得"时空漫游者"身份，可以自由穿越不同的时空门扉。',
                    keywords: ['时空酒馆', '规则', '中立地带', '时空漫游者'],
                    priority: 100,
                    isActive: true,
                    order: 1,
                    category: 'core_rules',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'world-tavern-structure',
                    title: '酒馆内部结构',
                    content: '时空酒馆内部看似普通，但实际上是一个独立的空间维度。中央有一个永恒燃烧的壁炉，七扇门分别代表不同的时空。吧台后面有一面古老的镜子，据说能够映照出每个客人内心深处的渴望。',
                    keywords: ['酒馆结构', '壁炉', '七扇门', '古老镜子'],
                    priority: 90,
                    isActive: true,
                    order: 2,
                    category: 'location',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'world-time-doors',
                    title: '时空门扉系统',
                    content: '七扇门分别通往：1号门-古代武侠世界；2号门-现代都市；3号门-未来科技时代；4号门-奇幻魔法世界；5号门-末日废土；6号门-星际宇宙；7号门-虚拟数字空间。每扇门都有自己的规则和限制。',
                    keywords: ['时空门', '七个世界', '穿越规则', '门扉系统'],
                    priority: 95,
                    isActive: true,
                    order: 3,
                    category: 'mechanics',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'world-tavern-keeper',
                    title: '酒馆老板娘的秘密',
                    content: '苏晚并非普通的酒馆老板娘，她是时空酒馆的守护者，拥有调节各个时空平衡的能力。她的年龄无法用常规方式计算，据说已经见证了无数文明的兴衰。她从不干涉客人的选择，但会在关键时刻给予神秘的指引。',
                    keywords: ['苏晚', '守护者', '时空平衡', '神秘指引'],
                    priority: 85,
                    isActive: true,
                    order: 4,
                    category: 'character',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'world-time-travelers',
                    title: '时空旅者须知',
                    content: '所有进入时空酒馆的客人都被称为"时空旅者"。旅者可以在不同时空间穿梭，但必须遵守"不干涉历史进程"的基本原则。每个旅者都会获得一枚时空印记，这枚印记记录了他们在各个时空的经历和选择。',
                    keywords: ['时空旅者', '不干涉原则', '时空印记', '经历记录'],
                    priority: 80,
                    isActive: true,
                    order: 5,
                    category: 'roleplay',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'world-paradox-protection',
                    title: '悖论保护机制',
                    content: '时空酒馆内置了强大的悖论保护机制。如果旅者的行为可能导致严重的时间悖论，酒馆会自动干预。这种干预通常以神秘的预兆、直觉提醒，或者老板娘苏晚的暗示形式出现。',
                    keywords: ['悖论保护', '时间悖论', '自动干预', '预兆系统'],
                    priority: 88,
                    isActive: true,
                    order: 6,
                    category: 'mechanics',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'world-tavern-services',
                    title: '酒馆特殊服务',
                    content: '时空酒馆不仅提供住宿和餐饮，还提供特殊服务：时空导航（帮助旅者找到目标时空）、记忆保管（安全存储重要记忆）、物品交换（跨时空物品交易）、命运咨询（通过神秘方式预测可能的未来）。',
                    keywords: ['特殊服务', '时空导航', '记忆保管', '命运咨询'],
                    priority: 75,
                    isActive: true,
                    order: 7,
                    category: 'services',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'world-secret-rooms',
                    title: '隐藏的密室',
                    content: '时空酒馆内有多个隐藏的密室，只有特定的时空印记才能开启。这些密室包括：时空图书馆（记录所有时空的历史）、命运编织室（可以观察和微调命运线）、回响大厅（能够听到过去和未来的声音）。',
                    keywords: ['隐藏密室', '时空图书馆', '命运编织', '时空回响'],
                    priority: 70,
                    isActive: true,
                    order: 8,
                    category: 'location',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            return res.json({ worldInfoEntries: hardcodedWorldInfo });
        }
        // 其他剧本仍使用数据库查询
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