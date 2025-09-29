<template>
  <div class="extension-marketplace">
    <!-- Header with Search and Filters -->
    <div class="marketplace-header">
      <div class="header-content">
        <div class="title-section">
          <h2 class="page-title">{{ $t('extensions.marketplace.title') }}</h2>
          <p class="page-description">{{ $t('extensions.marketplace.description') }}</p>
        </div>

        <div class="search-section">
          <div class="search-container">
            <el-input
              v-model="searchQuery"
              :placeholder="$t('extensions.marketplace.searchPlaceholder')"
              size="large"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <div class="filter-controls">
            <el-select
              v-model="selectedCategory"
              :placeholder="$t('extensions.marketplace.categoryFilter')"
              size="large"
              clearable
              @change="handleCategoryChange"
            >
              <el-option
                v-for="category in categories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              />
            </el-select>

            <el-select
              v-model="sortBy"
              :placeholder="$t('extensions.marketplace.sortBy')"
              size="large"
              @change="handleSortChange"
            >
              <el-option label="Most Popular" value="popularity" />
              <el-option label="Newest" value="created_at" />
              <el-option label="Rating" value="rating" />
              <el-option label="Downloads" value="downloads" />
              <el-option label="Last Updated" value="updated_at" />
            </el-select>

            <el-button-group>
              <el-button
                :type="viewMode === 'grid' ? 'primary' : 'default'"
                @click="viewMode = 'grid'"
              >
                <el-icon><Grid /></el-icon>
              </el-button>
              <el-button
                :type="viewMode === 'list' ? 'primary' : 'default'"
                @click="viewMode = 'list'"
              >
                <el-icon><List /></el-icon>
              </el-button>
            </el-button-group>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <el-alert
        :title="$t('extensions.marketplace.loadError')"
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
    <div v-else class="extensions-container">
      <!-- Stats Bar -->
      <div class="stats-bar">
        <div class="stats-info">
          <span class="stats-text">
            {{ $t('extensions.marketplace.showingResults', {
              count: filteredExtensions.length,
              total: totalExtensions
            }) }}
          </span>
        </div>

        <div class="stats-actions">
          <el-button
            size="small"
            @click="refreshExtensions"
            :loading="refreshing"
          >
            <el-icon><Refresh /></el-icon>
            {{ $t('common.refresh') }}
          </el-button>
        </div>
      </div>

      <!-- Extensions Grid/List -->
      <div
        :class="['extensions-grid', { 'list-view': viewMode === 'list' }]"
        v-if="filteredExtensions.length > 0"
      >
        <ExtensionCard
          v-for="extension in paginatedExtensions"
          :key="extension.id"
          :extension="extension"
          :view-mode="viewMode"
          :is-installed="isInstalled(extension.id)"
          :is-installing="isInstalling(extension.id)"
          @install="handleInstall"
          @view-details="handleViewDetails"
          @preview="handlePreview"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-content">
          <el-icon class="empty-icon"><Box /></el-icon>
          <h3 class="empty-title">{{ $t('extensions.marketplace.noExtensions') }}</h3>
          <p class="empty-description">
            {{ searchQuery
              ? $t('extensions.marketplace.noSearchResults', { query: searchQuery })
              : $t('extensions.marketplace.noExtensionsDescription')
            }}
          </p>
          <el-button type="primary" @click="clearFilters">
            {{ $t('extensions.marketplace.clearFilters') }}
          </el-button>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-container" v-if="totalPages > 1">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredExtensions.length"
          :page-sizes="[12, 24, 48, 96]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Extension Details Dialog -->
    <ExtensionDetailsDialog
      v-model:visible="detailsDialogVisible"
      :extension="selectedExtension"
      :is-installed="selectedExtension ? isInstalled(selectedExtension.id) : false"
      :is-installing="selectedExtension ? isInstalling(selectedExtension.id) : false"
      @install="handleInstall"
      @close="handleCloseDetails"
    />

    <!-- Extension Preview Dialog -->
    <ExtensionPreviewDialog
      v-model:visible="previewDialogVisible"
      :extension="previewExtension"
      @install="handleInstall"
      @view-details="handleViewDetailsFromPreview"
      @close="handleClosePreview"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Grid, List, Refresh, Box } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import ExtensionCard from './ExtensionCard.vue'
