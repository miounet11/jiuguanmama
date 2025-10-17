"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const ai_1 = require("../services/ai");
const validate_1 = require("../middleware/validate");
const character_1 = require("../schemas/character");
const router = (0, express_1.Router)();
// 获取公开角色列表
router.get('/', auth_1.optionalAuth, (0, validate_1.validate)(character_1.characterQuerySchema, 'query'), async (req, res, next) => {
    try {
        const { page, limit, sort, search, category, tags } = req.query;
        const orderBy = sort === 'rating'
            ? { rating: 'desc' }
            : sort === 'popular'
                ? { chatCount: 'desc' }
                : { createdAt: 'desc' };
        // 构建查询条件
        const where = { isPublic: true };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (category && category !== 'all') {
            where.category = category;
        }
        // TODO: Fix tag filtering for SQLite (tags is now a JSON string)
        // if (tags && Array.isArray(tags) && tags.length > 0) {
        //   where.tags = { hasSome: tags }
        // }
        const characters = await prisma_1.prisma.character.findMany({
            where,
            select: {
                id: true,
                name: true,
                description: true,
                avatar: true,
                tags: true,
                rating: true,
                ratingCount: true,
                chatCount: true,
                favoriteCount: true,
                isNSFW: true,
                creator: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true
                    }
                },
                createdAt: true,
                _count: {
                    select: {
                        favorites: {
                            where: {
                                userId: req.user?.id
                            }
                        }
                    }
                }
            },
            orderBy,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });
        // 添加是否收藏标记
        const charactersWithFavorite = characters.map((char) => ({
            ...char,
            isFavorited: char._count.favorites > 0,
            isNew: new Date(char.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        }));
        const total = await prisma_1.prisma.character.count({ where });
        res.json({
            success: true,
            characters: charactersWithFavorite,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取精选角色
router.get('/featured', auth_1.optionalAuth, async (req, res, next) => {
    try {
        const { category, sortBy = 'popular', limit = 20 } = req.query;
        let orderBy;
        switch (sortBy) {
            case 'newest':
                orderBy = { createdAt: 'desc' };
                break;
            case 'rating':
                orderBy = { rating: 'desc' };
                break;
            case 'chatCount':
                orderBy = { chatCount: 'desc' };
                break;
            case 'popular':
            default:
                orderBy = [
                    { chatCount: 'desc' },
                    { favoriteCount: 'desc' },
                    { rating: 'desc' }
                ];
                break;
        }
        const where = {
            isPublic: true,
            isFeatured: true
        };
        if (category && category !== 'all') {
            where.category = category;
        }
        const characters = await prisma_1.prisma.character.findMany({
            where,
            select: {
                id: true,
                name: true,
                description: true,
                avatar: true,
                tags: true,
                category: true,
                rating: true,
                ratingCount: true,
                chatCount: true,
                favoriteCount: true,
                isNSFW: true,
                creator: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true
                    }
                },
                createdAt: true,
                _count: {
                    select: {
                        favorites: {
                            where: {
                                userId: req.user?.id
                            }
                        }
                    }
                }
            },
            orderBy,
            take: Number(limit)
        });
        // 添加是否收藏标记和是否为新角色标记
        const charactersWithExtra = characters.map((char) => ({
            ...char,
            isFavorited: char._count.favorites > 0,
            isNew: new Date(char.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
            isPremium: char.rating >= 4.5 && char.chatCount >= 100
        }));
        res.json({
            success: true,
            characters: charactersWithExtra
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取角色分类
router.get('/categories', async (req, res, next) => {
    try {
        // 获取所有分类的统计数据
        const categoryStats = await prisma_1.prisma.character.groupBy({
            by: ['category'],
            where: {
                isPublic: true
            },
            _count: {
                id: true
            }
        });
        // 预定义的分类信息
        const categoryInfo = {
            'anime': { name: '动漫', icon: 'star', description: '来自动漫作品的角色' },
            'game': { name: '游戏', icon: 'gamepad', description: '游戏角色和原创设定' },
            'fantasy': { name: '奇幻', icon: 'magic', description: '魔法世界的奇幻角色' },
            'sci-fi': { name: '科幻', icon: 'rocket', description: '未来科技背景角色' },
            'historical': { name: '历史', icon: 'crown', description: '历史人物和背景' },
            'slice-of-life': { name: '日常', icon: 'home', description: '日常生活场景角色' },
            'school': { name: '校园', icon: 'book', description: '学校和校园背景' },
            'original': { name: '原创', icon: 'palette', description: '用户原创角色' },
            'romance': { name: '浪漫', icon: 'heart', description: '浪漫爱情角色' },
            'adventure': { name: '冒险', icon: 'map', description: '冒险题材角色' }
        };
        // 构建分类列表
        const categories = [
            { id: 'all', name: '全部', icon: 'grid', count: categoryStats.reduce((sum, cat) => sum + cat._count.id, 0), description: '所有公开角色' }
        ];
        // 添加有数据的分类
        categoryStats.forEach(stat => {
            const info = categoryInfo[stat.category];
            if (info) {
                categories.push({
                    id: stat.category,
                    name: info.name,
                    icon: info.icon,
                    count: stat._count.id,
                    description: info.description
                });
            }
        });
        // 添加没有角色但需要显示的基础分类
        Object.entries(categoryInfo).forEach(([key, info]) => {
            if (!categoryStats.find(stat => stat.category === key)) {
                categories.push({
                    id: key,
                    name: info.name,
                    icon: info.icon,
                    count: 0,
                    description: info.description
                });
            }
        });
        res.json({
            success: true,
            categories
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取热门角色
router.get('/popular', auth_1.optionalAuth, async (req, res, next) => {
    try {
        const characters = await prisma_1.prisma.character.findMany({
            where: {
                isPublic: true,
                isFeatured: false // 不包括特色角色
            },
            orderBy: [
                { chatCount: 'desc' },
                { rating: 'desc' },
                { favoriteCount: 'desc' }
            ],
            take: 12,
            select: {
                id: true,
                name: true,
                description: true,
                avatar: true,
                tags: true,
                rating: true,
                ratingCount: true,
                chatCount: true,
                favoriteCount: true,
                creator: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            }
        });
        res.json({
            success: true,
            characters
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取我的角色
router.get('/my', auth_1.authenticate, async (req, res, next) => {
    try {
        const characters = await prisma_1.prisma.character.findMany({
            where: { creatorId: req.user.id },
            orderBy: { updatedAt: 'desc' }
        });
        res.json({
            success: true,
            characters
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取收藏的角色
router.get('/favorites', auth_1.authenticate, async (req, res, next) => {
    try {
        const favorites = await prisma_1.prisma.characterFavorite.findMany({
            where: { userId: req.user.id },
            include: {
                character: {
                    include: {
                        creator: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            success: true,
            characters: favorites.map((f) => f.character)
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取热门标签
router.get('/tags/popular', async (req, res, next) => {
    try {
        const characters = await prisma_1.prisma.character.findMany({
            where: { isPublic: true },
            select: { tags: true }
        });
        // 统计标签出现频率
        const tagCount = {};
        characters.forEach((char) => {
            const tags = typeof char.tags === 'string' ? JSON.parse(char.tags) : char.tags;
            if (Array.isArray(tags)) {
                tags.forEach(tag => {
                    tagCount[tag] = (tagCount[tag] || 0) + 1;
                });
            }
        });
        // 排序并返回前20个
        const popularTags = Object.entries(tagCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([tag]) => tag);
        res.json({
            success: true,
            tags: popularTags
        });
    }
    catch (error) {
        next(error);
    }
});
// AI 生成角色
router.post('/generate', auth_1.authenticate, async (req, res, next) => {
    try {
        const { name, tags = [], description = '', style = 'anime', personality = 'cheerful', background = 'modern' } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: '请提供角色名称'
            });
        }
        // 构建详细的生成提示
        const prompt = description || `创建一个名为"${name}"的AI角色`;
        // 调用 AI 服务生成角色设定
        const generated = await ai_1.aiService.generateCharacterProfile(prompt, {
            name,
            tags,
            style,
            personality,
            background
        });
        res.json({
            success: true,
            character: generated
        });
    }
    catch (error) {
        console.error('生成角色失败:', error);
        res.status(500).json({
            success: false,
            message: '生成角色失败，请稍后重试'
        });
    }
});
// 获取单个角色详情
router.get('/:id', auth_1.optionalAuth, async (req, res, next) => {
    try {
        const character = await prisma_1.prisma.character.findUnique({
            where: { id: req.params.id },
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true
                    }
                },
                _count: {
                    select: {
                        favorites: {
                            where: {
                                userId: req.user?.id
                            }
                        }
                    }
                }
            }
        });
        if (!character) {
            return res.status(404).json({
                success: false,
                message: 'Character not found'
            });
        }
        // 如果角色不是公开的，只有创建者可以查看
        if (!character.isPublic && character.creatorId !== req.user?.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        res.json({
            success: true,
            character: {
                ...character,
                isFavorited: character._count.favorites > 0
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// 创建新角色
router.post('/', auth_1.authenticate, (0, validate_1.validate)(character_1.createCharacterSchema), async (req, res, next) => {
    try {
        const characterData = req.body;
        // 验证角色名称唯一性（同一用户下）
        const existingCharacter = await prisma_1.prisma.character.findFirst({
            where: {
                name: characterData.name,
                creatorId: req.user.id
            }
        });
        if (existingCharacter) {
            return res.status(409).json({
                success: false,
                message: '您已创建过同名角色，请修改角色名称后重试'
            });
        }
        // 确保tags是有效的JSON字符串
        let tagsJson = characterData.tags || '[]';
        if (Array.isArray(characterData.tags)) {
            tagsJson = JSON.stringify(characterData.tags);
        }
        const character = await prisma_1.prisma.character.create({
            data: {
                ...characterData,
                tags: tagsJson,
                creatorId: req.user.id
            }
        });
        res.status(201).json({
            success: true,
            character
        });
    }
    catch (error) {
        console.error('创建角色失败:', error);
        next(error);
    }
});
// 更新角色
router.put('/:id', auth_1.authenticate, (0, validate_1.validate)(character_1.updateCharacterSchema), async (req, res, next) => {
    try {
        // 验证所有权
        const existing = await prisma_1.prisma.character.findUnique({
            where: { id: req.params.id }
        });
        if (!existing || existing.creatorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        const updateData = req.body;
        // 如果更新了名称，检查唯一性
        if (updateData.name && updateData.name !== existing.name) {
            const nameConflict = await prisma_1.prisma.character.findFirst({
                where: {
                    name: updateData.name,
                    creatorId: req.user.id,
                    id: { not: req.params.id }
                }
            });
            if (nameConflict) {
                return res.status(409).json({
                    success: false,
                    message: '您已创建过同名角色，请修改角色名称后重试'
                });
            }
        }
        // 确保tags是有效的JSON字符串
        if (updateData.tags) {
            if (Array.isArray(updateData.tags)) {
                updateData.tags = JSON.stringify(updateData.tags);
            }
        }
        const character = await prisma_1.prisma.character.update({
            where: { id: req.params.id },
            data: updateData
        });
        res.json({
            success: true,
            character
        });
    }
    catch (error) {
        console.error('更新角色失败:', error);
        next(error);
    }
});
// 删除角色
router.delete('/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        // 验证所有权
        const existing = await prisma_1.prisma.character.findUnique({
            where: { id: req.params.id }
        });
        if (!existing || existing.creatorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        await prisma_1.prisma.character.delete({
            where: { id: req.params.id }
        });
        res.json({
            success: true,
            message: 'Character deleted'
        });
    }
    catch (error) {
        next(error);
    }
});
// 收藏/取消收藏角色
router.post('/:id/favorite', auth_1.authenticate, async (req, res, next) => {
    try {
        const characterId = req.params.id;
        const userId = req.user.id;
        // 检查是否已收藏
        const existing = await prisma_1.prisma.characterFavorite.findUnique({
            where: {
                userId_characterId: {
                    userId,
                    characterId
                }
            }
        });
        if (existing) {
            // 取消收藏
            await prisma_1.prisma.characterFavorite.delete({
                where: {
                    userId_characterId: {
                        userId,
                        characterId
                    }
                }
            });
            await prisma_1.prisma.character.update({
                where: { id: characterId },
                data: { favoriteCount: { decrement: 1 } }
            });
            res.json({
                success: true,
                message: 'Unfavorited'
            });
        }
        else {
            // 添加收藏
            await prisma_1.prisma.characterFavorite.create({
                data: {
                    userId,
                    characterId
                }
            });
            await prisma_1.prisma.character.update({
                where: { id: characterId },
                data: { favoriteCount: { increment: 1 } }
            });
            res.json({
                success: true,
                message: 'Favorited'
            });
        }
    }
    catch (error) {
        next(error);
    }
});
// 收藏/取消收藏角色 (别名：like)
router.post('/:id/like', auth_1.authenticate, async (req, res, next) => {
    try {
        const characterId = req.params.id;
        const userId = req.user.id;
        // 检查是否已收藏
        const existing = await prisma_1.prisma.characterFavorite.findUnique({
            where: {
                userId_characterId: {
                    userId,
                    characterId
                }
            }
        });
        if (existing) {
            // 取消收藏
            await prisma_1.prisma.characterFavorite.delete({
                where: {
                    userId_characterId: {
                        userId,
                        characterId
                    }
                }
            });
            await prisma_1.prisma.character.update({
                where: { id: characterId },
                data: { favoriteCount: { decrement: 1 } }
            });
            res.json({
                success: true,
                message: 'Unfavorited'
            });
        }
        else {
            // 添加收藏
            await prisma_1.prisma.characterFavorite.create({
                data: {
                    userId,
                    characterId
                }
            });
            await prisma_1.prisma.character.update({
                where: { id: characterId },
                data: { favoriteCount: { increment: 1 } }
            });
            res.json({
                success: true,
                message: 'Favorited'
            });
        }
    }
    catch (error) {
        next(error);
    }
});
// 评分角色
router.post('/:id/rate', auth_1.authenticate, (0, validate_1.validate)(character_1.rateCharacterSchema), async (req, res, next) => {
    try {
        const { rating, comment } = req.body;
        const characterId = req.params.id;
        const userId = req.user.id;
        // 检查是否已评分
        const existing = await prisma_1.prisma.characterRating.findUnique({
            where: {
                userId_characterId: {
                    userId,
                    characterId
                }
            }
        });
        if (existing) {
            // 更新评分
            await prisma_1.prisma.characterRating.update({
                where: {
                    userId_characterId: {
                        userId,
                        characterId
                    }
                },
                data: { rating, comment: comment || existing.comment }
            });
        }
        else {
            // 新增评分
            await prisma_1.prisma.characterRating.create({
                data: {
                    userId,
                    characterId,
                    rating,
                    comment
                }
            });
        }
        // 重新计算平均评分
        const ratings = await prisma_1.prisma.characterRating.findMany({
            where: { characterId }
        });
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        await prisma_1.prisma.character.update({
            where: { id: characterId },
            data: {
                rating: avgRating,
                ratingCount: ratings.length
            }
        });
        res.json({
            success: true,
            message: 'Rated successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
// 克隆角色
router.post('/:id/clone', auth_1.authenticate, async (req, res, next) => {
    try {
        const original = await prisma_1.prisma.character.findUnique({
            where: { id: req.params.id }
        });
        if (!original || (!original.isPublic && original.creatorId !== req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        const { id, creatorId, chatCount, favoriteCount, rating, ratingCount, createdAt, updatedAt, ...characterData } = original;
        const cloned = await prisma_1.prisma.character.create({
            data: {
                ...characterData,
                name: `${characterData.name} (副本)`,
                creatorId: req.user.id,
                isPublic: false
            }
        });
        res.json({
            success: true,
            character: cloned
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取角色评论
router.get('/:id/reviews', async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const reviews = await prisma_1.prisma.characterRating.findMany({
            where: {
                characterId: req.params.id,
                // 只显示有评论文本的评分
                comment: { not: null }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });
        const total = await prisma_1.prisma.characterRating.count({
            where: {
                characterId: req.params.id,
                comment: { not: null }
            }
        });
        res.json({
            success: true,
            reviews: reviews.map((review) => ({
                id: review.id,
                username: review.user.username,
                userAvatar: review.user.avatar,
                rating: review.rating,
                comment: review.comment,
                date: review.createdAt.toISOString().split('T')[0]
            })),
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// 导出角色 (SillyTavern 格式)
router.get('/:id/export', auth_1.authenticate, async (req, res, next) => {
    try {
        const character = await prisma_1.prisma.character.findUnique({
            where: { id: req.params.id },
            include: {
                creator: {
                    select: {
                        username: true
                    }
                }
            }
        });
        if (!character) {
            return res.status(404).json({
                success: false,
                message: 'Character not found'
            });
        }
        // 检查访问权限
        if (!character.isPublic && character.creatorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        // 转换为 SillyTavern 格式
        const sillytavernFormat = {
            name: character.name,
            description: character.description,
            personality: character.personality || '',
            scenario: character.scenario || '',
            first_mes: character.firstMessage || '',
            mes_example: character.exampleDialogs || '',
            createdAt: character.createdAt.getTime(),
            avatar: 'none',
            chat: character.name + ' - ' + new Date().toISOString(),
            talkativeness: character.temperature ? character.temperature.toString() : '0.7',
            fav: false,
            tags: typeof character.tags === 'string' ? JSON.parse(character.tags) : character.tags || [],
            spec: 'chara_card_v2',
            spec_version: '2.0',
            data: {
                name: character.name,
                description: character.description,
                personality: character.personality || '',
                scenario: character.scenario || '',
                first_mes: character.firstMessage || '',
                mes_example: character.exampleDialogs || '',
                creator_notes: character.backstory || '',
                system_prompt: character.systemPrompt || '',
                post_history_instructions: '',
                alternate_greetings: [],
                character_book: null,
                tags: typeof character.tags === 'string' ? JSON.parse(character.tags) : character.tags || [],
                creator: character.creator.username,
                character_version: character.version?.toString() || '1',
                extensions: {}
            }
        };
        // 设置下载文件名 - 使用安全的ASCII字符
        const safeFilename = `character_${character.id.slice(0, 8)}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
        res.json(sillytavernFormat);
    }
    catch (error) {
        next(error);
    }
});
// 导入角色 (SillyTavern 格式)
router.post('/import', auth_1.authenticate, async (req, res, next) => {
    try {
        const { characterData, makePublic = false } = req.body;
        if (!characterData) {
            return res.status(400).json({
                success: false,
                message: '请提供角色数据'
            });
        }
        // 解析 SillyTavern 格式
        let parsedData;
        if (typeof characterData === 'string') {
            try {
                parsedData = JSON.parse(characterData);
            }
            catch {
                return res.status(400).json({
                    success: false,
                    message: '无效的JSON格式'
                });
            }
        }
        else {
            parsedData = characterData;
        }
        // 兼容不同版本的 SillyTavern 格式
        const data = parsedData.data || parsedData;
        // 检查是否已存在同名角色
        const existingCharacter = await prisma_1.prisma.character.findFirst({
            where: {
                name: data.name,
                creatorId: req.user.id
            }
        });
        if (existingCharacter) {
            return res.status(409).json({
                success: false,
                message: '同名角色已存在，请修改角色名称后重试'
            });
        }
        // 创建角色
        const character = await prisma_1.prisma.character.create({
            data: {
                name: data.name || 'Imported Character',
                description: data.description || '',
                personality: data.personality || '',
                backstory: data.creator_notes || '',
                speakingStyle: '',
                scenario: data.scenario || '',
                firstMessage: data.first_mes || '',
                systemPrompt: data.system_prompt || '',
                exampleDialogs: data.mes_example || '',
                tags: JSON.stringify(data.tags || []),
                temperature: parseFloat(data.talkativeness) || 0.7,
                maxTokens: 1000,
                model: 'gpt-3.5-turbo',
                isPublic: makePublic,
                importedFrom: 'SillyTavern',
                creatorId: req.user.id
            }
        });
        res.json({
            success: true,
            character,
            message: '角色导入成功'
        });
    }
    catch (error) {
        console.error('导入角色失败:', error);
        res.status(500).json({
            success: false,
            message: '导入角色失败，请检查文件格式'
        });
    }
});
// 获取角色关联的剧本列表
router.get('/:id/scenarios', auth_1.authenticate, async (req, res, next) => {
    try {
        const characterId = req.params.id;
        // 验证角色存在且用户有权限访问
        const character = await prisma_1.prisma.character.findUnique({
            where: { id: characterId }
        });
        if (!character) {
            return res.status(404).json({
                success: false,
                message: 'Character not found'
            });
        }
        // 检查权限：只有角色创建者可以查看私有角色的剧本关联
        if (!character.isPublic && character.creatorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        // 获取角色关联的剧本
        const characterScenarios = await prisma_1.prisma.characterScenario.findMany({
            where: { characterId },
            include: {
                scenario: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        category: true,
                        isPublic: true,
                        isActive: true,
                        rating: true,
                        useCount: true,
                        creator: {
                            select: {
                                id: true,
                                username: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'asc' }
            ]
        });
        res.json({
            success: true,
            scenarios: characterScenarios.map((cs) => ({
                id: cs.id,
                scenarioId: cs.scenarioId,
                isDefault: cs.isDefault,
                isActive: cs.isActive,
                customSettings: cs.customSettings ? JSON.parse(cs.customSettings) : null,
                createdAt: cs.createdAt,
                scenario: cs.scenario
            }))
        });
    }
    catch (error) {
        next(error);
    }
});
// 关联剧本到角色
router.post('/:id/scenarios', auth_1.authenticate, async (req, res, next) => {
    try {
        const characterId = req.params.id;
        const { scenarioId, isDefault = false, customSettings } = req.body;
        // 验证角色存在且用户是创建者
        const character = await prisma_1.prisma.character.findUnique({
            where: { id: characterId }
        });
        if (!character || character.creatorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        // 验证剧本存在且用户有权限访问
        const scenario = await prisma_1.prisma.scenario.findUnique({
            where: { id: scenarioId }
        });
        if (!scenario) {
            return res.status(404).json({
                success: false,
                message: 'Scenario not found'
            });
        }
        // 检查剧本访问权限
        if (!scenario.isPublic && scenario.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Scenario access denied'
            });
        }
        // 检查是否已经关联
        const existingAssociation = await prisma_1.prisma.characterScenario.findUnique({
            where: {
                characterId_scenarioId: {
                    characterId,
                    scenarioId
                }
            }
        });
        if (existingAssociation) {
            return res.status(409).json({
                success: false,
                message: 'Scenario already associated with this character'
            });
        }
        // 如果设置为默认剧本，先取消其他默认剧本
        if (isDefault) {
            await prisma_1.prisma.characterScenario.updateMany({
                where: { characterId, isDefault: true },
                data: { isDefault: false }
            });
        }
        // 创建关联
        const association = await prisma_1.prisma.characterScenario.create({
            data: {
                characterId,
                scenarioId,
                isDefault,
                customSettings: customSettings ? JSON.stringify(customSettings) : null
            },
            include: {
                scenario: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        category: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            association: {
                ...association,
                customSettings: association.customSettings ? JSON.parse(association.customSettings) : null
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// 更新角色剧本关联配置
router.put('/:id/scenarios/:scenarioId', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id: characterId, scenarioId } = req.params;
        const { isDefault, isActive, customSettings } = req.body;
        // 验证角色存在且用户是创建者
        const character = await prisma_1.prisma.character.findUnique({
            where: { id: characterId }
        });
        if (!character || character.creatorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        // 验证关联存在
        const existingAssociation = await prisma_1.prisma.characterScenario.findUnique({
            where: {
                characterId_scenarioId: {
                    characterId,
                    scenarioId
                }
            }
        });
        if (!existingAssociation) {
            return res.status(404).json({
                success: false,
                message: 'Association not found'
            });
        }
        // 如果设置为默认剧本，先取消其他默认剧本
        if (isDefault) {
            await prisma_1.prisma.characterScenario.updateMany({
                where: { characterId, isDefault: true },
                data: { isDefault: false }
            });
        }
        // 更新关联配置
        const updatedAssociation = await prisma_1.prisma.characterScenario.update({
            where: {
                characterId_scenarioId: {
                    characterId,
                    scenarioId
                }
            },
            data: {
                ...(isDefault !== undefined && { isDefault }),
                ...(isActive !== undefined && { isActive }),
                ...(customSettings !== undefined && {
                    customSettings: customSettings ? JSON.stringify(customSettings) : null
                })
            },
            include: {
                scenario: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        category: true
                    }
                }
            }
        });
        res.json({
            success: true,
            association: {
                ...updatedAssociation,
                customSettings: updatedAssociation.customSettings ? JSON.parse(updatedAssociation.customSettings) : null
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// 移除角色剧本关联
router.delete('/:id/scenarios/:scenarioId', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id: characterId, scenarioId } = req.params;
        // 验证角色存在且用户是创建者
        const character = await prisma_1.prisma.character.findUnique({
            where: { id: characterId }
        });
        if (!character || character.creatorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        // 验证关联存在
        const existingAssociation = await prisma_1.prisma.characterScenario.findUnique({
            where: {
                characterId_scenarioId: {
                    characterId,
                    scenarioId
                }
            }
        });
        if (!existingAssociation) {
            return res.status(404).json({
                success: false,
                message: 'Association not found'
            });
        }
        // 删除关联
        await prisma_1.prisma.characterScenario.delete({
            where: {
                characterId_scenarioId: {
                    characterId,
                    scenarioId
                }
            }
        });
        res.json({
            success: true,
            message: 'Scenario association removed'
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取相关角色
router.get('/:id/related', async (req, res, next) => {
    try {
        const { limit = 6 } = req.query;
        // 获取当前角色信息
        const currentCharacter = await prisma_1.prisma.character.findUnique({
            where: { id: req.params.id },
            select: { category: true, tags: true }
        });
        if (!currentCharacter) {
            return res.status(404).json({
                success: false,
                message: 'Character not found'
            });
        }
        // 基于分类和标签推荐相关角色
        const relatedCharacters = await prisma_1.prisma.character.findMany({
            where: {
                id: { not: req.params.id }, // 排除自己
                isPublic: true,
                OR: [
                    { category: currentCharacter.category }, // 相同分类
                    // TODO: 在SQLite中实现标签匹配（需要JSON解析）
                ]
            },
            select: {
                id: true,
                name: true,
                description: true,
                avatar: true,
                rating: true,
                ratingCount: true,
                chatCount: true,
                favoriteCount: true,
                creator: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            },
            orderBy: [
                { rating: 'desc' },
                { chatCount: 'desc' },
                { favoriteCount: 'desc' }
            ],
            take: Number(limit)
        });
        res.json({
            success: true,
            characters: relatedCharacters
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=character.js.map