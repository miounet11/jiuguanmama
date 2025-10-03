"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const gamification_dashboard_service_1 = require("../services/gamification-dashboard.service");
const router = (0, express_1.Router)();
/**
 * GET /api/v1/gamification/overview
 * Get gamification overview for the authenticated user
 */
router.get('/overview', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const overview = await gamification_dashboard_service_1.gamificationDashboardService.getGamificationOverview(userId);
        if (!overview) {
            res.status(404).json({
                success: false,
                message: 'Gamification overview not found',
            });
            return;
        }
        res.json({
            success: true,
            data: overview,
        });
    }
    catch (error) {
        console.error('Error getting gamification overview:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get gamification overview',
        });
    }
});
/**
 * GET /api/v1/gamification/affinity-list
 * Get affinity list with pagination
 */
router.get('/affinity-list', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = '1', limit = '20', sortBy = 'level' } = req.query;
        const result = await gamification_dashboard_service_1.gamificationDashboardService.getAffinityList(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy: sortBy,
        });
        res.json({
            success: true,
            data: result.affinities,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.total,
                totalPages: Math.ceil(result.total / parseInt(limit)),
            },
        });
    }
    catch (error) {
        console.error('Error getting affinity list:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get affinity list',
        });
    }
});
/**
 * GET /api/v1/gamification/proficiency-list
 * Get proficiency list with pagination
 */
router.get('/proficiency-list', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = '1', limit = '20', sortBy = 'level' } = req.query;
        const result = await gamification_dashboard_service_1.gamificationDashboardService.getProficiencyList(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy: sortBy,
        });
        res.json({
            success: true,
            data: result.proficiencies,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.total,
                totalPages: Math.ceil(result.total / parseInt(limit)),
            },
        });
    }
    catch (error) {
        console.error('Error getting proficiency list:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get proficiency list',
        });
    }
});
/**
 * GET /api/v1/gamification/daily-quests
 * Get daily quests for the authenticated user
 */
router.get('/daily-quests', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const quests = await gamification_dashboard_service_1.gamificationDashboardService.getDailyQuests(userId);
        res.json({
            success: true,
            data: quests,
            count: quests.length,
        });
    }
    catch (error) {
        console.error('Error getting daily quests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get daily quests',
        });
    }
});
/**
 * GET /api/v1/gamification/achievements
 * Get achievements with filters
 */
router.get('/achievements', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { category, unlocked, rarity } = req.query;
        const achievements = await gamification_dashboard_service_1.gamificationDashboardService.getAchievements(userId, {
            category: category,
            unlocked: unlocked === 'true' ? true : unlocked === 'false' ? false : undefined,
            rarity: rarity,
        });
        res.json({
            success: true,
            data: achievements,
            count: achievements.length,
        });
    }
    catch (error) {
        console.error('Error getting achievements:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get achievements',
        });
    }
});
exports.default = router;
//# sourceMappingURL=gamification-dashboard.js.map