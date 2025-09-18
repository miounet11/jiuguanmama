<template>
  <div class="image-editor">
    <!-- 头部工具栏 -->
    <div class="editor-header">
      <div class="header-left">
        <h3 class="editor-title">
          <el-icon><Edit /></el-icon>
          AI图像编辑器
        </h3>
        <div class="editor-tabs">
          <el-button
            v-for="tab in editorTabs"
            :key="tab.key"
            :type="activeTab === tab.key ? 'primary' : ''"
            size="small"
            @click="switchTab(tab.key)"
          >
            {{ tab.label }}
          </el-button>
        </div>
      </div>
      <div class="header-actions">
        <el-button
          size="small"
          :icon="FolderOpened"
          @click="openImage"
          title="打开图像"
        >
          打开
        </el-button>
        <el-button
          size="small"
          :icon="Download"
          @click="saveImage"
          :disabled="!currentImage"
          title="保存图像"
        >
          保存
        </el-button>
        <el-button
          size="small"
          :icon="Refresh"
          @click="resetImage"
          :disabled="!hasChanges"
          title="重置"
        >
          重置
        </el-button>
      </div>
    </div>

    <div class="editor-content">
      <!-- 左侧工具面板 -->
      <div class="editor-sidebar">
        <!-- 基础编辑工具 -->
        <div v-if="activeTab === 'basic'" class="tool-panel">
          <h4 class="panel-title">基础调整</h4>

          <!-- 尺寸调整 -->
          <div class="tool-group">
            <label class="tool-label">尺寸调整</label>
            <div class="size-controls">
              <div class="size-inputs">
                <el-input-number
                  v-model="editSettings.width"
                  :min="1"
                  :max="4096"
                  size="small"
                  controls-position="right"
                  @change="onSizeChange"
                />
                <span class="size-separator">×</span>
                <el-input-number
                  v-model="editSettings.height"
                  :min="1"
                  :max="4096"
                  size="small"
                  controls-position="right"
                  @change="onSizeChange"
                />
              </div>
              <div class="size-options">
                <el-button
                  size="small"
                  :icon="Lock"
                  :type="maintainAspectRatio ? 'primary' : ''"
                  @click="maintainAspectRatio = !maintainAspectRatio"
                  title="保持宽高比"
                />
                <el-dropdown @command="applyPresetSize">
                  <el-button size="small">
                    预设 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="1024x1024">1024×1024</el-dropdown-item>
                      <el-dropdown-item command="1920x1080">1920×1080</el-dropdown-item>
                      <el-dropdown-item command="1080x1920">1080×1920</el-dropdown-item>
                      <el-dropdown-item command="512x512">512×512</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>

          <!-- 亮度对比度 -->
          <div class="tool-group">
            <label class="tool-label">亮度 ({{ editSettings.brightness }})</label>
            <el-slider
              v-model="editSettings.brightness"
              :min="-100"
              :max="100"
              @input="onFilterChange"
              show-tooltip
            />
          </div>

          <div class="tool-group">
            <label class="tool-label">对比度 ({{ editSettings.contrast }})</label>
            <el-slider
              v-model="editSettings.contrast"
              :min="-100"
              :max="100"
              @input="onFilterChange"
              show-tooltip
            />
          </div>

          <div class="tool-group">
            <label class="tool-label">饱和度 ({{ editSettings.saturation }})</label>
            <el-slider
              v-model="editSettings.saturation"
              :min="-100"
              :max="100"
              @input="onFilterChange"
              show-tooltip
            />
          </div>

          <div class="tool-group">
            <label class="tool-label">色调 ({{ editSettings.hue }})</label>
            <el-slider
              v-model="editSettings.hue"
              :min="-180"
              :max="180"
              @input="onFilterChange"
              show-tooltip
            />
          </div>

          <!-- 旋转翻转 -->
          <div class="tool-group">
            <label class="tool-label">旋转翻转</label>
            <div class="transform-controls">
              <el-button
                size="small"
                :icon="RefreshLeft"
                @click="rotateImage(-90)"
                title="逆时针旋转90°"
              />
              <el-button
                size="small"
                :icon="RefreshRight"
                @click="rotateImage(90)"
                title="顺时针旋转90°"
              />
              <el-button
                size="small"
                :icon="Switch"
                @click="flipImage('horizontal')"
                title="水平翻转"
              />
              <el-button
                size="small"
                :icon="SwitchButton"
                @click="flipImage('vertical')"
                title="垂直翻转"
              />
            </div>
          </div>

          <!-- 裁剪工具 -->
          <div class="tool-group">
            <label class="tool-label">裁剪</label>
            <div class="crop-controls">
              <el-button
                size="small"
                :type="cropMode ? 'primary' : ''"
                @click="toggleCropMode"
              >
                {{ cropMode ? '完成裁剪' : '开始裁剪' }}
              </el-button>
              <el-dropdown @command="applyCropRatio">
                <el-button size="small">
                  比例 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="free">自由</el-dropdown-item>
                    <el-dropdown-item command="1:1">1:1</el-dropdown-item>
                    <el-dropdown-item command="4:3">4:3</el-dropdown-item>
                    <el-dropdown-item command="16:9">16:9</el-dropdown-item>
                    <el-dropdown-item command="3:4">3:4</el-dropdown-item>
                    <el-dropdown-item command="9:16">9:16</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>

        <!-- AI增强工具 -->
        <div v-if="activeTab === 'enhance'" class="tool-panel">
          <h4 class="panel-title">AI增强</h4>

          <div class="tool-group">
            <label class="tool-label">智能增强</label>
            <div class="enhance-options">
              <el-button
                size="small"
                :loading="isProcessing.autoEnhance"
                @click="autoEnhance"
                :disabled="!currentImage"
              >
                自动增强
              </el-button>
              <el-button
                size="small"
                :loading="isProcessing.upscale"
                @click="upscaleImage"
                :disabled="!currentImage"
              >
                超分辨率
              </el-button>
            </div>
          </div>

          <div class="tool-group">
            <label class="tool-label">降噪处理</label>
            <div class="denoise-controls">
              <el-slider
                v-model="enhanceSettings.denoiseStrength"
                :min="0"
                :max="100"
                show-tooltip
              />
              <el-button
                size="small"
                :loading="isProcessing.denoise"
                @click="denoiseImage"
                :disabled="!currentImage"
              >
                应用降噪
              </el-button>
            </div>
          </div>

          <div class="tool-group">
            <label class="tool-label">锐化</label>
            <div class="sharpen-controls">
              <el-slider
                v-model="enhanceSettings.sharpenStrength"
                :min="0"
                :max="100"
                show-tooltip
              />
              <el-button
                size="small"
                :loading="isProcessing.sharpen"
                @click="sharpenImage"
                :disabled="!currentImage"
              >
                应用锐化
              </el-button>
            </div>
          </div>

          <div class="tool-group">
            <label class="tool-label">修复功能</label>
            <div class="repair-options">
              <el-button
                size="small"
                :loading="isProcessing.removeBackground"
                @click="removeBackground"
                :disabled="!currentImage"
              >
                去除背景
              </el-button>
              <el-button
                size="small"
                :loading="isProcessing.colorize"
                @click="colorizeImage"
                :disabled="!currentImage"
              >
                智能上色
              </el-button>
            </div>
          </div>
        </div>

        <!-- 滤镜效果 -->
        <div v-if="activeTab === 'filter'" class="tool-panel">
          <h4 class="panel-title">滤镜效果</h4>

          <div class="filter-gallery">
            <div
              v-for="filter in availableFilters"
              :key="filter.name"
              class="filter-item"
              :class="{ 'active': selectedFilter === filter.name }"
              @click="applyFilter(filter.name)"
            >
              <div class="filter-preview">
                <img
                  v-if="currentImage"
                  :src="getFilterPreview(filter.name)"
                  :alt="filter.label"
                  class="filter-preview-image"
                />
                <div v-else class="filter-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </div>
              <span class="filter-label">{{ filter.label }}</span>
            </div>
          </div>

          <!-- 滤镜强度控制 -->
          <div v-if="selectedFilter" class="tool-group">
            <label class="tool-label">滤镜强度 ({{ filterStrength }}%)</label>
            <el-slider
              v-model="filterStrength"
              :min="0"
              :max="100"
              @input="onFilterStrengthChange"
              show-tooltip
            />
          </div>
        </div>

        <!-- 风格转换 -->
        <div v-if="activeTab === 'style'" class="tool-panel">
          <h4 class="panel-title">AI风格转换</h4>

          <div class="style-gallery">
            <div
              v-for="style in availableStyles"
              :key="style.name"
              class="style-item"
              @click="applyStyleTransfer(style.name)"
            >
              <div class="style-preview">
                <img
                  :src="style.preview"
                  :alt="style.label"
                  class="style-preview-image"
                />
              </div>
              <span class="style-label">{{ style.label }}</span>
            </div>
          </div>

          <div class="tool-group">
            <label class="tool-label">转换强度</label>
            <el-slider
              v-model="styleSettings.strength"
              :min="0"
              :max="100"
              show-tooltip
            />
          </div>

          <div class="tool-group">
            <label class="tool-label">保持细节</label>
            <el-switch
              v-model="styleSettings.preserveDetails"
              active-text="开启"
              inactive-text="关闭"
            />
          </div>

          <div class="tool-group">
            <el-button
              type="primary"
              size="small"
              :loading="isProcessing.styleTransfer"
              @click="processStyleTransfer"
              :disabled="!currentImage || !selectedStyle"
              block
            >
              应用风格转换
            </el-button>
          </div>
        </div>
      </div>

      <!-- 中央画布区域 -->
      <div class="editor-canvas">
        <div v-if="!currentImage" class="canvas-empty">
          <div class="empty-content">
            <div class="empty-icon">
              <el-icon><Picture /></el-icon>
            </div>
            <p class="empty-text">请打开一张图像开始编辑</p>
            <el-button type="primary" @click="openImage">
              选择图像
            </el-button>
          </div>
        </div>

        <div v-else class="canvas-container">
          <!-- 画布工具栏 -->
          <div class="canvas-toolbar">
            <div class="toolbar-left">
              <span class="image-info">
                {{ originalImage?.name }} - {{ editSettings.width }}×{{ editSettings.height }}
              </span>
            </div>
            <div class="toolbar-right">
              <el-button-group>
                <el-button
                  size="small"
                  :icon="ZoomOut"
                  @click="zoomOut"
                  :disabled="zoomLevel <= 0.1"
                />
                <el-button size="small" @click="resetZoom">
                  {{ Math.round(zoomLevel * 100) }}%
                </el-button>
                <el-button
                  size="small"
                  :icon="ZoomIn"
                  @click="zoomIn"
                  :disabled="zoomLevel >= 5"
                />
              </el-button-group>
              <el-button
                size="small"
                :icon="FullScreen"
                @click="toggleFullscreen"
                title="全屏"
              />
            </div>
          </div>

          <!-- 画布 -->
          <div
            ref="canvasWrapper"
            class="canvas-wrapper"
            @wheel="handleWheel"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseLeave"
          >
            <canvas
              ref="mainCanvas"
              class="main-canvas"
              :style="{
                transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
                cursor: isDragging ? 'grabbing' : (cropMode ? 'crosshair' : 'grab')
              }"
            />

            <!-- 裁剪框 -->
            <div
              v-if="cropMode && cropBox"
              class="crop-box"
              :style="getCropBoxStyle()"
            >
              <div class="crop-handle crop-handle-nw" @mousedown.stop="startCropResize('nw')"></div>
              <div class="crop-handle crop-handle-ne" @mousedown.stop="startCropResize('ne')"></div>
              <div class="crop-handle crop-handle-sw" @mousedown.stop="startCropResize('sw')"></div>
              <div class="crop-handle crop-handle-se" @mousedown.stop="startCropResize('se')"></div>
              <div class="crop-handle crop-handle-n" @mousedown.stop="startCropResize('n')"></div>
              <div class="crop-handle crop-handle-s" @mousedown.stop="startCropResize('s')"></div>
              <div class="crop-handle crop-handle-w" @mousedown.stop="startCropResize('w')"></div>
              <div class="crop-handle crop-handle-e" @mousedown.stop="startCropResize('e')"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧历史面板 -->
      <div class="editor-history">
        <h4 class="panel-title">操作历史</h4>
        <div class="history-list">
          <div
            v-for="(item, index) in editHistory"
            :key="index"
            class="history-item"
            :class="{ 'active': index === currentHistoryIndex }"
            @click="restoreHistoryState(index)"
          >
            <div class="history-icon">
              <el-icon><component :is="getHistoryIcon(item.type)" /></el-icon>
            </div>
            <span class="history-text">{{ item.description }}</span>
          </div>
        </div>

        <div class="history-actions">
          <el-button
            size="small"
            :icon="Back"
            @click="undo"
            :disabled="currentHistoryIndex <= 0"
            title="撤销"
          />
          <el-button
            size="small"
            :icon="Right"
            @click="redo"
            :disabled="currentHistoryIndex >= editHistory.length - 1"
            title="重做"
          />
          <el-button
            size="small"
            :icon="Delete"
            @click="clearHistory"
            title="清除历史"
          />
        </div>
      </div>
    </div>

    <!-- 文件选择对话框 -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileSelect"
    />

    <!-- 处理进度对话框 -->
    <el-dialog
      v-model="showProcessingDialog"
      title="处理中"
      width="400px"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div class="processing-content">
        <el-progress
          :percentage="processingProgress.percentage"
          :indeterminate="processingProgress.percentage === 0"
          :status="processingProgress.status"
        />
        <p class="processing-text">{{ processingProgress.text }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Edit, FolderOpened, Download, Refresh, Lock, ArrowDown, RefreshLeft,
  RefreshRight, Switch, SwitchButton, Picture, ZoomOut, ZoomIn, FullScreen,
  Back, Right, Delete
} from '@element-plus/icons-vue'
import { http } from '@/utils/axios'

