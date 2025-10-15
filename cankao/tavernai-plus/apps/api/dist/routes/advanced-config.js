"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const AdvancedConfigService_1 = require("../services/config/AdvancedConfigService");
const SillyTavernService_1 = require("../services/config/SillyTavernService");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Validation middleware helper
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};
/**
 * Get user configuration
 * GET /api/config
 */
router.get('/', auth_1.authMiddleware, [
    (0, express_validator_1.query)('category').optional().isIn(['ai_model', 'prompts', 'ui', 'chat', 'system']).withMessage('Invalid category')
], validateRequest, async (req, res) => {
    try {
        const userId = req.user.id;
        const { category } = req.query;
        const config = await AdvancedConfigService_1.advancedConfigService.getUserConfig(userId, category);
        res.json({
            success: true,
            config
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get user config', {
            userId: req.user?.id,
            category: req.query.category,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Failed to get configuration',
            code: 'CONFIG_GET_FAILED'
        });
    }
});
/**
 * Update user configuration
 * PUT /api/config
 */
router.put('/', auth_1.authMiddleware, [
    (0, express_validator_1.body)('config').isObject().withMessage('Config must be an object'),
    (0, express_validator_1.body)('createVersion').optional().isBoolean().withMessage('Create version must be boolean')
], validateRequest, async (req, res) => {
    try {
        const userId = req.user.id;
        const { config, createVersion = true } = req.body;
        // Validate configuration
        const validation = await AdvancedConfigService_1.advancedConfigService.validateConfig(config);
        if (!validation.valid) {
            return res.status(400).json({
                error: 'Configuration validation failed',
                code: 'CONFIG_VALIDATION_FAILED',
                details: validation.errors
            });
        }
        const success = await AdvancedConfigService_1.advancedConfigService.updateUserConfig(userId, config, createVersion);
        if (success) {
            res.json({
                success: true,
                message: 'Configuration updated successfully'
            });
        }
        else {
            res.status(500).json({
                error: 'Failed to update configuration',
                code: 'CONFIG_UPDATE_FAILED'
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to update user config', {
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Configuration update failed',
            code: 'CONFIG_UPDATE_FAILED'
        });
    }
});
/**
 * Clone configuration from template or user
 * POST /api/config/clone
 */
router.post('/clone', auth_1.authMiddleware, [
    (0, express_validator_1.body)('source').isObject().withMessage('Source must be an object'),
    (0, express_validator_1.body)('source.type').isIn(['template', 'user']).withMessage('Source type must be template or user'),
    (0, express_validator_1.body)('source.templateId').if((0, express_validator_1.body)('source.type').equals('template')).notEmpty().withMessage('Template ID is required'),
    (0, express_validator_1.body)('source.userId').if((0, express_validator_1.body)('source.type').equals('user')).isUUID().withMessage('User ID must be valid UUID'),
    (0, express_validator_1.body)('options').optional().isObject().withMessage('Options must be an object'),
    (0, express_validator_1.body)('options.categories').optional().isArray().withMessage('Categories must be an array'),
    (0, express_validator_1.body)('options.overwrite').optional().isBoolean().withMessage('Overwrite must be boolean'),
    (0, express_validator_1.body)('options.applyVariables').optional().isObject().withMessage('Apply variables must be an object')
], validateRequest, async (req, res) => {
    try {
        const userId = req.user.id;
        const { source, options = {} } = req.body;
        const success = await AdvancedConfigService_1.advancedConfigService.cloneConfig(userId, source, options);
        if (success) {
            res.json({
                success: true,
                message: 'Configuration cloned successfully'
            });
        }
        else {
            res.status(500).json({
                error: 'Failed to clone configuration',
                code: 'CONFIG_CLONE_FAILED'
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to clone config', {
            userId: req.user?.id,
            source: req.body.source,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Configuration cloning failed',
            code: 'CONFIG_CLONE_FAILED'
        });
    }
});
/**
 * Get configuration templates
 * GET /api/config/templates
 */
router.get('/templates', auth_1.authMiddleware, [
    (0, express_validator_1.query)('category').optional().isString().withMessage('Category must be string'),
    (0, express_validator_1.query)('official').optional().isBoolean().withMessage('Official filter must be boolean')
], validateRequest, async (req, res) => {
    try {
        const { category, official } = req.query;
        const templates = await AdvancedConfigService_1.advancedConfigService.getTemplates(category, official === 'true');
        res.json({
            success: true,
            templates
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get config templates', {
            category: req.query.category,
            official: req.query.official,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Failed to get templates',
            code: 'TEMPLATES_GET_FAILED'
        });
    }
});
/**
 * Get specific template
 * GET /api/config/templates/:templateId
 */
router.get('/templates/:templateId', auth_1.authMiddleware, [
    (0, express_validator_1.param)('templateId').notEmpty().withMessage('Template ID is required')
], validateRequest, async (req, res) => {
    try {
        const { templateId } = req.params;
        const template = await AdvancedConfigService_1.advancedConfigService.getTemplate(templateId);
        if (!template) {
            return res.status(404).json({
                error: 'Template not found',
                code: 'TEMPLATE_NOT_FOUND'
            });
        }
        res.json({
            success: true,
            template
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get config template', {
            templateId: req.params.templateId,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Failed to get template',
            code: 'TEMPLATE_GET_FAILED'
        });
    }
});
/**
 * Get version history
 * GET /api/config/versions
 */
router.get('/versions', auth_1.authMiddleware, [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], validateRequest, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const versions = await AdvancedConfigService_1.advancedConfigService.getVersionHistory(userId, limit);
        res.json({
            success: true,
            versions
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get version history', {
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Failed to get version history',
            code: 'VERSION_HISTORY_FAILED'
        });
    }
});
/**
 * Restore from version
 * POST /api/config/restore/:versionId
 */
