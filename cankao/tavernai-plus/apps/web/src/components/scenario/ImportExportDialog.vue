<template>
  <el-dialog
    v-model="dialogVisible"
    :title="mode === 'import' ? '导入剧本' : '导出剧本'"
    width="800px"
    class="import-export-dialog"
    @close="handleClose"
  >
    <div class="dialog-content">
      <!-- 导入模式 -->
      <div v-if="mode === 'import'" class="import-section">
        <!-- 文件上传区域 -->
        <div class="upload-section">
          <el-upload
            ref="uploadRef"
            class="upload-dragger"
            drag
            :auto-upload="false"
            :on-change="handleFileChange"
            :before-upload="beforeUpload"
            :show-file-list="false"
            accept=".json,.yaml,.yml,.txt"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 JSON、YAML 格式文件，文件大小不超过 50MB
              </div>
            </template>
          </el-upload>

          <!-- 选中的文件信息 -->
          <div v-if="selectedFile" class="file-info">
            <el-card>
              <div class="file-details">
                <el-icon><Document /></el-icon>
                <span class="filename">{{ selectedFile.name }}</span>
                <span class="filesize">({{ formatFileSize(selectedFile.size) }})</span>
                <el-button
                  type="danger"
                  size="small"
                  link
                  @click="removeFile"
                >
                  移除
                </el-button>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 导入选项 -->
        <div class="import-options">
          <h4>导入选项</h4>

          <el-form :model="importOptions" label-width="120px">
            <el-form-item label="数据格式">
              <el-select v-model="importOptions.format" placeholder="选择数据格式">
                <el-option
                  v-for="format in supportedFormats.import"
                  :key="format.key"
                  :label="format.name"
                  :value="format.key"
                >
                  <div class="format-option">
                    <div class="format-name">{{ format.name }}</div>
                    <div class="format-desc">{{ format.description }}</div>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="冲突处理">
              <el-select v-model="importOptions.conflictResolution" placeholder="选择冲突处理方式">
                <el-option
                  v-for="resolution in conflictResolutions"
                  :key="resolution.key"
                  :label="resolution.name"
                  :value="resolution.key"
                >
                  <div class="resolution-option">
                    <div class="resolution-name">{{ resolution.name }}</div>
                    <div class="resolution-desc">{{ resolution.description }}</div>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="数据验证">
              <el-switch
                v-model="importOptions.validateData"
                active-text="启用数据验证"
                inactive-text="跳过验证"
              />
            </el-form-item>

            <el-form-item label="保留ID">
              <el-switch
                v-model="importOptions.preserveIds"
                active-text="保留原始ID"
                inactive-text="生成新ID"
              />
            </el-form-item>

            <el-form-item label="批处理大小">
              <el-input-number
                v-model="importOptions.batchSize"
                :min="1"
                :max="50"
                :step="5"
                controls-position="right"
              />
              <div class="form-tip">
                单次处理的剧本数量，较小的值可以减少内存使用
              </div>
            </el-form-item>
          </el-form>
        </div>

        <!-- 验证结果 -->
        <div v-if="validationResult" class="validation-result">
          <h4>数据验证结果</h4>

          <el-alert
            :type="validationResult.isValid ? 'success' : 'error'"
            :title="validationResult.isValid ? '数据验证通过' : '数据验证失败'"
            :closable="false"
            show-icon
          >
            <template #default>
              <div class="validation-summary">
                <p>
                  总计 {{ validationResult.metadata.totalItems }} 个项目，
                  有效 {{ validationResult.metadata.validItems }} 个，
                  {{ validationResult.metadata.errorCount }} 个错误，
                  {{ validationResult.metadata.warningCount }} 个警告
                </p>
              </div>
            </template>
          </el-alert>

          <!-- 错误列表 -->
          <div v-if="validationResult.errors.length > 0" class="error-list">
            <h5>错误信息</h5>
            <el-scrollbar max-height="200px">
              <div
                v-for="(error, index) in validationResult.errors"
                :key="index"
                class="error-item"
              >
                <el-tag type="danger" size="small">{{ error.type }}</el-tag>
                <span class="error-message">{{ error.message }}</span>
                <span v-if="error.path" class="error-path">{{ error.path }}</span>
              </div>
            </el-scrollbar>
          </div>

          <!-- 警告列表 -->
          <div v-if="validationResult.warnings.length > 0" class="warning-list">
            <h5>警告信息</h5>
            <el-scrollbar max-height="200px">
              <div
                v-for="(warning, index) in validationResult.warnings"
                :key="index"
                class="warning-item"
              >
                <el-tag type="warning" size="small">{{ warning.type }}</el-tag>
                <span class="warning-message">{{ warning.message }}</span>
                <span v-if="warning.suggestion" class="warning-suggestion">
                  建议: {{ warning.suggestion }}
                </span>
              </div>
            </el-scrollbar>
          </div>
        </div>

        <!-- 冲突检测结果 -->
        <div v-if="conflictDetection" class="conflict-detection">
          <h4>冲突检测结果</h4>

          <!-- 重名冲突 -->
          <div v-if="conflictDetection.duplicateNames.length > 0" class="conflict-section">
            <h5>重名剧本 ({{ conflictDetection.duplicateNames.length }})</h5>
            <div
              v-for="(conflict, index) in conflictDetection.duplicateNames"
              :key="index"
              class="conflict-item"
            >
              <el-tag :type="getSeverityType(conflict.severity)" size="small">
                {{ conflict.severity }}
              </el-tag>
              <span class="conflict-name">{{ conflict.name }}</span>
              <span class="conflict-desc">{{ conflict.description }}</span>
            </div>
          </div>

          <!-- 相似内容冲突 -->
          <div v-if="conflictDetection.similarContent.length > 0" class="conflict-section">
            <h5>相似内容 ({{ conflictDetection.similarContent.length }})</h5>
            <div
              v-for="(conflict, index) in conflictDetection.similarContent"
              :key="index"
              class="conflict-item"
            >
              <el-tag :type="getSeverityType(conflict.severity)" size="small">
                {{ conflict.severity }}
              </el-tag>
              <span class="conflict-name">{{ conflict.name }}</span>
              <span class="conflict-desc">{{ conflict.description }}</span>
            </div>
          </div>

          <!-- 关键词重叠冲突 -->
          <div v-if="conflictDetection.keywordOverlaps.length > 0" class="conflict-section">
            <h5>关键词重叠 ({{ conflictDetection.keywordOverlaps.length }})</h5>
            <div
              v-for="(conflict, index) in conflictDetection.keywordOverlaps"
              :key="index"
              class="conflict-item"
            >
              <el-tag :type="getSeverityType(conflict.severity)" size="small">
                {{ conflict.severity }}
              </el-tag>
              <span class="conflict-name">{{ conflict.name }}</span>
              <span class="conflict-desc">{{ conflict.description }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 导出模式 -->
      <div v-if="mode === 'export'" class="export-section">
        <!-- 导出选项 -->
        <div class="export-options">
          <h4>导出选项</h4>

          <el-form :model="exportOptions" label-width="120px">
            <el-form-item label="导出格式">
              <el-select v-model="exportOptions.format" placeholder="选择导出格式">
                <el-option
                  v-for="format in supportedFormats.export"
                  :key="format.key"
                  :label="format.name"
                  :value="format.key"
                >
                  <div class="format-option">
                    <div class="format-name">{{ format.name }}</div>
                    <div class="format-desc">{{ format.description }}</div>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="包含世界信息">
              <el-switch
                v-model="exportOptions.includeWorldInfo"
                active-text="包含"
                inactive-text="不包含"
              />
            </el-form-item>

            <el-form-item label="包含元数据">
              <el-switch
                v-model="exportOptions.includeMetadata"
                active-text="包含"
                inactive-text="不包含"
              />
            </el-form-item>

            <el-form-item label="启用压缩">
              <el-switch
                v-model="exportOptions.compression"
                active-text="压缩"
                inactive-text="不压缩"
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 导出预览 -->
        <div v-if="exportPreview" class="export-preview">
          <h4>导出预览</h4>
          <div class="preview-info">
            <p>将导出 {{ exportPreview.scenarioCount }} 个剧本</p>
            <p>包含 {{ exportPreview.worldInfoCount }} 个世界信息条目</p>
            <p>预计文件大小: {{ exportPreview.estimatedSize }}</p>
          </div>
        </div>
      </div>

      <!-- 处理进度 -->
      <div v-if="processing" class="processing-section">
        <h4>{{ mode === 'import' ? '导入' : '导出' }}处理中...</h4>
        <el-progress
          :percentage="progress"
          :status="progressStatus"
          :stroke-width="8"
        />
        <div class="progress-info">
          <p>{{ progressMessage }}</p>
        </div>
      </div>

      <!-- 处理结果 -->
      <div v-if="result" class="result-section">
        <h4>{{ mode === 'import' ? '导入' : '导出' }}结果</h4>

        <!-- 导入结果 -->
        <div v-if="mode === 'import' && result.success" class="import-result">
          <el-alert
            type="success"
            title="导入成功"
            :closable="false"
            show-icon
          >
            <template #default>
              <div class="result-summary">
                <p>
                  成功导入 {{ result.successCount }} 个剧本，
                  失败 {{ result.failureCount }} 个，
                  跳过 {{ result.skippedCount }} 个
                </p>
                <p>处理时间: {{ result.metadata.processingTime }}ms</p>
              </div>
            </template>
          </el-alert>

          <!-- 错误列表 -->
          <div v-if="result.errors.length > 0" class="result-errors">
            <h5>导入错误</h5>
            <el-scrollbar max-height="200px">
              <div
                v-for="(error, index) in result.errors"
                :key="index"
                class="error-item"
              >
                <el-tag type="danger" size="small">{{ error.type }}</el-tag>
                <span class="error-message">{{ error.message }}</span>
                <span v-if="error.scenarioName" class="error-scenario">
                  剧本: {{ error.scenarioName }}
                </span>
              </div>
            </el-scrollbar>
          </div>

          <!-- 导入的剧本列表 -->
          <div v-if="result.importedScenarios.length > 0" class="imported-scenarios">
            <h5>已导入的剧本</h5>
            <el-scrollbar max-height="200px">
              <div
                v-for="scenario in result.importedScenarios"
                :key="scenario.id"
                class="scenario-item"
              >
                <span class="scenario-name">{{ scenario.name }}</span>
                <span class="scenario-category">{{ scenario.category }}</span>
                <span class="scenario-worldinfo">
                  {{ scenario._count?.worldInfos || 0 }} 个世界信息条目
                </span>
              </div>
            </el-scrollbar>
          </div>
        </div>

        <!-- 导出结果 -->
        <div v-if="mode === 'export' && result.success" class="export-result">
          <el-alert
            type="success"
            title="导出成功"
            :closable="false"
            show-icon
          >
            <template #default>
              <div class="result-summary">
                <p>文件大小: {{ formatFileSize(result.size) }}</p>
                <p>校验和: {{ result.checksum }}</p>
              </div>
            </template>
          </el-alert>
        </div>

        <!-- 失败结果 -->
        <div v-if="!result.success" class="failure-result">
          <el-alert
            type="error"
            :title="mode === 'import' ? '导入失败' : '导出失败'"
            :closable="false"
            show-icon
          >
            <template #default>
              <div class="failure-details">
                <p>{{ result.error || '操作失败' }}</p>
              </div>
            </template>
          </el-alert>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>

        <template v-if="mode === 'import'">
          <el-button
            v-if="!validationResult && selectedFile"
            type="primary"
            @click="validateFile"
            :loading="validating"
          >
            验证数据
          </el-button>

          <el-button
            v-if="validationResult && !processing && !result"
            type="success"
            @click="startImport"
            :disabled="!validationResult.isValid"
            :loading="processing"
          >
            开始导入
          </el-button>
        </template>

        <template v-if="mode === 'export'">
          <el-button
            v-if="!processing && !result"
            type="success"
            @click="startExport"
            :loading="processing"
          >
            开始导出
          </el-button>
        </template>

        <el-button
          v-if="result && result.success"
          type="primary"
          @click="handleComplete"
        >
          完成
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Document } from '@element-plus/icons-vue'
import { importExportApi } from '@/services/importExport'