// 接口定义
interface ImageFile {
  id: string
  name: string
  url: string
  width: number
  height: number
  file?: File
}

interface EditSettings {
  width: number
  height: number
  brightness: number
  contrast: number
  saturation: number
  hue: number
  rotation: number
  flipHorizontal: boolean
  flipVertical: boolean
}

interface EnhanceSettings {
  denoiseStrength: number
  sharpenStrength: number
}

interface StyleSettings {
  strength: number
  preserveDetails: boolean
}

interface HistoryItem {
  type: string
  description: string
  imageData: string
  settings: EditSettings
}

interface CropBox {
  x: number
  y: number
  width: number
  height: number
}

// 响应式数据
const currentImage = ref<ImageFile | null>(null)
const originalImage = ref<ImageFile | null>(null)
const activeTab = ref('basic')
const hasChanges = ref(false)
const maintainAspectRatio = ref(true)
const originalAspectRatio = ref(1)

const editSettings = reactive<EditSettings>({
  width: 0,
  height: 0,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false
})

const enhanceSettings = reactive<EnhanceSettings>({
  denoiseStrength: 50,
  sharpenStrength: 50
})

const styleSettings = reactive<StyleSettings>({
  strength: 70,
  preserveDetails: true
})

const isProcessing = reactive({
  autoEnhance: false,
  upscale: false,
  denoise: false,
  sharpen: false,
  removeBackground: false,
  colorize: false,
  styleTransfer: false
})

