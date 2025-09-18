<template>
  <div class="image-generator">
    <!-- 头部工具栏 -->
    <div class="generator-header">
      <div class="header-left">
        <h3 class="generator-title">
          <el-icon><Picture /></el-icon>
          AI图像生成
        </h3>
        <el-tag v-if="costEstimate" type="info" size="small">
          预估费用: {{ costEstimate }}
        </el-tag>
      </div>
      <div class="header-actions">
        <el-button
          size="small"
          :icon="Folder"
          @click="showGallery = true"
          title="我的画廊"
        >
          画廊
        </el-button>
        <el-button
          size="small"
          :icon="Setting"
          @click="showAdvancedSettings = !showAdvancedSettings"
          title="高级设置"
        >
          设置
        </el-button>
      </div>
    </div>

    <div class="generator-content">
      <!-- 左侧：提示词和设置 -->
      <div class="generator-left">
        <!-- 提示词输入区域 -->
        <div class="prompt-section">
          <div class="section-header">
            <label class="section-title">正向提示词</label>
            <el-button
              size="small"
              text
              @click="showPromptHelper = true"
              title="提示词助手"
            >
              <el-icon><MagicStick /></el-icon>
              助手
            </el-button>
          </div>

          <el-input
            v-model="prompts.positive"
            type="textarea"
            :rows="4"
            placeholder="描述你想要生成的图像..."
            maxlength="2000"
            show-word-limit
            @input="onPromptChange"
          />

          <!-- 提示词建议 -->
          <div v-if="promptSuggestions.length > 0" class="prompt-suggestions">
            <div class="suggestions-header">
              <span class="suggestions-title">建议添加：</span>
            </div>
            <div class="suggestions-list">
              <el-tag
                v-for="suggestion in promptSuggestions"
                :key="suggestion"
                size="small"
                class="suggestion-tag"
                @click="addPromptSuggestion(suggestion)"
              >
                + {{ suggestion }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 负向提示词 -->
        <div class="prompt-section">
          <label class="section-title">负向提示词</label>
          <el-input
            v-model="prompts.negative"
            type="textarea"
            :rows="2"
            placeholder="描述不想要的元素..."
            maxlength="1000"
            show-word-limit
          />
        </div>

        <!-- 基础设置 -->
        <div class="settings-section">
          <div class="settings-grid">
            <!-- 图像尺寸 -->
            <div class="setting-item">
              <label class="setting-label">图像尺寸</label>
              <el-select v-model="settings.size" @change="onSizeChange">
                <el-option
                  v-for="size in availableSizes"
                  :key="size.value"
                  :label="size.label"
                  :value="size.value"
                />
              </el-select>
            </div>

            <!-- 图像质量 -->
            <div class="setting-item">
              <label class="setting-label">图像质量</label>
              <el-select v-model="settings.quality">
                <el-option label="标准" value="standard" />
                <el-option label="高清" value="hd" />
                <el-option label="超高清" value="ultra" />
              </el-select>
            </div>

            <!-- 艺术风格 -->
            <div class="setting-item">
              <label class="setting-label">艺术风格</label>
              <el-select v-model="settings.style" clearable placeholder="选择风格">
                <el-option
                  v-for="style in artStyles"
                  :key="style.value"
                  :label="style.label"
                  :value="style.value"
                />
              </el-select>
            </div>

            <!-- 生成数量 -->
            <div class="setting-item">
              <label class="setting-label">生成数量</label>
              <el-input-number
                v-model="settings.count"
                :min="1"
                :max="4"
                size="small"
                controls-position="right"
              />
            </div>
          </div>
        </div>

        <!-- 高级设置 -->
        <div v-if="showAdvancedSettings" class="advanced-settings">
          <el-divider content-position="left">高级设置</el-divider>

          <div class="settings-grid">
            <!-- AI模型选择 -->
            <div class="setting-item">
              <label class="setting-label">AI模型</label>
              <el-select v-model="settings.model">
                <el-option
                  v-for="model in availableModels"
                  :key="model.value"
                  :label="model.label"
                  :value="model.value"
                />
              </el-select>
            </div>

            <!-- 引导强度 -->
            <div class="setting-item">
              <label class="setting-label">引导强度 ({{ settings.guidanceScale }})</label>
              <el-slider
                v-model="settings.guidanceScale"
                :min="1"
                :max="20"
                :step="0.5"
                show-tooltip
              />
            </div>

            <!-- 推理步数 -->
            <div class="setting-item">
              <label class="setting-label">推理步数 ({{ settings.steps }})</label>
              <el-slider
                v-model="settings.steps"
                :min="10"
                :max="100"
                :step="5"
                show-tooltip
              />
            </div>

            <!-- 随机种子 -->
            <div class="setting-item">
              <label class="setting-label">随机种子</label>
              <div class="seed-input">
                <el-input
                  v-model="settings.seed"
                  placeholder="留空随机生成"
                  type="number"
                />
                <el-button
                  size="small"
                  :icon="Refresh"
                  @click="generateRandomSeed"
                  title="随机种子"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：生成和预览 -->
      <div class="generator-right">
        <!-- 生成按钮 -->
        <div class="generate-section">
          <el-button
            type="primary"
            size="large"
            :loading="isGenerating"
            :disabled="!canGenerate"
            @click="generateImages"
            class="generate-btn"
          >
            <el-icon v-if="!isGenerating"><Picture /></el-icon>
            {{ isGenerating ? `生成中... ${progress}%` : '生成图像' }}
          </el-button>

          <!-- 生成进度 -->
          <div v-if="isGenerating" class="generation-progress">
            <el-progress
              :percentage="progress"
              :status="progress === 100 ? 'success' : undefined"
              :show-text="false"
            />
            <div class="progress-info">
              <span class="progress-text">{{ progressText }}</span>
              <el-button
                size="small"
                text
                type="danger"
                @click="cancelGeneration"
              >
                取消
              </el-button>
            </div>
          </div>
        </div>

        <!-- 预览区域 -->
        <div class="preview-section">
          <div v-if="generatedImages.length === 0 && !isGenerating" class="empty-preview">
            <div class="empty-icon">
              <el-icon><Picture /></el-icon>
            </div>
            <p class="empty-text">在这里预览生成的图像</p>
            <p class="empty-hint">输入提示词后点击生成按钮开始创作</p>
          </div>

          <!-- 生成的图像网格 -->
          <div v-else class="image-grid">
            <div
              v-for="(image, index) in generatedImages"
              :key="image.id"
              class="image-item"
              :class="{ 'selected': selectedImages.includes(image.id) }"
              @click="toggleImageSelection(image.id)"
            >
              <div class="image-wrapper">
                <img
                  :src="image.url"
                  :alt="image.prompt"
                  class="generated-image"
                  @load="onImageLoad(image)"
                  @error="onImageError(image)"
                />

                <!-- 图像遮罩层 -->
                <div class="image-overlay">
                  <div class="image-actions">
                    <el-button
                      size="small"
                      circle
                      :icon="ZoomIn"
                      @click.stop="previewImage(image)"
                      title="预览"
                    />
                    <el-button
                      size="small"
                      circle
                      :icon="Download"
                      @click.stop="downloadImage(image)"
                      title="下载"
                    />
                    <el-button
                      size="small"
                      circle
                      :icon="Share"
                      @click.stop="shareImage(image)"
                      title="分享"
                    />
                    <el-button
                      size="small"
                      circle
                      :icon="RefreshRight"
                      @click.stop="generateVariations(image)"
                      title="生成变体"
                    />
                  </div>

                  <!-- 选择标记 -->
                  <div class="selection-indicator">
                    <el-icon><Check /></el-icon>
                  </div>
                </div>

                <!-- 图像信息 -->
                <div class="image-info">
                  <div class="image-meta">
                    <span class="image-size">{{ image.width }}×{{ image.height }}</span>
                    <span class="image-model">{{ image.model }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 批量操作 -->
          <div v-if="selectedImages.length > 0" class="batch-actions">
            <div class="batch-info">
              已选择 {{ selectedImages.length }} 张图像
            </div>
            <div class="batch-buttons">
              <el-button
                size="small"
                :icon="Download"
                @click="downloadSelected"
              >
                批量下载
              </el-button>
              <el-button
                size="small"
                :icon="Collection"
                @click="saveToGallery"
              >
                保存到画廊
              </el-button>
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                @click="deleteSelected"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 提示词助手对话框 -->
    <PromptHelper
      v-model="showPromptHelper"
      :current-prompt="prompts.positive"
      @prompt-updated="updatePrompt"
    />

    <!-- 图像预览对话框 -->
    <el-dialog
      v-model="showImagePreview"
      title="图像预览"
      width="80%"
      :close-on-click-modal="true"
    >
      <div v-if="previewingImage" class="image-preview-content">
        <img
          :src="previewingImage.url"
          :alt="previewingImage.prompt"
          class="preview-image"
        />
        <div class="preview-info">
          <h4>生成信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">提示词:</span>
              <span class="info-value">{{ previewingImage.prompt }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">尺寸:</span>
              <span class="info-value">{{ previewingImage.width }}×{{ previewingImage.height }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">模型:</span>
              <span class="info-value">{{ previewingImage.model }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">种子:</span>
              <span class="info-value">{{ previewingImage.seed }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 画廊对话框 -->
    <ImageGallery
      v-model="showGallery"
      @image-selected="handleGalleryImageSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Picture, Folder, Setting, MagicStick, Refresh, ZoomIn, Download,
  Share, RefreshRight, Check, Collection, Delete
} from '@element-plus/icons-vue'
import { http } from '@/utils/axios'
import PromptHelper from './PromptHelper.vue'
import ImageGallery from './ImageGallery.vue'

// 接口定义
interface GeneratedImage {
  id: string
  url: string
  prompt: string
  negativePrompt?: string
  width: number
  height: number
  model: string
  seed: number
  settings: any
  createdAt: Date
}

interface ImageSize {
  value: string
  label: string
  width: number
  height: number
  aspectRatio: string
}

interface ArtStyle {
  value: string
  label: string
  description?: string
}

interface AIModel {
  value: string
  label: string
  description?: string
  maxSize?: string
}

// 响应式数据
const prompts = reactive({
  positive: '',
  negative: 'blurry, low quality, distorted, ugly, bad anatomy'
})

const settings = reactive({
  model: 'dall-e-3',
  size: '1024x1024',
  quality: 'standard',
  style: '',
  count: 1,
  guidanceScale: 7.5,
  steps: 20,
  seed: ''
})

const generatedImages = ref<GeneratedImage[]>([])
const selectedImages = ref<string[]>([])
const isGenerating = ref(false)
const progress = ref(0)
const progressText = ref('')
const showAdvancedSettings = ref(false)
const showPromptHelper = ref(false)
const showImagePreview = ref(false)
const showGallery = ref(false)
const previewingImage = ref<GeneratedImage | null>(null)
const promptSuggestions = ref<string[]>([])

// 可用选项
const availableSizes: ImageSize[] = [
  { value: '512x512', label: '正方形 (512×512)', width: 512, height: 512, aspectRatio: '1:1' },
  { value: '768x768', label: '正方形 (768×768)', width: 768, height: 768, aspectRatio: '1:1' },
  { value: '1024x1024', label: '正方形 (1024×1024)', width: 1024, height: 1024, aspectRatio: '1:1' },
  { value: '1024x768', label: '横版 (1024×768)', width: 1024, height: 768, aspectRatio: '4:3' },
  { value: '768x1024', label: '竖版 (768×1024)', width: 768, height: 1024, aspectRatio: '3:4' },
  { value: '1280x720', label: '宽屏 (1280×720)', width: 1280, height: 720, aspectRatio: '16:9' },
  { value: '720x1280', label: '手机屏 (720×1280)', width: 720, height: 1280, aspectRatio: '9:16' }
]

const artStyles: ArtStyle[] = [
  { value: 'photorealistic', label: '写实摄影' },
  { value: 'anime', label: '动漫风格' },
  { value: 'oil-painting', label: '油画' },
  { value: 'watercolor', label: '水彩画' },
  { value: 'digital-art', label: '数字艺术' },
  { value: 'concept-art', label: '概念艺术' },
  { value: 'fantasy', label: '奇幻风格' },
  { value: 'sci-fi', label: '科幻风格' },
  { value: 'minimalist', label: '极简主义' },
  { value: 'vintage', label: '复古风格' }
]

const availableModels: AIModel[] = [
  { value: 'dall-e-3', label: 'DALL-E 3', description: '最新的OpenAI图像生成模型' },
  { value: 'dall-e-2', label: 'DALL-E 2', description: 'OpenAI的经典图像生成模型' },
  { value: 'midjourney', label: 'Midjourney', description: '著名的艺术风格生成模型' },
  { value: 'stable-diffusion', label: 'Stable Diffusion', description: '开源的高质量图像生成模型' },
  { value: 'firefly', label: 'Adobe Firefly', description: 'Adobe的商业级图像生成模型' }
]

// 计算属性
const canGenerate = computed(() => {
  return prompts.positive.trim().length > 0 && !isGenerating.value
})

const costEstimate = computed(() => {
  // 根据模型、质量、数量计算费用
  const baseCost = {
    'dall-e-3': 0.04,
    'dall-e-2': 0.02,
    'midjourney': 0.03,
    'stable-diffusion': 0.01,
    'firefly': 0.035
  }

  const qualityMultiplier = {
    'standard': 1,
    'hd': 2,
    'ultra': 3
  }

  const base = baseCost[settings.model as keyof typeof baseCost] || 0.02
  const multiplier = qualityMultiplier[settings.quality as keyof typeof qualityMultiplier] || 1
  const total = base * multiplier * settings.count

  return `$${total.toFixed(3)}`
})

// 方法
const onPromptChange = () => {
  // 实时获取提示词建议
  if (prompts.positive.length > 10) {
    getPromptSuggestions()
  } else {
    promptSuggestions.value = []
  }
}

const getPromptSuggestions = async () => {
  try {
    const response = await http.post('/multimodal/image/prompt-suggestions', {
      prompt: prompts.positive,
      style: settings.style
    })
    promptSuggestions.value = response.suggestions || []
  } catch (error) {
    console.error('获取提示词建议失败:', error)
  }
}

const addPromptSuggestion = (suggestion: string) => {
  if (!prompts.positive.includes(suggestion)) {
    prompts.positive += (prompts.positive ? ', ' : '') + suggestion
  }
  // 移除已使用的建议
  promptSuggestions.value = promptSuggestions.value.filter(s => s !== suggestion)
}

const onSizeChange = () => {
  // 根据尺寸调整其他设置
  const size = availableSizes.find(s => s.value === settings.size)
  if (size && size.width * size.height > 1024 * 1024) {
    // 大尺寸图像降低生成数量
    if (settings.count > 2) {
      settings.count = 2
      ElMessage.info('大尺寸图像已自动调整生成数量为2张')
    }
  }
}

const generateRandomSeed = () => {
  settings.seed = Math.floor(Math.random() * 4294967295).toString()
}

const generateImages = async () => {
  if (!canGenerate.value) return

  isGenerating.value = true
  progress.value = 0
  progressText.value = '准备生成...'

  try {
    // 构建生成参数
    const generateParams = {
      prompt: prompts.positive,
      negativePrompt: prompts.negative,
      ...settings,
      seed: settings.seed || undefined
    }

    // 开始生成请求
    const response = await http.post('/multimodal/image/generate', generateParams)

    if (response.jobId) {
      // 如果返回任务ID，开始轮询状态
      await pollGenerationStatus(response.jobId)
    } else if (response.images) {
      // 如果直接返回图像，处理结果
      handleGenerationComplete(response.images)
    }
  } catch (error: any) {
    console.error('图像生成失败:', error)
    ElMessage.error(error.message || '图像生成失败')
  } finally {
    isGenerating.value = false
    progress.value = 0
    progressText.value = ''
  }
}

const pollGenerationStatus = async (jobId: string) => {
  const pollInterval = setInterval(async () => {
    try {
      const response = await http.get(`/multimodal/image/status/${jobId}`)

      progress.value = response.progress || 0
      progressText.value = response.status || '生成中...'

      if (response.status === 'completed' && response.images) {
        clearInterval(pollInterval)
        handleGenerationComplete(response.images)
      } else if (response.status === 'failed') {
        clearInterval(pollInterval)
        throw new Error(response.error || '图像生成失败')
      }
    } catch (error) {
      clearInterval(pollInterval)
      throw error
    }
  }, 1000)
}

const handleGenerationComplete = (images: any[]) => {
  const newImages: GeneratedImage[] = images.map(img => ({
    id: img.id || Date.now().toString() + Math.random(),
    url: img.url,
    prompt: prompts.positive,
    negativePrompt: prompts.negative,
    width: img.width || 1024,
    height: img.height || 1024,
    model: settings.model,
    seed: img.seed || parseInt(settings.seed) || 0,
    settings: { ...settings },
    createdAt: new Date()
  }))

  generatedImages.value.unshift(...newImages)
  progress.value = 100
  progressText.value = '生成完成！'

  ElMessage.success(`成功生成 ${newImages.length} 张图像`)

  // 3秒后重置进度
  setTimeout(() => {
    progress.value = 0
    progressText.value = ''
  }, 3000)
}

const cancelGeneration = () => {
  // 实现取消生成逻辑
  isGenerating.value = false
  progress.value = 0
  progressText.value = ''
  ElMessage.info('已取消生成')
}

const toggleImageSelection = (imageId: string) => {
  const index = selectedImages.value.indexOf(imageId)
  if (index > -1) {
    selectedImages.value.splice(index, 1)
  } else {
    selectedImages.value.push(imageId)
  }
}

const previewImage = (image: GeneratedImage) => {
  previewingImage.value = image
  showImagePreview.value = true
}

const downloadImage = async (image: GeneratedImage) => {
  try {
    const response = await fetch(image.url)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `generated-image-${image.id}.png`
    a.click()

    URL.revokeObjectURL(url)
    ElMessage.success('图像下载开始')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败')
  }
}

const shareImage = async (image: GeneratedImage) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'AI生成的图像',
        text: image.prompt,
        url: image.url
      })
    } catch (error) {
      console.error('分享失败:', error)
    }
  } else {
    // 复制链接到剪贴板
    try {
      await navigator.clipboard.writeText(image.url)
      ElMessage.success('图像链接已复制到剪贴板')
    } catch (error) {
      ElMessage.error('分享失败')
    }
  }
}