import ExtensionDetailsDialog from './ExtensionDetailsDialog.vue'
import ExtensionPreviewDialog from './ExtensionPreviewDialog.vue'
import { useExtensionStore } from '@/stores/extensions'

interface MarketplaceExtension {
  id: string
  name: string
  displayName: string
  description: string
  version: string
  author: string
  authorUrl?: string
  category: string
  tags: string[]
  icon?: string
  screenshots: string[]
  downloadUrl: string
  homepageUrl?: string
  repositoryUrl?: string
  documentationUrl?: string
  licenseUrl?: string
  rating: number
  reviewCount: number
  downloadCount: number
  size: number
  createdAt: string
  updatedAt: string
  verified: boolean
  featured: boolean
  compatibility: {
    minVersion: string
    maxVersion?: string
    platforms: string[]
  }
  permissions: string[]
  dependencies: Array<{
    id: string
    version: string
    optional: boolean
  }>
  metadata: Record<string, any>
}

interface ExtensionCategory {
  id: string
  name: string
  description: string
  icon: string
  count: number
}

const { t } = useI18n()
const extensionStore = useExtensionStore()

// Reactive state
const loading = ref(true)
const refreshing = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const selectedCategory = ref<string>('')
const sortBy = ref('popularity')
const viewMode = ref<'grid' | 'list'>('grid')
const currentPage = ref(1)
const pageSize = ref(24)

const extensions = ref<MarketplaceExtension[]>([])
const categories = ref<ExtensionCategory[]>([])
const totalExtensions = ref(0)

const detailsDialogVisible = ref(false)
const selectedExtension = ref<MarketplaceExtension | null>(null)
const previewDialogVisible = ref(false)
const previewExtension = ref<MarketplaceExtension | null>(null)

const installingExtensions = ref<Set<string>>(new Set())

// Computed properties
const filteredExtensions = computed(() => {
  let filtered = extensions.value

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(ext =>
      ext.name.toLowerCase().includes(query) ||
      ext.displayName.toLowerCase().includes(query) ||
      ext.description.toLowerCase().includes(query) ||
      ext.author.toLowerCase().includes(query) ||
      ext.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Apply category filter
  if (selectedCategory.value) {
    filtered = filtered.filter(ext => ext.category === selectedCategory.value)
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'popularity':
        return b.downloadCount - a.downloadCount
      case 'rating':
        return b.rating - a.rating
      case 'created_at':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'updated_at':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'downloads':
        return b.downloadCount - a.downloadCount
      default:
        return 0
    }
  })

  return filtered
})

const paginatedExtensions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredExtensions.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredExtensions.value.length / pageSize.value)
})