const showProcessingDialog = ref(false)
const processingProgress = reactive({
  percentage: 0,
  status: 'active' as 'active' | 'success' | 'warning' | 'exception',
  text: '处理中...'
})

// 画布相关
const mainCanvas = ref<HTMLCanvasElement>()
const canvasWrapper = ref<HTMLElement>()
const ctx = ref<CanvasRenderingContext2D | null>(null)
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const isDragging = ref(false)
const lastMouseX = ref(0)
const lastMouseY = ref(0)

// 裁剪相关
const cropMode = ref(false)
const cropBox = ref<CropBox | null>(null)
const cropRatio = ref<string>('free')
const isResizingCrop = ref(false)
const resizeHandle = ref('')

// 滤镜相关
const selectedFilter = ref('')
const filterStrength = ref(100)
const selectedStyle = ref('')

// 历史记录
const editHistory = ref<HistoryItem[]>([])
const currentHistoryIndex = ref(-1)

const fileInput = ref<HTMLInputElement>()

// 编辑器标签页
const editorTabs = [
  { key: 'basic', label: '基础' },
  { key: 'enhance', label: 'AI增强' },
  { key: 'filter', label: '滤镜' },
  { key: 'style', label: '风格' }
]

// 可用滤镜
const availableFilters = [
  { name: 'none', label: '原图' },
  { name: 'vintage', label: '复古' },
  { name: 'bw', label: '黑白' },
  { name: 'sepia', label: '棕褐色' },
  { name: 'warm', label: '暖色调' },
  { name: 'cool', label: '冷色调' },
  { name: 'dramatic', label: '戏剧化' },
  { name: 'soft', label: '柔和' }
]

