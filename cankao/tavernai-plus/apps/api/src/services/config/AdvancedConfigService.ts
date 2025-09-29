import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../database';
import { logger } from '../../utils/logger';
import { cacheService } from '../cache/CacheService';

export interface ConfigSchema {
  id: string;
  category: 'ai_model' | 'prompts' | 'ui' | 'chat' | 'system';
  key: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  defaultValue: any;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
  isSystem: boolean;
  isSecret: boolean;
}

export interface ConfigTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  config: Record<string, any>;
  variables: ConfigVariable[];
  isOfficial: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigVariable {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  defaultValue?: any;
  required: boolean;
}

export interface ConfigVersion {
  id: string;
  userId: string;
  version: number;
  config: Record<string, any>;
  changes: ConfigChange[];
  createdAt: Date;
  description?: string;
}

export interface ConfigChange {
  key: string;
  oldValue: any;
  newValue: any;
  action: 'create' | 'update' | 'delete';
}

export class AdvancedConfigService {
  private static readonly CACHE_TTL = 300; // 5 minutes
  private static readonly CACHE_NAMESPACE = 'config';

  /**
   * Get user configuration with caching
   */
  public async getUserConfig(
    userId: string,
    category?: string
  ): Promise<Record<string, any>> {
    const cacheKey = `user:${userId}:${category || 'all'}`;

    try {
      // Try cache first
      const cached = await cacheService.get(cacheKey, {
        namespace: AdvancedConfigService.CACHE_NAMESPACE,
        ttl: AdvancedConfigService.CACHE_TTL
      });

      if (cached) {
        return cached;
      }

      // Fetch from database
      const where: any = { userId };
      if (category) {
        where.category = category;
      }

      const preferences = await prisma.userPreference.findMany({
        where,
        orderBy: { key: 'asc' }
      });

      // Transform to nested object
      const config = this.transformToNestedConfig(preferences);

      // Cache result
      await cacheService.set(cacheKey, config, {
        namespace: AdvancedConfigService.CACHE_NAMESPACE,
        ttl: AdvancedConfigService.CACHE_TTL
      });

      return config;
    } catch (error) {
      logger.error('Failed to get user config', {
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
  public async updateUserConfig(
    userId: string,
    updates: Record<string, any>,
    createVersion: boolean = true
  ): Promise<boolean> {
    try {
      const changes: ConfigChange[] = [];

      // Process each update
      for (const [path, value] of Object.entries(updates)) {
        const { category, key } = this.parsePath(path);

        // Get current value for change tracking
        const current = await prisma.userPreference.findFirst({
          where: { userId, category, key }
        });

        const oldValue = current?.value;

        if (value === null || value === undefined) {
          // Delete preference
          if (current) {
            await prisma.userPreference.delete({
              where: { id: current.id }
            });
            changes.push({
              key: path,
              oldValue,
              newValue: null,
              action: 'delete'
            });
          }
        } else {
          // Update or create preference
          const data = {
            userId,
            category,
            key,
            value: this.serializeValue(value),
            type: this.getValueType(value)
          };

          if (current) {
            await prisma.userPreference.update({
              where: { id: current.id },
              data
            });
            changes.push({
              key: path,
              oldValue,
              newValue: value,
              action: 'update'
            });
          } else {
            await prisma.userPreference.create({
              data: {
                id: uuidv4(),
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

      logger.info('User config updated', {
        userId,
        changesCount: changes.length
      });

      return true;
    } catch (error) {
      logger.error('Failed to update user config', {
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
  public async cloneConfig(
    targetUserId: string,
    source: { type: 'template'; templateId: string } | { type: 'user'; userId: string },
    options: {
      categories?: string[];
      overwrite?: boolean;
      applyVariables?: Record<string, any>;
    } = {}
  ): Promise<boolean> {
    try {
      let sourceConfig: Record<string, any> = {};

      if (source.type === 'template') {
        const template = await this.getTemplate(source.templateId);
        if (!template) {
          throw new Error('Template not found');
        }

        sourceConfig = template.config;

        // Apply variable substitution
        if (options.applyVariables) {
          sourceConfig = this.applyTemplateVariables(
            sourceConfig,
            template.variables,
            options.applyVariables
          );
        }
      } else {
        sourceConfig = await this.getUserConfig(source.userId);
      }

      // Filter by categories if specified
      if (options.categories && options.categories.length > 0) {
        const filteredConfig: Record<string, any> = {};
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

      logger.info('Config cloned successfully', {
        targetUserId,
        source,
        configKeysCount: Object.keys(flatConfig).length
      });

      return true;
    } catch (error) {
      logger.error('Failed to clone config', {
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
  public async getTemplates(
    category?: string,
    isOfficial?: boolean
  ): Promise<ConfigTemplate[]> {
    try {
      const where: any = {};
      if (category) where.category = category;
      if (isOfficial !== undefined) where.isOfficial = isOfficial;

      const templates = await prisma.configTemplate.findMany({
        where,
        orderBy: [
          { isOfficial: 'desc' },
          { name: 'asc' }
        ]
      });

      return templates.map(template => this.mapPrismaTemplate(template));
    } catch (error) {
      logger.error('Failed to get config templates', {
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
  public async getTemplate(templateId: string): Promise<ConfigTemplate | null> {
    try {
      const template = await prisma.configTemplate.findUnique({
        where: { id: templateId }
      });

      return template ? this.mapPrismaTemplate(template) : null;
    } catch (error) {
      logger.error('Failed to get config template', {
        templateId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Get configuration version history
   */
  public async getVersionHistory(
    userId: string,
    limit: number = 20
  ): Promise<ConfigVersion[]> {
    try {
      const versions = await prisma.configVersion.findMany({
        where: { userId },
        orderBy: { version: 'desc' },
        take: limit
      });

      return versions.map(version => ({
        id: version.id,
        userId: version.userId,
        version: version.version,
        config: version.config,
        changes: version.changes as ConfigChange[],
        createdAt: version.createdAt,
        description: version.description
      }));
    } catch (error) {
      logger.error('Failed to get config version history', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Restore configuration from version
   */
  public async restoreVersion(
    userId: string,
    versionId: string
  ): Promise<boolean> {
    try {
      const version = await prisma.configVersion.findUnique({
        where: { id: versionId, userId }
      });

      if (!version) {
        throw new Error('Version not found');
      }

      // Clear current config
      await prisma.userPreference.deleteMany({
        where: { userId }
      });

      // Restore from version
      const flatConfig = this.flattenConfig(version.config);
      await this.updateUserConfig(userId, flatConfig, true);

      logger.info('Config version restored', {
        userId,
        versionId,
        version: version.version
      });

      return true;
    } catch (error) {
      logger.error('Failed to restore config version', {
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
  public async validateConfig(
    config: Record<string, any>,
    category?: string
  ): Promise<{
    valid: boolean;
    errors: Array<{
      path: string;
      message: string;
      value: any;
    }>;
  }> {
    const errors: Array<{ path: string; message: string; value: any }> = [];

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
              message: validationResult.error!,
              value
            });
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      logger.error('Config validation failed', {
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        valid: false,
        errors: [{ path: '*', message: 'Validation system error', value: null }]
      };
    }
  }

  // Private helper methods
  private transformToNestedConfig(preferences: any[]): Record<string, any> {
    const config: Record<string, any> = {};

    for (const pref of preferences) {
      if (!config[pref.category]) {
        config[pref.category] = {};
      }
      config[pref.category][pref.key] = this.deserializeValue(pref.value, pref.type);
    }

    return config;
  }

  private flattenConfig(config: Record<string, any>, prefix: string = ''): Record<string, any> {
    const flat: Record<string, any> = {};

    for (const [key, value] of Object.entries(config)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flat, this.flattenConfig(value, fullKey));
      } else {
        flat[fullKey] = value;
      }
    }

    return flat;
  }

  private parsePath(path: string): { category: string; key: string } {
    const parts = path.split('.');
    return {
      category: parts[0],
      key: parts.slice(1).join('.')
    };
  }

  private serializeValue(value: any): string {
    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  private deserializeValue(value: string, type: string): any {
    if (type === 'string') return value;
    if (type === 'number') return parseFloat(value);
    if (type === 'boolean') return value === 'true';
    return JSON.parse(value);
  }

  private getValueType(value: any): string {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    return 'object';
  }

  private async createConfigVersion(
    userId: string,
    changes: ConfigChange[]
  ): Promise<void> {
    try {
      const lastVersion = await prisma.configVersion.findFirst({
        where: { userId },
        orderBy: { version: 'desc' }
      });

      const newVersion = (lastVersion?.version || 0) + 1;
      const currentConfig = await this.getUserConfig(userId);

      await prisma.configVersion.create({
        data: {
          id: uuidv4(),
          userId,
          version: newVersion,
          config: currentConfig,
          changes,
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to create config version', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async invalidateUserCache(userId: string): Promise<void> {
    await cacheService.invalidatePattern(`user:${userId}:*`, {
      namespace: AdvancedConfigService.CACHE_NAMESPACE
    });
  }

  private async getConfigSchemas(category?: string): Promise<ConfigSchema[]> {
    // This would be implemented to return actual schema definitions
    // For now, return empty array
    return [];
  }

  private validateValue(
    value: any,
    schema: ConfigSchema
  ): { valid: boolean; error?: string } {
    const validation = schema.validation;
    if (!validation) return { valid: true };

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

  private applyTemplateVariables(
    config: Record<string, any>,
    variables: ConfigVariable[],
    values: Record<string, any>
  ): Record<string, any> {
    const result = JSON.parse(JSON.stringify(config));

    // Simple variable substitution
    for (const variable of variables) {
      const value = values[variable.name] ?? variable.defaultValue;
      if (value !== undefined) {
        const placeholder = `{{${variable.name}}}`;
        const jsonStr = JSON.stringify(result);
        const replaced = jsonStr.replace(
          new RegExp(placeholder, 'g'),
          JSON.stringify(value).slice(1, -1)
        );
        Object.assign(result, JSON.parse(replaced));
      }
    }

    return result;
  }

  private mapPrismaTemplate(template: any): ConfigTemplate {
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

// Singleton instance
export const advancedConfigService = new AdvancedConfigService();