const generateVariations = async (image: GeneratedImage) => {
  // 基于现有图像生成变体
  prompts.positive = image.prompt
  prompts.negative = image.negativePrompt || prompts.negative
  settings.seed = (image.seed + 1).toString()

  await generateImages()
}

const downloadSelected = async () => {
  for (const imageId of selectedImages.value) {
    const image = generatedImages.value.find(img => img.id === imageId)
    if (image) {
      await downloadImage(image)
    }
  }
  selectedImages.value = []
}

const saveToGallery = async () => {
  try {
    const imagesToSave = generatedImages.value.filter(img =>
      selectedImages.value.includes(img.id)
    )

    await http.post('/multimodal/image/save-to-gallery', {
      images: imagesToSave
    })

    ElMessage.success(`已保存 ${imagesToSave.length} 张图像到画廊`)
    selectedImages.value = []
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存到画廊失败')
  }
}

const deleteSelected = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedImages.value.length} 张图像吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    generatedImages.value = generatedImages.value.filter(img =>
      !selectedImages.value.includes(img.id)
    )
    selectedImages.value = []

    ElMessage.success('已删除选中的图像')
  } catch {
    // 用户取消
  }
}

const updatePrompt = (newPrompt: string) => {
  prompts.positive = newPrompt
}

const handleGalleryImageSelected = (image: any) => {
  // 从画廊选择图像后的处理
  prompts.positive = image.prompt || ''
  if (image.negativePrompt) {
    prompts.negative = image.negativePrompt
  }
  showGallery.value = false
}