// 可用风格
const availableStyles = [
  { name: 'oil-painting', label: '油画', preview: '/style-previews/oil-painting.jpg' },
  { name: 'watercolor', label: '水彩', preview: '/style-previews/watercolor.jpg' },
  { name: 'anime', label: '动漫', preview: '/style-previews/anime.jpg' },
  { name: 'sketch', label: '素描', preview: '/style-previews/sketch.jpg' },
  { name: 'pop-art', label: '波普艺术', preview: '/style-previews/pop-art.jpg' },
  { name: 'impressionist', label: '印象派', preview: '/style-previews/impressionist.jpg' }
]

// 方法
const switchTab = (tab: string) => {
  activeTab.value = tab
}

const openImage = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const files = (event.target as HTMLInputElement).files
  if (files && files.length > 0) {
    loadImage(files[0])
  }
}

const loadImage = async (file: File) => {
  try {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const imageData: ImageFile = {
        id: Date.now().toString(),
        name: file.name,
        url: url,
        width: img.width,
        height: img.height,
        file: file
      }

      currentImage.value = imageData
      originalImage.value = { ...imageData }

      // 重置编辑设置
      Object.assign(editSettings, {
        width: img.width,
        height: img.height,
        brightness: 0,
        contrast: 0,
        saturation: 0,
        hue: 0,
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false
      })

      originalAspectRatio.value = img.width / img.height
      hasChanges.value = false

      // 清除历史记录
      editHistory.value = []
      currentHistoryIndex.value = -1

      // 初始化画布
      nextTick(() => {
        initCanvas()
        addHistoryItem('load', '加载图像')
      })

      ElMessage.success('图像加载成功')
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      ElMessage.error('图像加载失败')
    }

    img.src = url
  } catch (error) {
    console.error('加载图像失败:', error)
    ElMessage.error('加载图像失败')
  }
}

