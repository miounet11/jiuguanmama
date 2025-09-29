<template>
  <el-dialog
    v-model="visible"
    :title="$t('extensions.wizard.title')"
    width="800px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="installation-wizard"
    @close="handleClose"
  >
    <div class="wizard-content">
      <!-- Progress Steps -->
      <el-steps :active="currentStep" align-center class="wizard-steps">
        <el-step
          :title="$t('extensions.wizard.steps.selection')"
          :icon="Search"
        />
        <el-step
          :title="$t('extensions.wizard.steps.compatibility')"
          :icon="Shield"
        />
        <el-step
          :title="$t('extensions.wizard.steps.permissions')"
          :icon="Lock"
        />
        <el-step
          :title="$t('extensions.wizard.steps.configuration')"
          :icon="Settings"
        />
        <el-step
          :title="$t('extensions.wizard.steps.installation')"
          :icon="Download"
        />
      </el-steps>

      <!-- Step Content -->
      <div class="step-content">
        <!-- Step 0: Extension Selection -->
        <div v-if="currentStep === 0" class="step-selection">
          <div class="step-header">
            <h3 class="step-title">{{ $t('extensions.wizard.selection.title') }}</h3>
            <p class="step-description">{{ $t('extensions.wizard.selection.description') }}</p>
          </div>

          <!-- Extension Details -->
          <div v-if="extension" class="extension-preview">
            <div class="extension-info">
              <div class="extension-icon">
                <img
                  v-if="extension.icon"
                  :src="extension.icon"
                  :alt="extension.displayName"
                  class="icon-image"
                />
                <el-icon v-else class="icon-placeholder">
                  <Box />
                </el-icon>
              </div>

              <div class="extension-details">
                <h4 class="extension-name">{{ extension.displayName }}</h4>
                <p class="extension-author">{{ $t('extensions.wizard.byAuthor', { author: extension.author }) }}</p>
                <p class="extension-version">{{ $t('extensions.wizard.version', { version: extension.version }) }}</p>
                <div class="extension-tags">
                  <el-tag
                    v-for="tag in extension.tags"
                    :key="tag"
                    size="small"
                    class="tag-item"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>

              <div class="extension-stats">
                <div class="stat-item">
                  <el-icon><Star /></el-icon>
                  <span>{{ extension.rating?.toFixed(1) || 'N/A' }}</span>
                </div>
                <div class="stat-item">
                  <el-icon><Download /></el-icon>
                  <span>{{ formatDownloads(extension.downloadCount) }}</span>
                </div>
                <div class="stat-item">
                  <el-icon><Files /></el-icon>
                  <span>{{ formatBytes(extension.size) }}</span>
                </div>
              </div>
            </div>

            <div class="extension-description">
              <h5>{{ $t('extensions.wizard.description') }}</h5>
              <p>{{ extension.description }}</p>
            </div>

            <!-- Screenshots -->
            <div v-if="extension.screenshots?.length" class="extension-screenshots">
              <h5>{{ $t('extensions.wizard.screenshots') }}</h5>
              <div class="screenshots-grid">
                <img
                  v-for="(screenshot, index) in extension.screenshots.slice(0, 4)"
                  :key="index"
                  :src="screenshot"
                  :alt="`Screenshot ${index + 1}`"
                  class="screenshot-item"
                  @click="openScreenshot(screenshot)"
                />
              </div>
            </div>
          </div>

          <div v-else class="no-extension">
            <el-icon class="no-extension-icon"><Box /></el-icon>
            <p>{{ $t('extensions.wizard.noExtensionSelected') }}</p>
          </div>
        </div>

        <!-- Step 1: Compatibility Check -->
        <div v-else-if="currentStep === 1" class="step-compatibility">
          <div class="step-header">
            <h3 class="step-title">{{ $t('extensions.wizard.compatibility.title') }}</h3>
            <p class="step-description">{{ $t('extensions.wizard.compatibility.description') }}</p>
          </div>

          <div v-if="compatibilityLoading" class="compatibility-loading">
            <el-skeleton :rows="4" animated />
          </div>

          <div v-else class="compatibility-results">
            <!-- System Requirements -->
            <div class="requirement-section">
              <h4 class="section-title">{{ $t('extensions.wizard.systemRequirements') }}</h4>
              <div class="requirement-list">
                <div
                  v-for="requirement in systemRequirements"
                  :key="requirement.name"
                  class="requirement-item"
                  :class="{ 'requirement-failed': !requirement.satisfied }"
                >
                  <el-icon class="requirement-icon">
                    <Check v-if="requirement.satisfied" />
                    <Close v-else />
                  </el-icon>
                  <div class="requirement-content">
                    <span class="requirement-name">{{ requirement.name }}</span>
                    <span class="requirement-status">{{ requirement.message }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Dependencies -->
            <div v-if="dependencies.length" class="dependency-section">
              <h4 class="section-title">{{ $t('extensions.wizard.dependencies') }}</h4>
              <div class="dependency-list">
                <div
                  v-for="dependency in dependencies"
                  :key="dependency.id"
                  class="dependency-item"
                  :class="{ 'dependency-missing': !dependency.satisfied }"
                >
                  <el-icon class="dependency-icon">
                    <Check v-if="dependency.satisfied" />
                    <Warning v-else-if="dependency.optional" />
                    <Close v-else />
                  </el-icon>
                  <div class="dependency-content">
                    <span class="dependency-name">{{ dependency.name }}</span>
                    <span class="dependency-version">{{ dependency.version }}</span>
                    <span
                      v-if="dependency.optional"
                      class="dependency-optional"
                    >
                      ({{ $t('extensions.wizard.optional') }})
                    </span>
                  </div>
                  <el-button
                    v-if="!dependency.satisfied && !dependency.optional"
                    size="small"
                    type="primary"
                    @click="installDependency(dependency)"
                  >
                    {{ $t('extensions.wizard.install') }}
                  </el-button>
                </div>
              </div>
            </div>

            <!-- Warnings -->
            <div v-if="warnings.length" class="warnings-section">
              <h4 class="section-title">{{ $t('extensions.wizard.warnings') }}</h4>
              <div class="warnings-list">
                <el-alert
                  v-for="(warning, index) in warnings"
                  :key="index"
                  :title="warning.title"
                  type="warning"
                  :description="warning.message"
                  show-icon
                  :closable="false"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Permissions -->
        <div v-else-if="currentStep === 2" class="step-permissions">
          <div class="step-header">
            <h3 class="step-title">{{ $t('extensions.wizard.permissions.title') }}</h3>
            <p class="step-description">{{ $t('extensions.wizard.permissions.description') }}</p>
          </div>

          <div class="permissions-list">
            <div
              v-for="permission in permissions"
              :key="permission.name"
              class="permission-item"
            >
              <div class="permission-header">
                <el-icon
                  :class="['permission-icon', getPermissionIconClass(permission.level)]"
                >
                  <component :is="getPermissionIcon(permission.level)" />
                </el-icon>
                <div class="permission-info">
                  <span class="permission-name">{{ permission.displayName }}</span>
                  <span class="permission-level">{{ $t(`extensions.wizard.permissionLevels.${permission.level}`) }}</span>
                </div>
                <el-switch
                  v-model="permission.granted"
                  :disabled="permission.required"
                />
              </div>
              <div class="permission-description">
                <p>{{ permission.description }}</p>
                <div v-if="permission.details" class="permission-details">
                  <ul>
                    <li v-for="detail in permission.details" :key="detail">{{ detail }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Configuration -->
        <div v-else-if="currentStep === 3" class="step-configuration">
          <div class="step-header">
            <h3 class="step-title">{{ $t('extensions.wizard.configuration.title') }}</h3>
            <p class="step-description">{{ $t('extensions.wizard.configuration.description') }}</p>
          </div>

          <div v-if="configOptions.length" class="config-form">
            <div
              v-for="option in configOptions"
              :key="option.key"
              class="config-option"
            >
              <label class="config-label">
                {{ option.displayName }}
                <span v-if="option.required" class="required-mark">*</span>
              </label>
              <div class="config-input">
                <!-- String input -->
                <el-input
                  v-if="option.type === 'string'"
                  v-model="configuration[option.key]"
                  :placeholder="option.placeholder"
                  :disabled="option.disabled"
                />
                <!-- Number input -->
                <el-input-number
                  v-else-if="option.type === 'number'"
                  v-model="configuration[option.key]"
                  :min="option.min"
                  :max="option.max"
                  :step="option.step"
                  :disabled="option.disabled"
                />
                <!-- Boolean input -->
                <el-switch
                  v-else-if="option.type === 'boolean'"
                  v-model="configuration[option.key]"
                  :disabled="option.disabled"
                />
                <!-- Select input -->
                <el-select
                  v-else-if="option.type === 'select'"
                  v-model="configuration[option.key]"
                  :placeholder="option.placeholder"
                  :disabled="option.disabled"
                >
                  <el-option
                    v-for="choice in option.choices"
                    :key="choice.value"
                    :label="choice.label"
                    :value="choice.value"
                  />
                </el-select>
              </div>
              <div v-if="option.description" class="config-description">
                {{ option.description }}
              </div>
            </div>
          </div>

          <div v-else class="no-config">
            <el-icon class="no-config-icon"><Settings /></el-icon>
            <p>{{ $t('extensions.wizard.noConfigRequired') }}</p>
          </div>
        </div>

        <!-- Step 4: Installation -->
        <div v-else-if="currentStep === 4" class="step-installation">
          <div class="step-header">
            <h3 class="step-title">{{ $t('extensions.wizard.installation.title') }}</h3>
            <p class="step-description">{{ $t('extensions.wizard.installation.description') }}</p>
          </div>

          <div v-if="!installationStarted" class="installation-summary">
            <div class="summary-section">
              <h4>{{ $t('extensions.wizard.installationSummary') }}</h4>
              <div class="summary-item">
                <strong>{{ $t('extensions.wizard.extension') }}:</strong>
                {{ extension?.displayName }} v{{ extension?.version }}
              </div>
              <div class="summary-item">
                <strong>{{ $t('extensions.wizard.size') }}:</strong>
                {{ formatBytes(extension?.size || 0) }}
              </div>
              <div v-if="grantedPermissions.length" class="summary-item">
                <strong>{{ $t('extensions.wizard.permissions') }}:</strong>
                {{ grantedPermissions.join(', ') }}
              </div>
            </div>
          </div>

          <div v-else class="installation-progress">
            <div class="progress-section">
              <el-progress
                :percentage="installationProgress"
                :status="installationStatus"
                :stroke-width="8"
              />
              <div class="progress-message">{{ installationMessage }}</div>
            </div>

            <div v-if="installationLogs.length" class="installation-logs">
              <h5>{{ $t('extensions.wizard.installationLogs') }}</h5>
              <div class="logs-container">
                <div
                  v-for="(log, index) in installationLogs"
                  :key="index"
                  class="log-entry"
                  :class="`log-${log.level}`"
                >
                  <span class="log-time">{{ formatTime(log.timestamp) }}</span>
                  <span class="log-message">{{ log.message }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="wizard-footer">
        <div class="footer-info">
          <span v-if="currentStep < 4" class="step-indicator">
            {{ $t('extensions.wizard.stepIndicator', { current: currentStep + 1, total: 5 }) }}
          </span>
        </div>

        <div class="footer-actions">
          <el-button
            v-if="currentStep > 0 && !installationStarted"
            @click="handlePrevious"
          >
            {{ $t('common.previous') }}
          </el-button>

          <el-button
            v-if="currentStep < 4"
            type="primary"
            :disabled="!canProceed"
            @click="handleNext"
          >
            {{ $t('common.next') }}
          </el-button>

          <el-button
            v-else-if="!installationStarted"
            type="primary"
            @click="startInstallation"
            :disabled="installing"
          >
            {{ $t('extensions.wizard.startInstallation') }}
          </el-button>

          <el-button
            v-else-if="installationComplete"
            type="primary"
            @click="handleFinish"
          >
            {{ $t('common.finish') }}
          </el-button>

          <el-button @click="handleClose">
            {{ installationStarted ? $t('common.close') : $t('common.cancel') }}
          </el-button>
        </div>
      </div>
    </template>

    <!-- Screenshot Preview Dialog -->
    <el-dialog
      v-model="screenshotPreviewVisible"
      title=""
      width="80%"
      center
    >
      <img
        :src="selectedScreenshot"
        alt="Screenshot preview"
        class="screenshot-preview"
      />
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search, Shield, Lock, Settings, Download, Box, Star, Files,
  Check, Close, Warning
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useExtensionStore } from '@/stores/extensions'

interface Extension {
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
  downloadCount: number
  size: number
  permissions: string[]
  dependencies: Array<{
    id: string
    version: string
    optional: boolean
  }>
  compatibility: {
    minVersion: string
    maxVersion?: string
    platforms: string[]
  }
  configSchema?: any
}

interface Props {
  visible: boolean
  extension: Extension | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'installed', extension: Extension): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()
const extensionStore = useExtensionStore()

// Reactive state
const currentStep = ref(0)
const compatibilityLoading = ref(false)
const installing = ref(false)
const installationStarted = ref(false)
const installationComplete = ref(false)
const installationProgress = ref(0)
const installationStatus = ref<'success' | 'exception' | undefined>()
const installationMessage = ref('')
const installationLogs = ref<Array<{ level: string; message: string; timestamp: Date }>>([])

const systemRequirements = ref<Array<{
  name: string
  satisfied: boolean
  message: string
}>>([])

const dependencies = ref<Array<{
  id: string
  name: string
  version: string
  optional: boolean
  satisfied: boolean
}>>([])

const warnings = ref<Array<{
  title: string
  message: string
}>>([])

const permissions = ref<Array<{
  name: string
  displayName: string
  description: string
  level: 'low' | 'medium' | 'high'
  required: boolean
  granted: boolean
  details?: string[]
}>>([])

const configOptions = ref<Array<{
  key: string
  type: 'string' | 'number' | 'boolean' | 'select'
  displayName: string
  description?: string
  required: boolean
  placeholder?: string
  min?: number
  max?: number
  step?: number
  choices?: Array<{ label: string; value: any }>
  disabled?: boolean
}>>([])

const configuration = ref<Record<string, any>>({})

// Screenshot preview
const screenshotPreviewVisible = ref(false)
const selectedScreenshot = ref('')

// Computed properties
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return !!props.extension
    case 1:
      return systemRequirements.value.every(req => req.satisfied) &&
             dependencies.value.every(dep => dep.satisfied || dep.optional)
    case 2:
      return permissions.value.every(perm => perm.granted || !perm.required)
    case 3:
      return configOptions.value.every(option => {
        if (option.required) {
          const value = configuration.value[option.key]
          return value !== undefined && value !== null && value !== ''
        }
        return true
      })
    default:
      return true
  }
})

