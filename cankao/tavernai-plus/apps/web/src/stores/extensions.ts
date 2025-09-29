import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from './auth'

export interface ExtensionPermission {
  name: string
  displayName: string
  description: string
  level: 'low' | 'medium' | 'high'
  required: boolean
  granted: boolean
}

export interface ExtensionDependency {
  id: string
  name: string
  version: string
  optional: boolean
  satisfied: boolean
}

export interface ExtensionConfig {
  [key: string]: any
}

export interface ExtensionMetadata {
  category: string
  tags: string[]
  author: string
  authorUrl?: string
  homepageUrl?: string
  repositoryUrl?: string
  documentationUrl?: string
  licenseUrl?: string
  compatibility: {
    minVersion: string
    maxVersion?: string
    platforms: string[]
  }
  [key: string]: any
}

export interface ExtensionStats {
  usage: number
  performance: number
  memoryUsage: number
  lastUsed?: Date
  totalCalls: number
  avgResponseTime: number
  errorCount: number
}

export interface InstalledExtension {
  id: string
  name: string
  displayName: string
  version: string
  description: string
  enabled: boolean
  hasUpdate: boolean
  latestVersion?: string
  installDate: Date
  status: 'active' | 'inactive' | 'error' | 'updating'
  error?: string
  config: ExtensionConfig
  permissions: ExtensionPermission[]
  dependencies: ExtensionDependency[]
  stats: ExtensionStats
  metadata: ExtensionMetadata
}

export interface MarketplaceExtension {
  id: string
  name: string
  displayName: string
  description: string
  version: string
  author: string
  category: string
  tags: string[]
  icon?: string
  screenshots: string[]
  downloadUrl: string
  rating: number
  reviewCount: number
  downloadCount: number
  size: number
  createdAt: Date
  updatedAt: Date
  verified: boolean
  featured: boolean
  permissions: string[]
  dependencies: Array<{
    id: string
    version: string
    optional: boolean
  }>
  metadata: ExtensionMetadata
}

export interface ExtensionCategory {
  id: string
  name: string
  description: string
  icon: string
  count: number
}

export interface ExtensionInstallOptions {
  version?: string
  downloadUrl?: string
  permissions?: string[]
  configuration?: ExtensionConfig
  checkPermissions?: boolean
  onProgress?: (progress: number, message: string) => void
}

export interface ExtensionLog {
  id: string
  extensionId: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  timestamp: Date
  context?: Record<string, any>
}

interface ExtensionStore {
  // State
  installedExtensions: InstalledExtension[]
  marketplaceExtensions: MarketplaceExtension[]
  categories: ExtensionCategory[]
  logs: ExtensionLog[]

  // Status
  loading: boolean
  installing: Set<string>
  uninstalling: Set<string>
  updating: Set<string>
  enabling: Set<string>
  disabling: Set<string>

  // Cache
  lastMarketplaceSync: Date | null
  lastCompatibilityCheck: Date | null

  // Settings
  autoUpdate: boolean
  checkUpdatesOnStartup: boolean
  allowPrerelease: boolean
  maxLogEntries: number
}