// Methods
const loadExtensions = async () => {
  try {
    loading.value = true
    error.value = null

    const response = await fetch('/api/extensions/marketplace', {
      headers: {
        'Authorization': `Bearer ${extensionStore.authToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to load extensions: ${response.statusText}`)
    }

    const data = await response.json()
    extensions.value = data.extensions || []
    categories.value = data.categories || []
    totalExtensions.value = data.total || extensions.value.length

  } catch (err) {
    console.error('Failed to load extensions:', err)
    error.value = err instanceof Error ? err.message : 'Unknown error'
    ElMessage.error(t('extensions.marketplace.loadError'))
  } finally {
    loading.value = false
  }
}

const refreshExtensions = async () => {
  try {
    refreshing.value = true
    await loadExtensions()
    ElMessage.success(t('extensions.marketplace.refreshSuccess'))
  } catch (err) {
    console.error('Failed to refresh extensions:', err)
    ElMessage.error(t('extensions.marketplace.refreshError'))
  } finally {
    refreshing.value = false
  }
}

const handleSearch = (query: string) => {
  currentPage.value = 1
  searchQuery.value = query
}

const handleCategoryChange = (category: string) => {
  currentPage.value = 1
  selectedCategory.value = category
}

const handleSortChange = (sort: string) => {
  currentPage.value = 1
  sortBy.value = sort
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
  sortBy.value = 'popularity'
  currentPage.value = 1
}

const isInstalled = (extensionId: string): boolean => {
  return extensionStore.installedExtensions.some(ext => ext.id === extensionId)
}

const isInstalling = (extensionId: string): boolean => {
  return installingExtensions.value.has(extensionId)
}

const handleInstall = async (extension: MarketplaceExtension) => {
  if (isInstalled(extension.id)) {
    ElMessage.warning(t('extensions.marketplace.alreadyInstalled'))
    return
  }

  if (isInstalling(extension.id)) {
    return
  }

  try {
    installingExtensions.value.add(extension.id)

    await extensionStore.installExtension(extension.id, {
      version: extension.version,
      downloadUrl: extension.downloadUrl,
      checkPermissions: true
    })

    ElMessage.success(t('extensions.marketplace.installSuccess', { name: extension.displayName }))

  } catch (err) {
    console.error('Failed to install extension:', err)
    ElMessage.error(t('extensions.marketplace.installError', {
      name: extension.displayName,
      error: err instanceof Error ? err.message : 'Unknown error'
    }))
  } finally {
    installingExtensions.value.delete(extension.id)
  }
}

const handleViewDetails = (extension: MarketplaceExtension) => {
  selectedExtension.value = extension
  detailsDialogVisible.value = true
}

const handlePreview = (extension: MarketplaceExtension) => {
  previewExtension.value = extension
  previewDialogVisible.value = true
}

const handleCloseDetails = () => {
  detailsDialogVisible.value = false
  selectedExtension.value = null
}

const handleClosePreview = () => {
  previewDialogVisible.value = false
  previewExtension.value = null
}

const handleViewDetailsFromPreview = (extension: MarketplaceExtension) => {
  previewDialogVisible.value = false
  previewExtension.value = null
  handleViewDetails(extension)
}

// Lifecycle
onMounted(() => {
  loadExtensions()
})

// Watch for store changes
watch(() => extensionStore.installedExtensions.length, () => {
  // Refresh when extensions are installed/uninstalled
})
</script>

<style scoped lang="scss">
.extension-marketplace {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900;
}

.marketplace-header {
  @apply bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;

  .header-content {
    @apply max-w-7xl mx-auto px-4 py-6;

    .title-section {
      @apply mb-6;

      .page-title {
        @apply text-2xl font-bold text-gray-900 dark:text-white mb-2;
      }

      .page-description {
        @apply text-gray-600 dark:text-gray-400;
      }
    }

    .search-section {
      @apply space-y-4;

      .search-container {
        @apply max-w-md;

        :deep(.el-input__inner) {
          @apply bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600;
        }
      }

      .filter-controls {
        @apply flex flex-wrap items-center gap-3;

        .el-select {
          @apply min-w-[140px];
        }
      }
    }
  }
}

.loading-container {
  @apply max-w-7xl mx-auto px-4 py-8;
}

.error-container {
  @apply max-w-7xl mx-auto px-4 py-8;
}

.extensions-container {
  @apply max-w-7xl mx-auto px-4 py-6;

  .stats-bar {
    @apply flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700;

    .stats-info {
      .stats-text {
        @apply text-sm text-gray-600 dark:text-gray-400;
      }
    }

    .stats-actions {
      @apply flex items-center gap-2;
    }
  }

  .extensions-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6;

    &.list-view {
      @apply grid-cols-1 gap-4;
    }
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

  .pagination-container {
    @apply flex justify-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700;
  }
}

// Responsive design
@media (max-width: 768px) {
  .marketplace-header .header-content {
    @apply px-2;

    .search-section .filter-controls {
      @apply flex-col items-stretch gap-3;

      .el-select {
        @apply min-w-full;
      }
    }
  }

  .extensions-container {
    @apply px-2;

    .stats-bar {
      @apply flex-col items-start gap-3;
    }

    .extensions-grid {
      @apply grid-cols-1 gap-4;
    }
  }
}

// Dark mode adjustments
.dark {
  .extension-marketplace {
    :deep(.el-skeleton__item) {
      @apply bg-gray-800;
    }

    :deep(.el-pagination) {
      .el-pager li {
        @apply bg-gray-800 border-gray-600;

        &.is-active {
          @apply bg-blue-600 border-blue-600;
        }
      }

      .btn-prev, .btn-next {
        @apply bg-gray-800 border-gray-600;
      }
    }
  }
}
</style>