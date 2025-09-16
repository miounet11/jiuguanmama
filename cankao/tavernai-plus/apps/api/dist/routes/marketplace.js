"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const server_1 = require("../server");
const router = (0, express_1.Router)();
// 获取市场角色列表
router.get('/characters', async (req, res) => {
    try {
        const { category, minRating = 0, language, search, sortBy = 'popular', page = 1, limit = 20 } = req.query;
        const where = {
            isPublic: true,
            rating: { gte: Number(minRating) }
        };
        if (category)
            where.category = category;
        if (language)
            where.language = language;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { tags: { has: search } }
            ];
        }
        const orderBy = {};
        switch (sortBy) {
            case 'popular':
                orderBy.favorites = { _count: 'desc' };
                break;
            case 'newest':
                orderBy.createdAt = 'desc';
                break;
            case 'rating':
                orderBy.rating = 'desc';
                break;
            case 'favorites':
                orderBy.favorites = { _count: 'desc' };
                break;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [characters, total] = await Promise.all([
            server_1.prisma.character.findMany({
                where,
                orderBy,
                skip,
                take: Number(limit),
                include: {
                    creator: {
                        select: { id: true, username: true, avatar: true }
                    },
                    _count: {
                        select: { favorites: true, ratings: true }
                    }
                }
            }),
            server_1.prisma.character.count({ where })
        ]);
        const pages = Math.ceil(total / Number(limit));
        res.json({
            characters: characters.map(char => ({
                ...char,
                favorites: char._count.favorites,
                ratingCount: char._count.ratings,
                isFeatured: char.isFeatured || false
            })),
            total,
            page: Number(page),
            pages,
            hasNext: Number(page) < pages,
            hasPrev: Number(page) > 1
        });
    }
    catch (error) {
        console.error('Get marketplace characters error:', error);
        res.status(500).json({ error: 'Failed to fetch characters' });
    }
});
// 获取特色角色
router.get('/featured', async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 10, 20);
        const characters = await server_1.prisma.character.findMany({
            where: {
                isPublic: true,
                isFeatured: true
            },
            orderBy: [
                { rating: 'desc' },
                { favorites: { _count: 'desc' } }
            ],
            take: limit,
            include: {
                creator: {
                    select: { id: true, username: true, avatar: true }
                },
                _count: {
                    select: { favorites: true, ratings: true }
                }
            }
        });
        res.json(characters.map(char => ({
            ...char,
            favorites: char._count.favorites,
            ratingCount: char._count.ratings,
            isFeatured: true
        })));
    }
    catch (error) {
        console.error('Get featured characters error:', error);
        res.status(500).json({ error: 'Failed to fetch featured characters' });
    }
});
// 获取推荐角色（基于用户偏好）
router.get('/recommended', auth_1.authenticateToken, async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 12, 30);
        const userId = req.user.id;
        // 获取用户最近使用的角色类别
        const recentChats = await server_1.prisma.chatSession.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            take: 10,
            include: {
                character: {
                    select: { category: true, tags: true }
                }
            }
        });
        const preferredCategories = [...new Set(recentChats.map(c => c.character.category))];
        const preferredTags = [...new Set(recentChats.flatMap(c => c.character.tags))];
        // 基于偏好推荐角色
        const characters = await server_1.prisma.character.findMany({
            where: {
                isPublic: true,
                NOT: { creatorId: userId },
                OR: [
                    { category: { in: preferredCategories } },
                    { tags: { hasSome: preferredTags } }
                ]
            },
            orderBy: [
                { rating: 'desc' },
                { createdAt: 'desc' }
            ],
            take: limit,
            include: {
                creator: {
                    select: { id: true, username: true, avatar: true }
                },
                _count: {
                    select: { favorites: true, ratings: true }
                }
            }
        });
        // 如果推荐不足，补充热门角色
        let finalCharacters = characters;
        if (characters.length < limit) {
            const popular = await server_1.prisma.character.findMany({
                where: {
                    isPublic: true,
                    NOT: {
                        id: { in: characters.map(c => c.id) }
                    }
                },
                orderBy: { favorites: { _count: 'desc' } },
                take: limit - characters.length,
                include: {
                    creator: {
                        select: { id: true, username: true, avatar: true }
                    },
                    _count: {
                        select: { favorites: true, ratings: true }
                    }
                }
            });
            finalCharacters = [...characters, ...popular];
        }
        res.json(finalCharacters.map(char => ({
            ...char,
            favorites: char._count.favorites,
            ratingCount: char._count.ratings
        })));
    }
    catch (error) {
        console.error('Get recommended characters error:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});
// 获取分类统计
router.get('/categories/stats', async (req, res) => {
    try {
        const categories = await server_1.prisma.character.groupBy({
            by: ['category'],
            where: { isPublic: true },
            _count: { category: true }
        });
        const categoryIcons = {
            '动漫': 'anime',
            '游戏': 'game',
            '历史': 'history',
            '虚拟': 'virtual',
            '名人': 'celebrity',
            '原创': 'original',
            '电影': 'movie',
            '书籍': 'book'
        };
        res.json(categories.map(cat => ({
            name: cat.category,
            count: cat._count.category,
            icon: categoryIcons[cat.category] || 'default'
        })));
    }
    catch (error) {
        console.error('Get category stats error:', error);
        res.status(500).json({ error: 'Failed to fetch category statistics' });
    }
});
// 获取热门创作者
router.get('/creators/top', async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 5, 10);
        const creators = await server_1.prisma.user.findMany({
            where: {
                characters: {
                    some: { isPublic: true }
                }
            },
            select: {
                id: true,
                username: true,
                avatar: true,
                characters: {
                    where: { isPublic: true },
                    select: {
                        rating: true,
                        _count: {
                            select: { favorites: true }
                        }
                    }
                }
            },
            orderBy: {
                characters: { _count: 'desc' }
            },
            take: limit
        });
        const topCreators = creators.map(creator => {
            const totalFavorites = creator.characters.reduce((sum, char) => sum + char._count.favorites, 0);
            const avgRating = creator.characters.reduce((sum, char) => sum + (char.rating || 0), 0) / creator.characters.length;
            return {
                id: creator.id,
                username: creator.username,
                avatar: creator.avatar,
                characterCount: creator.characters.length,
                totalFavorites,
                averageRating: Math.round(avgRating * 10) / 10
            };
        });
        res.json(topCreators);
    }
    catch (error) {
        console.error('Get top creators error:', error);
        res.status(500).json({ error: 'Failed to fetch top creators' });
    }
});
// 搜索角色
router.get('/search', async (req, res) => {
    try {
        const { query: searchQuery, category, language, limit = 20 } = req.query;
        if (!searchQuery) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        const where = {
            isPublic: true,
            OR: [
                { name: { contains: searchQuery, mode: 'insensitive' } },
                { description: { contains: searchQuery, mode: 'insensitive' } },
                { tags: { has: searchQuery } }
            ]
        };
        if (category)
            where.category = category;
        if (language)
            where.language = language;
        const characters = await server_1.prisma.character.findMany({
            where,
            orderBy: [
                { rating: 'desc' },
                { favorites: { _count: 'desc' } }
            ],
            take: Number(limit),
            include: {
                creator: {
                    select: { id: true, username: true, avatar: true }
                },
                _count: {
                    select: { favorites: true, ratings: true }
                }
            }
        });
        res.json(characters.map(char => ({
            ...char,
            favorites: char._count.favorites,
            ratingCount: char._count.ratings
        })));
    }
    catch (error) {
        console.error('Search characters error:', error);
        res.status(500).json({ error: 'Failed to search characters' });
    }
});
// 获取单个角色详情
router.get('/characters/:id', async (req, res) => {
    try {
        const character = await server_1.prisma.character.findUnique({
            where: {
                id: req.params.id,
                isPublic: true
            },
            include: {
                creator: {
                    select: { id: true, username: true, avatar: true }
                },
                _count: {
                    select: {
                        favorites: true,
                        ratings: true,
                        chatSessions: true
                    }
                },
                chatSessions: {
                    select: {
                        updatedAt: true,
                        messages: {
                            select: { id: true }
                        }
                    },
                    orderBy: { updatedAt: 'desc' },
                    take: 1
                }
            }
        });
        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }
        const totalMessages = await server_1.prisma.message.count({
            where: {
                chatSession: {
                    characterId: character.id
                }
            }
        });
        const avgSessionLength = character._count.chatSessions > 0
            ? Math.round(totalMessages / character._count.chatSessions)
            : 0;
        res.json({
            ...character,
            favorites: character._count.favorites,
            ratingCount: character._count.ratings,
            stats: {
                totalChats: character._count.chatSessions,
                avgSessionLength,
                lastUsed: character.chatSessions[0]?.updatedAt || null
            }
        });
    }
    catch (error) {
        console.error('Get character details error:', error);
        res.status(500).json({ error: 'Failed to fetch character details' });
    }
});
// 收藏角色
router.post('/characters/:id/favorite', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const characterId = req.params.id;
        const existing = await server_1.prisma.characterFavorite.findUnique({
            where: {
                userId_characterId: { userId, characterId }
            }
        });
        if (existing) {
            return res.status(400).json({ error: 'Already favorited' });
        }
        await server_1.prisma.characterFavorite.create({
            data: { userId, characterId }
        });
        res.json({ message: 'Character favorited successfully' });
    }
    catch (error) {
        console.error('Favorite character error:', error);
        res.status(500).json({ error: 'Failed to favorite character' });
    }
});
// 取消收藏角色
router.delete('/characters/:id/favorite', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const characterId = req.params.id;
        await server_1.prisma.characterFavorite.delete({
            where: {
                userId_characterId: { userId, characterId }
            }
        });
        res.json({ message: 'Character unfavorited successfully' });
    }
    catch (error) {
        console.error('Unfavorite character error:', error);
        res.status(500).json({ error: 'Failed to unfavorite character' });
    }
});
// 评价角色
router.post('/characters/:id/rate', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const characterId = req.params.id;
        const { rating, comment } = req.body;
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Invalid rating. Must be between 1 and 5' });
        }
        // 检查是否已评价
        const existing = await server_1.prisma.characterRating.findUnique({
            where: {
                userId_characterId: { userId, characterId }
            }
        });
        if (existing) {
            // 更新评价
            await server_1.prisma.characterRating.update({
                where: {
                    userId_characterId: { userId, characterId }
                },
                data: { rating, comment }
            });
        }
        else {
            // 创建新评价
            await server_1.prisma.characterRating.create({
                data: { userId, characterId, rating, comment }
            });
        }
        // 更新角色平均评分
        const ratings = await server_1.prisma.characterRating.findMany({
            where: { characterId },
            select: { rating: true }
        });
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        await server_1.prisma.character.update({
            where: { id: characterId },
            data: { rating: Math.round(avgRating * 10) / 10 }
        });
        res.json({ message: 'Rating submitted successfully' });
    }
    catch (error) {
        console.error('Rate character error:', error);
        res.status(500).json({ error: 'Failed to rate character' });
    }
});
// 导入角色到我的角色库
router.post('/characters/:id/import', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const sourceCharacterId = req.params.id;
        // 获取源角色
        const sourceCharacter = await server_1.prisma.character.findUnique({
            where: {
                id: sourceCharacterId,
                isPublic: true
            }
        });
        if (!sourceCharacter) {
            return res.status(404).json({ error: 'Character not found' });
        }
        // 创建角色副本
        const { id, creatorId, createdAt, updatedAt, ...characterData } = sourceCharacter;
        const newCharacter = await server_1.prisma.character.create({
            data: {
                ...characterData,
                name: `${characterData.name} (导入)`,
                creatorId: userId,
                isPublic: false,
                importedFrom: sourceCharacterId
            }
        });
        res.json({ characterId: newCharacter.id });
    }
    catch (error) {
        console.error('Import character error:', error);
        res.status(500).json({ error: 'Failed to import character' });
    }
});
exports.default = router;
//# sourceMappingURL=marketplace.js.map