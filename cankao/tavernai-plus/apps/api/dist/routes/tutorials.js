"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const tutorial_service_1 = require("../services/tutorial.service");
const router = (0, express_1.Router)();
// Validation schemas
const updateProgressSchema = zod_1.z.object({
    step: zod_1.z.number().int().min(0),
});
/**
 * GET /api/v1/tutorials
 * List all available tutorials for the authenticated user
 */
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const tutorials = await tutorial_service_1.tutorialService.getTutorials(userId);
        res.json({
            success: true,
            data: tutorials,
            count: tutorials.length,
        });
    }
    catch (error) {
        console.error('Error getting tutorials:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get tutorials',
        });
    }
});
/**
 * GET /api/v1/tutorials/:tutorialId
 * Get details of a specific tutorial
 */
router.get('/:tutorialId', auth_1.authenticate, async (req, res) => {
    try {
        const { tutorialId } = req.params;
        const tutorial = tutorial_service_1.tutorialService.getTutorialById(tutorialId);
        if (!tutorial) {
            res.status(404).json({
                success: false,
                message: 'Tutorial not found',
            });
            return;
        }
        res.json({
            success: true,
            data: tutorial,
        });
    }
    catch (error) {
        console.error('Error getting tutorial:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get tutorial',
        });
    }
});
/**
 * POST /api/v1/tutorials/:tutorialId/start
 * Start a tutorial
 */
router.post('/:tutorialId/start', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { tutorialId } = req.params;
        const progress = await tutorial_service_1.tutorialService.startTutorial(userId, tutorialId);
        if (!progress) {
            res.status(400).json({
                success: false,
                message: 'Failed to start tutorial',
            });
            return;
        }
        res.json({
            success: true,
            message: 'Tutorial started',
            data: progress,
        });
    }
    catch (error) {
        console.error('Error starting tutorial:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start tutorial',
        });
    }
});
/**
 * POST /api/v1/tutorials/:tutorialId/progress
 * Update tutorial progress
 */
router.post('/:tutorialId/progress', auth_1.authenticate, (0, validate_1.validate)(updateProgressSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { tutorialId } = req.params;
        const { step } = req.body;
        const progress = await tutorial_service_1.tutorialService.updateProgress(userId, tutorialId, step);
        if (!progress) {
            res.status(400).json({
                success: false,
                message: 'Failed to update progress',
            });
            return;
        }
        res.json({
            success: true,
            message: 'Progress updated',
            data: progress,
        });
    }
    catch (error) {
        console.error('Error updating tutorial progress:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update progress',
        });
    }
});
/**
 * POST /api/v1/tutorials/:tutorialId/complete
 * Complete a tutorial
 */
router.post('/:tutorialId/complete', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { tutorialId } = req.params;
        const success = await tutorial_service_1.tutorialService.completeTutorial(userId, tutorialId);
        if (success) {
            res.json({
                success: true,
                message: 'Tutorial completed!',
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Failed to complete tutorial',
            });
        }
    }
    catch (error) {
        console.error('Error completing tutorial:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete tutorial',
        });
    }
});
/**
 * POST /api/v1/tutorials/:tutorialId/skip
 * Skip a tutorial
 */
router.post('/:tutorialId/skip', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { tutorialId } = req.params;
        const success = await tutorial_service_1.tutorialService.skipTutorial(userId, tutorialId);
        if (success) {
            res.json({
                success: true,
                message: 'Tutorial skipped',
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Failed to skip tutorial',
            });
        }
    }
    catch (error) {
        console.error('Error skipping tutorial:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to skip tutorial',
        });
    }
});
exports.default = router;
//# sourceMappingURL=tutorials.js.map