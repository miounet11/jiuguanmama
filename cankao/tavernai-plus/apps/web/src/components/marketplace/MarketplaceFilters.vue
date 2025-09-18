<template>
  <div class="marketplace-filters glass-card p-6 space-y-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-white">高级筛选</h3>
      <el-button
        @click="resetFilters"
        text
        type="primary"
        size="small"
        :disabled="!hasActiveFilters"
      >
        重置筛选
      </el-button>
    </div>

    <!-- 分类筛选 -->
    <div class="filter-section">
      <label class="filter-label">分类</label>
      <el-select
        v-model="localFilters.category"
        placeholder="选择分类"
        clearable
        size="large"
        class="w-full"
        @change="emitUpdate"
      >
        <el-option
          v-for="category in categories"
          :key="category.name"
          :label="`${category.icon} ${category.name} (${category.count})`"
          :value="category.name"
        />
      </el-select>
    </div>

    <!-- 评分筛选 -->
    <div class="filter-section">
      <label class="filter-label">最低评分</label>
      <div class="space-y-2">
        <el-slider
          v-model="localFilters.minRating"
          :min="0"
          :max="5"
          :step="0.5"
          :marks="ratingMarks"
          show-stops
          show-tooltip
          @change="emitUpdate"
        />
        <div class="flex items-center justify-between text-sm text-gray-400">
          <span>0.0</span>
          <span>当前: {{ localFilters.minRating || 0 }}分以上</span>
          <span>5.0</span>
        </div>
      </div>
    </div>

    <!-- 语言筛选 -->
    <div class="filter-section">
      <label class="filter-label">语言</label>
      <el-select
        v-model="localFilters.language"
        placeholder="选择语言"
        clearable
        size="large"
        class="w-full"
        @change="emitUpdate"
      >
        <el-option label="中文" value="zh" />
        <el-option label="英文" value="en" />
        <el-option label="日文" value="ja" />
        <el-option label="韩文" value="ko" />
        <el-option label="其他" value="other" />
      </el-select>
    </div>

    <!-- 标签筛选 -->
    <div class="filter-section">
      <label class="filter-label">
        标签
        <span class="text-gray-400 text-sm ml-2">
          (已选择 {{ selectedTagsCount }} 个)
        </span>
      </label>

      <!-- 标签搜索 -->
      <el-input
        v-model="tagSearchQuery"
        placeholder="搜索标签..."
        size="large"
        clearable
        class="mb-3"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <!-- 标签列表 -->
      <div class="max-h-48 overflow-y-auto custom-scrollbar">
        <div class="space-y-2">
          <!-- 热门标签 -->
          <div v-if="!tagSearchQuery" class="mb-4">
            <div class="text-sm text-gray-400 mb-2">热门标签</div>
            <div class="flex flex-wrap gap-2">
              <el-tag
                v-for="tag in popularTags.slice(0, 6)"
                :key="`popular-${tag.tag}`"
                :type="isTagSelected(tag.tag) ? 'primary' : 'info'"
                :effect="isTagSelected(tag.tag) ? 'dark' : 'plain'"
                class="cursor-pointer tag-hover"
                @click="toggleTag(tag.tag)"
              >
                {{ tag.tag }}
                <span class="ml-1 text-xs opacity-70">({{ tag.count }})</span>
              </el-tag>
            </div>
          </div>

          <!-- 所有标签 -->
          <div>
            <div class="text-sm text-gray-400 mb-2">
              {{ tagSearchQuery ? '搜索结果' : '全部标签' }}
            </div>
            <div class="grid grid-cols-1 gap-1">
              <div
                v-for="tag in filteredTags"
                :key="tag.tag"
                class="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                :class="{ 'bg-purple-500/20': isTagSelected(tag.tag) }"
                @click="toggleTag(tag.tag)"
              >
                <div class="flex items-center gap-2">
                  <el-checkbox
                    :model-value="isTagSelected(tag.tag)"
                    @change="() => toggleTag(tag.tag)"
                    @click.stop
                  />
                  <span class="text-white text-sm">{{ tag.tag }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-gray-400 text-xs">{{ tag.count }}</span>
                  <el-icon
                    v-if="tag.trend === 'up'"
                    class="text-green-400 text-xs"
                  >
                    <TrendCharts />
                  </el-icon>
                  <el-icon
                    v-else-if="tag.trend === 'down'"
                    class="text-red-400 text-xs"
                  >
                    <TrendCharts />
                  </el-icon>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-if="filteredTags.length === 0" class="text-center py-4">
              <div class="text-gray-400 text-sm">
                {{ tagSearchQuery ? '没有找到匹配的标签' : '暂无标签' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 已选标签 -->
      <div v-if="selectedTags.length > 0" class="mt-3 pt-3 border-t border-gray-700">
        <div class="text-sm text-gray-400 mb-2">已选标签:</div>
        <div class="flex flex-wrap gap-2">
          <el-tag
            v-for="tag in selectedTags"
            :key="`selected-${tag}`"
            type="primary"
            closable
            @close="removeTag(tag)"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 其他筛选选项 -->
    <div class="filter-section">
      <label class="filter-label">其他选项</label>
      <div class="space-y-3">
        <el-checkbox
          v-model="localFilters.onlyFeatured"
          @change="emitUpdate"
        >
          <span class="text-white">仅显示精选角色</span>
        </el-checkbox>

        <el-checkbox
          v-model="localFilters.onlyNew"
          @change="emitUpdate"
        >
          <span class="text-white">仅显示新发布</span>
        </el-checkbox>

        <el-checkbox
          v-model="localFilters.excludeNSFW"
          @change="emitUpdate"
        >
          <span class="text-white">排除18+内容</span>
        </el-checkbox>
      </div>
    </div>

    <!-- 应用筛选按钮 -->
    <div class="pt-4 border-t border-gray-700">
      <el-button
        @click="applyFilters"
        type="primary"
        size="large"
        class="w-full"
        :disabled="!hasChanges"
      >
        <el-icon class="mr-2"><Filter /></el-icon>
        应用筛选 ({{ activeFiltersCount }} 个活动)
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { debounce } from 'lodash-es'
import {
  Search,
  Filter,
  TrendCharts
} from '@element-plus/icons-vue'
import type { MarketplaceFilter } from '@/services/marketplace'

interface CategoryStats {
  name: string
  count: number
  icon: string
}

interface TrendingTag {
  tag: string
  count: number
  trend: 'up' | 'down' | 'stable'
}

interface Props {
  filters: MarketplaceFilter
  categories: CategoryStats[]
  loading?: boolean
  popularTags?: TrendingTag[]
  allTags?: TrendingTag[]
}

interface Emits {
  'update:filters': [filters: MarketplaceFilter]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  popularTags: () => [],
  allTags: () => []
})

const emit = defineEmits<Emits>()

// 响应式数据
const tagSearchQuery = ref('')
const localFilters = reactive<MarketplaceFilter>({ ...props.filters })
const originalFilters = reactive<MarketplaceFilter>({ ...props.filters })

// 评分刻度标记
const ratingMarks = {
  0: '0',
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5'
}

// 默认的热门标签（如果props中没有提供）
const defaultPopularTags: TrendingTag[] = [
  { tag: '动漫', count: 1250, trend: 'up' },
  { tag: '女性', count: 980, trend: 'stable' },
  { tag: '幻想', count: 760, trend: 'up' },
  { tag: '现代', count: 650, trend: 'stable' },
  { tag: '温柔', count: 520, trend: 'up' },
  { tag: '强势', count: 480, trend: 'down' },
  { tag: '神秘', count: 420, trend: 'up' },
  { tag: '可爱', count: 380, trend: 'stable' }
]

const defaultAllTags: TrendingTag[] = [
  ...defaultPopularTags,
  { tag: '冷酷', count: 350, trend: 'down' },
  { tag: '智慧', count: 320, trend: 'stable' },
  { tag: '搞笑', count: 290, trend: 'up' },
  { tag: '治愈', count: 260, trend: 'up' },
  { tag: '高冷', count: 240, trend: 'stable' },
  { tag: '活泼', count: 220, trend: 'up' },
  { tag: '成熟', count: 200, trend: 'stable' },
  { tag: '清纯', count: 180, trend: 'down' }
]

// 计算属性
const popularTags = computed(() => props.popularTags.length > 0 ? props.popularTags : defaultPopularTags)
const allTags = computed(() => props.allTags.length > 0 ? props.allTags : defaultAllTags)

const selectedTags = computed(() => localFilters.tags || [])
const selectedTagsCount = computed(() => selectedTags.value.length)

const filteredTags = computed(() => {
  if (!tagSearchQuery.value) {
    return allTags.value
  }

  return allTags.value.filter(tag =>
    tag.tag.toLowerCase().includes(tagSearchQuery.value.toLowerCase())
  )
})

const hasActiveFilters = computed(() => {
  return !!(
    localFilters.category ||
    localFilters.minRating ||
    localFilters.language ||
    (localFilters.tags && localFilters.tags.length > 0) ||
    localFilters.onlyFeatured ||
    localFilters.onlyNew ||
    localFilters.excludeNSFW
  )
})

const hasChanges = computed(() => {
  return JSON.stringify(localFilters) !== JSON.stringify(originalFilters)
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (localFilters.category) count++
  if (localFilters.minRating) count++
  if (localFilters.language) count++
  if (localFilters.tags && localFilters.tags.length > 0) count++
  if (localFilters.onlyFeatured) count++
  if (localFilters.onlyNew) count++
  if (localFilters.excludeNSFW) count++
  return count
})

// 监听props.filters变化
watch(() => props.filters, (newFilters) => {
  Object.assign(localFilters, newFilters)
  Object.assign(originalFilters, newFilters)
}, { deep: true })

// 防抖更新
const debouncedEmit = debounce(() => {
  emitUpdate()
}, 300)

// 方法
const isTagSelected = (tag: string): boolean => {
  return selectedTags.value.includes(tag)
}

const toggleTag = (tag: string) => {
  if (!localFilters.tags) {
    localFilters.tags = []
  }

  const index = localFilters.tags.indexOf(tag)
  if (index > -1) {
    localFilters.tags.splice(index, 1)
  } else {
    localFilters.tags.push(tag)
  }

  debouncedEmit()
}

const removeTag = (tag: string) => {
  if (!localFilters.tags) return

  const index = localFilters.tags.indexOf(tag)
  if (index > -1) {
    localFilters.tags.splice(index, 1)
    debouncedEmit()
  }
}

const resetFilters = () => {
  localFilters.category = ''
  localFilters.minRating = undefined
  localFilters.language = ''
  localFilters.tags = []
  localFilters.onlyFeatured = false
  localFilters.onlyNew = false
  localFilters.excludeNSFW = false

  emitUpdate()
}

const applyFilters = () => {
  emitUpdate()
  Object.assign(originalFilters, localFilters)
}

const emitUpdate = () => {
  emit('update:filters', { ...localFilters })
}

// 生命周期
onMounted(() => {
  Object.assign(originalFilters, localFilters)
})
</script>

<style scoped>
.glass-card {
  background: rgba(15, 15, 35, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.filter-section {
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.filter-section:last-child {
  border-bottom: none;
}

.filter-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #e5e7eb;
  margin-bottom: 8px;
}

.tag-hover {
  transition: all 0.2s ease;
}

.tag-hover:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-1px);
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(139, 92, 246, 0.3) rgba(15, 15, 35, 0.1);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(15, 15, 35, 0.1);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.5);
}

/* Element Plus 样式覆盖 */
:deep(.el-select .el-input__inner) {
  background-color: rgba(15, 15, 35, 0.6);
  border-color: rgba(139, 92, 246, 0.3);
  color: white;
}

:deep(.el-input__inner) {
  background-color: rgba(15, 15, 35, 0.6);
  border-color: rgba(139, 92, 246, 0.3);
  color: white;
}

:deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.4);
}

:deep(.el-slider__runway) {
  background-color: rgba(139, 92, 246, 0.2);
}

:deep(.el-slider__bar) {
  background-color: #8B5CF6;
}

:deep(.el-slider__button) {
  border-color: #8B5CF6;
}

:deep(.el-slider__marks-text) {
  color: rgba(255, 255, 255, 0.6);
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #8B5CF6;
  border-color: #8B5CF6;
}

:deep(.el-checkbox__label) {
  color: white;
}

:deep(.el-tag) {
  transition: all 0.2s ease;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .glass-card {
    padding: 16px;
  }

  .filter-section {
    padding: 12px 0;
  }

  .grid-cols-2 {
    grid-template-columns: 1fr;
  }
}
</style>
