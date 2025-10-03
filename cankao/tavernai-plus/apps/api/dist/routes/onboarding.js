"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const onboarding_service_1 = require("../services/onboarding.service");
const router = (0, express_1.Router)();
// Validation schemas
const completeStepSchema = zod_1.z.object({
    stepId: zod_1.z.string(),
    data: zod_1.z.record(zod_1.z.any()),
});
const recommendationsSchema = zod_1.z.object({
    interests: zod_1.z.array(zod_1.z.string()),
    mbtiType: zod_1.z.string().optional(),
});
/**
 * GET /api/v1/onboarding/status
 * Get onboarding progress for the authenticated user
 */
router.get('/status', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const status = await onboarding_service_1.onboardingService.startOnboarding(userId);
        res.json({
            success: true,
            data: status,
        });
    }
    catch (error) {
        console.error('Error getting onboarding status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get onboarding status',
        });
    }
});
/**
 * POST /api/v1/onboarding/start
 * Start onboarding for the authenticated user
 */
router.post('/start', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const status = await onboarding_service_1.onboardingService.startOnboarding(userId);
        res.json({
            success: true,
            message: 'Onboarding started',
            data: status,
        });
    }
    catch (error) {
        console.error('Error starting onboarding:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start onboarding',
        });
    }
});
/**
 * POST /api/v1/onboarding/complete-step
 * Complete an onboarding step
 */
router.post('/complete-step', auth_1.authenticate, (0, validate_1.validate)(completeStepSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const stepData = req.body;
        const status = await onboarding_service_1.onboardingService.completeStep(userId, stepData);
        res.json({
            success: true,
            message: status.completed ? 'Onboarding completed!' : 'Step completed',
            data: status,
        });
    }
    catch (error) {
        console.error('Error completing onboarding step:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete onboarding step',
        });
    }
});
/**
 * POST /api/v1/onboarding/skip
 * Skip onboarding for the authenticated user
 */
router.post('/skip', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const success = await onboarding_service_1.onboardingService.skipOnboarding(userId);
        if (success) {
            res.json({
                success: true,
                message: 'Onboarding skipped',
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Failed to skip onboarding',
            });
        }
    }
    catch (error) {
        console.error('Error skipping onboarding:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to skip onboarding',
        });
    }
});
/**
 * GET /api/v1/onboarding/recommendations
 * Get personalized character recommendations
 */
router.get('/recommendations', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { interests, mbtiType } = req.query;
        // Parse interests from query string
        const interestsArray = interests
            ? interests.split(',').map(i => i.trim())
            : [];
        const recommendations = await onboarding_service_1.onboardingService.getRecommendations(userId, interestsArray, mbtiType);
        res.json({
            success: true,
            data: recommendations,
            count: recommendations.length,
        });
    }
    catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get recommendations',
        });
    }
});
exports.default = router;
//# sourceMappingURL=onboarding.js.map