const grantedPermissions = computed(() => {
  return permissions.value
    .filter(perm => perm.granted)
    .map(perm => perm.displayName)
})

// Methods
const handleNext = async () => {
  if (currentStep.value < 4) {
    currentStep.value++

    // Load data for the new step
    if (currentStep.value === 1) {
      await checkCompatibility()
    } else if (currentStep.value === 2) {
      loadPermissions()
    } else if (currentStep.value === 3) {
      loadConfiguration()
    }
  }
}

const handlePrevious = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const checkCompatibility = async () => {
  if (!props.extension) return

  try {
    compatibilityLoading.value = true

    const response = await fetch('/api/extensions/compatibility', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${extensionStore.authToken}`
      },
      body: JSON.stringify({
        extensionId: props.extension.id,
        version: props.extension.version
      })
    })

    if (!response.ok) {
      throw new Error(`Compatibility check failed: ${response.statusText}`)
    }

    const data = await response.json()

    systemRequirements.value = data.systemRequirements || []
    dependencies.value = data.dependencies || []
    warnings.value = data.warnings || []

  } catch (err) {
    console.error('Failed to check compatibility:', err)
    ElMessage.error(t('extensions.wizard.compatibilityCheckError'))
  } finally {
    compatibilityLoading.value = false
  }
}

const loadPermissions = () => {
  if (!props.extension) return

  // Convert extension permissions to detailed permission objects
  permissions.value = props.extension.permissions.map(permName => {
    const permissionData = getPermissionData(permName)
    return {
      name: permName,
      displayName: permissionData.displayName,
      description: permissionData.description,
      level: permissionData.level,
      required: permissionData.required,
      granted: permissionData.required, // Auto-grant required permissions
      details: permissionData.details
    }
  })
}

const loadConfiguration = () => {
  if (!props.extension?.configSchema) {
    configOptions.value = []
    return
  }

  // Convert config schema to form options
  configOptions.value = Object.entries(props.extension.configSchema.properties || {})
    .map(([key, schema]: [string, any]) => ({
      key,
      type: schema.type,
      displayName: schema.title || key,
      description: schema.description,
      required: props.extension!.configSchema.required?.includes(key) || false,
      placeholder: schema.placeholder,
      min: schema.minimum,
      max: schema.maximum,
      step: schema.multipleOf,
      choices: schema.enum?.map((value: any) => ({ label: String(value), value })),
      disabled: schema.readOnly
    }))

  // Initialize configuration with default values
  configuration.value = {}
  for (const option of configOptions.value) {
    const schema = props.extension.configSchema.properties[option.key]
    if (schema.default !== undefined) {
      configuration.value[option.key] = schema.default
    }
  }
}

const startInstallation = async () => {
  if (!props.extension) return

  try {
    installationStarted.value = true
    installing.value = true
    installationProgress.value = 0
    installationMessage.value = t('extensions.wizard.startingInstallation')

    // Simulate installation progress
    const progressInterval = setInterval(() => {
      if (installationProgress.value < 90) {
        installationProgress.value += Math.random() * 10
        if (installationProgress.value > 90) {
          installationProgress.value = 90
        }
      }
    }, 500)

    // Perform actual installation
    await extensionStore.installExtension(props.extension.id, {
      version: props.extension.version,
      permissions: grantedPermissions.value,
      configuration: configuration.value,
      onProgress: (progress: number, message: string) => {
        installationProgress.value = progress
        installationMessage.value = message
        installationLogs.value.push({
          level: 'info',
          message,
          timestamp: new Date()
        })
      }
    })

    clearInterval(progressInterval)
    installationProgress.value = 100
    installationStatus.value = 'success'
    installationMessage.value = t('extensions.wizard.installationComplete')
    installationComplete.value = true

    ElMessage.success(t('extensions.wizard.installationSuccess'))
    emit('installed', props.extension)

  } catch (err) {
    console.error('Installation failed:', err)
    installationStatus.value = 'exception'
    installationMessage.value = t('extensions.wizard.installationFailed')
    installationLogs.value.push({
      level: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date()
    })
    ElMessage.error(t('extensions.wizard.installationError'))
  } finally {
    installing.value = false
  }
}

const installDependency = async (dependency: any) => {
  try {
    await extensionStore.installExtension(dependency.id)
    dependency.satisfied = true
    ElMessage.success(t('extensions.wizard.dependencyInstalled', { name: dependency.name }))
  } catch (err) {
    console.error('Failed to install dependency:', err)
    ElMessage.error(t('extensions.wizard.dependencyInstallError'))
  }
}

const handleFinish = () => {
  handleClose()
}

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
  resetWizard()
}

const resetWizard = () => {
  currentStep.value = 0
  installationStarted.value = false
  installationComplete.value = false
  installationProgress.value = 0
  installationStatus.value = undefined
  installationMessage.value = ''
  installationLogs.value = []
  systemRequirements.value = []
  dependencies.value = []
  warnings.value = []
  permissions.value = []
  configOptions.value = []
  configuration.value = {}
}

const openScreenshot = (screenshot: string) => {
  selectedScreenshot.value = screenshot
  screenshotPreviewVisible.value = true
}

// Utility functions
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDownloads = (downloads: number): string => {
  if (downloads >= 1000000) {
    return (downloads / 1000000).toFixed(1) + 'M'
  } else if (downloads >= 1000) {
    return (downloads / 1000).toFixed(1) + 'K'
  }
  return downloads.toString()
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString()
}

const getPermissionData = (permissionName: string) => {
  // This would typically come from a permission registry
  const permissions: Record<string, any> = {
    'file-access': {
      displayName: 'File System Access',
      description: 'Access and modify files on your system',
      level: 'high',
      required: false,
      details: ['Read files', 'Write files', 'Delete files']
    },
    'network-access': {
      displayName: 'Network Access',
      description: 'Make network requests to external services',
      level: 'medium',
      required: false,
      details: ['HTTP requests', 'WebSocket connections']
    },
    'ui-modification': {
      displayName: 'UI Modification',
      description: 'Modify the user interface',
      level: 'low',
      required: true,
      details: ['Add menu items', 'Create dialogs', 'Modify layout']
    }
  }

  return permissions[permissionName] || {
    displayName: permissionName,
    description: 'Unknown permission',
    level: 'medium',
    required: false
  }
}

const getPermissionIcon = (level: string) => {
  switch (level) {
    case 'high': return Close
    case 'medium': return Warning
    case 'low': return Check
    default: return Warning
  }
}

const getPermissionIconClass = (level: string) => {
  switch (level) {
    case 'high': return 'permission-high'
    case 'medium': return 'permission-medium'
    case 'low': return 'permission-low'
    default: return 'permission-medium'
  }
}

// Watch for extension changes
watch(() => props.extension, () => {
  if (props.extension) {
    resetWizard()
  }
})
</script>

<style scoped lang="scss">
.installation-wizard {
  :deep(.el-dialog__body) {
    @apply p-6;
  }
}

.wizard-content {
  @apply min-h-[500px];

  .wizard-steps {
    @apply mb-8;

    :deep(.el-step__title) {
      @apply text-sm;
    }
  }

  .step-content {
    @apply min-h-[400px];

    .step-header {
      @apply mb-6;

      .step-title {
        @apply text-xl font-semibold text-gray-900 dark:text-white mb-2;
      }

      .step-description {
        @apply text-gray-600 dark:text-gray-400;
      }
    }
  }
}

// Step 0: Selection
.step-selection {
  .extension-preview {
    @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-6;

    .extension-info {
      @apply flex items-start gap-4 mb-6;

      .extension-icon {
        @apply w-16 h-16 flex-shrink-0;

        .icon-image {
          @apply w-full h-full object-cover rounded-lg;
        }

        .icon-placeholder {
          @apply w-full h-full text-gray-400 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-2xl;
        }
      }

      .extension-details {
        @apply flex-1;

        .extension-name {
          @apply text-lg font-semibold text-gray-900 dark:text-white mb-1;
        }

        .extension-author {
          @apply text-sm text-gray-600 dark:text-gray-400 mb-1;
        }

        .extension-version {
          @apply text-sm text-gray-500 dark:text-gray-500 mb-3;
        }

        .extension-tags {
          @apply flex flex-wrap gap-2;

          .tag-item {
            @apply bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200;
          }
        }
      }

      .extension-stats {
        @apply flex flex-col gap-2 text-sm;

        .stat-item {
          @apply flex items-center gap-2 text-gray-600 dark:text-gray-400;
        }
      }
    }

    .extension-description {
      @apply mb-6;

      h5 {
        @apply font-semibold text-gray-900 dark:text-white mb-2;
      }

      p {
        @apply text-gray-600 dark:text-gray-400 leading-relaxed;
      }
    }

    .extension-screenshots {
      h5 {
        @apply font-semibold text-gray-900 dark:text-white mb-3;
      }

      .screenshots-grid {
        @apply grid grid-cols-2 md:grid-cols-4 gap-3;

        .screenshot-item {
          @apply w-full h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity;
        }
      }
    }
  }

  .no-extension {
    @apply text-center py-16;

    .no-extension-icon {
      @apply text-6xl text-gray-400 dark:text-gray-500 mb-4;
    }

    p {
      @apply text-gray-600 dark:text-gray-400;
    }
  }
}

// Step 1: Compatibility
.step-compatibility {
  .compatibility-loading {
    @apply py-8;
  }

  .compatibility-results {
    .requirement-section,
    .dependency-section,
    .warnings-section {
      @apply mb-6;

      .section-title {
        @apply font-semibold text-gray-900 dark:text-white mb-3;
      }
    }

    .requirement-list,
    .dependency-list {
      @apply space-y-3;

      .requirement-item,
      .dependency-item {
        @apply flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg;

        &.requirement-failed,
        &.dependency-missing {
          @apply bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800;
        }

        .requirement-icon,
        .dependency-icon {
          @apply w-5 h-5 flex-shrink-0 mt-0.5;

          &.text-green-500 {
            @apply text-green-500;
          }

          &.text-red-500 {
            @apply text-red-500;
          }

          &.text-yellow-500 {
            @apply text-yellow-500;
          }
        }

        .requirement-content,
        .dependency-content {
          @apply flex-1;

          .requirement-name,
          .dependency-name {
            @apply block font-medium text-gray-900 dark:text-white;
          }

          .requirement-status {
            @apply text-sm text-gray-600 dark:text-gray-400;
          }

          .dependency-version {
            @apply text-sm text-gray-600 dark:text-gray-400 mr-2;
          }

          .dependency-optional {
            @apply text-sm text-yellow-600 dark:text-yellow-400;
          }
        }
      }
    }

    .warnings-list {
      @apply space-y-3;
    }
  }
}

// Step 2: Permissions
.step-permissions {
  .permissions-list {
    @apply space-y-4;

    .permission-item {
      @apply border border-gray-200 dark:border-gray-700 rounded-lg p-4;

      .permission-header {
        @apply flex items-center gap-3 mb-3;

        .permission-icon {
          @apply w-6 h-6;

          &.permission-high {
            @apply text-red-500;
          }

          &.permission-medium {
            @apply text-yellow-500;
          }

          &.permission-low {
            @apply text-green-500;
          }
        }

        .permission-info {
          @apply flex-1;

          .permission-name {
            @apply block font-medium text-gray-900 dark:text-white;
          }

          .permission-level {
            @apply text-sm text-gray-600 dark:text-gray-400;
          }
        }
      }

      .permission-description {
        p {
          @apply text-gray-600 dark:text-gray-400 mb-2;
        }

        .permission-details {
          ul {
            @apply list-disc list-inside text-sm text-gray-500 dark:text-gray-500 space-y-1;
          }
        }
      }
    }
  }
}

// Step 3: Configuration
.step-configuration {
  .config-form {
    @apply space-y-6;

    .config-option {
      .config-label {
        @apply block font-medium text-gray-900 dark:text-white mb-2;

        .required-mark {
          @apply text-red-500 ml-1;
        }
      }

      .config-input {
        @apply mb-2;
      }

      .config-description {
        @apply text-sm text-gray-600 dark:text-gray-400;
      }
    }
  }

  .no-config {
    @apply text-center py-16;

    .no-config-icon {
      @apply text-6xl text-gray-400 dark:text-gray-500 mb-4;
    }

    p {
      @apply text-gray-600 dark:text-gray-400;
    }
  }
}

// Step 4: Installation
.step-installation {
  .installation-summary {
    @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-6;

    .summary-section {
      h4 {
        @apply font-semibold text-gray-900 dark:text-white mb-4;
      }

      .summary-item {
        @apply mb-3 text-gray-700 dark:text-gray-300;

        strong {
          @apply text-gray-900 dark:text-white;
        }
      }
    }
  }

  .installation-progress {
    .progress-section {
      @apply text-center mb-6;

      .progress-message {
        @apply mt-3 text-gray-600 dark:text-gray-400;
      }
    }

    .installation-logs {
      h5 {
        @apply font-semibold text-gray-900 dark:text-white mb-3;
      }

      .logs-container {
        @apply bg-gray-900 text-green-400 p-4 rounded-lg max-h-40 overflow-y-auto font-mono text-sm;

        .log-entry {
          @apply flex gap-2 mb-1;

          &.log-error {
            @apply text-red-400;
          }

          &.log-warning {
            @apply text-yellow-400;
          }

          .log-time {
            @apply text-gray-500 flex-shrink-0;
          }

          .log-message {
            @apply flex-1;
          }
        }
      }
    }
  }
}

// Footer
.wizard-footer {
  @apply flex items-center justify-between;

  .footer-info {
    .step-indicator {
      @apply text-sm text-gray-600 dark:text-gray-400;
    }
  }

  .footer-actions {
    @apply flex items-center gap-3;
  }
}

// Screenshot preview
.screenshot-preview {
  @apply w-full h-auto max-h-[70vh] object-contain;
}

// Responsive design
@media (max-width: 768px) {
  .extension-info {
    @apply flex-col;

    .extension-stats {
      @apply flex-row gap-4;
    }
  }

  .screenshots-grid {
    @apply grid-cols-2;
  }

  .wizard-footer {
    @apply flex-col items-stretch gap-4;

    .footer-actions {
      @apply justify-end;
    }
  }
}
</style>