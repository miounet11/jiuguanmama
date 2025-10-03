"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const feature_gate_service_1 = require("../services/feature-gate.service");
const router = (0, express_1.Router)();
// Validation schemas
const unlockFeatureSchema = zod_1.z.object({
    unlockMethod: zod_1.z.enum(['level_up', 'achievement', 'payment', 'manual']).optional(),
});
/**
 * GET /api/v1/features
 * List all available features for the authenticated user
 */
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const features = await feature_gate_service_1.featureGateService.getAvailableFeatures(userId);
        res.json({
            success: true,
            data: features,
            count: features.length,
        });
    }
    catch (error) {
        console.error('Error getting features:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get features',
        });
    }
});
/**
 * GET /api/v1/features/:featureId
 * Get details of a specific feature
 */
router.get('/:featureId', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { featureId } = req.params;
        const features = await feature_gate_service_1.featureGateService.getAvailableFeatures(userId);
        const feature = features.find(f => f.featureId === featureId);
        if (!feature) {
            res.status(404).json({
                success: false,
                message: 'Feature not found',
            });
            return;
        }
        res.json({
            success: true,
            data: feature,
        });
    }
    catch (error) {
        console.error('Error getting feature:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get feature',
        });
    }
});
/**
 * POST /api/v1/features/:featureId/unlock
 * Unlock a feature for the authenticated user
 */
router.post('/:featureId/unlock', auth_1.authenticate, (0, validate_1.validate)(unlockFeatureSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { featureId } = req.params;
        const { unlockMethod = 'manual' } = req.body;
        // Check if user can access the feature
        const accessCheck = await feature_gate_service_1.featureGateService.canAccess(userId, featureId);
        if (!accessCheck.canAccess) {
            res.status(403).json({
                success: false,
                message: accessCheck.reason || 'Cannot unlock feature',
                details: {
                    requiredLevel: accessCheck.requiredLevel,
                    requiredRoles: accessCheck.requiredRoles,
                    missingDependencies: accessCheck.missingDependencies,
                },
            });
            return;
        }
        // Unlock the feature
        const unlocked = await feature_gate_service_1.featureGateService.unlockFeature(userId, featureId, unlockMethod);
        if (unlocked) {
            res.json({
                success: true,
                message: 'Feature unlocked successfully',
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Failed to unlock feature',
            });
        }
    }
    catch (error) {
        console.error('Error unlocking feature:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unlock feature',
        });
    }
});
/**
 * GET /api/v1/features/:featureId/can-access
 * Check if user can access a specific feature
 */
router.get('/:featureId/can-access', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { featureId } = req.params;
        const accessCheck = await feature_gate_service_1.featureGateService.canAccess(userId, featureId);
        res.json({
            success: true,
            data: accessCheck,
        });
    }
    catch (error) {
        console.error('Error checking feature access:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check feature access',
        });
    }
});
/**
 * GET /api/v1/features/user-unlocks
 * Get all features unlocked by the user
 */
router.get('/user-unlocks', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const unlocks = await feature_gate_service_1.featureGateService.getUserUnlocks(userId);
        res.json({
            success: true,
            data: unlocks,
            count: unlocks.length,
        });
    }
    catch (error) {
        console.error('Error getting user unlocks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user unlocks',
        });
    }
});
exports.default = router;
//# sourceMappingURL=features.js.map