// Props
interface Props {
  visible: boolean
  mode: 'import' | 'export'
  scenarioIds?: string[] // 导出时使用
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  mode: 'import',
  scenarioIds: () => []
})

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  complete: [result: any]
}>()

// Reactive data
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const uploadRef = ref()
const selectedFile = ref<File | null>(null)
const validating = ref(false)
const processing = ref(false)
const progress = ref(0)
const progressStatus = ref<'success' | 'exception' | undefined>(undefined)
const progressMessage = ref('')

// 导入选项
const importOptions = reactive({
  format: 'json' as 'sillytavern' | 'json' | 'yaml' | 'enhanced',
  conflictResolution: 'skip' as 'skip' | 'overwrite' | 'merge' | 'rename',
  validateData: true,
  preserveIds: false,
  batchSize: 10
})

// 导出选项
const exportOptions = reactive({
  format: 'json' as 'sillytavern' | 'json' | 'yaml' | 'enhanced',
  includeWorldInfo: true,
  includeMetadata: false,
  compression: false
})

// 验证结果
const validationResult = ref<any>(null)
const conflictDetection = ref<any>(null)
const exportPreview = ref<any>(null)
const result = ref<any>(null)

// 格式和选项数据
const supportedFormats = ref({
  import: [],
  export: []
})
const conflictResolutions = ref([])

