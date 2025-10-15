"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extensionService = exports.ExtensionService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const database_1 = require("../../database");
const logger_1 = require("../../utils/logger");
class ExtensionService {
    extensionsPath;
    loadedExtensions = new Map();
    constructor() {
        this.extensionsPath = path_1.default.join(process.cwd(), 'extensions');
        this.ensureExtensionsDirectory();
    }
    /**
     * Initialize extension service
     */
    async initialize() {
        try {
            await this.ensureExtensionsDirectory();
            await this.loadInstalledExtensions();
            await this.validateExtensions();
            logger_1.logger.info('Extension service initialized', {
                totalExtensions: this.loadedExtensions.size,
                extensionsPath: this.extensionsPath
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize extension service', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Install extension from marketplace
     */
    async installExtension(extensionId, userId, options = { source: 'marketplace' }) {
        try {
            logger_1.logger.info('Installing extension', { extensionId, userId, options });
            // Check if already installed
            const existing = await this.getInstalledExtension(extensionId);
            if (existing) {
                throw new Error(`Extension ${extensionId} is already installed`);
            }
            // Get extension info from marketplace or source
            const extensionInfo = await this.getExtensionInfo(extensionId, options.source);
            // Version compatibility check
            if (options.version) {
                if (!semver_1.default.satisfies(options.version, extensionInfo.tavernAIVersion)) {
                    throw new Error(`Extension version ${options.version} is not compatible with TavernAI Plus`);
                }
            }
            // Permission check
            if (!options.skipPermissionCheck) {
                await this.checkPermissions(extensionInfo, userId);
            }
            // Dependency check and installation
            if (!options.skipDependencyCheck) {
                await this.installDependencies(extensionInfo);
            }
            // Download and extract extension
            const installPath = await this.downloadExtension(extensionId, options);
            // Validate manifest
            const manifest = await this.validateManifest(installPath);
            // Register in database
            const extension = await database_1.prisma.extension.create({
                data: {
                    id: extensionId,
                    name: manifest.name,
                    displayName: manifest.name,
                    version: manifest.version,
                    description: manifest.description,
                    author: manifest.author,
                    license: manifest.license,
                    keywords: manifest.keywords || [],
                    category: manifest.category,
                    permissions: manifest.permissions.map(perm => ({
                        name: perm,
                        description: this.getPermissionDescription(perm),
                        level: this.getPermissionLevel(perm),
                        granted: true
                    })),
                    dependencies: manifest.dependencies || {},
                    metadata: manifest.metadata || {},
                    manifest,
                    isInstalled: true,
                    isEnabled: false,
                    isOfficial: options.source === 'marketplace',
                    installPath,
                    installedAt: new Date(),
                    installedBy: userId
                }
            });
            // Load extension into memory
            const loadedExtension = this.mapPrismaExtension(extension);
            this.loadedExtensions.set(extensionId, loadedExtension);
            logger_1.logger.info('Extension installed successfully', {
                extensionId,
                version: manifest.version,
                userId
            });
            return loadedExtension;
        }
        catch (error) {
            logger_1.logger.error('Failed to install extension', {
                extensionId,
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            // Cleanup on failure
            await this.cleanupFailedInstallation(extensionId);
            throw error;
        }
    }
    /**
     * Uninstall extension
     */
    async uninstallExtension(extensionId, userId) {
        try {
            const extension = await this.getInstalledExtension(extensionId);
            if (!extension) {
                throw new Error(`Extension ${extensionId} is not installed`);
            }
            // Disable first if enabled
            if (extension.isEnabled) {
                await this.disableExtension(extensionId, userId);
            }
            // Remove files
            if (extension.installPath) {
                await promises_1.default.rm(extension.installPath, { recursive: true, force: true });
            }
            // Remove from database
            await database_1.prisma.extension.delete({
                where: { id: extensionId }
            });
            // Remove from memory
            this.loadedExtensions.delete(extensionId);
            logger_1.logger.info('Extension uninstalled successfully', {
                extensionId,
                userId
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to uninstall extension', {
                extensionId,
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    /**
     * Enable extension
     */
    async enableExtension(extensionId, userId) {
        try {
            const extension = await this.getInstalledExtension(extensionId);
            if (!extension) {
                throw new Error(`Extension ${extensionId} is not installed`);
            }
            if (extension.isEnabled) {
                return true; // Already enabled
            }
            // Load and validate extension code
            await this.loadExtensionCode(extension);
            // Update database
            await database_1.prisma.extension.update({
                where: { id: extensionId },
                data: {
                    isEnabled: true,
                    updatedAt: new Date()
                }
            });
            // Update memory
            extension.isEnabled = true;
            this.loadedExtensions.set(extensionId, extension);
            logger_1.logger.info('Extension enabled', { extensionId, userId });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to enable extension', {
                extensionId,
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    /**
     * Disable extension
     */
    async disableExtension(extensionId, userId) {
        try {
            const extension = await this.getInstalledExtension(extensionId);
            if (!extension) {
                throw new Error(`Extension ${extensionId} is not installed`);
            }
            if (!extension.isEnabled) {
                return true; // Already disabled
            }
            // Unload extension code
            await this.unloadExtensionCode(extension);
            // Update database
            await database_1.prisma.extension.update({
                where: { id: extensionId },
                data: {
                    isEnabled: false,
                    updatedAt: new Date()
                }
            });
            // Update memory
            extension.isEnabled = false;
            this.loadedExtensions.set(extensionId, extension);
            logger_1.logger.info('Extension disabled', { extensionId, userId });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to disable extension', {
                extensionId,
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    /**
     * Update extension
     */
    async updateExtension(extensionId, userId, targetVersion) {
        try {
            const currentExtension = await this.getInstalledExtension(extensionId);
            if (!currentExtension) {
                throw new Error(`Extension ${extensionId} is not installed`);
            }
            // Get latest version info
            const latestInfo = await this.getExtensionInfo(extensionId, 'marketplace');
            const newVersion = targetVersion || latestInfo.version;
            if (semver_1.default.lte(newVersion, currentExtension.version)) {
                throw new Error(`Target version ${newVersion} is not newer than current version ${currentExtension.version}`);
            }
            // Backup current extension
            const backupPath = await this.backupExtension(extensionId);
            try {
                // Disable current extension
                if (currentExtension.isEnabled) {
                    await this.disableExtension(extensionId, userId);
                }
                // Download new version
                const newInstallPath = await this.downloadExtension(extensionId, {
                    source: 'marketplace',
                    version: newVersion
                });
                // Validate new manifest
                const newManifest = await this.validateManifest(newInstallPath);
                // Update database
                const updatedExtension = await database_1.prisma.extension.update({
                    where: { id: extensionId },
                    data: {
                        version: newManifest.version,
                        description: newManifest.description,
                        permissions: newManifest.permissions.map(perm => ({
                            name: perm,
                            description: this.getPermissionDescription(perm),
                            level: this.getPermissionLevel(perm),
                            granted: true
                        })),
                        dependencies: newManifest.dependencies || {},
                        metadata: newManifest.metadata || {},
                        manifest: newManifest,
                        installPath: newInstallPath,
                        updatedAt: new Date()
                    }
                });
                // Update memory
                const loadedExtension = this.mapPrismaExtension(updatedExtension);
                this.loadedExtensions.set(extensionId, loadedExtension);
                // Re-enable if it was enabled
                if (currentExtension.isEnabled) {
                    await this.enableExtension(extensionId, userId);
                }
                // Cleanup backup
                await promises_1.default.rm(backupPath, { recursive: true, force: true });
                logger_1.logger.info('Extension updated successfully', {
                    extensionId,
                    fromVersion: currentExtension.version,
                    toVersion: newVersion,
                    userId
                });
                return loadedExtension;
            }
            catch (error) {
                // Restore backup on failure
                await this.restoreExtension(extensionId, backupPath);
                throw error;
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to update extension', {
                extensionId,
                targetVersion,
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            return null;
        }
    }
    /**
     * Get installed extensions
     */
    async getInstalledExtensions(userId, filter) {
        try {
            const where = { isInstalled: true };
            if (filter?.category) {
                where.category = filter.category;
            }
            if (filter?.enabled !== undefined) {
                where.isEnabled = filter.enabled;
            }
            if (filter?.search) {
                where.OR = [
                    { name: { contains: filter.search, mode: 'insensitive' } },
                    { displayName: { contains: filter.search, mode: 'insensitive' } },
                    { description: { contains: filter.search, mode: 'insensitive' } }
                ];
            }
            const extensions = await database_1.prisma.extension.findMany({
                where,
                orderBy: { installedAt: 'desc' }
            });
            return extensions.map(ext => this.mapPrismaExtension(ext));
        }
        catch (error) {
            logger_1.logger.error('Failed to get installed extensions', {
                userId,
                filter,
                error: error instanceof Error ? error.message : String(error)
            });
            return [];
        }
    }
    /**
     * Get extension statistics
     */
    async getStats() {
        try {
            const [totalInstalled, totalEnabled, categoryStats] = await Promise.all([
                database_1.prisma.extension.count({ where: { isInstalled: true } }),
                database_1.prisma.extension.count({ where: { isInstalled: true, isEnabled: true } }),
                database_1.prisma.extension.groupBy({
                    by: ['category'],
                    where: { isInstalled: true },
                    _count: { category: true }
                })
            ]);
            const byCategory = categoryStats.reduce((acc, stat) => {
                acc[stat.category] = stat._count.category;
                return acc;
            }, {});
            // Calculate disk usage
            let diskUsage = 0;
            try {
                const stats = await promises_1.default.readdir(this.extensionsPath);
                for (const dir of stats) {
                    const dirPath = path_1.default.join(this.extensionsPath, dir);
                    const stat = await promises_1.default.stat(dirPath);
                    if (stat.isDirectory()) {
                        diskUsage += await this.calculateDirectorySize(dirPath);
                    }
                }
            }
            catch (error) {
                logger_1.logger.warn('Failed to calculate disk usage', { error });
            }
            return {
                totalInstalled,
                totalEnabled,
                byCategory,
                diskUsage,
                memoryUsage: process.memoryUsage().heapUsed // Simplified
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get extension stats', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Batch operations
     */
    async batchOperation(extensionIds, operation, userId) {
        const success = [];
        const failed = [];
        for (const extensionId of extensionIds) {
            try {
                let result = false;
                switch (operation) {
                    case 'enable':
                        result = await this.enableExtension(extensionId, userId);
                        break;
                    case 'disable':
                        result = await this.disableExtension(extensionId, userId);
                        break;
                    case 'uninstall':
                        result = await this.uninstallExtension(extensionId, userId);
                        break;
                }
                if (result) {
                    success.push(extensionId);
                }
                else {
                    failed.push(extensionId);
                }
            }
            catch (error) {
                failed.push(extensionId);
                logger_1.logger.error(`Batch operation failed for extension ${extensionId}`, {
                    operation,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        logger_1.logger.info('Batch operation completed', {
            operation,
            total: extensionIds.length,
            success: success.length,
            failed: failed.length
        });
        return { success, failed };
    }
    // Private helper methods
    async ensureExtensionsDirectory() {
        try {
            await promises_1.default.access(this.extensionsPath);
        }
        catch {
            await promises_1.default.mkdir(this.extensionsPath, { recursive: true });
        }
    }
    async loadInstalledExtensions() {
        const extensions = await database_1.prisma.extension.findMany({
            where: { isInstalled: true }
        });
        for (const extension of extensions) {
            this.loadedExtensions.set(extension.id, this.mapPrismaExtension(extension));
        }
    }
    async validateExtensions() {
        for (const [extensionId, extension] of this.loadedExtensions.entries()) {
            try {
                if (extension.installPath) {
                    await promises_1.default.access(extension.installPath);
                    await this.validateManifest(extension.installPath);
                }
            }
            catch (error) {
                logger_1.logger.warn(`Extension ${extensionId} validation failed`, { error });
                // Mark as not installed in database
                await database_1.prisma.extension.update({
                    where: { id: extensionId },
                    data: { isInstalled: false, isEnabled: false }
                });
                this.loadedExtensions.delete(extensionId);
            }
        }
    }
    async getInstalledExtension(extensionId) {
        return this.loadedExtensions.get(extensionId) || null;
    }
    async getExtensionInfo(extensionId, source) {
        // Simplified - in real implementation, this would fetch from marketplace API
        return {
            id: extensionId,
            version: '1.0.0',
            tavernAIVersion: '>=1.0.0',
            permissions: ['storage.read', 'network.fetch']
        };
    }
    async checkPermissions(extensionInfo, userId) {
        // Permission validation logic
        const highRiskPermissions = extensionInfo.permissions.filter((perm) => this.getPermissionLevel(perm) === 'critical');
        if (highRiskPermissions.length > 0) {
            // In real implementation, this would prompt user for permission
            logger_1.logger.warn('Extension requires high-risk permissions', {
                extensionId: extensionInfo.id,
                permissions: highRiskPermissions
            });
        }
    }
    async installDependencies(extensionInfo) {
        // Dependency installation logic
        if (extensionInfo.dependencies) {
            for (const [dep, version] of Object.entries(extensionInfo.dependencies)) {
                logger_1.logger.debug(`Installing dependency: ${dep}@${version}`);
                // In real implementation, this would install npm packages or other extensions
            }
        }
    }
    async downloadExtension(extensionId, options) {
        // Simplified download logic
        const installPath = path_1.default.join(this.extensionsPath, extensionId);
        await promises_1.default.mkdir(installPath, { recursive: true });
        // In real implementation, this would download from marketplace, git, or npm
        const manifestContent = {
            name: extensionId,
            version: options.version || '1.0.0',
            description: 'Sample extension',
            main: 'index.js',
            author: 'TavernAI',
            license: 'MIT',
            tavernAIVersion: '>=1.0.0',
            permissions: ['storage.read'],
            category: 'utility'
        };
        await promises_1.default.writeFile(path_1.default.join(installPath, 'package.json'), JSON.stringify(manifestContent, null, 2));
        return installPath;
    }
    async validateManifest(installPath) {
        const manifestPath = path_1.default.join(installPath, 'package.json');
        const manifestContent = await promises_1.default.readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);
        // Validate required fields
        const requiredFields = ['name', 'version', 'description', 'main', 'author'];
        for (const field of requiredFields) {
            if (!manifest[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        return manifest;
    }
    async loadExtensionCode(extension) {
        if (!extension.installPath)
            return;
        // In real implementation, this would load the extension code into sandbox
        logger_1.logger.debug(`Loading extension code: ${extension.id}`);
    }
    async unloadExtensionCode(extension) {
        // In real implementation, this would unload the extension code from sandbox
        logger_1.logger.debug(`Unloading extension code: ${extension.id}`);
    }
    async backupExtension(extensionId) {
        const backupPath = path_1.default.join(this.extensionsPath, `.backup_${extensionId}_${Date.now()}`);
        const extension = this.loadedExtensions.get(extensionId);
        if (extension?.installPath) {
            await promises_1.default.cp(extension.installPath, backupPath, { recursive: true });
        }
        return backupPath;
    }
    async restoreExtension(extensionId, backupPath) {
        const extension = this.loadedExtensions.get(extensionId);
        if (extension?.installPath) {
            await promises_1.default.rm(extension.installPath, { recursive: true, force: true });
            await promises_1.default.cp(backupPath, extension.installPath, { recursive: true });
        }
    }
    async cleanupFailedInstallation(extensionId) {
        const installPath = path_1.default.join(this.extensionsPath, extensionId);
        await promises_1.default.rm(installPath, { recursive: true, force: true });
    }
    async calculateDirectorySize(dirPath) {
        let size = 0;
        const items = await promises_1.default.readdir(dirPath);
        for (const item of items) {
            const itemPath = path_1.default.join(dirPath, item);
            const stats = await promises_1.default.stat(itemPath);
            if (stats.isDirectory()) {
                size += await this.calculateDirectorySize(itemPath);
            }
            else {
                size += stats.size;
            }
        }
        return size;
    }
    getPermissionDescription(permission) {
        const descriptions = {
            'storage.read': 'Read user data and preferences',
            'storage.write': 'Modify user data and preferences',
            'network.fetch': 'Make network requests',
            'filesystem.read': 'Read files from disk',
            'filesystem.write': 'Write files to disk',
            'ui.modify': 'Modify user interface',
            'ai.interact': 'Interact with AI models'
        };
        return descriptions[permission] || 'Unknown permission';
    }
    getPermissionLevel(permission) {
        const levels = {
            'storage.read': 'low',
            'storage.write': 'medium',
            'network.fetch': 'medium',
            'filesystem.read': 'high',
            'filesystem.write': 'critical',
            'ui.modify': 'medium',
            'ai.interact': 'high'
        };
        return levels[permission] || 'medium';
    }
    mapPrismaExtension(extension) {
        return {
            id: extension.id,
            name: extension.name,
            displayName: extension.displayName,
            version: extension.version,
            description: extension.description,
            author: extension.author,
            license: extension.license,
            homepage: extension.homepage,
            repository: extension.repository,
            keywords: extension.keywords || [],
            category: extension.category,
            permissions: extension.permissions || [],
            dependencies: extension.dependencies || {},
            metadata: extension.metadata || {},
            manifest: extension.manifest,
            isInstalled: extension.isInstalled,
            isEnabled: extension.isEnabled,
            isOfficial: extension.isOfficial,
            installPath: extension.installPath,
            installedAt: extension.installedAt,
            updatedAt: extension.updatedAt
        };
    }
}
exports.ExtensionService = ExtensionService;
// Singleton instance
exports.extensionService = new ExtensionService();
//# sourceMappingURL=ExtensionService.js.map