const initCanvas = () => {
  if (!mainCanvas.value || !currentImage.value) return

  const canvas = mainCanvas.value
  const context = canvas.getContext('2d')
  if (!context) return

  ctx.value = context
  canvas.width = currentImage.value.width
  canvas.height = currentImage.value.height

  const img = new Image()
  img.onload = () => {
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(img, 0, 0)
    applyCurrentFilters()
  }
  img.src = currentImage.value.url

  // 重置视图
  resetZoom()
}

const applyCurrentFilters = () => {
  if (!ctx.value || !mainCanvas.value) return

  const canvas = mainCanvas.value
  const context = ctx.value

  // 应用CSS滤镜
  const filters = []

  if (editSettings.brightness !== 0) {
    filters.push(`brightness(${100 + editSettings.brightness}%)`)
  }
  if (editSettings.contrast !== 0) {
    filters.push(`contrast(${100 + editSettings.contrast}%)`)
  }
  if (editSettings.saturation !== 0) {
    filters.push(`saturate(${100 + editSettings.saturation}%)`)
  }
  if (editSettings.hue !== 0) {
    filters.push(`hue-rotate(${editSettings.hue}deg)`)
  }

  canvas.style.filter = filters.join(' ')

  // 应用变换
  const transforms = []

  if (editSettings.rotation !== 0) {
    transforms.push(`rotate(${editSettings.rotation}deg)`)
  }
  if (editSettings.flipHorizontal) {
    transforms.push('scaleX(-1)')
  }
  if (editSettings.flipVertical) {
    transforms.push('scaleY(-1)')
  }

  if (transforms.length > 0) {
    canvas.style.transform = `scale(${zoomLevel.value}) translate(${panX.value}px, ${panY.value}px) ${transforms.join(' ')}`
  }
}

const onSizeChange = () => {
  if (maintainAspectRatio.value) {
    // 根据宽度调整高度，或根据高度调整宽度
    editSettings.height = Math.round(editSettings.width / originalAspectRatio.value)
  }
  hasChanges.value = true
}

const onFilterChange = () => {
  applyCurrentFilters()
  hasChanges.value = true
}

const applyPresetSize = (command: string) => {
  const [width, height] = command.split('x').map(Number)
  editSettings.width = width
  editSettings.height = height
  hasChanges.value = true
}

const rotateImage = (degrees: number) => {
  editSettings.rotation = (editSettings.rotation + degrees) % 360
  applyCurrentFilters()
  addHistoryItem('rotate', `旋转 ${degrees}°`)
  hasChanges.value = true
}

const flipImage = (direction: 'horizontal' | 'vertical') => {
  if (direction === 'horizontal') {
    editSettings.flipHorizontal = !editSettings.flipHorizontal
    addHistoryItem('flip', '水平翻转')
  } else {
    editSettings.flipVertical = !editSettings.flipVertical
    addHistoryItem('flip', '垂直翻转')
  }
  applyCurrentFilters()
  hasChanges.value = true
}

const toggleCropMode = () => {
  cropMode.value = !cropMode.value
  if (cropMode.value) {
    initCropBox()
  } else {
    applyCrop()
  }
}

const initCropBox = () => {
  if (!currentImage.value) return

  const width = Math.min(currentImage.value.width * 0.8, 300)
  const height = Math.min(currentImage.value.height * 0.8, 300)

  cropBox.value = {
    x: (currentImage.value.width - width) / 2,
    y: (currentImage.value.height - height) / 2,
    width: width,
    height: height
  }
}

const applyCropRatio = (ratio: string) => {
  cropRatio.value = ratio
  if (cropBox.value && ratio !== 'free') {
    const [w, h] = ratio.split(':').map(Number)
    const aspectRatio = w / h

    // 调整裁剪框
    const newHeight = cropBox.value.width / aspectRatio
    if (newHeight <= currentImage.value!.height - cropBox.value.y) {
      cropBox.value.height = newHeight
    } else {
      cropBox.value.width = cropBox.value.height * aspectRatio
    }
  }
}

