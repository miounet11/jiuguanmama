<template>
  <el-dialog
    v-model="visible"
    title="我的图像画廊"
    width="90%"
    :close-on-click-modal="false"
    class="gallery-dialog"
  >
    <!-- 画廊头部 -->
    <div class="gallery-header">
      <div class="header-left">
        <div class="gallery-stats">
          <el-statistic title="总图像数" :value="totalImages" />
          <el-statistic title="已选择" :value="selectedImages.length" />
          <el-statistic title="存储使用" :value="storageUsed" suffix="MB" />
        </div>
      </div>

      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索图像..."
          size="small"
          :prefix-icon="Search"
          clearable
          @input="handleSearch"
          style="width: 240px"
        />

        <el-dropdown @command="handleSort">
          <el-button size="small">
            排序 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="newest">最新</el-dropdown-item>
              <el-dropdown-item command="oldest">最早</el-dropdown-item>
              <el-dropdown-item command="name">名称</el-dropdown-item>
              <el-dropdown-item command="size">大小</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-dropdown @command="handleViewMode">
          <el-button size="small">
            视图 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="grid">网格</el-dropdown-item>
              <el-dropdown-item command="list">列表</el-dropdown-item>
              <el-dropdown-item command="masonry">瀑布流</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 过滤标签 -->
    <div class="gallery-filters">
      <div class="filter-section">
        <span class="filter-label">分类:</span>
        <el-tag
          v-for="category in categories"
          :key="category.value"
          :type="selectedCategory === category.value ? 'primary' : ''"
          @click="selectCategory(category.value)"
          class="filter-tag"
        >
          {{ category.label }} ({{ category.count }})
        </el-tag>
      </div>

      <div class="filter-section">
        <span class="filter-label">标签:</span>
        <el-tag
          v-for="tag in popularTags"
          :key="tag.name"
          :type="selectedTags.includes(tag.name) ? 'primary' : 'info'"
          @click="toggleTag(tag.name)"
          class="filter-tag"
          size="small"
        >
          {{ tag.name }} ({{ tag.count }})
        </el-tag>
        <el-button
          size="small"
          text
          @click="showAllTags = !showAllTags"
        >
          {{ showAllTags ? '收起' : '更多标签' }}
        </el-button>
      </div>

      <div v-if="showAllTags" class="filter-section">
        <div class="all-tags">
          <el-tag
            v-for="tag in allTags.filter(t => !popularTags.some(p => p.name === t.name))"
            :key="tag.name"
            :type="selectedTags.includes(tag.name) ? 'primary' : 'info'"
            @click="toggleTag(tag.name)"
            class="filter-tag"
            size="small"
          >
            {{ tag.name }} ({{ tag.count }})
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 批量操作工具栏 -->
    <div v-if="selectedImages.length > 0" class="batch-toolbar">
      <div class="batch-info">
        已选择 {{ selectedImages.length }} 张图像
      </div>
      <div class="batch-actions">
        <el-button
          size="small"
          :icon="Download"
          @click="batchDownload"
        >
          批量下载
        </el-button>
        <el-button
          size="small"
          :icon="Collection"
          @click="addToCollection"
        >
          添加到收藏
        </el-button>
        <el-button
          size="small"
          :icon="Share"
          @click="batchShare"
        >
          分享
        </el-button>
        <el-button
          size="small"
          :icon="PriceTag"
          @click="batchAddTags"
        >
          添加标签
        </el-button>
        <el-button
          size="small"
          type="danger"
          :icon="Delete"
          @click="batchDelete"
        >
          删除
        </el-button>
      </div>
    </div>

    <!-- 图像网格/列表 -->
    <div class="gallery-content">
      <!-- 网格视图 -->
      <div
        v-if="viewMode === 'grid'"
        v-loading="loading"
        class="image-grid"
        v-infinite-scroll="loadMore"
        :infinite-scroll-disabled="!hasMore"
        :infinite-scroll-distance="200"
      >
        <div
          v-for="image in filteredImages"
          :key="image.id"
          class="image-card"
          :class="{ 'selected': selectedImages.includes(image.id) }"
          @click="selectImage(image)"
          @dblclick="previewImage(image)"
        >
          <!-- 图像缩略图 -->
          <div class="image-thumbnail">
            <img
              :src="image.thumbnail || image.url"
              :alt="image.name"
              class="thumbnail-image"
              @load="onImageLoad(image)"
              @error="onImageError(image)"
            />

            <!-- 选择标记 -->
            <div class="selection-overlay">
              <el-checkbox
                :model-value="selectedImages.includes(image.id)"
                @change="toggleImageSelection(image.id)"
                @click.stop
              />
            </div>

            <!-- 操作按钮 -->
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
              <el-dropdown @command="(cmd) => handleImageAction(cmd, image)" trigger="click">
                <el-button
                  size="small"
                  circle
                  :icon="More"
                  @click.stop
                  title="更多"
                />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="info">详细信息</el-dropdown-item>
                    <el-dropdown-item command="duplicate">复制</el-dropdown-item>
                    <el-dropdown-item command="rename">重命名</el-dropdown-item>
                    <el-dropdown-item divided command="delete">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <!-- 图像类型标记 -->
            <div class="image-type-badge">
              <el-tag
                v-if="image.type === 'generated'"
                type="success"
                size="small"
              >
                AI生成
              </el-tag>
              <el-tag
                v-else-if="image.type === 'edited'"
                type="warning"
                size="small"
              >
                已编辑
              </el-tag>
              <el-tag
                v-else-if="image.type === 'uploaded'"
                type="info"
                size="small"
              >
                上传
              </el-tag>
            </div>
          </div>

          <!-- 图像信息 -->
          <div class="image-info">
            <h4 class="image-title">{{ image.name }}</h4>
            <div class="image-meta">
              <span class="image-size">{{ image.width }}×{{ image.height }}</span>
              <span class="image-date">{{ formatDate(image.createdAt) }}</span>
            </div>
            <div v-if="image.tags && image.tags.length > 0" class="image-tags">
              <el-tag
                v-for="tag in image.tags.slice(0, 3)"
                :key="tag"
                size="small"
                type="info"
              >
                {{ tag }}
              </el-tag>
              <span v-if="image.tags.length > 3" class="more-tags">
                +{{ image.tags.length - 3 }}
              </span>
            </div>
          </div>
        </div>

        <!-- 加载更多提示 -->
        <div v-if="loading" class="loading-more">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载更多...</span>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredImages.length === 0 && !loading" class="empty-gallery">
          <div class="empty-icon">
            <el-icon><Picture /></el-icon>
          </div>
          <p class="empty-text">暂无图像</p>
          <p class="empty-hint">开始生成或上传一些图像吧</p>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else-if="viewMode === 'list'" class="image-list">
        <el-table
          :data="filteredImages"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          stripe
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="缩略图" width="80">
            <template #default="{ row }">
              <img
                :src="row.thumbnail || row.url"
                :alt="row.name"
                class="list-thumbnail"
                @click="previewImage(row)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="name" label="名称" min-width="200" />
          <el-table-column label="尺寸" width="120">
            <template #default="{ row }">
              {{ row.width }}×{{ row.height }}
            </template>
          </el-table-column>
          <el-table-column prop="size" label="大小" width="100">
            <template #default="{ row }">
              {{ formatFileSize(row.size) }}
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTypeColor(row.type)" size="small">
                {{ getTypeLabel(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="150">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-button
                  size="small"
                  :icon="ZoomIn"
                  @click="previewImage(row)"
                  title="预览"
                />
                <el-button
                  size="small"
                  :icon="Download"
                  @click="downloadImage(row)"
                  title="下载"
                />
                <el-button
                  size="small"
                  :icon="Edit"
                  @click="editImage(row)"
                  title="编辑"
                />
                <el-button
                  size="small"
                  :icon="Delete"
                  @click="deleteImage(row)"
                  title="删除"
                />
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 瀑布流视图 -->
      <div v-else-if="viewMode === 'masonry'" class="masonry-grid">
        <div
          v-for="image in filteredImages"
          :key="image.id"
          class="masonry-item"
          :style="{ height: getMasonryHeight(image) + 'px' }"
        >
          <img
            :src="image.thumbnail || image.url"
            :alt="image.name"
            class="masonry-image"
            @click="previewImage(image)"
          />
          <div class="masonry-overlay">
            <h4 class="masonry-title">{{ image.name }}</h4>
            <div class="masonry-actions">
              <el-button
                size="small"
                circle
                :icon="ZoomIn"
                @click.stop="previewImage(image)"
              />
              <el-button
                size="small"
                circle
                :icon="Download"
                @click.stop="downloadImage(image)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="viewMode !== 'grid'" class="gallery-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalImages"
        layout="total, prev, pager, next, jumper"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 图像预览对话框 -->
    <el-dialog
      v-model="showPreview"
      title="图像预览"
      width="80%"
      :close-on-click-modal="true"
      class="preview-dialog"
    >
      <div v-if="previewingImage" class="preview-content">
        <div class="preview-left">
          <img
            :src="previewingImage.url"
            :alt="previewingImage.name"
            class="preview-image"
          />
        </div>
        <div class="preview-right">
          <div class="preview-info">
            <h3>{{ previewingImage.name }}</h3>

            <div class="info-section">
              <h4>基本信息</h4>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">尺寸:</span>
                  <span class="info-value">{{ previewingImage.width }}×{{ previewingImage.height }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">大小:</span>
                  <span class="info-value">{{ formatFileSize(previewingImage.size) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">格式:</span>
                  <span class="info-value">{{ previewingImage.format }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">创建时间:</span>
                  <span class="info-value">{{ formatDate(previewingImage.createdAt) }}</span>
                </div>
              </div>
            </div>

            <div v-if="previewingImage.prompt" class="info-section">
              <h4>生成信息</h4>
              <div class="prompt-info">
                <p><strong>提示词:</strong> {{ previewingImage.prompt }}</p>
                <p v-if="previewingImage.negativePrompt">
                  <strong>负向提示词:</strong> {{ previewingImage.negativePrompt }}
                </p>
                <p v-if="previewingImage.model">
                  <strong>模型:</strong> {{ previewingImage.model }}
                </p>
                <p v-if="previewingImage.seed">
                  <strong>种子:</strong> {{ previewingImage.seed }}
                </p>
              </div>
            </div>

            <div class="info-section">
              <h4>标签</h4>
              <div class="tags-container">
                <el-tag
                  v-for="tag in previewingImage.tags || []"
                  :key="tag"
                  type="info"
                  class="tag-item"
                >
                  {{ tag }}
                </el-tag>
                <el-button
                  size="small"
                  text
                  type="primary"
                  @click="showTagEditor = true"
                >
                  编辑标签
                </el-button>
              </div>
            </div>

            <div class="preview-actions">
              <el-button type="primary" @click="selectAndClose(previewingImage)">
                选择此图像
              </el-button>
              <el-button @click="downloadImage(previewingImage)">
                下载
              </el-button>
              <el-button @click="editImage(previewingImage)">
                编辑
              </el-button>
              <el-button @click="shareImage(previewingImage)">
                分享
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 标签编辑对话框 -->
    <el-dialog
      v-model="showTagEditor"
      title="编辑标签"
      width="500px"
    >
      <div class="tag-editor">
        <el-input
          v-model="newTag"
          placeholder="输入新标签..."
          @keyup.enter="addTag"
        >
          <template #append>
            <el-button @click="addTag">添加</el-button>
          </template>
        </el-input>

        <div class="current-tags">
          <el-tag
            v-for="tag in editingTags"
            :key="tag"
            closable
            @close="removeTag(tag)"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
        </div>

        <div class="suggested-tags">
          <h4>建议标签</h4>
          <el-tag
            v-for="tag in suggestedTags"
            :key="tag"
            type="info"
            @click="addSuggestedTag(tag)"
            class="suggested-tag"
          >
            + {{ tag }}
          </el-tag>
        </div>
      </div>

      <template #footer>
        <el-button @click="showTagEditor = false">取消</el-button>
        <el-button type="primary" @click="saveTags">保存</el-button>
      </template>
    </el-dialog>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
        <el-button
          v-if="selectedImages.length === 1"
          type="primary"
          @click="selectAndClose(getSelectedImage())"
        >
          选择图像
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, defineEmits, defineProps } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, ArrowDown, ZoomIn, Download, Share, More, Collection,
  PriceTag, Delete, Loading, Picture, Edit
} from '@element-plus/icons-vue'
import { http } from '@/utils/axios'

// Props & Emits
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'image-selected': [image: any]
}>()

// 接口定义
interface GalleryImage {
  id: string
  name: string
  url: string
  thumbnail?: string
  width: number
  height: number
  size: number
  format: string
  type: 'generated' | 'edited' | 'uploaded'
  createdAt: Date
  updatedAt: Date
  tags?: string[]
  prompt?: string
  negativePrompt?: string
  model?: string
  seed?: number
  isFavorite?: boolean
}

interface Category {
  value: string
  label: string
  count: number
}

interface Tag {
  name: string
  count: number
}

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const images = ref<GalleryImage[]>([])
const selectedImages = ref<string[]>([])
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedTags = ref<string[]>([])
const viewMode = ref<'grid' | 'list' | 'masonry'>('grid')
const sortBy = ref('newest')
const currentPage = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const hasMore = ref(true)

// 预览相关
const showPreview = ref(false)
const previewingImage = ref<GalleryImage | null>(null)

// 标签编辑
const showTagEditor = ref(false)
const editingTags = ref<string[]>([])
const newTag = ref('')

const showAllTags = ref(false)

// 统计数据
const totalImages = ref(0)
const storageUsed = ref(0)

// 分类数据
const categories: Category[] = [
  { value: 'all', label: '全部', count: 0 },
  { value: 'generated', label: 'AI生成', count: 0 },
  { value: 'edited', label: '已编辑', count: 0 },
  { value: 'uploaded', label: '上传', count: 0 },
  { value: 'favorites', label: '收藏', count: 0 }
]

// 标签数据
const allTags = ref<Tag[]>([])
const popularTags = computed(() =>
  allTags.value
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
)

const suggestedTags = [
  '人像', '风景', '抽象', '写实', '卡通', '黑白', '彩色',
  '室内', '室外', '动物', '植物', '建筑', '艺术'
]

// 计算属性
const filteredImages = computed(() => {
  let result = images.value

  // 分类过滤
  if (selectedCategory.value !== 'all') {
    if (selectedCategory.value === 'favorites') {
      result = result.filter(img => img.isFavorite)
    } else {
      result = result.filter(img => img.type === selectedCategory.value)
    }
  }

  // 标签过滤
  if (selectedTags.value.length > 0) {
    result = result.filter(img =>
      selectedTags.value.some(tag => img.tags?.includes(tag))
    )
  }

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(img =>
      img.name.toLowerCase().includes(query) ||
      img.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // 排序
  switch (sortBy.value) {
    case 'newest':
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
    case 'oldest':
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      break
    case 'name':
      result.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'size':
      result.sort((a, b) => b.size - a.size)
      break
  }

  return result
})

// 方法
const loadImages = async (page = 1, append = false) => {
  loading.value = true

  try {
    const response = await http.get('/multimodal/image/gallery', {
      params: {
        page,
        limit: pageSize.value,
        category: selectedCategory.value,
        tags: selectedTags.value,
        search: searchQuery.value,
        sort: sortBy.value
      }
    })

    const newImages = response.images || []

    if (append) {
      images.value.push(...newImages)
    } else {
      images.value = newImages
    }

    totalImages.value = response.total || 0
    storageUsed.value = response.storageUsed || 0
    hasMore.value = images.value.length < totalImages.value

    // 更新分类统计
    if (response.categories) {
      response.categories.forEach((cat: any) => {
        const category = categories.find(c => c.value === cat.type)
        if (category) {
          category.count = cat.count
        }
      })
    }

    // 更新标签数据
    if (response.tags) {
      allTags.value = response.tags
    }
  } catch (error) {
    console.error('加载图像失败:', error)
    ElMessage.error('加载图像失败')
  } finally {
    loading.value = false
  }
}

const loadMore = () => {
  if (!loading.value && hasMore.value) {
    const nextPage = Math.ceil(images.value.length / pageSize.value) + 1
    loadImages(nextPage, true)
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadImages()
}

const handleSort = (command: string) => {
  sortBy.value = command
  currentPage.value = 1
  loadImages()
}

const handleViewMode = (command: string) => {
  viewMode.value = command as any
}

const selectCategory = (category: string) => {
  selectedCategory.value = category
  currentPage.value = 1
  loadImages()
}

const toggleTag = (tagName: string) => {
  const index = selectedTags.value.indexOf(tagName)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagName)
  }
  currentPage.value = 1
  loadImages()
}

const selectImage = (image: GalleryImage) => {
  const index = selectedImages.value.indexOf(image.id)
  if (index > -1) {
    selectedImages.value.splice(index, 1)
  } else {
    selectedImages.value.push(image.id)
  }
}

const toggleImageSelection = (imageId: string) => {
  const index = selectedImages.value.indexOf(imageId)
  if (index > -1) {
    selectedImages.value.splice(index, 1)
  } else {
    selectedImages.value.push(imageId)
  }
}

const handleSelectionChange = (selection: GalleryImage[]) => {
  selectedImages.value = selection.map(img => img.id)
}

const previewImage = (image: GalleryImage) => {
  previewingImage.value = image
  showPreview.value = true
}

const selectAndClose = (image: GalleryImage) => {
  emit('image-selected', image)
  visible.value = false
}

const getSelectedImage = () => {
  return images.value.find(img => selectedImages.value.includes(img.id))
}

const downloadImage = async (image: GalleryImage) => {
  try {
    const response = await fetch(image.url)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = image.name
    a.click()

    URL.revokeObjectURL(url)
    ElMessage.success('下载开始')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败')
  }
}

const shareImage = async (image: GalleryImage) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: image.name,
        url: image.url
      })
    } catch (error) {
      console.error('分享失败:', error)
    }
  } else {
    try {
      await navigator.clipboard.writeText(image.url)
      ElMessage.success('图像链接已复制到剪贴板')
    } catch (error) {
      ElMessage.error('分享失败')
    }
  }
}