// 生命周期
watch(() => props.visible, async (visible) => {
  if (visible) {
    await loadFormatsData()
    resetDialog()
  }
})

// Methods
const resetDialog = () => {
  selectedFile.value = null
  validationResult.value = null
  conflictDetection.value = null
  exportPreview.value = null
  result.value = null
  processing.value = false
  validating.value = false
  progress.value = 0
  progressStatus.value = undefined
  progressMessage.value = ''
}

const loadFormatsData = async () => {
  try {
    const response = await importExportApi.getFormats()
    if (response.success) {
      supportedFormats.value = response.data
      conflictResolutions.value = response.data.conflictResolutions
    }
  } catch (error) {
    console.error('加载格式数据失败:', error)
  }
}

const handleFileChange = (file: any) => {
  selectedFile.value = file.raw
  validationResult.value = null

  // 自动检测格式
  const filename = file.name.toLowerCase()
  if (filename.endsWith('.json')) {
    importOptions.format = 'json'
  } else if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
    importOptions.format = 'yaml'
  }
}

const beforeUpload = (file: File) => {
  const isValidType = file.type === 'application/json' ||
                     file.type === 'text/plain' ||
                     file.type === 'application/x-yaml' ||
                     file.name.match(/\.(json|yaml|yml|txt)$/i)

  const isValidSize = file.size <= 50 * 1024 * 1024 // 50MB

  if (!isValidType) {
    ElMessage.error('请上传 JSON、YAML 或 TXT 格式的文件!')
    return false
  }

  if (!isValidSize) {
    ElMessage.error('文件大小不能超过 50MB!')
    return false
  }

  return false // 阻止自动上传
}