const applyCrop = () => {
  if (!cropBox.value || !currentImage.value) return

  // 这里应该实际裁剪图像
  // 简化处理，只更新设置
  editSettings.width = cropBox.value.width
  editSettings.height = cropBox.value.height

  addHistoryItem('crop', '裁剪图像')
  hasChanges.value = true
}

const getCropBoxStyle = () => {
  if (!cropBox.value) return {}

  return {
    left: `${cropBox.value.x * zoomLevel.value}px`,
    top: `${cropBox.value.y * zoomLevel.value}px`,
    width: `${cropBox.value.width * zoomLevel.value}px`,
    height: `${cropBox.value.height * zoomLevel.value}px`
  }
}

// 鼠标事件处理
const handleMouseDown = (event: MouseEvent) => {
  if (cropMode.value) return

  isDragging.value = true
  lastMouseX.value = event.clientX
  lastMouseY.value = event.clientY
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value || cropMode.value) return

  const deltaX = event.clientX - lastMouseX.value
  const deltaY = event.clientY - lastMouseY.value

  panX.value += deltaX / zoomLevel.value
  panY.value += deltaY / zoomLevel.value

  lastMouseX.value = event.clientX
  lastMouseY.value = event.clientY
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleMouseLeave = () => {
  isDragging.value = false
}

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()

  const delta = event.deltaY > 0 ? -0.1 : 0.1
  const newZoom = Math.max(0.1, Math.min(5, zoomLevel.value + delta))

  zoomLevel.value = newZoom
}

const zoomIn = () => {
  zoomLevel.value = Math.min(5, zoomLevel.value + 0.2)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(0.1, zoomLevel.value - 0.2)
}

const resetZoom = () => {
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
}

const toggleFullscreen = () => {
  if (canvasWrapper.value) {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      canvasWrapper.value.requestFullscreen()
    }
  }
}

