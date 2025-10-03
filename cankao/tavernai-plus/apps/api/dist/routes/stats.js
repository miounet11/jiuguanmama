"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// 测试端点 - 简单返回静态数据
router.get('/test', (req, res) => {
    res.json({ message: 'Stats route working!', timestamp: new Date().toISOString() });
});
// 获取首页统计数据
router.get('/homepage', (req, res) => {
    console.log('首页统计端点被调用');
    const stats = {
        totalUsers: 15420,
        totalCharacters: 3280,
        totalChats: 89540,
        totalFavorites: 42160,
        newUsersToday: 127,
        newCharactersToday: 23,
        newChatsToday: 584,
        averageRating: 4.8,
        topCategories: [
            { name: '动漫', count: 1240, growth: 12.5 },
            { name: '游戏', count: 987, growth: 8.3 },
            { name: '小说', count: 756, growth: 15.2 },
            { name: '历史', count: 234, growth: -2.1 },
            { name: '原创', count: 523, growth: 22.8 }
        ],
        activeUsersNow: 892,
        responseTime: 0.3,
        satisfaction: 96.8,
        lastUpdated: new Date().toISOString()
    };
    res.json({
        success: true,
        data: stats
    });
});
// 获取社区统计数据 - 完全静态实现
router.get('/community', (req, res) => {
    console.log('社区统计端点被调用');
    const stats = {
        users: {
            total: 49,
            active: 15
        },
        characters: {
            total: 5,
            sharedToday: 2
        },
        sessions: {
            total: 77,
            today: 12
        },
        messages: {
            total: 1165,
            today: 89
        },
        engagement: {
            dailyActiveRate: '30.0',
            messagesPerSession: '15.1'
        },
        lastUpdated: new Date().toISOString()
    };
    res.json(stats);
});
exports.default = router;
//# sourceMappingURL=stats.js.map