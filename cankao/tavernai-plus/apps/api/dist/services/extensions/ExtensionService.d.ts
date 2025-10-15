export interface Extension {
    id: string;
    name: string;
    displayName: string;
    version: string;
    description: string;
    author: string;
    license: string;
    homepage?: string;
    repository?: string;
    keywords: string[];
    category: 'character' | 'chat' | 'ui' | 'ai' | 'utility' | 'theme';
    permissions: ExtensionPermission[];
    dependencies: Record<string, string>;
    metadata: Record<string, any>;
    manifest: ExtensionManifest;
    isInstalled: boolean;
    isEnabled: boolean;
    isOfficial: boolean;
    installPath?: string;
    installedAt?: Date;
    updatedAt?: Date;
}
export interface ExtensionManifest {
    name: string;
    version: string;
    description: string;
    main: string;
    author: string;
    license: string;
    tavernAIVersion: string;
    permissions: string[];
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
    keywords?: string[];
    category: string;
    metadata?: Record<string, any>;
}
export interface ExtensionPermission {
    name: string;
    description: string;
    level: 'low' | 'medium' | 'high' | 'critical';
    granted: boolean;
}
export interface InstallOptions {
    source: 'marketplace' | 'file' | 'git' | 'npm';
    version?: string;
    skipPermissionCheck?: boolean;
    skipDependencyCheck?: boolean;
}
export interface ExtensionStats {
    totalInstalled: number;
    totalEnabled: number;
    byCategory: Record<string, number>;
    diskUsage: number;
    memoryUsage: number;
}
export declare class ExtensionService {
    private extensionsPath;
    private loadedExtensions;
    constructor();
    /**
     * Initialize extension service
     */
    initialize(): Promise<void>;
    /**
     * Install extension from marketplace
     */
    installExtension(extensionId: string, userId: string, options?: InstallOptions): Promise<Extension>;
    /**
     * Uninstall extension
     */
    uninstallExtension(extensionId: string, userId: string): Promise<boolean>;
    /**
     * Enable extension
     */
    enableExtension(extensionId: string, userId: string): Promise<boolean>;
    /**
     * Disable extension
     */
    disableExtension(extensionId: string, userId: string): Promise<boolean>;
    /**
     * Update extension
     */
    updateExtension(extensionId: string, userId: string, targetVersion?: string): Promise<Extension | null>;
    /**
     * Get installed extensions
     */
    getInstalledExtensions(userId?: string, filter?: {
        category?: string;
        enabled?: boolean;
        search?: string;
    }): Promise<Extension[]>;
    /**
     * Get extension statistics
     */
    getStats(): Promise<ExtensionStats>;
    /**
     * Batch operations
     */
    batchOperation(extensionIds: string[], operation: 'enable' | 'disable' | 'uninstall', userId: string): Promise<{
        success: string[];
        failed: string[];
    }>;
    private ensureExtensionsDirectory;
    private loadInstalledExtensions;
    private validateExtensions;
    private getInstalledExtension;
    private getExtensionInfo;
    private checkPermissions;
    private installDependencies;
    private downloadExtension;
    private validateManifest;
    private loadExtensionCode;
    private unloadExtensionCode;
    private backupExtension;
    private restoreExtension;
    private cleanupFailedInstallation;
    private calculateDirectorySize;
    private getPermissionDescription;
    private getPermissionLevel;
    private mapPrismaExtension;
}
export declare const extensionService: ExtensionService;
//# sourceMappingURL=ExtensionService.d.ts.map