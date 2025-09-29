<template>
  <div class="extension-manager">
    <!-- Header -->
    <div class="manager-header">
      <div class="header-content">
        <div class="title-section">
          <h2 class="page-title">{{ $t('extensions.manager.title') }}</h2>
          <p class="page-description">{{ $t('extensions.manager.description') }}</p>
        </div>

        <div class="header-actions">
          <el-button type="primary" @click="openMarketplace">
            <el-icon><Plus /></el-icon>
            {{ $t('extensions.manager.browseMarketplace') }}
          </el-button>

          <el-button @click="refreshExtensions" :loading="refreshing">
            <el-icon><Refresh /></el-icon>
            {{ $t('common.refresh') }}
          </el-button>

          <el-button @click="checkForUpdates" :loading="checkingUpdates">
            <el-icon><Download /></el-icon>
            {{ $t('extensions.manager.checkUpdates') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="status-bar">
      <div class="status-content">
        <div class="status-stats">
          <div class="stat-item">
            <span class="stat-value">{{ installedExtensions.length }}</span>
            <span class="stat-label">{{ $t('extensions.manager.totalInstalled') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ enabledCount }}</span>
            <span class="stat-label">{{ $t('extensions.manager.enabled') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ updatesAvailable }}</span>
            <span class="stat-label">{{ $t('extensions.manager.updatesAvailable') }}</span>
          </div>
        </div>

        <div class="status-actions">
          <el-button
            v-if="updatesAvailable > 0"
            type="primary"
            size="small"
            @click="updateAll"
            :loading="updatingAll"
          >
            {{ $t('extensions.manager.updateAll') }} ({{ updatesAvailable }})
          </el-button>

          <el-dropdown @command="handleBulkAction" trigger="click">
            <el-button size="small">
              {{ $t('extensions.manager.bulkActions') }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="enable-all">
                  {{ $t('extensions.manager.enableAll') }}
                </el-dropdown-item>
                <el-dropdown-item command="disable-all">
                  {{ $t('extensions.manager.disableAll') }}
                </el-dropdown-item>
                <el-dropdown-item command="export-config" divided>
                  {{ $t('extensions.manager.exportConfig') }}
                </el-dropdown-item>
                <el-dropdown-item command="import-config">
                  {{ $t('extensions.manager.importConfig') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filters-content">
        <el-input
          v-model="searchQuery"
          :placeholder="$t('extensions.manager.searchPlaceholder')"
          clearable
          class="search-input"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="statusFilter"
          :placeholder="$t('extensions.manager.statusFilter')"
          clearable
          @change="handleFilterChange"
        >
          <el-option label="All Extensions" value="" />
          <el-option label="Enabled" value="enabled" />
          <el-option label="Disabled" value="disabled" />
          <el-option label="Has Updates" value="updates" />
          <el-option label="Has Errors" value="errors" />
        </el-select>

        <el-select
          v-model="categoryFilter"
          :placeholder="$t('extensions.manager.categoryFilter')"
          clearable
          @change="handleFilterChange"
        >
          <el-option
            v-for="category in categories"
            :key="category"
            :label="category"
            :value="category"
          />
        </el-select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="4" animated />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <el-alert
        :title="$t('extensions.manager.loadError')"
        type="error"
        :description="error"
        show-icon
        :closable="false"
      >
        <el-button type="primary" @click="loadExtensions">
          {{ $t('common.retry') }}
        </el-button>
      </el-alert>
    </div>

    <!-- Extensions List -->
    <div v-else class="extensions-list">
      <div v-if="filteredExtensions.length > 0" class="extensions-grid">
        <ExtensionManagerCard
          v-for="extension in filteredExtensions"
          :key="extension.id"
          :extension="extension"
          :is-loading="loadingExtensions.has(extension.id)"
          @toggle-enabled="handleToggleEnabled"
          @update="handleUpdate"
          @uninstall="handleUninstall"
          @configure="handleConfigure"
          @view-details="handleViewDetails"
          @view-logs="handleViewLogs"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-content">
          <el-icon class="empty-icon"><Box /></el-icon>
          <h3 class="empty-title">
            {{ searchQuery
              ? $t('extensions.manager.noSearchResults')
              : $t('extensions.manager.noExtensions')
            }}
          </h3>
          <p class="empty-description">
            {{ searchQuery
              ? $t('extensions.manager.noSearchResultsDescription', { query: searchQuery })
              : $t('extensions.manager.noExtensionsDescription')
            }}
          </p>
          <el-button v-if="searchQuery" @click="clearSearch">
            {{ $t('extensions.manager.clearSearch') }}
          </el-button>
          <el-button v-else type="primary" @click="openMarketplace">
            {{ $t('extensions.manager.browseMarketplace') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Extension Configuration Dialog -->
    <ExtensionConfigDialog
      v-model:visible="configDialogVisible"
      :extension="selectedExtension"
      @save="handleSaveConfig"
      @close="handleCloseConfig"
    />

    <!-- Extension Details Dialog -->
    <ExtensionDetailsDialog
      v-model:visible="detailsDialogVisible"
      :extension="selectedExtension"
      :is-installed="true"
      :show-install-button="false"
      @close="handleCloseDetails"
    />

    <!-- Extension Logs Dialog -->
    <ExtensionLogsDialog
      v-model:visible="logsDialogVisible"
      :extension="selectedExtension"
      @close="handleCloseLogs"
    />

    <!-- File Import Dialog -->
    <el-dialog
      v-model="importDialogVisible"
      :title="$t('extensions.manager.importConfig')"
      width="500px"
    >
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :show-file-list="true"
        :limit="1"
        accept=".json"
        @change="handleFileChange"
      >
        <template #trigger>
          <el-button type="primary">
            {{ $t('extensions.manager.selectFile') }}
          </el-button>
        </template>
        <template #tip>
          <div class="el-upload__tip">
            {{ $t('extensions.manager.importTip') }}
          </div>
        </template>
      </el-upload>

      <template #footer>
        <el-button @click="importDialogVisible = false">
          {{ $t('common.cancel') }}
        </el-button>
        <el-button
          type="primary"
          @click="handleImportConfig"
          :loading="importing"
        >
          {{ $t('common.import') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Refresh, Download, Search, ArrowDown, Box
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ExtensionManagerCard from './ExtensionManagerCard.vue'
import ExtensionConfigDialog from './ExtensionConfigDialog.vue'
import ExtensionDetailsDialog from './ExtensionDetailsDialog.vue'
import ExtensionLogsDialog from './ExtensionLogsDialog.vue'
import { useExtensionStore } from '@/stores/extensions'

interface InstalledExtension {
  id: string
  name: string
  displayName: string
  version: string
  description: string
  author: string
  category: string
  enabled: boolean
  hasUpdate: boolean
  latestVersion?: string
  installDate: string
  lastUsed?: string
  status: 'active' | 'inactive' | 'error' | 'updating'
  error?: string
  config: Record<string, any>
  permissions: string[]
  dependencies: Array<{
    id: string
    version: string
    satisfied: boolean
  }>
  stats: {
    usage: number
    performance: number
    memoryUsage: number
  }
  metadata: Record<string, any>
}

const { t } = useI18n()
const router = useRouter()
const extensionStore = useExtensionStore()

// Reactive state
const loading = ref(true)
const refreshing = ref(false)
const checkingUpdates = ref(false)
const updatingAll = ref(false)
const importing = ref(false)
const error = ref<string | null>(null)

const searchQuery = ref('')
const statusFilter = ref('')
const categoryFilter = ref('')

const installedExtensions = ref<InstalledExtension[]>([])
const loadingExtensions = ref<Set<string>>(new Set())

// Dialog states
const configDialogVisible = ref(false)
const detailsDialogVisible = ref(false)
const logsDialogVisible = ref(false)
const importDialogVisible = ref(false)
const selectedExtension = ref<InstalledExtension | null>(null)

// File upload
const uploadRef = ref()
const selectedFile = ref<File | null>(null)

// Computed properties
const enabledCount = computed(() => {
  return installedExtensions.value.filter(ext => ext.enabled).length
})

const updatesAvailable = computed(() => {
  return installedExtensions.value.filter(ext => ext.hasUpdate).length
})

const categories = computed(() => {
  const cats = new Set(installedExtensions.value.map(ext => ext.category))
  return Array.from(cats).sort()
})

const filteredExtensions = computed(() => {
  let filtered = installedExtensions.value

  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(ext =>
      ext.name.toLowerCase().includes(query) ||
      ext.displayName.toLowerCase().includes(query) ||
      ext.description.toLowerCase().includes(query) ||
      ext.author.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (statusFilter.value) {
    switch (statusFilter.value) {
      case 'enabled':
        filtered = filtered.filter(ext => ext.enabled)
        break
      case 'disabled':
        filtered = filtered.filter(ext => !ext.enabled)
        break
      case 'updates':
        filtered = filtered.filter(ext => ext.hasUpdate)
        break
      case 'errors':
        filtered = filtered.filter(ext => ext.status === 'error')
        break
    }
  }

  // Category filter
  if (categoryFilter.value) {
    filtered = filtered.filter(ext => ext.category === categoryFilter.value)
  }

  // Sort by status (errors first, then updates, then enabled, then disabled)
  filtered.sort((a, b) => {
    const statusOrder = { error: 0, updating: 1, active: 2, inactive: 3 }
    if (a.status !== b.status) {
      return statusOrder[a.status] - statusOrder[b.status]
    }
    if (a.hasUpdate !== b.hasUpdate) {
      return a.hasUpdate ? -1 : 1
    }
    if (a.enabled !== b.enabled) {
      return a.enabled ? -1 : 1
    }
    return a.displayName.localeCompare(b.displayName)
  })

  return filtered
})

// Methods
const loadExtensions = async () => {
  try {
    loading.value = true
    error.value = null

    await extensionStore.loadInstalledExtensions()
    installedExtensions.value = extensionStore.installedExtensions as InstalledExtension[]

  } catch (err) {
    console.error('Failed to load extensions:', err)
    error.value = err instanceof Error ? err.message : 'Unknown error'
    ElMessage.error(t('extensions.manager.loadError'))
  } finally {
    loading.value = false
  }
}

const refreshExtensions = async () => {
  try {
    refreshing.value = true
    await loadExtensions()
    ElMessage.success(t('extensions.manager.refreshSuccess'))
  } catch (err) {
    console.error('Failed to refresh extensions:', err)
    ElMessage.error(t('extensions.manager.refreshError'))
  } finally {
    refreshing.value = false
  }
}

const checkForUpdates = async () => {
  try {
    checkingUpdates.value = true

    const updatesFound = await extensionStore.checkForUpdates()

    if (updatesFound > 0) {
      ElMessage.success(t('extensions.manager.updatesFound', { count: updatesFound }))
    } else {
      ElMessage.info(t('extensions.manager.noUpdatesFound'))
    }

    await loadExtensions() // Refresh to show update status
  } catch (err) {
    console.error('Failed to check for updates:', err)
    ElMessage.error(t('extensions.manager.updateCheckError'))
  } finally {
    checkingUpdates.value = false
  }
}

const updateAll = async () => {
  try {
    updatingAll.value = true

    const extensionsToUpdate = installedExtensions.value.filter(ext => ext.hasUpdate)

    for (const extension of extensionsToUpdate) {
      loadingExtensions.value.add(extension.id)
      try {
        await extensionStore.updateExtension(extension.id)
        ElMessage.success(t('extensions.manager.updateSuccess', { name: extension.displayName }))
      } catch (err) {
        console.error(`Failed to update ${extension.name}:`, err)
        ElMessage.error(t('extensions.manager.updateError', {
          name: extension.displayName,
          error: err instanceof Error ? err.message : 'Unknown error'
        }))
      } finally {
        loadingExtensions.value.delete(extension.id)
      }
    }

    await loadExtensions() // Refresh list
  } catch (err) {
    console.error('Failed to update all extensions:', err)
    ElMessage.error(t('extensions.manager.updateAllError'))
  } finally {
    updatingAll.value = false
  }
}

const handleToggleEnabled = async (extension: InstalledExtension) => {
  const action = extension.enabled ? 'disable' : 'enable'

  try {
    loadingExtensions.value.add(extension.id)

    if (extension.enabled) {
      await extensionStore.disableExtension(extension.id)
    } else {
      await extensionStore.enableExtension(extension.id)
    }

    ElMessage.success(t(`extensions.manager.${action}Success`, { name: extension.displayName }))
    await loadExtensions() // Refresh list
  } catch (err) {
    console.error(`Failed to ${action} extension:`, err)
    ElMessage.error(t(`extensions.manager.${action}Error`, {
      name: extension.displayName,
      error: err instanceof Error ? err.message : 'Unknown error'
    }))
  } finally {
    loadingExtensions.value.delete(extension.id)
  }
}

const handleUpdate = async (extension: InstalledExtension) => {
  try {
    loadingExtensions.value.add(extension.id)

    await extensionStore.updateExtension(extension.id)

    ElMessage.success(t('extensions.manager.updateSuccess', { name: extension.displayName }))
    await loadExtensions() // Refresh list
  } catch (err) {
    console.error('Failed to update extension:', err)
    ElMessage.error(t('extensions.manager.updateError', {
      name: extension.displayName,
      error: err instanceof Error ? err.message : 'Unknown error'
    }))
  } finally {
    loadingExtensions.value.delete(extension.id)
  }
}

const handleUninstall = async (extension: InstalledExtension) => {
  try {
    await ElMessageBox.confirm(
      t('extensions.manager.uninstallConfirm', { name: extension.displayName }),
      t('extensions.manager.uninstallTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )

    loadingExtensions.value.add(extension.id)

    await extensionStore.uninstallExtension(extension.id)

    ElMessage.success(t('extensions.manager.uninstallSuccess', { name: extension.displayName }))
    await loadExtensions() // Refresh list
  } catch (err) {
    if (err !== 'cancel') {
      console.error('Failed to uninstall extension:', err)
      ElMessage.error(t('extensions.manager.uninstallError', {
        name: extension.displayName,
        error: err instanceof Error ? err.message : 'Unknown error'
      }))
    }
  } finally {
    loadingExtensions.value.delete(extension.id)
  }
}

const handleConfigure = (extension: InstalledExtension) => {
  selectedExtension.value = extension
  configDialogVisible.value = true
}

const handleViewDetails = (extension: InstalledExtension) => {
  selectedExtension.value = extension
  detailsDialogVisible.value = true
}

const handleViewLogs = (extension: InstalledExtension) => {
  selectedExtension.value = extension
  logsDialogVisible.value = true
}

const handleSaveConfig = async (extensionId: string, config: Record<string, any>) => {
  try {
    await extensionStore.updateExtensionConfig(extensionId, config)
    ElMessage.success(t('extensions.manager.configSaved'))
    await loadExtensions() // Refresh list
  } catch (err) {
    console.error('Failed to save extension config:', err)
    ElMessage.error(t('extensions.manager.configSaveError'))
  }
}

const handleCloseConfig = () => {
  configDialogVisible.value = false
  selectedExtension.value = null
}

const handleCloseDetails = () => {
  detailsDialogVisible.value = false
  selectedExtension.value = null
}

const handleCloseLogs = () => {
  logsDialogVisible.value = false
  selectedExtension.value = null
}

const handleSearch = () => {
  // Search is reactive via computed property
}

const handleFilterChange = () => {
  // Filters are reactive via computed property
}

const clearSearch = () => {
  searchQuery.value = ''
}

const openMarketplace = () => {
  router.push('/extensions/marketplace')
}

const handleBulkAction = async (command: string) => {
  try {
    switch (command) {
      case 'enable-all':
        await Promise.all(
          installedExtensions.value
            .filter(ext => !ext.enabled)
            .map(ext => extensionStore.enableExtension(ext.id))
        )
        ElMessage.success(t('extensions.manager.enableAllSuccess'))
        break

      case 'disable-all':
        await Promise.all(
          installedExtensions.value
            .filter(ext => ext.enabled)
            .map(ext => extensionStore.disableExtension(ext.id))
        )
        ElMessage.success(t('extensions.manager.disableAllSuccess'))
        break

      case 'export-config':
        await exportConfig()
        break

      case 'import-config':
        importDialogVisible.value = true
        break
    }

    if (command.includes('enable') || command.includes('disable')) {
      await loadExtensions() // Refresh list
    }
  } catch (err) {
    console.error(`Failed to execute bulk action ${command}:`, err)
    ElMessage.error(t('extensions.manager.bulkActionError'))
  }
}

const exportConfig = async () => {
  try {
    const config = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      extensions: installedExtensions.value.map(ext => ({
        id: ext.id,
        name: ext.name,
        version: ext.version,
        enabled: ext.enabled,
        config: ext.config
      }))
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `extensions-config-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    ElMessage.success(t('extensions.manager.exportSuccess'))
  } catch (err) {
    console.error('Failed to export config:', err)
    ElMessage.error(t('extensions.manager.exportError'))
  }
}

const handleFileChange = (file: any) => {
  selectedFile.value = file.raw
}

const handleImportConfig = async () => {
  if (!selectedFile.value) {
    ElMessage.warning(t('extensions.manager.selectFileFirst'))
    return
  }

  try {
    importing.value = true

    const text = await selectedFile.value.text()
    const config = JSON.parse(text)

    // Validate config format
    if (!config.extensions || !Array.isArray(config.extensions)) {
      throw new Error('Invalid configuration format')
    }

    // Import extensions
    const results = await extensionStore.importConfig(config)

    ElMessage.success(t('extensions.manager.importSuccess', {
      imported: results.imported,
      total: config.extensions.length
    }))

    importDialogVisible.value = false
    selectedFile.value = null
    uploadRef.value?.clearFiles()
    await loadExtensions() // Refresh list
  } catch (err) {
    console.error('Failed to import config:', err)
    ElMessage.error(t('extensions.manager.importError', {
      error: err instanceof Error ? err.message : 'Unknown error'
    }))
  } finally {
    importing.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadExtensions()
})
</script>

<style scoped lang="scss">
.extension-manager {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900;
}

.manager-header {
  @apply bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;

  .header-content {
    @apply max-w-7xl mx-auto px-4 py-6 flex items-center justify-between;

    .title-section {
      .page-title {
        @apply text-2xl font-bold text-gray-900 dark:text-white mb-1;
      }

      .page-description {
        @apply text-gray-600 dark:text-gray-400 text-sm;
      }
    }

    .header-actions {
      @apply flex items-center gap-3;
    }
  }
}

.status-bar {
  @apply bg-blue-50 dark:bg-gray-800 border-b border-blue-100 dark:border-gray-700;

  .status-content {
    @apply max-w-7xl mx-auto px-4 py-4 flex items-center justify-between;

    .status-stats {
      @apply flex items-center gap-6;

      .stat-item {
        @apply text-center;

        .stat-value {
          @apply block text-lg font-bold text-blue-600 dark:text-blue-400;
        }

        .stat-label {
          @apply block text-xs text-gray-600 dark:text-gray-400 mt-1;
        }
      }
    }

    .status-actions {
      @apply flex items-center gap-3;
    }
  }
}

.filters-section {
  @apply bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;

  .filters-content {
    @apply max-w-7xl mx-auto px-4 py-4 flex items-center gap-4;

    .search-input {
      @apply flex-1 max-w-md;
    }
  }
}

.loading-container,
.error-container {
  @apply max-w-7xl mx-auto px-4 py-8;
}

.extensions-list {
  @apply max-w-7xl mx-auto px-4 py-6;

  .extensions-grid {
    @apply grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6;
  }

  .empty-state {
    @apply flex items-center justify-center py-16;

    .empty-content {
      @apply text-center max-w-md;

      .empty-icon {
        @apply text-6xl text-gray-400 dark:text-gray-500 mb-4;
      }

      .empty-title {
        @apply text-xl font-semibold text-gray-900 dark:text-white mb-2;
      }

      .empty-description {
        @apply text-gray-600 dark:text-gray-400 mb-6;
      }
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .manager-header .header-content {
    @apply flex-col items-start gap-4;
  }

  .status-bar .status-content {
    @apply flex-col items-start gap-4;

    .status-stats {
      @apply grid grid-cols-3 gap-4 w-full;
    }
  }

  .filters-section .filters-content {
    @apply flex-col gap-3;

    .search-input {
      @apply max-w-full;
    }
  }

  .extensions-list .extensions-grid {
    @apply grid-cols-1 gap-4;
  }
}
</style>