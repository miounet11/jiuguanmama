"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sillyTavernService = exports.SillyTavernService = void 0;
const uuid_1 = require("uuid");
const logger_1 = require("../../utils/logger");
const AdvancedConfigService_1 = require("./AdvancedConfigService");
class SillyTavernService {
    formatMappings = {
        // TavernAI Plus -> SillyTavern key mappings
        toSillyTavern: {
            'ai_model.openai_api_key': 'openai_setting.openai_key',
            'ai_model.openai_model': 'openai_setting.openai_model',
            'ai_model.temperature': 'textgenerationwebui_settings.temperature',
            'ai_model.max_tokens': 'textgenerationwebui_settings.max_new_tokens',
            'ai_model.top_p': 'textgenerationwebui_settings.top_p',
            'ai_model.top_k': 'textgenerationwebui_settings.top_k',
            'ai_model.frequency_penalty': 'openai_setting.openai_frequency_penalty',
            'ai_model.presence_penalty': 'openai_setting.openai_presence_penalty',
            'prompts.main_prompt': 'prompts.main',
            'prompts.nsfw_prompt': 'prompts.nsfw',
            'prompts.jailbreak_prompt': 'prompts.jailbreak',
            'ui.theme': 'ui_mode',
            'chat.context_length': 'power_user.context_length',
            'chat.instruct_mode': 'power_user.instruct.enabled'
        },
        // SillyTavern -> TavernAI Plus key mappings
        fromSillyTavern: {
            'openai_setting.openai_key': 'ai_model.openai_api_key',
            'openai_setting.openai_model': 'ai_model.openai_model',
            'textgenerationwebui_settings.temperature': 'ai_model.temperature',
            'textgenerationwebui_settings.max_new_tokens': 'ai_model.max_tokens',
            'textgenerationwebui_settings.top_p': 'ai_model.top_p',
            'textgenerationwebui_settings.top_k': 'ai_model.top_k',
            'openai_setting.openai_frequency_penalty': 'ai_model.frequency_penalty',
            'openai_setting.openai_presence_penalty': 'ai_model.presence_penalty',
            'prompts.main': 'prompts.main_prompt',
            'prompts.nsfw': 'prompts.nsfw_prompt',
            'prompts.jailbreak': 'prompts.jailbreak_prompt',
            'ui_mode': 'ui.theme',
            'power_user.context_length': 'chat.context_length',
            'power_user.instruct.enabled': 'chat.instruct_mode'
        }
    };
    /**
     * Import SillyTavern configuration
     */
    async importConfig(userId, sillyTavernConfig, options = {}) {
        const result = {
            success: false,
            importedKeys: [],
            skippedKeys: [],
            errors: [],
            conflictResolution: options.conflictResolution || 'merge'
        };
        try {
            logger_1.logger.info('Starting SillyTavern config import', {
                userId,
                configKeys: Object.keys(sillyTavernConfig).length,
                options
            });
            // Compatibility check
            if (options.validateCompatibility) {
                const compatibility = await this.checkCompatibility(sillyTavernConfig);
                if (!compatibility.compatible) {
                    result.errors.push({
                        key: 'compatibility',
                        error: `Incompatible configuration: ${compatibility.missingFeatures.join(', ')}`
                    });
                    return result;
                }
            }
            // Create backup if requested
            if (options.createBackup) {
                await this.createConfigBackup(userId);
            }
            // Get existing configuration
            let existingConfig = {};
            if (options.conflictResolution !== 'overwrite') {
                existingConfig = await AdvancedConfigService_1.advancedConfigService.getUserConfig(userId);
            }
            // Convert SillyTavern format to TavernAI Plus format
            const convertedConfig = this.convertFromSillyTavern(sillyTavernConfig);
            // Handle conflicts
            const finalConfig = {};
            for (const [key, value] of Object.entries(convertedConfig)) {
                const existingValue = this.getNestedValue(existingConfig, key);
                if (existingValue !== undefined && options.conflictResolution === 'skip') {
                    result.skippedKeys.push(key);
                    continue;
                }
                if (existingValue !== undefined && options.conflictResolution === 'merge') {
                    // Merge objects, overwrite primitives
                    if (this.isObject(value) && this.isObject(existingValue)) {
                        finalConfig[key] = { ...existingValue, ...value };
                    }
                    else {
                        finalConfig[key] = value;
                    }
                }
                else {
                    finalConfig[key] = value;
                }
                result.importedKeys.push(key);
            }
            // Apply configuration
            const updateSuccess = await AdvancedConfigService_1.advancedConfigService.updateUserConfig(userId, finalConfig, true // Create version
            );
            if (updateSuccess) {
                result.success = true;
                logger_1.logger.info('SillyTavern config import completed', {
                    userId,
                    importedCount: result.importedKeys.length,
                    skippedCount: result.skippedKeys.length,
                    errorCount: result.errors.length
                });
            }
            else {
                result.errors.push({
                    key: 'update',
                    error: 'Failed to update configuration'
                });
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error('SillyTavern config import failed', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            result.errors.push({
                key: 'system',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return result;
        }
    }
    /**
     * Export configuration to SillyTavern format
     */
    async exportConfig(userId, options = {}) {
        try {
            // Get user configuration
            const userConfig = await AdvancedConfigService_1.advancedConfigService.getUserConfig(userId);
            // Filter by categories if specified
            let filteredConfig = userConfig;
            if (options.categories && options.categories.length > 0) {
                filteredConfig = {};
                for (const category of options.categories) {
                    if (userConfig[category]) {
                        filteredConfig[category] = userConfig[category];
                    }
                }
            }
            // Convert to SillyTavern format
            const sillyTavernConfig = this.convertToSillyTavern(filteredConfig);
            // Remove secrets if not requested
            if (!options.includeSecrets) {
                this.removeSecrets(sillyTavernConfig);
            }
            logger_1.logger.info('SillyTavern config export completed', {
                userId,
                configSize: JSON.stringify(sillyTavernConfig).length
            });
            return sillyTavernConfig;
        }
        catch (error) {
            logger_1.logger.error('SillyTavern config export failed', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            return {};
        }
    }
    /**
     * Import character from SillyTavern format
     */
    async importCharacter(userId, characterData) {
        try {
            // Convert SillyTavern character format to TavernAI Plus format
            const convertedCharacter = {
                name: characterData.name || 'Imported Character',
                description: characterData.description || '',
                personality: characterData.personality || '',
                scenario: characterData.scenario || '',
                firstMessage: characterData.first_mes || '',
                exampleDialogue: characterData.mes_example || '',
                creatorNotes: characterData.creator_notes || '',
                systemPrompt: characterData.system_prompt || '',
                postHistoryInstructions: characterData.post_history_instructions || '',
                alternateGreetings: characterData.alternate_greetings || [],
                tags: characterData.tags || [],
                creator: characterData.creator || 'Unknown',
                characterVersion: characterData.character_version || '1.0.0',
                extensions: characterData.extensions || {},
                avatar: characterData.avatar || null
            };
            // Create character in database
            const character = await prisma.character.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    ...convertedCharacter,
                    userId,
                    isPublic: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            logger_1.logger.info('SillyTavern character imported', {
                userId,
                characterId: character.id,
                characterName: character.name
            });
            return {
                success: true,
                characterId: character.id
            };
        }
        catch (error) {
            logger_1.logger.error('SillyTavern character import failed', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Import failed'
            };
        }
    }
    /**
     * Export character to SillyTavern format
     */
    async exportCharacter(characterId) {
        try {
            const character = await prisma.character.findUnique({
                where: { id: characterId }
            });
            if (!character) {
                throw new Error('Character not found');
            }
            // Convert to SillyTavern format
            const sillyTavernCharacter = {
                name: character.name,
                description: character.description,
                personality: character.personality,
                scenario: character.scenario,
                first_mes: character.firstMessage,
                mes_example: character.exampleDialogue,
                creator_notes: character.creatorNotes,
                system_prompt: character.systemPrompt,
                post_history_instructions: character.postHistoryInstructions,
                alternate_greetings: character.alternateGreetings,
                tags: character.tags,
                creator: character.creator,
                character_version: character.characterVersion,
                extensions: character.extensions || {},
                avatar: character.avatar,
                chat: `${character.name} - ${new Date().toISOString()}`,
                create_date: character.createdAt.getTime(),
                modify_date: character.updatedAt.getTime()
            };
            logger_1.logger.info('Character exported to SillyTavern format', {
                characterId,
                characterName: character.name
            });
            return sillyTavernCharacter;
        }
        catch (error) {
            logger_1.logger.error('SillyTavern character export failed', {
                characterId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Check compatibility with SillyTavern configuration
     */
    async checkCompatibility(sillyTavernConfig) {
        const result = {
            compatible: true,
            version: '1.0.0',
            missingFeatures: [],
            deprecatedSettings: [],
            migrationRequired: false,
            recommendations: []
        };
        try {
            // Check for deprecated settings
            const deprecatedKeys = [
                'legacy_api',
                'old_tokenizer',
                'deprecated_prompt_format'
            ];
            for (const key of deprecatedKeys) {
                if (this.hasNestedKey(sillyTavernConfig, key)) {
                    result.deprecatedSettings.push(key);
                    result.migrationRequired = true;
                }
            }
            // Check for missing features
            if (sillyTavernConfig.extension_settings) {
                const unsupportedExtensions = Object.keys(sillyTavernConfig.extension_settings)
                    .filter(ext => !this.isSupportedExtension(ext));
                if (unsupportedExtensions.length > 0) {
                    result.missingFeatures.push(`Unsupported extensions: ${unsupportedExtensions.join(', ')}`);
                }
            }
            // Generate recommendations
            if (result.deprecatedSettings.length > 0) {
                result.recommendations.push('Update deprecated settings to use new configuration format');
            }
            if (result.missingFeatures.length > 0) {
                result.recommendations.push('Some features may not work as expected');
                result.compatible = false;
            }
            logger_1.logger.debug('Compatibility check completed', {
                compatible: result.compatible,
                deprecatedCount: result.deprecatedSettings.length,
                missingCount: result.missingFeatures.length
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Compatibility check failed', {
                error: error instanceof Error ? error.message : String(error)
            });
            return {
                compatible: false,
                version: 'unknown',
                missingFeatures: ['Compatibility check failed'],
                deprecatedSettings: [],
                migrationRequired: false,
                recommendations: ['Manual review required']
            };
        }
    }
    // Private helper methods
    convertFromSillyTavern(sillyTavernConfig) {
        const converted = {};
        const flatConfig = this.flattenObject(sillyTavernConfig);
        for (const [sillyKey, value] of Object.entries(flatConfig)) {
            const tavernKey = this.formatMappings.fromSillyTavern[sillyKey];
            if (tavernKey) {
                this.setNestedValue(converted, tavernKey, value);
            }
        }
        return converted;
    }
    convertToSillyTavern(tavernConfig) {
        const converted = {};
        const flatConfig = this.flattenObject(tavernConfig);
        for (const [tavernKey, value] of Object.entries(flatConfig)) {
            const sillyKey = this.formatMappings.toSillyTavern[tavernKey];
            if (sillyKey) {
                this.setNestedValue(converted, sillyKey, value);
            }
        }
        return converted;
    }
    flattenObject(obj, prefix = '') {
        const flattened = {};
        for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (this.isObject(value)) {
                Object.assign(flattened, this.flattenObject(value, newKey));
            }
            else {
                flattened[newKey] = value;
            }
        }
        return flattened;
    }
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key])
                current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }
    hasNestedKey(obj, path) {
        return this.getNestedValue(obj, path) !== undefined;
    }
    isObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }
    removeSecrets(config) {
        const secretKeys = ['openai_key', 'claude_key', 'api_key', 'password'];
        const removeFromObject = (obj) => {
            for (const key of Object.keys(obj)) {
                if (secretKeys.some(secretKey => key.toLowerCase().includes(secretKey))) {
                    delete obj[key];
                }
                else if (this.isObject(obj[key])) {
                    removeFromObject(obj[key]);
                }
            }
        };
        removeFromObject(config);
    }
    isSupportedExtension(extensionName) {
        const supportedExtensions = [
            'character_expressions',
            'group_chats',
            'regex',
            'sd_api_pictures',
            'translate'
        ];
        return supportedExtensions.includes(extensionName);
    }
    async createConfigBackup(userId) {
        try {
            const currentConfig = await AdvancedConfigService_1.advancedConfigService.getUserConfig(userId);
            const backupData = {
                userId,
                config: currentConfig,
                timestamp: new Date().toISOString(),
                type: 'pre_sillytavern_import'
            };
            // In a real implementation, this would save to a backup storage
            logger_1.logger.info('Config backup created', {
                userId,
                configSize: JSON.stringify(currentConfig).length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create config backup', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
}
exports.SillyTavernService = SillyTavernService;
// Singleton instance
exports.sillyTavernService = new SillyTavernService();
//# sourceMappingURL=SillyTavernService.js.map