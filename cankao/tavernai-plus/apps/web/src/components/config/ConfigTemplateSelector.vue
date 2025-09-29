<template>
  <div class="config-template-selector">
    <!-- Header -->
    <div class="selector-header">
      <div class="header-content">
        <div class="title-section">
          <h2 class="page-title">{{ $t('config.templates.title') }}</h2>
          <p class="page-description">{{ $t('config.templates.description') }}</p>
        </div>

        <div class="header-actions">
          <el-button @click="createTemplate" type="primary">
            <el-icon><Plus /></el-icon>
            {{ $t('config.templates.createNew') }}
          </el-button>

          <el-button @click="refreshTemplates" :loading="refreshing">
            <el-icon><Refresh /></el-icon>
            {{ $t('common.refresh') }}
          </el-button>

          <el-dropdown @command="handleBulkAction" trigger="click">
            <el-button>
              {{ $t('config.templates.bulkActions') }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="export-all">
                  {{ $t('config.templates.exportAll') }}
                </el-dropdown-item>
                <el-dropdown-item command="import-templates" divided>
                  {{ $t('config.templates.importTemplates') }}
                </el-dropdown-item>
                <el-dropdown-item command="delete-selected" :disabled="selectedTemplates.length === 0">
                  {{ $t('config.templates.deleteSelected') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="filters-section">
      <div class="filters-content">
        <el-input
          v-model="searchQuery"
          :placeholder="$t('config.templates.searchPlaceholder')"
          clearable
          class="search-input"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="categoryFilter"
          :placeholder="$t('config.templates.categoryFilter')"
          clearable
          @change="handleFilterChange"
        >
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          >
            <div class="category-option">
              <span class="category-name">{{ category.name }}</span>
              <el-badge :value="category.count" class="category-badge" />
            </div>
          </el-option>
        </el-select>

        <el-select
          v-model="sortBy"
          :placeholder="$t('config.templates.sortBy')"
          @change="handleSortChange"
        >
          <el-option label="Name" value="name" />
          <el-option label="Created Date" value="created" />
          <el-option label="Modified Date" value="modified" />
          <el-option label="Usage Count" value="usage" />
          <el-option label="Rating" value="rating" />
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

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <el-alert
        :title="$t('config.templates.loadError')"
        type="error"
        :description="error"
        show-icon
        :closable="false"
      >
        <el-button type="primary" @click="loadTemplates">
          {{ $t('common.retry') }}
        </el-button>
      </el-alert>
    </div>

    <!-- Templates List -->
    <div v-else class="templates-container">
      <!-- Selection Bar -->
      <div v-if="selectionMode" class="selection-bar">
        <div class="selection-info">
          <el-checkbox
            v-model="selectAll"
            :indeterminate="isIndeterminate"
            @change="handleSelectAll"
          >
            {{ $t('config.templates.selectAll') }}
          </el-checkbox>
          <span class="selection-count">
            {{ $t('config.templates.selectedCount', { count: selectedTemplates.length }) }}
          </span>
        </div>

        <div class="selection-actions">
          <el-button size="small" @click="clearSelection">
            {{ $t('config.templates.clearSelection') }}
          </el-button>
          <el-button size="small" @click="selectionMode = false">
            {{ $t('common.cancel') }}
          </el-button>
        </div>
      </div>

      <!-- Templates Grid/List -->
      <div
        :class="['templates-grid', { 'list-view': viewMode === 'list' }]"
        v-if="filteredTemplates.length > 0"
      >
        <TemplateCard
          v-for="template in paginatedTemplates"
          :key="template.id"
          :template="template"
          :view-mode="viewMode"
          :selection-mode="selectionMode"
          :selected="selectedTemplates.includes(template.id)"
          :loading="loadingTemplates.has(template.id)"
          @select="handleTemplateSelect"
          @apply="handleApplyTemplate"
          @edit="handleEditTemplate"
          @duplicate="handleDuplicateTemplate"
          @share="handleShareTemplate"
          @delete="handleDeleteTemplate"
          @preview="handlePreviewTemplate"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-content">
          <el-icon class="empty-icon"><DocumentAdd /></el-icon>
          <h3 class="empty-title">
            {{ searchQuery
              ? $t('config.templates.noSearchResults')
              : $t('config.templates.noTemplates')
            }}
          </h3>
          <p class="empty-description">
            {{ searchQuery
              ? $t('config.templates.noSearchResultsDescription', { query: searchQuery })
              : $t('config.templates.noTemplatesDescription')
            }}
          </p>
          <el-button v-if="searchQuery" @click="clearSearch">
            {{ $t('config.templates.clearSearch') }}
          </el-button>
          <el-button v-else type="primary" @click="createTemplate">
            {{ $t('config.templates.createFirst') }}
          </el-button>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-container" v-if="totalPages > 1">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredTemplates.length"
          :page-sizes="[12, 24, 48, 96]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Template Editor Dialog -->
    <TemplateEditorDialog
      v-model:visible="editorDialogVisible"
      :template="selectedTemplate"
      :mode="editorMode"
      @save="handleSaveTemplate"
      @close="handleCloseEditor"
    />

    <!-- Template Preview Dialog -->
    <TemplatePreviewDialog
      v-model:visible="previewDialogVisible"
      :template="previewTemplate"
      @apply="handleApplyFromPreview"
      @edit="handleEditFromPreview"
      @close="handleClosePreview"
    />

    <!-- Share Template Dialog -->
    <TemplateShareDialog
      v-model:visible="shareDialogVisible"
      :template="shareTemplate"
      @shared="handleTemplateShared"
      @close="handleCloseShare"
    />

    <!-- Import Templates Dialog -->
    <el-dialog
      v-model="importDialogVisible"
      :title="$t('config.templates.importTemplates')"
      width="600px"
    >
      <div class="import-content">
        <el-alert
          :title="$t('config.templates.importWarning')"
          type="warning"
          :description="$t('config.templates.importWarningDescription')"
          show-icon
          :closable="false"
          class="mb-4"
        />

        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :show-file-list="true"
          :limit="10"
          accept=".json,.zip"
          @change="handleImportFileChange"
          multiple
          drag
        >
          <div class="upload-content">
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <div class="upload-text">
              {{ $t('config.templates.dragFilesHere') }}
            </div>
            <div class="upload-hint">
              {{ $t('config.templates.supportedImportFormats') }}
            </div>
          </div>
        </el-upload>

        <div class="import-options">
          <el-checkbox v-model="importOptions.overwriteExisting">
            {{ $t('config.templates.overwriteExisting') }}
          </el-checkbox>
          <el-checkbox v-model="importOptions.validateOnImport">
            {{ $t('config.templates.validateOnImport') }}
          </el-checkbox>
          <el-checkbox v-model="importOptions.assignToCategory">
            {{ $t('config.templates.assignToCategory') }}
          </el-checkbox>
        </div>

        <div v-if="importOptions.assignToCategory" class="category-assignment">
          <el-select
            v-model="importOptions.categoryId"
            :placeholder="$t('config.templates.selectCategory')"
          >
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </div>
      </div>

      <template #footer>
        <el-button @click="importDialogVisible = false">
          {{ $t('common.cancel') }}
        </el-button>
        <el-button
          type="primary"
          @click="performImport"
          :loading="importing"
          :disabled="!canImport"
        >
          {{ $t('config.templates.import') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Refresh, ArrowDown, Search, Grid, List, DocumentAdd, UploadFilled
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import TemplateCard from './TemplateCard.vue'
import TemplateEditorDialog from './TemplateEditorDialog.vue'
import TemplatePreviewDialog from './TemplatePreviewDialog.vue'
import TemplateShareDialog from './TemplateShareDialog.vue'
import { useConfigStore } from '@/stores/config'

interface ConfigTemplate {
  id: string
  name: string
  description: string
  category: string
  categoryName: string
  tags: string[]
  author: string
  authorId: string
  version: string
  isPublic: boolean
  verified: boolean
  featured: boolean
  createdAt: Date
  updatedAt: Date
  usageCount: number
  rating: number
  reviewCount: number
  size: number
  config: Record<string, any>
  metadata: {
    targetVersion: string
    compatibility: string[]
    dependencies: string[]
    screenshots: string[]
    documentation?: string
  }
}

interface TemplateCategory {
  id: string
  name: string
  description: string
  icon: string
  count: number
  color: string
}

const { t } = useI18n()
const configStore = useConfigStore()

// Reactive state
const loading = ref(true)
const refreshing = ref(false)
const importing = ref(false)
const error = ref<string | null>(null)

const searchQuery = ref('')
const categoryFilter = ref('')
const sortBy = ref('name')
const viewMode = ref<'grid' | 'list'>('grid')
const currentPage = ref(1)
const pageSize = ref(24)

const templates = ref<ConfigTemplate[]>([])
const categories = ref<TemplateCategory[]>([])
const loadingTemplates = ref<Set<string>>(new Set())

// Selection state
const selectionMode = ref(false)
const selectedTemplates = ref<string[]>([])

// Dialog states
const editorDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const shareDialogVisible = ref(false)
const importDialogVisible = ref(false)

const selectedTemplate = ref<ConfigTemplate | null>(null)
const previewTemplate = ref<ConfigTemplate | null>(null)
const shareTemplate = ref<ConfigTemplate | null>(null)
const editorMode = ref<'create' | 'edit' | 'duplicate'>('create')

// Import state
const uploadRef = ref()
const importFiles = ref<File[]>([])
const importOptions = ref({
  overwriteExisting: false,
  validateOnImport: true,
  assignToCategory: false,
  categoryId: ''
})

// Computed properties
const filteredTemplates = computed(() => {
  let filtered = templates.value

  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(template =>
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.author.toLowerCase().includes(query) ||
      template.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Category filter
  if (categoryFilter.value) {
    filtered = filtered.filter(template => template.category === categoryFilter.value)
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'created':
        return b.createdAt.getTime() - a.createdAt.getTime()
      case 'modified':
        return b.updatedAt.getTime() - a.updatedAt.getTime()
      case 'usage':
        return b.usageCount - a.usageCount
      case 'rating':
        return b.rating - a.rating
      default:
        return 0
    }
  })

  return filtered
})

const paginatedTemplates = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTemplates.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredTemplates.value.length / pageSize.value)
})

const selectAll = computed({
  get: () => {
    return selectedTemplates.value.length === paginatedTemplates.value.length && paginatedTemplates.value.length > 0
  },
  set: (value: boolean) => {
    if (value) {
      selectedTemplates.value = paginatedTemplates.value.map(t => t.id)
    } else {
      selectedTemplates.value = []
    }
  }
})

const isIndeterminate = computed(() => {
  return selectedTemplates.value.length > 0 && selectedTemplates.value.length < paginatedTemplates.value.length
})

const canImport = computed(() => {
  return importFiles.value.length > 0
})

// Methods
const loadTemplates = async () => {
  try {
    loading.value = true
    error.value = null

    const data = await configStore.loadTemplates()
    templates.value = data.templates.map((template: any) => ({
      ...template,
      createdAt: new Date(template.createdAt),
      updatedAt: new Date(template.updatedAt)
    }))
    categories.value = data.categories || []

  } catch (err) {
    console.error('Failed to load templates:', err)
    error.value = err instanceof Error ? err.message : 'Unknown error'
    ElMessage.error(t('config.templates.loadError'))
  } finally {
    loading.value = false
  }
}

const refreshTemplates = async () => {
  try {
    refreshing.value = true
    await loadTemplates()
    ElMessage.success(t('config.templates.refreshSuccess'))
  } catch (err) {
    console.error('Failed to refresh templates:', err)
    ElMessage.error(t('config.templates.refreshError'))
  } finally {
    refreshing.value = false
  }
}

const createTemplate = () => {
  selectedTemplate.value = null
  editorMode.value = 'create'
  editorDialogVisible.value = true
}

const handleTemplateSelect = (templateId: string, selected: boolean) => {
  if (selected) {
    if (!selectedTemplates.value.includes(templateId)) {
      selectedTemplates.value.push(templateId)
    }
  } else {
    const index = selectedTemplates.value.indexOf(templateId)
    if (index >= 0) {
      selectedTemplates.value.splice(index, 1)
    }
  }

  // Auto-enable selection mode when templates are selected
  if (selectedTemplates.value.length > 0 && !selectionMode.value) {
    selectionMode.value = true
  }
}

const handleSelectAll = (selected: boolean) => {
  if (selected) {
    selectedTemplates.value = [...new Set([...selectedTemplates.value, ...paginatedTemplates.value.map(t => t.id)])]
  } else {
    const pageTemplateIds = paginatedTemplates.value.map(t => t.id)
    selectedTemplates.value = selectedTemplates.value.filter(id => !pageTemplateIds.includes(id))
  }
}

const clearSelection = () => {
  selectedTemplates.value = []
  selectionMode.value = false
}

const handleApplyTemplate = async (template: ConfigTemplate) => {
  try {
    await ElMessageBox.confirm(
      t('config.templates.applyConfirmMessage', { name: template.name }),
      t('config.templates.applyConfirmTitle'),
      {
        confirmButtonText: t('common.apply'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )

    loadingTemplates.value.add(template.id)

    await configStore.applyTemplate(template.id)

    ElMessage.success(t('config.templates.applySuccess', { name: template.name }))

    // Update usage count
    template.usageCount++

  } catch (err) {
    if (err !== 'cancel') {
      console.error('Failed to apply template:', err)
      ElMessage.error(t('config.templates.applyError', { name: template.name }))
    }
  } finally {
    loadingTemplates.value.delete(template.id)
  }
}

const handleEditTemplate = (template: ConfigTemplate) => {
  selectedTemplate.value = template
  editorMode.value = 'edit'
  editorDialogVisible.value = true
}

const handleDuplicateTemplate = (template: ConfigTemplate) => {
  selectedTemplate.value = { ...template, id: '', name: `${template.name} (Copy)` }
  editorMode.value = 'duplicate'
  editorDialogVisible.value = true
}

const handleShareTemplate = (template: ConfigTemplate) => {
  shareTemplate.value = template
  shareDialogVisible.value = true
}

const handleDeleteTemplate = async (template: ConfigTemplate) => {
  try {
    await ElMessageBox.confirm(
      t('config.templates.deleteConfirmMessage', { name: template.name }),
      t('config.templates.deleteConfirmTitle'),
      {
        confirmButtonText: t('common.delete'),
        cancelButtonText: t('common.cancel'),
        type: 'error'
      }
    )

    loadingTemplates.value.add(template.id)

    await configStore.deleteTemplate(template.id)

    // Remove from templates list
    const index = templates.value.findIndex(t => t.id === template.id)
    if (index >= 0) {
      templates.value.splice(index, 1)
    }

    ElMessage.success(t('config.templates.deleteSuccess', { name: template.name }))

  } catch (err) {
    if (err !== 'cancel') {
      console.error('Failed to delete template:', err)
      ElMessage.error(t('config.templates.deleteError', { name: template.name }))
    }
  } finally {
    loadingTemplates.value.delete(template.id)
  }
}

const handlePreviewTemplate = (template: ConfigTemplate) => {
  previewTemplate.value = template
  previewDialogVisible.value = true
}

const handleSaveTemplate = async (templateData: any) => {
  try {
    let savedTemplate: ConfigTemplate

    if (editorMode.value === 'create' || editorMode.value === 'duplicate') {
      savedTemplate = await configStore.createTemplate(templateData)
      templates.value.push(savedTemplate)
      ElMessage.success(t('config.templates.createSuccess'))
    } else {
      savedTemplate = await configStore.updateTemplate(templateData.id, templateData)
      const index = templates.value.findIndex(t => t.id === templateData.id)
      if (index >= 0) {
        templates.value[index] = savedTemplate
      }
      ElMessage.success(t('config.templates.updateSuccess'))
    }

    editorDialogVisible.value = false
  } catch (err) {
    console.error('Failed to save template:', err)
    ElMessage.error(t('config.templates.saveError'))
  }
}

const handleCloseEditor = () => {
  editorDialogVisible.value = false
  selectedTemplate.value = null
}

const handleApplyFromPreview = (template: ConfigTemplate) => {
  previewDialogVisible.value = false
  handleApplyTemplate(template)
}

const handleEditFromPreview = (template: ConfigTemplate) => {
  previewDialogVisible.value = false
  handleEditTemplate(template)
}

const handleClosePreview = () => {
  previewDialogVisible.value = false
  previewTemplate.value = null
}

const handleTemplateShared = () => {
  shareDialogVisible.value = false
  ElMessage.success(t('config.templates.shareSuccess'))
}

const handleCloseShare = () => {
  shareDialogVisible.value = false
  shareTemplate.value = null
}

const handleBulkAction = async (command: string) => {
  try {
    switch (command) {
      case 'export-all':
        await exportAllTemplates()
        break
      case 'import-templates':
        importDialogVisible.value = true
        break
      case 'delete-selected':
        await deleteSelectedTemplates()
        break
    }
  } catch (err) {
    console.error(`Failed to execute bulk action ${command}:`, err)
    ElMessage.error(t('config.templates.bulkActionError'))
  }
}

const exportAllTemplates = async () => {
  try {
    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      templates: templates.value
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tavernai-templates-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    ElMessage.success(t('config.templates.exportSuccess'))
  } catch (err) {
    console.error('Failed to export templates:', err)
    ElMessage.error(t('config.templates.exportError'))
  }
}

const deleteSelectedTemplates = async () => {
  if (selectedTemplates.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      t('config.templates.deleteSelectedConfirmMessage', { count: selectedTemplates.value.length }),
      t('config.templates.deleteSelectedConfirmTitle'),
      {
        confirmButtonText: t('common.delete'),
        cancelButtonText: t('common.cancel'),
        type: 'error'
      }
    )

    for (const templateId of selectedTemplates.value) {
      loadingTemplates.value.add(templateId)
      try {
        await configStore.deleteTemplate(templateId)
        // Remove from templates list
        const index = templates.value.findIndex(t => t.id === templateId)
        if (index >= 0) {
          templates.value.splice(index, 1)
        }
      } catch (err) {
        console.error(`Failed to delete template ${templateId}:`, err)
      } finally {
        loadingTemplates.value.delete(templateId)
      }
    }

    clearSelection()
    ElMessage.success(t('config.templates.deleteSelectedSuccess'))

  } catch (err) {
    if (err !== 'cancel') {
      console.error('Failed to delete selected templates:', err)
      ElMessage.error(t('config.templates.deleteSelectedError'))
    }
  }
}

const handleImportFileChange = (file: any, fileList: any[]) => {
  importFiles.value = fileList.map(f => f.raw)
}

const performImport = async () => {
  try {
    importing.value = true

    const results = await configStore.importTemplates(importFiles.value, importOptions.value)

    ElMessage.success(t('config.templates.importSuccess', {
      imported: results.imported,
      total: importFiles.value.length
    }))

    if (results.errors.length > 0) {
      console.warn('Import errors:', results.errors)
    }

    importDialogVisible.value = false
    importFiles.value = []
    uploadRef.value?.clearFiles()
    await loadTemplates() // Refresh list

  } catch (err) {
    console.error('Failed to import templates:', err)
    ElMessage.error(t('config.templates.importError'))
  } finally {
    importing.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilterChange = () => {
  currentPage.value = 1
}

const handleSortChange = () => {
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const clearSearch = () => {
  searchQuery.value = ''
}

// Lifecycle
onMounted(() => {
  loadTemplates()
})
</script>

<style scoped lang="scss">
.config-template-selector {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900;
}

.selector-header {
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

.filters-section {
  @apply bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;

  .filters-content {
    @apply max-w-7xl mx-auto px-4 py-4 flex items-center gap-4;

    .search-input {
      @apply flex-1 max-w-md;
    }

    .category-option {
      @apply flex items-center justify-between;

      .category-name {
        @apply font-medium;
      }

      .category-badge {
        :deep(.el-badge__content) {
          @apply bg-blue-500 border-blue-500 text-xs;
        }
      }
    }
  }
}

.loading-container,
.error-container {
  @apply max-w-7xl mx-auto px-4 py-8;
}

.templates-container {
  @apply max-w-7xl mx-auto px-4 py-6;

  .selection-bar {
    @apply flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6;

    .selection-info {
      @apply flex items-center gap-4;

      .selection-count {
        @apply text-sm text-blue-700 dark:text-blue-300;
      }
    }

    .selection-actions {
      @apply flex items-center gap-2;
    }
  }

  .templates-grid {
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

// Import Dialog
.import-content {
  .upload-content {
    @apply text-center py-8;

    .upload-icon {
      @apply text-4xl text-gray-400 mb-2;
    }

    .upload-text {
      @apply text-lg text-gray-700 dark:text-gray-300 mb-1;
    }

    .upload-hint {
      @apply text-sm text-gray-500 dark:text-gray-400;
    }
  }

  .import-options {
    @apply mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3;
  }

  .category-assignment {
    @apply mt-4;
  }
}

// Responsive design
@media (max-width: 768px) {
  .selector-header .header-content {
    @apply flex-col items-start gap-4;
  }

  .filters-section .filters-content {
    @apply flex-col gap-3;

    .search-input {
      @apply max-w-full;
    }
  }

  .templates-container {
    @apply px-2;

    .selection-bar {
      @apply flex-col items-start gap-3;
    }

    .templates-grid {
      @apply grid-cols-1 gap-4;
    }
  }
}
</style>