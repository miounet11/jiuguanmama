<template>
  <div class="mobile-character-grid" ref="gridContainer">
    <!-- 搜索栏 -->
    <MobileSearchBar
      v-model="searchQuery"
      :placeholder="searchPlaceholder"
      :filters="searchFilters"
      @search="handleSearch"
      @filter-change="handleFilterChange"
      class="mb-4"
    />

    <!-- 快速过滤标签 -->
    <div v-if="quickFilters.length" class="quick-filters mb-4">
      <div class="flex gap-2 overflow-x-auto pb-2">
        <el-tag
          v-for="filter in quickFilters"
          :key="filter.key"
          :type="activeFilters.includes(filter.key) ? 'primary' : 'info'"
          :effect="activeFilters.includes(filter.key) ? 'dark' : 'plain'"
          @click="toggleQuickFilter(filter.key)"
          class="cursor-pointer whitespace-nowrap select-none"
          size="small"
        >
          {{ filter.label }}
          <span v-if="filter.count" class="ml-1 opacity-75">{{ filter.count }}</span>
        </el-tag>
      </div>
    </div>

    <!-- 排序和视图切换 -->
    <div class="grid-controls flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <el-select
          v-model="sortBy"
          @change="handleSortChange"
          size="small"
          style="width: 120px"
        >
          <el-option
            v-for="option in sortOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <el-button
          @click="toggleSortOrder"
          :icon="sortOrder === 'asc' ? ArrowUp : ArrowDown"
          size="small"
          type="text"
          class="sort-order-btn"
        />
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">{{ filteredCharacters.length }} 个角色</span>

        <div class="view-toggle flex border border-gray-300 rounded">
          <el-button
            @click="gridMode = 'grid'"
            :type="gridMode === 'grid' ? 'primary' : 'default'"
            size="small"
            :icon="Grid"
            class="view-btn"
          />
          <el-button
            @click="gridMode = 'list'"
            :type="gridMode === 'list' ? 'primary' : 'default'"
            size="small"
            :icon="List"
            class="view-btn"
          />
        </div>
      </div>
    </div>

    <!-- 角色网格 -->
    <div
      v-if="!isLoading && filteredCharacters.length"
      class="character-grid"
      :class="{
        'grid-mode': gridMode === 'grid',
        'list-mode': gridMode === 'list'
      }"
    >
      <div
        v-for="character in paginatedCharacters"
        :key="character.id"
        class="character-item"
        @click="handleCharacterClick(character)"
      >
        <MobileCharacterCard
          :character="character"
          :mode="gridMode"
          @favorite="handleFavorite"
          @quick-chat="handleQuickChat"
          @long-press="handleCharacterLongPress"
        />
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-else-if="!isLoading && filteredCharacters.length === 0"
      class="empty-state text-center py-16"
    >
      <div class="text-6xl mb-4 opacity-50">🔍</div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">没有找到角色</h3>
      <p class="text-gray-500 mb-4">
        {{ searchQuery ? '尝试调整搜索条件或筛选器' : '暂时没有符合条件的角色' }}
      </p>
      <el-button @click="clearFilters" type="primary" size="small">
        清除筛选
      </el-button>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state py-16">
      <div class="grid gap-4" :class="gridMode === 'grid' ? 'grid-cols-2' : 'grid-cols-1'">
        <div
          v-for="i in 6"
          :key="i"
          class="skeleton-card"
        >
          <div class="skeleton-avatar"></div>
          <div class="skeleton-content">
            <div class="skeleton-title"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-tags"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 无限滚动加载更多 -->
    <div
      v-if="hasMore && !isLoading"
      ref="loadMoreTrigger"
      class="load-more-trigger h-10"
    ></div>

    <!-- 底部加载指示器 -->
    <div
      v-if="isLoadingMore"
      class="loading-more text-center py-4"
    >
      <el-icon class="animate-spin text-2xl text-primary">
        <Loading />
      </el-icon>
      <p class="text-sm text-gray-500 mt-2">加载更多...</p>
    </div>

    <!-- 返回顶部按钮 -->
    <Transition name="fade">
      <el-button
        v-if="showBackToTop"
        @click="scrollToTop"
        type="primary"
        :icon="ArrowUp"
        circle
        size="large"
        class="back-to-top fixed bottom-20 right-4 z-50 shadow-lg"
      />
    </Transition>

    <!-- 角色详情预览（长按触发） -->
    <MobileCharacterPreview
      v-if="previewCharacter"
      :character="previewCharacter"
      :visible="showPreview"
      @close="closePreview"
      @action="handlePreviewAction"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCharacterStore } from '@/stores/character'
