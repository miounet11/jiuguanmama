"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureGate = featureGate;
exports.featureGateAny = featureGateAny;
exports.featureGateAll = featureGateAll;
exports.attachAvailableFeatures = attachAvailableFeatures;
const feature_gate_service_1 = require("../services/feature-gate.service");
/**
 * Middleware to check if the user has access to a specific feature
 * Usage: router.get('/endpoint', authenticate, featureGate('feature-id'), handler)
 */
function featureGate(featureId) {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }
            // Check if user has access to the feature
            const accessCheck = await feature_gate_service_1.featureGateService.canAccess(userId, featureId);
            if (!accessCheck.canAccess) {
                res.status(403).json({
                    success: false,
                    message: accessCheck.reason || 'You do not have access to this feature',
                    featureId,
                    requiredLevel: accessCheck.requiredLevel,
                    requiresPremium: accessCheck.requiresPremium,
                });
                return;
            }
            // User has access, proceed to the next middleware/handler
            next();
        }
        catch (error) {
            console.error('Feature gate middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check feature access',
            });
        }
    };
}
/**
 * Middleware to check if multiple features are accessible
 * Usage: router.get('/endpoint', authenticate, featureGateAny(['feature1', 'feature2']), handler)
 */
function featureGateAny(featureIds) {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }
            // Check if user has access to at least one feature
            const accessChecks = await Promise.all(featureIds.map((featureId) => feature_gate_service_1.featureGateService.canAccess(userId, featureId)));
            const hasAccess = accessChecks.some((check) => check.canAccess);
            if (!hasAccess) {
                res.status(403).json({
                    success: false,
                    message: 'You do not have access to any of the required features',
                    featureIds,
                });
                return;
            }
            // User has access to at least one feature, proceed
            next();
        }
        catch (error) {
            console.error('Feature gate any middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check feature access',
            });
        }
    };
}
/**
 * Middleware to check if all features are accessible
 * Usage: router.get('/endpoint', authenticate, featureGateAll(['feature1', 'feature2']), handler)
 */
function featureGateAll(featureIds) {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }
            // Check if user has access to all features
            const accessChecks = await Promise.all(featureIds.map((featureId) => feature_gate_service_1.featureGateService.canAccess(userId, featureId)));
            const deniedFeatures = featureIds.filter((_, index) => !accessChecks[index].canAccess);
            if (deniedFeatures.length > 0) {
                res.status(403).json({
                    success: false,
                    message: 'You do not have access to all required features',
                    deniedFeatures,
                });
                return;
            }
            // User has access to all features, proceed
            next();
        }
        catch (error) {
            console.error('Feature gate all middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check feature access',
            });
        }
    };
}
/**
 * Middleware to attach available features to the request object
 * Useful for endpoints that need to dynamically adjust based on user's available features
 */
async function attachAvailableFeatures(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }
        // Get all available features for the user
        const features = await feature_gate_service_1.featureGateService.getAvailableFeatures(userId);
        const unlocks = await feature_gate_service_1.featureGateService.getUserUnlocks(userId);
        // Attach to request object
        req.availableFeatures = features;
        req.unlockedFeatures = unlocks;
        next();
    }
    catch (error) {
        console.error('Attach available features middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load user features',
        });
    }
}
//# sourceMappingURL=feature-gate.js.map