export const useExtensionStore = defineStore('extensions', () => {
  // Auth store reference
  const authStore = useAuthStore()

  // Reactive state
  const state = reactive<ExtensionStore>({
    installedExtensions: [],
    marketplaceExtensions: [],
    categories: [],
    logs: [],

    loading: false,
    installing: new Set(),
    uninstalling: new Set(),
    updating: new Set(),
    enabling: new Set(),
    disabling: new Set(),

    lastMarketplaceSync: null,
    lastCompatibilityCheck: null,

    autoUpdate: false,
    checkUpdatesOnStartup: true,
    allowPrerelease: false,
    maxLogEntries: 1000
  })

  // Computed properties
  const authToken = computed(() => authStore.token)

  const enabledExtensions = computed(() => {
    return state.installedExtensions.filter(ext => ext.enabled)
  })

  const availableUpdates = computed(() => {
    return state.installedExtensions.filter(ext => ext.hasUpdate)
  })

  const extensionsByCategory = computed(() => {
    const grouped: Record<string, InstalledExtension[]> = {}
    for (const extension of state.installedExtensions) {
      const category = extension.metadata.category || 'other'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(extension)
    }
    return grouped
  })

  const extensionStats = computed(() => {
    return {
      total: state.installedExtensions.length,
      enabled: enabledExtensions.value.length,
      disabled: state.installedExtensions.length - enabledExtensions.value.length,
      hasErrors: state.installedExtensions.filter(ext => ext.status === 'error').length,
      hasUpdates: availableUpdates.value.length
    }
  })

  const recentLogs = computed(() => {
    return state.logs
      .slice(-100)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  })

  // API Helper
  const apiRequest = async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken.value && { 'Authorization': `Bearer ${authToken.value}` }),
      ...options.headers
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API request failed: ${response.statusText}. ${error}`)
    }

    return response.json()
  }

  // Logging
  const addLog = (extensionId: string, level: ExtensionLog['level'], message: string, context?: Record<string, any>) => {
    const log: ExtensionLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      extensionId,
      level,
      message,
      timestamp: new Date(),
      context
    }

    state.logs.push(log)

    // Keep only the most recent logs
    if (state.logs.length > state.maxLogEntries) {
      state.logs.splice(0, state.logs.length - state.maxLogEntries)
    }

    console.log(`[Extension ${extensionId}] ${level.toUpperCase()}: ${message}`, context)
  }

  // Actions - Loading and syncing
  const loadInstalledExtensions = async (): Promise<void> => {
    try {
      state.loading = true
      addLog('system', 'info', 'Loading installed extensions')

      const data = await apiRequest('/api/extensions/installed')

      state.installedExtensions = data.extensions.map((ext: any) => ({
        ...ext,
        installDate: new Date(ext.installDate),
        stats: {
          ...ext.stats,
          lastUsed: ext.stats.lastUsed ? new Date(ext.stats.lastUsed) : undefined
        }
      }))

      addLog('system', 'info', `Loaded ${state.installedExtensions.length} installed extensions`)
    } catch (error) {
      addLog('system', 'error', 'Failed to load installed extensions', { error })
      throw error
    } finally {
      state.loading = false
    }
  }

  const syncMarketplace = async (force = false): Promise<void> => {
    const shouldSync = force ||
      !state.lastMarketplaceSync ||
      Date.now() - state.lastMarketplaceSync.getTime() > 1000 * 60 * 30 // 30 minutes

    if (!shouldSync) return

    try {
      state.loading = true
      addLog('system', 'info', 'Syncing marketplace data')

      const data = await apiRequest('/api/extensions/marketplace')

      state.marketplaceExtensions = data.extensions.map((ext: any) => ({
        ...ext,
        createdAt: new Date(ext.createdAt),
        updatedAt: new Date(ext.updatedAt)
      }))

      state.categories = data.categories || []
      state.lastMarketplaceSync = new Date()

      addLog('system', 'info', `Synced ${state.marketplaceExtensions.length} marketplace extensions`)
    } catch (error) {
      addLog('system', 'error', 'Failed to sync marketplace', { error })
      throw error
    } finally {
      state.loading = false
    }
  }

  // Actions - Installation and management
  const installExtension = async (extensionId: string, options: ExtensionInstallOptions = {}): Promise<InstalledExtension> => {
    if (state.installing.has(extensionId)) {
      throw new Error('Extension is already being installed')
    }

    try {
      state.installing.add(extensionId)
      addLog(extensionId, 'info', 'Starting extension installation', options)

      const requestBody = {
        extensionId,
        version: options.version,
        downloadUrl: options.downloadUrl,
        permissions: options.permissions,
        configuration: options.configuration,
        checkPermissions: options.checkPermissions ?? true
      }

      options.onProgress?.(10, 'Downloading extension...')

      const data = await apiRequest('/api/extensions/install', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      options.onProgress?.(50, 'Installing dependencies...')

      // Simulate progress updates
      await new Promise(resolve => setTimeout(resolve, 1000))
      options.onProgress?.(80, 'Configuring extension...')

      await new Promise(resolve => setTimeout(resolve, 500))
      options.onProgress?.(100, 'Installation complete')

      const installedExtension: InstalledExtension = {
        ...data.extension,
        installDate: new Date(data.extension.installDate),
        stats: {
          ...data.extension.stats,
          lastUsed: data.extension.stats.lastUsed ? new Date(data.extension.stats.lastUsed) : undefined
        }
      }

      // Add to installed extensions
      const existingIndex = state.installedExtensions.findIndex(ext => ext.id === extensionId)
      if (existingIndex >= 0) {
        state.installedExtensions[existingIndex] = installedExtension
      } else {
        state.installedExtensions.push(installedExtension)
      }

      addLog(extensionId, 'info', 'Extension installed successfully')
      return installedExtension

    } catch (error) {
      addLog(extensionId, 'error', 'Extension installation failed', { error })
      throw error
    } finally {
      state.installing.delete(extensionId)
    }
  }

  const uninstallExtension = async (extensionId: string): Promise<void> => {
    if (state.uninstalling.has(extensionId)) {
      throw new Error('Extension is already being uninstalled')
    }

    try {
      state.uninstalling.add(extensionId)
      addLog(extensionId, 'info', 'Starting extension uninstallation')

      await apiRequest(`/api/extensions/${extensionId}/uninstall`, {
        method: 'DELETE'
      })

      // Remove from installed extensions
      const index = state.installedExtensions.findIndex(ext => ext.id === extensionId)
      if (index >= 0) {
        state.installedExtensions.splice(index, 1)
      }

      addLog(extensionId, 'info', 'Extension uninstalled successfully')
    } catch (error) {
      addLog(extensionId, 'error', 'Extension uninstallation failed', { error })
      throw error
    } finally {
      state.uninstalling.delete(extensionId)
    }
  }

  const updateExtension = async (extensionId: string): Promise<InstalledExtension> => {
    if (state.updating.has(extensionId)) {
      throw new Error('Extension is already being updated')
    }

    try {
      state.updating.add(extensionId)
      addLog(extensionId, 'info', 'Starting extension update')

      const data = await apiRequest(`/api/extensions/${extensionId}/update`, {
        method: 'POST'
      })

      const updatedExtension: InstalledExtension = {
        ...data.extension,
        installDate: new Date(data.extension.installDate),
        stats: {
          ...data.extension.stats,
          lastUsed: data.extension.stats.lastUsed ? new Date(data.extension.stats.lastUsed) : undefined
        }
      }

      // Update in installed extensions
      const index = state.installedExtensions.findIndex(ext => ext.id === extensionId)
      if (index >= 0) {
        state.installedExtensions[index] = updatedExtension
      }

      addLog(extensionId, 'info', 'Extension updated successfully')
      return updatedExtension

    } catch (error) {
      addLog(extensionId, 'error', 'Extension update failed', { error })
      throw error
    } finally {
      state.updating.delete(extensionId)
    }
  }

  const enableExtension = async (extensionId: string): Promise<void> => {
    if (state.enabling.has(extensionId)) {
      throw new Error('Extension is already being enabled')
    }

    try {
      state.enabling.add(extensionId)
      addLog(extensionId, 'info', 'Enabling extension')

      await apiRequest(`/api/extensions/${extensionId}/enable`, {
        method: 'POST'
      })

      // Update extension status
      const extension = state.installedExtensions.find(ext => ext.id === extensionId)
      if (extension) {
        extension.enabled = true
        extension.status = 'active'
      }

      addLog(extensionId, 'info', 'Extension enabled successfully')
    } catch (error) {
      addLog(extensionId, 'error', 'Failed to enable extension', { error })
      throw error
    } finally {
      state.enabling.delete(extensionId)
    }
  }

  const disableExtension = async (extensionId: string): Promise<void> => {
    if (state.disabling.has(extensionId)) {
      throw new Error('Extension is already being disabled')
    }

    try {
      state.disabling.add(extensionId)
      addLog(extensionId, 'info', 'Disabling extension')

      await apiRequest(`/api/extensions/${extensionId}/disable`, {
        method: 'POST'
      })

      // Update extension status
      const extension = state.installedExtensions.find(ext => ext.id === extensionId)
      if (extension) {
        extension.enabled = false
        extension.status = 'inactive'
      }

      addLog(extensionId, 'info', 'Extension disabled successfully')
    } catch (error) {
      addLog(extensionId, 'error', 'Failed to disable extension', { error })
      throw error
    } finally {
      state.disabling.delete(extensionId)
    }
  }

  // Actions - Configuration
  const updateExtensionConfig = async (extensionId: string, config: ExtensionConfig): Promise<void> => {
    try {
      addLog(extensionId, 'info', 'Updating extension configuration')

      await apiRequest(`/api/extensions/${extensionId}/config`, {
        method: 'PUT',
        body: JSON.stringify({ config })
      })

      // Update extension config
      const extension = state.installedExtensions.find(ext => ext.id === extensionId)
      if (extension) {
        extension.config = { ...extension.config, ...config }
      }

      addLog(extensionId, 'info', 'Extension configuration updated successfully')
    } catch (error) {
      addLog(extensionId, 'error', 'Failed to update extension configuration', { error })
      throw error
    }
  }

  const getExtensionConfig = (extensionId: string): ExtensionConfig | null => {
    const extension = state.installedExtensions.find(ext => ext.id === extensionId)
    return extension?.config || null
  }

  // Actions - Updates and compatibility
  const checkForUpdates = async (): Promise<number> => {
    try {
      addLog('system', 'info', 'Checking for extension updates')

      const data = await apiRequest('/api/extensions/check-updates', {
        method: 'POST',
        body: JSON.stringify({
          extensions: state.installedExtensions.map(ext => ({
            id: ext.id,
            version: ext.version
          }))
        })
      })

      let updateCount = 0
      for (const update of data.updates) {
        const extension = state.installedExtensions.find(ext => ext.id === update.extensionId)
        if (extension) {
          extension.hasUpdate = true
          extension.latestVersion = update.latestVersion
          updateCount++
        }
      }

      addLog('system', 'info', `Found ${updateCount} available updates`)
      return updateCount

    } catch (error) {
      addLog('system', 'error', 'Failed to check for updates', { error })
      throw error
    }
  }

  const checkCompatibility = async (extensionId: string, version?: string): Promise<any> => {
    try {
      addLog(extensionId, 'info', 'Checking extension compatibility')

      const data = await apiRequest('/api/extensions/compatibility', {
        method: 'POST',
        body: JSON.stringify({
          extensionId,
          version: version || 'latest'
        })
      })

      addLog(extensionId, 'info', 'Compatibility check completed')
      return data

    } catch (error) {
      addLog(extensionId, 'error', 'Compatibility check failed', { error })
      throw error
    }
  }

  // Actions - Import/Export
  const exportConfig = (): any => {
    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      settings: {
        autoUpdate: state.autoUpdate,
        checkUpdatesOnStartup: state.checkUpdatesOnStartup,
        allowPrerelease: state.allowPrerelease
      },
      extensions: state.installedExtensions.map(ext => ({
        id: ext.id,
        name: ext.name,
        version: ext.version,
        enabled: ext.enabled,
        config: ext.config,
        permissions: ext.permissions.filter(p => p.granted).map(p => p.name)
      }))
    }
  }

  const importConfig = async (config: any): Promise<{ imported: number; errors: string[] }> => {
    const results = { imported: 0, errors: [] as string[] }

    try {
      addLog('system', 'info', 'Starting configuration import')

      // Import settings
      if (config.settings) {
        state.autoUpdate = config.settings.autoUpdate ?? state.autoUpdate
        state.checkUpdatesOnStartup = config.settings.checkUpdatesOnStartup ?? state.checkUpdatesOnStartup
        state.allowPrerelease = config.settings.allowPrerelease ?? state.allowPrerelease
      }

      // Import extensions
      for (const extConfig of config.extensions || []) {
        try {
          const existingExt = state.installedExtensions.find(ext => ext.id === extConfig.id)

          if (existingExt) {
            // Update existing extension
            if (extConfig.enabled !== undefined) {
              if (extConfig.enabled && !existingExt.enabled) {
                await enableExtension(extConfig.id)
              } else if (!extConfig.enabled && existingExt.enabled) {
                await disableExtension(extConfig.id)
              }
            }
            if (extConfig.config) {
              await updateExtensionConfig(extConfig.id, extConfig.config)
            }
          } else {
            // Install new extension
            await installExtension(extConfig.id, {
              version: extConfig.version,
              permissions: extConfig.permissions,
              configuration: extConfig.config
            })

            if (!extConfig.enabled) {
              await disableExtension(extConfig.id)
            }
          }

          results.imported++
        } catch (error) {
          const errorMsg = `Failed to import ${extConfig.name || extConfig.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          results.errors.push(errorMsg)
          addLog(extConfig.id, 'error', errorMsg)
        }
      }

      addLog('system', 'info', `Configuration import completed: ${results.imported} imported, ${results.errors.length} errors`)
      return results

    } catch (error) {
      addLog('system', 'error', 'Configuration import failed', { error })
      throw error
    }
  }

  // Actions - Logs
  const getExtensionLogs = (extensionId: string, limit = 100): ExtensionLog[] => {
    return state.logs
      .filter(log => log.extensionId === extensionId)
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  const clearLogs = (extensionId?: string): void => {
    if (extensionId) {
      state.logs = state.logs.filter(log => log.extensionId !== extensionId)
      addLog('system', 'info', `Cleared logs for extension ${extensionId}`)
    } else {
      state.logs = []
      addLog('system', 'info', 'Cleared all logs')
    }
  }

  // Utility functions
  const isExtensionInstalled = (extensionId: string): boolean => {
    return state.installedExtensions.some(ext => ext.id === extensionId)
  }

  const getInstalledExtension = (extensionId: string): InstalledExtension | null => {
    return state.installedExtensions.find(ext => ext.id === extensionId) || null
  }

  const getMarketplaceExtension = (extensionId: string): MarketplaceExtension | null => {
    return state.marketplaceExtensions.find(ext => ext.id === extensionId) || null
  }

  // Initialization
  const initialize = async (): Promise<void> => {
    try {
      addLog('system', 'info', 'Initializing extension store')

      await loadInstalledExtensions()

      if (state.checkUpdatesOnStartup) {
        await checkForUpdates()
      }

      addLog('system', 'info', 'Extension store initialized successfully')
    } catch (error) {
      addLog('system', 'error', 'Failed to initialize extension store', { error })
      console.error('Extension store initialization failed:', error)
    }
  }

  return {
    // State
    ...state,

    // Computed
    authToken,
    enabledExtensions,
    availableUpdates,
    extensionsByCategory,
    extensionStats,
    recentLogs,

    // Actions
    loadInstalledExtensions,
    syncMarketplace,
    installExtension,
    uninstallExtension,
    updateExtension,
    enableExtension,
    disableExtension,
    updateExtensionConfig,
    getExtensionConfig,
    checkForUpdates,
    checkCompatibility,
    exportConfig,
    importConfig,
    getExtensionLogs,
    clearLogs,

    // Utilities
    isExtensionInstalled,
    getInstalledExtension,
    getMarketplaceExtension,
    initialize,
    addLog
  }
})