// AI增强功能
const autoEnhance = async () => {
  if (!currentImage.value) return

  isProcessing.autoEnhance = true
  showProcessingDialog.value = true
  processingProgress.percentage = 0
  processingProgress.text = '正在进行自动增强...'

  try {
    const formData = new FormData()
    if (currentImage.value.file) {
      formData.append('image', currentImage.value.file)
    }
    formData.append('operation', 'auto-enhance')

    // 模拟进度
    const progressInterval = setInterval(() => {
      processingProgress.percentage = Math.min(90, processingProgress.percentage + 10)
    }, 200)

    const response = await http.post('/multimodal/image/enhance', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    clearInterval(progressInterval)
    processingProgress.percentage = 100
    processingProgress.text = '增强完成'

    // 更新图像
    if (response.enhancedImageUrl) {
      currentImage.value.url = response.enhancedImageUrl
      initCanvas()
      addHistoryItem('enhance', '自动增强')
      hasChanges.value = true
    }

    setTimeout(() => {
      showProcessingDialog.value = false
    }, 1000)

    ElMessage.success('自动增强完成')
  } catch (error: any) {
    console.error('自动增强失败:', error)
    ElMessage.error('自动增强失败')
    showProcessingDialog.value = false
  } finally {
    isProcessing.autoEnhance = false
  }
}

const upscaleImage = async () => {
  if (!currentImage.value) return

  isProcessing.upscale = true
  await processImageOperation('upscale', '超分辨率处理')
  isProcessing.upscale = false
}

const denoiseImage = async () => {
  if (!currentImage.value) return

  isProcessing.denoise = true
  await processImageOperation('denoise', '降噪处理', { strength: enhanceSettings.denoiseStrength })
  isProcessing.denoise = false
}

const sharpenImage = async () => {
  if (!currentImage.value) return

  isProcessing.sharpen = true
  await processImageOperation('sharpen', '锐化处理', { strength: enhanceSettings.sharpenStrength })
  isProcessing.sharpen = false
}

const removeBackground = async () => {
  if (!currentImage.value) return

  isProcessing.removeBackground = true
  await processImageOperation('remove-background', '去除背景')
  isProcessing.removeBackground = false
}

const colorizeImage = async () => {
  if (!currentImage.value) return

  isProcessing.colorize = true
  await processImageOperation('colorize', '智能上色')
  isProcessing.colorize = false
}

const processImageOperation = async (operation: string, description: string, params?: any) => {
  showProcessingDialog.value = true
  processingProgress.percentage = 0
  processingProgress.text = `正在进行${description}...`

  try {
    const formData = new FormData()
    if (currentImage.value?.file) {
      formData.append('image', currentImage.value.file)
    }
    formData.append('operation', operation)
    if (params) {
      formData.append('params', JSON.stringify(params))
    }

    const progressInterval = setInterval(() => {
      processingProgress.percentage = Math.min(90, processingProgress.percentage + 15)
    }, 300)

    const response = await http.post('/multimodal/image/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    clearInterval(progressInterval)
    processingProgress.percentage = 100
    processingProgress.text = `${description}完成`

    if (response.processedImageUrl) {
      currentImage.value!.url = response.processedImageUrl
      initCanvas()
      addHistoryItem(operation, description)
      hasChanges.value = true
    }

    setTimeout(() => {
      showProcessingDialog.value = false
    }, 1000)

    ElMessage.success(`${description}完成`)
  } catch (error: any) {
    console.error(`${description}失败:`, error)
    ElMessage.error(`${description}失败`)
    showProcessingDialog.value = false
  }
}

// 滤镜功能
const applyFilter = (filterName: string) => {
  selectedFilter.value = filterName
  onFilterStrengthChange()
  addHistoryItem('filter', `应用滤镜: ${filterName}`)
  hasChanges.value = true
}

const onFilterStrengthChange = () => {
  // 应用滤镜效果
  applyCurrentFilters()
  hasChanges.value = true
}

const getFilterPreview = (filterName: string) => {
  // 返回滤镜预览图像
  return currentImage.value?.url || ''
}

// 风格转换
const applyStyleTransfer = (styleName: string) => {
  selectedStyle.value = styleName
}

const processStyleTransfer = async () => {
  if (!currentImage.value || !selectedStyle.value) return

  isProcessing.styleTransfer = true
  await processImageOperation('style-transfer', '风格转换', {
    style: selectedStyle.value,
    strength: styleSettings.strength,
    preserveDetails: styleSettings.preserveDetails
  })
  isProcessing.styleTransfer = false
}

// 历史记录功能
const addHistoryItem = (type: string, description: string) => {
  if (!mainCanvas.value) return

  const imageData = mainCanvas.value.toDataURL()
  const historyItem: HistoryItem = {
    type,
    description,
    imageData,
    settings: { ...editSettings }
  }

  // 移除当前位置之后的历史记录
  editHistory.value = editHistory.value.slice(0, currentHistoryIndex.value + 1)
  editHistory.value.push(historyItem)
  currentHistoryIndex.value = editHistory.value.length - 1

  // 限制历史记录数量
  if (editHistory.value.length > 20) {
    editHistory.value.shift()
    currentHistoryIndex.value--
  }
}

const restoreHistoryState = (index: number) => {
  if (index < 0 || index >= editHistory.value.length) return

  currentHistoryIndex.value = index
  const historyItem = editHistory.value[index]

  // 恢复设置
  Object.assign(editSettings, historyItem.settings)

  // 恢复图像
  if (mainCanvas.value && ctx.value) {
    const img = new Image()
    img.onload = () => {
      ctx.value!.clearRect(0, 0, mainCanvas.value!.width, mainCanvas.value!.height)
      ctx.value!.drawImage(img, 0, 0)
      applyCurrentFilters()
    }
    img.src = historyItem.imageData
  }

  hasChanges.value = index > 0
}

const undo = () => {
  if (currentHistoryIndex.value > 0) {
    restoreHistoryState(currentHistoryIndex.value - 1)
  }
}

const redo = () => {
  if (currentHistoryIndex.value < editHistory.value.length - 1) {
    restoreHistoryState(currentHistoryIndex.value + 1)
  }
}

const clearHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有操作历史吗？',
      '清除历史',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    editHistory.value = []
    currentHistoryIndex.value = -1
    ElMessage.success('历史记录已清除')
  } catch {
    // 用户取消
  }
}

const getHistoryIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    load: 'Picture',
    rotate: 'RefreshRight',
    flip: 'Switch',
    crop: 'Crop',
    filter: 'Filter',
    enhance: 'MagicStick',
    'style-transfer': 'Brush'
  }
  return iconMap[type] || 'Edit'
}

