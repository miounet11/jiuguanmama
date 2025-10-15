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
export declare class AdvancedConfigService {
    private static readonly CACHE_TTL;
    private static readonly CACHE_NAMESPACE;
    /**
     * Get user configuration with caching
     */
    getUserConfig(userId: string, category?: string): Promise<Record<string, any>>;
    /**
     * Update user configuration
     */
    updateUserConfig(userId: string, updates: Record<string, any>, createVersion?: boolean): Promise<boolean>;
    /**
     * Clone configuration from template or another user
     */
    cloneConfig(targetUserId: string, source: {
        type: 'template';
        templateId: string;
    } | {
        type: 'user';
        userId: string;
    }, options?: {
        categories?: string[];
        overwrite?: boolean;
        applyVariables?: Record<string, any>;
    }): Promise<boolean>;
    /**
     * Get configuration templates
     */
    getTemplates(category?: string, isOfficial?: boolean): Promise<ConfigTemplate[]>;
    /**
     * Get specific template
     */
    getTemplate(templateId: string): Promise<ConfigTemplate | null>;
    /**
     * Get configuration version history
     */
    getVersionHistory(userId: string, limit?: number): Promise<ConfigVersion[]>;
    /**
     * Restore configuration from version
     */
    restoreVersion(userId: string, versionId: string): Promise<boolean>;
    /**
     * Validate configuration against schema
     */
    validateConfig(config: Record<string, any>, category?: string): Promise<{
        valid: boolean;
        errors: Array<{
            path: string;
            message: string;
            value: any;
        }>;
    }>;
    private transformToNestedConfig;
    private flattenConfig;
    private parsePath;
    private serializeValue;
    private deserializeValue;
    private getValueType;
    private createConfigVersion;
    private invalidateUserCache;
    private getConfigSchemas;
    private validateValue;
    private applyTemplateVariables;
    private mapPrismaTemplate;
}
export declare const advancedConfigService: AdvancedConfigService;
//# sourceMappingURL=AdvancedConfigService.d.ts.map