const editImage = (image: GalleryImage) => {
  // 打开图像编辑器
  ElMessage.info('图像编辑功能开发中')
}

const deleteImage = async (image: GalleryImage) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除图像 "${image.name}" 吗？此操作不可撤销。`,
      '删除图像',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await http.delete(`/multimodal/image/${image.id}`)

    // 从列表中移除
    const index = images.value.findIndex(img => img.id === image.id)
    if (index > -1) {
      images.value.splice(index, 1)
    }

    // 从选择列表中移除
    const selectedIndex = selectedImages.value.indexOf(image.id)
    if (selectedIndex > -1) {
      selectedImages.value.splice(selectedIndex, 1)
    }

    totalImages.value--
    ElMessage.success('图像已删除')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleImageAction = (command: string, image: GalleryImage) => {
  switch (command) {
    case 'edit':
      editImage(image)
      break
    case 'info':
      previewImage(image)
      break
    case 'duplicate':
      duplicateImage(image)
      break
    case 'rename':
      renameImage(image)
      break
    case 'delete':
      deleteImage(image)
      break
  }
}

const duplicateImage = async (image: GalleryImage) => {
  try {
    await http.post(`/multimodal/image/${image.id}/duplicate`)
    ElMessage.success('图像已复制')
    loadImages()
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

const renameImage = async (image: GalleryImage) => {
  try {
    const { value: newName } = await ElMessageBox.prompt(
      '请输入新的文件名:',
      '重命名图像',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: image.name,
        inputPattern: /.+/,
        inputErrorMessage: '文件名不能为空'
      }
    )

    await http.patch(`/multimodal/image/${image.id}`, {
      name: newName
    })

    // 更新本地数据
    image.name = newName
    ElMessage.success('重命名成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('重命名失败:', error)
      ElMessage.error('重命名失败')
    }
  }
}

// 批量操作
const batchDownload = async () => {
  const selectedImageObjects = images.value.filter(img =>
    selectedImages.value.includes(img.id)
  )

  for (const image of selectedImageObjects) {
    await downloadImage(image)
  }
}

const addToCollection = () => {
  ElMessage.info('收藏功能开发中')
}

const batchShare = () => {
  ElMessage.info('批量分享功能开发中')
}

const batchAddTags = () => {
  ElMessage.info('批量添加标签功能开发中')
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedImages.value.length} 张图像吗？此操作不可撤销。`,
      '批量删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 批量删除请求
    await http.post('/multimodal/image/batch-delete', {
      imageIds: selectedImages.value
    })

    // 从列表中移除
    images.value = images.value.filter(img =>
      !selectedImages.value.includes(img.id)
    )

    totalImages.value -= selectedImages.value.length
    selectedImages.value = []

    ElMessage.success('批量删除成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 标签编辑
const addTag = () => {
  if (newTag.value.trim() && !editingTags.value.includes(newTag.value.trim())) {
    editingTags.value.push(newTag.value.trim())
    newTag.value = ''
  }
}

const removeTag = (tag: string) => {
  const index = editingTags.value.indexOf(tag)
  if (index > -1) {
    editingTags.value.splice(index, 1)
  }
}

const addSuggestedTag = (tag: string) => {
  if (!editingTags.value.includes(tag)) {
    editingTags.value.push(tag)
  }
}

const saveTags = async () => {
  if (previewingImage.value) {
    try {
      await http.patch(`/multimodal/image/${previewingImage.value.id}`, {
        tags: editingTags.value
      })

      previewingImage.value.tags = [...editingTags.value]
      showTagEditor.value = false
      ElMessage.success('标签保存成功')
    } catch (error) {
      console.error('保存标签失败:', error)
      ElMessage.error('保存标签失败')
    }
  }
}

// 工具函数
const formatDate = (date: Date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getTypeColor = (type: string) => {
  const colors = {
    generated: 'success',
    edited: 'warning',
    uploaded: 'info'
  }
  return colors[type as keyof typeof colors] || 'info'
}

const getTypeLabel = (type: string) => {
  const labels = {
    generated: 'AI生成',
    edited: '已编辑',
    uploaded: '上传'
  }
  return labels[type as keyof typeof labels] || type
}

const getMasonryHeight = (image: GalleryImage) => {
  const baseWidth = 240
  const aspectRatio = image.height / image.width
  return Math.floor(baseWidth * aspectRatio)
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadImages(page)
}

const onImageLoad = (image: GalleryImage) => {
  console.log('图像加载完成:', image.id)
}

const onImageError = (image: GalleryImage) => {
  console.error('图像加载失败:', image.id)
}

// 监听器
watch(visible, (newValue) => {
  if (newValue) {
    loadImages()
  }
})

watch(showPreview, (newValue) => {
  if (newValue && previewingImage.value) {
    editingTags.value = [...(previewingImage.value.tags || [])]
  }
})

// 生命周期
onMounted(() => {
  if (visible.value) {
    loadImages()
  }
})
</script>

<style scoped>
.gallery-dialog {
  --el-dialog-margin-top: 5vh;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.gallery-stats {
  display: flex;
  gap: 24px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gallery-filters {
  margin-bottom: 16px;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  min-width: 40px;
}

.filter-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tag:hover {
  transform: scale(1.05);
}

.all-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.batch-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-5);
  border-radius: 6px;
  margin-bottom: 16px;
}

.batch-info {
  font-size: 14px;
  color: var(--el-color-primary);
  font-weight: 500;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.gallery-content {
  min-height: 400px;
  max-height: 60vh;
  overflow-y: auto;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 8px;
}

.image-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.image-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-card.selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-7);
}

.image-thumbnail {
  position: relative;
  width: 100%;
  height: 150px;
  overflow: hidden;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.selection-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-card:hover .selection-overlay,
.image-card.selected .selection-overlay {
  opacity: 1;
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

.image-card:hover .image-actions {
  opacity: 1;
}

.image-type-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
}

.image-info {
  padding: 12px;
}

.image-title {
  margin: 0 0 6px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}

.image-tags {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
}

.more-tags {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.loading-more {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 20px;
  grid-column: 1 / -1;
  color: var(--el-text-color-secondary);
}

.empty-gallery {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  grid-column: 1 / -1;
  padding: 40px;
  color: var(--el-text-color-secondary);
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

.image-list {
  background: var(--el-bg-color);
  border-radius: 6px;
}

.list-thumbnail {
  width: 60px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}

.masonry-grid {
  columns: 4;
  column-gap: 16px;
}

.masonry-item {
  position: relative;
  break-inside: avoid;
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.masonry-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.masonry-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.masonry-item:hover .masonry-overlay {
  opacity: 1;
}

.masonry-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
}

.masonry-actions {
  display: flex;
  gap: 6px;
}

.gallery-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-light);
}

.preview-dialog {
  --el-dialog-margin-top: 5vh;
}

.preview-content {
  display: flex;
  gap: 24px;
  max-height: 70vh;
}

.preview-left {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 6px;
}

.preview-right {
  width: 300px;
  flex-shrink: 0;
  overflow-y: auto;
}

.preview-info h3 {
  margin: 0 0 20px 0;
  color: var(--el-text-color-primary);
}

.info-section {
  margin-bottom: 20px;
}

.info-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.info-label {
  color: var(--el-text-color-secondary);
}

.info-value {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.prompt-info {
  font-size: 13px;
  line-height: 1.5;
}

.prompt-info p {
  margin: 8px 0;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.tag-item {
  margin: 2px;
}

.preview-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
}

.tag-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.current-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 40px;
  padding: 8px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  background: var(--el-bg-color-page);
}

.suggested-tags h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.suggested-tag {
  cursor: pointer;
  margin: 2px;
  transition: all 0.2s;
}

.suggested-tag:hover {
  transform: scale(1.05);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .masonry-grid {
    columns: 3;
  }

  .preview-content {
    flex-direction: column;
  }

  .preview-right {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .gallery-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-actions {
    flex-wrap: wrap;
    width: 100%;
  }

  .image-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .masonry-grid {
    columns: 2;
  }

  .batch-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .batch-actions {
    flex-wrap: wrap;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .image-grid {
    grid-template-columns: 1fr;
  }

  .masonry-grid {
    columns: 1;
  }

  .filter-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
</style>