// 保存和重置
const saveImage = async () => {
  if (!mainCanvas.value || !currentImage.value) return

  try {
    // 创建最终图像
    const canvas = mainCanvas.value
    const link = document.createElement('a')
    link.download = `edited_${originalImage.value?.name || 'image.png'}`
    link.href = canvas.toDataURL()
    link.click()

    ElMessage.success('图像保存成功')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

const resetImage = async () => {
  if (!hasChanges.value) return

  try {
    await ElMessageBox.confirm(
      '确定要重置所有修改吗？此操作不可撤销。',
      '重置图像',
      {
        confirmButtonText: '重置',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    if (originalImage.value) {
      currentImage.value = { ...originalImage.value }
      Object.assign(editSettings, {
        width: originalImage.value.width,
        height: originalImage.value.height,
        brightness: 0,
        contrast: 0,
        saturation: 0,
        hue: 0,
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false
      })

      hasChanges.value = false
      editHistory.value = []
      currentHistoryIndex.value = -1

      initCanvas()
      addHistoryItem('reset', '重置图像')

      ElMessage.success('图像已重置')
    }
  } catch {
    // 用户取消
  }
}

// 键盘快捷键
const handleKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'z':
        event.preventDefault()
        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }
        break
      case 's':
        event.preventDefault()
        saveImage()
        break
      case 'o':
        event.preventDefault()
        openImage()
        break
    }
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

// 监听尺寸变化，保持宽高比
watch(() => editSettings.width, (newWidth) => {
  if (maintainAspectRatio.value && originalAspectRatio.value > 0) {
    editSettings.height = Math.round(newWidth / originalAspectRatio.value)
  }
})
</script>

<style scoped>
.image-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--el-bg-color-page);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.editor-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.editor-tabs {
  display: flex;
  gap: 4px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.editor-content {
  display: flex;
  flex: 1;
  min-height: 0;
}

.editor-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  overflow-y: auto;
}

.tool-panel {
  padding: 16px;
}

.panel-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.tool-group {
  margin-bottom: 20px;
}

.tool-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.size-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.size-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.size-separator {
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.size-options {
  display: flex;
  gap: 4px;
}

.transform-controls,
.crop-controls,
.enhance-options,
.repair-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.denoise-controls,
.sharpen-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-gallery,
.style-gallery {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.filter-item,
.style-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-item:hover,
.style-item:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.filter-item.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-8);
}

.filter-preview,
.style-preview {
  width: 60px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--el-bg-color-page);
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-preview-image,
.style-preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.filter-placeholder {
  color: var(--el-text-color-placeholder);
  font-size: 20px;
}

.filter-label,
.style-label {
  font-size: 11px;
  text-align: center;
  color: var(--el-text-color-regular);
}

.editor-canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f0f0f0;
  min-width: 0;
}

.canvas-empty {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.empty-content {
  text-align: center;
  color: var(--el-text-color-secondary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 16px;
}

.canvas-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.canvas-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.image-info {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background:
    radial-gradient(circle, #666 1px, transparent 1px),
    linear-gradient(#f0f0f0 0%, #f0f0f0 100%);
  background-size: 20px 20px;
}

.main-canvas {
  max-width: 100%;
  max-height: 100%;
  border: 1px solid var(--el-border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.1s ease;
}

.crop-box {
  position: absolute;
  border: 2px solid var(--el-color-primary);
  background: rgba(64, 158, 255, 0.1);
  cursor: move;
}

.crop-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--el-color-primary);
  border: 1px solid white;
  border-radius: 50%;
}

.crop-handle-nw { top: -4px; left: -4px; cursor: nw-resize; }
.crop-handle-ne { top: -4px; right: -4px; cursor: ne-resize; }
.crop-handle-sw { bottom: -4px; left: -4px; cursor: sw-resize; }
.crop-handle-se { bottom: -4px; right: -4px; cursor: se-resize; }
.crop-handle-n { top: -4px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
.crop-handle-s { bottom: -4px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
.crop-handle-w { top: 50%; left: -4px; transform: translateY(-50%); cursor: w-resize; }
.crop-handle-e { top: 50%; right: -4px; transform: translateY(-50%); cursor: e-resize; }

.editor-history {
  width: 240px;
  flex-shrink: 0;
  background: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
}

.history-list {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
}

.history-item:hover {
  background: var(--el-bg-color-page);
}

.history-item.active {
  background: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
}

.history-icon {
  font-size: 14px;
  opacity: 0.7;
}

.history-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-actions {
  padding: 8px;
  border-top: 1px solid var(--el-border-color-light);
  display: flex;
  gap: 4px;
}

.processing-content {
  text-align: center;
  padding: 20px;
}

.processing-text {
  margin-top: 12px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .editor-sidebar {
    width: 240px;
  }

  .editor-history {
    width: 200px;
  }
}

@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-left {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .editor-sidebar,
  .editor-history {
    display: none;
  }

  .filter-gallery,
  .style-gallery {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