const onImageLoad = (image: GeneratedImage) => {
  // 图像加载完成处理
  console.log('图像加载完成:', image.id)
}

const onImageError = (image: GeneratedImage) => {
  // 图像加载错误处理
  console.error('图像加载失败:', image.id)
  ElMessage.error('图像加载失败')
}

// 生命周期
onMounted(() => {
  // 加载用户的默认设置
  loadUserSettings()

  // 加载最近的生成历史
  loadRecentGenerations()
})

const loadUserSettings = async () => {
  try {
    const response = await http.get('/user/image-generation-settings')
    if (response.settings) {
      Object.assign(settings, response.settings)
    }
  } catch (error) {
    console.error('加载用户设置失败:', error)
  }
}

const loadRecentGenerations = async () => {
  try {
    const response = await http.get('/multimodal/image/recent-generations', {
      params: { limit: 8 }
    })
    if (response.images) {
      generatedImages.value = response.images
    }
  } catch (error) {
    console.error('加载最近生成失败:', error)
  }
}

// 监听设置变化，自动保存
watch(settings, () => {
  // 防抖保存设置
  if (saveSettingsTimer) {
    clearTimeout(saveSettingsTimer)
  }
  saveSettingsTimer = setTimeout(saveUserSettings, 1000)
}, { deep: true })