router.post('/restore/:versionId', auth_1.authMiddleware, [
    (0, express_validator_1.param)('versionId').isUUID().withMessage('Version ID must be valid UUID')
], validateRequest, async (req, res) => {
    try {
        const userId = req.user.id;
        const { versionId } = req.params;
        const success = await AdvancedConfigService_1.advancedConfigService.restoreVersion(userId, versionId);
        if (success) {
            res.json({
                success: true,
                message: 'Configuration restored successfully'
            });
        }
        else {
            res.status(500).json({
                error: 'Failed to restore configuration',
                code: 'CONFIG_RESTORE_FAILED'
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to restore config version', {
            userId: req.user?.id,
            versionId: req.params.versionId,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Configuration restore failed',
            code: 'CONFIG_RESTORE_FAILED'
        });
    }
});
/**
 * Validate configuration
 * POST /api/config/validate
 */
router.post('/validate', auth_1.authMiddleware, [
    (0, express_validator_1.body)('config').isObject().withMessage('Config must be an object'),
    (0, express_validator_1.body)('category').optional().isString().withMessage('Category must be string')
], validateRequest, async (req, res) => {
    try {
        const { config, category } = req.body;
        const validation = await AdvancedConfigService_1.advancedConfigService.validateConfig(config, category);
        res.json({
            success: true,
            validation
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to validate config', {
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Configuration validation failed',
            code: 'CONFIG_VALIDATION_FAILED'
        });
    }
});
/**
 * Export configuration
 * GET /api/config/export
 */
router.get('/export', auth_1.authMiddleware, [
    (0, express_validator_1.query)('format').optional().isIn(['json', 'sillytavern']).withMessage('Invalid export format'),
    (0, express_validator_1.query)('categories').optional().isString().withMessage('Categories must be comma-separated string'),
    (0, express_validator_1.query)('includeSecrets').optional().isBoolean().withMessage('Include secrets must be boolean'),
    (0, express_validator_1.query)('secure').optional().isBoolean().withMessage('Secure mode must be boolean')
], validateRequest, async (req, res) => {
    try {
        const userId = req.user.id;
        const { format = 'json', categories, includeSecrets = false, secure = true } = req.query;
        let exportedConfig;
        if (format === 'sillytavern') {
            const options = {
                categories: categories ? categories.split(',') : undefined,
                includeSecrets: includeSecrets === 'true'
            };
            exportedConfig = await SillyTavernService_1.sillyTavernService.exportConfig(userId, options);
        }
        else {
            const userConfig = await AdvancedConfigService_1.advancedConfigService.getUserConfig(userId);
            exportedConfig = {
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
                userId: secure === 'true' ? undefined : userId,
                config: userConfig
            };
            // Filter categories if specified
            if (categories) {
                const categoryList = categories.split(',');
                const filteredConfig = {};
                for (const category of categoryList) {
                    if (userConfig[category]) {
                        filteredConfig[category] = userConfig[category];
                    }
                }
                exportedConfig.config = filteredConfig;
            }
            // Remove secrets if secure mode
            if (secure === 'true') {
                exportedConfig = this.removeSecrets(exportedConfig);
            }
        }
        // Set appropriate headers for download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="config-export-${Date.now()}.json"`);
        res.json(exportedConfig);
    }
    catch (error) {
        logger_1.logger.error('Failed to export config', {
            userId: req.user?.id,
            format: req.query.format,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Configuration export failed',
            code: 'CONFIG_EXPORT_FAILED'
        });
    }
});
/**
 * Import SillyTavern configuration
 * POST /api/config/import/sillytavern
 */
router.post('/import/sillytavern', auth_1.authMiddleware, [
    (0, express_validator_1.body)('config').isObject().withMessage('Config must be an object'),
    (0, express_validator_1.body)('options').optional().isObject().withMessage('Options must be an object'),
    (0, express_validator_1.body)('options.conflictResolution').optional().isIn(['overwrite', 'skip', 'merge']).withMessage('Invalid conflict resolution'),
    (0, express_validator_1.body)('options.validateCompatibility').optional().isBoolean().withMessage('Validate compatibility must be boolean'),
    (0, express_validator_1.body)('options.createBackup').optional().isBoolean().withMessage('Create backup must be boolean')
], validateRequest, async (req, res) => {
    try {
        const userId = req.user.id;
        const { config, options = {} } = req.body;
        const result = await SillyTavernService_1.sillyTavernService.importConfig(userId, config, options);
        if (result.success) {
            res.json({
                success: true,
                result
            });
        }
        else {
            res.status(400).json({
                error: 'Import failed',
                code: 'IMPORT_FAILED',
                result
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to import SillyTavern config', {
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'SillyTavern import failed',
            code: 'SILLYTAVERN_IMPORT_FAILED'
        });
    }
});
/**
 * Check SillyTavern compatibility
 * POST /api/config/compatibility/sillytavern
 */
router.post('/compatibility/sillytavern', auth_1.authMiddleware, [
    (0, express_validator_1.body)('config').isObject().withMessage('Config must be an object')
], validateRequest, async (req, res) => {
    try {
        const { config } = req.body;
        const compatibility = await SillyTavernService_1.sillyTavernService.checkCompatibility(config);
        res.json({
            success: true,
            compatibility
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to check SillyTavern compatibility', {
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Compatibility check failed',
            code: 'COMPATIBILITY_CHECK_FAILED'
        });
    }
});
// Helper method to remove secrets (would be moved to utility class in real implementation)
function removeSecrets(obj) {
    const secretKeys = ['api_key', 'openai_key', 'claude_key', 'password', 'secret', 'token'];
    const removeFromObject = (current) => {
        if (Array.isArray(current)) {
            return current.map(removeFromObject);
        }
        else if (current && typeof current === 'object') {
            const result = {};
            for (const [key, value] of Object.entries(current)) {
                if (!secretKeys.some(secretKey => key.toLowerCase().includes(secretKey))) {
                    result[key] = removeFromObject(value);
                }
            }
            return result;
        }
        return current;
    };
    return removeFromObject(obj);
}
exports.default = router;
//# sourceMappingURL=advanced-config.js.map