const removeFile = () => {
  selectedFile.value = null
  validationResult.value = null
  conflictDetection.value = null
  uploadRef.value?.clearFiles()
}

const validateFile = async () => {
  if (!selectedFile.value) {
    ElMessage.error('请先选择文件')
    return
  }

  validating.value = true

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('format', importOptions.format)

    const response = await importExportApi.validateData(formData)

    if (response.success) {
      validationResult.value = response.data

      // 如果验证通过，检测冲突
      if (response.data.isValid) {
        await detectConflicts()
      }
    } else {
      ElMessage.error(response.error || '验证失败')
    }
  } catch (error) {
    console.error('验证文件失败:', error)
    ElMessage.error('验证过程中发生错误')
  } finally {
    validating.value = false
  }
}

const detectConflicts = async () => {
  try {
    // 这里需要先读取文件内容
    const fileContent = await readFileContent(selectedFile.value!)

    const response = await importExportApi.detectConflicts({
      importData: fileContent,
      format: importOptions.format
    })

    if (response.success) {
      conflictDetection.value = response.data
    }
  } catch (error) {
    console.error('检测冲突失败:', error)
  }
}

const readFileContent = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        if (file.name.match(/\.(yaml|yml)$/i)) {
          // YAML 文件，返回文本内容
          resolve(content)
        } else {
          // JSON 文件，解析后返回
          resolve(JSON.parse(content))
        }
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

