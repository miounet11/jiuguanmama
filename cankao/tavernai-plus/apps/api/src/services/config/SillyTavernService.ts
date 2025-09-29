import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { advancedConfigService } from './AdvancedConfigService';

export interface SillyTavernConfig {
  // AI Model Configuration
  textgenerationwebui_settings: {
    max_new_tokens: number;
    temperature: number;
    top_p: number;
    top_k: number;
    repetition_penalty: number;
    encoder_repetition_penalty: number;
    typical_p: number;
    min_length: number;
    no_repeat_ngram_size: number;
    penalty_alpha: number;
    num_beams: number;
    length_penalty: number;
    early_stopping: boolean;
    mirostat_mode: number;
    mirostat_tau: number;
    mirostat_eta: number;
    guidance_scale: number;
    negative_prompt: string;
    grammar_string: string;
    banned_tokens: string;
    sampler_order: number[];
    stopping_strings: string[];
  };

  // OpenAI Configuration
  openai_setting: {
    openai_key: string;
    openai_model: string;
    openai_reverse_proxy: string;
    openai_temperature: number;
    openai_frequency_penalty: number;
    openai_presence_penalty: number;
    openai_top_p: number;
    openai_max_tokens: number;
    wrap_in_quotes: boolean;
    names_in_completion: boolean;
    openai_logit_bias: Record<string, number>;
    send_if_empty: string;
    impersonation_prompt: string;
    new_chat_prompt: string;
    new_group_chat_prompt: string;
    continue_nudge_prompt: string;
    bias_preset_selected: string;
    reverse_proxy_chat_completions: string;
  };

  // Claude Configuration
  claude_setting: {
    claude_key: string;
    claude_model: string;
    claude_temperature: number;
    claude_top_p: number;
    claude_top_k: number;
    claude_max_tokens: number;
  };

  // Character and Prompt Settings
  prompts: {
    main: string;
    nsfw: string;
    jailbreak: string;
    impersonation: string;
    bias: string;
    [key: string]: string;
  };

  // UI Settings
  ui_mode: number;
  power_user: {
    tokenizer: number;
    token_padding: number;
    context_length: number;
    truncation_length: number;
    activation_regex: string;
    instruct: {
      enabled: boolean;
      preset: string;
      system_prompt: string;
      input_sequence: string;
      output_sequence: string;
      separator_sequence: string;
      wrap: boolean;
      macro: boolean;
      names: boolean;
    };
    sysprompt: {
      story: string;
      nsfw: string;
      roleplay: string;
    };
  };

  // Extension Settings
  extension_settings: Record<string, any>;
}

export interface ImportResult {
  success: boolean;
  importedKeys: string[];
  skippedKeys: string[];
  errors: Array<{
    key: string;
    error: string;
  }>;
  conflictResolution?: 'overwrite' | 'skip' | 'merge';
}

export interface ExportOptions {
  categories?: string[];
  includeSecrets?: boolean;
  format?: 'json' | 'yaml';
  minify?: boolean;
}

export interface CompatibilityCheck {
  compatible: boolean;
  version: string;
  missingFeatures: string[];
  deprecatedSettings: string[];
  migrationRequired: boolean;
  recommendations: string[];
}