import { useTouchGestures } from '@/composables/useTouchGestures'
import { useMobilePerformance } from '@/composables/useMobilePerformance'
import {
  Grid,
  List,
  ArrowUp,
  ArrowDown,
  Loading
} from '@element-plus/icons-vue'

import MobileSearchBar from './MobileSearchBar.vue'
import MobileCharacterCard from './MobileCharacterCard.vue'
import MobileCharacterPreview from './MobileCharacterPreview.vue'

interface Character {
  id: string
  name: string
  avatar?: string
  description?: string
  tags: string[]
  rating: number
  chatCount: number
  favoriteCount: number
  isFavorited?: boolean
  isNew?: boolean
  isPremium?: boolean
  isNSFW?: boolean
  creator?: {
    id: string
    username: string
  }
}

interface QuickFilter {
  key: string
  label: string
  count?: number
}

interface SortOption {
  value: string
  label: string
}

interface Props {
  characters?: Character[]
  loading?: boolean
  searchPlaceholder?: string
  enableInfiniteScroll?: boolean
  pageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  characters: () => [],
  loading: false,
  searchPlaceholder: '搜索角色...',
  enableInfiniteScroll: true,
  pageSize: 20
})

const emit = defineEmits<{
  'character-click': [character: Character]
  'favorite': [characterId: string]
  'quick-chat': [character: Character]
  'load-more': []
  'search': [query: string, filters: Record<string, any>]
}>()

const route = useRoute()
const router = useRouter()
const characterStore = useCharacterStore()
const { isLowEndDevice } = useMobilePerformance()

// 引用
const gridContainer = ref<HTMLElement>()
const loadMoreTrigger = ref<HTMLElement>()

// 状态
const searchQuery = ref('')
const gridMode = ref<'grid' | 'list'>('grid')
const sortBy = ref('popular')
const sortOrder = ref<'asc' | 'desc'>('desc')
const activeFilters = ref<string[]>([])
const currentPage = ref(1)
const isLoading = ref(props.loading)
const isLoadingMore = ref(false)
const showBackToTop = ref(false)
const scrollY = ref(0)

// 预览相关
const previewCharacter = ref<Character | null>(null)
const showPreview = ref(false)

// 搜索过滤器配置
const searchFilters = ref([
  { key: 'tags', label: '标签', type: 'multiselect', options: [] },
  { key: 'rating', label: '评分', type: 'range', min: 0, max: 5 },
  { key: 'creator', label: '创建者', type: 'text' }
])

// 快速过滤器
const quickFilters = ref<QuickFilter[]>([
  { key: 'new', label: '最新', count: 0 },
  { key: 'popular', label: '热门', count: 0 },
  { key: 'favorite', label: '已收藏', count: 0 },
  { key: 'premium', label: '高级', count: 0 }
])

// 排序选项
const sortOptions: SortOption[] = [
  { value: 'popular', label: '热门度' },
  { value: 'rating', label: '评分' },
  { value: 'newest', label: '最新' },
  { value: 'name', label: '名称' },
  { value: 'chatCount', label: '对话数' }
]

