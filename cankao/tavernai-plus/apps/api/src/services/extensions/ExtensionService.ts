import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import semver from 'semver';
import { prisma } from '../../database';
import { logger } from '../../utils/logger';
import { sandboxService } from './SandboxService';

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

export class ExtensionService {
  private extensionsPath: string;
  private loadedExtensions: Map<string, Extension> = new Map();

  constructor() {
    this.extensionsPath = path.join(process.cwd(), 'extensions');
    this.ensureExtensionsDirectory();
  }

  /**
   * Initialize extension service
   */
  public async initialize(): Promise<void> {
    try {
      await this.ensureExtensionsDirectory();
      await this.loadInstalledExtensions();
      await this.validateExtensions();

      logger.info('Extension service initialized', {
        totalExtensions: this.loadedExtensions.size,
        extensionsPath: this.extensionsPath
      });
    } catch (error) {
      logger.error('Failed to initialize extension service', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Install extension from marketplace
   */
  public async installExtension(
    extensionId: string,
    userId: string,
    options: InstallOptions = { source: 'marketplace' }
  ): Promise<Extension> {
    try {
      logger.info('Installing extension', { extensionId, userId, options });

      // Check if already installed
      const existing = await this.getInstalledExtension(extensionId);
      if (existing) {
        throw new Error(`Extension ${extensionId} is already installed`);
      }

      // Get extension info from marketplace or source
      const extensionInfo = await this.getExtensionInfo(extensionId, options.source);

      // Version compatibility check
      if (options.version) {
        if (!semver.satisfies(options.version, extensionInfo.tavernAIVersion)) {
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
      const extension = await prisma.extension.create({
        data: {
          id: extensionId,
          name: manifest.name,
          displayName: manifest.name,
          version: manifest.version,
          description: manifest.description,
          author: manifest.author,
          license: manifest.license,
          keywords: manifest.keywords || [],
          category: manifest.category as any,
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

      logger.info('Extension installed successfully', {
        extensionId,
        version: manifest.version,
        userId
      });

      return loadedExtension;
    } catch (error) {
      logger.error('Failed to install extension', {
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
  public async uninstallExtension(extensionId: string, userId: string): Promise<boolean> {
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
        await fs.rm(extension.installPath, { recursive: true, force: true });
      }

      // Remove from database
      await prisma.extension.delete({
        where: { id: extensionId }
      });

      // Remove from memory
      this.loadedExtensions.delete(extensionId);

      logger.info('Extension uninstalled successfully', {
        extensionId,
        userId
      });

      return true;
    } catch (error) {
      logger.error('Failed to uninstall extension', {
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
  public async enableExtension(extensionId: string, userId: string): Promise<boolean> {
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
      await prisma.extension.update({
        where: { id: extensionId },
        data: {
          isEnabled: true,
          updatedAt: new Date()
        }
      });

      // Update memory
      extension.isEnabled = true;
      this.loadedExtensions.set(extensionId, extension);

      logger.info('Extension enabled', { extensionId, userId });
      return true;
    } catch (error) {
      logger.error('Failed to enable extension', {
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
  public async disableExtension(extensionId: string, userId: string): Promise<boolean> {
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
      await prisma.extension.update({
        where: { id: extensionId },
        data: {
          isEnabled: false,
          updatedAt: new Date()
        }
      });

      // Update memory
      extension.isEnabled = false;
      this.loadedExtensions.set(extensionId, extension);

      logger.info('Extension disabled', { extensionId, userId });
      return true;
    } catch (error) {
      logger.error('Failed to disable extension', {
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
  public async updateExtension(
    extensionId: string,
    userId: string,
    targetVersion?: string
  ): Promise<Extension | null> {
    try {
      const currentExtension = await this.getInstalledExtension(extensionId);
      if (!currentExtension) {
        throw new Error(`Extension ${extensionId} is not installed`);
      }

      // Get latest version info
      const latestInfo = await this.getExtensionInfo(extensionId, 'marketplace');
      const newVersion = targetVersion || latestInfo.version;

      if (semver.lte(newVersion, currentExtension.version)) {
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
        const updatedExtension = await prisma.extension.update({
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
        await fs.rm(backupPath, { recursive: true, force: true });

        logger.info('Extension updated successfully', {
          extensionId,
          fromVersion: currentExtension.version,
          toVersion: newVersion,
          userId
        });

        return loadedExtension;
      } catch (error) {
        // Restore backup on failure
        await this.restoreExtension(extensionId, backupPath);
        throw error;
      }
    } catch (error) {
      logger.error('Failed to update extension', {
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
  public async getInstalledExtensions(
    userId?: string,
    filter?: {
      category?: string;
      enabled?: boolean;
      search?: string;
    }
  ): Promise<Extension[]> {
    try {
      const where: any = { isInstalled: true };

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

      const extensions = await prisma.extension.findMany({
        where,
        orderBy: { installedAt: 'desc' }
      });

      return extensions.map(ext => this.mapPrismaExtension(ext));
    } catch (error) {
      logger.error('Failed to get installed extensions', {
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
  public async getStats(): Promise<ExtensionStats> {
    try {
      const [totalInstalled, totalEnabled, categoryStats] = await Promise.all([
        prisma.extension.count({ where: { isInstalled: true } }),
        prisma.extension.count({ where: { isInstalled: true, isEnabled: true } }),
        prisma.extension.groupBy({
          by: ['category'],
          where: { isInstalled: true },
          _count: { category: true }
        })
      ]);

      const byCategory = categoryStats.reduce((acc, stat) => {
        acc[stat.category] = stat._count.category;
        return acc;
      }, {} as Record<string, number>);

      // Calculate disk usage
      let diskUsage = 0;
      try {
        const stats = await fs.readdir(this.extensionsPath);
        for (const dir of stats) {
          const dirPath = path.join(this.extensionsPath, dir);
          const stat = await fs.stat(dirPath);
          if (stat.isDirectory()) {
            diskUsage += await this.calculateDirectorySize(dirPath);
          }
        }
      } catch (error) {
        logger.warn('Failed to calculate disk usage', { error });
      }

      return {
        totalInstalled,
        totalEnabled,
        byCategory,
        diskUsage,
        memoryUsage: process.memoryUsage().heapUsed // Simplified
      };
    } catch (error) {
      logger.error('Failed to get extension stats', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Batch operations
   */
  public async batchOperation(
    extensionIds: string[],
    operation: 'enable' | 'disable' | 'uninstall',
    userId: string
  ): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

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
        } else {
          failed.push(extensionId);
        }
      } catch (error) {
        failed.push(extensionId);
        logger.error(`Batch operation failed for extension ${extensionId}`, {
          operation,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    logger.info('Batch operation completed', {
      operation,
      total: extensionIds.length,
      success: success.length,
      failed: failed.length
    });

    return { success, failed };
  }

  // Private helper methods
  private async ensureExtensionsDirectory(): Promise<void> {
    try {
      await fs.access(this.extensionsPath);
    } catch {
      await fs.mkdir(this.extensionsPath, { recursive: true });
    }
  }

  private async loadInstalledExtensions(): Promise<void> {
    const extensions = await prisma.extension.findMany({
      where: { isInstalled: true }
    });

    for (const extension of extensions) {
      this.loadedExtensions.set(extension.id, this.mapPrismaExtension(extension));
    }
  }

  private async validateExtensions(): Promise<void> {
    for (const [extensionId, extension] of this.loadedExtensions.entries()) {
      try {
        if (extension.installPath) {
          await fs.access(extension.installPath);
          await this.validateManifest(extension.installPath);
        }
      } catch (error) {
        logger.warn(`Extension ${extensionId} validation failed`, { error });
        // Mark as not installed in database
        await prisma.extension.update({
          where: { id: extensionId },
          data: { isInstalled: false, isEnabled: false }
        });
        this.loadedExtensions.delete(extensionId);
      }
    }
  }

  private async getInstalledExtension(extensionId: string): Promise<Extension | null> {
    return this.loadedExtensions.get(extensionId) || null;
  }

  private async getExtensionInfo(extensionId: string, source: string): Promise<any> {
    // Simplified - in real implementation, this would fetch from marketplace API
    return {
      id: extensionId,
      version: '1.0.0',
      tavernAIVersion: '>=1.0.0',
      permissions: ['storage.read', 'network.fetch']
    };
  }

  private async checkPermissions(extensionInfo: any, userId: string): Promise<void> {
    // Permission validation logic
    const highRiskPermissions = extensionInfo.permissions.filter((perm: string) =>
      this.getPermissionLevel(perm) === 'critical'
    );

    if (highRiskPermissions.length > 0) {
      // In real implementation, this would prompt user for permission
      logger.warn('Extension requires high-risk permissions', {
        extensionId: extensionInfo.id,
        permissions: highRiskPermissions
      });
    }
  }

  private async installDependencies(extensionInfo: any): Promise<void> {
    // Dependency installation logic
    if (extensionInfo.dependencies) {
      for (const [dep, version] of Object.entries(extensionInfo.dependencies)) {
        logger.debug(`Installing dependency: ${dep}@${version}`);
        // In real implementation, this would install npm packages or other extensions
      }
    }
  }

  private async downloadExtension(extensionId: string, options: InstallOptions): Promise<string> {
    // Simplified download logic
    const installPath = path.join(this.extensionsPath, extensionId);
    await fs.mkdir(installPath, { recursive: true });

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

    await fs.writeFile(
      path.join(installPath, 'package.json'),
      JSON.stringify(manifestContent, null, 2)
    );

    return installPath;
  }

  private async validateManifest(installPath: string): Promise<ExtensionManifest> {
    const manifestPath = path.join(installPath, 'package.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
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

  private async loadExtensionCode(extension: Extension): Promise<void> {
    if (!extension.installPath) return;

    // In real implementation, this would load the extension code into sandbox
    logger.debug(`Loading extension code: ${extension.id}`);
  }

  private async unloadExtensionCode(extension: Extension): Promise<void> {
    // In real implementation, this would unload the extension code from sandbox
    logger.debug(`Unloading extension code: ${extension.id}`);
  }

  private async backupExtension(extensionId: string): Promise<string> {
    const backupPath = path.join(this.extensionsPath, `.backup_${extensionId}_${Date.now()}`);
    const extension = this.loadedExtensions.get(extensionId);

    if (extension?.installPath) {
      await fs.cp(extension.installPath, backupPath, { recursive: true });
    }

    return backupPath;
  }

  private async restoreExtension(extensionId: string, backupPath: string): Promise<void> {
    const extension = this.loadedExtensions.get(extensionId);

    if (extension?.installPath) {
      await fs.rm(extension.installPath, { recursive: true, force: true });
      await fs.cp(backupPath, extension.installPath, { recursive: true });
    }
  }

  private async cleanupFailedInstallation(extensionId: string): Promise<void> {
    const installPath = path.join(this.extensionsPath, extensionId);
    await fs.rm(installPath, { recursive: true, force: true });
  }

  private async calculateDirectorySize(dirPath: string): Promise<number> {
    let size = 0;
    const items = await fs.readdir(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = await fs.stat(itemPath);

      if (stats.isDirectory()) {
        size += await this.calculateDirectorySize(itemPath);
      } else {
        size += stats.size;
      }
    }

    return size;
  }

  private getPermissionDescription(permission: string): string {
    const descriptions: Record<string, string> = {
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

  private getPermissionLevel(permission: string): 'low' | 'medium' | 'high' | 'critical' {
    const levels: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
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

  private mapPrismaExtension(extension: any): Extension {
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

// Singleton instance
export const extensionService = new ExtensionService();