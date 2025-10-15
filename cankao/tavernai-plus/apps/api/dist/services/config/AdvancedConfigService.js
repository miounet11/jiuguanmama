"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advancedConfigService = exports.AdvancedConfigService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../../database");
const logger_1 = require("../../utils/logger");
const CacheService_1 = require("../cache/CacheService");
class AdvancedConfigService {
    static CACHE_TTL = 300; // 5 minutes
    static CACHE_NAMESPACE = 'config';
    /**
     * Get user configuration with caching
     */
    async getUserConfig(userId, category) {
        const cacheKey = `user:${userId}:${category || 'all'}`;
        try {
            // Try cache first
            const cached = await CacheService_1.cacheService.get(cacheKey, {
                namespace: AdvancedConfigService.CACHE_NAMESPACE,
                ttl: AdvancedConfigService.CACHE_TTL
            });
            if (cached) {
                return cached;
            }
            // Fetch from database
            const where = { userId };
            if (category) {
                where.category = category;
            }
            const preferences = await database_1.prisma.userPreference.findMany({
                where,
                orderBy: { key: 'asc' }
            });
            // Transform to nested object
            const config = this.transformToNestedConfig(preferences);
            // Cache result
            await CacheService_1.cacheService.set(cacheKey, config, {
                namespace: AdvancedConfigService.CACHE_NAMESPACE,
                ttl: AdvancedConfigService.CACHE_TTL
            });
            return config;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user config', {
                userId,
                category,
                error: error instanceof Error ? error.message : String(error)
            });
            return {};
        }
    }
    /**
     * Update user configuration
     */
    async updateUserConfig(userId, updates, createVersion = true) {
        try {
            const changes = [];
            // Process each update
            for (const [path, value] of Object.entries(updates)) {
                const { category, key } = this.parsePath(path);
                // Get current value for change tracking
                const current = await database_1.prisma.userPreference.findFirst({
                    where: { userId, category, key }
                });
                const oldValue = current?.value;
                if (value === null || value === undefined) {
                    // Delete preference
                    if (current) {
                        await database_1.prisma.userPreference.delete({
                            where: { id: current.id }
                        });
                        changes.push({
                            key: path,
                            oldValue,
                            newValue: null,
                            action: 'delete'
                        });
                    }
                }
                else {
                    // Update or create preference
                    const data = {
                        userId,
                        category,
                        key,
                        value: this.serializeValue(value),
                        type: this.getValueType(value)
                    };
                    if (current) {
                        await database_1.prisma.userPreference.update({
                            where: { id: current.id },
                            data
                        });
                        changes.push({
                            key: path,
                            oldValue,
                            newValue: value,
                            action: 'update'
                        });
                    }
                    else {
                        await database_1.prisma.userPreference.create({
                            data: {
                                id: (0, uuid_1.v4)(),
                                ...data
                            }
                        });
                        changes.push({
                            key: path,
                            oldValue: null,
                            newValue: value,
                            action: 'create'
                        });
                    }
                }
            }
            // Create version if requested
            if (createVersion && changes.length > 0) {
                await this.createConfigVersion(userId, changes);
            }
            // Invalidate cache
            await this.invalidateUserCache(userId);
            logger_1.logger.info('User config updated', {
                userId,
                changesCount: changes.length
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to update user config', {
                userId,
                updates,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    /**
     * Clone configuration from template or another user
     */
    async cloneConfig(targetUserId, source, options = {}) {
        try {
            let sourceConfig = {};
            if (source.type === 'template') {
                const template = await this.getTemplate(source.templateId);
                if (!template) {
                    throw new Error('Template not found');
                }
                sourceConfig = template.config;
                // Apply variable substitution
                if (options.applyVariables) {
                    sourceConfig = this.applyTemplateVariables(sourceConfig, template.variables, options.applyVariables);
                }
            }
            else {
                sourceConfig = await this.getUserConfig(source.userId);
            }
            // Filter by categories if specified
            if (options.categories && options.categories.length > 0) {
                const filteredConfig = {};
                for (const category of options.categories) {
                    if (sourceConfig[category]) {
                        filteredConfig[category] = sourceConfig[category];
                    }
                }
                sourceConfig = filteredConfig;
            }
            // Apply configuration
            const flatConfig = this.flattenConfig(sourceConfig);
            if (!options.overwrite) {
                // Only set values that don't exist
                const existingConfig = await this.getUserConfig(targetUserId);
                const existingFlat = this.flattenConfig(existingConfig);
                for (const key of Object.keys(flatConfig)) {
                    if (existingFlat[key] !== undefined) {
                        delete flatConfig[key];
                    }
                }
            }
            await this.updateUserConfig(targetUserId, flatConfig, true);
            logger_1.logger.info('Config cloned successfully', {
                targetUserId,
                source,
                configKeysCount: Object.keys(flatConfig).length
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to clone config', {
                targetUserId,
                source,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    /**
     * Get configuration templates
     */
    async getTemplates(category, isOfficial) {
        try {
            const where = {};
            if (category)
                where.category = category;
            if (isOfficial !== undefined)
                where.isOfficial = isOfficial;
            const templates = await database_1.prisma.configTemplate.findMany({
                where,
                orderBy: [
                    { isOfficial: 'desc' },
                    { name: 'asc' }
                ]
            });
            return templates.map(template => this.mapPrismaTemplate(template));
        }
        catch (error) {
            logger_1.logger.error('Failed to get config templates', {
                category,
                isOfficial,
                error: error instanceof Error ? error.message : String(error)
            });
            return [];
        }
    }
    /**
     * Get specific template
     */
    async getTemplate(templateId) {
        try {
            const template = await database_1.prisma.configTemplate.findUnique({
                where: { id: templateId }
            });
            return template ? this.mapPrismaTemplate(template) : null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get config template', {
                templateId,
                error: error instanceof Error ? error.message : String(error)
            });
            return null;
        }
    }
    /**
     * Get configuration version history
     */
    async getVersionHistory(userId, limit = 20) {
        try {
            const versions = await database_1.prisma.configVersion.findMany({
                where: { userId },
                orderBy: { version: 'desc' },
                take: limit
            });
            return versions.map(version => ({
                id: version.id,
                userId: version.userId,
                version: version.version,
                config: version.config,
                changes: version.changes,
                createdAt: version.createdAt,
                description: version.description
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get config version history', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            return [];
        }
    }
    /**
     * Restore configuration from version
     */
    async restoreVersion(userId, versionId) {
        try {
            const version = await database_1.prisma.configVersion.findUnique({
                where: { id: versionId, userId }
            });
            if (!version) {
                throw new Error('Version not found');
            }
            // Clear current config
            await database_1.prisma.userPreference.deleteMany({
                where: { userId }
            });
            // Restore from version
            const flatConfig = this.flattenConfig(version.config);
            await this.updateUserConfig(userId, flatConfig, true);
            logger_1.logger.info('Config version restored', {
                userId,
                versionId,
                version: version.version
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to restore config version', {
                userId,
                versionId,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    /**
     * Validate configuration against schema
     */
    async validateConfig(config, category) {
        const errors = [];
        try {
            // Get schema definitions
            const schemas = await this.getConfigSchemas(category);
            const flatConfig = this.flattenConfig(config);
            for (const [path, value] of Object.entries(flatConfig)) {
                const schema = schemas.find(s => `${s.category}.${s.key}` === path);
                if (schema) {
                    const validationResult = this.validateValue(value, schema);
                    if (!validationResult.valid) {
                        errors.push({
                            path,
                            message: validationResult.error,
                            value
                        });
                    }
                }
            }
            return {
                valid: errors.length === 0,
                errors
            };
        }
        catch (error) {
            logger_1.logger.error('Config validation failed', {
                error: error instanceof Error ? error.message : String(error)
            });
            return {
                valid: false,
                errors: [{ path: '*', message: 'Validation system error', value: null }]
            };
        }
    }
    // Private helper methods
    transformToNestedConfig(preferences) {
        const config = {};
        for (const pref of preferences) {
            if (!config[pref.category]) {
                config[pref.category] = {};
            }
            config[pref.category][pref.key] = this.deserializeValue(pref.value, pref.type);
        }
        return config;
    }
    flattenConfig(config, prefix = '') {
        const flat = {};
        for (const [key, value] of Object.entries(config)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                Object.assign(flat, this.flattenConfig(value, fullKey));
            }
            else {
                flat[fullKey] = value;
            }
        }
        return flat;
    }
    parsePath(path) {
        const parts = path.split('.');
        return {
            category: parts[0],
            key: parts.slice(1).join('.')
        };
    }
    serializeValue(value) {
        return typeof value === 'string' ? value : JSON.stringify(value);
    }
    deserializeValue(value, type) {
        if (type === 'string')
            return value;
        if (type === 'number')
            return parseFloat(value);
        if (type === 'boolean')
            return value === 'true';
        return JSON.parse(value);
    }
    getValueType(value) {
        if (typeof value === 'string')
            return 'string';
        if (typeof value === 'number')
            return 'number';
        if (typeof value === 'boolean')
            return 'boolean';
        if (Array.isArray(value))
            return 'array';
        return 'object';
    }
    async createConfigVersion(userId, changes) {
        try {
            const lastVersion = await database_1.prisma.configVersion.findFirst({
                where: { userId },
                orderBy: { version: 'desc' }
            });
            const newVersion = (lastVersion?.version || 0) + 1;
            const currentConfig = await this.getUserConfig(userId);
            await database_1.prisma.configVersion.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    userId,
                    version: newVersion,
                    config: currentConfig,
                    changes,
                    createdAt: new Date()
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create config version', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async invalidateUserCache(userId) {
        await CacheService_1.cacheService.invalidatePattern(`user:${userId}:*`, {
            namespace: AdvancedConfigService.CACHE_NAMESPACE
        });
    }
    async getConfigSchemas(category) {
        // This would be implemented to return actual schema definitions
        // For now, return empty array
        return [];
    }
    validateValue(value, schema) {
        const validation = schema.validation;
        if (!validation)
            return { valid: true };
        if (validation.required && (value === null || value === undefined)) {
            return { valid: false, error: 'Value is required' };
        }
        if (validation.min !== undefined && value < validation.min) {
            return { valid: false, error: `Value must be at least ${validation.min}` };
        }
        if (validation.max !== undefined && value > validation.max) {
            return { valid: false, error: `Value must be at most ${validation.max}` };
        }
        if (validation.pattern && typeof value === 'string') {
            const regex = new RegExp(validation.pattern);
            if (!regex.test(value)) {
                return { valid: false, error: 'Value does not match required pattern' };
            }
        }
        if (validation.enum && !validation.enum.includes(value)) {
            return {
                valid: false,
                error: `Value must be one of: ${validation.enum.join(', ')}`
            };
        }
        return { valid: true };
    }
    applyTemplateVariables(config, variables, values) {
        const result = JSON.parse(JSON.stringify(config));
        // Simple variable substitution
        for (const variable of variables) {
            const value = values[variable.name] ?? variable.defaultValue;
            if (value !== undefined) {
                const placeholder = `{{${variable.name}}}`;
                const jsonStr = JSON.stringify(result);
                const replaced = jsonStr.replace(new RegExp(placeholder, 'g'), JSON.stringify(value).slice(1, -1));
                Object.assign(result, JSON.parse(replaced));
            }
        }
        return result;
    }
    mapPrismaTemplate(template) {
        return {
            id: template.id,
            name: template.name,
            description: template.description,
            category: template.category,
            config: template.config,
            variables: template.variables || [],
            isOfficial: template.isOfficial,
            createdBy: template.createdBy,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt
        };
    }
}
exports.AdvancedConfigService = AdvancedConfigService;
// Singleton instance
exports.advancedConfigService = new AdvancedConfigService();
//# sourceMappingURL=AdvancedConfigService.js.map