// 计算属性
const filteredCharacters = computed(() => {
  let result = [...props.characters]

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(char =>
      char.name.toLowerCase().includes(query) ||
      char.description?.toLowerCase().includes(query) ||
      char.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // 快速过滤器
  if (activeFilters.value.length) {
    result = result.filter(char => {
      return activeFilters.value.every(filter => {
        switch (filter) {
          case 'new':
            return char.isNew
          case 'popular':
            return char.chatCount > 100
          case 'favorite':
            return char.isFavorited
          case 'premium':
            return char.isPremium
          default:
            return true
        }
      })
    })
  }

  // 排序
  result.sort((a, b) => {
    let comparison = 0

    switch (sortBy.value) {
      case 'popular':
        comparison = (b.chatCount + b.favoriteCount) - (a.chatCount + a.favoriteCount)
        break
      case 'rating':
        comparison = b.rating - a.rating
        break
      case 'newest':
        // 假设有 createdAt 字段
        comparison = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        break
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'chatCount':
        comparison = b.chatCount - a.chatCount
        break
      default:
        comparison = 0
    }

    return sortOrder.value === 'asc' ? -comparison : comparison
  })

  return result
})

const paginatedCharacters = computed(() => {
  if (!props.enableInfiniteScroll) {
    return filteredCharacters.value
  }

  const endIndex = currentPage.value * props.pageSize
  return filteredCharacters.value.slice(0, endIndex)
})

const hasMore = computed(() => {
  if (!props.enableInfiniteScroll) return false
  return paginatedCharacters.value.length < filteredCharacters.value.length
})

// 方法
const handleSearch = (query: string) => {
  searchQuery.value = query
  emit('search', query, {
    filters: activeFilters.value,
    sortBy: sortBy.value,
    sortOrder: sortOrder.value
  })
}

const handleFilterChange = (filters: Record<string, any>) => {
  // 处理高级过滤器变化
  console.log('Filters changed:', filters)
}

const toggleQuickFilter = (filterKey: string) => {
  const index = activeFilters.value.indexOf(filterKey)
  if (index > -1) {
    activeFilters.value.splice(index, 1)
  } else {
    activeFilters.value.push(filterKey)
  }
}

const handleSortChange = (value: string) => {
  sortBy.value = value
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const clearFilters = () => {
  searchQuery.value = ''
  activeFilters.value = []
  sortBy.value = 'popular'
  sortOrder.value = 'desc'
}

const handleCharacterClick = (character: Character) => {
  emit('character-click', character)
}

const handleFavorite = (characterId: string) => {
  emit('favorite', characterId)
}

const handleQuickChat = (character: Character) => {
  emit('quick-chat', character)
}

const handleCharacterLongPress = (character: Character) => {
  previewCharacter.value = character
  showPreview.value = true

  // 触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
}

const closePreview = () => {
  showPreview.value = false
  setTimeout(() => {
    previewCharacter.value = null
  }, 300)
}

const handlePreviewAction = (action: string, character: Character) => {
  closePreview()

  switch (action) {
    case 'chat':
      handleQuickChat(character)
      break
    case 'favorite':
      handleFavorite(character.id)
      break
    case 'view':
      handleCharacterClick(character)
      break
  }
}

const scrollToTop = () => {
  gridContainer.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}

const loadMore = () => {
  if (hasMore.value && !isLoadingMore.value) {
    isLoadingMore.value = true
    currentPage.value++

    // 模拟加载延迟
    setTimeout(() => {
      isLoadingMore.value = false
      emit('load-more')
    }, 500)
  }
}

// 滚动监听
const handleScroll = () => {
  scrollY.value = window.scrollY
  showBackToTop.value = scrollY.value > 500
}

// 无限滚动观察器
let intersectionObserver: IntersectionObserver | null = null

const setupInfiniteScroll = () => {
  if (!props.enableInfiniteScroll || !loadMoreTrigger.value) return

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMore.value) {
        loadMore()
      }
    },
    {
      threshold: 0.1,
      rootMargin: '100px'
    }
  )

  intersectionObserver.observe(loadMoreTrigger.value)
}