let saveSettingsTimer: NodeJS.Timeout | null = null

const saveUserSettings = async () => {
  try {
    await http.post('/user/image-generation-settings', { settings })
  } catch (error) {
    console.error('保存用户设置失败:', error)
  }
}
</script>

<style scoped>
.image-generator {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  padding: 16px;
}

.generator-header {
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

.generator-title {
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

.generator-content {
  display: flex;
  gap: 24px;
  flex: 1;
  min-height: 0;
}

.generator-left {
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.generator-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.prompt-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.prompt-suggestions {
  margin-top: 8px;
}

.suggestions-header {
  margin-bottom: 8px;
}

.suggestions-title {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.suggestion-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-tag:hover {
  transform: scale(1.05);
}

.settings-section {
  background: var(--el-bg-color);
  border-radius: 6px;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.setting-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.seed-input {
  display: flex;
  gap: 8px;
}

.seed-input .el-input {
  flex: 1;
}

.advanced-settings {
  background: var(--el-bg-color);
  border-radius: 6px;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
}

.generate-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.generate-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
}

.generation-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.preview-section {
  flex: 1;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.empty-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--el-text-color-secondary);
  padding: 40px;
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

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
}

.image-item {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.image-item:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-item.selected {
  border-color: var(--el-color-primary);
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 200px;
}

.generated-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 6px;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.image-actions {
  display: flex;
  gap: 8px;
}

.selection-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: var(--el-color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-item.selected .selection-indicator {
  opacity: 1;
}

.image-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 8px;
  border-radius: 0 0 6px 6px;
}

.image-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: white;
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color-page);
}

.batch-info {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.batch-buttons {
  display: flex;
  gap: 8px;
}

.image-preview-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-image {
  width: 100%;
  height: auto;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 8px;
}

.preview-info h4 {
  margin: 0 0 12px 0;
  color: var(--el-text-color-primary);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.info-item {
  display: flex;
  gap: 8px;
}

.info-label {
  font-weight: 500;
  color: var(--el-text-color-secondary);
  min-width: 60px;
}

.info-value {
  color: var(--el-text-color-primary);
  word-break: break-all;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .generator-content {
    flex-direction: column;
  }

  .generator-left {
    width: 100%;
  }

  .settings-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .image-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 12px;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }

  .generator-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
