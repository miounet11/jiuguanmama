"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const creator_studio_service_1 = require("../services/creator-studio.service");
const router = (0, express_1.Router)();
// Validation schemas
const aiGenerationSchema = zod_1.z.object({
    prompt: zod_1.z.string().min(10).max(1000),
    config: zod_1.z
        .object({
        model: zod_1.z.string().optional(),
        temperature: zod_1.z.number().min(0).max(2).optional(),
        maxTokens: zod_1.z.number().min(100).max(4000).optional(),
        includeAvatar: zod_1.z.boolean().optional(),
        avatarStyle: zod_1.z.string().optional(),
    })
        .optional(),
});
/**
 * GET /api/v1/creator-studio/overview
 * Get creator overview statistics
 */
router.get('/overview', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const overview = await creator_studio_service_1.creatorStudioService.getCreatorOverview(userId);
        if (!overview) {
            res.status(404).json({
                success: false,
                message: 'Creator overview not found',
            });
            return;
        }
        res.json({
            success: true,
            data: overview,
        });
    }
    catch (error) {
        console.error('Error getting creator overview:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get creator overview',
        });
    }
});
/**
 * GET /api/v1/creator-studio/statistics
 * Get detailed work statistics
 */
router.get('/statistics', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = '10', sortBy = 'views' } = req.query;
        const statistics = await creator_studio_service_1.creatorStudioService.getWorkStatistics(userId, {
            limit: parseInt(limit),
            sortBy: sortBy,
        });
        if (!statistics) {
            res.status(404).json({
                success: false,
                message: 'Work statistics not found',
            });
            return;
        }
        res.json({
            success: true,
            data: statistics,
        });
    }
    catch (error) {
        console.error('Error getting work statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get work statistics',
        });
    }
});
/**
 * POST /api/v1/creator-studio/ai-generate-character
 * Generate a character using AI
 */
router.post('/ai-generate-character', auth_1.authenticate, (0, validate_1.validate)(aiGenerationSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { prompt, config = {} } = req.body;
        const result = await creator_studio_service_1.creatorStudioService.aiGenerateCharacter(userId, prompt, config);
        if (result.success) {
            res.json({
                success: true,
                message: 'Character generated successfully',
                data: result.data,
                usage: {
                    tokensUsed: result.tokensUsed,
                    cost: result.cost,
                },
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: result.error || 'Failed to generate character',
            });
        }
    }
    catch (error) {
        console.error('Error generating character:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate character',
        });
    }
});
/**
 * POST /api/v1/creator-studio/ai-generate-scenario
 * Generate a scenario using AI
 */
router.post('/ai-generate-scenario', auth_1.authenticate, (0, validate_1.validate)(aiGenerationSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { prompt, config = {} } = req.body;
        const result = await creator_studio_service_1.creatorStudioService.aiGenerateScenario(userId, prompt, config);
        if (result.success) {
            res.json({
                success: true,
                message: 'Scenario generated successfully',
                data: result.data,
                usage: {
                    tokensUsed: result.tokensUsed,
                    cost: result.cost,
                },
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: result.error || 'Failed to generate scenario',
            });
        }
    }
    catch (error) {
        console.error('Error generating scenario:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate scenario',
        });
    }
});
exports.default = router;
//# sourceMappingURL=creator-studio.js.map