const startImport = async () => {
  if (!selectedFile.value || !validationResult.value?.isValid) {
    ElMessage.error('请先验证数据')
    return
  }

  // 如果有严重冲突，提示用户确认
  if (conflictDetection.value) {
    const highSeverityConflicts = [
      ...conflictDetection.value.duplicateNames.filter(c => c.severity === 'high'),
      ...conflictDetection.value.similarContent.filter(c => c.severity === 'high')
    ]

    if (highSeverityConflicts.length > 0) {
      try {
        await ElMessageBox.confirm(
          `检测到 ${highSeverityConflicts.length} 个高严重性冲突，是否继续导入？`,
          '冲突确认',
          {
            type: 'warning',
            confirmButtonText: '继续导入',
            cancelButtonText: '取消'
          }
        )
      } catch {
        return
      }
    }
  }

  processing.value = true
  progress.value = 0
  progressMessage.value = '正在上传文件...'

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('options', JSON.stringify(importOptions))
    formData.append('ignoreWarnings', 'true')

    // 模拟进度更新
    const progressInterval = setInterval(() => {
      if (progress.value < 90) {
        progress.value += 10
        if (progress.value < 30) {
          progressMessage.value = '正在解析数据...'
        } else if (progress.value < 60) {
          progressMessage.value = '正在验证数据...'
        } else {
          progressMessage.value = '正在导入剧本...'
        }
      }
    }, 500)

    const response = await importExportApi.importScenarios(formData)

    clearInterval(progressInterval)
    progress.value = 100
    progressMessage.value = '导入完成'
    progressStatus.value = response.success ? 'success' : 'exception'

    result.value = response.success ? response.data : response

    if (response.success) {
      ElMessage.success('导入成功')
    } else {
      ElMessage.error(response.error || '导入失败')
    }
  } catch (error) {
    console.error('导入失败:', error)
    progress.value = 100
    progressStatus.value = 'exception'
    progressMessage.value = '导入失败'
    ElMessage.error('导入过程中发生错误')
  } finally {
    processing.value = false
  }
}

const startExport = async () => {
  processing.value = true
  progress.value = 0
  progressMessage.value = '正在准备导出...'

  try {
    // 模拟进度更新
    const progressInterval = setInterval(() => {
      if (progress.value < 90) {
        progress.value += 10
        if (progress.value < 50) {
          progressMessage.value = '正在获取剧本数据...'
        } else {
          progressMessage.value = '正在生成导出文件...'
        }
      }
    }, 300)

    let response
    if (props.scenarioIds.length === 1) {
      // 单个剧本导出
      response = await importExportApi.exportScenario(props.scenarioIds[0], exportOptions)
    } else {
      // 批量导出
      response = await importExportApi.exportScenarios({
        scenarioIds: props.scenarioIds,
        options: exportOptions
      })
    }

    clearInterval(progressInterval)
    progress.value = 100
    progressMessage.value = '导出完成'
    progressStatus.value = 'success'

    if (response) {
      result.value = { success: true, size: 0, checksum: 'unknown' }
      ElMessage.success('导出成功')
    }
  } catch (error) {
    console.error('导出失败:', error)
    progress.value = 100
    progressStatus.value = 'exception'
    progressMessage.value = '导出失败'
    result.value = { success: false, error: '导出过程中发生错误' }
    ElMessage.error('导出过程中发生错误')
  } finally {
    processing.value = false
  }
}

