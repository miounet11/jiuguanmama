"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// 敏感词过滤（简单实现，生产环境需要更完善的过滤器）
const sensitiveWords = ['垃圾', '广告', '恶意', '欺诈'];
const filterContent = (content) => {
    return !sensitiveWords.some(word => content.includes(word));
};
// 用户关注系统
// 关注用户
router.post('/users/:id/follow', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const targetUserId = req.params.id;
        if (userId === targetUserId) {
            return res.status(400).json({ error: '不能关注自己' });
        }
        // 检查目标用户是否存在
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId }
        });
        if (!targetUser) {
            return res.status(404).json({ error: '用户不存在' });
        }
        // 检查是否已经关注
        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: userId,
                    followingId: targetUserId
                }
            }
        });
        if (existingFollow) {
            return res.status(400).json({ error: '已经关注了该用户' });
        }
        // 创建关注关系
        await prisma.follow.create({
            data: {
                followerId: userId,
                followingId: targetUserId
            }
        });
        res.json({ message: '关注成功' });
    }
    catch (error) {
        console.error('关注用户失败:', error);
        res.status(500).json({ error: '关注失败' });
    }
});
// 取消关注
router.delete('/users/:id/follow', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const targetUserId = req.params.id;
        const follow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: userId,
                    followingId: targetUserId
                }
            }
        });
        if (!follow) {
            return res.status(404).json({ error: '未关注该用户' });
        }
        await prisma.follow.delete({
            where: {
                followerId_followingId: {
                    followerId: userId,
                    followingId: targetUserId
                }
            }
        });
        res.json({ message: '取消关注成功' });
    }
    catch (error) {
        console.error('取消关注失败:', error);
        res.status(500).json({ error: '取消关注失败' });
    }
});
// 获取粉丝列表
router.get('/users/:id/followers', async (req, res) => {
    try {
        const userId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const followers = await prisma.follow.findMany({
            where: { followingId: userId },
            include: {
                follower: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        bio: true,
                        isVerified: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });
        const total = await prisma.follow.count({
            where: { followingId: userId }
        });
        res.json({
            followers: followers.map(f => f.follower),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('获取粉丝列表失败:', error);
        res.status(500).json({ error: '获取粉丝列表失败' });
    }
});
// 获取关注列表
router.get('/users/:id/following', async (req, res) => {
    try {
        const userId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const following = await prisma.follow.findMany({
            where: { followerId: userId },
            include: {
                following: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        bio: true,
                        isVerified: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });
        const total = await prisma.follow.count({
            where: { followerId: userId }
        });
        res.json({
            following: following.map(f => f.following),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('获取关注列表失败:', error);
        res.status(500).json({ error: '获取关注列表失败' });
    }
});
// 动态发布系统
// 发布动态
router.post('/posts', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { content, type = 'text', characterId, images, visibility = 'public' } = req.body;
        // 验证内容
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: '动态内容不能为空' });
        }
        if (content.length > 2000) {
            return res.status(400).json({ error: '动态内容不能超过2000字符' });
        }
        if (!filterContent(content)) {
            return res.status(400).json({ error: '动态内容包含敏感词汇' });
        }
        // 如果是角色分享，验证角色是否存在
        if (type === 'character_share' && characterId) {
            const character = await prisma.character.findUnique({
                where: { id: characterId }
            });
            if (!character) {
                return res.status(404).json({ error: '角色不存在' });
            }
        }
        const post = await prisma.post.create({
            data: {
                content,
                type,
                characterId,
                images: images ? JSON.stringify(images) : null,
                visibility,
                authorId: userId
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        isVerified: true
                    }
                },
                character: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        description: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                        shares: true
                    }
                }
            }
        });
        res.status(201).json(post);
    }
    catch (error) {
        console.error('发布动态失败:', error);
        res.status(500).json({ error: '发布动态失败' });
    }
});
// 获取动态流
router.get('/posts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const type = req.query.type; // 'feed', 'hot', 'latest'
        const userId = req.query.userId;
        const skip = (page - 1) * limit;
        let whereCondition = {
            visibility: 'public',
            isDeleted: false
        };
        // 如果是动态流，获取关注用户的动态
        if (type === 'feed' && userId) {
            const following = await prisma.follow.findMany({
                where: { followerId: userId },
                select: { followingId: true }
            });
            const followingIds = following.map(f => f.followingId);
            followingIds.push(userId); // 包含自己的动态
            whereCondition.authorId = {
                in: followingIds
            };
        }
        let orderBy = { createdAt: 'desc' };
        // 热门排序：根据点赞数和评论数排序
        if (type === 'hot') {
            // 这里简化处理，实际生产环境需要更复杂的热度算法
            orderBy = [
                { likes: { _count: 'desc' } },
                { comments: { _count: 'desc' } },
                { createdAt: 'desc' }
            ];
        }
        const posts = await prisma.post.findMany({
            where: whereCondition,
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        isVerified: true
                    }
                },
                character: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        description: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                        shares: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy
        });
        const total = await prisma.post.count({ where: whereCondition });
        res.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('获取动态流失败:', error);
        res.status(500).json({ error: '获取动态流失败' });
    }
});
// 获取动态详情
router.get('/posts/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await prisma.post.findUnique({
            where: {
                id: postId,
                isDeleted: false
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        bio: true,
                        isVerified: true
                    }
                },
                character: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        description: true,
                        category: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                        shares: true
                    }
                }
            }
        });
        if (!post) {
            return res.status(404).json({ error: '动态不存在' });
        }
        // 增加浏览量
        await prisma.post.update({
            where: { id: postId },
            data: { viewCount: { increment: 1 } }
        });
        res.json(post);
    }
    catch (error) {
        console.error('获取动态详情失败:', error);
        res.status(500).json({ error: '获取动态详情失败' });
    }
});
// 编辑动态
router.put('/posts/:id', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;
        const { content, images } = req.body;
        const post = await prisma.post.findUnique({
            where: { id: postId }
        });
        if (!post) {
            return res.status(404).json({ error: '动态不存在' });
        }
        if (post.authorId !== userId) {
            return res.status(403).json({ error: '只能编辑自己的动态' });
        }
        // 检查是否在24小时内
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (post.createdAt < oneDayAgo) {
            return res.status(400).json({ error: '只能在发布24小时内编辑动态' });
        }
        // 验证内容
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: '动态内容不能为空' });
        }
        if (content.length > 2000) {
            return res.status(400).json({ error: '动态内容不能超过2000字符' });
        }
        if (!filterContent(content)) {
            return res.status(400).json({ error: '动态内容包含敏感词汇' });
        }
        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: {
                content,
                images: images ? JSON.stringify(images) : post.images,
                updatedAt: new Date()
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        isVerified: true
                    }
                },
                character: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        description: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                        shares: true
                    }
                }
            }
        });
        res.json(updatedPost);
    }
    catch (error) {
        console.error('编辑动态失败:', error);
        res.status(500).json({ error: '编辑动态失败' });
    }
});
// 删除动态
router.delete('/posts/:id', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;
        const post = await prisma.post.findUnique({
            where: { id: postId }
        });
        if (!post) {
            return res.status(404).json({ error: '动态不存在' });
        }
        if (post.authorId !== userId) {
            return res.status(403).json({ error: '只能删除自己的动态' });
        }
        // 软删除
        await prisma.post.update({
            where: { id: postId },
            data: { isDeleted: true }
        });
        res.json({ message: '删除成功' });
    }
    catch (error) {
        console.error('删除动态失败:', error);
        res.status(500).json({ error: '删除动态失败' });
    }
});
// 评论系统
// 发表评论
router.post('/posts/:id/comments', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;
        const { content, parentId } = req.body;
        // 验证动态是否存在
        const post = await prisma.post.findUnique({
            where: {
                id: postId,
                isDeleted: false
            }
        });
        if (!post) {
            return res.status(404).json({ error: '动态不存在' });
        }
        // 验证内容
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: '评论内容不能为空' });
        }
        if (content.length > 500) {
            return res.status(400).json({ error: '评论内容不能超过500字符' });
        }
        if (!filterContent(content)) {
            return res.status(400).json({ error: '评论内容包含敏感词汇' });
        }
        // 如果是回复评论，验证父评论是否存在
        if (parentId) {
            const parentComment = await prisma.comment.findUnique({
                where: {
                    id: parentId,
                    postId,
                    isDeleted: false
                }
            });
            if (!parentComment) {
                return res.status(404).json({ error: '回复的评论不存在' });
            }
        }
        const comment = await prisma.comment.create({
            data: {
                content,
                postId,
                authorId: userId,
                parentId
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        isVerified: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        replies: true
                    }
                }
            }
        });
        res.status(201).json(comment);
    }
    catch (error) {
        console.error('发表评论失败:', error);
        res.status(500).json({ error: '发表评论失败' });
    }
});
// 获取评论列表
router.get('/posts/:id/comments', async (req, res) => {
    try {
        const postId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const comments = await prisma.comment.findMany({
            where: {
                postId,
                parentId: null, // 只获取顶级评论
                isDeleted: false
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        isVerified: true
                    }
                },
                replies: {
                    where: { isDeleted: false },
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true,
                                isVerified: true
                            }
                        },
                        _count: {
                            select: {
                                likes: true
                            }
                        }
                    },
                    take: 3, // 只显示前3个回复
                    orderBy: { createdAt: 'asc' }
                },
                _count: {
                    select: {
                        likes: true,
                        replies: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });
        const total = await prisma.comment.count({
            where: {
                postId,
                parentId: null,
                isDeleted: false
            }
        });
        res.json({
            comments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('获取评论列表失败:', error);
        res.status(500).json({ error: '获取评论列表失败' });
    }
});
// 编辑评论
router.put('/comments/:id', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const commentId = req.params.id;
        const { content } = req.body;
        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });
        if (!comment) {
            return res.status(404).json({ error: '评论不存在' });
        }
        if (comment.authorId !== userId) {
            return res.status(403).json({ error: '只能编辑自己的评论' });
        }
        // 检查是否在24小时内
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (comment.createdAt < oneDayAgo) {
            return res.status(400).json({ error: '只能在发布24小时内编辑评论' });
        }
        // 验证内容
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: '评论内容不能为空' });
        }
        if (content.length > 500) {
            return res.status(400).json({ error: '评论内容不能超过500字符' });
        }
        if (!filterContent(content)) {
            return res.status(400).json({ error: '评论内容包含敏感词汇' });
        }
        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: {
                content,
                updatedAt: new Date()
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        isVerified: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        replies: true
                    }
                }
            }
        });
        res.json(updatedComment);
    }
    catch (error) {
        console.error('编辑评论失败:', error);
        res.status(500).json({ error: '编辑评论失败' });
    }
});
// 删除评论
router.delete('/comments/:id', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const commentId = req.params.id;
        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });
        if (!comment) {
            return res.status(404).json({ error: '评论不存在' });
        }
        if (comment.authorId !== userId) {
            return res.status(403).json({ error: '只能删除自己的评论' });
        }
        // 软删除
        await prisma.comment.update({
            where: { id: commentId },
            data: { isDeleted: true }
        });
        res.json({ message: '删除成功' });
    }
    catch (error) {
        console.error('删除评论失败:', error);
        res.status(500).json({ error: '删除评论失败' });
    }
});
// 互动系统
// 点赞动态
router.post('/posts/:id/like', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;
        // 检查动态是否存在
        const post = await prisma.post.findUnique({
            where: {
                id: postId,
                isDeleted: false
            }
        });
        if (!post) {
            return res.status(404).json({ error: '动态不存在' });
        }
        // 检查是否已经点赞
        const existingLike = await prisma.postLike.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId
                }
            }
        });
        if (existingLike) {
            return res.status(400).json({ error: '已经点赞了该动态' });
        }
        // 创建点赞记录
        await prisma.postLike.create({
            data: {
                userId,
                postId
            }
        });
        // 获取更新后的点赞数
        const likeCount = await prisma.postLike.count({
            where: { postId }
        });
        res.json({
            message: '点赞成功',
            likeCount
        });
    }
    catch (error) {
        console.error('点赞动态失败:', error);
        res.status(500).json({ error: '点赞失败' });
    }
});
// 取消点赞动态
router.delete('/posts/:id/like', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;
        const like = await prisma.postLike.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId
                }
            }
        });
        if (!like) {
            return res.status(404).json({ error: '未点赞该动态' });
        }
        await prisma.postLike.delete({
            where: {
                userId_postId: {
                    userId,
                    postId
                }
            }
        });
        // 获取更新后的点赞数
        const likeCount = await prisma.postLike.count({
            where: { postId }
        });
        res.json({
            message: '取消点赞成功',
            likeCount
        });
    }
    catch (error) {
        console.error('取消点赞失败:', error);
        res.status(500).json({ error: '取消点赞失败' });
    }
});
// 分享动态
router.post('/posts/:id/share', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;
        const { platform = 'internal' } = req.body;
        // 检查动态是否存在
        const post = await prisma.post.findUnique({
            where: {
                id: postId,
                isDeleted: false
            }
        });
        if (!post) {
            return res.status(404).json({ error: '动态不存在' });
        }
        // 创建分享记录
        await prisma.postShare.create({
            data: {
                userId,
                postId,
                platform
            }
        });
        // 获取更新后的分享数
        const shareCount = await prisma.postShare.count({
            where: { postId }
        });
        res.json({
            message: '分享成功',
            shareCount
        });
    }
    catch (error) {
        console.error('分享动态失败:', error);
        res.status(500).json({ error: '分享失败' });
    }
});
// 点赞评论
router.post('/comments/:id/like', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const commentId = req.params.id;
        // 检查评论是否存在
        const comment = await prisma.comment.findUnique({
            where: {
                id: commentId,
                isDeleted: false
            }
        });
        if (!comment) {
            return res.status(404).json({ error: '评论不存在' });
        }
        // 检查是否已经点赞
        const existingLike = await prisma.commentLike.findUnique({
            where: {
                userId_commentId: {
                    userId,
                    commentId
                }
            }
        });
        if (existingLike) {
            return res.status(400).json({ error: '已经点赞了该评论' });
        }
        // 创建点赞记录
        await prisma.commentLike.create({
            data: {
                userId,
                commentId
            }
        });
        // 获取更新后的点赞数
        const likeCount = await prisma.commentLike.count({
            where: { commentId }
        });
        res.json({
            message: '点赞成功',
            likeCount
        });
    }
    catch (error) {
        console.error('点赞评论失败:', error);
        res.status(500).json({ error: '点赞失败' });
    }
});
// 用户主页和资料
// 获取用户公开资料
router.get('/users/:id/profile', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                avatar: true,
                bio: true,
                location: true,
                website: true,
                isVerified: true,
                createdAt: true,
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        posts: {
                            where: {
                                isDeleted: false,
                                visibility: 'public'
                            }
                        },
                        characters: {
                            where: {
                                isPublic: true
                            }
                        }
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('获取用户资料失败:', error);
        res.status(500).json({ error: '获取用户资料失败' });
    }
});
// 更新个人资料
router.put('/users/profile', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { bio, location, website } = req.body;
        // 验证输入
        if (bio && bio.length > 200) {
            return res.status(400).json({ error: '个人简介不能超过200字符' });
        }
        if (location && location.length > 50) {
            return res.status(400).json({ error: '地址不能超过50字符' });
        }
        if (website && !website.match(/^https?:\/\/.+/)) {
            return res.status(400).json({ error: '网站地址格式不正确' });
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                bio,
                location,
                website
            },
            select: {
                id: true,
                username: true,
                avatar: true,
                bio: true,
                location: true,
                website: true,
                isVerified: true
            }
        });
        res.json(updatedUser);
    }
    catch (error) {
        console.error('更新个人资料失败:', error);
        res.status(500).json({ error: '更新个人资料失败' });
    }
});
// 获取用户动态
router.get('/users/:id/posts', async (req, res) => {
    try {
        const userId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const posts = await prisma.post.findMany({
            where: {
                authorId: userId,
                visibility: 'public',
                isDeleted: false
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        isVerified: true
                    }
                },
                character: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        description: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                        shares: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });
        const total = await prisma.post.count({
            where: {
                authorId: userId,
                visibility: 'public',
                isDeleted: false
            }
        });
        res.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('获取用户动态失败:', error);
        res.status(500).json({ error: '获取用户动态失败' });
    }
});
// 获取用户创建的角色
router.get('/users/:id/characters', async (req, res) => {
    try {
        const userId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const characters = await prisma.character.findMany({
            where: {
                creatorId: userId,
                isPublic: true
            },
            select: {
                id: true,
                name: true,
                avatar: true,
                description: true,
                category: true,
                rating: true,
                favoriteCount: true,
                chatCount: true,
                createdAt: true
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });
        const total = await prisma.character.count({
            where: {
                creatorId: userId,
                isPublic: true
            }
        });
        res.json({
            characters,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('获取用户角色失败:', error);
        res.status(500).json({ error: '获取用户角色失败' });
    }
});
exports.default = router;
//# sourceMappingURL=community.js.map