<template>
  <div class="image-analyzer">
    <!-- 头部工具栏 -->
    <div class="analyzer-header">
      <div class="header-left">
        <h3 class="analyzer-title">
          <el-icon><View /></el-icon>
          AI图像理解
        </h3>
        <el-tag v-if="analysisHistory.length > 0" type="info" size="small">
          已分析 {{ analysisHistory.length }} 张图像
        </el-tag>
      </div>
      <div class="header-actions">
        <el-button
          size="small"
          :icon="FolderOpened"
          @click="showHistory = true"
          title="分析历史"
        >
          历史
        </el-button>
        <el-button
          size="small"
          :icon="Setting"
          @click="showAnalysisSettings = !showAnalysisSettings"
          title="分析设置"
        >
          设置
        </el-button>
      </div>
    </div>

    <div class="analyzer-content">
      <!-- 左侧：图像上传和预览 -->
      <div class="analyzer-left">
        <!-- 图像上传区域 -->
        <div class="upload-section">
          <div v-if="!currentImage" class="upload-area" @click="triggerFileUpload">
            <div class="upload-content">
              <div class="upload-icon">
                <el-icon><Plus /></el-icon>
              </div>
              <p class="upload-text">点击上传图像</p>
              <p class="upload-hint">支持 JPG、PNG、WebP、GIF 格式</p>
              <p class="upload-size">最大 10MB</p>
            </div>
          </div>

          <!-- 图像预览 -->
          <div v-else class="image-preview">
            <div class="preview-container">
              <img
                :src="currentImage.url"
                :alt="currentImage.name"
                class="preview-image"
                @load="onImageLoad"
                @error="onImageError"
              />

              <!-- 图像操作按钮 -->
              <div class="image-actions">
                <el-button
                  size="small"
                  circle
                  :icon="ZoomIn"
                  @click="showFullPreview = true"
                  title="全屏预览"
                />
                <el-button
                  size="small"
                  circle
                  :icon="Refresh"
                  @click="replaceImage"
                  title="更换图像"
                />
                <el-button
                  size="small"
                  circle
                  type="danger"
                  :icon="Delete"
                  @click="removeImage"
                  title="删除图像"
                />
              </div>
            </div>

            <!-- 图像信息 -->
            <div class="image-info">
              <div class="info-row">
                <span class="info-label">文件名:</span>
                <span class="info-value">{{ currentImage.name }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">尺寸:</span>
                <span class="info-value">{{ currentImage.width }}×{{ currentImage.height }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">大小:</span>
                <span class="info-value">{{ formatFileSize(currentImage.size) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">格式:</span>
                <span class="info-value">{{ currentImage.type }}</span>
              </div>
            </div>
          </div>

          <!-- 拖拽上传提示 -->
          <div
            v-if="isDragging"
            class="drag-overlay"
            @dragenter.prevent="handleDragEnter"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
          >
            <div class="drag-content">
              <el-icon><Upload /></el-icon>
              <p>释放以上传图像</p>
            </div>
          </div>
        </div>

        <!-- 分析设置 -->
        <div v-if="showAnalysisSettings" class="analysis-settings">
          <h4>分析设置</h4>

          <div class="setting-group">
            <label class="setting-label">分析模型</label>
            <el-select v-model="analysisConfig.model" placeholder="选择分析模型">
              <el-option
                v-for="model in availableModels"
                :key="model.value"
                :label="model.label"
                :value="model.value"
              />
            </el-select>
          </div>

          <div class="setting-group">
            <label class="setting-label">分析详细程度</label>
            <el-radio-group v-model="analysisConfig.detail" size="small">
              <el-radio value="basic">基础</el-radio>
              <el-radio value="detailed">详细</el-radio>
              <el-radio value="comprehensive">全面</el-radio>
            </el-radio-group>
          </div>

          <div class="setting-group">
            <label class="setting-label">分析类型</label>
            <el-checkbox-group v-model="analysisConfig.analysisTypes">
              <el-checkbox value="description">图像描述</el-checkbox>
              <el-checkbox value="objects">物体识别</el-checkbox>
              <el-checkbox value="text">文字识别(OCR)</el-checkbox>
              <el-checkbox value="colors">色彩分析</el-checkbox>
              <el-checkbox value="composition">构图分析</el-checkbox>
              <el-checkbox value="style">风格分析</el-checkbox>
              <el-checkbox value="emotions">情感分析</el-checkbox>
              <el-checkbox value="quality">质量评估</el-checkbox>
            </el-checkbox-group>
          </div>

          <div class="setting-group">
            <el-checkbox v-model="analysisConfig.includeMetadata">
              包含元数据分析
            </el-checkbox>
          </div>
        </div>
      </div>

      <!-- 右侧：分析结果 -->
      <div class="analyzer-right">
        <!-- 自定义分析问题 -->
        <div class="question-section">
          <div class="section-header">
            <h4>自定义分析问题</h4>
            <el-button
              size="small"
              text
              @click="showQuestionTemplates = !showQuestionTemplates"
            >
              模板
            </el-button>
          </div>

          <el-input
            v-model="customQuestion"
            type="textarea"
            :rows="2"
            placeholder="请输入你想了解的关于这张图像的问题..."
            maxlength="500"
            show-word-limit
          />

          <!-- 问题模板 -->
          <div v-if="showQuestionTemplates" class="question-templates">
            <div class="templates-grid">
              <button
                v-for="template in questionTemplates"
                :key="template"
                @click="selectQuestionTemplate(template)"
                class="template-btn"
              >
                {{ template }}
              </button>
            </div>
          </div>

          <!-- 分析按钮 -->
          <div class="analyze-actions">
            <el-button
              type="primary"
              :loading="isAnalyzing"
              :disabled="!currentImage"
              @click="analyzeImage"
              class="analyze-btn"
            >
              <el-icon v-if="!isAnalyzing"><View /></el-icon>
              {{ isAnalyzing ? '分析中...' : '开始分析' }}
            </el-button>

            <el-button
              v-if="isAnalyzing"
              @click="cancelAnalysis"
              type="danger"
              plain
            >
              取消
            </el-button>
          </div>
        </div>

        <!-- 分析结果展示 -->
        <div class="results-section">
          <!-- 空状态 -->
          <div v-if="!currentAnalysis && !isAnalyzing" class="empty-results">
            <div class="empty-icon">
              <el-icon><View /></el-icon>
            </div>
            <p class="empty-text">上传图像并开始分析</p>
            <p class="empty-hint">AI将为你提供详细的图像分析结果</p>
          </div>

          <!-- 分析进度 -->
          <div v-if="isAnalyzing" class="analysis-progress">
            <div class="progress-content">
              <el-icon class="progress-icon"><Loading /></el-icon>
              <div class="progress-text">
                <h4>正在分析图像...</h4>
                <p>{{ analysisProgress.text }}</p>
              </div>
            </div>
            <el-progress
              :percentage="analysisProgress.percentage"
              :show-text="false"
              :indeterminate="analysisProgress.percentage === 0"
            />
          </div>

          <!-- 分析结果 -->
          <div v-if="currentAnalysis" class="analysis-results">
            <!-- 基础描述 -->
            <div v-if="currentAnalysis.description" class="result-section">
              <h4 class="result-title">
                <el-icon><Document /></el-icon>
                图像描述
              </h4>
              <div class="result-content">
                <p class="description-text">{{ currentAnalysis.description }}</p>
              </div>
            </div>

            <!-- 自定义问题回答 -->
            <div v-if="currentAnalysis.customAnswer" class="result-section">
              <h4 class="result-title">
                <el-icon><ChatDotRound /></el-icon>
                问题解答
              </h4>
              <div class="result-content">
                <div class="question-block">
                  <strong>问题:</strong> {{ currentAnalysis.question }}
                </div>
                <div class="answer-block">
                  <strong>答案:</strong> {{ currentAnalysis.customAnswer }}
                </div>
              </div>
            </div>

            <!-- 物体识别 -->
            <div v-if="currentAnalysis.objects && currentAnalysis.objects.length > 0" class="result-section">
              <h4 class="result-title">
                <el-icon><Grid /></el-icon>
                识别物体
              </h4>
              <div class="result-content">
                <div class="objects-grid">
                  <div
                    v-for="object in currentAnalysis.objects"
                    :key="object.name"
                    class="object-item"
                  >
                    <span class="object-name">{{ object.name }}</span>
                    <span class="object-confidence">{{ (object.confidence * 100).toFixed(1) }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 文字识别 -->
            <div v-if="currentAnalysis.text && currentAnalysis.text.length > 0" class="result-section">
              <h4 class="result-title">
                <el-icon><Document /></el-icon>
                识别文字(OCR)
              </h4>
              <div class="result-content">
                <div class="text-results">
                  <div
                    v-for="(textItem, index) in currentAnalysis.text"
                    :key="index"
                    class="text-item"
                  >
                    <span class="text-content">{{ textItem.text }}</span>
                    <span class="text-confidence">{{ (textItem.confidence * 100).toFixed(1) }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 色彩分析 -->
            <div v-if="currentAnalysis.colors" class="result-section">
              <h4 class="result-title">
                <el-icon><Brush /></el-icon>
                色彩分析
              </h4>
              <div class="result-content">
                <div class="colors-grid">
                  <div
                    v-for="color in currentAnalysis.colors.dominantColors"
                    :key="color.hex"
                    class="color-item"
                  >
                    <div
                      class="color-swatch"
                      :style="{ backgroundColor: color.hex }"
                    ></div>
                    <div class="color-info">
                      <span class="color-hex">{{ color.hex }}</span>
                      <span class="color-percentage">{{ (color.percentage * 100).toFixed(1) }}%</span>
                    </div>
                  </div>
                </div>
                <div class="color-stats">
                  <div class="stat-item">
                    <span class="stat-label">整体亮度:</span>
                    <span class="stat-value">{{ currentAnalysis.colors.brightness }}%</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">饱和度:</span>
                    <span class="stat-value">{{ currentAnalysis.colors.saturation }}%</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">对比度:</span>
                    <span class="stat-value">{{ currentAnalysis.colors.contrast }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 构图分析 -->
            <div v-if="currentAnalysis.composition" class="result-section">
              <h4 class="result-title">
                <el-icon><PictureRounded /></el-icon>
                构图分析
              </h4>
              <div class="result-content">
                <div class="composition-grid">
                  <div class="composition-item">
                    <span class="composition-label">构图类型:</span>
                    <span class="composition-value">{{ currentAnalysis.composition.type }}</span>
                  </div>
                  <div class="composition-item">
                    <span class="composition-label">主体位置:</span>
                    <span class="composition-value">{{ currentAnalysis.composition.subjectPosition }}</span>
                  </div>
                  <div class="composition-item">
                    <span class="composition-label">平衡度:</span>
                    <span class="composition-value">{{ currentAnalysis.composition.balance }}/10</span>
                  </div>
                  <div class="composition-item">
                    <span class="composition-label">引导线:</span>
                    <span class="composition-value">{{ currentAnalysis.composition.leadingLines ? '有' : '无' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 风格分析 -->
            <div v-if="currentAnalysis.style" class="result-section">
              <h4 class="result-title">
                <el-icon><Brush /></el-icon>
                风格分析
              </h4>
              <div class="result-content">
                <div class="style-tags">
                  <el-tag
                    v-for="style in currentAnalysis.style.tags"
                    :key="style.name"
                    type="info"
                    class="style-tag"
                  >
                    {{ style.name }} ({{ (style.confidence * 100).toFixed(1) }}%)
                  </el-tag>
                </div>
                <p class="style-description">{{ currentAnalysis.style.description }}</p>
              </div>
            </div>

            <!-- 质量评估 -->
            <div v-if="currentAnalysis.quality" class="result-section">
              <h4 class="result-title">
                <el-icon><Star /></el-icon>
                质量评估
              </h4>
              <div class="result-content">
                <div class="quality-metrics">
                  <div class="metric-item">
                    <span class="metric-label">整体质量:</span>
                    <el-rate
                      v-model="currentAnalysis.quality.overall"
                      disabled
                      show-score
                      text-color="#ff9900"
                    />
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">清晰度:</span>
                    <el-progress
                      :percentage="currentAnalysis.quality.sharpness * 20"
                      :show-text="false"
                      :stroke-width="8"
                    />
                    <span class="metric-value">{{ currentAnalysis.quality.sharpness }}/5</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">曝光:</span>
                    <el-progress
                      :percentage="currentAnalysis.quality.exposure * 20"
                      :show-text="false"
                      :stroke-width="8"
                    />
                    <span class="metric-value">{{ currentAnalysis.quality.exposure }}/5</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">噪点:</span>
                    <el-progress
                      :percentage="(5 - currentAnalysis.quality.noise) * 20"
                      :show-text="false"
                      :stroke-width="8"
                      color="#67c23a"
                    />
                    <span class="metric-value">{{ currentAnalysis.quality.noise }}/5</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="result-actions">
              <el-button
                size="small"
                :icon="DocumentCopy"
                @click="copyAnalysisResult"
              >
                复制结果
              </el-button>
              <el-button
                size="small"
                :icon="Download"
                @click="exportAnalysisResult"
              >
                导出结果
              </el-button>
              <el-button
                size="small"
                :icon="Share"
                @click="shareAnalysisResult"
              >
                分享结果
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 文件上传输入框 -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileSelect"
    />

    <!-- 全屏预览对话框 -->
    <el-dialog
      v-model="showFullPreview"
      title="图像预览"
      width="90%"
      :close-on-click-modal="true"
    >
      <div v-if="currentImage" class="full-preview-content">
        <img
          :src="currentImage.url"
          :alt="currentImage.name"
          class="full-preview-image"
        />
      </div>
    </el-dialog>

    <!-- 分析历史对话框 -->
    <el-dialog
      v-model="showHistory"
      title="分析历史"
      width="70%"
    >
      <div class="history-content">
        <div v-if="analysisHistory.length === 0" class="empty-history">
          <p>暂无分析历史</p>
        </div>
        <div v-else class="history-list">
          <div
            v-for="item in analysisHistory"
            :key="item.id"
            class="history-item"
            @click="loadHistoryItem(item)"
          >
            <img
              :src="item.image.thumbnail || item.image.url"
              :alt="item.image.name"
              class="history-thumbnail"
            />
            <div class="history-info">
              <h4 class="history-title">{{ item.image.name }}</h4>
              <p class="history-description">{{ item.analysis.description?.slice(0, 100) }}...</p>
              <div class="history-meta">
                <span class="history-date">{{ formatDate(item.createdAt) }}</span>
                <span class="history-model">{{ item.model }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  View, FolderOpened, Setting, Plus, ZoomIn, Refresh, Delete, Upload,
  Document, ChatDotRound, Grid, Brush, PictureRounded, Star,
  DocumentCopy, Download, Share, Loading
} from '@element-plus/icons-vue'
import { http } from '@/utils/axios'

// 接口定义
interface ImageFile {
  id: string
  name: string
  url: string
  thumbnail?: string
  type: string
  size: number
  width: number
  height: number
  file?: File
}

interface AnalysisResult {
  id: string
  description?: string
  question?: string
  customAnswer?: string
  objects?: Array<{
    name: string
    confidence: number
    boundingBox?: any
  }>
  text?: Array<{
    text: string
    confidence: number
    boundingBox?: any
  }>
  colors?: {
    dominantColors: Array<{
      hex: string
      percentage: number
    }>
    brightness: number
    saturation: number
    contrast: number
  }
  composition?: {
    type: string
    subjectPosition: string
    balance: number
    leadingLines: boolean
  }
  style?: {
    tags: Array<{
      name: string
      confidence: number
    }>
    description: string
  }
  quality?: {
    overall: number
    sharpness: number
    exposure: number
    noise: number
  }
  metadata?: any
}

interface AnalysisHistoryItem {
  id: string
  image: ImageFile
  analysis: AnalysisResult
  model: string
  createdAt: Date
}

// 响应式数据
const currentImage = ref<ImageFile | null>(null)
const currentAnalysis = ref<AnalysisResult | null>(null)
const customQuestion = ref('')
const isAnalyzing = ref(false)
const isDragging = ref(false)
const showAnalysisSettings = ref(false)
const showQuestionTemplates = ref(false)
const showFullPreview = ref(false)
const showHistory = ref(false)
const fileInput = ref<HTMLInputElement>()

const analysisConfig = reactive({
  model: 'gpt-4-vision',
  detail: 'detailed',
  analysisTypes: ['description', 'objects', 'colors'],
  includeMetadata: false
})

const analysisProgress = reactive({
  percentage: 0,
  text: '准备分析...'
})

const analysisHistory = ref<AnalysisHistoryItem[]>([])

// 可用选项
const availableModels = [
  { value: 'gpt-4-vision', label: 'GPT-4 Vision (推荐)' },
  { value: 'claude-3-vision', label: 'Claude 3 Vision' },
  { value: 'gemini-pro-vision', label: 'Gemini Pro Vision' },
  { value: 'local-vision', label: '本地视觉模型' }
]

const questionTemplates = [
  '这张图片的主要内容是什么？',
  '图片中有哪些物体？',
  '这张图片的情感色彩如何？',
  '图片的拍摄技巧怎么样？',
  '这张图片想要表达什么？',
  '图片中的文字内容是什么？',
  '这张图片适合用在什么场景？',
  '图片的构图有什么特点？',
  '这张图片的色彩搭配如何？',
  '图片中有什么需要改进的地方？'
]

// 方法
const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const files = (event.target as HTMLInputElement).files
  if (files && files.length > 0) {
    processImageFile(files[0])
  }
}

const processImageFile = async (file: File) => {
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请上传图像文件')
    return
  }

  // 验证文件大小
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('图像文件大小不能超过10MB')
    return
  }

  try {
    // 创建图像对象获取尺寸
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      currentImage.value = {
        id: Date.now().toString(),
        name: file.name,
        url: url,
        type: file.type,
        size: file.size,
        width: img.width,
        height: img.height,
        file: file
      }

      // 清除之前的分析结果
      currentAnalysis.value = null

      ElMessage.success('图像上传成功')
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      ElMessage.error('图像文件格式不支持')
    }

    img.src = url
  } catch (error) {
    console.error('处理图像文件失败:', error)
    ElMessage.error('处理图像文件失败')
  }
}

const replaceImage = () => {
  triggerFileUpload()
}

const removeImage = () => {
  if (currentImage.value?.url) {
    URL.revokeObjectURL(currentImage.value.url)
  }
  currentImage.value = null
  currentAnalysis.value = null
  customQuestion.value = ''
}

const onImageLoad = () => {
  console.log('图像加载完成')
}

const onImageError = () => {
  ElMessage.error('图像加载失败')
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 拖拽处理
const handleDragEnter = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  if (!e.currentTarget?.contains(e.relatedTarget as Node)) {
    isDragging.value = false
  }
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    processImageFile(files[0])
  }
}

const selectQuestionTemplate = (template: string) => {
  customQuestion.value = template
  showQuestionTemplates.value = false
}

const analyzeImage = async () => {
  if (!currentImage.value) {
    ElMessage.error('请先上传图像')
    return
  }

  isAnalyzing.value = true
  analysisProgress.percentage = 0
  analysisProgress.text = '上传图像...'

  try {
    // 创建FormData上传图像
    const formData = new FormData()
    if (currentImage.value.file) {
      formData.append('image', currentImage.value.file)
    }
    formData.append('config', JSON.stringify(analysisConfig))
    if (customQuestion.value.trim()) {
      formData.append('question', customQuestion.value)
    }

    // 模拟分析进度
    const progressSteps = [
      { percentage: 20, text: '分析图像内容...' },
      { percentage: 40, text: '识别物体和文字...' },
      { percentage: 60, text: '分析色彩和构图...' },
      { percentage: 80, text: '生成分析报告...' },
      { percentage: 100, text: '分析完成' }
    ]

    let stepIndex = 0
    const progressInterval = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        analysisProgress.percentage = progressSteps[stepIndex].percentage
        analysisProgress.text = progressSteps[stepIndex].text
        stepIndex++
      } else {
        clearInterval(progressInterval)
      }
    }, 800)

    // 发送分析请求
    const response = await http.post('/multimodal/image/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    clearInterval(progressInterval)

    // 处理分析结果
    currentAnalysis.value = response.analysis

    // 保存到历史记录
    const historyItem: AnalysisHistoryItem = {
      id: Date.now().toString(),
      image: currentImage.value,
      analysis: response.analysis,
      model: analysisConfig.model,
      createdAt: new Date()
    }
    analysisHistory.value.unshift(historyItem)

    ElMessage.success('图像分析完成')
  } catch (error: any) {
    console.error('图像分析失败:', error)
    ElMessage.error(error.message || '图像分析失败')
  } finally {
    isAnalyzing.value = false
    analysisProgress.percentage = 0
    analysisProgress.text = ''
  }
}

const cancelAnalysis = () => {
  isAnalyzing.value = false
  analysisProgress.percentage = 0
  analysisProgress.text = ''
  ElMessage.info('已取消分析')
}

const copyAnalysisResult = async () => {
  if (!currentAnalysis.value) return

  try {
    const resultText = formatAnalysisForCopy(currentAnalysis.value)
    await navigator.clipboard.writeText(resultText)
    ElMessage.success('分析结果已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

const formatAnalysisForCopy = (analysis: AnalysisResult) => {
  let result = '# 图像分析结果\n\n'

  if (analysis.description) {
    result += `## 图像描述\n${analysis.description}\n\n`
  }

  if (analysis.customAnswer) {
    result += `## 问题解答\n**问题:** ${analysis.question}\n**答案:** ${analysis.customAnswer}\n\n`
  }

  if (analysis.objects && analysis.objects.length > 0) {
    result += `## 识别物体\n`
    analysis.objects.forEach(obj => {
      result += `- ${obj.name} (${(obj.confidence * 100).toFixed(1)}%)\n`
    })
    result += '\n'
  }

  if (analysis.text && analysis.text.length > 0) {
    result += `## 识别文字\n`
    analysis.text.forEach(text => {
      result += `- ${text.text} (${(text.confidence * 100).toFixed(1)}%)\n`
    })
    result += '\n'
  }

  return result
}

const exportAnalysisResult = () => {
  if (!currentAnalysis.value) return

  const resultData = {
    image: {
      name: currentImage.value?.name,
      width: currentImage.value?.width,
      height: currentImage.value?.height,
      type: currentImage.value?.type
    },
    analysis: currentAnalysis.value,
    exportedAt: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(resultData, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `image-analysis-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('分析结果已导出')
}

const shareAnalysisResult = async () => {
  if (!currentAnalysis.value) return

  const shareText = formatAnalysisForCopy(currentAnalysis.value)

  if (navigator.share) {
    try {
      await navigator.share({
        title: '图像分析结果',
        text: shareText
      })
    } catch (error) {
      console.error('分享失败:', error)
    }
  } else {
    try {
      await navigator.clipboard.writeText(shareText)
      ElMessage.success('分析结果已复制到剪贴板')
    } catch (error) {
      ElMessage.error('分享失败')
    }
  }
}

const loadHistoryItem = (item: AnalysisHistoryItem) => {
  currentImage.value = item.image
  currentAnalysis.value = item.analysis
  analysisConfig.model = item.model
  showHistory.value = false
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  // 加载分析历史
  loadAnalysisHistory()

  // 添加全局拖拽事件监听
  document.addEventListener('dragenter', handleDragEnter)
  document.addEventListener('dragover', handleDragOver)
  document.addEventListener('dragleave', handleDragLeave)
  document.addEventListener('drop', handleDrop)
})

const loadAnalysisHistory = async () => {
  try {
    const response = await http.get('/multimodal/image/analysis-history')
    if (response.history) {
      analysisHistory.value = response.history
    }
  } catch (error) {
    console.error('加载分析历史失败:', error)
  }
}
</script>

<style scoped>
.image-analyzer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  padding: 16px;
}

.analyzer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.analyzer-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.analyzer-content {
  display: flex;
  gap: 24px;
  flex: 1;
  min-height: 0;
}

.analyzer-left {
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.analyzer-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.upload-section {
  position: relative;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  overflow: hidden;
}

.upload-area {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  cursor: pointer;
  border: 2px dashed var(--el-border-color);
  border-radius: 8px;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.upload-content {
  text-align: center;
  color: var(--el-text-color-secondary);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: var(--el-color-primary);
}

.upload-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.upload-hint,
.upload-size {
  font-size: 13px;
  opacity: 0.7;
  margin: 4px 0;
}

.image-preview {
  position: relative;
}

.preview-container {
  position: relative;
  width: 100%;
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.image-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.preview-container:hover .image-actions {
  opacity: 1;
}

.image-info {
  padding: 12px;
  background: var(--el-bg-color-page);
  border-top: 1px solid var(--el-border-color-light);
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
}

.info-label {
  color: var(--el-text-color-secondary);
}

.info-value {
  color: var(--el-text-color-primary);
}

.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(64, 158, 255, 0.1);
  border: 2px dashed var(--el-color-primary);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.drag-content {
  text-align: center;
  color: var(--el-color-primary);
  font-size: 18px;
  font-weight: 500;
}

.drag-content .el-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.analysis-settings {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
}

.analysis-settings h4 {
  margin: 0 0 16px 0;
  color: var(--el-text-color-primary);
}

.setting-group {
  margin-bottom: 16px;
}

.setting-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.question-section {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h4 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.question-templates {
  margin: 12px 0;
}

.templates-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.template-btn {
  padding: 8px 12px;
  background: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.template-btn:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.analyze-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.analyze-btn {
  flex: 1;
  height: 40px;
}

.results-section {
  flex: 1;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  padding: 16px;
  overflow-y: auto;
}

.empty-results {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--el-text-color-secondary);
  min-height: 200px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  opacity: 0.7;
}

.analysis-progress {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  text-align: center;
}

.progress-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.progress-icon {
  font-size: 32px;
  color: var(--el-color-primary);
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.progress-text h4 {
  margin: 0 0 4px 0;
  color: var(--el-text-color-primary);
}

.progress-text p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.analysis-results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-section {
  background: var(--el-bg-color-page);
  border-radius: 6px;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
}

.result-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.result-content {
  color: var(--el-text-color-regular);
}

.description-text {
  line-height: 1.6;
  margin: 0;
}

.question-block,
.answer-block {
  margin-bottom: 8px;
}

.objects-grid,
.text-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.object-item,
.text-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--el-bg-color);
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
}

.object-name,
.text-content {
  font-weight: 500;
}

.object-confidence,
.text-confidence {
  font-size: 12px;
  color: var(--el-color-success);
}

.colors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.color-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color);
}

.color-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.color-hex {
  font-size: 12px;
  font-family: monospace;
  font-weight: 500;
}

.color-percentage {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.color-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 8px;
  background: var(--el-bg-color);
  border-radius: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stat-value {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.composition-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.composition-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--el-bg-color);
  border-radius: 4px;
}

.composition-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.composition-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.style-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.style-tag {
  font-size: 12px;
}

.style-description {
  line-height: 1.5;
  margin: 0;
  font-style: italic;
}

.quality-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.metric-label {
  min-width: 60px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.metric-value {
  min-width: 40px;
  text-align: right;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.result-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.full-preview-content {
  text-align: center;
}

.full-preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
}

.history-content {
  min-height: 400px;
}

.empty-history {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--el-text-color-secondary);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--el-bg-color-page);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover {
  border-color: var(--el-color-primary);
  transform: translateY(-1px);
}

.history-thumbnail {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-description {
  margin: 0 0 6px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.history-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .analyzer-content {
    flex-direction: column;
  }

  .analyzer-left {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .analyzer-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .colors-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .color-stats,
  .composition-grid {
    grid-template-columns: 1fr;
  }

  .result-actions {
    flex-direction: column;
  }
}
</style>
