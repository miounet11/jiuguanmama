<template>
  <div class="advanced-config-editor">
    <!-- Header -->
    <div class="editor-header">
      <div class="header-content">
        <div class="title-section">
          <h2 class="page-title">{{ $t('config.advanced.title') }}</h2>
          <p class="page-description">{{ $t('config.advanced.description') }}</p>
        </div>

        <div class="header-actions">
          <el-button @click="resetToDefaults" :loading="resetting">
            <el-icon><Refresh /></el-icon>
            {{ $t('config.advanced.resetDefaults') }}
          </el-button>

          <el-button @click="exportConfig" :loading="exporting">
            <el-icon><Download /></el-icon>
            {{ $t('config.advanced.export') }}
          </el-button>

          <el-button @click="importDialogVisible = true">
            <el-icon><Upload /></el-icon>
            {{ $t('config.advanced.import') }}
          </el-button>

          <el-button type="primary" @click="saveConfig" :loading="saving">
            <el-icon><Check /></el-icon>
            {{ $t('common.save') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="config-navigation">
      <el-tabs v-model="activeTab" class="config-tabs" @tab-change="handleTabChange">
        <el-tab-pane
          v-for="section in configSections"
          :key="section.key"
          :name="section.key"
          :label="section.title"
        >
          <template #label>
            <span class="tab-label">
              <el-icon><component :is="section.icon" /></el-icon>
              {{ section.title }}
              <el-badge
                v-if="hasChangesInSection(section.key)"
                is-dot
                class="change-indicator"
              />
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- Content Area -->
    <div class="config-content">
      <div class="content-container">
        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="8" animated />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-container">
          <el-alert
            :title="$t('config.advanced.loadError')"
            type="error"
            :description="error"
            show-icon
            :closable="false"
          >
            <el-button type="primary" @click="loadConfig">
              {{ $t('common.retry') }}
            </el-button>
          </el-alert>
        </div>

        <!-- Config Form -->
        <div v-else class="config-form">
          <ConfigSection
            v-for="section in configSections"
            :key="section.key"
            v-show="activeTab === section.key"
            :section="section"
            :config="currentConfig"
            :validation-errors="validationErrors"
            :read-only="readOnly"
            @update="handleConfigUpdate"
            @validate="handleValidation"
          />
        </div>

        <!-- Changes Summary -->
        <div v-if="hasChanges" class="changes-summary">
          <div class="summary-header">
            <el-icon class="summary-icon"><EditPen /></el-icon>
            <span class="summary-title">{{ $t('config.advanced.unsavedChanges') }}</span>
            <el-badge :value="changeCount" class="changes-badge" />
          </div>

          <div class="summary-actions">
            <el-button size="small" @click="discardChanges">
              {{ $t('config.advanced.discardChanges') }}
            </el-button>
            <el-button type="primary" size="small" @click="saveConfig" :loading="saving">
              {{ $t('config.advanced.saveChanges') }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Dialog -->
    <el-dialog
      v-model="importDialogVisible"
      :title="$t('config.advanced.importConfig')"
      width="600px"
    >
      <div class="import-content">
        <el-alert
          :title="$t('config.advanced.importWarning')"
          type="warning"
          :description="$t('config.advanced.importWarningDescription')"
          show-icon
          :closable="false"
          class="mb-4"
        />

        <el-tabs v-model="importMethod" class="import-tabs">
          <el-tab-pane label="Upload File" name="file">
            <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :show-file-list="true"
              :limit="1"
              accept=".json,.yaml,.yml"
              @change="handleFileChange"
              drag
            >
              <div class="upload-content">
                <el-icon class="upload-icon"><UploadFilled /></el-icon>
                <div class="upload-text">
                  {{ $t('config.advanced.dragFileHere') }}
                </div>
                <div class="upload-hint">
                  {{ $t('config.advanced.supportedFormats') }}
                </div>
              </div>
            </el-upload>
          </el-tab-pane>

          <el-tab-pane label="Paste JSON" name="paste">
            <el-input
              v-model="pastedConfig"
              type="textarea"
              :rows="12"
              :placeholder="$t('config.advanced.pasteConfigHere')"
              class="config-textarea"
            />
          </el-tab-pane>

          <el-tab-pane label="Load Template" name="template">
            <div class="template-selection">
              <el-select
                v-model="selectedTemplate"
                :placeholder="$t('config.advanced.selectTemplate')"
                class="template-select"
                @change="loadTemplate"
              >
                <el-option
                  v-for="template in availableTemplates"
                  :key="template.id"
                  :label="template.name"
                  :value="template.id"
                >
                  <div class="template-option">
                    <span class="template-name">{{ template.name }}</span>
                    <span class="template-description">{{ template.description }}</span>
                  </div>
                </el-option>
              </el-select>

              <div v-if="selectedTemplateData" class="template-preview">
                <h4>{{ $t('config.advanced.templatePreview') }}</h4>
                <pre class="template-code">{{ formatJSON(selectedTemplateData) }}</pre>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>

        <!-- Import Options -->
        <div class="import-options">
          <el-checkbox v-model="importOptions.mergeMode">
            {{ $t('config.advanced.mergeWithExisting') }}
          </el-checkbox>
          <el-checkbox v-model="importOptions.validateOnImport">
            {{ $t('config.advanced.validateOnImport') }}
          </el-checkbox>
          <el-checkbox v-model="importOptions.createBackup">
            {{ $t('config.advanced.createBackupBeforeImport') }}
          </el-checkbox>
        </div>
      </div>

      <template #footer>
        <div class="import-footer">
          <el-button @click="importDialogVisible = false">
            {{ $t('common.cancel') }}
          </el-button>
          <el-button
            type="primary"
            @click="performImport"
            :loading="importing"
            :disabled="!canImport"
          >
            {{ $t('config.advanced.import') }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Validation Dialog -->
    <el-dialog
      v-model="validationDialogVisible"
      :title="$t('config.advanced.validationResults')"
      width="700px"
    >
      <div class="validation-content">
        <div v-if="validationResults.errors?.length" class="validation-section">
          <h4 class="validation-title error">
            <el-icon><CircleCloseFilled /></el-icon>
            {{ $t('config.advanced.validationErrors') }} ({{ validationResults.errors.length }})
          </h4>
          <div class="validation-list">
            <div
              v-for="(error, index) in validationResults.errors"
              :key="index"
              class="validation-item error"
            >
              <div class="validation-path">{{ error.path }}</div>
              <div class="validation-message">{{ error.message }}</div>
            </div>
          </div>
        </div>

        <div v-if="validationResults.warnings?.length" class="validation-section">
          <h4 class="validation-title warning">
            <el-icon><WarningFilled /></el-icon>
            {{ $t('config.advanced.validationWarnings') }} ({{ validationResults.warnings.length }})
          </h4>
          <div class="validation-list">
            <div
              v-for="(warning, index) in validationResults.warnings"
              :key="index"
              class="validation-item warning"
            >
              <div class="validation-path">{{ warning.path }}</div>
              <div class="validation-message">{{ warning.message }}</div>
            </div>
          </div>
        </div>

        <div v-if="validationResults.suggestions?.length" class="validation-section">
          <h4 class="validation-title info">
            <el-icon><InfoFilled /></el-icon>
            {{ $t('config.advanced.validationSuggestions') }} ({{ validationResults.suggestions.length }})
          </h4>
          <div class="validation-list">
            <div
              v-for="(suggestion, index) in validationResults.suggestions"
              :key="index"
              class="validation-item info"
            >
              <div class="validation-path">{{ suggestion.path }}</div>
              <div class="validation-message">{{ suggestion.message }}</div>
              <el-button
                v-if="suggestion.autoFix"
                size="small"
                type="primary"
                @click="applySuggestion(suggestion)"
              >
                {{ $t('config.advanced.applyFix') }}
              </el-button>
            </div>
          </div>
        </div>

        <div v-if="!hasValidationIssues" class="validation-success">
          <el-icon class="success-icon"><CircleCheckFilled /></el-icon>
          <h4>{{ $t('config.advanced.configurationValid') }}</h4>
          <p>{{ $t('config.advanced.noIssuesFound') }}</p>
        </div>
      </div>

      <template #footer>
        <el-button @click="validationDialogVisible = false">
          {{ $t('common.close') }}
        </el-button>
        <el-button
          v-if="hasValidationIssues"
          type="primary"
          @click="validateConfig"
        >
          {{ $t('config.advanced.revalidate') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh, Download, Upload, Check, EditPen, UploadFilled,
  CircleCloseFilled, WarningFilled, InfoFilled, CircleCheckFilled,
  Setting, Monitor, Shield, Bell, Code, Database, Cloud, Cpu
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import ConfigSection from './ConfigSection.vue'
import { useConfigStore } from '@/stores/config'

interface ConfigSectionDef {
  key: string
  title: string
  description: string
  icon: any
  fields: ConfigField[]
}

interface ConfigField {
  key: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'select' | 'multi-select'
  label: string
  description?: string
  required?: boolean
  default?: any
  validation?: {
    min?: number
    max?: number
    pattern?: string
    custom?: (value: any) => string | null
  }
  options?: Array<{ label: string; value: any }>
  dependencies?: string[]
  advanced?: boolean
}

interface ValidationError {
  path: string
  message: string
  severity: 'error' | 'warning' | 'info'
}

interface ValidationResults {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  suggestions: Array<ValidationError & { autoFix?: () => void }>
}

interface ConfigTemplate {
  id: string
  name: string
  description: string
  config: Record<string, any>
  category: string
}

const { t } = useI18n()
const configStore = useConfigStore()

// Reactive state
const loading = ref(true)
const saving = ref(false)
const exporting = ref(false)
const importing = ref(false)
const resetting = ref(false)
const error = ref<string | null>(null)

const activeTab = ref('general')
const readOnly = ref(false)

const originalConfig = ref<Record<string, any>>({})
const currentConfig = ref<Record<string, any>>({})
const validationErrors = ref<Record<string, string>>({})

// Import dialog
const importDialogVisible = ref(false)
const importMethod = ref('file')
const uploadRef = ref()
const selectedFile = ref<File | null>(null)
const pastedConfig = ref('')
const selectedTemplate = ref('')
const selectedTemplateData = ref<Record<string, any> | null>(null)
const availableTemplates = ref<ConfigTemplate[]>([])

const importOptions = ref({
  mergeMode: false,
  validateOnImport: true,
  createBackup: true
})

// Validation dialog
const validationDialogVisible = ref(false)
const validationResults = ref<ValidationResults>({
  valid: true,
  errors: [],
  warnings: [],
  suggestions: []
})

// Configuration sections
const configSections = ref<ConfigSectionDef[]>([
  {
    key: 'general',
    title: t('config.sections.general'),
    description: t('config.sections.generalDescription'),
    icon: Setting,
    fields: [
      {
        key: 'appName',
        type: 'string',
        label: t('config.fields.appName'),
        description: t('config.fields.appNameDescription'),
        required: true,
        default: 'TavernAI Plus'
      },
      {
        key: 'debugMode',
        type: 'boolean',
        label: t('config.fields.debugMode'),
        description: t('config.fields.debugModeDescription'),
        default: false
      },
      {
        key: 'logLevel',
        type: 'select',
        label: t('config.fields.logLevel'),
        description: t('config.fields.logLevelDescription'),
        default: 'info',
        options: [
          { label: 'Debug', value: 'debug' },
          { label: 'Info', value: 'info' },
          { label: 'Warn', value: 'warn' },
          { label: 'Error', value: 'error' }
        ]
      }
    ]
  },
  {
    key: 'ui',
    title: t('config.sections.ui'),
    description: t('config.sections.uiDescription'),
    icon: Monitor,
    fields: [
      {
        key: 'theme',
        type: 'select',
        label: t('config.fields.theme'),
        description: t('config.fields.themeDescription'),
        default: 'auto',
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' }
        ]
      },
      {
        key: 'compactMode',
        type: 'boolean',
        label: t('config.fields.compactMode'),
        description: t('config.fields.compactModeDescription'),
        default: false
      },
      {
        key: 'animationsEnabled',
        type: 'boolean',
        label: t('config.fields.animationsEnabled'),
        description: t('config.fields.animationsEnabledDescription'),
        default: true
      }
    ]
  },
  {
    key: 'security',
    title: t('config.sections.security'),
    description: t('config.sections.securityDescription'),
    icon: Shield,
    fields: [
      {
        key: 'sessionTimeout',
        type: 'number',
        label: t('config.fields.sessionTimeout'),
        description: t('config.fields.sessionTimeoutDescription'),
        default: 3600,
        validation: { min: 300, max: 86400 }
      },
      {
        key: 'requireMfa',
        type: 'boolean',
        label: t('config.fields.requireMfa'),
        description: t('config.fields.requireMfaDescription'),
        default: false,
        advanced: true
      },
      {
        key: 'allowedOrigins',
        type: 'array',
        label: t('config.fields.allowedOrigins'),
        description: t('config.fields.allowedOriginsDescription'),
        default: ['*'],
        advanced: true
      }
    ]
  },
  {
    key: 'notifications',
    title: t('config.sections.notifications'),
    description: t('config.sections.notificationsDescription'),
    icon: Bell,
    fields: [
      {
        key: 'enableNotifications',
        type: 'boolean',
        label: t('config.fields.enableNotifications'),
        description: t('config.fields.enableNotificationsDescription'),
        default: true
      },
      {
        key: 'notificationSound',
        type: 'boolean',
        label: t('config.fields.notificationSound'),
        description: t('config.fields.notificationSoundDescription'),
        default: true,
        dependencies: ['enableNotifications']
      },
      {
        key: 'notificationTypes',
        type: 'multi-select',
        label: t('config.fields.notificationTypes'),
        description: t('config.fields.notificationTypesDescription'),
        default: ['messages', 'system'],
        options: [
          { label: 'Messages', value: 'messages' },
          { label: 'System', value: 'system' },
          { label: 'Updates', value: 'updates' },
          { label: 'Errors', value: 'errors' }
        ],
        dependencies: ['enableNotifications']
      }
    ]
  },
  {
    key: 'advanced',
    title: t('config.sections.advanced'),
    description: t('config.sections.advancedDescription'),
    icon: Code,
    fields: [
      {
        key: 'experimentalFeatures',
        type: 'boolean',
        label: t('config.fields.experimentalFeatures'),
        description: t('config.fields.experimentalFeaturesDescription'),
        default: false,
        advanced: true
      },
      {
        key: 'customCss',
        type: 'string',
        label: t('config.fields.customCss'),
        description: t('config.fields.customCssDescription'),
        default: '',
        advanced: true
      },
      {
        key: 'apiTimeout',
        type: 'number',
        label: t('config.fields.apiTimeout'),
        description: t('config.fields.apiTimeoutDescription'),
        default: 30000,
        validation: { min: 1000, max: 300000 },
        advanced: true
      }
    ]
  }
])

// Computed properties
const hasChanges = computed(() => {
  return JSON.stringify(currentConfig.value) !== JSON.stringify(originalConfig.value)
})

const changeCount = computed(() => {
  let count = 0
  const compare = (obj1: any, obj2: any, path = '') => {
    for (const key in obj1) {
      const newPath = path ? `${path}.${key}` : key
      if (obj1[key] !== obj2[key]) {
        if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
          compare(obj1[key], obj2[key], newPath)
        } else {
          count++
        }
      }
    }
  }
  compare(currentConfig.value, originalConfig.value)
  return count
})

const canImport = computed(() => {
  return (importMethod.value === 'file' && selectedFile.value) ||
         (importMethod.value === 'paste' && pastedConfig.value.trim()) ||
         (importMethod.value === 'template' && selectedTemplateData.value)
})

const hasValidationIssues = computed(() => {
  return validationResults.value.errors.length > 0 ||
         validationResults.value.warnings.length > 0
})

// Methods
const loadConfig = async () => {
  try {
    loading.value = true
    error.value = null

    const config = await configStore.loadAdvancedConfig()
    originalConfig.value = JSON.parse(JSON.stringify(config))
    currentConfig.value = JSON.parse(JSON.stringify(config))

  } catch (err) {
    console.error('Failed to load config:', err)
    error.value = err instanceof Error ? err.message : 'Unknown error'
    ElMessage.error(t('config.advanced.loadError'))
  } finally {
    loading.value = false
  }
}

const saveConfig = async () => {
  try {
    saving.value = true

    // Validate before saving
    const validation = await validateConfigData(currentConfig.value)
    if (!validation.valid && validation.errors.length > 0) {
      validationResults.value = validation
      validationDialogVisible.value = true
      return
    }

    await configStore.saveAdvancedConfig(currentConfig.value)
    originalConfig.value = JSON.parse(JSON.stringify(currentConfig.value))

    ElMessage.success(t('config.advanced.saveSuccess'))
  } catch (err) {
    console.error('Failed to save config:', err)
    ElMessage.error(t('config.advanced.saveError'))
  } finally {
    saving.value = false
  }
}

const resetToDefaults = async () => {
  try {
    await ElMessageBox.confirm(
      t('config.advanced.resetConfirmMessage'),
      t('config.advanced.resetConfirmTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )

    resetting.value = true

    const defaults = await configStore.getDefaultConfig()
    currentConfig.value = JSON.parse(JSON.stringify(defaults))

    ElMessage.success(t('config.advanced.resetSuccess'))
  } catch (err) {
    if (err !== 'cancel') {
      console.error('Failed to reset config:', err)
      ElMessage.error(t('config.advanced.resetError'))
    }
  } finally {
    resetting.value = false
  }
}

const exportConfig = async () => {
  try {
    exporting.value = true

    const config = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      config: currentConfig.value
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tavernai-config-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    ElMessage.success(t('config.advanced.exportSuccess'))
  } catch (err) {
    console.error('Failed to export config:', err)
    ElMessage.error(t('config.advanced.exportError'))
  } finally {
    exporting.value = false
  }
}

const performImport = async () => {
  try {
    importing.value = true

    let configToImport: any = null

    if (importMethod.value === 'file' && selectedFile.value) {
      const text = await selectedFile.value.text()
      configToImport = JSON.parse(text)
    } else if (importMethod.value === 'paste' && pastedConfig.value) {
      configToImport = JSON.parse(pastedConfig.value)
    } else if (importMethod.value === 'template' && selectedTemplateData.value) {
      configToImport = selectedTemplateData.value
    }

    if (!configToImport) {
      throw new Error('No configuration data to import')
    }

    // Extract config from export format if needed
    const config = configToImport.config || configToImport

    // Validate if requested
    if (importOptions.value.validateOnImport) {
      const validation = await validateConfigData(config)
      if (!validation.valid && validation.errors.length > 0) {
        validationResults.value = validation
        validationDialogVisible.value = true
        importing.value = false
        return
      }
    }

    // Create backup if requested
    if (importOptions.value.createBackup) {
      await configStore.createBackup()
    }

    // Apply configuration
    if (importOptions.value.mergeMode) {
      currentConfig.value = { ...currentConfig.value, ...config }
    } else {
      currentConfig.value = config
    }

    importDialogVisible.value = false
    ElMessage.success(t('config.advanced.importSuccess'))

  } catch (err) {
    console.error('Failed to import config:', err)
    ElMessage.error(t('config.advanced.importError', {
      error: err instanceof Error ? err.message : 'Unknown error'
    }))
  } finally {
    importing.value = false
  }
}

const validateConfig = async () => {
  const validation = await validateConfigData(currentConfig.value)
  validationResults.value = validation
  validationDialogVisible.value = true
}

const validateConfigData = async (config: any): Promise<ValidationResults> => {
  const results: ValidationResults = {
    valid: true,
    errors: [],
    warnings: [],
    suggestions: []
  }

  // Validate each section
  for (const section of configSections.value) {
    for (const field of section.fields) {
      const value = getNestedValue(config, field.key)
      const path = `${section.key}.${field.key}`

      // Required field validation
      if (field.required && (value === undefined || value === null || value === '')) {
        results.errors.push({
          path,
          message: t('config.validation.required', { field: field.label }),
          severity: 'error'
        })
        results.valid = false
      }

      // Type validation
      if (value !== undefined && value !== null) {
        const expectedType = field.type
        const actualType = Array.isArray(value) ? 'array' : typeof value

        if (expectedType !== actualType && expectedType !== 'multi-select') {
          results.errors.push({
            path,
            message: t('config.validation.type', {
              field: field.label,
              expected: expectedType,
              actual: actualType
            }),
            severity: 'error'
          })
          results.valid = false
        }
      }

      // Custom validation
      if (field.validation && value !== undefined) {
        const validation = field.validation

        if (validation.min !== undefined && typeof value === 'number' && value < validation.min) {
          results.errors.push({
            path,
            message: t('config.validation.min', { field: field.label, min: validation.min }),
            severity: 'error'
          })
          results.valid = false
        }

        if (validation.max !== undefined && typeof value === 'number' && value > validation.max) {
          results.errors.push({
            path,
            message: t('config.validation.max', { field: field.label, max: validation.max }),
            severity: 'error'
          })
          results.valid = false
        }

        if (validation.pattern && typeof value === 'string' && !new RegExp(validation.pattern).test(value)) {
          results.errors.push({
            path,
            message: t('config.validation.pattern', { field: field.label }),
            severity: 'error'
          })
          results.valid = false
        }

        if (validation.custom) {
          const customError = validation.custom(value)
          if (customError) {
            results.errors.push({
              path,
              message: customError,
              severity: 'error'
            })
            results.valid = false
          }
        }
      }

      // Dependency validation
      if (field.dependencies) {
        for (const depKey of field.dependencies) {
          const depValue = getNestedValue(config, depKey)
          if (!depValue && value) {
            results.warnings.push({
              path,
              message: t('config.validation.dependency', {
                field: field.label,
                dependency: depKey
              }),
              severity: 'warning'
            })
          }
        }
      }
    }
  }

  return results
}

const discardChanges = async () => {
  try {
    await ElMessageBox.confirm(
      t('config.advanced.discardConfirmMessage'),
      t('config.advanced.discardConfirmTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )

    currentConfig.value = JSON.parse(JSON.stringify(originalConfig.value))
    ElMessage.success(t('config.advanced.changesDiscarded'))
  } catch (err) {
    // User cancelled
  }
}

const hasChangesInSection = (sectionKey: string): boolean => {
  const section = configSections.value.find(s => s.key === sectionKey)
  if (!section) return false

  return section.fields.some(field => {
    const currentValue = getNestedValue(currentConfig.value, field.key)
    const originalValue = getNestedValue(originalConfig.value, field.key)
    return JSON.stringify(currentValue) !== JSON.stringify(originalValue)
  })
}

const handleTabChange = (tabName: string) => {
  activeTab.value = tabName
}

const handleConfigUpdate = (key: string, value: any) => {
  setNestedValue(currentConfig.value, key, value)
}

const handleValidation = (key: string, error: string | null) => {
  if (error) {
    validationErrors.value[key] = error
  } else {
    delete validationErrors.value[key]
  }
}

const handleFileChange = (file: any) => {
  selectedFile.value = file.raw
}

const loadTemplate = async (templateId: string) => {
  const template = availableTemplates.value.find(t => t.id === templateId)
  if (template) {
    selectedTemplateData.value = template.config
  }
}

const applySuggestion = (suggestion: any) => {
  if (suggestion.autoFix) {
    suggestion.autoFix()
    ElMessage.success(t('config.advanced.suggestionApplied'))
  }
}

// Utility functions
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

const setNestedValue = (obj: any, path: string, value: any): void => {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {}
    return current[key]
  }, obj)
  target[lastKey] = value
}

const formatJSON = (obj: any): string => {
  return JSON.stringify(obj, null, 2)
}

// Lifecycle
onMounted(async () => {
  await loadConfig()

  // Load available templates
  try {
    availableTemplates.value = await configStore.getAvailableTemplates()
  } catch (err) {
    console.warn('Failed to load templates:', err)
  }
})

// Auto-save functionality (optional)
let autoSaveTimer: number | null = null
watch(currentConfig, () => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  autoSaveTimer = setTimeout(() => {
    if (hasChanges.value) {
      // Auto-save logic could go here
    }
  }, 5000)
}, { deep: true })
</script>

<style scoped lang="scss">
.advanced-config-editor {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900;
}

.editor-header {
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

.config-navigation {
  @apply bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;

  .config-tabs {
    @apply max-w-7xl mx-auto px-4;

    :deep(.el-tabs__header) {
      @apply mb-0;
    }

    .tab-label {
      @apply flex items-center gap-2;

      .change-indicator {
        :deep(.el-badge__content) {
          @apply bg-orange-500 border-orange-500;
        }
      }
    }
  }
}

.config-content {
  @apply max-w-7xl mx-auto;

  .content-container {
    @apply px-4 py-6;
  }

  .loading-container,
  .error-container {
    @apply py-8;
  }

  .config-form {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm;
  }

  .changes-summary {
    @apply fixed bottom-6 right-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50;

    .summary-header {
      @apply flex items-center gap-3 mb-3;

      .summary-icon {
        @apply text-orange-500;
      }

      .summary-title {
        @apply font-semibold text-gray-900 dark:text-white;
      }

      .changes-badge {
        :deep(.el-badge__content) {
          @apply bg-orange-500 border-orange-500;
        }
      }
    }

    .summary-actions {
      @apply flex items-center gap-2;
    }
  }
}

// Import Dialog
.import-content {
  .import-tabs {
    @apply mb-6;
  }

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

  .config-textarea {
    @apply font-mono;
  }

  .template-selection {
    .template-select {
      @apply w-full mb-4;
    }

    .template-option {
      .template-name {
        @apply block font-medium;
      }

      .template-description {
        @apply block text-sm text-gray-500 dark:text-gray-400;
      }
    }

    .template-preview {
      @apply bg-gray-50 dark:bg-gray-900 rounded-lg p-4;

      h4 {
        @apply font-semibold mb-3;
      }

      .template-code {
        @apply bg-gray-900 text-green-400 p-3 rounded text-xs overflow-auto max-h-40;
      }
    }
  }

  .import-options {
    @apply mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3;
  }
}

// Validation Dialog
.validation-content {
  .validation-section {
    @apply mb-6;

    .validation-title {
      @apply flex items-center gap-2 font-semibold mb-3;

      &.error {
        @apply text-red-600 dark:text-red-400;
      }

      &.warning {
        @apply text-yellow-600 dark:text-yellow-400;
      }

      &.info {
        @apply text-blue-600 dark:text-blue-400;
      }
    }

    .validation-list {
      @apply space-y-3;

      .validation-item {
        @apply p-3 rounded-lg;

        &.error {
          @apply bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800;
        }

        &.warning {
          @apply bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800;
        }

        &.info {
          @apply bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800;
        }

        .validation-path {
          @apply font-mono text-sm text-gray-600 dark:text-gray-400 mb-1;
        }

        .validation-message {
          @apply text-gray-800 dark:text-gray-200;
        }
      }
    }
  }

  .validation-success {
    @apply text-center py-8;

    .success-icon {
      @apply text-6xl text-green-500 mb-4;
    }

    h4 {
      @apply text-xl font-semibold text-gray-900 dark:text-white mb-2;
    }

    p {
      @apply text-gray-600 dark:text-gray-400;
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .editor-header .header-content {
    @apply flex-col items-start gap-4;
  }

  .config-tabs {
    :deep(.el-tabs__nav-scroll) {
      @apply overflow-x-auto;
    }
  }

  .changes-summary {
    @apply fixed bottom-0 left-0 right-0 rounded-none border-x-0 border-b-0;
  }
}
</style>