// 根据设备性能调整网格密度
const adjustGridForPerformance = () => {
  if (isLowEndDevice.value) {
    // 低端设备使用列表模式
    gridMode.value = 'list'
  }
}

// 生命周期
onMounted(() => {
  adjustGridForPerformance()
  window.addEventListener('scroll', handleScroll, { passive: true })

  nextTick(() => {
    setupInfiniteScroll()
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }
})

// 监听 loading 状态变化
watch(() => props.loading, (newVal) => {
  isLoading.value = newVal
})

// 监听路由变化，重置分页
watch(() => route.path, () => {
  currentPage.value = 1
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.mobile-character-grid {
  @include custom-scrollbar;
}

.quick-filters {
  .el-tag {
    @include focus-visible;

    &:active {
      transform: scale(0.95);
      transition: transform 0.1s ease;
    }
  }
}

.grid-controls {
  .sort-order-btn {
    transition: transform 0.2s ease;

    &:active {
      transform: scale(0.9);
    }
  }

  .view-toggle {
    .view-btn {
      border-radius: 0;
      border: none;

      &:first-child {
        border-radius: $border-radius-base 0 0 $border-radius-base;
      }

      &:last-child {
        border-radius: 0 $border-radius-base $border-radius-base 0;
      }
    }
  }
}

.character-grid {
  &.grid-mode {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-3;

    @include respond-to($breakpoint-sm) {
      grid-template-columns: repeat(3, 1fr);
      gap: $spacing-4;
    }

    @include respond-to($breakpoint-lg) {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  &.list-mode {
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
  }
}

.character-item {
  transition: transform 0.2s ease;

  &:active {
    transform: scale(0.98);
  }
}

.empty-state {
  color: $text-secondary;
}

.loading-state {
  .skeleton-card {
    @include card;
    padding: 0;
    overflow: hidden;

    .skeleton-avatar {
      width: 100%;
      height: 200px;
      background: linear-gradient(90deg, $gray-200 25%, $gray-100 50%, $gray-200 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
    }

    .skeleton-content {
      padding: $spacing-4;

      .skeleton-title {
        width: 80%;
        height: 20px;
        background: linear-gradient(90deg, $gray-200 25%, $gray-100 50%, $gray-200 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        margin-bottom: $spacing-2;
        border-radius: $border-radius-base;
      }

      .skeleton-text {
        width: 100%;
        height: 16px;
        background: linear-gradient(90deg, $gray-200 25%, $gray-100 50%, $gray-200 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        margin-bottom: $spacing-3;
        border-radius: $border-radius-base;
      }

      .skeleton-tags {
        display: flex;
        gap: $spacing-2;

        &::before,
        &::after {
          content: '';
          width: 60px;
          height: 24px;
          background: linear-gradient(90deg, $gray-200 25%, $gray-100 50%, $gray-200 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: $border-radius-full;
        }

        &::after {
          width: 40px;
        }
      }
    }
  }
}

.back-to-top {
  backdrop-filter: blur(10px);
  background: rgba($primary-color, 0.9) !important;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes skeleton-loading {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

// 移动端优化
@include mobile-only {
  .grid-controls {
    flex-wrap: wrap;
    gap: $spacing-2;

    .el-select {
      width: 100px !important;
    }
  }

  .character-grid.grid-mode {
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-2;
  }

  .back-to-top {
    bottom: calc(env(safe-area-inset-bottom) + 80px);
    right: $spacing-4;
  }
}

// 无障碍优化
@include prefers-reduced-motion {
  .character-item,
  .back-to-top,
  .el-tag {
    transition: none;
  }

  .skeleton-avatar,
  .skeleton-title,
  .skeleton-text,
  .skeleton-tags::before,
  .skeleton-tags::after {
    animation: none;
  }
}
</style>