const handleClose = () => {
  emit('update:visible', false)
}

const handleComplete = () => {
  emit('complete', result.value)
  handleClose()
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getSeverityType = (severity: string) => {
  switch (severity) {
    case 'high': return 'danger'
    case 'medium': return 'warning'
    case 'low': return 'info'
    default: return 'info'
  }
}
</script>

<style scoped lang="scss">
.import-export-dialog {
  .dialog-content {
    max-height: 70vh;
    overflow-y: auto;
  }

  .upload-section {
    margin-bottom: 24px;

    .upload-dragger {
      :deep(.el-upload-dragger) {
        width: 100%;
        height: 160px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
    }

    .file-info {
      margin-top: 16px;

      .file-details {
        display: flex;
        align-items: center;
        gap: 8px;

        .filename {
          font-weight: 500;
        }

        .filesize {
          color: var(--el-text-color-secondary);
          font-size: 12px;
        }
      }
    }
  }

  .import-options, .export-options {
    margin-bottom: 24px;

    h4 {
      margin: 0 0 16px 0;
      color: var(--el-text-color-primary);
    }

    .form-tip {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 4px;
    }

    .format-option, .resolution-option {
      .format-name, .resolution-name {
        font-weight: 500;
      }

      .format-desc, .resolution-desc {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .validation-result, .conflict-detection {
    margin-bottom: 24px;

    h4, h5 {
      margin: 0 0 12px 0;
      color: var(--el-text-color-primary);
    }

    .validation-summary {
      margin: 0;
    }

    .error-list, .warning-list {
      margin-top: 12px;

      .error-item, .warning-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
        border-bottom: 1px solid var(--el-border-color-lighter);

        &:last-child {
          border-bottom: none;
        }

        .error-message, .warning-message {
          flex: 1;
        }

        .error-path, .warning-suggestion {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }

    .conflict-section {
      margin-bottom: 16px;

      .conflict-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
        border-bottom: 1px solid var(--el-border-color-lighter);

        &:last-child {
          border-bottom: none;
        }

        .conflict-name {
          font-weight: 500;
        }

        .conflict-desc {
          flex: 1;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  .processing-section {
    margin-bottom: 24px;

    h4 {
      margin: 0 0 16px 0;
      color: var(--el-text-color-primary);
    }

    .progress-info {
      margin-top: 8px;

      p {
        margin: 0;
        text-align: center;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .result-section {
    h4 {
      margin: 0 0 16px 0;
      color: var(--el-text-color-primary);
    }

    .result-summary {
      margin: 0;
    }

    .result-errors {
      margin-top: 16px;

      h5 {
        margin: 0 0 8px 0;
        color: var(--el-text-color-primary);
      }

      .error-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
        border-bottom: 1px solid var(--el-border-color-lighter);

        &:last-child {
          border-bottom: none;
        }

        .error-message {
          flex: 1;
        }

        .error-scenario {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }

    .imported-scenarios {
      margin-top: 16px;

      h5 {
        margin: 0 0 8px 0;
        color: var(--el-text-color-primary);
      }

      .scenario-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid var(--el-border-color-lighter);

        &:last-child {
          border-bottom: none;
        }

        .scenario-name {
          font-weight: 500;
          flex: 1;
        }

        .scenario-category {
          background: var(--el-bg-color-page);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .scenario-worldinfo {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}
</style>