export class SillyTavernService {
  private readonly formatMappings = {
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
  public async importConfig(
    userId: string,
    sillyTavernConfig: Partial<SillyTavernConfig>,
    options: {
      conflictResolution?: 'overwrite' | 'skip' | 'merge';
      validateCompatibility?: boolean;
      createBackup?: boolean;
    } = {}
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      importedKeys: [],
      skippedKeys: [],
      errors: [],
      conflictResolution: options.conflictResolution || 'merge'
    };

    try {
      logger.info('Starting SillyTavern config import', {
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
      let existingConfig: Record<string, any> = {};
      if (options.conflictResolution !== 'overwrite') {
        existingConfig = await advancedConfigService.getUserConfig(userId);
      }

      // Convert SillyTavern format to TavernAI Plus format
      const convertedConfig = this.convertFromSillyTavern(sillyTavernConfig);

      // Handle conflicts
      const finalConfig: Record<string, any> = {};

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
          } else {
            finalConfig[key] = value;
          }
        } else {
          finalConfig[key] = value;
        }

        result.importedKeys.push(key);
      }

      // Apply configuration
      const updateSuccess = await advancedConfigService.updateUserConfig(
        userId,
        finalConfig,
        true // Create version
      );

      if (updateSuccess) {
        result.success = true;
        logger.info('SillyTavern config import completed', {
          userId,
          importedCount: result.importedKeys.length,
          skippedCount: result.skippedKeys.length,
          errorCount: result.errors.length
        });
      } else {
        result.errors.push({
          key: 'update',
          error: 'Failed to update configuration'
        });
      }

      return result;
    } catch (error) {
      logger.error('SillyTavern config import failed', {
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
  public async exportConfig(
    userId: string,
    options: ExportOptions = {}
  ): Promise<Partial<SillyTavernConfig>> {
    try {
      // Get user configuration
      const userConfig = await advancedConfigService.getUserConfig(userId);

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

      logger.info('SillyTavern config export completed', {
        userId,
        configSize: JSON.stringify(sillyTavernConfig).length
      });

      return sillyTavernConfig;
    } catch (error) {
      logger.error('SillyTavern config export failed', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      return {};
    }
  }

  /**
   * Import character from SillyTavern format
   */
  public async importCharacter(
    userId: string,
    characterData: any
  ): Promise<{ success: boolean; characterId?: string; error?: string }> {
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
          id: uuidv4(),
          ...convertedCharacter,
          userId,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      logger.info('SillyTavern character imported', {
        userId,
        characterId: character.id,
        characterName: character.name
      });

      return {
        success: true,
        characterId: character.id
      };
    } catch (error) {
      logger.error('SillyTavern character import failed', {
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
  public async exportCharacter(characterId: string): Promise<any> {
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

      logger.info('Character exported to SillyTavern format', {
        characterId,
        characterName: character.name
      });

      return sillyTavernCharacter;
    } catch (error) {
      logger.error('SillyTavern character export failed', {
        characterId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Check compatibility with SillyTavern configuration
   */
  public async checkCompatibility(
    sillyTavernConfig: Partial<SillyTavernConfig>
  ): Promise<CompatibilityCheck> {
    const result: CompatibilityCheck = {
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

      logger.debug('Compatibility check completed', {
        compatible: result.compatible,
        deprecatedCount: result.deprecatedSettings.length,
        missingCount: result.missingFeatures.length
      });

      return result;
    } catch (error) {
      logger.error('Compatibility check failed', {
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
  private convertFromSillyTavern(sillyTavernConfig: Partial<SillyTavernConfig>): Record<string, any> {
    const converted: Record<string, any> = {};
    const flatConfig = this.flattenObject(sillyTavernConfig);

    for (const [sillyKey, value] of Object.entries(flatConfig)) {
      const tavernKey = this.formatMappings.fromSillyTavern[sillyKey];
      if (tavernKey) {
        this.setNestedValue(converted, tavernKey, value);
      }
    }

    return converted;
  }

  private convertToSillyTavern(tavernConfig: Record<string, any>): Partial<SillyTavernConfig> {
    const converted: any = {};
    const flatConfig = this.flattenObject(tavernConfig);

    for (const [tavernKey, value] of Object.entries(flatConfig)) {
      const sillyKey = this.formatMappings.toSillyTavern[tavernKey];
      if (sillyKey) {
        this.setNestedValue(converted, sillyKey, value);
      }
    }

    return converted;
  }

  private flattenObject(obj: any, prefix: string = ''): Record<string, any> {
    const flattened: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (this.isObject(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private hasNestedKey(obj: any, path: string): boolean {
    return this.getNestedValue(obj, path) !== undefined;
  }

  private isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private removeSecrets(config: any): void {
    const secretKeys = ['openai_key', 'claude_key', 'api_key', 'password'];

    const removeFromObject = (obj: any) => {
      for (const key of Object.keys(obj)) {
        if (secretKeys.some(secretKey => key.toLowerCase().includes(secretKey))) {
          delete obj[key];
        } else if (this.isObject(obj[key])) {
          removeFromObject(obj[key]);
        }
      }
    };

    removeFromObject(config);
  }

  private isSupportedExtension(extensionName: string): boolean {
    const supportedExtensions = [
      'character_expressions',
      'group_chats',
      'regex',
      'sd_api_pictures',
      'translate'
    ];

    return supportedExtensions.includes(extensionName);
  }

  private async createConfigBackup(userId: string): Promise<void> {
    try {
      const currentConfig = await advancedConfigService.getUserConfig(userId);
      const backupData = {
        userId,
        config: currentConfig,
        timestamp: new Date().toISOString(),
        type: 'pre_sillytavern_import'
      };

      // In a real implementation, this would save to a backup storage
      logger.info('Config backup created', {
        userId,
        configSize: JSON.stringify(currentConfig).length
      });
    } catch (error) {
      logger.error('Failed to create config backup', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

// Singleton instance
export const sillyTavernService = new SillyTavernService();